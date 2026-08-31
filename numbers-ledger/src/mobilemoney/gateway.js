'use strict';

const { ProviderRejected, ProviderTimeout, ProviderUnavailable, STATUS } = require('./provider.js');
const { Refusal } = require('../errors.js');

/**
 * Between a mobile money provider and the ledger.
 *
 * Everything here exists because of one asymmetry: the provider is allowed to
 * be unreliable, and the books are not. A callback may arrive twice, arrive
 * out of order, contradict an earlier one, carry the wrong amount, or name a
 * transfer this operator never started. None of those may move money twice,
 * and none may be silently dropped either - a callback that cannot be applied
 * is a reconciliation item, not a log line.
 *
 * Two rules decide the accounting, and they point in opposite directions:
 *
 *   Money in is recognised when it is confirmed. A collection in flight is not
 *   an asset, because money that might arrive is not money.
 *
 *   Money out is reserved when it is requested. The wallet is debited before
 *   the transfer is attempted, so the same balance cannot be withdrawn twice
 *   while the first attempt is in the air. It waits in a callable liability
 *   until the provider says which way it went.
 *
 * Every resolution that moves money writes the request log in the same ledger
 * transaction, through the operator's onCommit hook. There is no window in
 * which the books say a payout happened and the request log still calls it
 * pending.
 */
class MobileMoneyGateway {
  #operator;
  #provider;
  #seq = 0;

  constructor({ operator, provider }) {
    if (!operator) throw new TypeError('MobileMoneyGateway needs an operator');
    if (!provider) throw new TypeError('MobileMoneyGateway needs a provider');
    this.#operator = operator;
    this.#provider = provider;
  }

  get ledger() {
    return this.#operator.ledger;
  }

  static #fail(message) {
    throw new Refusal(message);
  }

  #record(ref) {
    return this.ledger.readState('mmRequest', ref);
  }

  /** Ids must be unique per event, or the ledger's idempotency swallows the second one. */
  #eventId(prefix, ref) {
    this.#seq += 1;
    return `mm-${prefix}-${ref}-${this.#seq}`;
  }

  /** Merge a patch into a request record, as a durable append-only fact. */
  #note(ref, kind, patch, at) {
    this.ledger.event({ id: this.#eventId(kind.toLowerCase(), ref), kind, at, data: { ref, ...patch } }, {
      onCommit: (s) => {
        const current = s.getState('mmRequest', ref);
        if (current) s.putState('mmRequest', ref, { ...current, ...patch });
      }
    });
  }

  /**
   * Register the intent before calling the provider.
   *
   * This order is the whole recovery story. The reference is ours and it is on
   * disk before anything leaves the process, so a request that times out can
   * be asked about by name rather than guessed at - or, worse, retried into a
   * second payment.
   */
  #open(ref, type, params, at) {
    if (this.#record(ref)) MobileMoneyGateway.#fail(`Mobile money request ${ref} already exists`);
    this.ledger.event({ id: `mm-open-${ref}`, kind: 'MM_REQUESTED', at, data: { ref, type, ...params } }, {
      onCommit: (s) => s.putState('mmRequest', ref, {
        ref, type, ...params, status: STATUS.PENDING, providerRef: null, openedAt: at, resolvedAt: null
      })
    });
  }

  /**
   * Hand the request to the provider, and treat its three failure modes
   * differently. A rejection is terminal. A timeout or an outage is not: the
   * money may well be moving, so the record stays PENDING for reconcile().
   */
  #send(call, ref, request, at) {
    try {
      const { providerRef } = call(request);
      this.#note(ref, 'MM_ACCEPTED', { providerRef }, at);
      return { ref, status: STATUS.PENDING, providerRef };
    } catch (error) {
      if (error instanceof ProviderRejected) {
        this.#resolveFailure(ref, at, `rejected by the provider: ${error.message}`);
        return { ref, status: STATUS.FAILED, reason: error.message };
      }
      if (error instanceof ProviderTimeout || error instanceof ProviderUnavailable) {
        // Deliberately still PENDING. "We do not know" is a state, and it is
        // the one a payments integration most often lies to itself about.
        this.#note(ref, 'MM_UNRESOLVED', { lastError: error.name }, at);
        return { ref, status: STATUS.PENDING, unresolved: error.name };
      }
      throw error;
    }
  }

  // ---------------------------------------------------------- money coming in

  /** A runner buys float by mobile money. Nothing is posted until it lands. */
  requestFloatPurchase({ ref, at, agentId, msisdn, paidMinor, floatMinor }) {
    this.#open(ref, 'float', { agentId, msisdn, amountMinor: paidMinor, floatMinor }, at);
    return this.#send((r) => this.#provider.collect(r), ref, { clientRef: ref, msisdn, amountMinor: paidMinor, at }, at);
  }

  /** A player tops up their own wallet - path C, no runner and no cash. */
  requestTopUp({ ref, at, playerId, msisdn, amountMinor }) {
    this.#open(ref, 'topup', { playerId, msisdn, amountMinor }, at);
    return this.#send((r) => this.#provider.collect(r), ref, { clientRef: ref, msisdn, amountMinor, at }, at);
  }

  // --------------------------------------------------------- money going out

  /**
   * A player withdraws. The wallet is debited here, in the same transaction
   * that opens the request, before the provider is called at all - so a crash
   * between the two leaves the money held rather than double-spendable.
   */
  requestPayout({ ref, at, playerId, msisdn, amountMinor, feeMinor = 0 }) {
    if (this.#record(ref)) MobileMoneyGateway.#fail(`Mobile money request ${ref} already exists`);

    this.#operator.reserveDisbursement({
      id: `mm-reserve-${ref}`, at, playerId, amountMinor, memo: `mobile money ${ref}`,
      onCommit: (s) => s.putState('mmRequest', ref, {
        ref, type: 'payout', playerId, msisdn, amountMinor, feeMinor,
        status: STATUS.PENDING, providerRef: null, openedAt: at, resolvedAt: null
      })
    });

    return this.#send((r) => this.#provider.disburse(r), ref, { clientRef: ref, msisdn, amountMinor, at }, at);
  }

  // ----------------------------------------------------------------- callbacks

  /**
   * Apply a provider callback.
   *
   * @returns {{ref: string, outcome: 'applied'|'duplicate'|'stale'|'anomaly', reason: string}}
   *          Both "applied" and "ignored" have to be legible afterwards, which
   *          is why nothing here returns silently.
   */
  handleCallback({ clientRef, providerRef = null, status, amountMinor, at }) {
    const record = this.#record(clientRef);

    // A callback for something this operator never started: forged, misrouted,
    // or from another environment pointed at this endpoint. Never posted,
    // never dropped.
    if (!record) {
      return this.#anomaly(clientRef, at, 'unknown reference', { providerRef, status, amountMinor });
    }

    if (record.status !== STATUS.PENDING) {
      if (status === record.status) {
        return { ref: clientRef, outcome: 'duplicate', reason: `already ${record.status}` };
      }
      if (status === STATUS.PENDING) {
        return { ref: clientRef, outcome: 'stale', reason: `already ${record.status}` };
      }
      // SUCCEEDED then FAILED, or the reverse. The first terminal answer
      // stands and the contradiction goes to a human: guessing which one the
      // provider meant is how money goes missing in both directions at once.
      return this.#anomaly(clientRef, at, `contradicts a ${record.status} answer`,
        { providerRef, status, amountMinor });
    }

    if (status === STATUS.PENDING) return { ref: clientRef, outcome: 'stale', reason: 'still pending' };

    if (amountMinor !== record.amountMinor) {
      // Posting what the provider says puts the books at odds with the
      // request; posting what was asked for invents money. Neither.
      return this.#anomaly(clientRef, at,
        `amount mismatch: asked ${record.amountMinor}, told ${amountMinor}`,
        { providerRef, status, amountMinor });
    }

    return status === STATUS.SUCCEEDED
      ? this.#resolveSuccess(record, at, providerRef)
      : this.#resolveFailure(clientRef, at, 'the provider reported failure');
  }

  #resolveSuccess(record, at, providerRef) {
    const { ref, type, amountMinor } = record;
    const memo = `mobile money ${ref}`;
    const close = (s) => {
      const current = s.getState('mmRequest', ref);
      s.putState('mmRequest', ref, {
        ...current, status: STATUS.SUCCEEDED, resolvedAt: at,
        providerRef: providerRef || current.providerRef
      });
    };

    if (type === 'float') {
      this.#operator.buyFloat({
        id: `mm-${ref}`, at, agentId: record.agentId,
        paidMinor: amountMinor, floatMinor: record.floatMinor, memo, onCommit: close
      });
    } else if (type === 'topup') {
      this.#operator.topUpWallet({ id: `mm-${ref}`, at, playerId: record.playerId, amountMinor, memo, onCommit: close });
    } else {
      this.#operator.confirmDisbursement({
        id: `mm-${ref}`, at, amountMinor, feeMinor: record.feeMinor, memo, onCommit: close
      });
    }

    return { ref, outcome: 'applied', reason: `${type} succeeded` };
  }

  #resolveFailure(ref, at, reason) {
    const record = this.#record(ref);
    const close = (s) => {
      const current = s.getState('mmRequest', ref);
      if (current) s.putState('mmRequest', ref, { ...current, status: STATUS.FAILED, resolvedAt: at, reason });
    };

    if (record && record.type === 'payout' && record.status === STATUS.PENDING) {
      // The money is held, not spent, so it goes back to the wallet it came
      // from - in the same transaction that closes the request.
      this.#operator.returnDisbursement({
        id: `mm-return-${ref}`, at, playerId: record.playerId,
        amountMinor: record.amountMinor, memo: `mobile money ${ref} failed`, onCommit: close
      });
    } else {
      this.ledger.event({ id: `mm-failed-${ref}`, kind: 'MM_FAILED', at, data: { ref, reason } }, { onCommit: close });
    }

    return { ref, outcome: 'applied', reason };
  }

  /**
   * Record something that could not be applied.
   *
   * The id is derived from the reference and the reason rather than a counter,
   * so the ledger's own idempotency collapses repeats: a mismatch that stays
   * unresolved is re-found by every reconciliation sweep, and a queue that
   * grows a duplicate row every sweep is a queue nobody reads. The same
   * request raising a *different* problem still records separately.
   */
  #anomaly(ref, at, reason, detail) {
    const slug = reason.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
    this.ledger.event({
      id: `mm-anomaly-${ref}-${slug}`, kind: 'MM_ANOMALY', at, data: { ref, reason, ...detail }
    });
    return { ref, outcome: 'anomaly', reason };
  }

  // ------------------------------------------------------------ reconciliation

  /**
   * Ask the provider about everything still in flight.
   *
   * This is what a timed-out request is for, and the answer to an outage:
   * nothing was lost, it was only unresolved, and unresolved is a state the
   * next sweep clears. Runs off our own references, so it works even when the
   * provider's reference was never received.
   */
  reconcile({ at }) {
    const results = [];
    for (const [ref, record] of this.ledger.listState('mmRequest')) {
      if (!record || record.status !== STATUS.PENDING) continue;

      let status;
      try {
        status = this.#provider.getStatus({ clientRef: ref });
      } catch (error) {
        results.push({ ref, outcome: 'unreachable', reason: error.name });
        continue;
      }

      if (status.status === STATUS.UNKNOWN) {
        // The provider never heard of it, so nothing was accepted and the
        // request can be closed rather than left hanging forever.
        results.push(this.#resolveFailure(ref, at, 'the provider never accepted it'));
      } else if (status.status === STATUS.PENDING) {
        results.push({ ref, outcome: 'still-pending', reason: 'the provider is still working' });
      } else {
        results.push(this.handleCallback({
          clientRef: ref, providerRef: status.providerRef,
          status: status.status, amountMinor: status.amountMinor, at
        }));
      }
    }
    return results;
  }

  /** Requests the provider has not resolved. The operator's morning queue. */
  pending() {
    return this.ledger.listState('mmRequest')
      .filter(([, r]) => r && r.status === STATUS.PENDING)
      .map(([, r]) => r);
  }

  /** Callbacks that could not be applied. Nobody's queue unless somebody looks at it. */
  anomalies() {
    return this.ledger.events.filter((e) => e.kind === 'MM_ANOMALY').map((e) => e.data);
  }

  request(ref) {
    return this.#record(ref);
  }
}

module.exports = { MobileMoneyGateway };
