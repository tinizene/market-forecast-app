'use strict';

const { Ledger } = require('./ledger.js');
const { assertAmount, assertNonNegative, format } = require('./money.js');
const { accountId } = require('./accounts.js');

/**
 * The operator's book: the ledger plus the small amount of state that is not
 * itself a balance - which vouchers exist, which bets belong to which draw.
 *
 * Every operation here is a guard plus one atomic transaction. The guards are
 * the product: a runner cannot sell float they have not bought, a player
 * cannot stake money they do not have, and a draw cannot pay twice.
 *
 * No operation reads the clock. Callers pass `at`, so a test can run a whole
 * trading day in milliseconds and settlement is never at the mercy of a device
 * clock - the same reason the design puts the cutoff on the server.
 */
class Operator {
  constructor(options = {}) {
    this.ledger = new Ledger(options);
    this.vouchers = new Map(); // voucherId -> { agentId, amountMinor, redeemedBy }
    this.bets = new Map();     // betId -> { playerId, drawKey, stakeMinor, settled }
    this.draws = new Map();    // drawKey -> Set(betId)
  }

  // ---------------------------------------------------------------- helpers

  #floatOf(agentId) {
    return this.ledger.balance(accountId('AGENT_FLOAT', agentId));
  }

  #walletOf(playerId) {
    return this.ledger.balance(accountId('PLAYER_WALLET', playerId));
  }

  #settlement() {
    return this.ledger.balance('SETTLEMENT');
  }

  #require(condition, message) {
    if (!condition) throw new Error(message);
  }

  // ------------------------------------------------------------ T0: capital

  /**
   * The operator puts its own money in. This has to happen before any float is
   * sold at a discount, because the discount is value issued against money
   * never received.
   */
  injectCapital({ id, at, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    return this.ledger.post({
      id, kind: 'CAPITAL_INJECTION', at, memo,
      entries: [
        { account: 'SETTLEMENT', debit: amountMinor },
        { account: 'OPERATOR_CAPITAL', credit: amountMinor }
      ]
    });
  }

  // ----------------------------------------------------------- T1: buy float

  /**
   * A runner pays real money and receives electronic float. Commission is the
   * difference between the float granted and the money paid - the runner's
   * margin, fixed at the moment they take the risk.
   */
  buyFloat({ id, at, agentId, paidMinor, floatMinor, memo }) {
    assertAmount(paidMinor, 'paidMinor');
    assertAmount(floatMinor, 'floatMinor');
    const commission = floatMinor - paidMinor;
    this.#require(commission >= 0, `Float granted (${format(floatMinor)}) cannot exceed money paid plus zero commission`);

    const entries = [{ account: 'SETTLEMENT', debit: paidMinor }];
    if (commission > 0) entries.push({ account: 'AGENT_COMMISSION', debit: commission });
    entries.push({ account: accountId('AGENT_FLOAT', agentId), credit: floatMinor });

    return this.ledger.post({ id, kind: 'BUY_FLOAT', at, memo, entries });
  }

  // ------------------------------------------------------------- T2: cash in

  /**
   * A player hands a runner cash; the runner pushes an equal amount of e-value.
   * The cash itself never appears here - it is between those two people, and
   * the operator was already paid for this float in T1. That is the whole
   * design in two ledger lines.
   */
  cashIn({ id, at, agentId, playerId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    const available = this.#floatOf(agentId);
    this.#require(
      available >= amountMinor,
      `Agent ${agentId} has ${format(available)} float, cannot sell ${format(amountMinor)}`
    );

    return this.ledger.post({
      id, kind: 'CASH_IN', at, memo,
      entries: [
        { account: accountId('AGENT_FLOAT', agentId), debit: amountMinor },
        { account: accountId('PLAYER_WALLET', playerId), credit: amountMinor }
      ]
    });
  }

  // ------------------------------------------------------------ T3: vouchers

  /** A runner buys voucher inventory with float. Sold offline, activated later. */
  issueVoucher({ id, at, agentId, voucherId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    this.#require(!this.vouchers.has(voucherId), `Voucher ${voucherId} already exists`);
    const available = this.#floatOf(agentId);
    this.#require(available >= amountMinor, `Agent ${agentId} has ${format(available)} float, cannot buy ${format(amountMinor)} of vouchers`);

    const result = this.ledger.post({
      id, kind: 'ISSUE_VOUCHER', at, memo,
      entries: [
        { account: accountId('AGENT_FLOAT', agentId), debit: amountMinor },
        { account: 'UNREDEEMED_VOUCHERS', credit: amountMinor }
      ]
    });
    if (result.posted) this.vouchers.set(voucherId, { agentId, amountMinor, redeemedBy: null });
    return result;
  }

  /** The player activates the code. Single use, checked here and enforced atomically. */
  redeemVoucher({ id, at, voucherId, playerId, memo }) {
    const voucher = this.vouchers.get(voucherId);
    this.#require(voucher, `Unknown voucher ${voucherId}`);
    this.#require(voucher.redeemedBy === null, `Voucher ${voucherId} was already redeemed by ${voucher.redeemedBy}`);

    const result = this.ledger.post({
      id, kind: 'REDEEM_VOUCHER', at, memo,
      entries: [
        { account: 'UNREDEEMED_VOUCHERS', debit: voucher.amountMinor },
        { account: accountId('PLAYER_WALLET', playerId), credit: voucher.amountMinor }
      ]
    });
    if (result.posted) voucher.redeemedBy = playerId;
    return result;
  }

  // ----------------------------------------------------------- T4: place bet

  /**
   * The stake leaves the wallet but is not revenue yet - it is money held
   * against an unresolved obligation until the draw runs.
   */
  placeBet({ id, at, betId, playerId, drawKey, stakeMinor, memo }) {
    assertAmount(stakeMinor, 'stakeMinor');
    this.#require(!this.bets.has(betId), `Bet ${betId} already exists`);
    const wallet = this.#walletOf(playerId);
    this.#require(wallet >= stakeMinor, `Player ${playerId} has ${format(wallet)}, cannot stake ${format(stakeMinor)}`);

    const result = this.ledger.post({
      id, kind: 'PLACE_BET', at, memo,
      entries: [
        { account: accountId('PLAYER_WALLET', playerId), debit: stakeMinor },
        { account: 'UNSETTLED_STAKES', credit: stakeMinor }
      ]
    });

    if (result.posted) {
      this.bets.set(betId, { playerId, drawKey, stakeMinor, settled: false });
      if (!this.draws.has(drawKey)) this.draws.set(drawKey, new Set());
      this.draws.get(drawKey).add(betId);
    }
    return result;
  }

  // --------------------------------------------------------- T5: settle draw

  /**
   * One atomic transaction for the whole draw: recognise every stake as
   * revenue, and credit every winner. Settling in one posting is what makes a
   * partially-settled draw impossible.
   *
   * @param {Array<{betId: string, payoutMinor: number}>} winners
   */
  settleDraw({ id, at, drawKey, winners = [], memo }) {
    const betIds = this.draws.get(drawKey);
    this.#require(betIds && betIds.size > 0, `No bets recorded for draw ${drawKey}`);

    const unsettled = [...betIds].filter((b) => !this.bets.get(b).settled);
    this.#require(unsettled.length > 0, `Draw ${drawKey} is already settled`);

    let totalStakes = 0;
    for (const betId of unsettled) totalStakes += this.bets.get(betId).stakeMinor;

    const entries = [
      { account: 'UNSETTLED_STAKES', debit: totalStakes },
      { account: 'STAKES_REVENUE', credit: totalStakes }
    ];

    let totalPayout = 0;
    for (const winner of winners) {
      const bet = this.bets.get(winner.betId);
      this.#require(bet, `Unknown bet ${winner.betId}`);
      this.#require(bet.drawKey === drawKey, `Bet ${winner.betId} belongs to draw ${bet.drawKey}, not ${drawKey}`);
      this.#require(!bet.settled, `Bet ${winner.betId} is already settled`);
      const payout = assertAmount(winner.payoutMinor, 'payoutMinor');
      totalPayout += payout;
      entries.push({ account: 'PRIZE_PAYOUTS', debit: payout });
      entries.push({ account: accountId('PLAYER_WALLET', bet.playerId), credit: payout });
    }

    const result = this.ledger.post({ id, kind: 'SETTLE_DRAW', at, memo, entries });
    if (result.posted) {
      for (const betId of unsettled) this.bets.get(betId).settled = true;
    }
    return { ...result, totalStakes, totalPayout, betsSettled: unsettled.length };
  }

  // ------------------------------------------------- T6: withdraw to mobile money

  /**
   * The only path where real money leaves the operator. The transfer fee is an
   * operator cost, not a deduction from the player - they asked for an amount
   * and that is what arrives.
   */
  withdrawToMobileMoney({ id, at, playerId, amountMinor, feeMinor = 0, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    assertNonNegative(feeMinor, 'feeMinor');
    const wallet = this.#walletOf(playerId);
    this.#require(wallet >= amountMinor, `Player ${playerId} has ${format(wallet)}, cannot withdraw ${format(amountMinor)}`);
    const funds = this.#settlement();
    this.#require(funds >= amountMinor + feeMinor, `Settlement funds ${format(funds)} cannot cover ${format(amountMinor + feeMinor)}`);

    const entries = [{ account: accountId('PLAYER_WALLET', playerId), debit: amountMinor }];
    if (feeMinor > 0) entries.push({ account: 'TRANSACTION_FEES', debit: feeMinor });
    entries.push({ account: 'SETTLEMENT', credit: amountMinor + feeMinor });

    return this.ledger.post({ id, kind: 'WITHDRAW_MOBILE_MONEY', at, memo, entries });
  }

  // --------------------------------------------------------- T7: cash payout

  /**
   * The mirror of cash-in: the runner pays the winner from their own pocket
   * and is repaid in float, plus a handling fee. Still no operator cash moves,
   * which is exactly why cash payouts have to be capped - the constraint is
   * the runner's liquidity, not the operator's.
   */
  cashPayout({ id, at, agentId, playerId, amountMinor, commissionMinor = 0, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    assertNonNegative(commissionMinor, 'commissionMinor');
    const wallet = this.#walletOf(playerId);
    this.#require(wallet >= amountMinor, `Player ${playerId} has ${format(wallet)}, cannot be paid ${format(amountMinor)}`);

    const entries = [{ account: accountId('PLAYER_WALLET', playerId), debit: amountMinor }];
    if (commissionMinor > 0) entries.push({ account: 'AGENT_COMMISSION', debit: commissionMinor });
    entries.push({ account: accountId('AGENT_FLOAT', agentId), credit: amountMinor + commissionMinor });

    return this.ledger.post({ id, kind: 'CASH_PAYOUT', at, memo, entries });
  }

  // ------------------------------------------------------ T8: sell float back

  /**
   * A runner in a winning neighbourhood accumulates float and runs out of
   * cash. Without a reliable route back to money they stop paying winners, so
   * this is required infrastructure, not a convenience.
   */
  sellFloatBack({ id, at, agentId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    const available = this.#floatOf(agentId);
    this.#require(available >= amountMinor, `Agent ${agentId} has ${format(available)} float, cannot redeem ${format(amountMinor)}`);
    const funds = this.#settlement();
    this.#require(funds >= amountMinor, `Settlement funds ${format(funds)} cannot cover ${format(amountMinor)}`);

    return this.ledger.post({
      id, kind: 'SELL_FLOAT_BACK', at, memo,
      entries: [
        { account: accountId('AGENT_FLOAT', agentId), debit: amountMinor },
        { account: 'SETTLEMENT', credit: amountMinor }
      ]
    });
  }

  // ------------------------------------------------------------- T9: tax

  /** Gaming tax accrued against revenue, pending remittance. Rate and base per §11. */
  accrueGamingTax({ id, at, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    return this.ledger.post({
      id, kind: 'ACCRUE_GAMING_TAX', at, memo,
      entries: [
        { account: 'GAMING_TAX_EXPENSE', debit: amountMinor },
        { account: 'GAMING_TAX_PAYABLE', credit: amountMinor }
      ]
    });
  }

  // ------------------------------------------------------------- statements

  /** What a runner needs to see at close: what they hold and what they earned. */
  agentStatement(agentId) {
    return {
      agentId,
      floatMinor: this.#floatOf(agentId),
      floatFormatted: format(this.#floatOf(agentId))
    };
  }

  playerStatement(playerId) {
    return {
      playerId,
      walletMinor: this.#walletOf(playerId),
      walletFormatted: format(this.#walletOf(playerId))
    };
  }
}

module.exports = { Operator };
