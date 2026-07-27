// Loads the raw, self-contained daily FX dashboard HTML into an <iframe>, with a
// date picker for history. The dashboard files are served through the gated
// /api/dashboard endpoint (the raw /data/daily-dashboard/* path is blocked by
// middleware), so the full report is subscriber-only. The report's own inline
// CSS/Chart.js stays isolated from the app inside the iframe.

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// Page-level subscribe gate, shown when the paywall is active and the viewer
// isn't subscribed. (The API also enforces server-side, so nothing leaks even
// if the iframe src is hit directly.)
function showSubscribeGate() {
  document.getElementById('loadingState').classList.add('hidden');
  const hs = document.getElementById('historySelect');
  if (hs) hs.classList.add('hidden');
  const wrap = document.getElementById('frameWrap');
  wrap.className = '';
  wrap.innerHTML = `
    <div class="paywall-card">
      <div class="paywall-icon">🔒</div>
      <h2 class="text-lg font-bold text-slate-100 mb-1">The Daily Dashboard is for subscribers</h2>
      <p class="text-sm text-slate-400 mb-4 max-w-md mx-auto">The full generated daily report — regime, currency strength, trade ideas and charts, exactly as generated — unlocks with a subscription. The Research Desk shows today's regime, top idea and the full track record for free.</p>
      <a href="./research.html" class="upgrade-btn">Subscribe on the Research Desk →</a>
    </div>`;
  wrap.classList.remove('hidden');
}

function showFrame(dateKey) {
  const loading = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const frameWrap = document.getElementById('frameWrap');
  const frame = document.getElementById('reportFrame');

  loading.classList.remove('hidden');
  errorState.classList.add('hidden');
  frameWrap.classList.add('hidden');

  const src = dateKey ? `/api/dashboard?date=${encodeURIComponent(dateKey)}` : '/api/dashboard';

  frame.onload = () => {
    loading.classList.add('hidden');
    frameWrap.classList.remove('hidden');
  };
  frame.onerror = () => {
    loading.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorState.textContent = 'Could not load that report.';
  };
  frame.src = src;
}

async function populateHistorySelect() {
  const select = document.getElementById('historySelect');
  try {
    const { dates } = await fetchJson('/api/dashboard?fn=index');
    const sorted = [...(dates || [])].sort().reverse();
    if (!sorted.length) throw new Error('No dates in index');
    select.innerHTML = sorted
      .map((date, i) => `<option value="${date}" ${i === 0 ? 'selected' : ''}>${date}${i === 0 ? ' (latest)' : ''}</option>`)
      .join('');
    select.addEventListener('change', () => showFrame(select.value));
  } catch (err) {
    console.error('Failed to load daily dashboard index:', err);
    select.classList.add('hidden');
  }
}

async function checkAccess() {
  try {
    return await fetchJson('/api/billing?fn=status');
  } catch {
    return { entitled: false, paywallActive: false };
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const access = await checkAccess();
  if (access.paywallActive && !access.entitled) {
    showSubscribeGate();
    return;
  }
  populateHistorySelect();
  showFrame(null);
});
