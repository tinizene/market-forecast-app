'use strict';

const { ACCOUNTS, CALLABLE, LIABILITY, parseAccount, signedBalance } = require('./accounts.js');
const { format } = require('./money.js');

/**
 * Operator-level reporting.
 *
 * Everything here is derived from the journal on the way past. Nothing is
 * stored, nothing is cached, and no report reads a running total - which is
 * the only reason a figure in a report can be trusted to mean the same thing
 * as the entries behind it.
 *
 * Three properties are worth stating before the code.
 *
 * **Windows are half-open, [from, to).** A day's close and the next day's
 * cannot both claim the same transaction, and no transaction falls between
 * two reports.
 *
 * **Balances are as at a moment, not as at now.** Last Tuesday's close shows
 * what was owed last Tuesday. A report that quietly used today's balances
 * would look right and be wrong, and the difference is invisible on the page.
 *
 * **Nothing is silently uncategorised.** Where a section buckets transactions
 * by kind, an unrecognised kind lands in `other` and a check fails if `other`
 * is not zero. A new transaction type added later makes the report say so,
 * rather than disappearing from it.
 *
 * The operator's day is UTC, which for Liberia is also the local day.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What each transaction kind means when it moves settlement funds - the
 * operator's real money. Anything touching SETTLEMENT that is not named here
 * is reported as unexplained rather than absorbed.
 */
const CASH_LINES = {
  CAPITAL_INJECTION: 'Capital injected',
  BUY_FLOAT: 'Float sold to runners',
  SELL_FLOAT_BACK: 'Float bought back from runners',
  TOP_UP_WALLET: 'Mobile money received from players',
  CONFIRM_DISBURSEMENT: 'Mobile money paid out',
  WITHDRAW_MOBILE_MONEY: 'Withdrawals paid directly'
};

/** Stakes arrive two ways, and the difference is the whole of decision D6. */
const PAID_STAKE_KINDS = new Set(['PLACE_BET']);
const FREE_STAKE_KINDS = new Set(['REDEEM_FREE_TICKET']);

function assertIso(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be an ISO timestamp, got ${value}`);
  }
  return Date.parse(value);
}

/** 'YYYY-MM-DD' -> the half-open UTC day that contains it. */
function dayWindow(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) {
    throw new TypeError(`day must be YYYY-MM-DD, got ${day}`);
  }
  const start = Date.parse(`${day}T00:00:00.000Z`);
  if (Number.isNaN(start)) throw new TypeError(`Not a real date: ${day}`);
  return { from: new Date(start).toISOString(), to: new Date(start + DAY_MS).toISOString() };
}

class Reports {
  #ledger;

  /**
   * @param {{ledger: object, operator?: object}} deps `operator` is optional and
   *        used only for the draw records behind the per-draw table.
   */
  constructor({ ledger, operator = null }) {
    if (!ledger) throw new TypeError('Reports needs a ledger');
    this.#ledger = ledger;
    this.operator = operator;
  }

  get currency() {
    return this.#ledger.currency;
  }

  #money(minor) {
    return format(minor, this.#ledger.currency);
  }

  /**
   * One pass over the journal, producing everything a statement needs:
   * balances before the window opened, what moved inside it, and balances at
   * the close. Every report below is a reading of this.
   */
  #scan({ from = null, to = null } = {}) {
    const start = from === null ? -Infinity : assertIso(from, 'from');
    const end = to === null ? Infinity : assertIso(to, 'to');
    if (start > end) throw new RangeError('from must not be after to');

    const opening = new Map();   // account -> signed balance before `from`
    const closing = new Map();   // account -> signed balance at `to`
    const moved = new Map();     // account -> {debits, credits}
    const byKind = new Map();    // kind -> {count, accounts: Map}

    const bump = (map, account, debit, credit) => {
      const totals = map.get(account) || { debits: 0, credits: 0 };
      totals.debits += debit;
      totals.credits += credit;
      map.set(account, totals);
    };
    const add = (map, account, delta) => map.set(account, (map.get(account) || 0) + delta);

    for (const tx of this.#ledger.journal) {
      const when = Date.parse(tx.at);
      if (when >= end) continue;

      const inWindow = when >= start;
      let kindRecord = null;
      if (inWindow) {
        kindRecord = byKind.get(tx.kind) || { count: 0, accounts: new Map() };
        kindRecord.count += 1;
        byKind.set(tx.kind, kindRecord);
      }

      for (const entry of tx.entries) {
        const { spec } = parseAccount(entry.account);
        const delta = signedBalance(spec, entry.debit, entry.credit);
        add(closing, entry.account, delta);
        if (!inWindow) {
          add(opening, entry.account, delta);
          continue;
        }
        bump(moved, entry.account, entry.debit, entry.credit);
        add(kindRecord.accounts, entry.account, delta);
      }
    }

    return { start, end, opening, closing, moved, byKind };
  }

  /** Signed movement of one control account across the window, parties rolled up. */
  static #control(map, control) {
    let total = 0;
    for (const [account, value] of map) {
      const name = account.indexOf(':') === -1 ? account : account.slice(0, account.indexOf(':'));
      if (name !== control) continue;
      total += typeof value === 'number' ? value : signedBalance(ACCOUNTS[name], value.debits, value.credits);
    }
    return total;
  }

  /** Same, but keeping each party's share - for a per-campaign or per-runner line. */
  static #byParty(map, control) {
    const out = [];
    for (const [account, value] of map) {
      const { control: name, party, spec } = parseAccount(account);
      if (name !== control || party === null) continue;
      const amount = typeof value === 'number' ? value : signedBalance(spec, value.debits, value.credits);
      if (amount !== 0) out.push({ party, minor: amount });
    }
    return out.sort((a, b) => b.minor - a.minor);
  }

  /** Balances as they stood at a moment, recomputed from the entries. */
  balancesAt(at = null) {
    const { closing } = this.#scan({ to: at });
    const rows = [...closing]
      .filter(([, minor]) => minor !== 0)
      .map(([account, minor]) => ({ account, minor, formatted: this.#money(minor) }))
      .sort((a, b) => a.account.localeCompare(b.account));
    return { at, accounts: rows };
  }

  // -------------------------------------------------------------- daily close

  /**
   * What a day did, and what was owed at the end of it.
   *
   * Handle and gross gaming revenue are about different bets, and the report
   * says so rather than letting the two be added up. A stake taken today is
   * handle today; it becomes revenue on the day its draw settles, which is
   * usually the same day and is not guaranteed to be.
   */
  dailyClose({ day }) {
    const { from, to } = dayWindow(day);
    return { ...this.close({ from, to }), report: 'daily-close', day };
  }

  close({ from = null, to = null } = {}) {
    const scan = this.#scan({ from, to });
    const { moved, opening, closing, byKind } = scan;

    // --- handle: what players staked, and what of it they paid for
    let paidHandle = 0;
    let freeHandle = 0;
    for (const [kind, record] of byKind) {
      const stakes = Reports.#control(record.accounts, 'UNSETTLED_STAKES');
      if (PAID_STAKE_KINDS.has(kind)) paidHandle += stakes;
      if (FREE_STAKE_KINDS.has(kind)) freeHandle += stakes;
    }

    // --- settlement: revenue recognised, prizes credited
    const stakesRecognised = Reports.#control(moved, 'STAKES_REVENUE');
    const prizes = Reports.#control(moved, 'PRIZE_PAYOUTS');
    const jackpotPaid = Reports.#control(moved, 'JACKPOT_POOL') < 0
      ? -Reports.#control(moved, 'JACKPOT_POOL') : 0;
    const ggr = stakesRecognised - prizes;

    // --- costs
    const commission = Reports.#control(moved, 'AGENT_COMMISSION');
    const promo = Reports.#control(moved, 'PROMO_EXPENSE');
    const jackpotFunded = Reports.#control(moved, 'JACKPOT_CONTRIBUTION');
    const fees = Reports.#control(moved, 'TRANSACTION_FEES');
    const tax = Reports.#control(moved, 'GAMING_TAX_EXPENSE');

    // --- real money, split by what caused it. Anything unrecognised is named.
    const cash = [];
    let explained = 0;
    let unexplained = 0;
    for (const [kind, record] of byKind) {
      const delta = Reports.#control(record.accounts, 'SETTLEMENT');
      if (delta === 0) continue;
      if (CASH_LINES[kind]) {
        cash.push({ key: kind, label: CASH_LINES[kind], minor: delta, formatted: this.#money(delta) });
        explained += delta;
      } else {
        unexplained += delta;
      }
    }
    cash.sort((a, b) => b.minor - a.minor);
    if (unexplained !== 0) {
      cash.push({
        key: 'UNEXPLAINED', label: 'Unexplained movement', minor: unexplained,
        formatted: this.#money(unexplained)
      });
    }
    const settlementMoved = Reports.#control(moved, 'SETTLEMENT');

    // --- position at the close, as at the close and not as at now
    const settlementClosing = Reports.#control(closing, 'SETTLEMENT');
    const liabilityRows = CALLABLE.map((control) => ({
      control,
      label: ACCOUNTS[control].label,
      minor: Reports.#control(closing, control),
      formatted: this.#money(Reports.#control(closing, control))
    }));
    const callable = liabilityRows.reduce((sum, row) => sum + row.minor, 0);

    const line = (key, label, minor, note) => ({
      key, label, minor, formatted: this.#money(minor), ...(note ? { note } : {})
    });

    return {
      report: 'close',
      from, to,
      lines: [
        line('paidHandle', 'Stakes taken, paid for', paidHandle),
        line('freeHandle', 'Stakes taken, promotional', freeHandle,
          'The operator received nothing for these. Decision D6 decides whether they are taxed.'),
        line('handle', 'Total handle', paidHandle + freeHandle),

        line('stakesRecognised', 'Stakes recognised as revenue', stakesRecognised,
          'Bets whose draw settled inside this window - not necessarily the bets taken in it.'),
        line('prizes', 'Prizes credited', prizes),
        line('ggr', 'Gross gaming revenue', ggr),

        line('commission', 'Agent commission', commission),
        line('promo', 'Promotional cost', promo),
        line('jackpotFunded', 'Jackpot contribution', jackpotFunded),
        line('fees', 'Transaction fees', fees),
        line('tax', 'Gaming tax accrued', tax),
        line('net', 'After costs', ggr - commission - promo - jackpotFunded - fees - tax),

        line('settlementOpening', 'Settlement funds, opening', Reports.#control(opening, 'SETTLEMENT')),
        line('settlementMoved', 'Settlement funds, movement', settlementMoved),
        line('settlementClosing', 'Settlement funds, closing', settlementClosing),
        line('callable', 'Callable liabilities at close', callable),
        line('headroom', 'Headroom at close', settlementClosing - callable,
          'The operator\'s own capital. Negative means stop selling float.')
      ],
      tables: [
        // `numeric` names the columns that hold amounts. It is metadata for
        // whoever renders this, and the reason a note never ends up
        // right-aligned in a column of money.
        { name: 'Real money movement', columns: ['Cause', 'Amount'], numeric: [1],
          rows: cash.map((row) => [row.label, row.formatted]) },
        { name: 'Owed at the close', columns: ['Liability', 'Amount'], numeric: [1],
          rows: liabilityRows.map((row) => [row.label, row.formatted]) }
      ],
      checks: [
        {
          key: 'cash-explained',
          label: 'Every movement of real money has a named cause',
          ok: unexplained === 0,
          detail: unexplained === 0 ? 'all accounted for' : `${this.#money(unexplained)} unexplained`
        },
        {
          key: 'cash-adds-up',
          label: 'The causes add up to the movement',
          ok: explained + unexplained === settlementMoved,
          detail: `${this.#money(explained + unexplained)} against ${this.#money(settlementMoved)}`
        },
        {
          key: 'solvent',
          label: 'Settlement funds covered callable liabilities at the close',
          ok: settlementClosing >= callable,
          detail: this.#money(settlementClosing - callable)
        },
        {
          key: 'jackpot-paid',
          label: 'Jackpot paid out this period',
          ok: true,
          detail: this.#money(jackpotPaid)
        }
      ],
      totals: {
        paidHandle, freeHandle, handle: paidHandle + freeHandle,
        stakesRecognised, prizes, ggr,
        commission, promo, jackpotFunded, fees, tax,
        settlementOpening: Reports.#control(opening, 'SETTLEMENT'),
        settlementMoved, settlementClosing, callable,
        headroom: settlementClosing - callable
      }
    };
  }

  // ------------------------------------------------------------------ revenue

  /**
   * Gross gaming revenue, and the hold that produced it.
   *
   * The per-draw table comes from the settlement summary each draw records at
   * the moment it settles. The check underneath it is what makes that summary
   * trustworthy: the draws in the window must sum to the journal's own revenue
   * and payout movements, or one of the two is wrong.
   */
  revenue({ from = null, to = null } = {}) {
    const { moved } = this.#scan({ from, to });
    const stakes = Reports.#control(moved, 'STAKES_REVENUE');
    const prizes = Reports.#control(moved, 'PRIZE_PAYOUTS');
    const ggr = stakes - prizes;

    const draws = this.#settledDraws({ from, to });
    const drawStakes = draws.reduce((sum, d) => sum + d.totalStakes, 0);
    const drawPayouts = draws.reduce((sum, d) => sum + d.totalPayout, 0);

    return {
      report: 'revenue',
      from, to,
      lines: [
        { key: 'stakes', label: 'Stakes recognised', minor: stakes, formatted: this.#money(stakes) },
        { key: 'prizes', label: 'Prizes credited', minor: prizes, formatted: this.#money(prizes) },
        { key: 'ggr', label: 'Gross gaming revenue', minor: ggr, formatted: this.#money(ggr) },
        {
          key: 'hold', label: 'Hold', minor: null,
          formatted: stakes === 0 ? '-' : `${(ggr / stakes * 100).toFixed(1)}%`,
          note: 'What the operator kept of every unit staked, over this window only. One draw is not a trend.'
        }
      ],
      tables: [{
        name: 'By draw',
        columns: ['Draw', 'Settled', 'Result', 'Bets', 'Winners', 'Staked', 'Paid', 'Held'],
        numeric: [3, 4, 5, 6, 7],
        rows: draws.map((d) => [
          d.drawKey, d.settledAt, d.result, String(d.betsSettled), String(d.winners),
          this.#money(d.totalStakes), this.#money(d.totalPayout),
          this.#money(d.totalStakes - d.totalPayout)
        ])
      }],
      checks: [
        {
          key: 'draws-reconcile',
          label: 'The draws settled here sum to the journal',
          ok: drawStakes === stakes && drawPayouts === prizes,
          detail: `${this.#money(drawStakes)} / ${this.#money(drawPayouts)} against ` +
            `${this.#money(stakes)} / ${this.#money(prizes)}`
        }
      ],
      totals: { stakes, prizes, ggr, draws: draws.length }
    };
  }

  #settledDraws({ from = null, to = null } = {}) {
    if (!this.operator) return [];
    const start = from === null ? -Infinity : Date.parse(from);
    const end = to === null ? Infinity : Date.parse(to);

    return this.#ledger.listState('draw')
      .map(([drawKey, draw]) => ({ drawKey, ...draw }))
      .filter((draw) => {
        if (!draw.settled || !draw.settledAt) return false;
        const when = Date.parse(draw.settledAt);
        return when >= start && when < end;
      })
      .map((draw) => ({
        drawKey: draw.drawKey, settledAt: draw.settledAt, result: draw.result,
        betsSettled: draw.betsSettled || 0, winners: draw.winners || 0,
        totalStakes: draw.totalStakes || 0, totalPayout: draw.totalPayout || 0
      }))
      .sort((a, b) => (a.settledAt < b.settledAt ? 1 : -1));
  }

  // ---------------------------------------------------------------- tax base

  /**
   * The three numbers a gaming tax could be levied on, side by side, because
   * which one applies is decision D6 and it is not settled.
   *
   * The gap between the first two is the point of the report. If tax is on
   * stakes rather than on gross gaming revenue, a free ticket is taxed on
   * money the operator never received - and at a few points of handle in
   * promotions, tax on nothing is a real line rather than a rounding note.
   */
  taxBase({ from = null, to = null, ratePercent = null } = {}) {
    const closed = this.close({ from, to });
    const { paidHandle, freeHandle, ggr } = closed.totals;
    const { moved, closing } = this.#scan({ from, to });

    const accrued = Reports.#control(moved, 'GAMING_TAX_EXPENSE');
    const payable = Reports.#control(closing, 'GAMING_TAX_PAYABLE');

    // Rounded once, on the integer base, at the end - never on a percentage
    // of a percentage. The base is already in minor units, so this is the
    // only rounding step between a rate and an amount of money.
    const at = (base) => {
      if (ratePercent === null) return null;
      if (typeof ratePercent !== 'number' || !Number.isFinite(ratePercent) || ratePercent < 0) {
        throw new RangeError('ratePercent must be a non-negative number');
      }
      // Floored at zero. A loss-making period does not generate a tax credit
      // in any regime this would plausibly be licensed under; what happens to
      // the loss - carried forward, or lost - is a question for counsel, and
      // showing a negative tax would answer it wrongly and quietly.
      return Math.max(0, Math.round(base * ratePercent / 100));
    };
    const row = (label, base, note) => {
      const tax = at(base);
      const full = base < 0
        ? `${note} This period is negative, so the tax shows as nil: whether the loss carries forward is undecided.`
        : note;
      return {
        label, baseMinor: base, baseFormatted: this.#money(base),
        taxMinor: tax, taxFormatted: tax === null ? '-' : this.#money(tax), note: full
      };
    };

    const bases = [
      row('All stakes', paidHandle + freeHandle,
        'Taxes the promotional tickets too, on money nobody paid.'),
      row('Paid stakes only', paidHandle,
        'Excludes promotional stakes. Whether this is available is the question D6 asks.'),
      row('Gross gaming revenue', ggr,
        'Stakes recognised less prizes credited. Moves with how the draw fell.')
    ];

    return {
      report: 'tax-base',
      from, to,
      ratePercent,
      lines: [
        { key: 'accrued', label: 'Tax accrued this period', minor: accrued, formatted: this.#money(accrued) },
        { key: 'payable', label: 'Tax payable at the close', minor: payable, formatted: this.#money(payable),
          note: 'Accrued and not yet remitted. Not callable by a player, so outside the solvency check.' }
      ],
      tables: [{
        name: 'Candidate bases (decision D6)',
        columns: ['Base', 'Amount', ratePercent === null ? 'Tax' : `Tax at ${ratePercent}%`, 'Note'],
        numeric: [1, 2],
        rows: bases.map((b) => [b.label, b.baseFormatted, b.taxFormatted, b.note])
      }],
      checks: [{
        key: 'promotional-gap',
        label: 'Difference between taxing all stakes and taxing paid stakes',
        ok: true,
        detail: this.#money(freeHandle) + ' of stakes nobody paid for'
      }],
      totals: { accrued, payable, bases }
    };
  }

  // -------------------------------------------------------------- promotions

  /** What each campaign cost, and what of it is still owed. */
  promotions({ from = null, to = null } = {}) {
    const { moved, closing, byKind } = this.#scan({ from, to });

    const campaigns = Reports.#byParty(moved, 'PROMO_EXPENSE');
    const spent = campaigns.reduce((sum, c) => sum + c.minor, 0);
    const outstanding = Reports.#control(closing, 'PROMO_VOUCHERS');
    const issued = byKind.get('ISSUE_FREE_TICKET');
    const redeemed = byKind.get('REDEEM_FREE_TICKET');

    const jackpotFunded = Reports.#control(moved, 'JACKPOT_CONTRIBUTION');
    const jackpotPool = Reports.#control(closing, 'JACKPOT_POOL');

    return {
      report: 'promotions',
      from, to,
      lines: [
        { key: 'spent', label: 'Promotional cost', minor: spent, formatted: this.#money(spent) },
        { key: 'issued', label: 'Free tickets issued', minor: null, formatted: String(issued ? issued.count : 0) },
        { key: 'redeemed', label: 'Free tickets redeemed', minor: null, formatted: String(redeemed ? redeemed.count : 0) },
        { key: 'outstanding', label: 'Unredeemed free tickets at close', minor: outstanding,
          formatted: this.#money(outstanding),
          note: 'A callable liability. Owed whether or not the player paid for it.' },
        { key: 'jackpotFunded', label: 'Jackpot funded this period', minor: jackpotFunded,
          formatted: this.#money(jackpotFunded) },
        { key: 'jackpotPool', label: 'Jackpot pool at close', minor: jackpotPool,
          formatted: this.#money(jackpotPool),
          note: 'Advertised and unwon. Held as a liability so it cannot be spent as profit (F16).' }
      ],
      tables: [{
        name: 'By campaign',
        columns: ['Campaign', 'Cost'],
        numeric: [1],
        rows: campaigns.map((c) => [c.party, this.#money(c.minor)])
      }],
      checks: [{
        key: 'promo-cost-matches',
        label: 'Campaign costs sum to the promotional expense',
        ok: spent === Reports.#control(moved, 'PROMO_EXPENSE'),
        detail: this.#money(spent)
      }],
      totals: { spent, outstanding, jackpotFunded, jackpotPool,
        issued: issued ? issued.count : 0, redeemed: redeemed ? redeemed.count : 0 }
    };
  }

  // ------------------------------------------------------------- liabilities

  /** What is owed, to whom, and whether it is covered - as at a moment. */
  liabilities({ at = null } = {}) {
    const { closing } = this.#scan({ to: at });

    const callableRows = CALLABLE.map((control) => ({
      control, label: ACCOUNTS[control].label,
      minor: Reports.#control(closing, control),
      parties: Reports.#byParty(closing, control).length
    }));
    const callable = callableRows.reduce((sum, row) => sum + row.minor, 0);

    const otherRows = Object.keys(ACCOUNTS)
      .filter((control) => ACCOUNTS[control].class === LIABILITY && !ACCOUNTS[control].callable)
      .map((control) => ({
        control, label: ACCOUNTS[control].label, minor: Reports.#control(closing, control)
      }))
      .filter((row) => row.minor !== 0);

    const settlement = Reports.#control(closing, 'SETTLEMENT');

    return {
      report: 'liabilities',
      at,
      lines: [
        { key: 'settlement', label: 'Settlement funds', minor: settlement, formatted: this.#money(settlement) },
        { key: 'callable', label: 'Callable liabilities', minor: callable, formatted: this.#money(callable) },
        { key: 'headroom', label: 'Headroom', minor: settlement - callable,
          formatted: this.#money(settlement - callable),
          note: 'The operator\'s own capital, not room to spend.' }
      ],
      tables: [
        { name: 'Callable on demand', columns: ['Liability', 'Amount', 'Holders'], numeric: [1, 2],
          rows: callableRows.map((r) => [r.label, this.#money(r.minor), r.parties ? String(r.parties) : '-']) },
        { name: 'Not callable by a player', columns: ['Liability', 'Amount'], numeric: [1],
          rows: otherRows.map((r) => [r.label, this.#money(r.minor)]) }
      ],
      checks: [{
        key: 'solvent',
        label: 'Settlement funds cover everything callable',
        ok: settlement >= callable,
        detail: this.#money(settlement - callable)
      }],
      totals: { settlement, callable, headroom: settlement - callable }
    };
  }
}

// --------------------------------------------------------------------- CSV

/**
 * A report as CSV, so it can leave the screen.
 *
 * A close that only exists in a browser tab is not a report an accountant can
 * work from. Quoting is unconditional and doubles any quote inside a field -
 * a campaign id or a memo containing a comma must not become two columns.
 */
function toCsv(report) {
  const cell = (value) => `"${String(value === null || value === undefined ? '' : value).replace(/"/g, '""')}"`;
  const rows = [];

  rows.push([report.report, report.from || report.at || '', report.to || ''].map(cell).join(','));
  rows.push('');

  if (report.lines && report.lines.length) {
    rows.push(['Line', 'Amount', 'Minor units', 'Note'].map(cell).join(','));
    for (const line of report.lines) {
      rows.push([line.label, line.formatted, line.minor === null || line.minor === undefined ? '' : line.minor,
        line.note || ''].map(cell).join(','));
    }
    rows.push('');
  }

  for (const table of report.tables || []) {
    rows.push(cell(table.name));
    rows.push(table.columns.map(cell).join(','));
    for (const row of table.rows) rows.push(row.map(cell).join(','));
    rows.push('');
  }

  if (report.checks && report.checks.length) {
    rows.push(['Check', 'Result', 'Detail'].map(cell).join(','));
    for (const check of report.checks) {
      rows.push([check.label, check.ok ? 'ok' : 'FAILED', check.detail].map(cell).join(','));
    }
  }

  return rows.join('\r\n');
}

module.exports = { Reports, toCsv, dayWindow, CASH_LINES };
