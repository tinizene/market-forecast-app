'use strict';

const crypto = require('node:crypto');

const draws = require('../src/draws.js');
const { erfc, chiSquareTail } = require('./math.js');

/**
 * Statistical evidence for the draw mechanism.
 *
 * The mechanism is deterministic given a seed, so every figure here reproduces
 * exactly: seeds are derived from a counter by sha256 rather than drawn, and a
 * reviewer re-running this gets the same numbers rather than similar ones.
 *
 * That choice narrows the claim, deliberately. Everything below tests the
 * MAPPING from a seed to a result - the HMAC, the rejection sampling, the
 * scaling to 000-999. None of it tests the entropy of a real seed, which comes
 * from the platform CSPRNG and is a different argument made in a different
 * section of the description.
 *
 * A laboratory will run its own suite. These are demonstrations of diligence
 * and a way to catch a mistake before submitting it, not a substitute.
 */

const OUTCOMES = draws.OUTCOMES;
const DIGITS = draws.DIGITS;
const WORD = 0x1_0000_0000;

/** A seed that depends only on its index, so every sample reproduces. */
function derivedSeed(label, index) {
  return crypto.createHash('sha256').update(`${label}|${index}`, 'utf8').digest('hex');
}

function chiSquareOf(counts, expected) {
  let total = 0;
  for (const observed of counts) total += ((observed - expected) ** 2) / expected;
  return total;
}

// ------------------------------------------------------------ the scaling

/**
 * The rejection bound, as arithmetic rather than as a claim.
 *
 * 2^32 is not a multiple of 1,000. Taking a modulo of the whole range would
 * make the first 296 outcomes very slightly more likely than the rest - about
 * one part in 14.5 million, which is small, undetectable in practice, and
 * still a game of chance rigged in a direction nobody chose. Values at or above
 * the largest multiple of 1,000 below 2^32 are discarded instead.
 */
function scaling() {
  const limit = Math.floor(WORD / OUTCOMES) * OUTCOMES;
  const discarded = WORD - limit;
  const perWord = discarded / WORD;
  const wordsPerDigest = 32 / 4;

  return {
    word: WORD,
    limit,
    discarded,
    rejectionPerWord: perWord,
    wordsPerDigest,
    // Every word in a digest has to be rejected before the counter advances.
    rejectionPerDigest: perWord ** wordsPerDigest,
    counterLimit: 1000,
    // What the modulo would have cost, had it been used: the favoured outcomes
    // would appear (limit/1000 + 1) times against (limit/1000) for the rest.
    modBiasRelative: 1 / Math.floor(limit / OUTCOMES)
  };
}

// -------------------------------------------------------------- the sample

/**
 * One pass over N derived seeds, accumulating everything a uniformity argument
 * needs: the outcome distribution, each digit position on its own, and whether
 * one draw says anything about the next.
 */
function sample({ draws: n = 1_000_000, drawKey = 'rng-evidence', label = 'rng' } = {}) {
  const outcome = new Uint32Array(OUTCOMES);
  const position = [new Uint32Array(10), new Uint32Array(10), new Uint32Array(10)];
  const pairs = new Uint32Array(100);

  let previous = null;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let consecutive = 0;

  for (let i = 0; i < n; i++) {
    const result = draws.resultFromSeed(drawKey, derivedSeed(label, i));
    const value = Number(result);
    outcome[value] += 1;
    for (let p = 0; p < DIGITS; p++) position[p][Number(result[p])] += 1;

    if (previous !== null) {
      pairs[(previous % 10) * 10 + (value % 10)] += 1;
      sumX += previous;
      sumY += value;
      sumXY += previous * value;
      sumXX += previous * previous;
      sumYY += value * value;
      consecutive += 1;
    }
    previous = value;
  }

  const expected = n / OUTCOMES;
  const uniformity = {
    draws: n,
    expectedPerOutcome: expected,
    chiSquare: chiSquareOf(outcome, expected),
    df: OUTCOMES - 1,
    min: Math.min(...outcome),
    max: Math.max(...outcome),
    empty: [...outcome].filter((count) => count === 0).length
  };
  Object.assign(uniformity, chiSquareTail(uniformity.chiSquare, uniformity.df));

  const positions = position.map((counts, index) => {
    const chiSquare = chiSquareOf(counts, n / 10);
    return { position: index + 1, chiSquare, df: 9, ...chiSquareTail(chiSquare, 9) };
  });

  const serialChi = chiSquareOf(pairs, consecutive / 100);
  const serial = { pairs: consecutive, chiSquare: serialChi, df: 99, ...chiSquareTail(serialChi, 99) };

  // Pearson correlation between one draw and the next. Under independence it
  // is zero, with a standard error of about 1/sqrt(N).
  const numerator = consecutive * sumXY - sumX * sumY;
  const denominator = Math.sqrt((consecutive * sumXX - sumX * sumX) * (consecutive * sumYY - sumY * sumY));
  const r = denominator === 0 ? 0 : numerator / denominator;
  const correlation = { r, z: r * Math.sqrt(consecutive - 1), standardError: 1 / Math.sqrt(consecutive) };
  correlation.p = erfc(Math.abs(correlation.z) / Math.SQRT2);

  return { drawKey, uniformity, positions, serial, correlation };
}

// ------------------------------------------------------ sensitivity

/**
 * One bit of the seed changed, and the result forgotten.
 *
 * A near-miss on the seed must not be a near-miss on the number, or a leaked
 * fragment of a seed would narrow the outcome. Expected agreement between a
 * seed and its neighbour is exactly the chance two unrelated draws agree:
 * 1 in 1,000.
 */
function avalanche({ draws: n = 200_000, drawKey = 'rng-evidence', label = 'avalanche' } = {}) {
  let same = 0;
  for (let i = 0; i < n; i++) {
    const seed = derivedSeed(label, i);
    const bytes = Buffer.from(seed, 'hex');
    // A deterministic bit, spread across the whole seed as i advances.
    const bit = i % 256;
    bytes[bit >> 3] ^= 1 << (bit & 7);

    if (draws.resultFromSeed(drawKey, seed) === draws.resultFromSeed(drawKey, bytes.toString('hex'))) same += 1;
  }

  const expected = n / OUTCOMES;
  const z = (same - expected) / Math.sqrt(expected * (1 - 1 / OUTCOMES));
  return { draws: n, agreed: same, expected, z, p: erfc(Math.abs(z) / Math.SQRT2) };
}

/**
 * The same seed under two different draw keys.
 *
 * The commitment binds a seed to the draw it was published for, so a seed
 * revealed for Monday must say nothing about Tuesday. Agreement should again be
 * 1 in 1,000 - no better than chance.
 */
function keySeparation({ draws: n = 200_000, label = 'separation' } = {}) {
  let same = 0;
  for (let i = 0; i < n; i++) {
    const seed = derivedSeed(label, i);
    if (draws.resultFromSeed('2026-09-01', seed) === draws.resultFromSeed('2026-09-02', seed)) same += 1;
  }

  const expected = n / OUTCOMES;
  const z = (same - expected) / Math.sqrt(expected * (1 - 1 / OUTCOMES));
  return { draws: n, agreed: same, expected, z, p: erfc(Math.abs(z) / Math.SQRT2) };
}

// ----------------------------------------------------------------- the seed

/**
 * What a seed is, and how large the space is compared with what it selects.
 *
 * A 256-bit seed choosing between 1,000 outcomes is an enormous surplus, and
 * the surplus has a consequence worth stating rather than leaving to be found:
 * roughly one seed in a thousand produces any given result, so anybody
 * generating seeds can search for the number they want. That is exactly what
 * the laboratory harness does, and it is why the commitment has to be published
 * before betting opens rather than merely before the draw.
 */
function seedSpace() {
  const bits = 256;
  return {
    bytes: 32,
    bits,
    format: '64 lowercase hexadecimal characters',
    source: 'crypto.randomBytes',
    outcomes: OUTCOMES,
    seedsPerOutcome: `about 2^${bits} / ${OUTCOMES}`,
    searchExpectedTries: OUTCOMES
  };
}

/** The whole battery, over one independent set of derived seeds. */
function battery({ label, drawKey, draws: n, pairs }) {
  return {
    label,
    sample: sample({ draws: n, drawKey, label }),
    avalanche: avalanche({ draws: pairs, drawKey, label: `${label}-avalanche` }),
    keySeparation: keySeparation({ draws: pairs, label: `${label}-separation` })
  };
}

/**
 * Every test on one list, so a reader does not have to scan for the one that
 * came back low.
 *
 * Reporting several tests and then presenting only the comfortable ones is the
 * oldest way to make a generator look good. The list is complete, in a fixed
 * order, and the document names anything under 0.05 out loud.
 */
function readingsOf({ sample: taken, avalanche: bits, keySeparation: keys }) {
  return [
    { name: 'Uniformity over all outcomes', statistic: `chi-square ${taken.uniformity.chiSquare.toFixed(2)} on ${taken.uniformity.df} df`, p: taken.uniformity.pUpper },
    ...taken.positions.map((position) => ({
      name: `Digit position ${position.position}`,
      statistic: `chi-square ${position.chiSquare.toFixed(2)} on ${position.df} df`,
      p: position.pUpper
    })),
    { name: 'Consecutive pairs', statistic: `chi-square ${taken.serial.chiSquare.toFixed(2)} on ${taken.serial.df} df`, p: taken.serial.pUpper },
    { name: 'Serial correlation', statistic: `r = ${taken.correlation.r.toExponential(2)}`, p: taken.correlation.p },
    { name: 'One bit of the seed changed', statistic: `${bits.agreed} agreed, ${bits.expected} expected`, p: bits.p },
    { name: 'Same seed, different draw key', statistic: `${keys.agreed} agreed, ${keys.expected} expected`, p: keys.p }
  ];
}

/**
 * The battery is run twice, over independent sets of seeds, and both columns
 * are printed.
 *
 * Eight tests means roughly one chance in three that something lands below 0.05
 * on any honest generator, and an argument about multiple comparisons is a
 * worse answer than a replication. A reading that is low in one column and
 * healthy in the other is noise, visibly. A reading low in both is a finding,
 * and the document says which it is rather than leaving it to the reader.
 */
function summary(primary, confirmation) {
  const first = readingsOf(primary);
  const second = readingsOf(confirmation);
  const readings = first.map((reading, index) => ({
    ...reading,
    confirmP: second[index].p,
    confirmStatistic: second[index].statistic
  }));

  const low = readings.filter((reading) => reading.p < 0.05);
  return {
    readings,
    tests: readings.length,
    low,
    lowInBoth: readings.filter((reading) => reading.p < 0.05 && reading.confirmP < 0.05),
    chanceOfOneLow: 1 - (0.95 ** readings.length),
    alarming: readings.filter((reading) => Math.max(reading.p, reading.confirmP) < 0.001)
  };
}

function compute({ draws = 1_000_000, pairs = 200_000, confirmationRatio = 0.2 } = {}) {
  const primary = battery({ label: 'rng', drawKey: 'rng-evidence', draws, pairs });
  const confirmation = battery({
    label: 'rng-replication',
    drawKey: 'rng-replication',
    draws: Math.max(10_000, Math.round(draws * confirmationRatio)),
    pairs: Math.max(5_000, Math.round(pairs * confirmationRatio))
  });

  return {
    scaling: scaling(),
    seed: seedSpace(),
    primary,
    confirmation,
    // Kept flat as well, because the body of the document reads from the
    // primary battery and should not have to know there are two.
    sample: primary.sample,
    avalanche: primary.avalanche,
    keySeparation: primary.keySeparation,
    summary: summary(primary, confirmation)
  };
}

module.exports = {
  compute, scaling, sample, avalanche, keySeparation, seedSpace, summary, battery, readingsOf,
  derivedSeed, chiSquareOf, OUTCOMES, WORD
};
