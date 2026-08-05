#!/usr/bin/env node
// Renders the dark-theme HTML dashboard for a daily FX report from the PARSED
// JSON that parse-fx-report.js produces.
//
// WHY THIS EXISTS: the report used to be generated twice in one API call — once as
// markdown and once as a self-contained HTML page. That cost roughly 11.6k output
// tokens per run (~44% of output spend) to restate content the markdown already
// carried, and it left the two versions free to disagree. The generator's own
// comments worried about exactly that drift and tried to prevent it by asking for
// both in a single response.
//
// Rendering from the parsed JSON instead makes the drift impossible rather than
// merely discouraged: there is only one source of truth, and the page is a view of
// it. It is also free and deterministic.
//
// Section bodies are rendered from each section's raw markdown, so a template
// change upstream shows up here as prose rather than as a silently missing field.
// Section 17 (Known issues / refinements) is deliberately omitted — it is the
// user's working scratchpad and has never been part of the published page.
//
// USAGE: node scripts/render-report-html.js <parsed-report.json> <output.html>

const fs = require('fs');

// ---------- markdown → HTML (the subset these reports actually use) ----------

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

function splitRow(line) {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
}

const isTableSeparator = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line || '') && /-/.test(line || '');

function renderMarkdown(md) {
  const lines = String(md || '').split('\n');
  const out = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) { flushParagraph(); continue; }

    // Table: a pipe row immediately followed by a separator row.
    if (/^\s*\|.*\|\s*$/.test(line) && isTableSeparator(lines[i + 1])) {
      flushParagraph();
      const headers = splitRow(line);
      const rows = [];
      let j = i + 2;
      while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) { rows.push(splitRow(lines[j])); j++; }
      i = j - 1;
      out.push(
        '<div class="table-wrap"><table><thead><tr>' +
        headers.map((h) => `<th>${inline(h)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') +
        '</tbody></table></div>'
      );
      continue;
    }

    const heading = line.match(/^(#{3,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length, 6);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      const items = [];
      let j = i;
      while (j < lines.length && /^\s*[-*]\s+/.test(lines[j])) { items.push(lines[j].replace(/^\s*[-*]\s+/, '')); j++; }
      i = j - 1;
      out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      const items = [];
      let j = i;
      while (j < lines.length && /^\s*\d+\.\s+/.test(lines[j])) { items.push(lines[j].replace(/^\s*\d+\.\s+/, '')); j++; }
      i = j - 1;
      out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  return out.join('\n');
}

// ---------- page ----------

const STYLES = `
*{margin:0;padding:0;box-sizing:border-box}
body{background:linear-gradient(135deg,#0f1419 0%,#1a1f2e 100%);color:#e0e0e0;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;padding:20px}
.container{max-width:1200px;margin:0 auto}
header{text-align:center;margin-bottom:40px;padding:30px 0;border-bottom:2px solid #2a3f5f}
h1{font-size:2.2em;margin-bottom:10px;background:linear-gradient(135deg,#00d9ff,#0099ff);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.date{color:#808080;margin-top:10px;font-size:1.1em}
.disclaimer{font-size:.9em;color:#a0a0a0;font-style:italic;margin-top:10px}
.summary{background:linear-gradient(135deg,#1a2940 0%,#1a2f42 100%);border-left:4px solid #00d9ff;
  padding:22px;margin-bottom:30px;border-radius:8px}
.summary .metric{display:inline-block;margin-right:28px}
.summary .label{display:block;color:#a0a0a0;font-size:.85em}
.summary .value{color:#00ff88;font-size:1.5em;font-weight:bold}
.section{background:#1a1f2e;border:1px solid #2a3f5f;border-radius:8px;padding:26px;margin-bottom:26px}
.section h2{color:#00d9ff;margin-bottom:15px;font-size:1.35em;border-bottom:2px solid #2a3f5f;padding-bottom:10px}
.section h3{color:#00ff88;margin:20px 0 12px;font-size:1.08em}
.section h4,.section h5,.section h6{color:#00ff88;margin:16px 0 10px;font-size:1em}
p{margin:14px 0;color:#c0c0c0}
strong{color:#e6e6e6}
code{background:#252d3a;padding:1px 5px;border-radius:3px;font-size:.92em}
a{color:#00d9ff}
ul,ol{margin:12px 0 12px 22px;color:#c0c0c0}
li{margin:6px 0}
.table-wrap{overflow-x:auto;margin:16px 0}
table{width:100%;border-collapse:collapse;font-size:.93em;min-width:520px}
th{background:#252d3a;color:#00d9ff;padding:11px;text-align:left;border-bottom:2px solid #2a3f5f;font-weight:600}
td{padding:9px 11px;border-bottom:1px solid #2a3f5f;vertical-align:top}
tr:hover{background:rgba(0,217,255,.05)}
.footer{text-align:center;padding:30px 0;border-top:1px solid #2a3f5f;color:#808080;font-size:.9em;margin-top:40px}
@media(max-width:640px){body{padding:12px}h1{font-size:1.6em}.section{padding:18px}}
`;

function renderSummary(data) {
  const ds = data.decisionSummary || {};
  const dd = data.decisionDashboard || {};
  const nt = data.noTradeZone || {};
  const bits = [];

  if (dd.overallConfidence != null) {
    bits.push(`<span class="metric"><span class="label">Overall confidence</span><span class="value">${esc(dd.overallConfidence)}/100</span></span>`);
  }
  if (ds.topIdea && ds.topIdea.label) {
    bits.push(`<span class="metric"><span class="label">Top idea</span><span class="value">${esc(ds.topIdea.label)}${ds.topIdea.confidence != null ? ` (${esc(ds.topIdea.confidence)})` : ''}</span></span>`);
  }
  if (nt.verdict) {
    bits.push(`<span class="metric"><span class="label">No-Trade Zone</span><span class="value">${esc(nt.verdict)}</span></span>`);
  }
  if (!bits.length) return '';
  return `<div class="summary">${bits.join('')}</div>`;
}

function renderHtml(data) {
  const label = data.reportDateLabel || data.reportDate || '';
  const sections = (data.sections || []).filter((s) => !/known issues/i.test(s.title || ''));

  const body = sections.map((s) => {
    const heading = s.number ? `${s.number}. ${s.title}` : s.title;
    return `<section class="section"><h2>${esc(heading)}</h2>\n${renderMarkdown(s.raw)}</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Institutional FX Dashboard &amp; Intelligence Report — ${esc(label)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="container">
<header>
<h1>Institutional FX Dashboard &amp; Intelligence Report</h1>
<p class="date">${esc(label)}</p>
<p class="disclaimer">Prepared as an analytical synthesis for professional monitoring purposes. Spot levels are same-day/last-close reference, not live ticks. Not personalized financial advice.</p>
</header>
${renderSummary(data)}
${body}
<footer class="footer">
<p>Institutional FX Dashboard &amp; Intelligence Report — ${esc(label)}</p>
<p>Rendered from the parsed report. Not personalized financial advice.</p>
</footer>
</div>
</body>
</html>
`;
}

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node render-report-html.js <parsed-report.json> <output.html>');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  fs.writeFileSync(outputPath, renderHtml(data), 'utf8');
  console.log(`Rendered ${outputPath} (${fs.statSync(outputPath).size} bytes, ${(data.sections || []).length - 1} sections)`);
}

if (require.main === module) main();

module.exports = { renderHtml, renderMarkdown };
