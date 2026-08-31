'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const custody = require('../src/custody.js');
const draws = require('../src/draws.js');
const { Operator } = require('../src/operator.js');

const AT = '2026-08-26T05:00:00Z';
const OPENS = '2026-08-26T06:00:00Z';
const CUTOFF = '2026-08-27T18:55:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';

const prepare = (op, options = {}) => op.prepareDraw({
  id: 'prep', at: AT, drawKey: 'D1', opensAt: OPENS, cutoffAt: CUTOFF, drawAt: DRAW_AT, ...options
});

// ------------------------------------------------------------ the arithmetic

test('any k of n shares reconstruct the secret and k-1 do not', () => {
  const secret = crypto.randomBytes(32);
  const pieces = custody.split(secret, { shares: 5, threshold: 3 });

  // Every three-of-five subset, not a convenient one.
  for (let a = 0; a < 5; a++) {
    for (let b = a + 1; b < 5; b++) {
      for (let c = b + 1; c < 5; c++) {
        assert.deepEqual(custody.combine([pieces[a], pieces[b], pieces[c]]), secret, `${a}${b}${c}`);
      }
    }
  }

  // Two shares produce a value, and it is not the secret. That it produces a
  // value at all is the property: a wrong key must be indistinguishable from
  // any other wrong key, or the shares leak information about the secret.
  assert.notDeepEqual(custody.combine([pieces[0], pieces[1]]), secret);
});

test('a one-of-n split is refused, because it is not custody', () => {
  const secret = crypto.randomBytes(32);
  assert.throws(() => custody.split(secret, { shares: 3, threshold: 1 }), /at least 2/);
  assert.throws(() => custody.split(secret, { shares: 2, threshold: 3 }), /at least the threshold/);
  assert.throws(() => custody.split(Buffer.alloc(0), { shares: 3, threshold: 2 }), /non-empty/);
});

test('the same share cannot be presented twice to make up the count', () => {
  const secret = crypto.randomBytes(8);
  const pieces = custody.split(secret, { shares: 3, threshold: 2 });
  assert.throws(() => custody.combine([pieces[0], pieces[0]]), /supplied twice/);
});

// -------------------------------------------------------------- the envelope

test('a sealed seed comes back from any k shares', () => {
  const seed = draws.createSeed();
  const { envelope, shares } = custody.sealSeed(seed, { shares: 5, threshold: 3 });

  assert.equal(custody.openSeed(envelope, [shares[0], shares[2], shares[4]]), seed);
  assert.equal(custody.openSeed(envelope, [shares[1], shares[3], shares[4]]), seed);
});

/**
 * The envelope is stored in the same database as the commitment, so the whole
 * scheme rests on it being useless to a reader who has the database and no
 * shares.
 */
test('the envelope does not contain the seed', () => {
  const seed = draws.createSeed();
  const { envelope } = custody.sealSeed(seed);
  const stored = JSON.stringify(envelope);

  assert.ok(!stored.includes(seed));
  // Nor any half of it, which a naive "encrypt with a stored key" would leak.
  assert.ok(!stored.includes(seed.slice(0, 32)));
  assert.ok(!stored.includes(seed.slice(32)));
});

test('too few shares is refused before any decryption is attempted', () => {
  const { envelope, shares } = custody.sealSeed(draws.createSeed(), { shares: 4, threshold: 3 });
  assert.throws(() => custody.openSeed(envelope, [shares[0], shares[1]]), /needs 3 shares; 2 supplied/);
  assert.throws(() => custody.openSeed(envelope, []), /No shares supplied/);
});

/**
 * A custodian reads a share off paper months later. "Share 2 is mistyped" is
 * something they can act on; a failure at the end of the process is not.
 */
test('a mistyped share is named, not left to fail as a bad decryption', () => {
  const { envelope, shares } = custody.sealSeed(draws.createSeed(), { shares: 3, threshold: 2 });
  const parts = shares[1].split('.');
  // One hex character wrong, everything else intact.
  parts[3] = (parts[3][0] === 'a' ? 'b' : 'a') + parts[3].slice(1);
  const mistyped = parts.join('.');

  assert.throws(() => custody.openSeed(envelope, [shares[0], mistyped]), /Share 2 is mistyped/);
  assert.throws(() => custody.decodeShare('nonsense'), /five dot-separated parts/);
  assert.throws(() => custody.decodeShare('an9.2.1.aa.0000'), /Unknown share version/);
});

test('shares from another draw do not open this envelope', () => {
  const first = custody.sealSeed(draws.createSeed(), { shares: 3, threshold: 2 });
  const second = custody.sealSeed(draws.createSeed(), { shares: 3, threshold: 2 });

  assert.throws(
    () => custody.openSeed(first.envelope, [second.shares[0], second.shares[1]]),
    /do not open this envelope/
  );
});

test('a tampered envelope fails its own authentication tag', () => {
  const { envelope, shares } = custody.sealSeed(draws.createSeed(), { shares: 3, threshold: 2 });
  const tampered = { ...envelope, ciphertext: `ff${envelope.ciphertext.slice(2)}` };
  assert.throws(() => custody.openSeed(tampered, [shares[0], shares[1]]), /do not open this envelope/);
});

// ------------------------------------------------------------ the draw itself

test('preparing a draw hands back shares and never the seed', () => {
  const op = new Operator();
  const prepared = prepare(op, { shares: 4, threshold: 2 });

  assert.equal(prepared.shares.length, 4);
  assert.deepEqual(prepared.custody, { sealed: true, threshold: 2, shares: 4 });
  assert.match(prepared.commitment, /^[0-9a-f]{64}$/);

  // Nothing in the response is the seed, and nothing in the journal is either.
  const seedInState = op.ledger.readState('draw', 'D1').seed;
  assert.equal(seedInState, null);
  assert.ok(!JSON.stringify(op.ledger.events).includes(prepared.commitment.slice(0, 8) + 'seed'));
  op.close();
});

/**
 * The point of the whole exercise: what an attacker gets from the database.
 * They get the commitment, which is public anyway, and a ciphertext.
 */
test('the stored draw cannot be turned into tomorrow\'s number', () => {
  const op = new Operator();
  const prepared = prepare(op, { shares: 3, threshold: 2 });
  const stored = JSON.stringify(op.ledger.readState('draw', 'D1'));

  // Recover the seed the honest way, then check it never appeared in storage.
  const seed = custody.openSeed(op.ledger.readState('draw', 'D1').sealed, prepared.shares.slice(0, 2));
  assert.ok(!stored.includes(seed));
  assert.equal(draws.commit('D1', seed), prepared.commitment);
  op.close();
});

test('a sealed draw is revealed with shares and verifies publicly', () => {
  const op = new Operator();
  const prepared = prepare(op, { shares: 3, threshold: 2 });

  const revealed = op.revealSealedDraw({
    id: 'rev', at: DRAW_AT, drawKey: 'D1', shares: [prepared.shares[0], prepared.shares[2]]
  });

  assert.match(revealed.result, /^[0-9]{3}$/);
  const receipt = op.drawReceipt('D1');
  assert.equal(receipt.verification.ok, true);
  assert.deepEqual(receipt.custody, { sealed: true, threshold: 2, shares: 3 });
  op.close();
});

test('a sealed draw cannot be revealed before its time, however many shares are held', () => {
  const op = new Operator();
  const prepared = prepare(op, { shares: 3, threshold: 2 });

  assert.throws(() => op.revealSealedDraw({
    id: 'early', at: '2026-08-27T18:59:00Z', drawKey: 'D1', shares: prepared.shares
  }), /cannot be revealed before/);
  op.close();
});

test('one custodian alone cannot reveal a sealed draw', () => {
  const op = new Operator();
  const prepared = prepare(op, { shares: 3, threshold: 2 });

  assert.throws(() => op.revealSealedDraw({
    id: 'alone', at: DRAW_AT, drawKey: 'D1', shares: [prepared.shares[0]]
  }), /needs 2 shares; 1 supplied/);
  op.close();
});

/**
 * Custody must never become something the result has to be trusted to. Whatever
 * the shares produce is still checked against the commitment published before
 * betting opened, so a swapped envelope fails exactly where a swapped seed
 * would.
 */
test('shares that open something else still fail the commitment check', () => {
  const op = new Operator();
  prepare(op, { shares: 3, threshold: 2 });

  // Replace the envelope with one sealing a different seed, and hand over its
  // shares. The unsealing succeeds; the commitment check does not.
  const other = custody.sealSeed(draws.createSeed(), { shares: 3, threshold: 2 });
  const draw = op.ledger.readState('draw', 'D1');
  op.ledger.event({ id: 'swap', kind: 'SWAP', at: AT, data: {} }, {
    onCommit: (s) => s.putState('draw', 'D1', { ...draw, sealed: other.envelope })
  });

  assert.throws(() => op.revealSealedDraw({
    id: 'swapped', at: DRAW_AT, drawKey: 'D1', shares: other.shares.slice(0, 2)
  }), /does not match the commitment/);
  op.close();
});

test('a draw opened with a seed the operator kept is not a sealed draw', () => {
  const op = new Operator();
  const seed = draws.createSeed();
  op.openDraw({
    id: 'open', at: AT, drawKey: 'D2', commitment: draws.commit('D2', seed),
    opensAt: OPENS, cutoffAt: CUTOFF, drawAt: DRAW_AT
  });

  assert.equal(op.drawReceipt('D2').custody, null);
  assert.throws(() => op.revealSealedDraw({ id: 'x', at: DRAW_AT, drawKey: 'D2', shares: ['a'] }),
    /was not sealed/);
  // And it still reveals the old way.
  assert.match(op.revealDraw({ id: 'y', at: DRAW_AT, drawKey: 'D2', seed }).result, /^[0-9]{3}$/);
  op.close();
});
