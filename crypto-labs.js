// Interactive crypto labs — hands-on widgets embedded in Crypto track lessons.
//
// The point of these is pedagogical: a learner who *runs* SHA-256 and *mines* a block
// understands hashing and proof-of-work in a way that reading about them does not
// deliver. Unlike a university course's programming assignments, these require no
// code, no install and no CS background — which matters, because this course is
// written for a complete beginner, not a developer.
//
// The cryptography is REAL, not simulated: every hash below comes from the browser's
// built-in Web Crypto API (crypto.subtle.digest with SHA-256) — the same standard
// algorithm Bitcoin uses. No dependencies, no build step, consistent with the rest of
// this repo.
//
// Attached to lessons by id from learn.js:
//   crypto-how-a-blockchain-works        -> hash playground + chain tamper lab
//   crypto-proof-of-work-vs-proof-of-stake -> mining lab
//
// Requires a secure context (HTTPS or localhost) for crypto.subtle. Each lab degrades
// to a clear explanatory message rather than a broken widget if it is unavailable.

(function () {
  'use strict';

  const HAS_SUBTLE = typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function unavailable(title, why) {
    return `
      <section class="advisory-card !items-start flex-col !flex lab-card">
        <p class="font-semibold text-sm mb-1">${esc(title)}</p>
        <p class="text-xs text-slate-400">${esc(why)}</p>
      </section>`;
  }

  const NOTE = 'Real SHA-256, computed in your browser — the same algorithm Bitcoin uses. Nothing is sent anywhere.';

  // ============================================================
  // Lab 1 — Hash playground (Ch1 L2: How a Blockchain Works)
  // Type anything; see the real digest. Change one character; see almost all of it
  // change. That is the avalanche effect the lesson describes.
  // ============================================================

  function renderHashLab() {
    if (!HAS_SUBTLE) return unavailable('Hash playground', 'This lab needs your browser’s built-in cryptography, which is unavailable here (it requires a secure connection). The lesson text covers the same ground.');
    return `
      <section class="advisory-card !items-start flex-col !flex lab-card" data-lab="hash">
        <div class="lab-head">
          <span class="lab-badge">Try it</span>
          <p class="font-semibold text-sm">Hash anything, and watch one character change everything</p>
        </div>
        <p class="text-xs text-slate-400 mb-3">${NOTE}</p>

        <label class="text-xs text-slate-400 w-full">Your text
          <input id="hashInput" type="text" value="Alice pays Bob 10 coins"
                 class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
        </label>

        <div class="lab-out w-full mt-3">
          <span class="lab-out-label">SHA-256</span>
          <code id="hashOut" class="lab-hash">&mdash;</code>
        </div>

        <div class="lab-compare w-full mt-3">
          <p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Compared with "Alice pays Bob <b>70</b> coins"</p>
          <div class="lab-out">
            <span class="lab-out-label">SHA-256</span>
            <code id="hashOut2" class="lab-hash">&mdash;</code>
          </div>
          <p id="hashDiff" class="text-xs text-slate-300 mt-2"></p>
        </div>

        <p class="text-[11px] text-slate-500 mt-3">Changing a single digit changes roughly 15 of every 16 characters of the output. That is why a tampered block cannot quietly keep its old hash.</p>
      </section>`;
  }

  async function wireHashLab(scope) {
    const input = (scope || document).querySelector('#hashInput');
    if (!input) return;
    const out = document.getElementById('hashOut');
    const out2 = document.getElementById('hashOut2');
    const diffEl = document.getElementById('hashDiff');
    const REFERENCE = 'Alice pays Bob 70 coins';

    const refHash = await sha256Hex(REFERENCE);
    out2.textContent = refHash;

    const update = async () => {
      const h = await sha256Hex(input.value);
      out.textContent = h;
      let differing = 0;
      for (let i = 0; i < 64; i++) if (h[i] !== refHash[i]) differing++;
      const pct = Math.round((differing / 64) * 100);
      diffEl.innerHTML = `<b class="text-slate-100">${differing} of 64</b> characters differ (${pct}%). `
        + (differing > 50
            ? 'Two nearly identical sentences, two completely unrelated fingerprints.'
            : 'Try editing the text above and watch this number move.');
    };
    input.addEventListener('input', update);
    await update();
  }

  // ============================================================
  // Lab 2 — Mining lab (Ch1 L3: Proof of Work vs Proof of Stake)
  // Real nonce search against a real difficulty target. Raising the difficulty by one
  // leading zero multiplies the expected work by 16 — you feel it, rather than
  // being told it.
  // ============================================================

  function renderMiningLab() {
    if (!HAS_SUBTLE) return unavailable('Mine a block', 'This lab needs your browser’s built-in cryptography, which is unavailable here (it requires a secure connection). The lesson text covers the same ground.');
    return `
      <section class="advisory-card !items-start flex-col !flex lab-card" data-lab="mine">
        <div class="lab-head">
          <span class="lab-badge">Try it</span>
          <p class="font-semibold text-sm">Mine a block yourself</p>
        </div>
        <p class="text-xs text-slate-400 mb-3">Proof of work is guessing. Your device tries nonce after nonce until the block’s hash happens to start with enough zeros. ${NOTE}</p>

        <div class="w-full grid grid-cols-2 gap-2">
          <label class="text-xs text-slate-400 col-span-2">Block contents
            <input id="mineData" type="text" value="Alice pays Bob 10 coins"
                   class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
          </label>
          <label class="text-xs text-slate-400">Difficulty (leading zeros)
            <select id="mineDifficulty" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
              <option value="1">1 — trivial</option>
              <option value="2">2 — easy</option>
              <option value="3">3 — noticeable</option>
              <option value="4" selected>4 — a real wait</option>
              <option value="5">5 — slow</option>
            </select>
          </label>
          <div class="flex items-end">
            <button id="mineBtn" type="button" class="upgrade-btn !mt-0 w-full">Start mining</button>
          </div>
        </div>

        <div class="lab-stats w-full mt-3">
          <div class="lab-stat"><span class="lab-stat-n" id="mineNonce">0</span><span class="lab-stat-l">Nonce tried</span></div>
          <div class="lab-stat"><span class="lab-stat-n" id="mineTime">0.0s</span><span class="lab-stat-l">Elapsed</span></div>
          <div class="lab-stat"><span class="lab-stat-n" id="mineRate">&mdash;</span><span class="lab-stat-l">Hashes/sec</span></div>
        </div>

        <div class="lab-out w-full mt-3">
          <span class="lab-out-label">Current hash</span>
          <code id="mineHash" class="lab-hash">&mdash;</code>
        </div>

        <p id="mineResult" class="text-xs mt-3"></p>
        <p class="text-[11px] text-slate-500 mt-2">Each extra zero multiplies the expected work by about 16. Bitcoin’s real target currently needs far more than five — which is the entire security argument, and the entire energy argument, in one number.</p>
      </section>`;
  }

  const mineState = { running: false };

  function wireMiningLab(scope) {
    const btn = (scope || document).querySelector('#mineBtn');
    if (!btn) return;
    const dataEl = document.getElementById('mineData');
    const diffEl = document.getElementById('mineDifficulty');
    const nonceEl = document.getElementById('mineNonce');
    const timeEl = document.getElementById('mineTime');
    const rateEl = document.getElementById('mineRate');
    const hashEl = document.getElementById('mineHash');
    const resEl = document.getElementById('mineResult');

    btn.addEventListener('click', async () => {
      if (mineState.running) { mineState.running = false; return; }
      const target = '0'.repeat(parseInt(diffEl.value, 10));
      const data = dataEl.value;
      mineState.running = true;
      btn.textContent = 'Stop';
      resEl.textContent = '';
      resEl.className = 'text-xs mt-3';

      const started = Date.now();
      let nonce = 0;
      let hash = '';
      // Chunked so the UI stays responsive and the counter visibly spins.
      while (mineState.running) {
        for (let i = 0; i < 400 && mineState.running; i++) {
          hash = await sha256Hex(data + nonce);
          if (hash.startsWith(target)) break;
          nonce++;
        }
        const secs = (Date.now() - started) / 1000;
        nonceEl.textContent = nonce.toLocaleString();
        timeEl.textContent = secs.toFixed(1) + 's';
        rateEl.textContent = secs > 0 ? Math.round(nonce / secs).toLocaleString() : '—';
        hashEl.textContent = hash;
        if (hash.startsWith(target)) {
          resEl.innerHTML = `<span class="lab-ok">Block mined.</span> Nonce <b>${nonce.toLocaleString()}</b> produced a hash starting with ${target.length} zero${target.length === 1 ? '' : 's'}, after ${nonce.toLocaleString()} attempt${nonce === 1 ? '' : 's'} in ${secs.toFixed(1)}s. Nothing about the block changed except a number nobody cares about — that is the whole cost.`;
          mineState.running = false;
          break;
        }
        await new Promise((r) => setTimeout(r, 0));
      }
      btn.textContent = 'Start mining';
      if (!hash.startsWith(target) && resEl.textContent === '') {
        resEl.textContent = 'Stopped. The work done so far is discarded — a miner who stops early earns nothing.';
      }
    });
  }

  // ============================================================
  // Lab 3 — Chain tamper lab (Ch1 L2: How a Blockchain Works)
  // Edit a block and watch every later block break, because each stores the previous
  // block's hash. Re-mining shows exactly what an attacker must redo.
  // ============================================================

  const CHAIN_DIFFICULTY = 3;
  let chain = [];

  function renderChainLab() {
    if (!HAS_SUBTLE) return unavailable('Break the chain', 'This lab needs your browser’s built-in cryptography, which is unavailable here (it requires a secure connection). The lesson text covers the same ground.');
    return `
      <section class="advisory-card !items-start flex-col !flex lab-card" data-lab="chain">
        <div class="lab-head">
          <span class="lab-badge">Try it</span>
          <p class="font-semibold text-sm">Tamper with history, and watch the chain break</p>
        </div>
        <p class="text-xs text-slate-400 mb-3">Three mined blocks. Each stores the hash of the one before it. Edit any block’s contents: its hash changes instantly, which destroys its proof of work and breaks the link the next block relies on. ${NOTE}</p>
        <div id="chainBlocks" class="w-full"></div>
        <p id="chainStatus" class="text-xs mt-2"></p>
        <p class="text-[11px] text-slate-500 mt-2">Now try to repair it. Re-mine the block you edited and it goes green — but the block after it is now broken, because it still points at the old hash. Re-mine that one and the next one breaks. Fixing a single old transaction forces you to redo the work on every block built since, while honest miners keep extending the real chain ahead of you. That is what "immutable" actually means: not impossible to change, just far too expensive to be worth it.</p>
      </section>`;
  }

  async function mineBlock(index, data, prevHash) {
    const target = '0'.repeat(CHAIN_DIFFICULTY);
    let nonce = 0;
    let hash = await sha256Hex(index + data + prevHash + nonce);
    while (!hash.startsWith(target)) {
      nonce++;
      hash = await sha256Hex(index + data + prevHash + nonce);
    }
    return { index, data, prevHash, nonce, hash };
  }

  function chainRowHtml(b, valid) {
    return `
      <div class="chain-block ${valid ? '' : 'is-broken'}">
        <div class="chain-block-head">
          <span class="chain-idx">Block ${b.index}</span>
          <span class="chain-state">${valid ? 'valid' : 'broken'}</span>
        </div>
        <label class="text-xs text-slate-400 w-full">Contents
          <input type="text" class="chain-data mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500"
                 data-index="${b.index}" value="${esc(b.data)}">
        </label>
        <div class="chain-meta">
          <span class="chain-meta-l">Previous</span><code class="chain-hash">${esc(b.prevHash.slice(0, 24))}…</code>
          <span class="chain-meta-l">Nonce</span><code class="chain-hash">${b.nonce}</code>
          <span class="chain-meta-l">This block</span><code class="chain-hash">${esc(b.hash.slice(0, 24))}…</code>
        </div>
        <button type="button" class="chain-remine" data-remine="${b.index}">Re-mine this block</button>
      </div>`;
  }

  async function refreshChainView() {
    const wrap = document.getElementById('chainBlocks');
    const status = document.getElementById('chainStatus');
    if (!wrap) return;

    // Each block's hash is recomputed live from its current contents — exactly as a
    // node validating the chain would. Editing a block therefore changes its hash
    // immediately, which (a) usually destroys its proof of work and (b) breaks the
    // stored link in EVERY block after it. That cascade is the lesson.
    const validity = [];
    for (let i = 0; i < chain.length; i++) {
      const b = chain[i];
      b.hash = await sha256Hex(b.index + b.data + b.prevHash + b.nonce);
      const selfOk = b.hash.startsWith('0'.repeat(CHAIN_DIFFICULTY));
      const linkOk = i === 0 ? true : b.prevHash === chain[i - 1].hash;
      validity.push(selfOk && linkOk);
    }
    wrap.innerHTML = chain.map((b, i) => chainRowHtml(b, validity[i])).join('');

    const brokenCount = validity.filter((v) => !v).length;
    status.innerHTML = brokenCount === 0
      ? '<span class="lab-ok">Chain intact.</span> Every block’s stored link matches the block before it.'
      : `<span class="lab-bad">${brokenCount} block${brokenCount === 1 ? '' : 's'} broken.</span> To make this tampering stick, an attacker must re-mine every broken block — and keep outpacing the honest chain while doing it.`;

    wrap.querySelectorAll('.chain-data').forEach((inp) => {
      inp.addEventListener('input', async (ev) => {
        const idx = parseInt(ev.target.getAttribute('data-index'), 10);
        const block = chain.find((b) => b.index === idx);
        if (!block) return;
        const caret = ev.target.selectionStart;
        block.data = ev.target.value;
        await refreshChainView();
        const again = document.querySelector(`.chain-data[data-index="${idx}"]`);
        if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch (e) { /* noop */ } }
      });
    });

    wrap.querySelectorAll('[data-remine]').forEach((btn) => {
      btn.addEventListener('click', async (ev) => {
        const idx = parseInt(ev.target.getAttribute('data-remine'), 10);
        const pos = chain.findIndex((b) => b.index === idx);
        if (pos < 0) return;
        ev.target.textContent = 'Mining…';
        ev.target.disabled = true;
        const prevHash = pos === 0 ? '0'.repeat(64) : chain[pos - 1].hash;
        chain[pos] = await mineBlock(idx, chain[pos].data, prevHash);
        await refreshChainView();
      });
    });
  }

  async function wireChainLab(scope) {
    if (!(scope || document).querySelector('#chainBlocks')) return;
    const seeds = ['Alice pays Bob 10 coins', 'Bob pays Carol 4 coins', 'Carol pays Dan 1 coin'];
    chain = [];
    let prev = '0'.repeat(64);
    for (let i = 0; i < seeds.length; i++) {
      const b = await mineBlock(i + 1, seeds[i], prev);
      chain.push(b);
      prev = b.hash;
    }
    await refreshChainView();
  }

  // ============================================================
  // Public API — learn.js calls these
  // ============================================================

  const LABS = {
    'crypto-how-a-blockchain-works': {
      render: () => renderHashLab() + renderChainLab(),
      wire: async (scope) => { await wireHashLab(scope); await wireChainLab(scope); },
    },
    'crypto-proof-of-work-vs-proof-of-stake': {
      render: () => renderMiningLab(),
      wire: (scope) => wireMiningLab(scope),
    },
  };

  window.SCERE_CRYPTO_LABS = {
    hasLab: (lessonId) => Object.prototype.hasOwnProperty.call(LABS, lessonId),
    render: (lessonId) => (LABS[lessonId] ? LABS[lessonId].render() : ''),
    wire: (lessonId, scope) => {
      if (!LABS[lessonId]) return;
      // Stop any in-flight mining when navigating away.
      mineState.running = false;
      Promise.resolve(LABS[lessonId].wire(scope)).catch((err) => console.error('lab wiring failed:', err));
    },
  };
})();
