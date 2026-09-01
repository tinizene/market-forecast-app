#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { buildManifest, serialise, verifyManifest, shortId } = require('../src/manifest.js');

/**
 * Write the build manifest.
 *
 * Run this at release, commit the result, and hand the build id to whoever
 * needs to know which software was certified.
 *
 *   node bin/build-manifest.js [--root <dir>] [--out <file>] [--check]
 *
 * `--check` writes nothing and exits non-zero if the manifest on disk is not
 * the one this tree would produce - which is the form for continuous
 * integration, where the question is "did somebody change a runtime file and
 * forget to regenerate".
 */

const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_OUT = path.resolve(__dirname, '..', 'MANIFEST.json');

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function main() {
  const base = path.resolve(argument('root', DEFAULT_ROOT));
  const out = path.resolve(argument('out', DEFAULT_OUT));
  const check = process.argv.includes('--check');

  const manifest = buildManifest({ base });
  const rendered = serialise(manifest);

  if (check) {
    if (!fs.existsSync(out)) {
      console.error(`No manifest at ${out}. Run without --check to write one.`);
      process.exit(1);
    }
    const onDisk = JSON.parse(fs.readFileSync(out, 'utf8'));
    if (onDisk.buildId === manifest.buildId && onDisk.sections.evidence.digest === manifest.sections.evidence.digest) {
      console.log(`Manifest is current. Build ${shortId(manifest.buildId)}`);
      return;
    }
    console.error('The manifest on disk does not match this tree.');
    console.error(`  runtime  on disk ${shortId(onDisk.buildId)}   here ${shortId(manifest.buildId)}`);
    console.error(`  evidence on disk ${shortId(onDisk.sections.evidence.digest)}   here ${shortId(manifest.sections.evidence.digest)}`);
    console.error('Regenerate it with: npm run manifest');
    process.exit(1);
  }

  fs.writeFileSync(out, rendered);

  // Verify what was just written, against the tree it was written from. A
  // manifest nobody checked is a file, not evidence.
  const verified = verifyManifest({ base, manifest });
  console.log('');
  console.log(`  Build           ${manifest.buildId}`);
  console.log(`  Evidence        ${manifest.sections.evidence.digest}`);
  console.log(`  Runtime files   ${manifest.sections.runtime.files.length}`);
  console.log(`  Evidence files  ${manifest.sections.evidence.files.length}`);
  console.log(`  Written to      ${out}`);
  console.log(`  Self-check      ${verified.ok ? 'passed' : 'FAILED'}`);
  console.log('');
  if (!verified.ok) {
    for (const problem of verified.problems) console.error(`  ${problem.kind}  ${problem.path}`);
    process.exit(1);
  }
}

main();
