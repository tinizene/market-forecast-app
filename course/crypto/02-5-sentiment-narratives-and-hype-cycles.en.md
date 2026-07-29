# Crypto — Chapter 2, Lesson 5: Sentiment, Narratives & Hype Cycles

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain why stories move crypto prices more than they move share prices, and tie that back to what actually gives an asset value
- Describe reflexivity in plain language, and recognise the same loop you already met in the stablecoin lesson
- Read the Crypto Fear & Greed Index for what it is — a weighted blend of six inputs, half of which are just price and volume — and say honestly what the evidence does and does not support
- Read a funding rate as a proxy for how crowded one side of the market is, without mistaking it for a trading signal

---

## 1. A Market With No Anchor

Foundations taught you that an asset's value comes from what it does for someone. A company's share is a claim on that company's future profits. A bond pays a coupon. A rental property produces rent. Those payments are not a guarantee of price, but they are an anchor. When a share price runs far ahead of the profits underneath it, an analyst can put a number on the gap and argue about it.

Most crypto assets have no such number. A bitcoin pays no dividend. A token issues no earnings report. There is no coupon, no rent, and nothing to discount. Chapter 1, Lesson 1 made this point about supply: a hard cap tells you nobody can print more, and tells you nothing about what one should cost. This lesson makes the matching point about demand.

Demand for a crypto asset comes mostly from what people believe it will be worth to someone else later. That belief is carried by a story.

:::definition
**Narrative** — The shared story a market tells itself about why an asset should be worth more. In crypto a narrative is usually a claim about future adoption or future usefulness — not a measurement of anything happening now.
:::

Here is the honest consequence. In an equity market, a bad story eventually collides with an earnings statement. In crypto there is nothing for the story to collide with. That does not make crypto worthless, and it does not make every narrative false. It means the usual brake is missing, so stories can run further and last longer before anything contradicts them.

:::warning
This cuts both ways, and the downside is the part people forget. With no cash flows to argue against a story, there is also nothing to argue against a panic. "It has fallen 80%, so it must be cheap" has no more foundation than "it has doubled, so it must be going higher." Both claims need an anchor that is not there.
:::

---

## 2. How Narratives Form and Rotate

Chapter 2, Lesson 2 already showed you one narrative in detail: the four-year cycle built around the halving, examined against what the data can and cannot support. That lesson taught the specific story. This one teaches the shape that all of them share.

Narratives follow a recognisable structure, and the structure repeats even when the subject changes:

1. **A genuine development happens.** A protocol ships something, a regulator says something, an institution buys something. There is usually a real event at the bottom.
2. **A simple story forms around it.** The story compresses a complicated technical development into one sentence a newcomer can repeat.
3. **Prices rise, and the story spreads.** Rising prices attract attention, attention brings buyers, and the story now has an audience much larger than the group that understood the original development.
4. **Capital rotates in.** Money moves out of whatever the last story was and into this one. Chapter 2, Lesson 1's point about thin order books matters here: rotation into a small market moves its price a long way.
5. **The story stops working, and capital rotates out.** Not because it was disproved — usually nothing is ever disproved — but because attention moves to the next one.

Every cycle in crypto's history has had a rotating cast of themes like this. This course will not tell you which theme is running now, and will never tell you which token expresses it. That is deliberate, and it is worth being clear about why.

:::warning
Naming the current narrative would date this lesson within months and would function as a recommendation whether or not it was meant as one. What generalises is the structure: a real development, a simplified story, price confirmation, rotation in, rotation out. Learn to recognise the shape, and you can read the next one without being told about it.
:::

:::example
Notice what a narrative does to the burden of proof. A story explains why an asset should be worth more. Buying pressure then makes the price go up. Nothing about the rising price tested the story — the price rose because people acted on it. But to a newcomer arriving at step 3, the chart looks like evidence. The story and its proof have quietly become the same event.
:::

---

## 3. Reflexivity: Belief Moves Price, Price Then Validates Belief

That last observation has a name, and once you have it you will see the loop everywhere.

:::definition
**Reflexivity** — A feedback loop in which participants' beliefs change prices, and the changed prices are then treated as evidence for those beliefs. The market's opinion becomes part of what the market is measuring. The financier George Soros popularised the term for financial markets, most fully in a 2013 paper in the Journal of Economic Methodology.
:::

Soros's argument is that prices are not a clean mirror of underlying facts. Participants act on an imperfect understanding of a situation, and their actions then change the situation itself. In his framing markets therefore drift away from equilibrium rather than toward it, because the feedback runs in a self-reinforcing direction for long stretches.

You have already seen a pure version of this. In Chapter 1, Lesson 7, an algorithmic stablecoin held its peg because people believed it would hold. Confidence supported the mechanism, and the working mechanism supported confidence. When confidence broke, the same loop ran backwards and destroyed the peg it had been holding up. That was reflexivity in its most extreme form — the belief was the entire backing.

![Diagram of the reflexive loop in a market with no cash flows: a story attracts buying, buying raises the price, the higher price is read as proof of the story, which attracts more buying — and the identical circle running in reverse, where doubt causes selling, falling prices are read as proof the story was wrong, and more selling follows](../images/crypto-02-5-reflexivity-loop.svg)

The loop is symmetric, and that symmetry is the important part. Read the circle one way and you have a boom: story, buying, higher price, apparent validation, more buying. Read the same circle backwards and you have a collapse: doubt, selling, lower price, apparent refutation, more selling. Nothing about the underlying asset needed to change in either direction.

:::warning
Reflexivity is not a prediction tool. It tells you that a self-reinforcing loop can run much further than a reasonable valuation would suggest — in both directions — and that no part of the loop tells you when it turns. Anyone who claims reflexivity lets them time a top has misunderstood the idea. It describes the mechanism, not the timing.
:::

---

## 4. Sentiment Indicators, Read Mechanically

:::definition
**Market Sentiment** — The overall mood of participants toward an asset, from fear to greed. Sentiment is not a fact about the asset. It is an aggregate of how people currently feel about it, which is why it can change fast without anything else changing.
:::

Sentiment cannot be measured directly, so the industry builds proxies for it. The most widely quoted one in crypto is the Crypto Fear & Greed Index, published by the site alternative.me since 2018. It outputs a single number from 0 (extreme fear) to 100 (extreme greed), updated daily.

:::definition
**Fear & Greed Index** — A composite sentiment score, published daily on a 0 to 100 scale, built by combining several market and attention measures into one number. It aggregates existing data; it does not measure any fundamental property of the assets themselves.
:::

Beginners often treat it as a reading from an instrument. It is not. It is an arithmetic blend, and knowing the recipe changes how much weight you give the output. The published weights are:

| Component | Weight | What it actually uses |
|---|---|---|
| Volatility | 25% | Bitcoin's volatility and drawdowns versus 30-day and 90-day averages |
| Market momentum / volume | 25% | Current volume and momentum versus 30-day and 90-day averages |
| Social media | 15% | Interaction rates on Bitcoin-related posts |
| Surveys | 15% | Public polls — currently paused by the publisher |
| Bitcoin dominance | 10% | Bitcoin's share of total crypto market capitalisation |
| Google Trends | 10% | Search interest in Bitcoin-related terms |

Now read that table as an engineer rather than a trader. Half the index — volatility and momentum, 25% each — is computed from recent price and volume. Bitcoin dominance is also a market-price quantity. So a majority of the score is a restatement of what prices recently did, wearing the label "sentiment."

:::example
That composition predicts exactly the criticism the index has attracted, and the research has found it. A 2026 study in the Elsevier journal Finance Research Open, "Do bitcoin returns move sentiment? Evidence from the crypto fear & greed index," ran a vector autoregression on daily data from 2018 to 2025. It reported that changes in the index did not Granger-cause Bitcoin returns and gave no out-of-sample forecasting gain — but that returns did Granger-cause changes in the index. A return shock produced a sharp, short-lived swing in the sentiment score, while a sentiment shock had negligible effect on returns. In that data, the arrow runs from price to sentiment, not the other way.
:::

Be careful not to accept that as settled either, because the literature genuinely disagrees. Cavalheiro, Vieira and Thue (2024), in Review of Behavioral Finance, applied Granger causality and smooth quantile regression to weekly Bitcoin and Ethereum data from July 2022 to June 2023, and reported that the index did predict returns. Gaies, Nakhli, Sahut and Schweizer (2023), in The North American Journal of Economics and Finance, used a rolling-window bootstrap causality test over May 2018 to December 2020 and found something more interesting than either result: the causality between fear sentiment and Bitcoin prices was not constant. It appeared, disappeared, and changed sign across subperiods, and shifted again around the pandemic.

:::warning
Put those three findings together and the honest summary is this: the relationship between this index and future returns is unstable across samples, frequencies and periods. That is precisely the condition under which a fixed rule such as "extreme fear means buy" cannot be trusted. The contrarian rule is repeated constantly in crypto media. Searching for evidence behind it turns up confident blog claims of large outperformance with no methodology attached, alongside peer-reviewed work that contradicts them. Weak evidence, loudly repeated, is the exact pattern this course teaches you to distrust.
:::

The other common family of sentiment tools is social-volume metrics — counts of how often an asset is mentioned, and automated scoring of whether those mentions are positive or negative. Attention does have a measurable relationship with crypto prices. Kristoufek (2013), in Scientific Reports (volume 3, article 3415), compared Bitcoin prices with Google Trends and Wikipedia search volumes and found a strong positive correlation on a log-log scale, roughly 0.88 for Google Trends and 0.83 for Wikipedia. The paper's sharper finding is an asymmetry: rising interest pushed prices further up when the price was already above its trend, and further down when it was below. Attention amplified the direction already in motion rather than pointing in one.

Steinert and Herff (2018), in PLOS ONE, went further and reported that short-term altcoin returns could be predicted from Twitter activity and sentiment across 181 altcoins. Treat that as suggestive rather than as a tool. The samples in this literature are short, the platforms have changed enormously since, and social data has a specific contamination problem.

:::warning
Social volume is the sentiment measure that is easiest to fake. Automated accounts, paid promotion, and coordinated posting all raise mention counts without a single additional person actually believing anything. Studies of crypto discussion on Twitter have flagged meaningful shares of bot-originated posts. A spike in mentions may be a market waking up, or it may be a marketing budget. The metric cannot tell them apart, so you must.
:::

---

## 5. Funding Rates: The Most Useful Tool in This Lesson

Sentiment surveys ask what people say. Funding rates show you what people have actually done with money, which is a much harder thing to fake. To read them you need one piece of market plumbing.

:::definition
**Perpetual Swap (Perp)** — A derivative contract that tracks an asset's price and never expires. Ordinary futures expire on a set date, which forces their price back to the spot price. A perpetual has no such date, so it needs another mechanism to stay tethered to spot.
:::

:::definition
**Funding Rate** — The periodic payment that flows directly between holders of long and short perpetual positions to keep the perpetual price close to the spot price. When the perpetual trades above spot the rate is positive and longs pay shorts. When it trades below spot the rate is negative and shorts pay longs.
:::

The logic is a pressure valve. If crowds of buyers push the perpetual above spot, holding a long position starts costing money every few hours and holding a short starts earning it. That cost discourages more longs and attracts shorts, which pulls the perpetual back toward spot. The exchange does not take this money — on major venues it moves between traders, so it is a transfer, not a fee.

On Binance, Bybit and OKX, funding settles every 8 hours, at 00:00, 08:00 and 16:00 in the venue's stated time zone. Some venues and some contracts settle far more often — Hyperliquid pays hourly, computing the same 8-hour rate and paying one eighth of it each hour. Check the interval on the venue you are actually looking at, because a rate quoted per 8 hours and a rate quoted per hour are not comparable numbers.

:::example
Suppose you hold a long perpetual position with 10,000 dollars of notional exposure, and funding is +0.01% per 8-hour period. You pay 10,000 x 0.0001 = 1 dollar at each settlement. There are three settlements a day, so that is 3 dollars a day, or 0.03% of your notional daily. Held for 30 days at the same rate, that is 90 dollars. Annualised without compounding, 0.03% a day is 10.95% a year. Now suppose funding rises to +0.1% per period, which happens in strongly one-sided markets. The same position pays 30 dollars a day — an annualised 109.5%. The price has not moved at all in either case.
:::

That example is why the rate is worth watching, but its real use is different from what the number costs you.

:::definition
**Positioning** — How market participants are currently arranged between long and short exposure, and how one-sided that arrangement is. Positioning is a description of the present, not a forecast.
:::

Read funding as a positioning proxy. Persistently positive funding means longs are paying to stay long, which means the long side is crowded enough to bid the perpetual above spot and keep it there. Persistently negative funding means the reverse. That is genuinely useful information, because it tells you which side of the market is carrying a cost, and therefore which side has the weaker grip on its position.

The theory here is real and recent. Ackerer, Hugonnier and Jermann's "Perpetual Futures Pricing" — NBER working paper 32936 (2024), subsequently published in Mathematical Finance — derives no-arbitrage prices for perpetual contracts and shows how the funding payment anchors the perpetual to spot. A separate working paper, He, Manela, Ross and von Wachter's "Fundamentals of Perpetual Futures" (arXiv 2212.06888, also on SSRN), derives the same no-arbitrage relationship and measures the deviations empirically, reporting that crypto perpetuals deviate from no-arbitrage prices more than traditional currency markets do, that the deviations move together across currencies, and that they have shrunk over time. Note that this second paper was still circulating as a working paper, not a peer-reviewed journal article, when this lesson was written.

:::warning
Crowded positioning tells you what could unwind violently. It does not tell you when. Funding can stay extremely positive for weeks while price keeps rising, and traders who shorted "because funding was too high" get carried out well before any reversal arrives. Every crowded trade looks obvious afterwards and pays nothing for being early. Treat elevated funding as a statement about fragility, never as an entry trigger.
:::

You will meet the rest of this machinery properly in Chapter 3, Lesson 3, which covers perpetuals, margin and liquidation cascades as a risk topic. This lesson gives you only enough to read the number. Reading funding does not require you to trade perpetuals, and for most beginners the sensible use of this tool is exactly that: read it, and stay in spot.

:::warning
One last caution that applies to every tool in this lesson. A sentiment reading, a mention count and a funding rate are inputs to a question you are asking, never a trigger that acts on your behalf. And treat a compelling narrative as a reason for extra scrutiny rather than less — the more obviously right a story feels, the more people have already bought it.
:::

:::practice
Pick any asset that has moved sharply in the last month and reconstruct its loop on paper. Write down the story being told about it in one sentence. Then ask: what evidence is offered for that story, and how much of that evidence is just the price itself? Next, look up the current funding rate for that asset on any venue that publishes one, note the settlement interval, and write down what the sign tells you about which side is crowded — and then write down, honestly, that it tells you nothing about when. Finally, check the Fear & Greed reading for the same day and ask what it told you that the price chart had not already.
:::

---

## What to Look For

- When someone explains a price move with a story, ask what would have to happen for the story to be wrong. If nothing could disprove it, it is a narrative, not an analysis.
- When a chart is offered as proof that a thesis is correct, check whether the price rose for any reason other than people acting on that thesis. That is the reflexive loop, and it is not evidence.
- When you see a Fear & Greed reading, remember at least half of it is recomputed price and volume. Ask what it is telling you that the chart did not.
- When someone quotes a contrarian sentiment rule, ask for the sample: which years, which frequency, which asset, tested how. The published research disagrees with itself on this, which is the strongest reason not to trade a fixed rule.
- When a token's mentions spike, ask who is posting. Coordinated promotion and genuine interest look identical in a mention count.
- When you check funding, note the settlement interval before comparing venues, and read the sign and persistence rather than a single print.
- When someone with a large audience promotes an asset, assume they may already hold a position that your buying would benefit. Ask whether they have disclosed it. Chapter 4 covers this failure mode, and outright fraud, in full.

---

## Practice / Quiz

1. Why do narratives move crypto prices more than they move the price of an established company's shares?
   - A) Crypto traders are less intelligent than stock investors
   - B) Crypto has no cash flows, earnings or dividends, so there is no fundamental anchor a story has to collide with
   - C) Crypto markets are open 24 hours a day
   - D) Stories are legally required to be true in stock markets

   **Correct: B.** A share price can be checked against an earnings statement. Most crypto assets produce no cash flows at all, so a story about future adoption has nothing measurable to contradict it. The missing brake is what lets narratives run further, in both directions — there is equally little to contradict a panic.

2. The Crypto Fear & Greed Index gives volatility a 25% weight and market momentum and volume another 25%. What should a careful reader conclude from that?
   - A) The index is a direct measurement of investor psychology
   - B) The index is 50% independent of price, so it adds new information
   - C) At least half the score is recomputed from recent price and volume, so much of it restates what the chart already showed
   - D) The index predicts returns because volatility predicts returns

   **Correct: C.** Volatility and momentum/volume are both derived from market data, and Bitcoin dominance is too. A 2026 study in Finance Research Open found that returns Granger-caused changes in the index rather than the reverse — consistent with a score largely built from prices. Other studies disagree, and the honest reading is that the relationship is unstable rather than settled.

3. The funding rate on a Bitcoin perpetual swap has been strongly positive for two weeks. What does that tell you?
   - A) The price is about to fall, so you should open a short position
   - B) Long positions are crowded enough to hold the perpetual above spot, and are paying for the privilege — which says something about fragility, not about timing
   - C) The exchange is charging higher fees this month
   - D) Shorts are currently paying longs

   **Correct: B.** Positive funding means longs pay shorts, which happens when the perpetual trades above spot. Persistent positive funding is a positioning proxy: the long side is crowded and carrying a cost. It says nothing about when that crowd unwinds, and funding can stay elevated for weeks while price keeps rising. Option D describes negative funding. Option C is wrong because funding is a transfer between traders on major venues, not an exchange fee.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Narrative | The shared story a market tells itself about why an asset should be worth more. |
| Reflexivity | A loop where beliefs move prices and the price move is then treated as evidence for the belief. |
| Market Sentiment | The overall mood of participants toward an asset, from fear to greed — a feeling, not a fact about the asset. |
| Fear & Greed Index | A daily 0 to 100 composite sentiment score built by weighting several market and attention measures. |
| Perpetual Swap (Perp) | A derivative that tracks an asset's price and never expires. |
| Funding Rate | The periodic payment between long and short perpetual holders that keeps the perpetual price near spot. |
| Positioning | How participants are currently arranged between long and short exposure, and how one-sided that is. |

---

*Coming next: Chapter 3 — Risk Management for Crypto: position sizing when volatility is several times forex, custody as a risk that is not price risk, and why liquidation rather than being wrong is how most leveraged crypto accounts die.*
