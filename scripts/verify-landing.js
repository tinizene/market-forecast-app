#!/usr/bin/env node
// Guard for the landing page's figures and its product shot.
//
// index.html is a marketing surface, which is exactly where a number goes stale
// quietly: nobody re-reads the hero after adding a lesson. Every figure on that page
// is therefore derived from something authoritative, and this check re-derives it.
//
//   data/course/manifest.json  ->  lessons, tracks, the free track's size
//   i18n.js LANGUAGES          ->  how many languages are actually offered
//   data/course/forex.json     ->  every word in the hero's product shot
//
// The shot claims to be Forex Chapter 1, Lesson 6. If it is going to claim that, it
// has to still BE that: same lesson number, same title, same definition, same key
// idea. Otherwise the hero is a drawing of a product rather than a picture of one.
//
//   node scripts/verify-landing.js        # exits 1 on any drift
//   node scripts/verify-landing.js --all  # also print what passed

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');

const problems = [];
const passes = [];
function check(name, actual, expected) {
  const a = String(actual);
  const e = String(expected);
  if (a === e) passes.push(`${name}: ${a}`);
  else problems.push(`${name}: page says ${JSON.stringify(a)}, source says ${JSON.stringify(e)}`);
}
function checkStartsWith(name, whole, prefix) {
  if (String(whole).startsWith(String(prefix))) passes.push(`${name}`);
  else problems.push(`${name}: ${JSON.stringify(prefix)} is not how the course text begins\n      course: ${JSON.stringify(String(whole).slice(0, 120))}`);
}

// ---- what the page claims ------------------------------------------------

const html = fs.readFileSync(HTML, 'utf8');

function figures() {
  const out = {};
  const re = /data-fig="([a-z-]+)"[^>]*>([^<]*)</g;
  let m;
  while ((m = re.exec(html))) out[m[1]] = m[2].trim();
  return out;
}

function textOf(re, label) {
  const m = html.match(re);
  if (!m) { problems.push(`${label}: not found in index.html — the shot's markup changed shape`); return null; }
  return m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---- what is actually true -----------------------------------------------

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/course/manifest.json'), 'utf8'));
const byTrack = Object.fromEntries(manifest.map((t) => [t.track, t]));
const totalLessons = manifest.reduce((a, t) => a + t.lessons, 0);
const freeLessons = manifest.filter((t) => t.free).reduce((a, t) => a + t.lessons, 0);

// i18n.js is the single declaration of what is offered; "preview" languages are
// reachable by ?lang= but advertised nowhere, so they must not be counted here.
const i18nJs = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
const langBlock = i18nJs.match(/var LANGUAGES\s*=\s*\[([\s\S]*?)\];/);
if (!langBlock) { console.error('verify-landing: cannot find LANGUAGES in i18n.js'); process.exit(1); }
const offered = [...langBlock[1].matchAll(/code:\s*'([a-z-]+)'[^}]*?available:\s*(true|false)/g)]
  .filter((m) => m[2] === 'true').map((m) => m[1]);

// ---- the figure strip and the track cards --------------------------------

const fig = figures();
check('strip: lessons', fig.lessons, totalLessons);
check('strip: tracks', fig.tracks, manifest.length);
check('strip: free lessons', fig.free, freeLessons);
check('strip: languages offered', fig.languages, offered.length);
for (const t of ['foundation', 'forex', 'stocks', 'crypto']) {
  check(`card: ${t} lessons`, fig[`lessons-${t}`], byTrack[t].lessons);
}
// The hero's eyebrow repeats the free-track figure; it must not drift from the strip.
const eyebrow = textOf(/<b><span class="lp-fig">([^<]*)<\/span>/, 'hero eyebrow figure');
if (eyebrow !== null) check('hero: free lessons', eyebrow, freeLessons);

// ---- the product shot is a real lesson -----------------------------------

const forex = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/course/forex.json'), 'utf8'));
const lesson = forex.lessons.find((l) => l.id === 'leverage-and-margin');
if (!lesson) {
  problems.push('shot: forex.json no longer has a lesson with id "leverage-and-margin"');
} else {
  check('shot: title', textOf(/<h5>([^<]*)<\/h5>/, 'shot title'), lesson.title);
  check('shot: crumb', textOf(/<p class="lp-crumb">([^<]*)<\/p>/, 'shot crumb'),
    `Chapter ${lesson.chapterNumber} · Lesson ${lesson.lessonNumber}`);
  check('shot: key idea', textOf(/<div class="lp-callout"><strong>[^<]*<\/strong>\s*([^<]*)<\/div>/, 'shot key idea'), lesson.keyIdea);

  const def = (lesson.blocks || []).find((b) => b.type === 'definition' && b.term === 'Leverage');
  if (!def) problems.push('shot: forex.json lesson no longer defines the term "Leverage"');
  else checkStartsWith('shot: lede is the real definition', def.text, textOf(/<p class="lp-lede">([^<]*)<\/p>/, 'shot lede'));

  // The citation chip quotes a figure the lesson teaches. Both halves have to be there.
  const body = JSON.stringify(lesson);
  const src = textOf(/<span class="lp-src">([^<]*)<\/span>/, 'shot citation');
  for (const needle of ['ESMA', '74–89%']) {
    if (src && !src.includes(needle)) problems.push(`shot citation: does not mention ${needle}`);
    else if (!body.includes(needle)) problems.push(`shot citation: ${needle} is not in Forex Ch${lesson.chapterNumber} L${lesson.lessonNumber} — the hero cites a figure the lesson does not make`);
    else passes.push(`shot citation: ${needle} appears in the lesson`);
  }

  // Every sidebar row must be a real neighbouring lesson, in order.
  const side = html.match(/<div class="lp-shot-side" data-chapter="(\d+)">([\s\S]*?)<\/div>/);
  if (!side) problems.push('shot sidebar: not found — markup changed shape');
  else {
    const chapter = +side[1];
    const rows = [...side[2].matchAll(/<p(?: class="(?:on|off)")?>(\d+) · ([^<]*)<\/p>/g)]
      .map((m) => ({ n: +m[1], title: m[2].replace(/&amp;/g, '&').trim() }));
    if (rows.length < 3) problems.push('shot sidebar: fewer than 3 lesson rows found — markup changed shape');
    for (const row of rows) {
      const real = forex.lessons.find((l) => l.lessonNumber === row.n && l.chapterNumber === chapter);
      if (!real) problems.push(`shot sidebar: Forex Ch${chapter} has no lesson ${row.n}`);
      else checkStartsWith(`shot sidebar: Ch${chapter} lesson ${row.n}`, real.title, row.title);
    }
    if (!rows.some((r) => r.n === lesson.lessonNumber) || chapter !== lesson.chapterNumber) {
      problems.push('shot sidebar: does not contain the lesson the main pane is showing');
    }
  }
}

// ---- report ---------------------------------------------------------------

if (process.argv.includes('--all')) passes.forEach((p) => console.log(`  ok    ${p}`));
if (problems.length) {
  console.error(`\n${problems.length} landing-page problem(s):`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  console.error('\nThe page states a figure its source does not. Fix the page, or the source moved and the page must follow.');
  process.exit(1);
}
console.log(`\n${passes.length} landing-page figures verified against the course data`);
