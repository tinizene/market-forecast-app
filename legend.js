// Generic renderer for the shared "How to read this page" legend widget. Reads
// window.SCERE_LEGEND (from legend-content.js) and renders into a <div id="legendRoot">
// wherever one exists on the page — include both <script> tags on any page that uses
// the app's bearish/bullish/hawkish color system or trade-idea terminology.
// Self-contained: does nothing (no error) if #legendRoot or SCERE_LEGEND is missing,
// so it's safe to include on a page that doesn't have the placeholder yet.

function legendEscapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderLegend() {
  const root = document.getElementById('legendRoot');
  const legend = window.SCERE_LEGEND;
  if (!root || !legend) return;

  const colorRows = (legend.colors || [])
    .map(
      (c) => `
        <div class="flex items-start gap-2.5">
          <span class="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${legendEscapeHtml(c.swatchClass)}">${legendEscapeHtml(c.label)}</span>
          <p class="text-xs text-slate-300 leading-relaxed">${legendEscapeHtml(c.description)}</p>
        </div>
      `
    )
    .join('');

  const termRows = (legend.terms || [])
    .map(
      (t) => `
        <div class="border-b border-slate-700/40 last:border-0 pb-2 last:pb-0">
          <p class="text-xs font-semibold text-white">${legendEscapeHtml(t.term)}</p>
          <p class="text-xs text-slate-300 leading-relaxed mt-0.5">${legendEscapeHtml(t.definition)}</p>
        </div>
      `
    )
    .join('');

  root.innerHTML = `
    <details class="mb-4 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
      <summary class="cursor-pointer text-sm font-semibold text-white marker:text-blue-400">How to read this page — colors &amp; terms</summary>
      <div class="mt-3 space-y-2">${colorRows}</div>
      <div class="mt-4 space-y-3">${termRows}</div>
      <p class="mt-3 text-[11px] text-slate-500">Want the fuller version, with our own report used as the worked example? See the <a href="./due-diligence.html" class="underline decoration-slate-600 underline-offset-2 hover:text-sky-400">Due Diligence</a> hub.</p>
    </details>
  `;
}

document.addEventListener('DOMContentLoaded', renderLegend);
