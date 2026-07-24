# Forex Track — Chapter 3, Lesson 1: Position Sizing With Pip Value

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain why "one pip is worth 10 dollars" is only true for a specific case, not a general rule
- Calculate the true pip value for any pair, in any account currency, in two steps
- Re-run the position-sizing formula from Chapter 1 with the correct pip value, and see how the shortcut breaks your risk control
- Connect precise sizing to the reason accounts survive at all: the risk of ruin

---

## 1. The Number Chapter 1 Left Approximate

Chapter 1, Lesson 5 gave you the position-sizing formula, and it used a simple figure: on a standard lot, one pip is worth about 10 dollars. That lesson was careful to label it — "USD-quoted pairs" — because it is not the whole story. This lesson tells the whole story.

The reason it matters is precise. The sizing formula turns your account size, your risk percentage, and your stop-loss into an exact position. Every input has to be exact for the output to be exact. Pip value is the one input that quietly changes from pair to pair, and getting it wrong is the most common way a carefully planned "one percent risk" turns into something else entirely.

:::definition
**Pip Value** — The amount of money gained or lost for each pip of price movement, for a given position size, expressed in your account's currency.
:::

The last three words are the ones beginners skip: **in your account's currency.** A pip is a movement in the quote currency of a pair. Your profit and loss, though, are counted in whatever currency your account is held in. Pip value is the bridge between those two, and the bridge is only "10 dollars" in one specific case.

---

## 2. Pip Value in Two Steps

The full calculation is always the same two steps, whatever the pair.

**Step 1 — Pip value in the quote currency.** Multiply the pip size by the number of units you are trading.

:::example
On a four-decimal pair, one pip is 0.0001. A standard lot is 100,000 units. So 0.0001 × 100,000 = 10 units of the quote currency per pip. On a yen pair, one pip is 0.01, so 0.01 × 100,000 = 1,000 units of the quote currency (yen) per pip. Notice this is denominated in the quote currency, not dollars.
:::

**Step 2 — Convert the quote currency into your account currency** at the current exchange rate.

:::definition
**Account Currency** — The currency your trading account is denominated in. Every risk figure, in the end, has to be expressed in it, because that is the currency you actually win or lose.
:::

Whether Step 2 does anything depends on the pair. There are three cases, and only the first gives you the familiar 10 dollars.

**Case A — the quote currency is your account currency.** For a US-dollar account trading EUR/USD, Step 1 already gives 10 US dollars per pip. Step 2 changes nothing. Pip value is exactly 10 dollars. This is the case Chapter 1 used, and it is the only one where the shortcut is exact.

**Case B — the base currency is your account currency.** For a US-dollar account trading USD/JPY, Step 1 gives 1,000 yen per pip. You must convert yen into dollars.

:::example
USD/JPY is trading at 150.00. Pip value = 1,000 yen ÷ 150.00 = 6.67 US dollars per pip on a standard lot. Not 10 dollars — about a third less.
:::

**Case C — neither currency is your account currency (a cross pair).** For a US-dollar account trading EUR/GBP, Step 1 gives 10 British pounds per pip, and you must convert pounds into dollars using GBP/USD.

:::example
GBP/USD is trading at 1.27. Pip value = 10 pounds × 1.27 = 12.70 US dollars per pip on a standard lot. Not 10 dollars — about a quarter more.
:::

![Diagram showing the two-step pip value calculation and the three cases: quote currency equals account currency (exactly 10 dollars), base currency equals account currency (convert, about 6.67), and a cross pair (convert, about 12.70), then the effect on position size](../images/forex-ch3-position-sizing-pip-value.svg)

:::warning
In Cases B and C, pip value is not fixed — it floats with the exchange rate you convert through. As USD/JPY moves, the dollar value of a pip on that pair moves too. This means your dollar risk drifts slightly as rates change, so recompute pip value at the current rate rather than reusing a number from last week. This is a genuine, if small, way that "fixed" risk in forex is never perfectly fixed.
:::

---

## 3. Re-Sizing the Trade Correctly

Now put the correct pip value back into the Chapter 1, Lesson 5 formula and watch what the shortcut does to your risk.

**Lot Size = (Account Balance × Risk %) ÷ (Stop-Loss in Pips × Pip Value)**

:::example
A 10,000 dollar account, risking 1% (100 dollars), with a 50-pip stop-loss.

On USD/JPY, true pip value is 6.67 dollars. Correct size = 100 ÷ (50 × 6.67) = 0.30 standard lots. If you had used the 10-dollar shortcut, you would have traded 0.20 lots — and actually risked only 0.20 × 50 × 6.67 = 66.70 dollars. You under-sized: your real risk was two-thirds of what you intended, quietly leaving return on the table.

On EUR/GBP, true pip value is 12.70 dollars. Correct size = 100 ÷ (50 × 12.70) = 0.157 standard lots. Using the 10-dollar shortcut would have given 0.20 lots — and a real risk of 0.20 × 50 × 12.70 = 127 dollars. You over-sized: you risked 27% more than the 1% you decided on.
:::

That is the whole point of the lesson in one example. The shortcut does not just round a little. On one pair it made you risk a third less than planned; on another, a quarter more. The careful "exactly 100 dollars" guarantee from Chapter 1 only holds if the pip value feeding the formula is the real one.

:::warning
Your broker's platform usually shows a pip-value or position-size calculator, and you should use it — it does this arithmetic for you at live rates. Understanding the mechanism is still worth it for one reason: it lets you sanity-check the tool. The most common calculator error is having it set to the wrong account currency, which produces exactly the kind of silent mis-sizing above. A number you can check is safer than a number you have to trust.
:::

---

## 4. Why This Precision Is the Whole Game

It is fair to ask whether this much care over a few dollars of pip value really matters. The answer comes from the mathematics of losing, not winning.

:::definition
**Risk of Ruin** — The probability that a series of losing trades reduces an account to the point where it can no longer recover or continue. It is the trading form of the classical "gambler's ruin" problem in probability.
:::

The gambler's ruin problem is old and well understood: a player with limited money making repeated bets has a calculable chance of eventually losing everything, and the single biggest lever on that chance is not the win rate — it is the fraction of the account risked on each bet. Ralph Vince brought this framework to trading in *The Mathematics of Money Management* (Wiley, 1992), formalising the "fixed fractional" approach this course has used since Foundations: risk a small, constant fraction of the account each time.

The robust result, the part that holds regardless of the exact assumptions, is directional and stark: even a strategy with a genuine edge has a high probability of ruin if it is over-sized, while risking a small fixed fraction — the 1% to 2% from Foundations Chapter 2 — drives the probability of ruin toward zero. Position size is the lever. And position size is exactly what a wrong pip value corrupts.

:::warning
Be honest about the limits here, in the spirit of the Kelly caution from Chapter 1, Lesson 5. The precise risk-of-ruin number for a real strategy depends on inputs — your true win rate, your average win and loss, how correlated your trades are — that most traders cannot pin down reliably. So do not chase a specific ruin percentage from a calculator as if it were fact. Respect the direction the mathematics points, which is not in doubt: a smaller fraction risked per trade means dramatically lower odds of ruin.
:::

This is why the arithmetic in Section 2 is not pedantry. When the Swiss National Bank floor collapsed in 2015 (Chapter 1, Lesson 7), the traders who survived were not the ones who predicted it — they were the ones whose positions were small enough that a violent move could not end them. Correct pip value feeds correct position size, and correct position size is what keeps you at the table long enough for an edge to matter.

---

## What to Look For

- Do you actually know the pip value for this pair in your account currency, or are you assuming 10 dollars out of habit?
- For any USD/XXX pair or any cross pair, did you recompute pip value at the current rate, rather than reusing an old figure?
- After sizing, does the stop-loss really cost your intended risk percentage when you check it with the true pip value — not approximately, but exactly?
- Is your fraction small enough that a run of losses, or a single gap through your stop, cannot take you out of the game?

---

## Practice / Quiz

1. On a US-dollar account, is the pip value of USD/JPY on a standard lot exactly 10 dollars?
   - A) Yes, pip value is always 10 dollars on a standard lot
   - B) No — it must be converted from yen, and at a rate near 150 it is about 6.67 dollars
   - C) No — it is always higher than 10 dollars for yen pairs
   - D) Only on Fridays

   **Correct: B.** A standard lot on a yen pair is 1,000 yen per pip; converting at USD/JPY near 150 gives about 6.67 dollars. The 10-dollar figure only holds when the quote currency is your account currency.

2. You size a EUR/GBP trade using a 10-dollar pip value, but the true pip value is 12.70 dollars. Compared with your intended 1% risk, what actually happens?
   - A) You risk exactly 1%
   - B) You risk less than 1%
   - C) You risk more than 1% — about 27% more than intended
   - D) The trade cannot be placed

   **Correct: C.** A higher true pip value than the one you sized with means each pip costs more than you assumed, so the same lot size risks more — here, 127 dollars instead of 100.

3. According to the risk-of-ruin idea, what is the single biggest lever on the chance of blowing up an account?
   - A) The win rate
   - B) The fraction of the account risked per trade
   - C) The broker you choose
   - D) The number of indicators on your chart

   **Correct: B.** Both the classical gambler's-ruin result and Vince's fixed-fractional framework point to position size — the fraction risked per trade — as the dominant factor, ahead of win rate.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Pip Value | The money gained or lost per pip, for a given position size, in your account currency. |
| Account Currency | The currency your account is denominated in — the currency all risk is finally measured in. |
| Risk of Ruin | The probability that losses reduce an account past recovery; driven mainly by the fraction risked per trade. |

---

*Coming next: Lesson 2 — margin calls and leverage risk: what actually happens to your account as a leveraged position moves against you, and the level at which the broker steps in.*
