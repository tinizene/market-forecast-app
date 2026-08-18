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
//   fn=restore         → REMOVED (was unauthenticated); see api/auth.js for recovery
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

const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', KES: 'KSh', ZAR: 'R' };

function formatMoney(minorUnits, currency, interval) {
  const amount = minorUnits / 100;
  const cur = (currency || 'usd').toUpperCase();
  const sym = SYMBOLS[cur] || `${cur} `;
  const nice = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  if (!interval) return `${sym}${nice}`;
  const per = interval === 'month' ? 'mo' : interval === 'year' ? 'yr' : interval;
  return `${sym}${nice}/${per}`;
}

// Handles both shapes: a recurring price reads "€70/mo", a one-time price reads
// "€200" with no interval — writing "/mo" on a product you buy once would be a lie.
function formatPrice(price) {
  if (!price || price.unit_amount == null) return null;
  const interval = price.recurring ? (price.recurring.interval || 'month') : null;
  return { label: formatMoney(price.unit_amount, price.currency, interval), interval };
}

// A missing price is a configuration state, not an error: the UI simply does not
// offer that product. A price that fails to load is treated the same way, so a Stripe
// blip cannot produce a buy button with no price on it.
async function describeProduct(id) {
  const none = { available: false, priceLabel: null, interval: null, amount: null, currency: null, product: null };
  if (!id) return none;
  try {
    const price = await stripeRequest('GET', `/v1/prices/${id}`);
    const f = formatPrice(price);
    if (!f) return none;
    return {
      available: true,
      priceLabel: f.label,
      interval: f.interval,
      // Kept so a promotion code can be previewed against this price without a
      // second round trip.
      amount: price.unit_amount,
      currency: price.currency,
      product: typeof price.product === 'string' ? price.product : (price.product && price.product.id) || null,
    };
  } catch (e) {
    console.error('price fetch failed:', e.message);
    return none;
  }
}

// ---- promotion codes ------------------------------------------------------
//
// Codes can be typed on Stripe's page (allow_promotion_codes), but a campaign link
// that arrives with the discount already applied converts far better than asking
// someone to remember and retype one. Resolving the code here lets the site show the
// real discounted price BEFORE checkout, rather than making it a surprise on Stripe's
// page — and lets us say plainly when a code is expired or does not apply.

const CODE_RE = /^[A-Za-z0-9_-]{1,64}$/;

async function resolvePromotionCode(raw) {
  const code = String(raw || '').trim();
  if (!code || !CODE_RE.test(code)) return null;
  const find = async (c) => {
    const list = await stripeRequest('GET', '/v1/promotion_codes', { code: c, active: 'true', limit: 1 });
    return (list && list.data && list.data[0]) || null;
  };
  try {
    // Stripe stores codes uppercased unless the operator forced a case, and the list
    // filter is an exact match — so try what the link said, then the uppercased form.
    let pc = await find(code);
    if (!pc && code !== code.toUpperCase()) pc = await find(code.toUpperCase());
    if (!pc || !pc.coupon || pc.coupon.valid === false) return null;
    return pc;
  } catch (e) {
    console.error('promotion code lookup failed:', e.message);
    return null;
  }
}

// What this coupon does to one specific price. Returns null when it does not apply,
// which is a normal answer — a course-only code simply has nothing to say about the
// subscription.
function previewDiscount(pc, prod) {
  if (!pc || !prod || !prod.available || prod.amount == null) return null;
  const coupon = pc.coupon || {};
  const restrictions = pc.restrictions || {};

  // A coupon may be restricted to particular products.
  const only = coupon.applies_to && Array.isArray(coupon.applies_to.products) ? coupon.applies_to.products : null;
  if (only && only.length && (!prod.product || only.indexOf(prod.product) === -1)) return null;

  // …and to a minimum order value.
  if (restrictions.minimum_amount != null) {
    const mc = restrictions.minimum_amount_currency;
    if ((!mc || mc === prod.currency) && prod.amount < restrictions.minimum_amount) return null;
  }

  let discounted;
  if (coupon.percent_off) {
    discounted = Math.round((prod.amount * (100 - coupon.percent_off)) / 100);
  } else if (coupon.amount_off != null) {
    // A fixed-amount coupon in another currency cannot apply to this price.
    if (coupon.currency && coupon.currency !== prod.currency) return null;
    discounted = Math.max(0, prod.amount - coupon.amount_off);
  } else {
    return null;
  }

  return {
    label: formatMoney(discounted, prod.currency, prod.interval),
    wasLabel: prod.priceLabel,
    free: discounted === 0,
    // Stripe is the authority at checkout — per-customer limits like
    // first_time_transaction cannot be evaluated from here — so this is a preview,
    // and createCheckout falls back gracefully if Stripe disagrees.
    firstTimeOnly: !!restrictions.first_time_transaction,
  };
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

      // A ?code= on the landing URL is previewed here so the page can show the real
      // discounted price on the button. An unknown or expired code is reported as
      // such rather than silently ignored — silently dropping it is how someone pays
      // full price believing their code was applied.
      const rawCode = (req.query && req.query.code) || '';
      let promo = null;
      if (rawCode) {
        const pc = await resolvePromotionCode(rawCode);
        promo = pc
          ? {
            code: pc.code,
            valid: true,
            course: previewDiscount(pc, course),
            ideas: previewDiscount(pc, ideas),
          }
          : { code: String(rawCode).slice(0, 64), valid: false, course: null, ideas: null };
      }

      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({
        configured: true,
        course,
        ideas,
        promo,
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

      // A code carried in from a campaign link is applied up front, so the buyer sees
      // the discounted total on Stripe's page without typing anything. `discounts` and
      // `allow_promotion_codes` are mutually exclusive, so one replaces the other.
      let codeApplied = null;
      if (body.code) {
        const pc = await resolvePromotionCode(body.code);
        if (pc) {
          params.discounts = [{ promotion_code: pc.id }];
          delete params.allow_promotion_codes;
          codeApplied = pc.code;
        }
      }
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

      let session;
      try {
        session = await stripeRequest('POST', '/v1/checkout/sessions', params);
      } catch (err) {
        // Stripe is the authority on whether a code may be used — per-customer limits
        // and redemption caps cannot be evaluated up front. If it refuses the code, go
        // through WITHOUT it rather than failing: a bad discount code must never be
        // the reason someone cannot buy. They can still type a different one on the
        // Stripe page.
        if (!params.discounts) throw err;
        console.error('promotion code rejected, retrying without it:', err.message);
        delete params.discounts;
        params.allow_promotion_codes = 'true';
        codeApplied = null;
        session = await stripeRequest('POST', '/v1/checkout/sessions', params);
      }
      res.status(200).json({ url: session.url, product, codeApplied });
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

    // ---- restore: REMOVED, and kept here as a stub on purpose ----
    //
    // This used to re-issue full entitlement to anyone who posted a customer's email
    // address, with no verification of any kind: knowing a buyer's email was enough
    // to be granted their EUR 200 course and their ideas subscription. Its
    // 404-vs-200 responses also confirmed which addresses had bought.
    //
    // It is answered explicitly rather than deleted because a cached copy of the old
    // client will keep calling it, and that client must be told to send the visitor
    // somewhere real instead of failing with "unknown fn".
    if (fn === 'restore') {
      res.status(410).json({
        error: 'restore_removed',
        use: '/api/auth?fn=request',
        message: 'Restoring access now works by emailing you a sign-in link.',
      });
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
