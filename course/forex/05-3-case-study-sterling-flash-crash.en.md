# Forex Track — Chapter 5, Lesson 3: Case Study — The 2016 Sterling Flash Crash

## Learning Objectives

By the end of this lesson, you will be able to:

- Recount what happened to the pound on 7 October 2016
- Explain how thin liquidity and time of day turn a small imbalance into a crash
- Connect the event to spreads, order execution, and stop cascades from earlier chapters
- Understand why execution and liquidity risk can matter more than being right about direction

---

## 1. What Happened

In the very early hours of 7 October 2016 — just after midnight in London, the quietest stretch of the trading day — the British pound suddenly fell off a cliff. GBP/USD dropped about 6% in roughly two minutes, plunging to a 31-year low around 1.18, before recovering much of the loss almost as quickly.

What makes this case different from the Swiss franc shock is that there was no single dramatic announcement behind it. No central bank moved. No headline number was released. A currency of a major economy simply lost a large fraction of its value in minutes and then partly reappeared, in a market that is supposed to be the most liquid on earth.

:::definition
**Flash Crash** — A very rapid, deep price drop that reverses within minutes, driven by a collapse in liquidity and the interaction of automated orders rather than by fundamental news.
:::

---

## 2. Why It Happened

An official investigation gave the clearest answer, and its most useful conclusion is that there was no single cause.

:::example
The Bank for International Settlements — the same body behind the currency-turnover survey you met in Chapter 1 — convened its Markets Committee to study the event. Its report concluded that a range of factors, not one trigger, combined to cause the crash. The time of day made the sterling market unusually thin, so order flow was easily overwhelmed. On top of that came genuine selling pressure — including demand to sell pounds to hedge options positions — and, critically, the execution of stop-loss orders, with algorithmic systems adding to the selling into a market with almost no one on the other side.
:::

![Diagram of GBP/USD falling about 6 percent in two minutes to a 31-year low near 1.18 in the thin overnight session then mostly recovering, the BIS finding of no single cause (thin time-of-day liquidity, options-hedging sell flow, stop-loss cascade, and algorithms), and the lesson that thin liquidity and timing are real execution risks](../images/forex-ch5-sterling-flash-crash.svg)

Every piece of that maps onto something you already know. Thin liquidity is the flip side of the bid-ask spread from Chapter 1, Lesson 4 — when few participants are willing to trade, prices move much further for a given order. The stop-loss cascade is the stop-out mechanics of Chapter 3, Lesson 2 at market scale: falling prices trigger stops, which become market sell orders, which push prices lower, which trigger more stops. And the timing is the mirror image of the economic-calendar discipline in Chapter 2, Lesson 4 — the market was fragile precisely because it was the hour when almost no one was trading.

:::warning
A flash crash is not really about the news that started it. It is about a market so thin that a modest imbalance meets no resistance, and automated stop and hedging orders feed on each other. The same sell order that barely moves price during the busy London afternoon can crater it at one in the morning. Liquidity, not headlines, decided how far this move went.
:::

---

## 3. What This Teaches About Execution

The Swiss franc shock taught that a stop-loss may not fill at its level. The sterling flash crash sharpens the point: even without any fundamental reason, the market itself can move against you faster than any exit can keep up — and then move back, having taken out your position on the way.

:::example
Consider a trader holding a long pound position with a sensible stop, asleep during the London night. The flash crash triggers the stop deep in the plunge, filling far below its level in the thin market — and then price recovers within minutes. The trader is left with a real, oversized loss from a move that had largely reversed by the time they woke. They were not wrong about the pound. They were caught by when and how the market moved, not by which direction it ultimately went.
:::

:::warning
This is why the course keeps insisting that execution and risk control matter more than prediction. Two defences would have softened this: trading the pound during liquid hours rather than holding naked exposure through the thinnest part of the night, and sizing so that even a violent, illiquid spike against you is survivable. Neither requires predicting the crash — only respecting that liquidity and timing are real risks, not background details.
:::

---

## What to Look For

- Know the quiet hours for the pairs you trade. Thin sessions — deep night for a currency's home market — are where small imbalances become large moves.
- Treat any stop held through an illiquid period as one that may fill far from its level, exactly as in a gap.
- Recognise a stop cascade: falling price triggering stops that push price lower still. It is the same stop-out mechanism from Chapter 3, Lesson 2, at market scale.
- Judge your exposure by what a thin-market spike could do to it, not only by whether your directional view is right.

---

## Practice / Quiz

1. According to the BIS report, what best explains the severity of the 2016 sterling flash crash?
   - A) A single major news announcement
   - B) A combination of factors — very thin overnight liquidity, options-hedging sell flow, stop-loss execution, and algorithms — with no single cause
   - C) The Bank of England raising interest rates
   - D) A permanent change in the pound's value

   **Correct: B.** The BIS Markets Committee found a range of factors combined, led by the extreme thinness of the market at that hour, rather than one dramatic trigger.

2. How does a "stop cascade" deepen a flash crash?
   - A) Stops cancel each other out and calm the market
   - B) Falling prices trigger stop-losses that become market sell orders, pushing prices lower and triggering still more stops
   - C) Stops guarantee execution at the set price, preventing losses
   - D) Stops only apply during liquid hours

   **Correct: B.** It is the stop-out mechanism from Chapter 3, Lesson 2 at scale: each wave of triggered stops adds selling into a thin market, driving price down and setting off the next wave.

3. True or False: because the pound largely recovered within minutes, a trader holding a stop through the crash would have been unharmed.

   **Correct: False.** A stop triggered in the plunge fills in the thin market, far below its level, locking in a real loss — even though price recovered soon after. The recovery does not undo an exit that already happened.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Flash Crash | A rapid, deep price drop that reverses within minutes, driven by collapsing liquidity and automated orders rather than news. |

---

*Coming next: Chapter 6 — building a professional trade process, where the mechanics, analysis, risk control, and psychology of the whole course come together into the way a serious trader actually approaches a position.*
