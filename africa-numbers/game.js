/**
 * Africa Numbers - pure game logic.
 *
 * Nothing in this file touches the DOM, localStorage, or the clock. Every
 * function is a pure function of its arguments, which is what makes the rules
 * (payouts, bet validity, hit detection, settlement) unit-testable without a
 * browser. See game.test.js - run it with `node --test africa-numbers/game.test.js`.
 * (Passing the directory does not work: node resolves it as a module path.)
 *
 * All money is handled in integer cents. Never floats: 0.1 + 0.2 !== 0.3, and
 * a betting ledger that drifts by a cent is a ledger nobody trusts.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.HNGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** The runner's cut, in percent, taken off the gross payout. */
  var RUNNER_CUT_PCT = 10;

  /** Draw time, local to the player's device. */
  var DRAW_HOUR = 19;
  var DRAW_MINUTE = 0;

  /**
   * Payout multipliers are per dollar staked, before the runner's cut.
   * `digits` is how many digits the bet needs - the UI uses it to size the
   * keypad entry, and validation enforces it.
   */
  var BET_TYPES = {
    straight:  { label: 'Straight',   digits: 3, multiplier: 600, hint: 'Exact order' },
    box6:      { label: '6-Way Box',  digits: 3, multiplier: 80,  hint: 'Any order - three different digits' },
    box3:      { label: '3-Way Box',  digits: 3, multiplier: 160, hint: 'Any order - one digit repeated' },
    front:     { label: 'Front Pair', digits: 2, multiplier: 50,  hint: 'First two digits, in order' },
    // The two high-frequency bets. They exist because a player who never wins
    // stops playing, and every bet above hits at most 1% of the time: a daily
    // player betting only straights has a 0.7% chance of a single win in a
    // week. One Digit hits 27.1% of draws, so that becomes 89%.
    //
    // The multipliers are set so the average return matches the rest of the
    // board rather than undercutting it - 2.2x at 27.1% returns the same 54c
    // per dollar as the 600x straight. Frequency is bought by lowering the
    // prize, not by widening the margin. A version paying 1x (a stake refund)
    // would return 5c per dollar: a trap wearing the same badge as the others.
    oneDigit:  { label: 'One Digit',  digits: 1, multiplier: 2.2, hint: 'Your digit anywhere in the number' },
    twoDigits: { label: 'Two Digits', digits: 2, multiplier: 10,  hint: 'Both digits anywhere - any order' }
  };

  var DIGITS_RE = /^[0-9]+$/;

  // ---------------------------------------------------------------- helpers

  function isDigitString(value, length) {
    return typeof value === 'string' && value.length === length && DIGITS_RE.test(value);
  }

  /** 'distinct' (472), 'pair' (112), or 'triple' (777). */
  function digitShape(digits) {
    var unique = new Set(String(digits).split('')).size;
    if (unique === 3) return 'distinct';
    if (unique === 2) return 'pair';
    return 'triple';
  }

  function sortDigits(digits) {
    return String(digits).split('').sort().join('');
  }

  /** How many distinct orderings a boxed number covers. */
  function boxCombinations(digits) {
    var shape = digitShape(digits);
    if (shape === 'distinct') return 6;
    if (shape === 'pair') return 3;
    return 1;
  }

  // ---------------------------------------------------------------- payouts

  function grossPayoutCents(type, stakeCents) {
    var spec = BET_TYPES[type];
    if (!spec) throw new Error('Unknown bet type: ' + type);
    // Rounded because One Digit pays 2.2x: a 7c stake would otherwise owe
    // 15.4c and put a fraction of a cent into the ledger. Every whole-number
    // multiplier is unaffected, and the half-cent rounds towards the player.
    return Math.round(stakeCents * spec.multiplier);
  }

  function netPayoutCents(grossCents, cutPct) {
    var cut = cutPct === undefined ? RUNNER_CUT_PCT : cutPct;
    // Round the cut, not the payout, so the house never rounds in its own
    // favour twice: net + cut always adds back up to gross.
    var cutCents = Math.round(grossCents * cut / 100);
    return grossCents - cutCents;
  }

  /** Everything the payout preview needs, in one call. */
  function quote(type, stakeCents, cutPct) {
    var gross = grossPayoutCents(type, stakeCents);
    var net = netPayoutCents(gross, cutPct);
    return { grossCents: gross, netCents: net, cutCents: gross - net };
  }

  // ------------------------------------------------------------- validation

  /**
   * @returns {{ok: boolean, code?: string, message?: string}}
   * Codes are stable so the UI can decide where to put the message; the
   * message is the copy shown to the player.
   */
  function validateBet(bet) {
    var spec = BET_TYPES[bet.type];
    if (!spec) return { ok: false, code: 'bad-type', message: 'Pick a bet type.' };

    if (!isDigitString(bet.digits, spec.digits)) {
      return {
        ok: false,
        code: 'digits',
        message: spec.digits === 3
          ? 'Enter a full 3-digit number.'
          : spec.label + ' needs ' + spec.digits + (spec.digits === 1 ? ' digit.' : ' digits.')
      };
    }

    // A box bet only makes sense for the combination count it pays for.
    // Playing 112 as a 6-Way pays 6-way odds on a 3-way chance - the classic
    // way a numbers app quietly overcharges its players.
    if (bet.type === 'box6' || bet.type === 'box3') {
      var combos = boxCombinations(bet.digits);
      if (combos === 1) {
        return { ok: false, code: 'box-triple', message: 'A triple like ' + bet.digits + ' can only be played straight.' };
      }
      if (bet.type === 'box6' && combos !== 6) {
        return { ok: false, code: 'box-mismatch', message: bet.digits + ' has a repeated digit - play it as a 3-Way Box.' };
      }
      if (bet.type === 'box3' && combos !== 3) {
        return { ok: false, code: 'box-mismatch', message: bet.digits + ' has three different digits - play it as a 6-Way Box.' };
      }
    }

    // The mirror of the box check, and this one protects the house. Two
    // Digits is priced for two DIFFERENT digits appearing (54 draws in 1,000).
    // Played as 4 and 4 it becomes 'a 4 anywhere' - 271 in 1,000 - and 10x on
    // those odds pays out 2.44x the stake on average. One unvalidated field is
    // the difference between a 49% return and a bet that bankrupts the draw.
    if (bet.type === 'twoDigits' && bet.digits[0] === bet.digits[1]) {
      return { ok: false, code: 'two-same', message: 'Pick two different digits - one digit repeated is the One Digit bet.' };
    }

    if (!Number.isInteger(bet.stakeCents) || bet.stakeCents <= 0) {
      return { ok: false, code: 'stake', message: 'Pick a stake.' };
    }

    if (bet.stakeCents > bet.balanceCents) {
      return { ok: false, code: 'funds', message: 'Not enough in your wallet for that stake.' };
    }

    return { ok: true };
  }

  // ------------------------------------------------------------- settlement

  /**
   * Display form of a selection: '472' straight/box, '47X' front pair,
   * '4+7' Two Digits (the + reads as 'and', not as a position).
   */
  function formatSelection(type, digits) {
    if (type === 'front') return digits + 'X';
    if (type === 'twoDigits') return digits[0] + '+' + digits[1];
    return digits;
  }

  /**
   * @param {{type: string, digits: string}} slip
   * @param {string} winning three-digit draw result
   */
  function isHit(slip, winning) {
    if (!isDigitString(winning, 3)) return false;
    switch (slip.type) {
      case 'straight': return slip.digits === winning;
      case 'front':    return slip.digits === winning.slice(0, 2);
      // A box covers every ordering, the straight ordering included.
      case 'box6':
      case 'box3':     return sortDigits(slip.digits) === sortDigits(winning);
      // Position-free: the digit only has to be somewhere in the result.
      case 'oneDigit':  return winning.indexOf(slip.digits) !== -1;
      case 'twoDigits': return winning.indexOf(slip.digits[0]) !== -1 &&
                               winning.indexOf(slip.digits[1]) !== -1;
      default:         return false;
    }
  }

  /**
   * Settle every pending slip whose draw has already happened.
   * Returns a new array - slips are never mutated in place, so a failed save
   * can't leave the ledger half-settled.
   *
   * @param {Array} slips
   * @param {string} cutoffKey draw key of the most recent completed draw
   * @param {(key: string) => string} numberFor resolves a draw key to its result
   */
  function settle(slips, cutoffKey, numberFor) {
    var hits = 0;
    var wonCents = 0;
    var settledCount = 0;

    var next = slips.map(function (slip) {
      if (slip.status !== 'pending' || slip.drawKey > cutoffKey) return slip;

      var winning = numberFor(slip.drawKey);
      if (!isDigitString(winning, 3)) return slip;

      settledCount++;
      if (isHit(slip, winning)) {
        hits++;
        wonCents += slip.netPayoutCents;
        return Object.assign({}, slip, { status: 'hit', winning: winning });
      }
      return Object.assign({}, slip, { status: 'missed', winning: winning });
    });

    return { slips: next, hits: hits, wonCents: wonCents, settledCount: settledCount };
  }

  // ------------------------------------------------------------------ draws

  /** Local calendar day, 'YYYY-MM-DD'. Lexicographic order == chronological. */
  function drawKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /** The next draw at or after `now` (strictly after, if now is draw time). */
  function nextDrawTime(now, hour, minute) {
    var t = new Date(now.getTime());
    t.setHours(hour === undefined ? DRAW_HOUR : hour, minute === undefined ? DRAW_MINUTE : minute, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t;
  }

  /** The most recent draw that has already happened. */
  function lastDrawTime(now, hour, minute) {
    var t = new Date(now.getTime());
    t.setHours(hour === undefined ? DRAW_HOUR : hour, minute === undefined ? DRAW_MINUTE : minute, 0, 0);
    if (t > now) t.setDate(t.getDate() - 1);
    return t;
  }

  /**
   * The draw result for a given day.
   *
   * Deterministic from the date, not Math.random(): every device shows the same
   * number for the same day, and a player can't reroll a losing draw by
   * clearing localStorage. It is still client-side and therefore predictable -
   * a real draw must be signed and served by the operator. See REVIEW.md.
   *
   * The default salt is part of the result, not decoration: changing it
   * changes the number drawn on every past and future date. It moved with the
   * rename from the old brand, which is safe only because this is play money
   * with nothing settled against it. Once real draws run it is frozen.
   */
  function numberForDraw(key, salt) {
    var input = String(key) + '|' + (salt === undefined ? 'africa-numbers' : salt);
    var hash = 0x811c9dc5; // FNV-1a 32-bit
    for (var i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return String(hash % 1000).padStart(3, '0');
  }


  // ------------------------------------------------------------------- odds

  /**
   * Winning combinations out of the 1,000 possible three-digit results.
   * Validation guarantees a box bet's digit shape matches its type, so the
   * count is a property of the type alone.
   */
  var WIN_COMBINATIONS = {
    straight: 1, box6: 6, box3: 3, front: 10,
    // 1,000 - 9^3: every result that is missing the chosen digit entirely.
    oneDigit: 271,
    // Inclusion-exclusion on two distinct digits: 1,000 - 9^3 - 9^3 + 8^3.
    // Validation guarantees the digits differ, which is what makes 54 correct.
    twoDigits: 54
  };

  function winChance(type) {
    var wins = WIN_COMBINATIONS[type];
    if (!wins) throw new Error('Unknown bet type: ' + type);
    return { wins: wins, outOf: 1000, oneIn: 1000 / wins };
  }

  /**
   * Average return per bet, in cents - what the stake is actually worth.
   * Every bet on the board returns less than it costs; showing the number is
   * more honest than hiding it behind a big payout figure.
   */
  function expectedReturnCents(type, stakeCents, cutPct) {
    var chance = winChance(type);
    return Math.round(quote(type, stakeCents, cutPct).netCents * chance.wins / chance.outOf);
  }

  return {
    RUNNER_CUT_PCT: RUNNER_CUT_PCT,
    DRAW_HOUR: DRAW_HOUR,
    DRAW_MINUTE: DRAW_MINUTE,
    BET_TYPES: BET_TYPES,
    digitShape: digitShape,
    boxCombinations: boxCombinations,
    grossPayoutCents: grossPayoutCents,
    netPayoutCents: netPayoutCents,
    quote: quote,
    validateBet: validateBet,
    formatSelection: formatSelection,
    isHit: isHit,
    settle: settle,
    drawKey: drawKey,
    nextDrawTime: nextDrawTime,
    lastDrawTime: lastDrawTime,
    numberForDraw: numberForDraw,
    winChance: winChance,
    expectedReturnCents: expectedReturnCents
  };
});
