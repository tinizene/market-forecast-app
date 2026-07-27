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
//   • On successful Checkout we set two signed, HttpOnly cookies:
//       scere_ent = { sub, exp }         short-lived, = subscription period end
//       scere_cus = { cus }              long-lived identity (≈400 days)
//   • A request is entitled if scere_ent is valid and unexpired. If scere_ent
//     has expired but scere_cus is present, we re-check Stripe for an active
//     subscription on that customer and, if found, silently re-issue scere_ent.
//     This gives seamless renewals AND revocation-on-cancel with no store.

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

function priceId() {
  return process.env.STRIPE_PRICE_ID || '';
}

// The paywall only enforces when it is fully configured. Missing any piece =>
// enforcement off, site fully open (no regression on deploy).
function paywallActive() {
  return Boolean(stripeKey() && priceId() && secret());
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

// Returns { entitled: bool }. Honours the KV revocation denylist for instant
// cancellation, then falls back to re-issuing scere_ent from scere_cus by
// re-checking Stripe (renewals + revocation without a store).
async function checkEntitlement(req, res) {
  if (!paywallActive()) return { entitled: false, paywallActive: false };
  const cookies = parseCookies(req);

  const ent = verifyToken(cookies[ENT_COOKIE]);
  const cus = verifyToken(cookies[CUS_COOKIE]);
  const now = Math.floor(Date.now() / 1000);

  if (ent && ent.exp && ent.exp > now) {
    // Valid cookie — but a webhook may have revoked this customer since it was
    // issued. That check is what makes cancellation take effect immediately.
    if (cus && cus.cus && (await isRevoked(cus.cus))) {
      clearCookie(res, ENT_COOKIE);
      clearCookie(res, CUS_COOKIE);
      return { entitled: false, paywallActive: true, revoked: true };
    }
    return { entitled: true, paywallActive: true };
  }

  if (cus && cus.cus) {
    try {
      const subs = await stripeRequest('GET', '/v1/subscriptions', { customer: cus.cus, status: 'active', limit: 1 });
      const sub = subs && subs.data && subs.data[0];
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        await clearRevoked(cus.cus); // self-heal any stale denylist entry
        issueEntitlement(res, sub.id, sub.current_period_end, cus.cus);
        return { entitled: true, paywallActive: true };
      }
    } catch (e) {
      // On a Stripe outage, fail closed (not entitled) rather than open.
      console.error('entitlement re-check failed:', e.message);
    }
  }
  return { entitled: false, paywallActive: true };
}

// Set the two entitlement cookies after a verified active subscription.
function issueEntitlement(res, subscriptionId, currentPeriodEnd, customerId) {
  const now = Math.floor(Date.now() / 1000);
  const exp = currentPeriodEnd && currentPeriodEnd > now ? currentPeriodEnd : now + 24 * 60 * 60;
  appendCookie(res, ENT_COOKIE, signToken({ sub: subscriptionId, exp }), Math.max(60, exp - now));
  if (customerId) appendCookie(res, CUS_COOKIE, signToken({ cus: customerId }), CUS_MAX_AGE);
}

module.exports = {
  ENT_COOKIE,
  CUS_COOKIE,
  paywallActive,
  priceId,
  signToken,
  verifyToken,
  parseCookies,
  appendCookie,
  clearCookie,
  stripeRequest,
  checkEntitlement,
  issueEntitlement,
  storeConfigured,
  markRevoked,
  clearRevoked,
  isRevoked,
  verifyStripeSignature,
};
