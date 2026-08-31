'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');
const { MobileMoneyGateway } = require('../src/mobilemoney/gateway.js');
const { SimulatedProvider } = require('../src/mobilemoney/simulator.js');
const { STATUS } = require('../src/mobilemoney/provider.js');

const AT = '2026-08-26T08:00:00Z';
const LATER = '2026-08-26T09:00:00Z';
const MSISDN = '+231770000001';

function rig({ funded = 1_000_000_00, defaultBehaviour = 'happy' } = {}) {
  const operator = new Operator();
  operator.injectCapital({ id: 'cap', at: AT, amountMinor: funded });
  const provider = new SimulatedProvider({ defaultBehaviour });
  const gateway = new MobileMoneyGateway({ operator, provider });
  return { operator, provider, gateway };
}

/** Deliver everything the provider produced, in the order it produced it. */
const deliver = (gateway, provider, at = LATER) =>
  provider.drain().map((cb) => gateway.handleCallback({ ...cb, at }));

// ------------------------------------------------------------- the happy path

test('a confirmed collection is posted; an unconfirmed one is not', () => {
  const { operator, provider, gateway } = rig();
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 500_00 });

  // Before the callback, nothing has moved. Money that might arrive is not money.
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 0);
  assert.equal(gateway.request('TU-1').status, STATUS.PENDING);
  assert.equal(gateway.pending().length, 1);

  const [result] = deliver(gateway, provider);
  assert.equal(result.outcome, 'applied');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 500_00);
  assert.equal(gateway.request('TU-1').status, STATUS.SUCCEEDED);
  assert.equal(gateway.pending().length, 0);
  assert.equal(operator.ledger.trialBalance().balanced, true);
});

test('a float purchase lands as T1, commission and all', () => {
  const { operator, provider, gateway } = rig();
  gateway.requestFloatPurchase({ ref: 'FL-1', at: AT, agentId: 'ag-1', msisdn: MSISDN, paidMinor: 9_500_00, floatMinor: 10_000_00 });
  deliver(gateway, provider);

  assert.equal(operator.ledger.balance('AGENT_FLOAT:ag-1'), 10_000_00);
  assert.equal(operator.ledger.balance('AGENT_COMMISSION:ag-1'), 500_00);
  assert.equal(operator.agents().length, 1, 'and the runner is on the roster');
  assert.equal(operator.ledger.solvency().ok, true);
});

test('a payout debits the wallet before the provider is called', () => {
  const { operator, provider, gateway } = rig();
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 500_00 });
  gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 300_00, feeMinor: 50 });

  // In flight: gone from the wallet, not yet gone from the operator.
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 200_00);
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 300_00);
  assert.equal(operator.ledger.solvency().ok, true, 'and it is still a callable liability');

  deliver(gateway, provider);
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 0);
  assert.equal(operator.ledger.balance('TRANSACTION_FEES'), 50);
  assert.equal(gateway.request('PO-1').status, STATUS.SUCCEEDED);
});

test('the same balance cannot be withdrawn twice while the first is in the air', () => {
  const { operator, gateway } = rig();
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });
  gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  assert.throws(
    () => gateway.requestPayout({ ref: 'PO-2', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 }),
    /cannot withdraw/
  );
});

// -------------------------------------------------------------- the bad paths

test('a duplicate callback is recognised, not paid twice', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'duplicate' });
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  const results = deliver(gateway, provider);
  assert.deepEqual(results.map((r) => r.outcome), ['applied', 'duplicate']);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00, 'credited once');
  assert.equal(operator.ledger.trialBalance().balanced, true);
});

test('a stale PENDING arriving after SUCCEEDED changes nothing', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'reorder' });
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  const results = deliver(gateway, provider);
  assert.deepEqual(results.map((r) => r.outcome), ['applied', 'stale']);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
  assert.equal(gateway.request('TU-1').status, STATUS.SUCCEEDED);
});

test('a FAILED contradicting an earlier SUCCEEDED is an anomaly, not a reversal', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'late-fail' });
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  const results = deliver(gateway, provider);
  assert.deepEqual(results.map((r) => r.outcome), ['applied', 'anomaly']);
  // The first terminal answer stands; the money is not clawed back on the
  // strength of a contradiction.
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
  assert.equal(gateway.anomalies().length, 1);
  assert.match(gateway.anomalies()[0].reason, /contradicts a SUCCEEDED answer/);
});

test('a callback whose amount disagrees with the request posts nothing', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'short' });
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  const [result] = deliver(gateway, provider);
  assert.equal(result.outcome, 'anomaly');
  assert.match(result.reason, /amount mismatch: asked 10000, told 9999/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 0, 'neither figure is invented');
  assert.equal(gateway.request('TU-1').status, STATUS.PENDING, 'and it stays on the queue');
});

test('a callback for a reference nobody started is an anomaly', () => {
  const { operator, provider, gateway } = rig();
  const forged = provider.forgeCallback({ clientRef: 'NOT-OURS', amountMinor: 1_000_00, at: LATER });

  const result = gateway.handleCallback(forged);
  assert.equal(result.outcome, 'anomaly');
  assert.match(result.reason, /unknown reference/);
  assert.equal(operator.ledger.size, 1, 'only the capital injection was ever posted');
  assert.equal(gateway.anomalies().length, 1);
});

test('a rejected request is terminal, and a rejected payout returns the money', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'reject' });
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });

  const result = gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });
  assert.equal(result.status, STATUS.FAILED);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00, 'back where it came from');
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 0);
  assert.equal(gateway.request('PO-1').status, STATUS.FAILED);
  assert.equal(gateway.pending().length, 0);
});

test('a failed transfer returns the money and books no fee', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'fail' });
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });
  gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00, feeMinor: 50 });

  deliver(gateway, provider);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
  assert.equal(operator.ledger.balance('TRANSACTION_FEES'), 0, 'a transfer that failed costs nothing');
  assert.equal(operator.ledger.trialBalance().balanced, true);
  assert.equal(operator.ledger.equation().holds, true);
});

// ------------------------------------------------------------- the hard cases

test('a timeout leaves the request pending, and reconcile finds the money moved', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'timeout' });

  // The provider accepted it and then went quiet. The caller cannot tell.
  const result = gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });
  assert.equal(result.status, STATUS.PENDING);
  assert.equal(result.unresolved, 'ProviderTimeout');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 0, 'nothing assumed either way');

  // Asking by our own reference is what makes this recoverable.
  const [swept] = gateway.reconcile({ at: LATER });
  assert.equal(swept.outcome, 'applied');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
  assert.equal(gateway.pending().length, 0);
});

test('a timeout is never retried blindly into a second payment', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'timeout' });
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });
  gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  // Re-offering the same reference is refused outright...
  assert.throws(() => gateway.requestPayout({ ref: 'PO-1', at: LATER, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 }), /already exists/);
  // ...and a new reference cannot be funded, because the money is in flight.
  assert.throws(() => gateway.requestPayout({ ref: 'PO-2', at: LATER, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 }), /cannot withdraw/);

  gateway.reconcile({ at: LATER });
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 0, 'settled exactly once');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 0);
});

test('a request that never reached the provider is closed, not left hanging', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'lost' });
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });
  gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 100_00);

  // getStatus says UNKNOWN: nothing was ever accepted, so the money comes back.
  const [swept] = gateway.reconcile({ at: LATER });
  assert.equal(swept.outcome, 'applied');
  assert.match(swept.reason, /never accepted it/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
  assert.equal(gateway.pending().length, 0);
});

test('an outage is a degradation, not a loss (F6)', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'outage' });
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });

  const result = gateway.requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });
  assert.equal(result.unresolved, 'ProviderUnavailable');
  assert.equal(gateway.pending().length, 1, 'the obligation survives the outage and is queued');
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 100_00);

  // The provider comes back, and the sweep clears it.
  const [swept] = gateway.reconcile({ at: LATER });
  assert.equal(swept.outcome, 'applied');
  assert.match(swept.reason, /never accepted it/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
});

test('a reconcile sweep is safe to run twice', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'timeout' });
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });

  gateway.reconcile({ at: LATER });
  const second = gateway.reconcile({ at: '2026-08-26T10:00:00Z' });
  assert.deepEqual(second, [], 'nothing is pending the second time');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
});

test('a callback arriving after reconcile already applied it is a duplicate', () => {
  const { operator, provider, gateway } = rig({ defaultBehaviour: 'timeout' });
  gateway.requestTopUp({ ref: 'TU-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });
  gateway.reconcile({ at: LATER });

  // The callback the provider queued during the timeout turns up late.
  const results = deliver(gateway, provider, '2026-08-26T10:00:00Z');
  assert.deepEqual(results.map((r) => r.outcome), ['duplicate']);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 100_00, 'still credited once');
});

// ------------------------------------------------------------- a mixed run

test('a run of mixed outcomes reconciles, and every request ends resolved or queued', () => {
  const { operator, provider, gateway } = rig();
  operator.topUpWallet({ id: 'seed', at: AT, playerId: 'p-1', amountMinor: 1_000_00 });

  provider.script('happy', 'fail', 'timeout', 'duplicate', 'outage', 'short');
  gateway.requestTopUp({ ref: 'A', at: AT, playerId: 'p-2', msisdn: MSISDN, amountMinor: 10_00 });
  gateway.requestPayout({ ref: 'B', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 20_00 });
  gateway.requestTopUp({ ref: 'C', at: AT, playerId: 'p-2', msisdn: MSISDN, amountMinor: 30_00 });
  gateway.requestTopUp({ ref: 'D', at: AT, playerId: 'p-2', msisdn: MSISDN, amountMinor: 40_00 });
  gateway.requestPayout({ ref: 'E', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 50_00 });
  gateway.requestTopUp({ ref: 'F', at: AT, playerId: 'p-2', msisdn: MSISDN, amountMinor: 60_00 });

  deliver(gateway, provider);
  gateway.reconcile({ at: '2026-08-26T23:00:00Z' });

  const statuses = Object.fromEntries(
    ['A', 'B', 'C', 'D', 'E', 'F'].map((r) => [r, gateway.request(r).status])
  );
  assert.deepEqual(statuses, {
    A: STATUS.SUCCEEDED,   // happy
    B: STATUS.FAILED,      // fail - and the money went back
    C: STATUS.SUCCEEDED,   // timeout, recovered by the sweep
    D: STATUS.SUCCEEDED,   // duplicate callback, credited once
    E: STATUS.FAILED,      // outage, never accepted, money returned
    F: STATUS.PENDING      // amount mismatch: still an open reconciliation item
  });

  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-2'), 10_00 + 30_00 + 40_00);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 1_000_00, 'both payouts came back');
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 0);
  assert.equal(operator.ledger.trialBalance().balanced, true);
  assert.equal(operator.ledger.equation().holds, true);
  assert.equal(operator.ledger.solvency().ok, true);
  assert.deepEqual(operator.ledger.store.verify(), [], 'no cache drift across the run');

  // The one that could not be applied is visible, not lost - and recorded
  // once, however many sweeps re-find it.
  assert.equal(gateway.pending().map((r) => r.ref).join(), 'F');
  assert.equal(gateway.anomalies().length, 1);
  gateway.reconcile({ at: '2026-08-27T08:00:00Z' });
  gateway.reconcile({ at: '2026-08-28T08:00:00Z' });
  assert.equal(gateway.anomalies().length, 1, 'a sweep does not grow the queue');
});

// ------------------------------------------------------------------ durability

test('in-flight requests survive a restart', async (t) => {
  const { mkdtempSync, rmSync } = require('node:fs');
  const { join } = require('node:path');
  const { tmpdir } = require('node:os');
  const { SqliteStore } = require('../src/store/sqlite.js');

  const dir = mkdtempSync(join(tmpdir(), 'mm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'ledger.db');
  const provider = new SimulatedProvider({ defaultBehaviour: 'timeout' });

  const first = new Operator({ store: new SqliteStore(file) });
  first.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_00 });
  first.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });
  new MobileMoneyGateway({ operator: first, provider })
    .requestPayout({ ref: 'PO-1', at: AT, playerId: 'p-1', msisdn: MSISDN, amountMinor: 100_00 });
  first.close();

  // A crash mid-transfer must not lose the fact that money is in flight.
  const second = new Operator({ store: new SqliteStore(file) });
  const resumed = new MobileMoneyGateway({ operator: second, provider });
  assert.equal(second.ledger.balance('PENDING_DISBURSEMENTS'), 100_00);
  assert.equal(resumed.pending().length, 1);

  const [swept] = resumed.reconcile({ at: LATER });
  assert.equal(swept.outcome, 'applied');
  assert.equal(second.ledger.balance('PENDING_DISBURSEMENTS'), 0);
  assert.equal(second.ledger.trialBalance().balanced, true);
  second.close();
});
