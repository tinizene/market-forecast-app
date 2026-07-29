# Crypto — Chapter 3, Lesson 3: Leverage, Perpetuals & Liquidation

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what a perpetual swap is mechanically, and read the funding rate as an ongoing cost rather than only as a positioning signal
- Compute the liquidation price of a leveraged position, and the adverse move that reaches it at 2x, 5x, 10x, 25x, 50x and 100x
- Set those distances against crypto's measured daily volatility, and explain why high leverage converts a trading position into a near-certain forced exit
- Describe how a liquidation cascade works in a thin order book, and what isolated margin, cross margin, insurance funds and auto-deleveraging each do to you

---

## 1. Paying Off the Promise from Chapter 2

Chapter 2, Lesson 5 introduced two terms and then stopped short on purpose. It defined the perpetual swap as a derivative that tracks an asset's price and never expires. It defined the funding rate as the periodic payment that flows between long and short holders to keep the perpetual price near spot. It taught you to read that rate as a positioning proxy — persistently positive funding means the long side is crowded and paying to stay there.

Then it said this: the rest of the machinery would be covered in Chapter 3, Lesson 3, as a risk topic. This is that lesson.

Both terms stay exactly as Chapter 2 defined them. Nothing here redefines them. What changes is the question being asked. Chapter 2 asked what the funding rate tells you about other people. This lesson asks what the whole instrument does to you.

The short answer is the one this lesson exists to make precise: on a leveraged perpetual position, the thing that ends most accounts is not being wrong about direction. It is being closed out before direction has a chance to matter.

:::warning
This lesson is not a guide to trading perpetuals. It is a guide to understanding what they are before someone offers you 100x on one. Chapter 2 ended with the sensible use of funding data for a beginner: read it, and stay in spot. Nothing in this lesson changes that recommendation. What follows is the arithmetic that justifies it.
:::

---

## 2. What a Perpetual Actually Is, Mechanically

Start with the ordinary futures contract, because the perpetual is defined by what it removes.

An ordinary futures contract has an expiry date. On that date the contract settles against the spot price, and that forced convergence is what keeps futures prices tethered to spot in the first place. Traders who buy the future far above spot know that the gap must close by expiry, so they do not pay the gap.

A perpetual has no expiry date. That removes the tether. So the venue installs a different one: a recurring cash payment between the two sides of the market, sized to punish whichever side has pushed the perpetual price away from spot.

That payment is the funding rate. Chapter 2 gave you the mechanism: when the perpetual trades above spot, funding is positive and longs pay shorts. When it trades below spot, funding is negative and shorts pay longs. On Binance, Bybit and OKX the settlement interval is every 8 hours; some venues, including Hyperliquid, settle hourly. On major venues the money moves between traders, not to the exchange.

Three mechanical points that Chapter 2 did not need, and that this lesson does.

:::definition
**Notional Value** — The full size of the exposure a position controls, measured in the underlying asset's currency. It is not the money you posted. A position with 500 dollars of margin at 20x leverage has a notional value of 10,000 dollars, and every percentage move, every fee and every funding payment is computed against the 10,000, not the 500.
:::

Notional is the number that does everything to you. Your margin is the number that runs out.

The second point is that funding is charged on notional, not on margin. That is what makes it dangerous at high leverage, and Section 3 computes it.

The third point is which price the venue uses. Exchanges do not liquidate positions off the last traded price on their own order book, because that price can be pushed around by a single large order on a thin book. They liquidate off a mark price, typically built from an index of several spot venues plus a funding adjustment. This is a genuine protection, and it is not a complete one — the mark price still follows the market down in a real move, and a wick on one venue's own book can still fill orders at prices the mark price never reached.

---

## 3. Funding Is a Cost, and It Bleeds a Position That Is Merely Flat

Chapter 2 computed funding on a 10,000 dollar notional long at plus 0.01% per 8-hour period: 1 dollar per settlement, 3 dollars a day, 0.03% of notional a day. That is the cost side. Now put leverage next to it, because the same payment looks completely different when you measure it against the money you actually posted.

:::example
You post 200 dollars of margin and open a long perpetual at 50x. Notional is 200 x 50 = 10,000 dollars.

Funding is plus 0.01% per 8-hour period, which is the ordinary, unremarkable level.

Cost per day = 10,000 x 0.0001 x 3 = 3 dollars.

Against notional, that is 0.03% a day — trivial. Against your 200 dollars of margin, it is 1.5% a day. Nothing has happened to the price. You are simply paying 1.5% of your posted capital every day to keep the position open.

Now raise funding to plus 0.1% per period, which occurs in strongly one-sided markets. Cost per day = 10,000 x 0.001 x 3 = 30 dollars. That is 15% of your margin, per day, with the price completely unchanged.
:::

The general rule is worth memorising because it takes one multiplication. Funding cost as a percentage of your margin, per day, equals the daily funding rate on notional multiplied by your leverage.

- At 10x, funding of 0.01% per 8 hours costs 0.3% of margin per day.
- At 50x, the same funding costs 1.5% of margin per day.
- At 100x, the same funding costs 3.0% of margin per day.

:::warning
Funding is not a fee you pay when you are wrong. It is a fee you pay for being on the crowded side, and it accrues while the price does nothing at all. A position that is exactly flat on price can still be down 15% of its margin after ten days at ordinary funding and 50x leverage. In spot, time is free. In a leveraged perpetual, time has a price, and the crowd sets it.
:::

There is a second-order point that connects back to Chapter 2. Funding rises precisely when one side is crowded. So the cost of holding is highest exactly when the position is most popular — which is exactly when the crowd is most vulnerable to being unwound. You are paying the most to hold at the moment the position is most fragile. That is not a coincidence, it is the mechanism working as designed.

---

## 4. The Liquidation Price, and How Close It Is

Everything in Forex Chapter 1, Lesson 6 and Forex Chapter 3, Lesson 2 carries over intact. Leverage is borrowed buying power, margin is your own capital held as collateral, and the two are inverses: at 50x the margin requirement is 1/50 = 2% of the position. Equity is balance plus or minus floating profit and loss. Free margin is equity minus used margin. Effective leverage is total position size divided by equity, and it, not the venue's advertised maximum, is what sets your distance to trouble.

The crypto venue changes the vocabulary and one piece of the arithmetic. There is no broker phoning you. There is a threshold, and a bot.

:::definition
**Maintenance Margin** — The minimum equity a position must retain, expressed as a percentage of its notional value, before the venue closes it. It is set by the exchange in tiers: larger positions carry higher maintenance margin percentages. A common figure for a small position in a major contract is around 0.4% to 0.5%.
:::

:::definition
**Liquidation** — The forced closure of a leveraged position by the exchange when its equity falls to the maintenance margin. It is not a warning and not a request. It is the Forex track's stop-out level (Chapter 3, Lesson 2) with no margin call in front of it and no human in the loop.
:::

:::definition
**Liquidation Price** — The price of the underlying asset at which a position's equity falls to its maintenance margin, so the exchange closes it. For a long position it sits below the entry price; for a short, above. It can be computed before you open the trade, and it should be.
:::

The formula the major venues publish reduces, for a simple single position in isolated margin, to this:

Liquidation price for a long = Entry price x (1 - 1/Leverage + Maintenance margin rate)

Which means the adverse move that liquidates you, as a percentage of entry, is approximately:

Adverse move to liquidation = 1/Leverage - Maintenance margin rate

Read that second line carefully, because it is the whole lesson in one expression. The distance to your liquidation is set by your leverage and almost nothing else. It is not set by your skill, your analysis, your conviction, or how right you turn out to be three days later.

:::example
Bitcoin is at 100,000 dollars. You go long. Maintenance margin is 0.4%. Here is the liquidation price and the adverse move that reaches it, at each leverage level:

- 2x: liquidation at 50,400 dollars, a fall of 49.6%
- 5x: liquidation at 80,400 dollars, a fall of 19.6%
- 10x: liquidation at 90,400 dollars, a fall of 9.6%
- 25x: liquidation at 96,400 dollars, a fall of 3.6%
- 50x: liquidation at 98,400 dollars, a fall of 1.6%
- 100x: liquidation at 99,400 dollars, a fall of 0.6%

Fees and funding shorten every one of these distances further, because both eat the equity that stands between you and the maintenance margin.
:::

![Diagram showing how the distance from entry price to liquidation price collapses as leverage rises from 2x to 100x, with a typical one-day price range band overlaid to show that at 25x and above the liquidation level sits inside the range that ordinary daily noise covers](../images/crypto-03-3-liquidation-distance.svg)

---

## 5. Now Compare That to What Crypto Actually Does in a Day

A distance means nothing on its own. It means something when you set it against how far the asset routinely travels.

Lesson 1 of this chapter did that measurement and settled on a working figure. It compared Fidelity Digital Assets' 90-day realized volatility for bitcoin, averaging in the mid-40s over the two years to 2024 and 2025, with BlackRock's iShares figure of roughly 54% for a window ending near the start of 2025, alongside 15.1% for gold and 10.5% for global equities. It then adopted roughly 46% annualised for bitcoin, stating the choice openly. This lesson uses the same number, so the two lessons stay comparable.

Convert it to a single day. Crypto trades every day, so divide by the square root of 365.

:::example
46 / 19.105 = 2.41% per day.

So a typical, unremarkable, no-news day in bitcoin has a standard deviation of about 2.41%. The full high-to-low range of a day is wider still: Lesson 1's worked average true range was 1,900 dollars on a 60,000 dollar price, which is 3.17% of price covered by the average daily bar.

Now set both figures beside Section 4's distances:

- At 10x, liquidation is 9.6% away — about 4.0 daily standard deviations, or about 3.0 average daily ranges.
- At 25x, liquidation is 3.6% away — about 1.5 standard deviations, or about 1.1 average daily ranges.
- At 50x, liquidation is 1.6% away — about 0.66 standard deviations, or about half of one average daily range.
- At 100x, liquidation is 0.6% away — about 0.25 standard deviations of a day, which is roughly one and a quarter hours of typical movement.
:::

Read the 25x line again, because it is the quietest and the most damning. At 25x, the distance to your liquidation is about 1.1 average daily bars. A single day that runs slightly wider than average covers it. Not a crash. Not a news event. A day.

You can go one step further and estimate how likely a random price path is to touch that level. Using a driftless random walk with a 2.41% daily standard deviation, the probability of touching the liquidation level at least once is roughly:

- 10x: near zero in a day, about 13% in a week, about 47% in a month
- 25x: about 13% in a day, about 57% in a week, about 79% in a month
- 50x: about 51% in a day, about 80% in a week, about 90% in a month
- 100x: about 80% in a day, about 93% in a week, about 96% in a month

Two honest warnings about those numbers. First, they assume no drift and no fees, so they describe pure noise and nothing else. Second, and more importantly, they assume returns are normally distributed — and the whole course has been telling you they are not. Foundations Chapter 3 introduced fat tails; Forex Chapter 5 showed two events that no normal distribution would have permitted. So treat the figures above as a floor, not an estimate.

That is not a rhetorical claim. It is a measured one.

:::example
Zhiyong Cheng, Jun Deng, Tianyi Wang and Mei Yu studied forced liquidations directly on BitMEX perpetual bitcoin futures, using generalised extreme value theory to model the tails rather than assuming normality. Their paper is "Liquidation, leverage and optimal margin in bitcoin futures markets," published in Applied Economics, Volume 53, Issue 47, in 2021, and circulated earlier as arXiv preprint 2102.04591.

Their findings:

- Daily forced liquidations ran at 3.51% of outstanding long positions and 1.89% of outstanding short positions. Every single day, at the venue's prevailing margin rules.
- Traders who were liquidated had been running average leverage of 60x.
- To bring the daily liquidation probability down to 1%, they calculated that the exchange would need to raise its 1% margin requirement to 33%, which is 3x leverage for longs, and to 20%, which is 5x for shorts.
- Assuming normally distributed returns significantly underestimates the margin actually required.

Read the third point again. A peer-reviewed study, working from real liquidation data on a real venue, concluded that the leverage consistent with a 1% daily blow-up risk is about 3x to 5x. Not 50x. Not 100x.
:::

:::warning
Leverage does not increase your edge. If you have no edge, leverage multiplies zero. If you have a small edge, leverage does not enlarge it — it enlarges the variance around it, so the edge has less time to express itself before an unlucky stretch removes your capital. What leverage buys is speed: the same distribution of outcomes, resolved faster and with a hard floor at zero. Speed is not an advantage when one of the outcomes is elimination.
:::

:::warning
At 50x and 100x you are not trading a view. The liquidation level sits inside the range that ordinary noise covers within hours, so the outcome is decided by which direction the noise happens to wander first. That is a lottery ticket with a near-certain expiry date, priced in funding payments. Calling it a trade does not change what it is.
:::

---

## 6. Liquidation Cascades: Why the Move Does Not Stop Where It Should

Everything above treats price as something that happens to your position. In a leveraged market, the causation runs the other way as well.

:::definition
**Liquidation Cascade** — A self-reinforcing sequence in which forced closures push the price further in the same direction, which pushes more positions past their liquidation levels, which forces more closures. The selling is not a choice made by anyone. It is a mechanical consequence of the previous selling.
:::

The mechanism needs Chapter 2, Lesson 1. That lesson taught order book depth and price impact: a market order eats resting orders one price level at a time, and in a thin book the same order that costs 0.18% in a deep book costs 23% instead. A liquidation is a market order. It is an unusually urgent, price-insensitive market order, placed by a bot that has no discretion about whether to place it.

So the loop is:

1. Price falls enough to reach a cluster of long liquidation levels.
2. The exchange sends market sell orders for those positions.
3. Those orders consume the resting bids, and the price falls further.
4. The lower price reaches the next cluster of liquidation levels.
5. Return to step 2.

The loop is worst exactly when the book is thinnest, and the book is thinnest exactly when volatility spikes, because market makers widen their quotes or withdraw entirely when they cannot price risk. The two effects arrive together.

:::example
On 10 October 2025, crypto markets ran the loop at record scale.

The trigger was outside crypto: an announcement of new United States tariffs on Chinese imports set off cross-asset selling. Crypto entered that shock with open interest near record highs and heavily one-sided long positioning.

The reported figures, from the derivatives data firm CoinGlass: roughly 19.1 to 19.5 billion dollars of leveraged positions liquidated within 24 hours, across roughly 1.62 million accounts. Longs were approximately 85% to 90% of the total. That is the largest single-day liquidation total on record — more than twice the roughly 8 to 8.6 billion dollars liquidated on 19 May 2021, which had held the record until then.

Sources disagree on bitcoin's exact intraday path, and it is worth saying so rather than picking the most dramatic number. Reports place the fall at roughly 15% to 18% within hours, from a starting point variously given as about 122,000 to 126,300 dollars down to about 103,300 to 106,600 dollars. Smaller tokens fell far harder: several major altcoins printed intraday falls in the 60% to 80% range, and a few briefly traded near zero on individual venues.

The depth collapse was the amplifier. Analysis of exchange order books during the event found top-of-book depth on major venues falling by well over 90%, with bids reappearing only 4% and 10% away from the mid price. CoinDesk reported in November 2025 that order book depth remained well below early-October levels a month later.
:::

:::warning
The reported liquidation total is a floor, not a measurement, and the data providers say so themselves. CoinGlass has stated that Binance's public liquidation feed transmits only one liquidation order per second per contract, so during a burst the great majority of forced closures never enter the public data at all. CoinGlass put the resulting undercount at 10 to 20 times for that venue; Hyperliquid's co-founder suggested it could be worse under some conditions. Estimates of the true October 2025 total run to 30 to 40 billion dollars. Treat every published liquidation figure, including the ones in this lesson, as the visible part of a larger number.
:::

Two earlier events show the same structure and are worth knowing.

On 12 March 2020, during the initial COVID-19 market panic, bitcoin on BitMEX fell from roughly 7,939 dollars to roughly 4,346 dollars, about 45%, with roughly 700 million dollars of liquidations on that venue alone. The exchange then went offline for about 25 minutes. On 19 May 2021, after a Chinese regulatory announcement, bitcoin fell from roughly 43,000 dollars to below 31,000 dollars intraday, with roughly 8 billion dollars liquidated across venues.

The course has taught this shape twice already in another market. Forex Chapter 5, Lesson 1 showed the Swiss franc floor breaking in 2015: stop-losses triggered correctly and filled hundreds of pips away, because buyers vanished at the exact moment the sell orders arrived. Forex Chapter 5, Lesson 2 showed the 2008 yen carry unwind: a crowded, leveraged position that everyone was forced to exit at once, so the exit itself moved the price against every person exiting.

:::warning
A stop-loss does not protect you from a cascade, and neither does the exchange's liquidation engine. Both become market orders when they fire, and a market order needs a buyer. Forex Chapter 5, Lesson 1 is the definitive case: correctly placed stops and correctly functioning broker stop-outs both failed in 2015, and accounts went negative anyway. If your plan depends on exiting at a specific price during a violent move, you do not have a plan — you have a hope about liquidity.
:::

---

## 7. Isolated Margin, Cross Margin, and the Two Backstops

Venues offer two ways to attach collateral to a position. The choice is a real one, and neither answer is universally correct.

:::definition
**Isolated Margin** — A mode in which only the margin explicitly assigned to a position can be used to support it. If the position is liquidated, the loss is capped at that assigned margin, and the rest of the account is untouched. The position is also easier to liquidate, because it cannot draw on the rest of your balance to survive.
:::

:::definition
**Cross Margin** — A mode in which the whole account balance backs every open position. A position can absorb a much larger adverse move before liquidation, because it draws on the entire balance. The cost is that a single bad position can consume the whole account, and positions become linked: a loss on one reduces the cushion under all the others.
:::

The trade is straightforward once stated plainly. Isolated margin risks a defined amount and liquidates sooner. Cross margin survives longer and risks everything. Beginners frequently choose cross margin because it feels safer — the position lasts longer — and that is exactly the misreading. It lasts longer by putting more of your money behind it.

:::warning
Cross margin does not reduce risk. It relocates it, from a defined loss on one position to an undefined loss across the account. A trader using cross margin on a 50x position has not made the position safer; they have volunteered the entire balance as its collateral. Chapter 3, Lesson 1 built you a risk budget. Cross margin is the setting that quietly overrides it.
:::

Behind both modes sit two exchange mechanisms most people meet only when they are on the wrong end of them.

When a position is liquidated, the exchange tries to close it in the market. If the fill is worse than the bankruptcy price — the price at which the position's margin is exactly exhausted — the position has produced a loss with no capital behind it. Someone has to absorb it. The venue's insurance fund is the first line: a reserve built up from liquidations that closed better than their bankruptcy price, used to cover the ones that close worse.

When the insurance fund cannot cover the shortfall, exchanges use auto-deleveraging.

:::definition
**Auto-Deleveraging (ADL)** — The exchange's last-resort mechanism: it forcibly closes profitable positions on the opposite side of a bankrupt position, at the bankruptcy price, to make the books balance. Traders are ranked for ADL by profitability and effective leverage, so the most profitable and most leveraged winners are taken first.
:::

Here is the honest paragraph on those two mechanisms. The insurance fund is a genuine protection and it usually works, which is why most traders never hear of it. Auto-deleveraging is not a protection for you — it is a protection for the exchange's solvency, paid for by closing correct positions without consent. It is documented openly in the risk pages of Binance, Bybit, OKX and the major decentralised venues, so it is not a hidden term. But it means that on a leveraged perpetual, even a completely correct position can be closed early and at a price you did not choose, because someone on the other side of the market defaulted and the fund ran dry. Reports from the October 2025 event describe exactly this happening across several venues. If you take one structural fact from this section, take that one: on a perpetual, being right does not guarantee you get paid in full.

---

## 8. What the Evidence Says About Leveraged Retail Accounts

Start with what the venues offer, because the gap between that and what regulators permit is the single most useful fact in this section.

At the time of writing, the largest crypto derivatives venues advertise maximum leverage roughly as follows. Binance lists up to 125x on its bitcoin perpetual, but only for small position sizes, with the maximum falling as notional rises; new futures accounts are also capped lower, around 20x, until the account has aged. OKX advertises up to 125x on some derivatives products and lower ceilings on others. Bybit lists up to 100x on selected pairs. Hyperliquid, a decentralised venue, caps at roughly 40x to 50x.

:::warning
Treat every one of those numbers as a snapshot, not a fact. Venue maximums change frequently, they are tiered so the headline figure applies only to small positions, they often depend on how old your account is, and they are simply unavailable to retail users in several jurisdictions. Check the venue's own current documentation rather than any article, including this one. What does not change is the arithmetic in Section 4: whatever number you select, the distance to liquidation is approximately 1 divided by it.
:::

Now put those figures next to the regulatory ones, because the claim that most retail leveraged traders lose money gets asserted constantly and sourced almost never. There is real evidence. It is not crypto-specific, and the honest thing is to say so and explain why it still matters.

:::example
The European Securities and Markets Authority restricted contracts for difference sold to retail investors in 2018, and published the analysis behind it. Drawing on data collected by national regulators across the European Union, ESMA reported that 74% to 89% of retail CFD accounts typically lose money, with average losses per client ranging from 1,600 to 29,000 euros. The measures were agreed on 23 March 2018 and applied to CFDs from 1 August 2018.

The leverage caps ESMA imposed were graded by the volatility of the underlying: 30:1 for major currency pairs, 20:1 for non-major pairs, gold and major indices, and — at the bottom of the scale — 2:1 for cryptocurrencies.

The United Kingdom's Financial Conduct Authority has required CFD firms to display the percentage of their own retail accounts that lost money over the previous 12 months. Published figures across firms cluster around and above 70%, and the FCA's own sampling put the figure above 80%.
:::

Two caveats belong with that, stated plainly. This is CFD and forex data, not crypto data. And a CFD is not a perpetual swap: different product, different venues, different regulator.

It is still the most relevant regulator-grade measurement available, for two reasons. First, it measures the thing in question — retail accounts using leverage — rather than retail accounts generally. Second, the same regulator, looking at the same evidence, rated cryptocurrency as the most dangerous underlying on its entire list, capping it at 2:1 where major currencies got 30:1. That is a 15-fold difference, and the stated reason was the volatility of the underlying plus the difficulty of valuing it. If 74% to 89% of accounts lose at 30:1 on major currencies, there is no version of the argument in which crypto at 50x is the safer proposition.

The FCA went further than a cap. It banned the sale of crypto derivatives to retail consumers entirely, effective 6 January 2021, on the grounds that they cannot be reliably valued by retail consumers. That ban was still in force in 2025, and remained in force even when the FCA separately allowed retail access to crypto exchange-traded notes from 8 October 2025.

There is also causal evidence that capping leverage helps, which Forex Chapter 1, Lesson 6 already covered and which is worth restating here.

:::example
Rawley Heimer and Alp Simsek, in "Should retail investors' leverage be limited?", Journal of Financial Economics, Volume 132, Issue 3, 2019, pages 1 to 21, used the 2010 United States cap on retail forex leverage as a natural experiment, comparing capped American traders against still-uncapped European ones. They found the constraint reduced trading volume by 23% and alleviated high-leverage traders' losses by about 40%. The trading the cap removed was disproportionately speculative rather than informed.
:::

For crypto specifically, the closest measurement is about spot buying rather than leverage, and it is worth quoting with that limitation attached. In Bank for International Settlements Working Paper No 1049, "Crypto trading and Bitcoin prices: evidence from a new database of retail adoption," published in November 2022 and later in the IMF Economic Review, the authors used daily crypto-app usage data across 95 countries from 2015 to 2022. Under the assumption that each new user bought 100 dollars of bitcoin in the month they downloaded the app and in every month after, 81% would have lost money; across their range of assumptions, an estimated 73% to 81% of retail investors likely lost money on their investment.

That study used no leverage at all. It is a measurement of what buying spot at the times retail typically buys produced. Adding a liquidation price to that behaviour does not improve it.

---

## 9. Leverage Does Not Change the Risk Budget

Chapter 3, Lesson 1 gave you a position-sizing rule: decide the fraction of the account you are willing to lose on one idea, and size the position so that reaching your invalidation level costs exactly that. Leverage does not alter that budget. It alters how quickly you arrive at it.

Work the arithmetic in both directions, because it is clarifying.

:::example
You have a 1,000 dollar account and you are willing to risk 1% of it, which is 10 dollars, on one idea. You have decided that a 5% adverse move in the asset would prove you wrong.

Correct sizing: notional = 10 / 0.05 = 200 dollars. On a 1,000 dollar account, that is effective leverage of 0.2x. You are using less than one times your capital. That is what a 1% risk budget with a 5% invalidation level actually produces in an asset this volatile — and it is why Chapter 3, Lesson 1 warned that crypto's volatility makes correct positions look uncomfortably small.

Now the reverse. Suppose you open 50x instead: 50,000 dollars of notional on the same 1,000 dollar account. How far can the price move before you have lost your 10 dollar budget? 10 / 50,000 = 0.02%. Two hundredths of one percent. Your entire risk budget is consumed by the bid-ask spread and a moment of noise.
:::

That is the cleanest statement of the whole lesson. At high leverage there is no position size at which the risk budget and the liquidation level are compatible. The budget says you may lose 10 dollars. The instrument says the smallest unit of loss it can deliver is most of your margin.

:::practice
Take any leveraged position you have seen described online, or invent one. Write down four numbers before anything else: the notional value, the margin posted, the liquidation price computed from Section 4's formula, and the adverse move that reaches it as a percentage. Then look up the asset's largest single-day move over the past 12 months and write that down as a fifth number. If number five is larger than number four, the position was already decided before it was opened. Do this for 5x, 25x and 100x on the same asset and keep the sheet.
:::

---

## What to Look For

- Compute the liquidation price before you open any leveraged position, not after. If you cannot state it as a number and as a percentage move, you do not know what the position is.
- Compare that percentage to the asset's ordinary daily range, not to your expectation of where price is going. Noise decides whether you survive to find out if you were right.
- Check the funding rate and the settlement interval, then multiply by your leverage to get the daily cost as a share of your margin. If that number is large, you are paying rent on a crowded position.
- Know which margin mode you are in. If it is cross margin, the position is collateralised by your whole balance, whatever the position size suggests.
- Treat published liquidation totals as floors. The public feeds throttle during exactly the events you would want to measure.
- Never rely on a stop-loss to define your worst case in a leveraged crypto position. Size the position so that a gap straight through the stop is survivable, which is the same conclusion Forex Chapter 5, Lesson 1 reached from a different market.
- If a venue's marketing leads with the maximum leverage available, read that as a statement about the venue's revenue model, not about your opportunity.

---

## Practice / Quiz

1. Bitcoin is at 100,000 dollars and you open a long at 50x with a maintenance margin rate of 0.4%. Roughly what adverse move liquidates the position, and what does that distance depend on?
   - A) About 50%, and it depends mainly on how much margin you posted
   - B) About 1.6%, and it depends almost entirely on the leverage chosen
   - C) About 2%, and it depends on how accurate your analysis is
   - D) There is no fixed distance, because the exchange decides case by case

   **Correct: B.** The adverse move to liquidation is approximately 1/Leverage minus the maintenance margin rate: 1/50 = 2%, minus 0.4%, which is 1.6%. The liquidation price is 100,000 x (1 - 0.02 + 0.004) = 98,400 dollars. Note what does not appear in that formula: your analysis, your conviction, or how right you are later. Bitcoin's one-day standard deviation at the 46% annualised figure this chapter uses is about 2.41%, so 1.6% is well inside a normal day's wandering.

2. Funding on a perpetual is plus 0.01% per 8-hour period, which is an ordinary level. You hold a long with 200 dollars of margin at 50x, so notional is 10,000 dollars. The price does not move at all for ten days. What has happened to your account?
   - A) Nothing, because funding is only charged when a position is losing
   - B) You have paid about 3 dollars in total, since funding is charged on your margin
   - C) You have paid about 30 dollars, which is 15% of your margin, because funding is charged on notional
   - D) You have earned funding, because the price did not move

   **Correct: C.** Funding is charged on notional value, not on posted margin. 10,000 x 0.0001 = 1 dollar per settlement, three settlements a day, so 3 dollars a day, and 30 dollars over ten days. That is 15% of a 200 dollar margin, with the price completely unchanged. The general rule: daily funding cost as a share of margin equals the daily rate on notional multiplied by leverage.

3. During the October 2025 cascade, roughly 19 billion dollars of positions were liquidated in 24 hours, and order book depth on major venues fell by well over 90%. Why does the depth collapse matter for someone holding a stop-loss?
   - A) It does not matter, because a stop-loss guarantees the exit price
   - B) A stop-loss becomes a market order when it fires, and in a collapsed book it fills far from its level or feeds the cascade itself
   - C) Stop-losses are converted into limit orders during high volatility to protect traders
   - D) The exchange suspends all stop-losses during a cascade

   **Correct: B.** A triggered stop is a market order, and a market order needs resting bids to fill against. When depth collapses, those bids sit 4% or 10% away instead of a few basis points away — so the fill arrives far below the stop level, and the order itself consumes what depth remains, pushing price toward the next cluster of liquidation levels. This is the same failure Forex Chapter 5, Lesson 1 documented when the Swiss franc floor broke in 2015: the stops triggered correctly and filled catastrophically.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Notional Value | The full exposure a position controls, against which fees, funding and percentage moves are computed — not the margin posted. |
| Maintenance Margin | The minimum equity a position must retain, as a percentage of notional, before the exchange closes it. |
| Liquidation | The forced closure of a leveraged position by the exchange when equity falls to the maintenance margin. |
| Liquidation Price | The asset price at which a position's equity reaches maintenance margin, computable before the trade is opened. |
| Liquidation Cascade | A self-reinforcing loop where forced closures push price further, triggering more forced closures in a thinning book. |
| Isolated Margin | A mode where only the margin assigned to a position backs it — loss is capped, liquidation comes sooner. |
| Cross Margin | A mode where the whole account balance backs every position — liquidation comes later, and the whole balance is at risk. |
| Auto-Deleveraging (ADL) | The exchange's last resort: forcibly closing profitable opposing positions at the bankruptcy price when the insurance fund cannot cover a shortfall. |

---

*Coming next: Chapter 4 — Psychology, Scams & Building a Plan, opening with Lesson 1 on FOMO, unit bias and the hype cycle: the crypto-specific psychology that sits on top of the disposition-effect and overtrading evidence from Forex Chapter 4.*
