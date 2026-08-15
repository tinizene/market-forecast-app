# Stocks & ETFs Track — Full Chapter Roadmap

*Locked structure. Update lesson status here as work completes, same as the Forex and
Crypto roadmaps.*

Folder: `/stocks/` · files `NN-M-lesson-slug.en.md` · display name **Stocks & ETFs**

---

## Why this track needed scoping at all

The track shipped with **7 lessons totalling 1,531 words** — an average of 219 words
each, against 2,875 for Crypto and 1,108 for Forex. Those seven were short cards
inherited from the original app fork, on the legacy `body` format rather than the
`structured` format the other paid tracks use: no chapters, no typed blocks, no
quizzes, no key-term tables. Eight minutes of reading, inside a course sold at €200
whose copy names "Crypto, Forex and Stocks & ETFs" as equal thirds.

This roadmap replaces them. Every one of the seven topics is absorbed and rewritten at
the density of the rest of the course, so nothing is lost and nothing stays a stub.

**Three lesson ids must survive rewriting**, because `learn.js` binds interactive tools
to them by id:

| id | tool |
| --- | --- |
| `investing-vs-gambling` | country economic-indicator panel |
| `expense-ratios` | live fee-comparison table |
| `dollar-cost-averaging` | DCA calculator on real adjusted price history |

Changing those ids silently detaches the tools. Keep them, or update the bindings in the
same commit.

---

## Where this track sits

Foundations teaches what money, risk and markets are. Forex and Crypto each teach a
vertical. This track is the third vertical, and it carries one distinguishing burden the
others do not: **it is the track most likely to be read by someone who will never
trade.** Most people who own equities own them through a pension or an index fund and
will hold for decades. The track has to serve that reader as seriously as it serves the
one who wants to pick stocks — and be honest that the evidence favours the first.

Recurring threads to maintain (see `course/CLAUDE.md`):

- **Risk management over prediction accuracy.**
- **Verify the claim** — equities have more folk wisdom per square inch than any other
  asset class, and most of it is testable.
- **Fat tails** — Foundations Ch3 and Forex Ch5 already established these; equity
  drawdowns are the reader's most likely lived encounter with one.
- **The textbook rule is a starting instinct** — "stocks always go up over 20 years"
  is a survivorship-flavoured claim that deserves the same treatment the course gave
  the forward premium puzzle.

---

## Chapter 1: What You Actually Own — 7 lessons · ✅ COMPLETE (5,985 words)

The mechanics chapter. By the end, a reader should be able to say precisely what they
hold, what it entitles them to, and what it costs to hold it.

1. **What a Share Actually Is** — a residual claim on a company's cash flows, limited
   liability, and the difference between owning a share and owning a piece of a
   business's furniture. What a shareholder can and cannot compel. — ✅ complete
2. **Investing vs Gambling** *(id `investing-vs-gambling`)* — the structural difference
   is not risk, it is expected value and who holds the edge. Positive-sum ownership of
   productive assets versus a negative-sum wager. Ties to Foundations Ch2. — ✅ complete
3. **How Shares Are Priced and Traded** — exchanges, the order book, bid/ask, market vs
   limit orders, and settlement (US moved to T+1 in May 2024 — verify at drafting).
   Callback to Forex Ch1 L4 on spreads. — ✅ complete
4. **What Is an Index?** *(id `what-is-an-index`)* — market-cap versus price weighting,
   what an index measures and what it silently omits, and why "the market was up 2%" is
   a weighted claim about a chosen basket, not a fact about all shares. — ✅ complete
5. **What Is an ETF?** *(id `what-is-an-etf`)* — creation and redemption, why the price
   tracks NAV, tracking difference versus tracking error, physical versus synthetic
   replication and the counterparty question. — ✅ complete
6. **Dividends and Total Return** *(id `dividends-and-dividend-etfs`)* — ex-dividend
   mechanics and why the price drops by roughly the dividend, total return versus price
   return, and the dividend-irrelevance argument (Miller & Modigliani 1961) taught as a
   genuine debate rather than a settled result. — ✅ complete
7. **What It Costs to Own** *(id `expense-ratios`)* — expense ratios, spreads, and the
   compounding arithmetic of a fee, computed rather than asserted. — ✅ complete

## Chapter 2: Reading a Company and a Market — 5 lessons · ✅ COMPLETE

1. **Reading the Three Statements** — what the income statement, balance sheet and cash
   flow statement each answer, and which one is hardest to fake. — ✅ complete
2. **Valuation Multiples and Their Assumptions** — P/E, P/B, EV/EBITDA; every multiple
   is a compressed forecast, and a low one is a question, not a bargain. — ✅ complete
3. **Growth, Value and the Factor Evidence** — the value premium, its long documented
   history and its long recent drought. Contested by construction; teach the
   disagreement. — ✅ complete
4. **Market Efficiency — and What It Means for You** — the three forms, what the
   evidence supports, and the Grossman–Stiglitz point that a perfectly efficient market
   could not exist because nobody would be paid to make it so. — ✅ complete
5. **Diversification Across Sectors and Countries** *(id `diversification-by-sector`)* —
   correlation, home bias, and the honest answer to "how many stocks is enough". — ✅ complete

## Chapter 3: Risk and Position Sizing for Equities — 4 lessons · ✅ COMPLETE

1. **What Risk Actually Means Here** — volatility versus permanent capital loss,
   drawdown depth versus duration, and sequence-of-returns risk. — ✅ complete
2. **Position Sizing and Concentration** — the arithmetic of recovering from a 50%
   loss, single-stock risk, and why the Forex Ch3 L1 sizing formula transfers. — ✅ complete
3. **Dollar-Cost Averaging vs Lump Sum** *(id `dollar-cost-averaging`)* — the evidence
   says lump sum wins on average and DCA wins on regret. Both facts, honestly, and why
   a behavioural tool is still a legitimate tool. — ✅ complete
4. **Margin, Leverage and Short Selling** — margin calls, borrow cost, and the asymmetry
   that a short's loss is unbounded. Callback to Forex Ch3 L2. — ✅ complete

## Chapter 4: Behaviour, Costs and a Written Plan — 3 lessons · ✅ COMPLETE

1. **The Behaviour Gap** — what the evidence says about individual investors' returns
   versus the funds they hold, and how much of the gap is timing. — ✅ complete
2. **Fees, Taxes and Decades** — the full compounding arithmetic, computed, over a
   realistic contribution schedule. This is the lesson the fee table exists for. — ✅ complete
3. **Building an Equity Plan** — written rules, rebalancing bands, and deciding the
   sell condition before buying. Carries Forex Ch4 L2's expectancy framing. — ✅ complete

## Chapter 5: Real-World Case Studies — 3 lessons · ✅ COMPLETE

1. **The Dot-Com Bubble (1995–2002)** — narrative valuation, index concentration, and
   how long "recovery" actually took on a real index. — ✅ complete
2. **2007–2009 and the Shape of a Recovery** — drawdown, sequence risk, and what the
   investor who kept contributing experienced versus the one who stopped. — ✅ complete
3. **GameStop, January 2021** — short squeezes, gamma, brokerage restrictions and
   settlement mechanics. The case study where the plumbing became the story. — ✅ complete

## Chapter 6: A Professional Equity Process — 3 lessons · ✅ COMPLETE

1. **The Six-Pillar Thesis, Adapted for Equities** — what carries over from Forex Ch6
   L1, what has to change when there are cash flows to value. — ✅ complete
2. **Regime Mapping for Equities** — where equities sit on the rates → FX → credit →
   equities transmission chain, and when the right position is none. — ✅ complete
3. **Portfolio Discipline and the Long Game** — correlation clustering in drawdowns,
   rebalancing as a discipline rather than a forecast, and the plainly-stated once
   mention of the trade-thesis service, per the Forex Ch6 precedent. — ✅ complete

---

## Total

**25 lessons across 6 chapters — all 25 written. ✅ TRACK COMPLETE.**

The track stands at 25 lessons and 29,042 words, up from 7 lessons and 1,531 words.
All seven legacy stub cards have been absorbed and replaced; none remain in
`learn-content.js`. Every lesson carries three quiz questions with explained answers
and a practice exercise, matching the Forex and Crypto tracks.

| | Lessons | Words | Average | Quiz Qs per lesson |
| --- | --- | --- | --- | --- |
| Stocks & ETFs | 25 | 29,042 | 1,162 | 3.0 |
| Forex | 26 | 25,230 | 970 | 2.5 |
| Crypto (15 of 24 built) | 15 | 39,479 | 2,632 | 3.0 |
| Foundations (free) | 10 | 3,602 | 360 | — |

Target density is the course average — roughly 1,200–2,500 words per lesson depending
on whether the lesson carries worked arithmetic. A lesson that lands under ~800 words is
almost certainly a stub and should be reworked or merged. Every lesson in this track
clears 1,000 words and the median is above 1,150.

### Diagrams

One dark-theme SVG per lesson, 25 in total, resolved through `window.SCERE_STOCKS_SVGS`
exactly as Forex and Crypto resolve theirs. They differ from the other tracks in one
respect: they are **generated** by `scripts/build-stocks-svgs.js` rather than
hand-authored.

That was a deliberate choice with a specific benefit. Every figure inside a diagram is
computed in the generator from the same arithmetic as the lesson text — the fee curve,
the recovery table, the margin-call threshold and both dollar-cost-averaging paths are
calculated, not typed — so a diagram cannot drift out of agreement with the lesson it
illustrates. The generator also checks each text colour against the background at build
time and exits nonzero below 4.5:1, so a palette edit cannot quietly ship unreadable
labels.

To change a diagram, edit the generator and re-run it, then re-run
`node scripts/build-course-data.js`. Do not edit `data/course/src/stocks-svgs.js` by
hand; it is overwritten.

Light-theme variants for the markdown masters have not been produced. The app renders
dark only, so this affects the markdown source files rather than anything a reader sees.

**Translations.** English master only, as with every other track.

## Standards reminder

Every lesson follows `course/CLAUDE.md` and `course/Forex_Course_Style_Guide.md`
without exception: citations verified live and cross-checked across two independent
sources, at least one academic source per major evidence claim, all arithmetic verified
computationally, one supporting SVG per lesson in both themes, glossary checked for
existing terms before defining new ones, and an honest handoff noting what came up
empty.

Equities carry a specific citation hazard worth naming here: an enormous amount of
widely-repeated investing folklore ("the market returns 10% a year", "90% of day
traders lose money", specific behaviour-gap figures) circulates without a traceable
primary source, or traces back to marketing material. Any such figure needs the full
protocol before it enters a lesson — and where the primary source cannot be found, the
honest move is to say the number is widely repeated but poorly sourced, which is itself
a lesson in the course's own voice.
