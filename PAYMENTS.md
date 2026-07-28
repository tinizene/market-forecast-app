# Payments — Research Desk subscription gate

The Research Desk's live trade theses are gated behind a **monthly Stripe
subscription**, enforced on the server. This doc covers what it is, how to turn
it on, and how it behaves.

> **Safe by default:** with no Stripe environment variables set, the paywall is
> **inactive** and the whole app behaves as if it were never added — the
> Research Desk and FX Intelligence Desk are fully open. Setting the three env
> vars below (and redeploying) is what turns enforcement on. Removing them turns
> it back off.

---

## What is gated

| Surface | Free (always) | Paid (subscription) |
| --- | --- | --- |
| **Research Desk** (`research.html`) | Regime headline, top idea, overall confidence, the full **track record** (wins / invalidations), each live idea's **headline + six-pillar score bars** | Entry, targets, stop/invalidation, per-pillar reasoning, confirmation criteria |
| **FX Intelligence Desk** (`fx-intelligence.html`) | — | The entire daily report |

The paid content is **withheld server-side** and never sent to an unsubscribed
browser — this is real enforcement, not CSS hiding. The raw data under
`/data/fx-reports/*` is blocked from direct public access by `middleware.js`;
the only way to it is through the gated `/api/research` endpoint.

---

## Turn it on (one-time setup)

### 1. Create the subscription in Stripe
- In the [Stripe Dashboard](https://dashboard.stripe.com/) create a **Product**
  with a **recurring monthly Price** (you choose the amount and currency).
- Copy the **Price ID** (looks like `price_1AbC...`).
- Copy your **Secret key** (`sk_live_...`, or `sk_test_...` to trial first) from
  Developers → API keys.

### 2. Set environment variables in Vercel
Project → **Settings → Environment Variables** (add to **Production**, and
Preview if you want to test there):

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | your `sk_live_...` (or `sk_test_...`) |
| `STRIPE_PRICE_ID` | the `price_...` from step 1 |
| `ENTITLEMENT_SECRET` | any long random string — e.g. `openssl rand -hex 32` |

All three must be present for the paywall to activate
(`paywallActive()` in `lib/entitlement.js`).

### 3. Redeploy
Vercel → Deployments → ⋯ → **Redeploy** (or push any commit). Enforcement is now
live: the Research Desk shows "Subscribe · $X/mo", Checkout runs, and access
unlocks on return.

### 4. (Recommended) Trial in test mode first
Use `sk_test_...` + a test-mode `price_...`, then subscribe with Stripe's
[test card](https://docs.stripe.com/testing) `4242 4242 4242 4242` (any future
expiry, any CVC). Confirm the theses unlock, then swap in the live keys.

### 5. (Optional but recommended) Instant revocation — webhook + KV

Without this, a cancellation or failed payment stops access at the end of the
paid period (up to one billing cycle of lag). Add a webhook + a small KV
denylist to make revocation **immediate**.

1. **Provision a KV store.** Vercel → **Storage → KV** (create a database and
   connect it to this project — it injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN`). [Upstash Redis](https://upstash.com/) works too, via
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
2. **Register the webhook** in Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://<your-domain>/api/stripe-webhook`
   - Events: `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.payment_failed`, `invoice.paid`
   - Copy the endpoint's **Signing secret** (`whsec_...`).
3. **Set** `STRIPE_WEBHOOK_SECRET` = that `whsec_...` in Vercel env vars, and
   **redeploy**.

Now cancelling a subscription (or a failed renewal) revokes access on the
subscriber's very next request. The webhook always re-checks the subscription's
status directly with Stripe, so a forged event can never grant or wrongly revoke
access — only trigger a re-check.

---

## How it works

- **Checkout.** The client calls `POST /api/billing?fn=createCheckout`, which
  creates a Stripe Checkout Session (`mode: subscription`) and returns its URL.
  The browser is sent to Stripe, then back to
  `research.html?sub=success&session_id=...`.
- **Activation.** On return, the client calls `POST /api/billing?fn=activate`,
  which verifies the session with Stripe and, if the subscription is active,
  sets two signed **HttpOnly** cookies:
  - `scere_ent` — short-lived entitlement, expires at the subscription's
    current period end.
  - `scere_cus` — long-lived (~400d) signed customer id.
- **Enforcement.** `GET /api/research?fn=full` (used by the Research Desk when
  unlocked, and by the FX Intelligence Desk) returns the report only if
  `scere_ent` is valid. `fn=public` always returns the free subset.
- **Renewals.** When `scere_ent` expires, `checkEntitlement()` re-checks Stripe
  using `scere_cus`: an active subscription silently re-issues `scere_ent`.
- **Revocation.** Without the webhook, a cancellation drops access when the
  entitlement cookie expires (up to one billing period). With the webhook + KV
  (step 5), `api/stripe-webhook.js` writes a `revoked:<customer>` denylist entry
  that `checkEntitlement()` checks on every request, so access is cut off
  **immediately** — even while the cookie is still valid. An active event clears
  the entry (self-heal).
- **Restore on a new device.** "Restore access" calls
  `POST /api/billing?fn=restore` with the subscriber's email; if Stripe has an
  active subscription for that email, the cookies are re-issued.

### Endpoints

- `GET  /api/research?fn=index` — available report dates (public)
- `GET  /api/research?fn=public` — free subset + `{ entitled, paywallActive }`
- `GET  /api/research?fn=full` — entire report (402 if not subscribed)
- `GET  /api/billing?fn=config` — `{ configured, priceLabel, interval, entitled }`
- `GET  /api/billing?fn=status` — `{ entitled, paywallActive }`
- `POST /api/billing?fn=createCheckout` — `{ url }`
- `POST /api/billing?fn=activate` — `{ session_id }` → sets cookies
- `POST /api/billing?fn=restore` — `{ email }` → sets cookies if subscribed
- `POST /api/billing?fn=logout` — clears cookies
- `POST /api/stripe-webhook` — Stripe events → KV revocation denylist (instant revocation)

---

## Design notes

- **No npm dependencies.** Stripe is called over its REST API with `fetch`,
  matching `api/markets-hub.js`. There is no `stripe` package and no build step.
- **No database.** Entitlement lives entirely in the signed cookies; Stripe is
  the source of truth, re-checked as cookies expire.
- **Secrets never reach the client.** Only `lib/entitlement.js` (server) holds
  the Stripe key and signing secret.

## Not included (possible follow-ups)

- **Customer portal.** Add a Stripe Billing Portal link so subscribers can
  manage or cancel their plan in-app.

---

## Other environment variables (unrelated to this gate)

These already exist in the project:

- `ALPHA_VANTAGE_API_KEY` — market quotes/series via `api/markets-hub.js`.
- `REPORTS_PASSWORD` / `REPORTS_USER` — HTTP Basic Auth for the `/reports/*`
  path (`middleware.js`), separate from the subscription gate.
