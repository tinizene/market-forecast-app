# Africa Numbers — random number generation

How the winning number is produced, why it cannot be chosen after the bets are
in, and what the evidence for that actually covers.

Every figure below was computed by `npm run rng`. Seeds are derived from a counter
rather than drawn, so a reviewer re-running it gets these numbers and not similar
ones. CI fails if this file is not current.

## 1. What produces the number

One draw, one seed, one published commitment, one deterministic result.

```
seed         32 bytes from crypto.randomBytes, as 64 lowercase hexadecimal characters
commitment   sha256("<drawKey>|<seed>")            published before betting opens
result       HMAC-SHA256(key=seed, "<drawKey>|<counter>")
             read 32-bit big-endian words, reject >= limit, then modulo 1,000
verify       anyone recomputes both from the revealed seed
```

The draw key is inside the commitment, not only the seed. A commitment is
therefore bound to the draw it was published for and cannot be replayed against a
different day. It is inside the HMAC message for the same reason.

## 2. Entropy

Seeds are 256 bits from `crypto.randomBytes`, which is the platform CSPRNG —
OpenSSL, seeded from the operating system (`getrandom(2)` on Linux). On a freshly
booted container that call blocks until the kernel pool is initialised rather than
returning weak bytes, which is the behaviour to want and the reason nothing here
tries to stir in its own entropy.

**What is claimed:** the derivation from a seed to a result is unbiased and
deterministic, and section 5 measures it.

**What is not:** the quality of the operating system's entropy. That is inherited,
not demonstrated. If a laboratory wants it evidenced, the platform is the subject,
not this software.

A 256-bit seed selecting between 1,000 outcomes is an enormous surplus, and
the surplus has a consequence worth stating plainly rather than leaving to be
found: roughly one seed in 1,000 produces any given result, so anybody
generating seeds can search for the number they want in about a thousand tries.
That is exactly what the laboratory harness does, and it is why section 4 matters.

## 3. Scaling without bias

A 32-bit word does not divide evenly into 1,000. Taking the modulo of the whole
range would make the first outcomes very slightly more likely than the rest, so
words at or above the largest multiple of 1,000 below 2³² are discarded and the
next word is read.

```
range              2^32 = 4,294,967,296
accepted below     4,294,967,000   (4,294,967 x 1,000)
discarded values   296
rejection per word 6.89e-8
words per digest   8    (a 32-byte HMAC output)
all eight rejected 5.09e-58  before the counter advances
counter ceiling    1,000   then it throws rather than return a biased number
```

Had the modulo been taken instead, 296 of the 1,000 outcomes would have been
favoured by one part in 4,294,967 — about 2.33e-7 relative. Undetectable in
play, and still a game of chance tilted in a direction nobody chose. The fix is
six lines and it is in the product.

**No sample can check this, and section 5 does not claim to.** A bias of one part
in 4,294,967 is far below what a chi-square over a million draws could see, or a
billion. We found that out by removing the rejection: every statistical test in
this document still passed. So the guard is established exactly instead — the
scaling step is a separate function and a test walks the boundary, asserting that
the last accepted word maps to 999, that all 296 words above the limit are discarded,
and that every outcome has exactly 4,294,967 words behind it.

This is worth a reviewer's attention because it is the general case: a property
that statistics cannot reach has to be argued from the code, and a document that
waves at a p-value instead is hiding the gap rather than closing it.

## 4. What commit-reveal does and does not guarantee

**Guaranteed.** The operator cannot change the number after seeing the book. The
commitment is published before betting opens, the result is a function of the
seed, and a seed that does not hash to the published commitment is refused by the
operator's own code before anyone else has to catch it.

**Not guaranteed.** The operator cannot be stopped from *choosing* the number
before the book exists. Generating seeds until one gives 417 takes a thousand
tries. This is not a defect introduced by the scheme — it is why the timing rule
carries as much weight as the cryptography:

- the commitment is published **before betting opens**, so a chosen number is
  worth nothing: no bets exist to be chosen against;
- a commitment published late makes the guarantee retrospective, which is to say
  absent, and the product refuses to open a draw whose commitment post-dates the
  opening time.

**Custody.** A seed known in advance is a number known in advance, so the seed is
sealed at preparation and opened by any *k* of *n* custodians. See the custody
section of the README: no single person, and no reader of the database, holds it.

## 5. Statistical evidence

All of it tests the **mapping** from a seed to a result. None of it tests the
entropy of a real seed — see section 2.

### 5.0 Every test, on one list

| Test | Statistic | p | p on a second sample |
| --- | --- | ---: | ---: |
| Uniformity over all outcomes | chi-square 995.00 on 999 df | 0.5298 | 0.8841 |
| Digit position 1 | chi-square 16.36 on 9 df | 0.0598 | 0.6879 |
| Digit position 2 | chi-square 11.04 on 9 df | 0.2731 | 0.8226 |
| Digit position 3 | chi-square 8.55 on 9 df | 0.4802 | 0.5673 |
| Consecutive pairs | chi-square 88.19 on 99 df | 0.7735 | 0.4649 |
| Serial correlation | r = -1.15e-3 | 0.2503 | 0.4145 |
| One bit of the seed changed | 183 agreed, 200 expected | 0.2291 | 1.0000 |
| Same seed, different draw key | 198 agreed, 200 expected | 0.8875 | 0.6351 |

Reporting several tests and presenting only the comfortable ones is the oldest way
to make a generator look good, so the list is complete and in a fixed order.

**Every test is run twice**, over independent sets of derived seeds. With
8 tests there is roughly a 34% chance that something lands below 0.05 on an
entirely honest generator, and a replication is a better answer to that than an
argument about multiple comparisons. A reading low in one column and healthy in
the other is noise, visibly. A reading low in both is a finding.

Nothing came back below 0.05 in the first column.

### 5.1 Uniformity over 1,000,000 draws

```
expected per outcome  1,000
observed range        886 to 1095
outcomes never seen   0
chi-square            995.00 on 999 degrees of freedom
p (upper tail)        0.5298
p (two-sided)         0.9405
```

### 5.2 Each digit position on its own

| Position | Chi-square (df 9) | p (upper) |
| --- | ---: | ---: |
| 1 | 16.36 | 0.0598 |
| 2 | 11.04 | 0.2731 |
| 3 | 8.55 | 0.4802 |

A result can be uniform overall while a single position is not, which would show
up as a readable pattern long before the aggregate moved.

### 5.3 Does one draw say anything about the next

```
consecutive pairs     999,999
chi-square (10 x 10)  88.19 on 99 degrees of freedom
p (upper tail)        0.7735
serial correlation    r = -1.150e-3, standard error 1.00e-3
                      z = -1.150, p = 0.2503
```

### 5.4 One bit of the seed changed

```
pairs tested          200,000
results that agreed   183   (expected 200, being 1 in 1,000)
z                     -1.203
p                     0.2291
```

A near-miss on the seed must not be a near-miss on the number. If a leaked
fragment of a seed narrowed the outcome, the custody scheme would be protecting
something that no longer needed protecting.

### 5.5 The same seed under two different draw keys

```
pairs tested          200,000
results that agreed   198   (expected 200)
z                     -0.141
p                     0.8875
```

A seed revealed for Monday must say nothing about Tuesday, or publishing one
result would leak the next.

## 6. Operating rules

- **One seed per draw.** Never reused, never derived from a previous seed.
- **Commit before opening.** The product refuses a draw whose commitment is later
  than its opening time.
- **Reveal after the draw time**, on the server clock, and never on a clock a
  caller supplies.
- **A cancelled draw keeps its commitment.** Publish the seed anyway, so the
  record shows what would have been drawn and the cancellation cannot hide it.
- **The seed of an unrevealed draw exists only inside the sealed envelope.**

## 7. What a reviewer should attack

1. **Take a revealed draw and recompute it.** The commitment, the HMAC, the
   rejection, the modulo. Everything needed is public after the reveal.
2. **Try to reveal a different seed.** The commitment check refuses it, inside the
   write transaction, before any payout is computed.
3. **Check the commitment timestamp against the opening time** on every draw in the
   journal. That ordering is the whole guarantee, and it is the thing worth
   auditing rather than the hash function.
4. **Run your own suite.** Section 5 is diligence, not a substitute. The mapping is
   deterministic, so you can generate as many results as you need from seeds of
   your own choosing.

_Generated by `npm run rng` from the draw module. Do not edit by hand._
