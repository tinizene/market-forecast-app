/**
 * Run with: node --test harlem-numbers/game.test.js
 * (Passing the directory does not work: node resolves it as a module path.)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('./game.js');

test('payouts match the advertised table', () => {
  assert.deepEqual(G.quote('straight', 100), { grossCents: 60000, netCents: 54000, cutCents: 6000 });
  assert.deepEqual(G.quote('box6', 100),     { grossCents: 8000,  netCents: 7200,  cutCents: 800 });
  assert.deepEqual(G.quote('box3', 100),     { grossCents: 16000, netCents: 14400, cutCents: 1600 });
  assert.deepEqual(G.quote('front', 100),    { grossCents: 5000,  netCents: 4500,  cutCents: 500 });
  assert.deepEqual(G.quote('oneDigit', 100), { grossCents: 220,   netCents: 198,   cutCents: 22 });
  assert.deepEqual(G.quote('twoDigits', 100),{ grossCents: 1000,  netCents: 900,   cutCents: 100 });
});

test('a fractional multiplier still settles in whole cents', () => {
  // One Digit pays 2.2x, so 7c staked owes 15.4c before the cut.
  assert.deepEqual(G.quote('oneDigit', 7), { grossCents: 15, netCents: 13, cutCents: 2 });
  for (let stake = 1; stake <= 500; stake++) {
    const q = G.quote('oneDigit', stake);
    assert.ok(Number.isInteger(q.grossCents) && Number.isInteger(q.netCents), `stake ${stake}c`);
    assert.equal(q.netCents + q.cutCents, q.grossCents, `stake ${stake}c`);
  }
});

test('net plus cut always reconstructs gross (no rounding leak)', () => {
  for (const type of Object.keys(G.BET_TYPES)) {
    for (const stake of [1, 7, 33, 100, 250, 999, 1000]) {
      const q = G.quote(type, stake);
      assert.equal(q.netCents + q.cutCents, q.grossCents, `${type} @ ${stake}c`);
      assert.ok(Number.isInteger(q.netCents), 'net stays an integer number of cents');
    }
  }
});

test('digit shapes and box combination counts', () => {
  assert.equal(G.digitShape('472'), 'distinct');
  assert.equal(G.digitShape('112'), 'pair');
  assert.equal(G.digitShape('777'), 'triple');
  assert.equal(G.boxCombinations('472'), 6);
  assert.equal(G.boxCombinations('121'), 3);
  assert.equal(G.boxCombinations('777'), 1);
});

test('validation rejects short, empty and non-numeric entries', () => {
  const base = { stakeCents: 100, balanceCents: 10000 };
  assert.equal(G.validateBet({ ...base, type: 'straight', digits: '47' }).code, 'digits');
  assert.equal(G.validateBet({ ...base, type: 'straight', digits: '' }).code, 'digits');
  assert.equal(G.validateBet({ ...base, type: 'front', digits: '4' }).code, 'digits');
  assert.equal(G.validateBet({ ...base, type: 'front', digits: '472' }).code, 'digits');
  assert.equal(G.validateBet({ ...base, type: 'nope', digits: '472' }).code, 'bad-type');
});

test('box bets must match the combination count they pay for', () => {
  const base = { stakeCents: 100, balanceCents: 10000 };
  assert.equal(G.validateBet({ ...base, type: 'box6', digits: '112' }).code, 'box-mismatch');
  assert.equal(G.validateBet({ ...base, type: 'box3', digits: '472' }).code, 'box-mismatch');
  assert.equal(G.validateBet({ ...base, type: 'box6', digits: '777' }).code, 'box-triple');
  assert.equal(G.validateBet({ ...base, type: 'box3', digits: '777' }).code, 'box-triple');
  assert.ok(G.validateBet({ ...base, type: 'box6', digits: '472' }).ok);
  assert.ok(G.validateBet({ ...base, type: 'box3', digits: '112' }).ok);
  assert.ok(G.validateBet({ ...base, type: 'straight', digits: '777' }).ok);
});

test('a bet can never exceed the wallet balance', () => {
  const bet = { type: 'straight', digits: '472', stakeCents: 1000, balanceCents: 999 };
  assert.equal(G.validateBet(bet).code, 'funds');
  assert.ok(G.validateBet({ ...bet, balanceCents: 1000 }).ok);
  assert.equal(G.validateBet({ ...bet, stakeCents: 0, balanceCents: 100 }).code, 'stake');
  assert.equal(G.validateBet({ ...bet, stakeCents: 1.5, balanceCents: 100 }).code, 'stake');
});

test('hit detection per bet type', () => {
  assert.ok(G.isHit({ type: 'straight', digits: '472' }, '472'));
  assert.ok(!G.isHit({ type: 'straight', digits: '427' }, '472'));

  // A box covers every ordering, including the straight one.
  assert.ok(G.isHit({ type: 'box6', digits: '247' }, '472'));
  assert.ok(G.isHit({ type: 'box6', digits: '472' }, '472'));
  assert.ok(!G.isHit({ type: 'box6', digits: '473' }, '472'));
  assert.ok(G.isHit({ type: 'box3', digits: '121' }, '112'));
  assert.ok(!G.isHit({ type: 'box3', digits: '122' }, '112'));

  assert.ok(G.isHit({ type: 'front', digits: '47' }, '472'));
  assert.ok(G.isHit({ type: 'front', digits: '47' }, '479'));
  assert.ok(!G.isHit({ type: 'front', digits: '47' }, '742'));
  assert.ok(!G.isHit({ type: 'straight', digits: '472' }, '47'));
});

test('the odds table matches what isHit actually does, over all 1,000 draws', () => {
  // The advertised chance and the settlement rule are two statements of the
  // same fact. Counting one against the other over the whole outcome space is
  // what stops a payout being priced for odds the game does not have.
  const selections = {
    straight: '472', box6: '472', box3: '112', front: '47', oneDigit: '4', twoDigits: '47'
  };
  for (const [type, digits] of Object.entries(selections)) {
    let wins = 0;
    for (let n = 0; n < 1000; n++) {
      if (G.isHit({ type, digits }, String(n).padStart(3, '0'))) wins++;
    }
    assert.equal(wins, G.winChance(type).wins, `${type} (${digits}) hit ${wins} of 1,000`);
  }
});

test('One Digit and Two Digits hit on position-free matches', () => {
  assert.ok(G.isHit({ type: 'oneDigit', digits: '4' }, '472'));
  assert.ok(G.isHit({ type: 'oneDigit', digits: '2' }, '472'));  // last position counts
  assert.ok(G.isHit({ type: 'oneDigit', digits: '7' }, '777'));
  assert.ok(!G.isHit({ type: 'oneDigit', digits: '5' }, '472'));

  assert.ok(G.isHit({ type: 'twoDigits', digits: '47' }, '472'));
  assert.ok(G.isHit({ type: 'twoDigits', digits: '74' }, '472'));  // order is irrelevant
  assert.ok(G.isHit({ type: 'twoDigits', digits: '47' }, '740'));
  assert.ok(!G.isHit({ type: 'twoDigits', digits: '47' }, '442'));  // needs BOTH
  assert.ok(!G.isHit({ type: 'twoDigits', digits: '47' }, '123'));
});

test('Two Digits refuses a repeated digit', () => {
  const base = { stakeCents: 100, balanceCents: 10000 };
  // 44 would be 'a 4 anywhere' - 271 in 1,000 - paid at 10x. Against the
  // house, not the player, which is why it is validated and not merely priced.
  assert.equal(G.validateBet({ ...base, type: 'twoDigits', digits: '44' }).code, 'two-same');
  assert.ok(G.validateBet({ ...base, type: 'twoDigits', digits: '47' }).ok);
  assert.equal(G.validateBet({ ...base, type: 'twoDigits', digits: '4' }).code, 'digits');
  assert.ok(G.validateBet({ ...base, type: 'oneDigit', digits: '4' }).ok);
  assert.equal(G.validateBet({ ...base, type: 'oneDigit', digits: '47' }).code, 'digits');
  assert.equal(G.validateBet({ ...base, type: 'oneDigit', digits: '' }).code, 'digits');
});

test('settle pays hits, marks misses, and leaves future draws alone', () => {
  const slips = [
    { id: 'a', type: 'straight', digits: '472', drawKey: '2026-08-25', status: 'pending', netPayoutCents: 54000 },
    { id: 'b', type: 'box6',     digits: '247', drawKey: '2026-08-25', status: 'pending', netPayoutCents: 7200 },
    { id: 'c', type: 'straight', digits: '111', drawKey: '2026-08-25', status: 'pending', netPayoutCents: 54000 },
    { id: 'd', type: 'straight', digits: '472', drawKey: '2026-08-26', status: 'pending', netPayoutCents: 54000 },
    { id: 'e', type: 'straight', digits: '472', drawKey: '2026-08-24', status: 'hit',     netPayoutCents: 54000 }
  ];
  const result = G.settle(slips, '2026-08-25', () => '472');

  assert.equal(result.hits, 2);
  assert.equal(result.wonCents, 61200);
  assert.equal(result.settledCount, 3);
  assert.deepEqual(result.slips.map(s => s.status), ['hit', 'hit', 'missed', 'pending', 'hit']);
  // Input array is untouched.
  assert.deepEqual(slips.map(s => s.status), ['pending', 'pending', 'pending', 'pending', 'hit']);
});

test('settle is idempotent - re-running never double-pays', () => {
  const slips = [{ id: 'a', type: 'straight', digits: '472', drawKey: '2026-08-25', status: 'pending', netPayoutCents: 54000 }];
  const first = G.settle(slips, '2026-08-25', () => '472');
  const second = G.settle(first.slips, '2026-08-25', () => '472');
  assert.equal(first.wonCents, 54000);
  assert.equal(second.wonCents, 0);
  assert.equal(second.hits, 0);
});

test('draw times straddle the 19:00 boundary correctly', () => {
  const beforeDraw = new Date(2026, 7, 26, 18, 59, 59);
  const atDraw     = new Date(2026, 7, 26, 19, 0, 0);
  const afterDraw  = new Date(2026, 7, 26, 19, 0, 1);

  assert.equal(G.drawKey(G.nextDrawTime(beforeDraw)), '2026-08-26');
  assert.equal(G.drawKey(G.lastDrawTime(beforeDraw)), '2026-08-25');

  // At exactly 19:00 the draw has happened: it settles today, bets go to tomorrow.
  assert.equal(G.drawKey(G.lastDrawTime(atDraw)), '2026-08-26');
  assert.equal(G.drawKey(G.nextDrawTime(atDraw)), '2026-08-27');

  assert.equal(G.drawKey(G.lastDrawTime(afterDraw)), '2026-08-26');
  assert.equal(G.drawKey(G.nextDrawTime(afterDraw)), '2026-08-27');
});

test('draw times cross month and year boundaries', () => {
  assert.equal(G.drawKey(G.nextDrawTime(new Date(2026, 7, 31, 20, 0, 0))), '2026-09-01');
  assert.equal(G.drawKey(G.lastDrawTime(new Date(2027, 0, 1, 10, 0, 0))), '2026-12-31');
});

test('draw numbers are deterministic, three digits, and spread across the range', () => {
  assert.equal(G.numberForDraw('2026-08-26'), G.numberForDraw('2026-08-26'));
  assert.notEqual(G.numberForDraw('2026-08-26'), G.numberForDraw('2026-08-27'));

  const seen = new Set();
  for (let day = 1; day <= 28; day++) {
    const n = G.numberForDraw(`2026-02-${String(day).padStart(2, '0')}`);
    assert.match(n, /^[0-9]{3}$/);
    seen.add(n);
  }
  assert.ok(seen.size >= 26, `expected near-unique results over a month, got ${seen.size}`);
});

test('formatSelection marks the open digit on a front pair', () => {
  assert.equal(G.formatSelection('front', '47'), '47X');
  assert.equal(G.formatSelection('straight', '472'), '472');
  assert.equal(G.formatSelection('oneDigit', '4'), '4');
  // '+' reads as 'and': neither digit is tied to a position.
  assert.equal(G.formatSelection('twoDigits', '47'), '4+7');
});

test('true odds and expected return per bet type', () => {
  assert.deepEqual(G.winChance('straight'), { wins: 1, outOf: 1000, oneIn: 1000 });
  assert.deepEqual(G.winChance('box6'), { wins: 6, outOf: 1000, oneIn: 1000 / 6 });
  assert.deepEqual(G.winChance('front'), { wins: 10, outOf: 1000, oneIn: 100 });

  // Per $1 staked: every bet on the board returns less than it costs.
  assert.equal(G.expectedReturnCents('straight', 100), 54);
  assert.equal(G.expectedReturnCents('box6', 100), 43);
  assert.equal(G.expectedReturnCents('box3', 100), 43);
  assert.equal(G.expectedReturnCents('front', 100), 45);
  assert.deepEqual(G.winChance('oneDigit'), { wins: 271, outOf: 1000, oneIn: 1000 / 271 });
  assert.deepEqual(G.winChance('twoDigits'), { wins: 54, outOf: 1000, oneIn: 1000 / 54 });
  assert.equal(G.expectedReturnCents('oneDigit', 100), 54);   // level with the straight bet
  assert.equal(G.expectedReturnCents('twoDigits', 100), 49);

  for (const type of Object.keys(G.BET_TYPES)) {
    const ret = G.expectedReturnCents(type, 100);
    assert.ok(ret < 100, `${type} should be a losing proposition on average`);
    // The floor is the point of the new bets: a high-frequency bet has to buy
    // its frequency out of the prize, never out of the player's return. Money
    // Back as originally proposed - stake refunded on 54 draws in 1,000 -
    // returns 5c per dollar and would fail here.
    assert.ok(ret >= 40, `${type} returns only ${ret}c per dollar - far below the rest of the board`);
  }
});

test('no bet type is priced above its own true odds', () => {
  // Net payout x chance must stay under the stake, or the draw funds itself
  // out of the operator's capital. Checked from the table, not from the
  // multipliers, so a future edit to either has to keep them consistent.
  for (const type of Object.keys(G.BET_TYPES)) {
    const chance = G.winChance(type);
    const net = G.quote(type, 10000).netCents;
    assert.ok(net * chance.wins < 10000 * chance.outOf, `${type} pays more than fair odds`);
  }
});
