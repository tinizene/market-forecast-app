'use strict';

const { Operator } = require('../src/operator.js');
const { Auth } = require('../src/http/auth.js');
const { MobileMoneyGateway } = require('../src/mobilemoney/gateway.js');
const { SimulatedProvider } = require('../src/mobilemoney/simulator.js');
const draws = require('../src/draws.js');
const game = require('../../africa-numbers/game.js');
const { seedFor } = require('./seed-search.js');

/**
 * A book with a day behind it.
 *
 * An empty system tests nothing. A tester opening the console should find
 * runners with float and history, players who have won and lost, a settled
 * draw, an excluded player, a disbursement stuck in flight and a
 * reconciliation anomaly waiting for somebody - because those are the states
 * where software goes wrong, and none of them can be reached by clicking
 * around a system that started five seconds ago.
 *
 * Everything here is built through the same public operations the product
 * uses. There is no seeding that reaches past a guard, so a fixture cannot
 * create a state the product could not have arrived at on its own.
 */

const RUNNERS = [
  { agentId: 'ag-monrovia-1', paidMinor: 47_500_00, floatMinor: 50_000_00 },
  { agentId: 'ag-monrovia-2', paidMinor: 19_000_00, floatMinor: 20_000_00 },
  { agentId: 'ag-paynesville', paidMinor: 9_500_00, floatMinor: 10_000_00 }
];

const BET_SHAPES = [
  { type: 'straight', digits: '417' },
  { type: 'oneDigit', digits: '4' },
  { type: 'twoDigits', digits: '17' },
  { type: 'box6', digits: '741' },
  { type: 'front', digits: '41' },
  { type: 'straight', digits: '222' },
  { type: 'oneDigit', digits: '8' },
  { type: 'front', digits: '90' }
];

/** payout in minor units, or 0. The ledger asks; the game answers. */
function evaluate(bet, result) {
  const selection = bet.selection;
  if (!selection || !game.isHit(selection, result)) return 0;
  return game.quote(selection.type, bet.stakeMinor).netCents;
}

/**
 * Build the book.
 *
 * @param {{day?: string, store?: object, webhookSecret?: string, result?: string}} [options]
 *        `result` forces yesterday's draw so the tester always finds the same
 *        winners on the same tickets.
 */
function seed({ day = '2026-09-01', store = null, webhookSecret = 'lab-webhook-secret', result = '417' } = {}) {
  const yesterday = new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const at = (date, time) => `${date}T${time}:00.000Z`;

  const operator = new Operator(store ? { store } : {});
  const provider = new SimulatedProvider();
  const gateway = new MobileMoneyGateway({ operator, provider });
  const auth = new Auth({ ledger: operator.ledger, webhookSecret });

  // ---------------------------------------------------------- the operator
  operator.injectCapital({
    id: 'lab-capital', at: at(yesterday, '06:00'), amountMinor: 2_000_000_00, memo: 'opening capital'
  });
  operator.setPromoCap({
    id: 'lab-cap', at: at(yesterday, '06:05'), dailyCapMinor: 5_000_00, by: 'staff-lab', memo: 'lab fixture'
  });

  // ------------------------------------------------------------- runners
  for (const runner of RUNNERS) {
    operator.buyFloat({ id: `lab-float-${runner.agentId}`, at: at(yesterday, '07:00'), ...runner });
  }
  // ------------------------------------------------------- yesterday's draw
  const forced = seedFor(yesterday, result);
  const schedule = draws.schedule({ drawKey: yesterday, drawAt: at(yesterday, '19:00'), opensAt: at(yesterday, '06:00') });
  operator.openDraw({
    id: `lab-open-${yesterday}`, at: at(yesterday, '05:00'), commitment: forced.commitment, ...schedule
  });

  const players = [];
  for (let i = 1; i <= 12; i++) {
    const playerId = `2317700000${String(i).padStart(2, '0')}`;
    players.push(playerId);
    operator.cashIn({
      id: `lab-in-${playerId}`, at: at(yesterday, '09:00'),
      agentId: RUNNERS[i % RUNNERS.length].agentId, playerId, amountMinor: 300_00
    });
    const shape = BET_SHAPES[i % BET_SHAPES.length];
    operator.placeBet({
      id: `lab-bet-${playerId}`, at: at(yesterday, `10:${String(i).padStart(2, '0')}`),
      betId: `lab-bet-${playerId}`, playerId, drawKey: yesterday, stakeMinor: 20_00, selection: shape
    });
    auth.setPlayerPin({ id: `lab-pin-${playerId}`, at: at(yesterday, '09:01'), playerId, pin: '1234' });
  }

  // A promotional ticket, issued and played, so the campaign has both halves.
  operator.issueFreeTicket({
    id: 'lab-ticket', at: at(yesterday, '09:30'), campaignId: 'welcome',
    ticketId: 'lab-welcome-1', playerId: players[0], faceMinor: 20_00
  });
  operator.redeemFreeTicket({
    id: 'lab-redeem', at: at(yesterday, '10:30'), ticketId: 'lab-welcome-1',
    betId: 'lab-free-bet', drawKey: yesterday, selection: { type: 'oneDigit', digits: result[0] }
  });

  operator.revealDraw({ id: `lab-reveal-${yesterday}`, at: at(yesterday, '19:00'), drawKey: yesterday, seed: forced.seed });
  const settled = operator.settleDraw({
    id: `lab-settle-${yesterday}`, at: at(yesterday, '19:05'), drawKey: yesterday, evaluate
  });

  operator.fundJackpot({
    id: 'lab-jackpot', at: at(yesterday, '19:30'), drawKey: yesterday,
    amountMinor: Math.max(1, Math.round(settled.totalStakes * 0.01))
  });
  const taxable = Math.round(Math.max(0, settled.totalStakes - settled.totalPayout) * 0.15);
  if (taxable > 0) {
    operator.accrueGamingTax({ id: 'lab-tax', at: at(yesterday, '19:45'), amountMinor: taxable });
  }

  // ------------------------------------------------------------ today
  // One runner who cannot reconcile, so the suspension path has a subject.
  // Suspended here rather than earlier because a guard reads the state as it
  // is now, not as it was at the timestamp on the transaction - so suspending
  // before the historical cash-ins are written would refuse them.
  operator.suspendAgent({
    id: 'lab-suspend', at: at(day, '08:00'), agentId: 'ag-paynesville', reason: 'short at close'
  });

  // A player who asked to be excluded, and a player under their own limit.
  operator.excludePlayer({
    id: 'lab-exclude', at: at(day, '07:00'), playerId: players[3], reason: 'requested by the player'
  });
  operator.setPlayerLimit({
    id: 'lab-limit', at: at(day, '07:05'), playerId: players[4], dailyStakeMinor: 50_00
  });

  // A disbursement the provider never answered, so reconciliation has work.
  provider.script('timeout');
  gateway.requestPayout({
    ref: 'lab-payout-stuck', at: at(day, '08:30'), playerId: players[0],
    msisdn: `+${players[0]}`, amountMinor: 100_00, feeMinor: 50
  });
  provider.script('happy');

  // Today's draw, open for betting, with the result already fixed so a tester
  // knows what will happen when they reveal it.
  const today = seedFor(day, result);
  const todaySchedule = draws.schedule({ drawKey: day, drawAt: at(day, '19:00'), opensAt: at(day, '06:00') });
  operator.openDraw({
    id: `lab-open-${day}`, at: at(day, '05:00'), commitment: today.commitment, ...todaySchedule
  });

  return {
    operator, auth, gateway, provider, evaluate,
    day, yesterday, players,
    runners: RUNNERS.map((runner) => runner.agentId),
    draws: {
      // Kept so the harness can hand them to the tester. In production the
      // seed of an unrevealed draw exists nowhere; here it is the point.
      [yesterday]: { ...forced, result, settled: true },
      [day]: { ...today, result, settled: false }
    },
    webhookSecret
  };
}

module.exports = { seed, evaluate, RUNNERS, BET_SHAPES };
