# Crypto — Chapter 1, Lesson 3: Consensus — Proof of Work vs Proof of Stake

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain why a ledger with thousands of copies needs a mechanism for agreeing on the next block
- Describe how Proof of Work and Proof of Stake each choose who writes that block, mechanically
- Compare the two systems honestly on energy, attack cost, and concentration — without picking a team
- State exactly what a 51% attacker can do, what they cannot do, and name a real chain where it happened

---

## 1. The Problem: One Ledger, Thousands of Copies, No Referee

Lesson 1 ended with a design: everyone keeps a full copy of the ledger, so a coin that was already spent is visible to all, and a second spend gets rejected. Lesson 2 showed why old history is hard to rewrite: each block's hash is locked into the next block, so changing anything old means redoing every block after it.

But both lessons quietly assumed something. They assumed the network agrees on which block comes next. That agreement is the hard part.

Thousands of computers hold copies of the ledger. New transactions arrive at each of them in a slightly different order. If every computer just wrote its own next block, the copies would split apart immediately — and "which spend came first?" would again have no answer. That is the double-spend problem sneaking back in through the side door.

:::definition
**Consensus** — The mechanism by which a decentralized network agrees on a single next block, and therefore a single shared history, without a central referee. Every blockchain needs one; Proof of Work and Proof of Stake are the two dominant designs.
:::

A bank solves this by decree: the bank's version is the version. A decentralized network cannot decree. So it does something stranger: it makes the right to write the next block expensive, and it pays the writer for doing it honestly. The two dominant systems differ only in what the expense is.

- **Proof of Work** makes it expensive in electricity and hardware.
- **Proof of Stake** makes it expensive in locked-up capital that can be destroyed.

Hold onto that framing. Everything else in this lesson is detail.

---

## 2. Proof of Work: Paying With Electricity

Lesson 1 introduced proof of work as the idea in the 2008 Bitcoin paper: adding to the history must cost real computation. Here is how that actually operates, using Bitcoin as the example.

:::definition
**Mining** — Competing to add the next block to a Proof of Work blockchain by finding a valid nonce first. The winner earns new coins plus the transaction fees in the block.
:::

Lesson 2 introduced the nonce: a number in the block header that miners change over and over, rehashing each time, until the block's hash falls below the network's target. There is no shortcut and no skill involved in any single guess. It is a lottery where each hash is one ticket, and more computing power simply buys tickets faster.

The winner broadcasts the finished block. Every other computer checks it in milliseconds — verifying is cheap, only finding is expensive — and, if it is valid, adds it to their copy and starts racing on the next one.

Why would anyone burn electricity on this? Because the winning block contains a payment to its own miner.

:::definition
**Block Subsidy** — Newly created coins awarded to the miner of a valid block, on a fixed schedule. Bitcoin's subsidy started at 50 BTC and halves roughly every four years; since the April 2024 halving it stands at 3.125 BTC per block, on top of the block's transaction fees.
:::

One more gear makes the machine self-regulating. Bitcoin aims for one block roughly every 10 minutes. If more miners join, blocks get found too fast — so every 2,016 blocks (about two weeks at the target speed), the software automatically retunes the difficulty of the puzzle to bring the pace back to 10 minutes.

:::definition
**Difficulty Adjustment** — An automatic recalibration of how hard the mining puzzle is, keeping block production near a target pace no matter how much computing power joins or leaves the network.
:::

:::example
Notice what difficulty adjustment implies. More mining power does not produce more bitcoins — the schedule is fixed. It only raises the cost of producing the same bitcoins, and with it, the cost of attacking the history. The electricity is not an unfortunate inefficiency someone forgot to fix. Burning it is the security. Whether that price is worth paying is a fair question — Section 4 takes it seriously — but "why not just use less energy?" misunderstands the design: an attacker must outspend the honest network, so the honest network's spending is the wall.
:::

---

## 3. Proof of Stake: Paying With Locked Capital

Proof of Stake starts from a question: does the expense have to be electricity? What if, instead of burning money on power to earn the right to write blocks, participants posted money as a bond — and lost it for cheating?

:::definition
**Proof of Stake** — A consensus mechanism where the right to propose and confirm blocks goes to participants who have locked up the network's own token as collateral. Misbehavior is punished by destroying part of that collateral.
:::

:::definition
**Staking** — Locking tokens as collateral to participate in Proof of Stake consensus and earn rewards. On Ethereum, running your own validator requires exactly 32 ETH of stake.
:::

:::definition
**Validator** — A participant in a Proof of Stake network who has staked collateral and runs software that proposes new blocks and attests to (votes on) blocks proposed by others.
:::

The mechanics, using Ethereum — the largest Proof of Stake network — as the example:

1. **You lock capital.** A validator deposits 32 ETH into the protocol. It is now collateral, not spending money.
2. **The protocol takes turns.** For each slot, the protocol pseudo-randomly selects one validator to propose the block. Committees of other validators attest that the proposal is valid. No race, no puzzle — selection replaces competition, which is why the electricity bill collapses.
3. **Honesty is paid; provable cheating is punished.** Validators earn rewards for proposing and attesting on time. But sign two conflicting blocks for the same slot, or two conflicting votes, and the protocol itself contains the proof of your dishonesty — any observer can submit those two signatures and trigger an automatic penalty.

:::definition
**Slashing** — The automatic destruction of part of a misbehaving validator's stake, followed by ejection from the validator set. On Ethereum, slashable offenses are provable equivocations — signing two conflicting blocks or votes — and this is a real, live mechanism, not a threat on paper: in February 2021, one staking operator had around 75 validators slashed for double-signing, losing roughly $30,000 at the time.
:::

The ejection process takes weeks, and the penalty scales up if many validators are slashed at once — that scaling targets exactly the coordinated, many-validator behavior an attack would require. The design in one sentence: in Proof of Work, attacking is expensive because you must buy the effort; in Proof of Stake, attacking is expensive because the protocol can confiscate your bond.

![Side-by-side diagram of Proof of Work, where miners spend electricity racing to find a valid nonce and the winner earns the subsidy and fees, and Proof of Stake, where validators lock capital to be selected to propose blocks and face slashing for provable misbehavior](../images/crypto-01-3-pow-vs-pos.svg)

---

## 4. The Honest Comparison

Almost everything written about PoW versus PoS is written by a side. Exchanges selling staking products lean PoS. Bitcoin-adjacent media leans PoW. Here is the comparison with the marketing removed.

**Energy.** Proof of Work's consumption is real and large. The standard reference is the Cambridge Bitcoin Electricity Consumption Index, which has tracked Bitcoin's electricity use for years; a 2025 Cambridge study built on industry survey data estimated Bitcoin mining at roughly 138 TWh per year — about 0.5% of global electricity consumption, in the range of a mid-sized country. (The index updates daily, so treat any single number as a snapshot, not a constant.) Proof of Stake removes almost all of this. When Ethereum switched from PoW to PoS on 15 September 2022 — an event called the Merge — the Ethereum Foundation's estimate was that energy use fell by about 99.95%, and an independent assessment by the Crypto Carbon Ratings Institute measured the drop at over 99.98%. On energy, the difference is not close, and honest PoW advocates do not claim it is. The real dispute is whether the energy buys something PoS cannot replicate — which is the next point.

**Security assumptions.** Attacking PoW means assembling a majority of physical hashpower: hardware plus electricity, sustained for as long as the attack runs. Attacking PoS means acquiring and staking a dominant share of the token itself. Each side calls its own cost profile the strength. PoW advocates note that its cost is external and physical — you cannot print hashpower, and buying that much hardware moves markets. PoS advocates note that acquiring a huge stake drives the token's price up against you, that the attacker's own locked capital gets destroyed by slashing when the attack is detected, and that a PoS community can identify and burn an attacker's stake in a recovery fork. Neither argument fully settles it. Both systems have secured very large networks for years, and both rest on the same honest assumption Lesson 1 flagged in the 2008 paper itself: security holds while a majority of the deciding resource is honest.

**Decentralization.** Here both sides prefer to talk about the other. In Bitcoin mining, individual miners join mining pools to smooth their income, and pool concentration is persistent: through the mid-2020s, the two largest pools alone have repeatedly coordinated well over 40% of the network's total hashpower between them. Pool members can switch pools, which limits what a pool operator could get away with — but block construction is far more concentrated than the "thousands of independent miners" image suggests. In Ethereum staking, the mirror-image concern: most holders do not run validators themselves, they stake through intermediaries, and the largest liquid-staking protocol, Lido, has held roughly a quarter of all staked ETH in recent years — peaking above 30% in 2023, high enough that prominent Ethereum researchers publicly argued for self-limiting. Concentration is not a PoW problem or a PoS problem. It is a gravity problem: economies of scale pull both systems toward fewer, bigger operators, and both communities actively worry about it.

:::warning
"PoS is strictly better — it does the same job without the energy" and "PoW is the only real security — PoS is a circular system securing itself with its own token" are both partisan claims, and you will hear both stated as fact. Each contains a true observation and omits the counterargument. The honest position is that these are different trade-offs — external physical cost versus confiscatable internal capital — with different failure modes, and that anyone telling you the question is settled is usually holding the asset they are defending.
:::

---

## 5. The 51% Attack: What Majority Control Actually Buys

Lesson 1 quoted the Bitcoin paper's own assumption: the system is secure while a majority of computing power is honest. Time to look at what happens when that assumption fails.

:::definition
**51% Attack** — An attack in which one party controls a majority of a network's deciding resource (hashpower in PoW, stake in PoS) and uses it to override the honest network's version of recent history.
:::

Precision matters here, because this attack is constantly exaggerated in both directions. A majority attacker **can**:

- **Censor** — refuse to include chosen transactions in the blocks they control
- **Reorganize recent history** — privately mine an alternative chain and release it, replacing recently confirmed blocks (Lesson 2's cost argument works against outsiders; a majority attacker is the exception it warned about)
- **Double-spend** — the practical payoff: deposit coins on an exchange, trade and withdraw, then release a rewritten chain in which the original deposit never happened

A majority attacker **cannot**:

- **Steal coins from arbitrary wallets** — spending your coins requires your cryptographic key (Lesson 4's subject), which no amount of hashpower conjures
- **Mint coins beyond the schedule** — every node independently checks the supply rules; a block that breaks them is rejected even if it has enormous work behind it
- **Change the rules** — the attack operates inside the protocol's rules; it cannot rewrite them

:::example
This is not theoretical — on smaller chains it has happened repeatedly, because a small PoW chain can be attacked by renting hashpower by the hour. Ethereum Classic, a small PoW network, suffered three separate 51% attacks in August 2020 alone. In the second, over 5–6 August 2020, the attacker reorganized 4,236 blocks — over 15 hours of the chain's history — and double-spent about $1.7 million of ETC, using hashpower rented through a commercial marketplace. Bitcoin Gold, in May 2018, lost around $18 million to 51% double-spend attacks aimed at exchanges. Note the pattern in both cases: the victims were exchanges that credited deposits after too few confirmations — not ordinary wallet holders, whose coins the attackers had no way to touch.
:::

The lesson inside the examples: majority attacks are a real, demonstrated risk — priced by the cost of the deciding resource. On the largest networks that cost is enormous and the attacks have not happened. On small chains the cost can be a few hours of rented hashpower, and the attacks happen with some regularity. "Secured by a blockchain" tells you nothing until you ask how expensive that particular chain's majority actually is.

---

## What to Look For

- When someone compares PoW and PoS, check which side's weakness they mention. A comparison that names only one system's concentration problem, or only one system's cost, is an advertisement.
- When someone cites Bitcoin's energy use, check the date and source of the number. It moves with the hashrate and with the index methodology — a dated figure from the Cambridge index is evidence; an undated shock number is rhetoric.
- When someone says a 51% attacker can "steal your coins" or "take over the network," they are exaggerating. When someone says a majority attack "can't really do anything," point to Ethereum Classic, August 2020. Both exaggerations are common; the truth is specific.
- When a small chain advertises PoW security, ask what a majority of its hashpower costs to rent for an afternoon. For small chains, that number — not the slogan — is the security budget.

---

## Practice / Quiz

1. In Proof of Work, what does the difficulty adjustment actually do?
   - A) It increases the block subsidy when more miners join
   - B) It retunes the puzzle's hardness so blocks keep arriving at the target pace regardless of total mining power
   - C) It makes hashes harder to verify, slowing down attackers
   - D) It reduces the network's energy use over time

   **Correct: B.** Bitcoin retunes difficulty every 2,016 blocks (about two weeks) to hold the roughly 10-minute block pace. More mining power therefore does not create more coins or faster blocks — it only raises the cost of producing, and attacking, the same chain. Verifying stays cheap; only finding is expensive.

2. A group gains majority hashpower on a Proof of Work chain. Which of the following can they actually do?
   - A) Spend coins out of any wallet on the network
   - B) Create extra coins beyond the issuance schedule
   - C) Rewrite recent blocks and double-spend their own coins
   - D) Permanently change the network's rules

   **Correct: C.** Majority control lets an attacker censor transactions, reorganize recent history, and double-spend — exactly what the Ethereum Classic attackers did in August 2020, reorganizing 4,236 blocks. It does not conjure other people's keys, and blocks that mint extra coins or break the rules are rejected by every honest node no matter how much work backs them.

3. What is the core difference in how PoW and PoS make dishonesty expensive?
   - A) PoW uses cryptography and PoS does not
   - B) PoW makes writing blocks cost external resources (hardware and electricity); PoS makes cheating cost internal collateral that the protocol can destroy
   - C) PoS eliminates the 51% attack entirely
   - D) PoW is decentralized and PoS is centralized

   **Correct: B.** In PoW, an attacker must out-spend the honest network in physical resources. In PoS, provable cheating triggers slashing — the protocol destroys the validator's own staked capital. Neither system eliminates majority attacks (a majority of stake is dangerous, just as a majority of hashpower is), and both systems have real concentration concerns — mining pools on one side, staking intermediaries on the other.

---

## Key Terms Recap

| Term | One-line definition |
|---|---|
| Consensus | How a decentralized network agrees on one next block, and one shared history, without a referee. |
| Mining | Competing to add the next Proof of Work block by finding a valid nonce first, for the subsidy plus fees. |
| Block Subsidy | Newly created coins paid to the miner of a valid block on a fixed, halving schedule. |
| Difficulty Adjustment | Automatic retuning of the mining puzzle to hold a target block pace as mining power changes. |
| Proof of Stake | Consensus where block-writing rights go to holders of locked collateral, and cheating destroys that collateral. |
| Staking | Locking tokens as collateral to participate in consensus and earn rewards. |
| Validator | A staked participant who proposes blocks and attests to others' blocks. |
| Slashing | Automatic destruction of part of a cheating validator's stake, plus ejection from the network. |
| 51% Attack | Using majority control of hashpower or stake to censor, reorganize recent history, and double-spend. |

---

*Coming next: Lesson 4 — Wallets, Keys & Custody: public and private keys, seed phrases, hot versus cold storage, and "not your keys, not your coins" taught as a trade-off, not a slogan.*
