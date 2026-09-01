'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { seedFor } = require('../lab/seed-search.js');
const { seed } = require('../lab/fixtures.js');
const { createLab, createControlServer, controlKey } = require('../lab/harness.js');
const draws = require('../src/draws.js');
const { buildManifest } = require('../src/manifest.js');

const REPO = path.resolve(__dirname, '..', '..');

// -------------------------------------------------------- forcing an outcome

/**
 * The whole reason the product needs no laboratory mode. A wanted result is
 * reached by searching for a seed that produces it, using nothing a player
 * could not call.
 */
test('a draw can be made to land on any number, and still verifies publicly', () => {
  for (const wanted of ['000', '417', '999', '070']) {
    const found = seedFor('lab-day', wanted);

    assert.equal(draws.resultFromSeed('lab-day', found.seed), wanted);
    assert.equal(draws.commit('lab-day', found.seed), found.commitment);
    assert.deepEqual(
      draws.verifyDraw({ drawKey: 'lab-day', seed: found.seed, commitment: found.commitment, result: wanted }),
      { ok: true, reasons: [] }
    );
    assert.ok(found.tries >= 1);
  }
});

test('a seed found for one draw does not work for another', () => {
  const found = seedFor('monday', '417');
  assert.notEqual(draws.resultFromSeed('tuesday', found.seed), '417');
  assert.equal(draws.verifyDraw({
    drawKey: 'tuesday', seed: found.seed, commitment: found.commitment, result: '417'
  }).ok, false);
});

test('a search that cannot succeed says so rather than running forever', () => {
  assert.throws(() => seedFor('d', '417', { attempts: 5, nextSeed: () => 'a'.repeat(64) }),
    /No seed produced 417/);
  assert.throws(() => seedFor('d', '4177'), /three digits/);
});

/**
 * The structural claim the laboratory README makes: the search reaches a chosen
 * outcome through the product's public draw functions and nothing else. If this
 * file ever needs something from the operator or the ledger, the claim is no
 * longer true and this test is where that shows up.
 */
test('the search imports only the public draw module', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'lab', 'seed-search.js'), 'utf8');
  const required = [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
  assert.deepEqual(required, ['../src/draws.js']);
});

// -------------------------------------------------------------- the fixture

test('the seeded book reconciles', () => {
  const book = seed({});
  const ledger = book.operator.ledger;

  assert.equal(ledger.trialBalance().balanced, true);
  assert.equal(ledger.equation().holds, true);
  assert.equal(ledger.solvency().ok, true);
  assert.deepEqual(ledger.store.verify(), [], 'no cache drift');
  book.operator.close();
});

/**
 * An empty system tests nothing. These are the states where software goes
 * wrong, and none of them can be reached by clicking around a book that
 * started five seconds ago.
 */
test('the book contains the states a tester needs to find', () => {
  const book = seed({});
  const operator = book.operator;

  const suspended = operator.agents().filter((agent) => agent.suspended);
  assert.equal(suspended.length, 1, 'a runner who cannot reconcile');
  assert.ok(operator.agents().every((agent) => agent.floatMinor > 0), 'and every runner still holds float');

  const yesterday = operator.drawReceipt(book.yesterday);
  assert.equal(yesterday.settled, true);
  assert.equal(yesterday.result, '417');
  assert.equal(yesterday.verification.ok, true);
  assert.equal(operator.drawReceipt(book.day).status, 'open', 'and one still taking bets');

  assert.equal(book.gateway.pending().length, 1, 'a disbursement the provider never answered');
  assert.equal(operator.promoStatement('welcome').spentMinor, 20_00);
  assert.ok(operator.jackpotStatement().poolMinor > 0);

  const excluded = book.players.filter((playerId) => operator.playerStatement(playerId, `${book.day}T09:00:00Z`).excluded);
  assert.equal(excluded.length, 1, 'a player who asked to be excluded');
  book.operator.close();
});

test('somebody won, on a real ticket, at the advertised odds', () => {
  const book = seed({});
  const winners = book.players
    .map((playerId) => book.operator.playerStatement(playerId))
    .filter((statement) => statement.walletMinor > 300_00 - 20_00);

  assert.ok(winners.length > 0, 'a tester needs a winner to look at');
  book.operator.close();
});

// ---------------------------------------------------- the product is untouched

/**
 * A tester should be able to confirm there is no laboratory mode by reading the
 * product's route table. Nothing in it is called /lab.
 */
test('the product serves no control route', () => {
  const lab = createLab({});
  for (const route of lab.current.app.routes) {
    assert.doesNotMatch(route, /lab/i, route);
  }
  assert.equal(
    lab.current.app.handle({ method: 'POST', url: '/lab/force', headers: {} }, '{}').status,
    404
  );
  lab.current.operator.close();
});

/**
 * And confirm it mechanically. The harness is pinned as evidence so the
 * environment a tester was given is identifiable, and kept out of the runtime
 * section so the code that can choose an outcome is provably not in the build
 * a certificate would name.
 */
test('nothing under lab/ is in the certified build', () => {
  const manifest = buildManifest({ base: REPO });

  const runtime = manifest.sections.runtime.files.map((file) => file.path);
  assert.equal(runtime.some((file) => file.includes('/lab/')), false, 'lab code is not runtime');

  const evidence = manifest.sections.evidence.files.map((file) => file.path);
  assert.ok(evidence.includes('numbers-ledger/lab/seed-search.js'));
  assert.ok(evidence.includes('numbers-ledger/lab/harness.js'));
  assert.ok(evidence.includes('numbers-ledger/lab/README.md'), 'the README is pinned too');
});

// ------------------------------------------------------------ the harness

test('forcing opens a real draw that reveals and verifies', () => {
  const lab = createLab({});
  const forced = lab.force({ drawKey: 'forced-1', result: '888' });
  assert.equal(forced.result, '888');

  // A forced draw is scheduled a minute out, so betting has a window and the
  // cutoff is a real thing rather than a formality.
  lab.advance({ seconds: 120 });
  const revealed = lab.reveal({ drawKey: 'forced-1' });
  assert.equal(revealed.result, '888');
  assert.equal(lab.current.operator.drawReceipt('forced-1').verification.ok, true);
  lab.current.operator.close();
});

/**
 * The one rule the harness does not bend. A published commitment is not
 * editable, and a laboratory environment that let it be would be demonstrating
 * the opposite of what it exists to demonstrate.
 */
test('forcing cannot rewrite a commitment that has already been published', () => {
  const lab = createLab({});
  lab.force({ drawKey: 'forced-1', result: '111' });

  assert.throws(() => lab.force({ drawKey: 'forced-1', result: '222' }), /already committed/);
  // Including yesterday's, which is settled.
  assert.throws(() => lab.force({ drawKey: lab.current.yesterday, result: '222' }), /already committed/);
  lab.current.operator.close();
});

/**
 * The harness supplies the seed and nothing else. Whether it is time is the
 * product's decision, made against the clock it was given - so the tester winds
 * the clock rather than the rule.
 */
test('a reveal before the draw time is refused, and winding the clock allows it', () => {
  const lab = createLab({});
  lab.force({ drawKey: 'forced-1', result: '333', drawAt: '2026-09-01T18:00:00.000Z' });

  assert.throws(() => lab.reveal({ drawKey: 'forced-1' }), /cannot be revealed before/);

  lab.advance({ seconds: 9 * 60 * 60 });
  assert.equal(lab.reveal({ drawKey: 'forced-1' }).result, '333');
  assert.equal(lab.current.operator.drawReceipt('forced-1').verification.ok, true);
  lab.current.operator.close();
});

test('the clock only goes forwards', () => {
  const lab = createLab({});
  const before = lab.current.now();

  assert.throws(() => lab.advance({ seconds: -60 }), /positive/);
  assert.throws(() => lab.advance({ seconds: 0 }), /positive/);
  assert.throws(() => lab.advance({ seconds: 'later' }), /positive/);
  assert.ok(lab.current.now() >= before);

  lab.advance({ seconds: 3600 });
  assert.ok(Date.parse(lab.current.now()) - Date.parse(before) >= 3_600_000);
  lab.current.operator.close();
});

test('a reset puts the clock back where it started', () => {
  const lab = createLab({});
  lab.advance({ seconds: 86_400 });
  assert.match(lab.state().offset, /^8\d{4}s$/);

  lab.reset();
  assert.equal(lab.state().offset, '0s');
  lab.current.operator.close();
});

test('reset throws the book away and issues new credentials', () => {
  const lab = createLab({});
  const before = lab.credentials().operatorToken;
  lab.current.operator.injectCapital({ id: 'extra', at: lab.current.now(), amountMinor: 1_00 });
  const grown = lab.state().transactions;

  const after = lab.reset();
  assert.ok(after.transactions < grown, 'the extra transaction is gone');
  assert.notEqual(lab.credentials().operatorToken, before);
  lab.current.operator.close();
});

// ------------------------------------------------------- the control server

test('the control surface answers nothing without its key', async (t) => {
  const lab = createLab({});
  const key = controlKey();
  const server = createControlServer(lab, { key });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { lab.current.operator.close(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;

  const refused = await fetch(`${base}/lab/state`);
  assert.equal(refused.status, 401);

  const allowed = await fetch(`${base}/lab/state`, { headers: { 'x-lab-key': key } });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).solvency.ok, true);

  const unknown = await fetch(`${base}/lab/nope`, { headers: { 'x-lab-key': key } });
  assert.equal(unknown.status, 404);
});

test('a refused control call reports why, and does not crash the harness', async (t) => {
  const lab = createLab({});
  const key = controlKey();
  const server = createControlServer(lab, { key });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { lab.current.operator.close(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;

  const post = (path_, body) => fetch(`${base}${path_}`, {
    method: 'POST',
    headers: { 'x-lab-key': key, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  assert.equal((await post('/lab/force', { drawKey: 'twice', result: '404' })).status, 200);
  const again = await post('/lab/force', { drawKey: 'twice', result: '405' });
  assert.equal(again.status, 409);
  assert.match((await again.json()).error, /already committed/);

  // Still alive and still consistent.
  const state = await (await fetch(`${base}/lab/state`, { headers: { 'x-lab-key': key } })).json();
  assert.equal(state.solvency.ok, true);
});

// ------------------------------------------------------- end to end, as a tester

test('the printed credentials actually drive the product', () => {
  const lab = createLab({});
  const app = lab.current.app;
  const credentials = lab.credentials();
  const player = credentials.players[0].playerId;

  const call = (method, url, { token = null, body = null, key = null } = {}) => app.handle({
    method, url,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(key ? { 'idempotency-key': key } : {})
    }
  }, body === null ? '' : JSON.stringify(body));

  // The operator token opens the book.
  const overview = call('GET', '/operator/overview', { token: credentials.operatorToken });
  assert.equal(overview.status, 200);
  assert.equal(overview.body.solvency.ok, true);

  // The runner token moves value into a wallet.
  const cashIn = call('POST', '/agent/cash-in', {
    token: credentials.agentToken, key: 'lab-ci', body: { playerId: player, amountMinor: 100_00 }
  });
  assert.equal(cashIn.status, 201);

  // The player signs in with the printed PIN and bets into today's open draw.
  const session = call('POST', '/player/session', { body: { playerId: player, pin: '1234' } });
  assert.equal(session.status, 201);

  const bet = call('POST', '/player/bets', {
    token: session.body.token, key: 'lab-bet',
    body: { pin: '1234', drawKey: lab.day, stakeMinor: 10_00, selection: { type: 'straight', digits: '417' } }
  });
  assert.equal(bet.status, 201, JSON.stringify(bet.body));
  lab.current.operator.close();
});
