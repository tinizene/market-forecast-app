'use strict';

const { CONFIG } = require('./config.js');
const { assertAmount, format } = require('./money.js');
const { ACCOUNTS, CALLABLE, parseAccount, accountId, signedBalance } = require('./accounts.js');

/**
 * An append-only double-entry journal.
 *
 * Three properties are enforced rather than hoped for:
 *
 *   1. Every transaction balances. Debits equal credits, always, or the post
 *      is rejected whole. There is no partial write.
 *   2. Transactions are idempotent by id. A retried request - a mobile money
 *      callback delivered twice, an operator tapping twice - cannot post the
 *      same movement again.
 *   3. Nothing is ever mutated. A mistake is corrected by a compensating
 *      transaction, so the history of what was believed and when survives.
 *
 * Balances are derived from the journal, never stored and updated. A stored
 * balance that disagrees with its entries is the classic ledger bug, and the
 * only way to be immune is not to keep one.
 */
class Ledger {
  #journal = [];
  #byId = new Map();
  #balances = new Map(); // accountId -> { debits, credits } - a cache, rebuildable from #journal

  constructor({ currency = CONFIG.currency } = {}) {
    this.currency = currency;
  }

  get journal() {
    return this.#journal.slice();
  }

  get size() {
    return this.#journal.length;
  }

  has(id) {
    return this.#byId.has(id);
  }

  get(id) {
    return this.#byId.get(id) || null;
  }

  /**
   * @param {{id: string, kind: string, at: string, memo?: string,
   *          entries: Array<{account: string, debit?: number, credit?: number}>}} tx
   * @returns {{posted: boolean, transaction: object}} posted is false when the
   *          id was already applied - the caller's retry was a no-op, not an error.
   */
  post(tx) {
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

    // Idempotency: same id, same movement, no second posting.
    if (this.#byId.has(id)) {
      return { posted: false, transaction: this.#byId.get(id) };
    }

    let debits = 0;
    let credits = 0;
    const normalised = entries.map((entry, i) => {
      const { account } = entry;
      const { spec } = parseAccount(account);
      const hasDebit = entry.debit !== undefined;
      const hasCredit = entry.credit !== undefined;

      if (hasDebit === hasCredit) {
        throw new Error(`Entry ${i} on ${account} must be exactly one of debit or credit`);
      }
      const amount = assertAmount(hasDebit ? entry.debit : entry.credit, `Entry ${i} amount`);
      if (hasDebit) debits += amount;
      else credits += amount;

      return { account, control: parseAccount(account).control, spec, debit: hasDebit ? amount : 0, credit: hasCredit ? amount : 0 };
    });

    if (debits !== credits) {
      throw new Error(
        `Transaction ${id} does not balance: debits ${format(debits, this.currency)} vs credits ${format(credits, this.currency)}`
      );
    }

    const record = Object.freeze({
      id, kind, at,
      memo: memo || null,
      seq: this.#journal.length + 1,
      entries: Object.freeze(normalised.map((e) => Object.freeze(e)))
    });

    this.#journal.push(record);
    this.#byId.set(id, record);
    for (const entry of normalised) {
      const totals = this.#balances.get(entry.account) || { debits: 0, credits: 0 };
      totals.debits += entry.debit;
      totals.credits += entry.credit;
      this.#balances.set(entry.account, totals);
    }

    return { posted: true, transaction: record };
  }

  /** Signed balance of one account, in minor units. */
  balance(id) {
    const { spec } = parseAccount(id);
    const totals = this.#balances.get(id) || { debits: 0, credits: 0 };
    return signedBalance(spec, totals.debits, totals.credits);
  }

  /** Sum of a control account across all its partitions. */
  controlBalance(control) {
    const spec = ACCOUNTS[control];
    if (!spec) throw new Error(`Unknown account: ${control}`);
    if (!spec.partitioned) return this.balance(control);

    let debits = 0;
    let credits = 0;
    for (const [id, totals] of this.#balances) {
      if (id === control || id.startsWith(`${control}:`)) {
        debits += totals.debits;
        credits += totals.credits;
      }
    }
    return signedBalance(spec, debits, credits);
  }

  /** Every party holding a balance in a partitioned account. */
  parties(control) {
    const prefix = `${control}:`;
    return [...this.#balances.keys()]
      .filter((id) => id.startsWith(prefix))
      .map((id) => id.slice(prefix.length))
      .sort();
  }

  /** Across the whole journal, total debits must equal total credits. */
  trialBalance() {
    let debits = 0;
    let credits = 0;
    for (const totals of this.#balances.values()) {
      debits += totals.debits;
      credits += totals.credits;
    }
    return { debits, credits, balanced: debits === credits };
  }

  /**
   * The invariant that decides whether the business is sound today: settlement
   * funds must cover every liability that can be called on in real money.
   * A shortfall is not a number to watch - it is a reason to stop selling float.
   */
  solvency() {
    const assets = this.balance(accountId('SETTLEMENT'));
    const liabilities = {};
    let callable = 0;
    for (const control of CALLABLE) {
      const value = this.controlBalance(control);
      liabilities[control] = value;
      callable += value;
    }
    return { assets, liabilities, callable, headroom: assets - callable, ok: assets >= callable };
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
    const totals = { ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0 };
    for (const id of this.#balances.keys()) {
      const { spec } = parseAccount(id);
      totals[spec.class] += this.balance(id);
    }
    const left = totals.ASSET;
    const right = totals.LIABILITY + totals.EQUITY + totals.REVENUE - totals.EXPENSE;
    return { ...totals, left, right, holds: left === right };
  }

  /** Every account with a non-zero balance, for a statement or an eyeball check. */
  snapshot() {
    const rows = [];
    for (const id of [...this.#balances.keys()].sort()) {
      const value = this.balance(id);
      if (value !== 0) rows.push({ account: id, minor: value, formatted: format(value, this.currency) });
    }
    return rows;
  }
}

module.exports = { Ledger };
