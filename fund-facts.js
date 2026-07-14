// Curated fund facts (issuer, index tracked, expense ratio) for the ETFs in
// instruments.js. Deliberately NOT live-fetched: expense ratios change rarely (funds
// adjust them at most once every year or two), and no free API reliably exposes them
// — Alpha Vantage doesn't carry expense ratios at all, and the providers that do
// (Financial Modeling Prep, ETFdb, Yahoo Finance) either gate the field behind a paid
// tier or don't offer a stable free endpoint for it. So instead of leaving this data
// out, or worse, guessing, every entry here was pulled from the fund issuer's own
// official page/fact sheet and is dated. Verify current numbers against `source`
// before relying on this for anything beyond the Learn section's illustrative
// comparisons — expense ratios do occasionally change, and this file is not
// auto-refreshed the way price/quote data is.
//
// asOf: the date this entry was last checked against the issuer's own page.

window.SCERE_FUND_FACTS = {
  SPY: {
    name: 'SPDR S&P 500 ETF Trust',
    issuer: 'State Street Global Advisors',
    indexTracked: 'S&P 500',
    expenseRatioPct: 0.0945,
    inceptionYear: 1993,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/library-content/products/factsheets/etfs/emea/factsheet-emea-en_gb-spy.pdf',
  },
  VOO: {
    name: 'Vanguard S&P 500 ETF',
    issuer: 'Vanguard',
    indexTracked: 'S&P 500',
    expenseRatioPct: 0.03,
    inceptionYear: 2010,
    asOf: '2026-07-13',
    source: 'https://investor.vanguard.com/investment-products/etfs/profile/voo',
  },
  QQQ: {
    name: 'Invesco QQQ Trust',
    issuer: 'Invesco',
    indexTracked: 'Nasdaq-100',
    expenseRatioPct: 0.18,
    inceptionYear: 1999,
    asOf: '2026-07-13',
    source: 'https://www.invesco.com/qqq-etf/en/home.html',
  },
  DIA: {
    name: 'SPDR Dow Jones Industrial Average ETF Trust',
    issuer: 'State Street Global Advisors',
    indexTracked: 'Dow Jones Industrial Average',
    expenseRatioPct: 0.16,
    inceptionYear: 1998,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-dow-jones-industrial-average-etf-trust-dia',
  },
  GLD: {
    name: 'SPDR Gold Shares',
    issuer: 'State Street Global Advisors',
    indexTracked: 'Spot gold price (minus trust expenses)',
    expenseRatioPct: 0.40,
    inceptionYear: 2004,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/us/en/intermediary/etfs/spdr-gold-shares-gld',
  },
  XLK: {
    name: 'Technology Select Sector SPDR Fund',
    issuer: 'State Street Global Advisors',
    indexTracked: 'Technology Select Sector Index (S&P 500 tech companies)',
    expenseRatioPct: 0.08,
    inceptionYear: 1998,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/us/en/intermediary/etfs/state-street-technology-select-sector-spdr-etf-xlk',
  },
  XLE: {
    name: 'Energy Select Sector SPDR Fund',
    issuer: 'State Street Global Advisors',
    indexTracked: 'Energy Select Sector Index (S&P 500 energy companies)',
    expenseRatioPct: 0.08,
    inceptionYear: 1998,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/us/en/intermediary/etfs/state-street-energy-select-sector-spdr-etf-xle',
  },
  XLF: {
    name: 'Financial Select Sector SPDR Fund',
    issuer: 'State Street Global Advisors',
    indexTracked: 'Financial Select Sector Index (S&P 500 financial companies)',
    expenseRatioPct: 0.08,
    inceptionYear: 1998,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/us/en/intermediary/etfs/state-street-financial-select-sector-spdr-etf-xlf',
  },
  XLV: {
    name: 'Health Care Select Sector SPDR Fund',
    issuer: 'State Street Global Advisors',
    indexTracked: 'Health Care Select Sector Index (S&P 500 health care companies)',
    expenseRatioPct: 0.08,
    inceptionYear: 1998,
    asOf: '2026-07-13',
    source: 'https://www.ssga.com/us/en/intermediary/etfs/state-street-health-care-select-sector-spdr-etf-xlv',
  },
  SCHD: {
    name: 'Schwab U.S. Dividend Equity ETF',
    issuer: 'Charles Schwab Investment Management',
    indexTracked: 'Dow Jones U.S. Dividend 100 Index',
    expenseRatioPct: 0.06,
    inceptionYear: 2011,
    asOf: '2026-07-13',
    source: 'https://www.schwabassetmanagement.com/products/schd',
  },
  VYM: {
    name: 'Vanguard High Dividend Yield ETF',
    issuer: 'Vanguard',
    indexTracked: 'FTSE High Dividend Yield Index',
    expenseRatioPct: 0.04,
    inceptionYear: 2006,
    asOf: '2026-07-13',
    source: 'https://investor.vanguard.com/investment-products/etfs/profile/vym',
  },
};
