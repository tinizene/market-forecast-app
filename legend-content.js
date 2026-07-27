// Content for the shared "How to read this page" legend widget (legend.js renders
// it). Included on fx-intelligence.html, which renders the daily FX dashboard
// report, using a consistent color system and trading terminology. Prose only, no
// numbers, same content/rendering split as learn-content.js/learn.js and
// due-diligence-content.js/due-diligence.js.

window.SCERE_LEGEND = {
  colors: [
    {
      swatchClass: 'trend-down',
      label: 'Red',
      description: 'Bearish or Dovish. The idea, currency, or case is betting a price falls (Bearish), or reflects a central bank leaning toward looser policy (Dovish). Color shows direction only — a low-confidence Bearish idea and a high-confidence one are both red.',
    },
    {
      swatchClass: 'trend-up',
      label: 'Green',
      description: 'Bullish or Hawkish. The idea, currency, or case is betting a price rises (Bullish), or reflects a central bank leaning toward tighter policy (Hawkish).',
    },
    {
      swatchClass: 'trend-flat',
      label: 'Amber',
      description: 'Neutral or mixed — used when neither a clear bullish/bearish nor hawkish/dovish read applies.',
    },
  ],
  terms: [
    {
      term: 'Bearish',
      definition: 'Expecting a price to fall. A "Bearish USD/JPY" idea is a bet that USD/JPY goes down — typically expressed as a short position.',
    },
    {
      term: 'Bullish',
      definition: 'Expecting a price to rise. A "Bullish EUR/CHF" idea is a bet that EUR/CHF goes up — typically expressed as a long position.',
    },
    {
      term: 'Hawkish',
      definition: 'A central bank leaning toward tighter policy — higher interest rates, less stimulus. Usually read as supportive for that currency.',
    },
    {
      term: 'Dovish',
      definition: 'A central bank leaning toward looser policy — lower interest rates, more stimulus. Usually read as a headwind for that currency.',
    },
    {
      term: 'Fade / Fading a trade',
      definition: 'Betting against a crowded, already-popular position or move, on the theory that it’s overextended and more likely to reverse or stall than keep running. "Fade the record-crowded short-yen trade" means betting that too many traders are already short yen for the move to extend much further.',
    },
    {
      term: 'High-conviction trade idea',
      definition: 'A specific, leveled idea (entry zone, target, stop) the report is confident enough in — based on its own weighted scoring across Macro, Technicals, Positioning, Sentiment, and Volatility — to present as a concrete scenario rather than a general observation. Still not a directive to trade; see the disclaimer.',
    },
    {
      term: 'No high-conviction trade / No-Trade Zone',
      definition: 'The report explicitly considered an idea and decided it doesn’t meet its own bar for a leveled call — either the setup itself is too fuzzy, or that day’s overall conditions are too risky or uncertain to add fresh exposure. Stated directly rather than forcing a lower-quality idea just to have one.',
    },
    {
      term: 'Entry Zone / Target(s) / Stop (Invalidation) / Risk:Reward',
      definition: 'The mechanics of a leveled trade idea. Entry Zone is the price range the idea is based on. Target(s) are where the idea expects price to go if the thesis plays out. Stop / Invalidation is the level that would prove the idea wrong. Risk/Reward compares the distance to the stop against the distance to the target(s).',
    },
    {
      term: 'Confidence breakdown (Macro / Technicals / Positioning / Sentiment / Volatility)',
      definition: 'The report’s own weighted scoring for a trade idea: Macro (fundamentals and policy, usually the largest weight), Technicals (price action and chart patterns), Positioning (how crowded existing bets already are, from COT-style data), Sentiment (broader market mood), and Volatility (how much movement is currently "normal"). Bar length shows the score for that component; bar color just reflects the idea’s overall Bullish/Bearish direction, not the component’s own quality.',
    },
  ],
};
