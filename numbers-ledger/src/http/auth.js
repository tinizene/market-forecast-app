'use strict';

const crypto = require('node:crypto');

/**
 * Who is calling, and what they are allowed to do.
 *
 * Four kinds of principal, and they are not variations on one another:
 *
 *   operator  staff. Opens draws, suspends runners, sets limits.
 *   agent     a runner. Can move value into a wallet and pay a winner from
 *             their own cash. Can never spend from a wallet.
 *   player    holds a wallet. A token proves who they are; the PIN authorises
 *             each spend, because possession of a handset is not consent.
 *   provider  a mobile money callback. Authenticated by signature, not token.
 *
 * Nothing here trusts an identifier from a request body. A runner's id comes
 * from their token and a player's from theirs - the single most common way an
 * API of this shape is broken is letting the caller name the account they are
 * acting on.
 */

const TOKEN_BYTES = 24;
const SCRYPT_KEYLEN = 32;
const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;
const MAX_PIN_ATTEMPTS = 3;

/** Constant-time compare that does not leak length either. */
function sameSecret(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function hashPin(pin, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(pin), salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash: derived };
}

class Auth {
  #ledger;

  constructor({ ledger, webhookSecret = null }) {
    this.#ledger = ledger;
    this.webhookSecret = webhookSecret;
  }

  // ----------------------------------------------------------------- tokens

  /**
   * Issue a bearer token. Only the hash is stored, so a leaked database does
   * not hand over working credentials - the same reason a password file holds
   * hashes. The plaintext is returned once and never again.
   */
  issueToken({ id, at, kind, subject, roles }) {
    const token = `an_${crypto.randomBytes(TOKEN_BYTES).toString('hex')}`;
    const digest = hashToken(token);
    this.#ledger.event({
      id, kind: 'TOKEN_ISSUED', at, data: { tokenId: digest.slice(0, 12), principalKind: kind, subject, roles }
    }, {
      onCommit: (s) => s.putState('token', digest, { kind, subject, roles, issuedAt: at, revokedAt: null })
    });
    return token;
  }

  revokeToken({ id, at, token }) {
    const digest = hashToken(token);
    this.#ledger.event({ id, kind: 'TOKEN_REVOKED', at, data: { tokenId: digest.slice(0, 12) } }, {
      precondition: (v) => {
        const record = v.getState('token', digest);
        if (!record || record.revokedAt) throw new Error('Unknown or already revoked token');
      },
      onCommit: (s) => s.putState('token', digest, { ...s.getState('token', digest), revokedAt: at })
    });
  }

  /** @returns {null|{kind, subject, roles}} */
  principalFor(token) {
    if (typeof token !== 'string' || !token.startsWith('an_')) return null;
    const record = this.#ledger.readState('token', hashToken(token));
    if (!record || record.revokedAt) return null;
    return { kind: record.kind, subject: record.subject, roles: record.roles };
  }

  // -------------------------------------------------------------- player PINs

  setPlayerPin({ id, at, playerId, pin }) {
    if (!/^[0-9]{4,8}$/.test(String(pin))) throw new Error('A PIN must be 4 to 8 digits');
    const { salt, hash } = hashPin(pin);
    this.#ledger.event({ id, kind: 'PIN_SET', at, data: { playerId } }, {
      onCommit: (s) => s.putState('playerAuth', playerId, { salt, hash, failures: 0, lockedAt: null })
    });
  }

  /**
   * Check a PIN, counting failures.
   *
   * A PIN is four digits over USSD, where it is visible on screen as it is
   * typed and travels with no confidentiality beyond the mobile network. It
   * cannot be the only thing protecting an account, and it certainly cannot be
   * guessable at machine speed - hence the lock.
   */
  checkPin({ id, at, playerId, pin }) {
    const record = this.#ledger.readState('playerAuth', playerId);
    if (!record) return { ok: false, reason: 'no PIN set' };
    if (record.lockedAt) return { ok: false, reason: 'locked' };

    const attempt = hashPin(pin, record.salt);
    if (sameSecret(attempt.hash, record.hash)) {
      if (record.failures > 0) {
        this.#ledger.event({ id: `${id}-reset`, kind: 'PIN_OK', at, data: { playerId } }, {
          onCommit: (s) => s.putState('playerAuth', playerId, { ...s.getState('playerAuth', playerId), failures: 0 })
        });
      }
      return { ok: true };
    }

    const failures = record.failures + 1;
    const locked = failures >= MAX_PIN_ATTEMPTS;
    this.#ledger.event({ id, kind: locked ? 'PIN_LOCKED' : 'PIN_FAILED', at, data: { playerId, failures } }, {
      onCommit: (s) => s.putState('playerAuth', playerId, {
        ...s.getState('playerAuth', playerId), failures, lockedAt: locked ? at : null
      })
    });
    return { ok: false, reason: locked ? 'locked' : 'wrong PIN', attemptsLeft: Math.max(0, MAX_PIN_ATTEMPTS - failures) };
  }

  unlockPlayer({ id, at, playerId }) {
    this.#ledger.event({ id, kind: 'PIN_UNLOCKED', at, data: { playerId } }, {
      precondition: (v) => {
        const record = v.getState('playerAuth', playerId);
        if (!record || !record.lockedAt) throw new Error(`Player ${playerId} is not locked`);
      },
      onCommit: (s) => s.putState('playerAuth', playerId, {
        ...s.getState('playerAuth', playerId), failures: 0, lockedAt: null
      })
    });
  }

  // ------------------------------------------------------------- webhooks

  /**
   * Verify a provider callback.
   *
   * Signed over the timestamp AND the raw body, so a replayed callback with a
   * stale timestamp is refused: without the time in the signed material, a
   * captured "you were paid" callback can be posted back for ever.
   *
   * The raw bytes are signed, not the parsed object - re-serialising JSON is
   * how a signature check comes to pass on something other than what arrived.
   */
  verifyWebhook({ header, rawBody, at }) {
    if (!this.webhookSecret) return { ok: false, reason: 'no webhook secret configured' };
    if (typeof header !== 'string') return { ok: false, reason: 'missing signature' };

    const parts = Object.fromEntries(
      header.split(',').map((part) => part.trim().split('=', 2)).filter((pair) => pair.length === 2)
    );
    if (!parts.t || !parts.v1) return { ok: false, reason: 'malformed signature' };

    const skew = Math.abs(Date.parse(at) - Number(parts.t));
    if (!Number.isFinite(skew) || skew > WEBHOOK_TOLERANCE_MS) {
      return { ok: false, reason: 'timestamp outside the tolerance window' };
    }

    const expected = crypto.createHmac('sha256', this.webhookSecret)
      .update(`${parts.t}.${rawBody}`, 'utf8').digest('hex');
    return sameSecret(parts.v1, expected) ? { ok: true } : { ok: false, reason: 'bad signature' };
  }

  /** Sign a payload the way a provider would. For tests, and for a driver to mirror. */
  signWebhook({ rawBody, at }) {
    const t = String(Date.parse(at));
    const v1 = crypto.createHmac('sha256', this.webhookSecret).update(`${t}.${rawBody}`, 'utf8').digest('hex');
    return `t=${t},v1=${v1}`;
  }
}

module.exports = { Auth, hashToken, hashPin, sameSecret, MAX_PIN_ATTEMPTS, WEBHOOK_TOLERANCE_MS };
