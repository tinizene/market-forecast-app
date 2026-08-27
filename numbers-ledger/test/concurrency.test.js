'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { Operator } = require('../src/operator.js');
const { SqliteStore } = require('../src/store/sqlite.js');

const AT = '2026-08-27T08:00:00Z';
const WORKER = join(__dirname, 'fixtures', 'race-worker.js');

function tempDb(t) {
  const dir = mkdtempSync(join(tmpdir(), 'numbers-ledger-race-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'ledger.db');
}

function runWorker(file, txId, agentId, playerId, amount) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', WORKER, file, txId, agentId, playerId, String(amount)]);
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.on('close', () => {
      try { resolve(JSON.parse(out.trim())); }
      catch { resolve({ ok: false, message: `worker produced no result: ${out.trim()}` }); }
    });
  });
}

test('concurrent processes cannot overdraw a runner', { timeout: 60000 }, async (t) => {
  const file = tempDb(t);

  const setup = new Operator({ store: new SqliteStore(file) });
  setup.injectCapital({ id: 'cap-1', at: AT, amountMinor: 1_000_000_00 });
  // Exactly enough float for ONE of the contenders below.
  setup.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: 100_00, floatMinor: 100_00 });
  setup.close();

  const contenders = 8;
  const results = await Promise.all(
    Array.from({ length: contenders }, (_, i) =>
      runWorker(file, `race-${i}`, 'ag-1', `p-${i}`, 100_00)
    )
  );

  const winners = results.filter((r) => r.ok && r.posted);
  const losers = results.filter((r) => !r.ok);

  assert.equal(winners.length, 1, `exactly one should win, got ${winners.length}: ${JSON.stringify(results)}`);
  assert.equal(losers.length, contenders - 1);
  for (const loser of losers) {
    assert.match(loser.message, /cannot sell/, `losers should fail the guard, not the database: ${loser.message}`);
  }

  const after = new Operator({ store: new SqliteStore(file) });
  assert.equal(after.agentStatement('ag-1').floatMinor, 0, 'float spent exactly once, never negative');
  assert.equal(after.ledger.trialBalance().balanced, true);
  assert.equal(after.ledger.equation().holds, true);
  assert.equal(after.ledger.solvency().ok, true);
  assert.deepEqual(after.ledger.store.verify(), [], 'no cache drift after a contended write');
  after.close();
});

test('concurrent processes cannot double-redeem one voucher', { timeout: 60000 }, async (t) => {
  const file = tempDb(t);

  const setup = new Operator({ store: new SqliteStore(file) });
  setup.injectCapital({ id: 'cap-1', at: AT, amountMinor: 1_000_000_00 });
  setup.buyFloat({ id: 'buy-1', at: AT, agentId: 'ag-1', paidMinor: 10_000_00, floatMinor: 10_000_00 });
  setup.issueVoucher({ id: 'v-1', at: AT, agentId: 'ag-1', voucherId: 'VC-1', amountMinor: 500_00 });
  setup.close();

  const worker = join(__dirname, 'fixtures', 'redeem-worker.js');
  const run = (txId, playerId) => new Promise((resolve) => {
    const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', worker, file, txId, 'VC-1', playerId]);
    let out = '';
    child.stdout.on('data', (c) => { out += c; });
    child.on('close', () => {
      try { resolve(JSON.parse(out.trim())); } catch { resolve({ ok: false, message: out.trim() }); }
    });
  });

  const results = await Promise.all([run('r-1', 'p-1'), run('r-2', 'p-2'), run('r-3', 'p-3'), run('r-4', 'p-4')]);
  assert.equal(results.filter((r) => r.ok && r.posted).length, 1, JSON.stringify(results));

  const after = new Operator({ store: new SqliteStore(file) });
  assert.equal(after.ledger.balance('UNREDEEMED_VOUCHERS'), 0, 'the voucher was consumed exactly once');
  const credited = ['p-1', 'p-2', 'p-3', 'p-4'].filter((p) => after.ledger.balance(`PLAYER_WALLET:${p}`) > 0);
  assert.equal(credited.length, 1, 'only one player was credited');
  assert.equal(after.ledger.trialBalance().balanced, true);
  after.close();
});

test('a write transaction excludes another writer while it is open', (t) => {
  const file = tempDb(t);

  const a = new SqliteStore(file);
  const b = new SqliteStore(file, { busyTimeoutMs: 50 });

  const setup = new Operator({ store: a });
  setup.injectCapital({ id: 'cap-1', at: AT, amountMinor: 100_00 });

  // Hold A's write lock open and try to write from B underneath it.
  let blocked = null;
  a.transaction(() => {
    try {
      b.transaction((view) => view.append({
        id: 'x', kind: 'T', at: AT, memo: null,
        entries: [{ account: 'SETTLEMENT', control: 'SETTLEMENT', debit: 1, credit: 0 }]
      }));
      blocked = false;
    } catch (error) {
      blocked = error.message;
    }
  });

  assert.notEqual(blocked, false, 'a second writer must not get in while the lock is held');
  assert.equal(a.journal().length, 1, 'and it wrote nothing');
  a.close();
  b.close();
});
