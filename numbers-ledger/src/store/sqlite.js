'use strict';

const { DatabaseSync } = require('node:sqlite');

/**
 * Durable store backed by SQLite (Node's built-in binding - no dependency).
 *
 * Two things this buys that the in-memory store cannot:
 *
 *   1. The journal survives a restart. Reconciling to the unit is meaningless
 *      if the books vanish when the process does.
 *   2. Guards run inside the write transaction. The in-memory version checks a
 *      balance and then posts; with two callers that is a race, and a runner
 *      can be overdrawn by two cash-ins that both saw enough float. BEGIN
 *      IMMEDIATE takes the write lock before the guard reads anything, so the
 *      check and the write cannot be separated.
 *
 * The balances table is a cache maintained inside the same transaction as the
 * entries that feed it. `verify()` recomputes it from the entries and compares,
 * so the cache can never silently drift from the journal.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS journal (
    seq   INTEGER PRIMARY KEY AUTOINCREMENT,
    id    TEXT    NOT NULL UNIQUE,
    kind  TEXT    NOT NULL,
    at    TEXT    NOT NULL,
    memo  TEXT
  );

  CREATE TABLE IF NOT EXISTS entries (
    seq     INTEGER NOT NULL REFERENCES journal(seq),
    idx     INTEGER NOT NULL,
    account TEXT    NOT NULL,
    control TEXT    NOT NULL,
    debit   INTEGER NOT NULL DEFAULT 0,
    credit  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (seq, idx)
  );

  CREATE INDEX IF NOT EXISTS entries_by_account ON entries(account);

  CREATE TABLE IF NOT EXISTS balances (
    account TEXT    PRIMARY KEY,
    debits  INTEGER NOT NULL DEFAULT 0,
    credits INTEGER NOT NULL DEFAULT 0
  );

  -- Facts that move no money but must still be undeniable: when a draw's
  -- commitment was published, when its seed was revealed. Append-only for the
  -- same reason the journal is - a commitment that can be edited afterwards
  -- proves nothing.
  CREATE TABLE IF NOT EXISTS events (
    seq  INTEGER PRIMARY KEY AUTOINCREMENT,
    id   TEXT    NOT NULL UNIQUE,
    kind TEXT    NOT NULL,
    at   TEXT    NOT NULL,
    data TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS state (
    kind  TEXT NOT NULL,
    key   TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (kind, key)
  );
`;

class SqliteStore {
  #db;
  #inTransaction = false;
  #stmt = {};

  /**
   * @param {string} filename path, or ':memory:'
   * @param {{busyTimeoutMs?: number}} [options]
   */
  constructor(filename, { busyTimeoutMs = 5000 } = {}) {
    this.#db = new DatabaseSync(filename);
    // WAL lets readers work while a writer holds the lock; busy_timeout makes a
    // contending writer wait rather than fail instantly.
    this.#db.exec('PRAGMA journal_mode = WAL');
    this.#db.exec('PRAGMA foreign_keys = ON');
    this.#db.exec(`PRAGMA busy_timeout = ${Number(busyTimeoutMs)}`);
    this.#db.exec(SCHEMA);
    this.#prepare();
  }

  #prepare() {
    const db = this.#db;
    this.#stmt = {
      hasTx:       db.prepare('SELECT 1 FROM journal WHERE id = ?'),
      insertTx:    db.prepare('INSERT INTO journal (id, kind, at, memo) VALUES (?, ?, ?, ?)'),
      insertEntry: db.prepare('INSERT INTO entries (seq, idx, account, control, debit, credit) VALUES (?, ?, ?, ?, ?, ?)'),
      totals:      db.prepare('SELECT debits, credits FROM balances WHERE account = ?'),
      upsert:      db.prepare(`INSERT INTO balances (account, debits, credits) VALUES (?, ?, ?)
                               ON CONFLICT(account) DO UPDATE SET debits = debits + excluded.debits,
                                                                  credits = credits + excluded.credits`),
      accounts:    db.prepare('SELECT account FROM balances ORDER BY account'),
      getState:    db.prepare('SELECT value FROM state WHERE kind = ? AND key = ?'),
      putState:    db.prepare(`INSERT INTO state (kind, key, value) VALUES (?, ?, ?)
                               ON CONFLICT(kind, key) DO UPDATE SET value = excluded.value`),
      listState:   db.prepare('SELECT key, value FROM state WHERE kind = ? ORDER BY key'),
      lastSeq:     db.prepare('SELECT COALESCE(MAX(seq), 0) AS seq FROM journal'),
      hasEvent:    db.prepare('SELECT 1 FROM events WHERE id = ?'),
      addEvent:    db.prepare('INSERT INTO events (id, kind, at, data) VALUES (?, ?, ?, ?)'),
      allEvents:   db.prepare('SELECT seq, id, kind, at, data FROM events ORDER BY seq'),
      lastEventSeq: db.prepare('SELECT COALESCE(MAX(seq), 0) AS seq FROM events'),
      allTx:       db.prepare('SELECT seq, id, kind, at, memo FROM journal ORDER BY seq'),
      entriesFor:  db.prepare('SELECT account, control, debit, credit FROM entries WHERE seq = ? ORDER BY idx'),
      recompute:   db.prepare(`SELECT account, SUM(debit) AS debits, SUM(credit) AS credits
                               FROM entries GROUP BY account ORDER BY account`)
    };
  }

  /**
   * Runs `fn` with the write lock held. Anything it reads is consistent with
   * what it writes, and a throw rolls the whole thing back.
   */
  transaction(fn) {
    if (this.#inTransaction) throw new Error('Nested transactions are not supported');
    this.#inTransaction = true;
    // IMMEDIATE, not DEFERRED: take the write lock up front so a guard's read
    // cannot be invalidated by another writer before the write lands.
    this.#db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn(this.#view());
      this.#db.exec('COMMIT');
      return result;
    } catch (error) {
      try { this.#db.exec('ROLLBACK'); } catch { /* the transaction was already gone */ }
      throw error;
    } finally {
      this.#inTransaction = false;
    }
  }

  #view() {
    const s = this.#stmt;
    return {
      hasTx: (id) => s.hasTx.get(id) !== undefined,
      totals: (account) => {
        const row = s.totals.get(account);
        return row ? { debits: Number(row.debits), credits: Number(row.credits) } : { debits: 0, credits: 0 };
      },
      accounts: () => s.accounts.all().map((r) => r.account),
      nextSeq: () => Number(s.lastSeq.get().seq) + 1,
      append: (record) => {
        s.insertTx.run(record.id, record.kind, record.at, record.memo);
        const seq = Number(s.lastSeq.get().seq);
        record.entries.forEach((entry, idx) => {
          s.insertEntry.run(seq, idx, entry.account, entry.control, entry.debit, entry.credit);
          s.upsert.run(entry.account, entry.debit, entry.credit);
        });
      },
      hasEvent: (id) => s.hasEvent.get(id) !== undefined,
      appendEvent: (event) => s.addEvent.run(event.id, event.kind, event.at, JSON.stringify(event.data)),
      nextEventSeq: () => Number(s.lastEventSeq.get().seq) + 1,
      getState: (kind, key) => {
        const row = s.getState.get(kind, key);
        return row ? JSON.parse(row.value) : null;
      },
      putState: (kind, key, value) => s.putState.run(kind, key, JSON.stringify(value)),
      listState: (kind) => s.listState.all(kind).map((r) => [r.key, JSON.parse(r.value)])
    };
  }

  /** Reads outside a write transaction. */
  read(fn) {
    if (this.#inTransaction) return fn(this.#view());
    return fn(this.#view());
  }

  journal() {
    return this.#stmt.allTx.all().map((row) => ({
      seq: Number(row.seq),
      id: row.id,
      kind: row.kind,
      at: row.at,
      memo: row.memo,
      entries: this.#stmt.entriesFor.all(row.seq).map((e) => ({
        account: e.account, control: e.control, debit: Number(e.debit), credit: Number(e.credit)
      }))
    }));
  }

  events() {
    return this.#stmt.allEvents.all().map((row) => ({
      seq: Number(row.seq), id: row.id, kind: row.kind, at: row.at, data: JSON.parse(row.data)
    }));
  }

  /**
   * Recompute every balance from the entries and compare with the cache.
   * Returns the accounts that disagree - empty means the cache is honest.
   */
  verify() {
    const drift = [];
    const cached = new Map(
      this.#stmt.accounts.all().map((r) => [r.account, this.#view().totals(r.account)])
    );
    for (const row of this.#stmt.recompute.all()) {
      const have = cached.get(row.account) || { debits: 0, credits: 0 };
      if (have.debits !== Number(row.debits) || have.credits !== Number(row.credits)) {
        drift.push({ account: row.account, cached: have, computed: { debits: Number(row.debits), credits: Number(row.credits) } });
      }
      cached.delete(row.account);
    }
    for (const [account, have] of cached) {
      if (have.debits !== 0 || have.credits !== 0) drift.push({ account, cached: have, computed: null });
    }
    return drift;
  }

  close() {
    this.#db.close();
  }
}

module.exports = { SqliteStore };
