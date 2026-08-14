// Stripe webhook — prompt re-derivation.
//
// On subscription, payment and refund events, this looks up the CURRENT status from
// Stripe (authoritative — a forged payload can't grant or wrongly revoke access) and
// writes/removes a KV flag that checkEntitlement() honours on every request.
//
// The flag means "this customer's cookie is stale, re-derive from Stripe", NOT "this
// customer has nothing" — cancelling the €70/month ideas subscription must leave a
// €200 course untouched. lib/entitlement.js is where that distinction is enforced.
//
// Register this URL in the Stripe Dashboard:
//
//   https://<your-domain>/api/stripe-webhook
//   Events: customer.subscription.updated, customer.subscription.deleted,
//           invoice.payment_failed, invoice.paid,
//           charge.refunded, charge.dispute.created
//
// Env: STRIPE_WEBHOOK_SECRET (signature check, recommended) and a KV store
// (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN) for the denylist.
// Without a KV store the endpoint still 200s but cannot record revocations.

const {
  paywallActive, stripeRequest, storeConfigured,
  markRevoked, clearRevoked, verifyStripeSignature,
} = require('../lib/entitlement.js');

// Raw body for signature verification. On Vercel the body may already be parsed;
// when the stream yields nothing we skip the signature and rely on the Stripe
// re-fetch below for authority.
async function getRawBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    if (chunks.length) return Buffer.concat(chunks);
  } catch (e) { /* fall through */ }
  return null;
}

function parseEvent(rawBody, reqBody) {
  if (rawBody && rawBody.length) {
    try { return JSON.parse(rawBody.toString('utf8')); } catch (e) { /* fall through */ }
  }
  return reqBody && typeof reqBody === 'object' ? reqBody : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  if (!paywallActive()) { res.status(200).json({ ok: true, note: 'paywall inactive' }); return; }

  const rawBody = await getRawBody(req);
  const event = parseEvent(rawBody, req.body);
  if (!event || !event.type) { res.status(400).json({ error: 'invalid_payload' }); return; }

  // Signature check when we have both a secret and a real raw body. If it can't
  // be verified (parsed body only) we proceed — the Stripe re-fetch is the real
  // guard, so a forged event can never grant access, only trigger a re-check.
  const verdict = verifyStripeSignature(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET, 300);
  if (verdict === false) { res.status(400).json({ error: 'bad_signature' }); return; }

  try {
    const obj = (event.data && event.data.object) || {};
    const type = event.type;
    const customerFromEvent = typeof obj.customer === 'string' ? obj.customer : (obj.customer && obj.customer.id);
    const subId = type.startsWith('customer.subscription')
      ? obj.id
      : (typeof obj.subscription === 'string' ? obj.subscription : (obj.subscription && obj.subscription.id));

    if (!storeConfigured()) { res.status(200).json({ received: true, note: 'no KV store — revocation not recorded' }); return; }

    // A refund or chargeback on the one-time course payment has no subscription to
    // look up. Flagging the customer is enough: the flag makes checkEntitlement
    // re-derive, and deriveFromStripe checks refunds against the course purchase, so
    // a fully refunded course stops granting access on the very next request.
    if (type === 'charge.refunded' || type === 'charge.dispute.created' || type === 'charge.refund.updated') {
      if (customerFromEvent) await markRevoked(customerFromEvent);
      res.status(200).json({ received: true });
      return;
    }

    if (subId) {
      // Authoritative: ask Stripe for the subscription's current status.
      const sub = await stripeRequest('GET', `/v1/subscriptions/${subId}`).catch(() => null);
      const active = sub && (sub.status === 'active' || sub.status === 'trialing');
      const customerId = (sub && (typeof sub.customer === 'string' ? sub.customer : sub.customer && sub.customer.id)) || customerFromEvent;
      if (customerId) {
        if (active) await clearRevoked(customerId);
        else await markRevoked(customerId);
      }
    } else if (type === 'customer.subscription.deleted' && customerFromEvent) {
      await markRevoked(customerFromEvent);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    // Transient (e.g. KV/Stripe hiccup) → 500 so Stripe retries the event.
    console.error('webhook processing failed:', err.message);
    res.status(500).json({ error: 'processing_failed' });
  }
};
