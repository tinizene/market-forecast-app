#!/usr/bin/env node
// Converts the browser course bundles (window.SCERE_*_CONTENT) into server-side JSON
// under data/course/, which api/course.js reads and the web root never serves.
//
// WHY: until now every lesson shipped as a public static script — crypto-content.js
// alone is 456 KB readable by anyone with the URL. The "Paid track" badge in the UI
// was decoration; there was no gate behind it. The course cannot be sold in that
// shape, so the content has to live somewhere the browser can only reach through an
// endpoint that checks entitlement.
//
// SVG markup is inlined into its image block here rather than shipped as a separate
// lookup map. The client then needs no SVG table at all, and a paid diagram cannot
// leak just because the map was public while the prose was not.
//
// Run this whenever a *-content.js bundle changes. The bundles remain the authoring
// format; this is the build step that publishes them.
//
// USAGE: node scripts/build-course-data.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'course');
// The browser bundles are the authoring artefact, not a served asset. They live under
// data/course/src/ so the same middleware rule that blocks the generated JSON also
// blocks them — otherwise moving the content server-side would achieve nothing, since
// the original public URLs would still hand out the whole paid course.
const SRC_DIR = path.join(ROOT, 'data', 'course', 'src');

// Free tracks are readable without payment; everything else needs entitlement.
// This is the single place that decides, and api/course.js reads it back out of the
// generated JSON rather than keeping its own copy.
const TRACKS = [
  {
    track: 'foundation',
    free: true,
    file: 'foundation-content.js',
    contentKey: 'SCERE_FOUNDATION_CONTENT',
    trackKey: 'SCERE_FOUNDATION_TRACK',
    svgKey: null, // foundation diagrams live in learn.js — pulled in below
    defaultTitle: 'The Foundation of Money and Trade',
    type: 'structured',
  },
  {
    track: 'crypto',
    free: false,
    file: 'crypto-content.js',
    contentKey: 'SCERE_CRYPTO_CONTENT',
    trackKey: 'SCERE_CRYPTO_TRACK',
    svgKey: 'SCERE_CRYPTO_SVGS',
    defaultTitle: 'Crypto',
    type: 'structured',
  },
  {
    track: 'forex',
    free: false,
    file: 'forex-content.js',
    contentKey: 'SCERE_FOREX_CONTENT',
    trackKey: 'SCERE_FOREX_TRACK',
    svgKey: 'SCERE_FOREX_SVGS',
    defaultTitle: 'Forex',
    type: 'structured',
  },
  {
    track: 'stocks',
    free: false,
    file: 'learn-content.js',
    contentKey: 'SCERE_LEARN_CONTENT',
    trackKey: null,
    svgKey: null,
    defaultTitle: 'Stocks & ETFs',
    defaultTagline: 'Index funds and ETFs, for a complete beginner.',
    type: 'body',
  },
];

// The course bundles are plain `window.X = ...` assignments, so a stub window is all
// the sandbox they need.
function loadBundles() {
  const win = {};
  global.window = win;
  for (const t of TRACKS) {
    const p = path.join(SRC_DIR, t.file);
    if (!fs.existsSync(p)) throw new Error(`Missing course bundle: ${t.file}`);
    delete require.cache[require.resolve(p)];
    require(p);
  }
  return win;
}

// Foundation diagrams are declared as a const inside learn.js rather than in a
// bundle. Evaluate just that object literal so they can be inlined like the others.
function loadFoundationSvgs() {
  const src = fs.readFileSync(path.join(ROOT, 'learn.js'), 'utf8');
  const start = src.indexOf('const FOUNDATION_SVGS');
  if (start === -1) return {};
  const open = src.indexOf('{', start);
  const close = src.indexOf('\n};', open);
  if (open === -1 || close === -1) return {};
  // eslint-disable-next-line no-new-func
  return new Function(`return ${src.slice(open, close + 2)}`)();
}

// Replace each image block's `svg` key with the markup itself.
function inlineSvgs(lesson, svgs) {
  if (!Array.isArray(lesson.blocks)) return lesson;
  const blocks = lesson.blocks.map((b) => {
    if (b.type !== 'image' || !b.svg) return b;
    const markup = svgs[b.svg];
    if (!markup) {
      console.warn(`  ! ${lesson.id}: no SVG found for "${b.svg}" — block will render without a diagram`);
      return Object.assign({}, b, { svgMarkup: '' });
    }
    return Object.assign({}, b, { svgMarkup: markup });
  });
  return Object.assign({}, lesson, { blocks });
}

function main() {
  const win = loadBundles();
  const foundationSvgs = loadFoundationSvgs();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalLessons = 0;
  const manifest = [];

  for (const t of TRACKS) {
    const lessons = win[t.contentKey] || [];
    const meta = (t.trackKey && win[t.trackKey]) || {};
    const svgs = t.svgKey ? (win[t.svgKey] || {}) : (t.track === 'foundation' ? foundationSvgs : {});

    const payload = {
      track: t.track,
      free: t.free,
      type: t.type,
      trackTitle: meta.trackTitle || t.defaultTitle,
      trackTagline: meta.trackTagline || t.defaultTagline || '',
      lessons: lessons.map((l, i) => {
        const withSvgs = inlineSvgs(l, svgs);
        // The body-format track has no lesson numbers of its own; its order is its
        // numbering, exactly as the old client-side index assumed.
        return t.type === 'body' ? Object.assign({}, withSvgs, { lessonNumber: i + 1 }) : withSvgs;
      }),
    };

    const outPath = path.join(OUT_DIR, `${t.track}.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload));
    totalLessons += payload.lessons.length;
    manifest.push({ track: t.track, free: t.free, lessons: payload.lessons.length });
    const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`  ${t.track.padEnd(11)} ${String(payload.lessons.length).padStart(2)} lessons  ${kb.padStart(4)} KB  ${t.free ? 'free' : 'paid'}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.length} tracks, ${totalLessons} lessons to data/course/`);
}

if (require.main === module) main();

module.exports = { TRACKS };
