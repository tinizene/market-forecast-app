'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Ledger } = require('../src/ledger.js');

const AT = '2026-08-27T08:00:00Z';
const tx = (over = {}) => ({
  id: 't1', kind: 'TEST', at: AT,
  entries: [{ account: 'SETTLEMENT', debit: 100 }, { account: 'OPERATOR_CAPITAL', credit: 100 }],
  ...over
});

test('a balanced transaction posts and moves both accounts', () => {
  const l = new Ledger();
  const { posted } = l.post(tx());
  assert.equal(posted, true);
  assert.equal(l.balance('SETTLEMENT'), 100);
  assert.equal(l.balance('OPERATOR_CAPITAL'), 100);
  assert.equal(l.trialBalance().balanced, true);
});

test('an unbalanced transaction is rejected whole', () => {
  const l = new Ledger();
  assert.throws(
    () => l.post(tx({ entries: [{ account: 'SETTLEMENT', debit: 100 }, { account: 'OPERATOR_CAPITAL', credit: 99 }] })),
    /does not balance/
  );
  assert.equal(l.size, 0, 'nothing is written on rejection');
  assert.equal(l.balance('SETTLEMENT'), 0);
});

test('replaying the same transaction id is a no-op, not a double posting', () => {
  const l = new Ledger();
  assert.equal(l.post(tx()).posted, true);
  assert.equal(l.post(tx()).posted, false);
  assert.equal(l.post(tx({ entries: [{ account: 'SETTLEMENT', debit: 999 }, { account: 'OPERATOR_CAPITAL', credit: 999 }] })).posted, false);
  assert.equal(l.balance('SETTLEMENT'), 100, 'the retry changed nothing');
  assert.equal(l.size, 1);
});

test('amounts must be positive integers of minor units', () => {
  const l = new Ledger();
  const bad = (amount) => () => l.post(tx({ entries: [{ account: 'SETTLEMENT', debit: amount }, { account: 'OPERATOR_CAPITAL', credit: amount }] }));
  assert.throws(bad(10.5), /integer/);
  assert.throws(bad(0), /positive/);
  assert.throws(bad(-5), /positive/);
  assert.throws(bad(Number.MAX_SAFE_INTEGER + 10), /safe integer|integer/);
});

test('an entry cannot be both a debit and a credit, or neither', () => {
  const l = new Ledger();
  assert.throws(() => l.post(tx({ entries: [{ account: 'SETTLEMENT', debit: 1, credit: 1 }, { account: 'OPERATOR_CAPITAL', credit: 1 }] })), /exactly one/);
  assert.throws(() => l.post(tx({ entries: [{ account: 'SETTLEMENT' }, { account: 'OPERATOR_CAPITAL', credit: 1 }] })), /exactly one/);
});

test('account ids are validated, including partitioning', () => {
  const l = new Ledger();
  const post = (account) => () => l.post(tx({ entries: [{ account, debit: 1 }, { account: 'OPERATOR_CAPITAL', credit: 1 }] }));
  assert.throws(post('NOT_AN_ACCOUNT'), /Unknown account/);
  assert.throws(post('AGENT_FLOAT'), /requires a party id/);
  assert.throws(post('SETTLEMENT:oops'), /does not take a party id/);
  assert.throws(post('AGENT_FLOAT:bad id!'), /Invalid party id/);
});

test('transactions need an id, a kind and a real timestamp', () => {
  const l = new Ledger();
  assert.throws(() => l.post(tx({ id: '' })), /needs an id/);
  assert.throws(() => l.post(tx({ kind: undefined })), /needs a kind/);
  assert.throws(() => l.post(tx({ at: 'not-a-date' })), /ISO timestamp/);
  assert.throws(() => l.post(tx({ entries: [{ account: 'SETTLEMENT', debit: 1 }] })), /at least two lines/);
});

test('control balances roll partitions up, and parties are listed', () => {
  const l = new Ledger();
  l.post({ id: 'a', kind: 'T', at: AT, entries: [{ account: 'SETTLEMENT', debit: 300 }, { account: 'AGENT_FLOAT:ag-1', credit: 300 }] });
  l.post({ id: 'b', kind: 'T', at: AT, entries: [{ account: 'SETTLEMENT', debit: 200 }, { account: 'AGENT_FLOAT:ag-2', credit: 200 }] });
  assert.equal(l.balance('AGENT_FLOAT:ag-1'), 300);
  assert.equal(l.controlBalance('AGENT_FLOAT'), 500);
  assert.deepEqual(l.parties('AGENT_FLOAT'), ['ag-1', 'ag-2']);
});

test('the journal is append-only and its records are frozen', () => {
  const l = new Ledger();
  l.post(tx());
  const [record] = l.journal;
  assert.throws(() => { record.id = 'tampered'; }, TypeError);
  assert.throws(() => { record.entries[0].debit = 999; }, TypeError);
  l.journal.push({ fake: true });
  assert.equal(l.size, 1, 'the returned journal is a copy');
});

test('solvency compares settlement funds against callable liabilities only', () => {
  const l = new Ledger();
  l.post({ id: 'cap', kind: 'T', at: AT, entries: [{ account: 'SETTLEMENT', debit: 1000 }, { account: 'OPERATOR_CAPITAL', credit: 1000 }] });
  assert.equal(l.solvency().ok, true);
  assert.equal(l.solvency().headroom, 1000);

  // Owing a player is callable; owing tax is not.
  l.post({ id: 'w', kind: 'T', at: AT, entries: [{ account: 'SETTLEMENT', debit: 400 }, { account: 'PLAYER_WALLET:p1', credit: 400 }] });
  assert.equal(l.solvency().callable, 400);
  assert.equal(l.solvency().headroom, 1000);

  l.post({ id: 'tax', kind: 'T', at: AT, entries: [{ account: 'GAMING_TAX_EXPENSE', debit: 50 }, { account: 'GAMING_TAX_PAYABLE', credit: 50 }] });
  assert.equal(l.solvency().callable, 400, 'tax payable is not callable in real money by a player');
});

test('issuing float against no capital is caught as a shortfall', () => {
  // 500 of float granted for 450 paid: 50 of value the operator never received.
  const l = new Ledger();
  l.post({
    id: 'f', kind: 'BUY_FLOAT', at: AT,
    entries: [
      { account: 'SETTLEMENT', debit: 450 },
      { account: 'AGENT_COMMISSION', debit: 50 },
      { account: 'AGENT_FLOAT:ag-1', credit: 500 }
    ]
  });
  const s = l.solvency();
  assert.equal(s.ok, false);
  assert.equal(s.headroom, -50, 'short by exactly the commission granted');
});
