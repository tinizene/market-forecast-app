# Fork notes: Scere Forecasts (weather) → Scere Markets (finance)

What this fork kept, what it changed, and why — for whoever picks this up next.

## Kept as-is

- Overall visual language: dark theme, card system (`.advisory-card`, `.row-card`,
  `.paywall-card`), Inter font, Tailwind CDN (no build step), gradient background.
- PWA shell pattern: `manifest.json` + `sw.js` with network-first app shell and
  network-only API calls.
- Consolidated serverless function pattern (`api/markets-hub.js` mirrors
  `weather-hub.js`/`pro-features-hub.js`'s `fn=` query-param routing to keep
  Vercel's per-deployment function count low).
- The RSS-aggregator pattern (`handleNews`) is a near-literal port of the weather
  app's `handleFarmingNews` — same XML scraping, same per-feed timeout, same item cap
  — pointed at financial feeds instead of agricultural ones.
- The "derive decision cards from data actually fetched, disclose the method,
  disclaim clearly" discipline that `advisories.js` held itself to. `market-advisories.js`
  follows the same rule: every card cites what it's computed from.

## Changed, and why

- **Location picker → instrument picker.** `countries.js`/`country-cities.js` (53+
  countries, hundreds of cities) became `instruments.js` (9 instruments across 3
  types). Much smaller because there's no equivalent to "every city has weather" —
  each instrument needed real, sourced data, so the list only grew as far as sourcing
  actually supported.
- **Open-Meteo (keyless) → Alpha Vantage (free key required) + Frankfurter (keyless).**
  The weather app could call Open-Meteo directly from the browser because it needs no
  key. No equivalent free+keyless+reliable source exists for equity/rate data — Stooq
  and Yahoo Finance's unofficial endpoints were tested and are unreliable/blocked in
  practice (see commit history / dev notes if this matters later). Alpha Vantage was
  chosen as the most standard, genuinely-free (with signup), well-documented option,
  including dedicated economic-indicator endpoints (`TREASURY_YIELD`,
  `FEDERAL_FUNDS_RATE`) that made "macro" scope achievable without a second provider.
  FX kept keyless via Frankfurter (ECB data), matching Open-Meteo's original
  no-friction bar wherever the data supports it.
- **No raw index tick → ETF proxy, disclosed.** "The S&P 500" isn't purchasable data
  from a free API; SPY (the ETF) is. This is disclosed in the UI (`proxyNote` on each
  instrument), not silently substituted.
- **Weather advisories (flood/heat/storm risk, farming decisions) → market advisories
  (trend/volatility/momentum/range).** The weather app's advisory engine could make
  fairly confident claims (a flood-risk classification from real precipitation
  thresholds) because the underlying physical process is well understood and the
  claims are low-stakes to get slightly wrong. Investment signals are a different risk
  category entirely — a wrong "buy" signal has real financial consequences and
  regulatory implications most jurisdictions take seriously. This fork intentionally
  stopped short of that: cards report neutral, verifiable statistics (moving-average
  position, realized volatility, % change, range position) rather than
  buy/sell/hold calls, and disclaim explicitly and repeatedly.
- **Farming-news feed → market-newsletter feed.** Same code pattern, different feed
  URLs (Investing.com Fundamental Analysis + Stock Market News, Federal Reserve press
  releases, WSJ Markets). This is also standing in for "analyst consensus data" per
  the original brief — see README.md's data-sources section for why real
  price-target/rating consensus wasn't fabricated instead.
- **Pro tier: WhatsApp/mobile-money → not wired.** The weather app's manual
  WhatsApp-code Pro unlock made sense for its Liberia market; it doesn't for a
  US/global finance app. Rather than guess at a payment flow, the Pro modal ships as
  UI-only with a clear note, leaving the actual choice (Stripe is the obvious
  candidate) to whoever owns that product decision.
- **Not ported at all (see README.md "What's not built yet"):** org accounts/Supabase,
  push notifications, prediction-accuracy logging, i18n, voice playback, the WhatsApp
  bot. All of these were real, deliberate scope decisions in the weather app's own
  roadmap docs, not defaults to blindly copy into a different product with different
  economics and a different (much higher) compliance bar.
