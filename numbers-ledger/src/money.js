'use strict';

const { CONFIG } = require('./config.js');

/**
 * Every amount in this system is an integer number of minor units.
 * Never floats: 0.1 + 0.2 !== 0.3, and a ledger that drifts by a unit is a
 * ledger nobody trusts. Amounts are validated at the boundary so a bad value
 * cannot reach the journal.
 */
function assertAmount(value, label) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer number of minor units, got ${value}`);
  }
  if (value <= 0) {
    throw new RangeError(`${label} must be positive, got ${value}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} exceeds the safe integer range`);
  }
  return value;
}

/** Like assertAmount but allows zero - for fees and commissions that may be nil. */
function assertNonNegative(value, label) {
  if (value === 0) return 0;
  return assertAmount(value, label);
}

function format(minor, currency = CONFIG.currency) {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const divisor = 10 ** currency.minorUnits;
  const whole = Math.floor(abs / divisor);
  const frac = String(abs % divisor).padStart(currency.minorUnits, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${currency.symbol}${grouped}.${frac}`;
}

module.exports = { assertAmount, assertNonNegative, format };
