#!/usr/bin/env node
// Guard: no two labels in a lesson diagram may sit on top of each other.
//
// These are hand-positioned SVGs — every label is an absolute x/y — so a collision is
// invisible until someone opens that one diagram on that one lesson page. Eyeballing
// found one. Measuring found seven, in six different diagrams.
//
// Boxes come from getBoundingClientRect(), not getBBox(): getBBox() reports the
// UNTRANSFORMED box, so a rotated axis title looks like it is lying across the tick
// labels when on screen it is nowhere near them. That produced a false positive on
// crypto-02-3-correlation-regimes — exactly the kind of finding that teaches everyone
// to ignore the check.
//
//   node scripts/check-diagram-layout.js          # exits 1 on any collision
//   node scripts/check-diagram-layout.js --all    # list every diagram checked
//
// Needs a Chromium. Set CHROMIUM_PATH if it is not in one of the usual places.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
// Labels may touch by this much before it counts: a text bounding box includes the
// font's leading, so stacked lines of one paragraph legitimately share an edge pixel.
const TOLERANCE = 3;
// A line has to run across at least this much of a label's width to count as drawn
// through it, rather than merely clipping its corner. Swept against a known defect
// (the diversification floor's annotation, which the total-risk curve ran through):
// at 0.6 and 0.4 the check missed the very case it was written for, and only at 0.25
// did it fire. At 0.25 it reports three, all of them real, and nothing else.
const COVERAGE = 0.25;

function chromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function diagrams() {
  const out = [];
  const dir = path.join(ROOT, 'data', 'course');
  for (const file of ['foundation.json', 'forex.json', 'stocks.json', 'crypto.json']) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) continue;
    const json = JSON.parse(fs.readFileSync(full, 'utf8'));
    for (const lesson of json.lessons || []) {
      for (const block of lesson.blocks || []) {
        if (block.svgMarkup) out.push({ track: file.replace('.json', ''), key: block.svg, svg: block.svgMarkup });
      }
    }
  }
  return out;
}

const PROBE = [
  '<script>',
  'window.addEventListener("load", function () {',
  '  setTimeout(function () {',
  '    var out = [];',
  '    document.querySelectorAll("svg[data-key]").forEach(function (svg) {',
  '      var key = svg.getAttribute("data-key");',
  '      var boxes = [].slice.call(svg.querySelectorAll("text")).map(function (t) {',
  '        var s = (t.textContent || "").trim();',
  '        if (!s) return null;',
  '        var r = t.getBoundingClientRect();',
  '        if (!r.width || !r.height) return null;',
  '        return { r: r, s: s };',
  '      }).filter(Boolean);',
  '      for (var i = 0; i < boxes.length; i++) {',
  '        for (var j = i + 1; j < boxes.length; j++) {',
  '          var A = boxes[i].r, B = boxes[j].r;',
  '          var ox = Math.min(A.right, B.right) - Math.max(A.left, B.left);',
  '          var oy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);',
  '          if (ox > TOL && oy > TOL) {',
  '            out.push({ key: key, kind: "label/label", ox: Math.round(ox), oy: Math.round(oy),',
  '                       a: boxes[i].s.slice(0, 44), b: boxes[j].s.slice(0, 44) });',
  '          }',
  '        }',
  '      }',
  // A label can also be struck through by a line nobody thought about — which is what
  // happened to the diversification floor once its label moved. Straight segments only:
  // <line> and <polyline>. A <path> bounding box covers the whole curve, so testing
  // against it would flag most annotations on most charts and the check would be noise.
  '      var segs = [];',
  // Gridlines are exempt, for the same reason they are exempt from the contrast audit:
  // they are scaffolding drawn behind the content, deliberately faint, and annotations
  // are expected to sit over them. Flagging those produced six hits that all looked
  // fine on screen. A data line or a leader is content, and is not exempt.
  '      function isGrid(el) {',
  '        var v = (el.getAttribute("stroke") || "");',
  '        return v.indexOf("--diagram-grid") !== -1 || v.indexOf("--diagram-panel") !== -1;',
  '      }',
  '      [].slice.call(svg.querySelectorAll("line")).forEach(function (l) {',
  '        if (isGrid(l)) return;',
  '        segs.push({ el: l, pts: [[+l.getAttribute("x1"), +l.getAttribute("y1")],',
  '                                 [+l.getAttribute("x2"), +l.getAttribute("y2")]] });',
  '      });',
  '      [].slice.call(svg.querySelectorAll("polyline")).forEach(function (l) {',
  '        if (isGrid(l)) return;',
  '        var raw = (l.getAttribute("points") || "").trim().split(/[\\s,]+/).map(Number);',
  '        var pts = [];',
  '        for (var k = 0; k + 1 < raw.length; k += 2) pts.push([raw[k], raw[k + 1]]);',
  '        if (pts.length > 1) segs.push({ el: l, pts: pts });',
  '      });',
  '      var vb = (svg.getAttribute("viewBox") || "0 0 900 600").split(/\\s+/).map(Number);',
  '      var rect = svg.getBoundingClientRect();',
  '      var sx = rect.width / (vb[2] || 1), sy = rect.height / (vb[3] || 1);',
  // A line touching a label is normal — a level line is usually labelled by the text
  // sitting on it, and flagging that produced 40 hits across 15 diagrams, which is
  // noise that teaches everyone to ignore the check. A defect is a line drawn ACROSS
  // the label: it enters the box and covers a quarter of its width or more.
  '      function strikesThrough(p, q, B) {',
  '        var x1 = rect.left + p[0] * sx, y1 = rect.top + p[1] * sy;',
  '        var x2 = rect.left + q[0] * sx, y2 = rect.top + q[1] * sy;',
  '        var L = B.left, R = B.right, T = B.top, D = B.bottom;',
  '        if (R <= L || D <= T) return false;',
  '        var t0 = 0, t1 = 1, dx = x2 - x1, dy = y2 - y1;',
  '        var ps = [-dx, dx, -dy, dy], qs = [x1 - L, R - x1, y1 - T, D - y1];',
  '        for (var m = 0; m < 4; m++) {',
  '          if (ps[m] === 0) { if (qs[m] < 0) return false; continue; }',
  '          var r = qs[m] / ps[m];',
  '          if (ps[m] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }',
  '          else { if (r < t0) return false; if (r < t1) t1 = r; }',
  '        }',
  '        if (t1 <= t0) return false;',
  '        var covered = Math.abs(dx * (t1 - t0));',
  '        return covered >= (R - L) * COVERAGE;',
  '      }',
  '      boxes.forEach(function (bx) {',
  '        for (var s2 = 0; s2 < segs.length; s2++) {',
  '          var sg = segs[s2];',
  '          for (var k2 = 0; k2 + 1 < sg.pts.length; k2++) {',
  '            if (strikesThrough(sg.pts[k2], sg.pts[k2 + 1], bx.r)) {',
  '              out.push({ key: key, kind: "label/line", ox: 0, oy: 0,',
  '                         a: bx.s.slice(0, 44), b: "a <" + sg.el.tagName + "> is drawn through the middle of it" });',
  '              return;',
  '            }',
  '          }',
  '        }',
  '      });',
  '    });',
  '    var d = document.createElement("script");',
  '    d.type = "application/json";',
  '    d.id = "RESULT";',
  '    d.textContent = JSON.stringify(out);',
  '    document.body.appendChild(d);',
  '  }, 900);',
  '});',
  '</script>',
].join('\n');

function main() {
  const bin = chromium();
  if (!bin) {
    console.error('check-diagram-layout: no Chromium found. Set CHROMIUM_PATH.');
    process.exit(1);
  }
  const list = diagrams();
  if (!list.length) {
    console.error('check-diagram-layout: no diagrams found — run scripts/build-course-data.js first.');
    process.exit(1);
  }

  // Each diagram renders at its own viewBox width, so overlap is measured in the units
  // the author actually wrote rather than whatever the page scaled them to.
  const body = list.map((d) => {
    const w = (d.svg.match(/viewBox="0 0 (\d+)/) || [])[1] || '900';
    return d.svg.replace('<svg', '<svg data-key="' + d.track + '/' + d.key + '" style="width:' + w + 'px;display:block"');
  }).join('\n');

  const html = '<!doctype html><html data-theme="dark"><head><meta charset="utf-8">'
    + '<style>body{margin:0}</style><script>var TOL=' + TOLERANCE + ',COVERAGE=' + COVERAGE + ';</script></head><body>'
    + body + PROBE + '</body></html>';

  const tmp = path.join(os.tmpdir(), 'scere-diagram-layout-' + process.pid + '.html');
  fs.writeFileSync(tmp, html);
  try {
    const res = spawnSync(bin, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--no-proxy-server',
      '--disable-background-networking', '--disable-component-update',
      '--virtual-time-budget=15000', '--window-size=1200,900', '--dump-dom',
      'file://' + tmp,
    ], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    const m = (res.stdout || '').match(/id="RESULT"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) {
      console.error('check-diagram-layout: the probe did not report — Chromium may have failed to render.');
      process.exit(1);
    }
    const hits = JSON.parse(m[1]);
    if (process.argv.includes('--all')) list.forEach((d) => console.log('  ' + d.track + '/' + d.key));
    if (hits.length) {
      const affected = new Set(hits.map((h) => h.key)).size;
      console.error('\n' + hits.length + ' label collision(s) in ' + affected + ' diagram(s):');
      for (const h of hits) {
        const size = h.kind === 'label/line' ? '' : '  overlap ' + h.ox + 'x' + h.oy + 'px';
        console.error('  ✗ ' + h.key + '  [' + h.kind + ']' + size + '\n      "' + h.a + '"\n      "' + h.b + '"');
      }
      console.error('\nMove one of the labels. These are hand-positioned SVGs — nothing reflows on its own.');
      process.exit(1);
    }
    console.log('\n' + list.length + ' diagrams checked, no label collisions');
  } finally {
    fs.unlinkSync(tmp);
  }
}

main();
