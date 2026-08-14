// The Research Desk — renders the daily FX pipeline (data/fx-reports) as a
// decision-ready, paywall-gated view:
//   • Regime + top idea + track record are FREE (the honest-skepticism hook).
//   • Today's live theses are a locked preview (blurred entries/targets/scorecards).
// Every value is machine-parsed from the same latest.json the FX Intelligence Desk
// uses — no second judgment layered on top. Degrades to a clear "no data" state.

const DATA_DIR = './data/fx-reports';

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---- classification helpers ---------------------------------------------

// Map a free-text outcome string to one of: 'win' | 'inv' | 'pending'.
function classifyOutcome(text) {
  const t = String(text || '').toLowerCase();
  if (/pending/.test(t)) return 'pending';
  if (/invalidat|stopped out|stop (hit|triggered|taken)|hit .*stop|closed[^.]*loss/.test(t)) return 'inv';
  if (/\bwin\b|won\b|target (hit|reached|met)|hit .*target|played out|closed[^.]*(win|profit|target)|double-target/.test(t)) return 'win';
  return 'pending';
}

// Pull headline counts out of the hitRateSummary sentence, when present.
function parseHitRate(text) {
  const t = String(text || '');
  const grab = (re) => { const m = t.match(re); return m ? parseInt(m[1], 10) : null; };
  const wins = grab(/(\d+)\s+(?:played out|won|win)/i);
  const inv = grab(/(\d+)\s+invalidated/i);
  const pending = grab(/(\d+)\s+still pending/i);
  const total = grab(/out of\s+(\d+)\s+total/i);
  if (wins == null && inv == null && pending == null) return null;
  return { wins: wins || 0, inv: inv || 0, pending: pending || 0, total: total };
}

// "14/35" -> { num: 14, den: 35, pct: 40 }
function parseScore(contribution) {
  const m = String(contribution || '').match(/([\d.]+)\s*\/\s*([\d.]+)/);
  if (!m) return null;
  const num = parseFloat(m[1]), den = parseFloat(m[2]);
  if (!den) return null;
  return { num, den, pct: Math.max(0, Math.min(100, (num / den) * 100)) };
}

function directionMeta(text) {
  const t = String(text || '').toLowerCase();
  if (/\bbear|short\b/.test(t)) return { label: 'BEARISH', cls: 'trend-down' };
  if (/\bbull|long\b/.test(t)) return { label: 'BULLISH', cls: 'trend-up' };
  return { label: '', cls: 'alert-low' };
}

// ---- renderers -----------------------------------------------------------

function renderRegimeHero(data) {
  const regime = data.regime || {};
  const ds = data.decisionSummary || {};
  const top = ds.topIdea;
  const regimeShort = regime.classification
    ? regime.classification.split('—')[0].split(',')[0].trim()
    : 'Market Regime';
  const overall = ds.overallConfidence != null ? ds.overallConfidence : null;
  const dateLabel = data.reportDateLabel || data.reportDate || '';

  let topHtml = '';
  if (top) {
    const dir = directionMeta(top.direction || top.label);
    topHtml = `
      <div class="mt-4 pt-4 border-t border-white/20 flex items-center gap-4 flex-wrap">
        <div class="flex-1 min-w-[9rem]">
          <p class="text-[11px] uppercase tracking-wide text-blue-100/80 font-semibold">Top idea today</p>
          <p class="text-lg font-bold mt-0.5">${escapeHtml(top.label || '')}${dir.label ? ` <span class="text-xs font-semibold align-middle opacity-80">${dir.label}</span>` : ''}</p>
        </div>
        ${top.confidence != null ? `<div class="text-center">
          <div class="text-3xl font-extrabold leading-none">${escapeHtml(top.confidence)}</div>
          <div class="text-[11px] text-blue-100/80 mt-0.5">confidence /100</div>
        </div>` : ''}
      </div>`;
  }

  document.getElementById('regimeHero').innerHTML = `
    <p class="text-[11px] uppercase tracking-[0.15em] text-blue-100/80 font-semibold">Today's regime${dateLabel ? ` · ${escapeHtml(dateLabel)}` : ''}</p>
    <h2 class="text-lg font-bold mt-1 leading-snug">${escapeHtml(regimeShort)}</h2>
    ${overall != null ? `<p class="text-blue-100/90 text-sm mt-2">Overall market confidence <b>${escapeHtml(overall)}/100</b> — the desk's read on how tradable conditions are right now.</p>` : ''}
    ${topHtml}
  `;
}

function renderNoTrade(data) {
  const nt = data.noTradeZone;
  const section = document.getElementById('noTradeSection');
  if (!nt || !nt.flagged) { section.classList.add('hidden'); return; }
  // "partial" means the desk lifted the zone for part of the book only — say so
  // rather than implying a blanket stand-down.
  const partial = nt.status === 'partial';
  section.classList.remove('hidden');
  document.getElementById('noTradeFlag').innerHTML = `
    <div class="advisory-card alert-moderate !items-start">
      <span class="advisory-icon">⚠️</span>
      <div>
        <p class="font-semibold text-sm">${partial ? 'No-Trade Zone partially lifted' : 'No-Trade Zone flagged'}</p>
        <p class="text-xs opacity-90 mt-0.5">${escapeHtml(nt.text || 'Conditions argue for caution — the desk is flagging elevated risk of whipsaw or event-driven noise.')}</p>
      </div>
    </div>`;
}

function renderTrackRecord(data) {
  const pr = data.performanceReview || {};
  const root = document.getElementById('trackRecord');
  const ideas = Array.isArray(pr.ideas) ? pr.ideas : [];
  const hr = parseHitRate(pr.hitRateSummary);

  let summaryHtml = '';
  if (hr) {
    summaryHtml = `<span class="record-summary"><b>${hr.wins} win${hr.wins === 1 ? '' : 's'}</b> · ${hr.inv} invalidated · ${hr.pending} pending${hr.total ? ` · ${hr.total} total` : ''}</span>`;
  }

  const rows = ideas.map((it) => {
    const status = classifyOutcome(it.outcome);
    const chip = status === 'win'
      ? '<span class="status-chip win">Win</span>'
      : status === 'inv'
        ? '<span class="status-chip inv">Invalidated</span>'
        : '<span class="status-chip pending">Open</span>';
    // Idea label = everything before the first "Entry"; keep the (date) if present.
    const raw = String(it.idea_as_published || '');
    const label = raw.split(/\.\s*Entry|,?\s*Entry/i)[0].replace(/\s*—\s*(Bullish|Bearish)\.?/i, ' · $1').trim() || 'Idea';
    const pl = String(it.hypothetical_p_l_if_followed || '');
    const plShort = pl.split('—')[0].trim().slice(0, 60);
    const plCls = /\+|favorable|profit|win/i.test(pl) && !/n\/?a|flat|pending/i.test(pl.split('—')[0]) ? 'pos'
      : /-\d|loss|stopped/i.test(pl.split('—')[0]) ? 'neg' : 'na';
    return `
      <div class="record-row">
        <div>
          <div class="rr-idea">${escapeHtml(label)}</div>
          ${plShort ? `<div class="rr-sub">${escapeHtml(plShort)}</div>` : ''}
        </div>
        ${chip}
        <div class="rr-pl ${plCls}">${status === 'pending' ? 'open' : (plCls === 'pos' ? 'win' : plCls === 'neg' ? 'loss' : '—')}</div>
      </div>`;
  }).join('');

  if (!ideas.length && !hr) {
    root.innerHTML = '<div class="record-card"><div class="record-row"><div class="rr-idea text-slate-400">No closed or open ideas recorded yet for this report.</div></div></div>';
    return;
  }

  root.innerHTML = `
    <div class="record-card">
      <div class="record-head">
        <span class="pro-badge" style="background:linear-gradient(90deg,#22c55e,#16a34a)">Free</span>
        <strong class="text-sm">Every call, tracked in the open</strong>
        ${summaryHtml}
      </div>
      ${rows}
    </div>
    ${pr.hitRateSummary ? `<p class="text-[11px] text-slate-500 mt-1 px-1">${escapeHtml(pr.hitRateSummary)}</p>` : ''}`;
}

function renderScoreBars(scoring) {
  const rows = (scoring && Array.isArray(scoring.rows)) ? scoring.rows : [];
  if (!rows.length) return '';
  const bars = rows.map((r) => {
    const s = parseScore(r.contribution);
    const pct = s ? s.pct : 0;
    return `
      <div class="grid grid-cols-[1fr_auto] gap-2 items-center text-xs mb-1.5">
        <div class="flex items-center gap-2">
          <span class="text-slate-300 w-28 shrink-0">${escapeHtml(r.component || '')}</span>
          <span class="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden"><span class="block h-full bg-blue-500" style="width:${pct.toFixed(0)}%"></span></span>
        </div>
        <span class="font-mono text-slate-400">${escapeHtml(r.contribution || '')}</span>
      </div>`;
  }).join('');
  return `<div class="w-full mt-2"><p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">Six-pillar score</p>${bars}</div>`;
}

// Idea headline → "Short USD/JPY" (pair + direction), free on every card.
function ideaCore(headline, biasFallback) {
  const core = String(headline || '')
    .replace(/^Idea\s*\d+:\s*/i, '')
    .split('(')[0]
    .replace(/\s*—\s*(Bullish|Bearish).*$/i, '')
    .trim();
  return { core: core || 'Idea', dir: directionMeta(headline || biasFallback) };
}

function ideaHead(headline, biasFallback, conf, badge) {
  const { core, dir } = ideaCore(headline, biasFallback);
  return `
    <div class="flex items-center gap-2 flex-wrap w-full mb-1">
      <span class="font-bold text-sm">${escapeHtml(core)}</span>
      ${dir.label ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded ${dir.cls}">${dir.label}</span>` : ''}
      <span class="flex-1"></span>
      ${conf != null ? `<span class="text-xs text-slate-400">score <b class="text-slate-200">${escapeHtml(conf)}/100</b></span>` : ''}
      ${badge}
    </div>`;
}

const NO_IDEAS_HTML = '<div class="advisory-card"><p class="text-sm text-slate-400">No open trade ideas on the desk today — often the most honest call there is.</p></div>';

// Entitled / open mode: the full thesis, no blur, no overlay.
function renderLiveIdeasFull(ideas) {
  const root = document.getElementById('liveIdeas');
  if (!ideas || !ideas.length) { root.innerHTML = NO_IDEAS_HTML; return; }
  root.innerHTML = ideas.map((idea) => {
    const f = idea.fields || {};
    const fieldOrder = ['Bias', 'Entry Zone', 'Target(s)', 'Stop / Invalidation', 'Risk/Reward'];
    const fieldsHtml = fieldOrder.filter((k) => f[k]).map((k) => `
      <div class="grid grid-cols-[8.5rem_1fr] gap-2 py-1 border-b border-slate-700/50 text-xs">
        <span class="text-slate-400">${escapeHtml(k)}</span>
        <span class="text-slate-100 font-medium">${escapeHtml(f[k])}</span>
      </div>`).join('');
    const reasoningHtml = (idea.scoring && Array.isArray(idea.scoring.rows) ? idea.scoring.rows : [])
      .filter((r) => r.reasoning)
      .map((r) => `<li class="text-xs text-slate-400 mb-1"><span class="text-slate-300 font-medium">${escapeHtml(r.component || '')}:</span> ${escapeHtml(r.reasoning)}</li>`).join('');
    const confirmHtml = idea.confirmationCriteria
      ? `<p class="text-xs text-slate-400 mt-2"><span class="text-slate-300 font-medium">Confirmation:</span> ${escapeHtml(idea.confirmationCriteria)}</p>`
      : '';
    return `
      <div class="advisory-card !items-start flex-col !flex">
        ${ideaHead(idea.headline, f.Bias, idea.totalConfidence, '<span class="pro-badge" style="background:linear-gradient(90deg,#22c55e,#16a34a)">Unlocked</span>')}
        ${renderScoreBars(idea.scoring)}
        <div class="w-full mt-3">
          <p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1">The trade</p>
          ${fieldsHtml || '<p class="text-xs text-slate-500">—</p>'}
          ${reasoningHtml ? `<p class="text-[11px] uppercase tracking-wide text-slate-400 mt-3 mb-1">Why it scores this way</p><ul class="mt-1">${reasoningHtml}</ul>` : ''}
          ${confirmHtml}
        </div>
      </div>`;
  }).join('');
}

// Locked mode: free headline + score bars; the thesis body is a blurred
// PLACEHOLDER (no real levels are ever sent to the browser). The single
// subscribe call-to-action lives in #accessBar above the list.
function renderLiveIdeasLocked(liveIdeas) {
  const root = document.getElementById('liveIdeas');
  if (!liveIdeas || !liveIdeas.length) { root.innerHTML = NO_IDEAS_HTML; return; }
  const placeholderRow = (k) => `
    <div class="grid grid-cols-[8.5rem_1fr] gap-2 py-1 border-b border-slate-700/50 text-xs">
      <span class="text-slate-400">${k}</span>
      <span class="text-slate-100 font-medium tracking-widest">••••••••</span>
    </div>`;
  root.innerHTML = liveIdeas.map((idea) => `
      <div class="advisory-card !items-start flex-col !flex">
        ${ideaHead(idea.headline, null, idea.totalConfidence, '<span class="pro-badge">Thesis locked</span>')}
        ${renderScoreBars(idea.scoring)}
        <div class="lock-wrap w-full mt-3">
          <div class="lock-blur">
            <p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1">The trade</p>
            ${['Entry zone', 'Target(s)', 'Stop / invalidation', 'Risk / reward'].map(placeholderRow).join('')}
          </div>
          <div class="lock-over">
            <div class="lock-ic">🔒</div>
            <p class="lock-msg">Entry, targets, invalidation and the full scorecard unlock with the course, or on their own monthly.</p>
          </div>
        </div>
      </div>`).join('');
}

// ---- access / subscription state ----------------------------------------

// Two products, so a single "entitled" flag is not enough to describe this visitor:
// the page must be able to say WHY the ideas are open (included with the course, or
// a live subscription) and what changes when that reason runs out.
const access = {
  paywallActive: false,
  entitled: false,          // = ideas are readable right now, whatever the reason
  ownsCourse: false,
  ideasUntil: null,
  ideasSource: null,        // 'included' | 'subscription' | null
  configured: false,
  course: { available: false, priceLabel: null },
  ideas: { available: false, priceLabel: null },
};
let selectedDate = null;

function formatDate(unixSeconds) {
  if (!unixSeconds) return '';
  try {
    return new Date(unixSeconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) { const e = new Error(`${url} → ${res.status}`); e.status = res.status; throw e; }
  return res.json();
}

function postJson(url, bodyObj) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj || {}) });
}

function renderAccess() {
  const bar = document.getElementById('accessBar');
  const status = document.getElementById('accessStatus');

  if (!access.paywallActive) { // paywall not configured → fully open preview
    status.textContent = 'Open preview';
    status.className = 'text-xs font-semibold text-slate-500';
    bar.innerHTML = '';
    return;
  }

  const idealPrice = access.ideas.priceLabel ? escapeHtml(access.ideas.priceLabel) : '';
  const coursePrice = access.course.priceLabel ? escapeHtml(access.course.priceLabel) : '';
  const signOut = '<button id="logoutBtn" type="button" class="underline hover:text-slate-200">Sign out</button>';

  if (access.entitled) {
    // Included with the course vs. paid for monthly are different situations and the
    // page should not pretend otherwise — one of them is going to end on a known date.
    if (access.ideasSource === 'included') {
      const until = formatDate(access.ideasUntil);
      status.textContent = '✓ Included with your course';
      status.className = 'text-xs font-semibold text-emerald-300';
      bar.innerHTML = `<div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>The daily ideas come with your course${until ? ` until <strong class="text-slate-200">${escapeHtml(until)}</strong>` : ''}. After that they are optional${idealPrice ? `, at ${idealPrice}` : ''} — your course access is untouched either way.</span>
          ${signOut}
        </div>`;
    } else {
      status.textContent = '✓ Subscription active';
      status.className = 'text-xs font-semibold text-emerald-300';
      bar.innerHTML = `<div class="flex items-center gap-3 text-xs text-slate-400">
          <span>You have full access to every live thesis.</span>
          ${signOut}
        </div>`;
    }
    const lo = document.getElementById('logoutBtn'); if (lo) lo.onclick = doLogout;
    return;
  }

  status.textContent = '🔒 Locked';
  status.className = 'text-xs font-semibold text-amber-300';

  // A course owner whose included months have run out is not a stranger being asked to
  // buy — they are being asked to continue. Only the subscription is offered.
  if (access.ownsCourse) {
    bar.innerHTML = `
      <div class="paywall-card">
        <div class="paywall-icon">🔒</div>
        <p class="text-sm text-slate-200 font-semibold mb-1">Your three included months have ended</p>
        <p class="text-xs text-slate-400 mb-1 max-w-sm mx-auto">Your course is unaffected and stays yours. To keep receiving the daily ideas${idealPrice ? `, they are ${idealPrice}` : ''}. The track record above stays free, always.</p>
        ${access.ideas.available ? `<button id="subscribeBtn" type="button" class="upgrade-btn">Keep the daily ideas${idealPrice ? ` · ${idealPrice}` : ''}</button>` : ''}
        <p class="text-[11px] text-slate-500 mt-3">Already subscribed? <button id="restoreBtn" type="button" class="underline hover:text-slate-300">Restore access</button></p>
      </div>`;
  } else {
    // Never bought anything: lead with the course, since it is the better deal for
    // anyone who wants both, and keep the ideas-only path plainly available.
    bar.innerHTML = `
      <div class="paywall-card">
        <div class="paywall-icon">🔒</div>
        <p class="text-sm text-slate-200 font-semibold mb-1">Unlock every live thesis</p>
        <p class="text-xs text-slate-400 mb-3 max-w-sm mx-auto">Full entries, targets, invalidation and the weighted six-pillar scorecard, updated daily. The track record above stays free, always.</p>
        ${access.course.available ? `
          <button id="buyCourseBtn" type="button" class="upgrade-btn">Get the course${coursePrice ? ` · ${coursePrice}` : ''}</button>
          <p class="text-[11px] text-slate-400 mt-2 max-w-sm mx-auto">Yours permanently, and it includes three months of these ideas.</p>` : ''}
        ${access.ideas.available ? `
          <p class="text-[11px] text-slate-500 mt-3">Just want the ideas? <button id="subscribeBtn" type="button" class="underline hover:text-slate-300">Subscribe${idealPrice ? ` · ${idealPrice}` : ''}</button></p>` : ''}
        <p class="text-[11px] text-slate-500 mt-2">Already paid? <button id="restoreBtn" type="button" class="underline hover:text-slate-300">Restore access</button></p>
      </div>`;
  }
  const sub = document.getElementById('subscribeBtn'); if (sub) sub.onclick = doSubscribe;
  const buy = document.getElementById('buyCourseBtn'); if (buy) buy.onclick = doBuyCourse;
  document.getElementById('restoreBtn').onclick = doRestore;
}

// Shared by both buy buttons — the only difference is which product is requested and
// which page Stripe returns to, and the server decides the latter.
async function startCheckout(btn, product, unavailableMsg) {
  const original = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Redirecting…'; }
  try {
    const res = await postJson('/api/billing?fn=createCheckout', { product });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) { window.location.href = d.url; return; }
    // These mean the page is simply out of date about what this visitor already has.
    if (d.error === 'already_owned' || d.error === 'already_included' || d.error === 'already_subscribed') {
      loadReport(selectedDate);
      return;
    }
    alert(unavailableMsg);
  } catch (e) {
    alert('Could not start checkout. Please try again.');
  }
  if (btn) { btn.disabled = false; btn.textContent = original; }
}

function doSubscribe() {
  return startCheckout(document.getElementById('subscribeBtn'), 'ideas', 'Subscriptions aren’t available right now. Please try again later.');
}

function doBuyCourse() {
  return startCheckout(document.getElementById('buyCourseBtn'), 'course', 'The course isn’t available to buy right now. Please try again shortly.');
}

async function doRestore() {
  const email = window.prompt('Enter the email address you paid with:');
  if (!email) return;
  try {
    const res = await postJson('/api/billing?fn=restore', { email });
    const d = await res.json();
    // Owning the course counts as a successful restore even with no live
    // subscription — the ideas stay locked, but the course comes back.
    if (res.ok && (d.entitled || d.ownsCourse)) { loadReport(selectedDate); }
    else alert('No course purchase or active subscription was found for that email.');
  } catch (e) {
    alert('Could not restore access right now. Please try again.');
  }
}

async function doLogout() {
  try { await postJson('/api/billing?fn=logout', {}); } catch (e) { /* ignore */ }
  loadReport(selectedDate);
}

// If we just came back from Stripe Checkout, verify the session and set access.
async function handleCheckoutReturn() {
  const p = new URLSearchParams(window.location.search);
  const sub = p.get('sub');
  if (sub === 'success' && p.get('session_id')) {
    try { await postJson('/api/billing?fn=activate', { session_id: p.get('session_id') }); } catch (e) { /* ignore */ }
  }
  if (sub) window.history.replaceState({}, '', window.location.pathname);
}

async function loadBillingConfig() {
  try {
    const c = await fetchJson('/api/billing?fn=config');
    access.configured = !!c.configured;
    access.course = c.course || { available: false, priceLabel: null };
    access.ideas = c.ideas || { available: false, priceLabel: null };
  } catch (e) { /* leave defaults; paywall treated as inactive */ }
}

// ---- data plumbing -------------------------------------------------------

async function loadReport(dateKey) {
  selectedDate = dateKey || null;
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('researchRoot').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  try {
    const q = dateKey ? `&date=${encodeURIComponent(dateKey)}` : '';
    const pub = await fetchJson(`/api/research?fn=public${q}`);
    access.paywallActive = !!pub.paywallActive;
    access.entitled = !!pub.entitled;
    access.ownsCourse = !!pub.ownsCourse;
    access.ideasUntil = pub.ideasUntil || null;
    access.ideasSource = pub.ideasSource || null;

    renderRegimeHero(pub);
    renderNoTrade(pub);
    renderTrackRecord(pub);

    const openMode = !pub.paywallActive || pub.entitled;
    if (openMode) {
      const full = await fetchJson(`/api/research?fn=full${q}`);
      const ideas = full.report && full.report.tradeIdeas ? full.report.tradeIdeas.ideas : [];
      renderLiveIdeasFull(ideas);
    } else {
      renderLiveIdeasLocked(pub.liveIdeas || []);
    }
    renderAccess();

    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('researchRoot').classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load research data:', err);
    document.getElementById('loadingState').classList.add('hidden');
    const errEl = document.getElementById('errorState');
    errEl.textContent = 'No research data found yet. The daily pipeline writes to data/fx-reports/ — check back after the next scheduled run.';
    errEl.classList.remove('hidden');
  }
}

async function populateHistorySelect() {
  const select = document.getElementById('historySelect');
  try {
    const { dates } = await fetchJson('/api/research?fn=index');
    const sorted = [...(dates || [])].sort().reverse();
    if (!sorted.length) { select.classList.add('hidden'); return; }
    select.innerHTML = sorted.map((date, i) => `<option value="${date}" ${i === 0 ? 'selected' : ''}>${date}${i === 0 ? ' · latest' : ''}</option>`).join('');
    select.addEventListener('change', () => loadReport(select.value));
  } catch {
    select.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await handleCheckoutReturn();
  await loadBillingConfig();
  await populateHistorySelect();
  loadReport(null);
});
