# Forex Track — Chapter 3, Lesson 2: Margin Calls and Leverage Risk

## Learning Objectives

By the end of this lesson, you will be able to:

- Distinguish balance, equity, used margin, and free margin, and track how they move during a trade
- Explain the two thresholds a losing trade crosses: the margin call level and the stop-out level
- Calculate effective leverage and explain why it, not the broker's headline number, sets your distance to a margin call
- See that a margin call is usually a symptom of over-sizing, which connects straight back to Lesson 1

---

## 1. Balance Is Not Equity

Chapter 1, Lesson 6 gave you the fixed parts: leverage, margin, the margin level formula, and the idea of a margin call. This lesson watches those numbers move in real time, because that is where the risk actually lives.

The first thing to separate is your balance from your equity.

:::definition
**Equity** — Your account balance plus or minus the running profit or loss of any open positions. It is the real, live value of your account at this moment.
:::

Your balance is settled cash — it only changes when a trade is closed. Equity is balance plus the floating profit or loss of trades still open. The moment you open a position, the two can diverge, and every risk measure that matters is built on equity, not balance.

:::definition
**Free Margin** — Your equity minus the margin currently used by open positions. It is the cushion available to absorb further losses and to open new trades.
:::

So the account splits cleanly: **used margin** (locked as collateral for your open positions) plus **free margin** (everything else) equals your equity. When a trade moves against you, its floating loss lowers your equity, which shrinks your free margin, which drives your margin level down. Watching that chain is the whole skill of this lesson.

---

## 2. Two Thresholds: Margin Call, Then Stop-Out

Chapter 1 described the margin call as one event. In a live account there are usually two levels, and knowing the difference matters.

The **margin call level** (commonly a margin level of 100%) is the warning: your equity has fallen until it only just covers the margin your positions require. The broker asks you to add funds or reduce the position.

:::definition
**Stop-Out Level** — The margin level at which the broker stops asking and starts acting: it automatically closes your positions, usually the largest loser first, to stop your equity falling below the margin backing them. It sits below the margin call level.
:::

The stop-out level (commonly a margin level of 50%) is the forced exit. It exists to protect the broker from your account going negative, and it will close your trades whether you want it to or not.

:::warning
The exact percentages are set by each broker, not by law — 100% and 50% are common, but yours may differ. Find your broker's real margin call and stop-out levels before you trade, not during your first losing position.
:::

:::example
You have a 2,000 dollar account and open a 50,000 dollar EUR/USD position at 50:1 leverage. Used margin is 50,000 / 50 = 1,000 dollars, leaving 1,000 dollars of free margin, and your margin level starts at 2,000 / 1,000 = 200%. Now price moves against you. A 1,000 dollar floating loss — a 2% move, about 200 pips — drops equity to 1,000 dollars, so margin level hits 100%: the margin call. If the loss reaches 1,500 dollars — a 3% move, about 300 pips — equity is 500 dollars, margin level is 50%, and the stop-out closes the trade for you. A 300-pip move has ended this position, whatever you wanted.
:::

![Diagram showing the live account split into equity, used margin and free margin; the margin call level around 100 percent and the stop-out level around 50 percent; and two accounts holding the same position where the over-committed one is called after 200 pips and the well-sized one survives to 1,800 pips](../images/forex-ch3-margin-calls-leverage.svg)

---

## 3. Effective Leverage Is the Number That Actually Matters

Here is the misunderstanding that this lesson exists to fix. The broker advertises a maximum leverage — 30:1, 50:1, sometimes far more. That number is a ceiling on what you are allowed to do. It says nothing about the risk you are actually running. That is a different number.

:::definition
**Effective Leverage** — The total size of your open positions divided by your account equity. Unlike the broker's maximum offered leverage, this is the leverage you are actually using right now.
:::

:::example
Take the same 50,000 dollar position, at the same 50:1 broker leverage, on two different accounts. On the 2,000 dollar account above, effective leverage is 50,000 / 2,000 = 25:1, and you saw the margin call arrive after just 200 pips. On a 10,000 dollar account, the identical position is only 50,000 / 10,000 = 5:1 effective leverage — and now the margin call does not arrive until a floating loss of 9,000 dollars, an 18% move of about 1,800 pips. Same broker, same leverage cap, same trade. One account dies at 200 pips; the other survives to 1,800. The only difference is how much of the account was committed.
:::

That is the honest core of "leverage risk." The danger was never the broker's headline ratio on its own — it is how much of that ceiling you choose to use. And that choice is exactly position sizing from Lesson 1. A correctly sized position leaves a large free-margin cushion, which keeps effective leverage low and the margin call far away. **A margin call is, almost always, a position-sizing mistake showing up one step later.**

:::warning
Treat "500:1 leverage available" as marketing, not a feature. The number tells you the most rope the broker will hand you; it says nothing about how much you should take. Your effective leverage, set by your position size, is the figure to watch — and to keep small.
:::

---

## 4. When the Stop-Out Itself Fails

It is tempting to treat the stop-out as a guaranteed floor: "the worst that happens is I get closed at 50%." Usually true. Not always.

:::warning
The stop-out closes your position at the best price available when it fires — and in a violent gap, there may be no price nearby, exactly as you saw with stop-loss orders in Chapter 1, Lesson 7. When the Swiss National Bank floor broke in 2015, stop-outs triggered correctly but filled far below their levels, and many accounts went negative — traders ended up owing money they never deposited. This is precisely why negative balance protection exists as a rule in the EU, UK, and Australia (Chapter 1, Lesson 6).
:::

So the layering is: correct position size keeps you far from the margin call in the first place; the broker's stop-out is a second line that usually works; and negative balance protection is a legal backstop for the rare case where a gap defeats the stop-out. The first line is the one you control, and it is the one that matters most.

---

## What to Look For

- Do you actually know your broker's margin call and stop-out levels, in numbers, before you need them?
- What is your effective leverage right now — total open position size divided by equity? Is it a small number or a large one?
- Could your free-margin cushion absorb a realistic adverse move — a normal bad day for that pair — without triggering a margin call?
- Are you relying on the stop-out as a safety net, or sizing your positions so that you never come close to it?

---

## Practice / Quiz

1. A margin call is triggered when which value falls to meet the margin your positions require?
   - A) Your account balance
   - B) Your account equity (balance plus floating profit and loss)
   - C) The broker's leverage cap
   - D) The spread

   **Correct: B.** Margin level is measured from equity, not balance — it is the live value including open trades' floating loss that determines when a margin call or stop-out fires.

2. Two accounts hold the exact same 50,000 dollar position at the same 50:1 broker leverage — one with 2,000 dollars of equity, one with 10,000 dollars. Which faces a margin call after a much smaller move against it?
   - A) The 10,000 dollar account
   - B) The 2,000 dollar account, because its effective leverage (25:1) is far higher
   - C) Neither — they are identical because the broker leverage is the same
   - D) It depends only on the spread

   **Correct: B.** Effective leverage is position size divided by equity: 25:1 versus 5:1. The smaller account has a thinner free-margin cushion, so a 200-pip move calls it while the larger account can absorb about 1,800.

3. True or False: the broker's stop-out level is a guaranteed floor, so your account can never go below it.

   **Correct: False.** In a violent gap the stop-out can fill far from its level — the 2015 Swiss franc move pushed many accounts negative. That is why negative balance protection exists; the stop-out is a strong safeguard, not an absolute guarantee.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Equity | Account balance plus or minus the floating profit and loss of open positions. |
| Free Margin | Equity minus used margin — the cushion available to absorb losses and open trades. |
| Stop-Out Level | The margin level at which the broker forcibly closes positions, below the margin call level. |
| Effective Leverage | Total open position size divided by account equity — the leverage you are actually running. |

---

*Coming next: Lesson 3 — the risk-to-reward ratio in practice: why a trader who is wrong more often than right can still make money, made precise with the one piece of arithmetic that ties win rate and reward together.*
