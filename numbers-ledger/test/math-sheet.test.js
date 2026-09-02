'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const math = require('../scripts/math.js');
const { markdown, html } = require('../scripts/render-math-sheet.js');
const game = require('../../africa-numbers/game.js');

const DOCS = path.resolve(__dirname, '..', 'docs');

// --------------------------------------------------------- the counts are real

/**
 * The claim the whole sheet rests on: a win count is a property of the bet
 * type, not of the digits somebody picked. A type where it is not uniform is
 * mispriced for some of its selections, which is the quiet way a board becomes
 * unfair, so every selection is counted rather than one representative.
 */
test('every selection of a bet type wins the same number of times', () => {
  for (const type of math.TYPE_ORDER) {
    const counted = math.winCountsFor(type);
    assert.equal(counted.uniform, true,
      `${type} ranges from ${counted.min} to ${counted.max} wins`);
    assert.ok(counted.selections > 0, `${type} has selections the product accepts`);
  }
});

test('the counts are what combinatorics says they are', () => {
  const wins = Object.fromEntries(math.board({ maxStake: 1 }).map((row) => [row.type, row.wins]));

  assert.equal(wins.straight, 1);
  assert.equal(wins.front, 10, 'first two fixed, third free');
  assert.equal(wins.box6, 6, '3! arrangements of three different digits');
  assert.equal(wins.box3, 3, '3!/2! arrangements when one digit repeats');
  assert.equal(wins.oneDigit, 1000 - 9 ** 3, 'everything except the results that avoid the digit');
  assert.equal(wins.twoDigits, 1000 - 9 ** 3 - 9 ** 3 + 8 ** 3, 'inclusion and exclusion');
});

test('the selection counts are what the product actually accepts', () => {
  assert.equal(math.selectionsFor('straight').length, 1000);
  assert.equal(math.selectionsFor('front').length, 100);
  assert.equal(math.selectionsFor('box6').length, 720, '10 x 9 x 8 orderings of three different digits');
  assert.equal(math.selectionsFor('box3').length, 270, 'the repeated digit, the other digit, its position');
  assert.equal(math.selectionsFor('oneDigit').length, 10);
  assert.equal(math.selectionsFor('twoDigits').length, 90, 'ordered pairs of different digits');
});

/**
 * The bet the validator exists to prevent, priced. Two Digits played as one
 * digit twice would win on 271 draws in 1,000 at 8.5x, returning 2.30 per unit
 * staked - so the guard is not tidiness, it is the difference between a 46%
 * return and a bet that bankrupts the draw.
 */
test('the refused bet is the one that would bankrupt the draw', () => {
  const repeated = { type: 'twoDigits', digits: '44' };
  assert.equal(game.validateBet({ ...repeated, stakeCents: 100, balanceCents: 100 }).code, 'two-same');

  let wins = 0;
  for (const result of math.ALL_RESULTS) if (game.isHit(repeated, result)) wins++;
  assert.equal(wins, 271);
  assert.equal((wins / 1000) * game.BET_TYPES.twoDigits.multiplier, 2.3035);
});

// ------------------------------------------------------------------- the money

test('return and hold follow from the counts and the multipliers', () => {
  for (const row of math.board({ maxStake: 1 })) {
    const spec = game.BET_TYPES[row.type];
    assert.equal(row.probability, row.wins / 1000, row.type);
    assert.equal(row.rtp, (row.wins / 1000) * spec.multiplier, row.type);
    assert.equal(row.holdPct, (1 - row.rtp) * 100, row.type);
    assert.ok(row.rtp < 1, `${row.type} must not be priced above its own true odds`);
  }
});

test('the sheet agrees with the odds the player is shown', () => {
  for (const row of math.board({ maxStake: 1 })) {
    const shown = game.winChance(row.type);
    assert.equal(shown.wins, row.wins, row.type);
    assert.equal(shown.outOf, 1000, row.type);
    // At a 1.00 stake the app's own figure is the sheet's return, in cents.
    assert.equal(game.expectedReturnCents(row.type, 100), Math.round(row.rtp * 100), row.type);
  }
});

/**
 * A fractional multiplier and integer minor units cannot both be exact for
 * every stake. The direction and size of the error belong in the sheet rather
 * than in a footnote, and both are checked here.
 */
test('rounding only ever favours the player, and vanishes at whole units', () => {
  for (const row of math.board({ maxStake: 10_000 })) {
    assert.ok(row.rounding.worst.deviation >= 0, `${row.type} rounds against the player`);
    assert.equal(row.rounding.exactAtWholeUnits, true, `${row.type} is inexact at a whole unit`);
  }

  const oneDigit = math.board({ maxStake: 10_000 }).find((row) => row.type === 'oneDigit');
  // A one-cent stake pays 2 rather than 1.85, which is the largest error there is.
  assert.equal(oneDigit.rounding.worst.stakeCents, 1);
  assert.equal(game.grossPayoutCents('oneDigit', 1), 2);
  assert.equal(game.grossPayoutCents('oneDigit', 100), 185, 'and exact at a whole unit');
});

test('volatility is the multiplier scaled by the spread of the outcome', () => {
  const rows = math.board({ maxStake: 1 });
  const straight = rows.find((row) => row.type === 'straight');
  const oneDigit = rows.find((row) => row.type === 'oneDigit');

  assert.equal(straight.sd, 500 * Math.sqrt(0.001 * 0.999));
  assert.ok(straight.sd / oneDigit.sd > 15, 'a straight hit is an order of magnitude more disruptive');
});

test('a blended hold is a weighted average of the returns it blends', () => {
  const rows = math.board({ maxStake: 1 });
  const rate = Object.fromEntries(rows.map((row) => [row.type, row.rtp]));

  for (const mix of math.mixes(rows)) {
    const total = Object.values(mix.weights).reduce((sum, weight) => sum + weight, 0);
    const expected = Object.entries(mix.weights)
      .reduce((sum, [type, weight]) => sum + (weight / total) * rate[type], 0);
    assert.equal(mix.rtp, expected, mix.name);
    assert.ok(mix.rtp > 0.4 && mix.rtp < 0.55, `${mix.name} is in the range the board can produce`);
  }
});

// -------------------------------------------------------------- the draw itself

/**
 * A small sample, because this runs on every commit. The million-draw figure in
 * the document is regenerated and compared by `npm run mathsheet:check`, which
 * is a separate step for a reason: it takes seconds, and it answers a different
 * question - whether the document is current, not whether the mapping works.
 */
test('the draw derivation reaches every outcome, and evenly', () => {
  const result = math.uniformity({ samples: 50_000, drawKey: 'test-uniformity' });

  assert.equal(result.emptyBuckets, 0, 'every one of the 1,000 outcomes occurred');
  assert.equal(result.df, 999);
  assert.ok(result.p > 0.001, `chi-square ${result.chiSquare.toFixed(1)} gives p = ${result.p.toFixed(4)}`);
  assert.ok(result.p < 0.999, 'and a fit that is too good is as suspicious as one that is too bad');
});

test('the uniformity sample is reproducible', () => {
  const first = math.uniformity({ samples: 5_000 });
  const second = math.uniformity({ samples: 5_000 });
  assert.equal(first.chiSquare, second.chiSquare, 'seeds are derived, not drawn');
});

test('the normal tail used for the p-value is the one it claims to be', () => {
  assert.equal(math.erfc(0).toFixed(6), '1.000000');
  // The 5% two-sided critical value of the standard normal.
  assert.equal(math.erfc(1.959964 / Math.SQRT2).toFixed(4), '0.0500');
  assert.ok(math.erfc(10) < 1e-40);
});

// ----------------------------------------------------------------- the document

test('the published sheet is the one this tree produces', () => {
  const onDisk = fs.readFileSync(path.join(DOCS, 'math-sheet.md'), 'utf8');
  const stored = /chi-square\s+([\d.]+) on (\d+) degrees of freedom/.exec(onDisk);
  assert.ok(stored, 'the document records a chi-square figure');

  // Everything except the sample, which is regenerated by mathsheet:check.
  const data = math.compute({ samples: 1 });
  data.uniformity = {
    samples: Number(/samples\s+([\d,]+)/.exec(onDisk)[1].replace(/,/g, '')),
    df: Number(stored[2]),
    chiSquare: Number(stored[1]),
    expectedPerOutcome: Number(/expected per outcome ([\d,]+)/.exec(onDisk)[1].replace(/,/g, '')),
    minBucket: 0, maxBucket: 0, z: 0, p: 0, emptyBuckets: 0
  };

  const board = markdown(data).split('## Rounding')[0];
  assert.equal(onDisk.split('## Rounding')[0], board,
    'the board in docs/math-sheet.md is not what the game rules produce - run npm run mathsheet');
});

test('both renderings come out of one computation', () => {
  const data = math.compute({ samples: 1 });
  const rendered = html(data);

  for (const row of data.rows) {
    assert.ok(rendered.includes(row.rtp.toFixed(5)), `${row.type} return is on the page`);
    assert.ok(rendered.includes(`${row.wins} in 1,000`), `${row.type} count is on the page`);
  }
  assert.ok(rendered.startsWith('<title>'), 'and it is a publishable page');
  assert.ok(!rendered.includes('<html'), 'without a shell the artifact host supplies');
});
