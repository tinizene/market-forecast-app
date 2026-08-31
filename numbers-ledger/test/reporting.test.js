'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { Operator } = require('../src/operator.js');
const { Reports, toCsv, dayWindow } = require('../src/reporting.js');
const { openTestDraw, payTo } = require('./helpers.js');

const DAY = '2026-08-27';
const T = (time) => `${DAY}T${time}:00.000Z`;
const YESTERDAY = '2026-08-26T12:00:00.000Z';
const TOMORROW = '2026-08-28T09:00:00.000Z';

/**
 * One trading day, built from real transactions rather than fixtures, so the
 * figures the reports produce are the figures the ledger actually holds.
 *
 *   yesterday  capital funded, a runner buys float
 *   09:00      the runner sells float to two players
 *   10:00      three bets, one of them on a free ticket
 *   19:05      the draw settles: one winner
 *   19:30      commission, tax, jackpot funding
 */
function tradingDay({ settle = true } = {}) {
  const op = new Operator();
  op.injectCapital({ id: 'cap', at: YESTERDAY, amountMinor: 1_000_000_00 });
  op.buyFloat({ id: 'float-1', at: YESTERDAY, agentId: 'ag-1', paidMinor: 9_500_00, floatMinor: 10_000_00 });

  const draw = openTestDraw(op, { drawKey: 'D1', drawAt: T('19:00'), at: YESTERDAY });

  op.cashIn({ id: 'in-1', at: T('09:00'), agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00 });
  op.cashIn({ id: 'in-2', at: T('09:05'), agentId: 'ag-1', playerId: 'p-2', amountMinor: 300_00 });

  op.placeBet({ id: 'b1', at: T('10:00'), betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 100_00 });
  op.placeBet({ id: 'b2', at: T('10:05'), betId: 'b2', playerId: 'p-2', drawKey: 'D1', stakeMinor: 50_00 });

  // A promotional stake: the operator received nothing for this one.
  op.issueFreeTicket({
    id: 'ft-1', at: T('09:30'), campaignId: 'welcome', ticketId: 't-1', playerId: 'p-2', faceMinor: 20_00
  });
  op.redeemFreeTicket({ id: 'ft-redeem', at: T('10:10'), ticketId: 't-1', betId: 'b3', drawKey: 'D1' });

  if (settle) {
    draw.reveal(T('19:00'));
    op.settleDraw({
      id: 'settle-1', at: T('19:05'), drawKey: 'D1',
      // b1 wins 300.00; the other two lose.
      evaluate: payTo({ b1: 300_00 })
    });
    op.cashPayout({
      id: 'pay-1', at: T('19:30'), agentId: 'ag-1', playerId: 'p-1',
      amountMinor: 200_00, commissionMinor: 4_00
    });
    op.fundJackpot({ id: 'jack-1', at: T('19:40'), drawKey: 'D1', amountMinor: 1_70 });
    op.accrueGamingTax({ id: 'tax-1', at: T('19:45'), amountMinor: 10_00 });
  }

  return { op, draw, reports: new Reports({ ledger: op.ledger, operator: op }) };
}

const value = (report, key) => report.lines.find((l) => l.key === key).minor;
const check = (report, key) => report.checks.find((c) => c.key === key);

// ------------------------------------------------------------------ windows

test('a day is half-open, so two consecutive closes cannot claim one transaction', () => {
  const { from, to } = dayWindow(DAY);
  assert.equal(from, '2026-08-27T00:00:00.000Z');
  assert.equal(to, '2026-08-28T00:00:00.000Z');

  const { reports } = tradingDay();
  const today = reports.dailyClose({ day: DAY });
  const tomorrow = reports.dailyClose({ day: '2026-08-28' });

  // Everything happened today; tomorrow's close is empty of movement but
  // still carries the position it inherited.
  assert.equal(value(today, 'handle'), 170_00);
  assert.equal(value(tomorrow, 'handle'), 0);
  assert.equal(value(tomorrow, 'settlementOpening'), value(today, 'settlementClosing'));
});

/**
 * The boundary itself, which is where half-open either holds or does not.
 * A transaction stamped at exactly midnight belongs to the day that is
 * starting, never to the one that just ended - otherwise two consecutive
 * closes both claim it and the year does not add up.
 */
test('a transaction at exactly midnight belongs to the day beginning', () => {
  const { op, reports } = tradingDay();
  op.injectCapital({ id: 'midnight', at: '2026-08-28T00:00:00.000Z', amountMinor: 7_00 });

  const before = reports.dailyClose({ day: DAY });
  const after = reports.dailyClose({ day: '2026-08-28' });

  assert.equal(value(before, 'settlementMoved'), 0, 'not in the day that ended');
  assert.equal(value(after, 'settlementMoved'), 7_00, 'in the day that began');
  // And it is not in both, which is the failure the half-open window prevents.
  assert.equal(value(before, 'settlementClosing'), value(after, 'settlementOpening'));
});

test('a malformed day is refused rather than interpreted', () => {
  const { reports } = tradingDay();
  for (const day of ['27-08-2026', '2026-8-27', 'yesterday', '', null]) {
    assert.throws(() => reports.dailyClose({ day }), /YYYY-MM-DD/);
  }
});

// -------------------------------------------------------------- daily close

test('handle separates what players paid for from what they were given', () => {
  const { reports } = tradingDay();
  const close = reports.dailyClose({ day: DAY });

  assert.equal(value(close, 'paidHandle'), 150_00);
  assert.equal(value(close, 'freeHandle'), 20_00);
  assert.equal(value(close, 'handle'), 170_00);
});

test('gross gaming revenue is stakes recognised less prizes credited', () => {
  const { reports } = tradingDay();
  const close = reports.dailyClose({ day: DAY });

  assert.equal(value(close, 'stakesRecognised'), 170_00);
  assert.equal(value(close, 'prizes'), 300_00);
  assert.equal(value(close, 'ggr'), -130_00, 'a day one player won big on is a day the operator lost');
});

/**
 * Handle and revenue are about different bets, and a report that let them be
 * added together would be inviting the mistake. A bet taken on a day whose
 * draw has not run yet is handle, and no revenue at all.
 */
test('a stake taken is handle today and revenue only when its draw settles', () => {
  const { reports } = tradingDay({ settle: false });
  const close = reports.dailyClose({ day: DAY });

  assert.equal(value(close, 'handle'), 170_00);
  assert.equal(value(close, 'stakesRecognised'), 0);
  assert.equal(value(close, 'ggr'), 0);
  // And it is owed, not earned.
  assert.equal(close.totals.callable > 0, true);
});

test('every movement of real money has a named cause', () => {
  const { reports } = tradingDay();
  const close = reports.dailyClose({ day: DAY });

  // Nothing moved real money today: float was bought yesterday, and the
  // winner was paid in the runner's own cash.
  assert.equal(value(close, 'settlementMoved'), 0);
  assert.equal(check(close, 'cash-explained').ok, true);
  assert.equal(check(close, 'cash-adds-up').ok, true);

  const yesterday = reports.dailyClose({ day: '2026-08-26' });
  assert.equal(value(yesterday, 'settlementMoved'), 1_000_000_00 + 9_500_00);
  const causes = yesterday.tables[0].rows.map((row) => row[0]);
  assert.deepEqual(causes, ['Capital injected', 'Float sold to runners']);
  assert.equal(check(yesterday, 'cash-explained').ok, true);
});

/**
 * The point of the `other` bucket. A transaction kind the report has never
 * heard of must show up as unexplained, not vanish into a subtotal.
 */
test('a movement of real money the report cannot name is called unexplained', () => {
  const { op } = tradingDay();
  const reports = new Reports({ ledger: op.ledger, operator: op });

  // Post directly, with a kind the cash map does not know.
  op.ledger.post({
    id: 'mystery', kind: 'SOMETHING_NEW', at: T('20:00'),
    entries: [{ account: 'SETTLEMENT', debit: 5_00 }, { account: 'OPERATOR_CAPITAL', credit: 5_00 }]
  });

  const close = reports.dailyClose({ day: DAY });
  assert.equal(check(close, 'cash-explained').ok, false);
  assert.match(check(close, 'cash-explained').detail, /unexplained/);
  const unexplained = close.tables[0].rows.find((row) => row[0] === 'Unexplained movement');
  assert.ok(unexplained, 'and it is on the face of the report, not only in the check');
  // It still adds up: the report is incomplete, not wrong.
  assert.equal(check(close, 'cash-adds-up').ok, true);
});

test('the closing position is as at the close, not as at now', () => {
  const { op, reports } = tradingDay();
  const close = reports.dailyClose({ day: DAY });
  const settlementThatDay = value(close, 'settlementClosing');

  // Something happens the next morning. Yesterday's close must not move.
  op.injectCapital({ id: 'cap-2', at: TOMORROW, amountMinor: 50_000_00 });
  const again = reports.dailyClose({ day: DAY });

  assert.equal(value(again, 'settlementClosing'), settlementThatDay);
  assert.equal(op.ledger.balance('SETTLEMENT'), settlementThatDay + 50_000_00);
});

test('opening plus movement equals closing', () => {
  const { reports } = tradingDay();
  for (const day of ['2026-08-26', DAY, '2026-08-28']) {
    const close = reports.dailyClose({ day });
    assert.equal(
      value(close, 'settlementOpening') + value(close, 'settlementMoved'),
      value(close, 'settlementClosing'),
      day
    );
  }
});

// ------------------------------------------------------------------ revenue

test('the per-draw table reconciles with the journal', () => {
  const { reports } = tradingDay();
  const revenue = reports.revenue({ from: dayWindow(DAY).from, to: dayWindow(DAY).to });

  assert.equal(revenue.totals.stakes, 170_00);
  assert.equal(revenue.totals.prizes, 300_00);
  assert.equal(revenue.totals.ggr, -130_00);
  assert.equal(revenue.totals.draws, 1);
  assert.equal(check(revenue, 'draws-reconcile').ok, true);

  const row = revenue.tables[0].rows[0];
  assert.equal(row[0], 'D1');
  assert.equal(row[3], '3', 'three bets settled');
  assert.equal(row[4], '1', 'one winner');
});

/**
 * The summary each draw records at settlement is what makes a per-draw table
 * possible at all - the journal cannot say which draw a SETTLE_DRAW belonged
 * to. Trusting it without checking would be trusting a stored total, which is
 * exactly what the rest of this system refuses to do.
 */
test('a draw summary that disagrees with the journal fails the check', () => {
  const { op, reports } = tradingDay();
  const stored = op.ledger.readState('draw', 'D1');
  op.ledger.event({
    id: 'tamper', kind: 'TAMPER', at: T('23:00'), data: {}
  }, {
    onCommit: (s) => s.putState('draw', 'D1', { ...stored, totalPayout: 1_00 })
  });

  const revenue = reports.revenue({ from: dayWindow(DAY).from, to: dayWindow(DAY).to });
  assert.equal(check(revenue, 'draws-reconcile').ok, false);
});

test('hold is reported as a share of stakes, and not at all without stakes', () => {
  const { reports } = tradingDay();
  const withStakes = reports.revenue({ from: dayWindow(DAY).from, to: dayWindow(DAY).to });
  assert.equal(withStakes.lines.find((l) => l.key === 'hold').formatted, '-76.5%');

  const empty = reports.revenue({ from: '2026-09-01T00:00:00Z', to: '2026-09-02T00:00:00Z' });
  assert.equal(empty.lines.find((l) => l.key === 'hold').formatted, '-');
});

// ----------------------------------------------------------------- tax base

test('the three candidate tax bases are reported side by side', () => {
  const { reports } = tradingDay();
  const tax = reports.taxBase({ ...dayWindow(DAY), ratePercent: 10 });

  const [allStakes, paidStakes, ggr] = tax.totals.bases;
  assert.equal(allStakes.baseMinor, 170_00);
  assert.equal(paidStakes.baseMinor, 150_00);
  assert.equal(ggr.baseMinor, -130_00);

  // 10% of each base, rounded once at the end.
  assert.equal(allStakes.taxMinor, 17_00);
  assert.equal(paidStakes.taxMinor, 15_00);
});

/**
 * The whole reason this report exists. If tax is levied on stakes, the
 * promotional tickets are taxed on money the operator never received - and
 * the report names the amount rather than leaving it to be discovered.
 */
test('the gap between taxing all stakes and taxing paid stakes is stated', () => {
  const { reports } = tradingDay();
  const tax = reports.taxBase({ ...dayWindow(DAY), ratePercent: 10 });

  const gap = tax.totals.bases[0].taxMinor - tax.totals.bases[1].taxMinor;
  assert.equal(gap, 2_00, '10% of the 20.00 of stakes nobody paid for');
  assert.match(check(tax, 'promotional-gap').detail, /20\.00/);
});

/**
 * The day in this fixture is one the operator lost money on. A tax computed
 * on gross gaming revenue must then be nil, not a refund - no regime this
 * would be licensed under pays the operator for a bad night, and a negative
 * figure on the page would be answering the carry-forward question quietly
 * and wrongly.
 */
test('a negative base is taxed at nil, not at a credit', () => {
  const { reports } = tradingDay();
  const tax = reports.taxBase({ ...dayWindow(DAY), ratePercent: 15 });
  const ggr = tax.totals.bases[2];

  assert.equal(ggr.baseMinor, -130_00);
  assert.equal(ggr.taxMinor, 0);
  assert.match(ggr.note, /carries forward is undecided/);
});

test('without a rate the report shows the bases and no tax', () => {
  const { reports } = tradingDay();
  const tax = reports.taxBase(dayWindow(DAY));
  assert.equal(tax.totals.bases[0].taxMinor, null);
  assert.equal(tax.tables[0].columns[2], 'Tax');
  assert.throws(() => reports.taxBase({ ...dayWindow(DAY), ratePercent: -1 }), /non-negative/);
});

test('accrued tax and the outstanding payable are different numbers', () => {
  const { reports } = tradingDay();
  const tax = reports.taxBase(dayWindow(DAY));
  assert.equal(value(tax, 'accrued'), 10_00);
  assert.equal(value(tax, 'payable'), 10_00);

  // Gaming tax is owed to an authority, not callable by a player, so it sits
  // outside the solvency check.
  const liabilities = reports.liabilities({});
  assert.equal(liabilities.totals.callable, liabilities.tables[0].rows
    .reduce((sum, row) => sum + Number(row[1].replace(/[^0-9.-]/g, '')) * 100, 0));
  assert.ok(liabilities.tables[1].rows.some((row) => row[0] === 'Gaming tax payable'));
});

// --------------------------------------------------------------- promotions

test('promotional cost is reported per campaign and reconciles to the expense', () => {
  const { reports } = tradingDay();
  const promo = reports.promotions(dayWindow(DAY));

  assert.equal(promo.totals.spent, 20_00);
  assert.equal(promo.totals.issued, 1);
  assert.equal(promo.totals.redeemed, 1);
  assert.equal(promo.totals.outstanding, 0, 'issued and redeemed the same day');
  assert.equal(promo.totals.jackpotFunded, 1_70);
  assert.equal(promo.totals.jackpotPool, 1_70);
  assert.deepEqual(promo.tables[0].rows, [['welcome', 'L$20.00']]);
  assert.equal(check(promo, 'promo-cost-matches').ok, true);
});

test('an unredeemed free ticket is still owed at the close', () => {
  const { op, reports } = tradingDay();
  op.issueFreeTicket({
    id: 'ft-2', at: T('20:00'), campaignId: 'loyalty', ticketId: 't-2', playerId: 'p-1', faceMinor: 15_00
  });

  const promo = reports.promotions(dayWindow(DAY));
  assert.equal(promo.totals.outstanding, 15_00);
  assert.equal(promo.totals.spent, 35_00);
  assert.deepEqual(promo.tables[0].rows.map((r) => r[0]).sort(), ['loyalty', 'welcome']);

  // And it is inside the solvency check, because it is a promise to pay.
  const liabilities = reports.liabilities({});
  assert.ok(liabilities.tables[0].rows.some((row) => row[0] === 'Unredeemed free tickets'));
});

// -------------------------------------------------------------- liabilities

test('liabilities are split by whether a player can call them', () => {
  const { reports } = tradingDay();
  const report = reports.liabilities({});

  assert.equal(report.totals.headroom, report.totals.settlement - report.totals.callable);
  assert.equal(check(report, 'solvent').ok, true);
  assert.ok(report.tables[0].rows.some((row) => row[0] === 'Player wallets'));
  assert.ok(report.tables[1].rows.some((row) => row[0] === 'Gaming tax payable'));
});

test('liabilities as at a past moment ignore what happened after it', () => {
  const { op, reports } = tradingDay();
  const before = reports.liabilities({ at: T('09:00') });
  const after = reports.liabilities({ at: TOMORROW });

  // At 09:00 the first cash-in has not happened yet - the window is half-open.
  assert.equal(before.totals.callable, 10_000_00, 'only the runner float');
  assert.ok(after.totals.callable !== before.totals.callable);
  assert.equal(op.ledger.balance('AGENT_FLOAT:ag-1') >= 0, true);
});

// ---------------------------------------------------------------- balancesAt

test('balances recomputed at a moment agree with the ledger when that moment is now', () => {
  const { op, reports } = tradingDay();
  const recomputed = reports.balancesAt(null);

  for (const row of recomputed.accounts) {
    assert.equal(row.minor, op.ledger.balance(row.account), row.account);
  }
  assert.equal(recomputed.accounts.length, op.ledger.snapshot().length);
});

// ----------------------------------------------------------------------- CSV

test('a report survives being turned into CSV', () => {
  const { reports } = tradingDay();
  const csv = toCsv(reports.dailyClose({ day: DAY }));

  const lines = csv.split('\r\n');
  assert.equal(lines[0], '"daily-close","2026-08-27T00:00:00.000Z","2026-08-28T00:00:00.000Z"');
  assert.ok(csv.includes('"Gross gaming revenue"'));
  assert.ok(csv.includes('"Real money movement"'));
  assert.ok(csv.includes('"Check","Result","Detail"'));
});

/**
 * A campaign id or a note containing a comma or a quote must not become two
 * columns in an accountant's spreadsheet.
 */
test('CSV quoting survives a field that contains a comma and a quote', () => {
  const { op } = tradingDay();
  op.issueFreeTicket({
    id: 'ft-odd', at: T('21:00'), campaignId: 'q3-launch', ticketId: 't-9', playerId: 'p-1', faceMinor: 1_00
  });
  const reports = new Reports({ ledger: op.ledger, operator: op });

  const report = reports.promotions(dayWindow(DAY));
  report.tables[0].rows.push(['a "quoted", comma-ed name', 'L$0.00']);
  const csv = toCsv(report);

  assert.ok(csv.includes('"a ""quoted"", comma-ed name","L$0.00"'));
  // Every field is quoted, so a bare comma can never split a column.
  for (const line of csv.split('\r\n')) {
    if (line === '') continue;
    assert.match(line, /^"/, line);
  }
});
