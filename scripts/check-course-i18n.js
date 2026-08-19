#!/usr/bin/env node
//
// Gate for the translated course content.
//
// A machine translation is fluent by construction, which is exactly what makes it
// dangerous: a dropped digit or an inverted figure reads as smoothly as the correct
// sentence, and a proofreader checking language will not necessarily catch it. So this
// checks the things fluency hides, and leaves the language itself to the human:
//
//   • every number in the English survives into the translation — the course teaches
//     position sizing and compounding with worked arithmetic, and "invest $400" becoming
//     "invest $40" is a factual error the reader would act on
//   • currency and percent markers survive, for the same reason
//   • no entry is orphaned — an orphan means the English was edited after translation,
//     so that translation is now of a sentence nobody will read, and the live one has
//     silently reverted to English
//   • no translation is byte-identical to its English, unless it is on the keep-as-is
//     list (Forex_Course_Glossary.md documents that Swahili trading vocabulary often
//     keeps the English term, so identical is sometimes correct and sometimes a stub)
//   • coverage, reported per track, so partial progress is a number rather than a claim
//
// USAGE: node scripts/check-course-i18n.js
//        node scripts/check-course-i18n.js --strict   (untranslated strings fail too)

const fs = require('fs');
const path = require('path');
const { keyOf, walkProse, numbersIn, symbolsIn, TRACKS } = require('./lib/course-i18n');

const COURSE = path.join(__dirname, '..', 'data', 'course');
const OVERLAY_DIR = path.join(COURSE, 'i18n');
const STRICT = process.argv.includes('--strict');

const problems = [];
const note = (m) => problems.push(m);

function main() {
  if (!fs.existsSync(OVERLAY_DIR)) { console.log('  no translation overlays'); return; }
  const langs = fs.readdirSync(OVERLAY_DIR).filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
  if (!langs.length) { console.log('  no translation overlays'); return; }

  // Every English string currently in the course, and where it lives.
  const live = new Map();
  for (const track of TRACKS) {
    const p = path.join(COURSE, `${track}.json`);
    if (!fs.existsSync(p)) continue;
    const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
    walkProse(payload, (s) => { if (!live.has(keyOf(s))) live.set(keyOf(s), { track, en: s }); });
  }

  for (const lang of langs) {
    const raw = JSON.parse(fs.readFileSync(path.join(OVERLAY_DIR, `${lang}.json`), 'utf8'));
    const strings = raw.strings || raw;
    // Object (key -> why) since the reason matters to a reviewer; an array is still
    // accepted so an older overlay does not have to be rewritten to be checked.
    const keepRaw = raw.keepAsIs || {};
    const keepAsIs = new Set(Array.isArray(keepRaw) ? keepRaw : Object.keys(keepRaw));

    let translated = 0;
    for (const [key, entry] of Object.entries(strings)) {
      if (!live.has(key)) {
        note(`${lang}: orphaned entry ${key} — the English it translates is no longer in the course` +
             `\n      was: ${JSON.stringify(String(entry.en || '').slice(0, 80))}`);
        continue;
      }
      const en = live.get(key).en;
      if (entry.en !== en) {
        note(`${lang}: ${key} stores English that does not match the course — the overlay was hand-edited`);
      }
      if (!entry.sw || !String(entry.sw).trim()) continue;
      translated++;

      const enNums = numbersIn(en).join(',');
      const swNums = numbersIn(entry.sw).join(',');
      if (enNums !== swNums) {
        note(`${lang}: ${key} numbers changed in translation` +
             `\n      en: [${enNums}]\n      ${lang}: [${swNums}]` +
             `\n      ${JSON.stringify(en.slice(0, 90))}`);
      }
      if (symbolsIn(en) !== symbolsIn(entry.sw)) {
        note(`${lang}: ${key} currency/percent markers changed` +
             `\n      en: "${symbolsIn(en)}"  ${lang}: "${symbolsIn(entry.sw)}"` +
             `\n      ${JSON.stringify(en.slice(0, 90))}`);
      }
      if (entry.sw === en && !keepAsIs.has(key)) {
        note(`${lang}: ${key} is identical to the English — if that is deliberate, list it in "keepAsIs"` +
             `\n      ${JSON.stringify(en.slice(0, 90))}`);
      }
    }

    // Coverage, counted over occurrences rather than unique strings, because that is
    // what a reader experiences on the page.
    for (const track of TRACKS) {
      const p = path.join(COURSE, `${track}.json`);
      if (!fs.existsSync(p)) continue;
      const payload = JSON.parse(fs.readFileSync(p, 'utf8'));
      let hit = 0, miss = 0;
      walkProse(payload, (s) => {
        const e = strings[keyOf(s)];
        if (e && e.sw) hit++; else miss++;
      });
      const pct = hit + miss ? Math.round((hit / (hit + miss)) * 100) : 0;
      console.log(`  ${lang}  ${track.padEnd(11)} ${String(pct).padStart(3)}%  ${hit}/${hit + miss} strings`);
      if (STRICT && miss) note(`${lang}: ${track} has ${miss} untranslated string(s)`);
    }
    console.log(`  ${lang}: ${translated}/${live.size} unique strings translated`);
  }

  if (problems.length) {
    console.error(`\n${problems.length} course-translation problem(s):`);
    problems.forEach((p) => console.error(`  ✗ ${p}`));
    process.exit(1);
  }
  console.log('\ncourse translations consistent');
}

main();
