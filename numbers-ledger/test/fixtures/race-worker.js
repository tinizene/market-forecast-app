'use strict';

/**
 * One contender in the concurrency test. Opens the shared database in its own
 * process and tries to spend a runner's float. Prints a single JSON line.
 *
 * Separate processes matter: within one process Node's synchronous SQLite
 * binding serialises everything anyway, which would prove nothing.
 */
const { Operator } = require('../../src/operator.js');
const { SqliteStore } = require('../../src/store/sqlite.js');

const [file, txId, agentId, playerId, amount] = process.argv.slice(2);
const op = new Operator({ store: new SqliteStore(file, { busyTimeoutMs: 10000 }) });

try {
  const result = op.cashIn({
    id: txId,
    at: '2026-08-27T08:00:00Z',
    agentId,
    playerId,
    amountMinor: Number(amount)
  });
  process.stdout.write(JSON.stringify({ ok: true, posted: result.posted }) + '\n');
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, message: error.message }) + '\n');
} finally {
  op.close();
}
