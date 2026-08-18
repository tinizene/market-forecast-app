# Roadmap

What is agreed but not yet built. Ordered roughly by what blocks what. Item 1 gated
going live and is now shipped; nothing below it blocks launch.

Shipped work is described in `README.md` (the app), `PAYMENTS.md` (the two products) and
the per-track roadmaps under `course/`.

---

## ~~1. Email recovery for course access~~ — **shipped**

Built as `api/auth.js`: enter an email, receive a signed single-use link, follow it,
and the entitlement cookies are re-issued from Stripe. Setup is documented in
`PAYMENTS.md` section 6, and `node scripts/test-auth.js` exercises it against stubs.

Two things worth knowing beyond "it is done":

- **It replaced a hole, not just a gap.** `/api/billing?fn=restore` re-issued full
  entitlement to anyone who posted a customer's email address, with no verification of
  any kind — knowing a buyer's email was enough to be granted their €200 course. That
  endpoint now returns `410` pointing at the new one.
- **It requires the KV store** from the revocation section, which was previously
  optional. Without it a link cannot be made single-use and the endpoint cannot be rate
  limited, so `/api/auth` refuses to run rather than degrade quietly.

Still needs, before the course goes on sale: an email provider key
(`POSTMARK_API_TOKEN` or `RESEND_API_KEY`), a verified sending domain, and
`AUTH_EMAIL_FROM` set to a dedicated `login@` address with `AUTH_EMAIL_REPLY_TO`
pointing at a monitored inbox. `GET /api/auth?fn=config` reports exactly what is
missing.

---

## 2. The logo

The brand mark to adopt is `design/logo-source-1024.png` (1024×1024 PNG): a green bull
inside a circular candlestick chart with an upward arrow, on the dark navy the app
already uses.

**Decide first — the wordmark says "SCERE TRAINING · TRADE SMARTER", the app is branded
"Scere Markets" throughout.** Those are two different names. One has to give: either the
mark is re-set with the Scere Markets wordmark, or the product is renamed and the nav
brand, `<title>`s, manifest, meta descriptions and course copy all follow. This is a
positioning call, not a design detail — "Training" and "Markets" promise different
things to someone landing on the page.

**What adopting it involves:**

- **Favicon.** There is currently **none** on any page — no `<link rel="icon">` anywhere.
  Needs at least a 32×32 and an SVG or 180×180 `apple-touch-icon`.
- **Replace the hotlinked PWA icon.** `manifest.json` currently points at
  `https://cdn-icons-png.flaticon.com/512/1170/1170678.png` — a third-party CDN image
  the project does not own, does not control, and would lose without warning if that
  URL changes. Should be a local `icons/` asset at 192×192 and 512×512, plus a
  `maskable` variant so Android does not letterbox it.
- **The nav brand.** `nav.js` renders `Scere.Markets` as styled text. Decide whether the
  mark replaces it or sits beside it; text is lighter and stays legible at small sizes,
  so a small mark plus the wordmark is likely right.
- **Open Graph / Twitter card image.** None exists, so links shared to social or chat
  currently unfurl with no image at all.
- **Size and format.** The source is a 1 MB PNG with soft glows and gradients; it will
  not survive being scaled to 32×32 legibly. A simplified mark — bull and arrow only, no
  wordmark, no glow — is what a favicon needs. Export the sizes rather than scaling the
  full artwork.
- **Service worker.** New icon assets need adding to `ASSETS_TO_CACHE` and a `CACHE_NAME`
  bump, or existing installs keep the old manifest.
- **Contrast.** The green (`#4ade80`-ish) on the dark navy is comfortable, but any text
  set in the brand green must still be checked at 4.5:1 — the app currently passes 31/31
  and should not regress on a rebrand.

---

## 3. Translation into several languages

The whole application must be translatable. Two halves, and only the hook exists:

- **Lesson content.** `api/course.js` already takes a `lang` parameter and falls back per
  track, so `data/course/<track>.<lang>.json` can be dropped in beside the English and
  serve immediately. Nothing has been translated yet.
- **UI strings.** Page copy is still inline English in the HTML and in the renderers.
  `ui.js` routes its own strings through `SCERE_UI_STRINGS` as the pattern to follow, but
  the extraction has not been done.

Also outstanding: a language switcher, `<html lang>` set from the choice, remembering
the preference, and `hreflang` so the translated pages are indexed separately.

---

## 4. The ideas page, reworked

Phase 4 made the page state accurate — it distinguishes *"included with your course
until 13 October"* from *"subscription active"* — but the surrounding page still reads
as though there is one product. Worth a pass on the upsell as the included window
approaches its end, rather than only after it lapses.

---

## 5. Align the FX generator's prompt with the parser

`scripts/generate-fx-report.js` asks for a 17-section report; `scripts/parse-fx-report.js`
tolerates two different template shapes because the model's output drifted repeatedly
(four wordings of the No-Trade Zone verdict, two whole section structures, renamed
labels). Either pin the prompt to what the parser expects, or accept dual-template
support as permanent and say so. Right now it is accidental rather than chosen.

---

## 6. Student experience — worth doing later

From an external UX audit of the course. The audit's higher-priority findings —
progress tracking, the hub/track split, the design-token layer, reading comfort,
per-lesson time estimates and search — have since been **built**; see the course pages
and `scripts/contrast-audit.js`. What follows is what was deliberately left.

Ordered by what unlocks what rather than by size.

- **Light mode.** Many students read in daylight, and a dark-only interface is a real
  comfort cost over a 58-lesson course. **Now cheap:** the token layer landed, so this
  is a mirrored block of custom properties under `[data-theme="light"]` plus a toggle,
  rather than a rewrite of 117 colour literals. Every pair must be re-run through
  `scripts/contrast-audit.js` for the light theme — light backgrounds fail differently,
  and the same muted greys will not survive the flip.

- **"Up next" / related lessons** at the end of a lesson body. Prev/next already exists
  as chrome; this is the editorial version — what to read next and why — which is what
  keeps someone moving through a track rather than stopping at the end of a chapter.

- **Focus mode** that hides the nav, disclaimers and footer while reading. Low effort,
  and it directly answers the "dense, fatiguing" complaint without changing any colour.
  Must remain keyboard-reachable and must not trap focus.

- **Keyboard shortcuts** for previous/next lesson and mark-complete. Progress tracking
  now exists, so the precondition is met and this is straightforwardly buildable. Needs a discoverable list, and must not capture keys while a text field or a
  dialog has focus.

- **Local notes and highlights**, persisted in localStorage. The most speculative item
  here — genuinely useful for a study product, and the first one that starts to create
  data a learner would be upset to lose, which is an argument for doing it only once
  there is an account to attach it to.

- **A completion moment** when a chapter or track finishes. Progress tracking now
  exists, so this is unblocked. Keep it small: a clear state change and a sentence about what comes next, not
  confetti. The register of the product is "get rich slow", and the celebration should
  match it.

---

## 7. Smaller things

- **Tailwind is a render-blocking third-party script** in every page's `<head>`. If that
  CDN is slow, firewalled or blocked by an extension, the page stalls before `<body>`
  exists. Fixing it properly means self-hosting compiled CSS — a build step, which this
  repo has deliberately avoided. `preconnect` is in place as the only mitigation
  available without that.
- **`.gitignore` has no `.env` rule.** Nothing sensitive is tracked today, but a stray
  `git add .` after creating a local env file would commit it silently.
- **Stripe Billing Portal link** so subscribers can manage or cancel the ideas
  subscription in-app.
- **Prices on the intro page.** `index.html` describes the three paths but shows no
  price; the figures are already available from `/api/billing?fn=config`.
- **FX report archive gap.** Nothing between 31 July and 11 August. Backfill if the
  source reports still exist.
