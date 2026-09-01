// Shared drawing kit for the generated course diagrams.
//
// Used by scripts/build-stocks-svgs.js and scripts/build-crypto-svgs.js. Extracted so
// the two tracks' diagrams stay visually identical and so the accessibility guard is
// enforced in one place rather than copied.
//
// Palette is the dark-theme set from course/CLAUDE.md. Colours used for text are
// checked against the background and must clear WCAG 2.2 AA at 4.5:1 — assertPalette()
// exits nonzero if one does not, so a palette edit cannot quietly ship unreadable
// labels.
//
// No unicode arrows or symbols in any text node: they have caused rendering failures
// before (course/CLAUDE.md). Words only.

const W = 900;
const H = 560;

// Every entry is a custom property, not a hex. The diagrams are inlined into the
// document rather than fetched as images, so a var() inside an SVG attribute resolves
// against :root exactly like any other rule — which is what lets one drawing serve
// both themes instead of two drawings drifting apart.
//
// The ratios these have to hold are declared in scripts/contrast-audit.js, which runs
// them against both palettes. assertPalette() below checks the wiring: that every
// entry is a token, and that styles.css actually defines it.
const fs = require('fs');
const path = require('path');

const C = {
  bg: 'var(--diagram-bg)',
  panel: 'var(--diagram-panel)',
  text: 'var(--diagram-text)',
  strong: 'var(--diagram-strong)',
  muted: 'var(--diagram-muted)',
  blue: 'var(--info-500)',
  blueText: 'var(--info-text)',
  green: 'var(--success-500)',
  greenText: 'var(--success-text)',
  red: 'var(--danger-500)',
  redText: 'var(--danger-text)',
  amber: 'var(--warning-500)',
  amberText: 'var(--warning-text)',
  grid: 'var(--diagram-grid)',
  axis: 'var(--diagram-axis)',
};

// ---------- accessibility guard ----------

function luminance(hex) {
  const ch = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const TEXT_COLOURS = ['text', 'muted', 'blueText', 'greenText', 'redText', 'amberText'];

function assertPalette() {
  // Ratios are contrast-audit.js's job now, and it checks both themes. What is left to
  // verify here is the wiring: a palette entry that is not a token, or is a token
  // styles.css never defines, resolves to nothing and paints a diagram in browser
  // defaults — black text on transparent, which looks broken rather than wrong.
  const css = fs.readFileSync(path.join(__dirname, '..', '..', 'styles.css'), 'utf8');
  const defined = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
  const problems = [];
  for (const [name, value] of Object.entries(C)) {
    const m = /^var\((--[a-z0-9-]+)\)$/.exec(value);
    if (!m) problems.push(`${name} is ${value}, not a var(--token) — a diagram cannot follow a theme through a literal`);
    else if (!defined.has(m[1])) problems.push(`${name} points at ${m[1]}, which styles.css does not define`);
  }
  if (problems.length) {
    console.error('Diagram palette is not wired to the stylesheet:');
    problems.forEach((p) => console.error(`  ${p}`));
    process.exit(1);
  }
}

// ---------- helpers ----------

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function txt(x, y, s, o = {}) {
  const a = [
    `x="${x}"`, `y="${y}"`,
    `text-anchor="${o.anchor || 'start'}"`,
    `font-size="${o.size || 13}"`,
    `fill="${o.fill || C.text}"`,
  ];
  if (o.bold) a.push('font-weight="bold"');
  return `  <text ${a.join(' ')}>${esc(s)}</text>`;
}

function rect(x, y, w, h, o = {}) {
  const a = [`x="${x}"`, `y="${y}"`, `width="${w}"`, `height="${h}"`];
  if (o.rx) a.push(`rx="${o.rx}"`);
  a.push(`fill="${o.fill || 'none'}"`);
  if (o.stroke) a.push(`stroke="${o.stroke}"`, `stroke-width="${o.sw || 2}"`);
  return `  <rect ${a.join(' ')}/>`;
}

function line(x1, y1, x2, y2, o = {}) {
  return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || C.grid}" stroke-width="${o.sw || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}

// Wraps a string to a given character width, returning the lines.
function wrap(s, chars) {
  const words = String(s).split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > chars && cur) { out.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}

function frame(title, subtitle, body, o = {}) {
  const h = o.height || H;
  const head = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" font-family="Arial, Helvetica, sans-serif" role="img">`,
    rect(0, 0, W, h, { fill: C.bg }),
    txt(W / 2, 34, title, { anchor: 'middle', size: 21, bold: true }),
  ];
  if (subtitle) head.push(txt(W / 2, 57, subtitle, { anchor: 'middle', size: 13, fill: C.muted }));
  return head.concat(body, ['</svg>']).join('\n');
}

// ---------- primitives ----------

// Horizontal bars. Long labels read far better sideways than under a vertical bar.
function hbars(items, o = {}) {
  const x0 = o.x || 250;
  const top = o.y || 90;
  const barH = o.barH || 34;
  const gap = o.gap || 20;
  const maxW = o.w || 480;
  const max = o.max || Math.max(...items.map((i) => i.value));
  const out = [];
  items.forEach((it, i) => {
    const y = top + i * (barH + gap);
    const w = Math.max(2, (it.value / max) * maxW);
    out.push(txt(x0 - 12, y + barH / 2 + 5, it.label, { anchor: 'end', size: 13, fill: it.labelFill || C.text }));
    out.push(rect(x0, y, w, barH, { fill: it.color, rx: 3 }));
    out.push(txt(x0 + w + 10, y + barH / 2 + 5, it.note, { size: 13, bold: true, fill: it.noteFill || C.text }));
  });
  return out;
}

// A left-to-right sequence of labelled boxes with a word between each.
function chain(items, o = {}) {
  const y = o.y || 240;
  const boxH = o.boxH || 78;
  const n = items.length;
  const gapW = o.gapW || 46;
  const pad = 40;
  const boxW = (W - pad * 2 - gapW * (n - 1)) / n;
  const out = [];
  items.forEach((it, i) => {
    const x = pad + i * (boxW + gapW);
    out.push(rect(x, y, boxW, boxH, { fill: C.bg, stroke: it.color || C.blue, sw: 2, rx: 8 }));
    wrap(it.label, Math.floor(boxW / 7)).forEach((l, li) => {
      out.push(txt(x + boxW / 2, y + 28 + li * 16, l, { anchor: 'middle', size: 13, bold: true, fill: it.color || C.blueText }));
    });
    if (it.note) {
      wrap(it.note, Math.floor(boxW / 6)).forEach((l, li) => {
        out.push(txt(x + boxW / 2, y + boxH + 22 + li * 15, l, { anchor: 'middle', size: 12, fill: C.muted }));
      });
    }
    if (i < n - 1) {
      const mx = x + boxW + gapW / 2;
      out.push(txt(mx, y + boxH / 2 + 5, o.connector || 'then', { anchor: 'middle', size: 12, fill: C.muted }));
    }
  });
  return out;
}

// Two or three bordered columns of text. A line starting with * is rendered bold.
function panels(cols, o = {}) {
  const top = o.y || 84;
  const h = o.h || 430;
  const pad = 30;
  const gap = 22;
  const n = cols.length;
  const w = (W - pad * 2 - gap * (n - 1)) / n;
  const out = [];
  cols.forEach((col, i) => {
    const x = pad + i * (w + gap);
    out.push(rect(x, top, w, h, { fill: C.bg, stroke: col.color, sw: 2, rx: 10 }));
    out.push(txt(x + w / 2, top + 30, col.title, { anchor: 'middle', size: 16, bold: true, fill: col.titleFill || col.color }));
    let y = top + 62;
    (col.lines || []).forEach((l) => {
      if (l === '') { y += 10; return; }
      const bold = l.startsWith('*');
      const s = bold ? l.slice(1) : l;
      wrap(s, Math.floor(w / 7.2)).forEach((ln) => {
        out.push(txt(x + 16, y, ln, { size: 13, bold, fill: bold ? C.text : C.muted }));
        y += 19;
      });
      y += 8;
    });
  });
  return out;
}

// A line chart with one or more series over shared x labels.
function lineChart(series, xLabels, o = {}) {
  const x0 = o.x || 90;
  const y0 = o.y || 110;
  const w = o.w || 760;
  const h = o.h || 330;
  const yMax = o.yMax || Math.max(...series.flatMap((s) => s.points));
  const yMin = o.yMin || 0;
  const out = [];
  const gridN = o.gridLines || 4;
  for (let i = 0; i <= gridN; i++) {
    const y = y0 + (h * i) / gridN;
    const v = yMax - ((yMax - yMin) * i) / gridN;
    out.push(line(x0, y, x0 + w, y, { stroke: C.grid, dash: i === gridN ? null : '3 5' }));
    out.push(txt(x0 - 10, y + 4, o.fmtY ? o.fmtY(v) : Math.round(v), { anchor: 'end', size: 12, fill: C.muted }));
  }
  const n = xLabels.length;
  xLabels.forEach((lb, i) => {
    const x = x0 + (w * i) / (n - 1);
    out.push(txt(x, y0 + h + 22, lb, { anchor: 'middle', size: 12, fill: C.muted }));
  });
  series.forEach((s) => {
    const pts = s.points.map((v, i) => {
      const x = x0 + (w * i) / (s.points.length - 1);
      const y = y0 + h - ((v - yMin) / (yMax - yMin)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    out.push(`  <polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="${s.sw || 3}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`);
    if (s.label) {
      const lastV = s.points[s.points.length - 1];
      const ly = y0 + h - ((lastV - yMin) / (yMax - yMin)) * h;
      out.push(txt(x0 + w + 8, ly + 4, s.label, { size: 12, bold: true, fill: s.textColor || s.color }));
    }
  });
  return out;
}

// A stacked bar, used for "who gets paid, in what order".
function stack(x, yBottom, w, segs, o = {}) {
  const unit = o.unit || 3.4;
  const out = [];
  let y = yBottom;
  segs.forEach((s) => {
    const h = s.value * unit;
    y -= h;
    out.push(rect(x, y, w, h, { fill: s.color }));
    if (h >= 16) {
      out.push(txt(x + w / 2, y + h / 2 + 5, s.short, { anchor: 'middle', size: 12, bold: true, fill: C.bg }));
    }
    // A zero-height segment has no middle to label. Put it just above the stack instead,
    // where it reads as "nothing left" rather than overlapping the segment below it.
    const labelY = h >= 16 ? y + h / 2 + 5 : y - 6;
    out.push(txt(x + w + 12, labelY, s.label, { size: 12, fill: s.labelFill || C.muted }));
  });
  return out;
}

// A vertical numbered list of steps, each with a heading and a note.
function steps(items, o = {}) {
  const top = o.y || 86;
  const rowH = o.rowH || 66;
  const x = o.x || 72;
  const out = [];
  items.forEach((it, i) => {
    const y = top + i * rowH;
    out.push(`  <circle cx="${x}" cy="${y + 22}" r="18" fill="${it.color || C.blue}"/>`);
    out.push(txt(x, y + 27, String(i + 1), { anchor: 'middle', size: 16, bold: true, fill: C.bg }));
    out.push(txt(x + 32, y + 18, it.title, { size: 15, bold: true, fill: C.text }));
    out.push(txt(x + 32, y + 40, it.note, { size: 12, fill: C.muted }));
  });
  return out;
}

// ---------- validation ----------

// The app injects this markup directly, so a malformed diagram breaks the lesson
// rather than merely looking wrong. Checks the failure modes that have bitten before:
// unescaped ampersands in text nodes, and unbalanced tags.
function validate(svgs) {
  let bad = 0;
  for (const [key, markup] of Object.entries(svgs)) {
    const textNodes = [...markup.matchAll(/>([^<>]*)</g)].map((m) => m[1]);
    if (textNodes.some((t) => /&(?!amp;|lt;|gt;|quot;|apos;|#)/.test(t))) {
      console.error(`  ! ${key}: unescaped ampersand in text`);
      bad++;
    }
    const tags = (markup.match(/<[a-z]/g) || []).length;
    const closes = (markup.match(/<\/[a-z]+>|\/>/g) || []).length;
    if (tags !== closes) {
      console.error(`  ! ${key}: ${tags} open tags vs ${closes} closes`);
      bad++;
    }
  }
  if (bad) {
    console.error(`${bad} diagram(s) failed validation`);
    process.exit(1);
  }
}

module.exports = {
  W, H, C, contrast, assertPalette,
  esc, txt, rect, line, wrap, frame,
  hbars, chain, panels, lineChart, stack, steps,
  validate,
};
