#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const events = require('./events.js');
const { markdown, html } = require('./render-events.js');

/**
 * Write the significant events catalogue.
 *
 *   node scripts/build-events-catalogue.js [--out <dir>] [--check]
 *
 * Three disagreements stop a release, and they are the three ways a catalogue
 * written by hand goes wrong: an event kind the code can write and the page
 * does not list, a kind the page lists and the code cannot write, and a kind
 * the page files under the wrong record.
 */

const DEFAULT_OUT = path.resolve(__dirname, '..', 'docs');

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function report(data) {
  if (data.undocumented.length) {
    console.error(`  In the code and not in the catalogue: ${data.undocumented.join(', ')}`);
    console.error('  Add an entry in scripts/events.js saying what it means and why it matters.');
  }
  if (data.stale.length) {
    console.error(`  In the catalogue and not in the code: ${data.stale.join(', ')}`);
  }
  for (const entry of data.misfiled) {
    console.error(`  ${entry.kind} is catalogued as "${entry.catalogued}" and is written as "${entry.actual}".`);
  }
}

function main() {
  const out = path.resolve(argument('out', DEFAULT_OUT));
  const check = process.argv.includes('--check');
  const data = events.reconcile();

  if (!data.ok) {
    report(data);
    process.exit(1);
  }

  const files = {
    'events-catalogue.md': markdown(data),
    'events-catalogue.html': html(data)
  };

  if (check) {
    const stale = Object.entries(files).filter(([name, contents]) => {
      const target = path.join(out, name);
      return !fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== contents;
    });
    if (stale.length === 0) {
      console.log(`Events catalogue is current. ${data.counts.catalogued} kinds, all observed.`);
      return;
    }
    console.error(`Out of date: ${stale.map(([name]) => name).join(', ')}`);
    console.error('Regenerate with: npm run events');
    process.exit(1);
  }

  fs.mkdirSync(out, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(out, name), contents);
  }

  console.log('');
  console.log(`  Catalogued      ${data.counts.catalogued}`);
  console.log(`  In the code     ${data.counts.inCode}`);
  console.log(`  Observed        ${data.counts.exercised}`);
  console.log(`  Transactions    ${data.counts.journal}`);
  console.log(`  Events          ${data.counts.events}`);
  if (data.unexercised.length) console.log(`  Not exercised   ${data.unexercised.join(', ')}`);
  console.log(`  Written to      ${out}`);
  console.log('');
}

if (require.main === module) main();

module.exports = { main };
