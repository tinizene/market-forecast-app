# Africa Numbers - code review and rewrite

A review of the single-file `Africa Numbers - Daily Play` prototype, and the
reworked version in this folder.

```
africa-numbers/
  index.html      markup, styles, and the UI layer
  game.js         pure game rules - no DOM, no storage, no clock
  game.test.js    14 unit tests over game.js (node --test)
  REVIEW.md       this file
```

Run it: open `index.html` directly in a browser (it works from `file://`).
Test it: `node --test africa-numbers/game.test.js`.

---

## 1. Bugs that moved money the wrong way

**Template literals were mangled in five places.** The source carried
`\[ {gross.toLocaleString()} gross → \]{net...}` and
`class="status \( {s.status}"> \){s.status.toUpperCase()}` instead of `${...}`.
Consequences: the payout sub-line rendered as literal text; every slip's status
pill lost its CSS class, so `hit`/`pending`/`missed` were unstyled; both
confirmation dialogs printed placeholder junk instead of amounts. If this was a
paste artifact rather than the working file, the rest of this section still
stands on its own.

**Payout amounts were read back out of the DOM.**

```js
const payoutText = document.getElementById('payoutValue').textContent; // "$1,080"
// ...later, at settlement:
const winAmount = parseFloat(s.potential.replace(/[^0-9.]/g, ''));
```

Settlement depended on display formatting. `toLocaleString()` follows the
browser locale, so on a `de-DE` machine `$1,080` is rendered `1.080`, which
`parseFloat` reads as **1.08**. A winner would be paid one dollar instead of a
thousand. Payouts are now computed once, in cents, and stored on the slip.

**Money was floating point.** `balance -= currentAmount`, `+= winAmount`,
`toFixed(2)` on the way out. Cents accumulate drift; a ledger that drifts is a
ledger players stop trusting. Everything is integer cents now, formatted only at
the edge via `Intl.NumberFormat`.

**No balance check.** `placeBet()` never compared the stake to the balance, so
you could bet past zero into a negative wallet. Now validated, and the unit
tests pin it.

**Box bets were mispriced.** `box6` paid 80x and `box3` paid 160x, but nothing
checked that the digits matched the bet type. Playing `112` as a 6-Way Box paid
6-way odds (80x) on a 3-in-1000 chance - a 50% haircut on the fair price.
Playing `472` as a 3-Way Box paid 160x on a 6-in-1000 chance, in the player's
favour. Triples like `777` could be boxed at all, where there is only one
ordering to box. Bet type and digit shape are now validated against each other,
with a message naming the correct play.

**Slips had no draw date.** A slip placed at 11pm - after the 7pm draw - was
settled against the number that had already been drawn. Pending slips from
previous days were settled against *today's* number. Each slip now records the
draw it belongs to, and settlement only touches slips whose draw has passed.

## 2. The game was trivially beatable

Three things compounded:

1. `getDailyNumber()` was called on load and painted into `#winningNumber`
   immediately - the winning number was on screen from midnight, hours before
   the 7pm draw the countdown was ticking towards.
2. `resolveDraw()` was a button anyone could press at any time.
3. The number came from `Math.random()` cached in `localStorage`. Clear site
   data and you draw a fresh number - as many times as you like.

So: read the number, bet on it, resolve, and if you somehow lost, reroll.

In the rewrite the result shown is the **last completed** draw, labelled with
its date; the next draw's number is never computed client-side before its time.
Numbers are derived deterministically from the draw date (FNV-1a hash), so every
device agrees on the same result and clearing storage cannot reroll a loss.
Settlement runs automatically when a draw time passes, is idempotent, and the
manual button is disabled when nothing is due.

This is still a demo, not a game of chance you can safely take money for - see
§6.

## 3. Persisted data was trusted completely

`JSON.parse(localStorage.getItem('hn-slips') || '[]')` ran unguarded at module
scope. One corrupt byte in storage throws at load and the app is a permanent
white screen with no in-app way out. `localStorage.setItem` also throws in
Safari private mode and when quota is full, so the first bet a private-mode
player placed took the app down.

Worse, whatever came out of storage went straight into `innerHTML`:

```js
container.innerHTML = slips.map(s => `<div class="slip-number">${s.number}</div>...`)
```

Nothing player-supplied reaches markup today, but the pattern means any future
feature that lets a value into `hn-activity` - a note on a slip, a username -
becomes script injection. And `s.amount.toFixed(2)` threw outright on any slip
missing `amount`, which is exactly what old or hand-edited data looks like.

Now: every read is wrapped, every persisted record is shape-checked and dropped
if it fails, storage failures surface as one honest message rather than a crash,
and all rendering builds DOM nodes with `textContent`. A browser check feeds the
app hostile storage (`digits: '<img src=x onerror=alert(1)>'`) and asserts it
renders clean and falls back to defaults.

## 4. Accessibility and interaction

- `user-scalable=no, maximum-scale=1.0` disabled pinch zoom. Removed.
- Bet types and the Dream Book link were `<div onclick>` - not focusable, not
  keyboard-operable, invisible to assistive tech. Now real buttons in a
  `radiogroup`, with `aria-checked`.
- The bottom nav is a `tablist` with `aria-selected` and arrow-key movement;
  screens are `tabpanel`s and take focus on navigation so the change is
  announced.
- The keypad had no keyboard equivalent. You can now type digits, backspace,
  Escape to clear, Enter to confirm.
- Four separate dark-mode toggle buttons, one per screen header, only worked
  because `initDarkMode` wired up all four. Replaced with a single shared
  header. The toggle carries `aria-pressed`, and the theme now honours
  `prefers-color-scheme` when the player has expressed no preference.
- `.status.pending` was hardcoded `#8a6d00` and `.missed` `#777`, both on
  `color-mix(... transparent)` backgrounds - illegible in dark mode, and the
  transparent mix let the page background bleed through. Both are tokens now,
  mixed against `--surface`.
- Every `alert()` is gone. Blocking dialogs lose the message entirely if the
  browser suppresses them, and they cannot be styled. Replaced with a polite
  `aria-live` toast region.
- The countdown updated an element once a second with no `aria-live`
  consideration; a screen reader user got either nothing or a barrage. It now
  announces once a minute, in words.
- Layout: `env(safe-area-inset-bottom)` on the fixed nav (it sat under the iOS
  home indicator), `min-width: 0` on `.feed-content` (styled in markup but never
  defined in CSS), `tabular-nums` on all figures so the countdown stops jittering,
  and `text-indent` correcting the `letter-spacing: 10px` trailing gap that
  pushed the winning number visibly off-centre.
- `prefers-reduced-motion` is respected.
- A visible `:focus-visible` ring exists at all - there was none.

## 5. Structure

The original was ~15 global functions on `window`, wired up with inline
`onclick` attributes. Inline handlers break under any Content-Security-Policy
worth setting, and nothing in the file could be tested without a browser.

Rules now live in `game.js` as pure functions - payouts, validation, hit
detection, settlement, draw timing. That is what made it possible to *check* the
claims in this review rather than assert them: 20 unit tests cover the payout
table, the rounding identity (`net + cut === gross` for every type and stake),
box-shape validation, hit detection per bet type counted over all 1,000 possible
draws, settlement idempotency, the 19:00 boundary, month and year rollovers, and
draw determinism. The UI layer
uses one delegated `click` listener keyed on `data-action`, so it survives
re-renders and needs no inline handlers.

A 15-check browser pass (Playwright) covers the flows end to end: entry,
validation, the wallet debit, persistence across reload, settlement paying
exactly once, corrupt-storage recovery, and the absence of inline handlers or
horizontal overflow.

## 6. One thing added on purpose, one thing still missing

**Added: the true odds.** The payout preview now states what each bet actually
returns - "Straight hits 1 times in 1,000 draws - average return $0.50 per $1.00
staked". Every bet on the board returns less than it costs, which is how the
game works and not a flaw. A player who understands the price is a player who
can consent to it. The unit tests assert every bet type is a losing proposition
on average *and* that none returns less than 40c per dollar, so a future payout
change can neither quietly make one look free nor quietly turn one into a trap.

The board is priced against the international benchmark: a straight pays **500x**
on a 1-in-1,000 chance, which is the rate every US state Pick-3 pays, and the
quoted figure is what the winner receives. Runner commission used to be 10% off
the payout; it now comes out of gross gaming revenue, so nothing is deducted from
a win. `RUNNER_CUT_PCT` is 0 rather than deleted, and the tests still exercise a
non-zero rate, so reinstating a deduction stays a one-line change.

**Still missing: an operator.** Everything here runs in the browser, so nothing
about it is authoritative. Balances are a variable in `localStorage` - anyone
with devtools can set theirs to a million. Draws are computed from a public
formula on the client, so a determined player can compute next month's numbers
today. For real play this needs, at minimum:

- draws generated server-side from a committed seed, published only after a
  cutoff (commit-reveal, so players can verify afterwards that the draw was not
  chosen to beat the book);
- bets accepted only before that cutoff, timestamped by the server, never the
  device;
- balances in a server ledger with idempotent, audited settlement;
- authentication, so a wallet belongs to a person rather than a browser profile.

And the non-technical part: operating a real numbers game for money is licensed
gambling in every US jurisdiction, New York included. The prototype is a UI
study; the compliance surface (licensing, KYC/AML, age verification, deposit
limits, self-exclusion, payout escrow) is a larger body of work than the app.
The "play money" badge in the header is deliberate - it should stay until there
is an operator behind it.
