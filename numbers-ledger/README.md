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
| `src/http/` | Identity and roles, and the HTTP surface over the whole thing |
| `src/ussd/` | The USSD session engine: five keypresses, 182 characters, no state on the handset |
| `src/console/` | The operator console: no framework, no build step, no inline script |
| `src/reporting.js` | Operator reporting, derived from the journal on the way past |
| `src/custody.js` | Sealed draw seeds: k-of-n shares over GF(256), and the envelope they open |
| `src/manifest.js` | What software this is: the build manifest, and the check against it |
| `src/build.js` | Which build this process is running, for the log and the screen |
| `src/draws.js` | Commit-reveal, result derivation, and the betting window |
| `src/errors.js` | `Refusal` — an expected answer, told apart from a fault by its type |
| `src/store/memory.js` | In-memory store — the default, for tests |
| `src/store/sqlite.js` | Durable store on Node's built-in SQLite |
| `bin/console-server.js` | The composition root: the only way to actually run any of this |
| `bin/build-manifest.js` | Writes `MANIFEST.json` at release, and checks it in CI |
| `bin/verify-build.js` | What an inspector runs on a production host |
| `lab/` | The laboratory environment. Pinned as evidence, absent from the build |
| `scripts/` | Evidence-producing tooling: the math sheet and the figures behind it |
| `docs/math-sheet.md` | Generated. Every figure derived from the game rules |
| `test/` | 327 tests: unit, a simulated trading day, durability, concurrency, draws, channels, the API surface |

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

## The service layer

`src/http/` is a hand-rolled router over `node:http`, for the same reason the
rest of this package has no dependencies: what it does has to be readable in
one sitting by somebody deciding whether to trust it with money.

Four principals, and they are not variations on one another. **Operator** staff
open draws, suspend runners and set limits. An **agent** can move value into a
wallet and pay a winner from their own cash, and can never spend from a wallet.
A **player** holds a wallet: their token proves who they are, and the PIN
authorises each spend, because possession of a handset is not consent. A
**provider** callback is authenticated by signature, not by token.

Four rules are enforced in the dispatcher rather than left to each handler,
because each is a way this shape of API is routinely broken:

1. **The server stamps the time.** `at` is never read from a request. A
   client-supplied timestamp would defeat the cutoff, and the cutoff is why the
   draw can be trusted at all.
2. **The subject comes from the token.** A runner's `agentId` and a player's
   `playerId` come from their credentials, never from the body. Letting a
   caller name the account they are acting on is the classic broken-access
   control bug, and here it is a theft primitive.
3. **Money moves only with an `Idempotency-Key`.** It becomes the ledger
   transaction id, so a retry — a dropped USSD session, a mobile client on a
   bad connection — is a no-op rather than a second payment.
4. **A refused guard is a 409, not a 500.** "You cannot stake more than your
   wallet" is an expected answer; an API that reports it as a server fault
   teaches its callers to retry.

Tokens are stored as hashes, so a leaked database does not hand over working
credentials, and the plaintext is returned once and never again. A PIN is
scrypt-hashed and locks after three wrong guesses — it is four digits, visible
on screen as it is typed over USSD, and cannot be the only thing protecting an
account. Sign-in gives one answer for every failure, because telling "no PIN
set" from "wrong PIN" is an account-enumeration oracle on a public endpoint.
Webhook signatures cover the timestamp **and the raw bytes**: without the time
in the signed material a captured callback replays for ever, and re-serialising
the parsed body is how a signature check comes to pass on something other than
what arrived.

`GET /draws/:key` needs no credentials at all. The commitment and the revealed
seed are public on purpose — that is the whole point of publishing them.

## USSD

The primary channel, not a fallback: requiring a smartphone would exclude most
of the market. It is also a different medium from a browser, and five
constraints from the architecture shape the engine.

**182 characters a screen.** Every reply is clamped, and a test walks the whole
reachable graph — every menu, every re-prompt, every refusal — asserting each
one already fits without the clamp ever firing.

**Five keypresses to a bet**: menu, bet type, number, stake, PIN. Each screen
asks exactly one thing.

**All state lives on the server**, against the session id, and deliberately in
memory. "Nothing written, nothing charged, no partial bet" is a promise that
persisting a half-built bet would quietly break — so a draft is not persisted,
it expires, and a test abandons the flow at every one of its five steps and
checks the journal is untouched each time.

**The bet is written when the PIN lands**, judged against the server clock. A
session opened before the cutoff and confirmed after it is refused; the test
dials thirty seconds before the cutoff so the session is still alive when the
confirmation arrives late.

**Nothing is secret over USSD.** The PIN is visible on screen as it is typed,
so it authorises a spend and never identifies the spender. The wallet belongs
to a number, not a handset: a session id replayed from a different MSISDN is a
different caller and gets nothing. A balance sits behind the PIN because
handsets are shared; the last draw result does not, because it is already
public.

The engine holds no bet types and no game rules. It is handed the catalogue and
the validator — the same ones the app uses — so a selection the game refuses is
caught while it is still free rather than after the PIN, and the channel cannot
drift from the rules.

Mounting it behind a shortcode is a small gateway-specific adapter: the engine
takes `{sessionId, msisdn, input}` and returns `CON`/`END` text, which is what
every gateway speaks, but the request encoding differs per provider and there
is no point guessing which one.

## The operator console

`src/console/` is the screen behind all of the above, and `bin/console-server.js`
is the composition root that serves it:

```
NUMBERS_DB=./numbers.db npm run console
# Operator console   http://127.0.0.1:8787/console
# Operator token     an_...
```

Everything alarming about a default run is printed at startup rather than
discovered later — in-memory storage, a simulated provider, webhook signatures
off, plain HTTP on loopback. A console that looks the same whether the money is
real or simulated is a console somebody will eventually be wrong about.

Eight screens: the book's health and position, runners, draws, players,
protection, money in flight, promotions, and reports. Each is a view over calls that already
existed plus about twenty that did not — selling float to a runner, settlement,
capital, per-player limits, PIN resets, the jackpot — because the ledger could
do all of it and nothing could reach it without curl.

**No framework and no build step**, for the reason the rest of the package has
none: a person deciding whether to trust this with money should be able to read
it. Three files, served from a fixed list rather than a path derived from the
request, under a content security policy that allows the page its own two
scripts and calls to its own origin and nothing else. No inline handlers, no
inline styles, no remote anything.

**The token is pasted in and kept in `sessionStorage`** — gone when the tab
closes, never written to disk. Nothing rides on a cookie, so there is no
cross-site request that can act as the operator.

Three decisions worth arguing with:

**The seed never reaches the server before the reveal.** The console generates
it in the browser, shows it once, and sends only the commitment. An operator
who can read tomorrow's seed out of their own database can bet on tomorrow's
number, so the commit-reveal scheme is only worth as much as the seed's
custody — and custody outside this system is the honest answer until there is
somewhere real to put it. The cost is stated on the screen: lose the seed and
the draw can never be revealed.

**Health is derived, never reported.** The overview recomputes solvency, the
accounting equation, the trial balance and the cache-drift check on every
refresh. A server that sent `ok: true` alongside numbers that disagreed would
still show red — there is a test for exactly that.

**Amounts are parsed as strings and refused when they do not fit.** The obvious
`Math.round(Number(text) * 100)` returns 100 for `1.005`, because that product
is `100.49999999999999` — a cent less than what was typed, silently. Anything
the currency cannot represent exactly is refused and the operator retypes it.

The parts of the console that could be wrong about money live in
`console-core.js`, which loads in a browser with a `<script>` tag and in the
test suite with `require()` — the same UMD-lite trick as the game rules. It
carries a second implementation of `format()`, unavoidably, because a browser
cannot require the ledger's; a test asserts the two agree across a range of
values, and that test is why the duplication is acceptable. What is left in
`console.js` is fetching and painting, and it is not under test: a mistake
there shows the wrong text rather than moves the wrong money. It was driven in
a real browser instead, which is how the one bug in it was found — panes were
toggled with the `hidden` property while their class set `display`, so the
sign-in card stayed on screen behind the signed-in console.

Two things the console changed underneath itself. A refusal is now a **type**
(`src/errors.js`) rather than a message the service layer pattern-matches: a
guard phrased in a wording the pattern did not know about was arriving as a
500, which tells the operator nothing and invites a retry that cannot succeed.
And `buyFloat`'s refusal said the opposite of what it checks — commission is a
discount on float, so the rule is that money paid cannot exceed float granted,
and the message claimed the reverse.

## The math sheet

`docs/math-sheet.md` and `docs/math-sheet.html` — the first document a
laboratory reads, generated rather than written.

```
npm run mathsheet         # regenerate both renderings
npm run mathsheet:check   # CI: do the game rules and the sheet still agree
```

**Nothing on it is transcribed.** Win counts come from asking `isHit` about
every selection the product accepts, against all 1,000 outcomes — a million
questions per bet type. A table copied out of a design document and a table
derived from the code that pays people are two different documents, and only
the second is worth submitting.

**Nothing on it is sampled, except the one thing that has to be.** With 1,000
equally likely outcomes, enumeration is exact. The only empirical question left
is whether the draw mechanism actually reaches them evenly, and that gets a
chi-square over a million draws from deterministically derived seeds — so a
reviewer re-running it gets the same numbers. The claim is stated narrowly on
the page: it tests the *mapping* from seed to result, not the entropy of a real
seed, which comes from the platform CSPRNG and belongs in the RNG description.

### What generating it turned up

**The win count is uniform across every selection, and that is checked rather
than assumed.** Every 6-Way Box wins on exactly six draws whichever three digits
were chosen — all 720 of them. A type where that were not true would be
mispriced for some of its selections, which is the quiet way a board becomes
unfair, so the sheet counts all of them and reports the spread.

**One Digit returns 0.50135, not 0.500.** The architecture document says it
"returns exactly what the straight bet returns". It returns marginally more —
0.135 of a percentage point, in the player's favour, because 1.85 is a rounded
multiplier rather than 1.84502. Small, and worth stating precisely, because a
reviewer comparing the two documents will notice.

**Rounding only ever favours the player, and vanishes at a whole unit.** Two
multipliers are fractional; a one-cent stake on One Digit pays 2 rather than
1.85. Checked over every stake from 1 to 10,000 minor units: the worst deviation
is +0.041, always upward, and every multiplier divides exactly at L$1.00.

**A board is not one hold.** It is whatever hold the players choose by what they
play — 52.9% to 55.3% across three illustrative mixes, and the sheet labels them
illustrative because nobody has taken a bet yet.

The generator lives in `scripts/`, not `bin/`, and the manifest classifies it as
evidence: a documentation generator must not be able to change the build id.

## The laboratory environment

A running system for a tester to drive, with the ability to make a draw land on
a chosen number.

```
npm run lab
```

Two servers on two ports. The **product** is composed from `src/` exactly as
`bin/console-server.js` composes it — the software a certificate would name,
with nothing added and nothing switched on. The **control surface** is
everything else: the fixture book, the credentials, the forced outcomes, the
clock, the reset. `lab/README.md` is written for the tester.

### There is no laboratory mode

The obvious way to let a laboratory force outcomes is a flag in the draw code.
That flag then exists in production, set to `false`, and "set to `false`" is a
sentence somebody has to trust.

So there is no flag. The result is a deterministic function of the seed, so a
wanted number is reached by generating seeds until one produces it — about a
thousand tries, a few milliseconds. Everything downstream is completely
ordinary: a real seed, a real commitment published before betting opens, a real
reveal that verifies against it. `lab/seed-search.js` imports `src/draws.js` and
nothing else, and a test asserts exactly that, because the moment it needs the
operator or the ledger the claim has stopped being true.

Two things make the absence checkable rather than asserted:

- **The product's route table has nothing called `/lab`**, and a test walks it.
- **The build manifest excludes `lab/` from the runtime section** and pins it as
  evidence, so the harness is identifiable without being certified. A test
  asserts both halves.

### The property boundary this exposes

Commit-reveal stops the operator changing the number *after seeing the book*. It
does not stop them choosing the number *before the book exists* — which is
exactly what the harness does, in a few milliseconds, using public functions.

That is not a flaw the harness introduces; it is the reason the timing rule
carries as much weight as the cryptography. The commitment must be published
before betting opens, and then a chosen number is worth nothing because no bets
exist yet. A commitment published late is a guarantee that is retrospective,
which is to say absent. Better to say this first than to have a laboratory
find it.

### The clock is the tester's, not the harness's

A reveal before the draw time is refused in the laboratory exactly as it is in
production. The harness supplies the seed; whether it is time is the product's
decision, made against the clock it was given. The tester winds the clock with
`POST /lab/clock` rather than arguing with the rule — and only forwards, because
a clock that can go backwards is one where a bet placed after a cutoff can be
made to look as though it was not.

That the clock is injectable at all is a production property rather than a hook
added for testing: it is how the cutoff is kept off the caller's device.
Production wires it to the wall clock.

### The book a tester finds

Seeded through the same public operations the product uses, so no fixture can
create a state the product could not have reached on its own: three runners with
one suspended for not reconciling, twelve players with history and one PIN
between them, yesterday's draw settled with winners on real tickets, a
promotional ticket issued and played, a funded jackpot, an excluded player, a
player under their own limit, and a disbursement the provider never answered.

Building it turned up something worth knowing: a guard reads state as it *is*,
not as it was at the timestamp on the transaction. Suspending a runner before
writing their historical cash-ins refuses those cash-ins. Correct behaviour —
the guard answers "can this runner sell right now" — and a fixture has to be
written in call order rather than in timestamp order.

## What software is this

A certificate names one build. The regulator then has to confirm that
production is running *that* build and not something else, and the operator has
to prove it without handing over source. Both come down to one number everybody
can recompute.

```
npm run manifest         # write MANIFEST.json at release
npm run manifest:check   # CI: is the manifest current for this tree
npm run verify           # what an inspector runs on a production host
```

`GET /health` publishes the build id, the console shows it in the header, and
every line of the audit log carries the short form — so a logged call is
attributable to a build rather than to a date.

### The digest is reproducible without this code

Each file contributes one line in the format `sha256sum` already prints, in byte
order of path, and the whole thing is hashed:

```
{ find numbers-ledger/src numbers-ledger/bin -type f;
  echo numbers-ledger/package.json; echo africa-numbers/game.js; } \
  | LC_ALL=C sort | xargs sha256sum | sha256sum
```

That command returns the build id. It matters because **a verifier cannot
vouch for itself** — `bin/verify-build.js` is inside the manifest it checks, so
a tampered copy would report success. The defence is not cleverness, it is that
the format is boring enough to check another way. A test runs that pipeline and
compares, and a second test pins the byte ordering the pipeline depends on with
a filename pair that `LC_ALL=C sort` and `localeCompare` order differently.

### The set is closed

Verification walks the scanned directories and fails on a file that is present
and *unlisted*, not only on one that changed — and the walk is unfiltered, so a
file cannot escape by choosing an extension the generator would have skipped.

This is the property that lets a manifest prove an absence, which is the reason
it exists. A laboratory needs to drive the system and force outcomes to exercise
payouts. That capability is the most dangerous thing this software could
contain, so it is built as code that is **absent from the certified build**
rather than disabled within it — and a verifier that only checked the files it
knew about could not demonstrate anything of the kind.

### Forbidden capabilities

Alongside the closed set, the runtime tree is scanned for identifiers that must
not appear in it at all: `forceResult`, `forceOutcome`, `forceDraw`,
`overrideResult`, `rigDraw`, `LAB_MODE`, `TEST_MODE`. A flag called
`allowForcedOutcomes` sitting in production, set to false, is a finding; a build
that cannot name the concept is an argument.

The manifest holds those words as hashes, and `src/manifest.js` never contains
them. That is not obfuscation. The first version listed them in plain text and
the scanner immediately failed on itself, which left a choice between exempting
the scanner from its own rule — an exemption is exactly where a reviewer looks —
and never writing the words down. Hashing takes the exemption away. A hit still
names the token, because the token comes out of the file being scanned rather
than out of the scanner, and a test asserts that `manifest.js` names none of
them.

It is a tripwire, not a proof: it catches a capability somebody added and named,
not one assembled from string fragments. Its value is making the absence
explicit and checkable.

### Two sections, one build id

`runtime` is what executes in production, and its digest **is** the build id.
`evidence` — the test suite and the README — is hashed so a submitted suite is
identifiable, and kept out of the build id so that fixing a typo in this file is
not a new build needing a new certificate. A test asserts both halves of that.

### What it cannot do

The manifest sits next to the code it describes, so whoever can change the code
can regenerate the manifest. The number means something only because the
laboratory and the regulator were told it out of band, and because verification
recomputes it from the files rather than reading it back. Nothing here is a
substitute for signing a release with a key that does not live on the build
machine — that is the next thing to build, and it is not built.

## Custody of the draw seed

The commit-reveal scheme is only worth as much as the custody of the seed
behind it. Publishing a commitment stops the operator choosing a number after
seeing the book. It says nothing about somebody who already knows tomorrow's
number, and nothing about somebody who loses it.

`prepareDraw` answers both. The seed is generated, sealed under a data key with
AES-256-GCM, and the key is split by Shamir's scheme over GF(256) into n shares
of which k reconstruct it. The envelope is stored beside the commitment, because
it is inert without shares. The shares come back once and are never stored
anywhere.

```
POST /operator/draws/prepare   { drawKey, drawAt, shares: 3, threshold: 2 }
  -> { commitment, shares: [ "an1.2.1.…", … ] }        shown once, then gone
POST /operator/draws/:key/reveal  { shares: [ … ] }    any k of them
```

**What this defends against:** read access to the database, a single dishonest
custodian, and losing the seed while any k custodians still hold theirs.

**What it does not:** whoever controls the process at the moment the seed is
generated, because the plaintext is in memory then. That is a deployment and
access-control problem, and pretending otherwise would be the worst thing this
module could do.

The alternative is still there and is the honest other half of the trade: the
console can generate a seed in the browser, show it once, and send only the
commitment — nothing server-side ever sees it, and nothing server-side can
recover it if it is lost. The screen says both of those out loud.

Three details worth the space:

**A one-of-n split is refused.** It would be custody in name only.

**A mistyped share is named.** Each share carries a four-character checksum, so
a custodian reading one off paper months later is told "share 2 is mistyped"
rather than watching the whole process fail at the end. Shares that are
individually well-formed but belong to another envelope are caught by the
authentication tag, which is why the cipher is GCM and not something
unauthenticated that would hand back a plausible wrong seed.

**Custody never becomes something the result is trusted to.** Whatever the
shares produce is checked against the commitment published before betting
opened, inside the write transaction, exactly as a hand-typed seed is. A test
swaps the envelope for one sealing a different seed, presents its shares, and
watches the commitment check refuse it.

## Policy that is posted, not configured

The daily promotional cap used to be a constructor argument. It is now an event
with a name and a date against it:

```
POST /operator/policy/promo-cap   { dailyCapMinor: 50000 }
```

The constructor value survives as a bootstrap for a book that has never had a
policy posted, and `promoCapStatus()` reports `source: 'construction'` when that
is where the number came from — because a constant in a deployment cannot answer
"what was the cap in March, and who set it", and the console should say so
rather than showing a figure that looks like a decision.

Two things follow from making it a policy rather than a constant.

**The cap is read inside the write transaction that issues the ticket**, not
captured when the process started. Lowering it stops the next ticket, not the
next restart.

**Zero is a real value and is not the same as no policy.** A cap of zero halts
issuance dead, which is what you want at 2am when a campaign is misbehaving.
Removing the cap means no limit at all. Spelling those the same way would be a
mistake somebody makes once.

`by` comes from the caller's token and never from the request body — a policy
change with a name against it is worth nothing if the name is one the caller
can choose. The same is now true of the protection limits.

## Hardening the service

Four things the service layer did not do, and now does.

**Tokens expire.** A player's lasts an hour, a runner's and an operator's a
shift, checked against the server clock on every request. Absolute, not sliding:
a sliding expiry means a write per request, and the caller who keeps a stolen
token alive is exactly the attacker. The cost is that a long session ends
mid-task, and the alternative is that a stolen token never ends at all.

**Bodies are capped at 64KB**, enforced twice — in `handle()`, which is what the
tests and any other transport go through, and in the socket adapter, which stops
reading and closes rather than buffering bytes it has already refused.

**Rate limits.** A token bucket per key, refilling continuously rather than
resetting on a window boundary — fixed windows let twice the limit through
across a boundary, which is the failure mode that makes people believe a limiter
is working. Sign-in is the tight one at five a minute and is keyed on *the
account being signed in to*, not on the caller: the attack is a thousand
attempts against one player from a thousand places, and a per-caller key lets
every one of them through. A refused attempt never reaches the PIN check, which
is the scrypt this is defending.

Two honest limits on it: it is per process, so it is a floor rather than a
policy and a real deployment puts one in front; and it is in memory, so a
restart forgives everybody — which is why the PIN lock, which is durable, stays
separate rather than being folded into it.

**An audit log**, as a sink the composition root wires to an append-only JSONL
file. Reads are logged as well as writes: "who looked at this player's wallet"
carries the same regulatory weight as "who moved money", and a log that answers
only the second answers it alone. What is never in it: the body, the response,
the bearer token, a PIN. A token appears as the same short digest its issue
event carries, so a line here joins to a line there without either holding a
working credential. The one response marked `secret` — the call that hands over
custody shares — records that it happened and nothing about what it said.

No CORS header is ever emitted, by omission and on purpose: the credential is a
bearer header rather than a cookie, so there is no cross-site request that can
act as a caller.

## Reporting

`src/reporting.js` answers the questions a business asks of its books, and
answers them from the journal on the way past. Nothing is stored, nothing is
cached, and no report reads a running total — which is the only reason a figure
in a report means the same thing as the entries behind it.

Five reports, each available as JSON or CSV (`?format=csv`):

- **Daily close** — handle, revenue, costs, the movement of real money, and
  what was owed at the end of it.
- **Revenue and hold** — gross gaming revenue and what it was as a share of
  stakes, with a per-draw table underneath.
- **Tax base** — the three numbers a gaming tax could be levied on, side by
  side.
- **Promotions** — cost per campaign, tickets issued and redeemed, what is
  still owed, the jackpot pool.
- **Liabilities** — what is owed, split by whether a player can call it.

Four properties do most of the work.

**Windows are half-open, `[from, to)`.** A day's close and the next day's cannot
both claim the same transaction, and none falls between two reports. The test
that pins this is the one about a transaction stamped at exactly midnight: it
belongs to the day beginning, never the day that ended. Making the window
closed instead passes every other test in the file, which is why that one
exists.

**Balances are as at a moment, not as at now.** Last Tuesday's close shows what
was owed last Tuesday, recomputed from the entries that existed by then. A
report that quietly used today's balances would look right and be wrong, and
nothing on the page would give it away.

**Handle and revenue are different numbers about different bets, and the report
refuses to merge them.** A stake taken today is handle today; it becomes revenue
on the day its draw settles. Usually the same day. Not guaranteed to be, and a
line that added the two would be inviting the mistake on the days it is not.

**Nothing is silently uncategorised.** The real-money section buckets movements
by what caused them, against a list of named causes. A transaction kind the
report has never heard of appears as *unexplained* and fails a check, rather
than disappearing into a subtotal — the same discipline as the `other` bucket in
a runner's statement. Add a transaction type later and the report says so.

### What the tax report is actually for

Decision D6 is open: whether gaming tax is levied on stakes or on gross gaming
revenue. So the report gives all three candidate bases rather than picking one —
all stakes, paid stakes only, and gross gaming revenue — and names the gap.

That gap is the point. Promotional stakes are money the operator never received.
On the trading day in the fixture, a 15% tax on all stakes is L$36.00 of which
L$4.50 falls on tickets nobody paid for; on gross gaming revenue it is nil,
because the operator lost money that day. Three figures that differ by more than
an order of magnitude, from one set of entries, and which one is right is a
question for counsel rather than for this code.

A negative base is taxed at nil, never at a credit. No regime this would be
licensed under pays an operator for a bad night, and printing a negative tax
would be answering the carry-forward question quietly and wrongly.

### The one stored figure, and why it is checked

The journal cannot say which draw a `SETTLE_DRAW` belonged to, so each draw
records its own settlement summary at the moment it settles — stakes, payout,
winners, bet count. That is a fact written once, not a running total, which is
what makes it acceptable at all. The revenue report then checks the draws
settled in a window against the journal's own revenue and payout movements: a
summary that disagrees with the entries fails the check rather than being
believed. A test tampers with a stored summary and watches that happen.

### CSV

A close that only exists in a browser tab is not something an accountant can
work from, and reading figures off a screen to retype them is how they change.
Every report exports as CSV with every field quoted unconditionally — a campaign
id or a note containing a comma must not become two columns.

The console fetches it as an authenticated request and hands the result to the
browser as a file, because the token travels as a header rather than a cookie
and a plain download link therefore cannot carry it.

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
- **Every operator route is closed to a runner holding a valid token.** One
  test enumerates them, because a route that forgets its role is not caught by
  an anonymous call.
- **Every route that moves money refuses to act without an `Idempotency-Key`.**
  Enumerated the same way.
- **The console cannot reach outside its own directory or its own origin.** No
  path resolves out of `src/console/`, and every `src`/`href` on the page is a
  relative path under `/console/`.
- **A report window is half-open at its boundary.** A transaction at exactly
  midnight lands in one day's close and not the other's.
- **A report of a past period does not move when something happens today.**
- **A stored settlement summary that disagrees with the journal fails a check**
  rather than being reported as revenue.
- **Any k of n shares open a sealed draw and any k-1 do not** — every
  three-of-five subset, not a convenient one.
- **A token stops working when its time is up**, and using it does not extend
  it.
- **Sign-in is limited per account**, and exhausting one account's allowance
  does not lock out another.
- **The audit log carries no token, no body and no PIN**, including on the one
  call that hands over custody shares.
- **The build id is reproducible with `sha256sum` and `sort`** — the test runs
  the pipeline and compares.
- **A file that is present and unlisted fails verification**, whatever its
  extension.
- **A change to a test does not change the build id**, and a change to a runtime
  file does.
- **A draw can be made to land on any number and still verifies publicly** —
  the harness needs no hook in the product to do it.
- **Nothing under `lab/` is in the certified build**, and the product serves no
  control route.
- **The seeded laboratory book reconciles** and contains every state a tester
  needs to find.
- **Every selection of a bet type wins the same number of times** — all 720
  6-Way Boxes, not one representative.
- **No bet is priced above its own true odds**, and the odds the player is shown
  are the odds on the math sheet.
- **Rounding never favours the house**, at any stake from 1 to 10,000 minor
  units.
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
- **A dropped USSD session costs nothing.** The flow is abandoned at each of
  its five steps in turn and the journal is unchanged every time; an expired
  session says so and charges nothing; a gateway replaying a whole session
  buys one ticket, not two.
- **The four dispatcher rules hold under attack.** A runner naming another
  runner in the body still spends their own float; a player naming another
  wallet still spends their own; a bet with a valid token but no PIN is
  refused; a body claiming an earlier timestamp is still judged against the
  server clock and rejected after the cutoff; a replayed webhook signature is
  refused once its timestamp is stale. Each was checked by removing the guard
  and watching a test that names it fail.
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

No adapter from a named USSD gateway to the engine. The engine is
transport-agnostic and tested; what is missing is the dozen lines that decode
one provider's request format, which is not worth writing before the provider
is chosen.

The console has no screen for a runner and none for a player — both are served
by other channels.

Reporting stops at the figures. There is no comparison against a previous
period, no trend, and no chart: a day's close says what that day did and leaves
the reader to know whether it was a good one. There is also no scheduled
delivery — a close is run when somebody asks for it, not emailed at midnight —
and no report is signed or sealed, so a CSV is evidence of what the ledger said
when it was exported and nothing stronger.

The HTTP layer is still a reference implementation rather than a deployment. It
has no TLS termination and no way to know a caller's real address behind a
proxy, so the rate limiter keys on the token and on the account rather than on
where a request came from. Both belong in front of the process. There is no
refresh flow either: an expired token means signing in again, which is right for
a player and abrupt for a runner mid-queue.

Custody protects the seed from the database and from a single custodian. It does
not protect it from whoever controls the process at the moment it is generated.

The laboratory environment runs in memory, so a restart is a reset. That is
deliberate for a test bench and means it cannot be used to rehearse a restore
from backup, which a laboratory may also want to see.

There is no real mobile money provider either — only the contract, a simulator
and the gateway. Writing a driver for an actual telco is the remaining work,
and it is the small half.

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
