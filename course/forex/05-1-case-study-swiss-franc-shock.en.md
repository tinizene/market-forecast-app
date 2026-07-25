# Forex Track — Chapter 5, Lesson 1: Case Study — The 2015 Swiss Franc Shock

## Learning Objectives

By the end of this lesson, you will be able to:

- Recount what happened to EUR/CHF on 15 January 2015 and why
- Explain why stop-losses and even broker stop-outs failed to protect traders that day
- Connect the event to the course's principles on fat tails, execution, and position sizing
- Draw the single most important survival lesson from a genuine black-swan event

---

## 1. What Happened

For over three years, the Swiss National Bank held a floor under EUR/CHF, promising to defend a minimum of 1.20 francs per euro "with the utmost determination" — a cap it set in September 2011 to stop the franc strengthening too far. Traders came to treat that floor as almost a law of nature: you could not lose much buying EUR/CHF near 1.20, because the central bank guaranteed it would not fall below.

:::definition
**Black Swan** — A rare, high-impact event that is very hard to predict in advance and is often rationalised as obvious only afterwards. The term was popularised by Nassim Taleb; the franc shock is a textbook case.
:::

On 15 January 2015, without warning, the Swiss National Bank abandoned the floor. The franc did not drift — it detonated. EUR/CHF fell straight through 1.20 and collapsed by roughly 30% intraday, trading as low as around 0.85 in the chaos, before settling nearer parity. The move happened in minutes, and with so little liquidity that the exact bottom is genuinely disputed: one broker's own feed printed as low as 1.1659 within nine seconds as the banks providing its prices pulled them.

:::warning
This is the lived version of the fat tails you met in Chapter 2, Lesson 2, and Mandelbrot's 1963 finding. A standard "bell curve" model would have called a move this size an event of once in many thousands of years. It happened on an ordinary Thursday. Markets produce extreme moves far more often than tidy models predict — and forex, with its leverage, punishes that fact hardest.
:::

---

## 2. Why the Protections Failed

The damage was not only in the size of the move — it was in how it broke the tools traders rely on. This is where Chapter 1, Lesson 7 stops being theory.

A stop-loss order becomes a market order once triggered, and a market order fills at the best price available. On 15 January there was almost no price available: buyers vanished exactly as the sell orders arrived. Stop-losses set safely near 1.20 did trigger — and then filled hundreds of pips lower, or not at all. Even the broker's own stop-out (Chapter 3, Lesson 2), meant to close positions before an account goes negative, could not work in a market with no bids to sell into.

:::example
The fallout was severe and specific. The retail broker FXCM saw its customers left with roughly 225 million dollars in negative balances — accounts that owed the broker more than they held — and FXCM needed an emergency infusion of about 300 million dollars from Leucadia to survive. The UK broker Alpari (UK) entered insolvency that same day. And it was not only amateurs: the hedge fund Everest Capital Global, which had bet against the franc, lost close to a billion dollars and was shut down. A Bank of England study later found that algorithmic traders pulling liquidity made the crash worse.
:::

![Diagram of EUR/CHF holding the 1.20 floor from 2011 until it collapsed about 30 percent to roughly 0.85 on 15 January 2015, the fallout (FXCM's 225 million dollars of client negative balances and 300 million dollar bailout, Alpari UK insolvency, Everest Capital's roughly 1 billion dollar loss), and the survival lesson that small position size and low leverage were what mattered](../images/forex-ch5-snb-shock.svg)

:::warning
Notice who was ruined: not the people who predicted the move — almost nobody did — but the people who were over-sized when it came. Traders who owed money on a single trade were not wrong about direction. They were simply too large for a gap to survive. This is the whole argument of Chapter 3, Lessons 1 and 2, written in losses.
:::

---

## 3. What the Course's Principles Did

Run the event back through the framework and every principle earns its place.

**Position sizing (Chapter 3, Lesson 1).** A trader risking 1% with a correctly sized position still took a bad loss when the stop failed — but a bad loss, not a wiped-out or negative account. Small size is what turns a catastrophe into a survivable dent.

**Effective leverage (Chapter 3, Lesson 2).** The accounts that went negative were running high effective leverage, so a gap larger than their free-margin cushion blew straight through it. Low effective leverage was the difference between a scare and a ruin.

**Negative balance protection (Chapter 1, Lesson 6).** This event is the reason the rule exists in the EU, UK, and Australia. It is a genuine backstop — but note it is the last line, not the first. Depending on it means everything before it has already failed.

**Fat tails (Chapter 2, Lesson 2).** The trader who internalised that extreme moves are normal, not impossible, sized and prepared for one. The trader who trusted the "once in ten thousand years" math did not.

:::warning
The honest, uncomfortable takeaway: you cannot reliably predict a black swan, and you cannot count on your stop filling where you set it. The only defence that works is structural — being small enough, and unleveraged enough, that even a failed stop cannot end you. Survival is not built on being right. It is built on being sized to be wrong.
:::

---

## What to Look For

- For any pair pinned by a central bank policy (a peg or a floor), remember that "it cannot move past here" is a promise that can be withdrawn without notice.
- Never assume a stop-loss guarantees your exit price. It guarantees a trigger, not a fill — and in a gap, the two can be far apart.
- Size every position so that a violent gap through your stop is a survivable loss, not an account-ending one.
- Confirm your broker offers negative balance protection — but treat it as a backstop, never as permission to size larger.

---

## Practice / Quiz

1. Why did stop-loss orders fail to protect many traders during the Swiss franc shock?
   - A) The orders were never triggered
   - B) They triggered but filled far from their level, because liquidity vanished and there were no buyers nearby
   - C) Brokers ignored them on purpose
   - D) The franc barely moved

   **Correct: B.** A triggered stop becomes a market order and fills at whatever price exists. On 15 January 2015 there was almost no liquidity, so stops filled hundreds of pips away — or not at all.

2. Who was most likely to be financially ruined by the event?
   - A) Traders who correctly predicted the move
   - B) Traders who were over-sized and over-leveraged when the gap hit
   - C) Traders who used small position sizes
   - D) Traders who avoided EUR/CHF entirely

   **Correct: B.** The move was nearly unpredictable, so ruin was not about direction. It was about size: over-leveraged accounts had no cushion for a gap that large, and some went negative.

3. True or False: the Swiss franc shock shows that a good enough model can be trusted to rule out extreme moves.

   **Correct: False.** The opposite. Standard models called a move this size almost impossible, yet it happened. Extreme moves are a normal feature of markets (fat tails), and no model rules them out.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Black Swan | A rare, high-impact, hard-to-predict event, rationalised as obvious only in hindsight. |

---

*Coming next: Lesson 2 — the yen carry trade unwind of 2008, where the profits from an interest-rate edge turned into a violent, correlated crash exactly as the academic evidence warned.*
