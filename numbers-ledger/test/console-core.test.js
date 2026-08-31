'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/console/console-core.js');
const { format } = require('../src/money.js');
const { CONFIG } = require('../src/config.js');

const LRD = CONFIG.currency;

// --------------------------------------------------------------- formatting

/**
 * The console cannot require() src/money.js in a browser, so it carries its
 * own formatter. Two implementations of one rule drift; this is the test that
 * stops them, and it is the reason the duplication is acceptable at all.
 */
test('the console formatter agrees with the ledger formatter', () => {
  const values = [
    0, 1, 9, 10, 99, 100, 101, 999, 1000, 1001, 99_99, 100_00, 12_345_67,
    1_000_000_00, 999_999_999_99, -1, -99, -100, -12_345_67
  ];
  for (const minor of values) {
    assert.equal(core.formatMinor(minor, LRD), format(minor, LRD), `disagreed on ${minor}`);
  }
});

test('formatting groups thousands and keeps the minor units', () => {
  assert.equal(core.formatMinor(1_234_567_89, LRD), 'L$1,234,567.89');
  assert.equal(core.formatMinor(5, LRD), 'L$0.05');
});

// ------------------------------------------------------------------ parsing

test('typed amounts become exact integers of minor units', () => {
  assert.deepEqual(core.toMinor('12.50', LRD), { ok: true, minor: 1250 });
  assert.deepEqual(core.toMinor('12', LRD), { ok: true, minor: 1200 });
  assert.deepEqual(core.toMinor('12.5', LRD), { ok: true, minor: 1250 });
  assert.deepEqual(core.toMinor('1,000.05', LRD), { ok: true, minor: 100005 });
  assert.deepEqual(core.toMinor('  7.00 ', LRD), { ok: true, minor: 700 });
});

/**
 * The reason toMinor does string work and refuses rather than rounding.
 *
 * Take 1.005, which a person genuinely types. The obvious implementation,
 * Math.round(Number(text) * 100), yields 100 - a cent less than the value,
 * because 1.005 * 100 is 100.49999999999999 in binary floating point. It does
 * not raise anything; it just returns a different amount of money than the one
 * that was typed. Refusing what the currency cannot represent is the only
 * answer that is never quietly wrong.
 */
test('an amount too precise for the currency is refused, never rounded', () => {
  const result = core.toMinor('1.005', LRD);
  assert.equal(result.ok, false);
  assert.match(result.message, /2 decimal places/);
  // What the naive version would have silently produced, for the record.
  assert.equal(Math.round(1.005 * 100), 100);
});

test('nonsense, negatives and blanks are refused with a reason', () => {
  for (const bad of ['', '  ', 'abc', '1.2.3', '1e3', '--5', '$5']) {
    assert.equal(core.toMinor(bad, LRD).ok, false, `accepted ${JSON.stringify(bad)}`);
  }
  assert.match(core.toMinor('-5', LRD).message, /negative/);
  assert.match(core.toMinor('', LRD).message, /Enter an amount/);
});

test('an amount beyond safe integers is refused rather than rounded silently', () => {
  assert.equal(core.toMinor('99999999999999999', LRD).ok, false);
});

// ------------------------------------------------------------- idempotency

test('one action keeps one key until the server answers', () => {
  let n = 0;
  const keys = new core.KeyHolder(() => `r${++n}`);

  const first = keys.keyFor('float:ag-1');
  // A retry of the same button before any answer must reuse the key, or a
  // timed-out float sale becomes two float sales.
  assert.equal(keys.keyFor('float:ag-1'), first);

  keys.settled('float:ag-1');
  assert.notEqual(keys.keyFor('float:ag-1'), first);
});

test('different actions never share a key', () => {
  const keys = new core.KeyHolder();
  assert.notEqual(keys.keyFor('float:ag-1'), keys.keyFor('float:ag-2'));
});

// ------------------------------------------------------------------ health

const SOUND = {
  currency: LRD,
  solvency: { assets: 100, callable: 40, headroom: 60, ok: true },
  equation: { left: 10, right: 10, holds: true },
  trialBalance: { debits: 10, credits: 10, balanced: true },
  drift: []
};

test('a sound book lights every check', () => {
  assert.equal(core.healthy(SOUND), true);
  assert.equal(core.healthOf(SOUND).filter((row) => !row.ok).length, 0);
});

test('each check fails on its own, and cache drift is one of them', () => {
  const insolvent = { ...SOUND, solvency: { ...SOUND.solvency, ok: false, headroom: -1 } };
  assert.equal(core.healthOf(insolvent).find((r) => r.key === 'solvency').ok, false);
  assert.equal(core.healthy(insolvent), false);

  const drifted = { ...SOUND, drift: [{ account: 'SETTLEMENT' }] };
  assert.equal(core.healthOf(drifted).find((r) => r.key === 'drift').ok, false);

  const unbalanced = { ...SOUND, trialBalance: { debits: 10, credits: 9, balanced: false } };
  assert.equal(core.healthOf(unbalanced).find((r) => r.key === 'trial').ok, false);

  const misclassified = { ...SOUND, equation: { left: 10, right: 9, holds: false } };
  assert.equal(core.healthOf(misclassified).find((r) => r.key === 'equation').ok, false);
});

/**
 * The console derives health from the figures, never from a flag. A server
 * that claimed ok:true while the numbers disagreed would still show red.
 */
test('health is derived from the numbers, not from a status field', () => {
  const lying = { ...SOUND, ok: true, healthy: true, status: 'green', trialBalance: { debits: 10, credits: 4, balanced: false } };
  assert.equal(core.healthy(lying), false);
});

// ------------------------------------------------------------------ errors

test('a guard message reaches the operator and an internal error does not', () => {
  assert.equal(
    core.describeError(409, { error: 'Agent ag-1 has 100.00 of float, needs 500.00' }),
    'Agent ag-1 has 100.00 of float, needs 500.00'
  );
  assert.match(core.describeError(500, { error: 'Internal error' }), /did not say why/);
  assert.match(core.describeError(401, {}), /Sign in again/);
});

// ------------------------------------------------------------------- draws

test('a commitment and a seed are 64 hex characters or they are not one', () => {
  assert.equal(core.isHex64('a'.repeat(64)), true);
  assert.equal(core.isHex64('A'.repeat(64)), false);
  assert.equal(core.isHex64('a'.repeat(63)), false);
  assert.equal(core.isHex64(null), false);
});

test('reveal and settle say why they are not available yet', () => {
  const draw = { drawKey: 'D1', drawAt: '2026-09-01T19:00:00Z', result: null, settled: false, bets: 3 };

  assert.equal(core.revealState(draw, '2026-09-01T18:00:00Z').can, false);
  assert.equal(core.revealState(draw, '2026-09-01T19:00:00Z').can, true);
  assert.match(core.revealState({ ...draw, result: '417' }, '2026-09-02T00:00:00Z').why, /417/);

  assert.match(core.settleState(draw).why, /Reveal the seed first/);
  assert.equal(core.settleState({ ...draw, result: '417' }).can, true);
  assert.equal(core.settleState({ ...draw, result: '417', bets: 0 }).can, false);
  assert.equal(core.settleState({ ...draw, result: '417', settled: true }).can, false);
});
