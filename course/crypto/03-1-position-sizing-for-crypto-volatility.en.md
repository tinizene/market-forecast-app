# Crypto — Chapter 3, Lesson 1: Position Sizing When Volatility Is Not Forex

## Learning Objectives

By the end of this lesson, you will be able to:

- Apply the position-sizing formula from Forex Chapter 3, Lesson 1 unchanged, and identify which single input crypto actually changes
- Define realized volatility, state the measured range of crypto's volatility against major currencies with its measurement window attached, and refuse to quote a bare multiple
- Compute an Average True Range and set a volatility-scaled stop from it, then size a position against that stop
- Explain why tightening the stop to trade a bigger size converts a sizing problem into a guaranteed stop-out

---

## 1. The Formula Does Not Change

Start with the reassuring part. Nothing you learned about position sizing is now wrong.

Forex Chapter 3, Lesson 1 gave you the sizing formula, and Foundations Chapter 2 gave you the 1% to 2% rule it feeds on. The formula is arithmetic, not a forex convention. It works on any instrument that has a price and a stop.

**Position size = (the money you are willing to lose) / (the distance from entry to your stop)**

The numerator is your decision. The denominator is the market's. That split is the entire lesson.

:::warning
Everything that changes in crypto lives in the denominator. Your risk per trade stays at 1% to 2% of the account, exactly as before, because that number is a statement about your survival and not about the asset. What changes is how far away a sensible stop has to sit — and because the stop distance is divided into your risk budget, a wider stop mechanically produces a smaller position. Not a slightly smaller one. In the example computed in Section 5, it is smaller by a factor of about 14.
:::

That is the counterintuitive part, and it is worth saying plainly before the arithmetic. Many beginners arrive at crypto expecting the higher volatility to justify a bigger, bolder position. The mathematics says the opposite. The more an asset moves, the less of it you can hold for the same fixed risk.

---

## 2. Realized Volatility, and What the Real Multiple Is

This chapter's roadmap entry carries a headline: crypto volatility is about 5 times forex. That claim deserves the same treatment this course gives every other claim, which is to go and check it rather than repeat it.

First, the term itself.

:::definition
**Realized Volatility** — A measurement of how much an asset's price actually moved over a past window, calculated as the standard deviation of its returns and usually scaled up to an annual figure so different assets can be compared. It is backward-looking and descriptive. It says nothing about what the price will do next, and it is not the same thing as implied volatility, which is what options prices suggest traders expect ahead.
:::

A realized volatility figure is meaningless without three attachments: the window it was measured over, the return frequency used, and the date the window ended. Crypto Chapter 2, Lesson 3 made the same demand of correlation numbers. Apply it here with equal force.

Now the measurements, with their windows attached.

On the crypto side, Bitcoin's annualized realized volatility has been running in the low-to-mid 40s in percentage terms in recent years. Fidelity Digital Assets, in its research note "A Closer Look at Bitcoin's Volatility," reported Bitcoin's 90-day realized volatility averaging in the mid-40s over the two years to 2024 to 2025. BlackRock's iShares published a higher figure of roughly 54% for a window ending near the start of 2025, alongside 15.1% for gold and 10.5% for global equities. The two figures differ because the windows and the ending dates differ, which is exactly the point of the paragraph above. Treat both as commercial research from firms that sell exposure to these assets, and note that they agree on the range even where they disagree on the second digit.

On the forex side, volatility in the major pairs has been in single digits. CME Group's 2024 review of its own CVOL family reported the G5 currency implied volatility index averaging 7.3 in 2024, down from 10.6 in 2022. Separately, the benchmark one-month implied volatility on EUR/USD moved through a range of roughly 6.25 to 9.0 during 2024. The J.P. Morgan G7 FX volatility index has at times printed even lower, reaching a record low near 5.2 in January 2020.

Put those side by side and the honest answer is a range, not a number.

:::example
Take the middle of each recent measurement. Bitcoin at roughly 46% annualized against major-currency volatility at roughly 7% gives 46 / 7 = 6.6 times. Take the friendliest combination for crypto — a calm crypto window near 40% against a stressed forex year near 11% — and the ratio falls to about 3.6 times. Take the harshest — a volatile crypto window near 55% against forex at its record low near 5.2 — and it rises to about 10.6 times.
:::

Peer-reviewed work lands at the top of that range for an earlier period. Dirk G. Baur and Thomas Dimpfl published "The volatility of Bitcoin and its role as a medium of exchange and a store of value" in Empirical Economics, volume 61, issue 5, in 2021, pages 2663 to 2683. Using data from January 2014 to January 2017 across six Bitcoin markets and two foreign exchange markets, they report that Bitcoin's volatility is extreme and almost 10 times higher than the volatility of the major exchange rates they measured, the US dollar against the euro and against the yen. Their conclusion is that this excess volatility is what stops Bitcoin functioning as a medium of exchange.

:::warning
So the roadmap's "5 times" is defensible as a rough floor, and it is not a fact. The verified range across the sources checked for this lesson runs from roughly 4 times to roughly 10 times, depending on which crypto window, which currency benchmark, and which years you pick. The academic measurement over 2014 to 2017 sits near 10 times; the recent commercial measurements sit nearer 5 to 7. Crypto's volatility has also fallen over the past decade, so an old multiple overstates today and a calm-period multiple understates a stress period. Never quote a bare multiple. Quote the window with it, or quote the range.
:::

For the arithmetic in the rest of this lesson, this course uses roughly 46% annualized for Bitcoin and roughly 7% for a major currency pair, and states that choice openly so you can redo the sums with your own figures.

---

## 3. From an Annual Number to a Daily One

An annualized percentage is not something you can place a stop against. Convert it to a daily figure, because a stop lives inside a day or two of price movement.

The conversion is the square root of time. Divide the annual figure by the square root of the number of trading periods in a year. Forex uses about 252 trading days, because the market closes at the weekend. Crypto uses 365, because it never closes at all.

:::example
A major currency pair at 7% annualized: 7 / square root of 252 = 0.44% per day.

Bitcoin at 46% annualized: 46 / square root of 365 = 2.41% per day.

The daily ratio is 2.41 / 0.44 = 5.5 times. On these inputs, an ordinary day in Bitcoin covers about five and a half times as much ground, in percentage terms, as an ordinary day in a major currency pair.
:::

Now put a familiar forex stop next to that. A 50-pip stop on EUR/USD at 1.0800 is a distance of 0.0050 / 1.0800 = 0.463% of the price. Against a daily move of 0.44%, that stop sits at about 1.05 days of typical movement. It is a normal, workable forex stop.

Move the same 0.463% stop onto Bitcoin at 60,000 dollars and it becomes a distance of 278 dollars. Bitcoin's typical daily move on these inputs is 2.41% of 60,000, which is about 1,445 dollars. The stop is now at 0.19 days of typical movement.

:::warning
A stop set at one-fifth of a normal day's movement is not a risk control. It is a coin flip with a fee attached. Ordinary noise — the movement that happens with no news, no trend, and no reason — will reach it, and reach it repeatedly. You have not reduced your risk. You have converted a position with a chance of working into a position that closes at a loss almost immediately, over and over, while paying spread and fees each time.
:::

---

## 4. ATR: A Stop That Scales With the Market

Standard deviation of returns is the right idea, but it is awkward to compute on a chart. Traders use a simpler measure built for exactly this job, and it is older than crypto by three decades.

J. Welles Wilder Jr. introduced it in his book "New Concepts in Technical Trading Systems," published by Trend Research in Greensboro, North Carolina, in 1978 — the same book that introduced the Relative Strength Index you met in Forex Chapter 2, Lesson 2, and the Average Directional Index. Wilder was writing about commodity futures, which gap between sessions, so he needed a range measure that did not ignore the gap.

:::definition
**True Range** — The largest of three distances for a single bar: today's high minus today's low; the absolute difference between today's high and yesterday's close; and the absolute difference between yesterday's close and today's low. Taking the largest of the three means an overnight gap is counted as real movement rather than being missed.
:::

:::definition
**Average True Range (ATR)** — The average of the true range over a set number of recent bars. Wilder used 14 periods and his own running average, in which each new value is the previous ATR multiplied by 13, plus today's true range, divided by 14. ATR is quoted in the price's own units, not as a percentage, so an ATR of 1,900 dollars on Bitcoin means the typical daily bar covers about 1,900 dollars of ground.
:::

Here is the calculation on five daily Bitcoin bars, using a plain average of the five true ranges. The closing price before the first bar was 60,000 dollars.

:::example
Each line gives the day's high, low and close, then the true range that follows from them.

- Day 1: high 61,200, low 59,400, close 60,800 — true range 1,800
- Day 2: high 62,000, low 60,300, close 61,500 — true range 1,700
- Day 3: high 61,800, low 59,900, close 60,200 — true range 1,900
- Day 4: high 60,500, low 58,200, close 58,600 — true range 2,300
- Day 5: high 59,900, low 58,100, close 59,700 — true range 1,800

Check day 3 by hand. High minus low is 61,800 - 59,900 = 1,900. High minus the previous close is 61,800 - 61,500 = 300. The previous close minus the low is 61,500 - 59,900 = 1,600. The largest is 1,900, so the true range is 1,900.

The five true ranges add to 9,500. ATR = 9,500 / 5 = 1,900 dollars. At a price of 60,000 dollars, that is 1,900 / 60,000 = 3.17% of price per day.
:::

:::definition
**Volatility-Adjusted Position Size** — A position size calculated from a stop placed at a multiple of a volatility measure such as ATR, rather than at a fixed number of points or a fixed percentage. Because the stop widens automatically when the market becomes more volatile, the position size shrinks automatically, and the money at risk stays constant.
:::

Common practice places the stop at somewhere between 1.5 and 3 times ATR away from entry. There is no correct multiple, and this course will not pretend there is one. A smaller multiple gets you stopped out by noise more often; a larger one forces a smaller position for the same risk. The multiple is a choice you write into your plan and then apply consistently, so that your results measure your strategy rather than your improvisation.

This lesson uses 2 times ATR. On the numbers above, that is a stop 2 x 1,900 = 3,800 dollars away, which is 3,800 / 60,000 = 6.33% of the price.

---

## 5. The Same 50 Dollars, Two Very Different Positions

Now run both trades. One account, one risk rule, two markets.

The account holds 5,000 dollars. The rule is 1% risk per trade, so the money at risk is 5,000 x 0.01 = 50 dollars. That 50 dollars is identical in both trades and never moves.

:::example
**The forex trade.** EUR/USD, a 50-pip stop, a US-dollar account. Forex Chapter 3, Lesson 1 established that pip value on a standard lot is exactly 10 dollars when the quote currency is your account currency, which is Case A.

Position size = 50 / (50 pips x 10 dollars) = 0.10 standard lots, which is 10,000 euro.

At a rate of 1.0800, that is 10,800 dollars of notional exposure. The stop distance is 0.463% of price. Check the risk: 0.463% of 10,800 dollars = 50 dollars.
:::

:::example
**The Bitcoin trade.** Bitcoin at 60,000 dollars, with the 2 x ATR stop computed in Section 4, which is 3,800 dollars away.

Position size = 50 / 3,800 = 0.01316 Bitcoin.

At 60,000 dollars, that is 789 dollars of notional exposure. The stop distance is 6.33% of price. Check the risk: 0.01316 x 3,800 = 50 dollars.
:::

Compare the two positions. The forex trade carries 10,800 dollars of exposure. The Bitcoin trade carries 789 dollars. That is a factor of 13.7, and it is an order of magnitude apart.

Notice where the 13.7 came from, because it is not mysterious. The Bitcoin stop is 6.33% of price and the forex stop is 0.463% of price, and 6.33 / 0.463 = 13.7. The position ratio is the stop ratio, inverted. Nothing else in the formula moved.

![Diagram showing one 50 dollar risk budget from a 5,000 dollar account producing three very different position sizes as the stop distance widens, with a EUR/USD 50-pip stop at 0.46 percent of price giving 10,800 dollars of exposure, a Bitcoin 2 x ATR stop at 6.33 percent giving 789 dollars, and a forex-sized 0.46 percent stop on Bitcoin giving 10,800 dollars but sitting at one-seventh of a single day's average true range](../images/crypto-03-1-position-sizing.svg)

One honest qualification belongs here. Part of that 13.7 is crypto's volatility and part of it is the fact that the two stops were set at different multiples of daily movement. The 50-pip forex stop sat at about 1.05 daily moves; the 2 x ATR Bitcoin stop sat at about 2.6 daily moves. Set them like for like and the gap narrows to exactly the volatility ratio.

:::example
Put both stops at 2 times the daily move computed in Section 3.

Forex: 2 x 0.44% = 0.88% of price, which is about 95 pips. Position = 50 / 0.0088 = 5,669 dollars of exposure.

Bitcoin: 2 x 2.41% = 4.82% of price. Position = 50 / 0.0482 = 1,038 dollars of exposure.

The ratio is 5,669 / 1,038 = 5.5 times — the same 5.5 from the daily volatility comparison. Position size scales inversely with volatility. Everything above that comes from your choice of stop multiple, not from the asset.
:::

That second example is the more useful one to carry with you. The rule underneath both is simple: for a fixed risk budget, doubling the volatility halves the position.

:::practice
Do this with your own numbers before you trade anything.

Take an account of 2,000 dollars and a risk rule of 1.5% per trade. The asset trades at 3,200 dollars, and its 14-period daily ATR is 96 dollars. You have decided on a 2.5 x ATR stop.

Work through it in four steps. What is the money at risk? What is the stop distance in dollars? What position size does the formula give? What is that position worth at the current price?

The answers, so you can check yourself: the money at risk is 2,000 x 0.015 = 30 dollars. The stop distance is 2.5 x 96 = 240 dollars, which is 7.5% of the price. The position is 30 / 240 = 0.125 units. That is 0.125 x 3,200 = 400 dollars of exposure. Verify it the way this lesson keeps verifying things: 7.5% of 400 dollars is 30 dollars, which is what you decided to risk.

Now redo it with the real ATR of an asset you are actually watching. If the position it produces looks embarrassingly small, the formula is working.
:::

---

## 6. The Classic Beginner Error

Read the last section again and you will see the temptation. A 789-dollar position feels like nothing. The obvious fix seems to be to tighten the stop, because a tighter stop puts a smaller number in the denominator and a bigger position comes out.

Do the arithmetic on that idea.

:::example
Same 5,000-dollar account, same 50 dollars at risk, same Bitcoin at 60,000 dollars. But now use the forex-sized stop from Section 3: 0.463% of price, which is 278 dollars.

Position size = 50 / 278 = 0.18 Bitcoin. At 60,000 dollars, that is 10,800 dollars of exposure — the same size as the forex trade, achieved exactly as hoped.

Now measure that stop against the market instead of against your ambition. The ATR was 1,900 dollars. The stop is 278 / 1,900 = 0.146 of one ATR, or about one-seventh of a single average day. On the five bars used to compute that ATR, the smallest true range was 1,700 dollars, which is 6.1 times the stop distance. On every one of those five days, price travelled more than six times the distance to your stop.
:::

:::warning
Tightening the stop to justify a bigger position does not reduce risk. It relocates it. You have kept the 50 dollars of stated risk per trade and multiplied the number of times you will lose it, because you have placed the exit inside the range the price covers routinely, in both directions, for no reason at all. Forex Chapter 3, Lesson 3 gives the arithmetic that finishes this off: break-even win rate is 1 / (1 + R), so at a 1-to-2 risk-to-reward ratio you must win a third of your trades just to stay level. A stop that ordinary noise reaches several times a day will not deliver that win rate. It will deliver a slow, orderly transfer of your account into spread and fees.
:::

There is a second version of the same error that is harder to spot. It is to keep the correct wide stop, and then quietly raise the risk per trade from 1% to 5% so that the position feels meaningful again. That is not a sizing decision. It is an abandonment of the sizing rule, and it runs straight into the risk-of-ruin result from Forex Chapter 3, Lesson 1: the fraction risked per trade is the dominant lever on the probability of blowing up, ahead of win rate. Ralph Vince's fixed-fractional framework in "The Mathematics of Money Management" (Wiley, 1992) formalises what the classical gambler's-ruin problem already implied. A strategy with a genuine edge still has a high probability of ruin if it is over-sized.

Crypto Chapter 2, Lesson 2 gives you the reason this matters more here than in forex. Bitcoin has recorded three peak-to-trough falls above 70%, reported at roughly 84% to 87%, 83% to 84%, and 77% to 78%. An asset that has done that three times is an asset your position size has to be able to survive, not one your position size can afford to be brave about.

---

## 7. No Closing Bell and No Circuit Breaker

Two structural features of crypto make the wider stop a requirement rather than a preference.

The first is that nothing stops the market. United States equity markets run market-wide circuit breakers: if the S&P 500 falls 7% or 13% during the trading day, trading halts for 15 minutes, and a 20% fall closes the market for the day. Those rules exist because of the 1987 crash, and they buy participants time to think. Crypto has no equivalent, and structurally cannot have one. There is no single venue, no shared session, no open and no close to measure a daily threshold against, and no authority able to pause dozens of independent exchanges at once. Individual exchanges can halt their own markets, which is not the same protection at all.

The second is that the market runs while you sleep. Forex closes at the weekend and gaps over it, which is its own hazard. Crypto never closes, so there is no gap — instead there is a continuous stream of price you are not watching for roughly a third of every day. A move of one ATR overnight is not an unusual event. It is the average event.

:::warning
Your stop order is a request, not a guarantee. Foundations and Forex Chapter 1, Lesson 7 defined slippage as the gap between the price you expected and the price you got. In a fast crypto move on a thin book — and Crypto Chapter 2, Lesson 1 showed you exactly how thin those books can be away from the top of the market — a stop can fill well past its level. Size on the assumption that your actual loss may exceed your planned loss, rather than on the assumption that the stop will hold.
:::

There is a final piece of evidence worth putting next to all of this, because it describes the population you are joining. The Bank for International Settlements published Working Paper No. 1049, "Crypto trading and Bitcoin prices: evidence from a new database of retail adoption," by Raphael Auer, Giulio Cornelli, Sebastian Doerr, Jon Frost and Leonardo Gambacorta, built from daily data on crypto exchange app use across 95 countries over 2015 to 2022. Their estimate is that between 73% and 81% of users are likely to have lost money on their Bitcoin investments. They also find that new users arrive after prices rise, and that when prices rise, larger holders sell — probably to those arriving users.

Read that as a statement about sizing rather than about crypto. Roughly three-quarters of participants losing money is what a market looks like when most people in it are sized for the market they hoped for instead of the one that exists.

---

## What to Look For

- Before sizing, ask what the current ATR of this asset is, in the asset's own price units. If you do not know it, you cannot set a volatility-scaled stop and you are guessing.
- Express your stop as a percentage of price, not as a number of dollars or pips. It is the only form in which a crypto stop and a forex stop can be honestly compared.
- Divide your intended stop distance by the ATR. If the answer is below about 1, ordinary daily movement will reach your stop without any trend at all.
- When a position looks too small to be worth taking, check whether that feeling is being caused by the sizing rule doing its job. Reducing the stop to fix the feeling is the error in Section 6.
- Treat any quoted volatility multiple — including this course's — as attached to a window. Ask which years, which crypto window, and which currency benchmark before you use it.
- Assume your fill will be worse than your stop level in a fast move, and check that your position survives that assumption too.

---

## Practice / Quiz

1. Your account is 5,000 dollars and your rule is 1% risk. Bitcoin trades at 60,000 dollars with a daily ATR of 1,900 dollars, and you set a stop at 2 x ATR. What position size does the formula give?
   - A) 0.18 Bitcoin, worth 10,800 dollars
   - B) 0.01316 Bitcoin, worth about 789 dollars
   - C) 0.0833 Bitcoin, worth 5,000 dollars
   - D) 1 Bitcoin, because the stop distance does not affect size

   **Correct: B.** The money at risk is 5,000 x 0.01 = 50 dollars. The stop distance is 2 x 1,900 = 3,800 dollars. Position size = 50 / 3,800 = 0.01316 Bitcoin, which is 789 dollars of exposure at 60,000 dollars. Option A is the size you get from a 278-dollar stop, which is the error in Section 6.

2. Two traders both risk 1% of the same account. One uses a stop 6.33% of price away, the other uses a stop 0.463% away. How do their position sizes compare?
   - A) They are the same, because the risk percentage is the same
   - B) The wider stop gives a position about 13.7 times larger
   - C) The wider stop gives a position about 13.7 times smaller
   - D) The comparison cannot be made without knowing the win rate

   **Correct: C.** Stop distance sits in the denominator, so position size moves inversely to it. 6.33 / 0.463 = 13.7, so the trader with the wider stop holds about one-fourteenth as much. Both still lose the same amount of money if stopped out, which is the whole purpose of the formula.

3. Why is a stop placed at one-seventh of an asset's daily ATR a poor risk control?
   - A) Because brokers do not accept stops that close to the entry price
   - B) Because ordinary daily movement covers that distance repeatedly, so the position is stopped out by noise rather than by being wrong
   - C) Because it makes the position size too small to be worth trading
   - D) Because ATR cannot be calculated on assets that trade 24 hours a day

   **Correct: B.** ATR measures the distance price typically covers in a day. A stop well inside that distance is reached by movement that carries no information. In the Section 6 example the smallest of five daily true ranges was 6.1 times the stop distance, so price crossed that distance on every one of those days. The stated risk per trade stays at 50 dollars; what rises is the number of times you pay it.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Realized Volatility | The standard deviation of an asset's past returns, usually annualized — always quoted with its measurement window. |
| True Range | The largest of today's high-low range, today's high minus yesterday's close, and yesterday's close minus today's low. |
| Average True Range (ATR) | The average true range over a set number of recent bars, quoted in the price's own units (Wilder, 1978). |
| Volatility-Adjusted Position Size | A position size derived from a stop set at a multiple of ATR, so the size shrinks automatically as volatility rises. |

---

*Coming next: Lesson 2 — Custody & Security Risk: hacks, phishing, SIM swaps and token approvals, the risk class that is not price risk at all, and the checklist that mitigates it.*
