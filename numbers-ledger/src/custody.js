'use strict';

const crypto = require('node:crypto');

/**
 * Custody of a draw seed.
 *
 * The commit-reveal scheme in draws.js is only worth as much as the custody of
 * the seed behind it. Two failures it does not address on its own:
 *
 *   Somebody reads tomorrow's seed and bets on tomorrow's number. Publishing a
 *   commitment stops the operator changing the result after seeing the book;
 *   it does nothing about an insider who knows the result in advance.
 *
 *   Somebody loses the seed. Then the draw can never be revealed, every bet on
 *   it has to be refunded, and the operator's own commitment is the evidence
 *   that they cannot honour it.
 *
 * The answer here is a sealed envelope opened by k of n custodians. The seed is
 * encrypted under a data key that exists nowhere: the key is split into shares,
 * one per custodian, and no fewer than k of them reconstruct it. The envelope
 * is safe to store beside the commitment, because it is inert without shares.
 *
 * What this defends against: read access to the database, a single dishonest
 * custodian, and losing the seed while any k custodians still hold theirs.
 *
 * What it does not defend against: whoever controls the process at the moment
 * the seed is generated, since the plaintext is in memory then. That is a
 * deployment and access-control problem, and pretending otherwise would be the
 * worst thing this file could do.
 */

// ------------------------------------------------------- GF(256) arithmetic

/**
 * Shamir's scheme over GF(2^8), the AES field. Byte-wise, so a 32-byte key is
 * 32 independent polynomials sharing one x coordinate per custodian.
 */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    // Multiply by the generator 3 (x + 1) modulo the AES polynomial 0x11b.
    let next = x << 1;
    if (next & 0x100) next ^= 0x11b;
    x = next ^ x;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}());

function mul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function div(a, b) {
  if (b === 0) throw new RangeError('Division by zero in GF(256)');
  if (a === 0) return 0;
  return EXP[LOG[a] + 255 - LOG[b]];
}

// --------------------------------------------------------- split and combine

const MAX_SHARES = 255; // x = 0 is the secret itself, so there are 255 usable points

/**
 * Split a secret into `shares` pieces, `threshold` of which reconstruct it.
 *
 * @param {Buffer} secret
 * @param {{shares: number, threshold: number, rng?: (n: number) => Buffer}} options
 * @returns {Array<{index: number, bytes: Buffer}>}
 */
function split(secret, { shares, threshold, rng = crypto.randomBytes }) {
  if (!Buffer.isBuffer(secret) || secret.length === 0) {
    throw new TypeError('secret must be a non-empty Buffer');
  }
  if (!Number.isInteger(threshold) || threshold < 2) {
    throw new RangeError('threshold must be at least 2 - a one-of-n split is not custody');
  }
  if (!Number.isInteger(shares) || shares < threshold) {
    throw new RangeError('shares must be at least the threshold');
  }
  if (shares > MAX_SHARES) throw new RangeError(`shares cannot exceed ${MAX_SHARES}`);

  // One random polynomial per byte: coefficients[b][j] is the j-th coefficient
  // of the polynomial whose constant term is secret[b].
  const coefficients = rng(secret.length * (threshold - 1));
  const out = [];

  for (let index = 1; index <= shares; index++) {
    const bytes = Buffer.alloc(secret.length);
    for (let b = 0; b < secret.length; b++) {
      // Horner from the top coefficient down to the secret byte.
      let value = 0;
      for (let j = threshold - 2; j >= 0; j--) {
        value = mul(value, index) ^ coefficients[b * (threshold - 1) + j];
      }
      bytes[b] = mul(value, index) ^ secret[b];
    }
    out.push({ index, bytes });
  }
  return out;
}

/**
 * Reconstruct the secret by Lagrange interpolation at x = 0.
 *
 * Fewer than the threshold produces a value, not an error - that is the point
 * of the scheme, and it is why the caller must check the share count and why
 * the envelope's authentication tag is the real proof that the key is right.
 */
function combine(pieces) {
  if (!Array.isArray(pieces) || pieces.length === 0) throw new TypeError('need at least one share');
  const length = pieces[0].bytes.length;
  const seen = new Set();
  for (const piece of pieces) {
    if (piece.bytes.length !== length) throw new RangeError('shares are of different lengths');
    if (piece.index < 1 || piece.index > MAX_SHARES) throw new RangeError(`bad share index ${piece.index}`);
    if (seen.has(piece.index)) throw new RangeError(`share ${piece.index} was supplied twice`);
    seen.add(piece.index);
  }

  const secret = Buffer.alloc(length);
  for (let b = 0; b < length; b++) {
    let accumulator = 0;
    for (const piece of pieces) {
      let weight = 1;
      for (const other of pieces) {
        if (other.index === piece.index) continue;
        // x = 0, so the term is (0 - other) / (piece - other); in this field
        // subtraction is XOR and negation is the identity.
        weight = mul(weight, div(other.index, piece.index ^ other.index));
      }
      accumulator ^= mul(piece.bytes[b], weight);
    }
    secret[b] = accumulator;
  }
  return secret;
}

// ------------------------------------------------------------ share encoding

const SHARE_VERSION = 'an1';

/** Four hex characters over the body - enough to catch a mistyped share. */
function shareChecksum(body) {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 4);
}

function encodeShare({ index, bytes }, threshold) {
  const body = `${SHARE_VERSION}.${threshold}.${index}.${bytes.toString('hex')}`;
  return `${body}.${shareChecksum(body)}`;
}

/**
 * Decode one share, naming what is wrong with it.
 *
 * A custodian reads these off paper and types them back months later. "Share 2
 * is mistyped" is a message somebody can act on; a decryption failure at the
 * end of the process is not.
 */
function decodeShare(text) {
  const parts = String(text).trim().split('.');
  if (parts.length !== 5) throw new Error('A share has five dot-separated parts');
  const [version, threshold, index, hex, checksum] = parts;
  if (version !== SHARE_VERSION) throw new Error(`Unknown share version ${version}`);
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) throw new Error('Share body is not hex');

  const body = `${version}.${threshold}.${index}.${hex}`;
  if (shareChecksum(body) !== checksum) throw new Error(`Share ${index} is mistyped: checksum does not match`);

  return {
    index: Number(index),
    threshold: Number(threshold),
    bytes: Buffer.from(hex, 'hex')
  };
}

// ------------------------------------------------------------ sealed envelope

const KEY_BYTES = 32;
const IV_BYTES = 12;

/**
 * Seal a seed. The data key is generated here, split, and then forgotten - it
 * is never returned, never stored, and exists only in the shares.
 *
 * @returns {{envelope: object, shares: string[]}} the shares are returned once.
 */
function sealSeed(seed, { shares = 3, threshold = 2, rng = crypto.randomBytes } = {}) {
  if (typeof seed !== 'string' || !/^[0-9a-f]{64}$/.test(seed)) {
    throw new TypeError('seed must be 64 hex characters');
  }
  const key = rng(KEY_BYTES);
  const iv = rng(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);

  const pieces = split(key, { shares, threshold, rng });
  return {
    envelope: {
      v: 1,
      iv: iv.toString('hex'),
      ciphertext: ciphertext.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      threshold,
      shares
    },
    shares: pieces.map((piece) => encodeShare(piece, threshold))
  };
}

/**
 * Open a sealed envelope with k shares.
 *
 * Three things can go wrong and each gets its own message: too few shares, a
 * mistyped share, and shares that are individually well-formed but do not
 * belong to this envelope. The last is what the authentication tag catches -
 * a wrong key produces a wrong plaintext in any unauthenticated scheme, and
 * a wrong seed would then fail the commitment check with no explanation.
 */
function openSeed(envelope, shareTexts) {
  if (!envelope || envelope.v !== 1) throw new Error('Not a sealed seed envelope');
  if (!Array.isArray(shareTexts) || shareTexts.length === 0) throw new Error('No shares supplied');

  const pieces = shareTexts.map(decodeShare);
  if (pieces.length < envelope.threshold) {
    throw new Error(`This draw needs ${envelope.threshold} shares; ${pieces.length} supplied`);
  }

  const key = combine(pieces);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
  try {
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'hex')),
      decipher.final()
    ]).toString('utf8');
  } catch {
    throw new Error('These shares do not open this envelope');
  }
}

/** What may be published about custody: everything except the envelope itself. */
function custodySummary(envelope) {
  if (!envelope) return null;
  return { sealed: true, threshold: envelope.threshold, shares: envelope.shares };
}

module.exports = {
  split, combine, encodeShare, decodeShare,
  sealSeed, openSeed, custodySummary,
  MAX_SHARES, SHARE_VERSION
};
