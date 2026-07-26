// Stripe subscription billing for the Research Desk paywall. Plain Stripe REST
// via fetch (see lib/entitlement.js) — no `stripe` npm package, no build step.
//
//   fn=config          → { configured, priceLabel, interval, entitled }   (GET, public)
//   fn=createCheckout  → { url } to a Stripe Checkout Session (subscription) (POST)
//   fn=activate        → verify a completed Checkout session, set cookies     (POST {session_id})
//   fn=status          → { entitled, paywallActive }                          (GET)
//   fn=restore         → re-issue entitlement from a subscriber email         (POST {email})
//   fn=logout          → clear entitlement cookies                            (POST)
//
// Renewals & cancellations need no webhook: the entitlement cookie is short
// (= subscription period end); an identity cookie lets status re-check Stripe
// and silently re-issue or drop access. See lib/entitlement.js.

const {
  paywallActive, priceId, stripeRequest,
  checkEntitlement, issueEntitlement, clearCookie,
  ENT_COOKIE, CUS_COOKIE,
} = require('../lib/entitlement.js');

function originOf(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return req.headers.origin || `${proto}://${host}`;
}

function formatPrice(price) {
  if (!price || price.unit_amount == null) return null;
  const amount = price.unit_amount / 100;
  const cur = (price.currency || 'usd').toUpperCase();
  const symbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', KES: 'KSh', ZAR: 'R' };
  const sym = symbols[cur] || `${cur} `;
  const nice = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  const interval = price.recurring && price.recurring.interval ? price.recurring.interval : 'month';
  const per = interval === 'month' ? 'mo' : interval === 'year' ? 'yr' : interval;
  return { label: `${sym}${nice}/${per}`, interval };
}

module.exports = async function handler(req, res) {
  const fn = req.query.fn;
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    // ---- config: what the client needs to render the subscribe UI ----
    if (fn === 'config') {
      if (!paywallActive()) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.status(200).json({ configured: false, entitled: false });
        return;
      }
      let priceLabel = null, interval = 'month';
      try {
        const price = await stripeRequest('GET', `/v1/prices/${priceId()}`);
        const f = formatPrice(price);
        if (f) { priceLabel = f.label; interval = f.interval; }
      } catch (e) {
        console.error('price fetch failed:', e.message);
      }
      const { entitled } = await checkEntitlement(req, res);
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({ configured: true, priceLabel, interval, entitled });
      return;
    }

    // ---- status: is this visitor entitled right now? ----
    if (fn === 'status') {
      const { entitled, paywallActive: active } = await checkEntitlement(req, res);
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({ entitled, paywallActive: active });
      return;
    }

    // ---- createCheckout: start a subscription ----
    if (fn === 'createCheckout') {
      if (!paywallActive()) { res.status(200).json({ configured: false }); return; }
      const origin = originOf(req);
      const session = await stripeRequest('POST', '/v1/checkout/sessions', {
        mode: 'subscription',
        'line_items': [{ price: priceId(), quantity: 1 }],
        success_url: `${origin}/research.html?sub=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/research.html?sub=cancel`,
        allow_promotion_codes: 'true',
        billing_address_collection: 'auto',
      });
      res.status(200).json({ url: session.url });
      return;
    }

    // ---- activate: verify a completed checkout, set entitlement ----
    if (fn === 'activate') {
      if (!paywallActive()) { res.status(200).json({ entitled: false, configured: false }); return; }
      const sessionId = body.session_id || req.query.session_id;
      if (!sessionId) { res.status(400).json({ error: 'missing_session_id' }); return; }
      const session = await stripeRequest('GET', `/v1/checkout/sessions/${sessionId}`, { 'expand': ['subscription'] });
      const sub = session.subscription;
      const active = sub && (sub.status === 'active' || sub.status === 'trialing');
      if (session.status === 'complete' && active) {
        issueEntitlement(res, sub.id, sub.current_period_end, session.customer);
        res.status(200).json({ entitled: true });
      } else {
        res.status(402).json({ entitled: false, error: 'not_active' });
      }
      return;
    }

    // ---- restore: re-issue entitlement from a subscriber email ----
    if (fn === 'restore') {
      if (!paywallActive()) { res.status(200).json({ entitled: false, configured: false }); return; }
      const email = (body.email || '').trim().toLowerCase();
      if (!email) { res.status(400).json({ error: 'missing_email' }); return; }
      const customers = await stripeRequest('GET', '/v1/customers', { email, limit: 1 });
      const customer = customers && customers.data && customers.data[0];
      if (!customer) { res.status(404).json({ entitled: false, error: 'no_customer' }); return; }
      const subs = await stripeRequest('GET', '/v1/subscriptions', { customer: customer.id, status: 'active', limit: 1 });
      const sub = subs && subs.data && subs.data[0];
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        issueEntitlement(res, sub.id, sub.current_period_end, customer.id);
        res.status(200).json({ entitled: true });
      } else {
        res.status(404).json({ entitled: false, error: 'no_subscription' });
      }
      return;
    }

    // ---- logout: clear cookies ----
    if (fn === 'logout') {
      clearCookie(res, ENT_COOKIE);
      clearCookie(res, CUS_COOKIE);
      res.status(200).json({ entitled: false });
      return;
    }

    res.status(400).json({ error: 'Unknown or missing fn query parameter' });
  } catch (err) {
    console.error('billing api failed:', err.message);
    const code = err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? 400 : 502;
    res.status(code).json({ error: 'billing_error', message: 'Payment service error. Please try again.' });
  }
};
