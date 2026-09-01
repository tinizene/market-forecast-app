'use strict';

const { Auth, hashToken } = require('./auth.js');
const { consoleFiles, SECURITY_HEADERS } = require('./static.js');
const { Refusal } = require('../errors.js');
const { Reports, toCsv, dayWindow } = require('../reporting.js');
const { RateLimiter, LIMITS } = require('./limits.js');
const { build } = require('../build.js');

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

/**
 * The largest body this service will read.
 *
 * Every request it accepts is a handful of fields. A cap that generous is
 * still four orders of magnitude more than any of them needs, and without one
 * a single request can hold as much memory as the sender cares to send.
 */
const MAX_BODY_BYTES = 64 * 1024;

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
  now = () => new Date().toISOString(), logger = null, serveConsole = true,
  audit = null, maxBodyBytes = MAX_BODY_BYTES, limits = LIMITS
}) {
  if (!operator) throw new TypeError('createApp needs an operator');
  const identity = auth || new Auth({ ledger: operator.ledger });
  const reports = new Reports({ ledger: operator.ledger, operator });
  const limiter = new RateLimiter({ now });
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

  // The build is public on purpose. It is not a secret, and publishing it lets
  // anyone - an inspector, a buyer, the operator's own monitoring - confirm
  // which software they are talking to before asking it anything else.
  route('GET', '/health', { auth: false }, () => ({
    status: 200, body: { ok: true, build: build() }
  }));

  // The console is a static page. It is served without a credential because it
  // contains no data: everything on it arrives from calls it makes afterwards
  // with an operator token the person pastes in.
  if (serveConsole) {
    for (const file of consoleFiles()) {
      route('GET', file.url, { auth: false, static: true }, () => ({ status: 200, raw: file.body, type: file.type }));
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
      dailyLossMinor: ctx.body.dailyLossMinor ?? null,
      // From the token, never the body. A policy change with a name against it
      // is only worth anything if the name is one the caller cannot choose.
      by: ctx.principal.subject
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

  /**
   * Open a draw whose seed this operator does not keep: it is sealed under a
   * key split among custodians, and the shares come back exactly once.
   *
   * The response is the only place those shares ever exist. It must not be
   * logged, cached, or written down anywhere but the custodians' own hands -
   * which is why the audit log records that this call happened and never what
   * it returned.
   */
  route('POST', '/operator/draws/prepare', { roles: ['operator'], money: true }, (ctx) => {
    requireBody(ctx, 'drawKey', 'opensAt', 'cutoffAt', 'drawAt');
    const shares = ctx.body.shares === undefined ? 3 : ctx.body.shares;
    const threshold = ctx.body.threshold === undefined ? 2 : ctx.body.threshold;
    if (!Number.isInteger(shares) || !Number.isInteger(threshold)) {
      throw new HttpError(400, 'shares and threshold must be whole numbers');
    }
    if (threshold < 2) throw new HttpError(400, 'threshold must be at least 2 - a one-of-n split is not custody');
    if (shares < threshold) throw new HttpError(400, 'shares must be at least the threshold');

    const prepared = operator.prepareDraw({
      id: ctx.txId, at: ctx.at, drawKey: ctx.body.drawKey,
      opensAt: ctx.body.opensAt, cutoffAt: ctx.body.cutoffAt, drawAt: ctx.body.drawAt,
      shares, threshold
    });
    return { status: 201, body: prepared, secret: true };
  });

  route('POST', '/operator/draws/:key/reveal', { roles: ['operator'], money: true }, (ctx) => {
    // A seed, or the shares that unseal one. Both end at the same commitment
    // check, so custody never becomes something the result has to be trusted to.
    if (Array.isArray(ctx.body.shares)) {
      const revealed = operator.revealSealedDraw({
        id: ctx.txId, at: ctx.at, drawKey: ctx.params.key, shares: ctx.body.shares
      });
      return { status: 200, body: { drawKey: ctx.params.key, result: revealed.result, custody: 'shares' } };
    }
    requireBody(ctx, 'seed');
    const revealed = operator.revealDraw({ id: ctx.txId, at: ctx.at, drawKey: ctx.params.key, seed: ctx.body.seed });
    return { status: 200, body: { drawKey: ctx.params.key, result: revealed.result, custody: 'seed' } };
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

  // ------------------------------------------------------- operator: reports

  /**
   * A report leaves as JSON or as CSV, chosen by `format`. The CSV exists
   * because a close that only lives in a browser tab is not something an
   * accountant can work from, and asking them to read a screen is how figures
   * get retyped.
   */
  const served = (ctx, report) => (ctx.query.format === 'csv'
    ? { status: 200, raw: toCsv(report), type: 'text/csv; charset=utf-8' }
    : { status: 200, body: report });

  /**
   * A day, or an explicit window - and `day` works on every report, not only
   * the close. A selector that silently did nothing on four screens out of
   * five would be worse than not offering it.
   *
   * The day is UTC, which for Liberia is also the local day. Said out loud
   * because a report labelled by date has to mean the same span to the person
   * reading it as to the code writing it.
   */
  const reportWindow = (ctx) => {
    if (!ctx.query.day) return window(ctx);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ctx.query.day)) throw new HttpError(400, 'day must be YYYY-MM-DD');
    return dayWindow(ctx.query.day);
  };

  route('GET', '/operator/reports/close', { roles: ['operator'] }, (ctx) => {
    if (ctx.query.day && !/^\d{4}-\d{2}-\d{2}$/.test(ctx.query.day)) {
      throw new HttpError(400, 'day must be YYYY-MM-DD');
    }
    const report = ctx.query.day
      ? reports.dailyClose({ day: ctx.query.day })
      : reports.close(window(ctx));
    return served(ctx, report);
  });

  route('GET', '/operator/reports/revenue', { roles: ['operator'] }, (ctx) =>
    served(ctx, reports.revenue(reportWindow(ctx))));

  route('GET', '/operator/reports/tax', { roles: ['operator'] }, (ctx) => {
    const rate = ctx.query.rate === undefined || ctx.query.rate === '' ? null : Number(ctx.query.rate);
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) {
      throw new HttpError(400, 'rate must be a non-negative percentage');
    }
    return served(ctx, reports.taxBase({ ...reportWindow(ctx), ratePercent: rate }));
  });

  route('GET', '/operator/reports/promotions', { roles: ['operator'] }, (ctx) =>
    served(ctx, reports.promotions(reportWindow(ctx))));

  route('GET', '/operator/reports/liabilities', { roles: ['operator'] }, (ctx) => {
    if (ctx.query.at && Number.isNaN(Date.parse(ctx.query.at))) {
      throw new HttpError(400, 'at must be an ISO timestamp');
    }
    return served(ctx, reports.liabilities({ at: ctx.query.at || null }));
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
    operator.clearProtection({ id: ctx.txId, at: ctx.at, by: ctx.principal.subject });
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

  /**
   * The promotional cap lives under /operator/policy rather than under
   * /operator/promotions, because a literal path segment there would be
   * swallowed by the :campaignId route below - the router matches in
   * registration order and a campaign could legitimately be called "cap".
   */
  route('GET', '/operator/policy/promo-cap', { roles: ['operator'] }, (ctx) => ({
    status: 200, body: operator.promoCapStatus(ctx.at)
  }));

  route('POST', '/operator/policy/promo-cap', { roles: ['operator'], money: true }, (ctx) => {
    const cap = ctx.body.dailyCapMinor;
    // Zero is a real cap - it stops issuance dead - so this cannot use the
    // positive-amount helper, and it must not treat 0 as "unset".
    if (!Number.isInteger(cap) || cap < 0) {
      throw new HttpError(400, 'dailyCapMinor must be a whole number of minor units, zero or more');
    }
    operator.setPromoCap({
      id: ctx.txId, at: ctx.at, dailyCapMinor: cap, by: ctx.principal.subject, memo: ctx.body.memo || null
    });
    return { status: 201, body: operator.promoCapStatus(ctx.at) };
  });

  route('DELETE', '/operator/policy/promo-cap', { roles: ['operator'], money: true }, (ctx) => {
    operator.clearPromoCap({ id: ctx.txId, at: ctx.at, by: ctx.principal.subject });
    return { status: 200, body: operator.promoCapStatus(ctx.at) };
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
    // Expiry is checked against the server's clock, here, on every request -
    // not at issue time and not by the holder.
    const principal = identity.principalFor(header.startsWith('Bearer ') ? header.slice(7) : null, at);
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
  /**
   * How much this request is allowed, and under what key.
   *
   * Sign-in is keyed on the account being signed in to rather than on whoever
   * is asking: the attack is a thousand attempts against one player, from a
   * thousand places, and a per-caller key would let every one of them through.
   * Authenticated calls are keyed on the token, which is the only identity
   * this process can actually verify.
   */
  function rateKey(match, req, url, body) {
    if (url.pathname === '/player/session') {
      return { key: `signin:${body && body.playerId ? body.playerId : 'unknown'}`, rule: limits.signIn };
    }
    if (match.auth === 'webhook') return { key: 'webhook', rule: limits.webhook };
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      return { key: `token:${hashToken(header.slice(7)).slice(0, 16)}`, rule: limits.authenticated };
    }
    return { key: 'anonymous', rule: limits.anonymous };
  }

  function handle(req, rawBody = '') {
    const at = now();
    const url = new URL(req.url, 'http://service.invalid');
    const match = routes.find((r) => r.method === req.method && r.regex.test(url.pathname));
    let principalForAudit = null;
    let answer;

    try {
      if (!match) throw new HttpError(404, 'No such endpoint');

      // Size first, before anything parses or hashes it. A body this service
      // will refuse should cost it nothing to refuse.
      if (Buffer.byteLength(rawBody, 'utf8') > maxBodyBytes) {
        throw new HttpError(413, `Body may not exceed ${maxBodyBytes} bytes`);
      }

      const principal = authenticate(match, req, rawBody, at);
      principalForAudit = principal;

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

      // After the body is parsed, because sign-in is limited per account and
      // the account is in the body. Static console files are not limited:
      // they are a page, and refusing to serve its stylesheet to a person
      // reloading twice would be a limiter working against its own operator.
      if (!match.static) {
        const { key, rule } = rateKey(match, req, url, body);
        const allowed = limiter.take(key, rule);
        if (!allowed.ok) {
          throw new HttpError(429, 'Too many requests', { retryAfterSeconds: allowed.retryAfterSeconds });
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

      answer = match.handler(ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        answer = { status: error.status, body: { error: error.message, ...(error.detail || {}) } };
      } else {
        const status = statusForLedgerError(error);
        if (status === 500 && logger) logger(error);
        answer = {
          status,
          // A guard's message is written for the caller. An unexpected failure's
          // is not, and saying so beats leaking a stack trace.
          body: { error: status === 409 ? error.message : 'Internal error' }
        };
      }
    }

    record(req, url, at, principalForAudit, answer);
    return answer;
  }

  /**
   * Who called what, and what they were told.
   *
   * Reads are logged as well as writes. "Who looked at this player's wallet"
   * is a question with the same regulatory weight as "who moved money", and a
   * log that answers only the second one answers it alone.
   *
   * What is never logged: the body, the response, the bearer token, and a
   * PIN. The token is identified by the same short digest the issue event
   * carries, so a line here joins to a line there without either holding a
   * working credential. A response marked `secret` - the one that hands over
   * custody shares - records that it happened and nothing about what it said.
   */
  function record(req, url, at, principal, answer) {
    if (!audit) return;
    try {
      audit({
        at,
        method: req.method,
        path: url.pathname,
        status: answer.status,
        principalKind: principal ? principal.kind : null,
        subject: principal ? principal.subject : null,
        tokenId: principal && principal.tokenId ? principal.tokenId : null,
        idempotencyKey: req.headers['idempotency-key'] || null,
        // Which software did this. A log spanning a deployment is otherwise a
        // log about two different systems wearing one name.
        build: build() === null ? null : build().short,
        secret: answer.secret === true
      });
    } catch (error) {
      // An audit sink that throws must not turn a good request into a 500 -
      // but it must not be silent either, or the log stops and nobody knows.
      if (logger) logger(error);
    }
  }

  /**
   * Adapter for node:http. Kept separate so the app is testable without a
   * socket - which is also why the size cap is enforced in both places: here,
   * to stop reading bytes it will not use, and in handle(), because that is
   * the entry point the tests and any other transport go through.
   *
   * No CORS header is ever emitted, by omission and on purpose. The credential
   * is a bearer header rather than a cookie, so a browser on another origin
   * cannot attach it without a preflight this service will not answer, and
   * there is no cross-site request that can act as a caller.
   */
  function listener(req, res) {
    const chunks = [];
    let bytes = 0;
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      bytes += chunk.length;
      if (bytes > maxBodyBytes) {
        aborted = true;
        const payload = JSON.stringify({ error: `Body may not exceed ${maxBodyBytes} bytes` });
        res.writeHead(413, {
          'content-type': JSON_TYPE['content-type'],
          'content-length': Buffer.byteLength(payload),
          connection: 'close',
          ...SECURITY_HEADERS
        });
        res.end(payload);
        // Stop reading. Draining a body already refused is doing the sender's
        // work for them.
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const result = handle(req, rawBody);
      const isRaw = typeof result.raw === 'string';
      const payload = isRaw ? result.raw : JSON.stringify(result.body);
      res.writeHead(result.status, {
        'content-type': isRaw ? result.type : JSON_TYPE['content-type'],
        'content-length': Buffer.byteLength(payload),
        ...(result.status === 429 && result.body && result.body.retryAfterSeconds
          ? { 'retry-after': String(result.body.retryAfterSeconds) }
          : {}),
        ...SECURITY_HEADERS
      });
      res.end(payload);
    });
  }

  return { handle, listener, auth: identity, routes: routes.map((r) => `${r.method} ${r.regex.source}`) };
}

module.exports = { createApp, HttpError, MAX_BODY_BYTES };
