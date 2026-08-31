'use strict';

/**
 * Rate limiting, in this process and no further.
 *
 * A token bucket per key: `limit` requests per `windowMs`, refilling
 * continuously, so a caller who has been quiet for a while may burst and one
 * hammering the same endpoint is held at the average. Fixed windows would let
 * twice the limit through across a window boundary, which is the failure mode
 * that makes people believe a limiter is working when it is not.
 *
 * The clock is injected for the same reason it is everywhere else here: a
 * limiter tested with real time is tested by waiting, and a test that waits
 * gets deleted.
 *
 * Two honest limits on this. It is per process, so two processes allow twice
 * as much - a real deployment puts the limit in front, and this is the floor
 * rather than the policy. And it is in memory, so a restart forgives
 * everybody, which is a reason to keep the PIN lock (which is durable)
 * separate from this rather than folding one into the other.
 */

const DEFAULT_MAX_KEYS = 10_000;

class RateLimiter {
  #buckets = new Map();

  /**
   * @param {{now: () => string, maxKeys?: number}} options
   */
  constructor({ now, maxKeys = DEFAULT_MAX_KEYS }) {
    if (typeof now !== 'function') throw new TypeError('RateLimiter needs a clock');
    this.now = now;
    this.maxKeys = maxKeys;
  }

  /**
   * @returns {{ok: true}|{ok: false, retryAfterSeconds: number}}
   */
  take(key, { limit, windowMs, cost = 1 }) {
    const at = Date.parse(this.now());
    const bucket = this.#buckets.get(key) || { tokens: limit, at };

    // Refill for the time that has passed, capped at the bucket's size.
    const refill = ((at - bucket.at) / windowMs) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + (Number.isFinite(refill) ? refill : 0));
    bucket.at = at;

    if (bucket.tokens < cost) {
      this.#buckets.set(key, bucket);
      const needed = cost - bucket.tokens;
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((needed / limit) * windowMs / 1000)) };
    }

    bucket.tokens -= cost;
    this.#buckets.set(key, bucket);
    this.#prune(at, windowMs);
    return { ok: true };
  }

  /**
   * Drop buckets that have refilled completely - they are indistinguishable
   * from a caller that has never been seen, so keeping them only grows the
   * map. Without this, a limiter keyed on anything caller-controlled is itself
   * the memory exhaustion it was added to prevent.
   */
  #prune(at, windowMs) {
    if (this.#buckets.size <= this.maxKeys) return;
    for (const [key, bucket] of this.#buckets) {
      if (at - bucket.at > windowMs) this.#buckets.delete(key);
    }
    // Still too many: the map is full of active callers, so refuse to grow
    // rather than trading a rate-limit bypass for unbounded memory.
    if (this.#buckets.size > this.maxKeys) this.#buckets.clear();
  }

  get size() {
    return this.#buckets.size;
  }
}

/**
 * What each class of request is allowed.
 *
 * Sign-in is the tight one and is keyed on the account being signed in to, not
 * on the caller: the PIN is four digits, checking one costs a scrypt, and both
 * of those are reasons to answer slowly rather than quickly.
 */
const LIMITS = {
  signIn: { limit: 5, windowMs: 60_000 },
  authenticated: { limit: 120, windowMs: 60_000 },
  webhook: { limit: 600, windowMs: 60_000 },
  anonymous: { limit: 60, windowMs: 60_000 }
};

module.exports = { RateLimiter, LIMITS };
