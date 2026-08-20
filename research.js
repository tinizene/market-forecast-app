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

// Strings that never exist as an element — announcements, dialog copy, composed
// labels — go through tr(). Everything that renders as markup carries data-i18n
// instead and the i18n runtime picks it up on insertion. Falls back to English, so
// this file still works with i18n.js absent.
function tr(key, fallback, vars) {
  return window.SCERE_I18N ? window.SCERE_I18N.t(key, fallback, vars) : fallback;
}

// ---- renderers -----------------------------------------------------------

function renderRegimeHero(data) {
  const regime = data.regime || {};
  const ds = data.decisionSummary || {};
  const top = ds.topIdea;
  const regimeShort = regime.classification
    ? regime.classification.split('—')[0].split(',')[0].trim()
    : tr('research.regime.fallback', 'Market Regime');
  const overall = ds.overallConfidence != null ? ds.overallConfidence : null;
  const dateLabel = data.reportDateLabel || data.reportDate || '';

  let topHtml = '';
  if (top) {
    const dir = directionMeta(top.direction || top.label);
    topHtml = `
      <div class="mt-4 pt-4 border-t border-white/20 flex items-center gap-4 flex-wrap">
        <div class="flex-1 min-w-[9rem]">
          <p class="text-[11px] uppercase tracking-wide text-blue-100/80 font-semibold" data-i18n="research.top-idea">Top idea today</p>
          <p class="text-lg font-bold mt-0.5">${escapeHtml(top.label || '')}${dir.label ? ` <span class="text-xs font-semibold align-middle opacity-80">${dir.label}</span>` : ''}</p>
        </div>
        ${top.confidence != null ? `<div class="text-center">
          <div class="text-3xl font-extrabold leading-none">${escapeHtml(top.confidence)}</div>
          <div class="text-[11px] text-blue-100/80 mt-0.5" data-i18n="research.confidence-scale">confidence /100</div>
        </div>` : ''}
      </div>`;
  }

  document.getElementById('regimeHero').innerHTML = `
    <p class="text-[11px] uppercase tracking-[0.15em] text-blue-100/80 font-semibold"><span data-i18n="research.todays-regime">Today's regime</span>${dateLabel ? ` · ${escapeHtml(dateLabel)}` : ''}</p>
    <h2 class="text-lg font-bold mt-1 leading-snug">${escapeHtml(regimeShort)}</h2>
    ${overall != null ? `<p class="text-blue-100/90 text-sm mt-2">${tr('research.overall-confidence', 'Overall market confidence <b>{score}/100</b> — the desk\'s read on how tradable conditions are right now.', { score: escapeHtml(overall) })}</p>` : ''}
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
        <p class="font-semibold text-sm">${escapeHtml(partial ? tr('research.no-trade.partial', 'No-Trade Zone partially lifted') : tr('research.no-trade.flagged', 'No-Trade Zone flagged'))}</p>
        <p class="text-xs opacity-90 mt-0.5">${escapeHtml(nt.text || tr('research.no-trade.default', 'Conditions argue for caution — the desk is flagging elevated risk of whipsaw or event-driven noise.'))}</p>
      </div>
    </div>`;
}

// The model writes this column as a sentence with the arithmetic shown. The row has
// space for the headline figures only, so pull the two percentages back out and leave
// the working to the full report. Returns '' when the column is absent — older reports
// predate it, and a missing figure must not render as an empty label.
function summariseDistance(text) {
  const t = String(text || '').trim();
  if (!t || /^(n\/?a|-|—)$/i.test(t)) return '';
  if (/no published target/i.test(t)) return tr('research.no-published-target', 'No published target');
  const gap = t.match(/gap[^%\d-]{0,20}(-?[\d.]+)\s*%/i);
  const prog = t.match(/progress[^%\d-]{0,20}(-?[\d.]+)\s*%/i);
  const parts = [];
  if (gap) parts.push(tr('research.pct-from-target', '{pct}% from target', { pct: gap[1] }));
  if (prog) {
    const n = parseFloat(prog[1]);
    parts.push(n < 0
      ? `moved ${Math.abs(n)}% of the way in the wrong direction`
      : `${n}% of the way to target`);
  }
  // Unparseable but present: show the raw text rather than silently dropping a figure
  // the report went to the trouble of computing.
  return parts.length ? parts.join(' · ') : t.slice(0, 80);
}

function renderTrackRecord(data) {
  const pr = data.performanceReview || {};
  const root = document.getElementById('trackRecord');
  const ideas = Array.isArray(pr.ideas) ? pr.ideas : [];
  const hr = parseHitRate(pr.hitRateSummary);

  let summaryHtml = '';
  if (hr) {
    summaryHtml = `<span class="record-summary"><b>${escapeHtml(hr.wins === 1 ? tr('research.summary.one-win', '1 win') : tr('research.summary.n-wins', '{n} wins', { n: hr.wins }))}</b> · ${escapeHtml(tr('research.summary.n-invalidated', '{n} invalidated', { n: hr.inv }))} · ${escapeHtml(tr('research.summary.n-pending', '{n} pending', { n: hr.pending }))}${hr.total ? ` · ${escapeHtml(tr('research.summary.n-total', '{n} total', { n: hr.total }))}` : ''}</span>`;
  }

  const rows = ideas.map((it) => {
    const status = classifyOutcome(it.outcome);
    const chip = status === 'win'
      ? '<span class="status-chip win" data-i18n="research.status.win">Win</span>'
      : status === 'inv'
        ? '<span class="status-chip inv" data-i18n="research.status.invalidated">Invalidated</span>'
        : '<span class="status-chip pending" data-i18n="research.status.open">Open</span>';
    // Idea label = everything before the first "Entry"; keep the (date) if present.
    const raw = String(it.idea_as_published || '');
    const label = raw.split(/\.\s*Entry|,?\s*Entry/i)[0].replace(/\s*—\s*(Bullish|Bearish)\.?/i, ' · $1').trim() || 'Idea';
    const pl = String(it.hypothetical_p_l_if_followed || '');
    const plShort = pl.split('—')[0].trim().slice(0, 60);
    const plCls = /\+|favorable|profit|win/i.test(pl) && !/n\/?a|flat|pending/i.test(pl.split('—')[0]) ? 'pos'
      : /-\d|loss|stopped/i.test(pl.split('—')[0]) ? 'neg' : 'na';
    // How far the call finished from target. A loss that missed by 0.3% and a loss that
    // ran 49% the wrong way are different mistakes, and only one of them is a wrong
    // thesis — publishing the number is what lets a reader tell them apart.
    const dist = summariseDistance(it.distance_from_target);
    return `
      <div class="record-row">
        <div>
          <div class="rr-idea">${escapeHtml(label)}</div>
          ${plShort ? `<div class="rr-sub">${escapeHtml(plShort)}</div>` : ''}
          ${dist ? `<div class="rr-dist">${escapeHtml(dist)}</div>` : ''}
        </div>
        ${chip}
        <div class="rr-pl ${plCls}">${escapeHtml(status === 'pending' ? tr('research.pl.open', 'open') : (plCls === 'pos' ? tr('research.pl.win', 'win') : plCls === 'neg' ? tr('research.pl.loss', 'loss') : '—'))}</div>
      </div>`;
  }).join('');

  if (!ideas.length && !hr) {
    root.innerHTML = '<div class="record-card"><div class="record-row"><div class="rr-idea text-slate-400" data-i18n="research.record.empty">No closed or open ideas recorded yet for this report.</div></div></div>';
    return;
  }

  root.innerHTML = `
    <div class="record-card">
      <div class="record-head">
        <span class="pro-badge" style="background:linear-gradient(90deg,#22c55e,#16a34a)" data-i18n="research.badge.free">Free</span>
        <strong class="text-sm" data-i18n="research.record.title">Every call, tracked in the open</strong>
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
  return `<div class="w-full mt-2"><p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5" data-i18n="research.six-pillar">Six-pillar score</p>${bars}</div>`;
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
      ${conf != null ? `<span class="text-xs text-slate-400">${tr('research.score-of-100', 'score <b class="text-slate-200">{score}/100</b>', { score: escapeHtml(conf) })}</span>` : ''}
      ${badge}
    </div>`;
}

const NO_IDEAS_HTML = '<div class="advisory-card"><p class="text-sm text-slate-400" data-i18n="research.no-ideas">No open trade ideas on the desk today — often the most honest call there is.</p></div>';

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
      ? `<p class="text-xs text-slate-400 mt-2"><span class="text-slate-300 font-medium" data-i18n="research.confirmation">Confirmation:</span> ${escapeHtml(idea.confirmationCriteria)}</p>`
      : '';
    return `
      <div class="advisory-card !items-start flex-col !flex">
        ${ideaHead(idea.headline, f.Bias, idea.totalConfidence, '<span class="pro-badge" style="background:linear-gradient(90deg,#22c55e,#16a34a)" data-i18n="research.badge.unlocked">Unlocked</span>')}
        ${renderScoreBars(idea.scoring)}
        <div class="w-full mt-3">
          <p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1" data-i18n="research.the-trade">The trade</p>
          ${fieldsHtml || '<p class="text-xs text-slate-500">—</p>'}
          ${reasoningHtml ? `<p class="text-[11px] uppercase tracking-wide text-slate-400 mt-3 mb-1" data-i18n="research.why-it-scores">Why it scores this way</p><ul class="mt-1">${reasoningHtml}</ul>` : ''}
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
  const placeholderRow = ([key, label]) => `
    <div class="grid grid-cols-[8.5rem_1fr] gap-2 py-1 border-b border-slate-700/50 text-xs">
      <span class="text-slate-400" data-i18n="${key}">${label}</span>
      <span class="text-slate-100 font-medium tracking-widest">••••••••</span>
    </div>`;
  root.innerHTML = liveIdeas.map((idea) => `
      <div class="advisory-card !items-start flex-col !flex">
        ${ideaHead(idea.headline, null, idea.totalConfidence, '<span class="pro-badge" data-i18n="research.badge.locked">Thesis locked</span>')}
        ${renderScoreBars(idea.scoring)}
        <div class="lock-wrap w-full mt-3">
          <div class="lock-blur">
            <p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1" data-i18n="research.the-trade">The trade</p>
            ${[['research.field.entry-zone', 'Entry zone'], ['research.field.targets', 'Target(s)'], ['research.field.stop', 'Stop / invalidation'], ['research.field.risk-reward', 'Risk / reward']].map(placeholderRow).join('')}
          </div>
          <div class="lock-over">
            <div class="lock-ic">🔒</div>
            <p class="lock-msg" data-i18n="research.lock-msg">Entry, targets, invalidation and the full scorecard unlock with the course, or on their own monthly.</p>
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
  promo: null,
};

// A code from a campaign link may apply to one product, both, or neither. The price
// on each button has to be the price that will actually be charged.
function priceNow(which) {
  const p = access.promo;
  if (p && p.valid && p[which]) return p[which].label;
  return access[which].priceLabel;
}

function promoNote(which) {
  const p = access.promo;
  if (!p) return '';
  if (!p.valid) {
    return `<p class="promo-note is-bad">Code <b>${escapeHtml(p.code)}</b> isn’t valid or has expired — prices shown are the standard ones.</p>`;
  }
  if (!p[which]) return '';
  const was = p[which].wasLabel ? `<s class="promo-was">${escapeHtml(p[which].wasLabel)}</s> ` : '';
  return `<p class="promo-note is-good">✓ Code <b>${escapeHtml(p.code)}</b> applied — ${was}<b>${escapeHtml(p[which].label)}</b></p>`;
}
let selectedDate = null;

// ui.js loads before this file. The fallback exists only so a stale service-worker
// cache that misses ui.js degrades to a plain page rather than a blank one.
const ui = window.SCERE_UI || {
  say() {}, setBusy() { return function () {}; }, skeleton() { return ''; },
  alertDialog(o) { window.alert(o.message); }, openDialog() { return Promise.resolve(null); },
  focusHeading() {}, isEmail() { return true; }, strings: { invalidEmail: 'Enter a valid email address.' },
};

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
    status.textContent = tr('research.access.open-preview', 'Open preview');
    status.className = 'text-xs font-semibold text-slate-500';
    bar.innerHTML = '';
    return;
  }

  const idealPrice = priceNow('ideas') ? escapeHtml(priceNow('ideas')) : '';
  const coursePrice = priceNow('course') ? escapeHtml(priceNow('course')) : '';
  const signOut = '<button id="logoutBtn" type="button" class="underline hover:text-slate-200" data-i18n="research.access.sign-out">Sign out</button>';

  if (access.entitled) {
    // Included with the course vs. paid for monthly are different situations and the
    // page should not pretend otherwise — one of them is going to end on a known date.
    if (access.ideasSource === 'included') {
      const until = formatDate(access.ideasUntil);
      status.textContent = `✓ ${tr('research.access.included', 'Included with your course')}`;
      status.className = 'text-xs font-semibold text-emerald-300';
      bar.innerHTML = `<div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>${until
            ? tr('research.access.included-until', 'The daily ideas come with your course until <strong class="text-slate-200">{until}</strong>.', { until: escapeHtml(until) })
            : tr('research.access.included-plain', 'The daily ideas come with your course.')} ${idealPrice
            ? tr('research.access.then-optional-priced', 'After that they are optional, at {price} — your course access is untouched either way.', { price: idealPrice })
            : tr('research.access.then-optional', 'After that they are optional — your course access is untouched either way.')}</span>
          ${signOut}
        </div>`;
    } else {
      status.textContent = `✓ ${tr('research.access.sub-active', 'Subscription active')}`;
      status.className = 'text-xs font-semibold text-emerald-300';
      bar.innerHTML = `<div class="flex items-center gap-3 text-xs text-slate-400">
          <span data-i18n="research.access.full-access">You have full access to every live thesis.</span>
          ${signOut}
        </div>`;
    }
    const lo = document.getElementById('logoutBtn'); if (lo) lo.onclick = doLogout;
    return;
  }

  status.textContent = `🔒 ${tr('research.access.locked', 'Locked')}`;
  status.className = 'text-xs font-semibold text-amber-300';

  // A course owner whose included months have run out is not a stranger being asked to
  // buy — they are being asked to continue. Only the subscription is offered.
  if (access.ownsCourse) {
    bar.innerHTML = `
      <div class="paywall-card">
        <div class="paywall-icon">🔒</div>
        <p class="text-sm text-slate-200 font-semibold mb-1" data-i18n="research.lapsed.title">Your three included months have ended</p>
        <p class="text-xs text-slate-400 mb-1 max-w-sm mx-auto">${escapeHtml(idealPrice
          ? tr('research.lapsed.msg-priced', 'Your course is unaffected and stays yours. To keep receiving the daily ideas, they are {price}. The track record above stays free, always.', { price: idealPrice })
          : tr('research.lapsed.msg', 'Your course is unaffected and stays yours. The track record above stays free, always.'))}</p>
        ${access.ideas.available ? `<button id="subscribeBtn" type="button" class="upgrade-btn">${escapeHtml(idealPrice
          ? tr('research.lapsed.keep-priced', 'Keep the daily ideas · {price}', { price: idealPrice })
          : tr('research.lapsed.keep', 'Keep the daily ideas'))}</button>${promoNote('ideas')}` : ''}
        <p class="text-[11px] text-slate-500 mt-3"><span data-i18n="research.already-subscribed">Already subscribed?</span> <button id="restoreBtn" type="button" class="underline hover:text-slate-300" data-i18n="research.restore-access">Restore access</button></p>
      </div>`;
  } else {
    // Never bought anything: lead with the course, since it is the better deal for
    // anyone who wants both, and keep the ideas-only path plainly available.
    bar.innerHTML = `
      <div class="paywall-card">
        <div class="paywall-icon">🔒</div>
        <p class="text-sm text-slate-200 font-semibold mb-1" data-i18n="research.unlock.title">Unlock every live thesis</p>
        <p class="text-xs text-slate-400 mb-3 max-w-sm mx-auto" data-i18n="research.unlock.msg">Full entries, targets, invalidation and the weighted six-pillar scorecard, updated daily. The track record above stays free, always.</p>
        ${access.course.available ? `
          <button id="buyCourseBtn" type="button" class="upgrade-btn">${escapeHtml(coursePrice
            ? tr('research.unlock.buy-course-priced', 'Get the course · {price}', { price: coursePrice })
            : tr('research.unlock.buy-course', 'Get the course'))}</button>
          <p class="text-[11px] text-slate-400 mt-2 max-w-sm mx-auto" data-i18n="research.unlock.course-note">Yours permanently, and it includes three months of these ideas.</p>
          ${promoNote('course')}` : ''}
        ${access.ideas.available ? `
          <p class="text-[11px] text-slate-500 mt-3"><span data-i18n="research.unlock.just-ideas">Just want the ideas?</span> <button id="subscribeBtn" type="button" class="underline hover:text-slate-300">${escapeHtml(idealPrice
            ? tr('research.unlock.subscribe-priced', 'Subscribe · {price}', { price: idealPrice })
            : tr('research.unlock.subscribe', 'Subscribe'))}</button></p>` : ''}
        <p class="text-[11px] text-slate-500 mt-2"><span data-i18n="research.already-paid">Already paid?</span> <button id="restoreBtn" type="button" class="underline hover:text-slate-300" data-i18n="research.restore-access">Restore access</button></p>
      </div>`;
  }
  const sub = document.getElementById('subscribeBtn'); if (sub) sub.onclick = doSubscribe;
  const buy = document.getElementById('buyCourseBtn'); if (buy) buy.onclick = doBuyCourse;
  document.getElementById('restoreBtn').onclick = doRestore;
}

// Shared by both buy buttons — the only difference is which product is requested and
// which page Stripe returns to, and the server decides the latter.
async function startCheckout(btn, product, unavailableMsg) {
  // Disabling matters as much as relabelling: two clicks on a checkout button used to
  // mean two Checkout Sessions.
  const restore = ui.setBusy(btn, tr('research.checkout.busy', 'Taking you to checkout…'));
  try {
    const res = await postJson('/api/billing?fn=createCheckout', { product, code: (ui.promoCode ? ui.promoCode() : null) || undefined });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) { window.location.href = d.url; return; }  // stay busy; navigating away
    // These mean the page is simply out of date about what this visitor already has —
    // not an error to apologise for. Re-read and say what actually changed.
    if (d.error === 'already_owned' || d.error === 'already_included' || d.error === 'already_subscribed') {
      restore();
      await loadReport(selectedDate);
      ui.say(d.error === 'already_included'
        ? tr('research.checkout.already-included', 'You already have the daily ideas — they are included with your course.')
        : tr('research.checkout.already-have', 'You already have this. The page has been updated.'), true);
      return;
    }
    restore();
    ui.alertDialog({
      tone: 'error',
      title: tr('research.checkout.unavailable-title', 'Checkout is unavailable'),
      message: `${unavailableMsg} ${tr('research.checkout.nothing-charged', 'Nothing has been charged.')}`,
    });
  } catch (e) {
    restore();
    ui.alertDialog({
      tone: 'error',
      title: navigator.onLine === false
        ? tr('research.checkout.offline-title', 'You’re offline')
        : tr('research.checkout.failed-title', 'Couldn’t start checkout'),
      message: navigator.onLine === false
        ? tr('research.checkout.offline-msg', 'Reconnect and try again — nothing has been charged.')
        : tr('research.checkout.failed-msg', 'Something went wrong before we reached the payment page. Nothing has been charged.'),
    });
  }
}

function doSubscribe() {
  return startCheckout(document.getElementById('subscribeBtn'), 'ideas', tr('research.checkout.subs-unavailable', 'Subscriptions aren’t available right now. Please try again later.'));
}

function doBuyCourse() {
  return startCheckout(document.getElementById('buyCourseBtn'), 'course', tr('research.checkout.course-unavailable', 'The course isn’t available to buy right now. Please try again shortly.'));
}

// Restoring access is the recovery path for someone who has already paid and cannot
// get in — the single highest-stakes interaction in the app.
//
// It used to POST the address straight to /api/billing?fn=restore, which re-issued
// full entitlement to whoever asked. Typing a customer's email was enough to be
// granted their course and their subscription. It now emails a single-use link to
// that address instead, so proving you can read the inbox is what unlocks the
// account — and the shared dialog lives in ui.js because learn.js needs the same one.
async function doRestore() {
  await ui.requestAccessLink();
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
  // api/auth sends an ideas subscriber here after a magic link is consumed. The
  // cookies are already set; what is missing is any sign that it worked, and landing
  // on a page that merely looks unlocked is when people wonder whether it did.
  if (p.get('restored')) {
    ui.say(tr('research.say.restored', 'Access restored. You are signed in on this device.'), true);
  }
  if (sub || p.get('restored')) window.history.replaceState({}, '', window.location.pathname);
}

async function loadBillingConfig() {
  try {
    const code = ui.promoCode ? ui.promoCode() : null;
    const c = await fetchJson('/api/billing?fn=config' + (code ? `&code=${encodeURIComponent(code)}` : ''));
    access.configured = !!c.configured;
    access.course = c.course || { available: false, priceLabel: null };
    access.ideas = c.ideas || { available: false, priceLabel: null };
    access.promo = c.promo || null;
  } catch (e) { /* leave defaults; paywall treated as inactive */ }
}

// ---- data plumbing -------------------------------------------------------

async function loadReport(dateKey) {
  selectedDate = dateKey || null;
  const loadingEl = document.getElementById('loadingState');
  // A shaped placeholder rather than the words "Loading the desk…": it holds the
  // layout so the report appears in place instead of shoving the page down, and it
  // shows how much is coming.
  loadingEl.innerHTML = ui.skeleton(4);
  loadingEl.classList.remove('hidden');
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

    // Empty it as well as hide it: a role="status" region left holding stale skeleton
    // markup stays in the accessibility tree and can be read out as if it were content.
    loadingEl.innerHTML = '';
    loadingEl.classList.add('hidden');
    document.getElementById('researchRoot').classList.remove('hidden');
    ui.say(pub.reportDateLabel
      ? tr('research.say.report-dated', 'Report for {date} loaded.', { date: pub.reportDateLabel })
      : tr('research.say.report', 'Report loaded.'));
  } catch (err) {
    console.error('Failed to load research data:', err);
    loadingEl.innerHTML = '';
    loadingEl.classList.add('hidden');
    const errEl = document.getElementById('errorState');
    // Three genuinely different situations that used to share one message. Telling a
    // reader "no data yet" when they are simply offline, or handing them an internal
    // file path as an explanation, is not an error message — it is a shrug.
    const offline = navigator.onLine === false;
    const missing = err && err.status === 404;
    errEl.innerHTML = `
      <div class="state-card is-error">
        <span class="state-icon" aria-hidden="true">${offline ? '📡' : missing ? '📭' : '⚠️'}</span>
        <p class="state-title">${escapeHtml(offline
          ? tr('research.err.offline-title', 'You’re offline')
          : missing
            ? tr('research.err.missing-title', 'No report for that date')
            : tr('research.err.desk-title', 'The desk could not be loaded'))}</p>
        <p class="state-msg">${escapeHtml(offline
          ? tr('research.err.offline-msg', 'Reconnect and we’ll pick up where you left off. Lessons you have already opened are still available.')
          : missing
            ? tr('research.err.missing-msg', 'Nothing was published for that day. Pick another date above — the most recent report is selected by default.')
            : tr('research.err.our-end', 'Something went wrong at our end. Trying again usually fixes it.'))}</p>
        <button type="button" class="ui-btn ui-btn-primary" data-retry data-i18n="research.err.retry">Try again</button>
      </div>`;
    errEl.classList.remove('hidden');
    const retry = errEl.querySelector('[data-retry]');
    if (retry) retry.addEventListener('click', () => loadReport(selectedDate));
  }
}

async function populateHistorySelect() {
  const select = document.getElementById('historySelect');
  try {
    const { dates } = await fetchJson('/api/research?fn=index');
    const sorted = [...(dates || [])].sort().reverse();
    if (!sorted.length) { select.classList.add('hidden'); return; }
    select.innerHTML = sorted.map((date, i) => `<option value="${date}" ${i === 0 ? 'selected' : ''}>${date}${i === 0 ? ` · ${escapeHtml(tr('research.history.latest', 'latest'))}` : ''}</option>`).join('');
    select.addEventListener('change', () => loadReport(select.value));
  } catch {
    select.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Renderers below compose strings through tr(), which answers in English until the
  // locale JSON lands. Waiting is what stops the desk rendering twice.
  if (window.SCERE_I18N) { try { await window.SCERE_I18N.ready; } catch (e) { /* English */ } }
  await handleCheckoutReturn();
  await loadBillingConfig();
  await populateHistorySelect();
  loadReport(null);
});
