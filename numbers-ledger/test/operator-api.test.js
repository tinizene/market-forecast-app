'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const { Operator } = require('../src/operator.js');
const { Auth } = require('../src/http/auth.js');
const { createApp } = require('../src/http/app.js');
const { MobileMoneyGateway } = require('../src/mobilemoney/gateway.js');
const { SimulatedProvider } = require('../src/mobilemoney/simulator.js');
const draws = require('../src/draws.js');

// The console settles with the game's own rules, so the tests do too.
const game = require('../../africa-numbers/game.js');

const AT = '2026-08-27T10:00:00Z';
const DRAW_AT = '2026-08-27T19:00:00Z';
const AFTER_DRAW = '2026-08-27T19:05:00Z';

let clock = AT;
const now = () => clock;

const evaluate = (bet, result) => {
  const s = bet.selection;
  if (!s || !game.isHit(s, result)) return 0;
  return game.quote(s.type, bet.stakeMinor).netCents;
};

function rig({ withEvaluator = true, withGateway = true } = {}) {
  clock = AT;
  const operator = new Operator();
  const provider = new SimulatedProvider();
  const gateway = withGateway ? new MobileMoneyGateway({ operator, provider }) : null;
  const auth = new Auth({ ledger: operator.ledger, webhookSecret: 'shh' });
  const app = createApp({
    operator, gateway, auth, now,
    evaluate: withEvaluator ? evaluate : null,
    // The console's files are read from disk at construction; the route tests
    // do not need them and a missing file should not look like a route bug.
    serveConsole: false
  });

  operator.injectCapital({ id: 'cap', at: AT, amountMinor: 1_000_000_00 });

  const op = auth.issueToken({ id: 'tok-op', at: AT, kind: 'operator', subject: 'staff-1', roles: ['operator'] });
  const agent = auth.issueToken({ id: 'tok-ag', at: AT, kind: 'agent', subject: 'ag-1', roles: ['agent'] });
  return { operator, provider, gateway, auth, app, op, agent };
}

let sequence = 0;
const call = (app, method, url, { token = null, body = null, key = null } = {}) => {
  const raw = body === null ? '' : JSON.stringify(body);
  return app.handle({
    method, url,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(key === false ? {} : { 'idempotency-key': key || `k-${++sequence}` })
    }
  }, raw);
};

// --------------------------------------------------------------- the console

test('the console is served as a static page and needs no credential', () => {
  const operator = new Operator();
  const app = createApp({ operator });
  const page = app.handle({ method: 'GET', url: '/console', headers: {} }, '');
  assert.equal(page.status, 200);
  assert.match(page.type, /text\/html/);
  // It holds no data: every figure on it arrives from an authenticated call
  // the page makes afterwards.
  assert.doesNotMatch(page.raw, /an_[0-9a-f]{8}/);
  assert.equal(app.handle({ method: 'GET', url: '/console/console.js', headers: {} }, '').status, 200);
  assert.equal(app.handle({ method: 'GET', url: '/console/console-core.js', headers: {} }, '').status, 200);
  assert.equal(app.handle({ method: 'GET', url: '/console/console.css', headers: {} }, '').status, 200);
  assert.equal(app.handle({ method: 'GET', url: '/console/favicon.svg', headers: {} }, '').status, 200);
  operator.close();
});

test('the console page asks for nothing outside its own origin', () => {
  const operator = new Operator();
  const app = createApp({ operator });
  const page = app.handle({ method: 'GET', url: '/console', headers: {} }, '').raw;
  // Every src/href is a relative path. A remote script here would run with the
  // operator's token in reach, and the CSP is the belt to this pair of braces.
  const references = [...page.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(references.length >= 3);
  for (const reference of references) assert.match(reference, /^\/console\//);
  // No inline handlers either - the policy forbids inline script, so an
  // onclick= would be a dead button rather than a working one.
  assert.doesNotMatch(page, /\son[a-z]+="/);
  operator.close();
});

/**
 * The console shows and hides whole panes with the `hidden` property, and the
 * classes on those panes set `display` - which beats the user agent's rule for
 * [hidden]. Without the override the sign-in card stays on screen behind the
 * signed-in console. It did, until a browser run showed it.
 */
test('the stylesheet makes the hidden property win', () => {
  const operator = new Operator();
  const app = createApp({ operator });
  const css = app.handle({ method: 'GET', url: '/console/console.css', headers: {} }, '').raw;
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  operator.close();
});

test('there is no path out of the console directory', () => {
  const { app, op } = rig();
  for (const url of ['/console/../src/operator.js', '/console/%2e%2e/package.json', '/console/../../etc/passwd']) {
    assert.equal(call(app, 'GET', url, { token: op }).status, 404, url);
  }
});

// ------------------------------------------------------------------ overview

test('the overview recomputes every check rather than reporting a flag', () => {
  const { app, op, operator } = rig();
  const body = call(app, 'GET', '/operator/overview', { token: op }).body;

  assert.equal(body.solvency.ok, true);
  assert.equal(body.equation.holds, true);
  assert.equal(body.trialBalance.balanced, true);
  assert.deepEqual(body.drift, []);
  assert.equal(body.journalSize, operator.ledger.size);
  assert.equal(body.currency.code, 'LRD');
});

test('the overview is operator-only', () => {
  const { app, agent } = rig();
  assert.equal(call(app, 'GET', '/operator/overview', { token: agent }).status, 403);
  assert.equal(call(app, 'GET', '/operator/overview').status, 401);
});

test('the snapshot and the journal come back newest first and bounded', () => {
  const { app, op, operator } = rig();
  operator.buyFloat({ id: 'f1', at: AT, agentId: 'ag-1', paidMinor: 10_000, floatMinor: 10_000 });

  const snapshot = call(app, 'GET', '/operator/snapshot', { token: op }).body;
  assert.ok(snapshot.accounts.some((row) => row.account === 'SETTLEMENT'));

  const journal = call(app, 'GET', '/operator/journal?limit=1', { token: op }).body;
  assert.equal(journal.transactions.length, 1);
  assert.equal(journal.transactions[0].kind, 'BUY_FLOAT');
  assert.equal(journal.total, operator.ledger.size);
});

// ------------------------------------------------------------------ treasury

test('capital and tax move money and need an idempotency key', () => {
  const { app, op, operator } = rig();
  const before = operator.ledger.solvency().assets;

  assert.equal(call(app, 'POST', '/operator/capital', { token: op, body: { amountMinor: 5_000_00 }, key: false }).status, 400);

  const posted = call(app, 'POST', '/operator/capital', { token: op, body: { amountMinor: 5_000_00 }, key: 'cap-1' });
  assert.equal(posted.status, 201);
  assert.equal(operator.ledger.solvency().assets, before + 5_000_00);

  // The retry a flaky connection produces. Same key, same money.
  call(app, 'POST', '/operator/capital', { token: op, body: { amountMinor: 5_000_00 }, key: 'cap-1' });
  assert.equal(operator.ledger.solvency().assets, before + 5_000_00);

  assert.equal(call(app, 'POST', '/operator/tax', { token: op, body: { amountMinor: 100_00 } }).status, 201);
});

test('an amount that is not a whole number of minor units is refused at the door', () => {
  const { app, op } = rig();
  for (const amountMinor of [12.5, -100, 0, '500', null]) {
    assert.equal(call(app, 'POST', '/operator/capital', { token: op, body: { amountMinor } }).status, 400,
      `accepted ${amountMinor}`);
  }
});

// --------------------------------------------------------------------- float

test('selling float to a runner is one call and registers them', () => {
  const { app, op, operator } = rig();
  const sold = call(app, 'POST', '/operator/agents/ag-1/float', {
    token: op, body: { paidMinor: 90_00, floatMinor: 100_00 }
  });

  assert.equal(sold.status, 201);
  assert.equal(sold.body.closingMinor, 100_00);
  assert.equal(sold.body.commissionMinor, 10_00);
  assert.deepEqual(operator.agents().map((a) => a.agentId), ['ag-1']);
});

/**
 * Commission is a discount on float, so float granted is always at least the
 * money received. The other way round - taking more cash than the float handed
 * over - is the runner being short-changed, and it is refused.
 */
test('taking more money than the float granted is refused as a conflict, not a crash', () => {
  const { app, op } = rig();
  const refused = call(app, 'POST', '/operator/agents/ag-1/float', {
    token: op, body: { paidMinor: 100_00, floatMinor: 50_00 }
  });
  assert.equal(refused.status, 409);
  assert.match(refused.body.error, /cannot exceed the float granted/);

  // Granting more float than cash received is the commission, and is fine.
  assert.equal(call(app, 'POST', '/operator/agents/ag-1/float', {
    token: op, body: { paidMinor: 90_00, floatMinor: 100_00 }
  }).status, 201);
});

test('a suspended runner cannot buy float, and reinstating them restores it', () => {
  const { app, op } = rig();
  call(app, 'POST', '/operator/agents/ag-1/float', { token: op, body: { paidMinor: 100_00, floatMinor: 100_00 } });
  call(app, 'POST', '/operator/agents/ag-1/suspend', { token: op, body: { reason: 'short at close' } });

  assert.equal(call(app, 'POST', '/operator/agents/ag-1/float', {
    token: op, body: { paidMinor: 100_00, floatMinor: 100_00 }
  }).status, 409);

  call(app, 'POST', '/operator/agents/ag-1/reinstate', { token: op, body: {} });
  assert.equal(call(app, 'POST', '/operator/agents/ag-1/float', {
    token: op, body: { paidMinor: 100_00, floatMinor: 100_00 }
  }).status, 201);
});

test('buying float back returns a statement that reconciles with the ledger', () => {
  const { app, op } = rig();
  call(app, 'POST', '/operator/agents/ag-1/float', { token: op, body: { paidMinor: 100_00, floatMinor: 100_00 } });
  const back = call(app, 'POST', '/operator/agents/ag-1/float-back', { token: op, body: { amountMinor: 40_00 } });

  assert.equal(back.status, 201);
  assert.equal(back.body.closingMinor, 60_00);
  assert.equal(back.body.reconciles, true);
});

// --------------------------------------------------------------------- draws

function openDraw(app, op, key = 'D1') {
  const seed = draws.createSeed();
  const schedule = draws.schedule({ drawKey: key, drawAt: DRAW_AT, opensAt: AT });
  const opened = call(app, 'POST', '/operator/draws', {
    token: op, body: { drawKey: key, commitment: draws.commit(key, seed), ...schedule }
  });
  return { seed, opened, result: draws.resultFromSeed(key, seed) };
}

test('the draw list carries the verification, not just the number', () => {
  const { app, op } = rig();
  const { seed, result } = openDraw(app, op);

  let listed = call(app, 'GET', '/operator/draws', { token: op }).body.draws;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].result, null);
  assert.equal(listed[0].bets, 0);

  clock = AFTER_DRAW;
  call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed } });

  listed = call(app, 'GET', '/operator/draws', { token: op }).body.draws;
  assert.equal(listed[0].result, result);
  assert.equal(listed[0].verification.ok, true);
});

test('a seed that does not match the commitment is refused', () => {
  const { app, op } = rig();
  openDraw(app, op);
  clock = AFTER_DRAW;
  const refused = call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed: draws.createSeed() } });
  assert.equal(refused.status, 409);
  assert.match(refused.body.error, /does not match the commitment/);
});

test('settlement pays the winners the game picks', () => {
  const { app, op, operator } = rig();
  const { seed, result } = openDraw(app, op);

  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  operator.placeBet({
    id: 'b1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00,
    selection: { type: 'straight', digits: result }
  });
  operator.placeBet({
    id: 'b2', at: AT, betId: 'b2', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00,
    selection: { type: 'straight', digits: result === '000' ? '111' : '000' }
  });

  clock = AFTER_DRAW;
  call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed } });
  const settled = call(app, 'POST', '/operator/draws/D1/settle', { token: op, body: {} });

  assert.equal(settled.status, 200);
  assert.equal(settled.body.betsSettled, 2);
  assert.equal(settled.body.winners, 1);
  assert.equal(settled.body.totalStakes, 20_00);
  assert.equal(settled.body.totalPayout, game.quote('straight', 10_00).netCents);
});

/**
 * Settlement is refused outright rather than falling back to some default,
 * because a default payout table is a second copy of the board that can
 * disagree with the one players were quoted.
 */
test('without an injected evaluator, settlement is unavailable rather than guessed', () => {
  const { app, op } = rig({ withEvaluator: false });
  const { seed } = openDraw(app, op);
  clock = AFTER_DRAW;
  call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed } });
  assert.equal(call(app, 'POST', '/operator/draws/D1/settle', { token: op, body: {} }).status, 503);
});

test('settling twice is refused, not paid twice', () => {
  const { app, op, operator } = rig();
  const { seed, result } = openDraw(app, op);
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  operator.placeBet({
    id: 'b1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00,
    selection: { type: 'straight', digits: result }
  });

  clock = AFTER_DRAW;
  call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed } });
  call(app, 'POST', '/operator/draws/D1/settle', { token: op, body: {}, key: 'settle-1' });

  const again = call(app, 'POST', '/operator/draws/D1/settle', { token: op, body: {}, key: 'settle-2' });
  assert.equal(again.status, 409);
  assert.match(again.body.error, /already settled/);
});

// ------------------------------------------------------------------- players

test('an operator can read any player, and a runner cannot read one at all', () => {
  const { app, op, agent, operator } = rig();
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 10_000_00, floatMinor: 10_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00 });

  const statement = call(app, 'GET', '/operator/players/p-1', { token: op });
  assert.equal(statement.status, 200);
  assert.equal(statement.body.walletMinor, 500_00);

  assert.equal(call(app, 'GET', '/operator/players/p-1', { token: agent }).status, 403);
});

test('the console is where a player gets a PIN, and a bad one is a 400', () => {
  const { app, op, auth } = rig();
  assert.equal(call(app, 'POST', '/operator/players/p-1/pin', { token: op, body: { pin: '4321' } }).status, 201);
  assert.equal(auth.checkPin({ id: 'c1', at: AT, playerId: 'p-1', pin: '4321' }).ok, true);

  for (const pin of ['12', 'abcd', '', '123456789']) {
    assert.equal(call(app, 'POST', '/operator/players/p-1/pin', { token: op, body: { pin } }).status, 400, pin);
  }
});

test('a player locked out by failed PINs is unlocked from the console', () => {
  const { app, op, auth } = rig();
  call(app, 'POST', '/operator/players/p-1/pin', { token: op, body: { pin: '4321' } });
  for (let i = 0; i < 3; i++) auth.checkPin({ id: `bad-${i}`, at: AT, playerId: 'p-1', pin: '0000' });
  assert.equal(auth.checkPin({ id: 'c', at: AT, playerId: 'p-1', pin: '4321' }).reason, 'locked');

  assert.equal(call(app, 'POST', '/operator/players/p-1/unlock', { token: op, body: {} }).status, 200);
  assert.equal(auth.checkPin({ id: 'c2', at: AT, playerId: 'p-1', pin: '4321' }).ok, true);

  // Unlocking one who is not locked is a refusal, not a silent success.
  assert.equal(call(app, 'POST', '/operator/players/p-1/unlock', { token: op, body: {} }).status, 409);
});

test('limits and exclusion set from the console take effect on the next bet', () => {
  const { app, op, operator } = rig();
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 10_000_00, floatMinor: 10_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00 });
  const drawKey = 'D1';
  const { seed } = openDraw(app, op, drawKey);
  assert.ok(seed);

  call(app, 'POST', '/operator/players/p-1/limits', { token: op, body: { dailyStakeMinor: 20_00 } });
  operator.placeBet({ id: 'b1', at: AT, betId: 'b1', playerId: 'p-1', drawKey, stakeMinor: 15_00, selection: { type: 'straight', digits: '123' } });
  assert.throws(
    () => operator.placeBet({ id: 'b2', at: AT, betId: 'b2', playerId: 'p-1', drawKey, stakeMinor: 15_00, selection: { type: 'straight', digits: '123' } }),
    /daily/i
  );

  const excluded = call(app, 'POST', '/operator/players/p-1/exclude', { token: op, body: { reason: 'asked' } });
  assert.equal(excluded.body.excluded, true);
  assert.throws(
    () => operator.placeBet({ id: 'b3', at: AT, betId: 'b3', playerId: 'p-1', drawKey, stakeMinor: 1_00, selection: { type: 'straight', digits: '123' } }),
    /excluded/i
  );

  const back = call(app, 'POST', '/operator/players/p-1/reinstate', { token: op, body: {} });
  assert.equal(back.body.excluded, false);
});

// ---------------------------------------------------------------- protection

test('protection is off until it is switched on, and switching it off leaves per-player rules alone', () => {
  const { app, op } = rig();
  assert.equal(call(app, 'GET', '/operator/protection', { token: op }).body.active, false);

  const on = call(app, 'POST', '/operator/protection', { token: op, body: { dailyStakeMinor: 100_00, dailyLossMinor: 50_00 } });
  assert.equal(on.body.active, true);
  assert.equal(on.body.dailyStakeMinor, 100_00);

  call(app, 'POST', '/operator/players/p-9/exclude', { token: op, body: {} });
  const off = call(app, 'DELETE', '/operator/protection', { token: op });
  assert.equal(off.body.active, false);
  // An exclusion is the player's decision, not a setting the operator toggles.
  assert.equal(off.body.excluded, 1);
});

// ------------------------------------------------------------ money in flight

test('pending disbursements and anomalies are visible, and a sweep needs no key', () => {
  const { app, op, operator, gateway, provider } = rig();
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 10_000_00, floatMinor: 10_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 500_00 });

  provider.script('timeout');
  gateway.requestPayout({ ref: 'pay-1', at: AT, playerId: 'p-1', msisdn: '+231770000001', amountMinor: 100_00 });

  const view = call(app, 'GET', '/operator/mobile-money', { token: op }).body;
  assert.equal(view.pending.length, 1);
  assert.equal(view.pending[0].ref, 'pay-1');

  // No Idempotency-Key on purpose: the sweep derives its own event ids.
  const swept = call(app, 'POST', '/operator/mobile-money/reconcile', { token: op, body: {}, key: false });
  assert.equal(swept.status, 200);
});

test('without a gateway the money routes say so rather than pretending', () => {
  const { app, op } = rig({ withGateway: false });
  assert.equal(call(app, 'GET', '/operator/mobile-money', { token: op }).status, 503);
  assert.equal(call(app, 'POST', '/operator/mobile-money/reconcile', { token: op, body: {}, key: false }).status, 503);
});

// ----------------------------------------------------------------- promotions

test('the jackpot is funded from a settled draw, never from an open one', () => {
  const { app, op, operator } = rig();
  const { seed, result } = openDraw(app, op);
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 100_000_00, floatMinor: 100_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  operator.placeBet({
    id: 'b1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00,
    selection: { type: 'straight', digits: result === '000' ? '111' : '000' }
  });

  // A pot funded before the stakes are final is funded from a guess.
  const early = call(app, 'POST', '/operator/jackpot/fund', { token: op, body: { drawKey: 'D1', amountMinor: 1_000_00 } });
  assert.equal(early.status, 409);
  assert.match(early.body.error, /has not settled/);

  clock = AFTER_DRAW;
  call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed } });
  call(app, 'POST', '/operator/draws/D1/settle', { token: op, body: {} });

  const funded = call(app, 'POST', '/operator/jackpot/fund', { token: op, body: { drawKey: 'D1', amountMinor: 1_000_00 } });
  assert.equal(funded.status, 201);
  assert.equal(funded.body.poolMinor, 1_000_00);
  assert.equal(funded.body.funded, true);

  // One draw contributes once, however many times the button is pressed.
  const twice = call(app, 'POST', '/operator/jackpot/fund', { token: op, body: { drawKey: 'D1', amountMinor: 1_000_00 } });
  assert.equal(twice.status, 409);
});

test('a free ticket is a callable liability the moment it is issued', () => {
  const { app, op, operator } = rig();
  const before = operator.ledger.solvency().callable;

  const issued = call(app, 'POST', '/operator/promotions/free-tickets', {
    token: op, body: { campaignId: 'welcome', ticketId: 't-1', playerId: 'p-1', faceMinor: 50_00 }
  });
  assert.equal(issued.status, 201);
  assert.equal(issued.body.spentMinor, 50_00);
  assert.equal(operator.ledger.solvency().callable, before + 50_00);

  const campaign = call(app, 'GET', '/operator/promotions/welcome', { token: op }).body;
  assert.equal(campaign.spentMinor, 50_00);
});

// -------------------------------------------------------------------- reports

function tradedDay(app, op, operator) {
  const { seed, result } = openDraw(app, op);
  operator.buyFloat({ id: 'f', at: AT, agentId: 'ag-1', paidMinor: 95_000_00, floatMinor: 100_000_00 });
  operator.cashIn({ id: 'in', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 1_000_00 });
  operator.placeBet({
    id: 'b1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 10_00,
    selection: { type: 'straight', digits: result }
  });
  clock = AFTER_DRAW;
  call(app, 'POST', '/operator/draws/D1/reveal', { token: op, body: { seed } });
  call(app, 'POST', '/operator/draws/D1/settle', { token: op, body: {} });
  return result;
}

test('the daily close is served for a named day and reconciles', () => {
  const { app, op, operator } = rig();
  tradedDay(app, op, operator);

  const close = call(app, 'GET', '/operator/reports/close?day=2026-08-27', { token: op });
  assert.equal(close.status, 200);
  assert.equal(close.body.day, '2026-08-27');
  assert.equal(close.body.totals.paidHandle, 10_00);
  assert.equal(close.body.totals.stakesRecognised, 10_00);
  assert.ok(close.body.checks.every((c) => c.ok), 'every check on the close passes');
});

test('a day that is not a date is a 400, not a report about nothing', () => {
  const { app, op } = rig();
  assert.equal(call(app, 'GET', '/operator/reports/close?day=last-tuesday', { token: op }).status, 400);
  assert.equal(call(app, 'GET', '/operator/reports/close?from=nope', { token: op }).status, 400);
  assert.equal(call(app, 'GET', '/operator/reports/liabilities?at=nope', { token: op }).status, 400);
  assert.equal(call(app, 'GET', '/operator/reports/tax?rate=-4', { token: op }).status, 400);
});

test('every report can leave as CSV', () => {
  const { app, op, operator } = rig();
  tradedDay(app, op, operator);

  for (const path of ['close?day=2026-08-27', 'revenue', 'tax?rate=10', 'promotions', 'liabilities']) {
    const answer = call(app, 'GET', `/operator/reports/${path}${path.includes('?') ? '&' : '?'}format=csv`,
      { token: op });
    assert.equal(answer.status, 200, path);
    assert.match(answer.type, /text\/csv/, path);
    assert.match(answer.raw, /^"/, path);
  }
});

test('the tax report answers decision D6 with numbers rather than a position', () => {
  const { app, op, operator } = rig();
  tradedDay(app, op, operator);
  operator.issueFreeTicket({
    id: 'ft', at: AT, campaignId: 'welcome', ticketId: 't-1', playerId: 'p-1', faceMinor: 5_00
  });

  const tax = call(app, 'GET', '/operator/reports/tax?rate=15', { token: op }).body;
  const [allStakes, paidStakes] = tax.totals.bases;
  assert.equal(allStakes.baseMinor, 10_00, 'the free ticket was issued, not yet staked');
  assert.equal(paidStakes.baseMinor, 10_00);
  assert.equal(allStakes.taxMinor, 150);
});

test('reports are operator-only and read-only', () => {
  const { app, agent, op } = rig();
  for (const path of ['close', 'revenue', 'tax', 'promotions', 'liabilities']) {
    assert.equal(call(app, 'GET', `/operator/reports/${path}`, { token: agent }).status, 403, path);
    // No idempotency key needed: a report writes nothing.
    assert.equal(call(app, 'GET', `/operator/reports/${path}`, { token: op, key: false }).status, 200, path);
  }
});

// -------------------------------------------------------- the rules that hold

test('every new operator route is closed to a runner', () => {
  const { app, agent } = rig();
  const routes = [
    ['GET', '/operator/overview'], ['GET', '/operator/snapshot'], ['GET', '/operator/journal'],
    ['POST', '/operator/capital'], ['POST', '/operator/tax'],
    ['POST', '/operator/agents/ag-1/float'], ['POST', '/operator/agents/ag-1/float-back'],
    ['GET', '/operator/draws'], ['POST', '/operator/draws/D1/settle'],
    ['GET', '/operator/players/p-1'], ['POST', '/operator/players/p-1/limits'],
    ['POST', '/operator/players/p-1/exclude'], ['POST', '/operator/players/p-1/reinstate'],
    ['POST', '/operator/players/p-1/pin'], ['POST', '/operator/players/p-1/unlock'],
    ['DELETE', '/operator/protection'],
    ['GET', '/operator/mobile-money'], ['POST', '/operator/mobile-money/reconcile'],
    ['GET', '/operator/jackpot'], ['POST', '/operator/jackpot/fund'], ['POST', '/operator/jackpot/pay'],
    ['GET', '/operator/promotions/c-1'], ['POST', '/operator/promotions/free-tickets'],
    ['GET', '/operator/reports/close'], ['GET', '/operator/reports/revenue'],
    ['GET', '/operator/reports/tax'], ['GET', '/operator/reports/promotions'],
    ['GET', '/operator/reports/liabilities']
  ];
  for (const [method, url] of routes) {
    // A runner presenting their own valid token, which is the case that
    // matters: a route that forgot its role is not caught by an anonymous call.
    assert.equal(call(app, method, url, { token: agent, body: {} }).status, 403, `${method} ${url}`);
  }
});

test('every new operator route that moves money demands an idempotency key', () => {
  const { app, op } = rig();
  const routes = [
    ['POST', '/operator/capital'], ['POST', '/operator/tax'],
    ['POST', '/operator/agents/ag-1/float'], ['POST', '/operator/agents/ag-1/float-back'],
    ['POST', '/operator/draws/D1/settle'],
    ['POST', '/operator/players/p-1/limits'], ['POST', '/operator/players/p-1/exclude'],
    ['POST', '/operator/players/p-1/reinstate'], ['POST', '/operator/players/p-1/pin'],
    ['POST', '/operator/players/p-1/unlock'], ['DELETE', '/operator/protection'],
    ['POST', '/operator/jackpot/fund'], ['POST', '/operator/jackpot/pay'],
    ['POST', '/operator/promotions/free-tickets']
  ];
  for (const [method, url] of routes) {
    const answer = call(app, method, url, { token: op, body: {}, key: false });
    assert.equal(answer.status, 400, `${method} ${url}`);
    assert.match(answer.body.error, /Idempotency-Key/);
  }
});
