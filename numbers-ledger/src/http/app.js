'use strict';

const { Auth } = require('./auth.js');
const { consoleFiles, SECURITY_HEADERS } = require('./static.js');
const { Refusal } = require('../errors.js');

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

/**
 * A guard rejection reads as a conflict; everything unexpected is ours.
 *
 * A refusal says so by its type. The pattern below is the fallback for the
 * layers that throw plain errors - the ledger's own validation, mostly - and
 * it is a fallback rather than the rule because matching on the wording of a
 * message means a guard phrased in a new way silently becomes a 500.
 */
function statusForLedgerError(error) {
  if (error instanceof Refusal || (error && error.refusal)) return 409;
  return /already exists|already |cannot |not enough|is suspended|self-excluded|daily |Unknown |closed at|does not open|has not |Only |is not |does not match/i
    .test(error.message) ? 409 : 500;
}

/**
 * @param {object} deps
 * @param {object} deps.operator the book.
 * @param {object} [deps.gateway] mobile money. Without it the money-in-flight
 *        routes answer 503 rather than pretending.
 * @param {object} [deps.auth]
 * @param {function} [deps.evaluate] the game's settlement rule,
 *        `(bet, result) => payoutMinor`. Injected, not imported: the ledger
 *        holds no bet types and neither does this layer.
 * @param {function} [deps.now] the server clock. Never a request field.
 * @param {boolean} [deps.serveConsole] serve the operator console's static
 *        files. The page itself holds no data and needs no credential; every
 *        figure on it comes from an authenticated call it makes afterwards.
 */
function createApp({
  operator, gateway = null, auth = null, evaluate = null,
  now = () => new Date().toISOString(), logger = null, serveConsole = true
}) {
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

  /**
   * A statement window, validated here rather than deep in the ledger. A
   * mistyped date is the caller's mistake, and 400 says which field to fix -
   * a refusal from the book itself would report it as a conflict with a state
   * that has nothing to do with it.
   */
  const window = (ctx) => {
    const out = {};
    for (const field of ['from', 'to']) {
      const raw = ctx.query[field];
      if (raw === undefined || raw === '') { out[field] = null; continue; }
      if (Number.isNaN(Date.parse(raw))) throw new HttpError(400, `${field} must be an ISO timestamp`);
      out[field] = raw;
    }
    return out;
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

  // The console is a static page. It is served without a credential because it
  // contains no data: everything on it arrives from calls it makes afterwards
  // with an operator token the person pastes in.
  if (serveConsole) {
    for (const file of consoleFiles()) {
      route('GET', file.url, { auth: false }, () => ({ status: 200, raw: file.body, type: file.type }));
    }
  }

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
    status: 200, body: operator.agentStatement(ctx.params.id, window(ctx))
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

  // ------------------------------------------------- operator: the whole book

  /**
   * One call for the console's front page. Every figure is derived here and
   * now - solvency, the accounting equation, the trial balance and the cache
   * drift check - rather than read from a status field somebody remembered to
   * update. A console that can show a green light the ledger did not earn is
   * worse than no console.
   */
  route('GET', '/operator/overview', { roles: ['operator'] }, () => {
    const ledger = operator.ledger;
    return {
      status: 200,
      body: {
        currency: ledger.currency,
        solvency: ledger.solvency(),
        equation: ledger.equation(),
        trialBalance: ledger.trialBalance(),
        drift: ledger.store.verify(),
        jackpot: operator.jackpotStatement(),
        protection: operator.protectionStatus(),
        journalSize: ledger.size
      }
    };
  });

  route('GET', '/operator/snapshot', { roles: ['operator'] }, () => ({
    status: 200, body: { accounts: operator.ledger.snapshot() }
  }));

  /** Newest first, because the question is almost always "what just happened". */
  route('GET', '/operator/journal', { roles: ['operator'] }, (ctx) => {
    const limit = Math.min(Math.max(Number(ctx.query.limit) || 50, 1), 500);
    const journal = operator.ledger.journal;
    return { status: 200, body: { total: journal.length, transactions: journal.slice(-limit).reverse() } };
  });

  route('POST', '/operator/capital', { roles: ['operator'], money: true }, (ctx) => {
    operator.injectCapital({
      id: ctx.txId, at: ctx.at, amountMinor: amount(ctx, 'amountMinor'), memo: ctx.body.memo || null
    });
    return { status: 201, body: operator.ledger.solvency() };
  });

  route('POST', '/operator/tax', { roles: ['operator'], money: true }, (ctx) => {
    operator.accrueGamingTax({
      id: ctx.txId, at: ctx.at, amountMinor: amount(ctx, 'amountMinor'), memo: ctx.body.memo || null
    });
    return { status: 201, body: operator.ledger.solvency() };
  });

  // --------------------------------------------------------- operator: float

  /**
   * Selling float to a runner - the operator's most common action of the day,
   * and the one the design says must be possible at the moment the runner asks
   * rather than at the next office visit (F4).
   */
  route('POST', '/operator/agents/:id/float', { roles: ['operator'], money: true }, (ctx) => {
    operator.buyFloat({
      id: ctx.txId, at: ctx.at, agentId: ctx.params.id,
      paidMinor: amount(ctx, 'paidMinor'), floatMinor: amount(ctx, 'floatMinor'), memo: ctx.body.memo || null
    });
    return { status: 201, body: operator.agentStatement(ctx.params.id) };
  });

  route('POST', '/operator/agents/:id/float-back', { roles: ['operator'], money: true }, (ctx) => {
    operator.sellFloatBack({
      id: ctx.txId, at: ctx.at, agentId: ctx.params.id,
      amountMinor: amount(ctx, 'amountMinor'), memo: ctx.body.memo || null
    });
    return { status: 201, body: operator.agentStatement(ctx.params.id) };
  });

  // --------------------------------------------------------- operator: draws

  route('GET', '/operator/draws', { roles: ['operator'] }, () => ({
    status: 200,
    body: {
      draws: operator.ledger.listState('draw')
        .map(([key, state]) => ({ ...operator.drawReceipt(key), bets: state.betIds.length }))
        .sort((a, b) => (a.drawAt < b.drawAt ? 1 : -1))
    }
  }));

  /**
   * Settlement, using the evaluator this app was constructed with.
   *
   * The rules are injected rather than imported for the same reason the USSD
   * engine takes its bet catalogue as an argument: the ledger holds no bet
   * types, and a second copy of the payout table living in the service is a
   * second copy that can disagree with the first.
   */
  route('POST', '/operator/draws/:key/settle', { roles: ['operator'], money: true }, (ctx) => {
    if (!evaluate) throw new HttpError(503, 'No settlement evaluator is configured');
    const summary = operator.settleDraw({ id: ctx.txId, at: ctx.at, drawKey: ctx.params.key, evaluate });
    return {
      status: 200,
      body: {
        drawKey: ctx.params.key, result: summary.result, betsSettled: summary.betsSettled,
        winners: summary.winners, totalStakes: summary.totalStakes, totalPayout: summary.totalPayout
      }
    };
  });

  // ------------------------------------------------------- operator: players

  route('GET', '/operator/players/:id', { roles: ['operator'] }, (ctx) => ({
    status: 200, body: operator.playerStatement(ctx.params.id, ctx.at)
  }));

  route('POST', '/operator/players/:id/limits', { roles: ['operator'], money: true }, (ctx) => {
    operator.setPlayerLimit({
      id: ctx.txId, at: ctx.at, playerId: ctx.params.id,
      dailyStakeMinor: ctx.body.dailyStakeMinor ?? null,
      dailyLossMinor: ctx.body.dailyLossMinor ?? null
    });
    return { status: 200, body: operator.playerStatement(ctx.params.id, ctx.at) };
  });

  route('POST', '/operator/players/:id/exclude', { roles: ['operator'], money: true }, (ctx) => {
    operator.excludePlayer({
      id: ctx.txId, at: ctx.at, playerId: ctx.params.id,
      until: ctx.body.until || null, reason: ctx.body.reason || null
    });
    return { status: 200, body: operator.playerStatement(ctx.params.id, ctx.at) };
  });

  route('POST', '/operator/players/:id/reinstate', { roles: ['operator'], money: true }, (ctx) => {
    operator.reinstatePlayer({ id: ctx.txId, at: ctx.at, playerId: ctx.params.id });
    return { status: 200, body: operator.playerStatement(ctx.params.id, ctx.at) };
  });

  /**
   * Setting a player's PIN from the console. This is how a player who walked
   * up to a runner gets one at all, and how a forgotten one is replaced -
   * there is no self-service reset over USSD, because a channel that can reset
   * its own credential from the handset is not a second factor.
   */
  route('POST', '/operator/players/:id/pin', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'pin');
    if (!/^[0-9]{4,8}$/.test(String(ctx.body.pin))) throw new HttpError(400, 'A PIN must be 4 to 8 digits');
    identity.setPlayerPin({ id: ctx.txId, at: ctx.at, playerId: ctx.params.id, pin: ctx.body.pin });
    return { status: 201, body: { playerId: ctx.params.id, pinSet: true } };
  });

  route('POST', '/operator/players/:id/unlock', { roles: ['operator'], money: true }, (ctx) => {
    identity.unlockPlayer({ id: ctx.txId, at: ctx.at, playerId: ctx.params.id });
    return { status: 200, body: { playerId: ctx.params.id, locked: false } };
  });

  route('DELETE', '/operator/protection', { roles: ['operator'], money: true }, (ctx) => {
    operator.clearProtection({ id: ctx.txId, at: ctx.at });
    return { status: 200, body: operator.protectionStatus() };
  });

  // ------------------------------------------------- operator: money in flight

  route('GET', '/operator/mobile-money', { roles: ['operator'] }, () => {
    if (!gateway) throw new HttpError(503, 'No mobile money gateway is configured');
    return { status: 200, body: { pending: gateway.pending(), anomalies: gateway.anomalies() } };
  });

  /**
   * No Idempotency-Key on this one, on purpose. A sweep writes events whose
   * ids are derived from the request reference and the reason, so running it
   * twice changes nothing - and requiring a header the handler then ignores
   * teaches callers that the header is decoration.
   */
  route('POST', '/operator/mobile-money/reconcile', { roles: ['operator'] }, (ctx) => {
    if (!gateway) throw new HttpError(503, 'No mobile money gateway is configured');
    return { status: 200, body: gateway.reconcile({ at: ctx.at }) };
  });

  // ---------------------------------------------------- operator: promotions

  route('GET', '/operator/jackpot', { roles: ['operator'] }, () => ({
    status: 200, body: operator.jackpotStatement()
  }));

  route('POST', '/operator/jackpot/fund', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'drawKey');
    operator.fundJackpot({
      id: ctx.txId, at: ctx.at, drawKey: ctx.body.drawKey, amountMinor: amount(ctx, 'amountMinor')
    });
    return { status: 201, body: operator.jackpotStatement() };
  });

  route('POST', '/operator/jackpot/pay', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'drawKey', 'playerId');
    operator.payJackpot({
      id: ctx.txId, at: ctx.at, drawKey: ctx.body.drawKey,
      playerId: ctx.body.playerId, amountMinor: amount(ctx, 'amountMinor')
    });
    return { status: 201, body: operator.jackpotStatement() };
  });

  route('GET', '/operator/promotions/:campaignId', { roles: ['operator'] }, (ctx) => ({
    status: 200, body: operator.promoStatement(ctx.params.campaignId)
  }));

  route('POST', '/operator/promotions/free-tickets', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'campaignId', 'ticketId', 'playerId');
    operator.issueFreeTicket({
      id: ctx.txId, at: ctx.at, campaignId: ctx.body.campaignId, ticketId: ctx.body.ticketId,
      playerId: ctx.body.playerId, faceMinor: amount(ctx, 'faceMinor')
    });
    return { status: 201, body: operator.promoStatement(ctx.body.campaignId) };
  });

  // --------------------------------------------------------------------- agent

  route('GET', '/agent/statement', { roles: ['agent'] }, (ctx) => ({
    status: 200,
    // The subject comes from the token: a runner cannot ask for another
    // runner's book by putting their id in the query string.
    body: operator.agentStatement(ctx.principal.subject, window(ctx))
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
      const result = handle(req, rawBody);
      const isRaw = typeof result.raw === 'string';
      const payload = isRaw ? result.raw : JSON.stringify(result.body);
      res.writeHead(result.status, {
        'content-type': isRaw ? result.type : JSON_TYPE['content-type'],
        'content-length': Buffer.byteLength(payload),
        ...SECURITY_HEADERS
      });
      res.end(payload);
    });
  }

  return { handle, listener, auth: identity, routes: routes.map((r) => `${r.method} ${r.regex.source}`) };
}

module.exports = { createApp, HttpError };
