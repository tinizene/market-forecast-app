# Crypto — Chapter 1, Lesson 5: Exchanges — CEX vs DEX

## Learning Objectives

By the end of this lesson, you will be able to:

- Describe what actually happens to your coins when you deposit them on a centralized exchange — and why your trades there never touch the blockchain
- Explain how a decentralized exchange prices a trade using a liquidity pool and the constant-product formula, and work through a simple swap yourself
- Compare the honest trade-offs of each venue using the custody framework from Lesson 4
- Explain why a "proof of reserves" report is not an audit, and what it leaves out

---

## 1. Two Machines That Both Get Called "an Exchange"

Lesson 4 left you with a clean question to ask about any crypto arrangement: who holds the keys? This lesson applies that question to the place where most people first touch crypto — an exchange.

The word "exchange" covers two completely different machines. One is a company with a database. The other is a program running on a blockchain. They price trades differently, they hold your money differently, and they fail differently. Almost every confusing headline in crypto gets clearer once you know which machine was involved.

:::definition
**Centralized Exchange (CEX)** — A company that holds customer deposits in wallets it controls and matches buy and sell orders inside its own internal systems. Coinbase, Binance, and Kraken are examples. In forex terms, it is broker, trading venue, and custodian rolled into one firm.
:::

:::definition
**Decentralized Exchange (DEX)** — A set of smart contracts on a blockchain that lets users trade directly from their own wallets, with no company holding the funds. Uniswap is the best-known example.
:::

---

## 2. The CEX: You Trade IOUs in Their Database

Here is the step nobody explains at signup. When you deposit one bitcoin to a centralized exchange, the bitcoin moves on-chain to a wallet whose private keys the exchange controls. From that moment, the blockchain says the exchange owns that coin. What you own is a promise: a balance in the company's internal records that says the exchange owes you one bitcoin.

Every trade you then make on the exchange happens inside that internal database. Sell your bitcoin for dollars, buy it back, trade it fifty times — nothing touches the blockchain. The exchange lowers one number in its ledger and raises another, exactly like the bank ledgers in Lesson 1. The blockchain only gets involved again when you withdraw, and the exchange sends coins from its wallet to yours.

In Lesson 4's terms: an exchange account is custody. You have moved from "your keys" to "their keys," and taken on the referee-risk this track keeps returning to. The exchange can be hacked, can freeze withdrawals, can go bankrupt, or can quietly spend customer deposits. If it fails, the blockchain is no help — the blockchain correctly shows the exchange owning the coins. Your claim is against a company, not against the chain. That is precisely what customers of Mt. Gox learned in 2014 and customers of FTX learned in November 2022 — both are full case studies in Chapter 5.

So how do trades get priced on a CEX? Through an order book — the same machinery the forex track teaches in depth.

:::definition
**Order Book** — The live list of resting buy orders (bids) and sell orders (asks) for an asset at each price. The gap between the best bid and best ask is the spread. Trades happen when an incoming order matches a resting one.
:::

If you have taken the Forex track, you already know this machine: bid, ask, and spread are Forex Chapter 1, Lesson 4; market orders, limit orders, and slippage are Forex Chapter 1, Lesson 7. A crypto CEX works the same way — the only twist is that the "coins" being matched are entries in the company's own ledger. How deep those books really are, and why reported volume can mislead, is Chapter 2, Lesson 1.

:::warning
Since the FTX collapse, exchanges publish "proof of reserves" reports to show they hold customer assets. Read these skeptically. A proof-of-reserves snapshot shows assets, not liabilities — it can show the exchange holds 10,000 BTC without showing it owes customers 15,000 BTC, and it cannot show whether the assets were borrowed for the snapshot. In March 2023, the U.S. audit regulator's investor advocate (the PCAOB) warned investors directly that these reports are not audits and "do not provide any meaningful assurance." The accounting firm Mazars had already suspended its crypto proof-of-reserves work in December 2022 — days after producing one for Binance — citing concerns about how the public understood the reports. A real audit examines assets and liabilities. A reserves snapshot is half a balance sheet.
:::

---

## 3. The DEX: Your Wallet Trades With a Pool

A decentralized exchange removes the deposit step entirely. You never send coins to the venue. You connect your own wallet, sign a transaction, and the trade settles on-chain: the blockchain records your tokens going into a smart contract and the tokens you bought coming out, all in one transaction. Custody never changes hands. Lesson 4's trade-off applies in reverse — you keep the keys, so you also keep every risk that comes with being your own bank.

But there is a puzzle. An order book needs market makers constantly posting and updating quotes, which is impractical to run on-chain — every price update would be a transaction with a fee. Most DEXes solved this by throwing the order book away entirely.

:::definition
**Automated Market Maker (AMM)** — A smart contract that prices trades with a formula instead of an order book. Anyone can trade against it at any time; the price is computed from what the contract holds.
:::

:::definition
**Liquidity Pool** — The pair of token reserves an AMM holds and trades against — for example, a pot of ETH and USDC locked in one contract. The tokens are supplied by users called liquidity providers, who earn a share of the pool's trading fees in return.
:::

![Diagram comparing money flow on a centralized exchange, where deposited coins move to an exchange-controlled wallet and trades update an internal IOU ledger, with a decentralized exchange, where the user's own wallet swaps tokens against an on-chain liquidity pool priced by the constant-product formula](../images/crypto-01-5-cex-vs-dex.svg)

---

## 4. How an AMM Prices a Trade: x × y = k

The canonical AMM design comes from Uniswap, and its pricing rule fits in one line. Take the two reserves in the pool — call them x and y — and multiply them. Every trade must leave that product, k, unchanged. This is the constant-product formula, described in the Uniswap v2 whitepaper (Adams, Zinsmeister and Robinson, March 2020) and analysed formally in a 2019 paper by Angeris, Kao, Chiang, Noyes and Chitra, which showed that under ordinary conditions arbitrage traders keep the pool's price tracking the wider market.

That last point answers the obvious question — how does a formula "know" the market price? It doesn't. If the pool's price drifts away from other venues, anyone can profit by trading against the pool until the prices line up again. Arbitrage, not the formula, keeps the price honest.

:::example
A pool holds 10 ETH and 20,000 USDC, so k = 10 × 20,000 = 200,000, and the pool's price is 20,000 ÷ 10 = 2,000 USDC per ETH. You swap in 5,000 USDC. The pool's USDC side rises to 25,000 — so to keep k at 200,000, the ETH side must fall to 200,000 ÷ 25,000 = 8 ETH. The pool pays out the difference: 10 − 8 = 2 ETH. You paid 5,000 USDC for 2 ETH — an effective price of 2,500 USDC per ETH, which is 25% worse than the 2,000 the pool quoted before you traded. A smaller trade hurts less: swapping in 1,000 USDC returns about 0.476 ETH, an effective price of about 2,100 — 5% worse than the quote. (Real pools also charge a small fee on each swap, 0.3% in the classic Uniswap design, which goes to the liquidity providers; we left it out to keep the arithmetic clean.)
:::

Notice what the example shows: on an AMM, your own trade moves the price, and it moves it more the larger your trade is relative to the pool. This price impact is the AMM version of a familiar idea — slippage, the gap between the price you expected and the price you got, which the forex track defines in Chapter 1, Lesson 7. On a DEX the interface shows you the estimated impact before you sign, and lets you set a maximum slippage you will tolerate. Look at that number every single time. Against a small pool, a trade that looks routine can cost you double-digit percentages.

:::definition
**Impermanent Loss** — The loss a liquidity provider can suffer, relative to simply holding the two tokens, when their prices move apart after depositing into a pool. We name it here because you will meet the term; supplying liquidity is a business with real risks, and this course does not teach it.
:::

---

## 5. The Honest Comparison

Neither machine is simply better. They occupy opposite ends of the trade-off Lesson 4 taught, and a table states it more honestly than any marketing page will.

:::definition
**KYC (Know Your Customer)** — Identity checks (documents, proof of address) that regulated financial firms must run on their customers. Centralized exchanges require them; a DEX smart contract has no operator to run them.
:::

| | Centralized exchange (CEX) | Decentralized exchange (DEX) |
|---|---|---|
| Who holds your coins mid-trade | The exchange (their keys — an IOU to you) | You (your wallet, your keys) |
| Where trades settle | The company's internal database | On-chain, in the transaction itself |
| Getting money in | Easy — cards, bank transfers, local payment rails | Hard — you need crypto in a wallet already |
| Liquidity | Deep books on major pairs at big venues | Varies per pool; small pools mean big price impact |
| Identity | KYC required | Permissionless — no account, no ID |
| Main risks | Counterparty: hacks, frozen withdrawals, insolvency, misuse of deposits | User error: wrong address, bad token, signing a malicious transaction — no support desk, no undo |
| Costs | Trading fees; withdrawal fees | Swap fees plus a network gas fee on every trade (Lesson 6) |
| What can be listed | What the company chooses to list | Anything — anyone can create a pool for any token |

That last row deserves its own warning.

:::warning
On a DEX, listing requires no review, no application, and no permission — anyone can create a token and a pool for it in minutes, including a fake token named after a real one. This is not a rare edge case. A 2021 measurement study of Uniswap (Xia and co-authors, published in the ACM's measurement journal) flagged over 10,000 scam tokens — roughly half of all tokens examined — most built for "rug pulls," where the creator drains the pool after buyers pile in; the scams they traced netted at least 16 million dollars from nearly 40,000 victims. Permissionless listing is a real feature and a real attack surface at the same time. Never trade a token from a search box; verify its contract address from the project's official source first.
:::

---

## What to Look For

- Before depositing anywhere, ask Lesson 4's question: who holds the keys? If the answer is "the exchange," you hold an IOU, and the counterparty checklist applies — withdrawal history, regulation, jurisdiction.
- When an exchange advertises "proof of reserves," check what the report actually covers. Assets only? Snapshot date? Any statement about liabilities? If it is not a full audit, it is not a full picture — and the audit regulator itself says so.
- Before confirming any DEX swap, read the price-impact and minimum-received numbers the interface shows. If the impact is more than a fraction of a percent, the pool is small relative to your trade.
- Before trading any token on a DEX, verify the contract address against the project's official site or documentation. A matching name and logo prove nothing — anyone can list anything.
- Keep only what you are actively trading on an exchange. Lesson 4's custody plan — and Chapter 4's version for crypto specifically — starts from that rule.

---

## Practice / Quiz

1. You deposit 1 BTC to a centralized exchange and your account shows "1 BTC." Where is the bitcoin?
   - A) In your account on the blockchain, tagged with your name
   - B) In a wallet the exchange controls; your balance is an entry in the company's internal ledger
   - C) Split across the wallets of the exchange's other customers
   - D) Nowhere — deposited bitcoin is destroyed and recreated at withdrawal

   **Correct: B.** The coin moved to an exchange-controlled wallet, and the blockchain now shows the exchange owning it. Your "1 BTC" is an IOU in their database — which is why every trade you make there is a database entry, and why an exchange failure hits your claim, not the chain.

2. A liquidity pool holds 10 ETH and 20,000 USDC (k = 200,000). Ignoring fees, how much ETH does a trader receive for swapping in 5,000 USDC?
   - A) 2.5 ETH, because the quoted price is 2,000 USDC per ETH
   - B) 2 ETH, because the pool must keep x × y = 200,000
   - C) 5 ETH, because the pool always pays half the USDC amount
   - D) It depends on which market maker takes the order

   **Correct: B.** The USDC side rises to 25,000, so the ETH side must fall to 200,000 ÷ 25,000 = 8, and the trader receives 10 − 8 = 2 ETH. The effective price, 2,500, is 25% worse than the quote — your own trade moved the price. No market maker is involved; that is the point of an AMM.

3. An exchange publishes a "proof of reserves" report showing it holds 10,000 BTC. What does this establish?
   - A) That the exchange is solvent and customer funds are safe
   - B) That the exchange has passed an audit
   - C) That the exchange controlled those assets at a point in time — and nothing about what it owes
   - D) That the exchange cannot be hacked

   **Correct: C.** Reserves are assets. Solvency is assets versus liabilities, and these reports typically say nothing about liabilities — or about whether the assets were borrowed for the snapshot. The U.S. audit regulator's 2023 investor advisory said plainly that such reports are not audits and provide no meaningful assurance.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Centralized Exchange (CEX) | A company holding customer deposits and matching trades inside its own internal ledger. |
| Decentralized Exchange (DEX) | Smart contracts letting users trade on-chain directly from their own wallets. |
| Order Book | The live list of resting bids and asks for an asset at each price. |
| Automated Market Maker (AMM) | A smart contract that prices trades with a formula instead of an order book. |
| Liquidity Pool | The token reserves an AMM holds and trades against, supplied by fee-earning users. |
| Impermanent Loss | A liquidity provider's loss versus simply holding, when pooled token prices move apart. |
| KYC (Know Your Customer) | Mandatory identity checks at regulated financial firms, including centralized exchanges. |

---

*Coming next: Lesson 6 — Transactions, Fees & Finality: gas, confirmations, why "sent" isn't "settled," and fee spikes.*
