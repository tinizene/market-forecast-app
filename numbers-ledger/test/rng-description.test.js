'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const rng = require('../scripts/rng.js');
const math = require('../scripts/math.js');
const { markdown, html } = require('../scripts/render-rng.js');
const draws = require('../src/draws.js');

const DOCS = path.resolve(__dirname, '..', 'docs');

// ---------------------------------------------------------------- the scaling

/**
 * The one part of the mechanism that is arithmetic rather than statistics, and
 * therefore the one part that can be settled rather than measured.
 */
test('the rejection bound is the largest multiple of 1,000 below 2^32', () => {
  const scaling = rng.scaling();

  assert.equal(scaling.word, 4_294_967_296);
  assert.equal(scaling.limit, 4_294_967_000);
  assert.equal(scaling.limit % 1000, 0);
  assert.equal(scaling.discarded, 296);
  assert.equal(scaling.word - scaling.limit, scaling.discarded);
  assert.ok(scaling.limit + 1000 > scaling.word, 'and it is the largest such multiple');
});

/**
 * The guard no sample can check.
 *
 * The bias rejection removes is one part in 14.5 million. A chi-square over a
 * million draws cannot see it; nor could one over a billion. Removing the
 * rejection entirely leaves every statistical test in this file passing, which
 * was discovered by removing it - so the guard is established exactly, at the
 * boundary, rather than measured.
 */
test('the scaling step discards exactly the words that would bias the result', () => {
  const limit = draws.SCALE_LIMIT;

  assert.equal(draws.scaleWord(limit - 1), '999', 'the last accepted word');
  assert.equal(draws.scaleWord(limit), null, 'the first discarded word');
  assert.equal(draws.scaleWord(0xffff_ffff), null, 'and everything above it');

  // The 296 discarded values are exactly those that would have made 000 to 295
  // more likely than the rest.
  let discarded = 0;
  for (let value = limit; value <= 0xffff_ffff; value++) {
    assert.equal(draws.scaleWord(value), null, String(value));
    discarded += 1;
  }
  assert.equal(discarded, 296);
});

test('an accepted word maps to its outcome without folding', () => {
  assert.equal(draws.scaleWord(0), '000');
  assert.equal(draws.scaleWord(1_000), '000');
  assert.equal(draws.scaleWord(1_234), '234');
  assert.equal(draws.scaleWord(999), '999');
  assert.throws(() => draws.scaleWord(-1), /unsigned 32-bit/);
  assert.throws(() => draws.scaleWord(0x1_0000_0000), /unsigned 32-bit/);
});

/**
 * Every outcome must be reachable from an equal count of accepted words, which
 * is the property the rejection exists to create.
 */
test('every outcome is reachable from exactly the same number of words', () => {
  const limit = draws.SCALE_LIMIT;
  assert.equal(limit % 1000, 0);
  assert.equal(limit / 1000, 4_294_967, 'each outcome has 4,294,967 words behind it');
});

test('rejecting a whole digest is impossible in practice, and handled anyway', () => {
  const scaling = rng.scaling();

  assert.equal(scaling.wordsPerDigest, 8, 'a 32-byte HMAC output read four bytes at a time');
  assert.ok(scaling.rejectionPerWord < 7e-8);
  assert.ok(scaling.rejectionPerDigest < 1e-50, 'all eight words rejected');
  // And after a thousand digests it throws rather than returning a biased
  // number, which is the branch that must never be reached and must exist.
  assert.equal(scaling.counterLimit, 1000);
});

/**
 * What the modulo would have cost, had it been taken over the whole range. Tiny
 * and real: a game of chance tilted in a direction nobody chose.
 */
test('the bias avoided is small enough to be worth naming exactly', () => {
  const scaling = rng.scaling();
  assert.ok(scaling.modBiasRelative > 2.3e-7 && scaling.modBiasRelative < 2.4e-7);
  assert.equal(Math.round(1 / scaling.modBiasRelative), 4_294_967);
});

// -------------------------------------------------------------- the mechanism

test('the same seed and key always give the same number', () => {
  const seed = rng.derivedSeed('fixed', 1);
  assert.equal(draws.resultFromSeed('D1', seed), draws.resultFromSeed('D1', seed));
  assert.match(draws.resultFromSeed('D1', seed), /^[0-9]{3}$/);
});

test('the sample is reproducible, which is what makes the document checkable', () => {
  const first = rng.sample({ draws: 5_000 });
  const second = rng.sample({ draws: 5_000 });
  assert.equal(first.uniformity.chiSquare, second.uniformity.chiSquare);
  assert.equal(first.correlation.r, second.correlation.r);
});

test('the mapping reaches every outcome and no position is favoured', () => {
  const sample = rng.sample({ draws: 40_000, drawKey: 'test-evidence', label: 'test' });

  assert.equal(sample.uniformity.empty, 0, 'every one of the 1,000 outcomes occurred');
  assert.equal(sample.uniformity.df, 999);
  assert.ok(sample.uniformity.pUpper > 0.001, `chi-square ${sample.uniformity.chiSquare.toFixed(1)}`);
  for (const position of sample.positions) {
    assert.equal(position.df, 9);
    assert.ok(position.pUpper > 0.001, `position ${position.position} p ${position.pUpper}`);
  }
  assert.ok(Math.abs(sample.correlation.r) < 0.05, 'one draw says nothing about the next');
});

/**
 * A near-miss on the seed must not be a near-miss on the number. If a leaked
 * fragment narrowed the outcome, the custody scheme would be protecting
 * something that no longer needed protecting.
 */
test('one bit of the seed changed forgets the result entirely', () => {
  const result = rng.avalanche({ draws: 20_000, label: 'test-avalanche' });

  assert.equal(result.expected, 20);
  assert.ok(result.agreed > 5 && result.agreed < 45,
    `${result.agreed} agreements against 20 expected is not chance`);
});

test('the same seed under a different draw key is a different draw', () => {
  const result = rng.keySeparation({ draws: 20_000, label: 'test-separation' });
  assert.ok(result.agreed > 5 && result.agreed < 45, `${result.agreed} against 20 expected`);

  // And directly: a seed revealed for one day does not verify against another.
  const seed = rng.derivedSeed('cross', 7);
  const commitment = draws.commit('monday', seed);
  assert.equal(draws.verifyCommitment('tuesday', seed, commitment), false);
});

// ------------------------------------------------------------ the reporting

/**
 * Eight tests means roughly a one-in-three chance that something lands below
 * 0.05 on an honest generator. The document answers that with a replication
 * rather than an argument, and the reporting has to tell the two cases apart.
 */
test('a reading low in one sample and healthy in the other is called noise', () => {
  const low = { p: 0.01 };
  const healthy = { p: 0.6 };
  const summary = rng.summary(fakeBattery([low, healthy]), fakeBattery([healthy, healthy]));

  assert.equal(summary.low.length, 1);
  assert.equal(summary.lowInBoth.length, 0);
  assert.equal(summary.alarming.length, 0);
});

test('a reading low in both samples is called a finding', () => {
  const low = { p: 0.0001 };
  const healthy = { p: 0.5 };
  const summary = rng.summary(fakeBattery([low, healthy]), fakeBattery([low, healthy]));

  assert.equal(summary.lowInBoth.length, 1);
  assert.equal(summary.alarming.length, 1, 'and below 0.001 in both is the one that stops a submission');
});

test('the chance of a false alarm is computed from the number of tests', () => {
  const data = rng.compute({ draws: 2_000, pairs: 1_000 });
  assert.equal(data.summary.tests, 8);
  assert.ok(Math.abs(data.summary.chanceOfOneLow - (1 - 0.95 ** 8)) < 1e-12);
  assert.ok(data.summary.chanceOfOneLow > 0.3, 'which is why a replication is worth its runtime');
});

test('every test is reported, in a fixed order', () => {
  const data = rng.compute({ draws: 2_000, pairs: 1_000 });
  assert.deepEqual(data.summary.readings.map((reading) => reading.name), [
    'Uniformity over all outcomes',
    'Digit position 1', 'Digit position 2', 'Digit position 3',
    'Consecutive pairs', 'Serial correlation',
    'One bit of the seed changed', 'Same seed, different draw key'
  ]);
  for (const reading of data.summary.readings) {
    assert.equal(typeof reading.p, 'number', reading.name);
    assert.equal(typeof reading.confirmP, 'number', `${reading.name} was replicated`);
  }
});

test('the two samples really are independent', () => {
  const data = rng.compute({ draws: 20_000, pairs: 5_000 });
  assert.notEqual(data.primary.label, data.confirmation.label);
  assert.notEqual(data.primary.sample.drawKey, data.confirmation.sample.drawKey);
  assert.notEqual(data.primary.sample.uniformity.chiSquare, data.confirmation.sample.uniformity.chiSquare);
});

// ------------------------------------------------------------- the arithmetic

test('the chi-square tail is exact, not approximated', () => {
  // The 5% upper-tail critical values, from one degree of freedom to a thousand.
  for (const [df, x] of [[1, 3.841459], [9, 16.918978], [99, 123.2252], [999, 1073.6427]]) {
    assert.equal(math.chiSquareTail(x, df).pUpper.toFixed(4), '0.0500', `df ${df}`);
  }
  assert.equal(math.chiSquareTail(0.001, 9).pUpper.toFixed(4), '1.0000');
});

// ---------------------------------------------------------------- the document

test('the published description is the one this tree produces', () => {
  const onDisk = fs.readFileSync(path.join(DOCS, 'rng-description.md'), 'utf8');
  const data = rng.compute({ draws: 2_000, pairs: 1_000 });

  // Sections 1 to 4 are arithmetic and prose: they must match exactly.
  const generated = markdown(data).split('## 5. Statistical evidence')[0];
  assert.equal(onDisk.split('## 5. Statistical evidence')[0], generated,
    'docs/rng-description.md is not what the draw module produces - run npm run rng');

  // The sampled sections are regenerated and compared by npm run rng:check.
  assert.match(onDisk, /chi-square\s+[\d.]+ on 999 degrees of freedom/);
  assert.match(onDisk, /p on a second sample/);
});

test('both renderings come out of one computation', () => {
  const data = rng.compute({ draws: 2_000, pairs: 1_000 });
  const rendered = html(data);

  assert.ok(rendered.startsWith('<title>'));
  assert.ok(!rendered.includes('<html'), 'the artifact host supplies the shell');
  assert.ok(rendered.includes('4,294,967,000'), 'the rejection bound is on the page');
  for (const reading of data.summary.readings) {
    assert.ok(rendered.includes(reading.name), `${reading.name} is on the page`);
  }
});

/**
 * The claim that makes the whole page checkable, and the one most easily lost
 * in an edit: this evidence is about the mapping, not about the entropy.
 */
test('the description says what it does not cover', () => {
  const onDisk = fs.readFileSync(path.join(DOCS, 'rng-description.md'), 'utf8');
  assert.match(onDisk, /None of it tests the\s+entropy of a real seed/,
    'the evidence section says which question it does not answer');
  assert.match(onDisk, /\*\*What is not:\*\* the quality of the operating system/,
    'and section 2 says the entropy is inherited rather than demonstrated');
  assert.match(onDisk, /cannot be stopped from \*choosing\* the number/);
  assert.match(onDisk, /before betting opens/);
});

function fakeBattery(readings) {
  // Two readings are enough to exercise the pairing; the rest are healthy.
  const p = (index) => (readings[index] || { p: 0.5 }).p;
  return {
    sample: {
      uniformity: { chiSquare: 1, df: 999, pUpper: p(0) },
      positions: [1, 2, 3].map((position) => ({ position, chiSquare: 1, df: 9, pUpper: p(1) })),
      serial: { chiSquare: 1, df: 99, pairs: 1, pUpper: 0.5 },
      correlation: { r: 0, p: 0.5 }
    },
    avalanche: { agreed: 1, expected: 1, p: 0.5 },
    keySeparation: { agreed: 1, expected: 1, p: 0.5 }
  };
}
