'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { Operator } = require('../src/operator.js');
const { Auth } = require('../src/http/auth.js');
const { createApp } = require('../src/http/app.js');
const { MobileMoneyGateway } = require('../src/mobilemoney/gateway.js');
const { SimulatedProvider } = require('../src/mobilemoney/simulator.js');
const draws = require('../src/draws.js');
const { MAX_PIN_ATTEMPTS } = require('../src/http/auth.js');

const AT = '2026-08-27T10:00:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';
const MSISDN = '+231770000001';
const SECRET = 'a-shared-secret';

let clock = AT;
const now = () => clock;

function rig() {
  clock = AT;
  const operator = new Operator();
  const provider = new SimulatedProvider();
  const gateway = new MobileMoneyGateway({ operator, provider });
  const auth = new Auth({ ledger: operator.ledger, webhookSecret: SECRET });
  const app = createApp({ operator, gateway, auth, now });

  operator.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });

  const operatorToken = auth.issueToken({ id: 'tok-op', at: AT, kind: 'operator', subject: 'staff-1', roles: ['operator'] });
  const agentToken = auth.issueToken({ id: 'tok-ag', at: AT, kind: 'agent', subject: 'ag-1', roles: ['agent'] });
  auth.setPlayerPin({ id: 'pin-1', at: AT, playerId: 'p-1', pin: '1234' });

  return { operator, provider, gateway, auth, app, operatorToken, agentToken };
}

/** One request, as the router sees it. */
const call = (app, method, url, { token = null, body = null, key = null, headers = {} } = {}) => {
  const raw = body === null ? '' : JSON.stringify(body);
  return app.handle({
    method, url,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(key ? { 'idempotency-key': key } : {}),
      ...headers
    }
  }, raw);
};

const signIn = (app, playerId = 'p-1', pin = '1234') =>
  call(app, 'POST', '/player/session', { body: { playerId, pin } }).body.token;

function openDraw(operator, key = 'D1') {
  const seed = draws.createSeed();
  const schedule = draws.schedule({ drawKey: key, drawAt: DRAW_AT, opensAt: AT });
  operator.openDraw({ id: `open-${key}`, at: AT, drawKey: key, commitment: draws.commit(key, seed), ...schedule });
  return { key, seed, result: draws.resultFromSeed(key, seed) };
}

// ------------------------------------------------------------ authentication

test('an unauthenticated call to a protected route is refused', () => {
  const { app } = rig();
  assert.equal(call(app, 'GET', '/operator/solvency').status, 401);
  assert.equal(call(app, 'GET', '/operator/solvency', { token: 'an_not-a-real-token' }).status, 401);
  assert.equal(call(app, 'GET', '/health').status, 200);
});

test('a token is only ever handed back once, and the store keeps a hash', () => {
  const { operator, auth } = rig();
  const token = auth.issueToken({ id: 't', at: AT, kind: 'agent', subject: 'ag-9', roles: ['agent'] });

  const stored = operator.ledger.listState('token').map(([digest]) => digest);
  assert.ok(!stored.includes(token), 'the plaintext is not in the store');
  assert.ok(auth.principalFor(token, AT), 'but it still resolves');
  assert.equal(auth.principalFor('an_wrong', AT), null);

  // Nothing in the event log carries the token either.
  const logged = JSON.stringify(operator.ledger.events);
  assert.ok(!logged.includes(token.slice(3)), 'and it is not in the log');
});

test('a revoked token stops working immediately', () => {
  const { app, auth, agentToken } = rig();
  assert.equal(call(app, 'GET', '/agent/statement', { token: agentToken }).status, 200);
  auth.revokeToken({ id: 'rev', at: AT, token: agentToken });
  assert.equal(call(app, 'GET', '/agent/statement', { token: agentToken }).status, 401);
});

test('roles are enforced, not merely recorded', () => {
  const { app, agentToken, operatorToken } = rig();
  const playerToken = signIn(app);

  assert.equal(call(app, 'GET', '/operator/solvency', { token: agentToken }).status, 403);
  assert.equal(call(app, 'GET', '/operator/solvency', { token: playerToken }).status, 403);
  assert.equal(call(app, 'GET', '/agent/statement', { token: playerToken }).status, 403);
  assert.equal(call(app, 'GET', '/player/me', { token: agentToken }).status, 403);
  assert.equal(call(app, 'GET', '/operator/solvency', { token: operatorToken }).status, 200);
});

// ------------------------------------------------- the subject is not an input

test('a runner cannot act for another runner', () => {
  const { operator, app, auth } = rig();
  operator.buyFloat({ id: 'f2', at: AT, agentId: 'ag-2', paidMinor: 500_00, floatMinor: 500_00 });
  const token = auth.issueToken({ id: 't2', at: AT, kind: 'agent', subject: 'ag-2', roles: ['agent'] });
  const beforeAg1 = operator.ledger.balance('AGENT_FLOAT:ag-1');

  // Naming another runner in the body changes nothing: the id comes from the token.
  const res = call(app, 'POST', '/agent/cash-in', {
    token, key: 'k1', body: { agentId: 'ag-1', playerId: 'p-9', amountMinor: 100_00 }
  });
  assert.equal(res.status, 201);
  assert.equal(operator.ledger.balance('AGENT_FLOAT:ag-2'), 400_00, 'ag-2 paid for it');
  assert.equal(operator.ledger.balance('AGENT_FLOAT:ag-1'), beforeAg1, 'ag-1 is untouched');

  // And a statement is always the caller's own.
  const statement = call(app, 'GET', '/agent/statement?agentId=ag-1', { token }).body;
  assert.equal(statement.agentId, 'ag-2');
});

test('a player cannot bet from another wallet', () => {
  const { operator, app } = rig();
  const { key } = openDraw(operator);
  const token = signIn(app);

  const res = call(app, 'POST', '/player/bets', {
    token, key: 'b1',
    body: { playerId: 'p-2', pin: '1234', drawKey: key, stakeMinor: 100_00, selection: { type: 'straight', digits: '472' } }
  });
  assert.equal(res.status, 201);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 900_00, 'the staker paid');
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-2'), 0);
});

// ----------------------------------------------------------------- the PIN

test('a bet needs the PIN, not just the token', () => {
  const { operator, app } = rig();
  const { key } = openDraw(operator);
  const token = signIn(app);
  const bet = { drawKey: key, stakeMinor: 100_00, selection: { type: 'straight', digits: '472' } };

  assert.equal(call(app, 'POST', '/player/bets', { token, key: 'b1', body: bet }).status, 400);
  assert.equal(call(app, 'POST', '/player/bets', { token, key: 'b2', body: { ...bet, pin: '9999' } }).status, 403);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 1_000_00, 'nothing staked');
  assert.equal(call(app, 'POST', '/player/bets', { token, key: 'b3', body: { ...bet, pin: '1234' } }).status, 201);
});

test('a PIN locks after repeated wrong guesses, and the token does not help', () => {
  const { operator, app } = rig();
  const { key } = openDraw(operator);
  const token = signIn(app);
  const bet = { drawKey: key, stakeMinor: 1_00, pin: '0000', selection: { type: 'straight', digits: '472' } };

  for (let attempt = 1; attempt <= MAX_PIN_ATTEMPTS; attempt++) {
    const res = call(app, 'POST', '/player/bets', { token, key: `b${attempt}`, body: bet });
    assert.equal(res.status, 403);
  }
  // Even the right PIN is refused now.
  const after = call(app, 'POST', '/player/bets', { token, key: 'bx', body: { ...bet, pin: '1234' } });
  assert.equal(after.status, 403);
  assert.match(after.body.error, /locked/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 1_000_00);
});

test('sign-in gives one answer for every failure, so it cannot enumerate accounts', () => {
  const { app } = rig();
  const wrongPin = call(app, 'POST', '/player/session', { body: { playerId: 'p-1', pin: '9999' } });
  const noSuchPlayer = call(app, 'POST', '/player/session', { body: { playerId: 'nobody', pin: '1234' } });

  assert.equal(wrongPin.status, 401);
  assert.deepEqual(wrongPin.body, noSuchPlayer.body);
  assert.equal(noSuchPlayer.status, 401);
});

// ------------------------------------------------------------- server time

test('the server stamps the time, and a client cannot move the cutoff', () => {
  const { operator, app } = rig();
  const { key } = openDraw(operator);
  const token = signIn(app);

  assert.ok(token);
  // Past the cutoff by the server's clock, whatever the body claims. The
  // player signs in again because a token from this morning has expired -
  // which is the point of the expiry, not an inconvenience to work around.
  clock = '2026-08-27T18:59:00Z';
  const fresh = signIn(app);
  const res = call(app, 'POST', '/player/bets', {
    token: fresh, key: 'b1',
    body: { at: AT, drawKey: key, pin: '1234', stakeMinor: 1_00, selection: { type: 'straight', digits: '472' } }
  });
  assert.equal(res.status, 409);
  assert.match(res.body.error, /closed at/);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), 1_000_00);
});

// ------------------------------------------------------------- idempotency

test('money endpoints require an idempotency key', () => {
  const { app, agentToken } = rig();
  const res = call(app, 'POST', '/agent/cash-in', { token: agentToken, body: { playerId: 'p-2', amountMinor: 100 } });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Idempotency-Key/);
});

test('a retried request pays once', () => {
  const { operator, app, agentToken } = rig();
  const body = { playerId: 'p-2', amountMinor: 250_00 };

  const first = call(app, 'POST', '/agent/cash-in', { token: agentToken, key: 'same-key', body });
  const second = call(app, 'POST', '/agent/cash-in', { token: agentToken, key: 'same-key', body });

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-2'), 250_00, 'credited once');
  assert.deepEqual(first.body, second.body, 'and the answer is the same');
});

// -------------------------------------------------------------- error shape

test('a refused guard is a conflict, not a server error', () => {
  const { app, agentToken } = rig();
  const res = call(app, 'POST', '/agent/cash-in', {
    token: agentToken, key: 'k', body: { playerId: 'p-2', amountMinor: 500_000_00 }
  });
  assert.equal(res.status, 409, 'more float than the runner holds is an expected answer');
  assert.match(res.body.error, /cannot sell/);
});

test('an unexpected failure says nothing useful to an attacker', () => {
  const errors = [];
  const real = new Operator();
  const auth = new Auth({ ledger: real.ledger });
  // A book that throws the way a bug throws: not a refusal, just broken.
  const broken = { ledger: { solvency() { throw new TypeError('undefined has no properties'); } } };
  const app = createApp({ operator: broken, auth, now, logger: (e) => errors.push(e), serveConsole: false });
  const token = auth.issueToken({ id: 't', at: AT, kind: 'operator', subject: 's', roles: ['operator'] });

  const res = call(app, 'GET', '/operator/solvency', { token });
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: 'Internal error' });
  assert.equal(errors.length, 1, 'but it is logged for the operator');
});

/**
 * The other half of the same rule: a guard's refusal is a 409 and its message
 * reaches the caller intact, because it was written for them.
 */
test('a mistyped statement window is the caller\'s mistake, not a server fault', () => {
  const { app, operatorToken } = rig();
  const res = call(app, 'GET', '/operator/agents/ag-1/statement?from=not-a-date', { token: operatorToken });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /from must be an ISO timestamp/);
});

test('a malformed body is a 400, and an unknown route a 404', () => {
  const { app, operatorToken } = rig();
  assert.equal(call(app, 'GET', '/nope', { token: operatorToken }).status, 404);
  const bad = app.handle(
    { method: 'POST', url: '/operator/protection', headers: { authorization: `Bearer ${operatorToken}`, 'idempotency-key': 'k' } },
    '{not json'
  );
  assert.equal(bad.status, 400);
});

// ---------------------------------------------------------------- webhooks

test('a mobile money callback needs a valid signature', () => {
  const { operator, app, auth, gateway } = rig();
  operator.topUpWallet({ id: 't', at: AT, playerId: 'p-1', amountMinor: 100_00 });
  const token = signIn(app);
  call(app, 'POST', '/player/withdrawals', {
    token, key: 'w1', body: { pin: '1234', msisdn: MSISDN, amountMinor: 50_00 }
  });

  const payload = { clientRef: 'w1', status: 'SUCCEEDED', amountMinor: 50_00 };
  const raw = JSON.stringify(payload);

  const unsigned = app.handle({ method: 'POST', url: '/webhooks/mobile-money', headers: {} }, raw);
  assert.equal(unsigned.status, 401);

  const tampered = app.handle({
    method: 'POST', url: '/webhooks/mobile-money',
    headers: { 'x-signature': auth.signWebhook({ rawBody: '{"clientRef":"other"}', at: AT }) }
  }, raw);
  assert.equal(tampered.status, 401, 'a signature over different bytes does not transfer');

  const good = app.handle({
    method: 'POST', url: '/webhooks/mobile-money',
    headers: { 'x-signature': auth.signWebhook({ rawBody: raw, at: AT }) }
  }, raw);
  assert.equal(good.status, 200);
  assert.equal(good.body.outcome, 'applied');
  assert.equal(gateway.request('w1').status, 'SUCCEEDED');
});

test('a replayed callback with a stale timestamp is refused', () => {
  const { app, auth } = rig();
  const raw = JSON.stringify({ clientRef: 'w1', status: 'SUCCEEDED', amountMinor: 1 });
  const oldSignature = auth.signWebhook({ rawBody: raw, at: '2026-08-27T09:00:00Z' });

  clock = '2026-08-27T10:00:00Z';   // an hour later, well past the window
  const res = app.handle({ method: 'POST', url: '/webhooks/mobile-money', headers: { 'x-signature': oldSignature } }, raw);
  assert.equal(res.status, 401);
  assert.match(res.body.error, /tolerance window/);
});

// -------------------------------------------------------------- public draw

test('the draw receipt is public, because that is the point of it', () => {
  const { operator, app } = rig();
  const { key, seed } = openDraw(operator);

  const before = call(app, 'GET', `/draws/${key}`).body;
  assert.ok(before.commitment, 'the commitment is published with no token at all');
  assert.equal(before.seed, null);

  clock = DRAW_AT;
  operator.revealDraw({ id: 'rv', at: DRAW_AT, drawKey: key, seed });
  const after = call(app, 'GET', `/draws/${key}`).body;
  assert.equal(after.verification.ok, true, 'and anyone can check it afterwards');
  assert.equal(call(app, 'GET', '/draws/nope').status, 404);
});

// ------------------------------------------------------- a whole flow, wired

test('a full round trip: sign in, bet, settle, withdraw, callback', () => {
  const { operator, provider, app, auth, agentToken } = rig();
  const { key, seed, result } = openDraw(operator);
  const token = signIn(app);

  // The runner takes cash and the player stakes on the winning number.
  call(app, 'POST', '/agent/cash-in', { token: agentToken, key: 'ci', body: { playerId: 'p-1', amountMinor: 100_00 } });
  const bet = call(app, 'POST', '/player/bets', {
    token, key: 'bet-1',
    body: { pin: '1234', drawKey: key, stakeMinor: 100_00, selection: { type: 'straight', digits: result } }
  });
  assert.equal(bet.status, 201);

  // Only the operator may reveal - a player's token is valid and still refused.
  clock = DRAW_AT;
  const evening = signIn(app);
  const asPlayer = call(app, 'POST', `/operator/draws/${key}/reveal`, { token: evening, key: 'rv-x', body: { seed } });
  assert.equal(asPlayer.status, 403);

  const operatorToken = auth.issueToken({ id: 'tok-op2', at: AT, kind: 'operator', subject: 'staff-2', roles: ['operator'] });
  assert.equal(call(app, 'POST', `/operator/draws/${key}/reveal`, { token: operatorToken, key: 'rv', body: { seed } }).status, 200);

  const beforeWin = operator.ledger.balance('PLAYER_WALLET:p-1');
  operator.settleDraw({
    id: 'settle', at: DRAW_AT, drawKey: key,
    evaluate: (b, drawn) => (b.selection.digits === drawn ? 500_00 : 0)
  });
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), beforeWin + 500_00);

  // The player withdraws, and the provider confirms. Another sign-in: the
  // evening token was minted half an hour ago and is still good.
  clock = '2026-08-27T19:30:00Z';
  const walletBefore = operator.ledger.balance('PLAYER_WALLET:p-1');
  const withdrawal = call(app, 'POST', '/player/withdrawals', {
    token: evening, key: 'w-1', body: { pin: '1234', msisdn: MSISDN, amountMinor: 500_00, feeMinor: 50 }
  });
  assert.equal(withdrawal.status, 202, 'in flight, not complete');
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 500_00);
  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), walletBefore - 500_00);

  for (const cb of provider.drain()) {
    const raw = JSON.stringify(cb);
    const res = app.handle({
      method: 'POST', url: '/webhooks/mobile-money',
      headers: { 'x-signature': auth.signWebhook({ rawBody: raw, at: clock }) }
    }, raw);
    assert.equal(res.status, 200);
  }

  assert.equal(operator.ledger.balance('PLAYER_WALLET:p-1'), walletBefore - 500_00, 'and it stays out');
  assert.equal(operator.ledger.balance('PENDING_DISBURSEMENTS'), 0);
  assert.equal(operator.ledger.balance('TRANSACTION_FEES'), 50);
  assert.equal(operator.ledger.trialBalance().balanced, true);
  assert.equal(operator.ledger.equation().holds, true);
  assert.equal(operator.ledger.solvency().ok, true);
});

// ------------------------------------------------------------ over a socket

test('it serves over real HTTP', async (t) => {
  const { app, operatorToken } = rig();
  const server = http.createServer(app.listener);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const reported = await health.json();
  assert.equal(reported.ok, true);
  // The build is public: an inspector reads it before asking anything else.
  // It is null in a tree with no manifest, which development is.
  assert.ok(reported.build === null || typeof reported.build.short === 'string');

  const denied = await fetch(`${base}/operator/solvency`);
  assert.equal(denied.status, 401);

  const solvency = await fetch(`${base}/operator/solvency`, { headers: { authorization: `Bearer ${operatorToken}` } });
  assert.equal(solvency.status, 200);
  assert.equal((await solvency.json()).ok, true);
});
