#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { compute } = require('./math.js');
const { markdown, html } = require('./render-math-sheet.js');

/**
 * Write the math sheet.
 *
 *   node scripts/build-math-sheet.js [--out <dir>] [--samples <n>] [--check]
 *
 * Two renderings from one computation: markdown for the repository, HTML for
 * handing to somebody who should not have to read a diff to read a table.
 * `--check` writes nothing and exits non-zero if either file on disk differs
 * from what this tree would produce - the form for continuous integration,
 * where the question is whether a payout changed and the sheet did not.
 *
 * Deliberately not in `bin/`. This produces evidence, it is not the product,
 * and a documentation generator should not be able to change the build id.
 */

const DEFAULT_OUT = path.resolve(__dirname, '..', 'docs');
const DEFAULT_SAMPLES = 1_000_000;

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function main() {
  const out = path.resolve(argument('out', DEFAULT_OUT));
  const samples = Number(argument('samples', DEFAULT_SAMPLES));
  const check = process.argv.includes('--check');

  const data = compute({ samples });
  const files = {
    'math-sheet.md': markdown(data),
    'math-sheet.html': html(data)
  };

  if (check) {
    const stale = Object.entries(files).filter(([name, contents]) => {
      const target = path.join(out, name);
      return !fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== contents;
    });
    if (stale.length === 0) {
      console.log(`Math sheet is current. ${data.rows.length} bet types, all counts uniform.`);
      return;
    }
    console.error(`Out of date: ${stale.map(([name]) => name).join(', ')}`);
    console.error('The game rules and the math sheet disagree. Regenerate with: npm run mathsheet');
    process.exit(1);
  }

  fs.mkdirSync(out, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(out, name), contents);
  }

  const u = data.uniformity;
  console.log('');
  for (const row of data.rows) {
    console.log(
      `  ${row.label.padEnd(11)} ${String(row.wins).padStart(4)} / ${data.outcomes}` +
      `   pays ${String(row.multiplier).padStart(5)}x` +
      `   return ${row.rtp.toFixed(5)}` +
      `   hold ${((1 - row.rtp) * 100).toFixed(3)}%` +
      `   ${row.uniform ? 'uniform' : 'NOT UNIFORM'}`
    );
  }
  console.log('');
  console.log(`  Uniformity   chi-square ${u.chiSquare.toFixed(2)} on ${u.df} df, p = ${u.p.toFixed(4)} ` +
    `over ${u.samples.toLocaleString('en-US')} draws`);
  console.log(`  Written to   ${out}`);
  console.log('');

  if (data.rows.some((row) => !row.uniform)) {
    console.error('  A bet type does not win the same number of times for every selection.');
    console.error('  Some selections are mispriced. Do not submit this.');
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { main, DEFAULT_SAMPLES };
