# Scere Markets

A market-forecast PWA forked from [Scere Forecasts](../README.md) (the Liberia weather
app) — same architecture, same dark-theme card UI, same offline-friendly PWA shell,
applied to indices, rates, and FX instead of cities. See `FORK-NOTES.md` for a
detailed mapping of what changed and why.

**Not financial advice.** Everything this app shows is derived from real fetched data
(published quotes, published economic series, real RSS newsletter content) — nothing
is a proprietary buy/sell signal or invented forecast. See the disclaimer in the
footer and `privacy-policy.html`.

## What it does

- Live-ish quote + recent trend for: S&P 500, Nasdaq-100, Dow (via SPY/QQQ/DIA ETF
  proxies), Gold (via GLD), a lower-fee S&P 500 alternative (VOO), four sector ETFs
  (technology, energy, financials, health care), two dividend-focused ETFs (SCHD,
  VYM), US 10-Year & 2-Year Treasury yield, the Fed funds rate, and EUR/USD, GBP/USD,
  USD/JPY.
- A small set of derived context cards per instrument (trend vs. moving average,
  recent volatility, momentum, range position) — statistics computed from the fetched
  price history, not signals from any third-party source.
- A financial newsletter/market-commentary feed (RSS aggregator), the direct
  counterpart to the weather app's farming-news feed.
- Saved instrument preference (localStorage).
- Installable PWA (same `manifest.json`/`sw.js` pattern as the weather app).
- A Pro upgrade modal — **UI only in this build, no payment wiring yet.** See
  "What's not built yet" below.
- **FX Intelligence Desk** (`fx-intelligence.html`) — a second page rendering the full
  daily "Institutional FX Dashboard & Intelligence Report" (regime classification,
  currency strength scores, central bank rates, tier-1 pair levels, layer-by-layer
  synthesis, high-conviction trade ideas with weighted confidence scores, contrarian
  check, equity leaderboard, catalysts, no-trade-zone flag, and more) generated daily
  by your existing `daily-fx-dashboard` scheduled task and kept in sync automatically.
  Leads with three summary widgets — Morning Brief, a hero card, and a Decision
  Engine breakdown — described under "Hero card, Decision Engine, Morning Brief"
  below. See "FX Intelligence Desk" below for how this pipeline works.
- **Learn** (`learn.html`) — a beginner-focused investing curriculum: seven short
  lessons (investing vs. gambling, what an index/ETF is, dividends, expense ratios,
  diversification by sector, dollar-cost averaging), a real fee-comparison table, and
  a dollar-cost-averaging calculator computed from real historical price/dividend
  data. Linked prominently from the main page — this is meant to be where a complete
  beginner starts, not a buried footnote. See "Learn section" below.
- **Read-aloud** — every lesson on the Learn page can be listened to instead of read,
  using the browser's free built-in text-to-speech (no API key, no server round-trip).
  Built for users who aren't strong readers or are non-literate. See "Read-aloud" under
  "Learn section" below.
- **Get Rich Slow manifesto** (`manifesto.html`, source in `MANIFESTO.md`) — a short
  article laying out what this app stands for: long-horizon, diversified, fee-aware
  investing over gambling-shaped "get rich quick" behavior, written for an investor
  the mainstream financial industry doesn't build products for. Linked from every
  page's header/footer. Includes an explicit public commitment not to accept
  pay-to-play placement in recommendations — see "Get Rich Slow manifesto" below for
  why that line is there.

## Setup

### 1. Get a free Alpha Vantage API key

Equity-index-proxy quotes/history and the Treasury-yield/Fed-funds-rate series come
from [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (free tier,
instant signup — no credit card). FX (Frankfurter) needs no key at all.

### 2. Set the environment variable

In your Vercel project settings (or `.env.local` for local dev with `vercel dev`):

```
ALPHA_VANTAGE_API_KEY=your_real_key_here
```

Never commit this key or put it in any client-side file — `api/markets-hub.js` is
the only place it's read, server-side, same pattern as the weather app's
`SUPABASE_SERVICE_ROLE_KEY`.

### 3. Run locally

This has no build step (same as the weather app). With the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel dev
```

`vercel dev` is needed (not `npx serve .`) because this app's quotes/history/macro/fx/
news all go through the `api/markets-hub.js` serverless function — a plain static
server won't run it.

### 4. Deploy

```bash
vercel --prod
```

Set `ALPHA_VANTAGE_API_KEY` in the Vercel dashboard for the deployed project too
(env vars don't carry over from local `.env.local` automatically).

## Caching against the Alpha Vantage free-tier cap

Alpha Vantage's free tier caps out at 25 requests/day total — easy to exhaust with
even light traffic. Every endpoint in `api/markets-hub.js` sets a `Cache-Control`
header, which Vercel's edge network honors, so repeat requests for the same
symbol/series within the window are served without a new upstream call at all:

| Endpoint | Cache window | Why |
|---|---|---|
| `/api/quote` | 15 min | Not a trading terminal — this app doesn't need fresher-than-15-min prices, and the old 60s window meant a handful of visitors could burn the daily cap in minutes. |
| `/api/history` | 6 hours | Daily closes don't change until the next market close. |
| `/api/macro` | 6 hours | Treasury yields settle once a day; the Fed funds rate only moves at FOMC meetings (~8x/year). |
| `/api/adjusted-history` | 1 day | Monthly data — a day of staleness is irrelevant. |
| `/api/countries` | 1 week | The World Bank's country list essentially never changes. |
| `/api/country-indicators` | 1 day | Annual World Bank data. |

Two gaps worth knowing about, deliberately not built yet: there's no client-side
cache in `app.js`, so switching between instruments in the dropdown always re-fetches
even if you already viewed that instrument this session — cheap to add later if
worth it. And Cache-Control caching is "best effort" at Vercel's edge, not a hard
guarantee — if you need an absolute ceiling on Alpha Vantage calls regardless of
traffic, the more robust fix is a scheduled prefetch job (same pattern as the FX
report pipeline below) that writes a static JSON snapshot instead of calling Alpha
Vantage live per visitor. Not built here — the header changes above were the
requested scope.

## Data sources (all verified reachable during development)

| Data | Source | Key needed? |
|---|---|---|
| Equity-index-proxy quotes & history | Alpha Vantage (`GLOBAL_QUOTE`, `TIME_SERIES_DAILY`) | Yes, free |
| Monthly dividend-adjusted history (Learn section calculator) | Alpha Vantage (`TIME_SERIES_MONTHLY_ADJUSTED`) | Yes, free — same key |
| Treasury yield / Fed funds rate | Alpha Vantage economic indicators | Yes, free |
| FX rates | [Frankfurter](https://www.frankfurter.dev/) (ECB reference rates) | No |
| Market news/newsletters | Investing.com (Fundamental Analysis + Stock Market News RSS), Federal Reserve press releases RSS, WSJ Markets RSS | No |
| Country economic indicators (Learn section "Your country at a glance") | [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589) (inflation, GDP per capita, GDP growth, financial inclusion) | No |

**On "analyst consensus data":** genuine analyst price-target/rating consensus (the
kind TipRanks, Zacks, or Seeking Alpha's paid tiers show) isn't available from any
free, keyless, or low-friction API — building that in would have meant either paying
for a data license or fabricating numbers, and neither was acceptable. The
"Fundamental Analysis" RSS feed (real named analysts/contributors: FxPro Financial
Services, Newsquawk, etc.) is the honest free equivalent used here — real commentary,
not synthesized numbers. Worth revisiting if/when this project takes on a paid data
subscription.

## FX Intelligence Desk

`fx-intelligence.html` renders the daily FX dashboard your `daily-fx-dashboard`
scheduled task already writes to your FX-Reports folder as markdown (plus HTML/PDF).
This is a genuinely richer, better-sourced feed than the generic EUR/USD/GBP/USD/USD/JPY
cards on the main page — real institutional-style analysis (currency strength scores,
policy rates, trade ideas with weighted confidence breakdowns, contrarian checks)
instead of Frankfurter spot rates alone. It doesn't replace the main FX cards —
it's a separate, deeper view, linked from the footer.

**Pipeline:**

1. `daily-fx-dashboard` (already running, 07:08am weekdays) writes
   `fx-dashboard-YYYY-MM-DD.md` into your FX-Reports folder.
2. A new scheduled task, `fx-report-app-sync` (07:31am weekdays — set up alongside this
   build), notices the new file, runs `scripts/parse-fx-report.js` on it, and writes
   the result into `data/fx-reports/latest.json` (+ a dated copy in `data/fx-reports/history/`
   and an updated `data/fx-reports/index.json` for the in-app date picker).
3. `fx-intelligence.html`/`fx-intelligence.js` fetch that JSON client-side — no API key,
   no server round-trip beyond the static file.

**Parser design note:** the three report samples available during development (July 4,
6, and 9) already showed the report's section count, numbering, and even some table
layouts changing between runs — it's an actively evolving prompt/template, confirmed by
the reports' own "merged structure" notes. So `scripts/parse-fx-report.js` matches
sections by **title keyword**, never by section number, parses tables generically
(keyed by whatever columns actually exist), and always keeps each section's raw
markdown as a fallback — so a future format change degrades gracefully instead of
breaking the page. Backfilled against all 6 currently available reports
(2026-07-03 through 2026-07-09) as a regression check.

**Hero card, Decision Engine, Morning Brief:** three summary widgets sit at the top
of `fx-intelligence.html`, above the full section-by-section report. All three are
computed by `computeDecisionSummary()` in `scripts/parse-fx-report.js`, purely by
re-reading fields the parser already extracted elsewhere on the page — no new data
source, no separate scoring model, no invented confidence number.

- **Hero card** — today's regime, overall market confidence (from the report's own
  Decision Dashboard section), the single highest-confidence open trade idea
  ("best opportunity"), the report's own excluded/no-trade call ("avoid" — falls
  back to the lowest-confidence open idea only if the report didn't flag one), and
  the next line from the Economic Catalyst Check section.
- **Decision Engine** — the same highest-confidence idea's own component scoring
  table (Macro/Technicals/Positioning/Sentiment/Volatility, or whatever components
  that day's report actually used), rendered as bars, plus a "Watch {pair}
  {Short/Long}" line. Deliberately not "buy now" language — this mirrors the source
  report's own framing of these as analytical scenarios, consistent with the
  disclaimer banner on this page.
- **Morning Brief** — a single templated paragraph assembled from the regime,
  overall confidence, top idea, and primary risk fields above. Not a second AI
  opinion layered on top of the report; every sentence traces back to a field
  already shown elsewhere on the page.

All three degrade gracefully on sparse reports (e.g. a holiday report with no
tradeable ideas) — verified against both a data-rich report (July 9) and the
sparsest available report (July 3, a holiday-thinned session with no open ideas)
via a headless DOM test harness.

**Known limitation:** this keeps the *local* app data current automatically. If/when
this app is actually deployed to a public Vercel URL, that deployment won't pick up
new reports on its own — `data/fx-reports/` would need to be part of what gets
deployed (e.g. committed to a git repo Vercel auto-deploys from), or synced to cloud
storage the deployed app fetches from. Neither exists yet since the app itself hasn't
been deployed — revisit once it is, don't build sync infrastructure for a deployment
that doesn't exist yet.

## Cloud-native report generation (no local machine required)

The pipeline above (`daily-fx-dashboard` + `fx-report-app-sync`, both Cowork scheduled
tasks) only fires reliably when the machine running Cowork is on — in practice this
meant missed or late runs on mornings the laptop wasn't awake yet. `scripts/generate-fx-report.js`
plus `.github/workflows/daily-fx-report.yml` is a self-contained replacement that runs
entirely on GitHub's own cloud runners instead, with no dependency on any local machine.

**What it does, in one run:** calls the Anthropic API directly (model + the server-side
`web_search` tool) with a reconstruction of the report's master prompt, asks for the
markdown AND the matching HTML in a single response (split by explicit markers — this
sidesteps a real bug seen in manual runs where generating the two formats separately let
them drift out of sync), writes them to `reports-source/`, then re-runs the existing
`scripts/parse-fx-report.js` and `scripts/sync-daily-dashboard.js` unchanged so
`data/fx-reports/` and `data/daily-dashboard/` end up in exactly the same shape either
pipeline produces. For continuity (Section 2's performance review, Section 9/15's
confidence deltas), it reads the previous run's `data/fx-reports/latest.json` and feeds a
summary of it back into the prompt.

**This replaces, not adds to, the Cowork tasks** — running both would double-generate
and could conflict. Disable `daily-fx-dashboard` and `fx-report-app-sync` (or point them
at a different output path) before turning this on, or vice versa if you'd rather keep
the Cowork version as primary and treat this as a backup.

**Setup required (none of this could be done by the assistant that wrote this script —
it needs credentials only you can grant):**

1. **Get this code into a real git repo.** This folder wasn't version-controlled yet as
   of when this pipeline was added. From a real terminal (not a sandboxed environment):
   ```bash
   cd path/to/market-forecast-app
   git init
   git add -A
   git commit -m "Initial commit with cloud-native FX report pipeline"
   ```
2. **Create a GitHub repo and push.** E.g. via [github.com/new](https://github.com/new),
   then:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git branch -M main
   git push -u origin main
   ```
3. **Get an Anthropic API key** at [console.anthropic.com](https://console.anthropic.com)
   (separate from, and billed separately from, any claude.ai or Cowork subscription).
4. **Add it as a GitHub Actions secret:** repo → Settings → Secrets and variables →
   Actions → New repository secret → name it `ANTHROPIC_API_KEY`.
5. **Verify the model name.** `scripts/generate-fx-report.js` defaults
   `ANTHROPIC_MODEL` to a specific model string that may be superseded by the time you
   read this — check [the current model list](https://docs.claude.com/en/docs/about-claude/models)
   and, if needed, set an `ANTHROPIC_MODEL` repo **variable** (Settings → Secrets and
   variables → Actions → Variables tab — not a secret, since a model name isn't
   sensitive) to override it without editing the script.
6. **Connect the repo to Vercel** (Vercel dashboard → Add New Project → import the
   GitHub repo) so every push — including the daily commits this workflow makes —
   triggers an automatic redeploy. This is what actually closes the gap noted in the
   "Known limitation" above: once this is wired up, the deployed site picks up each
   day's report automatically, with no manual deploy step.
7. **Test it manually before trusting the schedule:** repo → Actions tab → "Daily FX
   Report" workflow → Run workflow (this uses the `workflow_dispatch` trigger baked into
   the workflow file). Confirm `reports-source/`, `data/fx-reports/`, and
   `data/daily-dashboard/` all get new files and the commit/push step succeeds before
   relying on the 05:00 UTC cron trigger.

**Cron timing caveat:** GitHub Actions cron is UTC-only with no daylight-saving
awareness — see the comment at the top of `daily-fx-report.yml` for what that means for
the actual local fire time across summer/winter.

## Daily Dashboard

`daily-report.html` is a second, deliberately different view of the same underlying
daily report: instead of parsing it into structured JSON like the FX Intelligence Desk
does, it shows the report's own self-contained HTML export exactly as generated —
same dark dashboard layout, same inline CSS, same Chart.js gauges/bars — inside an
`<iframe>`. Built as a standalone page rather than folded into `fx-intelligence.html`
so the two views can diverge freely: one is the app's own rendering of the data, the
other is a faithful copy of the original report file.

**Pipeline:**

1. `daily-fx-dashboard` (the same scheduled task that writes the `.md` used by the FX
   Intelligence Desk) also writes `fx-dashboard-YYYY-MM-DD.html` into your FX-Reports
   folder — no extra generation step needed.
2. `scripts/sync-daily-dashboard.js` copies that file byte-for-byte into
   `data/daily-dashboard/history/<date>.html`, and updates `data/daily-dashboard/latest.html`
   and `data/daily-dashboard/index.json` (the in-app date picker), mirroring the
   three-artifact shape `parse-fx-report.js` already uses for `data/fx-reports/`.
3. `daily-report.html`/`daily-report.js` fetch `index.json` client-side to populate the
   date dropdown, then point an `<iframe>` at the selected date's HTML file.

Run it the same way `fx-report-app-sync` runs the markdown parser — either point it at
a single new file, or re-run it against the whole FX-Reports folder to backfill/refresh
everything at once (safe to re-run; overwriting an already-synced date is a no-op):

```
node scripts/sync-daily-dashboard.js "<path to>/fx-dashboard-2026-07-14.html"
node scripts/sync-daily-dashboard.js "<path to FX-Reports folder>"
```

Backfilled against all 6 currently available `.html` reports (2026-07-04 through
2026-07-13) as an initial regression check.

**Why an iframe, not inline markup:** the report's own stylesheet uses `:root`
variables and bare element selectors (`body`, `table`, `th`) that would collide with
the app's Tailwind-based styling if injected directly into the page. Sandboxing it in
an iframe (`sandbox="allow-scripts allow-same-origin"`, no `allow-top-navigation` or
`allow-popups`) keeps the report's own CSS/Chart.js fully isolated and keeps its
outbound links from taking over the app shell.

**Known limitation:** same as the FX Intelligence Desk above — this syncs local app
data only; a deployed instance would need `data/daily-dashboard/` included in whatever
gets deployed.

## Learn section

`learn.html` exists because of a specific product decision: this app targets a small,
regular investor (illustratively, $100–200/month) in a market where financial advice
and account access are harder to come by, and where "extra money" often goes toward
genuinely negative-expected-value bets (lottery, sports betting, "guaranteed profit"
trading signal groups) for lack of a safer, understood alternative. The safest,
highest-value thing this app can do for that person isn't a market-timing signal —
it's teaching what an index fund and an ETF actually are, in plain language, before
anything else.

**Content:** seven short lessons, in `learn-content.js` — Investing vs. Gambling, What
Is an Index?, What Is an ETF?, Dividends and Dividend ETFs, Expense Ratios, Diversification
by Industry, and Dollar-Cost Averaging. Deliberately prose-only, with zero hardcoded
numbers — every dollar figure or percentage a lesson references is rendered live from
real data elsewhere on the page, so the lesson text can never drift out of sync with
the actual numbers.

**Your country at a glance:** rendered inline right after Lesson 1 (Investing vs.
Gambling), so the "why not just hold cash" argument gets grounded in the user's own
real economic environment before the index/ETF lessons explain the solution. A
country selector — covering every country the World Bank's Indicators API tracks
(~217 real economies, not a hardcoded shortlist) — followed by real, current figures
for whichever country is selected: inflation, GDP per capita, GDP growth, and the
share of adults with a bank or mobile-money account (World Bank Global Findex). Each
card shows the year the figure is actually from (World Bank data is annual, sometimes
sparser) and links back to the source page on data.worldbank.org. No indicator or fund
is recommended based on the country data — it's context, not a signal. Powered by
`/api/countries` and `/api/country-indicators` (`api/markets-hub.js`), which proxy the
World Bank's free, keyless Indicators API — no API key, no rate-limit risk. The
indicator set is a small config array (`WB_INDICATORS` in `api/markets-hub.js`)
specifically so more indicators can be added later without restructuring anything —
adding one means one new array entry server-side plus a matching blurb in
`window.SCERE_COUNTRY_INDICATOR_COPY` (`learn-content.js`).

**Real fee comparison table:** rendered inline after the Expense Ratios lesson from
`fund-facts.js` — issuer, index tracked, and expense ratio for every ETF this app
tracks. This data is deliberately *not* live-fetched: expense ratios change rarely
(at most once every year or two), and no free API reliably exposes them (Alpha
Vantage doesn't carry the field at all; the providers that do mostly gate it behind a
paid tier). So each entry was pulled directly from the fund issuer's own official
page, dated, and links back to that source — curated with citations, same "no
fabrication" bar as everything else, just via manual sourcing instead of a live call
since this particular field doesn't need to be live.

**Dollar-cost-averaging calculator:** rendered inline after the Dollar-Cost Averaging
lesson. Pick a fund, a monthly amount, and a lookback window; it fetches real monthly
dividend-adjusted price history via `/api/adjusted-history` (Alpha Vantage
`TIME_SERIES_MONTHLY_ADJUSTED`, same key as everything else, cached for a day since
monthly data doesn't need fresher-than-daily fetching) and computes what that
contribution schedule would actually have grown to — shares bought each month at that
month's real adjusted close, summed, valued at the final month's price. This is a
real historical calculation, not a projection: the result panel says so explicitly,
and states plainly that past performance doesn't guarantee future results, framed as
a continuation of the Investing vs. Gambling lesson's point about realistic
expectations, not just as legal boilerplate.

**Scope note:** the ETF list was deliberately expanded (VOO, four sector ETFs, two
dividend ETFs — see `instruments.js`) specifically to give this curriculum real
instruments to point to for the diversification and dividend lessons. Individual
stocks and crypto remain out of scope for now (see "What's not built yet" below) —
this was an explicit decision, not an oversight, and the curriculum's own dividend and
diversification lessons work entirely through diversified ETFs rather than picking
individual companies.

**Read-aloud:** built for a real gap in the target audience — many people this app is
meant to reach aren't strong readers or are non-literate, and a text-only curriculum
quietly excludes them. Uses the browser's built-in [Web Speech
API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (`speechSynthesis`)
— free, no API key, no server round-trip, no added cost, works on most modern phone
and desktop browsers. Two entry points: a page-level "Listen to this page" bar (with
Pause/Stop and a Slow/Normal/Fast speed selector, persisted via `localStorage`) and a
"🔊 Listen" button on every individual lesson card that reads just that lesson. Each
title/key-idea/paragraph is spoken as its own utterance and visually highlighted while
it plays, so a listener can follow along on-screen even without reading fluently. Only
lesson prose is queued — the fee table and DCA calculator are numbers and form inputs,
not something to read aloud, so they're deliberately excluded. If a browser doesn't
support speech synthesis, all read-aloud UI hides itself automatically and the page
works exactly as before (no error shown — reading it yourself still works fine).
Scoped to `learn.html` only, not the manifesto, per the original request. **Known
limitation, documented honestly rather than overpromised:** some iOS Safari versions
have unreliable `pause()`/`resume()` behavior in the Web Speech API — Stop is always
offered alongside Pause so a stuck pause never traps the user without a way out.

## Get Rich Slow manifesto

`manifesto.html` (source: `MANIFESTO.md`) is a short, public-facing article, not a
product feature — meant to be linkable and shareable on its own (social bios, ad
landing pages, etc.), which is why it exists as both a standalone markdown file and
an in-app page using the same dark-card visual language as the rest of the app.

**Why it exists now, not later:** the app's owner described a growth plan involving
regular content, social distribution (Facebook/TikTok/Instagram), and eventually
advertising or sponsorship revenue once there's an engaged audience. Before any of
that gets built, this document nails down what the app is actually for in writing —
long time horizons, real diversified fee-aware investing, explicitly *not*
gambling-shaped "get rich quick" behavior — so that growth and monetization decisions
later get measured against a standard that was set before there was money on the
table, not after.

**The pay-to-play line:** the manifesto includes an explicit, public commitment never
to place a specific fund, stock, or "opportunity" in front of a user because a company
paid for that placement, as opposed to because the data supports it. This directly
addresses a real tension in the stated growth plan: "sell advertisements and maybe get
sponsored by investment companies" is a fundamentally different thing depending on
*what* is being sponsored. Generic display advertising (unrelated to which fund gets
recommended) doesn't threaten this line. A sponsor's fund getting preferential
placement in the fee-comparison table, the Decision Engine, or a "best opportunity"
call would. See the conversation this was built from for the fuller reasoning —
short version: an app whose Lesson 1 warns users to distrust paid promotion cannot
also quietly sell paid promotion without becoming the thing it warns against.

## What's not built yet (see the weather app's PRO-FEATURES-ROADMAP.md for the pattern to follow)

This is deliberately an MVP — the single-page forecast + news screen only, matching
what was scoped. Not built in this pass, same "don't build it before there's a real
decision behind it" discipline the weather app's roadmap docs used:

- **Real Pro paywall/payment.** The modal is UI-only. Wiring a real one (Stripe is the
  natural fit for a US-facing finance app, unlike the weather app's WhatsApp/mobile-money
  flow) is a follow-up, not assumed here.
- **Accounts / saved multi-instrument watchlist.** The weather app's org-accounts
  Supabase layer isn't ported. Today's app supports one saved instrument via
  localStorage, same scope as the weather app's pre-Phase-4 single-city model.
- **Push/price alerts.** No background job, no push infrastructure — same gap the
  weather app had before its Phase 6 notes.
- **Individual stock/crypto support.** Explicitly deferred, not ruled out — the stated
  long-term direction is indices/ETFs first, individual stocks and crypto "eventually."
  Extending to single-name equities or crypto is straightforward when that's decided
  (add entries to `instruments.js`, likely Financial Modeling Prep for company
  fundamentals and a different API for crypto) but not done here.
- **Broker/platform access.** The Learn section explains why ETFs are a sound way in,
  but doesn't yet answer "and how do I actually buy one from where I am" — many major
  US brokers don't accept accounts from every country, and the real answer depends on
  the specific country/countries this app's users are in. Deliberately deferred, not
  forgotten.
- **Legal/compliance review.** The disclaimers here are a good-faith engineering
  attempt at the same transparency bar the weather app held itself to, not a
  substitute for actual legal review — get a real compliance/legal read before this
  goes live publicly, especially before any Pro tier collects money attached to
  "market context" content.

## Files

- `index.html`, `app.js`, `instruments.js`, `market-advisories.js`, `styles.css` — the app
- `manifest.json`, `sw.js` — PWA shell
- `api/markets-hub.js` — consolidated serverless endpoint (quote/history/adjusted-history/macro/fx/news/countries/countryIndicators)
- `vercel.json` — rewrites + no-cache headers for the app shell
- `privacy-policy.html` — plain-language privacy summary
- `FORK-NOTES.md` — what changed from the weather app and why
- `fx-intelligence.html`, `fx-intelligence.js` — FX Intelligence Desk page
- `scripts/parse-fx-report.js` — markdown → JSON parser for the daily FX dashboard report
- `data/fx-reports/` — parsed report data (`latest.json`, `index.json`, `history/*.json`),
  kept current by the `fx-report-app-sync` scheduled task
- `daily-report.html`, `daily-report.js` — Daily Dashboard page: the report's own
  original HTML export shown in an iframe, unparsed
- `scripts/sync-daily-dashboard.js` — copies `fx-dashboard-YYYY-MM-DD.html` files as-is
  into `data/daily-dashboard/`
- `data/daily-dashboard/` — raw report HTML (`latest.html`, `index.json`, `history/*.html`)
- `learn.html`, `learn.js`, `learn-content.js`, `fund-facts.js` — Learn section: beginner
  curriculum, real fee comparison table, dollar-cost-averaging calculator, "Your
  country at a glance" (World Bank data, all countries), and Web Speech API
  read-aloud (page-level + per-lesson)
- `manifesto.html`, `MANIFESTO.md` — Get Rich Slow manifesto (in-app page + shareable source)
