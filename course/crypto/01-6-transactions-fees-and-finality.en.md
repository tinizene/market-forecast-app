# Crypto — Chapter 1, Lesson 6: Transactions, Fees & Finality

## Learning Objectives

By the end of this lesson, you will be able to:

- Follow a transaction through its whole life: signed, broadcast, waiting in the mempool, selected into a block, and buried under more blocks
- Explain fees as an auction for scarce block space, and why fees spike when demand spikes
- Describe Ethereum's gas model, including what EIP-1559 changed, and check a fee calculation yourself
- Explain why "sent" is not "settled" — and what confirmations and finality actually promise

---

## 1. The Life of a Transaction

Lesson 4 gave you keys. Lesson 5 gave you venues. This lesson answers the question that sits between them: when you press "send," what actually happens?

:::definition
**Transaction** — A signed instruction to update the blockchain's ledger: "move this amount from my address to that address, and here is my signature to prove I authorized it." A transaction is data, not a coin moving — the ledger entries change, nothing travels.
:::

A transaction lives through five stages:

1. **Signed.** Your wallet builds the instruction and signs it with your private key (Lesson 4). The signature proves the owner of the funds authorized this exact instruction — change one character and the signature no longer matches.

2. **Broadcast.** Your wallet hands the signed transaction to the peer-to-peer network. Nodes pass it to each other until, within seconds, most of the network has seen it.

3. **Waiting in the mempool.** The transaction is now visible but not in the ledger. It sits in a waiting room with every other unconfirmed transaction.

:::definition
**Mempool** — Each node's pool of valid transactions that have been broadcast but not yet included in a block. Think of it as the queue outside the ledger. A transaction in the mempool has been seen; it has not been recorded.
:::

4. **Selected into a block.** A miner (Lesson 3, proof-of-work) or validator (Lesson 3, proof-of-stake) picks transactions from the mempool, packs them into a candidate block, and adds that block to the chain (Lesson 2).

5. **Buried.** Every new block built on top of that block pushes your transaction deeper into history. Depth is what makes it hard to reverse — that is Section 4.

![Diagram of the transaction lifecycle in five stages: signed with a private key, broadcast to the peer-to-peer network, waiting in the mempool where transactions bid fees for scarce block space, included in a block, then buried under N confirmations as new blocks are added](../images/crypto-01-6-transaction-lifecycle.svg)

:::warning
"Sent" is not "settled." A transaction sitting in the mempool can still fail, be replaced by another transaction from the same sender, or simply never confirm if its fee is too low. Wallets and payment screens often say "sent" the moment the transaction is broadcast — stage 2 of 5. Nothing is settled until the transaction is in a block, and nothing is hard to reverse until that block is buried. Treat "sent" as "submitted an application," not "done."
:::

---

## 2. Fees Are an Auction for Scarce Block Space

Why do transactions pay fees at all? Because block space is scarce. Lesson 2 showed you that each block holds a limited amount of data, and blocks arrive on a roughly fixed schedule — about every 10 minutes on Bitcoin, about every 12 seconds on Ethereum. The network can only record so many transactions per hour, no matter how many people want in.

When more transactions wait in the mempool than the next blocks can hold, someone must decide which ones get in. The mechanism is simple and brutal: transactions offer fees, and block producers — who keep the fees — pick the best-paying ones first. It is an auction, and you are bidding against every other user on the network at that moment.

Two consequences follow directly:

- **Quiet network: fees are small.** Your transaction gets into the next block for a minimal bid.
- **Busy network: fees explode.** Everyone raises their bid to jump the queue, and the price of block space can multiply within hours.

This is not a theoretical risk. It has happened repeatedly, and the episodes are worth knowing:

:::example
In December 2017, a single game — CryptoKitties, which let users breed digital cats — grew until it accounted for roughly 12 percent of all Ethereum transactions. The backlog of pending transactions reached about 30,000, and fees rose across the whole network: every user, trading cats or not, was bidding against the cats. In April 2021, Bitcoin's average fee crossed roughly 60 dollars per transaction — a record at the time, beating the previous bull-market peak of around 50 dollars from late 2017 — after a drop in mining power collided with heavy demand. And in May 2021, Ethereum's average fee peaked somewhere between about 50 and 70 dollars, depending on which data provider you check — sources genuinely disagree on the exact figure, which is itself a lesson in checking data before repeating it.
:::

:::warning
Two fee mistakes cost beginners real money. First: sending with too low a fee. The network does not reject your transaction — it just never selects it, and your payment can sit in limbo for hours or days. Second: ignoring the fee-to-amount ratio. Fees price the size and complexity of the transaction, not its value — moving 20 dollars can cost exactly the same fee as moving 1 million dollars. During a fee spike, paying 50 dollars of fees to move 20 dollars of coins is not a rounding error; it is a 250 percent cost. Always check the fee against the amount before confirming.
:::

---

## 3. Ethereum's Gas Model — and EIP-1559

Bitcoin prices block space by data size. Ethereum needs something more, because Ethereum transactions can run programs — and a program that runs longer does more work. Ethereum's answer is gas.

:::definition
**Gas** — Ethereum's unit for measuring computational work. Every operation costs a fixed number of gas units: a simple transfer of ETH from one address to another always costs 21,000 gas, while interacting with a complex program can cost many times more. Your fee is the gas your transaction used multiplied by the price per unit of gas.
:::

Gas prices are quoted in gwei — one gwei is one billionth of an ETH. Since August 2021, the price per unit has two parts, introduced by an upgrade called EIP-1559 (part of the "London" upgrade of 5 August 2021):

- **Base fee** — set automatically by the protocol, rising when blocks are full and falling when they are not. Here is the strange part: the base fee is not paid to anyone. It is burned — destroyed, removed from the ETH supply entirely.
- **Priority fee (tip)** — an extra amount you add on top, paid to the validator, to encourage them to include your transaction sooner. When the network is quiet, a small tip is enough. When it is busy, the tip is where the auction from Section 2 lives on.

:::example
A worked example, so the units stop being abstract. You send a simple ETH transfer: 21,000 gas. The base fee is 18 gwei and you add a 2 gwei tip, so you pay 20 gwei per gas unit. Total: 21,000 × 20 = 420,000 gwei, which is 0.00042 ETH. At an illustrative price of 2,500 dollars per ETH — a made-up round number for arithmetic, not a price forecast — that is about 1.05 dollars. Of that, 0.000378 ETH (the base-fee part) is burned and 0.000042 ETH (the tip) goes to the validator. Now rerun it during congestion at 200 gwei total: the same transfer costs 0.0042 ETH, about 10.50 dollars — ten times the fee for the identical transaction, because the auction got crowded.
:::

Notice what gas does not depend on: the amount you send. The 21,000-gas transfer costs 21,000 gas whether it moves 10 dollars or 10 million. That is why the fee-to-amount warning in Section 2 matters most for small transactions.

---

## 4. Confirmations and Finality: When Is It Actually Settled?

Your transaction is in a block. Is it settled now? On most chains, the honest answer is: increasingly, but never absolutely.

:::definition
**Confirmation** — One block added to the chain at or after the block containing your transaction. A transaction "with 3 confirmations" is in a block that has two more blocks built on top of it. Each confirmation buries the transaction deeper.
:::

On proof-of-work chains like Bitcoin, settlement is probabilistic. Lesson 2 gave you the reason: rewriting history means redoing the proof-of-work for the rewritten block and every block after it, faster than the honest network extends the chain. Each confirmation adds another block's worth of work an attacker would have to redo. The transaction is never mathematically final — it just becomes exponentially more expensive to reverse.

This is where the famous "wait for 6 confirmations" rule comes from — and it is a convention, not a law. The 2008 Bitcoin paper worked through the attacker math: against an attacker holding 10 percent of the network's computing power, a transaction buried six blocks deep faces reversal odds below one in a thousand. Early services adopted six — roughly an hour of Bitcoin blocks — and the habit stuck. But nothing magic happens at six. Exchanges (Lesson 5) choose their own thresholds for crediting deposits, and many now credit after 2 or 3 confirmations; a stronger attacker than the paper's 10 percent example would need more. The number is a risk judgment, not a threshold in the software.

:::definition
**Finality** — The point at which a transaction can no longer be reversed. Proof-of-work offers probabilistic finality: reversal becomes rapidly more expensive with depth but never impossible. Some proof-of-stake systems add explicit finality: a point after which reversal would require breaking the protocol's economic rules at massive, visible cost.
:::

Proof-of-stake Ethereum works differently. Validators vote on checkpoints, and once a checkpoint gathers votes from two-thirds of all staked ETH across two voting rounds, every block behind it is marked finalized — this takes about two epochs, roughly 13 minutes. Reversing a finalized block is not just expensive to attempt; the protocol is designed so that it cannot happen unless at least one-third of all staked ETH — billions of dollars of validators' own money — breaks the rules simultaneously, and slashing (Lesson 3) destroys that stake as the penalty. Not impossible in principle. But the cost is explicit, enormous, and borne by identifiable stakers.

:::warning
Finality is the reason crypto has no undo button. In Lesson 4 you saw that a payment sent to a wrong address is gone — now you know precisely when "gone" becomes true: once the transaction is buried (proof-of-work) or finalized (proof-of-stake), no bank, no support ticket, and no court order can rewrite the ledger entry. Banks reverse mistaken transfers because a referee keeps their ledger. This track began, in Lesson 1, with the removal of that referee. Irreversibility is not a bug in that design — it is the design. Check the address, check the amount, check the fee, then send.
:::

---

## 5. Reading a Block Explorer

Everything in this lesson is publicly checkable, which is genuinely unusual for financial plumbing. The tool for checking is a block explorer.

:::definition
**Block Explorer** — A website or tool that lets anyone look up any transaction, address, or block on a public blockchain and see its status, confirmations, and fees. Every major chain has several independent explorers; no account is needed.
:::

A typical transaction page shows, whatever the chain and whichever explorer you use:

- **Status** — pending (still in the mempool), success (in a block), or failed. Note that failed transactions on Ethereum still pay gas: the network did the work of running your transaction, even though it ended in an error.
- **Confirmations** — how deep the transaction is buried, often shown as a live count.
- **Fee** — what was actually paid, and on Ethereum, how it split between burned base fee and tip.
- **From, to, and amount** — the ledger entry itself.

:::practice
Take any confirmed transaction — one of your own if you have made one, or any recent transaction listed on a public explorer's front page. Find three things: (1) its status, (2) its number of confirmations right now, then refresh after a few minutes and watch the number grow, and (3) its fee — then compute the fee as a percentage of the amount moved. Would you have accepted that percentage knowingly? You have just done, for free, the settlement check that most crypto users never do.
:::

---

## What to Look For

- When a wallet, app, or person says a payment was "sent," ask: broadcast, in a block, or buried? Those are three different promises, and only the last one approaches settled.
- When you are about to send during a busy period, check the current fee level first — the same transaction can cost 10 times more during congestion, and fees price data and computation, never the amount moved.
- When an exchange says "deposit credited after N confirmations," recognize N as that exchange's risk judgment, not a law of the protocol — different platforms pick different numbers for the same chain.
- When someone quotes a historical fee figure or a fee record, check it against at least two data sources — reputable providers disagreed by some 20 dollars on Ethereum's May 2021 peak, and anyone quoting an exact number with confidence has usually only checked one.

---

## Practice / Quiz

1. Your wallet shows a payment as "sent," and you can see the transaction in the mempool. What is the honest description of its status?

   - A) Settled — the network has seen it, so it cannot be reversed
   - B) Broadcast but unconfirmed — it can still fail, be replaced, or never confirm at all
   - C) Finalized, because the signature is valid
   - D) Complete after a standard 10-minute waiting period

   **Correct: B.** The mempool is the waiting room, not the ledger. A transaction there has been seen by the network but not selected into a block — if the fee is too low it can wait indefinitely, and the sender can broadcast a replacement. "Sent" means submitted, nothing more.

2. On Ethereum after EIP-1559, what happens to the base-fee portion of every transaction fee?

   - A) It is paid to the validator who includes the transaction
   - B) It is refunded to the sender once the transaction is buried
   - C) It is burned — destroyed and removed from the ETH supply
   - D) It is pooled and shared among all stakers

   **Correct: C.** Since the London upgrade of August 2021, the protocol-set base fee is burned, and only the optional priority fee (the tip) goes to the validator. That tip is where the fee auction now operates when blocks are contested.

3. Why do exchanges wait for several confirmations before crediting a Bitcoin deposit?

   - A) Because the Bitcoin software forbids spending coins with fewer than 6 confirmations
   - B) Because each confirmation buries the transaction under more proof-of-work, making reversal exponentially more expensive — and the exchange picks a depth where that risk is acceptably small
   - C) Because confirmations verify the sender's identity
   - D) Because miners refund fees on transactions reversed before 6 confirmations

   **Correct: B.** Proof-of-work finality is probabilistic: reversal is never impossible, only increasingly uneconomic with depth (Lesson 2's redo-the-work argument). Six confirmations is a convention traceable to the 2008 paper's attacker math, not a rule in the software — which is exactly why different exchanges choose different thresholds.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Transaction | A signed instruction to update the blockchain's ledger; data recording a transfer, not a coin that travels. |
| Mempool | The pool of broadcast, valid transactions waiting to be included in a block — seen, but not yet recorded. |
| Gas | Ethereum's unit of computational work; the fee is gas used multiplied by the price per gas unit. |
| Confirmation | One block added at or after the block containing a transaction; each one buries the transaction deeper. |
| Finality | The point at which a transaction can no longer be reversed — probabilistic on proof-of-work, checkpoint-based on proof-of-stake Ethereum. |
| Block Explorer | A public tool for looking up any transaction, address, or block and checking status, confirmations, and fees. |

---

*Coming next: Lesson 7 — Stablecoins: pegs, reserves, and the difference between "backed" and "algorithmic."*
