# Forex Track — Chapter 2, Lesson 6: Price Action — Trading From the Chart Alone

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what price action trading is, and why its core claim follows directly from Lesson 1
- Read the basic price-action toolkit: support and resistance, market structure, and candlestick patterns
- Describe the genuine, forex-specific evidence that support and resistance levels carry real predictive information — and the order-flow reason why
- Judge candlestick-pattern claims honestly, including why two studies of the same era reached opposite conclusions

---

## 1. What Price Action Actually Is

Every lesson in this chapter so far has added a tool on top of the chart: moving averages, MACD, Bollinger Bands, RSI, Fibonacci levels. Price action trading goes the other way. It strips all of that off and reads the raw price movement directly.

:::definition
**Price Action** — An approach to trading that bases decisions on the movement of price itself — its highs, lows, and the shapes it forms — without using indicators derived from that price.
:::

:::definition
**Naked Chart** — A price chart carrying no indicators at all: just the candles, and often a few hand-drawn support and resistance lines. The name signals what has been removed.
:::

The practitioner slogan for this school is "price is king." Its followers argue that indicators lag, clutter the screen, and distract from the only thing that actually settles a trade — the price. So they trade from a naked chart instead.

Here is the honest part, and it connects straight back to Lesson 1. You learned there that an indicator can only ever highlight something already visible in price, because every indicator is computed from price and nothing else. Price action traders take that same fact to its logical end: if the indicator only echoes the price, read the price directly and skip the echo. The philosophy is not mystical. It is the Lesson 1 principle, followed one step further.

:::warning
"Price is king" is itself a claim, and this course does not accept claims because they sound confident. Reading a naked chart removes indicator clutter, but it does not remove the hard problem — deciding what the price is likely to do next. The rest of this lesson tests where that decision has real evidence behind it and where it does not.
:::

---

## 2. The Price-Action Toolkit

Price action reading rests on three things you have largely met already. This lesson assembles them into one method rather than re-teaching them.

**Support and resistance.** You met these in Foundations Chapter 3, Lesson 1: support is a level where falling prices have repeatedly reversed upward, and resistance is a level where rising prices have repeatedly reversed downward. On a naked chart these levels are the primary map. A price-action trader marks them and watches how price behaves as it approaches.

**Market structure.** This is just the shape of the trend, also from Foundations Chapter 3: an uptrend is a series of higher highs and higher lows, a downtrend a series of lower highs and lower lows. Each recent high or low is a swing point — a local peak or trough. When price stops making higher highs and starts making lower lows, the structure has shifted. That shift, read from the bare chart, is the price-action trader's core signal.

**Candlestick patterns.** These are the finest-grained tool in the kit.

:::definition
**Candlestick Pattern** — A short sequence of one to three candlesticks — such as a pin bar, an engulfing pair, or a morning star — claimed to signal a likely reversal or continuation in price.
:::

Note the difference from the candlestick *chart* you already know: the chart is the display format, while a candlestick *pattern* is a specific claim that a particular little shape predicts what comes next. That claim is exactly the kind this course insists on testing rather than repeating — which is Sections 3 and 4.

![Diagram of a naked candlestick chart bouncing at a round-number support level, with the order-flow mechanism annotated, above a verdict strip contrasting the strong forex-specific evidence for support and resistance against the contested evidence for candlestick patterns](../images/forex-ch2-price-action.svg)

:::example
A naked-chart trade reads like this. On the 4-hour EUR/USD chart, price has twice reversed upward near 1.0975 — that is support. Price falls to it a third time and forms a bullish reversal candle. A price-action trader enters long at 1.1005 with a stop just below the level at 1.0975 — a distance of 30 pips (1.1005 − 1.0975 = 0.0030). No indicator was used; the decision came from the level and the candle alone. Whether that decision has an edge is the question the evidence has to answer.
:::

---

## 3. Where the Evidence Is Genuinely Strong: Support and Resistance

This is the part of price action with the best academic support, and — unusually for this course — the strongest evidence is forex-specific rather than borrowed from stock markets.

:::example
Osler (2000), published in the Federal Reserve Bank of New York's Economic Policy Review, tested the support and resistance levels that six real forex firms published to their customers. The finding was positive: the levels genuinely helped predict where intraday exchange-rate trends would be interrupted. The predictive power was not uniform — it was stronger for dollar-yen and dollar-pound than for dollar-mark, and it varied by firm — but for most firms it lasted at least five business days after the levels were published.
:::

That is real, measured evidence that a core price-action tool carries information. But evidence that something works is more trustworthy when there is also a reason *why* it works. Osler supplied that too.

:::example
Osler (2003), published in The Journal of Finance, examined the actual order books behind the market. Stop-loss and take-profit orders turned out to be strongly clustered at round numbers — almost 10 percent of all such orders sat at rates ending in "00," such as 1.1000. Those round numbers are exactly the levels traders draw as support and resistance. Take-profit orders bunched at a level push price back from it, which is why trends reverse at support and resistance. Stop-loss orders bunched just beyond it accelerate price once the level breaks, which is why a decisive break tends to run.
:::

:::definition
**Order Clustering** — The tendency for many traders' stop-loss and take-profit orders to pile up at the same round-number price levels, making those levels act as real support and resistance.
:::

This is a satisfying result because it is not circular. The levels are not self-fulfilling magic; they work because of a concrete, measurable feature of how orders (Chapter 1, Lesson 7) are actually placed. Support and resistance earn their place on the naked chart.

:::warning
Real predictive power is not certainty. Osler's levels predicted reversals better than chance, not every time — and the strength varied by pair. Treat a support or resistance level as raising the odds of a reversal, not guaranteeing one. This is the same honesty Foundations Chapter 3 applied to these levels: a probability, never a wall.
:::

---

## 4. Where the Evidence Gets Shaky: Candlestick Patterns

Candlestick patterns are the most heavily marketed part of price action, and they are where the evidence is weakest and most contested. Two well-known studies show the problem clearly.

:::example
Caginalp and Laurent (1998), in Applied Mathematical Finance, tested candlestick reversal patterns on S&P 500 stocks from 1992 to 1996 and found them profitable — a return of roughly 0.9 percent over a two-day holding period, a result they reported as strongly significant. Eight years later, Marshall, Young and Rose (2006), in the Journal of Banking & Finance, tested candlestick strategies on Dow Jones stocks over 1992 to 2001 using a bootstrap method and found no value at all.
:::

Two careful studies, major US stocks, overlapping years, opposite conclusions. How? A large part of the answer is methodology — and in particular the exit rule. Caginalp and Laurent closed each trade at an averaged price over a fixed short holding period; Marshall, Young and Rose tested differently. The pattern entry was similar; the rule for *getting out* differed, and the profitability flipped with it.

:::warning
You have seen this exact trap before. In Lesson 5, Sullivan, Timmermann and White showed that a trading rule can look profitable purely because it was the best-fitting choice among many — the data-snooping problem. Candlestick results that hinge on which exit rule you happen to pick are that same warning in a new place. If a strategy's profit appears or vanishes depending on an arbitrary exit choice, the profit was never solid ground.
:::

None of this means candlestick reading is worthless. It means the confident claims — "this three-candle shape predicts reversals" — rest on far thinner and more contested evidence than the support-and-resistance core. The wider technical-analysis literature is mixed in the same honest way: Brock, Lakonishok and LeBaron (Lesson 1) found real predictive ability in moving-average rules on a century of Dow data, while the forex-specific Ghanem et al. study you met in Foundations Chapter 3 found technical rules do predict currency moves. Support has a mechanism and forex-specific evidence; candlestick patterns have neither at the same strength. Weight them accordingly.

:::warning
Finally, remember what no chart-reading skill can do. When the Swiss National Bank abandoned its currency floor in 2015 (Chapter 1, Lesson 7), EUR/CHF gapped straight through every support level on every chart, and no candlestick warned anyone. Price action reads the normal market well at its best; it offers no protection against the fat-tailed jumps that do the most damage. That is why risk management, not chart-reading, remains the thing that keeps you in the game.
:::

---

## What to Look For

- Is the level you are trading a genuine round number or repeatedly-tested price, where orders actually cluster — or a line you drew after the fact to fit what already happened?
- Are you treating a support or resistance level as raising the odds of a reversal, or as a guarantee? Only the first is supported by the evidence.
- For a candlestick pattern, ask what happens to its edge if you change the exit rule. If the edge is fragile to that, be skeptical.
- Have you set your stop and size for the case where the level simply breaks — including a violent gap that no chart could have flagged?

---

## Practice / Quiz

1. According to Osler's forex research, why do support and resistance levels tend to work?
   - A) The levels are self-fulfilling magic with no real cause
   - B) Stop-loss and take-profit orders cluster at round-number levels, so price genuinely reacts there
   - C) Indicators confirm them
   - D) Central banks defend those exact prices

   **Correct: B.** Osler (2003) found orders bunch at round numbers used as support and resistance — take-profit orders reverse price at the level, stop-loss orders accelerate it once broken. The levels have a concrete order-flow cause, not a mystical one.

2. Two studies tested candlestick patterns on major US stocks over overlapping periods and reached opposite conclusions on profitability. What does this best illustrate?
   - A) One study was simply fraudulent
   - B) Candlestick patterns always work
   - C) A result that flips with the exit rule chosen is fragile — the same data-snooping caution from Lesson 5
   - D) Forex and stocks are identical markets

   **Correct: C.** Caginalp and Laurent (1998) found candlesticks profitable; Marshall, Young and Rose (2006) did not, largely because of differing methodology including the exit rule. An edge that depends on an arbitrary exit choice is exactly the fragility Lesson 5 warned about.

3. True or False: because indicators are computed from price, a price-action trader who reads the naked chart is looking at less information than an indicator user.

   **Correct: False.** From Lesson 1, an indicator can only highlight what is already in price — it adds no information price does not contain. The price-action trader is reading the same underlying information directly, not less of it.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Price Action | Trading from the movement of price itself, without indicators derived from it. |
| Naked Chart | A price chart with no indicators — just candles and drawn levels. |
| Candlestick Pattern | A one-to-three-candle shape claimed to signal a reversal or continuation. |
| Order Clustering | The bunching of stop-loss and take-profit orders at round-number levels, which makes those levels act as support and resistance. |

---

*Coming next: Chapter 3 — Risk Management for Forex Traders. Lesson 1 attaches real numbers to everything Foundations Chapter 2 taught about risk: how stop-loss distance, account risk percentage, and pip value combine into the one position-sizing calculation every forex trade depends on.*
