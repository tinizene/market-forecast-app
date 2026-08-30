'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');
const { openTestDraw, payTo } = require('./helpers.js');

const AT = '2026-08-26T08:00:00Z';
const OPENS = '2026-08-27T00:00:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';
const NOON = '2026-08-27T12:00:00Z';

/** An operator with a funded player and an open draw. No protection set. */
function ready(options = {}) {
  const op = new Operator(options);
  op.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  op.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  op.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  const draw = openTestDraw(op, { at: AT, drawAt: DRAW_AT });
  return { op, draw };
}

const bet = (op, draw, { id, playerId = 'p-1', at = NOON, stakeMinor }) =>
  op.placeBet({ id, at, betId: id, playerId, drawKey: draw.drawKey, stakeMinor, selection: null });

// ------------------------------------------------------------- off by default

test('nothing is enforced until protection is switched on', () => {
  const { op, draw } = ready();
  assert.equal(op.protectionStatus().active, false);

  // Stakes far beyond any sensible limit go through: the ledger does not
  // invent a policy the operator has not set.
  bet(op, draw, { id: 'b1', stakeMinor: 500_00 });
  bet(op, draw, { id: 'b2', stakeMinor: 500_00 });
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0);
  assert.equal(op.playerStatement('p-1', NOON).limits, null);
});

test('switching protection on and off again is a pair of recorded facts', () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's1', at: AT, dailyStakeMinor: 100_00 });
  assert.deepEqual(
    { active: true, dailyStakeMinor: 100_00, dailyLossMinor: null },
    (({ active, dailyStakeMinor, dailyLossMinor }) => ({ active, dailyStakeMinor, dailyLossMinor }))(op.protectionStatus())
  );
  assert.equal(op.protectionStatus().since, AT);

  assert.throws(() => bet(op, draw, { id: 'b1', stakeMinor: 200_00 }), /daily limit/);

  op.clearProtection({ id: 'c1', at: NOON });
  assert.equal(op.protectionStatus().active, false);
  bet(op, draw, { id: 'b2', stakeMinor: 200_00 });

  assert.throws(() => op.clearProtection({ id: 'c2', at: NOON }), /No protection policy/);
  const kinds = op.ledger.events.map((e) => e.kind);
  assert.ok(kinds.includes('PROTECTION_SET') && kinds.includes('PROTECTION_CLEARED'));
});

test('setProtection refuses a policy that limits nothing', () => {
  const { op } = ready();
  assert.throws(() => op.setProtection({ id: 's', at: AT }), /needs at least one limit/);
  assert.equal(op.protectionStatus().active, false);
});

// ------------------------------------------------------------- the stake cap

test('the daily stake cap counts the day, and the next day starts clean', () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 100_00 });

  bet(op, draw, { id: 'b1', at: '2026-08-27T09:00:00Z', stakeMinor: 60_00 });
  assert.throws(
    () => bet(op, draw, { id: 'b2', at: '2026-08-27T18:00:00Z', stakeMinor: 50_00 }),
    /has staked .*60\.00.* of a .*100\.00.* daily limit/
  );

  // The refused bet wrote nothing: not the entry, not the bet, not the counter.
  assert.equal(op.ledger.readState('bet', 'b2'), null);
  assert.equal(op.playerStatement('p-1', NOON).stakedTodayMinor, 60_00);
  assert.equal(op.ledger.trialBalance().balanced, true);

  // Exactly at the limit is allowed; a cent past it is not.
  bet(op, draw, { id: 'b3', at: '2026-08-27T18:30:00Z', stakeMinor: 40_00 });
  assert.throws(() => bet(op, draw, { id: 'b4', at: '2026-08-27T18:31:00Z', stakeMinor: 1 }), /daily limit/);

  // A different UTC day is a different bucket.
  const next = openTestDraw(op, { drawKey: 'D2', at: '2026-08-28T00:00:00Z', drawAt: '2026-08-28T19:00:00Z', idPrefix: 'd2' });
  bet(op, next, { id: 'b5', at: '2026-08-28T09:00:00Z', stakeMinor: 100_00 });
});

test('the cap is per player, not per house', () => {
  const { op, draw } = ready();
  op.cashIn({ id: 'in2', at: AT, agentId: 'ag-1', playerId: 'p-2', amountMinor: 1_000_00 });
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 50_00 });

  bet(op, draw, { id: 'b1', playerId: 'p-1', stakeMinor: 50_00 });
  bet(op, draw, { id: 'b2', playerId: 'p-2', stakeMinor: 50_00 });
  assert.throws(() => bet(op, draw, { id: 'b3', playerId: 'p-1', stakeMinor: 1 }), /daily limit/);
});

// -------------------------------------------------------------- the loss cap

test("the loss cap is net of the day's winnings", () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyLossMinor: 100_00 });

  bet(op, draw, { id: 'b1', at: '2026-08-27T09:00:00Z', stakeMinor: 100_00 });
  assert.throws(() => bet(op, draw, { id: 'b2', at: '2026-08-27T10:00:00Z', stakeMinor: 1 }), /daily loss limit/);

  // A win on the same day restores headroom, because the player is not down
  // by what they staked - they are down by what they did not get back.
  draw.reveal();
  op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: payTo({ b1: 80_00 }) });

  const st = op.playerStatement('p-1', '2026-08-27T19:30:00Z');
  assert.equal(st.wonTodayMinor, 80_00);
  assert.equal(st.netTodayMinor, -20_00, 'down 20, not down 100');

  const later = openTestDraw(op, { drawKey: 'D2', at: '2026-08-27T19:30:00Z', drawAt: '2026-08-27T23:00:00Z', idPrefix: 'd2' });
  bet(op, later, { id: 'b3', at: '2026-08-27T20:00:00Z', stakeMinor: 80_00 });
  assert.throws(() => bet(op, later, { id: 'b4', at: '2026-08-27T20:01:00Z', stakeMinor: 1 }), /daily loss limit/);
});

test('a stake cap and a loss cap can both be in force', () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 40_00, dailyLossMinor: 500_00 });
  bet(op, draw, { id: 'b1', stakeMinor: 40_00 });
  // The stake cap bites first, though the loss cap is nowhere near.
  assert.throws(() => bet(op, draw, { id: 'b2', stakeMinor: 1 }), /daily limit/);
});

// --------------------------------------------------------- per-player limits

test('a player can hold a tighter limit than the house, with no house policy at all', () => {
  const { op, draw } = ready();
  assert.equal(op.protectionStatus().active, false);
  op.setPlayerLimit({ id: 'pl', at: AT, playerId: 'p-1', dailyStakeMinor: 10_00 });

  assert.throws(() => bet(op, draw, { id: 'b1', stakeMinor: 20_00 }), /daily limit/);
  bet(op, draw, { id: 'b2', stakeMinor: 10_00 });
  // Another player, with no limit of their own and no house policy, is free.
  op.cashIn({ id: 'in2', at: AT, agentId: 'ag-1', playerId: 'p-2', amountMinor: 1_000_00 });
  bet(op, draw, { id: 'b3', playerId: 'p-2', stakeMinor: 900_00 });
  assert.equal(op.protectionStatus().playerLimits, 1);
});

test('a per-player limit overrides the house policy in both directions', () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 50_00 });
  op.setPlayerLimit({ id: 'pl', at: AT, playerId: 'p-1', dailyStakeMinor: 200_00 });

  // Looser than the house, because it was set for this player.
  bet(op, draw, { id: 'b1', stakeMinor: 200_00 });
  assert.throws(() => bet(op, draw, { id: 'b2', stakeMinor: 1 }), /daily limit/);
});

test('a null field on a per-player limit inherits the house policy', () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 30_00, dailyLossMinor: 500_00 });
  op.setPlayerLimit({ id: 'pl', at: AT, playerId: 'p-1', dailyLossMinor: 10_00 });

  // Loss limit is the player's 10; the stake limit still comes from the house.
  assert.throws(() => bet(op, draw, { id: 'b1', stakeMinor: 20_00 }), /daily loss limit/);
  bet(op, draw, { id: 'b2', stakeMinor: 10_00 });
  const limits = op.playerStatement('p-1', NOON).limits;
  assert.deepEqual(limits, { dailyStakeMinor: 30_00, dailyLossMinor: 10_00 });
});

// ------------------------------------------------------------ self-exclusion

test('an excluded player cannot stake or be topped up, but can always be paid', () => {
  const { op, draw } = ready();
  op.excludePlayer({ id: 'ex', at: AT, playerId: 'p-1', reason: 'self-requested' });

  assert.throws(() => bet(op, draw, { id: 'b1', stakeMinor: 1_00 }), /self-excluded/);
  assert.throws(
    () => op.cashIn({ id: 'in2', at: NOON, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 }),
    /self-excluded/
  );

  // Money out is never blocked. A protection that traps a balance is not one.
  op.withdrawToMobileMoney({ id: 'w', at: NOON, playerId: 'p-1', amountMinor: 500_00, feeMinor: 50 });
  op.cashPayout({ id: 'o', at: NOON, agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00, commissionMinor: 0 });
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0);
  assert.equal(op.protectionStatus().excluded, 1);
});

test('a cooling-off period lapses on its own and cannot be cut short', () => {
  const { op, draw } = ready();
  op.excludePlayer({ id: 'ex', at: AT, playerId: 'p-1', until: '2026-08-27T18:00:00Z' });

  assert.throws(() => bet(op, draw, { id: 'b1', at: NOON, stakeMinor: 1_00 }), /until 2026-08-27T18:00:00Z/);
  assert.throws(
    () => op.reinstatePlayer({ id: 'r', at: NOON, playerId: 'p-1' }),
    /cooling-off period until .*cannot be cut short/
  );

  // Past the end, play resumes with no call needed.
  bet(op, draw, { id: 'b2', at: '2026-08-27T18:30:00Z', stakeMinor: 1_00 });
  assert.equal(op.playerStatement('p-1', '2026-08-27T18:30:00Z').excluded, false);
});

test('an indefinite exclusion needs a reinstatement, and each happens once', () => {
  const { op, draw } = ready();
  op.excludePlayer({ id: 'ex', at: AT, playerId: 'p-1' });

  assert.throws(() => op.excludePlayer({ id: 'ex2', at: NOON, playerId: 'p-1' }), /already excluded/);
  assert.throws(() => op.reinstatePlayer({ id: 'r0', at: AT, playerId: 'p-2' }), /is not excluded/);

  op.reinstatePlayer({ id: 'r', at: NOON, playerId: 'p-1' });
  bet(op, draw, { id: 'b', at: NOON, stakeMinor: 1_00 });
  assert.throws(() => op.reinstatePlayer({ id: 'r2', at: NOON, playerId: 'p-1' }), /is not excluded/);

  const kinds = op.ledger.events.map((e) => e.kind);
  assert.ok(kinds.includes('PLAYER_EXCLUDED') && kinds.includes('PLAYER_REINSTATED'));
});

test('a cooling-off period must end in the future', () => {
  const { op } = ready();
  assert.throws(() => op.excludePlayer({ id: 'e', at: NOON, playerId: 'p-1', until: AT }), /must end in the future/);
  assert.throws(() => op.excludePlayer({ id: 'e', at: NOON, playerId: 'p-1', until: 'soon' }), /ISO timestamp/);
});

// --------------------------------------------------------- free tickets too

test('a free ticket counts against a stake cap but never against a loss cap', () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 10_00, dailyLossMinor: 1_00 });
  op.issueFreeTicket({ id: 't', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 9_00 });

  // The loss cap is 1.00 and the ticket is worth 9.00, but it cannot lose the
  // player money, so it plays.
  op.redeemFreeTicket({ id: 'r', at: NOON, ticketId: 'FT-1', betId: 'b-free', drawKey: draw.drawKey });
  assert.equal(op.playerStatement('p-1', NOON).stakedTodayMinor, 9_00);
  assert.equal(op.playerStatement('p-1', NOON).netTodayMinor, 0, 'a free stake is not a loss');

  // It did consume the day's play allowance, though.
  assert.throws(() => bet(op, draw, { id: 'b1', stakeMinor: 2_00 }), /daily limit/);
});

test('an excluded player cannot play a free ticket either', () => {
  const { op, draw } = ready();
  op.issueFreeTicket({ id: 't', at: AT, campaignId: 'c', ticketId: 'FT-1', playerId: 'p-1', faceMinor: 1_00 });
  op.excludePlayer({ id: 'ex', at: AT, playerId: 'p-1' });

  assert.throws(
    () => op.redeemFreeTicket({ id: 'r', at: NOON, ticketId: 'FT-1', betId: 'b', drawKey: draw.drawKey }),
    /self-excluded/
  );
  assert.equal(op.ledger.balance('PROMO_VOUCHERS'), 1_00, 'the ticket is still owed to them');
});

// ------------------------------------------------------------ the statement

test("a player statement answers what they have played today and what limits them", () => {
  const { op, draw } = ready();
  op.setProtection({ id: 's', at: AT, dailyStakeMinor: 100_00 });
  bet(op, draw, { id: 'b1', at: '2026-08-27T09:00:00Z', stakeMinor: 30_00 });
  draw.reveal();
  op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: draw.drawKey, evaluate: payTo({ b1: 10_00 }) });

  const st = op.playerStatement('p-1', '2026-08-27T20:00:00Z');
  assert.equal(st.stakedTodayMinor, 30_00);
  assert.equal(st.wonTodayMinor, 10_00);
  assert.equal(st.netTodayMinor, -20_00);
  assert.deepEqual(st.limits, { dailyStakeMinor: 100_00, dailyLossMinor: null });
  assert.equal(st.walletMinor, op.ledger.balance('PLAYER_WALLET:p-1'));

  // Asked about a different day, the same player has played nothing.
  assert.equal(op.playerStatement('p-1', '2026-08-28T09:00:00Z').stakedTodayMinor, 0);
});

// ------------------------------------------------------------- durable state

test('limits and exclusions survive a restart', async (t) => {
  const { mkdtempSync, rmSync } = require('node:fs');
  const { join } = require('node:path');
  const { tmpdir } = require('node:os');
  const { SqliteStore } = require('../src/store/sqlite.js');

  const dir = mkdtempSync(join(tmpdir(), 'protection-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'ledger.db');

  const first = new Operator({ store: new SqliteStore(file) });
  first.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  first.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  first.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  first.setProtection({ id: 's', at: AT, dailyStakeMinor: 10_00 });
  first.excludePlayer({ id: 'ex', at: AT, playerId: 'p-2' });
  const draw = openTestDraw(first, { at: AT, drawAt: DRAW_AT });
  first.placeBet({ id: 'b1', at: NOON, betId: 'b1', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 10_00, selection: null });
  first.close();

  const second = new Operator({ store: new SqliteStore(file) });
  assert.equal(second.protectionStatus().active, true);
  assert.equal(second.protectionStatus().dailyStakeMinor, 10_00);
  // The day's counter came back too, so the limit is not silently reset.
  assert.throws(
    () => second.placeBet({ id: 'b2', at: NOON, betId: 'b2', playerId: 'p-1', drawKey: draw.drawKey, stakeMinor: 1, selection: null }),
    /daily limit/
  );
  assert.equal(second.playerStatement('p-2', NOON).excluded, true);
  second.close();
});
