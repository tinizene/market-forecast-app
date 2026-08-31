# numbers-ledger

Milestones 1-3 of the Runner Float Architecture: the ledger and float model -
durable, safe under concurrent writers, and now with a draw authority on top.

The question this exists to answer is narrow and worth answering before
anything else gets built: **does value move operator → runner → player →
mobile money, and reconcile to the unit at close?**

```
npm test          # or: node --test "test/**/*.test.js"
```

No dependencies. **Node 22.5+** — the durable store uses `node:sqlite`, which
is built in but still marked experimental, so the test script passes
`--disable-warning=ExperimentalWarning`.
Note that `node --test <dir>` does not work on current Node — it resolves the
directory as a module path. Pass a glob or a file.

## What is here

| File | |
| --- | --- |
| `src/config.js` | The assumptions stated out loud — currency, commission model |
| `src/money.js` | Integer minor units. No floats anywhere near a balance |
| `src/accounts.js` | Chart of accounts, classes, partitioning, what counts as callable |
| `src/ledger.js` | Append-only double-entry journal, balances, invariants |
| `src/operator.js` | The transaction types T0–T17 and the draw lifecycle, each with its guard |
| `src/mobilemoney/` | The provider contract, a deliberately unreliable simulator, and the gateway between them and the ledger |
| `src/draws.js` | Commit-reveal, result derivation, and the betting window |
| `src/store/memory.js` | In-memory store — the default, for tests |
| `src/store/sqlite.js` | Durable store on Node's built-in SQLite |
| `test/` | 59 tests: unit, a simulated trading day, durability, concurrency, draws |

## Durable or in-memory

```js
const { Operator } = require('./src/operator.js');
const { SqliteStore } = require('./src/store/sqlite.js');

const op = new Operator();                                       // in-memory
const op = new Operator({ store: new SqliteStore('ledger.db') }); // durable
```

Both run the same rules. The store only decides where the journal lives and how
writes are serialised.

## The transactions

| | Operation | Guard that makes it safe |
| --- | --- | --- |
| T0 | `injectCapital` | — |
| T1 | `buyFloat` | Float granted cannot exceed money paid plus commission |
| T2 | `cashIn` | A runner cannot sell float they do not hold |
| T3 | `issueVoucher` / `redeemVoucher` | Single use, enforced atomically |
| T4 | `placeBet` | A player cannot stake more than their wallet |
| T5 | `settleDraw` | One atomic posting; a draw cannot settle twice |
| T6 | `withdrawToMobileMoney` | Bounded by the wallet *and* by funds on hand |
| T7 | `cashPayout` | Bounded by the wallet; repays the runner in float |
| T8 | `sellFloatBack` | Bounded by float held and funds on hand |
| T9 | `accrueGamingTax` | — |
| T10 | `issueFreeTicket` | One ticket per id; the daily promotional budget is a posting guard |
| T11 | `redeemFreeTicket` | Single use; obeys the betting window exactly as T4 does |
| T12 | `fundJackpot` | Only from a settled draw, and only once per draw |
| T13 | `payJackpot` | Bounded by the pool; once per draw, never before the reveal |
| D1 | `openDraw` | Commitment must be published before betting opens |
| D2 | `revealDraw` | Seed must match the commitment; not before the draw time |
| A1 | `suspendAgent` / `reinstateAgent` | Each happens once; read under the same lock every sale is checked against |
| P1 | `setProtection` / `clearProtection` | Off until posted; a policy must limit something |
| P2 | `setPlayerLimit` | Overrides the house policy either way; a null field inherits it |
| P3 | `excludePlayer` / `reinstatePlayer` | A cooling-off period lapses by itself and cannot be cut short |
| T14 | `topUpWallet` | Posted only once the provider confirms |
| T15 | `reserveDisbursement` | Bounded by the wallet *and* by funds on hand; holds the money in flight |
| T16 | `confirmDisbursement` | Bounded by what is actually in flight |
| T17 | `returnDisbursement` | Bounded by what is actually in flight |

T10–T13 are the promotional transactions. A free ticket differs from a sold
voucher (T3) by exactly one line — that one debits the runner's float because a
runner paid for it, this one debits promotional cost because nobody did — and
that line is the whole cost of a campaign. Redeeming turns it straight into a
stake without passing through the wallet, so a grant cannot be withdrawn as
cash. Both `PROMO_VOUCHERS` and `JACKPOT_POOL` are **callable**, which is the
point: promising more than the operator holds fails the solvency check before
the promise can be redeemed.

## Runner tooling

`agentStatement(agentId, { from, to })` produces the six lines the daily
reconciliation asks for — opening float, purchases, sales, payouts handled,
commission earned, closing float — derived from the journal rather than kept as
a running total, so it cannot disagree with the entries it summarises. The
window is half-open, so one day's statement and the next cannot both claim the
same transaction. A kind that moves float but is not recognised lands in
`other` rather than vanishing.

`AGENT_COMMISSION` is partitioned by runner, because a statement that cannot
say what this runner earned is not a statement.

**Suspension stops selling, never settling.** A suspended runner cannot cash in,
sell vouchers or buy more float; they can still pay winners (T7) and sell float
back (T8). Suspending must not strand a runner's money or leave a player unpaid.

`agents()` and `agentsBelow(threshold)` read a roster written on a runner's
first float purchase — not the balance rows, because a runner sitting at
exactly zero has no balance row, and that is precisely the runner who cannot
serve the next draw (F4).

## Player protection

**Off until it is switched on.** No policy posted means no check runs — an
operator that has not set limits is not silently subject to invented ones.
Switching it on is an event with a timestamp, because "when did you introduce
limits, and at what level" is a question with a regulatory answer that a
constant in a deployment cannot give.

| | Control | Applies to |
| --- | --- | --- |
| Daily stake cap | most a player may stake in a UTC day | paid bets **and** free tickets |
| Daily loss cap | most they may be down in a day, net of that day's winnings | paid bets only |
| Self-exclusion | indefinite, lifted only by reinstatement | staking and top-ups |
| Cooling-off | exclusion with an end date | lapses on its own; cannot be cut short |

Two asymmetries are deliberate:

- **Money out is never blocked.** An excluded player cannot stake and cannot be
  topped up, but can always withdraw (T6) or be paid at a runner (T7). A
  protection measure that traps a balance is not one.
- **A free ticket counts against a stake cap, never a loss cap.** It adds to
  the day's play, so it belongs in a limit meant to bound play; it cannot lose
  the player money, so it does not belong in one meant to bound losses.

`playerStatement(playerId, at)` answers what a player has staked and won today,
what they are net, and which limits are in force — for support at a counter,
and for the player who asks.

## Mobile money

`src/mobilemoney/` is an adapter, a simulator, and the gateway between them.
There is no real provider behind it and no agreement to sign one yet — which
turns out not to be the obstacle. The API call is the easy half. What breaks in
production is the callback that arrives twice, the one that arrives out of
order, the request that times out with the money already moving, and the outage
that lands mid-run. All of those are reproducible here, deterministically,
without a telco.

Two rules decide the accounting, and they deliberately point in opposite
directions:

- **Money in is recognised when it is confirmed.** A collection in flight is
  not an asset, because money that might arrive is not money.
- **Money out is reserved when it is requested.** The wallet is debited before
  the transfer is attempted — so the same balance cannot be withdrawn twice
  while the first attempt is in the air — and waits in `PENDING_DISBURSEMENTS`,
  a callable liability, until the provider says which way it went. A failure is
  a **return**, not a reversal: the player was owed it throughout.

Three things make a timeout survivable. The client reference is ours and is on
disk *before* the provider is called; `getStatus` is asked by that reference
rather than the provider's; and a timeout leaves the request `PENDING` rather
than guessing. "We do not know" is a state, and it is the one a payments
integration most often lies to itself about.

Nothing that cannot be applied is dropped. A callback with the wrong amount, a
callback contradicting a terminal answer, and a callback for a reference nobody
started all become anomalies — recorded once each, however many reconciliation
sweeps re-find them, because a queue that grows a duplicate row every sweep is
a queue nobody reads.

Every resolution that moves money writes the request log in the same ledger
transaction, through an optional `onCommit` on the five transactions the
gateway uses. There is no window where the books say a payout happened and the
request log still calls it pending.

## What the tests actually prove

- **Trial balance.** Debits equal credits across the whole journal.
- **The accounting equation.** Assets = liabilities + equity + revenue −
  expenses. Trial balance alone would not catch an expense booked as a
  liability; this does.
- **Solvency.** Settlement funds cover every callable liability — agent float,
  player wallets, unredeemed vouchers, unsettled stakes, unredeemed free
  tickets and the jackpot pool. A test issues promotions past the operator's
  capital and watches the check go red while the books still balance:
  insolvency is not a bookkeeping error (failure case F16).
- **Idempotency.** A replayed transaction id is a no-op, not a second payment.
  A retried mobile-money callback cannot pay a winner twice.
- **Guards hold under failure.** Every rejected operation leaves the trial
  balance intact — there is no partial write.
- **Balances are derivable.** A test rebuilds every balance from the journal
  alone and compares. A stored balance that disagrees with its entries is the
  classic ledger bug; the only way to be immune is not to keep one.
- **A full trading day reconciles**, across 25 different generated days, with
  runners running dry mid-day and topping up (failure case F4).
- **The books survive a restart.** Balances, idempotency and voucher state all
  come back from the file; a draw recorded before a restart still settles after
  one.
- **Concurrent processes cannot overdraw a runner.** Eight processes race for
  float that only covers one of them: exactly one wins, the other seven fail
  the guard, and the runner never goes negative. Same for double-redeeming a
  voucher.
- **A runner's statement reconciles.** Opening plus movements equals closing,
  and closing equals the balance the ledger holds. One day closes where the
  next opens, and one runner's activity never appears on another's statement.
- **Suspension holds where it should and yields where it must.** A suspended
  runner is refused every way of taking money from a player, and still allowed
  every way of settling up.
- **A misbehaving provider cannot corrupt the books.** A scripted run of six
  requests — success, failure, timeout, duplicate callback, outage, amount
  mismatch — reconciles: each ends resolved or visibly queued, the trial
  balance and the accounting equation hold, solvency holds, and there is no
  cache drift. Money is credited exactly once in every case where it moved,
  and returned in every case where it did not.
- **Protection is inert until switched on**, and enforced the moment it is. A
  refused bet writes neither the entry, the bet, nor the day's counter, and the
  counters survive a restart, so a limit cannot be reset by a redeploy.
- **A free bet is a bet.** It settles under the same rules and pays the same
  prize as a paid one, revenue is grossed up by the free stake against the
  expense recognised at issue, and the promotion nets to its true cost rather
  than its face. The daily budget stops issuance rather than draining the
  float, and a rejected issue writes neither the entry, the ticket, nor the
  day's counter.

## The draw authority

Two promises, kept separately.

**The number cannot be chosen after seeing the book.** A seed is generated and
its commitment — `sha256(drawKey|seed)` — published *before* betting opens; the
result is `HMAC(seed, drawKey)` reduced by rejection sampling. Revealing a
different seed later fails the check, in the operator's own code, before anyone
else has to catch it. `drawReceipt(drawKey)` returns everything a player or an
auditor needs to redo the check themselves.

Rejection sampling rather than `% 1000`: 2^32 is not a multiple of 1000, so a
plain modulo makes low numbers very slightly likelier. The bias is tiny, but
"very slightly rigged in a direction nobody chose" is not a property to ship in
a game of chance when the fix is six lines.

**A bet cannot be entered after the numbers are known.** The betting window is
half-open — the cutoff instant is already closed — and enforced against the
server-supplied `at`, never a device clock. A bet is also refused outright once
a draw is revealed, independently of any timestamp, so a forged or replayed
`at` inside the old window still gets nowhere.

Settlement takes an `evaluate(bet, result)` function rather than a list of
winners. With a `winners[]` argument, settlement would simply trust whoever
called it; deriving payouts from the revealed number is the point of having an
authority at all. The lifecycle test wires in `africa-numbers/game.js` — the
real payout and hit rules — so this is exercised against the game as shipped.

Opening and revealing move no money, so they are events rather than ledger
transactions — but append-only ones, in the same store and the same
transaction. A commitment that could be edited afterwards would prove nothing.

## Why the guards moved inside the transaction

Milestone 1 checked a balance and then posted. Single-threaded and in-memory
that is airtight. Behind an HTTP endpoint it is a race: two cash-ins can both
read enough float and both post, overdrawing a runner by the smaller of them.

Guards now run as a `precondition` evaluated inside the write transaction, and
the SQLite store opens with `BEGIN IMMEDIATE` — the write lock is taken before
the guard reads anything, so the check and the write cannot be separated. The
multi-process test in `test/concurrency.test.js` is the evidence; it fails
against the milestone-1 design.

One behaviour changed as a result, for the better: a replayed transaction id is
now an idempotent no-op rather than an error, which is what makes a redelivered
mobile-money callback safe to accept. Settling the same draw under a *different*
id is still refused outright.

## What building it changed in the design

**The commission model needs capital behind it.** Granting a runner 10,000 of
float for a 9,500 payment issues 500 of value the operator never received. The
first float sale leaves the book short by exactly the commission, and the
solvency invariant catches it immediately. So `OPERATOR_CAPITAL` exists and
must be funded before float is sold at a discount.

That is a genuine constraint on the business, not an accounting detail: the
operator needs working capital at least equal to cumulative commission granted,
before the first runner is signed up. The alternative — paying commission
periodically instead of as a discount at purchase — removes the requirement and
is worth weighing.

## What is deliberately not here

No HTTP and no auth. Those come next, and neither is worth building on a
ledger that does not balance.

There is no real mobile money provider either — only the contract, a simulator
and the gateway. Writing a driver for an actual telco is the remaining work,
and it is the small half.

The promotional budget cap is a constructor option rather than a stored,
auditable policy. That is enough for the guard to fail closed, which is the
property that matters, but a licensed operation will want the cap itself to be
an append-only event with a name against it.

The ledger still holds no bet types of its own: a selection is an opaque blob it
stores and hands back to the evaluator. That keeps the rules in one place
(`africa-numbers/game.js`) rather than two that can drift — at the cost of a
cross-package import in one test, which the CI path filter accounts for.

Two known limits of the current store. SQLite serialises writers, which is
right for one operator process and a bounded agent network, but it is a single
writer — a busy multi-node deployment wants Postgres, and the store interface
exists so that swap does not touch the rules. And the balance cache is
maintained in the same transaction as its entries, with `verify()` to prove it
has not drifted; that check is cheap now and will want to become a scheduled
job rather than a test assertion.

Cash never appears in this ledger at all — by design. See the architecture
document for why that is the whole point rather than an omission.
