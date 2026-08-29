'use strict';

const ASSET = 'ASSET';
const LIABILITY = 'LIABILITY';
const REVENUE = 'REVENUE';
const EXPENSE = 'EXPENSE';
const EQUITY = 'EQUITY';

/**
 * The chart of accounts.
 *
 * `partitioned` accounts carry a party id (a runner, a player) after a colon:
 * AGENT_FLOAT:ag-1. Each party has its own balance; the control account is the
 * sum of its partitions. That is what lets the system answer both "what does
 * this runner hold" and "what do we owe the whole agent network" from the same
 * journal.
 *
 * `callable` marks a liability that can be demanded in real money at any time.
 * Those are the ones the solvency invariant must cover.
 */
const ACCOUNTS = {
  SETTLEMENT:          { class: ASSET,     partitioned: false, label: 'Settlement funds' },
  AGENT_FLOAT:         { class: LIABILITY, partitioned: true,  callable: true, label: 'Agent float payable' },
  PLAYER_WALLET:       { class: LIABILITY, partitioned: true,  callable: true, label: 'Player wallets' },
  UNREDEEMED_VOUCHERS: { class: LIABILITY, partitioned: false, callable: true, label: 'Unredeemed vouchers' },
  UNSETTLED_STAKES:    { class: LIABILITY, partitioned: false, callable: true, label: 'Unsettled stakes' },
  STAKES_REVENUE:      { class: REVENUE,   partitioned: false, label: 'Stakes revenue' },
  PRIZE_PAYOUTS:       { class: EXPENSE,   partitioned: false, label: 'Prize payouts' },
  AGENT_COMMISSION:    { class: EXPENSE,   partitioned: false, label: 'Agent commission' },
  TRANSACTION_FEES:    { class: EXPENSE,   partitioned: false, label: 'Transaction fees' },
  GAMING_TAX_PAYABLE:  { class: LIABILITY, partitioned: false, callable: false, label: 'Gaming tax payable' },
  GAMING_TAX_EXPENSE:  { class: EXPENSE,   partitioned: false, label: 'Gaming tax' },

  /**
   * Promotions. Both liabilities are callable: a free ticket and an advertised
   * jackpot are promises to pay, and a promise is owed whether or not the
   * player paid for it. That is deliberate and it bites - issuing a free
   * ticket credits a callable liability while debiting an expense, so it
   * consumes headroom without adding an asset. An operator that promotes
   * beyond its capital fails the solvency check before the promotion can be
   * redeemed, which is the correct moment to find out.
   */
  PROMO_EXPENSE:        { class: EXPENSE,   partitioned: true,  label: 'Promotional cost' },
  PROMO_VOUCHERS:       { class: LIABILITY, partitioned: false, callable: true, label: 'Unredeemed free tickets' },
  JACKPOT_CONTRIBUTION: { class: EXPENSE,   partitioned: false, label: 'Jackpot contribution' },
  JACKPOT_POOL:         { class: LIABILITY, partitioned: false, callable: true, label: 'Jackpot pool' },

  /**
   * The operator's own money in the business. Not callable by anyone outside
   * it, which is exactly why it can absorb commission and fees without those
   * eating into what players and runners are owed.
   *
   * Building the ledger surfaced why this account has to exist: granting a
   * runner 10,000 of float for a 9,500 payment issues 500 of value the
   * operator never received. Without capital behind it, the very first float
   * sale leaves the book short by the commission. The invariant catches it.
   */
  OPERATOR_CAPITAL:    { class: EQUITY,    partitioned: false, callable: false, label: "Operator's capital" }
};

const PARTY_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** 'AGENT_FLOAT:ag-1' -> { control: 'AGENT_FLOAT', party: 'ag-1' } */
function parseAccount(accountId) {
  if (typeof accountId !== 'string' || accountId.length === 0) {
    throw new TypeError(`Account id must be a non-empty string, got ${accountId}`);
  }
  const colon = accountId.indexOf(':');
  const control = colon === -1 ? accountId : accountId.slice(0, colon);
  const party = colon === -1 ? null : accountId.slice(colon + 1);
  const spec = ACCOUNTS[control];

  if (!spec) throw new Error(`Unknown account: ${control}`);
  if (spec.partitioned && party === null) {
    throw new Error(`${control} requires a party id, e.g. ${control}:ag-1`);
  }
  if (!spec.partitioned && party !== null) {
    throw new Error(`${control} does not take a party id, got ${accountId}`);
  }
  if (party !== null && !PARTY_RE.test(party)) {
    throw new Error(`Invalid party id in ${accountId}`);
  }
  return { control, party, spec };
}

function accountId(control, party) {
  return party === undefined || party === null ? control : `${control}:${party}`;
}

/** Assets and expenses rise on the debit side; liabilities and revenue on the credit side. */
function signedBalance(spec, debits, credits) {
  return spec.class === ASSET || spec.class === EXPENSE ? debits - credits : credits - debits;
}

/** Equity behaves like a liability for balance purposes: it rises on credit. */

const CALLABLE = Object.keys(ACCOUNTS).filter((k) => ACCOUNTS[k].callable);

module.exports = { ACCOUNTS, ASSET, LIABILITY, REVENUE, EXPENSE, EQUITY, CALLABLE, parseAccount, accountId, signedBalance };
