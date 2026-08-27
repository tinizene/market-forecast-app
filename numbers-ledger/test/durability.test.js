'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { Operator } = require('../src/operator.js');
const { SqliteStore } = require('../src/store/sqlite.js');
const { ACCOUNTS } = require('../src/accounts.js');
const { openTestDraw, payTo } = require('./helpers.js');

const AT = '2026-08-27T08:00:00Z';

function tempDb(t) {
  const dir = mkdtempSync(join(tmpdir(), 'numbers-ledger-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'ledger.db');
}

function openOperator(file) {
  return new Operator({ store: new SqliteStore(file) });
}

test('the books survive a restart', (t) => {
  const file = tempDb(t);

  let op = openOperator(file);
  op.injectCapital({ id: 'cap-1', at: AT, amountMinor: 500_000_00 });
  op.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: 9_500_00, floatMinor: 10_000_00 });
  op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 250_00 });
  const draw = openTestDraw(op, { drawKey: 'D1', at: '2026-08-27T00:00:00Z' });
  op.placeBet({ id: 'bet-1', at: AT, betId: 'b1', playerId: 'p-1', drawKey: 'D1', stakeMinor: 100_00 });

  const before = {
    snapshot: op.ledger.snapshot(),
    solvency: op.ledger.solvency(),
    size: op.ledger.size
  };
  op.close();

  // A new process would do exactly this: open the same file and carry on.
  op = openOperator(file);
  assert.deepEqual(op.ledger.snapshot(), before.snapshot, 'balances came back');
  assert.deepEqual(op.ledger.solvency(), before.solvency);
  assert.equal(op.ledger.size, before.size);

  // And the non-balance state came back too, so the draw can still settle.
  // The draw was opened and bet on before the restart; it reveals and settles after.
  op.revealDraw({ id: 'rv-1', at: '2026-08-27T19:00:00Z', drawKey: 'D1', seed: draw.seed });
  const result = op.settleDraw({ id: 's-1', at: '2026-08-27T19:01:00Z', drawKey: 'D1', evaluate: payTo({ b1: 54_000_00 }) });
  assert.equal(result.posted, true);
  assert.equal(result.totalStakes, 100_00);
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 150_00 + 54_000_00);
  op.close();
});

test('idempotency survives a restart', (t) => {
  const file = tempDb(t);

  let op = openOperator(file);
  op.injectCapital({ id: 'cap-1', at: AT, amountMinor: 100_00 });
  op.close();

  // The retry arrives after the process bounced - the id guard is in the data,
  // not in memory, so it still holds.
  op = openOperator(file);
  const retry = op.injectCapital({ id: 'cap-1', at: AT, amountMinor: 100_00 });
  assert.equal(retry.posted, false);
  assert.equal(retry.duplicate, true);
  assert.equal(op.ledger.balance('SETTLEMENT'), 100_00);
  op.close();
});

test('a rejected guard writes nothing durable', (t) => {
  const file = tempDb(t);

  let op = openOperator(file);
  op.injectCapital({ id: 'cap-1', at: AT, amountMinor: 1_000_00 });
  op.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  assert.throws(
    () => op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_01 }),
    /cannot sell/
  );
  const size = op.ledger.size;
  op.close();

  op = openOperator(file);
  assert.equal(op.ledger.size, size, 'the failed attempt left no row behind');
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-1'), 0);
  assert.equal(op.ledger.trialBalance().balanced, true);

  // The id was never consumed, so a corrected retry can reuse it.
  const ok = op.cashIn({ id: 'in-1', at: AT, agentId: 'ag-1', playerId: 'p-1', amountMinor: 100_00 });
  assert.equal(ok.posted, true);
  op.close();
});

test('the balance cache never drifts from the entries', (t) => {
  const file = tempDb(t);
  const store = new SqliteStore(file);
  const op = new Operator({ store });

  op.injectCapital({ id: 'cap-1', at: AT, amountMinor: 1_000_000_00 });
  op.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: 9_500_00, floatMinor: 10_000_00 });
  for (let i = 0; i < 40; i++) {
    op.cashIn({ id: `in-${i}`, at: AT, agentId: 'ag-1', playerId: `p-${i % 7}`, amountMinor: 50_00 });
  }
  op.issueVoucher({ id: 'v-1', at: AT, agentId: 'ag-1', voucherId: 'VC-1', amountMinor: 500_00 });
  op.redeemVoucher({ id: 'vr-1', at: AT, voucherId: 'VC-1', playerId: 'p-1' });

  assert.deepEqual(store.verify(), [], 'cached balances match a full recomputation');

  // Independent check straight off the journal, as a second opinion.
  const rebuilt = new Map();
  for (const record of op.ledger.journal) {
    for (const entry of record.entries) {
      const totals = rebuilt.get(entry.account) || { debits: 0, credits: 0 };
      totals.debits += entry.debit;
      totals.credits += entry.credit;
      rebuilt.set(entry.account, totals);
    }
  }
  for (const [account, totals] of rebuilt) {
    const spec = ACCOUNTS[account.split(':')[0]];
    const expected = spec.class === 'ASSET' || spec.class === 'EXPENSE'
      ? totals.debits - totals.credits
      : totals.credits - totals.debits;
    assert.equal(op.ledger.balance(account), expected, `${account} disagrees with its entries`);
  }
  op.close();
});

test('a voucher cannot be redeemed twice across a restart', (t) => {
  const file = tempDb(t);

  let op = openOperator(file);
  op.injectCapital({ id: 'cap-1', at: AT, amountMinor: 100_000_00 });
  op.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: 10_000_00, floatMinor: 10_000_00 });
  op.issueVoucher({ id: 'v-1', at: AT, agentId: 'ag-1', voucherId: 'VC-1', amountMinor: 500_00 });
  op.redeemVoucher({ id: 'vr-1', at: AT, voucherId: 'VC-1', playerId: 'p-1' });
  op.close();

  op = openOperator(file);
  assert.throws(
    () => op.redeemVoucher({ id: 'vr-2', at: AT, voucherId: 'VC-1', playerId: 'p-2' }),
    /already redeemed/
  );
  assert.equal(op.ledger.balance('PLAYER_WALLET:p-2'), 0);
  op.close();
});
