# Laboratory environment

A running Africa Numbers system for a tester to drive, with the ability to make
a draw land on a chosen number.

```
npm run lab
```

Two servers start. The **product** on `:8890` is the software a certificate
would name — composed from `src/` exactly as `bin/console-server.js` composes
it, with nothing added and nothing switched on. The **control surface** on
`:8891` is everything else: the fixture book, the credentials, the forced
outcomes, the reset.

## Why two ports

The obvious way to let a laboratory force outcomes is a flag in the draw code.
That flag then exists in production, set to `false`, and "set to `false`" is a
sentence somebody has to trust.

So there is no flag. The product here is byte-identical to the product
elsewhere, and you can confirm it two ways:

- **Read its route table.** `GET /health` and the console are the same routes
  production serves. Nothing is called `/lab`.
- **Check the build manifest.** `npm run verify` lists what is in the certified
  build. Nothing under `lab/` is in it, the runtime tree is scanned for the
  identifiers this directory uses, and a file present in the runtime tree and
  unlisted fails the check. See the main README, *What software is this*.

## How forcing works

There is no back door. The draw result is a deterministic function of the seed,
so the harness generates seeds until one produces the number you asked for —
about a thousand tries, a few milliseconds. Everything after that is completely
ordinary: a real seed, a real commitment published before betting opens, a real
reveal that verifies against it.

`lab/seed-search.js` calls nothing a player could not call.

**A property boundary, stated rather than discovered.** Commit-reveal stops the
operator changing the number *after seeing the book*. It does not stop them
choosing the number *before the book exists*, which is exactly what this
directory does. That is why the commitment must be published before betting
opens: with no bets placed, a chosen number is worth nothing. A commitment
published late is a guarantee that is retrospective, which is to say absent.

## What is in the book

Seeded through the same public operations the product uses, so no fixture can
create a state the product could not have reached on its own.

| | |
| --- | --- |
| Operator | 2,000,000.00 capital, a 5,000.00 daily promotional cap |
| Runners | three, one of them suspended for not reconciling |
| Players | twelve, with wallets, bet history, and one PIN between them |
| Yesterday | a draw opened, revealed, settled — winners on real tickets |
| Promotions | a welcome ticket issued and played, a funded jackpot |
| Today | a draw open for betting, one excluded player, one under a limit |
| In flight | a disbursement the provider never answered |

## Credentials

Printed at startup, and available from `GET /lab/credentials`. Every player
shares the PIN `1234` so nobody has to look one up.

## Control surface

Every call needs the `x-lab-key` header printed at startup.

```
GET  /lab/state          what exists right now
GET  /lab/credentials    tokens, PINs and the webhook secret
POST /lab/force          { "drawKey": "test-1", "result": "417" }
POST /lab/reveal         { "drawKey": "test-1" }
POST /lab/clock          { "seconds": 120 }
POST /lab/reset          throw the book away and seed a fresh one
```

A worked sequence — force a 500× straight win, bet into it, and settle:

```
POST /lab/force   { "drawKey": "win-1", "result": "417" }   # opens, cutoff in 60s
# place a straight bet on 417 through the product, as a player
POST /lab/clock   { "seconds": 120 }                        # past the cutoff and the draw
POST /lab/reveal  { "drawKey": "win-1" }                    # -> 417
# settle from the operator console, and the winner is paid 500x
```

Forcing a draw **opens a new one**. It cannot change a draw that already exists,
because that draw's commitment is published and editing it after the fact is the
one thing the whole design refuses to allow — in a laboratory as much as in
production. Use a fresh key.

**The harness supplies the seed and nothing else.** Whether it is time to reveal
is the product's decision, made against the clock it was given, so a reveal
before the draw time is refused here exactly as it would be in production. Wind
the clock with `/lab/clock` rather than arguing with the rule.

The clock only goes forwards. A system whose clock can go backwards is one where
a bet placed after a cutoff can be made to look as though it was not, and a
tester should have to reach for a fresh book to produce that state rather than
stumbling into it.

That the clock is injectable at all is a production property, not a hook added
for testing: it is how the cutoff is kept off the caller's device. Production
wires it to the wall clock; the harness wires it to something a tester can
move.

## What is deliberately different from production

| | |
| --- | --- |
| Storage | in memory. A restart is a reset, and nothing survives it. |
| Mobile money | simulated. No real money can move, in either direction. |
| Transport | plain HTTP on loopback. No TLS. |
| Outcomes | choosable, through the control surface only. |
| Clock | starts at 09:00 on the fixture's day, runs at wall speed, and can be wound forward. |

Everything else — the guards, the ledger, the cutoff, the PIN policy, the rate
limits, the audit log — is the product, unchanged.

## Resetting

`POST /lab/reset` discards the book and seeds a fresh one at the same day and
result, so a tester who breaks something carries on rather than restarting a
process. New tokens are issued; fetch them from `/lab/credentials`.
