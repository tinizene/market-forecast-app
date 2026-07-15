// Renders the Due Diligence hub (due-diligence.html) from due-diligence-content.js.
// Three columns (Forex / Crypto / Indexes & ETFs), each a three-phase roadmap.
// Articles use native <details>/<summary> for expand/collapse — no custom toggle
// logic needed, and it degrades sensibly even if JS re-renders mid-interaction.

const COLUMN_STORAGE_KEY = 'scere-due-diligence-column';

function el(html) {
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getColumns() {
  return (window.SCERE_DUE_DILIGENCE && window.SCERE_DUE_DILIGENCE.columns) || [];
}

// ---------- rendering ----------

function renderSwitcher(columns, activeId) {
  const switcher = document.getElementById('columnSwitcher');
  switcher.innerHTML = columns
    .map((c) => {
      const active = c.id === activeId;
      const base = 'flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition border';
      const activeClasses = active
        ? 'bg-blue-600 border-blue-500 text-white'
        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700';
      return `<button type="button" role="tab" aria-selected="${active}" data-column="${escapeHtml(c.id)}" class="${base} ${activeClasses}">
        <span class="text-lg" aria-hidden="true">${c.icon || ''}</span>
        <span>${escapeHtml(c.label)}</span>
      </button>`;
    })
    .join('');

  switcher.querySelectorAll('[data-column]').forEach((btn) => {
    btn.addEventListener('click', () => {
      localStorage.setItem(COLUMN_STORAGE_KEY, btn.dataset.column);
      renderColumn(btn.dataset.column);
    });
  });
}

function renderIntro(column) {
  const intro = document.getElementById('columnIntro');
  intro.innerHTML = `
    <p class="font-semibold text-sm mb-1">${column.icon || ''} ${escapeHtml(column.label)} due diligence</p>
    <p class="text-xs text-blue-200 mb-2">${escapeHtml(column.tagline || '')}</p>
    <p class="text-xs opacity-80">${escapeHtml(column.intro || '')}</p>
  `;
}

function renderArticle(article) {
  return `
    <details class="bg-slate-900/60 rounded-lg border border-slate-700 px-4 py-3">
      <summary class="cursor-pointer text-sm font-semibold text-white marker:text-blue-400">${escapeHtml(article.title)}</summary>
      <p class="text-xs text-blue-200 mt-2 mb-3 italic">${escapeHtml(article.keyIdea)}</p>
      <div class="space-y-3">
        ${article.body.map((p) => `<p class="text-sm text-slate-300 leading-relaxed">${escapeHtml(p)}</p>`).join('')}
      </div>
    </details>
  `;
}

function renderPhase(phase, index) {
  const hasArticles = phase.articles && phase.articles.length > 0;
  return `
    <section class="current-card bg-slate-800 rounded-2xl p-5 shadow-lg">
      <div class="flex items-start justify-between gap-3 mb-1">
        <p class="text-xs uppercase tracking-wider text-blue-300">${escapeHtml(phase.title)}</p>
        <span class="text-[10px] font-semibold bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">${index + 1} / 3</span>
      </div>
      <p class="text-xs text-slate-400 mb-3">${escapeHtml(phase.description || '')}</p>
      ${
        hasArticles
          ? `<div class="space-y-2">${phase.articles.map(renderArticle).join('')}</div>`
          : `<div class="rounded-lg border border-dashed border-slate-600 px-4 py-3 text-xs text-slate-400">
              <span class="font-semibold text-slate-300">Coming soon.</span>
              ${escapeHtml(phase.comingSoonNote || 'Articles for this phase are planned but not written yet.')}
            </div>`
      }
    </section>
  `;
}

function renderColumn(columnId) {
  const columns = getColumns();
  const column = columns.find((c) => c.id === columnId) || columns[0];
  if (!column) return;

  renderSwitcher(columns, column.id);
  renderIntro(column);

  const root = document.getElementById('roadmapRoot');
  root.innerHTML = column.phases.map((phase, i) => renderPhase(phase, i)).join('');
}

// ---------- init ----------

document.addEventListener('DOMContentLoaded', () => {
  const columns = getColumns();
  if (!columns.length) {
    document.getElementById('roadmapRoot').innerHTML = '<p class="text-slate-400 text-sm text-center py-8">No due diligence content found.</p>';
    return;
  }
  const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
  const initial = columns.find((c) => c.id === saved) ? saved : columns[0].id;
  renderColumn(initial);
});
