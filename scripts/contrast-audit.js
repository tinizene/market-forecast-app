#!/usr/bin/env node
// WCAG 2.2 AA contrast audit, run against the real stylesheet.
//
// Why this exists: two separate design proposals for this app asserted "verified high
// contrast" for colour pairs that measured 2.49:1 and 3.68:1 against a 4.5:1 standard.
// Eyeballing a palette does not work, and neither does trusting a document. This reads
// the tokens out of styles.css, composites any translucent layers, and fails loudly.
//
//   node scripts/contrast-audit.js          # exits 1 on any violation
//   node scripts/contrast-audit.js --all    # also print the passes
//
// Adding a colour to the design system means adding its pair here. A token with no
// declared pair is reported as unchecked rather than assumed fine.

const fs = require('fs');
const path = require('path');

const CSS = path.join(__dirname, '..', 'styles.css');

// ---- colour maths ---------------------------------------------------------

function parseColor(str) {
  const s = String(str).trim();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), a: 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i);
  if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  return null;
}

// Flatten a translucent colour onto whatever is behind it. Skipping this is the most
// common way a contrast check reports a number the eye never sees.
function composite(fg, bg) {
  if (fg.a >= 1) return fg.rgb;
  return fg.rgb.map((c, i) => Math.round(c * fg.a + bg[i] * (1 - fg.a)));
}

function luminance(rgb) {
  const s = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- token extraction -----------------------------------------------------

function blockOf(css, selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([\\s\\S]*?)\\n\\}');
  const m = css.match(re);
  if (!m) throw new Error(`no ${selector} block found in styles.css`);
  return m[1];
}

function readTokens(css, selector) {
  const body = blockOf(css, selector);
  const tokens = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(body))) tokens[m[1]] = m[2].trim();
  return tokens;
}

// The light palette overrides a subset of :root, so it inherits everything it does
// not restate. Auditing the overrides alone would check a palette nobody renders.
function themes(css) {
  const dark = readTokens(css, ':root');
  const light = { ...dark, ...readTokens(css, ':root[data-theme="light"]') };
  return { dark, light };
}

// var(--a) may point at var(--b). Resolve until a literal falls out.
function resolve(tokens, value, depth = 0) {
  if (depth > 10) throw new Error(`token reference loop near "${value}"`);
  const m = String(value).match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i);
  if (!m) return value;
  if (!(m[1] in tokens)) throw new Error(`undefined token ${m[1]}`);
  return resolve(tokens, tokens[m[1]], depth + 1);
}

function colorOf(tokens, name) {
  if (!(name in tokens)) throw new Error(`missing token ${name}`);
  const c = parseColor(resolve(tokens, tokens[name]));
  if (!c) throw new Error(`token ${name} is not a plain colour: ${tokens[name]}`);
  return c;
}

// ---- the pairs we promise ------------------------------------------------
//
// fg / bg are token names. `over` stacks translucent tints onto an opaque base, in
// paint order. `need` is 4.5 for body text, 3 for large text and non-text indicators
// (WCAG 1.4.3 and 1.4.11).

const AA = 4.5;
const AA_LARGE = 3;

const PAIRS = [
  // --- the money control. This is the pair both design proposals got wrong. ---
  ['primary CTA label on CTA (light stop)', '--cta-text', '--cta-from', [], AA],
  ['primary CTA label on CTA (dark stop)', '--cta-text', '--cta-to', [], AA],

  // --- body text on every surface it lands on ---
  ['text-primary on app', '--text-primary', '--bg-app', [], AA],
  ['text-primary on card', '--text-primary', '--bg-card', [], AA],
  ['text-secondary on app', '--text-secondary', '--bg-app', [], AA],
  ['text-secondary on card', '--text-secondary', '--bg-card', [], AA],
  ['text-secondary on card-hover', '--text-secondary', '--bg-card-hover', [], AA],
  ['text-tertiary on app', '--text-tertiary', '--bg-app', [], AA],
  ['text-tertiary on card', '--text-tertiary', '--bg-card', [], AA],
  ['text-tertiary on row', '--text-tertiary', '--bg-app', ['--bg-row'], AA],
  ['text-body on card', '--text-body', '--bg-card', [], AA],
  ['text-body on row', '--text-body', '--bg-app', ['--bg-row'], AA],

  // --- primary used as text and as an indicator ---
  ['primary text on app', '--primary-text', '--bg-app', [], AA],
  ['primary text on row', '--primary-text', '--bg-app', ['--bg-row'], AA],
  ['primary text on primary tint', '--primary-text', '--bg-app', ['--bg-row', '--primary-soft'], AA],
  ['focus ring vs app', '--focus-color', '--bg-app', [], AA_LARGE],
  ['focus ring vs card', '--focus-color', '--bg-card', [], AA_LARGE],
  ['focus ring vs row', '--focus-color', '--bg-app', ['--bg-row'], AA_LARGE],

  // --- role colours, as label-on-tint chips ---
  ['success label on tint', '--success-text', '--bg-card', ['--success-soft'], AA],
  ['premium label on tint', '--premium-text', '--bg-card', ['--premium-soft'], AA],
  ['warning label on tint', '--warning-text', '--bg-card', ['--warning-soft'], AA],
  ['danger label on tint', '--danger-text', '--bg-card', ['--danger-soft'], AA],
  ['info label on tint', '--info-text', '--bg-card', ['--info-soft'], AA],
  ['practice label on tint', '--practice-text', '--bg-card', ['--practice-soft'], AA],

  // --- solid badges carry dark text; check against the lighter gradient stop ---
  ['free badge label', '--text-inverse', '--success-400', [], AA],
  ['paid badge label', '--text-inverse', '--premium-400', [], AA],

  // --- states shown on the page background ---
  ['positive figure on app', '--pos-text', '--bg-app', [], AA],
  ['negative figure on app', '--neg-text', '--bg-app', [], AA],
  ['skip link label', '--skip-fg', '--skip-bg', [], AA],
  ['body link on app', '--link-text', '--bg-app', [], AA],
  ['body link on card', '--link-text', '--bg-card', [], AA],
  ['progress label on app', '--text-secondary', '--bg-app', [], AA],
];

// ---- run ------------------------------------------------------------------

function auditPalette(tokens, label, showAll) {
  const results = [];
  for (const [name, fgName, bgName, stack, need] of PAIRS) {
    let base = colorOf(tokens, bgName);
    if (base.a < 1) throw new Error(`[${label}] background token ${bgName} must be opaque`);
    let bg = base.rgb;
    for (const layer of stack) bg = composite(colorOf(tokens, layer), bg);
    const fg = composite(colorOf(tokens, fgName), bg);
    const ratio = contrast(fg, bg);
    results.push({ name, ratio, need, ok: ratio >= need });
  }
  const width = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    if (!r.ok || showAll) {
      console.log(
        `${r.ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(5)}  ${r.name.padEnd(width)}  ${r.ratio.toFixed(2).padStart(6)} : 1  (needs ${r.need})`
      );
    }
  }
  return results;
}

function main() {
  const css = fs.readFileSync(CSS, 'utf8');
  const palettes = themes(css);
  const tokens = palettes.dark;
  const showAll = process.argv.includes('--all');

  // Two themes ship, so two themes are audited. A light palette that was only ever
  // looked at is exactly how the greys got below AA the last two times.
  const results = [];
  for (const [label, palette] of Object.entries(palettes)) {
    results.push(...auditPalette(palette, label, showAll));
  }

  const failures = results.filter((r) => !r.ok);

  // Structural tokens carry no text and so have no ratio to check: surfaces that only
  // ever sit behind a checked pair, border colours, and the mid-ramp steps kept for
  // hover and gradient stops. Listed explicitly so the exemption is a decision rather
  // than an omission.
  const STRUCTURAL = new Set([
    '--bg-app-deep', '--bg-app-low', '--bg-elevated', '--bg-sunken', '--bg-dialog',
    '--primary-300', '--primary-400', '--primary-500', '--primary-600', '--primary',
    '--primary-border', '--success-500', '--success-border', '--premium-500',
    '--premium-border', '--warning-500', '--warning-border', '--danger-500',
    '--danger-border', '--info-500', '--info-border', '--practice-border',
    '--border-subtle', '--border-default', '--border-strong',
    // --primary-700 is reached only through --skip-bg, which is checked; an underline
    // colour is a non-text decoration with no ratio of its own to promise.
    '--primary-700', '--link-underline',
    // Shadows sit under content, never behind text, so they carry no ratio to promise.
    '--shadow-soft', '--shadow', '--shadow-strong',
  ]);

  // A token that no pair mentions has never been checked. Say so rather than let it
  // look covered by a green run.
  const mentioned = new Set(PAIRS.flatMap(([, fg, bg, stack]) => [fg, bg, ...stack]));
  const colourTokens = Object.keys(tokens).filter((t) => {
    try { colorOf(tokens, t); return true; } catch (e) { return false; }
  });
  const unchecked = colourTokens.filter((t) => !mentioned.has(t) && !STRUCTURAL.has(t));

  console.log(`\n${results.length - failures.length}/${results.length} pairs pass WCAG 2.2 AA (${Object.keys(palettes).length} themes x ${PAIRS.length} pairs)`);

  // Every token the dark palette defines must be answered by the light one, or the
  // light theme silently inherits a colour designed for a dark ground.
  const lightOverrides = new Set(Object.keys(readTokens(css, ':root[data-theme=\"light\"]')));
  const NEUTRAL = new Set(['--reading-scale', '--reading-leading', '--reading-measure']);
  const inherited = Object.keys(tokens).filter((t) => {
    if (lightOverrides.has(t) || NEUTRAL.has(t)) return false;
    try { colorOf(tokens, t); return true; } catch (e) { return false; }
  });
  if (inherited.length) {
    console.log(`\n${inherited.length} colour token(s) the light theme does not restate:`);
    console.log('  ' + inherited.join(', '));
    process.exitCode = 1;
  }
  if (unchecked.length) {
    console.log(`\n${unchecked.length} NEW colour token(s) with no declared pair — add one, or list as structural:`);
    console.log('  ' + unchecked.join(', '));
    process.exitCode = 1;
  }
  if (failures.length) {
    console.error(`\n${failures.length} FAILING pair(s). Fix the token or the pair — do not lower the target.`);
    process.exit(1);
  }
}

main();
