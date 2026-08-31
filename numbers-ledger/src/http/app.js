'use strict';

const { Auth } = require('./auth.js');

/**
 * The HTTP surface.
 *
 * A small hand-rolled router rather than a framework, for the same reason the
 * rest of this package has no dependencies: what it does has to be readable in
 * one sitting by somebody deciding whether to trust it with money.
 *
 * Four rules are enforced here rather than left to each handler, because each
 * one is a way this shape of API is routinely broken:
 *
 *   1. The server stamps the time. `at` is never read from a request. A
 *      client-supplied timestamp would defeat the cutoff, and the cutoff is
 *      the reason the draw can be trusted at all.
 *
 *   2. The subject comes from the token. A runner's agentId and a player's
 *      playerId are taken from their credentials, never from the body. Letting
 *      a caller name the account they are acting on is the classic broken
 *      access control bug, and in this system it is a theft primitive.
 *
 *   3. Money moves only with an Idempotency-Key. It becomes the ledger
 *      transaction id, so a retried request - a dropped USSD session, a mobile
 *      client on a bad connection - is a no-op rather than a second payment.
 *
 *   4. A refused guard is a 409, not a 500. "You cannot stake more than your
 *      wallet" is an expected answer, and an API that reports it as a server
 *      fault teaches its callers to retry.
 */

const JSON_TYPE = { 'content-type': 'application/json; charset=utf-8' };

class HttpError extends Error {
  constructor(status, message, detail = null) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/** A guard rejection reads as a conflict; everything unexpected is ours. */
function statusForLedgerError(error) {
  return /already exists|already |cannot |not enough|is suspended|self-excluded|daily |Unknown |closed at|does not open|has not |Only |is not /i
    .test(error.message) ? 409 : 500;
}

function createApp({ operator, gateway = null, auth = null, now = () => new Date().toISOString(), logger = null }) {
  if (!operator) throw new TypeError('createApp needs an operator');
  const identity = auth || new Auth({ ledger: operator.ledger });
  const routes = [];

  const route = (method, pattern, options, handler) => {
    const names = [];
    const regex = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, name) => {
      names.push(name);
      return '([^/]+)';
    }) + '$');
    routes.push({ method, regex, names, handler, ...options });
  };

  // ------------------------------------------------------------------ helpers

  const requireBody = (ctx, ...fields) => {
    for (const field of fields) {
      if (ctx.body[field] === undefined || ctx.body[field] === null) {
        throw new HttpError(400, `${field} is required`);
      }
    }
  };

  const amount = (ctx, field) => {
    const value = ctx.body[field];
    if (!Number.isInteger(value) || value <= 0) {
      throw new HttpError(400, `${field} must be a positive whole number of minor units`);
    }
    return value;
  };

  /** The PIN authorises the spend; the token only proves who is asking. */
  const requirePin = (ctx) => {
    requireBody(ctx, 'pin');
    const check = identity.checkPin({
      id: `pin-${ctx.principal.subject}-${ctx.at}-${ctx.idempotencyKey || 'x'}`,
      at: ctx.at, playerId: ctx.principal.subject, pin: ctx.body.pin
    });
    if (!check.ok) throw new HttpError(403, `PIN rejected: ${check.reason}`, { attemptsLeft: check.attemptsLeft });
  };

  // -------------------------------------------------------------------- public

  route('GET', '/health', { auth: false }, () => ({ status: 200, body: { ok: true } }));

  route('GET', '/draws/:key', { auth: false }, (ctx) => {
    const receipt = operator.drawReceipt(ctx.params.key);
    if (!receipt) throw new HttpError(404, 'No such draw');
    // Public on purpose: the commitment and the seed are what let anyone check
    // the number was not chosen after the book was seen.
    return { status: 200, body: receipt };
  });

  // ------------------------------------------------------------------ operator

  route('GET', '/operator/solvency', { roles: ['operator'] }, () => ({
    status: 200, body: operator.ledger.solvency()
  }));

  route('GET', '/operator/agents', { roles: ['operator'] }, (ctx) => {
    const below = ctx.query.below ? Number(ctx.query.below) : null;
    return { status: 200, body: { agents: below === null ? operator.agents() : operator.agentsBelow(below) } };
  });

  route('GET', '/operator/agents/:id/statement', { roles: ['operator'] }, (ctx) => ({
    status: 200,
    body: operator.agentStatement(ctx.params.id, { from: ctx.query.from || null, to: ctx.query.to || null })
  }));

  route('POST', '/operator/agents/:id/suspend', { roles: ['operator'], money: true }, (ctx) => {
    operator.suspendAgent({ id: ctx.txId, at: ctx.at, agentId: ctx.params.id, reason: ctx.body.reason || null });
    return { status: 200, body: { agentId: ctx.params.id, suspended: true } };
  });

  route('POST', '/operator/agents/:id/reinstate', { roles: ['operator'], money: true }, (ctx) => {
    operator.reinstateAgent({ id: ctx.txId, at: ctx.at, agentId: ctx.params.id });
    return { status: 200, body: { agentId: ctx.params.id, suspended: false } };
  });

  route('POST', '/operator/agents/:id/tokens', { roles: ['operator'], money: true }, (ctx) => {
    const token = identity.issueToken({
      id: ctx.txId, at: ctx.at, kind: 'agent', subject: ctx.params.id, roles: ['agent']
    });
    // Returned once. Nothing stores the plaintext, so nothing can show it again.
    return { status: 201, body: { agentId: ctx.params.id, token } };
  });

  route('POST', '/operator/protection', { roles: ['operator'], money: true }, (ctx) => {
    operator.setProtection({
      id: ctx.txId, at: ctx.at,
      dailyStakeMinor: ctx.body.dailyStakeMinor ?? null,
      dailyLossMinor: ctx.body.dailyLossMinor ?? null
    });
    return { status: 200, body: operator.protectionStatus() };
  });

  route('GET', '/operator/protection', { roles: ['operator'] }, () => ({
    status: 200, body: operator.protectionStatus()
  }));

  route('POST', '/operator/draws', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'drawKey', 'commitment', 'opensAt', 'cutoffAt', 'drawAt');
    operator.openDraw({
      id: ctx.txId, at: ctx.at, drawKey: ctx.body.drawKey, commitment: ctx.body.commitment,
      opensAt: ctx.body.opensAt, cutoffAt: ctx.body.cutoffAt, drawAt: ctx.body.drawAt
    });
    return { status: 201, body: operator.drawReceipt(ctx.body.drawKey) };
  });

  route('POST', '/operator/draws/:key/reveal', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'seed');
    const revealed = operator.revealDraw({ id: ctx.txId, at: ctx.at, drawKey: ctx.params.key, seed: ctx.body.seed });
    return { status: 200, body: { drawKey: ctx.params.key, result: revealed.result } };
  });

  // --------------------------------------------------------------------- agent

  route('GET', '/agent/statement', { roles: ['agent'] }, (ctx) => ({
    status: 200,
    // The subject comes from the token: a runner cannot ask for another
    // runner's book by putting their id in the query string.
    body: operator.agentStatement(ctx.principal.subject, { from: ctx.query.from || null, to: ctx.query.to || null })
  }));

  route('POST', '/agent/cash-in', { roles: ['agent'], money: true }, (ctx) => {
    requireBody(ctx, 'playerId');
    operator.cashIn({
      id: ctx.txId, at: ctx.at, agentId: ctx.principal.subject,
      playerId: ctx.body.playerId, amountMinor: amount(ctx, 'amountMinor')
    });
    return { status: 201, body: operator.playerStatement(ctx.body.playerId, ctx.at) };
  });

  route('POST', '/agent/payout', { roles: ['agent'], money: true }, (ctx) => {
    requireBody(ctx, 'playerId');
    operator.cashPayout({
      id: ctx.txId, at: ctx.at, agentId: ctx.principal.subject, playerId: ctx.body.playerId,
      amountMinor: amount(ctx, 'amountMinor'), commissionMinor: ctx.body.commissionMinor || 0
    });
    return { status: 201, body: operator.agentStatement(ctx.principal.subject) };
  });

  // -------------------------------------------------------------------- player

  route('GET', '/player/me', { roles: ['player'] }, (ctx) => ({
    status: 200, body: operator.playerStatement(ctx.principal.subject, ctx.at)
  }));

  route('POST', '/player/bets', { roles: ['player'], money: true }, (ctx) => {
    requireBody(ctx, 'drawKey', 'selection');
    requirePin(ctx);
    operator.placeBet({
      id: ctx.txId, at: ctx.at, betId: ctx.txId, playerId: ctx.principal.subject,
      drawKey: ctx.body.drawKey, stakeMinor: amount(ctx, 'stakeMinor'), selection: ctx.body.selection
    });
    return { status: 201, body: { betId: ctx.txId, wallet: operator.playerStatement(ctx.principal.subject, ctx.at) } };
  });

  route('POST', '/player/withdrawals', { roles: ['player'], money: true }, (ctx) => {
    if (!gateway) throw new HttpError(503, 'No mobile money gateway is configured');
    requireBody(ctx, 'msisdn');
    requirePin(ctx);
    const result = gateway.requestPayout({
      ref: ctx.txId, at: ctx.at, playerId: ctx.principal.subject,
      msisdn: ctx.body.msisdn, amountMinor: amount(ctx, 'amountMinor'), feeMinor: ctx.body.feeMinor || 0
    });
    // 202: the money has left the wallet and is in flight. Reporting a
    // disbursement as complete before the provider says so is how a payout
    // gets reported twice.
    return { status: 202, body: result };
  });

  route('POST', '/player/session', { auth: false }, (ctx) => {
    requireBody(ctx, 'playerId', 'pin');
    const check = identity.checkPin({
      id: `session-${ctx.body.playerId}-${ctx.at}`, at: ctx.at, playerId: ctx.body.playerId, pin: ctx.body.pin
    });
    // One message for every failure mode. "No PIN set" and "wrong PIN" told
    // apart is an account-enumeration oracle over a public endpoint.
    if (!check.ok) throw new HttpError(401, 'Could not sign in');
    const token = identity.issueToken({
      id: `token-${ctx.body.playerId}-${ctx.at}`, at: ctx.at,
      kind: 'player', subject: ctx.body.playerId, roles: ['player']
    });
    return { status: 201, body: { playerId: ctx.body.playerId, token } };
  });

  // ------------------------------------------------------------------ webhooks

  route('POST', '/webhooks/mobile-money', { auth: 'webhook' }, (ctx) => {
    if (!gateway) throw new HttpError(503, 'No mobile money gateway is configured');
    requireBody(ctx, 'clientRef', 'status', 'amountMinor');
    const result = gateway.handleCallback({
      clientRef: ctx.body.clientRef, providerRef: ctx.body.providerRef || null,
      status: ctx.body.status, amountMinor: ctx.body.amountMinor, at: ctx.at
    });
    // Always 200 once the signature checks out. A provider that gets an error
    // retries, and an anomaly is not something a retry can fix - it is
    // recorded here and answered by a person.
    return { status: 200, body: result };
  });

  // ------------------------------------------------------------------ dispatch

  function authenticate(match, req, rawBody, at) {
    if (match.auth === false) return null;

    if (match.auth === 'webhook') {
      const check = identity.verifyWebhook({ header: req.headers['x-signature'], rawBody, at });
      if (!check.ok) throw new HttpError(401, `Signature rejected: ${check.reason}`);
      return { kind: 'provider', subject: 'provider', roles: ['provider'] };
    }

    const header = req.headers.authorization || '';
    const principal = identity.principalFor(header.startsWith('Bearer ') ? header.slice(7) : null);
    if (!principal) throw new HttpError(401, 'Authentication required');
    if (match.roles && !match.roles.some((role) => principal.roles.includes(role))) {
      throw new HttpError(403, 'Not permitted');
    }
    return principal;
  }

  /**
   * @param {{method, url, headers}} req
   * @param {string} rawBody the bytes as they arrived - the webhook signature
   *        covers these, not a re-serialisation of the parsed object.
   */
  function handle(req, rawBody = '') {
    const at = now();
    const url = new URL(req.url, 'http://service.invalid');
    const match = routes.find((r) => r.method === req.method && r.regex.test(url.pathname));

    try {
      if (!match) throw new HttpError(404, 'No such endpoint');

      const principal = authenticate(match, req, rawBody, at);

      let body = {};
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          throw new HttpError(400, 'Body is not valid JSON');
        }
        if (body === null || typeof body !== 'object' || Array.isArray(body)) {
          throw new HttpError(400, 'Body must be a JSON object');
        }
      }

      const idempotencyKey = req.headers['idempotency-key'] || null;
      if (match.money && !idempotencyKey) {
        throw new HttpError(400, 'An Idempotency-Key header is required for this request');
      }

      const values = url.pathname.match(match.regex).slice(1);
      const ctx = {
        at, body, principal, idempotencyKey,
        txId: idempotencyKey,
        params: Object.fromEntries(match.names.map((name, i) => [name, decodeURIComponent(values[i])])),
        query: Object.fromEntries(url.searchParams)
      };

      return match.handler(ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        return { status: error.status, body: { error: error.message, ...(error.detail || {}) } };
      }
      const status = statusForLedgerError(error);
      if (status === 500 && logger) logger(error);
      return {
        status,
        // A guard's message is written for the caller. An unexpected failure's
        // is not, and saying so beats leaking a stack trace.
        body: { error: status === 409 ? error.message : 'Internal error' }
      };
    }
  }

  /** Adapter for node:http. Kept separate so the app is testable without a socket. */
  function listener(req, res) {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const { status, body } = handle(req, rawBody);
      const payload = JSON.stringify(body);
      res.writeHead(status, { ...JSON_TYPE, 'content-length': Buffer.byteLength(payload) });
      res.end(payload);
    });
  }

  return { handle, listener, auth: identity, routes: routes.map((r) => `${r.method} ${r.regex.source}`) };
}

module.exports = { createApp, HttpError };
