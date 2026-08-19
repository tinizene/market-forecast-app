#!/usr/bin/env node
//
// Consistency gate for the translation layer, in the same spirit as
// scripts/contrast-audit.js: a thing that is easy to get subtly wrong, checked by a
// script that exits nonzero rather than by remembering.
//
// It reads the pages AND the two renderers (learn.js, research.js), because most of
// the product surface is built with innerHTML after a fetch rather than written in
// HTML — a gate that only looked at the .html files would have called the whole course
// UI "fully translated" while it rendered in English.
//
// What it catches:
//   • a data-i18n key in the HTML with no entry in i18n/en.json — the element would
//     silently keep its English text in every language
//   • English in en.json that has drifted from the English in the source, which is how
//     a translator ends up translating a sentence the app no longer shows
//   • an entry in en.json nothing references any more — dead weight a translator would
//     be asked to translate
//   • a locale missing keys English has, or carrying keys English does not
//   • {placeholder} tokens that differ between English and a translation, which is how
//     a translated string ends up rendering a literal "{count}" to a user
//   • HTML tags in a value that English does not have, or vice versa
//
// Keys beginning with "_" are treated as file metadata, not copy, and are ignored.
//
// USAGE: node scripts/check-i18n.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const I18N = path.join(ROOT, 'i18n');

// Only the pages that are actually served. vercel.json redirects the retired ones to /.
const PAGES = ['index.html', 'learn.html', 'lesson.html', 'track.html', 'research.html', 'privacy-policy.html'];

// The renderers. Their strings reach the DOM two ways: a data-i18n attribute inside a
// template literal (the runtime translates it on insertion) and a tr(key, english)
// call for text that never exists as an element.
const RENDERERS = ['learn.js', 'research.js'];

// Keys ui.js and nav.js read out of the dictionary directly rather than through a
// data-i18n attribute or a tr() call, so a scan would otherwise report them as orphans.
const USED_FROM_JS = [/^ui\./, /^nav\./];

const problems = [];
const note = (msg) => problems.push(msg);

// Pulls key -> English out of the renderers, so en.json can be checked against the
// source it came from rather than trusted.
function keysInRenderers() {
  const found = new Map(); // key -> { file, english }
  const add = (key, english, file) => {
    const prev = found.get(key);
    if (prev && english != null && prev.english != null && prev.english !== english) {
      note(`${file}: "${key}" is used with two different English strings — ${JSON.stringify(prev.english)} and ${JSON.stringify(english)}`);
      return;
    }
    if (!prev || prev.english == null) found.set(key, { file, english });
  };

  for (const file of RENDERERS) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');

    // tr('key', 'english', ...) — the quote style and any escaped quotes inside.
    const trCall = /tr\(\s*(['"])([\w.\-]+)\1\s*,\s*(['"])((?:\\.|(?!\3).)*)\3/g;
    for (const m of src.matchAll(trCall)) {
      const english = m[4]
        .replace(/\\'/g, "'").replace(/\\"/g, '"')
        .replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      add(m[2], english, file);
    }

    // data-i18n="key">English</…  — the inline English is the value.
    for (const m of src.matchAll(/data-i18n(?:-html)?="([\w.\-]+)"/g)) {
      const gt = src.indexOf('>', m.index + m[0].length);
      if (gt === -1) { note(`${file}: "${m[1]}" — no closing > on its tag`); continue; }
      const text = innerTextAt(src, gt);
      if (text == null) { note(`${file}: "${m[1]}" — no closing tag found`); continue; }
      // A template hole means the English is assembled at runtime and cannot be a
      // catalogue entry. Those belong in tr() with a {placeholder} instead.
      if (text.includes('${')) {
        note(`${file}: "${m[1]}" wraps interpolated text — use tr() with a {placeholder} so the English is one string`);
        continue;
      }
      add(m[1], text.replace(/\s+/g, ' ').trim(), file);
    }

    for (const m of src.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      m[1].split(',').forEach((pair) => {
        const key = (pair.split(':')[1] || '').trim();
        if (key) add(key, null, file);   // seeded from the attribute; not checked for drift
      });
    }
  }
  return found;
}

// Given the '>' that closes an opening tag, returns the element's inner text.
function innerTextAt(src, gt) {
  let depth = 1;
  for (let i = gt + 1; i < src.length; i++) {
    if (src[i] !== '<') continue;
    if (src.startsWith('</', i)) {
      if (--depth === 0) return src.slice(gt + 1, i);
    } else if (!src.startsWith('<!', i)) {
      depth++;   // a nested <strong> or <b> is part of the value
    }
  }
  return null;
}

function keysInHtml() {
  const found = new Map(); // key -> file
  for (const page of PAGES) {
    const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
    for (const m of src.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) {
      if (!found.has(m[1])) found.set(m[1], page);
    }
    for (const m of src.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      m[1].split(',').forEach((pair) => {
        const key = (pair.split(':')[1] || '').trim();
        if (key && !found.has(key)) found.set(key, page);
      });
    }
  }
  return found;
}

const placeholders = (s) => (String(s).match(/\{(\w+)\}/g) || []).sort().join(',');
const tags = (s) => (String(s).match(/<\/?([a-z][a-z0-9]*)/gi) || []).map((t) => t.toLowerCase()).sort().join(',');

// Flattens { ui: { close: 'Close' } } to 'ui.close' so every locale is one flat map.
// A key beginning with _ is metadata for whoever maintains the file (provenance, review
// status), not copy the app ever renders — so it is skipped rather than compared across
// locales. A translation that says honestly who wrote it should not fail the gate.
function flatten(obj, prefix, out) {
  out = out || {};
  Object.keys(obj).forEach((k) => {
    if (k.startsWith('_')) return;
    const key = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  });
  return out;
}

function main() {
  const enRaw = JSON.parse(fs.readFileSync(path.join(I18N, 'en.json'), 'utf8'));
  const en = flatten(enRaw);
  const inHtml = keysInHtml();
  const inJs = keysInRenderers();

  for (const [key, page] of inHtml) {
    if (!(key in en)) note(`${page}: data-i18n="${key}" has no entry in en.json`);
  }

  for (const [key, use] of inJs) {
    if (!(key in en)) { note(`${use.file}: "${key}" has no entry in en.json`); continue; }
    // The renderer is the source of truth for English. If they disagree, the copy was
    // edited in one place only, and every translation of it is now of the old sentence.
    if (use.english != null && en[key] !== use.english) {
      note(`en.json: "${key}" has drifted from ${use.file}\n      en.json: ${JSON.stringify(en[key])}\n      ${use.file}: ${JSON.stringify(use.english)}`);
    }
  }

  for (const key of Object.keys(en)) {
    if (inHtml.has(key) || inJs.has(key)) continue;
    if (USED_FROM_JS.some((re) => re.test(key))) continue;
    note(`en.json: "${key}" is not referenced by any page or renderer`);
  }

  const locales = fs.readdirSync(I18N)
    .filter((f) => f.endsWith('.json') && f !== 'en.json')
    .map((f) => f.replace('.json', ''));

  for (const code of locales) {
    const loc = flatten(JSON.parse(fs.readFileSync(path.join(I18N, `${code}.json`), 'utf8')));
    const missing = Object.keys(en).filter((k) => !(k in loc));
    const extra = Object.keys(loc).filter((k) => !(k in en));
    if (missing.length) note(`${code}.json: missing ${missing.length} key(s), first: ${missing.slice(0, 3).join(', ')}`);
    if (extra.length) note(`${code}.json: ${extra.length} key(s) English does not have: ${extra.slice(0, 3).join(', ')}`);
    for (const k of Object.keys(loc)) {
      if (!(k in en)) continue;
      if (placeholders(en[k]) !== placeholders(loc[k])) {
        note(`${code}.json: "${k}" placeholders differ (en: ${placeholders(en[k]) || 'none'}, ${code}: ${placeholders(loc[k]) || 'none'})`);
      }
      if (tags(en[k]) !== tags(loc[k])) {
        note(`${code}.json: "${k}" markup differs (en: ${tags(en[k]) || 'none'}, ${code}: ${tags(loc[k]) || 'none'})`);
      }
    }
    console.log(`  ${code}.json  ${Object.keys(loc).length}/${Object.keys(en).length} keys`);
  }

  console.log(`  en.json   ${Object.keys(en).length} keys — ${inHtml.size} from ${PAGES.length} pages, ${inJs.size} from ${RENDERERS.length} renderers`);

  if (problems.length) {
    console.error(`\n${problems.length} i18n problem(s):`);
    problems.forEach((p) => console.error(`  ✗ ${p}`));
    process.exit(1);
  }
  console.log(`\n${locales.length + 1} locale(s) consistent`);
}

main();
