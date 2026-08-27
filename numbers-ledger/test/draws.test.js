'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const draws = require('../src/draws.js');

const KEY = '2026-08-27';

test('a seed commits to a result that the seed alone determines', () => {
  const seed = draws.createSeed();
  const commitment = draws.commit(KEY, seed);
  const result = draws.resultFromSeed(KEY, seed);

  assert.match(seed, /^[0-9a-f]{64}$/);
  assert.match(commitment, /^[0-9a-f]{64}$/);
  assert.match(result, /^[0-9]{3}$/);
  assert.equal(draws.resultFromSeed(KEY, seed), result, 'derivation is deterministic');
  assert.deepEqual(draws.verifyDraw({ drawKey: KEY, seed, commitment, result }), { ok: true, reasons: [] });
});

test('the commitment reveals nothing about the result', () => {
  // Two seeds that differ in one bit give unrelated commitments and results.
  const a = 'a'.repeat(64);
  const b = 'a'.repeat(63) + 'b';
  assert.notEqual(draws.commit(KEY, a), draws.commit(KEY, b));
  assert.notEqual(draws.resultFromSeed(KEY, a), draws.resultFromSeed(KEY, b));
});

test('a commitment cannot be replayed on another draw', () => {
  const seed = draws.createSeed();
  const commitment = draws.commit(KEY, seed);
  assert.equal(draws.verifyCommitment(KEY, seed, commitment), true);
  assert.equal(draws.verifyCommitment('2026-08-28', seed, commitment), false, 'the draw key is inside the hash');
});

test('swapping the seed after the fact is detectable', () => {
  const honest = draws.createSeed();
  const convenient = draws.createSeed();
  const commitment = draws.commit(KEY, honest);

  const check = draws.verifyDraw({
    drawKey: KEY, seed: convenient, commitment,
    result: draws.resultFromSeed(KEY, convenient)
  });
  assert.equal(check.ok, false);
  assert.match(check.reasons.join(' '), /does not match the published commitment/);
});

test('announcing a result the seed does not produce is detectable', () => {
  const seed = draws.createSeed();
  const commitment = draws.commit(KEY, seed);
  const check = draws.verifyDraw({ drawKey: KEY, seed, commitment, result: '000' });
  assert.equal(check.ok, false);
  assert.match(check.reasons.join(' '), /is not what the seed derives/);
});

test('verification reports every reason, not just the first', () => {
  const check = draws.verifyDraw({ drawKey: KEY, seed: 'nonsense', commitment: 'x'.repeat(64), result: '123' });
  assert.equal(check.ok, false);
  assert.match(check.reasons[0], /not 32 bytes of hex/);
});

test('results are spread across the range without modulo bias', () => {
  // 6,000 draws into 1,000 buckets: ~6 each. A plain `% 1000` over a uint32
  // would skew low; this checks the shape rather than any single value.
  const counts = new Array(1000).fill(0);
  for (let i = 0; i < 6000; i++) {
    counts[Number(draws.resultFromSeed(`d-${i}`, draws.createSeed()))]++;
  }
  const used = counts.filter((c) => c > 0).length;
  assert.ok(used > 900, `expected wide coverage, only ${used} of 1000 outcomes appeared`);

  const lowHalf = counts.slice(0, 500).reduce((a, b) => a + b, 0);
  const highHalf = counts.slice(500).reduce((a, b) => a + b, 0);
  const skew = Math.abs(lowHalf - highHalf) / 6000;
  assert.ok(skew < 0.05, `halves should be near-even, got ${(skew * 100).toFixed(1)}% skew`);
});

test('the schedule puts the cutoff before the draw and opening before both', () => {
  const s = draws.schedule({ drawKey: KEY, drawAt: '2026-08-27T19:00:00Z', cutoffLeadMinutes: 5 });
  assert.equal(s.cutoffAt, '2026-08-27T18:55:00.000Z');
  assert.equal(s.drawAt, '2026-08-27T19:00:00.000Z');
  assert.ok(Date.parse(s.opensAt) < Date.parse(s.cutoffAt));

  assert.throws(() => draws.schedule({ drawKey: KEY, drawAt: 'not-a-date' }), /not a date/);
  assert.throws(() => draws.schedule({ drawKey: KEY, drawAt: '2026-08-27T19:00:00Z', cutoffLeadMinutes: -1 }), /non-negative/);
  assert.throws(
    () => draws.schedule({ drawKey: KEY, drawAt: '2026-08-27T19:00:00Z', opensAt: '2026-08-27T18:59:00Z' }),
    /open before it closes/
  );
});

test('the betting window is half-open: the cutoff instant is already closed', () => {
  const s = draws.schedule({ drawKey: KEY, drawAt: '2026-08-27T19:00:00Z', opensAt: '2026-08-27T00:00:00Z' });
  assert.equal(draws.acceptsBetsAt(s, '2026-08-26T23:59:59Z'), false, 'before opening');
  assert.equal(draws.acceptsBetsAt(s, '2026-08-27T00:00:00Z'), true, 'at opening');
  assert.equal(draws.acceptsBetsAt(s, '2026-08-27T18:54:59Z'), true, 'one second before the cutoff');
  assert.equal(draws.acceptsBetsAt(s, '2026-08-27T18:55:00Z'), false, 'the cutoff instant itself');
  assert.equal(draws.acceptsBetsAt(s, '2026-08-27T19:00:00Z'), false, 'at the draw');
});
