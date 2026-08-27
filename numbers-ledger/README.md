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
| `src/operator.js` | The transaction types T0–T9 and the draw lifecycle, each with its guard |
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
| D1 | `openDraw` | Commitment must be published before betting opens |
| D2 | `revealDraw` | Seed must match the commitment; not before the draw time |

## What the tests actually prove

- **Trial balance.** Debits equal credits across the whole journal.
- **The accounting equation.** Assets = liabilities + equity + revenue −
  expenses. Trial balance alone would not catch an expense booked as a
  liability; this does.
- **Solvency.** Settlement funds cover every callable liability — agent float,
  player wallets, unredeemed vouchers, unsettled stakes.
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
authority at all. The lifecycle test wires in `harlem-numbers/game.js` — the
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

No HTTP, no auth, no mobile money. Those come next, and none of them are worth
building on a ledger that does not balance.

The ledger still holds no bet types of its own: a selection is an opaque blob it
stores and hands back to the evaluator. That keeps the rules in one place
(`harlem-numbers/game.js`) rather than two that can drift — at the cost of a
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
