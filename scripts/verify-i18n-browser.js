#!/usr/bin/env node
//
// End-to-end check of the translation layer in a real browser.
//
// The other i18n gate (scripts/check-i18n.js) proves the CATALOGUE is consistent —
// every key present, placeholders matching, English not drifted from the source. What
// it cannot prove is that the running app switches language, and that is where the
// interesting failures live: a renderer never translated because it builds its markup
// after the runtime has finished its pass; a dictionary merged by replacing an object
// another module still holds a reference to; a banner whose text was fixed at mount
// time, before the locale arrived. All three of those were real here, and none was
// visible to a static check.
//
// It drives headless Chromium over CDP and serves the app through the real api/*
// handlers (scripts/lib/local-server.js), so nothing below is a mock of our own code.
//
// Skips with exit 0 when Chromium is absent, so it can sit in a check sequence on a
// machine with no browser.
//
// USAGE: node scripts/verify-i18n-browser.js

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const localServer = require('./lib/local-server');

const PORT = 8123;
// A fresh profile per run: Chromium refuses to start on a directory another instance
// still holds, and a left-over lock is otherwise indistinguishable from "no browser".
const PROFILE = fs.mkdtempSync(path.join(require('os').tmpdir(), 'scere-i18n-'));
const DEVTOOLS_PORT = 9333;

// Where this environment keeps Chromium. PLAYWRIGHT_BROWSERS_PATH is set on the CI
// image; the rest are the usual places a developer machine puts it.
const CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PLAYWRIGHT_BROWSERS_PATH && path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium'),
  '/opt/pw-browsers/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const CHROME = CANDIDATES.find((p) => { try { return fs.existsSync(p); } catch (e) { return false; } });
if (!CHROME) {
  console.log('  no Chromium found — skipping the browser check (set CHROME_PATH to run it)');
  process.exit(0);
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function connect(){
  for(let i=0;i<40;i++){
    try{
      const r = await fetch(`http://127.0.0.1:${DEVTOOLS_PORT}/json/version`);
      const j = await r.json();
      return j.webSocketDebuggerUrl;
    }catch(e){ await sleep(250); }
  }
  throw new Error('no devtools');
}

class CDP {
  constructor(ws){ this.ws=ws; this.id=0; this.pending=new Map(); this.sessions=new Map();
    ws.addEventListener('message',(ev)=>{
      const m=JSON.parse(ev.data);
      if(m.id && this.pending.has(m.id)){ const {res,rej}=this.pending.get(m.id); this.pending.delete(m.id);
        m.error?rej(new Error(JSON.stringify(m.error))):res(m.result); }
    });
  }
  send(method,params,sessionId){
    const id=++this.id;
    return new Promise((res,rej)=>{ this.pending.set(id,{res,rej});
      this.ws.send(JSON.stringify({id,method,params:params||{},sessionId})); });
  }
}

(async ()=>{
  const server = await localServer.start(PORT);

  const chrome = spawn(CHROME,[
    '--headless=new', `--remote-debugging-port=${DEVTOOLS_PORT}`, '--no-sandbox',
    '--disable-gpu','--hide-scrollbars',`--user-data-dir=${PROFILE}`,
    // The pages load Tailwind from a CDN. Through the agent proxy that request hangs,
    // and it is a blocking <script>, so the document never leaves readyState
    // "loading". Styling is irrelevant to what is being checked here — the text.
    '--no-proxy-server', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    'about:blank'
  ],{stdio:'ignore'});

  const wsUrl = await connect();
  const ws = new WebSocket(wsUrl);
  await new Promise(r=>ws.addEventListener('open',r));
  const cdp = new CDP(ws);

  const { targetId } = await cdp.send('Target.createTarget',{url:'about:blank'});
  const { sessionId } = await cdp.send('Target.attachToTarget',{targetId,flatten:true});
  const S = sessionId;
  await cdp.send('Page.enable',{},S);
  await cdp.send('Runtime.enable',{},S);
  await cdp.send('Network.enable',{},S);
  await cdp.send('Network.setBlockedURLs',{urls:['*cdn.tailwindcss.com*','*fonts.googleapis.com*','*fonts.gstatic.com*']},S);

  async function goto(url){
    await cdp.send('Page.navigate',{url},S);
    // wait for our i18n runtime to have settled
    for(let i=0;i<60;i++){
      await sleep(200);
      const r = await cdp.send('Runtime.evaluate',{
        expression:`(async()=>{ if(!window.SCERE_I18N) return 'no-runtime';
          await window.SCERE_I18N.ready;
          await new Promise(r=>setTimeout(r,120));
          return 'ok'; })()`,
        awaitPromise:true, returnByValue:true },S).catch(()=>null);
      if(r && r.result && r.result.value==='ok') return;
    }
    throw new Error('runtime never became ready on '+url);
  }
  const evalJs = async (expr)=>{
    const r = await cdp.send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true},S);
    if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  const results=[];
  const check=(name,pass,detail)=>{ results.push({name,pass,detail}); console.log(`${pass?'  ok  ':'  FAIL'}  ${name}${detail?'  — '+detail:''}`); };

  const BASE = `http://127.0.0.1:${PORT}`;

  // 1. English baseline
  await goto(BASE+'/index.html');
  const enHtmlLang = await evalJs('document.documentElement.lang');
  check('index en: <html lang>', enHtmlLang==='en', `lang="${enHtmlLang}"`);
  const enH1 = await evalJs("document.querySelector('h1')?document.querySelector('h1').textContent.trim():''");
  check('index en: h1 present', enH1.length>0, JSON.stringify(enH1.slice(0,70)));

  // 2. Switcher renders
  const sw = await evalJs(`(()=>{const s=document.querySelector('select.lang-switch, select[data-lang-switch], nav select');
    if(!s) return null;
    return {id:s.id, cls:s.className, value:s.value, opts:[...s.options].map(o=>o.value+':'+o.textContent)};})()`);
  check('language switcher rendered in nav', !!sw, sw?JSON.stringify(sw):'no <select> found in nav');

  // 3. ?lang=fr applies French
  await goto(BASE+'/index.html?lang=fr');
  const frLang = await evalJs('document.documentElement.lang');
  check('?lang=fr: <html lang="fr">', frLang==='fr', `lang="${frLang}"`);
  const frDir = await evalJs('document.documentElement.dir');
  check('?lang=fr: dir set', frDir==='ltr', `dir="${frDir}"`);
  const frH1 = await evalJs("document.querySelector('h1')?document.querySelector('h1').textContent.trim():''");
  check('?lang=fr: h1 changed from English', frH1!==enH1 && frH1.length>0, JSON.stringify(frH1.slice(0,70)));

  // 4. Every data-i18n element that has a French entry actually changed
  const coverage = await evalJs(`(async()=>{
    const strings = await fetch('/i18n/fr.json').then(r=>r.json());
    const flat={};
    (function f(o,p){Object.keys(o).forEach(k=>{if(k[0]==='_')return;const key=p?p+'.'+k:k;
      const v=o[k]; if(v&&typeof v==='object'&&!Array.isArray(v)) f(v,key); else flat[key]=v;});})(strings,'');
    let total=0, applied=0, misses=[];
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k=el.getAttribute('data-i18n'); if(!(k in flat)) return; total++;
      if(el.textContent.trim()===String(flat[k]).trim()) applied++; else misses.push(k);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{
      const k=el.getAttribute('data-i18n-html'); if(!(k in flat)) return; total++;
      if(el.innerHTML.trim()===String(flat[k]).trim()) applied++; else misses.push(k);
    });
    return {total, applied, misses: misses.slice(0,8)};
  })()`);
  check('French applied to every keyed element on index',
        coverage.total>0 && coverage.applied===coverage.total,
        `${coverage.applied}/${coverage.total} applied` + (coverage.misses.length?` misses: ${coverage.misses.join(', ')}`:''));

  // 5. Switcher reflects the active language, and selecting French navigates
  const swValue = await evalJs(`(()=>{const s=document.querySelector('select.lang-switch, select[data-lang-switch], nav select'); return s?s.value:null;})()`);
  check('switcher shows active language', swValue==='fr', `value="${swValue}"`);

  // 6. Preference persists: setLanguage stores, then a clean URL keeps French
  await evalJs(`localStorage.setItem('scere_lang','fr')`);
  await goto(BASE+'/learn.html');
  const persisted = await evalJs('document.documentElement.lang');
  check('preference persists to a clean URL on another page', persisted==='fr', `learn.html lang="${persisted}"`);

  // 7. Switching back to English via the control
  await evalJs(`(()=>{const s=document.querySelector('select.lang-switch, select[data-lang-switch], nav select');
    s.value='en'; s.dispatchEvent(new Event('change',{bubbles:true})); return true;})()`);
  await sleep(1500);
  for(let i=0;i<40;i++){ await sleep(200);
    const ok = await evalJs(`!!window.SCERE_I18N && (await window.SCERE_I18N.ready, true)`).catch(()=>false);
    if(ok) break; }
  const backUrl = await evalJs('location.search');
  const backLang = await evalJs('document.documentElement.lang');
  const backStore = await evalJs(`localStorage.getItem('scere_lang')`);
  check('switching to English navigates and applies', backLang==='en' && /lang=en/.test(backUrl),
        `url="${backUrl}" lang="${backLang}" stored="${backStore}"`);

  // 8. Locale JSON never leaves a raw key or an empty element behind
  await goto(BASE+'/index.html?lang=fr');
  const empties = await evalJs(`(()=>{const bad=[];
    document.querySelectorAll('[data-i18n],[data-i18n-html]').forEach(el=>{
      const t=el.textContent.trim();
      if(!t) bad.push('EMPTY:'+(el.getAttribute('data-i18n')||el.getAttribute('data-i18n-html')));
      else if(/^[a-z_]+\\.[a-z0-9-]+$/.test(t)) bad.push('RAWKEY:'+t);
    }); return bad;})()`);
  check('no empty or raw-key elements after translation', empties.length===0, empties.slice(0,6).join(', '));

  // 9. Other pages render in French without console errors
  const errs=[];
  await cdp.send('Runtime.enable',{},S);
  for(const page of ['learn.html','lesson.html','track.html','research.html','privacy-policy.html']){
    await goto(`${BASE}/${page}?lang=fr`);
    const l = await evalJs('document.documentElement.lang');
    const applied = await evalJs(`document.querySelectorAll('[data-i18n-src]').length`);
    check(`${page} in French`, l==='fr' && applied>0, `lang="${l}", ${applied} keyed elements processed`);
  }

  // 10. ui.js dialog strings reach the dialogs. ui.js closes over its STRINGS object
  //     and reads STRINGS.x at call time, so this only works if the i18n merge mutates
  //     that object instead of replacing the global — a regression here is invisible
  //     until a paying customer opens the restore dialog and reads English.
  await goto(BASE+'/research.html?lang=fr');
  const uiStrings = await evalJs(`(()=>{const s=window.SCERE_UI&&window.SCERE_UI.strings;
    return s?{close:s.close, restoreSubmit:s.restoreSubmit, restoreTitle:s.restoreTitle}:null;})()`);
  check('ui.js dialog strings are French',
        !!uiStrings && uiStrings.close==='Fermer' && /courriel|Envoyez|lien/i.test(uiStrings.restoreSubmit||''),
        JSON.stringify(uiStrings));

  // 11. And the rendered dialog really shows them, not just the dictionary.
  const dialogText = await evalJs(`(async()=>{
    window.SCERE_UI.requestAccessLink();
    await new Promise(r=>setTimeout(r,250));
    const d=document.querySelector('dialog[open]');
    return d?d.textContent.replace(/\\s+/g,' ').trim().slice(0,160):'no dialog';
  })()`);
  check('rendered restore dialog is in French',
        /Saisissez|Adresse e-mail|Annuler/.test(dialogText), JSON.stringify(dialogText));

  // 12. Unavailable language falls back rather than breaking
  await goto(BASE+'/index.html?lang=sw');
  const swFallback = await evalJs('document.documentElement.lang');
  const swH1 = await evalJs("document.querySelector('h1').textContent.trim()");
  check('unavailable language (sw) falls back to English', swFallback==='en' && swH1===enH1, `lang="${swFallback}"`);

  // ---- the renderers ------------------------------------------------------
  // learn.html and research.html are nearly empty until JS builds them from a fetch.
  // Checking the static shell alone would have passed while the whole product surface
  // rendered in English, which is exactly the bug this section exists to catch.
  const RENDERED = [
    { url: '/learn.html?lang=fr', root: '#courseIndexRoot',
      // The continue banner only exists once there is progress to continue from, so
      // the run seeds some — otherwise this passes by rendering nothing.
      seed: true,
      expect: ['Reprendre où vous en étiez', 'Rechercher des leçons', 'Ouvrir le parcours'], name: 'course hub' },
    { url: '/track.html?track=foundation&lang=fr', root: '#trackRoot',
      expect: ['Tous les parcours', 'leçons', 'Chapitre'], name: 'track page' },
    { url: '/lesson.html?id=what-is-money&lang=fr', root: '#lessonRoot',
      expect: ['Leçon', 'Marquer comme lue', 'Suivante'], name: 'lesson page' },
    { url: '/research.html?lang=fr', root: '#researchRoot',
      expect: ['Régime du jour', 'Chaque appel, suivi au grand jour'], name: 'research desk' },
  ];
  for (const page of RENDERED) {
    await goto(BASE + '/learn.html');
    if (page.seed) {
      await evalJs(`(()=>{ localStorage.setItem('scere_progress_v1',
        JSON.stringify({ done: { 'what-is-money': Date.now() }, last: 'what-is-money' })); return true; })()`);
    } else {
      // Otherwise the previous case's seed leaks in and, say, the lesson page renders
      // "✓ Read" where this case expects the unread button.
      await evalJs(`(()=>{ localStorage.removeItem('scere_progress_v1'); return true; })()`);
    }
    await goto(BASE + page.url);
    // The renderers await their own fetches; wait for the mount to actually fill.
    let text = '';
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      text = await evalJs(`(()=>{const r=document.querySelector('${page.root}');
        return r ? r.textContent.replace(/\\s+/g,' ').trim() : '';})()`);
      if (text.length > 80) break;
    }
    const missing = page.expect.filter((phrase) => !text.includes(phrase));
    check(`${page.name} renders in French`, text.length > 80 && missing.length === 0,
      missing.length ? `missing: ${missing.join(' | ')} — got: ${JSON.stringify(text.slice(0,150))}`
                     : `${text.length} chars`);
  }

  // The same pages in English must be untouched by any of this.
  for (const page of RENDERED) {
    const enUrl = page.url.replace('lang=fr', 'lang=en');
    await goto(BASE + enUrl);
    let text = '';
    for (let i = 0; i < 50; i++) {
      await sleep(200);
      text = await evalJs(`(()=>{const r=document.querySelector('${page.root}');
        return r ? r.textContent.replace(/\\s+/g,' ').trim() : '';})()`);
      if (text.length > 80) break;
    }
    const leakedFrench = ['Leçon', 'Chapitre', 'Parcours', 'Réessayer', 'Régime du jour']
      .filter((w) => text.includes(w));
    check(`${page.name} still renders in English`, text.length > 80 && leakedFrench.length === 0,
      leakedFrench.length ? `French leaked into English: ${leakedFrench.join(', ')}` : `${text.length} chars`);
  }

  // No untranslated English left in a French render of the two renderer-built pages.
  await goto(BASE + '/learn.html?lang=fr');
  await sleep(2500);
  const englishLeftovers = await evalJs(`(async()=>{
    const en = await fetch('/i18n/en.json').then(r=>r.json());
    const fr = await fetch('/i18n/fr.json').then(r=>r.json());
    // Lesson titles and taglines come from /api/course and are genuinely still English
    // — that is the untranslated CONTENT, not untranslated chrome. Excluding whatever
    // the API itself served is what separates the two; without it, a UI string like
    // "The Foundation" reads as a leak purely because it is a substring of the track
    // title "The Foundation of Money and Trade".
    const apiText = await fetch('/api/course?fn=index&lang=fr').then(r=>r.text());
    const text = document.body.textContent.replace(/\\s+/g,' ');
    const leaks = [];
    for (const k of Object.keys(en)) {
      if (k === 'ui' || k[0] === '_') continue;
      const e = String(en[k]), f = String(fr[k] || '');
      if (!e || e === f || e.length < 14 || /[{<]/.test(e)) continue;
      if (apiText.includes(e)) continue;
      if (text.includes(e)) leaks.push(k + ' → ' + JSON.stringify(e.slice(0,60)));
    }
    return leaks;
  })()`);
  check('no English catalogue string survives on the French course hub',
        englishLeftovers.length === 0, englishLeftovers.slice(0,6).join(', '));

  ws.close(); chrome.kill(); server.close();
  const failed = results.filter(r=>!r.pass);
  console.log(`\n${results.length-failed.length}/${results.length} checks passed`);
  process.exit(failed.length?1:0);
})().catch(e=>{ console.error('ERROR', e); process.exit(2); });
