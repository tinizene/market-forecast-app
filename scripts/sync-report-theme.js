#!/usr/bin/env node
// Makes the already-published FX reports follow the theme.
//
// These pages cannot simply be re-rendered. Nine of the ten were produced by an
// earlier pipeline that drew Chart.js charts the current renderer does not emit, so
// re-rendering from the parsed JSON would silently delete published content.
//
// What they do share is a :root block of local aliases, with the rest of each
// stylesheet already written in terms of those. So each alias is repointed at one of
// the app's tokens; bodies, charts and prose are untouched.
//
// The aliases cannot be mapped by name, because the same name means different things
// in different reports: --bull is #1fae6b (a bright label) in one and #1f6d4b (a dark
// panel) in another. So each is classified by what it actually is — hue from the
// channel mix, role from luminance — and mapped to the token that plays that part.
//
// Re-running is safe and idempotent: it replaces its own markers rather than stacking
// them, and the aliases it writes are already var() references it leaves alone.
//
//   node scripts/sync-report-theme.js           # write
//   node scripts/sync-report-theme.js --check   # exit 1 if any page is out of date

const fs = require('fs');
const path = require('path');
const { tokens, PREPAINT } = require('./lib/theme-css');

const DIR = path.join(__dirname, '..', 'reports');

function rgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Hue by dominance, with a saturation floor so greys stay neutral.
function family([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 30) return 'neutral';
  if (r === max && g > b) return g > r * 0.72 ? 'amber' : 'danger';
  if (r === max) return 'danger';
  if (g === max) return b > r && b > g * 0.8 ? 'info' : 'success';
  return 'info';
}

// role: 'ink' for something light enough to be read against a dark ground,
// 'surface' for a panel or tint. 0.18 sits between #1f6d4b (0.13) and #3ddc84 (0.55).
function classify(hex) {
  const c = rgb(hex);
  const fam = family(c);
  const ink = luminance(c) >= 0.18;
  if (fam === 'neutral') {
    if (!ink) return luminance(c) < 0.02 ? '--bg-app' : (luminance(c) < 0.05 ? '--bg-card' : '--border-default');
    return luminance(c) > 0.55 ? '--text-primary' : '--text-secondary';
  }
  const map = { success: 'success', danger: 'danger', amber: 'warning', info: 'info' };
  return ink ? `--${map[fam]}-text` : `--${map[fam]}-soft`;
}


// ---- rewriting a report's own rules -------------------------------------------
//
// The alias block was never the whole story: each report also hard-codes colours in
// individual rules — p{color:#c9d1e0}, chips, table borders. Those are classified the
// same way, but the property says which ramp applies: a colour in `color:` is ink, in
// `background` it is a surface, in `border` it is a line. Mapping by value alone is
// what turned a pale header band into a black slab when the diagrams were done.

function parseColour(v) {
  let m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v.trim());
  if (m) return { rgb: rgb('#' + m[1]), a: 1 };
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i.exec(v.trim());
  if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  return null;
}

const ROLE = { success: 'success', danger: 'danger', amber: 'warning', info: 'info' };

function tokenFor(colour, role, ruleHasBackground) {
  const { rgb: c, a } = colour;
  const fam = family(c);
  const L = luminance(c);
  if (fam === 'neutral') {
    if (role === 'ink') {
      if (L > 0.75) return ruleHasBackground ? '--text-inverse' : '--text-primary';
      if (L > 0.55) return '--text-primary';
      if (L > 0.25) return '--text-secondary';
      if (L > 0.08) return '--text-tertiary';
      return '--text-primary';
    }
    if (role === 'border') return L < 0.1 ? '--border-default' : '--border-strong';
    if (a < 0.5) return '--bg-row';
    return L < 0.02 ? '--bg-app' : (L < 0.05 ? '--bg-card' : '--bg-elevated');
  }
  const r = ROLE[fam];
  if (role === 'ink') return `--${r}-text`;
  if (role === 'border') return `--${r}-border`;
  return `--${r}-soft`;
}

// Walk declarations rule by rule so the property is known when the value is mapped.
function rewriteRules(css) {
  let count = 0;
  const out = css.replace(/\{([^{}]*)\}/g, (whole, body) => {
    const hasBg = /(^|;)\s*background(-color)?\s*:/.test(body);
    const next = body.replace(/([a-z-]+)\s*:\s*([^;]+)/gi, (decl, prop, value) => {
      const p = prop.toLowerCase();
      const role = /(^|-)color$/.test(p) && !/background|border|outline|fill|stroke/.test(p) ? 'ink'
        : /border|outline/.test(p) ? 'border'
        : /background|fill/.test(p) ? 'surface'
        : p === 'color' ? 'ink' : null;
      if (!role) return decl;
      const mapped = value.replace(/#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)/g, (lit) => {
        const parsed = parseColour(lit);
        if (!parsed) return lit;
        count++;
        return `var(${tokenFor(parsed, role, hasBg)})`;
      });
      return `${prop}:${mapped}`;
    });
    return `{${next}}`;
  });
  return { css: out, count };
}


// Inline style="..." attributes are declaration lists with no selector, so the same
// property-aware pass applies once they are wrapped in braces.
function rewriteInlineStyles(html) {
  let count = 0;
  const out = html.replace(/style="([^"]*)"/g, (whole, decls) => {
    if (!/#[0-9a-fA-F]{3,6}\b|rgba?\(/.test(decls)) return whole;
    const r = rewriteRules(`{${decls}}`);
    count += r.count;
    return `style="${r.css.slice(1, -1)}"`;
  });
  return { html: out, count };
}

// Chart.js configs are JavaScript, not CSS, so they need a resolver rather than a
// var(). T() reads the computed token at draw time; the charts are drawn after the
// pre-paint block has already set data-theme, so they come up in the right palette.
const CHART_HELPER = 'var T=function(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()};';

function rewriteScripts(html) {
  let count = 0;
  const out = html.replace(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g, (whole, js) => {
    if (js.includes('scere-theme')) return whole;            // the pre-paint block
    if (!/['"]#[0-9a-fA-F]{3,6}['"]|['"]rgba?\([^)]*\)['"]/.test(js)) return whole;
    const next = js.replace(/(['"])(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))\1/g, (lit, q, value, offset) => {
      const parsed = parseColour(value);
      if (!parsed) return lit;
      // The nearest preceding key says what the colour is for.
      const before = js.slice(Math.max(0, offset - 60), offset).toLowerCase();
      const role = /grid|border/.test(before) ? 'border'
        : /background|fill/.test(before) ? 'surface'
        : 'ink';
      count++;
      return `T('${tokenFor(parsed, role, false)}')`;
    });
    const open = whole.slice(0, whole.indexOf('>') + 1);
    return `${open}${CHART_HELPER}\n${next}</script>`;
  });
  return { html: out, count };
}

function migrate(file, check) {
  const full = path.join(DIR, file);
  let s = fs.readFileSync(full, 'utf8');
  const before = s;

  const rootRe = /:root\s*\{([\s\S]*?)\}/;
  const m = s.match(rootRe);
  if (!m) return { file, skipped: 'no :root alias block' };

  // On a re-run the aliases are already var() references, so re-read the names from
  // the previous pass rather than treating the page as unmigrated.
  let decls = [...m[1].matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)]
    .map(([, name, hex]) => [name, classify(hex)]);
  if (!decls.length) {
    decls = [...m[1].matchAll(/(--[a-z0-9-]+)\s*:\s*var\((--[a-z0-9-]+)\)\s*;/g)]
      .map(([, name, token]) => [name, token]);
  }
  if (!decls.length) return { file, skipped: 'no colour aliases' };

  const lines = decls.map(([name, token]) => `    ${name}: var(${token});`);
  const block = `:root {\n    /* Local names kept so this page's rules read unchanged; each now points at\n       the app token that plays the same part, which is what lets it follow the theme. */\n${lines.join('\n')}\n  }`;
  s = s.replace(rootRe, block);

  // the page's own rules, which hard-code colours beyond the alias block
  let rewritten = 0;
  s = s.replace(/<style>([\s\S]*?)<\/style>/, (whole, css) => {
    const keep = css.match(/\/\* theme:tokens \*\/[\s\S]*?\/\* \/theme:tokens \*\//);
    const own = keep ? css.replace(keep[0], '') : css;
    const r = rewriteRules(own);
    rewritten = r.count;
    return `<style>${keep ? keep[0] : ''}${r.css}</style>`;
  });

  // inline style attributes and Chart.js configs carry colours too
  s = s.replace(new RegExp(CHART_HELPER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?', 'g'), '');
  const inline = rewriteInlineStyles(s); s = inline.html;
  const scripts = rewriteScripts(s); s = scripts.html;
  rewritten += inline.count + scripts.count;

  // both palettes, inlined ahead of the page's own rules
  s = s.replace(/\/\* theme:tokens \*\/[\s\S]*?\/\* \/theme:tokens \*\/\n?/, '');
  s = s.replace(/<style>/, `<style>\n/* theme:tokens */\n${tokens().trim()}\n/* /theme:tokens */`);

  // the pre-paint block, so a light reader gets no dark flash
  s = s.replace(/<script>\(function\(\)\{try\{var p=window\.localStorage[\s\S]*?<\/script>\n?/, '');
  s = s.replace(/(<meta name="viewport"[^>]*>\n?)/, `$1${PREPAINT}\n`);
  if (!s.includes("localStorage.getItem('scere-theme')")) {
    s = s.replace(/(<head>\n?)/, `$1${PREPAINT}\n`);
  }
  if (!/name="theme-color"/.test(s)) {
    s = s.replace(/(<meta charset[^>]*>\n?)/i, '$1<meta name="theme-color" content="#0f172a">\n');
  }

  if (s === before) return { file, skipped: 'already current' };
  if (!check) fs.writeFileSync(full, s);
  return { file, aliases: decls.length, rewritten, stale: true };
}

const check = process.argv.includes('--check');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
const stale = [];
for (const f of files) {
  const r = migrate(f, check);
  if (r.stale) stale.push(r);
  if (!check) console.log(`  ${r.file.padEnd(22)} ${r.skipped ? r.skipped : `${r.aliases} aliases + ${r.rewritten} inline colours`}`);
}

if (check) {
  if (stale.length) {
    console.error(`\n${stale.length} report page(s) carry a stale copy of the theme:`);
    stale.forEach((r) => console.error(`  ✗ reports/${r.file}`));
    console.error('\nRun: node scripts/sync-report-theme.js');
    process.exit(1);
  }
  console.log(`\n${files.length} report pages are in step with styles.css`);
} else {
  console.log(`\n${files.length} report pages carry the app's tokens`);
}
