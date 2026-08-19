#!/usr/bin/env node
//
// Applies each translation overlay in data/course/i18n/ to the English lesson JSON,
// producing data/course/<track>.<lang>.json — the files api/course.js serves when a
// reader asks for that language, falling back per track to English where one is absent.
//
// Run after editing an overlay, and after scripts/build-course-data.js (which rebuilds
// the English these are derived from).
//
// USAGE: node scripts/build-course-i18n.js

const fs = require('fs');
const path = require('path');
const { applyOverlay, TRACKS } = require('./lib/course-i18n');

const COURSE = path.join(__dirname, '..', 'data', 'course');
const OVERLAY_DIR = path.join(COURSE, 'i18n');

function main() {
  if (!fs.existsSync(OVERLAY_DIR)) { console.log('  no overlays'); return; }
  const langs = fs.readdirSync(OVERLAY_DIR).filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
  if (!langs.length) { console.log('  no overlays'); return; }

  for (const lang of langs) {
    const raw = JSON.parse(fs.readFileSync(path.join(OVERLAY_DIR, `${lang}.json`), 'utf8'));
    const overlay = raw.strings || raw;
    let done = 0, todo = 0;

    for (const track of TRACKS) {
      const src = path.join(COURSE, `${track}.json`);
      if (!fs.existsSync(src)) continue;
      const payload = JSON.parse(fs.readFileSync(src, 'utf8'));
      const stats = { translated: 0, untranslated: 0 };
      const translated = applyOverlay(payload, overlay, stats);
      // Marks the payload so the client can tell "translated" from "fell back", rather
      // than having to guess from the text.
      translated.lang = lang;
      translated.translationCoverage = stats.translated + stats.untranslated
        ? Math.round((stats.translated / (stats.translated + stats.untranslated)) * 100) : 0;
      const out = path.join(COURSE, `${track}.${lang}.json`);
      fs.writeFileSync(out, JSON.stringify(translated));
      done += stats.translated; todo += stats.untranslated;
      const kb = (fs.statSync(out).size / 1024).toFixed(0);
      console.log(`  ${track}.${lang}.json  ${String(translated.translationCoverage).padStart(3)}% translated  ${kb.padStart(4)} KB`);
    }
    const pct = done + todo ? Math.round((done / (done + todo)) * 100) : 0;
    console.log(`  ${lang}: ${done}/${done + todo} strings (${pct}%)`);
  }
}

main();
