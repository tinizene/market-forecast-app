// Instrument catalog — plays the role countries.js / country-cities.js played in the
// weather app (the thing the picker is built from). Kept as plain global data, no
// build step, consistent with the rest of this fork's dependency-free architecture.
//
// Three data "shapes" because macro/rates and FX aren't quoted the same way equities
// are — see api/markets-hub.js for how each type is actually fetched:
//   - 'equity_index': quoted via a highly-liquid ETF proxy (no free API gives a raw
//     index tick reliably) — e.g. SPY tracks the S&P 500. This is disclosed in the UI,
//     not hidden.
//   - 'macro': a published economic series (Treasury yield, Fed funds rate) from
//     Alpha Vantage's economic-indicators endpoints — real published data, not a proxy.
//   - 'fx': currency pairs from Frankfurter (ECB reference rates), no API key needed.

window.SCERE_INSTRUMENTS = [
  {
    id: 'sp500',
    label: 'S&P 500',
    group: 'Indices',
    type: 'equity_index',
    symbol: 'SPY',
    proxyNote: 'Priced via SPY, the ETF that tracks the S&P 500 — free data sources don’t offer the raw index tick.',
  },
  {
    id: 'nasdaq100',
    label: 'Nasdaq-100',
    group: 'Indices',
    type: 'equity_index',
    symbol: 'QQQ',
    proxyNote: 'Priced via QQQ, the ETF that tracks the Nasdaq-100.',
  },
  {
    id: 'dow',
    label: 'Dow Jones Industrial Average',
    group: 'Indices',
    type: 'equity_index',
    symbol: 'DIA',
    proxyNote: 'Priced via DIA, the ETF that tracks the Dow.',
  },
  {
    id: 'gold',
    label: 'Gold',
    group: 'Indices',
    type: 'equity_index',
    symbol: 'GLD',
    proxyNote: 'Priced via GLD, the ETF that tracks the spot gold price.',
  },
  {
    id: 'sp500-lowfee',
    label: 'S&P 500 (lower-fee)',
    group: 'Indices',
    type: 'equity_index',
    symbol: 'VOO',
    proxyNote: 'Priced via VOO, Vanguard’s S&P 500 ETF — tracks the same index as SPY at a lower expense ratio. See the Learn section for why that fee gap matters over time.',
  },
  // Sector ETFs — added so the Learn section's "diversification by industry" lesson
  // and "best-performing ETFs by sector" lists have real, live-quoted instruments to
  // point to, not just the four broad/macro ones above. Each still fetched the same
  // way as SPY/QQQ/DIA/GLD (equity_index proxy via Alpha Vantage) — no new provider.
  {
    id: 'sector-tech',
    label: 'Technology Sector',
    group: 'Sector ETFs',
    type: 'equity_index',
    symbol: 'XLK',
    sector: 'Technology',
    proxyNote: 'Priced via XLK, which tracks the technology companies in the S&P 500.',
  },
  {
    id: 'sector-energy',
    label: 'Energy Sector',
    group: 'Sector ETFs',
    type: 'equity_index',
    symbol: 'XLE',
    sector: 'Energy',
    proxyNote: 'Priced via XLE, which tracks the energy companies in the S&P 500.',
  },
  {
    id: 'sector-financials',
    label: 'Financials Sector',
    group: 'Sector ETFs',
    type: 'equity_index',
    symbol: 'XLF',
    sector: 'Financials',
    proxyNote: 'Priced via XLF, which tracks the financial companies in the S&P 500.',
  },
  {
    id: 'sector-healthcare',
    label: 'Health Care Sector',
    group: 'Sector ETFs',
    type: 'equity_index',
    symbol: 'XLV',
    sector: 'Health Care',
    proxyNote: 'Priced via XLV, which tracks the health care companies in the S&P 500.',
  },
  // Dividend-focused ETFs — for the Learn section's dividend lesson. Real, well-known,
  // low-fee funds rather than a hand-picked list of individual dividend stocks, which
  // stays out of scope (see FORK-NOTES.md on the individual-stock scope decision).
  {
    id: 'dividend-schd',
    label: 'Schwab US Dividend Equity ETF',
    group: 'Dividend ETFs',
    type: 'equity_index',
    symbol: 'SCHD',
    proxyNote: 'Tracks the Dow Jones U.S. Dividend 100 Index — US companies with a sustained history of paying dividends, screened for financial strength.',
  },
  {
    id: 'dividend-vym',
    label: 'Vanguard High Dividend Yield ETF',
    group: 'Dividend ETFs',
    type: 'equity_index',
    symbol: 'VYM',
    proxyNote: 'Tracks the FTSE High Dividend Yield Index — a broad basket of US companies with above-average dividend yields.',
  },
  {
    id: 'ust10y',
    label: 'US 10-Year Treasury Yield',
    group: 'Rates',
    type: 'macro',
    macroFn: 'TREASURY_YIELD',
    maturity: '10year',
    interval: 'daily',
    unit: '%',
  },
  {
    id: 'ust2y',
    label: 'US 2-Year Treasury Yield',
    group: 'Rates',
    type: 'macro',
    macroFn: 'TREASURY_YIELD',
    maturity: '2year',
    interval: 'daily',
    unit: '%',
  },
  {
    id: 'fedfunds',
    label: 'US Federal Funds Rate',
    group: 'Rates',
    type: 'macro',
    macroFn: 'FEDERAL_FUNDS_RATE',
    interval: 'monthly',
    unit: '%',
  },
  {
    id: 'eurusd',
    label: 'EUR / USD',
    group: 'FX',
    type: 'fx',
    base: 'EUR',
    quote: 'USD',
  },
  {
    id: 'gbpusd',
    label: 'GBP / USD',
    group: 'FX',
    type: 'fx',
    base: 'GBP',
    quote: 'USD',
  },
  {
    id: 'usdjpy',
    label: 'USD / JPY',
    group: 'FX',
    type: 'fx',
    base: 'USD',
    quote: 'JPY',
  },
];
