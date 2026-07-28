# Crypto — Chapter 1, Lesson 7: Stablecoins

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what a stablecoin is and why traders and savers actually use one
- Describe the three ways a stablecoin tries to hold its peg — fiat-backed, crypto-collateralized, and algorithmic — and the specific risk each design carries
- Tell the difference between an attestation and an audit, and explain why the difference matters
- Recognize a peg as a promise with a mechanism — and know that this course has already shown you a "guaranteed" peg breaking

---

## 1. A Dollar That Settles Like Crypto

Everything in this chapter so far — wallets and keys (Lesson 4), exchanges (Lesson 5), transactions and finality (Lesson 6) — moves coins whose price swings hard. That volatility is the last practical gap in the picture. If you sell bitcoin because you expect it to fall, what do you hold instead? Moving back to actual dollars means a bank, business hours, and days of settlement. Crypto markets run 24/7 and settle in minutes.

:::definition
**Stablecoin** — A crypto token designed to hold a fixed value, almost always 1 US dollar. It moves like any other token — wallet to wallet, exchange to exchange, confirmed on a blockchain — but its target price never changes.
:::

Three real uses explain why stablecoins now settle more value than most people expect:

1. **Trading pairs.** On most exchanges (Lesson 5), coins are priced against a stablecoin, not against bank dollars. Selling into a stablecoin lets a trader step out of volatility without leaving crypto rails.
2. **Moving value between venues.** A stablecoin transfer settles like any transaction from Lesson 6 — minutes, any hour, any day. Bank wires do not.
3. **Dollar access where banking is hard.** In countries with high inflation or restricted dollar accounts, a dollar-denominated token that only needs a phone and a private key is genuinely useful. This course is written for underserved investors, so we say this plainly — and just as plainly: the token is only as good as the promise behind it, which is the entire rest of this lesson.

You met pegs in "The Foundation of Money and Trade": under Bretton Woods, whole currencies were pegged to the dollar, and the pegs eventually broke. A stablecoin is a peg in miniature. The only question that matters is: what mechanism holds the peg? There are three answers.

![Diagram comparing the three stablecoin models side by side: fiat-backed coins redeemable against issuer-held reserves, crypto-collateralized coins minted against excess locked collateral with automatic liquidation, and algorithmic coins held up only by an arbitrage loop with a sister token, flagged as the fragile design](../images/crypto-01-7-stablecoin-models.svg)

---

## 2. Model One: Fiat-Backed — "There Is a Dollar in a Vault"

The simplest design: a company issues 1 token for every 1 dollar it holds in reserve, and promises to redeem tokens for dollars. Tether (USDT) and USD Coin (USDC) — the two largest stablecoins — both work this way.

:::definition
**Reserve** — The pool of real-world assets an issuer holds to back its tokens. "Fully backed" means the reserve's value at least equals the tokens in circulation. Whether that is true, and what the reserve actually contains, is a claim to verify — not a fact to assume.
:::

If the reserve is real, liquid, and redeemable, the peg holds by simple arbitrage: nobody sells a redeemable-for-$1 token much below $1 for long. So three questions decide everything.

**Question 1: What is actually in the reserve?** "Backed by dollars" can mean cash in a bank, short-term US government debt, or riskier things — loans, other cryptocurrencies, IOUs from affiliated companies. These behave very differently in a crisis.

**Question 2: Who checks — and is it an attestation or an audit?**

:::definition
**Attestation** — A report in which an accounting firm confirms that the issuer's stated reserves existed at one moment in time. It is a snapshot, not an examination of the business. A full audit goes much deeper: controls, ongoing operations, what happens between snapshots.
:::

:::warning
Attestation is not audit. As of this writing, no major stablecoin issuer publishes a full financial audit. Circle (USDC) publishes monthly reserve attestations by Deloitte; Tether publishes quarterly attestations by BDO. An attestation is real evidence — but it tells you the reserves existed on the report date, not that they exist today, and not that the business around them is sound. When marketing says "audited," check which of the two it actually is. Usually it is not an audit.
:::

**Question 3: Can you actually redeem?** Read the terms. Issuers can set minimum redemption sizes, fees, waiting periods, and the right to refuse. A peg backed by redemption is only as strong as redemption in practice.

The record shows why these questions are not paranoia. Two regulatory actions against Tether are established fact, stated here neutrally:

- In February 2021, Tether and its affiliated exchange Bitfinex settled with the New York Attorney General for 18.5 million dollars and were barred from doing business with New York residents. The investigation concerned an unreported loss of about 850 million dollars in commingled funds and statements that every tether was backed 1-to-1 by dollars. The companies admitted no wrongdoing.
- In October 2021, the US Commodity Futures Trading Commission fined Tether 41 million dollars over its "fully backed" claims. The CFTC's order found that during a 26-month sample period from 2016 to 2018, Tether actually held sufficient fiat reserves for only 27.6 percent of the days.

Tether has since published quarterly attestations showing reserves held mostly in short-term US Treasury debt, and its tokens have kept their peg through several market crises. Both parts of that sentence are true. The lesson is not "Tether is doomed" or "Tether is fine" — it is that the "backed" claim had to be forced into the open by regulators, and that you should read reserve reports yourself rather than trust the word "backed."

None of this is a new problem in monetary history. Economists Gary Gorton and Jeffery Zhang, in a widely cited 2021 paper, "Taming Wildcat Stablecoins" (later published in the University of Chicago Law Review), compare stablecoins to the private banknotes of the 19th-century US Free Banking Era: privately issued money whose value depended on the issuer's assets, which did not always trade at face value, and which was periodically hit by runs. Their argument — that privately issued money is structurally prone to runs unless the backing is beyond question — is the academic version of the three questions above. "The Foundation of Money and Trade" taught you about bank runs; a stablecoin run is the same animal on faster rails.

---

## 3. Model Two: Crypto-Collateralized — "There Is More Than a Dollar, in Crypto"

The second design removes the company and the bank account. DAI, run by the MakerDAO protocol, is the canonical example: the reserve is cryptocurrency locked in smart contracts, visible on-chain by anyone.

But there is an obvious problem. If 1 dollar of DAI were backed by 1 dollar of ETH, a 10 percent drop in ETH would leave every DAI under-backed. The fix is to demand more collateral than the debt.

:::definition
**Overcollateralization** — Backing each token with collateral worth more than the token's face value, so the backing survives a fall in the collateral's price. DAI positions typically require roughly 150 percent collateral or more, depending on the asset.
:::

:::example
Suppose the required ratio is 150 percent. You lock 300 dollars of ETH and mint 200 DAI — exactly 150 percent. ETH then falls 20 percent, so your collateral is worth 240 dollars and your ratio is 120 percent — below the requirement. The protocol liquidates you automatically: your ETH is auctioned to buy back and retire the 200 DAI, plus a liquidation penalty (around 13 percent on many collateral types, so roughly 226 dollars of your collateral is consumed), and the small remainder is returned to you. No court, no phone call — code.
:::

That liquidation machinery is the whole trick, and one level deep is all you need here: the buffer absorbs ordinary volatility, and forced liquidations rebuild the buffer when it thins. The honest cost is capital inefficiency — 1.50 dollars locked up to create 1 dollar — and the honest risk is a crash so fast that liquidations cannot keep up. DAI has held its peg through several such stress events, with visible wobbles. Its reserves are the most transparent of the three models: you can check them on a block explorer (Lesson 6) right now, which is more than any fiat-backed issuer offers.

---

## 4. Model Three: Algorithmic — "There Is No Dollar. There Is a Loop"

The third design backs the token with nothing external at all. No bank account, no locked collateral. The peg is held by an arbitrage loop between the stablecoin and a second, free-floating "sister" token issued by the same system.

:::definition
**Algorithmic Stablecoin** — A stablecoin with no reserve, whose peg depends on a software rule letting holders swap the stablecoin for a fixed dollar amount of a sister token, and back. The peg holds only while the sister token has value and buyers.
:::

Here is the loop, mechanically, using the largest example that ever existed — TerraUSD (UST) and its sister token LUNA. The rule: the system always lets you burn 1 UST to mint 1 dollar's worth of newly created LUNA, and burn 1 dollar's worth of LUNA to mint 1 UST.

:::example
UST slips to 0.98 dollars on an exchange. An arbitrageur buys 1 UST for 0.98, burns it for 1.00 dollar of freshly minted LUNA, sells the LUNA, and pockets 0.02. That buying pressure pushes UST back toward 1 dollar. Above the peg, the loop runs in reverse. In calm markets, it works — UST held near 1 dollar for years and grew to tens of billions.
:::

Now run the loop under stress, because this is where you should see the flaw yourself. Every UST redeemed mints new LUNA — supply that someone must buy. If many holders redeem at once, LUNA's supply explodes and its price falls. But LUNA's price is the only thing backing UST. So a falling LUNA makes UST holders more scared, which causes more redemptions, which mints more LUNA, which falls further. The mechanism designed to restore the peg becomes the engine that destroys it. This is a reflexive design: it converts fear into more of the thing that caused the fear.

In May 2022, exactly this happened — UST lost its peg, the loop went into a death spiral, and roughly 40 billion dollars of value in UST and LUNA was destroyed within about a week. That one sentence is all we spend here, deliberately: Chapter 5, Lesson 2 dissects the Terra collapse step by step — including the "yield from nowhere" that pulled savers in — as one of this track's three major case studies. What you take from this lesson is only the mechanism, so that when you meet the case study, the failure will look inevitable rather than surprising.

:::warning
"Stable" describes the target, not a guarantee. A stablecoin's name, marketing, and years of trading at 1 dollar are all statements about intent and history — not about what happens under stress. The only thing that holds any peg is its mechanism, and mechanisms differ enormously: a redeemable reserve, an overcollateralized buffer, or a loop of pure confidence. Price charts of all three look identical right up until they don't.
:::

---

## 5. You Have Already Watched a Peg Break

This course does not ask you to take peg fragility on faith — it showed you, with a central bank, in the Forex track's first case study (Forex Chapter 5, Lesson 1). If you have not taken that track, here is the shape of it.

:::example
From 2011 the Swiss National Bank — a money-printing central bank, the strongest peg-defender that can exist — held a floor under the euro against the Swiss franc and promised to defend it with "the utmost determination." Traders treated the floor as a law of nature. On 15 January 2015 the SNB abandoned it without warning, and the franc moved roughly 30 percent in minutes. Accounts were wiped out not because traders mispriced the odds, but because they had stopped treating the peg as a promise at all.
:::

A stablecoin peg deserves strictly more skepticism than that, not less: the issuer is not a central bank, the promise is contractual rather than sovereign, and in the algorithmic case the promise is only a loop. The transferable habit is the same one this course keeps teaching — a peg is a promise with a mechanism, and the mechanism is exactly what you must verify before you rely on it.

:::definition
**Depeg** — An episode in which a stablecoin trades meaningfully away from its target price. Depegs range from brief and recoverable to terminal, and the difference is decided by the mechanism and the reserve — not by the coin's size or reputation.
:::

:::warning
Depegs happen even to the biggest, best-run coins. In March 2023, Circle disclosed that 3.3 billion dollars of USDC's reserves — about 8 percent — were stuck in the just-collapsed Silicon Valley Bank. USDC, the transparency leader among fiat-backed coins, traded down to roughly 0.87–0.88 dollars that weekend. It recovered its peg within days, after US regulators guaranteed SVB's deposits. Read that carefully: the peg was restored by the reserve being made whole — the mechanism working — not by faith. Holders who panic-sold at 0.88 took a real loss on a coin that was, in fact, money-good. Knowing the mechanism is what tells you which depegs are survivable.
:::

:::practice
Pick the stablecoin you are most likely to actually use. Find its most recent reserve report and answer three questions in writing: (1) What are the reserves — cash and short-term government debt, or something riskier? (2) Is the report an attestation or a full audit, and who signed it? (3) What are the redemption terms — minimums, fees, who is eligible? If you cannot answer all three in 20 minutes, that is itself information.
:::

---

## What to Look For

- When you see "backed 1-to-1," find the reserve report. Check what the reserves are, how recent the report is, and whether it is an attestation (a snapshot) or an audit (an examination). The word "audited" in marketing is very often an attestation.
- When a stablecoin offers unusually high yield for holding it, ask where the yield comes from. Yield with no visible source is the classic marker of the design that collapses — Chapter 5, Lesson 2 shows this at full scale.
- When you compare stablecoins, compare mechanisms, not logos: redeemable reserve, overcollateralized crypto, or algorithmic loop. The third category has the worst failure record by far.
- When a peg wobbles, the question is not "how big is this coin?" but "does the mechanism make it money-good?" — USDC's March 2023 depeg recovered because the reserves were made whole; UST's May 2022 depeg could not recover, because there were no reserves.

---

## Practice / Quiz

1. Circle publishes monthly attestation reports for USDC signed by a major accounting firm. What does an attestation actually establish?
   - A) That USDC can never lose its peg
   - B) That the stated reserves existed at the moment covered by the report — a snapshot, not a full audit of the business
   - C) That the issuer's entire business, controls, and operations have been examined and approved
   - D) That the US government guarantees the reserves

   **Correct: B.** An attestation confirms the reserves existed on the report date. A full audit — which no major stablecoin issuer currently publishes — examines much more: controls, operations, and the business between snapshots. Attestations are real evidence, but weaker than the word "audited" implies. And no report of either kind prevents a depeg — USDC held monthly attestations and still traded near 0.88 dollars in March 2023.

2. You lock 300 dollars of ETH in a DAI vault with a 150 percent minimum collateral ratio and mint 200 DAI. ETH falls 20 percent. What happens?
   - A) Nothing — DAI is a stablecoin, so your position is stable too
   - B) Your collateral is now worth 240 dollars, your ratio is 120 percent, and the protocol automatically liquidates your ETH to retire the debt plus a penalty
   - C) MakerDAO sends you an invoice for the missing 60 dollars
   - D) Your DAI is automatically converted back to ETH

   **Correct: B.** 240 dollars of collateral against 200 DAI of debt is a 120 percent ratio — below the 150 percent requirement — so the smart contract liquidates the position: the ETH is auctioned to buy back the 200 DAI plus a liquidation penalty, and only the remainder comes back to you. This automatic liquidation machinery is what keeps every circulating DAI overbacked.

3. Why did TerraUSD's peg mechanism fail in May 2022 when many holders redeemed at once?
   - A) Hackers broke the smart contract
   - B) The US government banned algorithmic stablecoins
   - C) Every UST redeemed minted new LUNA, crashing LUNA's price — and since LUNA's value was the only backing, each redemption made the next holder more likely to run
   - D) The reserves at Silicon Valley Bank were frozen

   **Correct: C.** UST had no external reserve — only the swap loop with its sister token LUNA. Mass redemptions flooded the market with new LUNA, LUNA's price collapsed, and the falling backing triggered more redemptions: a reflexive death spiral, with roughly 40 billion dollars destroyed. Option D describes USDC's March 2023 depeg — a reserve coin whose peg recovered once the reserve was made whole. The contrast between those two outcomes is the whole lesson.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Stablecoin | A crypto token designed to hold a fixed value, almost always 1 US dollar. |
| Reserve | The pool of real-world assets an issuer holds to back its tokens. |
| Attestation | An accountant's confirmation that stated reserves existed at one moment — a snapshot, not a full audit. |
| Overcollateralization | Backing each token with collateral worth more than its face value, to survive collateral price falls. |
| Algorithmic Stablecoin | A stablecoin with no reserve, whose peg depends on a swap loop with a sister token. |
| Depeg | An episode in which a stablecoin trades meaningfully away from its target price. |

---

*Coming next: Chapter 2 — Reading the Crypto Market: market cap, liquidity, and why "price times supply" misleads.*
