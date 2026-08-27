'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');
const { ACCOUNTS } = require('../src/accounts.js');
const { openTestDraw } = require('./helpers.js');
const { createHash } = require('node:crypto');

/**
 * A full trading day, run end to end. This is the milestone-1 question:
 * does value move operator -> runner -> player -> mobile money and reconcile
 * to the unit at close?
 *
 * Deterministic by construction - a seeded generator, no Math.random, no
 * clock - so a failure is reproducible rather than a story about last Tuesday.
 */
function makeRandom(seed) {
  let state = seed >>> 0;
  return function next(max) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % max;
  };
}

const DAY = '2026-08-27';
const at = (n) => new Date(Date.UTC(2026, 7, 27, 8, 0, 0) + n * 1000).toISOString();

function runTradingDay({ seed = 42, agents = 4, players = 40, startingFloatMinor = null } = {}) {
  const rand = makeRandom(seed);
  const op = new Operator();
  let step = 0;
  const next = () => at(step++);

  op.injectCapital({ id: 'cap-1', at: next(), amountMinor: 2_000_000_00, memo: 'opening capital' });

  // The draw is committed before a single bet is taken. Every `at` below falls
  // inside the betting window by construction.
  // Derived from the scenario seed rather than the CSPRNG: a real draw's seed
  // must be unpredictable, but a test day has to be reproducible to be useful.
  const drawSeed = createHash('sha256').update(`scenario-${seed}`).digest('hex');
  const draw = openTestDraw(op, { drawKey: DAY, drawAt: '2026-08-27T19:00:00Z', at: at(0), seed: drawSeed });

  // Runners buy float at a 5% discount.
  const agentIds = [];
  for (let i = 0; i < agents; i++) {
    const agentId = `ag-${i + 1}`;
    agentIds.push(agentId);
    const floatMinor = startingFloatMinor !== null ? startingFloatMinor : (5_000_00 + rand(20) * 1_000_00);
    const paidMinor = Math.round(floatMinor * 0.95);
    op.buyFloat({ id: `buy-${agentId}`, at: next(), agentId, paidMinor, floatMinor });
  }

  /**
   * F4 in the design: a runner sells out of float mid-day. The mitigation is
   * automated 24/7 float purchase, crediting within seconds - so the simulation
   * models that rather than pretending runners never run dry. A day that never
   * exercises this path is not a realistic day.
   */
  let topUps = 0;
  function ensureFloat(agentId, amountMinor) {
    if (op.agentStatement(agentId).floatMinor >= amountMinor) return;
    const floatMinor = Math.max(amountMinor, 5_000_00);
    const paidMinor = Math.round(floatMinor * 0.95);
    op.buyFloat({ id: `topup-${agentId}-${topUps++}`, at: next(), agentId, paidMinor, floatMinor, memo: 'mid-day top-up' });
  }

  // Players top up: most through a runner, some by voucher.
  const playerIds = [];
  for (let i = 0; i < players; i++) {
    const playerId = `p-${i + 1}`;
    playerIds.push(playerId);
    const agentId = agentIds[rand(agentIds.length)];
    const amountMinor = (1 + rand(20)) * 50_00;

    if (rand(4) === 0) {
      const voucherId = `VC-${i + 1}`;
      ensureFloat(agentId, amountMinor);
      op.issueVoucher({ id: `iv-${i}`, at: next(), agentId, voucherId, amountMinor });
      op.redeemVoucher({ id: `rv-${i}`, at: next(), voucherId, playerId });
    } else {
      ensureFloat(agentId, amountMinor);
      op.cashIn({ id: `in-${i}`, at: next(), agentId, playerId, amountMinor });
    }
  }

  // Bets: each player stakes some of what they hold.
  const placed = [];
  for (const playerId of playerIds) {
    const wallet = op.playerStatement(playerId).walletMinor;
    const bets = 1 + rand(3);
    for (let b = 0; b < bets; b++) {
      const stakeMinor = (1 + rand(4)) * 25_00;
      if (op.playerStatement(playerId).walletMinor < stakeMinor) continue;
      const betId = `${playerId}-b${b}`;
      // One bet in twenty picks the number that will actually come up. The
      // result is fixed by the committed seed, so this is a property of the
      // scenario, not the test peeking at an outcome it can change.
      const digits = rand(20) === 0 ? draw.result : String(rand(1000)).padStart(3, '0');
      op.placeBet({ id: `bet-${betId}`, at: next(), betId, playerId, drawKey: DAY, stakeMinor, selection: { digits } });
      placed.push({ betId, playerId, stakeMinor, digits });
    }
    assert.ok(op.playerStatement(playerId).walletMinor <= wallet);
  }

  // Reveal, then settle: payouts are derived from the number that was fixed
  // before betting opened, by the rules, not by a list handed to settlement.
  draw.reveal('2026-08-27T19:00:00Z');
  const settlement = op.settleDraw({
    id: `settle-${DAY}`, at: '2026-08-27T19:01:00Z', drawKey: DAY,
    evaluate: (bet, result) => (bet.selection && bet.selection.digits === result ? bet.stakeMinor * 540 : 0)
  });
  const winners = placed.filter((b) => b.digits === draw.result);

  // Winners take their money out: half to mobile money, half in cash at a runner.
  let cashOuts = 0;
  let mobileOuts = 0;
  for (const [i, winner] of winners.entries()) {
    const { playerId } = placed.find((b) => b.betId === winner.betId);
    const wallet = op.playerStatement(playerId).walletMinor;
    if (wallet === 0) continue;

    if (i % 2 === 0) {
      op.withdrawToMobileMoney({ id: `wd-${i}`, at: next(), playerId, amountMinor: wallet, feeMinor: 50 });
      mobileOuts++;
    } else {
      const agentId = agentIds[rand(agentIds.length)];
      op.cashPayout({ id: `cp-${i}`, at: next(), agentId, playerId, amountMinor: wallet, commissionMinor: Math.round(wallet * 0.02) });
      cashOuts++;
    }
  }

  // Runners settle surplus float back to money at close.
  for (const agentId of agentIds) {
    const held = op.agentStatement(agentId).floatMinor;
    const surplus = Math.floor(held / 2);
    if (surplus > 0 && op.ledger.balance('SETTLEMENT') >= surplus) {
      op.sellFloatBack({ id: `sb-${agentId}`, at: next(), agentId, amountMinor: surplus });
    }
  }

  return { op, agentIds, playerIds, placed, winners, settlement, cashOuts, mobileOuts, topUps, draw };
}

test('a full trading day reconciles to the unit', () => {
  const { op, settlement, placed, winners, draw } = runTradingDay();

  assert.ok(op.ledger.size > 100, `expected a busy day, got ${op.ledger.size} transactions`);
  assert.ok(placed.length > 40, `expected plenty of bets, got ${placed.length}`);
  assert.ok(winners.length > 0, 'the day needs at least one winner to be interesting');
  assert.equal(settlement.winners, winners.length, 'settlement paid exactly the bets that matched');
  assert.equal(settlement.result, draw.result);

  const trial = op.ledger.trialBalance();
  assert.equal(trial.balanced, true, `debits ${trial.debits} vs credits ${trial.credits}`);

  const eq = op.ledger.equation();
  assert.equal(eq.holds, true, `assets ${eq.left} vs liabilities+equity+revenue-expenses ${eq.right}`);

  const solvency = op.ledger.solvency();
  assert.equal(solvency.ok, true, `short by ${-solvency.headroom}`);

  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 0, 'every stake was settled');
  assert.equal(op.ledger.balance('STAKES_REVENUE'), settlement.totalStakes);
});

test('runners that sell out mid-day top up and keep trading (F4)', () => {
  // A deliberately thin float against heavy demand forces the recovery path.
  const { op, topUps } = runTradingDay({ seed: 3, agents: 2, players: 60, startingFloatMinor: 500_00 });
  assert.ok(topUps > 0, 'expected at least one mid-day float top-up');
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.solvency().ok, true);
});

test('no party ever holds a negative balance', () => {
  const { op, agentIds, playerIds } = runTradingDay();
  for (const agentId of agentIds) {
    assert.ok(op.agentStatement(agentId).floatMinor >= 0, `${agentId} went negative`);
  }
  for (const playerId of playerIds) {
    assert.ok(op.playerStatement(playerId).walletMinor >= 0, `${playerId} went negative`);
  }
});

test('balances can be rebuilt from the journal alone', () => {
  const { op } = runTradingDay();

  // Independent recomputation: no cache, just the entries.
  const rebuilt = new Map();
  for (const record of op.ledger.journal) {
    for (const entry of record.entries) {
      const totals = rebuilt.get(entry.account) || { debits: 0, credits: 0 };
      totals.debits += entry.debit;
      totals.credits += entry.credit;
      rebuilt.set(entry.account, totals);
    }
  }

  for (const [account, totals] of rebuilt) {
    const control = account.split(':')[0];
    const spec = ACCOUNTS[control];
    const expected = spec.class === 'ASSET' || spec.class === 'EXPENSE'
      ? totals.debits - totals.credits
      : totals.credits - totals.debits;
    assert.equal(op.ledger.balance(account), expected, `${account} disagrees with its entries`);
  }
});

test('the day is deterministic - same seed, same books', () => {
  const a = runTradingDay({ seed: 7 });
  const b = runTradingDay({ seed: 7 });
  assert.deepEqual(a.op.ledger.snapshot(), b.op.ledger.snapshot());

  const c = runTradingDay({ seed: 8 });
  assert.notDeepEqual(a.op.ledger.snapshot(), c.op.ledger.snapshot());
});

test('the books reconcile across many different days', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const { op } = runTradingDay({ seed, agents: 2 + (seed % 5), players: 20 + seed });
    assert.equal(op.ledger.trialBalance().balanced, true, `seed ${seed}: trial balance`);
    assert.equal(op.ledger.equation().holds, true, `seed ${seed}: accounting equation`);
    assert.equal(op.ledger.solvency().ok, true, `seed ${seed}: solvency`);
    assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 0, `seed ${seed}: unsettled stakes left over`);
  }
});

test('an under-capitalised operator is caught before the day gets away', () => {
  // Capital far too small for the commission being granted.
  const op = new Operator();
  op.injectCapital({ id: 'cap', at: at(0), amountMinor: 100_00 });
  op.buyFloat({ id: 'b1', at: at(1), agentId: 'ag-1', paidMinor: 95_000_00, floatMinor: 100_000_00 });
  const s = op.ledger.solvency();
  assert.equal(s.ok, false);
  assert.equal(s.headroom, 100_00 - 5_000_00, 'short by commission granted less capital held');
});
