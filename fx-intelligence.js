// Renders the parsed FX dashboard JSON (produced by scripts/parse-fx-report.js from
// the daily-fx-dashboard scheduled task's markdown output) as app cards. Every
// render function degrades gracefully to "no data" rather than throwing, since the
// parser's own resilience guarantee (raw markdown per section, even when structured
// extraction finds nothing) only helps if the renderer honors missing fields too.

const DATA_DIR = './data/fx-reports';

function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function biasClass(text) {
  if (!text) return 'trend-flat';
  const t = text.toLowerCase();
  if (t.includes('bullish') || t.includes('hawkish')) return 'trend-up';
  if (t.includes('bearish') || t.includes('dovish')) return 'trend-down';
  return 'trend-flat';
}

// ---------- generic table renderer (used for policy rates, equity leaderboard, etc.) ----------

function renderTable(tableData) {
  if (!tableData || !tableData.rows || !tableData.rows.length) return '<p class="text-slate-400 text-sm">No data.</p>';
  const headers = tableData.headers || Object.keys(tableData.rows[0]);
  const keys = Object.keys(tableData.rows[0]);
  return `
    <table class="w-full text-xs border-collapse">
      <thead>
        <tr class="text-left text-slate-400 uppercase tracking-wide">
          ${headers.map((h) => `<th class="pb-2 pr-3 font-semibold">${escapeHtml(h)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${tableData.rows.map((row) => `
          <tr class="border-t border-slate-700/60 align-top">
            ${keys.map((k) => `<td class="py-2 pr-3 text-slate-200">${escapeHtml(row[k])}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ---------- section renderers ----------

function renderHeroCard(data) {
  const dd = data.decisionDashboard || {};
  const regime = data.regime || {};
  const ds = data.decisionSummary || {};
  const conf = dd.overallConfidence != null ? dd.overallConfidence : ds.overallConfidence;

  const rows = [
    ds.topIdea ? ['Best opportunity', `${escapeHtml(ds.topIdea.label)} — ${ds.topIdea.confidence}/100`] : null,
    ds.avoid ? ['Avoid', escapeHtml(ds.avoid.label)] : null,
    ds.nextEvent ? ['Next event', escapeHtml(ds.nextEvent)] : null,
  ].filter(Boolean);

  return `
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-wider text-blue-200">${escapeHtml(data.reportDateLabel || data.reportDate || '')}</p>
        <h2 class="text-lg font-bold mt-1">${escapeHtml(regime.classification ? regime.classification.split('—')[0].split(',')[0] : 'Market Regime')}</h2>
      </div>
      ${conf != null ? `
        <div class="text-right shrink-0">
          <div class="text-3xl font-extrabold">${conf}<span class="text-base font-medium text-blue-200">/100</span></div>
          <p class="text-[11px] text-blue-200">Overall confidence${dd.confidenceDelta ? ` · ${escapeHtml(dd.confidenceDelta)}` : ''}</p>
        </div>
      ` : ''}
    </div>
    ${dd.portfolioTiltNote ? `<p class="text-xs text-blue-100 mt-3">${escapeHtml(dd.portfolioTiltNote)}</p>` : ''}
    ${rows.length ? `
      <div class="mt-4 pt-3 border-t border-blue-400/30 space-y-1.5">
        ${rows.map(([label, value]) => `
          <div class="flex items-start justify-between gap-3 text-xs">
            <span class="text-blue-200 shrink-0">${label}</span>
            <span class="text-blue-50 text-right font-medium">${value}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function renderMorningBrief(data) {
  const brief = data.decisionSummary && data.decisionSummary.morningBrief;
  document.getElementById('morningBriefCard').innerHTML = brief
    ? `
      <span class="advisory-icon">📋</span>
      <div>
        <p class="font-semibold text-sm mb-1">Morning Brief</p>
        <p class="text-xs opacity-90">${escapeHtml(brief)}</p>
      </div>
    `
    : `
      <span class="advisory-icon">📋</span>
      <div>
        <p class="font-semibold text-sm mb-1">Morning Brief</p>
        <p class="text-xs opacity-90">Not enough structured data in this report to assemble a summary — see the full sections below.</p>
      </div>
    `;
}

// "Decision Engine": renders the single highest-confidence trade idea's own
// component scoring (Macro/Technicals/Positioning/Sentiment/Volatility — whatever
// components the source report actually used) as bars, plus a "Watch" line.
// Deliberately not "BUY NOW" language — this mirrors the report's own framing of
// these as analytical scenarios, not directives.
function renderDecisionEngine(data) {
  const ds = data.decisionSummary || {};
  const section = document.getElementById('decisionEngineSection');
  const target = document.getElementById('decisionEngineCard');
  const top = ds.topIdea;

  if (!top) {
    const fallback = ds.avoid && ds.avoid.source === 'excluded' ? ds.avoid.reason : null;
    target.innerHTML = `
      <p class="font-semibold text-sm">No high-conviction idea flagged today.</p>
      ${fallback ? `<p class="text-xs opacity-80 mt-1.5">${escapeHtml(fallback)}</p>` : '<p class="text-xs opacity-80 mt-1.5">See Performance Review and Trade Ideas below for what is being tracked.</p>'}
    `;
    section.classList.remove('hidden');
    return;
  }

  const scoreRows = top.scoring && top.scoring.rows.length
    ? top.scoring.rows.map((r) => {
        const keys = Object.keys(r);
        const label = r[keys[0]];
        const contribution = r.contribution || r[keys[2]] || '';
        const [num, den] = String(contribution).split('/').map((x) => parseFloat(x));
        const pct = num != null && den ? Math.round((num / den) * 100) : null;
        return `
          <div class="mb-2 last:mb-0">
            <div class="flex justify-between text-xs mb-0.5">
              <span class="text-slate-300">${escapeHtml(label)}</span>
              <span class="text-slate-400">${escapeHtml(contribution)}</span>
            </div>
            ${pct != null ? `<div class="w-full bg-slate-700/60 rounded-full h-1.5"><div class="h-1.5 rounded-full bg-current" style="width:${pct}%"></div></div>` : ''}
          </div>
        `;
      }).join('')
    : '<p class="text-xs opacity-70">No component breakdown parsed for this idea.</p>';

  target.innerHTML = `
    <div class="flex items-start justify-between w-full gap-3">
      <p class="font-semibold text-sm">Watch ${escapeHtml(top.label)}</p>
      ${top.confidence != null ? `<span class="shrink-0 text-xs font-bold bg-slate-900/40 rounded-full px-2.5 py-1">${top.confidence}/100</span>` : ''}
    </div>
    ${top.delta ? `<p class="text-[11px] opacity-70 mt-1">${escapeHtml(top.delta)}</p>` : ''}
    <div class="w-full mt-3">${scoreRows}</div>
  `;
  section.classList.remove('hidden');
}

function renderNoTradeZone(data) {
  const nt = data.noTradeZone;
  const section = document.getElementById('noTradeSection');
  if (!nt || nt.flagged == null) { section.classList.add('hidden'); return; }
  document.getElementById('noTradeContent').innerHTML = `
    <div class="advisory-card ${nt.flagged ? 'alert-high' : 'alert-low'}">
      <span class="advisory-icon">${nt.flagged ? '🚧' : '✅'}</span>
      <div>
        <p class="font-semibold text-sm">${nt.flagged ? 'No-Trade Zone: elevated caution' : 'No-Trade Zone: not flagged'}</p>
        <p class="text-xs opacity-90 mt-0.5">${escapeHtml(nt.text)}</p>
      </div>
    </div>
  `;
  section.classList.remove('hidden');
}

function renderRegime(data) {
  const r = data.regime;
  document.getElementById('regimeContent').innerHTML = r
    ? `
      <span class="advisory-icon">🧭</span>
      <div>
        ${r.classification ? `<p class="font-semibold text-sm">${escapeHtml(r.classification)}</p>` : ''}
        ${r.justification ? `<p class="text-xs opacity-90 mt-1">${escapeHtml(r.justification)}</p>` : ''}
        ${r.executiveSummary ? `<p class="text-xs opacity-80 mt-2 border-t border-slate-700/60 pt-2">${escapeHtml(r.executiveSummary)}</p>` : ''}
      </div>
    `
    : '<p class="text-slate-400 text-sm">No regime summary parsed for this report.</p>';
}

function renderPerformanceReview(data) {
  const pr = data.performanceReview;
  const el2 = document.getElementById('performanceContent');
  if (!pr || !pr.ideas || !pr.ideas.length) {
    el2.innerHTML = '<p class="text-slate-400 text-sm">No open ideas tracked yet.</p>';
    return;
  }
  const keys = Object.keys(pr.ideas[0]);
  el2.innerHTML = `
    ${pr.hitRateSummary ? `<p class="text-xs text-slate-300 mb-2">${escapeHtml(pr.hitRateSummary)}</p>` : ''}
    <div class="space-y-2">
      ${pr.ideas.map((row) => `
        <div class="row-card items-start flex-col !items-stretch gap-1">
          ${keys.map((k) => `<p class="text-xs"><span class="text-slate-400">${escapeHtml(k)}:</span> <span class="text-slate-200">${escapeHtml(row[k])}</span></p>`).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderCurrencyStrength(data) {
  const cs = data.currencyStrength;
  const el2 = document.getElementById('currencyStrengthContent');
  if (!cs || !cs.rows || !cs.rows.length) { el2.innerHTML = '<p class="text-slate-400 text-sm">No data.</p>'; return; }
  const strengthKey = Object.keys(cs.rows[0]).find((k) => k.includes('strength')) || Object.keys(cs.rows[0])[1];
  const currencyKey = Object.keys(cs.rows[0])[0];
  const biasKey = Object.keys(cs.rows[0]).find((k) => k.includes('bias'));
  const driverKey = Object.keys(cs.rows[0]).find((k) => k.includes('driver'));
  const weeklyKey = Object.keys(cs.rows[0]).find((k) => k.includes('weekly') || k.includes('chg'));

  el2.innerHTML = cs.rows.map((row) => {
    const val = parseFloat(row[strengthKey]) || 0;
    return `
      <div class="advisory-card ${biasClass(row[biasKey])}">
        <span class="advisory-icon font-bold text-base">${escapeHtml(row[currencyKey])}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold">${val}/100${weeklyKey ? ` <span class="text-xs opacity-70">(${escapeHtml(row[weeklyKey])})</span>` : ''}</span>
            ${biasKey ? `<span class="text-[11px] opacity-80">${escapeHtml(row[biasKey])}</span>` : ''}
          </div>
          <div class="w-full bg-slate-700/60 rounded-full h-1.5 mt-1.5">
            <div class="h-1.5 rounded-full bg-current" style="width:${Math.max(0, Math.min(100, val))}%"></div>
          </div>
          ${driverKey ? `<p class="text-xs opacity-80 mt-1.5">${escapeHtml(row[driverKey])}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderPolicyRates(data) {
  document.getElementById('policyRatesContent').innerHTML = renderTable(data.policyRates);
}

function renderTier1(data) {
  const t1 = data.tier1Pairs;
  const el2 = document.getElementById('tier1Content');
  if (!t1) { el2.innerHTML = '<p class="text-slate-400 text-sm">No data.</p>'; return; }
  if (t1.format === 'table' && t1.table) { el2.innerHTML = renderTable(t1.table); return; }
  if (t1.format === 'bullets' && t1.items && t1.items.length) {
    el2.innerHTML = t1.items.map((item) => `
      <div class="row-card !items-start !flex-col gap-1">
        <span class="text-sm font-semibold">${escapeHtml(item.pair)}</span>
        <span class="text-xs text-slate-300">${escapeHtml(item.detail)}</span>
      </div>
    `).join('');
    return;
  }
  el2.innerHTML = '<p class="text-slate-400 text-sm">No data.</p>';
}

function renderSynthesis(data) {
  const section = document.getElementById('synthesisSection');
  const target = document.getElementById('synthesisContent');
  const raw = (data.sections || []).find((s) => s.title.toLowerCase().includes('layer-by-layer'));
  if (!raw || !raw.raw) { section.classList.add('hidden'); return; }
  // Split on bold pair/theme headers (e.g. "**USD/JPY**") — same shape in every
  // sample report even though the layer bullet formatting varies slightly.
  const parts = raw.raw.split(/\n(?=\*\*[^*]+\*\*\s*\n)/);
  target.innerHTML = parts.filter((p) => p.trim()).map((chunk) => {
    const headMatch = chunk.match(/^\*\*([^*]+)\*\*/);
    const heading = headMatch ? headMatch[1].trim() : null;
    const body = chunk.replace(/^\*\*[^*]+\*\*/, '').trim();
    return `
      <div class="advisory-card alert-teaser !items-start">
        <span class="advisory-icon">🔍</span>
        <div class="min-w-0">
          ${heading ? `<p class="font-semibold text-sm mb-1">${escapeHtml(heading)}</p>` : ''}
          <div class="text-xs opacity-90 space-y-1">${renderInlineMarkdownLines(body)}</div>
        </div>
      </div>
    `;
  }).join('');
  section.classList.remove('hidden');
}

// Minimal inline-markdown line renderer: turns "- *Label:* text" bullet lines into
// styled rows and strips remaining ** / * markers. Deliberately small — this app has
// no markdown library dependency, consistent with the rest of the codebase.
function renderInlineMarkdownLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const bulletMatch = line.match(/^-\s*\*(.+?)\*:?\s*(.*)$/);
      if (bulletMatch) {
        return `<p><span class="text-slate-400">${escapeHtml(bulletMatch[1].replace(/:$/, ''))}:</span> ${escapeHtml(bulletMatch[2])}</p>`;
      }
      return `<p>${escapeHtml(line.replace(/^-\s*/, ''))}</p>`;
    })
    .join('');
}

function renderCorrelation(data) {
  const cc = data.correlationCheck;
  document.getElementById('correlationContent').innerHTML = cc
    ? `
      <span class="advisory-icon">${cc.read && cc.read.toLowerCase().includes('clean') ? '✅' : '⚠️'}</span>
      <div>
        ${cc.read ? `<p class="font-semibold text-sm">Read: ${escapeHtml(cc.read)}</p>` : ''}
        ${cc.text ? `<p class="text-xs opacity-90 mt-1">${escapeHtml(cc.text)}</p>` : ''}
      </div>
    `
    : '<p class="text-slate-400 text-sm">No data.</p>';
}

function renderRatesRisk(data) {
  const rr = data.ratesRiskBackdrop;
  const el2 = document.getElementById('ratesRiskContent');
  if (!rr || !rr.rows || !rr.rows.length) { el2.innerHTML = '<p class="text-slate-400 text-sm">No data.</p>'; return; }
  const keys = Object.keys(rr.rows[0]);
  el2.innerHTML = rr.rows.map((row) => `
    <div class="row-card">
      <span class="text-sm font-medium text-slate-300">${escapeHtml(row[keys[0]])}</span>
      <span class="text-sm font-semibold">${escapeHtml(row[keys[1]])}</span>
    </div>
  `).join('');
}

function renderTradeIdeas(data) {
  const ti = data.tradeIdeas;
  const el2 = document.getElementById('tradeIdeasContent');
  if (!ti || !ti.ideas || !ti.ideas.length) { el2.innerHTML = '<p class="text-slate-400 text-sm">No high-conviction ideas in this report.</p>'; return; }

  const ideaCards = ti.ideas.map((idea) => {
    const bias = idea.fields.Bias || idea.fields.Rationale || '';
    const bClass = biasClass(bias);
    const fieldOrder = ['Entry Zone', 'Target(s)', 'Stop / Invalidation', 'Risk/Reward'];
    const fieldRows = fieldOrder.filter((k) => idea.fields[k]).map((k) => `
      <div class="flex justify-between text-xs py-1 border-b border-slate-700/40 last:border-0">
        <span class="text-slate-400">${escapeHtml(k)}</span>
        <span class="text-slate-200 font-medium text-right">${escapeHtml(idea.fields[k])}</span>
      </div>
    `).join('');
    const scoringRows = idea.scoring && idea.scoring.rows.length
      ? idea.scoring.rows.map((r) => {
          const keys = Object.keys(r);
          const label = r[keys[0]];
          const contribution = r.contribution || r[keys[2]] || '';
          const [num, den] = String(contribution).split('/').map((x) => parseFloat(x));
          const pct = num != null && den ? Math.round((num / den) * 100) : null;
          return `
            <div class="mb-1.5 last:mb-0">
              <div class="flex justify-between text-[11px] mb-0.5">
                <span class="text-slate-400">${escapeHtml(label)}</span>
                <span class="text-slate-300">${escapeHtml(contribution)}</span>
              </div>
              ${pct != null ? `<div class="w-full bg-slate-700/60 rounded-full h-1"><div class="h-1 rounded-full bg-current" style="width:${pct}%"></div></div>` : ''}
            </div>
          `;
        }).join('')
      : '';

    return `
      <div class="advisory-card ${bClass} !items-start flex-col !flex">
        <div class="flex items-start justify-between w-full gap-3">
          <p class="font-semibold text-sm">${escapeHtml(idea.headline)}</p>
          ${idea.totalConfidence != null ? `<span class="shrink-0 text-xs font-bold bg-slate-900/40 rounded-full px-2.5 py-1">${idea.totalConfidence}/100</span>` : ''}
        </div>
        ${bias ? `<p class="text-xs opacity-90 mt-1">${escapeHtml(bias)}</p>` : ''}
        ${idea.confidenceDelta ? `<p class="text-[11px] opacity-70 mt-1">${escapeHtml(idea.confidenceDelta)}</p>` : ''}
        ${fieldRows ? `<div class="w-full mt-3 bg-slate-900/30 rounded-lg p-2.5">${fieldRows}</div>` : ''}
        ${idea.confirmationCriteria ? `<p class="text-xs opacity-80 mt-2"><span class="text-slate-400">Confirmation criteria to watch for: </span>${escapeHtml(idea.confirmationCriteria)}</p>` : ''}
        ${scoringRows ? `<div class="w-full mt-3"><p class="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">Confidence breakdown</p>${scoringRows}</div>` : ''}
      </div>
    `;
  }).join('');

  const excludedCard = ti.excluded ? `
    <div class="advisory-card alert-low !items-start">
      <span class="advisory-icon">🚫</span>
      <div>
        <p class="font-semibold text-sm">No high-conviction trade: ${escapeHtml(ti.excluded.title)}</p>
        <p class="text-xs opacity-90 mt-1">${escapeHtml(ti.excluded.reasoning)}</p>
      </div>
    </div>
  ` : '';

  el2.innerHTML = ideaCards + excludedCard;
}

function renderContrarian(data) {
  const cc = data.contrarianCheck;
  const el2 = document.getElementById('contrarianContent');
  if (!cc) { el2.innerHTML = '<p class="text-slate-400 text-sm">No data.</p>'; return; }
  const rows = [
    ['Primary thesis risk', cc.primaryRisk, 'alert-high'],
    ['Overall invalidation factor', cc.invalidationFactor, 'alert-moderate'],
    ['Bull case', cc.bullCase, 'trend-up'],
    ['Base case', cc.baseCase, 'trend-flat'],
    ['Bear case', cc.bearCase, 'trend-down'],
  ].filter(([, v]) => v);
  el2.innerHTML = rows.map(([label, value, cls]) => `
    <div class="advisory-card ${cls} !items-start">
      <div>
        <p class="font-semibold text-sm">${escapeHtml(label)}</p>
        <p class="text-xs opacity-90 mt-1">${escapeHtml(value)}</p>
      </div>
    </div>
  `).join('');
}

function renderEquityLeaderboard(data) {
  document.getElementById('equityLeaderboardContent').innerHTML = renderTable(data.globalEquityLeaderboard);
}

function renderCatalysts(data) {
  const raw = (data.sections || []).find((s) => s.title.toLowerCase().includes('economic catalyst'));
  document.getElementById('catalystContent').innerHTML = raw && raw.raw
    ? `<span class="advisory-icon">📅</span><div class="text-xs opacity-90 space-y-2">${renderParagraphs(raw.raw)}</div>`
    : '<p class="text-slate-400 text-sm">No data.</p>';
}

function renderParagraphs(text) {
  return text.split(/\n\n+/).map((p) => `<p>${escapeHtml(stripBold(p.trim()))}</p>`).join('');
}
function stripBold(text) { return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'); }

function renderKeyThemes(data) {
  const el2 = document.getElementById('keyThemesContent');
  if (!data.keyThemes || !data.keyThemes.length) { el2.innerHTML = '<p class="text-slate-400 text-sm">No data.</p>'; return; }
  el2.innerHTML = data.keyThemes.map((t, i) => `
    <div class="advisory-card alert-teaser">
      <span class="advisory-icon">${i + 1}️⃣</span>
      <p class="text-xs opacity-90">${escapeHtml(t)}</p>
    </div>
  `).join('');
}

function renderHistorical(data) {
  const raw = (data.sections || []).find((s) => s.title.toLowerCase().includes('historical parallel'));
  document.getElementById('historicalContent').innerHTML = raw && raw.raw
    ? `<span class="advisory-icon">🕰️</span><p class="text-xs opacity-90">${escapeHtml(stripBold(raw.raw))}</p>`
    : '<p class="text-slate-400 text-sm">No data.</p>';
}

function renderKnownIssues(data) {
  const el2 = document.getElementById('knownIssuesContent');
  if (!data.knownIssues || !data.knownIssues.length) { el2.innerHTML = '<p>No data.</p>'; return; }
  el2.innerHTML = data.knownIssues.map((issue) => `<p>• ${escapeHtml(issue)}</p>`).join('');
}

// ---------- orchestration ----------

function renderReport(data) {
  renderMorningBrief(data);
  document.getElementById('heroCard').innerHTML = renderHeroCard(data);
  renderDecisionEngine(data);
  renderNoTradeZone(data);
  renderRegime(data);
  renderPerformanceReview(data);
  renderCurrencyStrength(data);
  renderPolicyRates(data);
  renderTier1(data);
  renderSynthesis(data);
  renderCorrelation(data);
  renderRatesRisk(data);
  renderTradeIdeas(data);
  renderContrarian(data);
  renderEquityLeaderboard(data);
  renderCatalysts(data);
  renderKeyThemes(data);
  renderHistorical(data);
  renderKnownIssues(data);

  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('reportRoot').classList.remove('hidden');
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// Subscriber gate: the full desk requires an active subscription. Shown in place
// of the report when /api/research?fn=full returns 402.
function showSubscribeGate() {
  const root = document.getElementById('reportRoot');
  root.innerHTML = `
    <div class="paywall-card">
      <div class="paywall-icon">🔒</div>
      <h2 class="text-lg font-bold text-slate-100 mb-1">The full FX Intelligence Desk is for subscribers</h2>
      <p class="text-sm text-slate-400 mb-4 max-w-md mx-auto">Regime, currency strength, policy rates, correlations, catalysts and every trade thesis — the complete daily report. The Research Desk shows today's regime, top idea and the full track record for free.</p>
      <a href="./research.html" class="upgrade-btn">Subscribe on the Research Desk →</a>
    </div>`;
  root.classList.remove('hidden');
}

async function loadReport(dateKey) {
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('reportRoot').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  try {
    // The full report is served only through the gated API — the raw data path
    // is blocked by middleware. 402 => needs a subscription.
    const q = dateKey ? `&date=${encodeURIComponent(dateKey)}` : '';
    const res = await fetch(`/api/research?fn=full${q}`);
    if (res.status === 402) {
      document.getElementById('loadingState').classList.add('hidden');
      showSubscribeGate();
      return;
    }
    if (!res.ok) throw new Error(`status ${res.status}`);
    const payload = await res.json();
    renderReport(payload.report);
  } catch (err) {
    console.error('Failed to load FX report:', err);
    document.getElementById('loadingState').classList.add('hidden');
    const errEl = document.getElementById('errorState');
    errEl.textContent = 'No FX report data found yet. Run scripts/parse-fx-report.js against a report in your FX-Reports folder, or wait for the next scheduled sync.';
    errEl.classList.remove('hidden');
  }
}

async function populateHistorySelect() {
  const select = document.getElementById('historySelect');
  try {
    const { dates } = await fetchJson('/api/research?fn=index');
    const sorted = [...(dates || [])].sort().reverse();
    if (!sorted.length) { select.classList.add('hidden'); return; }
    select.innerHTML = sorted.map((date, i) => `<option value="${date}" ${i === 0 ? 'selected' : ''}>${date}${i === 0 ? ' (latest)' : ''}</option>`).join('');
    select.addEventListener('change', () => loadReport(select.value));
  } catch {
    select.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateHistorySelect();
  loadReport(null);
});
