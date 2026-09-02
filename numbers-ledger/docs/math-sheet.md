# Africa Numbers — game mathematics

Every figure on this page was computed from the settlement code, not copied
from a design. Win counts come from asking `isHit` about **every valid selection**
against **all 1,000 outcomes** — the counts below are exhaustive, not sampled.

Regenerate with `npm run mathsheet`. CI fails if this file is not current.

- Outcomes: **1,000** (000–999, equally likely)
- Currency: LRD, 2 minor units
- Deducted from a winning payout: **0%** — the quoted multiplier is what the player receives

## The board

| Bet | Selections | Wins / 1,000 | Chance | Pays | Return per 1.00 | Hold | A win in a week |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Straight | 1000 | 1 | 1 in 1,000 | 500× | 0.50000 | 50.000% | 0.7% |
| 6-Way Box | 720 | 6 | 1 in 166.7 | 68× | 0.40800 | 59.200% | 4.1% |
| 3-Way Box | 270 | 3 | 1 in 333.3 | 135× | 0.40500 | 59.500% | 2.1% |
| Front Pair | 100 | 10 | 1 in 100 | 41× | 0.41000 | 59.000% | 6.8% |
| One Digit | 10 | 271 | 1 in 3.7 | 1.85× | 0.50135 | 49.865% | 89.1% |
| Two Digits | 90 | 54 | 1 in 18.5 | 8.5× | 0.45900 | 54.100% | 32.2% |

"A win in a week" is the chance of at least one win from seven consecutive
draws on the same bet: 1 − (1 − p)^7.

## Where each win count comes from

### Straight — 1 in 1,000

```
wins        1
probability 1 / 1,000 = 0.001000
return      0.001000 × 500 = 0.500000
hold        1 − 0.500000 = 0.500000
```

One outcome matches the three digits in the order they were chosen.

Checked across all **1,000** selections the product accepts for this bet: every one of them wins on exactly 1 outcome.

### 6-Way Box — 6 in 1,000

```
wins        3! = 6
probability 6 / 1,000 = 0.006000
return      0.006000 × 68 = 0.408000
hold        1 − 0.408000 = 0.592000
```

Three different digits can be arranged six ways, and a box bet covers every arrangement including the straight one.

Checked across all **720** selections the product accepts for this bet: every one of them wins on exactly 6 outcomes.

### 3-Way Box — 3 in 1,000

```
wins        3!/2! = 3
probability 3 / 1,000 = 0.003000
return      0.003000 × 135 = 0.405000
hold        1 − 0.405000 = 0.595000
```

One digit repeated leaves three distinct arrangements, because swapping the two identical digits changes nothing.

Checked across all **270** selections the product accepts for this bet: every one of them wins on exactly 3 outcomes.

### Front Pair — 10 in 1,000

```
wins        10
probability 10 / 1,000 = 0.010000
return      0.010000 × 41 = 0.410000
hold        1 − 0.410000 = 0.590000
```

The first two digits are fixed and the third is free, so ten outcomes match.

Checked across all **100** selections the product accepts for this bet: every one of them wins on exactly 10 outcomes.

### One Digit — 271 in 1,000

```
wins        1000 - 9^3 = 1000 - 729 = 271
probability 271 / 1,000 = 0.271000
return      0.271000 × 1.85 = 0.501350
hold        1 − 0.501350 = 0.498650
```

Count the outcomes that miss instead. A result avoids the chosen digit only if all three positions are one of the other nine, which is 9^3 = 729 ways; everything else contains it.

Checked across all **10** selections the product accepts for this bet: every one of them wins on exactly 271 outcomes.

### Two Digits — 54 in 1,000

```
wins        1000 - 9^3 - 9^3 + 8^3 = 1000 - 729 - 729 + 512 = 54
probability 54 / 1,000 = 0.054000
return      0.054000 × 8.5 = 0.459000
hold        1 − 0.459000 = 0.541000
```

Inclusion and exclusion. Remove the outcomes missing the first digit and those missing the second, then add back the outcomes missing both, which were removed twice. The digits must differ, and the product refuses a repeated pair - played as one digit twice the same bet would win 271 times in 1,000 and pay 8.5x, returning 2.30 per unit staked.

Checked across all **90** selections the product accepts for this bet: every one of them wins on exactly 54 outcomes.

## Rounding

Payouts are whole minor units. Two multipliers are fractional, so a payout is
rounded — upward on a half, towards the player.

| Bet | Exact at whole units | Worst deviation | At a stake of |
| --- | --- | ---: | ---: |
| Straight | yes | none | — |
| 6-Way Box | yes | none | — |
| 3-Way Box | yes | none | — |
| Front Pair | yes | none | — |
| One Digit | yes | +0.04065 | 1 minor units |
| Two Digits | yes | +0.02700 | 1 minor units |

Checked over every stake from 1 to 10,000 minor units. Every
deviation is in the player's favour, and every one of them disappears at a whole
unit of currency, where all six multipliers divide exactly.

## Volatility

Return per unit staked is the multiplier with probability p and nothing otherwise,
so the standard deviation is `M × √(p(1−p))`.

| Bet | Return | Standard deviation | Ratio to One Digit |
| --- | ---: | ---: | ---: |
| Straight | 0.50000 | 15.803 | 19.2× |
| 6-Way Box | 0.40800 | 5.251 | 6.4× |
| 3-Way Box | 0.40500 | 7.383 | 9.0× |
| Front Pair | 0.41000 | 4.079 | 5.0× |
| One Digit | 0.50135 | 0.822 | 1.0× |
| Two Digits | 0.45900 | 1.921 | 2.3× |

This is the operational argument for the position-free bets, not only the
marketing one. A straight hit empties a runner's cash box; a One Digit win is
payable from the till every time.

## Blended hold

A board is not one hold. It is whatever hold the players choose by what they play.
These mixes are **illustrative** — nobody has taken a bet yet.

| Mix | Blended return | Hold |
| --- | ---: | ---: |
| Traditional board only | 0.45410 | 54.59% |
| Even split across the six | 0.44723 | 55.28% |
| Frequency-led | 0.47144 | 52.86% |

- **Traditional board only** — What the game would return with no position-free bets on the screen.
- **Even split across the six** — The neutral assumption, and the least likely to happen.
- **Frequency-led** — What §07 of the architecture is trying to produce: most stakes on the bets that pay often.

## Does the draw reach every outcome evenly

Enumeration answers everything above exactly, because there are only 1,000
outcomes. What it cannot answer is whether the draw mechanism actually reaches
them evenly, so that gets a sample.

```
samples            1,000,000
expected per outcome 1,000
observed range     912 to 1102, no empty outcomes
chi-square         1033.76 on 999 degrees of freedom
p (upper tail)     0.2166
p (two-sided)      0.4332
```

**What this shows and what it does not.** Seeds are derived deterministically
(`sha256` of a counter) so the figures reproduce exactly and a reviewer can re-run
them. The claim is correspondingly narrow: this tests the **mapping** from a seed
to a result — the HMAC, the rejection sampling, and the scaling to 000–999. It says
nothing about the entropy of a real seed, which comes from the platform CSPRNG and
belongs in the RNG description rather than here.

The test is two-sided on purpose. A fit that is too good is as much a reason to
look again as one that is too bad.

## What a reviewer should check

1. **The odds the player is shown are these odds.** `winChance` and
   `expectedReturnCents` in `africa-numbers/game.js` are what the app displays, and
   the test suite asserts they agree with settlement over all 1,000 outcomes.
2. **No bet is priced above its own true odds.** A test asserts it for every type.
3. **Nothing is deducted from a winning payout.** The network is paid out of gross
   gaming revenue. A 500× advertised and then reduced by a commission would be a
   55% hold wearing a 50% headline.
4. **Two Digits refuses a repeated digit.** Priced for two different digits
   appearing — 54 in 1,000. Played as one digit twice it becomes 271 in 1,000 at
   8.5×, returning 2.30 per unit staked. One unvalidated field is the difference
   between a 46% return and a bet that bankrupts the draw.

_Generated by `npm run mathsheet` from the game rules. Do not edit by hand._
