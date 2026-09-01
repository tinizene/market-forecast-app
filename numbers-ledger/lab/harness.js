'use strict';

const crypto = require('node:crypto');
const http = require('node:http');

const { createApp } = require('../src/http/app.js');
const draws = require('../src/draws.js');
const { seed } = require('./fixtures.js');
const { seedFor } = require('./seed-search.js');

/**
 * The environment a laboratory drives.
 *
 * The important thing about this file is what it does *not* do: it does not
 * change the product. The app it starts is composed from `src/` exactly as
 * `bin/console-server.js` composes it, byte for byte the same code that a
 * certificate would name. Everything a tester needs beyond the product - a
 * seeded book, credentials for every kind of principal, the ability to make a
 * draw land on a chosen number, a reset - lives out here and is reachable only
 * through a second server on a second port.
 *
 * That separation is the argument. A tester can confirm the product has no
 * laboratory mode by reading the route table, and the build manifest confirms
 * it mechanically: nothing under `lab/` is in the certified build, and the
 * runtime tree is scanned for the identifiers this file uses.
 */

const CONTROL_ROUTES = [
  'GET  /lab/state          what exists right now',
  'GET  /lab/credentials    tokens, PINs and the webhook secret',
  'POST /lab/force          { drawKey, result } make a draw land on a number',
  'POST /lab/reveal         { drawKey } reveal it, once its time has come',
  'POST /lab/clock          { seconds } wind the clock forward',
  'POST /lab/reset          throw the book away and seed a fresh one'
];

/**
 * @param {{day?: string, at?: string, result?: string}} [options]
 */
function createLab({ day = '2026-09-01', result = '417' } = {}) {
  const lab = { day, result, offsetMs: 0 };

  const build = () => {
    const book = seed({ day: lab.day, result: lab.result });
    // The clock advances with the wall clock but starts inside the fixture's
    // day, so a tester who opens the console sees a book mid-trading rather
    // than one dated years from now.
    const origin = Date.now();
    const base = Date.parse(`${lab.day}T09:00:00.000Z`);
    // The product already takes its clock as a dependency - that is how the
    // cutoff is kept off the caller's device, and it is a production property
    // rather than a hook added for this. Here the harness supplies one a tester
    // can wind forward, so a draw an hour out can be reached in a second.
    const now = () => new Date(base + (Date.now() - origin) + lab.offsetMs).toISOString();

    const app = createApp({
      operator: book.operator,
      gateway: book.gateway,
      auth: book.auth,
      evaluate: book.evaluate,
      now,
      logger: (error) => console.error(error)
    });

    const tokens = {
      operator: book.auth.issueToken({
        id: `lab-token-op-${origin}`, at: now(), kind: 'operator', subject: 'staff-lab', roles: ['operator']
      }),
      agent: book.auth.issueToken({
        id: `lab-token-ag-${origin}`, at: now(), kind: 'agent', subject: book.runners[0], roles: ['agent']
      })
    };

    return { ...book, app, now, tokens };
  };

  lab.current = build();

  /** Throw the book away and start again. Nothing survives, by design. */
  lab.reset = () => {
    lab.current.operator.close();
    lab.offsetMs = 0;
    lab.current = build();
    return lab.state();
  };

  /**
   * Wind the clock forward.
   *
   * Only forward. A system whose clock can go backwards is one where a bet
   * placed after a cutoff can be made to look as though it was not, and a
   * tester should not be able to produce that state by accident - they should
   * have to reason about it, which means reaching for a fresh book.
   */
  lab.advance = ({ seconds }) => {
    const step = Number(seconds);
    if (!Number.isFinite(step) || step <= 0) throw new Error('seconds must be a positive number');
    lab.offsetMs += Math.round(step * 1000);
    return { now: lab.current.now(), advancedBy: `${step}s` };
  };

  lab.state = () => {
    const current = lab.current;
    const ledger = current.operator.ledger;
    return {
      day: lab.day,
      now: current.now(),
      offset: `${Math.round(lab.offsetMs / 1000)}s`,
      solvency: ledger.solvency(),
      transactions: ledger.size,
      runners: current.operator.agents(),
      players: current.players,
      draws: current.operator.ledger.listState('draw')
        .map(([key]) => current.operator.drawReceipt(key)),
      pendingMobileMoney: current.gateway.pending(),
      anomalies: current.gateway.anomalies()
    };
  };

  lab.credentials = () => ({
    operatorToken: lab.current.tokens.operator,
    agentToken: lab.current.tokens.agent,
    agentId: lab.current.runners[0],
    players: lab.current.players.map((playerId) => ({ playerId, pin: '1234' })),
    webhookSecret: lab.current.webhookSecret,
    note: 'Every player shares one PIN so a tester never has to look one up.'
  });

  /**
   * Make a draw land on a chosen number.
   *
   * Opens a *new* draw with a seed searched for that result. It cannot change
   * a draw that already exists, because that draw's commitment is published
   * and changing it after the fact is the exact thing the whole design refuses
   * to permit - in the laboratory as much as in production.
   */
  lab.force = ({ drawKey, result: wanted, drawAt = null }) => {
    const current = lab.current;
    if (current.operator.ledger.readState('draw', drawKey)) {
      throw new Error(
        `Draw ${drawKey} is already committed. Use a new key: a published commitment is not editable, here either.`
      );
    }
    const found = seedFor(drawKey, wanted);
    const at = current.now();
    const target = drawAt || new Date(Date.parse(at) + 60_000).toISOString();
    const schedule = draws.schedule({
      drawKey, drawAt: target, cutoffLeadMinutes: 0, opensAt: new Date(Date.parse(at) + 1000).toISOString()
    });

    current.operator.openDraw({
      id: `lab-force-${drawKey}`, at, commitment: found.commitment, ...schedule
    });
    current.seeds = current.seeds || {};
    current.seeds[drawKey] = found.seed;

    return { drawKey, result: wanted, tries: found.tries, commitment: found.commitment, ...schedule };
  };

  /** Reveal a forced draw without waiting for its hour. */
  lab.reveal = ({ drawKey }) => {
    const current = lab.current;
    const known = (current.seeds || {})[drawKey] || (current.draws[drawKey] || {}).seed;
    if (!known) throw new Error(`No seed held for ${drawKey}. Force it first, or reveal it with its own seed.`);

    const draw = current.operator.ledger.readState('draw', drawKey);
    if (!draw) throw new Error(`Draw ${drawKey} was never opened`);

    // The harness supplies the seed and nothing else. Whether it is time is the
    // product's decision, made against the clock it was given - so a reveal
    // before the draw time is refused here exactly as it would be in
    // production, and the tester winds the clock rather than the rule.
    const at = current.now();
    const revealed = current.operator.revealDraw({ id: `lab-reveal-${drawKey}-${at}`, at, drawKey, seed: known });
    return { drawKey, result: revealed.result, at };
  };

  return lab;
}

/**
 * The control server: a second port, deliberately.
 *
 * Not routes on the product. A tester can read `app.routes` and find nothing
 * called /lab, which is the point - the thing that can force an outcome is not
 * part of the thing being certified, and does not have to be argued about.
 */
function createControlServer(lab, { key }) {
  const send = (res, status, body) => {
    const payload = JSON.stringify(body, null, 2);
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(payload)
    });
    res.end(payload);
  };

  return http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      // A shared key, not security. It stops a page open in the same browser
      // reaching this by accident, and nothing more is claimed for it.
      if (req.headers['x-lab-key'] !== key) return send(res, 401, { error: 'Set x-lab-key' });

      let body = {};
      if (chunks.length) {
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
          return send(res, 400, { error: 'Body is not valid JSON' });
        }
      }

      try {
        const url = new URL(req.url, 'http://lab.invalid');
        if (req.method === 'GET' && url.pathname === '/lab/state') return send(res, 200, lab.state());
        if (req.method === 'GET' && url.pathname === '/lab/credentials') return send(res, 200, lab.credentials());
        if (req.method === 'POST' && url.pathname === '/lab/force') return send(res, 200, lab.force(body));
        if (req.method === 'POST' && url.pathname === '/lab/reveal') return send(res, 200, lab.reveal(body));
        if (req.method === 'POST' && url.pathname === '/lab/clock') return send(res, 200, lab.advance(body));
        if (req.method === 'POST' && url.pathname === '/lab/reset') return send(res, 200, lab.reset());
        return send(res, 404, { error: 'No such control', routes: CONTROL_ROUTES });
      } catch (error) {
        return send(res, 409, { error: error.message });
      }
    });
  });
}

function controlKey() {
  return `lab_${crypto.randomBytes(12).toString('hex')}`;
}

module.exports = { createLab, createControlServer, controlKey, CONTROL_ROUTES };
