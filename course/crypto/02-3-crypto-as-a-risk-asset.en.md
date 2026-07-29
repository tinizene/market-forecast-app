# Crypto — Chapter 2, Lesson 3: Crypto as a Risk Asset

## Learning Objectives

By the end of this lesson, you will be able to:

- State the "digital gold, uncorrelated diversifier, inflation hedge" claim precisely enough to test it
- Explain what beta means, and why crypto has behaved as the high-beta end of the risk spectrum rather than as a hedge
- Read a correlation number correctly — with its measurement window attached — and explain why correlations rise toward 1 in exactly the crises where diversification is supposed to help
- Size a crypto position as the most volatile slice of a risk portfolio, not as protection against one

---

## 1. The Claim, Stated Plainly Enough to Test

Crypto marketing makes three claims that are usually presented as one idea. Separating them is the first job of this lesson, because each one is a different testable statement.

The first is **digital gold** — the idea that Bitcoin does what gold is supposed to do, holding purchasing power while currencies weaken. The second is **uncorrelated diversifier** — the idea that crypto moves independently of stocks and bonds, so adding it smooths a portfolio. The third is **inflation hedge** — the idea that a capped supply protects you when consumer prices rise.

You have already met the vocabulary for testing claims like these. The Foundation of Money and Trade, Chapter 2, Lesson 4 defined three genuinely different things that marketing treats as synonyms: a diversifier, a hedge, and a safe haven. That lesson also locked the definition of correlation this course uses. This lesson does not redefine any of those terms. It takes them and applies them to crypto with dated evidence.

Crypto Chapter 1, Lesson 1 already flagged the store-of-value framing as contested rather than settled. This lesson is where that flag gets paid off with numbers.

:::warning
"Uncorrelated" is a claim about a period, not a property of an asset. Correlation is measured over a window of time. Change the window and the number changes. When someone tells you crypto is uncorrelated, the only useful reply is a question: uncorrelated with what, measured over which dates? An answer that cannot name the window is not evidence.
:::

---

## 2. What Actually Happened: Crypto Traded Like a High-Beta Risk Asset

:::definition
**Risk Asset** — An asset whose price depends heavily on investor risk appetite and on financial conditions, rather than on a contractual promise to pay. Equities, corporate credit, and cryptocurrencies are risk assets. Cash and short-dated government bonds of a stable issuer are not.
:::

:::definition
**Beta** — A measure of how much an asset moves for a given move in a reference market. A beta of 1 means the asset tends to move roughly one-for-one with that market. A beta above 1 means it tends to move more, in both directions. An asset with a persistently high beta is described as high-beta: it amplifies whatever the reference market does.
:::

The evidence that crypto has behaved as a high-beta risk asset comes from several independent directions. No single study settles it. Together they point the same way.

The International Monetary Fund published a blog post on 11 January 2022 by Tobias Adrian, Tara Iyer and Mahvash Qureshi reporting a specific pair of measurements. Over 2017 to 2019, the correlation between Bitcoin returns and the S&P 500 was 0.01 — effectively no relationship. Over 2020 to 2021, the same measure was 0.36. The relationship did not stay constant. It changed after the extraordinary central-bank response of early 2020, when easy financial conditions lifted both crypto and equities together.

An accompanying IMF Global Financial Stability Note from January 2022, "Cryptic Connections: Spillovers between Crypto and Equity Markets" by Tara Iyer, went further into volatility. It found that the correlation between Bitcoin's price volatility and S&P 500 volatility rose more than fourfold compared with pre-pandemic years, and that Bitcoin's estimated contribution to the variation in S&P 500 volatility increased by roughly 16 percentage points in the post-pandemic period.

:::example
An IMF working paper from August 2023 — WP/23/163, "The Crypto Cycle and US Monetary Policy" by Natasha Che, Alexander Copestake, Davide Furceri and Tammaro Terracciano — put a number on the sensitivity. The authors extract a single common price component, which they call the crypto factor, that explains about 80% of the variation in crypto prices. They then measure what United States monetary tightening does to it. The crypto factor falls by about 0.15 standard deviations after a tightening shock, while the equity factor falls by about 0.1 standard deviations. Crypto did not sit outside the monetary cycle. It responded to it more strongly than equities did — which is what high-beta means in practice.
:::

There is one more piece, and it is the one this course has cited before. Forex Chapter 6, Lesson 3 introduced Liu, Tsyvinski and Wu (2022), "Common Risk Factors in Cryptocurrency," published in The Journal of Finance, volume 77, issue 2. The authors show that three factors — a cryptocurrency market factor, size, and momentum — capture the cross-section of expected crypto returns. The point that lesson drew, and this one repeats, is structural: crypto returns are organised by the same kind of factor logic that organises ordinary asset markets, rather than escaping it.

:::warning
Be precise about what that paper does and does not say. Liu, Tsyvinski and Wu measure crypto's own internal factor structure. They do not publish a beta of Bitcoin against the S&P 500. Anyone who cites them as direct proof that "crypto is high-beta to equities" is stretching the paper past its actual result. The equity co-movement evidence comes from the IMF work above. The factor paper tells you something different and still useful: crypto is not a separate financial universe with its own physics.
:::

Where does this put crypto on the map Forex Chapter 6, Lesson 3 drew? At the far end. That lesson taught the transmission chain: interest rates move first, then currencies and government bonds, then credit and equities, then commodities, then crypto. Crypto is the last and highest-beta link. A shock that shaves a few percent off equities has repeatedly taken a multiple of that out of crypto.

---

## 3. Correlation Is a Moving Number, Not a Fixed Property

The single most common mistake beginners make with correlation is treating it as a fact about an asset, like its ticker. It is not. It is a statistic computed over a chosen stretch of dates.

:::definition
**Rolling Correlation** — Correlation recalculated repeatedly over a moving window of recent data, for example the last 90 days, and then plotted through time. It shows how the relationship between two assets changes, instead of collapsing it into one average number.
:::

Look again at the IMF figures in Section 2. Bitcoin against the S&P 500 measured 0.01 over 2017 to 2019 and 0.36 over 2020 to 2021. Both numbers are correct. They describe different periods. A person quoting only the first would honestly conclude crypto is uncorrelated. A person quoting only the second would honestly conclude it is not. Neither is lying. Both are answering with a window they did not mention.

The disagreement runs wider than one institution. Foundations Chapter 2, Lesson 4 already showed you two careful academic studies of Bitcoin as a safe haven reaching opposite conclusions, one of which put Bitcoin's correlation with United States and European stocks at roughly 0.05 in 2017 rising to somewhere between 0.25 and 0.30 by 2021. That is a lower figure than the IMF's 0.36, over overlapping but not identical periods, using different data. Do not smooth those into one tidy number. The direction of travel is consistent across all of them: upward. The exact level depends on the window, the price feed, and the return frequency.

:::warning
Never quote a bare correlation number. "Bitcoin's correlation with stocks is 0.4" is not a fact until you attach the reference index, the date range, and the return frequency used. A number without its window is a marketing statistic, not a measurement.
:::

:::warning
Correlation is not causation, and short windows manufacture both. Two series can move together for months because a third thing is driving both, or because of nothing at all. Longin and Solnik, writing in The Journal of Finance in 2001, made this warning explicit for exactly this kind of study: naive comparisons of correlation across calm and volatile periods produce a spurious relationship between correlation and volatility, because volatility itself changes the measurement. That is why they built a method around extreme returns rather than trusting the raw comparison. Apply the same suspicion to any 30-day crypto correlation chart you see on social media.
:::

---

## 4. The Asymmetry That Breaks the Diversification Story

Here is the part that matters most, and it is not a crypto point. It is a market-structure point that crypto happens to illustrate loudly.

:::definition
**Crisis Correlation** — The tendency of correlations between assets to rise sharply, toward 1, during severe market-wide selloffs. Holdings that looked independent in calm markets fall together in the crash, which is precisely when their independence was supposed to protect you.
:::

Longin and Solnik studied this directly in "Extreme Correlation of International Equity Markets," The Journal of Finance, volume 56, issue 2, 2001, pages 649 to 676. Using extreme value theory on the tails of the return distribution, they found the effect is not symmetric. They rejected the assumption of normal joint behaviour for the negative tail, but not for the positive tail. In plain terms: markets get much more tightly linked in extreme falls than in extreme rises.

That is a brutal result for anyone relying on diversification. The correlation you measured in the calm period is not the correlation you get in the crash. The protection weakens exactly when it is needed.

You have seen this thread before under a different name. Foundations Chapter 2, Lesson 4 warned that a well-diversified portfolio can still lose money in a broad shock because correlations rise together. The course's fat-tails thread — Mandelbrot in 1963, and the Swiss franc collapse of 2015 in Forex Chapter 1, Lesson 7 — is the same idea from the single-asset side. Extreme events are more common than tidy models predict, and they arrive correlated.

![Schematic diagram showing crypto at the far high-beta end of the transmission chain from interest rates through currencies and bonds, credit and equities, and commodities, alongside a second illustrative panel showing correlation between a risk asset and equities drifting low in a calm period and then rising sharply toward 1 during a stress window](../images/crypto-02-3-correlation-regimes.svg)

---

## 5. 2022: The Test the Claim Actually Faced

2022 was not a hypothetical. It was the exact scenario the marketing described, and the results are on the record.

Inflation arrived. United States consumer prices rose 9.1% over the 12 months ending June 2022, the largest 12-month increase since the period ending November 1981, according to the Bureau of Labor Statistics. If a capped-supply asset protects you from inflation, this was the moment.

Tightening arrived with it. The Federal Reserve raised its target rate at seven consecutive meetings between March and December 2022, taking it from near zero to a range of 4.25% to 4.50% — the fastest tightening campaign since the 1980s.

:::example
Calendar year 2022 returns, from close to close:

- S&P 500: down about 19.4%
- Nasdaq Composite: down about 33.1%
- Bitcoin: down about 64%, from roughly 46,300 dollars to roughly 16,500 dollars
- Ether: down roughly 67% to 68%, from roughly 3,700 dollars to roughly 1,200 dollars

Bitcoin's calendar-year fall was roughly 1.9 times the Nasdaq's and roughly 3.3 times the S&P 500's. Sources differ by one or two percentage points on the crypto figures depending on which exchange price feed and which cut-off time they use, so treat these as close ranges rather than exact constants.

Measured peak to trough instead of calendar year, the gap is wider. The Nasdaq Composite fell about 36.4% from its record close of 16,057.44 on 19 November 2021 to its cycle closing low of 10,213.29 on 28 December 2022. Bitcoin fell about 77% to 78% from roughly 69,000 dollars in November 2021 to roughly 15,500 dollars on 21 November 2022.
:::

Read that carefully. Crypto did not move independently of equities in 2022. It moved in the same direction, in the same window, only much harder. And it fell during the largest inflation surge in 40 years, which is the one environment where the inflation-hedge story predicted it should have risen.

:::warning
An inflation-hedge claim has to survive an actual inflation episode. 2021 to 2022 was the first serious test of the modern crypto era, and the claim failed it. State that plainly. The honest version of the academic picture is that it is contested and period-dependent, not uniformly negative. Choi and Shin, in Finance Research Letters, volume 46, 2022, found Bitcoin does appreciate against inflation shocks — while separately rejecting the safe-haven claim, because Bitcoin fell in response to financial uncertainty shocks. Rodriguez and Colombo, in the Journal of Economics and Business, volume 133, examined data from August 2010 to January 2023 and also found a positive response to inflation shocks, but reported two important limits: the effect holds for consumer-price shocks specifically, and it comes mainly from the sample period before large institutional participation. That last finding matches everything in Section 2. The property people are selling belongs to an earlier, smaller, more isolated market than the one you would be buying into.
:::

:::warning
Notice what this does not prove. Crypto has not been proven to be permanently high-beta any more than it was permanently uncorrelated. Both are statements about periods. What 2022 does prove is narrower and more useful: crypto is fully capable of behaving as a high-beta risk asset through a full tightening cycle, so any plan you build must survive that behaviour. Plan for the behaviour you have observed, not the behaviour you were promised.
:::

---

## 6. What to Do With This: Size It as the Tail, Not the Hedge

The practical conclusion is not "avoid crypto." It is "stop giving it the job of protection."

:::definition
**Drawdown** — The fall from a portfolio's or an asset's highest point to its subsequent lowest point, expressed as a percentage. It measures the worst loss an investor holding through the period would have experienced.
:::

Deep drawdowns are mathematically punishing, and the arithmetic is worth doing once by hand. A 36.4% fall requires a 57.2% gain to get back to level. A 64.3% fall requires a 180.1% gain. A 77.6% fall requires a 346.4% gain. The recovery required grows much faster than the loss.

:::example
Work out what a crypto sleeve costs a portfolio in a repeat of 2022, using the 77.6% peak-to-trough fall.

- A 2% crypto allocation contributes 1.55 percentage points of portfolio drawdown.
- A 5% allocation contributes 3.88 percentage points.
- A 10% allocation contributes 7.76 percentage points.
- A 25% allocation contributes 19.4 percentage points, on its own.

Now add the correlation problem. Those crypto losses did not offset equity losses, because both fell in the same window. A portfolio holding 60% equities that fell 36.4%, plus a 10% crypto sleeve that fell 77.6%, took roughly 29.6 percentage points of drawdown from those two positions together. The crypto sleeve added to the loss instead of cushioning it.
:::

Three rules follow directly.

First, treat crypto as the highest-beta link of the transmission chain, which is where Forex Chapter 6, Lesson 3 placed it. If your read is that financial conditions are tightening, crypto is the wrong end of the chain to be adding exposure to, not the safe corner.

Second, size the position by what it does in a bad regime, not an average one. The relevant question is not "what is crypto's average correlation?" It is "what happens to this holding when equities fall 35%, and can my plan absorb that?"

Third, do not count a crypto holding as your diversification. If the only thing standing between you and a correlated crash is an asset that fell twice as hard as the Nasdaq in the same window, you do not have a hedge. You have a second, larger version of the same bet.

:::practice
Pick any article, video, or exchange page that calls crypto an uncorrelated asset, a hedge, or digital gold. Write down three things: (1) which reference market it names, or whether it names one at all; (2) which date range its evidence covers; (3) what its claim would have predicted for calendar year 2022, and what actually happened. Most sources fail at step 1 or step 2. That failure is the finding.
:::

---

## What to Look For

- When you see a correlation figure, check for three things before you trust it: the reference index, the date range, and the return frequency. A number missing any of them is not a measurement.
- When someone calls crypto uncorrelated, ask which window they are quoting. The IMF measured 0.01 for 2017 to 2019 and 0.36 for 2020 to 2021 against the S&P 500. Both are true statements about different periods.
- When you see a rolling correlation chart, look at the crisis windows specifically, not the average. Crisis correlation is the number that decides whether diversification actually helps you.
- When someone presents crypto as an inflation hedge, ask what it did in 2022 while United States inflation peaked at 9.1%. If the answer is not offered, that is the answer.
- When a shock hits interest rates, look along the transmission chain and expect crypto to move last and most. Position size accordingly, before the move, not during it.

---

## Practice / Quiz

1. An analyst says "Bitcoin's correlation with the S&P 500 is 0.36, so it is a weak diversifier." What is the most important thing missing from that statement?
   - A) The Bitcoin price at the time of the statement
   - B) The measurement window — which dates the 0.36 was calculated over
   - C) The name of the exchange the analyst uses
   - D) Nothing is missing; a correlation number is self-explanatory

   **Correct: B.** That 0.36 came from the IMF measuring 2020 to 2021. The same pair measured 0.01 over 2017 to 2019. Correlation is a statistic over a window, not a permanent property of an asset, so a number without its window cannot be checked or compared.

2. Why does the tendency of correlations to rise during crises matter so much for diversification?
   - A) It does not matter, because crises are rare
   - B) Because rising correlations increase returns during crashes
   - C) Because the assets you held for independence fall together in the crash, which is exactly when the independence was supposed to protect you
   - D) Because it only affects professional investors, not beginners

   **Correct: C.** Longin and Solnik found the linkage is stronger in extreme falls than in extreme rises. Diversification is measured in calm markets and tested in crashes, and the two numbers are not the same. This is the same lesson Foundations Chapter 2, Lesson 4 taught about broad market shocks.

3. During 2022, United States inflation reached its highest 12-month rate in about 40 years, and the Federal Reserve raised rates at seven consecutive meetings. What happened to crypto relative to equities in that window?
   - A) Crypto rose while equities fell, confirming the inflation-hedge claim
   - B) Crypto and equities both fell, and crypto fell considerably harder
   - C) Crypto was flat, behaving like cash
   - D) Crypto fell slightly less than the S&P 500

   **Correct: B.** The S&P 500 fell about 19.4% and the Nasdaq Composite about 33.1% over calendar 2022, while Bitcoin fell about 64% and Ether roughly 67% to 68%. Crypto moved in the same direction as equities, only with far more amplitude — the behaviour of a high-beta risk asset, not a hedge.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Risk Asset | An asset whose price depends heavily on investor risk appetite and financial conditions rather than a contractual promise to pay. |
| Beta | A measure of how much an asset moves for a given move in a reference market; above 1 means it amplifies that market. |
| High-Beta Asset | An asset with a persistently high beta, which magnifies the reference market's moves in both directions. |
| Rolling Correlation | Correlation recalculated over a moving window of recent data and plotted through time, showing how a relationship changes. |
| Crisis Correlation | The tendency of correlations to rise toward 1 in severe selloffs, weakening diversification exactly when it is needed. |
| Drawdown | The fall from a peak to the subsequent trough, as a percentage — the worst loss a holder would have experienced. |

---

*Coming next: Lesson 4 — On-Chain Data: what active addresses and exchange flows can and cannot tell you, and the evidence limits of on-chain analytics.*
