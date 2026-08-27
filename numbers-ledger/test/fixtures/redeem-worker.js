'use strict';

/** Contender for the voucher double-redemption race. See race-worker.js. */
const { Operator } = require('../../src/operator.js');
const { SqliteStore } = require('../../src/store/sqlite.js');

const [file, txId, voucherId, playerId] = process.argv.slice(2);
const op = new Operator({ store: new SqliteStore(file, { busyTimeoutMs: 10000 }) });

try {
  const result = op.redeemVoucher({ id: txId, at: '2026-08-27T08:00:00Z', voucherId, playerId });
  process.stdout.write(JSON.stringify({ ok: true, posted: result.posted }) + '\n');
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, message: error.message }) + '\n');
} finally {
  op.close();
}
