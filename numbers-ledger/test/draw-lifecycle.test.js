'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Operator } = require('../src/operator.js');
const draws = require('../src/draws.js');

// The prototype's real payout and hit rules, so settlement is exercised against
// the game as shipped rather than a stand-in written to agree with itself.
const game = require('../../africa-numbers/game.js');

const KEY = '2026-08-27';
const COMMITTED_AT = '2026-08-26T12:00:00Z';
const OPENS = '2026-08-27T00:00:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';
const CUTOFF = '2026-08-27T18:55:00.000Z';

function readyOperator() {
  const op = new Operator();
  const seed = draws.createSeed();
  const schedule = draws.schedule({ drawKey: KEY, drawAt: DRAW_AT, opensAt: OPENS });

  op.injectCapital({ id: 'cap', at: COMMITTED_AT, amountMinor: 10_000_000_00 });
  op.buyFloat({ id: 'float', at: COMMITTED_AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  op.openDraw({ id: 'open', at: COMMITTED_AT, drawKey: KEY, commitment: draws.commit(KEY, seed), ...schedule });
  op.cashIn({ id: 'in', at: OPENS, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });

  return { op, seed, result: draws.resultFromSeed(KEY, seed) };
}

/** Bridge: the ledger stays game-agnostic, the game decides who won. */
const byGameRules = (bet, result) =>
  game.isHit({ type: bet.selection.type, digits: bet.selection.digits }, result)
    ? game.quote(bet.selection.type, bet.stakeMinor).netCents
    : 0;

test('the happy path: commit, bet, cutoff, reveal, settle, verify', () => {
  const { op, seed, result } = readyOperator();

  op.placeBet({
    id: 'b1', at: '2026-08-27T10:00:00Z', betId: 'b1', playerId: 'p-1',
    drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: result }
  });
  op.placeBet({
    id: 'b2', at: '2026-08-27T10:01:00Z', betId: 'b2', playerId: 'p-1',
    drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: result === '000' ? '111' : '000' }
  });

  const revealed = op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed });
  assert.equal(revealed.result, result);

  const settled = op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: KEY, evaluate: byGameRules });
  assert.equal(settled.winners, 1);
  assert.equal(settled.betsSettled, 2);
  assert.equal(settled.totalStakes, 2_00);
  assert.equal(settled.totalPayout, 540_00, 'a $1 straight pays $540 net of the cut');

  const receipt = op.drawReceipt(KEY);
  assert.equal(receipt.verification.ok, true, 'anyone can check the number afterwards');
  assert.equal(receipt.settled, true);
  assert.equal(op.ledger.trialBalance().balanced, true);
  assert.equal(op.ledger.equation().holds, true);
});

test('a bet cannot be taken before the commitment exists', () => {
  const op = new Operator();
  op.injectCapital({ id: 'cap', at: COMMITTED_AT, amountMinor: 1_000_00 });
  op.buyFloat({ id: 'f', at: COMMITTED_AT, agentId: 'ag-1', paidMinor: 500_00, floatMinor: 500_00 });
  op.cashIn({ id: 'i', at: COMMITTED_AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });

  assert.throws(
    () => op.placeBet({ id: 'b', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00 }),
    /not open for betting/
  );
});

test('a draw cannot be committed after betting has already opened', () => {
  const op = new Operator();
  const seed = draws.createSeed();
  assert.throws(
    () => op.openDraw({
      id: 'late-open', at: '2026-08-27T09:00:00Z', drawKey: KEY,
      commitment: draws.commit(KEY, seed),
      opensAt: OPENS, cutoffAt: CUTOFF, drawAt: DRAW_AT
    }),
    /must be committed before betting opens/
  );
});

test('the cutoff is enforced against server time, to the second', () => {
  const { op, seed } = readyOperator();

  op.placeBet({ id: 'ok', at: '2026-08-27T18:54:59Z', betId: 'in-time', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: '123' } });

  assert.throws(
    () => op.placeBet({ id: 'late', at: CUTOFF, betId: 'late', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00 }),
    /closed at/
  );
  assert.throws(
    () => op.placeBet({ id: 'later', at: '2026-08-27T19:30:00Z', betId: 'later', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00 }),
    /closed at/
  );
  assert.throws(
    () => op.placeBet({ id: 'early', at: '2026-08-26T23:00:00Z', betId: 'early', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00 }),
    /does not open until/
  );

  // Nothing was written by any of the three refusals.
  assert.equal(op.ledger.balance('UNSETTLED_STAKES'), 1_00);
  op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed });
  assert.equal(op.ledger.readState('draw', KEY).betIds.length, 1);
});

test('a bet cannot be slipped in after the number is known', () => {
  const { op, seed } = readyOperator();
  op.placeBet({ id: 'b1', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: '123' } });
  const { result } = op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed });

  // Even with a timestamp inside the window - a replayed or forged `at` - the
  // draw is already drawn, and that is checked independently of the clock.
  assert.throws(
    () => op.placeBet({
      id: 'cheat', at: '2026-08-27T10:00:00Z', betId: 'cheat', playerId: 'p-1',
      drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: result }
    }),
    /already been drawn/
  );
});

test('the operator cannot reveal a seed that does not match its commitment', () => {
  const { op } = readyOperator();
  op.placeBet({ id: 'b1', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: '123' } });

  assert.throws(
    () => op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed: draws.createSeed() }),
    /does not match the commitment/
  );
  assert.equal(op.ledger.readState('draw', KEY).result, null, 'nothing was recorded');
});

test('a draw cannot be revealed early, settled unrevealed, or revealed twice', () => {
  const { op, seed } = readyOperator();
  op.placeBet({ id: 'b1', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: '123' } });

  assert.throws(() => op.revealDraw({ id: 'early', at: '2026-08-27T18:59:00Z', drawKey: KEY, seed }), /cannot be revealed before/);
  assert.throws(
    () => op.settleDraw({ id: 'premature', at: DRAW_AT, drawKey: KEY, evaluate: () => 0 }),
    /has not been revealed yet/
  );

  op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed });
  assert.throws(() => op.revealDraw({ id: 'again', at: DRAW_AT, drawKey: KEY, seed }), /already revealed/);
});

test('the commitment and the reveal are append-only facts, in order', () => {
  const { op, seed } = readyOperator();
  op.placeBet({ id: 'b1', at: OPENS, betId: 'b1', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: '123' } });
  op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed });

  const events = op.ledger.events;
  assert.deepEqual(events.map((e) => e.kind), ['DRAW_OPENED', 'DRAW_REVEALED']);
  assert.ok(Date.parse(events[0].at) < Date.parse(events[1].at));
  assert.equal(events[0].data.commitment, draws.commit(KEY, seed));
  assert.equal(events[1].data.seed, seed);

  // The published commitment predates the window it governs - the property the
  // whole scheme rests on.
  assert.ok(Date.parse(events[0].at) <= Date.parse(events[0].data.opensAt));
});

test('every bet type settles by the game rules against the revealed number', () => {
  const { op, seed, result } = readyOperator();
  const [d1, d2] = [result[0], result[1]];

  op.placeBet({ id: 's', at: OPENS, betId: 'straight', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'straight', digits: result } });
  op.placeBet({ id: 'f', at: OPENS, betId: 'front', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'front', digits: d1 + d2 } });
  op.placeBet({ id: 'm', at: OPENS, betId: 'miss', playerId: 'p-1', drawKey: KEY, stakeMinor: 1_00, selection: { type: 'front', digits: d1 === '9' ? '00' : '99' } });

  op.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: KEY, seed });
  const settled = op.settleDraw({ id: 'st', at: '2026-08-27T19:01:00Z', drawKey: KEY, evaluate: byGameRules });

  assert.equal(settled.winners, 2, 'the straight and the front pair both hit');
  assert.equal(settled.totalPayout, 540_00 + 45_00);
  assert.equal(op.ledger.trialBalance().balanced, true);
});
