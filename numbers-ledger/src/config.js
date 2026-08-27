'use strict';

/**
 * Assumptions made explicit, because they are decisions the business has not
 * finally taken (see the Runner Float Architecture design, "Open decisions").
 *
 * D1 - wallet currency. The ledger runs in ONE currency. Cash may arrive as
 * LRD or USD in the field, but a runner's float and a player's wallet are
 * denominated here and nowhere else. Converting cash at the point of top-up is
 * a later layer and deliberately outside this module: mixing two currencies in
 * one ledger turns every reconciliation into an FX argument.
 *
 * D3 - agent commission. Modelled as a discount at the moment a runner BUYS
 * float, plus a handling fee when they pay a winner in cash. Commission is an
 * operator expense, never a deduction from a player's payout.
 */
const CONFIG = {
  currency: { code: 'LRD', minorUnits: 2, symbol: 'L$' }
};

module.exports = { CONFIG };
