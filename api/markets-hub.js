// Consolidated hub for every server-side endpoint this app needs — same reasoning as
// weather-hub.js / pro-features-hub.js in the app this was forked from: keep Vercel's
// per-deployment function count low by routing everything through one file via a `fn`
// query param, with vercel.json rewriting friendly public paths to it.
//
// Why a server-side proxy at all (unlike Open-Meteo, which the original app called
// straight from the browser): Alpha Vantage requires a secret API key, and this file
// is what keeps that key out of client-side code. Frankfurter and the RSS feeds don't
// need a key, but are still proxied here for a consistent client API and because RSS
// XML parsing belongs server-side, not shipped to every client.

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

function getApiKey(res) {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    res.status(200).json({
      error: 'not_configured',
      message: 'Set ALPHA_VANTAGE_API_KEY in your Vercel project (free key at alphavantage.co/support/#api-key).',
    });
    return null;
  }
  return key;
}

// ---- quote: current price for an equity-index proxy (SPY/QQQ/DIA/GLD) ----
async function handleQuote(req, res) {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { symbol } = req.query;
  if (!symbol) {
    res.status(400).json({ error: 'symbol is required' });
    return;
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Alpha Vantage returned ${upstream.status}`);
    const data = await upstream.json();
    const quote = data['Global Quote'];

    if (!quote || !quote['05. price']) {
      // Alpha Vantage returns 200 with a "Note"/"Information" body when rate-limited
      // or misconfigured, rather than a normal HTTP error — surface that explicitly
      // instead of returning a confusing empty quote to the client.
      res.status(200).json({ error: 'upstream_empty', detail: data.Note || data.Information || 'No quote data returned' });
      return;
    }

    // Alpha Vantage's free tier caps out at 25 requests/day total — a 60s cache meant
    // a handful of visitors browsing a few instruments could exhaust that in minutes.
    // 15 minutes is still far more current than this educational app needs (it's not
    // a trading terminal), and cuts worst-case daily upstream calls roughly 15x.
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.status(200).json({
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat((quote['10. change percent'] || '0%').replace('%', '')),
      previousClose: parseFloat(quote['08. previous close']),
      latestTradingDay: quote['07. latest trading day'],
    });
  } catch (err) {
    console.error('quote failed:', err);
    res.status(502).json({ error: 'Failed to fetch quote', detail: err.message });
  }
}

// ---- history: recent daily closes for an equity-index proxy (trend chart + advisories) ----
async function handleHistory(req, res) {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { symbol } = req.query;
  if (!symbol) {
    res.status(400).json({ error: 'symbol is required' });
    return;
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${apiKey}`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Alpha Vantage returned ${upstream.status}`);
    const data = await upstream.json();
    const series = data['Time Series (Daily)'];

    if (!series) {
      res.status(200).json({ error: 'upstream_empty', detail: data.Note || data.Information || 'No time series returned', points: [] });
      return;
    }

    // Alpha Vantage returns newest-first as an object keyed by date — flatten to an
    // ascending array of { date, close }, the shape the client's trend/advisory code
    // actually wants (same "ascending time series array" convention used throughout
    // the weather app's hourly/daily arrays).
    const points = Object.entries(series)
      .map(([date, ohlc]) => ({ date, close: parseFloat(ohlc['4. close']) }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Daily closes don't change until the next market close — the old 30-minute
    // window bought nothing but extra Alpha Vantage calls against the 25/day cap.
    // 6 hours still refreshes several times during a trading day.
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=43200');
    res.status(200).json({ symbol, points });
  } catch (err) {
    console.error('history failed:', err);
    res.status(502).json({ error: 'Failed to fetch history', detail: err.message });
  }
}

// ---- adjustedHistory: monthly adjusted close + real dividend-per-share history for
// an ETF — powers the Learn section's dollar-cost-averaging calculator and
// dividend-history content. Deliberately a separate, low-frequency endpoint from
// handleHistory: this is "how has this fund actually paid out over the years", not a
// live quote, so long caching is correct and desired, not a compromise. Uses Alpha
// Vantage's TIME_SERIES_MONTHLY_ADJUSTED, which is on the free tier and returns 20+
// years of history in one call — same key as everything else in this file. ----
async function handleAdjustedHistory(req, res) {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { symbol } = req.query;
  if (!symbol) {
    res.status(400).json({ error: 'symbol is required' });
    return;
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Alpha Vantage returned ${upstream.status}`);
    const data = await upstream.json();
    const series = data['Monthly Adjusted Time Series'];

    if (!series) {
      res.status(200).json({ error: 'upstream_empty', detail: data.Note || data.Information || 'No time series returned', points: [] });
      return;
    }

    // "close" here is the raw monthly close (what the market actually traded at);
    // "adjustedClose" backs out subsequent splits/dividends so a $-growth calculation
    // across the full history is apples-to-apples; "dividend" is the real per-share
    // cash dividend paid that month, straight from Alpha Vantage's own adjustment
    // methodology — not a derived or estimated figure.
    const points = Object.entries(series)
      .map(([date, row]) => ({
        date,
        close: parseFloat(row['4. close']),
        adjustedClose: parseFloat(row['5. adjusted close']),
        dividend: parseFloat(row['7. dividend amount']) || 0,
      }))
      .filter((p) => !isNaN(p.adjustedClose))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Monthly data — a day old or a month old makes no practical difference, and this
    // keeps the Learn section's calculator from burning through the 25/day Alpha
    // Vantage quota every time someone opens the page.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');
    res.status(200).json({ symbol, points });
  } catch (err) {
    console.error('adjustedHistory failed:', err);
    res.status(502).json({ error: 'Failed to fetch adjusted history', detail: err.message });
  }
}

// ---- macro: published economic series (Treasury yield, Fed funds rate) ----
const MACRO_FUNCTIONS = new Set(['TREASURY_YIELD', 'FEDERAL_FUNDS_RATE']);

async function handleMacro(req, res) {
  const apiKey = getApiKey(res);
  if (!apiKey) return;

  const { series, maturity, interval } = req.query;
  if (!series || !MACRO_FUNCTIONS.has(series)) {
    res.status(400).json({ error: `series must be one of: ${[...MACRO_FUNCTIONS].join(', ')}` });
    return;
  }

  const params = new URLSearchParams({ function: series, apikey: apiKey });
  if (interval) params.set('interval', interval);
  if (series === 'TREASURY_YIELD' && maturity) params.set('maturity', maturity);

  try {
    const upstream = await fetch(`${ALPHA_VANTAGE_BASE}?${params.toString()}`);
    if (!upstream.ok) throw new Error(`Alpha Vantage returned ${upstream.status}`);
    const body = await upstream.json();
    const rows = body.data;

    if (!Array.isArray(rows)) {
      res.status(200).json({ error: 'upstream_empty', detail: body.Note || body.Information || 'No series data returned', points: [] });
      return;
    }

    // Alpha Vantage's economic-indicator endpoints occasionally emit "." for a date
    // with no reading (e.g. a holiday) — filtered out rather than parsed into NaN.
    const points = rows
      .filter((r) => r.value && r.value !== '.')
      .map((r) => ({ date: r.date, value: parseFloat(r.value) }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Treasury yields settle once a day and the Fed funds rate only moves at FOMC
    // meetings (8x/year) — an hour of caching bought nothing here either.
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=43200');
    res.status(200).json({ series, maturity: maturity || null, points });
  } catch (err) {
    console.error('macro failed:', err);
    res.status(502).json({ error: 'Failed to fetch macro series', detail: err.message });
  }
}

// ---- fx: currency pairs via Frankfurter (ECB reference rates) — no API key needed,
// same "free, keyless, real data" bar the weather app held Open-Meteo to. ----
async function handleFx(req, res) {
  const { base, quote } = req.query;
  if (!base || !quote) {
    res.status(400).json({ error: 'base and quote are required, e.g. base=EUR&quote=USD' });
    return;
  }

  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const fmt = (d) => d.toISOString().split('T')[0];

    const [latestRes, historyRes] = await Promise.all([
      fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`),
      fetch(`https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`),
    ]);

    if (!latestRes.ok || !historyRes.ok) throw new Error('Frankfurter request failed');

    const latest = await latestRes.json();
    const history = await historyRes.json();

    const points = Object.entries(history.rates || {})
      .map(([date, rates]) => ({ date, value: rates[quote] }))
      .filter((p) => typeof p.value === 'number')
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json({
      base,
      quote,
      rate: latest.rates ? latest.rates[quote] : null,
      date: latest.date,
      points,
    });
  } catch (err) {
    console.error('fx failed:', err);
    res.status(502).json({ error: 'Failed to fetch FX data', detail: err.message });
  }
}

// ---- news: RSS aggregator — direct port of the weather app's farming-news pattern
// (same parseFeed/extractTag XML scraping, same per-feed timeout, same item cap),
// pointed at real financial-newsletter/market-commentary feeds instead of ag feeds.
// "Fundamental Analysis" is genuine contributor/analyst commentary (FxPro, Newsquawk,
// named analysts) — the closest free-RSS equivalent to a Seeking Alpha-style
// newsletter digest, not a proprietary price-target feed (no free source for those).
const FEEDS = [
  { name: 'Investing.com — Fundamental Analysis', url: 'https://www.investing.com/rss/market_overview_Fundamental.rss' },
  { name: 'Investing.com — Stock Market News', url: 'https://www.investing.com/rss/news_25.rss' },
  { name: 'Federal Reserve — Press Releases', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
  { name: 'WSJ — Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
];
const ITEMS_PER_FEED = 5;
const TOTAL_ITEMS = 14;
const PER_FEED_TIMEOUT_MS = 5000;

function stripCdata(text) {
  const match = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(text);
  return match ? match[1] : text;
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/<[^>]+>/g, '').trim();
}

function extractTag(itemXml, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(itemXml);
  if (!match) return null;
  return decodeEntities(stripCdata(match[1]));
}

function parseFeed(xml, sourceName) {
  const items = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const itemXml of itemMatches.slice(0, ITEMS_PER_FEED)) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    if (!title || !link) continue;
    const parsedDate = pubDate ? new Date(pubDate) : null;
    items.push({
      title,
      link,
      source: sourceName,
      publishedAt: parsedDate && !isNaN(parsedDate) ? parsedDate.toISOString() : null,
    });
  }
  return items;
}

async function handleNews(req, res) {
  try {
    const results = await Promise.all(
      FEEDS.map(async (feed) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PER_FEED_TIMEOUT_MS);
        try {
          const upstream = await fetch(feed.url, {
            headers: { 'User-Agent': 'ScereMarkets/1.0' },
            signal: controller.signal,
          });
          if (!upstream.ok) return [];
          const xml = await upstream.text();
          return parseFeed(xml, feed.name);
        } catch {
          return [];
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    const allItems = results.flat().sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.status(200).json({ items: allItems.slice(0, TOTAL_ITEMS) });
  } catch (err) {
    console.error('market-news failed:', err);
    res.status(502).json({ error: 'Failed to load market news', items: [] });
  }
}

// ---- countries / countryIndicators: World Bank Indicators API (v2), keyless, free,
// covers every economy the Bank tracks (~217 real countries once the region-level
// "Aggregates" rows the API mixes in are filtered out). Added for the Learn section's
// "Your Country at a Glance" panel — real macro context (inflation, GDP, financial
// inclusion) for whatever country a user is actually investing from, instead of only
// the US-centric instruments the rest of the app tracks. Deliberately built to cover
// every country from day one (not a hardcoded shortlist) and with WB_INDICATORS as a
// small, easy-to-extend config array — the stated plan is to both broaden country
// coverage (already done, it's the Bank's full list) and add more indicators later,
// which just means adding another entry below. ----
const WORLD_BANK_BASE = 'https://api.worldbank.org/v2';

// Each entry: WB indicator code, a plain-language label, the unit to display, and a
// "format" hint the client uses to render it (percent vs. USD vs. plain number).
// Extend this array to pull in more World Bank data later — no other code changes
// needed beyond a matching display case on the client.
const WB_INDICATORS = [
  {
    key: 'inflation',
    code: 'FP.CPI.TOTL.ZG',
    label: 'Inflation (consumer prices)',
    format: 'percent',
    note: 'Annual, published yearly.',
  },
  {
    key: 'gdpPerCapita',
    code: 'NY.GDP.PCAP.CD',
    label: 'GDP per capita',
    format: 'usd',
    note: 'Annual, published yearly.',
  },
  {
    key: 'gdpGrowth',
    code: 'NY.GDP.MKTP.KD.ZG',
    label: 'GDP growth',
    format: 'percent',
    note: 'Annual, published yearly.',
  },
  {
    key: 'financialInclusion',
    code: 'FX.OWN.TOTL.ZS',
    label: 'Adults with a bank or mobile-money account',
    format: 'percent',
    note: 'Global Findex survey data — collected every few years, not annually, so this figure may be older than the others.',
  },
];

// ---- countries: the full World Bank country/economy list, aggregates filtered out.
// Cached for a week — this list changes essentially never. ----
async function handleCountries(req, res) {
  try {
    const upstream = await fetch(`${WORLD_BANK_BASE}/country?format=json&per_page=400`);
    if (!upstream.ok) throw new Error(`World Bank API returned ${upstream.status}`);
    const body = await upstream.json();
    const rows = Array.isArray(body) ? body[1] : null;

    if (!Array.isArray(rows)) {
      res.status(200).json({ error: 'upstream_empty', detail: 'No country list returned', countries: [] });
      return;
    }

    // The API mixes real countries with region/income-level rollups (e.g. "Africa
    // Eastern and Southern") — those have region.value === "Aggregates" and no real
    // capital city; filtered out so the selector only ever shows real countries.
    const countries = rows
      .filter((c) => c.region && c.region.value !== 'Aggregates')
      .map((c) => ({ id: c.id, iso2: c.iso2Code, name: c.name, region: c.region.value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=1209600');
    res.status(200).json({ countries });
  } catch (err) {
    console.error('countries failed:', err);
    res.status(502).json({ error: 'Failed to fetch country list', detail: err.message, countries: [] });
  }
}

// ---- countryIndicators: most-recent-non-null value for each configured indicator,
// for one country. World Bank data is annual (or sparser) and often has a null for
// the latest 1-2 years until that year's survey/report is compiled, so this walks
// each series (most recent first, which is the API's default order) and picks the
// first real value rather than assuming index 0 is populated. ----
async function handleCountryIndicators(req, res) {
  const { country } = req.query;
  if (!country) {
    res.status(400).json({ error: 'country is required, e.g. country=NGA (ISO3 code)' });
    return;
  }

  try {
    const results = await Promise.all(
      WB_INDICATORS.map(async (indicator) => {
        try {
          const url = `${WORLD_BANK_BASE}/country/${encodeURIComponent(country)}/indicator/${indicator.code}?format=json&per_page=20`;
          const upstream = await fetch(url);
          if (!upstream.ok) return { ...indicator, value: null, year: null, countryName: null };

          const body = await upstream.json();
          const rows = Array.isArray(body) ? body[1] : null;
          const withValue = Array.isArray(rows) ? rows.find((r) => r.value !== null && r.value !== undefined) : null;

          return {
            key: indicator.key,
            label: indicator.label,
            format: indicator.format,
            note: indicator.note,
            value: withValue ? withValue.value : null,
            year: withValue ? withValue.date : null,
            countryName: withValue ? withValue.country.value : (rows && rows[0] ? rows[0].country.value : null),
            sourceUrl: `https://data.worldbank.org/indicator/${indicator.code}?locations=${encodeURIComponent(country)}`,
          };
        } catch {
          return { key: indicator.key, label: indicator.label, format: indicator.format, note: indicator.note, value: null, year: null, countryName: null };
        }
      })
    );

    const countryName = results.find((r) => r.countryName)?.countryName || null;

    // Annual data — a day of staleness makes no practical difference, and this keeps
    // repeat visits from re-fetching four series per country every time.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');
    res.status(200).json({ country, countryName, indicators: results });
  } catch (err) {
    console.error('countryIndicators failed:', err);
    res.status(502).json({ error: 'Failed to fetch country indicators', detail: err.message, indicators: [] });
  }
}

module.exports = async function handler(req, res) {
  switch (req.query.fn) {
    case 'quote': return handleQuote(req, res);
    case 'history': return handleHistory(req, res);
    case 'adjustedHistory': return handleAdjustedHistory(req, res);
    case 'macro': return handleMacro(req, res);
    case 'fx': return handleFx(req, res);
    case 'news': return handleNews(req, res);
    case 'countries': return handleCountries(req, res);
    case 'countryIndicators': return handleCountryIndicators(req, res);
    default:
      res.status(400).json({ error: 'Unknown or missing fn query parameter' });
  }
};
