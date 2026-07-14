#!/usr/bin/env node
// Copies the self-contained "Institutional FX Dashboard & Intelligence Report" HTML
// file(s) your daily-fx-dashboard scheduled task already writes to your FX-Reports
// folder (fx-dashboard-YYYY-MM-DD.html, alongside the .md/.pdf versions) into this
// app's data/daily-dashboard/ directory, so daily-report.html can serve them.
//
// Deliberately does NOT parse or restructure the HTML at all — unlike
// scripts/parse-fx-report.js (which extracts the markdown into structured JSON for
// fx-intelligence.html's card-based rendering), this script keeps the report exactly
// as generated: same inline CSS, same Chart.js gauges, byte-for-byte. daily-report.html
// renders it in an <iframe> for that reason.
//
// Usage:
//   node scripts/sync-daily-dashboard.js <input.html> [outputDir]
//   node scripts/sync-daily-dashboard.js <folderOfHtmlFiles> [outputDir]
//
// A folder argument processes every fx-dashboard-*.html file found directly inside it
// (non-recursive) — handy for a one-time backfill or for pointing straight at the
// FX-Reports folder. Re-running on an already-synced date safely overwrites with the
// same content (idempotent).
//
// Writes <outputDir>/history/<date>.html and updates <outputDir>/latest.html +
// <outputDir>/index.json — same three-artifact shape as parse-fx-report.js uses for
// data/fx-reports/, so both pipelines are easy to reason about side by side.

const fs = require('fs');
const path = require('path');

const FILENAME_DATE_RE = /fx-dashboard-(\d{4}-\d{2}-\d{2})\.html?$/i;

function dateKeyFor(filePath) {
  const base = path.basename(filePath);
  const m = base.match(FILENAME_DATE_RE);
  if (m) return m[1];
  // Fallback: try to pull a date out of the <title>...July 13, 2026...</title> text.
  const html = fs.readFileSync(filePath, 'utf8');
  const titleMatch = html.match(/<title>[^<]*?(\w+ \d{1,2},\s*\d{4})[^<]*<\/title>/i);
  if (titleMatch) {
    const d = new Date(titleMatch[1]);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  // Last resort: today, so nothing is ever silently dropped.
  return new Date().toISOString().slice(0, 10);
}

function syncOne(inputPath, outputDir) {
  const dateKey = dateKeyFor(inputPath);
  const html = fs.readFileSync(inputPath, 'utf8');

  const historyDir = path.join(outputDir, 'history');
  fs.mkdirSync(historyDir, { recursive: true });
  fs.writeFileSync(path.join(historyDir, `${dateKey}.html`), html);

  const indexPath = path.join(outputDir, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch { index = []; }
  }
  if (!index.includes(dateKey)) index.push(dateKey);
  index.sort();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  // latest.html always mirrors whichever date sorts last, not just "whatever we
  // synced most recently" — matters if a folder backfill is processed out of order.
  const mostRecent = index[index.length - 1];
  fs.copyFileSync(path.join(historyDir, `${mostRecent}.html`), path.join(outputDir, 'latest.html'));

  console.log(`Synced ${path.basename(inputPath)} -> ${dateKey}.html`);
  return dateKey;
}

function main() {
  const [, , inputArg, outputDirArg] = process.argv;
  if (!inputArg) {
    console.error('Usage: node sync-daily-dashboard.js <input.html|folder> [outputDir]');
    process.exit(1);
  }
  const outputDir = outputDirArg || path.join(__dirname, '..', 'data', 'daily-dashboard');

  const stat = fs.statSync(inputArg);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(inputArg)
      .filter((f) => /^fx-dashboard-\d{4}-\d{2}-\d{2}\.html?$/i.test(f))
      .sort();
    if (!files.length) {
      console.error(`No fx-dashboard-*.html files found in ${inputArg}`);
      process.exit(1);
    }
    files.forEach((f) => syncOne(path.join(inputArg, f), outputDir));
  } else {
    syncOne(inputArg, outputDir);
  }
}

if (require.main === module) main();

module.exports = { syncOne, dateKeyFor };
