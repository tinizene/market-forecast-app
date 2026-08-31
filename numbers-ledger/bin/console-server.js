#!/usr/bin/env node
'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const { Operator } = require('../src/operator.js');
const { SqliteStore } = require('../src/store/sqlite.js');
const { Auth } = require('../src/http/auth.js');
const { createApp } = require('../src/http/app.js');
const { MobileMoneyGateway } = require('../src/mobilemoney/gateway.js');
const { SimulatedProvider } = require('../src/mobilemoney/simulator.js');

// The rules live in one place. The service is handed them; it does not keep a
// second copy of the payout table that can disagree with the first.
const game = require('../../africa-numbers/game.js');

/**
 * The composition root: the one file that decides which real thing goes behind
 * each seam, and the only way to actually run any of this.
 *
 * Everything alarming about a default run is printed at startup rather than
 * discovered later. A console that looks the same whether the money is real or
 * simulated is a console somebody will eventually be wrong about.
 *
 *   NUMBERS_DB        path to a SQLite file. Omit and the whole book is
 *                     in memory and gone when this process exits.
 *   NUMBERS_PORT      default 8787
 *   NUMBERS_HOST      default 127.0.0.1 - loopback, because this has no TLS
 *   WEBHOOK_SECRET    shared secret for provider callbacks
 *   NUMBERS_AUDIT     path to an append-only JSONL audit log. Omit and calls
 *                     are not recorded, which a licensed operation cannot do.
 */

const PORT = Number(process.env.NUMBERS_PORT || 8787);
const HOST = process.env.NUMBERS_HOST || '127.0.0.1';
const DB = process.env.NUMBERS_DB || null;

/** payout in minor units, or 0. The ledger asks; the game answers. */
function evaluate(bet, result) {
  const selection = bet.selection;
  if (!selection || !selection.type || !selection.digits) return 0;
  if (!game.isHit(selection, result)) return 0;
  return game.quote(selection.type, bet.stakeMinor).netCents;
}

function main() {
  const store = DB ? new SqliteStore(path.resolve(DB)) : null;
  const operator = new Operator(store ? { store } : {});
  const provider = new SimulatedProvider();
  const gateway = new MobileMoneyGateway({ operator, provider });
  const auth = new Auth({
    ledger: operator.ledger,
    webhookSecret: process.env.WEBHOOK_SECRET || null
  });
  // One line per call, appended and never rewritten. A file is the right shape
  // for this: it is what a log shipper reads, what an auditor can be handed,
  // and what nothing in this process can go back and edit.
  const auditPath = process.env.NUMBERS_AUDIT || null;
  const auditStream = auditPath ? fs.createWriteStream(path.resolve(auditPath), { flags: 'a' }) : null;
  const audit = auditStream ? (entry) => auditStream.write(`${JSON.stringify(entry)}\n`) : null;

  const app = createApp({
    operator, gateway, auth, evaluate, audit, logger: (e) => console.error(e)
  });

  // A fresh token every start. Nothing stores the plaintext, so this line is
  // the only place it exists - which is also why it is not written to a file.
  const token = auth.issueToken({
    id: `boot-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    kind: 'operator',
    subject: process.env.USER || 'staff',
    roles: ['operator']
  });

  const server = http.createServer(app.listener);
  server.listen(PORT, HOST, () => {
    console.log('');
    console.log(`  Operator console   http://${HOST}:${PORT}/console`);
    console.log(`  Operator token     ${token}`);
    console.log('');
    console.log(`  Storage            ${DB ? path.resolve(DB) : 'IN MEMORY - everything is lost on exit'}`);
    console.log('  Mobile money       SIMULATED - no real money can move');
    console.log(`  Webhook signatures ${process.env.WEBHOOK_SECRET ? 'enabled' : 'DISABLED - callbacks will be refused'}`);
    console.log(`  Audit log          ${auditPath ? path.resolve(auditPath) : 'OFF - no record of who called what'}`);
    console.log('  Transport          plain HTTP on loopback. Do not expose this port.');
    console.log('');
  });

  const stop = () => {
    server.close(() => {
      operator.close();
      if (auditStream) auditStream.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();
