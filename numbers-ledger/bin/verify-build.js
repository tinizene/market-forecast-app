#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { verifyManifest, shortId } = require('../src/manifest.js');

/**
 * Check that the software here is the software the manifest describes.
 *
 *   node bin/verify-build.js [--root <dir>] [--manifest <file>] [--json]
 *
 * Read-only, so it is safe to run against a live production host without
 * stopping anything - which is the case it exists for: an inspector standing
 * at a terminal asking whether this machine is running the certified build.
 *
 * Exit code 0 means yes. Anything else means a person has to look.
 *
 * One thing this cannot do is vouch for itself. It is inside the manifest it
 * checks, so a tampered copy would report success. The manifest's digest format
 * is deliberately the one `sha256sum` prints, so an inspector who trusts none
 * of this can reproduce the same number with coreutils; the command is printed
 * below on request and documented in the README.
 */

const DEFAULT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_MANIFEST = path.resolve(__dirname, '..', 'MANIFEST.json');

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const LABELS = {
  changed: 'CHANGED    ',
  missing: 'MISSING    ',
  unexpected: 'UNEXPECTED ',
  forbidden: 'FORBIDDEN  '
};

function main() {
  const base = path.resolve(argument('root', DEFAULT_ROOT));
  const manifestPath = path.resolve(argument('manifest', DEFAULT_MANIFEST));
  const asJson = process.argv.includes('--json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`No manifest at ${manifestPath}`);
    process.exit(2);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const result = verifyManifest({ base, manifest });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log('');
  console.log(`  Manifest        ${manifestPath}`);
  console.log(`  Root            ${base}`);
  console.log(`  Certified build ${manifest.buildId}`);
  console.log(`  Generated       ${manifest.generatedAt}`);
  console.log('');
  for (const [name, section] of Object.entries(result.sections)) {
    console.log(`  ${name.padEnd(9)} ${section.matches ? 'matches' : 'DOES NOT MATCH'}`);
    if (!section.matches) console.log(`            found ${shortId(section.actual)}, expected ${shortId(section.expected)}`);
  }

  if (result.ok) {
    console.log('');
    console.log(`  This tree is build ${shortId(manifest.buildId)}. Nothing has changed, nothing is missing,`);
    console.log('  nothing unlisted is present, and no forbidden capability is named.');
    console.log('');
    return;
  }

  console.log('');
  console.log(`  ${result.problems.length} problem(s):`);
  console.log('');
  for (const problem of result.problems) {
    const detail = problem.kind === 'forbidden'
      ? `names "${problem.symbol}"`
      : (problem.kind === 'changed' ? `${shortId(problem.expected)} -> ${shortId(problem.actual)}` : '');
    console.log(`  ${LABELS[problem.kind] || problem.kind} ${problem.path}  ${detail}`);
  }
  console.log('');
  console.log('  This tree is NOT the certified build.');
  console.log('');
  process.exit(1);
}

main();
