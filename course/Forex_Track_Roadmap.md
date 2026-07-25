# Forex Track — Full Chapter Roadmap

*Locked structure as of this point in development. Foundations (Chapters 1–3, universal concepts) is complete and not repeated here — this track builds specifically on top of it. Adjust as real trading transcripts reshape what each lesson actually needs to cover.*

---

## Chapter 1: The Mechanics of a Trade
*Everything you need to understand before a single trade can be placed.*

1. How Traders Profit From Exchange Rates — ✅ drafted
2. Currency Pairs, ISO Codes & Quote Conventions — ✅ drafted
3. Major Currencies, Major Pairs & Cross Pairs — ✅ drafted
4. Bid/Ask Spread & Pips — ✅ drafted
5. Lot Sizes & Position Sizing — ✅ drafted
6. Leverage & Margin — ✅ drafted
7. Order Types & Trade Execution (market, limit, stop — long vs. short revisited in a forex-specific context) — ✅ drafted

**Chapter 1 complete — 7/7 lessons drafted.**

## Chapter 2: Reading the Forex Market
*Builds directly on Foundations Ch3 ("How to Read a Market" + the evidence/skepticism lesson) — this chapter goes deeper into forex-specific tools rather than re-teaching chart basics already covered.*

1. Technical Indicators I — Moving Averages, Crossovers & MACD — ✅ drafted *(restructured from transcripts: MACD taught as the formalized crossover, per the source material's own framing)*
2. Technical Indicators II — Mean Reversion & Levels: Bollinger Bands, RSI & Fibonacci — ✅ drafted *(new lesson: the transcripts covered far more than one lesson could hold; includes the fat-tails caveat and the honest Fibonacci evidence)*
3. Fundamental Analysis — Interest Rates & Central Banks (direct callback to Foundations Ch1's central bank content) — ✅ drafted
4. The Economic Calendar — What to Watch, and When — ✅ drafted
5. Multi-Timeframe Analysis (top-down: start on the highest timeframe, work down — the practitioner mental model we found in the ForexFactory research) — ✅ drafted
6. Price Action — Trading From the Chart Alone *(added from book-list analysis: a distinct practitioner school — "price is king," indicator-free reading — worth one honest lesson including what evidence does and doesn't support it)* — ✅ drafted *(honest split verified at drafting: support/resistance has forex-specific evidence and an order-flow mechanism — Osler 2000 & 2003; candlestick patterns are contested and exit-rule dependent — Caginalp & Laurent 1998 vs Marshall, Young & Rose 2006, tied back to Lesson 5's data-snooping thread)*

**Chapter 2 complete — 6/6 lessons drafted.**

## Chapter 3: Risk Management for Forex Traders
*Builds directly on Foundations Ch2 — this chapter is where those universal principles get actual forex-specific math attached to them.*

1. Position Sizing With Pip Value (the calculation Foundations never covered: stop-loss distance + account risk % + pip value = position size) — ✅ drafted *(goes past Ch1 L5's simplified "$10/pip": computes true pip value across USD-quote, USD-base and cross pairs and any account currency, then re-sizes; anchored to risk of ruin — gambler's ruin + Vince, The Mathematics of Money Management, Wiley 1992)*
2. Margin Calls and Leverage Risk — ✅ drafted *(deepens Ch1 L6: the live account sequence — balance vs equity, free margin, the margin-call vs stop-out thresholds — and effective leverage as the number that actually sets the distance to a call; frames a margin call as a symptom of over-sizing, callback to Ch1 L7 SNB gap and negative balance protection)*
3. Risk-to-Reward Ratio in Practice — ✅ drafted *(the break-even win rate = 1/(1+R); makes Foundations Ch2's "being right ≠ trading well" precise with the three-trader comparison; expectancy itself deferred to Ch4 L2 per the plan)*

**Chapter 3 complete — 3/3 lessons drafted.**

## Chapter 4: Trading Psychology & Building a Plan

1. Trading Psychology — Fear, Greed, and Discipline *(pair the practitioner view with its academic counterpart: behavioral-finance findings on overtrading and the disposition effect — verify at drafting time)* — ✅ drafted *(citations verified live: disposition effect — Shefrin & Statman 1985 (coinage), Odean 1998 (1.5–2x more likely to sell winners); overtrading — Barber & Odean 2000 (most active traders 11.4%/yr vs market 17.9%). Ties disposition effect back to Ch3 L3's Trader C; discipline framed as pre-commitment, not willpower)*
2. Building a Trading Plan — including **expectancy and R-multiples** *(added from book-list analysis: a plan isn't complete without the math of whether a system is net-positive — expectancy = (win rate × avg win) − (loss rate × avg loss). This is the quantitative bridge between Ch4 and everything Foundations Ch2 taught about "being right often ≠ trading well")* — ✅ drafted *(builds the plan as the assembly of prior lessons; expectancy in $ and R, R-multiples, and the long-run-average caveat tying back to Ch3 L1 sizing and Ch2 variance; all arithmetic verified computationally)*
3. Common Beginner Mistakes (and How to Avoid Them) — ✅ drafted *(capstone synthesis: 8 recurring mistakes each mapped to the lesson that already fixes it, plus the pre-trade checklist + trading journal habits; honest ESMA-framed close that removing self-inflicted losses is the realistic goal, not guaranteed profit)*

**Chapter 4 complete — 3/3 lessons drafted.**

## Chapter 5: Real-World Case Studies
*Capstone chapter — walks through actual historical FX market events using everything from Chapters 1–4 together, closing the "what to look for" thread that's run through the entire course since Foundations Chapter 1.*

1. The 2015 Swiss Franc Shock — ✅ drafted *(black-swan floor removal; stops/stop-outs fail in a liquidity vacuum; survivors were small-sized. Facts verified live: FXCM ~$225M client negative balances + ~$300M bailout, Alpari UK insolvency, Everest Capital ~$1B loss, BoE algo study. Ties Ch1 L7, Ch2 L2 fat tails, Ch3 L1/L2)*
2. The Yen Carry Trade Unwind of 2008 — ✅ drafted *(AUD/JPY ~107.80 Oct 2007 → ~55 Oct 2008, ~45% collapse; carry = crash-risk compensation. Reuses the course-verified Menkhoff et al. 2012 plus Brunnermeier/Nagel/Pedersen "Carry Trades and Currency Crashes". Ties Ch2 L3)*
3. The 2016 Sterling Flash Crash — ✅ drafted *(GBP/USD ~6% in ~2 min to a 31-year low ~1.18; BIS Markets Committee report — no single cause: thin liquidity + options hedging + stop cascade + algos. Ties Ch1 L4, Ch3 L2, Ch2 L4)*

**Chapter 5 complete — 3/3 case studies drafted.**

## Chapter 6: Building a Professional Trade Process
*Added following a user-provided professional trade-thesis template (citations independently verified — see note below). This is genuinely advanced material, not beginner content: it assumes working familiarity with carry trades, factor investing, positioning data, and valuation concepts this course hasn't taught yet. It only makes sense placed after Chapters 1–5, once a student has the vocabulary to use it. Kept as a fully separate chapter from Chapter 5 — not merged.*

1. The High-Conviction Trade Thesis — the 6-pillar scoring framework (fundamentals, valuation, catalyst, positioning/sentiment, momentum, carry) and why "I feel strongly" isn't an edge — ✅ drafted *(citations verified live: Asness/Moskowitz/Pedersen 2013 value & momentum, Koijen et al. 2018 carry, Antón/Cohen/Polk best ideas)*
2. Risk, Sizing & the Pre-Mortem — formalizing invalidation levels, reward:risk minimums, and writing exit rules *before* entry, not after — ✅ drafted *(Klein 2007 pre-mortem verified; builds on Ch3 sizing/R:R and Ch1 L7 OCO)*
3. Regime Mapping — Where to Hunt — the market-scanning tool, the rates→FX→credit/equities→commodities→crypto transmission chain, and why "all-quiet" regimes mean the correct position is cash — ✅ drafted *(Liu/Tsyvinski/Wu 2022 crypto factors verified; all-quiet = cash ties to Ch4 overtrading)*
4. Portfolio-Level Discipline — the "best ideas" concentration philosophy (backed by Antón, Cohen & Polk's finding that a manager's highest-conviction pick outperforms the rest of their portfolio by 2.8–4.5%/year), the research funnel, and post-trade review as a standing practice — ✅ drafted *(Antón/Cohen/Polk & Cremers/Petajisto 2009 verified; concentrate conviction not risk; the paid trade-thesis service is mentioned plainly once, at the end of this lesson, per the plan)*

**Note on citations:** spot-checked the central claim (Antón, Cohen & Polk's 2.8–4.5%/year figure) directly against the paper across 6 independent sources, including the exact URL provided — confirmed accurate. The other cited papers (Cremers & Petajisto 2009, Menkhoff/Sarno/Schmeling/Schrimpf, Liu/Tsyvinski/Wu 2022, Koijen/Moskowitz/Pedersen/Vrugt 2018, Asness/Moskowitz/Pedersen 2013) are all well-established, frequently-cited real papers; not yet individually re-verified one by one, but there's no indication of any citation problem here — this document is unusually well-sourced for user-provided material.

**Business model note — this shapes how Chapter 6 gets written:** the plan is that students who complete this chapter but don't want to (or can't) run the full framework themselves on a live trade can get a completed trade thesis *from the platform* as a service — likely a paid offering beyond the course itself. Two things follow from that:
- The teaching content needs to be genuinely complete and honest — the course is what builds trust that the framework is real and rigorous, which is exactly what makes the "we'll do it for you" offer credible rather than a bait-and-switch. Don't hold anything back to create artificial demand for the service.
- Lesson 4 (or a short closing section) should end with a clear, honest bridge: doing this well takes real time and skill-building — for students who want the output without building that skill themselves, that's a service the platform offers. This should be stated plainly once, not repeated as a sales pitch throughout the chapter.


**Chapter 6 complete — 4/4 lessons drafted. The Forex track is COMPLETE: 6 chapters, 26 lessons.**

---

## Future: Advanced Forex Course (separate, post-Chapter 6)

*Derived from analyzing CMC Markets' recommended-books list against our existing roadmap. These topics are genuinely beyond the core course — they'd dilute Chapters 1–6 if forced in, but make a natural second paid tier for students who finish the main track. Important: books are used only as a curriculum-shape check — no content is reproduced from them; every lesson gets built from independently verified sources per the Style Guide's sourcing standard.*

1. **Trend Following & Time-Series Momentum** — the strategy family behind the famous "Turtle Traders" experiment. Academically strong ground: time-series momentum is one of the best-documented effects in the literature (Moskowitz, Ooi & Pedersen 2012, *Journal of Financial Economics* — same author cluster as the carry/momentum papers already cited in Chapter 6's framework). The Turtle story itself doubles as a case study on whether trading skill can be taught — which is, not coincidentally, this course's own core premise.
2. **System Design & Backtesting Honestly** — how to test a strategy without fooling yourself: in-sample vs. out-of-sample, overfitting, survivorship bias. Direct callback to the exit-strategy finding from the candlestick research (same data, opposite conclusions depending on methodology) — that lesson's warning becomes this lesson's toolkit.
3. **Introduction to Quantitative Trading** — what quant funds actually do (narrative anchor: the well-documented Renaissance Technologies story), what's realistic for an individual, and what isn't. Honest framing: this is context and career-awareness, not "build your own Renaissance."
4. **Behavioral Finance for Traders** — the academic counterpart to Chapter 4's psychology lesson: overtrading, the disposition effect, overconfidence — with the actual studies rather than just practitioner wisdom.

**Placement rationale:** the main course ends with Chapter 6's professional process + the trade-thesis service upsell. The Advanced Course is a second, distinct offering for the students who want to go deeper *themselves* — it deepens the "do it yourself" path, while the thesis service serves the "do it for me" path. The two offerings complement rather than compete.

- **Chapters 1–3 are the priority build order** — they're the mechanical and analytical foundation. Chapter 4 (psychology/planning), Chapter 5 (case studies), and Chapter 6 (professional trade process) all work better once a student has actually absorbed the mechanics, not before — Chapter 6 especially, since it assumes fluency with concepts taught nowhere before it.
- **This roadmap is a living document, same as the Style Guide** — expect chapter boundaries to shift as real transcripts arrive. A single dense transcript might split into two lessons; two short ones might merge into one.
- **No paywall boundary decision needed here** — the entire Forex track sits behind the paywall already, per the architecture locked in the Style Guide.
