#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const rng = require('./rng.js');
const { markdown, html } = require('./render-rng.js');

/**
 * Write the RNG description.
 *
 *   node scripts/build-rng-description.js [--out <dir>] [--draws <n>] [--check]
 *
 * The document a laboratory reads before it reads any code, and the one
 * carrying the argument they will find unfamiliar. Every figure is computed
 * from the draw module on the way past; seeds are derived from a counter, so
 * the whole thing reproduces and `--check` can tell whether the mechanism
 * changed and the description did not.
 */

const DEFAULT_OUT = path.resolve(__dirname, '..', 'docs');
const DEFAULT_DRAWS = 1_000_000;
const DEFAULT_PAIRS = 200_000;

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function main() {
  const out = path.resolve(argument('out', DEFAULT_OUT));
  const draws = Number(argument('draws', DEFAULT_DRAWS));
  const pairs = Number(argument('pairs', DEFAULT_PAIRS));
  const check = process.argv.includes('--check');

  const data = rng.compute({ draws, pairs });
  const files = {
    'rng-description.md': markdown(data),
    'rng-description.html': html(data)
  };

  if (check) {
    const stale = Object.entries(files).filter(([name, contents]) => {
      const target = path.join(out, name);
      return !fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== contents;
    });
    if (stale.length === 0) {
      console.log(`RNG description is current. chi-square ${data.sample.uniformity.chiSquare.toFixed(2)} ` +
        `on ${data.sample.uniformity.df} df.`);
      return;
    }
    console.error(`Out of date: ${stale.map(([name]) => name).join(', ')}`);
    console.error('The draw mechanism and its description disagree. Regenerate with: npm run rng');
    process.exit(1);
  }

  fs.mkdirSync(out, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(out, name), contents);
  }

  const { uniformity, positions, serial, correlation } = data.sample;
  const line = (label, value) => console.log(`  ${label.padEnd(22)}${value}`);
  console.log('');
  line('Uniformity', `chi-square ${uniformity.chiSquare.toFixed(2)} on ${uniformity.df} df, ` +
    `p = ${uniformity.pUpper.toFixed(4)}, ${uniformity.empty} outcomes never seen`);
  line('Digit positions', positions.map((position) => position.pUpper.toFixed(3)).join('  '));
  line('Serial (10 x 10)', `chi-square ${serial.chiSquare.toFixed(2)} on ${serial.df} df, p = ${serial.pUpper.toFixed(4)}`);
  line('Serial correlation', `r = ${correlation.r.toExponential(2)}, p = ${correlation.p.toFixed(4)}`);
  line('Seed avalanche', `${data.avalanche.agreed} agreed of ${data.avalanche.draws.toLocaleString('en-US')}, ` +
    `p = ${data.avalanche.p.toFixed(4)}`);
  line('Key separation', `${data.keySeparation.agreed} agreed of ${data.keySeparation.draws.toLocaleString('en-US')}, ` +
    `p = ${data.keySeparation.p.toFixed(4)}`);
  line('Written to', out);
  console.log('');

  // A failure here is not a formatting problem. Say so, and stop.
  // Low in one sample is noise; low in both is the draw mechanism.
  if (data.summary.lowInBoth.length) {
    console.error(`  Low in both samples: ${data.summary.lowInBoth.map((reading) => reading.name).join(', ')}.`);
    console.error('  That is the draw mechanism, not the document. Do not submit this.');
    process.exit(1);
  }
  if (data.summary.low.length) {
    console.log(`  Below 0.05 in the first sample only: ` +
      `${data.summary.low.map((reading) => `${reading.name} (${reading.p.toFixed(4)} / ${reading.confirmP.toFixed(4)})`).join('; ')}`);
    console.log('  Healthy on replication, so noise. Reported on the page rather than hidden.');
    console.log('');
  }
}

if (require.main === module) main();

module.exports = { main, DEFAULT_DRAWS, DEFAULT_PAIRS };
