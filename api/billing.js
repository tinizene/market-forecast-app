// Stripe billing for the two products. Plain Stripe REST via fetch (see
// lib/entitlement.js) — no `stripe` npm package, no build step.
//
//   the course — one payment, access forever, and it includes 90 days of ideas
//   the ideas  — a monthly subscription, for after those 90 days (or on its own)
//
//   fn=config          → per-product availability + price labels + this visitor's state
//   fn=createCheckout  → { url } to a Checkout Session   (POST {product:'course'|'ideas'})
//   fn=activate        → verify a completed session, set cookies  (POST {session_id})
//   fn=status          → { ownsCourse, ideasActive, ideasUntil, ideasSource }   (GET)
//   fn=restore         → re-issue entitlement from a customer email  (POST {email})
//   fn=logout          → clear entitlement cookies                            (POST)
//
// Renewals & cancellations need no webhook: the entitlement cookie carries a
// re-derivation horizon, and an identity cookie lets any later request re-derive
// both facts from Stripe. See lib/entitlement.js.

const {
  paywallActive, coursePriceId, ideasPriceId, stripeRequest,
  checkEntitlement, issueEntitlement, deriveFromStripe, clearCookie,
  parseCookies, verifyToken, ENT_COOKIE, CUS_COOKIE,
} = require('../lib/entitlement.js');

// Where Stripe sends the buyer back to. Kept server-side and keyed by product rather
// than accepted from the client, so this can never become an open redirect.
const RETURN_PAGE = { course: '/learn.html', ideas: '/research.html' };
const RETURN_FLAG = { course: 'buy', ideas: 'sub' };

function originOf(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return req.headers.origin || `${proto}://${host}`;
}

// Handles both shapes: a recurring price reads "€70/mo", a one-time price reads
// "€200" with no interval — writing "/mo" on a product you buy once would be a lie.
function formatPrice(price) {
  if (!price || price.unit_amount == null) return null;
  const amount = price.unit_amount / 100;
  const cur = (price.currency || 'usd').toUpperCase();
  const symbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', KES: 'KSh', ZAR: 'R' };
  const sym = symbols[cur] || `${cur} `;
  const nice = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  if (!price.recurring) return { label: `${sym}${nice}`, interval: null };
  const interval = price.recurring.interval || 'month';
  const per = interval === 'month' ? 'mo' : interval === 'year' ? 'yr' : interval;
  return { label: `${sym}${nice}/${per}`, interval };
}

// A missing price is a configuration state, not an error: the UI simply does not
// offer that product. A price that fails to load is treated the same way, so a Stripe
// blip cannot produce a buy button with no price on it.
async function describeProduct(id) {
  if (!id) return { available: false, priceLabel: null, interval: null };
  try {
    const f = formatPrice(await stripeRequest('GET', `/v1/prices/${id}`));
    if (!f) return { available: false, priceLabel: null, interval: null };
    return { available: true, priceLabel: f.label, interval: f.interval };
  } catch (e) {
    console.error('price fetch failed:', e.message);
    return { available: false, priceLabel: null, interval: null };
  }
}

module.exports = async function handler(req, res) {
  const fn = req.query.fn;
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    // ---- config: everything the client needs to render both buy paths ----
    if (fn === 'config') {
      if (!paywallActive()) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.status(200).json({
          configured: false,
          entitled: false,
          course: { available: false, priceLabel: null, interval: null },
          ideas: { available: false, priceLabel: null, interval: null },
        });
        return;
      }
      const [course, ideas, ent] = await Promise.all([
        describeProduct(coursePriceId()),
        describeProduct(ideasPriceId()),
        checkEntitlement(req, res),
      ]);
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({
        configured: true,
        course,
        ideas,
        // priceLabel/interval at the top level remain the IDEAS price, which is what
        // the single-product client read. Kept so a stale cached client keeps working.
        priceLabel: ideas.priceLabel,
        interval: ideas.interval || 'month',
        entitled: ent.ideasActive,
        ownsCourse: ent.ownsCourse,
        ideasActive: ent.ideasActive,
        ideasUntil: ent.ideasUntil,
        ideasSource: ent.ideasSource,
      });
      return;
    }

    // ---- status: is this visitor entitled right now? ----
    if (fn === 'status') {
      // Both facts, separately — the two products are bought and lost independently.
      const ent = await checkEntitlement(req, res);
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({
        entitled: ent.ideasActive,
        ownsCourse: ent.ownsCourse,
        ideasActive: ent.ideasActive,
        ideasUntil: ent.ideasUntil,
        ideasSource: ent.ideasSource,
        paywallActive: ent.paywallActive,
      });
      return;
    }

    // ---- createCheckout: buy the course (one payment) or the ideas (monthly) ----
    if (fn === 'createCheckout') {
      if (!paywallActive()) { res.status(200).json({ configured: false }); return; }
      // Default to 'ideas' so a cached copy of the single-product client, which sends
      // no product at all, still reaches the subscription it was asking for.
      const product = body.product === 'course' ? 'course' : 'ideas';
      const price = product === 'course' ? coursePriceId() : ideasPriceId();
      if (!price) { res.status(409).json({ error: 'product_unavailable', product }); return; }

      const ent = await checkEntitlement(req, res);
      if (product === 'course' && ent.ownsCourse) {
        res.status(409).json({ error: 'already_owned', message: 'You already own the course.' });
        return;
      }
      if (product === 'ideas' && ent.ideasActive && ent.ideasSource === 'included') {
        // Selling a month of something they already have would be indefensible. The
        // date tells them exactly when subscribing starts to make sense.
        res.status(409).json({
          error: 'already_included',
          message: 'The daily ideas are already included with your course.',
          ideasUntil: ent.ideasUntil,
        });
        return;
      }
      if (product === 'ideas' && ent.ideasActive && ent.ideasSource === 'subscription') {
        res.status(409).json({ error: 'already_subscribed', message: 'Your ideas subscription is already active.' });
        return;
      }

      // Reuse the known Stripe customer when we have one. Without this, someone who
      // bought the course and subscribes three months later becomes a SECOND customer,
      // and deriveFromStripe — which reads one customer's history — would stop seeing
      // the course they own.
      const cus = verifyToken(parseCookies(req)[CUS_COOKIE]);
      const known = cus && cus.cus ? cus.cus : null;

      const origin = originOf(req);
      const page = RETURN_PAGE[product];
      const flag = RETURN_FLAG[product];
      const params = {
        mode: product === 'course' ? 'payment' : 'subscription',
        'line_items': [{ price, quantity: 1 }],
        success_url: `${origin}${page}?${flag}=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}${page}?${flag}=cancel`,
        allow_promotion_codes: 'true',
        billing_address_collection: 'auto',
        // This is the tag deriveFromStripe matches on to decide that someone owns the
        // course. Without it a completed payment grants nothing.
        metadata: { product },
      };
      if (known) {
        params.customer = known;
      } else if (product === 'course') {
        // In payment mode Stripe creates NO customer by default, which would leave
        // session.customer null and the purchase impossible to attribute or restore.
        params['customer_creation'] = 'always';
      }
      if (product === 'course') {
        params['payment_intent_data'] = { metadata: { product: 'course' } };
      }

      const session = await stripeRequest('POST', '/v1/checkout/sessions', params);
      res.status(200).json({ url: session.url, product });
      return;
    }

    // ---- activate: verify a completed checkout, set entitlement ----
    if (fn === 'activate') {
      if (!paywallActive()) { res.status(200).json({ entitled: false, configured: false }); return; }
      const sessionId = body.session_id || req.query.session_id;
      if (!sessionId) { res.status(400).json({ error: 'missing_session_id' }); return; }
      const session = await stripeRequest('GET', `/v1/checkout/sessions/${sessionId}`, { 'expand': ['subscription'] });
      // A completed session can be either product now, so re-derive the customer's
      // whole entitlement from Stripe instead of reading one subscription off this
      // session. That is also what makes a course purchase grant its included ideas.
      if (session.status !== 'complete' || !session.customer) {
        res.status(402).json({ entitled: false, error: 'not_complete' });
        return;
      }
      const derived = await deriveFromStripe(session.customer);
      if (derived.ownsCourse || derived.ideasActive) {
        issueEntitlement(res, derived, session.customer);
        res.status(200).json({ entitled: derived.ideasActive, ownsCourse: derived.ownsCourse, ideasUntil: derived.ideasUntil });
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
      // Course ownership counts as something to restore even with no live
      // subscription — that is the whole point of a product you own permanently.
      const derived = await deriveFromStripe(customer.id);
      if (derived.ownsCourse || derived.ideasActive) {
        issueEntitlement(res, derived, customer.id);
        res.status(200).json({ entitled: derived.ideasActive, ownsCourse: derived.ownsCourse, ideasUntil: derived.ideasUntil });
      } else {
        res.status(404).json({ entitled: false, error: 'nothing_to_restore' });
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
