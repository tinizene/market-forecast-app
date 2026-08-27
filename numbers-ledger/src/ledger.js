'use strict';

const { CONFIG } = require('./config.js');
const { assertAmount, format } = require('./money.js');
const { ACCOUNTS, CALLABLE, parseAccount, accountId, signedBalance } = require('./accounts.js');
const { MemoryStore } = require('./store/memory.js');

/**
 * An append-only double-entry journal over a pluggable store.
 *
 * Four properties are enforced rather than hoped for:
 *
 *   1. Every transaction balances. Debits equal credits or the post is
 *      rejected whole. There is no partial write.
 *   2. Transactions are idempotent by id. A retried request - a mobile money
 *      callback delivered twice, an operator tapping twice - cannot post the
 *      same movement again.
 *   3. Guards run inside the write transaction. A caller passes a
 *      `precondition`, and it is evaluated against balances read under the
 *      same lock that the write takes. Checking a balance and then posting is
 *      a race the moment there are two callers; this closes it.
 *   4. Nothing is ever mutated. A mistake is corrected by a compensating
 *      transaction, so what was believed, and when, survives.
 */
class Ledger {
  #store;

  constructor({ currency = CONFIG.currency, store = null } = {}) {
    this.currency = currency;
    this.#store = store || new MemoryStore();
  }

  get store() {
    return this.#store;
  }

  /**
   * @param {object} tx {id, kind, at, memo?, entries:[{account, debit|credit}]}
   * @param {{precondition?: (view) => void}} [options] precondition runs inside
   *        the write transaction and should throw to abort. It receives
   *        {balance, controlBalance, getState}.
   * @returns {{posted: boolean, transaction: object}} posted is false when the
   *        id was already applied - a retry is a no-op, not an error.
   */
  post(tx, options = {}) {
    if (!tx || typeof tx !== 'object') throw new TypeError('Transaction must be an object');
    if (typeof tx.id !== 'string' || tx.id.length === 0) throw new TypeError('Transaction needs an id');

    return this.#store.transaction((view) => {
      if (view.hasTx(tx.id)) {
        return { posted: false, transaction: null, duplicate: true };
      }

      if (options.precondition) {
        options.precondition(this.#guardView(view));
      }

      // `entries` may be a function so that a posting whose lines depend on
      // stored state - settling a draw, redeeming a voucher - reads that state
      // under the same lock it writes with.
      const entries = typeof tx.entries === 'function' ? tx.entries(this.#guardView(view)) : tx.entries;
      const record = this.#validate({ ...tx, entries });

      const seq = view.nextSeq();
      const stored = Object.freeze({ ...record, seq, entries: Object.freeze(record.entries.map(Object.freeze)) });
      view.append(stored);
      if (options.onCommit) options.onCommit(this.#stateView(view));
      return { posted: true, transaction: stored };
    });
  }

  /**
   * Append a non-financial fact: a draw opened, a seed revealed. Same
   * transaction, same idempotency by id, same append-only guarantee as the
   * journal - but no entries, because no money moved.
   *
   * `data` may be a function so it can read state written under the same lock.
   */
  event(evt, options = {}) {
    if (!evt || typeof evt !== 'object') throw new TypeError('Event must be an object');
    if (typeof evt.id !== 'string' || evt.id.length === 0) throw new TypeError('Event needs an id');
    if (typeof evt.kind !== 'string' || evt.kind.length === 0) throw new TypeError('Event needs a kind');
    if (typeof evt.at !== 'string' || Number.isNaN(Date.parse(evt.at))) {
      throw new TypeError(`Event needs an ISO timestamp, got ${evt.at}`);
    }

    return this.#store.transaction((view) => {
      if (view.hasEvent(evt.id)) return { posted: false, event: null, duplicate: true };

      if (options.precondition) options.precondition(this.#guardView(view));

      const data = typeof evt.data === 'function' ? evt.data(this.#guardView(view)) : (evt.data || {});
      const record = Object.freeze({
        id: evt.id, kind: evt.kind, at: evt.at, memo: evt.memo || null,
        seq: view.nextEventSeq(), data
      });
      view.appendEvent(record);
      if (options.onCommit) options.onCommit(this.#stateView(view));
      return { posted: true, event: record };
    });
  }

  /** Read one stored state record outside a transaction, for reporting. */
  readState(kind, key) {
    return this.#store.read((view) => view.getState(kind, key));
  }

  get events() {
    return this.#store.events();
  }

  /** Structural validation. Nothing here touches the store. */
  #validate(tx) {
    if (!tx || typeof tx !== 'object') throw new TypeError('Transaction must be an object');
    const { id, kind, at, memo, entries } = tx;

    if (typeof id !== 'string' || id.length === 0) throw new TypeError('Transaction needs an id');
    if (typeof kind !== 'string' || kind.length === 0) throw new TypeError('Transaction needs a kind');
    if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) {
      throw new TypeError(`Transaction needs an ISO timestamp, got ${at}`);
    }
    if (!Array.isArray(entries) || entries.length < 2) {
      throw new Error('A double entry needs at least two lines');
    }

    let debits = 0;
    let credits = 0;
    const normalised = entries.map((entry, i) => {
      const { control } = parseAccount(entry.account);
      const hasDebit = entry.debit !== undefined;
      const hasCredit = entry.credit !== undefined;
      if (hasDebit === hasCredit) {
        throw new Error(`Entry ${i} on ${entry.account} must be exactly one of debit or credit`);
      }
      const amount = assertAmount(hasDebit ? entry.debit : entry.credit, `Entry ${i} amount`);
      if (hasDebit) debits += amount;
      else credits += amount;
      return { account: entry.account, control, debit: hasDebit ? amount : 0, credit: hasCredit ? amount : 0 };
    });

    if (debits !== credits) {
      throw new Error(
        `Transaction ${id} does not balance: debits ${format(debits, this.currency)} vs credits ${format(credits, this.currency)}`
      );
    }

    return { id, kind, at, memo: memo || null, entries: normalised };
  }

  #guardView(view) {
    return {
      balance: (id) => this.#balanceFrom(view, id),
      controlBalance: (control) => this.#controlBalanceFrom(view, control),
      getState: (kind, key) => view.getState(kind, key)
    };
  }

  #stateView(view) {
    return {
      getState: (kind, key) => view.getState(kind, key),
      putState: (kind, key, value) => view.putState(kind, key, value)
    };
  }

  #balanceFrom(view, id) {
    const { spec } = parseAccount(id);
    const totals = view.totals(id);
    return signedBalance(spec, totals.debits, totals.credits);
  }

  #controlBalanceFrom(view, control) {
    const spec = ACCOUNTS[control];
    if (!spec) throw new Error(`Unknown account: ${control}`);
    if (!spec.partitioned) return this.#balanceFrom(view, control);

    let debits = 0;
    let credits = 0;
    for (const id of view.accounts()) {
      if (id === control || id.startsWith(`${control}:`)) {
        const totals = view.totals(id);
        debits += totals.debits;
        credits += totals.credits;
      }
    }
    return signedBalance(spec, debits, credits);
  }

  // ------------------------------------------------------------------ reads

  has(id) {
    return this.#store.read((view) => view.hasTx(id));
  }

  balance(id) {
    return this.#store.read((view) => this.#balanceFrom(view, id));
  }

  controlBalance(control) {
    return this.#store.read((view) => this.#controlBalanceFrom(view, control));
  }

  parties(control) {
    const prefix = `${control}:`;
    return this.#store.read((view) =>
      view.accounts().filter((id) => id.startsWith(prefix)).map((id) => id.slice(prefix.length)).sort()
    );
  }

  get journal() {
    return this.#store.journal();
  }

  get size() {
    return this.#store.journal().length;
  }

  /** Across the whole journal, total debits must equal total credits. */
  trialBalance() {
    return this.#store.read((view) => {
      let debits = 0;
      let credits = 0;
      for (const id of view.accounts()) {
        const totals = view.totals(id);
        debits += totals.debits;
        credits += totals.credits;
      }
      return { debits, credits, balanced: debits === credits };
    });
  }

  /**
   * The accounting equation, as a check rather than a belief:
   * assets = liabilities + equity + revenue - expenses.
   *
   * Trial balance proves each transaction was internally consistent. This
   * proves the classes were used correctly - that an expense was not quietly
   * booked as a liability, which balances perfectly and still misstates the
   * business.
   */
  equation() {
    return this.#store.read((view) => {
      const totals = { ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0 };
      for (const id of view.accounts()) {
        const { spec } = parseAccount(id);
        totals[spec.class] += this.#balanceFrom(view, id);
      }
      const left = totals.ASSET;
      const right = totals.LIABILITY + totals.EQUITY + totals.REVENUE - totals.EXPENSE;
      return { ...totals, left, right, holds: left === right };
    });
  }

  /**
   * The invariant that decides whether the business is sound today: settlement
   * funds must cover every liability that can be called on in real money.
   * A shortfall is not a number to watch - it is a reason to stop selling float.
   */
  solvency() {
    return this.#store.read((view) => {
      const assets = this.#balanceFrom(view, accountId('SETTLEMENT'));
      const liabilities = {};
      let callable = 0;
      for (const control of CALLABLE) {
        const value = this.#controlBalanceFrom(view, control);
        liabilities[control] = value;
        callable += value;
      }
      return { assets, liabilities, callable, headroom: assets - callable, ok: assets >= callable };
    });
  }

  /** Every account with a non-zero balance, for a statement or an eyeball check. */
  snapshot() {
    return this.#store.read((view) =>
      view.accounts()
        .map((id) => ({ account: id, minor: this.#balanceFrom(view, id) }))
        .filter((row) => row.minor !== 0)
        .map((row) => ({ ...row, formatted: format(row.minor, this.currency) }))
    );
  }

  close() {
    this.#store.close();
  }
}

module.exports = { Ledger };
