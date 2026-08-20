#!/usr/bin/env node
//
// Writes the translation work list: every unique English prose string in the course,
// in the order a reader meets it, with the track and lesson it belongs to.
//
// Ordered by reading order rather than alphabetically on purpose — a translator working
// through it sees each string in the context of the lesson around it, which is what
// makes a consistent voice possible. Alphabetical order would scatter one lesson's
// sentences across the whole file.
//
// With --todo <lang>, strings already translated in that overlay are left out, so a
// long translation can be picked up where it stopped without re-reading what is done.
//
// USAGE: node scripts/extract-course-strings.js [track] [--todo <lang>] > worklist.json

const fs = require('fs');
const path = require('path');
const { keyOf, walkProse, TRACKS } = require('./lib/course-i18n');

const COURSE = path.join(__dirname, '..', 'data', 'course');

function main() {
  const args = process.argv.slice(2);
  const todoAt = args.indexOf('--todo');
  const lang = todoAt >= 0 ? args[todoAt + 1] : null;
  const only = args.find((a, i) => !a.startsWith('--') && (todoAt < 0 || i !== todoAt + 1));
  const tracks = only ? [only] : TRACKS;

  const done = new Set();
  if (lang) {
    const overlayPath = path.join(COURSE, 'i18n', `${lang}.json`);
    if (fs.existsSync(overlayPath)) {
      const raw = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
      const strings = raw.strings || raw;
      for (const [k, v] of Object.entries(strings)) if (v && v[lang]) done.add(k);
    }
  }

  const seen = new Set();
  const out = [];

  for (const track of tracks) {
    const payload = JSON.parse(fs.readFileSync(path.join(COURSE, `${track}.json`), 'utf8'));
    const push = (s) => {
      const k = keyOf(s);
      if (seen.has(k)) return;      // the same sentence is translated once
      seen.add(k);
      if (done.has(k)) return;      // --todo: already translated in this locale
      out.push({ key: k, track, en: s });
    };
    walkProse({ trackTitle: payload.trackTitle, trackTagline: payload.trackTagline }, push);
    for (const lesson of payload.lessons) {
      const before = out.length;
      walkProse(lesson, push);
      for (let i = before; i < out.length; i++) out[i].lesson = lesson.id;
    }
  }

  process.stdout.write(JSON.stringify(out, null, 1) + '\n');
  const words = out.reduce((n, e) => n + e.en.split(/\s+/).length, 0);
  process.stderr.write(`  ${out.length} unique strings, ${words.toLocaleString()} words\n`);
}

main();
