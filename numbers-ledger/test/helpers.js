'use strict';

const draws = require('../src/draws.js');

/**
 * Open a draw so bets can be placed, and hand back everything a test needs to
 * reveal it later. Every test that places a bet now needs this - a draw with a
 * published commitment is a precondition of taking money, not a formality.
 */
function openTestDraw(op, { drawKey = 'D1', drawAt = '2026-08-27T19:00:00Z', at = '2026-08-26T00:00:00Z', idPrefix = 'draw', seed = draws.createSeed() } = {}) {
  const schedule = draws.schedule({ drawKey, drawAt, opensAt: at });
  op.openDraw({ id: `${idPrefix}-open-${drawKey}`, at, drawKey, commitment: draws.commit(drawKey, seed), ...schedule });
  return {
    drawKey, seed, ...schedule,
    result: draws.resultFromSeed(drawKey, seed),
    reveal: (revealAt = drawAt) => op.revealDraw({ id: `${idPrefix}-reveal-${drawKey}`, at: revealAt, drawKey, seed })
  };
}

/** Settle paying a fixed amount to named bets - for tests about the ledger, not the game. */
const payTo = (map) => (bet) => map[bet.betId] || 0;

module.exports = { openTestDraw, payTo };
