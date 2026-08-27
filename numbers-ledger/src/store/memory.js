'use strict';

/**
 * In-memory store. Used by tests and by anything that wants the rules without
 * a file on disk.
 *
 * Writes inside a transaction go to a pending overlay and are only merged into
 * committed state if the callback returns. A throw discards the overlay, so a
 * failed guard leaves no trace - the same atomicity the SQLite store gets from
 * BEGIN IMMEDIATE / ROLLBACK.
 */
class MemoryStore {
  #journal = [];
  #byId = new Map();
  #totals = new Map();  // accountId -> { debits, credits }
  #state = new Map();   // `${kind}:${key}` -> object
  #inTransaction = false;

  transaction(fn) {
    if (this.#inTransaction) throw new Error('Nested transactions are not supported');
    this.#inTransaction = true;

    const pending = { journal: [], totals: new Map(), state: new Map() };
    const view = this.#view(pending);

    try {
      const result = fn(view);
      for (const record of pending.journal) {
        this.#journal.push(record);
        this.#byId.set(record.id, record);
      }
      for (const [account, totals] of pending.totals) this.#totals.set(account, totals);
      for (const [key, value] of pending.state) this.#state.set(key, value);
      return result;
    } finally {
      this.#inTransaction = false;
    }
  }

  #view(pending) {
    const totalsOf = (account) =>
      pending.totals.get(account) || this.#totals.get(account) || { debits: 0, credits: 0 };

    return {
      hasTx: (id) => this.#byId.has(id) || pending.journal.some((r) => r.id === id),
      totals: (account) => ({ ...totalsOf(account) }),
      accounts: () => {
        const all = new Set([...this.#totals.keys(), ...pending.totals.keys()]);
        return [...all].sort();
      },
      nextSeq: () => this.#journal.length + pending.journal.length + 1,
      append: (record) => {
        pending.journal.push(record);
        for (const entry of record.entries) {
          const current = totalsOf(entry.account);
          pending.totals.set(entry.account, {
            debits: current.debits + entry.debit,
            credits: current.credits + entry.credit
          });
        }
      },
      getState: (kind, key) => {
        const k = `${kind}:${key}`;
        const value = pending.state.has(k) ? pending.state.get(k) : this.#state.get(k);
        return value === undefined ? null : structuredClone(value);
      },
      putState: (kind, key, value) => pending.state.set(`${kind}:${key}`, structuredClone(value)),
      listState: (kind) => {
        const prefix = `${kind}:`;
        const merged = new Map([...this.#state, ...pending.state]);
        return [...merged.entries()]
          .filter(([k]) => k.startsWith(prefix))
          .map(([k, v]) => [k.slice(prefix.length), structuredClone(v)]);
      }
    };
  }

  /** Read-only access outside a transaction, for reporting. */
  read(fn) {
    return this.transaction(fn);
  }

  journal() {
    return this.#journal.slice();
  }

  close() {}
}

module.exports = { MemoryStore };
