'use strict';

const { Ledger } = require('./ledger.js');
const { assertAmount, assertNonNegative, format } = require('./money.js');
const { accountId, parseAccount } = require('./accounts.js');
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
   * @param {{currency?: object, store?: object, promoDailyCapMinor?: number}} [options]
   *        pass a SqliteStore for durability; defaults to in-memory.
   *        promoDailyCapMinor caps what promotions may cost in a single day;
   *        null (the default) means uncapped.
   */
  constructor(options = {}) {
    this.ledger = new Ledger(options);
    const cap = options.promoDailyCapMinor;
    if (cap !== undefined && cap !== null) assertNonNegative(cap, 'promoDailyCapMinor');
    this.promoDailyCapMinor = cap === undefined ? null : cap;
  }

  static #fail(message) {
    throw new Error(message);
  }

  /** UTC calendar day of a timestamp - the bucket the promotional cap counts in. */
  static #dayOf(at) {
    const t = Date.parse(at);
    if (Number.isNaN(t)) Operator.#fail(`at must be an ISO timestamp, got ${at}`);
    return new Date(t).toISOString().slice(0, 10);
  }

  /**
   * Player protection is off until it is switched on.
   *
   * No policy posted means no check runs: an operator that has not set limits
   * is not silently subject to invented ones. Turning it on is an event with a
   * timestamp against it, so "when did you enable this" has an answer that is
   * not somebody's memory of a deployment.
   *
   * @returns {null|{dailyStakeMinor: number|null, dailyLossMinor: number|null}}
   */
  static #limitsFor(v, playerId) {
    const override = v.getState('playerLimit', playerId);
    const global = v.getState('protection', 'global');
    if (!override && !global) return null;
    const pick = (field) => {
      if (override && override[field] !== null && override[field] !== undefined) return override[field];
      return global ? global[field] : null;
    };
    return { dailyStakeMinor: pick('dailyStakeMinor'), dailyLossMinor: pick('dailyLossMinor') };
  }

  /**
   * Exclusion is computed, never stored as a flag. A cooling-off period lapses
   * on its own: a player who asked for a week off should not have to ask to be
   * let back in, and an operator should not be able to forget to.
   */
  static #excludedAt(record, at) {
    if (!record || !record.excluded) return false;
    if (record.until === null) return true;
    return Date.parse(at) < Date.parse(record.until);
  }

  static #assertNotExcluded(v, playerId, at) {
    const record = v.getState('player', playerId);
    if (!Operator.#excludedAt(record, at)) return;
    Operator.#fail(
      record.until === null
        ? `Player ${playerId} is self-excluded`
        : `Player ${playerId} is self-excluded until ${record.until}`
    );
  }

  /**
   * The daily caps, checked against the day the money moves.
   *
   * `countsAsLoss` is false for a free ticket: it adds to the day's play, so
   * it counts against a stake cap, but it cannot lose the player money, so it
   * is not in the loss figure.
   */
  static #assertWithinLimits(v, playerId, at, stakeMinor, countsAsLoss) {
    const limits = Operator.#limitsFor(v, playerId);
    if (!limits) return;
    const day = Operator.#dayOf(at);
    const bucket = v.getState('playerDay', `${playerId}:${day}`) ||
      { stakedMinor: 0, paidStakedMinor: 0, wonMinor: 0 };

    if (limits.dailyStakeMinor !== null && bucket.stakedMinor + stakeMinor > limits.dailyStakeMinor) {
      Operator.#fail(
        `Player ${playerId} has staked ${format(bucket.stakedMinor)} of a ${format(limits.dailyStakeMinor)} ` +
        `daily limit on ${day}, cannot stake ${format(stakeMinor)}`
      );
    }

    if (countsAsLoss && limits.dailyLossMinor !== null) {
      // Net of what the day has already paid back. A win credited tomorrow
      // does not restore today's headroom - the conservative direction, and
      // the one a player asking for a limit is asking for.
      const netLoss = bucket.paidStakedMinor - bucket.wonMinor + stakeMinor;
      if (netLoss > limits.dailyLossMinor) {
        Operator.#fail(
          `Player ${playerId} would be down ${format(netLoss)} against a ${format(limits.dailyLossMinor)} ` +
          `daily loss limit on ${day}`
        );
      }
    }
  }

  /** Add to a player's day bucket. Every field is a running total for that day. */
  static #recordPlay(s, playerId, at, { stakedMinor = 0, paidStakedMinor = 0, wonMinor = 0 }) {
    const key = `${playerId}:${Operator.#dayOf(at)}`;
    const bucket = s.getState('playerDay', key) || { stakedMinor: 0, paidStakedMinor: 0, wonMinor: 0 };
    s.putState('playerDay', key, {
      stakedMinor: bucket.stakedMinor + stakedMinor,
      paidStakedMinor: bucket.paidStakedMinor + paidStakedMinor,
      wonMinor: bucket.wonMinor + wonMinor
    });
  }

  /**
   * A suspended runner cannot take money from players.
   *
   * Note what is *not* guarded: paying a winner (T7) and selling float back
   * (T8) stay open. Suspension must never strand a runner's float or leave a
   * player unpaid - it stops the account growing the operator's exposure, and
   * leaves every route that settles up intact.
   */
  static #assertNotSuspended(v, agentId) {
    const agent = v.getState('agent', agentId);
    if (agent && agent.suspended) {
      Operator.#fail(`Agent ${agentId} is suspended${agent.reason ? `: ${agent.reason}` : ''}`);
    }
  }

  /**
   * The betting window, checked identically however the bet arrives.
   *
   * A paid bet and a free ticket must obey the same clock: a grant earned
   * before the cutoff does not license a stake placed after the number is
   * known. Sharing one function is what stops the two paths from drifting.
   */
  static #assertAcceptsBets(v, drawKey, at) {
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
    if (commission > 0) entries.push({ account: accountId('AGENT_COMMISSION', agentId), debit: commission });
    entries.push({ account: accountId('AGENT_FLOAT', agentId), credit: floatMinor });

    return this.ledger.post({ id, kind: 'BUY_FLOAT', at, memo, entries }, {
      precondition: (v) => Operator.#assertNotSuspended(v, agentId),
      onCommit: (s) => {
        // First purchase registers the runner. Without a roster, a runner at
        // exactly zero float is invisible - and that is precisely the one who
        // needs a top-up before the next draw (F4).
        if (!s.getState('agent', agentId)) {
          s.putState('agent', agentId, { agentId, suspended: false, reason: null, since: at });
        }
      }
    });
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
        Operator.#assertNotSuspended(v, agentId);
        // Money in is refused for an excluded player; money out never is.
        Operator.#assertNotExcluded(v, playerId, at);
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
        Operator.#assertNotSuspended(v, agentId);
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
        Operator.#assertAcceptsBets(v, drawKey, at);

        Operator.#assertNotExcluded(v, playerId, at);
        Operator.#assertWithinLimits(v, playerId, at, stakeMinor, true);

        const balance = v.balance(wallet);
        if (balance < stakeMinor) {
          Operator.#fail(`Player ${playerId} has ${format(balance)}, cannot stake ${format(stakeMinor)}`);
        }
      },
      onCommit: (s) => {
        Operator.#recordPlay(s, playerId, at, { stakedMinor: stakeMinor, paidStakedMinor: stakeMinor });
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
    let paidByPlayer = {};

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
        paidByPlayer = {};
        for (const betId of open) {
          const bet = v.getState('bet', betId);
          const payout = evaluate({ betId, ...bet }, draw.result) || 0;
          if (payout === 0) continue;
          assertAmount(payout, `payout for ${betId}`);
          winners++;
          totalPayout += payout;
          entries.push({ account: 'PRIZE_PAYOUTS', debit: payout });
          entries.push({ account: accountId('PLAYER_WALLET', bet.playerId), credit: payout });
          paidByPlayer[bet.playerId] = (paidByPlayer[bet.playerId] || 0) + payout;
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
        // Winnings land in the day they are credited, so a loss limit is net
        // of what the player got back rather than gross of what they staked.
        for (const [playerId, wonMinor] of Object.entries(paidByPlayer)) {
          Operator.#recordPlay(s, playerId, at, { wonMinor });
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
    if (commissionMinor > 0) entries.push({ account: accountId('AGENT_COMMISSION', agentId), debit: commissionMinor });
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

  // ----------------------------------------------- T10-T11: free tickets

  /**
   * A promotional ticket the operator grants. One line separates this from a
   * sold voucher (T3): that one debits the runner's float, because a runner
   * paid for it, and this one debits promotional cost, because nobody did.
   * That line is the entire cost of the campaign, and partitioning the expense
   * by campaign is what lets each promotion report its own cost.
   *
   * The daily cap is a posting guard, not a monitoring alert: it is evaluated
   * inside the write transaction, so a promotion with a bug stops issuing
   * rather than draining the float.
   */
  issueFreeTicket({ id, at, campaignId, ticketId, playerId, faceMinor, memo }) {
    assertAmount(faceMinor, 'faceMinor');
    // Validate the player id here rather than at settlement: a malformed id
    // that only fails when a free ticket wins fails at the worst moment.
    parseAccount(accountId('PLAYER_WALLET', playerId));
    const expense = accountId('PROMO_EXPENSE', campaignId);
    const day = Operator.#dayOf(at);
    const cap = this.promoDailyCapMinor;

    return this.ledger.post({
      id, kind: 'ISSUE_FREE_TICKET', at, memo,
      entries: [
        { account: expense, debit: faceMinor },
        { account: 'PROMO_VOUCHERS', credit: faceMinor }
      ]
    }, {
      precondition: (v) => {
        if (v.getState('freeTicket', ticketId)) Operator.#fail(`Free ticket ${ticketId} already exists`);
        if (cap === null) return;
        const spent = (v.getState('promoDay', day) || { spentMinor: 0 }).spentMinor;
        if (spent + faceMinor > cap) {
          Operator.#fail(
            `Promotional budget for ${day} is ${format(cap)}; ${format(spent)} already issued, ` +
            `cannot add ${format(faceMinor)}`
          );
        }
      },
      onCommit: (s) => {
        s.putState('freeTicket', ticketId, {
          campaignId, playerId, faceMinor, issuedAt: at, redeemedBy: null, betId: null
        });
        const spent = (s.getState('promoDay', day) || { spentMinor: 0 }).spentMinor;
        s.putState('promoDay', day, { spentMinor: spent + faceMinor });
      }
    });
  }

  /**
   * The player plays the free ticket. It becomes a stake directly and the
   * wallet is never touched, so a promotional grant cannot be withdrawn as
   * cash - the oldest way a bonus turns into a cash-out scheme.
   *
   * From here it is a bet like any other: it settles under T5 at the same odds
   * and the same payout, because it is one.
   */
  redeemFreeTicket({ id, at, ticketId, betId, drawKey, selection = null, memo }) {
    return this.ledger.post({
      id, kind: 'REDEEM_FREE_TICKET', at, memo,
      entries: (v) => {
        const ticket = v.getState('freeTicket', ticketId);
        return [
          { account: 'PROMO_VOUCHERS', debit: ticket.faceMinor },
          { account: 'UNSETTLED_STAKES', credit: ticket.faceMinor }
        ];
      }
    }, {
      precondition: (v) => {
        const ticket = v.getState('freeTicket', ticketId);
        if (!ticket) Operator.#fail(`Unknown free ticket ${ticketId}`);
        if (ticket.redeemedBy !== null) {
          Operator.#fail(`Free ticket ${ticketId} was already played by ${ticket.redeemedBy}`);
        }
        if (v.getState('bet', betId)) Operator.#fail(`Bet ${betId} already exists`);
        Operator.#assertAcceptsBets(v, drawKey, at);
        // A free ticket is still play: it counts against a stake limit. It
        // cannot lose the player money, so it is not in the loss figure.
        Operator.#assertNotExcluded(v, ticket.playerId, at);
        Operator.#assertWithinLimits(v, ticket.playerId, at, ticket.faceMinor, false);
      },
      onCommit: (s) => {
        const ticket = s.getState('freeTicket', ticketId);
        Operator.#recordPlay(s, ticket.playerId, at, { stakedMinor: ticket.faceMinor });
        s.putState('freeTicket', ticketId, { ...ticket, redeemedBy: ticket.playerId, betId });
        s.putState('bet', betId, {
          playerId: ticket.playerId, drawKey, stakeMinor: ticket.faceMinor,
          selection, settled: false, free: true, ticketId
        });
        const draw = s.getState('draw', drawKey);
        s.putState('draw', drawKey, { ...draw, betIds: [...draw.betIds, betId] });
      }
    });
  }

  // -------------------------------------------------- T12-T13: the jackpot

  /**
   * A share of the draw's stakes accrues to the pot. Recognising it as a
   * liability draw by draw is what forces the operator to hold assets against
   * the figure on the screen: the pool sits inside the solvency invariant, so
   * a pot growing faster than settlement funds halts float sales before it can
   * be won. An advertised jackpot that exists only as a number is a debt with
   * no record, and it is the classic way one of these collapses.
   *
   * Funded after settlement, so the contribution is a share of a final stakes
   * figure rather than a running guess.
   */
  fundJackpot({ id, at, drawKey, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');

    return this.ledger.post({
      id, kind: 'FUND_JACKPOT', at, memo,
      entries: [
        { account: 'JACKPOT_CONTRIBUTION', debit: amountMinor },
        { account: 'JACKPOT_POOL', credit: amountMinor }
      ]
    }, {
      precondition: (v) => {
        const draw = v.getState('draw', drawKey);
        if (!draw) Operator.#fail(`Draw ${drawKey} was never opened`);
        if (!draw.settled) Operator.#fail(`Draw ${drawKey} has not settled; the pot is funded from a final stakes figure`);
        if (draw.jackpotFundedMinor !== undefined) {
          Operator.#fail(`Draw ${drawKey} has already contributed ${format(draw.jackpotFundedMinor)} to the jackpot`);
        }
      },
      onCommit: (s) => {
        const draw = s.getState('draw', drawKey);
        s.putState('draw', drawKey, { ...draw, jackpotFundedMinor: amountMinor });
      }
    });
  }

  /**
   * The pot is won. No expense is recognised here - the cost was booked draw
   * by draw as the pot was built, which stops one jackpot night from reading
   * as a catastrophic loss and, more to the point, stops an unwon pot from
   * being treated as profit in the months before it is claimed.
   *
   * Getting it out of the wallet is still T6 or T7, with the payout ceiling
   * applying as it does to any other win.
   */
  payJackpot({ id, at, drawKey, playerId, amountMinor, memo }) {
    assertAmount(amountMinor, 'amountMinor');
    const wallet = accountId('PLAYER_WALLET', playerId);

    return this.ledger.post({
      id, kind: 'PAY_JACKPOT', at, memo,
      entries: [
        { account: 'JACKPOT_POOL', debit: amountMinor },
        { account: wallet, credit: amountMinor }
      ]
    }, {
      precondition: (v) => {
        const draw = v.getState('draw', drawKey);
        if (!draw) Operator.#fail(`Draw ${drawKey} was never opened`);
        if (!draw.result) Operator.#fail(`Draw ${drawKey} has not been revealed yet`);
        if (draw.jackpotPaid) Operator.#fail(`Draw ${drawKey} has already paid its jackpot`);
        const pool = v.balance('JACKPOT_POOL');
        if (pool < amountMinor) {
          Operator.#fail(`Jackpot pool holds ${format(pool)}, cannot pay ${format(amountMinor)}`);
        }
      },
      onCommit: (s) => {
        const draw = s.getState('draw', drawKey);
        s.putState('draw', drawKey, { ...draw, jackpotPaid: { playerId, amountMinor } });
      }
    });
  }

  // ----------------------------------------------------- player protection

  /**
   * Switch protection on. Nothing below is enforced until this is posted:
   * limits are policy the operator sets, not defaults the ledger invents.
   *
   * An event rather than configuration, because "when were limits introduced,
   * and at what level" is a question with a regulatory answer, and a constant
   * in a deployment cannot answer it. Posting again replaces the policy, and
   * both versions stay in the log.
   *
   * @param {number|null} dailyStakeMinor  most a player may stake in a UTC day
   * @param {number|null} dailyLossMinor   most a player may be down in a day,
   *        net of that day's winnings. Either may be null for "no limit".
   */
  setProtection({ id, at, dailyStakeMinor = null, dailyLossMinor = null, memo }) {
    for (const [label, value] of [['dailyStakeMinor', dailyStakeMinor], ['dailyLossMinor', dailyLossMinor]]) {
      if (value !== null) assertAmount(value, label);
    }
    if (dailyStakeMinor === null && dailyLossMinor === null) {
      Operator.#fail('setProtection needs at least one limit; use clearProtection to switch it off');
    }

    return this.ledger.event({
      id, kind: 'PROTECTION_SET', at, memo, data: { dailyStakeMinor, dailyLossMinor }
    }, {
      onCommit: (s) => s.putState('protection', 'global', { dailyStakeMinor, dailyLossMinor, since: at })
    });
  }

  /** Switch the global limits off again. Per-player limits are untouched. */
  clearProtection({ id, at, memo }) {
    return this.ledger.event({ id, kind: 'PROTECTION_CLEARED', at, memo, data: {} }, {
      precondition: (v) => {
        if (!v.getState('protection', 'global')) Operator.#fail('No protection policy is in force');
      },
      onCommit: (s) => s.putState('protection', 'global', null)
    });
  }

  /**
   * A limit for one player, tighter or looser than the house policy. A player
   * who asks for their own limit gets one whether or not the operator has set
   * a global policy - which is the point of asking.
   *
   * A null field inherits the global policy rather than removing the limit.
   */
  setPlayerLimit({ id, at, playerId, dailyStakeMinor = null, dailyLossMinor = null, memo }) {
    parseAccount(accountId('PLAYER_WALLET', playerId));
    for (const [label, value] of [['dailyStakeMinor', dailyStakeMinor], ['dailyLossMinor', dailyLossMinor]]) {
      if (value !== null) assertAmount(value, label);
    }

    return this.ledger.event({
      id, kind: 'PLAYER_LIMIT_SET', at, memo, data: { playerId, dailyStakeMinor, dailyLossMinor }
    }, {
      onCommit: (s) => s.putState('playerLimit', playerId, { dailyStakeMinor, dailyLossMinor, since: at })
    });
  }

  /**
   * Self-exclusion, and cooling-off, which is the same thing with an end date.
   *
   * Refuses staking and top-ups. It does *not* refuse a withdrawal or a
   * payout: a player who has stopped must still be able to take out what they
   * are owed, and a protection measure that traps money is not one.
   *
   * @param {string|null} until ISO timestamp for a cooling-off period, or null
   *        for indefinite exclusion, which only a reinstatement lifts.
   */
  excludePlayer({ id, at, playerId, until = null, reason = null, memo }) {
    parseAccount(accountId('PLAYER_WALLET', playerId));
    if (until !== null) {
      if (Number.isNaN(Date.parse(until))) Operator.#fail(`until must be an ISO timestamp, got ${until}`);
      if (Date.parse(until) <= Date.parse(at)) Operator.#fail('A cooling-off period must end in the future');
    }

    return this.ledger.event({
      id, kind: 'PLAYER_EXCLUDED', at, memo, data: { playerId, until, reason }
    }, {
      precondition: (v) => {
        if (Operator.#excludedAt(v.getState('player', playerId), at)) {
          Operator.#fail(`Player ${playerId} is already excluded`);
        }
      },
      onCommit: (s) => s.putState('player', playerId, { excluded: true, until, reason, since: at })
    });
  }

  /**
   * Lift an indefinite exclusion. A cooling-off period lapses on its own and
   * needs no call - and deliberately cannot be cut short by one, because an
   * exclusion a player can reverse in the moment they want to play is not a
   * protection.
   */
  reinstatePlayer({ id, at, playerId, memo }) {
    return this.ledger.event({ id, kind: 'PLAYER_REINSTATED', at, memo, data: { playerId } }, {
      precondition: (v) => {
        const record = v.getState('player', playerId);
        if (!Operator.#excludedAt(record, at)) Operator.#fail(`Player ${playerId} is not excluded`);
        if (record.until !== null) {
          Operator.#fail(`Player ${playerId} is in a cooling-off period until ${record.until}, which cannot be cut short`);
        }
      },
      onCommit: (s) => s.putState('player', playerId, { excluded: false, until: null, reason: null, since: at })
    });
  }

  /** Whether protection is on at all, and at what level. For the operator's own screen. */
  protectionStatus() {
    const global = this.ledger.readState('protection', 'global');
    return {
      active: Boolean(global),
      dailyStakeMinor: global ? global.dailyStakeMinor : null,
      dailyLossMinor: global ? global.dailyLossMinor : null,
      since: global ? global.since : null,
      playerLimits: this.ledger.listState('playerLimit').filter(([, v]) => v).length,
      excluded: this.ledger.listState('player').filter(([, v]) => v && v.excluded).length
    };
  }

  // -------------------------------------------------------- runner tooling

  /**
   * Suspend a runner from selling. An event, not a transaction: no money
   * moves, but the fact has to be as durable and as append-only as one.
   *
   * The design calls for suspending a runner who cannot reconcile *before the
   * next draw, not after the next audit* - which only works if the suspension
   * takes effect inside the same lock every sale is checked against.
   */
  suspendAgent({ id, at, agentId, reason = null, memo }) {
    return this.ledger.event({ id, kind: 'AGENT_SUSPENDED', at, memo, data: { agentId, reason } }, {
      precondition: (v) => {
        const agent = v.getState('agent', agentId);
        if (!agent) Operator.#fail(`Unknown agent ${agentId}`);
        if (agent.suspended) Operator.#fail(`Agent ${agentId} is already suspended`);
      },
      onCommit: (s) => {
        const agent = s.getState('agent', agentId);
        s.putState('agent', agentId, { ...agent, suspended: true, reason, since: at });
      }
    });
  }

  reinstateAgent({ id, at, agentId, memo }) {
    return this.ledger.event({ id, kind: 'AGENT_REINSTATED', at, memo, data: { agentId } }, {
      precondition: (v) => {
        const agent = v.getState('agent', agentId);
        if (!agent) Operator.#fail(`Unknown agent ${agentId}`);
        if (!agent.suspended) Operator.#fail(`Agent ${agentId} is not suspended`);
      },
      onCommit: (s) => {
        const agent = s.getState('agent', agentId);
        s.putState('agent', agentId, { ...agent, suspended: false, reason: null, since: at });
      }
    });
  }

  /** Every runner the operator has ever sold float to, with their current position. */
  agents() {
    return this.ledger.listState('agent').map(([agentId, agent]) => ({
      ...agent,
      floatMinor: this.ledger.balance(accountId('AGENT_FLOAT', agentId))
    }));
  }

  /**
   * Runners who cannot serve the next draw. Sales stop when float runs out,
   * which is a revenue loss rather than a risk (F4) - but only if somebody is
   * told. A runner sitting at exactly zero has no balance row at all, which is
   * why this reads the roster rather than the accounts.
   */
  agentsBelow(thresholdMinor) {
    assertNonNegative(thresholdMinor, 'thresholdMinor');
    return this.agents()
      .filter((a) => a.floatMinor < thresholdMinor)
      .sort((a, b) => a.floatMinor - b.floatMinor);
  }

  // ------------------------------------------------------------- statements

  /**
   * The six lines the daily reconciliation asks for: opening float, purchases,
   * sales, payouts handled, commission earned, closing float - derived from
   * the journal rather than kept as a running total, so it cannot disagree
   * with the entries it claims to summarise.
   *
   * `from` and `to` are ISO timestamps; the window is half-open, so a day's
   * statement and the next day's cannot both claim the same transaction.
   */
  agentStatement(agentId, { from = null, to = null } = {}) {
    const float = accountId('AGENT_FLOAT', agentId);
    const commissionAccount = accountId('AGENT_COMMISSION', agentId);
    const start = from === null ? -Infinity : Date.parse(from);
    const end = to === null ? Infinity : Date.parse(to);
    if (Number.isNaN(start) || Number.isNaN(end)) Operator.#fail('from and to must be ISO timestamps');

    // Every kind that can move a runner's float. Anything unrecognised lands
    // in `other` rather than vanishing: a statement that silently drops a
    // movement is worse than one that admits it does not understand it.
    const BUCKETS = {
      BUY_FLOAT: 'purchases',
      CASH_IN: 'sales',
      ISSUE_VOUCHER: 'vouchers',
      CASH_PAYOUT: 'payouts',
      SELL_FLOAT_BACK: 'redemptions'
    };

    const movements = { purchases: 0, sales: 0, vouchers: 0, payouts: 0, redemptions: 0, other: 0 };
    let openingMinor = 0;
    let commissionMinor = 0;

    for (const tx of this.ledger.journal) {
      const when = Date.parse(tx.at);
      let delta = 0;
      let commission = 0;
      for (const entry of tx.entries) {
        // Float is a liability: a credit is float the runner gained.
        if (entry.account === float) delta += entry.credit - entry.debit;
        if (entry.account === commissionAccount) commission += entry.debit - entry.credit;
      }
      if (delta === 0 && commission === 0) continue;

      if (when < start) {
        openingMinor += delta;
        continue;
      }
      if (when >= end) continue;

      movements[BUCKETS[tx.kind] || 'other'] += delta;
      commissionMinor += commission;
    }

    const netMinor = Object.values(movements).reduce((a, b) => a + b, 0);
    const closingMinor = openingMinor + netMinor;
    const agent = this.ledger.readState('agent', agentId);

    return {
      agentId,
      from, to,
      suspended: agent ? agent.suspended : false,
      openingMinor, movements, netMinor, closingMinor, commissionMinor,
      // The statement reconciles when its closing figure is the balance the
      // ledger holds. That is only assertable for an open-ended window - a
      // historical statement is checked by its own arithmetic instead.
      reconciles: to === null
        ? closingMinor === this.ledger.balance(float)
        : closingMinor === openingMinor + netMinor,
      floatMinor: this.ledger.balance(float),
      floatFormatted: format(this.ledger.balance(float)),
      openingFormatted: format(openingMinor),
      closingFormatted: format(closingMinor),
      commissionFormatted: format(commissionMinor)
    };
  }

  /**
   * What a player holds, what they have played today, and what is limiting
   * them. Support needs this to answer a question at a counter, and a player
   * asking "how much have I spent today" deserves an answer that is not an
   * estimate.
   */
  playerStatement(playerId, at = null) {
    const walletMinor = this.ledger.balance(accountId('PLAYER_WALLET', playerId));
    const record = this.ledger.readState('player', playerId);
    const day = at === null ? null : new Date(Date.parse(at)).toISOString().slice(0, 10);
    const bucket = (day && this.ledger.readState('playerDay', `${playerId}:${day}`)) ||
      { stakedMinor: 0, paidStakedMinor: 0, wonMinor: 0 };

    const override = this.ledger.readState('playerLimit', playerId);
    const global = this.ledger.readState('protection', 'global');
    const pick = (field) => {
      if (override && override[field] !== null && override[field] !== undefined) return override[field];
      return global ? global[field] : null;
    };

    return {
      playerId, walletMinor, walletFormatted: format(walletMinor),
      day,
      stakedTodayMinor: bucket.stakedMinor,
      wonTodayMinor: bucket.wonMinor,
      netTodayMinor: bucket.wonMinor - bucket.paidStakedMinor,
      excluded: Operator.#excludedAt(record, at || new Date(0).toISOString()),
      excludedUntil: record ? record.until : null,
      limits: (override || global)
        ? { dailyStakeMinor: pick('dailyStakeMinor'), dailyLossMinor: pick('dailyLossMinor') }
        : null
    };
  }

  /** What one campaign has cost, and what of it is still owed. */
  promoStatement(campaignId) {
    const spentMinor = this.ledger.balance(accountId('PROMO_EXPENSE', campaignId));
    const outstandingMinor = this.ledger.balance('PROMO_VOUCHERS');
    return {
      campaignId, spentMinor, outstandingMinor,
      spentFormatted: format(spentMinor),
      outstandingFormatted: format(outstandingMinor)
    };
  }

  /** What has been promised in the pot, and whether the operator can pay it. */
  jackpotStatement() {
    const poolMinor = this.ledger.balance('JACKPOT_POOL');
    const { headroom } = this.ledger.solvency();
    return { poolMinor, poolFormatted: format(poolMinor), funded: headroom >= 0 };
  }

  close() {
    this.ledger.close();
  }
}

module.exports = { Operator };
