// Core app logic — plays the role app.js played in the weather app this was forked
// from: populate the picker, fetch data for the selected item, render cards, persist
// the user's choice. Kept dependency-free (no bundler, no chart library) for the same
// reasons documented in that app's PRO-FEATURES-ROADMAP.md Phase 0.5 (bandwidth
// constraints) — even though this fork's audience isn't necessarily low-bandwidth,
// there's no reason to add a build step or a charting dependency for one SVG line.

const STORAGE_KEY_INSTRUMENT = 'scere_markets_instrument';
let currentInstrument = null;

// ---------- Setup ----------

function populateInstrumentSelect() {
  const select = document.getElementById('instrumentSelect');
  const groups = {};
  window.SCERE_INSTRUMENTS.forEach((inst) => {
    if (!groups[inst.group]) groups[inst.group] = [];
    groups[inst.group].push(inst);
  });

  Object.entries(groups).forEach(([groupName, instruments]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupName;
    instruments.forEach((inst) => {
      const option = document.createElement('option');
      option.value = inst.id;
      option.textContent = inst.label;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });

  const saved = localStorage.getItem(STORAGE_KEY_INSTRUMENT);
  const initial = window.SCERE_INSTRUMENTS.find((i) => i.id === saved) ? saved : window.SCERE_INSTRUMENTS[0].id;
  select.value = initial;

  select.addEventListener('change', () => {
    localStorage.setItem(STORAGE_KEY_INSTRUMENT, select.value);
    loadInstrument(select.value);
  });
}

// ---------- Data fetching ----------

async function fetchJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function fetchInstrumentData(inst) {
  if (inst.type === 'equity_index') {
    const [quote, history] = await Promise.all([
      fetchJson(`/api/quote?symbol=${encodeURIComponent(inst.symbol)}`),
      fetchJson(`/api/history?symbol=${encodeURIComponent(inst.symbol)}`),
    ]);
    return { quote, history };
  }
  if (inst.type === 'macro') {
    const params = new URLSearchParams({ series: inst.macroFn, interval: inst.interval });
    if (inst.maturity) params.set('maturity', inst.maturity);
    const macro = await fetchJson(`/api/macro?${params.toString()}`);
    return { macro };
  }
  if (inst.type === 'fx') {
    const fx = await fetchJson(`/api/fx?base=${encodeURIComponent(inst.base)}&quote=${encodeURIComponent(inst.quote)}`);
    return { fx };
  }
  throw new Error(`Unknown instrument type: ${inst.type}`);
}

// ---------- Rendering: current quote ----------

function showApiKeyBanner(message) {
  const banner = document.getElementById('apiKeyBanner');
  banner.textContent = message;
  banner.classList.remove('hidden');
}

function hideApiKeyBanner() {
  document.getElementById('apiKeyBanner').classList.add('hidden');
}

function renderCurrentCard(inst, data) {
  const card = document.getElementById('currentQuote');
  const nameEl = document.getElementById('instrumentName');
  const priceEl = document.getElementById('currentPrice');
  const changeEl = document.getElementById('currentChange');
  const proxyEl = document.getElementById('proxyNote');

  nameEl.textContent = inst.label;
  proxyEl.textContent = inst.proxyNote || '';

  if (inst.type === 'equity_index') {
    const q = data.quote;
    if (q.error) return false;
    priceEl.textContent = `$${q.price.toFixed(2)}`;
    const sign = q.change >= 0 ? '+' : '';
    changeEl.textContent = `${sign}${q.change.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%) · ${q.latestTradingDay}`;
    changeEl.className = q.change >= 0 ? 'text-emerald-200 font-medium' : 'text-red-200 font-medium';
  } else if (inst.type === 'macro') {
    const m = data.macro;
    if (m.error || !m.points || !m.points.length) return false;
    const last = m.points[m.points.length - 1];
    priceEl.textContent = `${last.value.toFixed(2)}${inst.unit || ''}`;
    changeEl.textContent = `As of ${last.date}`;
    changeEl.className = 'text-blue-100 font-medium';
  } else if (inst.type === 'fx') {
    const f = data.fx;
    if (f.error || f.rate == null) return false;
    priceEl.textContent = f.rate.toFixed(4);
    changeEl.textContent = `${inst.base} → ${inst.quote} · as of ${f.date}`;
    changeEl.className = 'text-blue-100 font-medium';
  }

  card.classList.remove('hidden');
  return true;
}

// ---------- Rendering: trend chart (inline SVG) ----------

function renderTrendChart(points, valueKey) {
  const container = document.getElementById('trendContent');
  const section = document.getElementById('trendSection');
  if (!points || points.length < 2) {
    section.classList.add('hidden');
    return;
  }

  const values = points.map((p) => p[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 280;
  const height = 80;
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trendUp = values[values.length - 1] >= values[0];
  const strokeColor = trendUp ? '#4ade80' : '#f87171';

  container.innerHTML = `
    <div class="w-full">
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-20" preserveAspectRatio="none">
        <polyline points="${coords.join(' ')}" fill="none" stroke="${strokeColor}" stroke-width="2" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="flex justify-between text-[11px] text-slate-400 mt-1">
        <span>${points[0].date}</span>
        <span>${points[points.length - 1].date}</span>
      </div>
    </div>
  `;
  section.classList.remove('hidden');
}

// ---------- Rendering: advisories ----------

function renderAdvisoryCard(card) {
  return `
    <div class="advisory-card ${card.badgeClass}">
      <span class="advisory-icon">${card.icon}</span>
      <div>
        <p class="font-semibold text-sm">${card.title}</p>
        <p class="text-xs opacity-90 mt-0.5">${card.detail}</p>
      </div>
    </div>
  `;
}

function renderAdvisories(cards) {
  const section = document.getElementById('advisoriesSection');
  const content = document.getElementById('advisoriesContent');
  if (!cards || !cards.length) {
    section.classList.add('hidden');
    return;
  }
  const disclaimerCard = `
    <div class="advisory-card alert-teaser">
      <span class="advisory-icon">ℹ️</span>
      <div><p class="text-xs opacity-90">${window.SCERE_MARKET_ADVISORIES.DISCLAIMER}</p></div>
    </div>
  `;
  content.innerHTML = cards.map(renderAdvisoryCard).join('') + disclaimerCard;
  section.classList.remove('hidden');
}

// ---------- Orchestration ----------

async function loadInstrument(id) {
  const inst = window.SCERE_INSTRUMENTS.find((i) => i.id === id);
  if (!inst) return;
  currentInstrument = inst;

  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('currentQuote').classList.add('hidden');
  document.getElementById('trendSection').classList.add('hidden');
  document.getElementById('advisoriesSection').classList.add('hidden');
  hideApiKeyBanner();

  try {
    const data = await fetchInstrumentData(inst);

    const anyError = [data.quote, data.history, data.macro, data.fx].some((d) => d && d.error === 'not_configured');
    if (anyError) {
      showApiKeyBanner('This deployment has no ALPHA_VANTAGE_API_KEY set yet, so equity-index and rate data can\'t load. FX data (Frankfurter) doesn\'t need a key and should still work. See README.md.');
    }

    const ok = renderCurrentCard(inst, data);
    if (!ok) {
      const detail = (data.quote && data.quote.detail) || (data.macro && data.macro.detail) || (data.fx && data.fx.detail);
      if (detail) showApiKeyBanner(`Data provider issue: ${detail}`);
    }

    if (inst.type === 'equity_index' && data.history && data.history.points) {
      renderTrendChart(data.history.points, 'close');
      renderAdvisories(window.SCERE_MARKET_ADVISORIES.equityAdvisories(data.history.points));
    } else if (inst.type === 'macro' && data.macro && data.macro.points) {
      renderTrendChart(data.macro.points, 'value');
      renderAdvisories(window.SCERE_MARKET_ADVISORIES.macroAdvisories(data.macro.points, inst.unit || ''));
    } else if (inst.type === 'fx' && data.fx && data.fx.points) {
      renderTrendChart(data.fx.points, 'value');
      renderAdvisories(window.SCERE_MARKET_ADVISORIES.fxAdvisories(data.fx.points));
    }
  } catch (err) {
    console.error('Failed to load instrument data:', err);
    showApiKeyBanner('Failed to load data — check your connection and try again.');
  } finally {
    document.getElementById('loadingState').classList.add('hidden');
  }
}

// ---------- News ----------

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function loadNews() {
  const container = document.getElementById('newsContainer');
  try {
    const data = await fetchJson('/api/market-news');
    if (!data.items || !data.items.length) {
      container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">No news available right now.</p>';
      return;
    }
    container.innerHTML = data.items.map((item) => `
      <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="row-card block hover:bg-slate-700/70 transition">
        <div class="min-w-0">
          <p class="text-sm font-medium truncate">${item.title}</p>
          <p class="text-xs text-slate-400 mt-0.5">${item.source} · ${timeAgo(item.publishedAt)}</p>
        </div>
        <span class="text-slate-500 text-xs shrink-0 ml-2">↗</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Failed to load news:', err);
    container.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Couldn\'t load market news.</p>';
  }
}

// ---------- Pro modal (UI only — see index.html comment) ----------

function wireProModal() {
  const modal = document.getElementById('proModal');
  document.getElementById('proUpsellBtn').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('proModalClose').addEventListener('click', () => modal.classList.add('hidden'));
}

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', () => {
  populateInstrumentSelect();
  wireProModal();
  loadInstrument(document.getElementById('instrumentSelect').value);
  loadNews();
});
