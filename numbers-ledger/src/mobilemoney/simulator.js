'use strict';

const { ProviderRejected, ProviderTimeout, ProviderUnavailable, STATUS } = require('./provider.js');

/**
 * A mobile money provider that misbehaves on purpose.
 *
 * The point is not to stand in for a real integration until one is signed. It
 * is that the integration is the easy half: what breaks in production is the
 * callback that arrives twice, the one that arrives in the wrong order, the
 * request that times out with the money already moving, and the outage that
 * lands mid-run. Those are all reproducible here, deterministically, today.
 *
 * Behaviour is scripted rather than random. A test that fails one run in fifty
 * is a test nobody trusts, and a race you cannot reproduce is one you cannot
 * prove you fixed.
 *
 *   const provider = new SimulatedProvider();
 *   provider.script('timeout');            // the next call times out
 *   provider.script('outage', 'happy');    // then an outage, then normality
 *
 * Scripted behaviours:
 *   happy      accepted, PENDING, one SUCCEEDED callback
 *   reject     refused outright (bad number, insufficient funds at the telco)
 *   fail       accepted, then a FAILED callback
 *   timeout    no answer - but the transfer IS accepted internally, which is
 *              the whole difficulty: the caller cannot tell
 *   lost       no answer, and nothing was accepted
 *   outage     provider down; nothing accepted
 *   duplicate  accepted, and the SUCCEEDED callback is emitted twice
 *   reorder    accepted, callbacks emitted SUCCEEDED then a stale PENDING
 *   late-fail  accepted, SUCCEEDED, and then a contradicting FAILED
 *   short      accepted, but the callback reports a smaller amount
 */
class SimulatedProvider {
  #transfers = new Map();     // clientRef -> record
  #queue = [];                // scripted behaviours, consumed in order
  #callbacks = [];            // callbacks waiting to be delivered
  #default;
  #seq = 0;

  constructor({ defaultBehaviour = 'happy' } = {}) {
    this.#default = defaultBehaviour;
  }

  /** Queue behaviours for the next calls, in order. */
  script(...behaviours) {
    this.#queue.push(...behaviours);
    return this;
  }

  #next() {
    return this.#queue.length > 0 ? this.#queue.shift() : this.#default;
  }

  #ref() {
    this.#seq += 1;
    return `PSP-${String(this.#seq).padStart(6, '0')}`;
  }

  #start(kind, { clientRef, msisdn, amountMinor, at }) {
    // Idempotent on OUR reference. A provider that cannot do this is one where
    // a timeout can never be resolved safely.
    const existing = this.#transfers.get(clientRef);
    if (existing) return { providerRef: existing.providerRef, status: existing.status };

    const behaviour = this.#next();

    if (behaviour === 'outage') {
      throw new ProviderUnavailable('Provider is unavailable', { clientRef });
    }
    if (behaviour === 'reject') {
      throw new ProviderRejected('Transfer refused by the provider', { code: 'REFUSED', clientRef });
    }
    if (behaviour === 'lost') {
      // Nothing accepted, and no answer. getStatus will say UNKNOWN.
      throw new ProviderTimeout('No response from the provider', { clientRef });
    }

    const providerRef = this.#ref();
    const record = { kind, clientRef, providerRef, msisdn, amountMinor, at, status: STATUS.PENDING, behaviour };
    this.#transfers.set(clientRef, record);

    const emit = (status, amount = amountMinor) =>
      this.#callbacks.push({ clientRef, providerRef, status, amountMinor: amount, at });

    switch (behaviour) {
      case 'fail':
        record.status = STATUS.FAILED;
        emit(STATUS.FAILED);
        break;
      case 'duplicate':
        record.status = STATUS.SUCCEEDED;
        emit(STATUS.SUCCEEDED);
        emit(STATUS.SUCCEEDED);
        break;
      case 'reorder':
        record.status = STATUS.SUCCEEDED;
        emit(STATUS.SUCCEEDED);
        emit(STATUS.PENDING);
        break;
      case 'late-fail':
        record.status = STATUS.SUCCEEDED;
        emit(STATUS.SUCCEEDED);
        emit(STATUS.FAILED);
        break;
      case 'short':
        // The provider genuinely moved a different amount, so its own records
        // say so too. A simulator whose callback and status API disagree would
        // let a reconciliation sweep quietly "resolve" the mismatch.
        record.status = STATUS.SUCCEEDED;
        record.amountMinor = amountMinor - 1;
        emit(STATUS.SUCCEEDED, amountMinor - 1);
        break;
      case 'timeout':
        // Accepted, but the caller never hears so. The callback still comes.
        record.status = STATUS.SUCCEEDED;
        emit(STATUS.SUCCEEDED);
        throw new ProviderTimeout('No response from the provider', { clientRef });
      case 'happy':
      default:
        record.status = STATUS.SUCCEEDED;
        emit(STATUS.SUCCEEDED);
        break;
    }

    return { providerRef, status: STATUS.PENDING };
  }

  collect(request) {
    return this.#start('collect', request);
  }

  disburse(request) {
    return this.#start('disburse', request);
  }

  /** What the provider believes, by our reference. The timeout's only cure. */
  getStatus({ clientRef }) {
    const record = this.#transfers.get(clientRef);
    if (!record) return { clientRef, providerRef: null, status: STATUS.UNKNOWN, amountMinor: null };
    return {
      clientRef,
      providerRef: record.providerRef,
      status: record.status,
      amountMinor: record.amountMinor
    };
  }

  // ------------------------------------------------------ test-side controls

  /** Deliver every queued callback, in the order the provider produced them. */
  drain() {
    const pending = this.#callbacks;
    this.#callbacks = [];
    return pending;
  }

  /** A callback for a transfer nobody here started - forged, or misrouted. */
  forgeCallback({ clientRef, amountMinor, status = STATUS.SUCCEEDED, at }) {
    return { clientRef, providerRef: 'PSP-FORGED', status, amountMinor, at };
  }

  get started() {
    return [...this.#transfers.values()];
  }
}

module.exports = { SimulatedProvider };
