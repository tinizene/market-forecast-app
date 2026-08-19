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

## ~~2. The logo~~ — **shipped**

The product is now **Scere Training**, tagline **Trade Smarter**, and the mark is a
green bull's head on the app's navy.

**The name question is settled.** The supplied artwork said "SCERE TRAINING" while the
app said "Scere Markets"; Training won, so the nav, every page `<title>`, the manifest,
the meta descriptions, the sign-in email and confirm page, and the three course lessons
that name the research service all follow it now.

**The mark was redrawn, not traced.** `design/logo-source-1024.png` is a 1 MB raster
with soft glows, a background scene and the wordmark baked in — it cannot be recoloured,
re-laid-out, or scaled to 32px legibly. It stacked five ideas: ring, bull, candlesticks,
zigzag arrow and a dollar sign. `scripts/build-brand.js` redraws it as flat vector
geometry keeping only the bull, because the bull is already the "up" signal in this
industry and the arrow was saying it a second time. Drafts that kept the ring read as an
alien; the fix was horns that run more horizontally than vertically, which is the thing
to preserve if it is ever redrawn again.

Everything the old item asked for:

- **Favicon** — `icons/favicon.svg` plus a 32×32 PNG, linked from all nine pages.
- **PWA icons** — local 192, 512 and a padded `maskable` 512. The hotlinked
  `cdn-icons-png.flaticon.com` image the project never owned is gone.
- **Nav** — the mark sits beside the wordmark, `alt=""` because the link already reads
  the brand and announcing it twice helps nobody.
- **Open Graph / Twitter card** — `icons/og.png` at 1200×630, on the three pages a link
  actually gets shared to.
- **Service worker** — icons added to `ASSETS_TO_CACHE`, `CACHE_NAME` bumped to
  `scere-training-v18`.
- **Contrast** — the audit still passes, and the brand green is only ever used against
  navy at ratios well past 4.5:1.

Regenerate with `node scripts/build-brand.js` (needs Chromium; outputs are committed so
a deploy never runs it).

**Deliberately not renamed:** `reports/` and `reports-source/`, which are dated
historical artefacts — rewriting a past report's footer would falsify a record. Internal
identifiers are also untouched: the `scere_ent` / `scere_cus` cookies, the
`scere_progress_v1` storage key and the `window.SCERE_*` globals all keep their names,
because renaming a cookie signs every existing customer out.

---

## 3. Translation into several languages

**The interface is done in French and Swahili. The Swahili course is fully translated
and awaiting native review. Everything needed to add a language is in place.**

**Shipped — the interface.** `i18n.js` is the runtime: it resolves the language from
`?lang=`, then a stored preference, then the browser, then English; sets `<html lang>`
and `dir`; and translates anything carrying `data-i18n`, including markup inserted
later, via a MutationObserver. English stays inline in the HTML as the fallback, so a
failed locale fetch degrades to a correct English page rather than to blank elements,
and deleting `i18n.js` would leave the site working.

351 strings are extracted into `i18n/en.json`; `i18n/fr.json` and `i18n/sw.json` are
both complete. That covers the six served pages *and* the two renderers — `learn.js` and
`research.js` build most of the product surface with `innerHTML` after a fetch, so
tagging only the `.html` files would have left the entire course UI in English while
looking finished.

The language switcher is in the nav, offering only languages that have a locale file
(`available: true` in `LANGUAGES`), so a half-translated entry can never be picked.
`hreflang` alternates are on all six pages.

**Shipped — the Swahili course.** All 4,706 unique prose strings across the four tracks
are translated, compiled to `data/course/<track>.sw.json` at 100% coverage.
`api/course.js` serves them with per-track fallback, so an untranslated track would
degrade to English rather than break.

It is stored as an **overlay**, `data/course/i18n/sw.json`: `sha256(english)[:12]` →
`{en, sw}`. The English lesson JSON stays the single source of truth. Three things
follow from that shape, and they are the whole reason for it. A proofreader reads both
languages side by side, which is the form review actually needs. When English is edited
its hash changes, the old entry is orphaned, and the gate says so — where a parallel
translated tree would go stale in silence. And anything untranslated falls back
automatically, so a partial translation is a usable page rather than a broken one.

The overlay carries its own provenance: `_note` records that it is machine-translated and
awaiting native review, `_conventions` records the six rules it was written to, and
`keepAsIs` records every term deliberately left in English **with the reason for each**,
so a reviewer can disagree with a decision rather than wonder whether it was an oversight.

**Outstanding — native review.** `course/CLAUDE.md` and `Forex_Course_Style_Guide.md` §5
require native-speaker review before publication, and that has not happened. Run
`node scripts/build-review-doc.js` to produce `review/sw-*.html`: English and Swahili
side by side in reading order, grouped by chapter and lesson, with the conventions and
the kept-in-English decisions surfaced at the top. The Swahili column is editable in the
browser and emits a JSON batch that `scripts/merge-translation.js` consumes directly, so
a review comes back as a patch rather than as prose in an email. The output is
gitignored: it is the entire paid course as static HTML, and this site deploys
statically — `middleware.js` hard-blocks `/data/course/*` for the same reason.

Four gates hold all of this:

- `scripts/check-i18n.js` — missing keys, orphans, locale parity, `{placeholder}` and
  markup parity, and drift between the English in `en.json` and the English in the
  source. Static, fast, no browser.
- `scripts/check-course-i18n.js` — the course gate, and it checks what a *language*
  proofreader cannot: that every number survives as a multiset, that currency and percent
  markers are intact, that no entry is orphaned by an English edit, and that nothing is
  silently identical to the English unless `keepAsIs` says why. It earned its place
  immediately, catching two lost `%` markers and two clock times localised into Swahili
  traditional time — correct Swahili, wrong in a lesson about reading an economic
  calendar that shows international time.
- `scripts/verify-i18n-browser.js` — 43 assertions in headless Chromium against the real
  `api/*` handlers: the switch works end to end, the preference persists, each renderer
  produces the target language, English is unaffected, and no catalogue string survives
  untranslated. Skips cleanly where there is no Chromium.
- `scripts/build-course-i18n.js` — recompiles the served files and reports coverage per
  track, so a drop is visible rather than inferred.

To add a language: write `i18n/<code>.json`, flip `available` in `LANGUAGES`, then
`node scripts/extract-course-strings.js --todo <code>` for the course work list and
`scripts/merge-translation.js` to merge it back. `pt` is declared and waiting on its
files.

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
