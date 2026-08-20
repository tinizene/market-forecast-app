#!/usr/bin/env node
//
// End-to-end check of the translation layer in a real browser, for every locale that
// has a file.
//
// The static gate (scripts/check-i18n.js) proves the CATALOGUE is consistent — every
// key present, placeholders matching, English not drifted from the source. What it
// cannot prove is that the running app switches language, and that is where the
// interesting failures live: a renderer never translated because it builds its markup
// after the runtime's pass; a dictionary merged by replacing an object another module
// still holds a reference to; a banner whose text was fixed at mount time, before the
// locale arrived. All three were real here, and none was visible to a static check.
//
// Nothing below asserts a specific phrase. Expectations are written as locale KEYS and
// looked up in the locale's own file, so adding a language needs no edit here and a
// language cannot pass by accident.
//
// Serves the app through the real api/* handlers (scripts/lib/local-server.js), so no
// part of our own code is mocked. Skips with exit 0 when Chromium is absent.
//
// USAGE: node scripts/verify-i18n-browser.js

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const localServer = require('./lib/local-server');

const ROOT = path.join(__dirname, '..');
const PORT = 8123;
const DEVTOOLS_PORT = 9333;
// A fresh profile per run: Chromium refuses to start on a directory another instance
// still holds, and a stale lock is otherwise indistinguishable from "no browser".
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'scere-i18n-'));

const CHROME = [
  process.env.CHROME_PATH,
  process.env.PLAYWRIGHT_BROWSERS_PATH && path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium'),
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });

if (!CHROME) {
  console.log('  no Chromium found — skipping the browser check (set CHROME_PATH to run it)');
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The pages built by a renderer rather than written in HTML, and the keys each one is
// expected to put on screen. Keys, not phrases — see the header.
const RENDERED = [
  { name: 'course hub', url: (l) => `/learn.html?lang=${l}`, root: '#courseIndexRoot', seedProgress: true,
    keys: ['learn.continue-eyebrow', 'learn.search.label', 'learn.card.open'] },
  { name: 'track page', url: (l) => `/track.html?track=foundation&lang=${l}`, root: '#trackRoot',
    keys: ['learn.track.all-tracks', 'learn.track.start'] },
  { name: 'lesson page', url: (l) => `/lesson.html?id=what-is-money&lang=${l}`, root: '#lessonRoot',
    keys: ['learn.mark.cta', 'learn.nav.next'] },
  { name: 'research desk', url: (l) => `/research.html?lang=${l}`, root: '#researchRoot',
    keys: ['research.todays-regime', 'research.record.title'] },
];

async function devtoolsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${DEVTOOLS_PORT}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch (e) { await sleep(250); }
  }
  throw new Error('Chromium never opened a devtools endpoint');
}

function cdpClient(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  });
  return (method, params, sessionId) => {
    const i = ++id;
    return new Promise((res, rej) => {
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId }));
    });
  };
}

(async () => {
  const server = await localServer.start(PORT);

  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${DEVTOOLS_PORT}`, '--no-sandbox',
    '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${PROFILE}`,
    // The pages load Tailwind from a CDN. Behind a proxy that request can hang, and it
    // is a blocking <script>, so the document never leaves readyState "loading".
    // Styling is irrelevant to what is checked here — the text is.
    '--no-proxy-server', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    'about:blank',
  ], { stdio: 'ignore' });

  const ws = new WebSocket(await devtoolsUrl());
  await new Promise((r) => ws.addEventListener('open', r));
  const send = cdpClient(ws);

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: S } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, S);
  await send('Runtime.enable', {}, S);
  await send('Network.enable', {}, S);
  await send('Network.setBlockedURLs', { urls: ['*cdn.tailwindcss.com*', '*fonts.googleapis.com*'] }, S);

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, S);
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  async function goto(url) {
    await send('Page.navigate', { url }, S);
    for (let i = 0; i < 60; i++) {
      await sleep(200);
      const ok = await evalJs(`(async()=>{ if(!window.SCERE_I18N) return 'none';
        await window.SCERE_I18N.ready; await new Promise(r=>setTimeout(r,120)); return 'ok'; })()`).catch(() => null);
      if (ok === 'ok') return;
    }
    throw new Error(`the i18n runtime never became ready on ${url}`);
  }

  // Waits for a renderer to actually fill its mount, then returns the collapsed text.
  async function renderedText(selector) {
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      const t = await evalJs(`(()=>{const r=document.querySelector('${selector}');
        return r ? r.textContent.replace(/\\s+/g,' ').trim() : '';})()`);
      if (t.length > 80) return t;
    }
    return '';
  }

  const results = [];
  const check = (name, pass, detail) => {
    results.push(pass);
    console.log(`${pass ? '  ok  ' : '  FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  };

  const BASE = `http://127.0.0.1:${PORT}`;
  const LOCALES = fs.readdirSync(path.join(ROOT, 'i18n'))
    .filter((f) => f.endsWith('.json') && f !== 'en.json')
    .map((f) => f.replace('.json', ''));
  const catalogue = Object.fromEntries(LOCALES.map((l) =>
    [l, JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', `${l}.json`), 'utf8'))]));

  // ---- English baseline ----------------------------------------------------
  await goto(`${BASE}/index.html`);
  check('English: <html lang="en">', (await evalJs('document.documentElement.lang')) === 'en');
  const enH1 = await evalJs("document.querySelector('h1').textContent.trim()");
  check('English: homepage h1 present', enH1.length > 0, JSON.stringify(enH1.slice(0, 60)));

  // What the switcher offers is what the app promises, and that is `available` — not
  // every file in i18n/. A translation awaiting review sits in `preview`: reachable by
  // ?lang=, deliberately not advertised. Asserting against the directory listing would
  // make hiding one look like a regression, so ask the page what it offers.
  const offered = await evalJs(`(()=>{const l=window.SCERE_I18N&&window.SCERE_I18N.languages;
    return l ? l.map(x=>x.code) : null;})()`);
  const switcher = await evalJs(`(()=>{const s=document.querySelector('.nav-lang-select');
    return s ? [...s.options].map(o=>o.value) : null;})()`);
  check('switcher offers exactly the languages marked available',
    !!switcher && !!offered && switcher.join(',') === offered.join(','),
    switcher ? `switcher ${switcher.join(',')} vs available ${(offered || []).join(',')}` : 'no switcher rendered');

  // Every locale file is still exercised end to end, offered or not. Hiding a
  // translation must not mean it stops being tested — that is the window in which it
  // is most likely to rot, because nobody is looking at it.
  const previewOnly = LOCALES.filter((l) => !(offered || []).includes(l));
  console.log(`  locales under test: ${LOCALES.join(', ')}`
    + (previewOnly.length ? `  (preview, not offered: ${previewOnly.join(', ')})` : ''));

  for (const LANG of LOCALES) {
    const strings = catalogue[LANG];
    const label = `[${LANG}]`;

    // ---- the language applies ----------------------------------------------
    await goto(`${BASE}/index.html?lang=${LANG}`);
    check(`${label} <html lang> and dir`,
      (await evalJs('document.documentElement.lang')) === LANG
      && (await evalJs('document.documentElement.dir')).length > 0);

    const h1 = await evalJs("document.querySelector('h1').textContent.trim()");
    check(`${label} homepage h1 is translated`, h1 !== enH1 && h1.length > 0, JSON.stringify(h1.slice(0, 60)));

    // Every keyed element on the page carries its locale's value, not the English.
    const coverage = await evalJs(`(async()=>{
      const strings = await fetch('/i18n/${LANG}.json').then(r=>r.json());
      const flat = {};
      (function f(o,p){Object.keys(o).forEach(k=>{ if(k[0]==='_') return;
        const key = p ? p+'.'+k : k; const v = o[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) f(v,key); else flat[key]=v; });})(strings,'');
      let total=0, applied=0; const misses=[];
      document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n');
        if(!(k in flat)) return; total++;
        el.textContent.trim()===String(flat[k]).trim() ? applied++ : misses.push(k); });
      document.querySelectorAll('[data-i18n-html]').forEach(el=>{ const k=el.getAttribute('data-i18n-html');
        if(!(k in flat)) return; total++;
        el.innerHTML.trim()===String(flat[k]).trim() ? applied++ : misses.push(k); });
      return { total, applied, misses: misses.slice(0,6) };
    })()`);
    check(`${label} every keyed element on the homepage translated`,
      coverage.total > 0 && coverage.applied === coverage.total,
      `${coverage.applied}/${coverage.total}` + (coverage.misses.length ? ` missed: ${coverage.misses.join(', ')}` : ''));

    check(`${label} switcher reflects the active language`,
      (await evalJs(`document.querySelector('.nav-lang-select').value`)) === LANG);

    // ---- preference persists ------------------------------------------------
    await evalJs(`localStorage.setItem('scere_lang','${LANG}')`);
    await goto(`${BASE}/learn.html`);
    check(`${label} preference persists to a clean URL on another page`,
      (await evalJs('document.documentElement.lang')) === LANG);

    // ---- ui.js dictionary reaches the dialogs -------------------------------
    // ui.js closes over its STRINGS object and reads STRINGS.x at call time, so this
    // only works if the merge mutates that object rather than replacing the global —
    // a regression is invisible until someone opens the restore dialog and reads
    // English, which is the recovery path for a customer who has paid and cannot get in.
    await goto(`${BASE}/research.html?lang=${LANG}`);
    const uiClose = await evalJs(`(window.SCERE_UI && window.SCERE_UI.strings || {}).close`);
    check(`${label} ui.js dialog dictionary is translated`,
      uiClose === strings.ui.close, JSON.stringify(uiClose));

    const dialog = await evalJs(`(async()=>{ window.SCERE_UI.requestAccessLink();
      await new Promise(r=>setTimeout(r,250));
      const d=document.querySelector('dialog[open]');
      return d ? d.textContent.replace(/\\s+/g,' ').trim() : ''; })()`);
    check(`${label} the rendered restore dialog is translated`,
      dialog.includes(strings.ui.restoreFieldLabel) && dialog.includes(strings.ui.cancel),
      JSON.stringify(dialog.slice(0, 90)));

    // ---- the static pages ---------------------------------------------------
    for (const page of ['learn.html', 'lesson.html', 'track.html', 'research.html', 'privacy-policy.html']) {
      await goto(`${BASE}/${page}?lang=${LANG}`);
      const l = await evalJs('document.documentElement.lang');
      const n = await evalJs(`document.querySelectorAll('[data-i18n-src]').length`);
      check(`${label} ${page}`, l === LANG && n > 0, `${n} keyed elements processed`);
    }

    // ---- the renderers ------------------------------------------------------
    // learn.html and research.html are nearly empty until JS builds them from a fetch.
    // Checking the static shell alone would pass while the whole product surface
    // rendered in English.
    for (const page of RENDERED) {
      await goto(`${BASE}/learn.html`);
      await evalJs(page.seedProgress
        // The continue banner only exists once there is progress to continue from.
        ? `localStorage.setItem('scere_progress_v1', JSON.stringify({ done: { 'what-is-money': Date.now() }, last: 'what-is-money' }))`
        : `localStorage.removeItem('scere_progress_v1')`);
      await goto(BASE + page.url(LANG));
      const text = await renderedText(page.root);
      const missing = page.keys.filter((k) => !text.includes(strings[k]));
      check(`${label} ${page.name} renders translated`,
        text.length > 80 && missing.length === 0,
        missing.length ? `missing ${missing.join(', ')} — got ${JSON.stringify(text.slice(0, 120))}`
                       : `${text.length} chars`);
    }

    // ---- nothing English survives -------------------------------------------
    await goto(`${BASE}/learn.html?lang=${LANG}`);
    await renderedText('#courseIndexRoot');
    const leaks = await evalJs(`(async()=>{
      const en = await fetch('/i18n/en.json').then(r=>r.json());
      const loc = await fetch('/i18n/${LANG}.json').then(r=>r.json());
      // Lesson titles and taglines come from /api/course and are genuinely still
      // English — untranslated CONTENT, not untranslated chrome. Excluding whatever the
      // API served is what separates the two; without it a UI string reads as a leak
      // purely because it is a substring of a track title.
      const api = await fetch('/api/course?fn=index&lang=${LANG}').then(r=>r.text());
      const text = document.body.textContent.replace(/\\s+/g,' ');
      const out = [];
      for (const k of Object.keys(en)) {
        if (k === 'ui' || k[0] === '_') continue;
        const e = String(en[k]);
        if (!e || e === String(loc[k] || '') || e.length < 14 || /[{<]/.test(e)) continue;
        if (api.includes(e)) continue;
        if (text.includes(e)) out.push(k);
      }
      return out;
    })()`);
    check(`${label} no English catalogue string survives on the course hub`,
      leaks.length === 0, leaks.slice(0, 5).join(', '));
  }

  // ---- English is unaffected by any of this ---------------------------------
  for (const page of RENDERED) {
    await goto(`${BASE}/learn.html`);
    await evalJs(`localStorage.setItem('scere_lang','en')`);
    await evalJs(page.seedProgress
      ? `localStorage.setItem('scere_progress_v1', JSON.stringify({ done: { 'what-is-money': Date.now() }, last: 'what-is-money' }))`
      : `localStorage.removeItem('scere_progress_v1')`);
    await goto(BASE + page.url('en'));
    const text = await renderedText(page.root);
    const enStrings = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'en.json'), 'utf8'));
    const missing = page.keys.filter((k) => !text.includes(enStrings[k]));
    check(`[en] ${page.name} still renders in English`,
      text.length > 80 && missing.length === 0,
      missing.length ? `missing ${missing.join(', ')}` : `${text.length} chars`);
  }

  // ---- a language with no locale file falls back rather than breaking --------
  // Cleared first on purpose: an unsupported ?lang= is IGNORED in favour of the stored
  // preference, which is the right behaviour — a bad URL parameter must not silently
  // discard the language someone chose. This checks the end of that chain.
  await goto(`${BASE}/index.html`);
  await evalJs(`localStorage.removeItem('scere_lang')`);
  await goto(`${BASE}/index.html?lang=zz`);
  check('an unknown language falls back to English',
    (await evalJs('document.documentElement.lang')) === 'en'
    && (await evalJs("document.querySelector('h1').textContent.trim()")) === enH1,
    `lang="${await evalJs('document.documentElement.lang')}"`);

  // And an unsupported ?lang= leaves a stored preference alone rather than clobbering it.
  await goto(`${BASE}/index.html`);
  await evalJs(`localStorage.setItem('scere_lang','${LOCALES[0]}')`);
  await goto(`${BASE}/index.html?lang=zz`);
  check('an unknown ?lang= does not discard a stored preference',
    (await evalJs('document.documentElement.lang')) === LOCALES[0]);

  ws.close(); chrome.kill(); server.close();
  // Best-effort: Chromium may still be flushing its profile as it exits, and a temp
  // directory left behind is not a reason to fail an otherwise green run.
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) { /* it is /tmp */ }

  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });
