// Loads the raw, self-contained daily FX dashboard HTML (copied in as-is by
// scripts/sync-daily-dashboard.js from the fx-dashboard-YYYY-MM-DD.html files your
// daily-fx-dashboard scheduled task writes) into an <iframe>, with a date picker for
// history — same UX shape as fx-intelligence.js's historySelect, just pointed at a
// different data directory and swapping structured rendering for an iframe src, since
// this report's own inline CSS/Chart.js needs to stay isolated from the app's styles.

const DATA_DIR = './data/daily-dashboard';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function showFrame(dateKey) {
  const loading = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const frameWrap = document.getElementById('frameWrap');
  const frame = document.getElementById('reportFrame');

  loading.classList.remove('hidden');
  errorState.classList.add('hidden');
  frameWrap.classList.add('hidden');

  const src = dateKey ? `${DATA_DIR}/history/${dateKey}.html` : `${DATA_DIR}/latest.html`;

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
    const index = await fetchJson(`${DATA_DIR}/index.json`);
    const sorted = [...index].sort().reverse();
    if (!sorted.length) throw new Error('No dates in index.json');
    select.innerHTML = sorted
      .map((date, i) => `<option value="${date}" ${i === 0 ? 'selected' : ''}>${date}${i === 0 ? ' (latest)' : ''}</option>`)
      .join('');
    select.addEventListener('change', () => showFrame(select.value));
  } catch (err) {
    console.error('Failed to load daily dashboard index:', err);
    select.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateHistorySelect();
  showFrame(null);
});
