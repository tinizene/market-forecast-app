'use strict';

const crypto = require('node:crypto');

/**
 * The draw authority: commit-reveal, and the timing rules around it.
 *
 * Everything here is pure - no clock, no storage. The two promises it exists
 * to keep are separate and both matter:
 *
 *   1. The operator cannot choose a number after seeing the book. A seed is
 *      generated and its commitment published BEFORE betting opens; the result
 *      is a deterministic function of that seed. Revealing a different seed
 *      later fails the commitment check, publicly.
 *
 *   2. A bet cannot be entered after the numbers are known. That is a timing
 *      rule (see cutoff below), enforced against server time, and it is the
 *      caller's job to pass a trustworthy `at`.
 *
 * Without (1) a disputed result has no resolution and the operator's word is
 * the only evidence - untenable in front of a regulator or a crowd.
 */

const DIGITS = 3;
const OUTCOMES = 10 ** DIGITS; // 000-999

/** 32 bytes of CSPRNG output, hex. The secret behind one draw. */
function createSeed() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * The public commitment.
 *
 * The draw key is inside the hash, not just the seed: a commitment is then
 * bound to the draw it was published for, and cannot be replayed against a
 * different day.
 */
function commit(drawKey, seed) {
  assertSeed(seed);
  return crypto.createHash('sha256').update(`${drawKey}|${seed}`, 'utf8').digest('hex');
}

function verifyCommitment(drawKey, seed, commitment) {
  if (typeof commitment !== 'string' || commitment.length !== 64) return false;
  const expected = commit(drawKey, seed);
  // Constant-time: this check gates a payout, so it should not leak by timing.
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(commitment, 'hex'));
}

/**
 * The result, derived from the seed by HMAC and rejection sampling.
 *
 * Rejection sampling rather than a plain modulo: 2^32 is not a multiple of
 * 1000, so `x % 1000` would make the low numbers very slightly more likely.
 * The bias is tiny, but "very slightly rigged in a direction nobody chose" is
 * not a property to ship in a game of chance when the fix is six lines.
 */
/**
 * The largest multiple of OUTCOMES below 2^32. Anything at or above it is
 * discarded rather than folded back in.
 */
const SCALE_LIMIT = Math.floor(0x1_0000_0000 / OUTCOMES) * OUTCOMES;

/**
 * One 32-bit word to one outcome, or null if the word must be discarded.
 *
 * Separated out and exported because the bias it removes is one part in 14.5
 * million, which no sample of any feasible size can detect. A statistical test
 * cannot tell a rejecting sampler from a plain modulo, so the guard has to be
 * checked exactly rather than measured - and it cannot be checked exactly
 * while it is buried inside a loop that only ever sees HMAC output.
 *
 * @param {number} value an unsigned 32-bit integer
 * @returns {string|null} three digits, or null when the word is out of range
 */
function scaleWord(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new RangeError(`scaleWord needs an unsigned 32-bit integer, got ${value}`);
  }
  if (value >= SCALE_LIMIT) return null;
  return String(value % OUTCOMES).padStart(DIGITS, '0');
}

function resultFromSeed(drawKey, seed) {
  assertSeed(seed);

  for (let counter = 0; counter < 1000; counter++) {
    const mac = crypto.createHmac('sha256', Buffer.from(seed, 'hex'))
      .update(`${drawKey}|${counter}`, 'utf8')
      .digest();
    for (let offset = 0; offset + 4 <= mac.length; offset += 4) {
      const scaled = scaleWord(mac.readUInt32BE(offset));
      if (scaled !== null) return scaled;
    }
  }
  // 2^-2000-ish. Throwing beats returning a biased number.
  throw new Error(`Exhausted rejection sampling for draw ${drawKey}`);
}

/**
 * The check anyone can run afterwards - a player, an auditor, a regulator.
 * Returns every reason it failed rather than the first, so a dispute gets a
 * complete answer in one pass.
 */
function verifyDraw({ drawKey, seed, commitment, result }) {
  const reasons = [];

  if (typeof seed !== 'string' || !/^[0-9a-f]{64}$/.test(seed)) {
    reasons.push('seed is not 32 bytes of hex');
  } else {
    if (!verifyCommitment(drawKey, seed, commitment)) {
      reasons.push('seed does not match the published commitment');
    }
    const derived = resultFromSeed(drawKey, seed);
    if (derived !== result) {
      reasons.push(`result ${result} is not what the seed derives (${derived})`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

function assertSeed(seed) {
  if (typeof seed !== 'string' || !/^[0-9a-f]{64}$/.test(seed)) {
    throw new TypeError('Seed must be 64 hex characters (32 bytes)');
  }
}

// ------------------------------------------------------------------ timing

/**
 * A draw's timetable. The cutoff sits before the draw so that a request
 * arriving in the gap is unambiguous rather than a judgement call.
 *
 * All three are ISO strings in UTC. Local draw time is a presentation concern;
 * the ledger and the cutoff run on one clock.
 */
function schedule({ drawKey, drawAt, cutoffLeadMinutes = 5, opensAt = null }) {
  const draw = new Date(drawAt);
  if (Number.isNaN(draw.getTime())) throw new TypeError(`drawAt is not a date: ${drawAt}`);
  if (!Number.isInteger(cutoffLeadMinutes) || cutoffLeadMinutes < 0) {
    throw new RangeError('cutoffLeadMinutes must be a non-negative integer');
  }

  const cutoff = new Date(draw.getTime() - cutoffLeadMinutes * 60_000);
  const opens = opensAt ? new Date(opensAt) : new Date(cutoff.getTime() - 24 * 60 * 60_000);
  if (opens >= cutoff) throw new RangeError('Betting must open before it closes');

  return {
    drawKey,
    opensAt: opens.toISOString(),
    cutoffAt: cutoff.toISOString(),
    drawAt: draw.toISOString()
  };
}

/** Is `at` inside the window where this draw accepts bets? */
function acceptsBetsAt(draw, at) {
  const t = Date.parse(at);
  return t >= Date.parse(draw.opensAt) && t < Date.parse(draw.cutoffAt);
}

module.exports = {
  DIGITS,
  OUTCOMES,
  SCALE_LIMIT,
  scaleWord,
  createSeed,
  commit,
  verifyCommitment,
  resultFromSeed,
  verifyDraw,
  schedule,
  acceptsBetsAt
};
