#!/usr/bin/env node
// Publishes the newest daily FX dashboard report(s) (.html) from the local
// FX-Reports folder into this repo's public `reports/` folder, so they go
// live on Vercel automatically on the next push (Vercel auto-deploys from
// GitHub on every push to the connected branch).
//
// WHY THIS EXISTS: the daily-fx-dashboard task writes fx-dashboard-YYYY-MM-DD.html
// to a local OneDrive folder, not to this git repo — Vercel can only serve
// what's actually committed and pushed here. This script is the bridge: copy
// any not-yet-published report's .html into reports/, update the manifest
// and the always-current reports/latest.html, then git add/commit/push.
//
// ACCESS: the published pages are gated by middleware.js (HTTP Basic Auth) —
// see that file and the README for how to set the shared password.
//
// USAGE: node scripts/publish-report.js <fx-reports-source-dir> [repo-root]
//   fx-reports-source-dir: folder containing fx-dashboard-YYYY-MM-DD.html files
//   repo-root: defaults to the parent of this script's own scripts/ folder

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SOURCE_DIR = process.argv[2];
const ROOT = process.argv[3] ? path.resolve(process.argv[3]) : path.join(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const MANIFEST_PATH = path.join(REPORTS_DIR, 'manifest.json');

if (!SOURCE_DIR) {
  console.error('Usage: node scripts/publish-report.js <fx-reports-source-dir> [repo-root]');
  process.exit(1);
}
if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`Source folder not found: ${SOURCE_DIR}`);
  process.exit(1);
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Could not parse existing manifest.json (${err.message}) — treating as empty.`);
    return [];
  }
}

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

function main() {
  const manifest = loadManifest();
  const alreadyPublished = new Set(manifest);

  const candidates = fs.readdirSync(SOURCE_DIR)
    .filter((f) => /^fx-dashboard-\d{4}-\d{2}-\d{2}\.html$/.test(f))
    .map((f) => f.match(/^fx-dashboard-(\d{4}-\d{2}-\d{2})\.html$/)[1])
    .sort();

  const newDates = candidates.filter((d) => !alreadyPublished.has(d));

  if (newDates.length === 0) {
    console.log('Nothing new to publish — manifest is already up to date with the source folder.');
    return;
  }

  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  for (const date of newDates) {
    const src = path.join(SOURCE_DIR, `fx-dashboard-${date}.html`);
    const dest = path.join(REPORTS_DIR, `${date}.html`);
    fs.copyFileSync(src, dest);
    console.log(`Published ${date} -> reports/${date}.html`);
  }

  const updatedManifest = [...new Set([...manifest, ...newDates])].sort();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(updatedManifest, null, 2) + '\n', 'utf8');

  // reports/latest.html always mirrors the most recently published date, so
  // people can bookmark one stable URL instead of a dated one.
  const newestDate = updatedManifest[updatedManifest.length - 1];
  fs.copyFileSync(path.join(SOURCE_DIR, `fx-dashboard-${newestDate}.html`), path.join(REPORTS_DIR, 'latest.html'));
  console.log(`Updated reports/latest.html -> ${newestDate}`);

  // Commit and push using whatever git identity/credentials are already
  // configured in this environment (same as every other push in this repo).
  run('git', ['add', 'reports']);
  const status = execFileSync('git', ['status', '--porcelain', '--', 'reports'], { cwd: ROOT, encoding: 'utf8' });
  if (!status.trim()) {
    console.log('git status shows no staged changes under reports/ — nothing to commit (unexpected, but not fatal).');
    return;
  }

  const commitMsg = `Publish report(s): ${newDates.join(', ')}`;

  try {
    run('git', ['commit', '-m', commitMsg]);
  } catch (err) {
    console.error(`git commit failed: ${err.message}`);
    console.error('The report files were copied into reports/ and staged, but NOT committed. Fix the git issue, then either re-run this script or commit manually.');
    process.exit(1);
  }

  try {
    run('git', ['push']);
  } catch (err) {
    console.error(`git push failed: ${err.message}`);
    console.error(`The commit "${commitMsg}" succeeded LOCALLY but was NOT pushed — Vercel will not see this update until a successful push happens. Check the git remote/credentials in this environment, then run: git push`);
    process.exit(1);
  }

  console.log(`Committed and pushed: ${commitMsg}`);
}

main();
