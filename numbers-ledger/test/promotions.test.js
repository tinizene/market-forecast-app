'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');
const draws = require('../src/draws.js');
const { openTestDraw, payTo } = require('./helpers.js');

// The prototype's real rules, so a free ticket settles exactly as a paid bet
// does - which is the property T11 exists to guarantee.
const game = require('../../africa-numbers/game.js');

const AT = '2026-08-26T08:00:00Z';
const OPENS = '2026-08-27T00:00:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';

function funded(options = {}) {
  const op = new Operator(options);
  op.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  return op;
}

// ------------------------------------------------------------ T10: issuing

test('a free ticket costs the campaign and owes the player', () => {
  const op = funded();
  op.issueFreeTicket({ id: 't10', at: AT, campaignId: 'every-tenth', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });

  assert.equal(op.ledger.balance('PROMO_EXPENSE:every-tenth'), 1_00);
  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 1_00);
  // The wallet is untouched: a grant is not spendable money.
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0);
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.equation().holds, true);
});

test('each campaign reports its own cost', () => {
  const op = funded();
  op.issueFreeTicket({ id: 'a', at: AT, campaignId: 'every-tenth', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });
  op.issueFreeTicket({ id: 'b', at: AT, campaignId: 'every-tenth', ticketId: 'FT-2', playerId: 'p-2', faceMinor: 1_00 });
  op.issueFreeTicket({ id: 'c', at: AT, campaignId: 'dry-run', ticketId: 'FT-3', playerId: 'p-3', faceMinor: 2_00 });

  assert.equal(op.promoStatement('every-tenth').spentMinor, 2_00);
  assert.equal(op.promoStatement('dry-run').spentMinor, 2_00);
  // The control account is the sum of its partitions.
  assert.equal(op.ledger.controlBalance('PROMO_EXPENSE'), 4_00);
});

test('a ticket id cannot be issued twice, and a retry is a no-op', () => {
  const op = funded();
  op.issueFreeTicket({ id: 'x', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });

  // Same transaction id: an idempotent retry, not an error.
  assert.equal(op.issueFreeTicket({ id: 'x', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 }).posted, false);
  // Different transaction, same ticket: refused.
  assert.throws(
    () => op.issueFreeTicket({ id: 'y', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 }),
    /already exists/
  );
  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 1_00, 'neither attempt issued a second ticket');
});

test('a malformed player id is refused at issue, not at settlement', () => {
  const op = funded();
  assert.throws(
    () => op.issueFreeTicket({ id: 'x', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'not a party id', faceMinor: 1_00 }),
    /Invalid party id/
  );
});

// --------------------------------------------------------- the daily budget

test('the daily promotional cap stops issuance rather than draining the float', () => {
  const op = funded({ promoDailyCapMinor: 5_00 });
  for (const n of [1, 2, 3, 4, 5]) {
    op.issueFreeTicket({ id: `t${n}`, at: AT, campaignId: 'c', ticketId: `FT-${n}`, playerId: 'p-1', faceMinor: 1_00 });
  }

  assert.throws(
    () => op.issueFreeTicket({ id: 't6', at: AT, campaignId: 'c', ticketId: 'FT-6', playerId: 'p-1', faceMinor: 1_00 }),
    /budget for 2026-08-26 is .*5\.00.*already issued/
  );

  // The rejected attempt wrote nothing: not the entry, not the ticket, and not
  // the day's counter. A guard that half-commits is worse than none.
  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 5_00);
  assert.equal(op.ledger.readState('freeTicket', 'FT-6'), null);
  assert.equal(op.ledger.trialBalance().balanced, true);

  // The cap is per day, so the next day starts clean.
  op.issueFreeTicket({ id: 't7', at: '2026-08-27T00:30:00Z', campaignId: 'c', ticketId: 'FT-7', playerId: 'p-1', faceMinor: 1_00 });
  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 6_00);
});

test('the cap counts the whole day, whatever hour a ticket is issued', () => {
  const op = funded({ promoDailyCapMinor: 2_00 });
  op.issueFreeTicket({ id: 'a', at: '2026-08-26T00:00:01Z', campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });
  op.issueFreeTicket({ id: 'b', at: '2026-08-26T23:59:59Z', campaignId: 'c', ticketId: 'FT-2', playerId: 'p-1', faceMinor: 1_00 });
  assert.throws(
    () => op.issueFreeTicket({ id: 'c', at: '2026-08-26T12:00:00Z', campaignId: 'c', ticketId: 'FT-3', playerId: 'p-1', faceMinor: 1_00 }),
    /budget for 2026-08-26/
  );
});

// ----------------------------------------------------------- T11: redeeming

test('a free ticket becomes a stake without ever touching the wallet', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.issueFreeTicket({ id: 't10', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });
  op.redeemFreeTicket({ id: 't11', at: OPENS, ticketId: 'FT-1', betId: 'b-free', drawKey: draw.drawKey, selection: { type: 'straight', digits: '472' } });

  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 0, 'the promise is discharged');
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 1_00, 'and became a stake');
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0, 'no cash-out route');
  assert.equal(op.ledger.readState('bet', 'b-free').free, true);
  assert.equal(op.ledger.readState('freeTicket', 'FT-1').betId, 'b-free');
});

test('a free ticket is single use', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.issueFreeTicket({ id: 't10', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });
  op.redeemFreeTicket({ id: 'r1', at: OPENS, ticketId: 'FT-1', betId: 'b1', drawKey: draw.drawKey });

  assert.throws(
    () => op.redeemFreeTicket({ id: 'r2', at: OPENS, ticketId: 'FT-1', betId: 'b2', drawKey: draw.drawKey }),
    /already played by p-1/
  );
  assert.throws(
    () => op.redeemFreeTicket({ id: 'r3', at: OPENS, ticketId: 'NOPE', betId: 'b3', drawKey: draw.drawKey }),
    /Unknown free ticket/
  );
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 1_00);
});

test('a free ticket obeys the cutoff exactly as a paid bet does (F19)', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.issueFreeTicket({ id: 'a', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });
  op.issueFreeTicket({ id: 'b', at: AT, campaignId: 'c', ticketId: 'FT-2', playerId: 'p-1', faceMinor: 1_00 });

  // At the cutoff instant the window is already closed - it is half-open.
  assert.throws(
    () => op.redeemFreeTicket({ id: 'r1', at: draw.cutoffAt, ticketId: 'FT-1', betId: 'b1', drawKey: draw.drawKey }),
    /closed at/
  );

  draw.reveal();
  // A grant earned before the cutoff does not license a stake after the reveal.
  assert.throws(
    () => op.redeemFreeTicket({ id: 'r2', at: OPENS, ticketId: 'FT-1', betId: 'b1', drawKey: draw.drawKey }),
    /already been drawn/
  );
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 0);
  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 2_00, 'both tickets are still owed');
});

test('a free bet settles by the same rules and pays the same as a paid one', () => {
  const op = funded();
  const seed = draws.createSeed();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT, seed });
  const result = draw.result;

  // One paid bet and one free ticket, on the same winning number.
  op.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  op.cashIn({ id: 'in', at: OPENS, agentId: 'ag-1', playerId: 'p-paid', amountMinor: 10_00 });
  op.placeBet({ id: 'p', at: OPENS, betId: 'b-paid', playerId: 'p-paid', drawKey: draw.drawKey, stakeMinor: 1_00, selection: { type: 'straight', digits: result } });

  op.issueFreeTicket({ id: 't10', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-free', faceMinor: 1_00 });
  op.redeemFreeTicket({ id: 't11', at: OPENS, ticketId: 'FT-1', betId: 'b-free', drawKey: draw.drawKey, selection: { type: 'straight', digits: result } });

  draw.reveal();
  const byGameRules = (bet, drawn) =>
    game.isHit({ type: bet.selection.type, digits: bet.selection.digits }, drawn)
      ? game.quote(bet.selection.type, bet.stakeMinor).netCents
      : 0;
  const settled = op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: byGameRules });

  assert.equal(settled.winners, 2);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-free'), 500_00, 'a free ticket wins the same $500');
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-paid'), 9_00 + 500_00);

  // Revenue is grossed up by the free stake and the matching expense was
  // recognised at issue, so the promotion nets to its true cost, not its face.
  assert.equal(settled.totalStakes, 2_00);
  assert.equal(op.ledger.balance('STAKES_REVENUE'), 2_00);
  assert.equal(op.ledger.balance('PROMO_EXPENSE:c'), 1_00);
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.equation().holds, true);
});

// ------------------------------------------------------------ T12-T13: pot

test('the jackpot pool is a liability the operator must hold funds against', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  op.cashIn({ id: 'in', at: OPENS, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  op.placeBet({ id: 'b', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 100_00, selection: null });
  draw.reveal();
  op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: payTo({}) });

  const before = op.ledger.solvency().callable;
  op.fundJackpot({ id: 'j', at: '2026-08-27T19:02:00Z', drawKey: draw.drawKey, amountMinor: 1_00 });

  assert.equal(op.ledger.balance('JACKPOT_POOL'), 1_00);
  assert.equal(op.ledger.solvency().callable, before + 1_00, 'the pot counts as callable');
  assert.equal(op.ledger.solvency().ok, true, 'and the operator holds funds against it');
  assert.equal(op.jackpotStatement().poolMinor, 1_00);
});

test('a draw funds the pot once, and only from a final stakes figure', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  op.cashIn({ id: 'in', at: OPENS, agentId: 'ag-1', playerId: 'p-1', amountMinor: 10_00 });
  op.placeBet({ id: 'b', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 1_00, selection: null });

  assert.throws(
    () => op.fundJackpot({ id: 'j0', at: OPENS, drawKey: draw.drawKey, amountMinor: 1_00 }),
    /has not settled/
  );

  draw.reveal();
  op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: payTo({}) });
  op.fundJackpot({ id: 'j1', at: '2026-08-27T19:02:00Z', drawKey: draw.drawKey, amountMinor: 1 });

  assert.throws(
    () => op.fundJackpot({ id: 'j2', at: '2026-08-27T19:03:00Z', drawKey: draw.drawKey, amountMinor: 1 }),
    /already contributed/
  );
  assert.equal(op.ledger.balance('JACKPOT_POOL'), 1);
});

test('winning the pot moves the liability to a wallet and books no new expense', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 1_000_00, floatMinor: 1_000_00 });
  op.cashIn({ id: 'in', at: OPENS, agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00 });
  op.placeBet({ id: 'b', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 500_00, selection: null });
  draw.reveal();
  op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: payTo({}) });
  op.fundJackpot({ id: 'j', at: '2026-08-27T19:02:00Z', drawKey: draw.drawKey, amountMinor: 5_00 });

  const expenseBefore = op.ledger.balance('JACKPOT_CONTRIBUTION');
  op.payJackpot({ id: 'w', at: '2026-08-27T19:05:00Z', drawKey: draw.drawKey, playerId: 'p-1', amountMinor: 5_00 });

  assert.equal(op.ledger.balance('JACKPOT_POOL'), 0);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 5_00);
  assert.equal(op.ledger.balance('JACKPOT_CONTRIBUTION'), expenseBefore, 'the cost was booked as the pot was built');
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.equation().holds, true);
});

test('the pot cannot be overpaid, paid twice, or paid before the reveal', () => {
  const op = funded();
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  op.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  op.cashIn({ id: 'in', at: OPENS, agentId: 'ag-1', playerId: 'p-1', amountMinor: 10_00 });
  op.placeBet({ id: 'b', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 1_00, selection: null });

  assert.throws(
    () => op.payJackpot({ id: 'w0', at: OPENS, drawKey: draw.drawKey, playerId: 'p-1', amountMinor: 1 }),
    /has not been revealed/
  );

  draw.reveal();
  op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: payTo({}) });
  op.fundJackpot({ id: 'j', at: '2026-08-27T19:02:00Z', drawKey: draw.drawKey, amountMinor: 1_00 });

  assert.throws(
    () => op.payJackpot({ id: 'w1', at: '2026-08-27T19:05:00Z', drawKey: draw.drawKey, playerId: 'p-1', amountMinor: 2_00 }),
    /pool holds .*1\.00.*cannot pay/
  );
  op.payJackpot({ id: 'w2', at: '2026-08-27T19:05:00Z', drawKey: draw.drawKey, playerId: 'p-1', amountMinor: 1_00 });
  assert.throws(
    () => op.payJackpot({ id: 'w3', at: '2026-08-27T19:06:00Z', drawKey: draw.drawKey, playerId: 'p-1', amountMinor: 1 }),
    /already paid its jackpot/
  );
});

// ----------------------------------------------------------- solvency (F16)

test('promising more than the operator holds fails the solvency check (F16)', () => {
  // Capital of exactly 10.00, and a promotion that gives away 12.00 of it.
  const op = new Operator();
  op.injectCapital({ id: 'cap', at: AT, amountMinor: 10_00 });
  assert.equal(op.ledger.solvency().ok, true);

  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    op.issueFreeTicket({ id: `t${n}`, at: AT, campaignId: 'c', ticketId: `FT-${n}`, playerId: 'p-1', faceMinor: 1_00 });
  }
  assert.equal(op.ledger.solvency().ok, true, 'exactly covered, with no headroom left');
  assert.equal(op.ledger.solvency().headroom, 0);

  op.issueFreeTicket({ id: 't11', at: AT, campaignId: 'c', ticketId: 'FT-11', playerId: 'p-1', faceMinor: 2_00 });
  const check = op.ledger.solvency();
  assert.equal(check.ok, false, 'a promise beyond capital is caught before it can be redeemed');
  assert.equal(check.headroom, -2_00);
  // The books still balance - insolvency is not a bookkeeping error.
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.equation().holds, true);
});
