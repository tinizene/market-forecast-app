#!/usr/bin/env node
// Guard: the live UI states no colour of its own.
//
// This app had no light theme for a simple reason. Its colours were not in the
// stylesheet — they were 322 Tailwind utility classes (text-slate-400, bg-slate-900,
// border-slate-700 and 51 others) written into the markup, which the CDN bundle
// resolves to fixed hex. No amount of token work reaches those, so the theme could
// not exist until they moved. They have moved. This stops them coming back.
//
// Two things are checked:
//   1. No live UI file names a colour directly — no Tailwind colour utility, no raw
//      hex or rgb() outside the places listed below.
//   2. Every page still applies the theme before first paint and loads theme.js.
//      A page that misses the inline block flashes dark on every navigation for a
//      light-theme reader, which is the kind of bug that survives review because it
//      is invisible to whoever is already on dark.
//
//   node scripts/check-theme-tokens.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index.html', 'learn.html', 'lesson.html', 'track.html', 'research.html', 'privacy-policy.html'];
const SCRIPTS = ['app.js', 'learn.js', 'research.js', 'legend.js', 'nav.js', 'ui.js', 'progress.js',
  'theme.js', 'data/course/src/forex-content.js', 'data/course/src/crypto-content.js',
  'data/course/src/stocks-svgs.js', 'data/course/src/crypto-svgs-ch456.js'];

// styles.css is where colour belongs; theme.js only ever reads it back. The SVG
// diagram library in learn.js is authored art with its own ground baked in — those
// illustrations are not restyled by a theme, they are framed as figures, so their
// hexes are content rather than interface.
const COLOUR_UTILITY = /\b(bg|text|border|from|to|via|decoration|ring|placeholder|divide)-(slate|gray|zinc|neutral|stone|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|red|rose|pink|fuchsia|purple|violet|indigo|white|black)(-\d{2,3})?(\/\d{1,3})?\b/g;
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)/g;

const problems = [];
const checked = { diagrams: 0 };

// Nothing is exempt any more. The 83 lesson diagrams used to be, because they were
// authored art with a dark ground baked in; they are drawn through tokens now, so a
// literal in one is the same regression as a literal anywhere else.
function svgFreeSource(file, src) { return src; }

for (const file of [...PAGES, ...SCRIPTS]) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const raw = fs.readFileSync(full, 'utf8');
  const src = svgFreeSource(file, raw);

  const utilities = [...new Set(src.match(COLOUR_UTILITY) || [])];
  if (utilities.length) {
    problems.push(`${file}: ${utilities.length} hard-coded colour utility class(es): ${utilities.slice(0, 6).join(', ')}`
      + `\n      Use the token-backed classes in styles.css (u-fg-*, u-bg-*, u-bd-*) instead.`);
  }

  const raws = [...new Set(src.match(RAW_COLOUR) || [])]
    // theme-color is rewritten at runtime from --bg-app; the literal is the no-JS value.
    .filter((c) => !(src.includes(`name="theme-color" content="${c}"`)));
  if (raws.length) {
    problems.push(`${file}: names ${raws.length} colour(s) directly: ${raws.slice(0, 6).join(', ')}`
      + `\n      Colour belongs in styles.css, behind a token both themes answer.`);
  }
}

// styles.css is allowed to name colour, but only inside the two token blocks. A
// literal in a rule is a colour one theme can reach and the other cannot — which is
// how the nav bar and the offering cards stayed dark on a light page for an hour.
{
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const rules = css
    .replace(/:root(\[data-theme="light"\])?\s*\{[\s\S]*?\n\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const literals = [...new Set(rules.match(RAW_COLOUR) || [])];
  if (literals.length) {
    problems.push(`styles.css: ${literals.length} colour literal(s) in rules rather than tokens: ${literals.slice(0, 6).join(', ')}`
      + `\n      Only the :root and :root[data-theme="light"] blocks may name a colour.`);
  }
}

for (const page of PAGES) {
  const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const head = src.slice(0, src.indexOf('</head>'));
  if (!/localStorage\.getItem\('scere-theme'\)/.test(head)) {
    problems.push(`${page}: no pre-paint theme block in <head> — this page flashes dark before it goes light`);
  }
  const cssAt = src.indexOf('href="./styles.css"');
  const themeAt = head.indexOf("localStorage.getItem('scere-theme')");
  if (cssAt === -1) problems.push(`${page}: does not link styles.css, so no token resolves on it`);
  else if (themeAt > cssAt) problems.push(`${page}: theme block runs after the stylesheet — set data-theme first`);
  if (!/<script src="\.\/theme\.js"><\/script>/.test(src)) {
    problems.push(`${page}: does not load theme.js, so the toggle and theme-color will not work`);
  }
}

// The bundles under data/course are what /api/course actually serves. A source file
// can be clean while the built JSON still carries the old literals — that is exactly
// what happened to the four Swahili bundles, which are derived and were a rebuild
// behind. Check what ships, not only what is authored.
{
  const dir = path.join(ROOT, 'data', 'course');
  let diagrams = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    let json;
    try { json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(json.lessons)) continue;
    const literals = new Set();
    for (const lesson of json.lessons) {
      for (const block of lesson.blocks || []) {
        if (!block.svgMarkup) continue;
        diagrams++;
        for (const c of block.svgMarkup.match(/#[0-9a-fA-F]{3,9}\b|rgba?\([0-9\s,.]+\)/g) || []) literals.add(c);
      }
    }
    if (literals.size) {
      problems.push(`data/course/${file}: ${literals.size} colour literal(s) in shipped diagrams: ${[...literals].slice(0, 5).join(', ')}`
        + `\n      Re-run scripts/build-course-data.js and scripts/build-course-i18n.js after editing a diagram.`);
    }
  }
  if (!diagrams) problems.push('data/course: no diagrams found to check — the build may not have run');
  else checked.diagrams = diagrams;
}

if (problems.length) {
  console.error(`\n${problems.length} theme problem(s):`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  process.exit(1);
}
console.log(`\n${PAGES.length} pages, ${SCRIPTS.length} scripts and ${checked.diagrams} shipped diagrams name no colour of their own`);
