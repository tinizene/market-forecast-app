'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { ACCOUNTS, ASSET, LIABILITY, REVENUE, EXPENSE, EQUITY } = require('../src/accounts.js');
const { STATUS } = require('../src/mobilemoney/provider.js');

/**
 * The significant events catalogue.
 *
 * A laboratory works from an enumerated list of the events a system records,
 * not from an assurance that it logs a lot. So the list is enumerated - and
 * enumerated twice, from two directions, because a hand-written catalogue is
 * exactly the document that quietly stops matching the code.
 *
 *   Statically:     every event kind the source can write, found by scanning it.
 *   Behaviourally:  every kind actually written while the system is exercised,
 *                   and which of the two records it landed in.
 *
 * A kind in the code and not in the catalogue fails the build. A kind in the
 * catalogue and not in the code fails the build. A kind the catalogue files
 * under the wrong record fails the build. What is left - a documented kind that
 * no scenario exercised - is reported rather than hidden, because "we record
 * this" and "we have seen this recorded" are different claims.
 */

const SOURCE = path.resolve(__dirname, '..', 'src');

/**
 * Upper-case literals that are not event kinds.
 *
 * Derived wherever it can be: the account names and their classes come from the
 * chart of accounts, the provider states from the provider contract. What is
 * left is a short hand-written list, and anything new that is neither an event
 * kind nor on it shows up as undocumented - which is the right way round. A new
 * constant should have to be classified by a person once.
 */
const NOT_A_KIND = new Set([
  ...Object.keys(ACCOUNTS),
  ASSET, LIABILITY, REVENUE, EXPENSE, EQUITY,
  ...Object.values(STATUS),
  'GET', 'POST', 'DELETE', 'PUT', 'PATCH',   // HTTP methods
  'COMMIT', 'ROLLBACK',                       // SQLite
  'LRD',                                      // the currency
  'UNEXPLAINED', 'UNKNOWN',                   // report and log labels
  'REFUSED'                                   // a provider error code, not ours
]);

const KIND_RE = /'([A-Z][A-Z0-9_]{2,})'/g;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(child) : (entry.name.endsWith('.js') ? [child] : []);
  });
}

/**
 * Every event kind the runtime source can write.
 *
 * A plain scan for upper-case literals rather than for `kind:` specifically,
 * because two kinds are chosen by a ternary and two more are passed as an
 * argument - and a discovery that only found the easy shape would have quietly
 * missed a PIN lockout and a mobile money timeout.
 */
function discover() {
  const found = new Map();
  for (const file of walk(SOURCE)) {
    const relative = path.relative(path.join(SOURCE, '..'), file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(KIND_RE)) {
      const kind = match[1];
      if (NOT_A_KIND.has(kind)) continue;
      if (!found.has(kind)) found.set(kind, new Set());
      found.get(kind).add(relative);
    }
  }
  return [...found.entries()]
    .map(([kind, files]) => ({ kind, files: [...files].sort() }))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

// ---------------------------------------------------------------- the entries

const JOURNAL = 'journal';
const EVENTS = 'events';

/**
 * What each event means, where it is written, and why it is worth recording.
 *
 * `record` is checked against reality: `journal` means a double-entered
 * transaction, `events` means a fact with no money in it. Both are append-only
 * and durable in the same store. Nothing here is written to a log file that can
 * be rotated away.
 */
const CATALOGUE = [
  // ------------------------------------------------------------------ money
  { kind: 'CAPITAL_INJECTION', record: JOURNAL, group: 'Money', subject: 'operator',
    title: 'The operator funds the business',
    what: 'Settlement funds increase against operator capital. Nothing else in the system creates an asset.' },
  { kind: 'BUY_FLOAT', record: JOURNAL, group: 'Money', subject: 'runner',
    title: 'A runner buys float',
    what: 'Money received, float issued, commission recognised as the difference. The only way electronic value enters a runner\'s hands.' },
  { kind: 'SELL_FLOAT_BACK', record: JOURNAL, group: 'Money', subject: 'runner',
    title: 'A runner sells float back',
    what: 'Float returned for real money. The route that keeps a runner in a winning neighbourhood able to pay winners.' },
  { kind: 'CASH_IN', record: JOURNAL, group: 'Money', subject: 'player',
    title: 'A player tops up at a runner',
    what: 'Float moves to a wallet. The cash itself is between two people and never appears - the single entry a regulator should look at hardest.' },
  { kind: 'CASH_PAYOUT', record: JOURNAL, group: 'Money', subject: 'player',
    title: 'A runner pays a winner in cash',
    what: 'Wallet down, runner float up, commission recognised. The mirror of a top-up.' },
  { kind: 'ISSUE_VOUCHER', record: JOURNAL, group: 'Money', subject: 'runner',
    title: 'A runner buys voucher inventory',
    what: 'Float becomes an unredeemed voucher liability. Sold offline, activated later.' },
  { kind: 'REDEEM_VOUCHER', record: JOURNAL, group: 'Money', subject: 'player',
    title: 'A player activates a voucher',
    what: 'The voucher liability becomes a wallet balance. This carries the server timestamp, which is what stops an offline sale producing a bet after a draw.' },
  { kind: 'TOP_UP_WALLET', record: JOURNAL, group: 'Money', subject: 'player',
    title: 'A player tops up by mobile money',
    what: 'Recognised only when the provider confirms, never when the request is made.' },
  { kind: 'WITHDRAW_MOBILE_MONEY', record: JOURNAL, group: 'Money', subject: 'player',
    title: 'A player withdraws directly',
    what: 'The only path where real money leaves the operator. The transfer fee is an operator cost, not a deduction from the player.' },
  { kind: 'ACCRUE_GAMING_TAX', record: JOURNAL, group: 'Money', subject: 'operator',
    title: 'Gaming tax accrued',
    what: 'Recognised as an expense and a payable. Not callable by a player, so outside the solvency check.' },

  // ------------------------------------------------------------------ draws
  { kind: 'PLACE_BET', record: JOURNAL, group: 'Draws', subject: 'player',
    title: 'A bet is taken',
    what: 'The stake leaves the wallet for unsettled stakes. Refused after the cutoff on the server clock, whatever the request says.' },
  { kind: 'DRAW_OPENED', record: EVENTS, group: 'Draws', subject: 'operator',
    title: 'A draw is committed',
    what: 'The commitment is published with the opening, cutoff and draw times, and the custody threshold if the seed was sealed. The ordering of this timestamp against the opening time is the whole integrity guarantee.' },
  { kind: 'DRAW_REVEALED', record: EVENTS, group: 'Draws', subject: 'operator',
    title: 'The seed is revealed',
    what: 'The seed and the resulting number, checked against the published commitment inside the transaction that records them.' },
  { kind: 'SETTLE_DRAW', record: JOURNAL, group: 'Draws', subject: 'operator',
    title: 'A draw settles',
    what: 'Stakes recognised as revenue, prizes credited to wallets. Winners are decided by the game rules against the revealed number, never by a list handed in.' },

  // ------------------------------------------------------------- promotions
  { kind: 'ISSUE_FREE_TICKET', record: JOURNAL, group: 'Promotions', subject: 'player',
    title: 'A promotional ticket is granted',
    what: 'Promotional cost against a callable liability. Refused if the day\'s budget is spent - the cap is evaluated inside this transaction.' },
  { kind: 'REDEEM_FREE_TICKET', record: JOURNAL, group: 'Promotions', subject: 'player',
    title: 'A promotional ticket is played',
    what: 'It becomes a stake directly and never touches the wallet, so a grant cannot be withdrawn as cash.' },
  { kind: 'FUND_JACKPOT', record: JOURNAL, group: 'Promotions', subject: 'operator',
    title: 'The jackpot is funded from a settled draw',
    what: 'Recognised draw by draw, so an unwon pot is never mistaken for profit and a pot outgrowing settlement funds halts float sales.' },
  { kind: 'PAY_JACKPOT', record: JOURNAL, group: 'Promotions', subject: 'player',
    title: 'The jackpot is won',
    what: 'The pool moves to a wallet. No expense here - it was recognised as the pot was built.' },
  { kind: 'PROMO_CAP_SET', record: EVENTS, group: 'Promotions', subject: 'operator',
    title: 'The daily promotional budget is set',
    what: 'Carries the amount and the staff member who set it, taken from their credentials. "What was the cap in March, and who set it" has an answer here.' },
  { kind: 'PROMO_CAP_CLEARED', record: EVENTS, group: 'Promotions', subject: 'operator',
    title: 'The promotional budget is removed',
    what: 'Different from a cap of zero: this is no limit at all, and the distinction is deliberate.' },

  // ------------------------------------------------------ player protection
  { kind: 'PROTECTION_SET', record: EVENTS, group: 'Player protection', subject: 'operator',
    title: 'House limits are switched on',
    what: 'Daily stake and loss caps, with the date and the staff member. Nothing is enforced until this is posted.' },
  { kind: 'PROTECTION_CLEARED', record: EVENTS, group: 'Player protection', subject: 'operator',
    title: 'House limits are switched off',
    what: 'Per-player limits and exclusions are untouched, because those are the player\'s decisions rather than the operator\'s.' },
  { kind: 'PLAYER_LIMIT_SET', record: EVENTS, group: 'Player protection', subject: 'player',
    title: 'A player\'s own limit is set',
    what: 'Tighter or looser than the house policy. A player who asks for a limit gets one whether or not a house policy exists.' },
  { kind: 'PLAYER_EXCLUDED', record: EVENTS, group: 'Player protection', subject: 'player',
    title: 'A player self-excludes',
    what: 'With an end date or indefinitely. Survives a new handset, because it attaches to the number rather than the device.' },
  { kind: 'PLAYER_REINSTATED', record: EVENTS, group: 'Player protection', subject: 'player',
    title: 'An exclusion ends',
    what: 'Recorded separately from the exclusion, so a cooling-off period cannot be shortened without leaving a mark.' },

  // ---------------------------------------------------------- runner control
  { kind: 'AGENT_SUSPENDED', record: EVENTS, group: 'Runner control', subject: 'runner',
    title: 'A runner is suspended from selling',
    what: 'With a reason. Takes effect inside the same lock every sale is checked against, so it stops the next sale rather than the next audit.' },
  { kind: 'AGENT_REINSTATED', record: EVENTS, group: 'Runner control', subject: 'runner',
    title: 'A runner is reinstated',
    what: 'The pair of events answers how long a runner was out and who ended it.' },

  // -------------------------------------------------------------- credentials
  { kind: 'TOKEN_ISSUED', record: EVENTS, group: 'Credentials', subject: 'any',
    title: 'A bearer token is issued',
    what: 'Records a short digest of the token, the kind of principal, the subject and the expiry - never the token. The digest is what joins this line to a line in the call log.' },
  { kind: 'TOKEN_REVOKED', record: EVENTS, group: 'Credentials', subject: 'any',
    title: 'A token is revoked',
    what: 'Immediate: the next request with it is refused.' },
  { kind: 'PIN_SET', record: EVENTS, group: 'Credentials', subject: 'player',
    title: 'A player\'s PIN is set or reset',
    what: 'The PIN is scrypt-hashed and never recorded. There is no self-service reset, so every one of these was performed by staff.' },
  { kind: 'PIN_FAILED', record: EVENTS, group: 'Credentials', subject: 'player',
    title: 'A PIN was wrong',
    what: 'With the running count of failures. A cluster across many players is the signature of a credential attack.' },
  { kind: 'PIN_LOCKED', record: EVENTS, group: 'Credentials', subject: 'player',
    title: 'A PIN locked after repeated failures',
    what: 'Three wrong guesses. Durable, so a restart does not forgive an attacker.' },
  { kind: 'PIN_OK', record: EVENTS, group: 'Credentials', subject: 'player',
    title: 'A failure count is cleared',
    what: 'Written only when a correct PIN follows failures, so the log shows the attempt that ended a run rather than every ordinary use.' },
  { kind: 'PIN_UNLOCKED', record: EVENTS, group: 'Credentials', subject: 'player',
    title: 'A locked player is unlocked by staff',
    what: 'The only way out of a lock, and therefore a line a reviewer should expect to see paired with a support ticket.' },

  // ------------------------------------------------------------ mobile money
  { kind: 'MM_REQUESTED', record: EVENTS, group: 'Mobile money', subject: 'provider',
    title: 'A transfer is requested',
    what: 'Written before the provider is called, under a reference this system generated - which is what lets a timed-out request be asked about rather than retried.' },
  { kind: 'MM_ACCEPTED', record: EVENTS, group: 'Mobile money', subject: 'provider',
    title: 'The provider accepted the request',
    what: 'Carries the provider\'s own reference. Acceptance is not confirmation and does not move money.' },
  { kind: 'MM_UNRESOLVED', record: EVENTS, group: 'Mobile money', subject: 'provider',
    title: 'The provider did not answer',
    what: 'A timeout or an outage. The money may well be moving, so the request stays open for the next reconciliation sweep rather than being retried.' },
  { kind: 'MM_FAILED', record: EVENTS, group: 'Mobile money', subject: 'provider',
    title: 'A transfer failed',
    what: 'Terminal. A reserved disbursement is returned to the wallet - a return, not a reversal, because nothing was ever paid.' },
  { kind: 'MM_ANOMALY', record: EVENTS, group: 'Mobile money', subject: 'provider',
    title: 'A callback could not be applied',
    what: 'A wrong amount, an unknown reference, a contradiction of an earlier callback. Nobody\'s queue unless somebody looks at it, which is why it is an event and not a log line.' },
  { kind: 'RESERVE_DISBURSEMENT', record: JOURNAL, group: 'Mobile money', subject: 'player',
    title: 'A payout leaves the wallet and is held',
    what: 'Money out is reserved before the transfer is attempted, so a wallet cannot be spent twice while a payout is in flight.' },
  { kind: 'CONFIRM_DISBURSEMENT', record: JOURNAL, group: 'Mobile money', subject: 'player',
    title: 'A payout is confirmed',
    what: 'The held amount leaves settlement funds. Only now has money actually moved.' },
  { kind: 'RETURN_DISBURSEMENT', record: JOURNAL, group: 'Mobile money', subject: 'player',
    title: 'A failed payout is returned',
    what: 'Back to the wallet. Recorded as its own kind so a return can never be read as a fresh top-up.' }
];

const BY_KIND = new Map(CATALOGUE.map((entry) => [entry.kind, entry]));

// ------------------------------------------------------------- observation

/**
 * Exercise the system and record what it actually writes.
 *
 * The static scan says what the code *can* write. This says what it *does*,
 * and which of the two records each kind landed in - so a catalogue entry that
 * files a transaction as an event, or the reverse, is caught rather than
 * believed. What no scenario reaches is reported as unexercised, because
 * "we record this" and "we have seen this recorded" are different claims and a
 * document should not blur them.
 */
function observe() {
  const { Operator } = require('../src/operator.js');
  const { Auth } = require('../src/http/auth.js');
  const { MobileMoneyGateway } = require('../src/mobilemoney/gateway.js');
  const { SimulatedProvider } = require('../src/mobilemoney/simulator.js');
  const draws = require('../src/draws.js');
  const game = require('../../africa-numbers/game.js');

  const at = (time) => `2026-09-01T${time}:00.000Z`;
  const operator = new Operator();
  const provider = new SimulatedProvider();
  const gateway = new MobileMoneyGateway({ operator, provider });
  const auth = new Auth({ ledger: operator.ledger, webhookSecret: 'observe' });
  const evaluate = (bet, result) => (bet.selection && game.isHit(bet.selection, result)
    ? game.quote(bet.selection.type, bet.stakeMinor).netCents : 0);

  // Money in, and a network of runners.
  operator.injectCapital({ id: 'o-cap', at: at('06:00'), amountMinor: 1_000_000_00 });
  operator.buyFloat({ id: 'o-float', at: at('07:00'), agentId: 'ag-1', paidMinor: 95_000_00, floatMinor: 100_000_00 });
  operator.cashIn({ id: 'o-in', at: at('08:00'), agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  operator.issueVoucher({ id: 'o-voucher', at: at('08:05'), agentId: 'ag-1', voucherId: 'v-1', amountMinor: 500_00 });
  operator.redeemVoucher({ id: 'o-redeem', at: at('08:10'), voucherId: 'v-1', playerId: 'p-2' });

  // Policy, set and unset.
  operator.setPromoCap({ id: 'o-cap-set', at: at('08:15'), dailyCapMinor: 1_000_00, by: 'staff-1' });
  operator.setProtection({ id: 'o-prot', at: at('08:16'), dailyStakeMinor: 500_00, by: 'staff-1' });
  operator.setPlayerLimit({ id: 'o-lim', at: at('08:17'), playerId: 'p-1', dailyStakeMinor: 400_00 });
  operator.excludePlayer({ id: 'o-exc', at: at('08:18'), playerId: 'p-3', reason: 'requested' });
  operator.reinstatePlayer({ id: 'o-rei', at: at('08:19'), playerId: 'p-3' });

  // A draw, taken and settled.
  const seed = draws.createSeed();
  const schedule = draws.schedule({ drawKey: 'D1', drawAt: at('19:00'), opensAt: at('09:00') });
  operator.openDraw({ id: 'o-open', at: at('08:30'), commitment: draws.commit('D1', seed), ...schedule });
  operator.placeBet({
    id: 'o-bet', at: at('10:00'), betId: 'o-bet', playerId: 'p-1', drawKey: 'D1',
    stakeMinor: 10_00, selection: { type: 'straight', digits: draws.resultFromSeed('D1', seed) }
  });
  operator.issueFreeTicket({
    id: 'o-ticket', at: at('10:05'), campaignId: 'welcome', ticketId: 't-1', playerId: 'p-2', faceMinor: 10_00
  });
  operator.redeemFreeTicket({
    id: 'o-play', at: at('10:10'), ticketId: 't-1', betId: 'o-free', drawKey: 'D1',
    selection: { type: 'oneDigit', digits: '7' }
  });
  operator.revealDraw({ id: 'o-reveal', at: at('19:00'), drawKey: 'D1', seed });
  const settled = operator.settleDraw({ id: 'o-settle', at: at('19:05'), drawKey: 'D1', evaluate });

  // Paying, taxing, and funding the pot.
  operator.cashPayout({ id: 'o-pay', at: at('19:30'), agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00, commissionMinor: 2_00 });
  const contribution = Math.max(1, Math.round(settled.totalStakes * 0.01));
  operator.fundJackpot({ id: 'o-jack', at: at('19:40'), drawKey: 'D1', amountMinor: contribution });
  // Paid out of what was actually funded: the pot is a liability and the guard
  // that refuses an unfunded win is one of the ones worth not working around.
  operator.payJackpot({ id: 'o-jackpay', at: at('19:45'), drawKey: 'D1', playerId: 'p-1', amountMinor: contribution });
  operator.accrueGamingTax({ id: 'o-tax', at: at('19:50'), amountMinor: 10_00 });
  operator.sellFloatBack({ id: 'o-back', at: at('20:00'), agentId: 'ag-1', amountMinor: 1_000_00 });
  operator.withdrawToMobileMoney({ id: 'o-wd', at: at('20:05'), playerId: 'p-1', amountMinor: 50_00, feeMinor: 50 });

  // Runner control.
  operator.suspendAgent({ id: 'o-susp', at: at('20:10'), agentId: 'ag-1', reason: 'short at close' });
  operator.reinstateAgent({ id: 'o-reinst', at: at('20:15'), agentId: 'ag-1' });

  // Credentials, including the unhappy path.
  const token = auth.issueToken({ id: 'o-tok', at: at('20:20'), kind: 'agent', subject: 'ag-1', roles: ['agent'] });
  auth.revokeToken({ id: 'o-rev', at: at('20:21'), token });
  auth.setPlayerPin({ id: 'o-pin', at: at('20:22'), playerId: 'p-1', pin: '1234' });
  auth.checkPin({ id: 'o-bad-1', at: at('20:23'), playerId: 'p-1', pin: '0000' });
  auth.checkPin({ id: 'o-good', at: at('20:24'), playerId: 'p-1', pin: '1234' });
  for (let i = 2; i <= 4; i++) auth.checkPin({ id: `o-bad-${i}`, at: at('20:25'), playerId: 'p-1', pin: '0000' });
  auth.unlockPlayer({ id: 'o-unlock', at: at('20:30'), playerId: 'p-1' });

  // Mobile money: accepted, confirmed, timed out, failed, and contradicted.
  gateway.requestTopUp({ ref: 'mm-1', at: at('21:00'), playerId: 'p-2', msisdn: '+231770000002', amountMinor: 200_00 });
  for (const callback of provider.drain()) gateway.handleCallback({ ...callback, at: at('21:01') });

  provider.script('timeout');
  gateway.requestPayout({ ref: 'mm-2', at: at('21:10'), playerId: 'p-2', msisdn: '+231770000002', amountMinor: 20_00 });

  // A rejected collection and a rejected payout: two directions, and both now
  // produce the same named failure event.
  provider.script('reject');
  gateway.requestTopUp({ ref: 'mm-3', at: at('21:15'), playerId: 'p-2', msisdn: '+231770000002', amountMinor: 20_00 });
  provider.script('reject');
  gateway.requestPayout({ ref: 'mm-4', at: at('21:20'), playerId: 'p-2', msisdn: '+231770000002', amountMinor: 20_00 });

  // A payout that succeeds, all the way to the money leaving.
  provider.script('happy');
  gateway.requestPayout({ ref: 'mm-5', at: at('21:25'), playerId: 'p-2', msisdn: '+231770000002', amountMinor: 20_00 });
  for (const callback of provider.drain()) gateway.handleCallback({ ...callback, at: at('21:26') });

  // And a callback for a reference this system never issued.
  gateway.handleCallback({ clientRef: 'mm-unknown', status: 'SUCCEEDED', amountMinor: 1_00, at: at('21:30') });

  // Policy withdrawn, which is a different act from setting it to nothing.
  operator.clearPromoCap({ id: 'o-cap-clear', at: at('22:00'), by: 'staff-1' });
  operator.clearProtection({ id: 'o-prot-clear', at: at('22:01'), by: 'staff-1' });

  const journal = new Set(operator.ledger.journal.map((entry) => entry.kind));
  const events = new Set(operator.ledger.events.map((entry) => entry.kind));
  operator.close();
  return { journal, events };
}

/**
 * The two lists against each other, and against the catalogue.
 *
 * Three of the four outcomes stop a release. The fourth - documented but not
 * exercised - is reported on the page.
 */
function reconcile() {
  const discovered = discover();
  const inCode = new Set(discovered.map((entry) => entry.kind));
  const seen = observe();

  const undocumented = [...inCode].filter((kind) => !BY_KIND.has(kind)).sort();
  const stale = CATALOGUE.map((entry) => entry.kind).filter((kind) => !inCode.has(kind)).sort();

  const misfiled = [];
  const unexercised = [];
  for (const entry of CATALOGUE) {
    const inJournal = seen.journal.has(entry.kind);
    const inEvents = seen.events.has(entry.kind);
    if (!inJournal && !inEvents) {
      unexercised.push(entry.kind);
      continue;
    }
    const actual = inJournal ? JOURNAL : EVENTS;
    if (actual !== entry.record) misfiled.push({ kind: entry.kind, catalogued: entry.record, actual });
  }

  return {
    discovered,
    counts: {
      catalogued: CATALOGUE.length,
      inCode: inCode.size,
      exercised: CATALOGUE.length - unexercised.length,
      journal: CATALOGUE.filter((entry) => entry.record === JOURNAL).length,
      events: CATALOGUE.filter((entry) => entry.record === EVENTS).length
    },
    undocumented,
    stale,
    misfiled,
    unexercised: unexercised.sort(),
    ok: undocumented.length === 0 && stale.length === 0 && misfiled.length === 0
  };
}

// --------------------------------------------------------------- the call log

/**
 * The other record, and the one with a different set of properties.
 *
 * Every HTTP call is written to an append-only file: who called, what they
 * called, and what they were told. Reads as well as writes, because "who looked
 * at this player's wallet" carries the same weight as "who moved money".
 */
const CALL_LOG = {
  fields: [
    ['at', 'Server time. Never a value from the request.'],
    ['method, path', 'What was called.'],
    ['status', 'What they were told, including refusals.'],
    ['principalKind, subject', 'Who, from their credentials rather than the body.'],
    ['tokenId', 'The same short digest the TOKEN_ISSUED event carries, so the two join without either holding a working credential.'],
    ['idempotencyKey', 'Which attempt this was, so a retry is identifiable as one.'],
    ['build', 'Which software did it.'],
    ['secret', 'Marks the one response whose contents are never recorded: the call that hands over custody shares.']
  ],
  never: ['the request body', 'the response body', 'the bearer token', 'a PIN', 'a custody share']
};

module.exports = {
  discover, observe, reconcile, CATALOGUE, BY_KIND, CALL_LOG, NOT_A_KIND, JOURNAL, EVENTS, SOURCE
};
