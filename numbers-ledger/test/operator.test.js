'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');

const AT = '2026-08-27T08:00:00Z';

/** An operator with capital and one funded runner. */
function funded({ capital = 5_000_00, paid = 9_500_00, float = 10_000_00 } = {}) {
  const op = new Operator();
  op.injectCapital({ id: 'cap-1', at: AT, amountMinor: capital });
  op.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: paid, floatMinor: float });
  return op;
}

test('T1 - buying float credits the runner and books the discount as commission', () => {
  const op = funded();
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1'), 10_000_00);
  assert.equal(op.ledger.balance('AGENT_COMMISSION'), 500_00);
  assert.equal(op.ledger.balance('SETTLEMENT'), 5_000_00 + 9_500_00);
  assert.equal(op.ledger.solvency().ok, true);
});

test('T1 - float cannot exceed money paid plus commission', () => {
  const op = new Operator();
  assert.throws(() => op.buyFloat({ id: 'b', at: AT, agentId: 'ag-1', paidMinor: 100, floatMinor: 99 }), /cannot exceed/);
});

test('T2 - cash-in moves value between two liabilities and touches no asset', () => {
  const op = funded();
  const before = op.ledger.balance('SETTLEMENT');
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });

  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 100_00);
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1'), 9_900_00);
  assert.equal(op.ledger.balance('SETTLEMENT'), before, 'no money moved - the cash is in the runner\'s pocket');
});

test('T2 - a runner cannot sell float they do not hold', () => {
  const op = funded({ paid: 100_00, float: 100_00 });
  assert.throws(
    () => op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_01 }),
    /cannot sell/
  );
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0, 'nothing was credited');
});

test('T3 - a voucher is single use', () => {
  const op = funded();
  op.issueVoucher({ id: 'v-1', at: AT, agentId: 'ag-1', voucherId: 'VC-001', amountMinor: 500_00 });
  assert.equal(op.ledger.balance('UNREDEEMED_VOUCHERS'), 500_00);

  op.redeemVoucher({ id: 'vr-1', at: AT, voucherId: 'VC-001', playerId: 'p-1' });
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 500_00);
  assert.equal(op.ledger.balance('UNREDEEMED_VOUCHERS'), 0);

  assert.throws(() => op.redeemVoucher({ id: 'vr-2', at: AT, voucherId: 'VC-001', playerId: 'p-2' }), /already redeemed/);
  assert.throws(() => op.redeemVoucher({ id: 'vr-3', at: AT, voucherId: 'NOPE', playerId: 'p-2' }), /Unknown voucher/);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-2'), 0);
});

test('T4 - a stake is held, not recognised as revenue', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.placeBet({ id: 'bet-1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: '2026-08-27', stakeMinor: 10_00 });

  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 90_00);
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 10_00);
  assert.equal(op.ledger.balance('STAKES_REVENUE'), 0, 'not revenue until the draw runs');
});

test('T4 - a player cannot stake more than their wallet', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 10_00 });
  assert.throws(
    () => op.placeBet({ id: 'bet-1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: '2026-08-27', stakeMinor: 10_01 }),
    /cannot stake/
  );
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 0);
});

test('T5 - settlement recognises every stake and pays the winners, once', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.cashIn({ id: 'in-2', at: AT, agentId: 'ag-1', playerId: 'p-2', amountMinor: 100_00 });
  op.placeBet({ id: 'bet-1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00 });
  op.placeBet({ id: 'bet-2', at: AT, betId: 'b2', playerId: 'p-2', drawKey: 'D1', stakeMinor: 10_00 });

  const result = op.settleDraw({ id: 's-1', at: AT, drawKey: 'D1', winners: [{ betId: 'b1', payoutMinor: 5_400_00 }] });
  assert.equal(result.totalStakes, 20_00);
  assert.equal(result.betsSettled, 2);
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 0);
  assert.equal(op.ledger.balance('STAKES_REVENUE'), 20_00);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 90_00 + 5_400_00);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-2'), 90_00);

  assert.throws(() => op.settleDraw({ id: 's-2', at: AT, drawKey: 'D1', winners: [] }), /already settled/);
});

test('T5 - replaying the settlement id cannot pay a winner twice', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.placeBet({ id: 'bet-1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00 });

  const first = op.settleDraw({ id: 's-1', at: AT, drawKey: 'D1', winners: [{ betId: 'b1', payoutMinor: 100_00 }] });
  assert.equal(first.posted, true);
  const wallet = op.ledger.balance('PLAYER_WALLET:p-1');

  // A retry of the identical request: the ledger id guard stops it.
  assert.throws(() => op.settleDraw({ id: 's-1', at: AT, drawKey: 'D1', winners: [{ betId: 'b1', payoutMinor: 100_00 }] }), /already settled/);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), wallet);
});

test('T5 - a bet from another draw cannot be paid out', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.placeBet({ id: 'bet-1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00 });
  op.placeBet({ id: 'bet-2', at: AT, betId: 'b2', playerId: 'p-1', drawKey: 'D2', stakeMinor: 10_00 });

  assert.throws(
    () => op.settleDraw({ id: 's-1', at: AT, drawKey: 'D1', winners: [{ betId: 'b2', payoutMinor: 100_00 }] }),
    /belongs to draw D2/
  );
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 20_00, 'the failed settlement wrote nothing');
});

test('T6 - withdrawal is the only path where money leaves, and the fee is the operator\'s', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 5_000_00 });
  const before = op.ledger.balance('SETTLEMENT');

  op.withdrawToMobileMoney({ id: 'w-1', at: AT, playerId: 'p-1', amountMinor: 5_000_00, feeMinor: 50_00 });
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0, 'the player receives the full amount asked for');
  assert.equal(op.ledger.balance('TRANSACTION_FEES'), 50_00);
  assert.equal(op.ledger.balance('SETTLEMENT'), before - 5_050_00);
});

test('T6 - a withdrawal cannot exceed the wallet, nor the funds on hand', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  assert.throws(() => op.withdrawToMobileMoney({ id: 'w', at: AT, playerId: 'p-1', amountMinor: 100_01 }), /cannot withdraw/);

  const broke = new Operator();
  broke.injectCapital({ id: 'c', at: AT, amountMinor: 10_00 });
  broke.buyFloat({ id: 'b', at: AT, agentId: 'ag-1', paidMinor: 10_00, floatMinor: 10_00 });
  broke.cashIn({ id: 'i', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 10_00 });
  assert.throws(() => broke.withdrawToMobileMoney({ id: 'w', at: AT, playerId: 'p-1', amountMinor: 10_00, feeMinor: 50_00 }), /cannot cover/);
});

test('T7 - a cash payout repays the runner in float, moving no operator money', () => {
  const op = funded();
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 2_000_00 });
  const funds = op.ledger.balance('SETTLEMENT');
  const float = op.ledger.balance('AGENT_FLOAT:ag-1');

  op.cashPayout({ id: 'po-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 2_000_00, commissionMinor: 40_00 });
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0);
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1'), float + 2_040_00);
  assert.equal(op.ledger.balance('SETTLEMENT'), funds, 'the runner paid from their own cash');
});

test('T8 - a runner converts float back to money, bounded by both sides', () => {
  const op = funded();
  op.sellFloatBack({ id: 'sb-1', at: AT, agentId: 'ag-1', amountMinor: 1_000_00 });
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1'), 9_000_00);

  assert.throws(() => op.sellFloatBack({ id: 'sb-2', at: AT, agentId: 'ag-1', amountMinor: 9_000_01 }), /cannot redeem/);
  assert.throws(() => op.sellFloatBack({ id: 'sb-3', at: AT, agentId: 'nobody', amountMinor: 1_00 }), /cannot redeem/);
});

test('every guard failure leaves the trial balance intact', () => {
  const op = funded();
  const attempts = [
    () => op.cashIn({ id: 'x1', at: AT, agentId: 'ghost', playerId: 'p-1', amountMinor: 1_00 }),
    () => op.placeBet({ id: 'x2', at: AT, betId: 'bx', playerId: 'p-9', drawKey: 'D', stakeMinor: 1_00 }),
    () => op.withdrawToMobileMoney({ id: 'x3', at: AT, playerId: 'p-9', amountMinor: 1_00 }),
    () => op.redeemVoucher({ id: 'x4', at: AT, voucherId: 'none', playerId: 'p-1' })
  ];
  for (const attempt of attempts) assert.throws(attempt);
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.solvency().ok, true);
});
