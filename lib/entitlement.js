// Shared subscription/entitlement helpers for the Research Desk paywall.
//
// Design goals, matching the rest of this repo:
//   • Zero npm dependencies — Stripe is called over its plain REST API with
//     fetch(), exactly like markets-hub.js calls Alpha Vantage. No `stripe`
//     package, no build step.
//   • Secrets live in Vercel env vars, never in client code.
//   • FAIL SAFE, NOT FAIL OPEN in the wrong direction: when the paywall is not
//     configured (no Stripe keys), enforcement is OFF and the app behaves like
//     the pre-paywall site (fully open) — so deploying this code changes nothing
//     for users until the operator sets the env vars and turns it on.
//
// Entitlement model (no database):
//   • Two products are sold, and they are gained and lost independently:
//       the course — one payment (€200), access forever
//       the ideas  — included for 90 days with the course, €70/month thereafter
//   • On successful Checkout we set two signed, HttpOnly cookies:
//       scere_ent = { course, cAt, iUntil, iSrc, sub, exp }
//                   exp is a RE-DERIVATION HORIZON, not the entitlement's lifetime
//       scere_cus = { cus }              long-lived identity (≈400 days)
//   • While scere_ent is unexpired it answers directly. Once it expires — or a
//     webhook flags the customer — scere_cus is used to re-derive both facts from
//     Stripe and re-issue the cookie. That gives seamless renewals, revocation on
//     cancel, and refund handling, with no store.

const crypto = require('crypto');

const ENT_COOKIE = 'scere_ent';
const CUS_COOKIE = 'scere_cus';
const CUS_MAX_AGE = 400 * 24 * 60 * 60; // ~400 days, the browser cookie ceiling.

function secret() {
  return process.env.ENTITLEMENT_SECRET || '';
}

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

// Two products, two prices. The course is a one-time payment; the ideas are a
// monthly subscription. STRIPE_PRICE_ID is the name the single-product version
// used, so it is still honoured as the ideas price — an existing deployment keeps
// working without touching its env vars.
function coursePriceId() {
  return process.env.STRIPE_COURSE_PRICE_ID || '';
}

function ideasPriceId() {
  return process.env.STRIPE_IDEAS_PRICE_ID || process.env.STRIPE_PRICE_ID || '';
}

function priceId() {
  return ideasPriceId();
}

// The paywall only enforces when it is configured. Missing the key or the signing
// secret => enforcement off, site fully open (no regression on deploy). ONE price is
// enough to enforce: an operator selling only the course should still have the course
// locked, and api/billing reports per-product availability so the UI never offers a
// buy button for a product that has no price behind it.
function paywallActive() {
  return Boolean(stripeKey() && secret() && (coursePriceId() || ideasPriceId()));
}

// ---- signed tokens (HMAC-SHA256 over a compact JSON payload) ----

function signToken(payloadObj) {
  const body = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !secret()) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  // Constant-time compare; guard against length mismatch throwing.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ---- cookies ----

function parseCookies(req) {
  if (req.cookies) return req.cookies; // Vercel populates this for Node functions.
  const header = req.headers && req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function appendCookie(res, name, value, maxAgeSec) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  const prev = res.getHeader('Set-Cookie');
  const cookie = parts.join('; ');
  if (!prev) res.setHeader('Set-Cookie', cookie);
  else res.setHeader('Set-Cookie', Array.isArray(prev) ? prev.concat(cookie) : [prev, cookie]);
}

function clearCookie(res, name) {
  appendCookie(res, name, 'deleted', 0);
}

// ---- Stripe REST (form-encoded, Bearer secret key) ----

function encodeForm(obj, prefix, pairs) {
  pairs = pairs || [];
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      encodeForm(val, fullKey, pairs);
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (item && typeof item === 'object') encodeForm(item, `${fullKey}[${i}]`, pairs);
        else pairs.push([`${fullKey}[${i}]`, String(item)]);
      });
    } else {
      pairs.push([fullKey, String(val)]);
    }
  });
  return pairs;
}

async function stripeRequest(method, path, formObj) {
  const key = stripeKey();
  if (!key) throw new Error('stripe_not_configured');
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  let url = `https://api.stripe.com${path}`;
  if (formObj && method === 'GET') {
    const qs = new URLSearchParams(encodeForm(formObj)).toString();
    if (qs) url += (path.includes('?') ? '&' : '?') + qs;
  } else if (formObj) {
    opts.body = new URLSearchParams(encodeForm(formObj)).toString();
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error && data.error.message) || `stripe_${res.status}`);
    err.statusCode = res.status;
    err.stripe = data.error || null;
    throw err;
  }
  return data;
}

// ---- optional KV denylist (Vercel KV / Upstash Redis over REST) ----
//
// Enables INSTANT revocation: the Stripe webhook writes revoked:<customerId>
// here on cancellation / payment failure, and checkEntitlement consults it even
// when the entitlement cookie is still valid. Entirely optional — with no KV
// configured, revocation falls back to cookie-expiry + Stripe re-check.

const REVOKE_TTL = 40 * 24 * 60 * 60; // longer than any monthly billing cycle

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && token ? { url, token } : null;
}

function storeConfigured() {
  return Boolean(kvConfig());
}

// Run a Redis command via the Upstash-compatible REST API (Vercel KV speaks it).
async function kvCommand(args) {
  const c = kvConfig();
  if (!c) return null;
  const res = await fetch(c.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`kv_${res.status}`);
  const data = await res.json().catch(() => ({}));
  return data.result;
}

const revokedKey = (cus) => `revoked:${cus}`;

async function markRevoked(customerId) {
  if (!customerId || !storeConfigured()) return;
  await kvCommand(['SET', revokedKey(customerId), '1', 'EX', String(REVOKE_TTL)]);
}

async function clearRevoked(customerId) {
  if (!customerId || !storeConfigured()) return;
  await kvCommand(['DEL', revokedKey(customerId)]);
}

async function isRevoked(customerId) {
  if (!customerId || !storeConfigured()) return false;
  try {
    return (await kvCommand(['GET', revokedKey(customerId)])) != null;
  } catch (e) {
    // If the store is briefly unreachable, don't lock out a paying subscriber.
    console.error('revocation lookup failed:', e.message);
    return false;
  }
}

// ---- Stripe webhook signature (best-effort) ----
// Verifies the Stripe-Signature header against the raw body. Returns true/false,
// or null when it cannot be checked (no secret, or raw body unavailable) — the
// webhook treats null as "unverified" and leans on the Stripe re-fetch instead.
function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSec) {
  if (!secret || !sigHeader || !rawBody || !rawBody.length) return null;
  const parts = {};
  String(sigHeader).split(',').forEach((kv) => {
    const i = kv.indexOf('=');
    if (i > -1) { const k = kv.slice(0, i).trim(); (parts[k] = parts[k] || []).push(kv.slice(i + 1).trim()); }
  });
  const t = parts.t && parts.t[0];
  const sigs = parts.v1 || [];
  if (!t || !sigs.length) return false;
  if (toleranceSec) {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(t, 10)) > toleranceSec) return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody.toString('utf8')}`).digest('hex');
  const eb = Buffer.from(expected);
  return sigs.some((s) => { const sb = Buffer.from(s); return sb.length === eb.length && crypto.timingSafeEqual(sb, eb); });
}

// ---- high-level entitlement check ----

// There are two products and they expire on completely different terms, so a single
// "entitled" boolean cannot express them:
//
//   the course — one payment, access forever
//   the ideas  — included for 90 days with the course, monthly by subscription after
//
// checkEntitlement therefore returns both facts separately, and callers gate on the
// one they mean: api/course.js reads ownsCourse, api/research.js reads ideasActive.
// Collapsing them back into one flag is exactly what would let a lapsed ideas
// subscription lock someone out of a course they own outright.
const IDEAS_INCLUDED_SECONDS = 90 * 24 * 60 * 60; // 90 days — a fixed span, so the expiry date is never ambiguous
const ENT_REFRESH_SECONDS = 30 * 24 * 60 * 60;    // how long a cookie is trusted before re-deriving from Stripe

function noAccess(active) {
  return { paywallActive: active, ownsCourse: false, ideasActive: false, ideasUntil: null, ideasSource: null };
}

// Fold a customer's Stripe history into the two facts. Course purchases are
// identified by metadata.product === 'course' on the Checkout Session, set when the
// session is created — cheaper and more robust than expanding line items to match a
// price ID that may change.
// A refunded course purchase must stop granting access. Stripe leaves the session's
// payment_status at 'paid' after a refund, so the session alone cannot tell us — we
// have to ask what was refunded against its PaymentIntent. Only a FULL refund undoes
// the sale; a partial one (a goodwill adjustment, a tax correction) leaves the course
// owned, which is almost certainly what both sides intended.
async function courseSessionRefunded(session) {
  const pi = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : (session.payment_intent && session.payment_intent.id);
  // A no-cost order (100%-off promotion code) has no PaymentIntent and nothing to
  // refund, so there is never anything here to revoke.
  if (!pi || session.amount_total == null || session.amount_total === 0) return false;
  try {
    const refunds = await stripeRequest('GET', '/v1/refunds', { payment_intent: pi, limit: 10 });
    const refunded = ((refunds && refunds.data) || [])
      .filter((r) => r.status === 'succeeded' || r.status === 'pending')
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    return refunded >= session.amount_total;
  } catch (e) {
    // A lookup failure must never cost a paying customer the course they bought.
    console.error('refund lookup failed:', e.message);
    return false;
  }
}

async function deriveFromStripe(customerId) {
  const now = Math.floor(Date.now() / 1000);
  let courseAt = null;

  const sessions = await stripeRequest('GET', '/v1/checkout/sessions', { customer: customerId, limit: 100 });
  // Oldest first: the included-ideas window runs from the FIRST purchase, so buying
  // twice cannot quietly extend it. A fully refunded purchase is skipped, and a later
  // un-refunded one can still establish ownership.
  // 'no_payment_required' is what Stripe sets when the total comes to zero — which is
  // exactly what a 100%-off promotion code produces. Matching only 'paid' would let
  // someone redeem a full-discount code, complete Checkout, and be granted nothing,
  // with no error anywhere to explain it.
  const PAID_STATUSES = ['paid', 'no_payment_required'];
  const courseSessions = ((sessions && sessions.data) || [])
    .filter((s) => s.metadata && s.metadata.product === 'course' && PAID_STATUSES.indexOf(s.payment_status) > -1)
    .sort((a, b) => (a.created || 0) - (b.created || 0));
  for (const s of courseSessions) {
    if (await courseSessionRefunded(s)) continue;
    courseAt = s.created;
    break;
  }

  let subEnd = null;
  let subId = null;
  const subs = await stripeRequest('GET', '/v1/subscriptions', { customer: customerId, status: 'active', limit: 1 });
  const sub = subs && subs.data && subs.data[0];
  if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
    subEnd = sub.current_period_end;
    subId = sub.id;
  }

  const includedUntil = courseAt != null ? courseAt + IDEAS_INCLUDED_SECONDS : null;
  const ideasUntil = Math.max(includedUntil || 0, subEnd || 0) || null;
  const ideasActive = !!ideasUntil && ideasUntil > now;
  // Which of the two is actually granting access right now — the UI says so, and it
  // is what tells someone whether their included window is about to run out.
  const ideasSource = !ideasActive ? null : ((subEnd || 0) >= (includedUntil || 0) ? 'subscription' : 'included');

  return { ownsCourse: courseAt != null, courseAt, ideasUntil, ideasActive, ideasSource, subId };
}

async function checkEntitlement(req, res) {
  if (!paywallActive()) return noAccess(false);
  const cookies = parseCookies(req);

  const ent = verifyToken(cookies[ENT_COOKIE]);
  const cus = verifyToken(cookies[CUS_COOKIE]);
  const now = Math.floor(Date.now() / 1000);

  if (ent && ent.exp && ent.exp > now) {
    // Valid cookie — but a webhook may have flagged this customer since it was issued
    // (cancellation, payment failure, refund, chargeback). That flag no longer means
    // "this person has nothing": cancelling a €70/month ideas subscription must not
    // take away a €200 course bought outright. So a flag means the COOKIE IS STALE —
    // fall through and re-derive both facts from Stripe, which is authoritative and
    // will correctly return ownsCourse: true, ideasActive: false.
    const stale = !!(cus && cus.cus && (await isRevoked(cus.cus)));
    if (!stale) {
      // A cookie issued before the two-product split carries only {sub, exp}: a
      // subscriber with no course. Honour it as ideas-until-exp so existing
      // subscribers are not logged out by the upgrade; it re-derives at the next
      // refresh.
      if (ent.course === undefined) {
        return { paywallActive: true, ownsCourse: false, ideasActive: true, ideasUntil: ent.exp, ideasSource: 'subscription' };
      }
      return {
        paywallActive: true,
        ownsCourse: !!ent.course,
        ideasActive: !!ent.iUntil && ent.iUntil > now,
        ideasUntil: ent.iUntil || null,
        ideasSource: ent.iSrc || null,
      };
    }
  }

  if (cus && cus.cus) {
    try {
      const derived = await deriveFromStripe(cus.cus);
      if (derived.ownsCourse || derived.ideasActive) {
        await clearRevoked(cus.cus); // the flag has been acted on; the cookie is fresh again
        issueEntitlement(res, derived, cus.cus);
        return {
          paywallActive: true,
          ownsCourse: derived.ownsCourse,
          ideasActive: derived.ideasActive,
          ideasUntil: derived.ideasUntil,
          ideasSource: derived.ideasSource,
        };
      }
      // Stripe answered and this customer holds neither product. Only now is it safe
      // to drop the cookies — doing it on a failed lookup would sign out a paying
      // customer over a transient error.
      clearCookie(res, ENT_COOKIE);
      clearCookie(res, CUS_COOKIE);
      return Object.assign(noAccess(true), { revoked: true });
    } catch (e) {
      // On a Stripe outage, fail closed (no access) rather than open — but leave the
      // cookies in place so access returns by itself once Stripe does.
      console.error('entitlement re-check failed:', e.message);
    }
  }
  return noAccess(true);
}

// Write the entitlement cookie from a derived state.
//
// The cookie's lifetime is a RE-DERIVATION HORIZON, not the entitlement's lifetime.
// Course ownership is perpetual, but we still re-check Stripe periodically so a
// refund eventually takes effect even if its webhook was missed. Perpetual access
// therefore depends on the customer cookie surviving — which is precisely why phase 5
// adds email recovery, since a cleared cookie must not cost someone a course they own.
function issueEntitlement(res, derived, customerId) {
  const now = Math.floor(Date.now() / 1000);
  appendCookie(res, ENT_COOKIE, signToken({
    course: derived.ownsCourse ? 1 : 0,
    cAt: derived.courseAt || null,
    iUntil: derived.ideasUntil || null,
    iSrc: derived.ideasSource || null,
    sub: derived.subId || null,
    exp: now + ENT_REFRESH_SECONDS,
  }), ENT_REFRESH_SECONDS);
  if (customerId) appendCookie(res, CUS_COOKIE, signToken({ cus: customerId }), CUS_MAX_AGE);
}

module.exports = {
  ENT_COOKIE,
  CUS_COOKIE,
  paywallActive,
  priceId,
  coursePriceId,
  ideasPriceId,
  signToken,
  verifyToken,
  parseCookies,
  appendCookie,
  clearCookie,
  stripeRequest,
  checkEntitlement,
  issueEntitlement,
  deriveFromStripe,
  IDEAS_INCLUDED_SECONDS,
  storeConfigured,
  markRevoked,
  clearRevoked,
  isRevoked,
  verifyStripeSignature,
};
