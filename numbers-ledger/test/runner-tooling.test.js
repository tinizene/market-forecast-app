'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');
const { openTestDraw, payTo } = require('./helpers.js');

const AT = '2026-08-26T08:00:00Z';
const DAY1 = '2026-08-26';
const DAY2 = '2026-08-27';

function withRunner() {
  const op = new Operator();
  op.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  op.buyFloat({ id: 'f1', at: `${DAY1}T09:00:00Z`, agentId: 'ag-1', paidMinor: 9_500_00, floatMinor: 10_000_00 });
  return op;
}

// ------------------------------------------------------------- statements

test('a statement reconciles opening, movements and closing against the ledger', () => {
  const op = withRunner();
  op.cashIn({ id: 'i1', at: `${DAY1}T10:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  op.cashIn({ id: 'i2', at: `${DAY1}T11:00:00Z`, agentId: 'ag-1', playerId: 'p-2', amountMinor: 500_00 });
  op.issueVoucher({ id: 'v1', at: `${DAY1}T12:00:00Z`, agentId: 'ag-1', voucherId: 'VC-1', amountMinor: 200_00 });
  op.cashPayout({ id: 'o1', at: `${DAY1}T18:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 300_00, commissionMinor: 6_00 });
  op.sellFloatBack({ id: 's1', at: `${DAY1}T19:00:00Z`, agentId: 'ag-1', amountMinor: 400_00 });

  const st = op.agentStatement('ag-1');

  assert.equal(st.openingMinor, 0);
  assert.deepEqual(st.movements, {
    purchases: 10_000_00,
    sales: -1_500_00,
    vouchers: -200_00,
    payouts: 306_00,   // the winner's 300 plus the runner's 6 handling fee
    redemptions: -400_00,
    other: 0
  });
  assert.equal(st.closingMinor, 8_206_00);
  assert.equal(st.closingMinor, op.ledger.balance('AGENT_FLOAT:ag-1'), 'the six lines add up to the balance');
  assert.equal(st.reconciles, true);

  // Commission is attributable now that the account is partitioned: 500 on the
  // float discount plus 6 for handling the payout.
  assert.equal(st.commissionMinor, 506_00);
});

test('the statement window is half-open, so two days cannot claim one transaction', () => {
  const op = withRunner();
  op.cashIn({ id: 'a', at: `${DAY1}T23:59:59Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.cashIn({ id: 'b', at: `${DAY2}T00:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 200_00 });

  const day1 = op.agentStatement('ag-1', { from: `${DAY1}T00:00:00Z`, to: `${DAY2}T00:00:00Z` });
  const day2 = op.agentStatement('ag-1', { from: `${DAY2}T00:00:00Z`, to: `${DAY2}T23:59:59Z` });

  assert.equal(day1.movements.sales, -100_00, 'the midnight transaction belongs to day 2');
  assert.equal(day2.movements.sales, -200_00);
  assert.equal(day2.openingMinor, day1.closingMinor, 'one day closes where the next opens');
});

test('a statement covers only its own runner', () => {
  const op = withRunner();
  op.buyFloat({ id: 'f2', at: `${DAY1}T09:00:00Z`, agentId: 'ag-2', paidMinor: 1_000_00, floatMinor: 1_000_00 });
  op.cashIn({ id: 'i', at: `${DAY1}T10:00:00Z`, agentId: 'ag-2', playerId: 'p-1', amountMinor: 500_00 });

  const one = op.agentStatement('ag-1');
  assert.equal(one.movements.sales, 0, "ag-2's sale does not appear on ag-1's statement");
  assert.equal(one.commissionMinor, 500_00);
  assert.equal(op.agentStatement('ag-2').commissionMinor, 0, 'ag-2 bought float at no discount');
});

test('an unknown runner gets an empty statement rather than an error', () => {
  const op = withRunner();
  const st = op.agentStatement('nobody');
  assert.equal(st.closingMinor, 0);
  assert.equal(st.reconciles, true);
  assert.equal(st.suspended, false);
});

// ------------------------------------------------------------- suspension

test('a suspended runner cannot sell, but can still settle up', () => {
  const op = withRunner();
  // A player funded before the suspension, so there is a real balance to pay out.
  op.cashIn({ id: 'pre', at: `${DAY1}T10:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.suspendAgent({ id: 'sus', at: `${DAY1}T13:00:00Z`, agentId: 'ag-1', reason: 'did not reconcile' });

  // Selling in any form is refused.
  assert.throws(
    () => op.cashIn({ id: 'x1', at: `${DAY1}T14:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 }),
    /suspended: did not reconcile/
  );
  assert.throws(
    () => op.issueVoucher({ id: 'x2', at: `${DAY1}T14:00:00Z`, agentId: 'ag-1', voucherId: 'VC-9', amountMinor: 100_00 }),
    /suspended/
  );
  assert.throws(
    () => op.buyFloat({ id: 'x3', at: `${DAY1}T14:00:00Z`, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 }),
    /suspended/
  );

  // But a suspension must never strand float or leave a winner unpaid: paying
  // out and cashing float back in both stay open.
  op.cashPayout({ id: 'ok1', at: `${DAY1}T15:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00, commissionMinor: 2_00 });
  op.sellFloatBack({ id: 'ok2', at: `${DAY1}T16:00:00Z`, agentId: 'ag-1', amountMinor: 5_000_00 });

  const st = op.agentStatement('ag-1');
  assert.equal(st.suspended, true);
  assert.equal(st.movements.payouts, 102_00);
  assert.equal(st.movements.redemptions, -5_000_00);
  assert.equal(st.closingMinor, op.ledger.balance('AGENT_FLOAT:ag-1'));
  assert.equal(op.ledger.trialBalance().balanced, true);
});

test('suspension and reinstatement are append-only facts, and each happens once', () => {
  const op = withRunner();
  op.suspendAgent({ id: 's1', at: `${DAY1}T13:00:00Z`, agentId: 'ag-1', reason: 'audit' });

  assert.throws(() => op.suspendAgent({ id: 's2', at: `${DAY1}T14:00:00Z`, agentId: 'ag-1' }), /already suspended/);
  assert.throws(() => op.reinstateAgent({ id: 'r0', at: AT, agentId: 'nobody' }), /Unknown agent/);
  assert.throws(() => op.suspendAgent({ id: 's3', at: AT, agentId: 'nobody' }), /Unknown agent/);

  op.reinstateAgent({ id: 'r1', at: `${DAY2}T09:00:00Z`, agentId: 'ag-1' });
  assert.throws(() => op.reinstateAgent({ id: 'r2', at: `${DAY2}T10:00:00Z`, agentId: 'ag-1' }), /is not suspended/);

  // Selling works again, and the history of both decisions survives.
  op.cashIn({ id: 'i', at: `${DAY2}T11:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  const kinds = op.ledger.events.map((e) => e.kind);
  assert.ok(kinds.includes('AGENT_SUSPENDED') && kinds.includes('AGENT_REINSTATED'));
});

test('a suspension is visible to a concurrent sale, because the guard reads under the lock', () => {
  const op = withRunner();
  // Same-process proof of ordering: the guard reads agent state inside the
  // write transaction, so a sale posted after the suspension cannot slip past
  // a stale read. The cross-process version of this is concurrency.test.js.
  op.suspendAgent({ id: 's', at: `${DAY1}T13:00:00Z`, agentId: 'ag-1' });
  assert.throws(() => op.cashIn({ id: 'i', at: `${DAY1}T13:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1 }), /suspended/);
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1'), 10_000_00, 'nothing moved');
});

// ------------------------------------------------------------ the roster

test('the roster finds a runner at exactly zero, which no balance row would', () => {
  const op = withRunner();
  op.sellFloatBack({ id: 's', at: `${DAY1}T19:00:00Z`, agentId: 'ag-1', amountMinor: 10_000_00 });
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1'), 0);

  // A snapshot only lists non-zero balances, so the runner who most needs a
  // top-up is exactly the one it cannot see.
  const inSnapshot = op.ledger.snapshot().some((row) => row.account === 'AGENT_FLOAT:ag-1');
  assert.equal(inSnapshot, false);

  const low = op.agentsBelow(1_00);
  assert.equal(low.length, 1);
  assert.equal(low[0].agentId, 'ag-1');
  assert.equal(low[0].floatMinor, 0);
});

test('runners below the threshold come back poorest first (F4)', () => {
  const op = withRunner();
  op.buyFloat({ id: 'f2', at: AT, agentId: 'ag-2', paidMinor: 5_00, floatMinor: 5_00 });
  op.buyFloat({ id: 'f3', at: AT, agentId: 'ag-3', paidMinor: 1_00, floatMinor: 1_00 });

  const low = op.agentsBelow(10_00).map((a) => a.agentId);
  assert.deepEqual(low, ['ag-3', 'ag-2'], 'the runner closest to stopping sales is first');
  assert.deepEqual(op.agentsBelow(0), [], 'nobody is below zero');
  assert.equal(op.agents().length, 3);
});

// ------------------------------------------- the statement against a day

test('a full trading day reconciles line by line, through a draw', () => {
  const op = withRunner();
  const draw = openTestDraw(op, { at: `${DAY1}T08:00:00Z`, drawAt: `${DAY1}T19:00:00Z` });

  op.cashIn({ id: 'i1', at: `${DAY1}T10:00:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.placeBet({ id: 'b1', at: `${DAY1}T11:00:00Z`, betId: 'b1', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 100_00, selection: null });
  draw.reveal();
  op.settleDraw({ id: 'st', at: `${DAY1}T19:01:00Z`, drawKey: draw.drawKey, evaluate: payTo({ b1: 50_00 }) });
  op.cashPayout({ id: 'o1', at: `${DAY1}T19:30:00Z`, agentId: 'ag-1', playerId: 'p-1', amountMinor: 50_00, commissionMinor: 1_00 });

  const st = op.agentStatement('ag-1', { from: `${DAY1}T00:00:00Z`, to: `${DAY2}T00:00:00Z` });

  // The draw itself never touches the runner's float - the whole point of the
  // model - so it appears nowhere on their statement.
  assert.equal(st.movements.other, 0);
  assert.equal(st.openingMinor + st.netMinor, st.closingMinor);
  assert.equal(st.closingMinor, op.ledger.balance('AGENT_FLOAT:ag-1'));
  assert.equal(op.ledger.solvency().ok, true);
});
