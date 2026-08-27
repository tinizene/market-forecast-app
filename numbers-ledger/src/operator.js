'use strict';

const { Ledger } = require('./ledger.js');
const { assertAmount, assertNonNegative, format } = require('./money.js');
const { accountId } = require('./accounts.js');
const draws = require('./draws.js');

/**
 * The operator's book: the ledger, plus the state that is not itself a balance
 * - which vouchers exist, which bets belong to which draw. All of it lives in
 * the store, so a restart loses nothing.
 *
 * Every operation is a guard plus one atomic transaction, and the guard runs
 * *inside* that transaction. That is the difference from a naive
 * check-then-write: two simultaneous cash-ins against the same runner cannot
 * both see enough float, because the second one reads only after the first has
 * committed or rolled back.
 *
 * No operation reads the clock. Callers pass `at`, so a test can run a whole
 * trading day in milliseconds and settlement is never at the mercy of a device
 * clock - the same reason the design puts the cutoff on the server.
 */
class Operator {
  /**
   * @param {{currency?: object, store?: object}} [options] pass a SqliteStore
   *        for durability; defaults to in-memory.
   */
  constructor(options = {}) {
    this.ledger = new Ledger(options);
  }

  static #fail(message) {
    throw new Error(message);
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
    if (commission < 0) {
      Operator.#fail(`Float granted (${format(floatMinor)}) cannot exceed money paid plus zero commission`);
    }

    const entries = [{ account: 'SETTLEMENT', debit: paidMinor }];
    if (commission > 0) entries.push({ account: 'AGENT_COMMISSION', debit: commission });
    entries.push({ account: accountId('AGENT_FLOAT', agentId), credit: floatMinor });

    return this.ledger.post({ id, kind: 'BUY_FLOAT', at, memo, entries });
  }

  // ------------------------------------------------------------- T2: cash in

  /**
   * A player hands a runner cash; the runner pushes an equal amount of e-value.
   * The cash itself never appears here - it is between those two people, and
   * the operator was already paid for this float in T1.
   */
  cashIn({ id, at, agentId, playerId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    const float = accountId('AGENT_FLOAT', agentId);

    return this.ledger.post({
      id, kind: 'CASH_IN', at, memo,
      entries: [
        { account: float, debit: amountMinor },
        { account: accountId('PLAYER_WALLET', playerId), credit: amountMinor }
      ]
    }, {
      precondition: (v) => {
        const available = v.balance(float);
        if (available < amountMinor) {
          Operator.#fail(`Agent ${agentId} has ${format(available)} float, cannot sell ${format(amountMinor)}`);
        }
      }
    });
  }

  // ------------------------------------------------------------ T3: vouchers

  /** A runner buys voucher inventory with float. Sold offline, activated later. */
  issueVoucher({ id, at, agentId, voucherId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    const float = accountId('AGENT_FLOAT', agentId);

    return this.ledger.post({
      id, kind: 'ISSUE_VOUCHER', at, memo,
      entries: [
        { account: float, debit: amountMinor },
        { account: 'UNREDEEMED_VOUCHERS', credit: amountMinor }
      ]
    }, {
      precondition: (v) => {
        if (v.getState('voucher', voucherId)) Operator.#fail(`Voucher ${voucherId} already exists`);
        const available = v.balance(float);
        if (available < amountMinor) {
          Operator.#fail(`Agent ${agentId} has ${format(available)} float, cannot buy ${format(amountMinor)} of vouchers`);
        }
      },
      onCommit: (s) => s.putState('voucher', voucherId, { agentId, amountMinor, redeemedBy: null })
    });
  }

  /** The player activates the code. Single use, checked and written under one lock. */
  redeemVoucher({ id, at, voucherId, playerId, memo }) {
    return this.ledger.post({
      id, kind: 'REDEEM_VOUCHER', at, memo,
      entries: (v) => {
        const voucher = v.getState('voucher', voucherId);
        return [
          { account: 'UNREDEEMED_VOUCHERS', debit: voucher.amountMinor },
          { account: accountId('PLAYER_WALLET', playerId), credit: voucher.amountMinor }
        ];
      }
    }, {
      precondition: (v) => {
        const voucher = v.getState('voucher', voucherId);
        if (!voucher) Operator.#fail(`Unknown voucher ${voucherId}`);
        if (voucher.redeemedBy !== null) {
          Operator.#fail(`Voucher ${voucherId} was already redeemed by ${voucher.redeemedBy}`);
        }
      },
      onCommit: (s) => {
        const voucher = s.getState('voucher', voucherId);
        s.putState('voucher', voucherId, { ...voucher, redeemedBy: playerId });
      }
    });
  }

  // ------------------------------------------------- D1: open a draw

  /**
   * Publish a draw's commitment and its timetable. Betting is impossible until
   * this exists, which is the point: a bet can only be taken on a draw whose
   * number was already fixed and whose fixing was published.
   *
   * Moves no money, so it is an event rather than a ledger transaction - but an
   * append-only one. A commitment that could be edited afterwards would prove
   * nothing.
   */
  openDraw({ id, at, drawKey, commitment, opensAt, cutoffAt, drawAt, memo }) {
    if (typeof commitment !== 'string' || !/^[0-9a-f]{64}$/.test(commitment)) {
      Operator.#fail('commitment must be 64 hex characters (sha256)');
    }
    for (const [label, value] of [['opensAt', opensAt], ['cutoffAt', cutoffAt], ['drawAt', drawAt]]) {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        Operator.#fail(`${label} must be an ISO timestamp, got ${value}`);
      }
    }
    if (Date.parse(opensAt) >= Date.parse(cutoffAt)) Operator.#fail('Betting must open before it closes');
    if (Date.parse(cutoffAt) > Date.parse(drawAt)) Operator.#fail('The cutoff cannot fall after the draw');
    if (Date.parse(at) > Date.parse(opensAt)) {
      // The commitment has to exist before the first bet can be taken, or the
      // guarantee it provides is retrospective and therefore worthless.
      Operator.#fail('A draw must be committed before betting opens');
    }

    return this.ledger.event({
      id, kind: 'DRAW_OPENED', at, memo,
      data: { drawKey, commitment, opensAt, cutoffAt, drawAt }
    }, {
      precondition: (v) => {
        if (v.getState('draw', drawKey)) Operator.#fail(`Draw ${drawKey} is already open`);
      },
      onCommit: (s) => s.putState('draw', drawKey, {
        status: 'open', commitment, opensAt, cutoffAt, drawAt,
        seed: null, result: null, betIds: [], settled: false
      })
    });
  }

  // ----------------------------------------------------- D2: reveal the seed

  /**
   * Reveal the seed after the draw time. The commitment is checked here, so a
   * seed that was swapped for a more convenient one is refused by the operator's
   * own code before anyone else has to catch it.
   */
  revealDraw({ id, at, drawKey, seed, memo }) {
    let result = null;

    const outcome = this.ledger.event({
      id, kind: 'DRAW_REVEALED', at, memo,
      data: () => ({ drawKey, seed, result })
    }, {
      precondition: (v) => {
        const draw = v.getState('draw', drawKey);
        if (!draw) Operator.#fail(`Draw ${drawKey} was never opened`);
        if (draw.result) Operator.#fail(`Draw ${drawKey} is already revealed`);
        if (Date.parse(at) < Date.parse(draw.drawAt)) {
          Operator.#fail(`Draw ${drawKey} cannot be revealed before ${draw.drawAt}`);
        }
        if (!draws.verifyCommitment(drawKey, seed, draw.commitment)) {
          Operator.#fail(`Seed does not match the commitment published for draw ${drawKey}`);
        }
        result = draws.resultFromSeed(drawKey, seed);
      },
      onCommit: (s) => {
        const draw = s.getState('draw', drawKey);
        s.putState('draw', drawKey, { ...draw, status: 'revealed', seed, result });
      }
    });

    return { ...outcome, result };
  }

  /** Everything a player or auditor needs to check the draw themselves. */
  drawReceipt(drawKey) {
    const draw = this.ledger.readState('draw', drawKey);
    if (!draw) return null;
    const { commitment, seed, result, opensAt, cutoffAt, drawAt, status, settled } = draw;
    return {
      drawKey, status, settled, commitment, seed, result, opensAt, cutoffAt, drawAt,
      verification: seed ? draws.verifyDraw({ drawKey, seed, commitment, result }) : null
    };
  }

  // ----------------------------------------------------------- T4: place bet

  /**
   * The stake leaves the wallet but is not revenue yet - it is money held
   * against an unresolved obligation until the draw runs.
   */
  placeBet({ id, at, betId, playerId, drawKey, stakeMinor, selection = null, memo }) {
    assertAmount(stakeMinor, 'stakeMinor');
    const wallet = accountId('PLAYER_WALLET', playerId);

    return this.ledger.post({
      id, kind: 'PLACE_BET', at, memo,
      entries: [
        { account: wallet, debit: stakeMinor },
        { account: 'UNSETTLED_STAKES', credit: stakeMinor }
      ]
    }, {
      precondition: (v) => {
        if (v.getState('bet', betId)) Operator.#fail(`Bet ${betId} already exists`);

        // No bet without a published commitment, and none after the cutoff.
        // Both checks run against the server-supplied `at`, never a device clock.
        const draw = v.getState('draw', drawKey);
        if (!draw) Operator.#fail(`Draw ${drawKey} is not open for betting`);
        if (draw.settled) Operator.#fail(`Draw ${drawKey} has already settled`);
        if (draw.result) Operator.#fail(`Draw ${drawKey} has already been drawn`);
        if (!draws.acceptsBetsAt(draw, at)) {
          Operator.#fail(
            Date.parse(at) < Date.parse(draw.opensAt)
              ? `Draw ${drawKey} does not open until ${draw.opensAt}`
              : `Draw ${drawKey} closed at ${draw.cutoffAt}`
          );
        }

        const balance = v.balance(wallet);
        if (balance < stakeMinor) {
          Operator.#fail(`Player ${playerId} has ${format(balance)}, cannot stake ${format(stakeMinor)}`);
        }
      },
      onCommit: (s) => {
        s.putState('bet', betId, { playerId, drawKey, stakeMinor, selection, settled: false });
        const draw = s.getState('draw', drawKey);
        s.putState('draw', drawKey, { ...draw, betIds: [...draw.betIds, betId] });
      }
    });
  }

  // --------------------------------------------------------- T5: settle draw

  /**
   * One atomic transaction for the whole draw: recognise every stake as
   * revenue, and credit every winner. Settling in one posting is what makes a
   * partially-settled draw impossible.
   *
   * @param {Array<{betId: string, payoutMinor: number}>} winners
   */
  settleDraw({ id, at, drawKey, evaluate, memo }) {
    if (typeof evaluate !== 'function') {
      Operator.#fail('settleDraw needs an evaluate(bet, result) function');
    }

    let summary = { totalStakes: 0, totalPayout: 0, betsSettled: 0, winners: 0, result: null };

    const result = this.ledger.post({
      id, kind: 'SETTLE_DRAW', at, memo,
      entries: (v) => {
        const draw = v.getState('draw', drawKey);
        const open = draw.betIds.filter((b) => !v.getState('bet', b).settled);

        let totalStakes = 0;
        for (const betId of open) totalStakes += v.getState('bet', betId).stakeMinor;

        const entries = [
          { account: 'UNSETTLED_STAKES', debit: totalStakes },
          { account: 'STAKES_REVENUE', credit: totalStakes }
        ];

        // Who won is decided by the game's rules against the revealed number,
        // not by a list the caller hands in. That is the whole point of the
        // draw authority: with a winners[] argument, settlement would trust
        // whoever called it.
        let totalPayout = 0;
        let winners = 0;
        for (const betId of open) {
          const bet = v.getState('bet', betId);
          const payout = evaluate({ betId, ...bet }, draw.result) || 0;
          if (payout === 0) continue;
          assertAmount(payout, `payout for ${betId}`);
          winners++;
          totalPayout += payout;
          entries.push({ account: 'PRIZE_PAYOUTS', debit: payout });
          entries.push({ account: accountId('PLAYER_WALLET', bet.playerId), credit: payout });
        }

        summary = { totalStakes, totalPayout, betsSettled: open.length, winners, result: draw.result };
        return entries;
      }
    }, {
      precondition: (v) => {
        const draw = v.getState('draw', drawKey);
        if (!draw) Operator.#fail(`Draw ${drawKey} was never opened`);
        if (draw.settled) Operator.#fail(`Draw ${drawKey} is already settled`);
        if (!draw.result) Operator.#fail(`Draw ${drawKey} has not been revealed yet`);
        if (draw.betIds.length === 0) Operator.#fail(`No bets recorded for draw ${drawKey}`);
      },
      onCommit: (s) => {
        const draw = s.getState('draw', drawKey);
        for (const betId of draw.betIds) {
          const bet = s.getState('bet', betId);
          if (!bet.settled) s.putState('bet', betId, { ...bet, settled: true });
        }
        s.putState('draw', drawKey, { ...draw, settled: true });
      }
    });

    return { ...result, ...summary };
  }

  // ------------------------------------------- T6: withdraw to mobile money

  /**
   * The only path where real money leaves the operator. The transfer fee is an
   * operator cost, not a deduction from the player - they asked for an amount
   * and that is what arrives.
   */
  withdrawToMobileMoney({ id, at, playerId, amountMinor, feeMinor = 0, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    assertNonNegative(feeMinor, 'feeMinor');
    const wallet = accountId('PLAYER_WALLET', playerId);

    const entries = [{ account: wallet, debit: amountMinor }];
    if (feeMinor > 0) entries.push({ account: 'TRANSACTION_FEES', debit: feeMinor });
    entries.push({ account: 'SETTLEMENT', credit: amountMinor + feeMinor });

    return this.ledger.post({ id, kind: 'WITHDRAW_MOBILE_MONEY', at, memo, entries }, {
      precondition: (v) => {
        const balance = v.balance(wallet);
        if (balance < amountMinor) {
          Operator.#fail(`Player ${playerId} has ${format(balance)}, cannot withdraw ${format(amountMinor)}`);
        }
        const funds = v.balance('SETTLEMENT');
        if (funds < amountMinor + feeMinor) {
          Operator.#fail(`Settlement funds ${format(funds)} cannot cover ${format(amountMinor + feeMinor)}`);
        }
      }
    });
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
    const wallet = accountId('PLAYER_WALLET', playerId);

    const entries = [{ account: wallet, debit: amountMinor }];
    if (commissionMinor > 0) entries.push({ account: 'AGENT_COMMISSION', debit: commissionMinor });
    entries.push({ account: accountId('AGENT_FLOAT', agentId), credit: amountMinor + commissionMinor });

    return this.ledger.post({ id, kind: 'CASH_PAYOUT', at, memo, entries }, {
      precondition: (v) => {
        const balance = v.balance(wallet);
        if (balance < amountMinor) {
          Operator.#fail(`Player ${playerId} has ${format(balance)}, cannot be paid ${format(amountMinor)}`);
        }
      }
    });
  }

  // ------------------------------------------------------ T8: sell float back

  /**
   * A runner in a winning neighbourhood accumulates float and runs out of
   * cash. Without a reliable route back to money they stop paying winners, so
   * this is required infrastructure, not a convenience.
   */
  sellFloatBack({ id, at, agentId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    const float = accountId('AGENT_FLOAT', agentId);

    return this.ledger.post({
      id, kind: 'SELL_FLOAT_BACK', at, memo,
      entries: [
        { account: float, debit: amountMinor },
        { account: 'SETTLEMENT', credit: amountMinor }
      ]
    }, {
      precondition: (v) => {
        const available = v.balance(float);
        if (available < amountMinor) {
          Operator.#fail(`Agent ${agentId} has ${format(available)} float, cannot redeem ${format(amountMinor)}`);
        }
        const funds = v.balance('SETTLEMENT');
        if (funds < amountMinor) {
          Operator.#fail(`Settlement funds ${format(funds)} cannot cover ${format(amountMinor)}`);
        }
      }
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

  /** What a runner needs to see at close: what they hold. */
  agentStatement(agentId) {
    const floatMinor = this.ledger.balance(accountId('AGENT_FLOAT', agentId));
    return { agentId, floatMinor, floatFormatted: format(floatMinor) };
  }

  playerStatement(playerId) {
    const walletMinor = this.ledger.balance(accountId('PLAYER_WALLET', playerId));
    return { playerId, walletMinor, walletFormatted: format(walletMinor) };
  }

  close() {
    this.ledger.close();
  }
}

module.exports = { Operator };
