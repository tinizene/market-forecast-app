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

**Update:** the app is now deployed to Vercel, and this local-only limitation has been
addressed by a separate publishing pipeline — see "Publishing reports publicly" below.
`data/fx-reports/` (this app's own internal data) and `reports/` (the public,
password-gated pages meant for sharing) are two different things: the former still only
updates locally via `fx-report-app-sync`, while the latter is explicitly pushed to git so
Vercel serves it.

## Publishing reports publicly (Vercel, password-gated)

A third scheduled task, `fx-report-publish`, runs after `fx-report-app-sync` and copies
that day's already-generated `fx-dashboard-YYYY-MM-DD.html` from the local FX-Reports
folder into this repo's `reports/` folder, then commits and pushes. Vercel's own
GitHub integration (already connected — see below) picks up the push and redeploys
automatically, so there's no separate deploy step to run.

**What gets published, and where:**
- `reports/YYYY-MM-DD.html` — each day's report, byte-identical to the local `.html` file
- `reports/latest.html` — always overwritten to mirror the most recent report, so people
  can bookmark one stable link instead of a dated one
- `reports/manifest.json` — the list of published dates, read by `reports/index.html` to
  render the list
- `reports/index.html` — a simple listing page (`/reports` on your deployed URL) linking
  to `latest.html` and every dated report

**Access control:** `middleware.js` at the repo root gates everything under `/reports`
behind a single shared HTTP Basic Auth username/password (not bank-grade security — good
enough to keep casual visitors and search engines out, not a determined attacker). Set it
up **on every Vercel project connected to this repo** (see the note below — there are
currently two):

1. Vercel dashboard → the project → Settings → Environment Variables
2. Add `REPORTS_PASSWORD` = a password you choose and share with your students
3. Optionally add `REPORTS_USER` (defaults to `student` if not set)
4. Redeploy (or just push again — either picks up new env vars)

If `REPORTS_PASSWORD` isn't set, the middleware fails **closed** — it blocks access with
an error rather than silently leaving reports open to the public.

**Known issue as of writing: two Vercel projects are both connected to this same GitHub
repo** (`finance-app` and `market-forecast-app-ovoo`), so every push deploys to both,
meaning the reports will appear at two different URLs. This still works, but it's
wasteful and confusing — worth going into the Vercel dashboard and deleting one of them
once you've confirmed which URL you actually want to share. Whichever you keep, remember
to set `REPORTS_PASSWORD` on it (env vars aren't shared between separate projects even if
they deploy the same repo).

## Cloud-native report generation (no local machine required)

The pipeline above (`daily-fx-dashboard` + `fx-report-app-sync`, both Cowork scheduled
tasks) only fires reliably when the machine running Cowork is on — in practice this
meant missed or late runs on mornings the laptop wasn't awake yet. `scripts/generate-fx-report.js`
plus `.github/workflows/daily-fx-report.yml` is a self-contained replacement that runs
entirely on GitHub's own cloud runners instead, with no dependency on any local machine.

**What it does, in one run:** calls the Anthropic API directly (model + the server-side
`web_search` tool) with a reconstruction of the report's master prompt and asks for the
**markdown only**, writes it to `reports-source/`, re-runs the existing
`scripts/parse-fx-report.js` unchanged so `data/fx-reports/` ends up in exactly the same
shape either pipeline produces, then renders the dashboard page from that parsed JSON via
`scripts/render-report-html.js`. For continuity (Section 2's performance review, Section
9/15's confidence deltas), it reads the previous run's `data/fx-reports/latest.json` and
feeds a summary of it back into the prompt.

The HTML used to be generated by the model in the same response, on the theory that
asking for both at once stopped the two formats drifting apart. Rendering the page from
the parsed JSON instead makes that drift *impossible* rather than merely discouraged —
there is one source of truth and the page is a view of it — and it stopped paying roughly
11.6k output tokens per run (~44% of output spend) to restate content the markdown
already carried.

**The request is streamed, and that is load-bearing.** A full generation routinely runs
past five minutes; a non-streaming `fetch` aborts with a bare `fetch failed` at Node's
300s `headersTimeout`. That is precisely what happened to every scheduled run once the
account had credit — the model did the work, the API billed for it, and the client hung
up before reading a byte. Streaming makes response headers arrive immediately, so only a
genuinely stalled connection can time out.

**Cost knobs**, all overridable as repo variables: `ANTHROPIC_MAX_TOKENS` (default 32000
— a full report exceeds 16k and silently truncated at the old cap), `ANTHROPIC_TIMEOUT_MS`
(default 20 min, a backstop so a hung connection fails fast instead of occupying a runner
to GitHub's 6h limit), and the `web_search` `max_uses` cap in the script (now 10 — each
search carries a flat fee *and* its results are re-sent as input on every later iteration
of the same turn, so this drives cost super-linearly). Every run logs its token counts,
search count and an estimated dollar cost, so spend shows up in the Actions log rather
than being inferred. Prompt caching is deliberately **not** used: the cache TTL is 5
minutes (or an hour) and this job runs once a day, so every run would be a cold write at
1.25× — strictly worse than not caching.

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
   the workflow file). Confirm `reports-source/` and `data/fx-reports/` get new files
   and the commit/push step succeeds before relying on the 05:00 UTC cron trigger.

**Cron timing caveat:** GitHub Actions cron is UTC-only with no daylight-saving
awareness — see the comment at the top of `daily-fx-report.yml` for what that means for
the actual local fire time across summer/winter.

## Daily Dashboard (retired — consolidated into the FX Intelligence Desk)

There used to be a second page, `daily-report.html`, that iframed the report's own
self-contained HTML export (with its Chart.js gauges). It read a separate
`data/daily-dashboard/` copy of the same daily report, kept in sync by a separate
`scripts/sync-daily-dashboard.js`.

That has been **consolidated onto the single `data/fx-reports/` JSON source.** The FX
Intelligence Desk already renders every section of that report, so the Daily Dashboard
page, its `data/daily-dashboard/` directory, and the sync script were removed, and
`/daily-report.html` now redirects to `/fx-intelligence.html` (see `vercel.json`). The
only thing lost is the original HTML's Chart.js visuals; all the data lives on in the
FX Intelligence Desk.

## Legend / terminology glossary

`legend-content.js` (data) + `legend.js` (generic renderer) is a small shared widget,
included on `fx-intelligence.html`, that answers "what do these colors and words mean?"
right where the confusion happens — no navigating away.
Built after a user question about why every field on a Bearish trade idea (card wash,
headline, and every confidence-breakdown bar) renders in the same red tone.

**What it covers:**

- **The color system:** red = Bearish/Dovish, green = Bullish/Hawkish, amber =
  neutral/mixed. Explicitly notes that color encodes *direction only*, not confidence —
  a 20/100 Bearish idea and a 90/100 Bearish idea are both red.
- **A glossary** of the report's own recurring vocabulary: Bearish, Bullish, Hawkish,
  Dovish, Fade/Fading a trade, High-conviction trade idea, No high-conviction trade /
  No-Trade Zone, the Entry Zone/Target/Stop/Risk:Reward trade-mechanics fields, and the
  five Confidence Breakdown components (Macro/Technicals/Positioning/Sentiment/
  Volatility).

**Why a shared widget, not copy-pasted markup:** both pages show the same underlying
report (parsed vs. raw) using the identical color system and vocabulary — a shared
`legend-content.js` means the two copies can't drift out of sync the way hand-duplicated
markup eventually would. Same content/rendering split as `learn-content.js`/`learn.js`
and `due-diligence-content.js`/`due-diligence.js`, just scoped to one reusable widget
instead of a full page — any future page can add this by including both `<script>` tags
plus a `<div id="legendRoot"></div>` placeholder; `legend.js` no-ops safely if either is
missing.

**Rendered as** a single collapsible `<details>` block (collapsed by default, so it
doesn't push report content down for returning users), positioned right below the
disclaimer banner on both pages. Links out to the Due Diligence hub for anyone who wants
the fuller explanation with our own report used as the worked example — that's the
still-not-built Forex Phase 3 ("Applying It") mentioned above, which this legend is a
lightweight, immediate complement to, not a replacement for.

Verified via a headless jsdom test on both pages: `#legendRoot` placeholder exists,
renders one `<details>` with the correct summary text, exactly 3 color swatches, all 9
glossary terms present, and the Due Diligence link present — run against
`fx-intelligence.html`.

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

## Due Diligence hub

`due-diligence.html`/`due-diligence.js` (content in `due-diligence-content.js`) is a
second, deeper track alongside the core Learn curriculum, linked from a teaser card on
`learn.html`: **"what does due diligence actually look like?"**, answered separately
for three parallel tracks — Forex, Crypto, and Indexes & ETFs — since each has genuinely
different tools, sources, and scam patterns, not one generic checklist stretched across
all three.

**Structure — three columns, three phases each:**

1. **Phase 1: Foundations** — the mindset and the specific, well-documented red flags
   for that asset class (guaranteed-return claims, signal-group incentives, unlicensed
   brokers/exchanges, etc.).
2. **Phase 2: Tools & Sources** — the actual free, public places to check a claim:
   economic calendars, central bank statements, CFTC positioning data, and (for the
   Forex column specifically) a direct pointer to this app's own FX Intelligence Desk
   as one input among several, not a signal to act on blindly.
3. **Phase 3: Applying It** — using Phases 1–2 on a real, live example. For Forex, this
   is planned to be a field-by-field walkthrough of the daily FX dashboard report —
   what each section (regime classification, currency strength scores, confidence
   breakdowns, etc.) is actually based on, in plain language, so the reasoning behind
   our own published conclusions is as checkable as anything else in this hub. **Not
   built yet** — next phase of work, by explicit request.

**Current content status** (why some phases say "Coming soon" instead of showing
articles): built in the order requested — Forex Phases 1–2 are fully written (3
articles: "What Due Diligence Means in Forex," "Red Flags: Signal Groups, Guaranteed
Returns & Broker Scams," and "Reading the Tools: Economic Calendars, Central Bank Rates
& Positioning Data"). Crypto and Indexes & ETFs have their full roadmap shape already
in place — column, tagline, intro, and every phase's planned article titles — so the
complete plan is visible in the app, but the articles themselves aren't written yet.
This was a deliberate choice, not an oversight: `comingSoonNote` on each empty phase in
`due-diligence-content.js` says exactly what's planned, so nothing here overstates how
finished it is.

**Why Crypto is educational-only:** this app tracks zero crypto prices or instruments,
by the same "real, sourced data only" standard as everything else here — there was no
existing free/keyless crypto data source vetted the way Alpha Vantage, Frankfurter, and
the World Bank API were for the rest of the app. The Crypto column exists purely to
teach due diligence (reading a whitepaper, verifying tokenomics, spotting rug pulls and
fake exchanges) — revisit adding live crypto data as a separate decision later, not
bundled into this content work.

**Design notes:**

- Column switcher is three buttons, not a dropdown — with only three tracks, showing
  all three at once (active one highlighted) makes the "three parallel tracks"
  structure legible at a glance, unlike a `<select>` that hides the other two.
- Articles use native `<details>`/`<summary>` for expand/collapse — no custom toggle
  JS needed, and it degrades sensibly (just an inert expandable block) even without
  full script execution.
- Last-viewed column persists via `localStorage` (`scere-due-diligence-column`), same
  pattern as the country selector in Learn.
- Verified via a headless jsdom test: column switcher renders 3 buttons with correct
  `aria-selected` state, Forex renders 3 articles across its 2 written phases plus a
  "Coming soon" note on Phase 3, Crypto renders 0 articles and 3 "Coming soon" notes
  (one per phase), and the selected column persists across a simulated reload.
- Not yet wired into the Web Speech read-aloud feature that `learn.html` has — a
  natural follow-up given the same accessibility rationale applies here, but out of
  scope for this pass.

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

Outstanding work now lives in [ROADMAP.md](ROADMAP.md).

- ~~**Real Pro paywall/payment.**~~ **Built since.** Two Stripe products, enforced
  server-side: the course (one payment, permanent) and the daily ideas (monthly). See
  [PAYMENTS.md](PAYMENTS.md).
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
- `learn.html`, `learn.js`, `learn-content.js`, `fund-facts.js` — Learn section: beginner
  curriculum, real fee comparison table, dollar-cost-averaging calculator, "Your
  country at a glance" (World Bank data, all countries), and Web Speech API
  read-aloud (page-level + per-lesson)
- `due-diligence.html`, `due-diligence.js`, `due-diligence-content.js` — Due Diligence
  hub: three-column (Forex/Crypto/Indexes & ETFs), three-phase roadmap of articles
- `legend.js`, `legend-content.js` — shared color/terminology glossary widget, included
  on `fx-intelligence.html`
- `manifesto.html`, `MANIFESTO.md` — Get Rich Slow manifesto (in-app page + shareable source)
