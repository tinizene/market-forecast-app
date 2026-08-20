// Shared machinery for translating the course.
//
// The English lesson JSON stays the single source of truth. A translation is an
// OVERLAY — data/course/i18n/<lang>.json — mapping a hash of an English string to its
// translation, with the English kept alongside it. Three things follow from that shape,
// and they are the whole reason for it:
//
//   1. A proofreader reads English and translation side by side, which is the form
//      review actually needs. A parallel tree of translated JSON is not reviewable.
//   2. When English is edited, its hash changes, the old entry is orphaned, and the
//      gate says so. The alternative — a full translated copy — goes stale in silence,
//      which is the failure mode that makes translations untrustworthy over time.
//   3. Anything not yet translated falls back to English automatically, so a partial
//      translation is a usable page rather than a broken one.
//
// Only prose fields are touched. Ids, types, SVG keys and SVG markup are structure and
// must survive untranslated or the app stops working.

const crypto = require('crypto');

// Everything a reader sees as language. Deliberately a whitelist: a new field added to
// the content model shows up as untranslated rather than being silently machine-fed
// through a translator that does not know what it is.
const PROSE_FIELDS = new Set([
  'title', 'keyIdea', 'text', 'caption', 'alt', 'question', 'options',
  'feedbackCorrect', 'feedbackWrong', 'term', 'def', 'chapterTitle',
  'trackTitle', 'trackTagline',
]);

// Short enough to read in a diff, long enough that a collision across ~5,000 strings is
// not a practical concern.
function keyOf(english) {
  return crypto.createHash('sha256').update(english, 'utf8').digest('hex').slice(0, 12);
}

// Walks the track payload, calling visit(value, fieldName) for every prose string.
function walkProse(node, visit, field) {
  if (typeof node === 'string') {
    if (PROSE_FIELDS.has(field) && node.trim()) visit(node, field);
    return node;
  }
  if (Array.isArray(node)) return node.map((v) => walkProse(v, visit, field));
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = walkProse(node[k], visit, k);
    return out;
  }
  return node;
}

// Returns a copy with every prose string replaced by its translation where one exists.
function applyOverlay(node, overlay, stats, field) {
  if (typeof node === 'string') {
    if (!PROSE_FIELDS.has(field) || !node.trim()) return node;
    const entry = overlay[keyOf(node)];
    if (entry && entry.sw) { stats.translated++; return entry.sw; }
    stats.untranslated++;
    return node;
  }
  if (Array.isArray(node)) return node.map((v) => applyOverlay(v, overlay, stats, field));
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) out[k] = applyOverlay(node[k], overlay, stats, k);
    return out;
  }
  return node;
}

// Every number in a string, as a sorted multiset. A translated lesson that drops or
// alters a figure is a factual error, not a style problem — the course's own standard
// is that worked arithmetic gets verified computationally rather than eyeballed, and a
// machine translation is exactly where a digit goes missing.
function numbersIn(s) {
  return (String(s).match(/\d[\d,.]*/g) || [])
    .map((n) => n.replace(/[.,]$/, ''))
    .sort();
}

// Currency and percent markers, for the same reason: "$40" becoming "40" changes the
// meaning of a sentence about money.
function symbolsIn(s) {
  return (String(s).match(/[$£€¥%]/g) || []).sort().join('');
}

const TRACKS = ['foundation', 'crypto', 'forex', 'stocks'];

module.exports = { PROSE_FIELDS, keyOf, walkProse, applyOverlay, numbersIn, symbolsIn, TRACKS };
