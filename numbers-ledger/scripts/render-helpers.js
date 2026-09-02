'use strict';

/** Shared formatting, so two generated documents render a number the same way. */

const group = (value) => value.toLocaleString('en-US');
const fixed = (value, places) => value.toFixed(places);
const plural = (count, word) => `${group(count)} ${word}${count === 1 ? '' : 's'}`;
const pct = (value, places = 3) => `${(value * 100).toFixed(places)}%`;
const escape = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


// --------------------------------------------------------------- page design

/**
 * One stylesheet for the generated submission annexes.
 *
 * They are handed over together, so they should look like they came from the
 * same office: a cool paper, an oxblood rule, a serif that is used once for the
 * title and nowhere else, and a monospace for every figure. What distinguishes
 * one annex from another is its title and its stamp line, not its palette.
 */
const STYLE = `
  :root {
    --paper: #f1f3f5;
    --surface: #ffffff;
    --sunken: #e7eaee;
    --ink: #12161b;
    --muted: #5c6672;
    --rule: #d3d9df;
    --rule-strong: #adb6c0;
    --accent: #7a2233;
    --good: #1f6b45;
    --note: #8a5a12;
    --measure: 68ch;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --paper: #0d1014; --surface: #161b21; --sunken: #1d232b;
      --ink: #e6e9ec; --muted: #97a1ac; --rule: #262e37; --rule-strong: #3a4550;
      --accent: #e08a9b; --good: #5cc48c; --note: #d9a949;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --paper: #0d1014; --surface: #161b21; --sunken: #1d232b;
    --ink: #e6e9ec; --muted: #97a1ac; --rule: #262e37; --rule-strong: #3a4550;
    --accent: #e08a9b; --good: #5cc48c; --note: #d9a949;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: 'Public Sans', system-ui, -apple-system, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .sheet { max-width: 96ch; margin: 0 auto; padding: 56px 24px 110px; }

  .masthead { border-bottom: 1px solid var(--rule-strong); padding-bottom: 26px; margin-bottom: 34px; }

  .stamp {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); display: flex; flex-wrap: wrap; gap: 6px 22px; margin-bottom: 18px;
  }

  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-weight: 400; font-size: clamp(2.2rem, 6vw, 3.4rem);
    line-height: 1.02; letter-spacing: -0.01em; margin: 0 0 14px; text-wrap: balance;
  }

  .standfirst { font-size: 1.08rem; color: var(--muted); max-width: var(--measure); margin: 0; }

  section { margin-bottom: 54px; }

  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-weight: 400; font-size: 1.85rem; line-height: 1.15;
    margin: 0 0 14px; padding-top: 26px; border-top: 1px solid var(--rule);
    text-wrap: balance;
  }

  h3 {
    font-family: 'Public Sans', sans-serif; font-weight: 600;
    font-size: 0.95rem; letter-spacing: 0.01em; margin: 0 0 10px;
  }
  h3 .count { font-family: 'Roboto Mono', monospace; color: var(--accent); font-weight: 400; font-size: 0.86em; }

  p, li { max-width: var(--measure); }
  p { margin: 0 0 14px; }
  ul, ol { margin: 0 0 16px; padding-left: 20px; }
  li { margin-bottom: 8px; }
  strong { font-weight: 600; }
  em { font-style: italic; }

  code {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 0.85em; background: var(--sunken); padding: 1px 5px; border-radius: 2px;
  }

  .scroll { overflow-x: auto; margin: 0 0 18px; }

  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  th {
    text-align: left; font-family: 'Roboto Mono', monospace;
    font-size: 10px; letter-spacing: 0.11em; text-transform: uppercase;
    color: var(--muted); font-weight: 400; padding: 0 14px 8px 0;
    border-bottom: 1px solid var(--rule-strong); white-space: nowrap;
  }
  td { padding: 9px 14px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: baseline; }
  tr:last-child td { border-bottom: none; }
  th.n, td.n {
    text-align: right; font-family: 'Roboto Mono', monospace;
    font-variant-numeric: tabular-nums; white-space: nowrap; padding-right: 0;
  }
  td.name { font-weight: 600; white-space: nowrap; }
  tbody tr.lead td { background: color-mix(in srgb, var(--accent) 6%, transparent); }

  .derivations { display: grid; gap: 1px; background: var(--rule); border: 1px solid var(--rule); }
  .derivation { background: var(--surface); padding: 18px 20px; }
  .derivation p { margin: 0; font-size: 0.93rem; color: var(--muted); max-width: none; }
  .derivation p + p { margin-top: 10px; }
  .derivation .checked { color: var(--good); }
  .derivation .failed { color: var(--accent); font-weight: 600; }

  pre {
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 0.8rem; line-height: 1.7; background: var(--sunken);
    padding: 12px 14px; margin: 0 0 12px; overflow-x: auto; border-radius: 2px;
  }

  .callout {
    border-left: 3px solid var(--note); background: var(--surface);
    padding: 15px 18px; margin: 22px 0; font-size: 0.94rem; max-width: var(--measure);
  }
  .callout p { margin: 0 0 10px; } .callout p:last-child { margin: 0; }

  .verdict {
    display: inline-block; font-family: 'Roboto Mono', monospace;
    font-size: 11px; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--good); border: 1px solid var(--good); border-radius: 2px;
    padding: 3px 9px; margin-bottom: 14px;
  }

  .footer {
    margin-top: 60px; padding-top: 20px; border-top: 1px solid var(--rule-strong);
    font-size: 0.85rem; color: var(--muted); max-width: var(--measure);
  }

  @media (max-width: 640px) {
    .sheet { padding: 36px 16px 80px; }
    td, th { padding-right: 10px; }
  }
`;

function htmlTable({ columns, rows, lead = null }) {
  const head = columns.map((column) => `<th${column.n ? ' class="n"' : ''}>${escape(column.label)}</th>`).join('');
  const body = rows.map((row) => {
    const cells = row.cells
      .map((cell, i) => `<td class="${columns[i].n ? 'n' : (i === 0 ? 'name' : '')}">${cell}</td>`)
      .join('');
    return `<tr${lead && row.key === lead ? ' class="lead"' : ''}>${cells}</tr>`;
  }).join('\n        ');
  return `<div class="scroll"><table>\n        <thead><tr>${head}</tr></thead>\n        <tbody>\n        ${body}\n        </tbody>\n      </table></div>`;
}


/** The shell each annex fills in. The artifact host supplies the html and body. */
function page({ title, stamp, heading, standfirst, body }) {
  return `<title>${escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Public+Sans:wght@400;600&family=Roboto+Mono:wght@400;500&display=swap">
<style>${STYLE}</style>

<div class="sheet">

  <header class="masthead">
    <div class="stamp">${stamp.map((item) => `<span>${escape(item)}</span>`).join('\n      ')}</div>
    <h1>${escape(heading)}</h1>
    <p class="standfirst">${standfirst}</p>
  </header>
{body}
</div>
`.replace('{body}', body);
}

module.exports = { group, fixed, plural, pct, escape, STYLE, htmlTable, page };
