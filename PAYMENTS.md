# Payments — the two products

Scere Training sells two things, and they are bought and lost independently:

| Product | Price | Payment | Access |
| --- | --- | --- | --- |
| **The course** — Crypto, Forex, Stocks & ETFs | €200 | one payment | **forever**, plus 90 days of the daily ideas included |
| **The daily high-conviction ideas** | €70 / month | subscription | while the subscription is live |

Buying the course therefore grants *both*, but on different clocks. Ninety days
later the included ideas lapse while the course is untouched, and the buyer can
subscribe to keep receiving them. Someone who only wants the ideas can subscribe
without ever buying the course.

The free Foundation track is open to everyone and always has been.

> **Safe by default:** with no Stripe environment variables set, the paywall is
> **inactive** and the whole app behaves as if it were never added — every lesson
> and every report is open. Setting the env vars below (and redeploying) is what
> turns enforcement on. Removing them turns it back off.

---

## What is gated

| Surface | Free (always) | Paid |
| --- | --- | --- |
| **Course** (`learn.html`, `lesson.html`) | The whole **syllabus** — every track, chapter, lesson title and key idea — plus the entire Foundation track | The lesson **bodies** of Crypto, Forex and Stocks & ETFs (**the course**) |
| **Ideas** (`research.html`) | Regime headline, top idea, overall confidence, the full **track record** (wins / invalidations, and how far each call finished from its target), each live idea's **headline + six-pillar score bars** | Entry, targets, stop/invalidation, per-pillar reasoning, confirmation criteria (**the ideas**) |

Paid content is **withheld server-side** and never sent to an unentitled browser
— this is real enforcement, not CSS hiding. `middleware.js` blocks direct access
to `/data/course/*` and `/data/fx-reports/*`; the only routes in are the gated
`/api/course` and `/api/research` endpoints.

Which fact gates which surface matters:

- `api/course.js` gates on **`ownsCourse`** — never on the ideas. A lapsed ideas
  subscription must not lock someone out of a course they bought outright.
- `api/research.js` gates on **`ideasActive`** — true whether access comes from
  the 90 included days or from a live subscription.

---

## Turn it on (one-time setup)

### 1. Create the two products in Stripe

In the [Stripe Dashboard](https://dashboard.stripe.com/) → Products:

| Product | Price to create | Copy the Price ID into |
| --- | --- | --- |
| Scere Training — The Course | **€200.00 EUR, One-off** | `STRIPE_COURSE_PRICE_ID` |
| Scere Training — Daily Ideas | **€70.00 EUR, Recurring · Monthly** | `STRIPE_IDEAS_PRICE_ID` |

Price IDs look like `price_1AbC...`. Also copy your **Secret key**
(`sk_live_...`, or `sk_test_...` to trial first) from Developers → API keys.

The prices shown in the app are read from Stripe at request time — they are not
written anywhere in this repo, so changing a price in the Dashboard changes it on
the site with no deploy.

### 2. Set environment variables in Vercel

Project → **Settings → Environment Variables** (add to **Production**, and
Preview if you want to test there):

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | your `sk_live_...` (or `sk_test_...`) |
| `STRIPE_COURSE_PRICE_ID` | the one-off `price_...` (€200) |
| `STRIPE_IDEAS_PRICE_ID` | the monthly `price_...` (€70) |
| `ENTITLEMENT_SECRET` | any long random string — e.g. `openssl rand -hex 32` |

`STRIPE_PRICE_ID` is the name the single-product version used. It is still
honoured as the **ideas** price, so an existing deployment keeps working
untouched; `STRIPE_IDEAS_PRICE_ID` takes precedence if both are set.

Enforcement needs the key, the secret, and **at least one** price
(`paywallActive()` in `lib/entitlement.js`). A product with no price configured
is simply not offered for sale — no buy button appears for it — rather than
producing a broken checkout.

### 3. Redeploy

Vercel → Deployments → ⋯ → **Redeploy** (or push any commit). Enforcement is now
live: locked lessons show "Get the course · €200", the ideas page shows both
paths, Checkout runs, and access unlocks on return.

### 4. (Recommended) Trial in test mode first

Use `sk_test_...` + test-mode prices, then buy with Stripe's
[test card](https://docs.stripe.com/testing) `4242 4242 4242 4242` (any future
expiry, any CVC). Worth walking the whole path once: buy the course, confirm the
lessons unlock **and** the ideas open, then swap in the live keys.

### 4b. Discount codes

Both Checkout Sessions are created with `allow_promotion_codes`, so the payment page
already shows an **Add promotion code** field. Creating codes needs no code change:

1. Stripe Dashboard → **Product catalogue → Coupons** → create a coupon (percentage or
   fixed amount, and for the subscription a **duration**: once, repeating for N months,
   or forever).
2. On that coupon → **Promotion codes** → create the customer-facing code (`LAUNCH50`).
   Optional restrictions worth using: expiry date, maximum redemptions, first-time
   customers only, and a minimum order amount.

A few things specific to how this app grants access:

- **A 100%-off code is a different shape of session.** When the total comes to zero,
  Stripe sets `payment_status` to `no_payment_required` (not `paid`) and creates **no
  PaymentIntent**. `deriveFromStripe` accepts both statuses, so a comped course grants
  the course and its 90 included days exactly like a paid one. Matching only `paid`
  would have let someone redeem a full-discount code, complete Checkout, and be granted
  nothing — with no error anywhere to explain it.
- **A comped course still expires its ideas at 90 days.** The included window runs from
  the purchase date regardless of what was paid.
- **A discounted purchase can still be refunded.** Refunds are compared against the
  session's `amount_total`, which is the *discounted* amount — so fully refunding a
  €100 half-price sale correctly revokes the course. A zero-amount order has nothing to
  refund and can never be revoked this way.
- **Fixed-amount coupons must be in EUR** to apply to these prices.
- **On the subscription**, a `forever` coupon keeps the subscription `active` at a lower
  price; entitlement follows subscription status, not the amount, so nothing changes.

#### Campaign links (`?code=`)

Any page accepts `?code=LAUNCH50`, so a campaign email, ad or affiliate link can arrive
with the discount already applied — no typing, and no code to forget:

```
https://<your-domain>/learn.html?code=LAUNCH50
https://<your-domain>/research.html?code=LAUNCH50
```

What happens:

- The code is remembered for the **visit** (`sessionStorage`, not `localStorage` — a
  discount from a link belongs to that visit, not permanently to that browser), so it
  survives the walk from the syllabus into a free lesson and on to checkout. Someone who
  clicks a link, reads two lessons and then buys still gets what they were promised.
- The site shows the **real discounted price on the button** — "Get the course · €100",
  with €200 struck through — because the code is resolved server-side against Stripe
  before rendering. Showing €200 and then €100 on Stripe's page would be a pleasant
  surprise once and a trust problem thereafter.
- Checkout is created with `discounts` rather than `allow_promotion_codes` (the two are
  mutually exclusive), so the discount is already applied when the buyer arrives.
- **A code that does not apply says so.** Expired, unknown, wrong currency, wrong
  product, below a minimum order — each is stated next to the price rather than silently
  ignored. A code that is quietly dropped is how someone pays full price believing it
  worked.
- **A bad code can never block a sale.** Stripe is the authority on limits that cannot
  be evaluated up front (per-customer caps, `first_time_transaction`, redemption
  limits). If it refuses the code, checkout is retried *without* it and the buyer still
  reaches the payment page, where they can type a different one.

### 5. (Recommended) Prompt revocation — webhook + KV

Without this, a cancellation, failed payment or refund stops access at the next
cookie refresh (up to 30 days of lag). Add a webhook + a small KV store to cut
that to the customer's very next request.

1. **Provision a KV store.** Vercel → **Storage → KV** (create a database and
   connect it to this project — it injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN`). [Upstash Redis](https://upstash.com/) works too, via
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. The same store is
   **required** by email recovery (section 6), so if you are selling the course
   you are provisioning it either way.
2. **Register the webhook** in Stripe → Developers → Webhooks → Add endpoint:
   - URL: `https://<your-domain>/api/stripe-webhook`
   - Events: `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.payment_failed`, `invoice.paid`, `charge.refunded`,
     `charge.dispute.created`
   - Copy the endpoint's **Signing secret** (`whsec_...`).
3. **Set** `STRIPE_WEBHOOK_SECRET` = that `whsec_...` in Vercel env vars, and
   **redeploy**.

The flag the webhook writes means *"this customer's cookie is stale, re-derive
from Stripe"* — **not** *"this customer has nothing."* That distinction is the
whole point: cancelling a €70/month subscription must leave a €200 course
untouched. The re-derivation is what then correctly drops the ideas and keeps the
course. The webhook always re-checks status directly with Stripe, so a forged
event can never grant or wrongly revoke access — only trigger a re-check.

---

### 6. (Required before selling the course) Email recovery

The course is sold as *"yours forever"*. Ownership is proved by the `scere_cus`
cookie — so without this, clearing cookies on a new laptop loses a €200 purchase
with no way back. Set this up before `STRIPE_COURSE_PRICE_ID` goes live.

1. **Provision the KV store** from section 5 if you have not already. It is not
   optional here: it is what makes a link single-use and what rate limits the
   endpoint. Without it, `/api/auth` refuses to run at all rather than emailing
   links it cannot burn.
2. **Pick an email provider and verify a sending domain.** Either works, and the
   code uses whichever key is present:

   | Variable | Provider |
   | --- | --- |
   | `POSTMARK_API_TOKEN` | [Postmark](https://postmarkapp.com/) — the better deliverability reputation, and what wins if both are set |
   | `RESEND_API_KEY` | [Resend](https://resend.com/) — the least setup |

3. **Set the sending identity:**

   | Variable | Value |
   | --- | --- |
   | `AUTH_EMAIL_FROM` | `login@your-domain` — a dedicated transactional address |
   | `AUTH_EMAIL_REPLY_TO` | a real, monitored inbox |
   | `PUBLIC_BASE_URL` | `https://your-domain` — only needed on a custom domain; Vercel supplies its own host otherwise |

   **Use a dedicated address, never the general `info@`.** Mixing auth mail into
   an address that also sends anything promotional means one spam complaint puts
   *login* mail in the spam folder, which locks paying customers out of what they
   bought.

4. **Check it is live:** `GET /api/auth?fn=config` returns
   `{ configured: true, reason: null }` when everything is in place, and names
   exactly what is missing when it is not.

#### How recovery works

- The visitor chooses **Restore access** (on the course pages or the ideas page)
  and enters an email address.
- `POST /api/auth?fn=request` answers **identically whether or not that address
  has ever bought anything** — otherwise the endpoint would be a way to ask which
  of your customers' addresses are real. A link is emailed only if the address
  maps to a Stripe customer holding the course or a live subscription.
- The link carries a signed token — `{ k: 'login', cus, jti, exp }`, 15 minutes —
  and lands on a **confirm page with a button**. It is not consumed by opening
  it, because mail clients and security scanners follow links before people do,
  and a single-use token consumed by a scanner would burn before its owner ever
  clicked. The page works without JavaScript; the button is a real form submit.
- `POST /api/auth?fn=consume` burns the `jti` in KV **before** deriving anything,
  so two simultaneous requests cannot both succeed, then re-derives entitlement
  from Stripe and issues the same cookies a completed checkout would.
- Rate limits: 3 links per address per hour, 10 per source address per hour, both
  counted *before* any lookup so the limits cannot themselves be used to probe
  which addresses exist.
- The emailed link's origin comes from `PUBLIC_BASE_URL` or Vercel's own
  environment — **never** from the request's `Host` header, which would let an
  attacker have a genuine, correctly signed link delivered pointing at their own
  domain.

Run `node scripts/test-auth.js` to exercise all of this against stubs — no
network, no credentials, no mail sent.

#### What this replaced

`/api/billing?fn=restore` used to re-issue **full entitlement to anyone who
posted a customer's email address**, with no verification of any kind. Knowing a
buyer's email was enough to be granted their course and their subscription, and
its 404-vs-200 answers confirmed which addresses had bought. It now returns
`410 Gone` pointing at `/api/auth?fn=request`.

---

## How it works

- **Checkout.** The client calls `POST /api/billing?fn=createCheckout` with
  `{ product: 'course' | 'ideas' }`. The course creates a `mode: payment`
  session tagged `metadata.product = 'course'`; the ideas create a
  `mode: subscription` session. The browser goes to Stripe and comes back to
  `learn.html?buy=success&session_id=...` or
  `research.html?sub=success&session_id=...` (the return page is chosen
  server-side, so it can never be turned into an open redirect).
- **That metadata tag is load-bearing.** `metadata.product === 'course'` on a
  paid Checkout Session is the *only* thing that establishes ownership. A course
  payment without it grants nothing.
- **One customer, not several.** If the visitor already has a `scere_cus` cookie,
  its customer id is passed to Checkout. Without this, someone who buys the course
  and subscribes three months later would become a *second* Stripe customer, and
  the course they own would become invisible to the entitlement check.
- **Activation.** On return the client calls `POST /api/billing?fn=activate`,
  which verifies the session, re-derives the customer's whole entitlement from
  Stripe, and sets two signed **HttpOnly** cookies:
  - `scere_ent` — `{ course, cAt, iUntil, iSrc, sub, exp }`. `exp` is a
    **re-derivation horizon** (30 days), not the entitlement's lifetime.
  - `scere_cus` — long-lived (~400d) signed customer id.
- **Deriving the two facts.** `deriveFromStripe()` reads the customer's Checkout
  Sessions and subscriptions:
  - `ownsCourse` — the earliest paid, non-refunded session tagged as the course.
    Earliest wins, so buying twice cannot quietly extend the included window.
  - `ideasActive` — true until `max(courseAt + 90 days, subscription period end)`.
    `ideasSource` records which of the two is granting it, so the page can say
    *"included with your course until 13 October"* rather than a bare "active".
- **Refunds.** Stripe leaves a session's `payment_status` at `paid` after a
  refund, so ownership is checked against the refunds recorded on its
  PaymentIntent. A **full** refund undoes the sale; a **partial** one (a goodwill
  adjustment) leaves the course owned. A failed refund lookup never revokes —
  a transient error must not cost a paying customer their course.
- **Guards.** Checkout refuses to sell the course to someone who owns it, or a
  month of ideas to someone whose 90 included days are still running (returning
  the date they end instead). Selling either would be indefensible.
- **Restore on a new device.** "Restore access" calls
  `POST /api/billing?fn=restore` with the email paid with. Owning the course
  counts as a successful restore even with no live subscription.

### Endpoints

- `GET  /api/course?fn=index` — the whole syllabus as metadata (public)
- `GET  /api/course?fn=lesson&id=…` — one lesson body (402 without the course)
- `GET  /api/research?fn=index` — available report dates (public)
- `GET  /api/research?fn=public` — free subset + `{ entitled, ownsCourse, ideasUntil, ideasSource, paywallActive }`
- `GET  /api/research?fn=full` — entire report (402 without active ideas)
- `GET  /api/billing?fn=config` — `{ configured, course: {…}, ideas: {…}, ownsCourse, ideasActive, ideasUntil, ideasSource }`
- `GET  /api/billing?fn=status` — the same entitlement facts, without the prices
- `POST /api/billing?fn=createCheckout` — `{ product }` → `{ url }`
- `POST /api/billing?fn=activate` — `{ session_id }` → sets cookies
- `POST /api/billing?fn=restore` — **gone** (`410`), was unauthenticated; see below
- `POST /api/billing?fn=logout` — clears cookies
- `POST /api/stripe-webhook` — Stripe events → KV flag → prompt re-derivation
- `GET  /api/auth?fn=config` — `{ configured, reason }` for email recovery
- `POST /api/auth?fn=request` — `{ email }` → emails a single-use link; the answer is
  identical whether or not that address exists
- `GET  /api/auth?fn=verify&token=…` — the confirm page the emailed link opens
- `POST /api/auth?fn=consume` — `{ token }` → burns it and sets cookies

---

## Design notes

- **No npm dependencies.** Stripe is called over its REST API with `fetch`,
  matching `api/markets-hub.js`. There is no `stripe` package and no build step.
- **No database.** Entitlement lives entirely in the signed cookies; Stripe is
  the source of truth, re-derived whenever a cookie expires or is flagged.
- **Secrets never reach the client.** Only `lib/entitlement.js` (server) holds
  the Stripe key and signing secret.
- **Two facts, never one flag.** Collapsing `ownsCourse` and `ideasActive` back
  into a single "entitled" boolean is exactly what would let a lapsed €70
  subscription take away a €200 course.

## Not included (possible follow-ups)

- **Email recovery for course access.** Permanent access currently depends on the
  `scere_cus` cookie surviving, or on the buyer remembering which email they paid
  with. For a product sold as *"yours forever"* that is not good enough — a
  magic-link sign-in is the fix, and it is load-bearing rather than optional.
- **Customer portal.** A Stripe Billing Portal link so subscribers can manage or
  cancel the ideas subscription in-app.

---

## Other environment variables (unrelated to this gate)

These already exist in the project:

- `ALPHA_VANTAGE_API_KEY` — market quotes/series via `api/markets-hub.js`.
- `REPORTS_PASSWORD` / `REPORTS_USER` — HTTP Basic Auth for the `/reports/*`
  path (`middleware.js`), separate from the payment gate.
