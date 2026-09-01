#!/usr/bin/env node
'use strict';

const http = require('node:http');
const path = require('node:path');

const { createLab, createControlServer, controlKey, CONTROL_ROUTES } = require('../harness.js');
const { label } = require('../../src/build.js');

/**
 * Start the laboratory environment.
 *
 *   npm run lab
 *
 * Two servers on two ports. The first is the product, composed exactly as
 * production composes it. The second is the control surface, which exists only
 * in this directory and only in this process.
 *
 *   LAB_PORT      product, default 8890
 *   LAB_CONTROL   control, default 8891
 *   LAB_DAY       the day the fixture book is dated, default 2026-09-01
 *   LAB_RESULT    the number yesterday's draw landed on, default 417
 */

const PORT = Number(process.env.LAB_PORT || 8890);
const CONTROL_PORT = Number(process.env.LAB_CONTROL || 8891);
const HOST = process.env.LAB_HOST || '127.0.0.1';

function main() {
  const lab = createLab({
    day: process.env.LAB_DAY || '2026-09-01',
    result: process.env.LAB_RESULT || '417'
  });
  const key = controlKey();

  // The product server reads the app freshly on every request, so a reset
  // swaps the whole book underneath without restarting anything.
  const product = http.createServer((req, res) => lab.current.app.listener(req, res));
  const control = createControlServer(lab, { key });

  product.listen(PORT, HOST, () => control.listen(CONTROL_PORT, HOST, announce));

  function announce() {
    const credentials = lab.credentials();
    const line = (label_, value) => console.log(`  ${label_.padEnd(18)}${value}`);

    console.log('');
    console.log('  AFRICA NUMBERS - LABORATORY ENVIRONMENT');
    console.log('  This is not production. Outcomes can be chosen here.');
    console.log('');
    line('Console', `http://${HOST}:${PORT}/console`);
    line('Product API', `http://${HOST}:${PORT}`);
    line('Control API', `http://${HOST}:${CONTROL_PORT}`);
    line('Control key', key);
    console.log('');
    line('Build', label());
    line('Book dated', lab.day);
    line('Storage', 'IN MEMORY - a restart is a reset');
    line('Mobile money', 'SIMULATED - no real money can move');
    line('Transport', 'plain HTTP on loopback');
    console.log('');
    line('Operator token', credentials.operatorToken);
    line('Runner token', `${credentials.agentToken}  (${credentials.agentId})`);
    line('Player PIN', `1234, for all ${credentials.players.length} players`);
    line('First player', credentials.players[0].playerId);
    line('Webhook secret', credentials.webhookSecret);
    console.log('');
    console.log('  Control surface - send x-lab-key with every call:');
    for (const route of CONTROL_ROUTES) console.log(`    ${route}`);
    console.log('');
    console.log(`  Reading: ${path.resolve(__dirname, '..', 'README.md')}`);
    console.log('');
  }

  const stop = () => {
    control.close();
    product.close(() => {
      lab.current.operator.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();
