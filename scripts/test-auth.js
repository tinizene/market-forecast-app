#!/usr/bin/env node
//
// Tests for the email-recovery flow (api/auth.js) and for the removal of the
// unauthenticated api/billing.js fn=restore endpoint it replaces.
//
// This code is the only thing standing between a lost cookie and a lost EUR 200
// purchase, and the endpoint it replaced handed out entitlement to anyone who typed a
// customer's email address. That is not something to check by hand once — hence a
// committed suite that runs with `node scripts/test-auth.js` and exits nonzero.
//
// Stripe, the KV store and the mail provider are stubbed by one local HTTP server, so
// nothing here touches the network, needs credentials, or sends mail. The handlers are
// invoked directly with request/response doubles rather than over HTTP, which keeps
// the assertions on behaviour rather than on a web framework.

const http = require('http');
const crypto = require('crypto');

// ---- assertions ----------------------------------------------------------

let passed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) { passed++; return; }
  failures.push(detail ? `${name}\n      ${detail}` : name);
}
const eq = (name, actual, expected) =>
  check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
const truthy = (name, v, detail) => check(name, Boolean(v), detail);

// ---- the stub server -----------------------------------------------------

const kv = new Map();          // key -> { value, expiresAt }
const sent = [];               // every email the mailer would have sent
let stripeCustomers = {};      // email -> customer id
let stripeState = {};          // customer id -> { course, ideas }
let stripeDown = false;

function kvGet(key) {
  const e = kv.get(key);
  if (!e) return null;
  if (e.expiresAt && e.expiresAt < Date.now()) { kv.delete(key); return null; }
  return e.value;
}

function runKv(args) {
  const [cmd, key, ...rest] = args;
  switch (String(cmd).toUpperCase()) {
    case 'SET': {
      const nx = rest.includes('NX');
      const exIdx = rest.indexOf('EX');
      const ttl = exIdx > -1 ? parseInt(rest[exIdx + 1], 10) : 0;
      if (nx && kvGet(key) !== null) return null;
      kv.set(key, { value: rest[0], expiresAt: ttl ? Date.now() + ttl * 1000 : 0 });
      return 'OK';
    }
    case 'GET': return kvGet(key);
    case 'DEL': { const had = kvGet(key) !== null; kv.delete(key); return had ? 1 : 0; }
    case 'INCR': {
      const cur = parseInt(kvGet(key) || '0', 10) + 1;
      const prev = kv.get(key);
      kv.set(key, { value: String(cur), expiresAt: prev ? prev.expiresAt : 0 });
      return cur;
    }
    case 'EXPIRE': {
      const e = kv.get(key);
      if (!e) return 0;
      e.expiresAt = Date.now() + parseInt(rest[0], 10) * 1000;
      return 1;
    }
    default: return null;
  }
}

function stripeReply(url) {
  if (stripeDown) return { status: 500, body: { error: { message: 'stripe is down' } } };
  const u = new URL(url, 'http://stub');
  const path = u.pathname;
  if (path === '/v1/customers') {
    const email = (u.searchParams.get('email') || '').toLowerCase();
    const id = stripeCustomers[email];
    return { status: 200, body: { data: id ? [{ id, email }] : [] } };
  }
  if (path === '/v1/checkout/sessions') {
    const cus = u.searchParams.get('customer');
    const st = stripeState[cus] || {};
    return {
      status: 200,
      body: {
        data: st.course
          ? [{ id: 'cs_1', created: st.courseAt || 1000, payment_status: 'paid', amount_total: 20000, payment_intent: 'pi_1', metadata: { product: 'course' } }]
          : [],
      },
    };
  }
  if (path === '/v1/subscriptions') {
    const cus = u.searchParams.get('customer');
    const st = stripeState[cus] || {};
    return {
      status: 200,
      body: { data: st.ideas ? [{ id: 'sub_1', status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 86400 }] : [] },
    };
  }
  if (path === '/v1/refunds') return { status: 200, body: { data: [] } };
  return { status: 404, body: { error: { message: `unstubbed ${path}` } } };
}

function startStub() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        const send = (status, body) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(body));
        };
        if (req.url.startsWith('/kv')) return send(200, { result: runKv(JSON.parse(raw)) });
        if (req.url.startsWith('/mail/')) {
          sent.push({ provider: req.url.split('/')[2], body: JSON.parse(raw) });
          return send(200, { id: 'msg_1' });
        }
        if (req.url.startsWith('/stripe')) {
          const r = stripeReply(req.url.replace('/stripe', ''));
          return send(r.status, r.body);
        }
        return send(404, { error: 'unknown stub route' });
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// ---- request/response doubles -------------------------------------------

function makeReq(opts) {
  return {
    method: opts.method || 'GET',
    query: opts.query || {},
    body: opts.body,
    headers: Object.assign({ host: 'scere.example' }, opts.headers || {}),
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    payload: null,
    ended: false,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.payload = o; this.ended = true; return this; },
    send(s) { this.payload = s; this.ended = true; return this; },
    end() { this.ended = true; return this; },
  };
  return res;
}

const cookiesOf = (res) => [].concat(res.getHeader('set-cookie') || []);
const cookieNamed = (res, name) => cookiesOf(res).find((c) => c.startsWith(`${name}=`)) || null;

// ---- environment ---------------------------------------------------------

const SECRET = 'test-secret-value';

function configureEnv(base, opts) {
  const o = opts || {};
  process.env.ENTITLEMENT_SECRET = o.secret === undefined ? SECRET : o.secret;
  process.env.STRIPE_SECRET_KEY = 'sk_test_stub';
  process.env.STRIPE_COURSE_PRICE_ID = 'price_course';
  process.env.STRIPE_API_BASE = `${base}/stripe`;
  process.env.PUBLIC_BASE_URL = 'https://scere.example';
  if (o.kv === false) { delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN; }
  else { process.env.KV_REST_API_URL = `${base}/kv`; process.env.KV_REST_API_TOKEN = 'kv-token'; }
  if (o.mail === false) { delete process.env.RESEND_API_KEY; delete process.env.AUTH_EMAIL_FROM; }
  else {
    process.env.RESEND_API_KEY = 're_stub';
    process.env.AUTH_EMAIL_FROM = 'login@scere.example';
    process.env.MAIL_API_BASE = `${base}/mail`;
  }
}

// Handlers read process.env at call time, but require() caches the module, so reload
// them whenever the environment changes shape.
function loadHandlers() {
  for (const k of Object.keys(require.cache)) {
    if (/\/(api|lib)\//.test(k)) delete require.cache[k];
  }
  return { auth: require('../api/auth.js'), billing: require('../api/billing.js') };
}

const sign = (payload, secret) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
};
const nowSec = () => Math.floor(Date.now() / 1000);

// ---- the suite -----------------------------------------------------------

async function main() {
  const server = await startStub();
  const base = `http://127.0.0.1:${server.address().port}`;

  // ===== configuration reporting =====
  configureEnv(base, { mail: false, kv: false });
  let { auth } = loadHandlers();
  let res = makeRes();
  await auth(makeReq({ query: { fn: 'config' } }), res);
  eq('config reports not configured without a mailer', res.payload.configured, false);
  truthy('config names the missing mailer', /provider key/.test(res.payload.reason || ''), res.payload.reason);

  configureEnv(base, { kv: false });
  ({ auth } = loadHandlers());
  res = makeRes();
  await auth(makeReq({ query: { fn: 'config' } }), res);
  eq('config still refuses without a KV store', res.payload.configured, false);
  truthy('config names the missing store', /KV/.test(res.payload.reason || ''), res.payload.reason);

  // An unset origin would put a relative path in the email — a link nobody can click,
  // and one only the customer it was sent to would ever discover.
  configureEnv(base);
  delete process.env.PUBLIC_BASE_URL;
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  ({ auth } = loadHandlers());
  res = makeRes();
  await auth(makeReq({ query: { fn: 'config' } }), res);
  eq('config refuses when there is no origin to build a link from', res.payload.configured, false);
  truthy('config names the missing origin', /origin/.test(res.payload.reason || ''), res.payload.reason);

  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'a@b.com' } }), res);
  eq('request fails closed with no store rather than sending an unburnable link', res.statusCode, 503);

  // ===== fully configured =====
  configureEnv(base);
  ({ auth } = loadHandlers());
  res = makeRes();
  await auth(makeReq({ query: { fn: 'config' } }), res);
  eq('config reports ready once Stripe, mail and KV are all set', res.payload.configured, true);
  eq('config gives no reason when nothing is wrong', res.payload.reason, null);

  stripeCustomers = { 'owner@example.com': 'cus_owner', 'ideas@example.com': 'cus_ideas' };
  stripeState = { cus_owner: { course: true }, cus_ideas: { ideas: true } };

  // ===== enumeration =====
  sent.length = 0;
  const unknownRes = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'nobody@example.com' } }), unknownRes);
  const knownRes = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' } }), knownRes);

  eq('unknown address gets 200', unknownRes.statusCode, 200);
  eq('known address gets 200', knownRes.statusCode, 200);
  eq('the two answers are byte-identical',
    JSON.stringify(unknownRes.payload), JSON.stringify(knownRes.payload));
  eq('no mail is sent to an address with no purchase', sent.length, 1);
  eq('mail is sent to the address that has one', sent[0].body.to[0], 'owner@example.com');

  // ===== the link itself =====
  const linkMatch = /https:\/\/[^\s"<]+/.exec(sent[0].body.text);
  truthy('the email contains a link', linkMatch);
  const link = linkMatch[0];
  truthy('the link uses the configured public origin, not the request Host header',
    link.startsWith('https://scere.example/api/auth?fn=verify&token='), link);
  const token = decodeURIComponent(new URL(link).searchParams.get('token'));
  truthy('the link carries a token', token && token.includes('.'));
  eq('the sender is the dedicated login address', sent[0].body.from, 'login@scere.example');
  truthy('the email says the link is single use', /works once/i.test(sent[0].body.text));

  // Host-header injection: a forged Host must not appear in the emailed link.
  sent.length = 0;
  res = makeRes();
  await auth(makeReq({
    method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' },
    headers: { host: 'evil.example', 'x-forwarded-host': 'evil.example' },
  }), res);
  truthy('a forged Host header cannot redirect the emailed link',
    sent.length === 1 && !/evil\.example/.test(sent[0].body.text), sent[0] && sent[0].body.text);

  // ===== input validation =====
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'not-an-email' } }), res);
  eq('a malformed address is rejected', res.statusCode, 400);

  res = makeRes();
  await auth(makeReq({ method: 'GET', query: { fn: 'request' } }), res);
  eq('request refuses GET', res.statusCode, 405);

  // ===== rate limiting =====
  // Two requests for owner@ have already been counted above; the limit is 3 per hour.
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' } }), res);
  eq('the third link inside the window still sends', res.statusCode, 200);
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' } }), res);
  eq('the fourth is rate limited', res.statusCode, 429);
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'nobody@example.com' } }), res);
  eq('the per-address limit does not leak onto a different address', res.statusCode, 200);

  // ===== verify page =====
  res = makeRes();
  await auth(makeReq({ query: { fn: 'verify', token } }), res);
  eq('a valid link renders the confirm page', res.statusCode, 200);
  truthy('the confirm page is HTML', /text\/html/.test(res.getHeader('content-type')));
  truthy('the confirm page posts rather than linking, so scanners cannot burn the token',
    /<form method="POST"/.test(res.payload));
  truthy('the confirm page carries the token forward', res.payload.includes(token));
  eq('merely opening the link sets no cookies', cookiesOf(res).length, 0);
  truthy('the confirm page is not cached', /no-store/.test(res.getHeader('cache-control')));
  truthy('the confirm page leaks no referrer', res.getHeader('referrer-policy') === 'no-referrer');
  truthy('the confirm page asks not to be indexed', /noindex/.test(res.getHeader('x-robots-tag')));
  eq('the confirm page cannot be framed', res.getHeader('x-frame-options'), 'DENY');

  const expired = sign({ k: 'login', cus: 'cus_owner', jti: 'j1', exp: nowSec() - 5 }, SECRET);
  res = makeRes();
  await auth(makeReq({ query: { fn: 'verify', token: expired } }), res);
  eq('an expired link is refused at the page', res.statusCode, 400);

  const forged = sign({ k: 'login', cus: 'cus_owner', jti: 'j2', exp: nowSec() + 600 }, 'wrong-secret');
  res = makeRes();
  await auth(makeReq({ query: { fn: 'verify', token: forged } }), res);
  eq('a token signed with the wrong secret is refused', res.statusCode, 400);

  const wrongKind = sign({ k: 'other', cus: 'cus_owner', jti: 'j3', exp: nowSec() + 600 }, SECRET);
  res = makeRes();
  await auth(makeReq({ query: { fn: 'verify', token: wrongKind } }), res);
  eq('a correctly signed token of another kind is refused', res.statusCode, 400);

  // ===== consume: the form path =====
  res = makeRes();
  await auth(makeReq({
    method: 'POST', query: { fn: 'consume' }, body: { token },
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
  }), res);
  eq('consuming a link redirects', res.statusCode, 303);
  eq('a course owner lands on the course', res.getHeader('location'), '/learn.html?restored=1');
  const ent = cookieNamed(res, 'scere_ent');
  const cus = cookieNamed(res, 'scere_cus');
  truthy('the entitlement cookie is issued', ent);
  truthy('the identity cookie is issued', cus);
  truthy('cookies are HttpOnly', ent.includes('HttpOnly') && cus.includes('HttpOnly'));
  truthy('cookies are Secure', ent.includes('Secure') && cus.includes('Secure'));
  truthy('cookies are SameSite=Lax', ent.includes('SameSite=Lax'));

  // ===== single use =====
  res = makeRes();
  await auth(makeReq({
    method: 'POST', query: { fn: 'consume' }, body: { token },
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
  }), res);
  eq('the same link cannot be used twice', res.statusCode, 400);
  eq('a replayed link sets no cookies', cookiesOf(res).length, 0);
  truthy('the replay message says what to do next', /already been used/i.test(res.payload));

  // ===== consume: the JSON path =====
  sent.length = 0;
  kv.clear();
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'ideas@example.com' } }), res);
  const idsToken = decodeURIComponent(new URL(/https:\/\/[^\s"<]+/.exec(sent[0].body.text)[0]).searchParams.get('token'));
  res = makeRes();
  await auth(makeReq({
    method: 'POST', query: { fn: 'consume' }, body: { token: idsToken },
    headers: { 'content-type': 'application/json', accept: 'application/json' },
  }), res);
  eq('a fetch client gets JSON rather than a redirect', res.statusCode, 200);
  eq('an ideas-only subscriber is sent to the research page', res.payload.redirect, '/research.html');
  eq('the JSON answer reports course ownership honestly', res.payload.ownsCourse, false);
  truthy('the JSON answer reports the active subscription', res.payload.ideasActive);

  // ===== entitlement withdrawn between sending and following =====
  kv.clear();
  sent.length = 0;
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' } }), res);
  const staleToken = decodeURIComponent(new URL(/https:\/\/[^\s"<]+/.exec(sent[0].body.text)[0]).searchParams.get('token'));
  stripeState = { cus_owner: {}, cus_ideas: { ideas: true } };   // refunded in the meantime
  res = makeRes();
  await auth(makeReq({
    method: 'POST', query: { fn: 'consume' }, body: { token: staleToken },
    headers: { 'content-type': 'application/json', accept: 'application/json' },
  }), res);
  eq('a link for an account that no longer holds anything is refused', res.statusCode, 400);
  eq('and it sets no cookies', cookiesOf(res).length, 0);
  stripeState = { cus_owner: { course: true }, cus_ideas: { ideas: true } };

  // ===== a Stripe outage must not send a link that cannot work =====
  kv.clear();
  sent.length = 0;
  stripeDown = true;
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' } }), res);
  eq('a Stripe outage still answers neutrally', res.statusCode, 200);
  eq('and sends nothing it cannot stand behind', sent.length, 0);
  stripeDown = false;

  // ===== a person following a link is never shown raw JSON =====
  kv.clear();
  sent.length = 0;
  res = makeRes();
  await auth(makeReq({ method: 'POST', query: { fn: 'request' }, body: { email: 'owner@example.com' } }), res);
  const humanToken = decodeURIComponent(new URL(/https:\/\/[^\s"<]+/.exec(sent[0].body.text)[0]).searchParams.get('token'));
  stripeDown = true;
  res = makeRes();
  await auth(makeReq({
    method: 'POST', query: { fn: 'consume' }, body: { token: humanToken },
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
  }), res);
  truthy('a failure mid-consume answers in HTML, not a JSON blob',
    /text\/html/.test(res.getHeader('content-type') || ''), res.getHeader('content-type'));
  truthy('and it tells the person what to do next', /fresh link/i.test(String(res.payload)));
  stripeDown = false;

  // ===== the endpoint this replaced =====
  const { billing } = loadHandlers();
  res = makeRes();
  await billing(makeReq({ method: 'POST', query: { fn: 'restore' }, body: { email: 'owner@example.com' } }), res);
  eq('the old unauthenticated restore endpoint is gone', res.statusCode, 410);
  eq('and it sets no cookies', cookiesOf(res).length, 0);
  eq('and it points callers at the replacement', res.payload.use, '/api/auth?fn=request');

  server.close();

  // ---- report ----
  console.log(`\n${passed} assertions passed`);
  if (failures.length) {
    console.error(`${failures.length} FAILED:`);
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log('auth suite green');
}

main().catch((err) => { console.error(err); process.exit(1); });
