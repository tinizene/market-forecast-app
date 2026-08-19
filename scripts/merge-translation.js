#!/usr/bin/env node
//
// Merges a { key: "translation" } batch into a course overlay, attaching the English
// each key refers to so the overlay stays reviewable and drift stays detectable.
//
// Refuses a key that is not in the current course: that means either a typo or an
// English string that has since been edited, and silently accepting it is how an
// overlay fills up with translations of sentences nobody will ever read.
//
// USAGE: node scripts/merge-translation.js <lang> <batch.json>

const fs = require('fs');
const path = require('path');
const { keyOf, walkProse, TRACKS } = require('./lib/course-i18n');

const COURSE = path.join(__dirname, '..', 'data', 'course');

function main() {
  const [lang, batchPath] = process.argv.slice(2);
  if (!lang || !batchPath) { console.error('usage: merge-translation.js <lang> <batch.json>'); process.exit(2); }

  const live = new Map();
  for (const track of TRACKS) {
    const p = path.join(COURSE, `${track}.json`);
    if (!fs.existsSync(p)) continue;
    walkProse(JSON.parse(fs.readFileSync(p, 'utf8')), (s) => { if (!live.has(keyOf(s))) live.set(keyOf(s), s); });
  }

  const overlayPath = path.join(COURSE, 'i18n', `${lang}.json`);
  const overlay = fs.existsSync(overlayPath)
    ? JSON.parse(fs.readFileSync(overlayPath, 'utf8'))
    : { strings: {}, keepAsIs: [] };
  overlay.strings = overlay.strings || {};

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  let added = 0, replaced = 0;
  const unknown = [];

  // A batch may declare, as "__keepAsIs": { "<key>": "why" }, that leaving a string in
  // English is the correct translation — the glossary documents that East African
  // trading vocabulary keeps terms like stop-loss and ETF. The reason is stored rather
  // than just the exemption, so a proofreader can see the decision and disagree with it
  // rather than wondering whether it was an oversight.
  overlay.keepAsIs = overlay.keepAsIs || {};
  if (Array.isArray(overlay.keepAsIs)) overlay.keepAsIs = {};
  for (const [key, why] of Object.entries(batch.__keepAsIs || {})) {
    if (!live.has(key)) { unknown.push(key); continue; }
    overlay.keepAsIs[key] = why;
  }
  delete batch.__keepAsIs;

  for (const [key, translation] of Object.entries(batch)) {
    if (!live.has(key)) { unknown.push(key); continue; }
    if (overlay.strings[key]) replaced++; else added++;
    overlay.strings[key] = { en: live.get(key), [lang]: translation };
  }

  if (unknown.length) {
    console.error(`  refusing ${unknown.length} key(s) not present in the course: ${unknown.slice(0, 5).join(', ')}`);
    process.exit(1);
  }

  // Sorted so a diff of the overlay is readable rather than ordered by insertion.
  const sorted = {};
  for (const k of Object.keys(overlay.strings).sort()) sorted[k] = overlay.strings[k];
  overlay.strings = sorted;
  const keep = {};
  for (const k of Object.keys(overlay.keepAsIs).sort()) keep[k] = overlay.keepAsIs[k];
  overlay.keepAsIs = keep;

  fs.writeFileSync(overlayPath, JSON.stringify(overlay, null, 1) + '\n');
  console.log(`  ${lang}: +${added} new, ${replaced} replaced — ${Object.keys(overlay.strings).length}/${live.size} total`);
}

main();
