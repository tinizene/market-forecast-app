// Renders the Learn curriculum (learn-content.js), the real fee comparison table
// (fund-facts.js), and a dollar-cost-averaging calculator backed by real historical
// data (/api/adjusted-history). Same "no fabricated numbers" discipline as the rest
// of this app: every dollar figure the calculator shows is computed from Alpha
// Vantage's actual dividend-adjusted monthly price series, never invented.

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showApiKeyBanner(message) {
  const banner = document.getElementById('apiKeyBanner');
  banner.textContent = message;
  banner.classList.remove('hidden');
}

// ---------- lesson cards ----------

function renderLessonCard(lesson, index) {
  return `
    <section id="lesson-${escapeHtml(lesson.id)}" class="current-card bg-slate-800 rounded-2xl p-5 shadow-lg" data-lesson-section>
      <div class="flex items-start justify-between gap-3 mb-1">
        <p class="text-xs uppercase tracking-wider text-blue-300">Lesson ${index + 1}</p>
        <button type="button" class="lesson-listen-btn hidden" data-lesson-listen="${escapeHtml(lesson.id)}">🔊 Listen</button>
      </div>
      <h2 class="text-lg font-bold mb-2" data-read-unit id="ru-${escapeHtml(lesson.id)}-title">${escapeHtml(lesson.title)}</h2>
      <p class="text-sm text-blue-200 font-medium mb-3" data-read-unit id="ru-${escapeHtml(lesson.id)}-keyidea">${escapeHtml(lesson.keyIdea)}</p>
      <div class="space-y-3 text-sm text-slate-300 leading-relaxed">
        ${lesson.body.map((p, i) => `<p data-read-unit id="ru-${escapeHtml(lesson.id)}-p${i}">${escapeHtml(p)}</p>`).join('')}
      </div>
    </section>
  `;
}

// ---------- real fee comparison table (Expense Ratios lesson) ----------

function renderFeeTable() {
  const facts = window.SCERE_FUND_FACTS || {};
  const rows = Object.entries(facts)
    .map(([symbol, f]) => ({ symbol, ...f }))
    .sort((a, b) => a.expenseRatioPct - b.expenseRatioPct);

  if (!rows.length) return '';

  return `
    <section class="advisory-card !items-start flex-col !flex">
      <p class="font-semibold text-sm mb-1">Real fee comparison</p>
      <p class="text-xs opacity-80 mb-3">Sourced from each fund issuer's own page, lowest fee first. "asOf" is when this was last checked — expense ratios change rarely, but verify against the source link for anything beyond a rough comparison.</p>
      <div class="w-full overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="text-left text-slate-400 uppercase tracking-wide">
              <th class="pb-2 pr-3 font-semibold">Fund</th>
              <th class="pb-2 pr-3 font-semibold">Tracks</th>
              <th class="pb-2 pr-3 font-semibold">Expense ratio</th>
              <th class="pb-2 pr-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr class="border-t border-slate-700/60 align-top">
                <td class="py-2 pr-3 text-slate-200 font-medium">${escapeHtml(r.symbol)} <span class="block text-slate-400 font-normal">${escapeHtml(r.name)}</span></td>
                <td class="py-2 pr-3 text-slate-300">${escapeHtml(r.indexTracked)}</td>
                <td class="py-2 pr-3 text-slate-100 font-semibold">${r.expenseRatioPct}%</td>
                <td class="py-2 pr-3"><a href="${escapeHtml(r.source)}" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline decoration-sky-700 underline-offset-2">as of ${escapeHtml(r.asOf)}</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ---------- dollar-cost-averaging calculator (DCA lesson) ----------

function dcaEligibleInstruments() {
  return (window.SCERE_INSTRUMENTS || []).filter((i) => i.type === 'equity_index');
}

function renderDcaCalculatorShell() {
  const instruments = dcaEligibleInstruments();
  return `
    <section class="advisory-card !items-start flex-col !flex">
      <p class="font-semibold text-sm mb-1">See what regular contributions would have grown to</p>
      <p class="text-xs opacity-80 mb-3">Real historical prices and dividends, computed live. Not a prediction — this shows what already happened, not what will happen.</p>
      <div class="w-full grid grid-cols-2 gap-2 mb-3">
        <label class="text-xs text-slate-400 col-span-2 sm:col-span-1">
          Fund
          <select id="dcaSymbol" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
            ${instruments.map((i) => `<option value="${escapeHtml(i.symbol)}">${escapeHtml(i.label)} (${escapeHtml(i.symbol)})</option>`).join('')}
          </select>
        </label>
        <label class="text-xs text-slate-400">
          Monthly amount (USD)
          <input id="dcaAmount" type="number" min="1" step="1" value="150" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
        </label>
        <label class="text-xs text-slate-400">
          Years back
          <select id="dcaYears" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
            <option value="5">5 years</option>
            <option value="10" selected>10 years</option>
            <option value="20">20 years (or full history)</option>
          </select>
        </label>
      </div>
      <button id="dcaCalculate" type="button" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg py-2.5 transition">Calculate</button>
      <div id="dcaResult" class="w-full mt-3"></div>
    </section>
  `;
}

function computeDca(points, monthlyAmount, yearsBack) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - yearsBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const inRange = points.filter((p) => p.date >= cutoffStr && p.adjustedClose > 0);
  if (!inRange.length) return null;

  let totalShares = 0;
  for (const p of inRange) {
    totalShares += monthlyAmount / p.adjustedClose;
  }
  const totalContributed = monthlyAmount * inRange.length;
  const lastPoint = inRange[inRange.length - 1];
  const finalValue = totalShares * lastPoint.adjustedClose;
  const gain = finalValue - totalContributed;
  const gainPct = totalContributed > 0 ? (gain / totalContributed) * 100 : 0;

  return {
    months: inRange.length,
    startDate: inRange[0].date,
    endDate: lastPoint.date,
    totalContributed,
    finalValue,
    gain,
    gainPct,
  };
}

function formatUsd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

async function runDcaCalculation() {
  const symbol = document.getElementById('dcaSymbol').value;
  const amount = parseFloat(document.getElementById('dcaAmount').value) || 0;
  const years = parseInt(document.getElementById('dcaYears').value, 10);
  const resultEl = document.getElementById('dcaResult');

  if (amount <= 0) {
    resultEl.innerHTML = '<p class="text-xs text-red-300">Enter a monthly amount greater than zero.</p>';
    return;
  }

  resultEl.innerHTML = '<p class="text-xs text-slate-400">Calculating from real historical data…</p>';

  try {
    const res = await fetch(`/api/adjusted-history?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();

    if (data.error === 'not_configured') {
      showApiKeyBanner(data.message || 'This deployment has no ALPHA_VANTAGE_API_KEY set yet, so the calculator can\'t load historical data. See README.md.');
      resultEl.innerHTML = '<p class="text-xs text-red-300">Historical data unavailable — see the notice above.</p>';
      return;
    }
    if (data.error || !data.points || !data.points.length) {
      resultEl.innerHTML = `<p class="text-xs text-red-300">Could not load historical data for ${escapeHtml(symbol)}${data.detail ? `: ${escapeHtml(data.detail)}` : '.'}</p>`;
      return;
    }

    const result = computeDca(data.points, amount, years);
    if (!result) {
      resultEl.innerHTML = '<p class="text-xs text-red-300">Not enough historical data for that time range.</p>';
      return;
    }

    const gainClass = result.gain >= 0 ? 'text-emerald-400' : 'text-red-400';
    resultEl.innerHTML = `
      <div class="bg-slate-900/40 rounded-lg p-3 space-y-1.5">
        <div class="flex justify-between text-xs"><span class="text-slate-400">Contributed (${result.months} months, ${escapeHtml(result.startDate)} to ${escapeHtml(result.endDate)})</span><span class="text-slate-200 font-medium">${formatUsd(result.totalContributed)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-400">Would be worth today</span><span class="text-slate-100 font-semibold">${formatUsd(result.finalValue)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-400">Gain / loss</span><span class="${gainClass} font-semibold">${result.gain >= 0 ? '+' : ''}${formatUsd(result.gain)} (${result.gainPct >= 0 ? '+' : ''}${result.gainPct.toFixed(1)}%)</span></div>
      </div>
      <p class="text-[11px] text-slate-500 mt-2">Computed from ${escapeHtml(symbol)}'s real, dividend-adjusted monthly price history. Past performance is not a guarantee of future results — this is what happened historically, not a forecast. Doesn't account for taxes, brokerage fees, or currency conversion.</p>
    `;
  } catch (err) {
    console.error('DCA calculation failed:', err);
    resultEl.innerHTML = '<p class="text-xs text-red-300">Something went wrong loading historical data. Try again shortly.</p>';
  }
}

// ---------- Your Country at a Glance (World Bank Indicators API) ----------
// Real macro context — inflation, GDP per capita, GDP growth, financial inclusion —
// for whatever country the user selects, via a keyless World Bank API proxy
// (/api/countries, /api/country-indicators). Covers every country the World Bank
// tracks (~217), not a hardcoded shortlist, and the indicator set is a small config
// array on the server (WB_INDICATORS in api/markets-hub.js) specifically so more
// indicators can be added later without touching this file's structure. Placed right
// after Lesson 1 (Investing vs. Gambling) so the "why not just hold cash" argument
// gets grounded in the user's own real economic environment before the index/ETF
// lessons explain the solution.

const COUNTRY_STORAGE_KEY = 'scere-learn-country';

function formatIndicatorValue(indicator) {
  if (indicator.value === null || indicator.value === undefined) return null;
  if (indicator.format === 'percent') return `${indicator.value.toFixed(1)}%`;
  if (indicator.format === 'usd') {
    return indicator.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }
  return String(indicator.value);
}

function renderCountryPanelShell() {
  return `
    <section class="advisory-card !items-start flex-col !flex">
      <p class="font-semibold text-sm mb-1">Your country at a glance</p>
      <p class="text-xs opacity-80 mb-3">Real data from the World Bank's Indicators API — pick any country to see its most recent published figures. Not tied to any recommendation; just real context for the environment you're investing from.</p>
      <label class="text-xs text-slate-400 w-full">
        Country
        <select id="countrySelect" class="mt-1 w-full bg-slate-700 text-white rounded-lg p-2 text-sm outline-none border border-slate-600 focus:border-blue-500">
          <option value="">Loading countries…</option>
        </select>
      </label>
      <div id="countryIndicatorsResult" class="w-full mt-3"></div>
    </section>
  `;
}

function renderCountryIndicatorCards(data) {
  const countryName = data.countryName || 'this country';
  const copy = window.SCERE_COUNTRY_INDICATOR_COPY || {};

  const cards = (data.indicators || []).map((ind) => {
    const formatted = formatIndicatorValue(ind);
    const blurb = (copy[ind.key] || '').replace(/\{country\}/g, escapeHtml(countryName));

    if (formatted === null) {
      return `
        <div class="bg-slate-900/40 rounded-lg p-3">
          <p class="text-xs text-slate-400">${escapeHtml(ind.label)}</p>
          <p class="text-sm text-slate-500 mt-1">Not available for ${escapeHtml(countryName)} in the World Bank's recent data.</p>
        </div>
      `;
    }

    return `
      <div class="bg-slate-900/40 rounded-lg p-3">
        <div class="flex items-baseline justify-between gap-2">
          <p class="text-xs text-slate-400">${escapeHtml(ind.label)}</p>
          <span class="text-[11px] text-slate-500">${escapeHtml(ind.year)}</span>
        </div>
        <p class="text-lg font-semibold text-slate-100 mt-0.5">${escapeHtml(formatted)}</p>
        ${blurb ? `<p class="text-xs text-slate-400 mt-1.5">${blurb}</p>` : ''}
        ${ind.note ? `<p class="text-[11px] text-slate-500 mt-1">${escapeHtml(ind.note)}</p>` : ''}
        <a href="${escapeHtml(ind.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="text-[11px] text-sky-400 underline decoration-sky-700 underline-offset-2 mt-1 inline-block">World Bank source</a>
      </div>
    `;
  }).join('');

  return `<div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">${cards}</div>`;
}

async function loadCountryIndicators(countryId) {
  const resultEl = document.getElementById('countryIndicatorsResult');
  if (!resultEl) return;

  if (!countryId) {
    resultEl.innerHTML = '';
    return;
  }

  resultEl.innerHTML = '<p class="text-xs text-slate-400">Loading real data…</p>';

  try {
    const res = await fetch(`/api/country-indicators?country=${encodeURIComponent(countryId)}`);
    const data = await res.json();

    if (data.error && !data.indicators?.length) {
      resultEl.innerHTML = `<p class="text-xs text-red-300">Could not load data for this country${data.detail ? `: ${escapeHtml(data.detail)}` : '.'}</p>`;
      return;
    }

    resultEl.innerHTML = renderCountryIndicatorCards(data);
  } catch (err) {
    console.error('country indicators failed:', err);
    resultEl.innerHTML = '<p class="text-xs text-red-300">Something went wrong loading country data. Try again shortly.</p>';
  }
}

async function loadCountryList() {
  const select = document.getElementById('countrySelect');
  if (!select) return;

  try {
    const res = await fetch('/api/countries');
    const data = await res.json();
    const countries = data.countries || [];

    if (!countries.length) {
      select.innerHTML = '<option value="">Country list unavailable — try again later</option>';
      return;
    }

    let saved = '';
    try { saved = localStorage.getItem(COUNTRY_STORAGE_KEY) || ''; } catch (e) { /* ignore */ }

    const options = ['<option value="">Select your country…</option>']
      .concat(countries.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`));
    select.innerHTML = options.join('');

    if (saved && countries.some((c) => c.id === saved)) {
      select.value = saved;
      loadCountryIndicators(saved);
    }

    select.addEventListener('change', () => {
      const value = select.value;
      try { localStorage.setItem(COUNTRY_STORAGE_KEY, value); } catch (e) { /* ignore */ }
      loadCountryIndicators(value);
    });
  } catch (err) {
    console.error('country list failed:', err);
    select.innerHTML = '<option value="">Could not load country list</option>';
  }
}

// ---------- read-aloud (Web Speech API) ----------
// Uses the browser's free, built-in speech synthesis — no API key, no server
// round-trip, works for anyone whose browser supports it. Scoped to Learn
// only, and only to lesson prose (title, key idea, body paragraphs) — the fee
// table and DCA calculator are numbers and form inputs, not something to read
// aloud, so they're never added to the queue.
//
// Known limitation, documented honestly rather than overpromised: iOS Safari's
// speechSynthesis.pause()/resume() is unreliable in some versions. Stop is
// always offered alongside Pause so a stuck pause never traps the user.

const TTS_SUPPORTED = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const TTS_RATE_KEY = 'scere-learn-tts-speed';

const ttsState = {
  queue: [],
  index: -1,
  playing: false,
  paused: false,
};

function ttsRateForSpeed(speed) {
  if (speed === 'slow') return 0.8;
  if (speed === 'fast') return 1.3;
  return 1;
}

function ttsLoadSavedSpeed() {
  try {
    return localStorage.getItem(TTS_RATE_KEY) || 'normal';
  } catch (e) {
    return 'normal';
  }
}

function ttsSaveSpeed(speed) {
  try {
    localStorage.setItem(TTS_RATE_KEY, speed);
  } catch (e) {
    // Storage unavailable (private browsing, etc.) — speed just won't persist.
  }
}

function ttsClearHighlight() {
  document.querySelectorAll('.reading-highlight').forEach((el) => el.classList.remove('reading-highlight'));
}

function ttsHighlight(el) {
  ttsClearHighlight();
  el.classList.add('reading-highlight');
  if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function ttsUpdateLessonButtons() {
  document.querySelectorAll('[data-lesson-listen]').forEach((btn) => {
    const section = btn.closest('[data-lesson-section]');
    const current = ttsState.queue[ttsState.index];
    const isReadingThis = ttsState.playing && section && current && section.contains(current);
    btn.classList.toggle('is-reading', !!isReadingThis);
    btn.textContent = isReadingThis ? '🔊 Reading…' : '🔊 Listen';
  });
}

function ttsUpdatePageBar() {
  const playLabel = document.getElementById('speechPlayLabel');
  const playIcon = document.getElementById('speechPlayIcon');
  const stopBtn = document.getElementById('speechStopBtn');
  if (!playLabel || !playIcon || !stopBtn) return;

  if (ttsState.playing && !ttsState.paused) {
    playIcon.textContent = '⏸';
    playLabel.textContent = 'Pause';
  } else if (ttsState.playing && ttsState.paused) {
    playIcon.textContent = '▶';
    playLabel.textContent = 'Resume';
  } else {
    playIcon.textContent = '🔊';
    playLabel.textContent = 'Listen to this page';
  }
  stopBtn.classList.toggle('hidden', !ttsState.playing);
}

function ttsStop() {
  window.speechSynthesis.cancel();
  ttsState.queue = [];
  ttsState.index = -1;
  ttsState.playing = false;
  ttsState.paused = false;
  ttsClearHighlight();
  ttsUpdatePageBar();
  ttsUpdateLessonButtons();
}

function ttsAdvance() {
  ttsState.index += 1;
  if (ttsState.index >= ttsState.queue.length) {
    ttsStop();
    return;
  }
  ttsSpeakCurrent();
}

function ttsSpeakCurrent() {
  const el = ttsState.queue[ttsState.index];
  if (!el) {
    ttsStop();
    return;
  }
  const text = (el.textContent || '').trim();
  if (!text) {
    ttsAdvance();
    return;
  }

  const speedSelect = document.getElementById('speechSpeedSelect');
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = ttsRateForSpeed((speedSelect && speedSelect.value) || ttsLoadSavedSpeed());
  utterance.onstart = () => {
    ttsHighlight(el);
    ttsUpdatePageBar();
    ttsUpdateLessonButtons();
  };
  utterance.onend = () => {
    if (ttsState.playing) ttsAdvance();
  };
  utterance.onerror = () => {
    if (ttsState.playing) ttsAdvance();
  };
  window.speechSynthesis.speak(utterance);
}

function ttsStart(rootEl) {
  if (!TTS_SUPPORTED) return;
  window.speechSynthesis.cancel();
  const scope = rootEl || document.getElementById('lessonsRoot') || document;
  const units = Array.from(scope.querySelectorAll('[data-read-unit]'));
  if (!units.length) return;

  ttsState.queue = units;
  ttsState.index = 0;
  ttsState.playing = true;
  ttsState.paused = false;
  ttsUpdatePageBar();
  ttsUpdateLessonButtons();
  ttsSpeakCurrent();
}

function ttsTogglePlayPause(rootEl) {
  if (!TTS_SUPPORTED) return;
  if (!ttsState.playing) {
    ttsStart(rootEl);
    return;
  }
  if (ttsState.paused) {
    window.speechSynthesis.resume();
    ttsState.paused = false;
  } else {
    window.speechSynthesis.pause();
    ttsState.paused = true;
  }
  ttsUpdatePageBar();
}

function initSpeechControls() {
  const speechBar = document.getElementById('speechBar');

  if (!TTS_SUPPORTED) {
    // Graceful degradation: hide all read-aloud UI, leave the rest of the
    // page fully usable. No error shown — reading the page yourself still works.
    if (speechBar) speechBar.classList.add('hidden');
    return;
  }

  if (speechBar) speechBar.classList.remove('hidden');
  document.querySelectorAll('[data-lesson-listen]').forEach((btn) => btn.classList.remove('hidden'));

  const speedSelect = document.getElementById('speechSpeedSelect');
  if (speedSelect) {
    speedSelect.value = ttsLoadSavedSpeed();
    speedSelect.addEventListener('change', () => {
      ttsSaveSpeed(speedSelect.value);
      // Applies from the next paragraph onward — changing the rate of speech
      // already in progress isn't reliably supported across browsers.
    });
  }

  const playBtn = document.getElementById('speechPlayBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => ttsTogglePlayPause(document.getElementById('lessonsRoot')));
  }

  const stopBtn = document.getElementById('speechStopBtn');
  if (stopBtn) stopBtn.addEventListener('click', ttsStop);

  document.querySelectorAll('[data-lesson-listen]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.closest('[data-lesson-section]');
      ttsStart(section);
    });
  });

  // Don't leave the device talking to a tab the user has left.
  window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ttsState.playing) ttsStop();
  });
}

// ---------- orchestration ----------

function renderLessons() {
  const lessons = window.SCERE_LEARN_CONTENT || [];
  const root = document.getElementById('lessonsRoot');

  const html = lessons.map((lesson, index) => {
    let block = renderLessonCard(lesson, index);
    if (lesson.id === 'investing-vs-gambling') block += renderCountryPanelShell();
    if (lesson.id === 'expense-ratios') block += renderFeeTable();
    if (lesson.id === 'dollar-cost-averaging') block += renderDcaCalculatorShell();
    return block;
  }).join('');

  root.innerHTML = html;

  const calcBtn = document.getElementById('dcaCalculate');
  if (calcBtn) calcBtn.addEventListener('click', runDcaCalculation);

  loadCountryList();

  initSpeechControls();
}

document.addEventListener('DOMContentLoaded', () => {
  renderLessons();
});
