// Advisory engine — the direct counterpart to advisories.js in the weather app this
// was forked from. Same discipline that file held itself to: every card here is
// derived from data actually fetched (Alpha Vantage / Frankfurter), nothing invented
// or presented as a proprietary signal. There is no equivalent here to that file's
// curated agronomy tables (there's no free, honest source for "buy/sell" calls) — this
// is technical/statistical context only, framed as education, not advice.
(function () {
  const DISCLAIMER =
    'Educational market context only, derived from recent price history — not financial advice, ' +
    'and not a recommendation to buy, sell, or hold anything. Data may be delayed and can be wrong. ' +
    'See a licensed financial advisor before making investment decisions.';

  function pctChange(from, to) {
    if (!from) return null;
    return ((to - from) / from) * 100;
  }

  function sma(points, window) {
    if (points.length < window) return null;
    const slice = points.slice(-window);
    const sum = slice.reduce((acc, p) => acc + p.close, 0);
    return sum / window;
  }

  // Daily-return standard deviation over the trailing window, annualized the standard
  // way (×√252 trading days) so it's comparable across instruments regardless of how
  // many raw days went into the sample.
  function annualizedVolatility(points, window) {
    if (points.length < window + 1) return null;
    const slice = points.slice(-(window + 1));
    const returns = [];
    for (let i = 1; i < slice.length; i++) {
      returns.push((slice[i].close - slice[i - 1].close) / slice[i - 1].close);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  function trendBadge(label) {
    if (label === 'up') return { icon: '📈', badgeClass: 'trend-up', word: 'Uptrend' };
    if (label === 'down') return { icon: '📉', badgeClass: 'trend-down', word: 'Downtrend' };
    return { icon: '➡️', badgeClass: 'trend-flat', word: 'Flat / Mixed' };
  }

  // ---- Equity-index-proxy advisories (SPY/QQQ/DIA/GLD) ----
  function equityAdvisories(points) {
    if (!points || points.length < 25) return [];
    const cards = [];
    const last = points[points.length - 1];

    const sma20 = sma(points, 20);
    const sma50 = sma(points, Math.min(50, points.length));
    if (sma20 != null && sma50 != null) {
      let label = 'flat';
      if (last.close > sma20 && sma20 > sma50) label = 'up';
      else if (last.close < sma20 && sma20 < sma50) label = 'down';
      const badge = trendBadge(label);
      cards.push({
        icon: badge.icon,
        badgeClass: badge.badgeClass,
        title: `${badge.word}: price vs. 20/${points.length >= 50 ? '50' : points.length}-day average`,
        detail: `Latest close ${last.close.toFixed(2)} vs. 20-day average ${sma20.toFixed(2)} and ${points.length >= 50 ? '50' : points.length}-day average ${sma50.toFixed(2)}.`,
      });
    }

    const vol20 = annualizedVolatility(points, 20);
    if (vol20 != null) {
      let level = 'Low';
      let badgeClass = 'trend-up';
      if (vol20 >= 25) { level = 'High'; badgeClass = 'trend-down'; }
      else if (vol20 >= 14) { level = 'Moderate'; badgeClass = 'trend-flat'; }
      cards.push({
        icon: '〰️',
        badgeClass,
        title: `${level} recent volatility`,
        detail: `Annualized volatility over the last 20 trading days: ${vol20.toFixed(1)}%.`,
      });
    }

    const change5d = pctChange(points[Math.max(0, points.length - 6)].close, last.close);
    const change20d = pctChange(points[Math.max(0, points.length - 21)].close, last.close);
    if (change5d != null && change20d != null) {
      cards.push({
        icon: change20d >= 0 ? '🟢' : '🔴',
        badgeClass: change20d >= 0 ? 'trend-up' : 'trend-down',
        title: 'Momentum',
        detail: `${change5d >= 0 ? '+' : ''}${change5d.toFixed(1)}% over 5 trading days, ${change20d >= 0 ? '+' : ''}${change20d.toFixed(1)}% over 20 trading days.`,
      });
    }

    const window = points.slice(-Math.min(points.length, 100));
    const high = Math.max(...window.map((p) => p.close));
    const low = Math.min(...window.map((p) => p.close));
    if (high > low) {
      const position = ((last.close - low) / (high - low)) * 100;
      cards.push({
        icon: '📏',
        badgeClass: position >= 66 ? 'trend-up' : position <= 33 ? 'trend-down' : 'trend-flat',
        title: `${window.length}-day range position`,
        detail: `Currently ${position.toFixed(0)}% of the way up its ${window.length}-trading-day range (${low.toFixed(2)}–${high.toFixed(2)}).`,
      });
    }

    return cards;
  }

  // ---- Macro series advisories (Treasury yield, Fed funds rate) ----
  function macroAdvisories(points, unit) {
    if (!points || points.length < 2) return [];
    const cards = [];
    const last = points[points.length - 1];
    const threeBack = points[Math.max(0, points.length - 63)]; // ~3 trading months for daily series

    const delta = last.value - threeBack.value;
    let label = 'flat';
    if (delta > 0.05) label = 'up';
    else if (delta < -0.05) label = 'down';
    const badge = trendBadge(label);

    cards.push({
      icon: badge.icon,
      badgeClass: badge.badgeClass,
      title: `${badge.word} vs. ~3 months ago`,
      detail: `Latest reading ${last.value.toFixed(2)}${unit} on ${last.date}, vs. ${threeBack.value.toFixed(2)}${unit} around ${threeBack.date} (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}${unit}).`,
    });

    return cards;
  }

  // ---- FX advisories ----
  function fxAdvisories(points) {
    if (!points || points.length < 25) return [];
    const cards = [];
    const last = points[points.length - 1];
    const sma20 = sma(points.map((p) => ({ close: p.value })), 20);

    if (sma20 != null) {
      let label = 'flat';
      if (last.value > sma20 * 1.001) label = 'up';
      else if (last.value < sma20 * 0.999) label = 'down';
      const badge = trendBadge(label);
      cards.push({
        icon: badge.icon,
        badgeClass: badge.badgeClass,
        title: `${badge.word}: rate vs. 20-day average`,
        detail: `Latest rate ${last.value.toFixed(4)} vs. 20-day average ${sma20.toFixed(4)}.`,
      });
    }

    const change20d = pctChange(points[Math.max(0, points.length - 21)].value, last.value);
    if (change20d != null) {
      cards.push({
        icon: change20d >= 0 ? '🟢' : '🔴',
        badgeClass: change20d >= 0 ? 'trend-up' : 'trend-down',
        title: '20-day change',
        detail: `${change20d >= 0 ? '+' : ''}${change20d.toFixed(2)}% over the last 20 days of data.`,
      });
    }

    return cards;
  }

  window.SCERE_MARKET_ADVISORIES = {
    DISCLAIMER,
    equityAdvisories,
    macroAdvisories,
    fxAdvisories,
  };
})();
