# Forex Track — Chapter 4, Lesson 2: Building a Trading Plan

## Learning Objectives

By the end of this lesson, you will be able to:

- List the parts of a written trading plan and explain what decision each one removes from the heat of the moment
- Calculate expectancy — the single number that says whether a system makes money over time
- Express any trade's result as an R-multiple and read a system's edge as R per trade
- Explain why expectancy only reveals itself over many trades, and what that means for risk per trade

---

## 1. Why a Plan, and Why in Writing

Lesson 1 defined discipline as following a pre-committed plan rather than winning an emotional battle in real time. This lesson builds that plan. It is the tool the whole chapter has been pointing at.

:::definition
**Trading Plan** — A written set of rules covering what you trade, the conditions for entering, where the stop and target go, how position size is calculated, the maximum you will risk, and how you review results. Its purpose is to move decisions out of the emotional moment and into calm preparation.
:::

Notice that you already have every component from earlier chapters — the plan just assembles them. What and when to trade comes from Chapter 2 (indicators, fundamentals, the economic calendar). The stop goes at the invalidation level from Foundations Chapter 2 and Chapter 2, Lesson 5. The target sits at a real support or resistance level, and must clear your risk-to-reward minimum from Chapter 3, Lesson 3. Position size comes from the formula in Chapter 3, Lesson 1, capped by a fixed risk percentage. The plan is not new material; it is these decisions written down in advance.

:::warning
A plan you keep only in your head is not a plan — it is an intention, and Lesson 1 showed exactly how intentions bend under fear and greed. Writing it down is what makes it a rule you can be held to, by yourself, when the moment tries to talk you out of it.
:::

---

## 2. The Number That Decides Everything: Expectancy

Chapter 3, Lesson 3 gave you the break-even win rate — whether a ratio can survive a given hit rate. Expectancy is the full accounting: not just whether you break even, but how much you make or lose per trade on average.

:::definition
**Expectancy** — The average profit or loss to expect per trade over many trades, calculated as (win rate times average win) minus (loss rate times average loss). Positive expectancy means the system makes money over time; negative means it loses, however good it feels along the way.
:::

:::example
A system wins 45% of the time, with an average win of 300 dollars and an average loss of 150 dollars. Expectancy = (0.45 times 300) minus (0.55 times 150) = 135 minus 82.50 = +52.50 dollars per trade. Over 200 trades, that is about +10,500 dollars before costs — from a system that loses more often than it wins. Now the warning case: a system wins 60% of the time, but the average win is only 80 dollars against an average loss of 150. Expectancy = (0.60 times 80) minus (0.40 times 150) = 48 minus 60 = minus 12 dollars per trade. A 60% win rate that steadily loses money — Chapter 3, Lesson 3's point, now measured in dollars.
:::

---

## 3. R-Multiples: One Ruler for Every Trade

Dollars make expectancy concrete, but they change with account size and position size, which makes it hard to compare trades or systems. The fix is to measure everything in the R unit from Chapter 3, Lesson 3.

:::definition
**R-multiple** — A trade's result expressed as a multiple of the amount risked on it. A trade that makes twice its risk is +2R; a trade stopped out for its full risk is −1R. Every trade, on any pair, in any size, collapses to a single R number.
:::

Expectancy in R is then simply (win rate times the average R won) minus (loss rate times the average R lost). If you always risk 1R and honour your stops, your average loss is 1R, and the formula gets clean.

:::example
A system wins 40% of trades with an average win of 2R. Expectancy = (0.40 times 2) minus (0.60 times 1) = 0.80 minus 0.60 = +0.20R per trade. Over 100 trades that is +20R. If 1R is 1% of a 10,000 dollar account — 100 dollars — that is +2,000 dollars, produced by a system that is wrong 60% of the time. Because R strips out account and position size, two completely different systems can be compared directly by their expectancy in R alone.
:::

![Diagram showing the expectancy formula in dollars and in R, a worked positive example (40 percent win rate at plus 2R gives plus 0.2R per trade) and a warning example (60 percent win rate with small wins gives minus 12 dollars per trade), and a note that expectancy is a long-run average that a short run of trades hides](../images/forex-ch4-expectancy.svg)

:::warning
Expectancy in R is the cleanest scorecard a trader has, because it answers the only question that ultimately matters — does this process make money per trade, on average — in a single number, independent of how big your account is.
:::

---

## 4. Expectancy Is a Long-Run Average

Here is the catch that undoes beginners who understand everything above. Expectancy is an average over many trades. Any short stretch is dominated by luck, not edge.

:::warning
A genuinely positive-expectancy system can lose over 5, 10, even 20 trades in a row — that is normal variance, not a broken system, and it is the same fat-tailed, streaky randomness you met in Chapter 2. Just as dangerous in reverse: a losing system can win for a while by pure chance, tempting you to trust it and size up. You cannot judge a system, or yourself, on a handful of trades. This is exactly why the plan includes a review over a meaningful sample, and why your risk per trade must be small enough (Chapter 3, Lesson 1) to survive the inevitable losing streaks while the edge has time to show.
:::

That last point ties the whole risk chapter together. Position sizing (Chapter 3, Lesson 1) keeps you alive through the variance. The risk-to-reward ratio and win rate (Chapter 3, Lesson 3) combine into expectancy. Discipline (Lesson 1) is what lets a positive expectancy actually be realised, instead of abandoned in the middle of a normal drawdown. The trading plan is the document that binds all of it into one repeatable process — which is the only thing that turns an edge on paper into money in an account.

---

## What to Look For

- Is your trading plan actually written down, or does it live only in your head, where it can quietly change?
- Can you state your system's expectancy — even a rough figure from past trades — in R or in dollars?
- Is that expectancy positive over a meaningful number of trades, not just your most recent, most memorable few?
- Is your risk per trade small enough that a normal losing streak cannot end you before the expectancy has time to play out?

---

## Practice / Quiz

1. A system wins 60% of trades, but its average win is 80 dollars and its average loss is 150 dollars. What is its expectancy per trade?
   - A) Positive, because the win rate is above 50%
   - B) Negative — about minus 12 dollars per trade
   - C) Exactly zero
   - D) It cannot be calculated

   **Correct: B.** (0.60 times 80) minus (0.40 times 150) = 48 minus 60 = minus 12 dollars. A high win rate does not save a system whose losses are much larger than its wins.

2. A system wins 40% of trades with an average win of 2R and an average loss of 1R. What is its expectancy in R?
   - A) −0.2R per trade
   - B) +0.2R per trade
   - C) +2R per trade
   - D) Zero

   **Correct: B.** (0.40 times 2) minus (0.60 times 1) = 0.80 minus 0.60 = +0.20R per trade — profitable despite being wrong most of the time.

3. True or False: a system with positive expectancy should be profitable over your next eight trades.

   **Correct: False.** Expectancy is a long-run average. Over eight trades, luck dominates, and a positive-expectancy system can easily lose. Its edge only reliably shows over a large sample — which is why small per-trade risk matters.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Trading Plan | A written set of rules (what, when, stop, target, size, risk, review) that pre-decides trades. |
| Expectancy | Average profit per trade = (win rate × avg win) − (loss rate × avg loss); positive means a real edge. |
| R-multiple | A trade's result as a multiple of the risk taken — +2R, −1R — a single ruler for every trade. |

---

*Coming next: Lesson 3 — the common beginner mistakes that drain accounts, nearly all of which the earlier lessons already solved, gathered into one checklist you can hold yourself to.*
