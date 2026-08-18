#!/usr/bin/env node
//
// Generates the brand assets in icons/ from one set of SVG sources defined here.
//
// WHY GENERATED: the supplied artwork (design/logo-source-1024.png) is a 1 MB raster
// with soft glows, a background scene and a wordmark baked in. Scaling it to 32x32
// produces mud, and it cannot be recoloured or re-laid-out. The mark is therefore
// redrawn here as flat vector geometry: no glow, no gradients, no photographic
// background, and the wordmark set as live text rather than pixels.
//
// The PNG exports are rendered by headless Chromium over CDP, because an exact clip
// rectangle is the only reliable way to get precise pixel dimensions — the
// --window-size flag silently clips short in this build. Regenerating needs Chromium;
// the outputs are committed so a normal deploy never does.
//
// USAGE: node scripts/build-brand.js

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'icons');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

// ---- palette -------------------------------------------------------------
// Navy and greens already used by the app (styles.css tokens and the course
// diagrams). Nothing new is introduced by the rebrand.
const NAVY = '#0f172a';
const GREEN = '#22c55e';
const GREEN_LIGHT = '#4ade80';
const TEXT = '#e2e8f0';
const MUTED = '#94a3b8';

// ---- the mark ------------------------------------------------------------
//
// A bull's head: horns sweeping outward and hooking up, over a broad tapered head.
//
// The source artwork stacked five ideas — ring, bull, candlesticks, zigzag arrow and a
// dollar sign — which is precisely why it turns to mud below about 96px. Earlier drafts
// here kept the ring and the arrow and read as an alien; keeping the horns and dropping
// everything else is what made it legible. The bull is already the "up" signal in this
// industry, so the arrow was saying a second time what the horns say first.
//
// Horns are the whole silhouette: they must run more horizontally than vertically, or
// the mark reads as a rabbit. That was the difference between the third and fourth
// drafts, and it is the thing to preserve if this is ever redrawn.
const MARK = `
  <g fill="${GREEN_LIGHT}">
    <path d="M 57 46 C 71 49 82 44 88 34 C 90 30 91 24 90 16 C 87 23 83 28 78 32 C 71 37 64 41 55 41 Z"/>
    <path d="M 43 46 C 29 49 18 44 12 34 C 10 30 9 24 10 16 C 13 23 17 28 22 32 C 29 37 36 41 45 41 Z"/>
    <path d="M 33 45 C 33 42 35 41 38 41 L 62 41 C 65 41 67 42 67 45 C 68 58 64 70 56 79 C 54 81 52 82 50 82 C 48 82 46 81 44 79 C 36 70 32 58 33 45 Z"/>
  </g>
  <g fill="${NAVY}">
    <path d="M 40 52 L 47 55 L 46 59.5 L 39 56.5 Z"/>
    <path d="M 60 52 L 53 55 L 54 59.5 L 61 56.5 Z"/>
    <ellipse cx="45.5" cy="68" rx="2.6" ry="3.2"/>
    <ellipse cx="54.5" cy="68" rx="2.6" ry="3.2"/>
  </g>`;

const markSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Scere Training">
  <title>Scere Training</title>${MARK}
</svg>`;

// A tile is the mark on the app's navy, rounded like an app icon.
const tileSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Scere Training">
  <title>Scere Training</title>
  <rect width="100" height="100" rx="22" fill="${NAVY}"/>${MARK}
</svg>`;

// Maskable icons get cropped to whatever shape the platform wants, so everything
// meaningful has to sit inside the middle 80%. Full-bleed background, mark scaled down.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Scere Training">
  <title>Scere Training</title>
  <rect width="100" height="100" fill="${NAVY}"/>
  <g transform="translate(50 50) scale(0.7) translate(-50 -50)">${MARK}</g>
</svg>`;

// ---- the social card -----------------------------------------------------
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" font-family="Arial, Helvetica, sans-serif" role="img" aria-label="Scere Training — Trade Smarter">
  <title>Scere Training — Trade Smarter</title>
  <rect width="1200" height="630" fill="${NAVY}"/>
  <g transform="translate(96 175) scale(2.8)">${MARK}</g>
  <text x="430" y="285" font-size="86" font-weight="bold" fill="${TEXT}">Scere<tspan fill="${GREEN_LIGHT}">Training</tspan></text>
  <text x="430" y="345" font-size="34" fill="${MUTED}" letter-spacing="6">TRADE SMARTER</text>
  <text x="430" y="415" font-size="27" fill="${MUTED}">Forex, Crypto and Stocks — taught by checking the claims,</text>
  <text x="430" y="452" font-size="27" fill="${MUTED}">not repeating them.</text>
  <rect x="430" y="486" width="118" height="5" rx="2.5" fill="${GREEN}"/>
</svg>`;

// A space is not wanted between "Scere" and "Training" in the tspan above; SVG keeps
// the literal whitespace, so the wordmark is written with an explicit gap instead.
const ogFixed = ogSvg.replace('<tspan fill', '<tspan dx="18" fill');

// ---- render --------------------------------------------------------------

function waitFor(url, tries) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url).then(resolve).catch(() => {
        if (n <= 0) return reject(new Error('chromium did not start'));
        setTimeout(() => attempt(n - 1), 300);
      });
    };
    attempt(tries);
  });
}

async function withBrowser(fn) {
  const port = 9444;
  const proc = spawn(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, '--remote-allow-origins=*', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    const list = await (await waitFor(`http://127.0.0.1:${port}/json/list`, 40)).json();
    const target = list.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => { ws.onopen = r; });
    let id = 0;
    const pending = new Map();
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    };
    const send = (method, params) => new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      ws.send(JSON.stringify({ id: i, method, params: params || {} }));
    });
    await send('Page.enable');
    const result = await fn(send);
    ws.close();
    return result;
  } finally {
    proc.kill();
  }
}

// An exact clip rectangle, rather than a window size, is what guarantees the output
// is precisely N by N.
async function renderPng(send, svg, w, h, outFile) {
  // The charset declaration is load-bearing: without it the data: URL is decoded as
  // Latin-1 and every em dash in the social card renders as mojibake.
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:transparent">`
    + svg.replace('<svg ', `<svg width="${w}" height="${h}" style="display:block" `)
    + `</body></html>`;
  await send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
  await new Promise((r) => setTimeout(r, 220));
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: w, height: h, scale: 1 },
    captureBeyondViewport: true,
  });
  const data = shot.result && shot.result.data;
  if (!data) throw new Error(`screenshot failed for ${outFile}`);
  const buf = Buffer.from(data, 'base64');
  fs.writeFileSync(path.join(OUT, outFile), buf);
  const dims = `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
  if (dims !== `${w}x${h}`) throw new Error(`${outFile} came out ${dims}, expected ${w}x${h}`);
  return { file: outFile, dims, bytes: buf.length };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // Vector sources ship too: the favicon and the nav use the SVG directly, so they
  // stay sharp at any density and cost a fraction of the PNGs.
  fs.writeFileSync(path.join(OUT, 'mark.svg'), markSvg());
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), tileSvg());
  fs.writeFileSync(path.join(OUT, 'og.svg'), ogFixed);

  const rendered = await withBrowser(async (send) => {
    const out = [];
    out.push(await renderPng(send, tileSvg(), 32, 32, 'favicon-32.png'));
    out.push(await renderPng(send, tileSvg(), 180, 180, 'apple-touch-icon.png'));
    out.push(await renderPng(send, tileSvg(), 192, 192, 'icon-192.png'));
    out.push(await renderPng(send, tileSvg(), 512, 512, 'icon-512.png'));
    out.push(await renderPng(send, maskableSvg, 512, 512, 'icon-maskable-512.png'));
    out.push(await renderPng(send, ogFixed, 1200, 630, 'og.png'));
    return out;
  });

  rendered.forEach((r) => console.log(`  ${r.file.padEnd(24)} ${r.dims.padStart(9)}  ${(r.bytes / 1024).toFixed(1)} KB`));
  console.log(`Wrote ${rendered.length} PNGs and 3 SVGs to icons/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
