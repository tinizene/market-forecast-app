'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { Operator } = require('../src/operator.js');
const { Auth, TOKEN_TTL_MS } = require('../src/http/auth.js');
const { createApp, MAX_BODY_BYTES } = require('../src/http/app.js');
const { RateLimiter, LIMITS } = require('../src/http/limits.js');

const AT = '2026-08-27T10:00:00Z';
const SECRET = 'a-shared-secret';

let clock = AT;
const now = () => clock;
const advance = (ms) => { clock = new Date(Date.parse(clock) + ms).toISOString(); };

function rig({ audit = null, limits = LIMITS, maxBodyBytes = MAX_BODY_BYTES } = {}) {
  clock = AT;
  const operator = new Operator();
  const auth = new Auth({ ledger: operator.ledger, webhookSecret: SECRET });
  const app = createApp({ operator, auth, now, audit, limits, maxBodyBytes, serveConsole: false });

  operator.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 10_000_00, floatMinor: 10_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00 });
  auth.setPlayerPin({ id: 'pin', at: AT, playerId: 'p-1', pin: '1234' });

  const op = auth.issueToken({ id: 'tok-op', at: AT, kind: 'operator', subject: 'staff-1', roles: ['operator'] });
  return { operator, auth, app, op };
}

let sequence = 0;
const call = (app, method, url, { token = null, body = null, key = null, headers = {} } = {}) => {
  const raw = body === null ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
  return app.handle({
    method, url,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(key === false ? {} : { 'idempotency-key': key || `k-${++sequence}` }),
      ...headers
    }
  }, raw);
};

// ----------------------------------------------------------- token expiry

test('a token stops working when its time is up', () => {
  const { app, op } = rig();
  assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 200);

  advance(TOKEN_TTL_MS.operator - 1000);
  assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 200, 'a second before');

  advance(2000);
  assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 401, 'a second after');
});

/**
 * A player's token travels on a handset that gets shared, sold and lost, so it
 * lasts an hour. A runner's device is in one pair of hands all day and
 * re-authenticating mid-queue is how a runner stops using the system.
 */
test('a player token expires long before a runner\'s', () => {
  const { app, auth } = rig();
  const player = auth.issueToken({ id: 'tp', at: AT, kind: 'player', subject: 'p-1', roles: ['player'] });
  const agent = auth.issueToken({ id: 'ta', at: AT, kind: 'agent', subject: 'ag-1', roles: ['agent'] });

  advance(90 * 60 * 1000);
  assert.equal(call(app, 'GET', '/player/me', { token: player }).status, 401);
  assert.equal(call(app, 'GET', '/agent/statement', { token: agent }).status, 200);
});

/**
 * Absolute, not sliding. Using a token does not extend it - otherwise the
 * caller who keeps a stolen token alive is exactly the attacker.
 */
test('using a token does not extend it', () => {
  const { app, op } = rig();
  for (let i = 0; i < 6; i++) {
    advance(2 * 60 * 60 * 1000);
    call(app, 'GET', '/operator/overview', { token: op });
  }
  advance(60 * 1000);
  assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 401);
});

test('the expiry is on the server clock, not on anything the caller sends', () => {
  const { app, op } = rig();
  advance(TOKEN_TTL_MS.operator + 1000);
  const refused = call(app, 'GET', '/operator/overview', {
    token: op, headers: { date: AT, 'x-forwarded-time': AT }
  });
  assert.equal(refused.status, 401);
});

// --------------------------------------------------------------- body cap

test('a body larger than the cap is refused before it is parsed', () => {
  const { app, op } = rig({ maxBodyBytes: 1024 });
  const huge = JSON.stringify({ memo: 'x'.repeat(2000), amountMinor: 100 });

  const refused = call(app, 'POST', '/operator/capital', { token: op, body: huge });
  assert.equal(refused.status, 413);
  assert.match(refused.body.error, /may not exceed 1024 bytes/);
});

test('the socket stops reading a body it has already refused', async () => {
  const { app, op } = rig({ maxBodyBytes: 2048 });
  const server = http.createServer(app.listener);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const status = await new Promise((resolve, reject) => {
    const request = http.request({
      port, host: '127.0.0.1', method: 'POST', path: '/operator/capital',
      headers: { authorization: `Bearer ${op}`, 'idempotency-key': 'big', 'content-type': 'application/json' }
    }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('error', reject);
    // Written in pieces, so the refusal has to happen mid-stream rather than
    // after the whole thing has been buffered.
    for (let i = 0; i < 40; i++) request.write('x'.repeat(200));
    request.end();
  });

  assert.equal(status, 413);
  await new Promise((resolve) => server.close(resolve));
});

// ------------------------------------------------------------ rate limits

test('the limiter refills over time rather than resetting on a boundary', () => {
  const limiter = new RateLimiter({ now });
  clock = AT;
  const rule = { limit: 4, windowMs: 60_000 };

  for (let i = 0; i < 4; i++) assert.equal(limiter.take('k', rule).ok, true, `call ${i}`);
  const blocked = limiter.take('k', rule);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSeconds >= 1);

  // A quarter of a window buys back a quarter of the allowance, not all of it.
  advance(15_000);
  assert.equal(limiter.take('k', rule).ok, true);
  assert.equal(limiter.take('k', rule).ok, false, 'and no more than that');
});

/**
 * Sign-in is keyed on the account being signed in to, not on the caller: the
 * attack is a thousand attempts against one player from a thousand places.
 */
test('sign-in is limited per account, and one account does not lock out another', () => {
  const { app, auth } = rig();
  auth.setPlayerPin({ id: 'pin2', at: AT, playerId: 'p-2', pin: '9999' });

  const attempt = (playerId) => call(app, 'POST', '/player/session', {
    key: false, body: { playerId, pin: '0000' }
  }).status;

  for (let i = 0; i < LIMITS.signIn.limit; i++) assert.equal(attempt('p-1'), 401, `attempt ${i}`);
  assert.equal(attempt('p-1'), 429, 'the sixth is refused as a rate, not as a bad PIN');
  assert.equal(attempt('p-2'), 401, 'and a different account is unaffected');
});

test('a rate refusal says how long to wait and never reaches the PIN check', () => {
  const { app, operator } = rig();
  for (let i = 0; i < LIMITS.signIn.limit; i++) {
    call(app, 'POST', '/player/session', { key: false, body: { playerId: 'p-1', pin: '0000' } });
  }

  // Spent. The next call is refused as a rate before anything reads the PIN,
  // which is the point: an scrypt per guess is the cost being defended.
  const spent = operator.ledger.events.length;
  const refused = call(app, 'POST', '/player/session', { key: false, body: { playerId: 'p-1', pin: '1234' } });

  assert.equal(refused.status, 429);
  assert.ok(refused.body.retryAfterSeconds >= 1);
  assert.equal(operator.ledger.events.length, spent, 'nothing was written for the refused attempt');
});

test('an authenticated caller has its own allowance, keyed on the token', () => {
  const { app, op, auth } = rig({ limits: { ...LIMITS, authenticated: { limit: 3, windowMs: 60_000 } } });
  const second = auth.issueToken({ id: 'tok-2', at: AT, kind: 'operator', subject: 'staff-2', roles: ['operator'] });

  for (let i = 0; i < 3; i++) assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 200);
  assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 429);
  assert.equal(call(app, 'GET', '/operator/overview', { token: second }).status, 200, 'a different token is unaffected');
});

test('the limiter does not grow without bound on a key the caller chooses', () => {
  const limiter = new RateLimiter({ now, maxKeys: 50 });
  clock = AT;
  for (let i = 0; i < 500; i++) limiter.take(`signin:attacker-${i}`, { limit: 5, windowMs: 60_000 });
  assert.ok(limiter.size <= 51, `kept ${limiter.size} buckets`);
});

// ------------------------------------------------------------- audit log

test('every call is recorded, reads as well as writes', () => {
  const entries = [];
  const { app, op } = rig({ audit: (entry) => entries.push(entry) });

  call(app, 'GET', '/operator/players/p-1', { token: op });
  call(app, 'POST', '/operator/capital', { token: op, body: { amountMinor: 100 }, key: 'cap-1' });

  assert.equal(entries.length, 2);
  assert.deepEqual(
    entries.map((e) => [e.method, e.path, e.status]),
    [['GET', '/operator/players/p-1', 200], ['POST', '/operator/capital', 201]]
  );
  assert.equal(entries[0].subject, 'staff-1');
  assert.equal(entries[0].principalKind, 'operator');
  assert.equal(entries[1].idempotencyKey, 'cap-1');
});

/**
 * The log has to be safe to ship somewhere else, which means it can never
 * carry a working credential or anything a player told the service in
 * confidence.
 */
test('the log carries no token, no body and no PIN', () => {
  const entries = [];
  const { app, auth } = rig({ audit: (entry) => entries.push(entry) });
  const player = auth.issueToken({ id: 'tp', at: AT, kind: 'player', subject: 'p-1', roles: ['player'] });

  call(app, 'POST', '/player/withdrawals', {
    token: player, key: 'w-1', body: { pin: '1234', msisdn: '+231770000001', amountMinor: 100 }
  });

  const written = JSON.stringify(entries);
  assert.ok(!written.includes(player), 'no bearer token');
  assert.ok(!written.includes('1234'), 'no PIN');
  assert.ok(!written.includes('231770000001'), 'no body');
  // But it does say who, and joins to the issue event by the same short digest.
  assert.equal(entries[0].subject, 'p-1');
  assert.match(entries[0].tokenId, /^[0-9a-f]{12}$/);
});

test('a refusal is logged with the status it was refused with', () => {
  const entries = [];
  const { app } = rig({ audit: (entry) => entries.push(entry) });

  call(app, 'GET', '/operator/overview');
  call(app, 'GET', '/nowhere', { token: 'an_nope' });

  assert.deepEqual(entries.map((e) => e.status), [401, 404]);
  assert.equal(entries[0].subject, null, 'nobody, because nobody was authenticated');
});

/**
 * The one response whose contents must never be recorded anywhere: the custody
 * shares. The log says the call happened and stops there.
 */
test('the call that hands over custody shares is logged without them', () => {
  const entries = [];
  const { app, op } = rig({ audit: (entry) => entries.push(entry) });

  const prepared = call(app, 'POST', '/operator/draws/prepare', {
    token: op, key: 'prep-1',
    body: {
      drawKey: 'D1', opensAt: '2026-08-27T11:00:00Z',
      cutoffAt: '2026-08-27T18:55:00Z', drawAt: '2026-08-27T19:00:00Z', shares: 3, threshold: 2
    }
  });

  assert.equal(prepared.status, 201);
  assert.equal(entries[0].secret, true);
  const written = JSON.stringify(entries);
  for (const share of prepared.body.shares) assert.ok(!written.includes(share));
});

test('an audit sink that throws does not turn a good request into a failure', () => {
  const logged = [];
  const { app, op } = rig({ audit: () => { throw new Error('disk full'); } });
  const withLogger = createApp({
    operator: new Operator(), now, serveConsole: false,
    audit: () => { throw new Error('disk full'); },
    logger: (e) => logged.push(e)
  });

  assert.equal(call(app, 'GET', '/operator/overview', { token: op }).status, 200);
  assert.equal(withLogger.handle({ method: 'GET', url: '/health', headers: {} }, '').status, 200);
  assert.equal(logged.length, 1, 'but it is not silent either');
});

// ------------------------------------------------------------------- CORS

test('no response ever carries a cross-origin permission', async () => {
  const { app, op } = rig();
  const server = http.createServer(app.listener);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  const headers = await new Promise((resolve, reject) => {
    const request = http.request({
      port, host: '127.0.0.1', method: 'GET', path: '/operator/overview',
      headers: { authorization: `Bearer ${op}`, origin: 'https://evil.example' }
    }, (response) => {
      response.resume();
      resolve(response.headers);
    });
    request.on('error', reject);
    request.end();
  });

  assert.equal(headers['access-control-allow-origin'], undefined);
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['referrer-policy'], 'no-referrer');
  await new Promise((resolve) => server.close(resolve));
});
