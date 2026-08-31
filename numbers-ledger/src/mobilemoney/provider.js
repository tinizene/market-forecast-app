'use strict';

/**
 * The mobile money driver contract.
 *
 * Deliberately small, because the interesting problems are not in the API
 * call. They are in what happens afterwards: a callback that arrives twice, a
 * callback that arrives out of order, a request that times out without telling
 * you whether it started, and a provider that goes down halfway through a
 * payout run. The gateway handles those; a driver only has to be honest about
 * which of them just happened.
 *
 * A driver implements:
 *
 *   collect({ clientRef, msisdn, amountMinor, at })
 *   disburse({ clientRef, msisdn, amountMinor, at })
 *       Start a transfer. Both return { providerRef, status } where status is
 *       'PENDING' or, for a provider that answers immediately, terminal.
 *       Both must be safe to call twice with the same clientRef: a provider
 *       that cannot deduplicate on the caller's reference is one you cannot
 *       recover a timeout against, and that is a procurement question, not a
 *       coding one.
 *
 *   getStatus({ clientRef })
 *       What the provider believes about a transfer, by OUR reference. This is
 *       the function that makes a timeout survivable, which is why clientRef
 *       is generated before the call rather than taken from the response.
 *
 * Errors are typed, because "we do not know" and "it definitely failed" call
 * for opposite responses. Treating a timeout as a failure is how a player gets
 * paid twice; treating it as a success is how they never get paid at all.
 */

/** The provider answered, and the answer was no. Safe to treat as terminal. */
class ProviderRejected extends Error {
  constructor(message, { code = null, clientRef = null } = {}) {
    super(message);
    this.name = 'ProviderRejected';
    this.code = code;
    this.clientRef = clientRef;
    this.terminal = true;
  }
}

/**
 * No answer. The request may or may not have been accepted, and the only
 * honest next step is to ask again with getStatus - never to retry blindly
 * with a new reference.
 */
class ProviderTimeout extends Error {
  constructor(message, { clientRef = null } = {}) {
    super(message);
    this.name = 'ProviderTimeout';
    this.clientRef = clientRef;
    this.terminal = false;
  }
}

/** The provider is down (F6). Nothing was accepted; the operation can be re-offered. */
class ProviderUnavailable extends Error {
  constructor(message, { clientRef = null } = {}) {
    super(message);
    this.name = 'ProviderUnavailable';
    this.clientRef = clientRef;
    this.terminal = false;
  }
}

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN'
});

const TERMINAL = Object.freeze([STATUS.SUCCEEDED, STATUS.FAILED]);

module.exports = { ProviderRejected, ProviderTimeout, ProviderUnavailable, STATUS, TERMINAL };
