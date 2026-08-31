/* eslint-env browser, node */
(function (root, factory) {
  'use strict';
  // Loadable in both places on purpose: the browser gets it with a <script>
  // tag, and the test suite gets it with require(), so the parts of the
  // console that can be wrong about money are under test even though the DOM
  // around them is not.
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ANConsole = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * The console's pure half.
   *
   * Nothing here touches the network or the document. What is here is
   * everything that could quietly be wrong: turning what a person typed into
   * an integer number of minor units, turning an integer back into something
   * readable, deciding whether the book is healthy, and holding an
   * idempotency key steady across a retry.
   */

  // ------------------------------------------------------------------ money

  /**
   * Format minor units.
   *
   * This is a second implementation of `format()` in src/money.js - the server
   * cannot hand this one down, because the console must format numbers it
   * computes locally and a browser cannot require() a CommonJS module. Two
   * implementations of the same rule drift, so a test asserts these two agree
   * across a range of values including negatives and boundaries. If you change
   * one, that test will tell you about the other.
   */
  function formatMinor(minor, currency) {
    var c = currency || { symbol: '', minorUnits: 2 };
    var sign = minor < 0 ? '-' : '';
    var abs = Math.abs(minor);
    var divisor = Math.pow(10, c.minorUnits);
    var whole = Math.floor(abs / divisor);
    var frac = String(abs % divisor);
    while (frac.length < c.minorUnits) frac = '0' + frac;
    var grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + (c.symbol || '') + grouped + '.' + frac;
  }

  /**
   * Turn typed text into an integer number of minor units.
   *
   * Deliberately strict, and deliberately not `Math.round(Number(x) * 100)`:
   * that reaches the wrong integer for values a person will actually type
   * (8.115 * 100 is 811.4999999999999), and a console that silently rounds a
   * stake is a console that silently changes an amount of money. Anything not
   * exactly representable is refused and the operator retypes it.
   *
   * @returns {{ok: true, minor: number}|{ok: false, message: string}}
   */
  function toMinor(text, currency) {
    var units = (currency || {}).minorUnits;
    if (units === undefined) units = 2;
    var raw = String(text === null || text === undefined ? '' : text).trim().replace(/,/g, '');
    if (raw === '') return { ok: false, message: 'Enter an amount.' };

    var match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw);
    if (!match) return { ok: false, message: 'Amounts are digits, with at most one decimal point.' };
    if (match[1] === '-') return { ok: false, message: 'Amounts cannot be negative.' };

    var frac = match[3] || '';
    if (frac.length > units) {
      return { ok: false, message: 'At most ' + units + ' decimal place' + (units === 1 ? '' : 's') + '.' };
    }
    while (frac.length < units) frac = frac + '0';

    // String concatenation rather than arithmetic: no float ever exists.
    var minor = Number(match[2] + frac);
    if (!Number.isSafeInteger(minor)) return { ok: false, message: 'That amount is too large.' };
    return { ok: true, minor: minor };
  }

  // ------------------------------------------------------------- idempotency

  /**
   * One key per attempted action, held until that action succeeds.
   *
   * The point is the retry. If a request times out, the operator does not know
   * whether the money moved, and pressing the button again with a fresh key
   * would move it twice. Reusing the key makes the second press a no-op if the
   * first one landed, and the real thing if it did not - which is exactly what
   * the ledger's idempotency is for. The key is released only on a definite
   * answer from the server, success or refusal.
   */
  function KeyHolder(random) {
    this.random = random || function () {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    };
    this.keys = {};
  }

  KeyHolder.prototype.keyFor = function (action) {
    if (!this.keys[action]) this.keys[action] = action + '-' + this.random();
    return this.keys[action];
  };

  /** The server answered - this attempt is over, whatever it said. */
  KeyHolder.prototype.settled = function (action) {
    delete this.keys[action];
  };

  // ------------------------------------------------------------------ health

  /**
   * The four checks that decide whether the book can be believed, in the order
   * of how bad it is when one fails. Every row is derived from the server's
   * own numbers rather than a status flag it sent, so the console cannot show
   * a green light the ledger did not earn.
   */
  function healthOf(overview) {
    var solvency = overview.solvency || {};
    var equation = overview.equation || {};
    var trial = overview.trialBalance || {};
    var drift = overview.drift || [];

    return [
      {
        key: 'solvency',
        label: 'Settlement covers callable liabilities',
        ok: solvency.ok === true,
        detail: 'headroom ' + formatMinor(solvency.headroom || 0, overview.currency),
        severity: 'stop-selling-float'
      },
      {
        key: 'drift',
        label: 'Cached balances match the entries',
        ok: drift.length === 0,
        detail: drift.length === 0 ? 'no drift' : drift.length + ' account(s) drifted',
        severity: 'do-not-trust-any-figure-here'
      },
      {
        key: 'trial',
        label: 'Debits equal credits',
        ok: trial.balanced === true,
        detail: formatMinor(trial.debits || 0, overview.currency) + ' / ' +
          formatMinor(trial.credits || 0, overview.currency),
        severity: 'a-transaction-is-malformed'
      },
      {
        key: 'equation',
        label: 'Assets = liabilities + equity + revenue - expenses',
        ok: equation.holds === true,
        detail: formatMinor(equation.left || 0, overview.currency) + ' / ' +
          formatMinor(equation.right || 0, overview.currency),
        severity: 'an-account-class-is-wrong'
      }
    ];
  }

  /** True when nothing above is red. Used for one badge, not for a decision. */
  function healthy(overview) {
    return healthOf(overview).every(function (row) { return row.ok; });
  }

  // ------------------------------------------------------------------ errors

  /**
   * What to show a person when a call fails.
   *
   * A 409 carries a guard's own message, which was written for whoever is
   * reading it - so it is passed straight through. A 500 never is: it means
   * something unexpected, and the server deliberately does not say what.
   */
  function describeError(status, body) {
    var message = body && body.error ? String(body.error) : '';
    if (status === 401) return 'That token is not accepted. Sign in again.';
    if (status === 403) return message || 'Not permitted.';
    if (status === 404) return message || 'Not found.';
    if (status === 409) return message || 'Refused.';
    if (status === 503) return message || 'That part of the service is not configured.';
    if (status >= 500) return 'The server refused this and did not say why. Check its log.';
    return message || ('Request failed (' + status + ').');
  }

  // ------------------------------------------------------------------- draws

  var HEX64 = /^[0-9a-f]{64}$/;

  function isHex64(value) {
    return typeof value === 'string' && HEX64.test(value);
  }

  /**
   * Whether a draw can be revealed yet, and if not, why.
   *
   * The server enforces this - the console asks only so that the button can be
   * disabled with a reason rather than offering an action that will be refused.
   */
  function revealState(draw, nowIso) {
    if (!draw) return { can: false, why: 'No such draw.' };
    if (draw.result) return { can: false, why: 'Already revealed: ' + draw.result };
    if (Date.parse(nowIso) < Date.parse(draw.drawAt)) {
      return { can: false, why: 'Not until ' + draw.drawAt };
    }
    return { can: true, why: 'Paste the seed committed for this draw.' };
  }

  function settleState(draw) {
    if (!draw) return { can: false, why: 'No such draw.' };
    if (draw.settled) return { can: false, why: 'Already settled.' };
    if (!draw.result) return { can: false, why: 'Reveal the seed first.' };
    if (!draw.bets) return { can: false, why: 'No bets to settle.' };
    return { can: true, why: draw.bets + ' bet(s) waiting.' };
  }

  return {
    formatMinor: formatMinor,
    toMinor: toMinor,
    KeyHolder: KeyHolder,
    healthOf: healthOf,
    healthy: healthy,
    describeError: describeError,
    isHex64: isHex64,
    revealState: revealState,
    settleState: settleState
  };
}));
