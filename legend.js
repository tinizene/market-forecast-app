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
          <p class="text-xs u-fg-body leading-relaxed">${legendEscapeHtml(c.description)}</p>
        </div>
      `
    )
    .join('');

  const termRows = (legend.terms || [])
    .map(
      (t) => `
        <div class="border-b u-bd last:border-0 pb-2 last:pb-0">
          <p class="text-xs font-semibold u-fg">${legendEscapeHtml(t.term)}</p>
          <p class="text-xs u-fg-body leading-relaxed mt-0.5">${legendEscapeHtml(t.definition)}</p>
        </div>
      `
    )
    .join('');

  root.innerHTML = `
    <details class="mb-4 rounded-xl border u-bd u-bg-card-soft px-4 py-3">
      <summary class="cursor-pointer text-sm font-semibold u-fg marker:u-fg-info">How to read this page — colors &amp; terms</summary>
      <div class="mt-3 space-y-2">${colorRows}</div>
      <div class="mt-4 space-y-3">${termRows}</div>
      <p class="mt-3 text-[11px] u-fg-faint">Want the fuller version, with our own report used as the worked example? See the <a href="./due-diligence.html" class="underline u-dec-quiet underline-offset-2 hover:u-fg-link">Due Diligence</a> hub.</p>
    </details>
  `;
}

document.addEventListener('DOMContentLoaded', renderLegend);
