#!/usr/bin/env node
// Parses an "Institutional FX Dashboard & Intelligence Report" markdown file (the
// Appelton Intelligent Trading daily report format found in FX-Reports/) into
// structured JSON the app can render.
//
// Design constraint driven by real evidence, not assumption: comparing the 4 Jul
// report against 6/7/9 Jul shows the section COUNT, NUMBERING, and even column
// layout of some tables (Policy Rates went from 4 columns to 5; Tier 1 Pairs
// alternates between a table and a bullet list) all changed between runs — this is
// a template that's still evolving. So this parser:
//   1. Splits sections by title TEXT (keyword match), never by section number.
//   2. Parses tables generically, keyed by whatever headers/columns actually exist
//      (2-column tables become label→value pairs; wider tables become row objects
//      keyed by header) — no hardcoded column names that could silently break.
//   3. Always keeps each section's raw markdown too, so the app can render a
//      section correctly even when structured extraction finds nothing usable.
//
// Usage: node scripts/parse-fx-report.js <input.md> [outputDir]
// Writes <outputDir>/history/<date>.json and updates <outputDir>/latest.json + index.json.

const fs = require('fs');
const path = require('path');

// ---------- generic markdown table parsing ----------

function parseAllTables(markdown) {
  const tables = [];
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s*\|.*\|\s*$/.test(line)) continue;
    const next = lines[i + 1] || '';
    if (!/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(next) || !/-/.test(next)) continue;

    const headerCells = splitRow(line);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) {
      rows.push(splitRow(lines[j]));
      j++;
    }
    tables.push({ startLine: i, endLine: j - 1, headerCells, rows });
    i = j - 1;
  }
  return tables;
}

function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

function stripMd(text) {
  if (!text) return text;
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
}

// Turn a raw table into either keyValue pairs (2-col tables — Field/Detail-style)
// or an array of row objects keyed by header (wider tables).
function normalizeTable(table) {
  const headers = table.headerCells.map((h) => h.trim());
  const isBlankHeader = headers.every((h) => h === '' || h === '---');

  if (headers.length === 2) {
    const pairs = {};
    for (const row of table.rows) {
      if (row.length < 2) continue;
      const key = stripMd(row[0]);
      if (!key) continue;
      pairs[key] = stripMd(row[1]);
    }
    return { type: 'keyValue', pairs };
  }

  const keys = isBlankHeader
    ? headers.map((_, idx) => `col${idx + 1}`)
    : headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'col');

  const rows = table.rows
    .filter((r) => r.some((c) => c && c.trim()))
    .map((r) => {
      const obj = {};
      keys.forEach((k, idx) => { obj[k] = stripMd(r[idx] || ''); });
      return obj;
    });

  return { type: 'rows', headers, rows };
}

// ---------- section splitting (by TITLE TEXT, not number) ----------

function splitSections(markdown) {
  const headerRe = /^##\s+(.+)$/gm;
  const marks = [];
  let m;
  while ((m = headerRe.exec(markdown))) {
    marks.push({ index: m.index, headerLength: m[0].length, titleRaw: m[1].trim() });
  }
  const sections = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : markdown.length;
    const numberMatch = marks[i].titleRaw.match(/^(\d+)\.\s*/);
    const title = marks[i].titleRaw.replace(/^\d+\.\s*/, '').trim();
    const body = markdown.slice(start + marks[i].headerLength, end).trim();
    sections.push({ number: numberMatch ? parseInt(numberMatch[1], 10) : null, title, raw: body });
  }
  return sections;
}

function findSection(sections, keywords) {
  const lower = (s) => s.toLowerCase();
  return sections.find((s) => keywords.some((k) => lower(s.title).includes(k)));
}

function boldField(text, labelPattern) {
  const re = new RegExp('\\*\\*' + labelPattern + ':?\\*\\*\\s*:?\\s*([^\\n]+)', 'i');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function boldSentence(text, labelPattern) {
  // Matches "**Label: rest of the bolded sentence.**" (label + content inside the bold run)
  const re = new RegExp('\\*\\*' + labelPattern + ':?\\s*([^*]+)\\*\\*', 'i');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

// ---------- section-specific extraction ----------

function extractRegime(section) {
  if (!section) return null;
  const classification = boldSentence(section.raw, 'Regime classification');
  const justificationMatch = section.raw.match(/Justification:\s*([\s\S]*?)(?=\n\*\*Executive Summary|\n\n\*\*|$)/i);
  const execMatch = section.raw.match(/\*\*Executive Summary:?\*\*\s*([\s\S]*)/i);
  return {
    classification: classification ? stripMd(classification) : null,
    justification: justificationMatch ? stripMd(justificationMatch[1].trim()) : null,
    executiveSummary: execMatch ? stripMd(execMatch[1].trim()) : null,
  };
}

function extractPerformanceReview(section) {
  if (!section) return null;
  const tables = parseAllTables(section.raw).map(normalizeTable).filter((t) => t.type === 'rows');
  const ideas = tables.length ? tables[0].rows : [];
  const hitRateMatch = section.raw.match(/Running Hit Rate:?\*{0,2}\s*([^.\n]+)/i);
  return { ideas, hitRateSummary: hitRateMatch ? stripMd(hitRateMatch[1].trim()) : null };
}

function extractGenericTableSection(section) {
  if (!section) return null;
  const tables = parseAllTables(section.raw).map(normalizeTable).filter((t) => t.type === 'rows');
  return tables.length ? tables[0] : null;
}

function extractTier1Pairs(section) {
  if (!section) return null;
  const tables = parseAllTables(section.raw).map(normalizeTable).filter((t) => t.type === 'rows');
  if (tables.length) return { format: 'table', table: tables[0] };

  // Bullet-list fallback: "- **EUR/USD** 1.1439 (...) — reason text."
  const bulletRe = /^-\s*\*\*([^*]+)\*\*\s*(.+)$/gm;
  const items = [];
  let m;
  while ((m = bulletRe.exec(section.raw))) {
    items.push({ pair: m[1].trim(), detail: stripMd(m[2].trim()) });
  }
  return { format: 'bullets', items };
}

function extractTradeIdeas(section) {
  if (!section) return null;
  const raw = section.raw;
  const ideaSplitRe = /\*\*Idea\s+\d+[:.][^\n*]*\*\*/g;
  const marks = [];
  let m;
  while ((m = ideaSplitRe.exec(raw))) marks.push({ index: m.index, headline: stripMd(m[0]) });

  const ideas = marks.map((mark, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : raw.length;
    const chunk = raw.slice(mark.index, end);
    const tables = parseAllTables(chunk).map(normalizeTable);
    const keyValueTables = tables.filter((t) => t.type === 'keyValue');
    const mergedFields = Object.assign({}, ...keyValueTables.map((t) => t.pairs));
    const scoreTable = tables.find((t) => t.type === 'rows');
    const confMatch = chunk.match(/Total Confidence:?\*{0,2}\s*(\d+)\s*\/\s*100[\s*]*(?:\(([^)]*)\))?/i);
    const confirmMatch = chunk.match(/Confirmation Criteria[^:]*:?\*{0,2}\s*([\s\S]*?)(?=\n\||\n\n\*\*|\|---|\n\*\*Total Confidence)/i);
    return {
      headline: mark.headline,
      fields: mergedFields,
      scoring: scoreTable ? { headers: scoreTable.headers, rows: scoreTable.rows } : null,
      totalConfidence: confMatch ? parseInt(confMatch[1], 10) : null,
      confidenceDelta: confMatch && confMatch[2] ? confMatch[2].trim() : null,
      confirmationCriteria: confirmMatch ? stripMd(confirmMatch[1].trim()).slice(0, 600) : null,
    };
  });

  const excludedMatch = raw.match(/\*\*NO HIGH-CONVICTION TRADE:?\s*([^*]+)\*\*\.?\s*([\s\S]*?)(?=\n##|These are analytical scenarios|$)/i);
  const excluded = excludedMatch
    ? { title: stripMd(excludedMatch[1].trim()), reasoning: stripMd(excludedMatch[2].trim()).slice(0, 800) }
    : null;

  return { ideas, excluded };
}

function extractCorrelationCheck(section) {
  if (!section) return null;
  const readMatch = section.raw.match(/\*\*Read:?\*{0,2}\s*([A-Za-z ]+)/i);
  const text = section.raw.replace(/\*\*Read:?[\s\S]*$/i, '').trim();
  return { text: stripMd(text), read: readMatch ? readMatch[1].trim() : null };
}

function extractContrarianCheck(section) {
  if (!section) return null;
  const primaryRisk = section.raw.match(/\*\*Primary thesis risk:?\*\*\s*([\s\S]*?)(?=\n\n\*\*|\n-\s*\*\*Bull case)/i);
  const invalidation = section.raw.match(/\*\*Overall[- ]view invalidation factor:?\*\*\s*([\s\S]*?)(?=\n\n-\s*\*\*Bull case|\n-\s*\*\*Bull case)/i);
  const bull = section.raw.match(/\*\*Bull case[^:]*:?\*\*\s*([\s\S]*?)(?=\n-\s*\*\*Base case)/i);
  const base = section.raw.match(/\*\*Base case[^:]*:?\*\*\s*([\s\S]*?)(?=\n-\s*\*\*Bear case)/i);
  const bear = section.raw.match(/\*\*Bear case[^:]*:?\*\*\s*([\s\S]*?)$/i);
  return {
    primaryRisk: primaryRisk ? stripMd(primaryRisk[1].trim()) : null,
    invalidationFactor: invalidation ? stripMd(invalidation[1].trim()) : null,
    bullCase: bull ? stripMd(bull[1].trim()) : null,
    baseCase: base ? stripMd(base[1].trim()) : null,
    bearCase: bear ? stripMd(bear[1].trim()).split(/\n##/)[0] : null,
  };
}

function extractNoTradeZone(section) {
  if (!section) return null;
  const flagMatch = section.raw.match(/^\*\*(Yes|No)\b[^*]*\*\*\s*([\s\S]*)/i);
  return {
    flagged: flagMatch ? /yes/i.test(flagMatch[1]) : null,
    text: flagMatch ? stripMd(flagMatch[2].trim()) : stripMd(section.raw),
  };
}

function extractKeyThemes(section) {
  if (!section) return [];
  const items = [];
  const re = /^\d+\.\s*\*\*([^*]+)\*\*\s*(.*)$/gm;
  let m;
  while ((m = re.exec(section.raw))) {
    items.push(stripMd(m[1].trim()) + (m[2] ? ' ' + stripMd(m[2].trim()) : ''));
  }
  return items;
}

function extractDecisionDashboard(section) {
  if (!section) return null;
  const confMatch = section.raw.match(/Overall Market Confidence:?\*{0,2}\s*(\d+)\s*\/\s*100[\s*]*(?:\(([^)]*)\))?/i);
  const tiltMatch = section.raw.match(/\*\*Portfolio Tilt Note:?\*\*\s*([\s\S]*?)$/i);
  return {
    overallConfidence: confMatch ? parseInt(confMatch[1], 10) : null,
    confidenceDelta: confMatch && confMatch[2] ? confMatch[2].trim() : null,
    portfolioTiltNote: tiltMatch ? stripMd(tiltMatch[1].trim()).split(/\n##/)[0] : null,
  };
}

function extractKnownIssues(section) {
  if (!section) return [];
  return section.raw
    .split('\n')
    .filter((l) => /^-\s+/.test(l.trim()))
    .map((l) => stripMd(l.replace(/^-\s+/, '').trim()));
}

// ---------- date parsing ----------

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function toIsoDate(label) {
  if (!label) return null;
  const m = label.match(/(\w+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return null;
  const monthIdx = MONTHS.indexOf(m[1].toLowerCase());
  if (monthIdx === -1) return null;
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(parseInt(m[2], 10)).padStart(2, '0');
  return `${m[3]}-${mm}-${dd}`;
}

// ---------- decision summary (hero card / Decision Engine / morning brief) ----------
//
// Deliberately derives everything below from fields already extracted above —
// no new data source, no invented score. "Best opportunity" / "Avoid" / the
// morning-brief paragraph are templated assemblies of real report text, not a
// second, independent judgment layered on top of the analyst desk's own numbers.

function extractIdeaLabel(headline) {
  const m = headline.match(/Idea\s*\d+[:.]\s*(Short|Long)\s+([A-Za-z]{3}\/[A-Za-z]{3})/i);
  if (m) return { direction: m[1], pair: m[2].toUpperCase(), short: `${m[1]} ${m[2].toUpperCase()}` };
  const cleaned = headline
    .replace(/^Idea\s*\d+[:.]\s*/i, '')
    .split(/\s*\(theme/i)[0]
    .split(/\s*—/)[0]
    .trim();
  return { direction: null, pair: null, short: cleaned };
}

function computeDecisionSummary(result) {
  const ideas = (result.tradeIdeas && result.tradeIdeas.ideas) || [];
  const scored = ideas.filter((i) => i.totalConfidence != null);
  const top = scored.length ? scored.reduce((a, b) => (b.totalConfidence > a.totalConfidence ? b : a)) : null;
  const bottom = scored.length > 1 ? scored.reduce((a, b) => (b.totalConfidence < a.totalConfidence ? b : a)) : null;

  const topLabel = top ? extractIdeaLabel(top.headline) : null;
  const bottomLabel = bottom ? extractIdeaLabel(bottom.headline) : null;

  // "Avoid" prefers the report's own explicit excluded/no-trade call (the most
  // directly honest source for "don't trade this") over just picking the
  // lowest-scored open idea, which is still a real idea the desk is tracking,
  // not something flagged as avoid-worthy.
  const avoid = result.tradeIdeas && result.tradeIdeas.excluded
    ? { label: result.tradeIdeas.excluded.title, reason: result.tradeIdeas.excluded.reasoning, source: 'excluded' }
    : bottom
      ? { label: bottomLabel.short, reason: `Lowest-confidence open idea today (${bottom.totalConfidence}/100).`, source: 'lowest-confidence' }
      : null;

  const catalystSection = (result.sections || []).find((s) => s.title.toLowerCase().includes('economic catalyst'));
  let nextEvent = null;
  if (catalystSection) {
    const m = catalystSection.raw.match(/\*\*([^*]+)\*\*\s*([^\n]*)/);
    if (m) nextEvent = stripMd(`${m[1]}: ${m[2]}`).replace(/\s+/g, ' ').trim().slice(0, 240);
  }

  const regimeShort = result.regime && result.regime.classification
    ? result.regime.classification.split(/[—,]/)[0].trim()
    : null;
  const overallConfidence = result.decisionDashboard ? result.decisionDashboard.overallConfidence : null;
  const riskText = (result.noTradeZone && result.noTradeZone.flagged && result.noTradeZone.text)
    ? result.noTradeZone.text
    : (result.contrarianCheck && result.contrarianCheck.primaryRisk);
  const firstSentence = (text) => (text ? text.split(/(?<=[.!?])\s+/)[0] : null);

  const briefParts = ['Good morning.'];
  if (regimeShort) briefParts.push(`Today's regime: ${regimeShort}.`);
  if (overallConfidence != null) briefParts.push(`Overall market confidence is ${overallConfidence}/100.`);
  if (topLabel && top) briefParts.push(`The strongest idea on the desk today is ${topLabel.short}, confidence ${top.totalConfidence}/100.`);
  if (riskText) briefParts.push(`Biggest risk to watch: ${firstSentence(riskText)}`);
  if (briefParts.length === 1) briefParts.push('No structured summary could be assembled from today\'s report — see the full sections below.');

  return {
    topIdea: top ? { label: topLabel.short, pair: topLabel.pair, direction: topLabel.direction, confidence: top.totalConfidence, delta: top.confidenceDelta, scoring: top.scoring } : null,
    avoid,
    nextEvent,
    overallConfidence,
    morningBrief: briefParts.join(' '),
  };
}

// ---------- main parse ----------

function parseFxReport(markdown, sourceFile) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : null;
  const dateLabelMatch = title && title.match(/—\s*(.+)$/);
  const reportDateLabel = dateLabelMatch ? dateLabelMatch[1].trim() : null;
  const reportDate = toIsoDate(reportDateLabel);

  const sections = splitSections(markdown);

  const regimeSection = findSection(sections, ['market regime', 'executive summary']);
  const performanceSection = findSection(sections, ['performance review']);
  const policyRatesSection = findSection(sections, ['central bank policy rates', 'policy rates']);
  const currencyStrengthSection = findSection(sections, ['currency strength']);
  const tier1Section = findSection(sections, ['tier 1 pairs', 'tier-1 pairs']);
  const synthesisSection = findSection(sections, ['layer-by-layer synthesis']);
  const correlationSection = findSection(sections, ['correlation check']);
  const ratesRiskSection = findSection(sections, ['rates & risk backdrop', 'rates and risk backdrop']);
  const tradeIdeasSection = findSection(sections, ['high-conviction trade ideas']);
  const contrarianSection = findSection(sections, ['contrarian check']);
  const equityLeaderboardSection = findSection(sections, ['global equity leaderboard']);
  const catalystSection = findSection(sections, ['economic catalyst check']);
  const noTradeSection = findSection(sections, ['no-trade zone flag']);
  const keyThemeSection = findSection(sections, ['key theme']);
  const decisionDashboardSection = findSection(sections, ['decision dashboard']);
  const historicalParallelSection = findSection(sections, ['historical parallel']);
  const knownIssuesSection = findSection(sections, ['known issues', 'refinements']);

  const result = {
    sourceFile: sourceFile || null,
    title,
    reportDate,
    reportDateLabel,
    regime: extractRegime(regimeSection),
    performanceReview: extractPerformanceReview(performanceSection),
    policyRates: extractGenericTableSection(policyRatesSection),
    currencyStrength: extractGenericTableSection(currencyStrengthSection),
    tier1Pairs: extractTier1Pairs(tier1Section),
    correlationCheck: extractCorrelationCheck(correlationSection),
    ratesRiskBackdrop: extractGenericTableSection(ratesRiskSection),
    tradeIdeas: extractTradeIdeas(tradeIdeasSection),
    contrarianCheck: extractContrarianCheck(contrarianSection),
    globalEquityLeaderboard: extractGenericTableSection(equityLeaderboardSection),
    noTradeZone: extractNoTradeZone(noTradeSection),
    keyThemes: extractKeyThemes(keyThemeSection),
    decisionDashboard: extractDecisionDashboard(decisionDashboardSection),
    knownIssues: extractKnownIssues(knownIssuesSection),
    // Full section list retained verbatim — the resilient fallback the module
    // header describes: the app can always render *something* correctly, even
    // for sections the targeted extractors above don't specifically understand,
    // and even if section numbering/order shifts again in a future report.
    sections: sections.map((s) => ({ number: s.number, title: s.title, raw: s.raw })),
  };
  result.decisionSummary = computeDecisionSummary(result);
  return result;
}

// ---------- CLI ----------

function main() {
  const [, , inputPath, outputDirArg] = process.argv;
  if (!inputPath) {
    console.error('Usage: node parse-fx-report.js <input.md> [outputDir]');
    process.exit(1);
  }
  const outputDir = outputDirArg || path.join(__dirname, '..', 'data', 'fx-reports');
  const markdown = fs.readFileSync(inputPath, 'utf8');
  const parsed = parseFxReport(markdown, path.basename(inputPath));

  const historyDir = path.join(outputDir, 'history');
  fs.mkdirSync(historyDir, { recursive: true });

  const dateKey = parsed.reportDate || path.basename(inputPath).replace(/\.md$/, '');
  fs.writeFileSync(path.join(historyDir, `${dateKey}.json`), JSON.stringify(parsed, null, 2));
  fs.writeFileSync(path.join(outputDir, 'latest.json'), JSON.stringify(parsed, null, 2));

  const indexPath = path.join(outputDir, 'index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf8')); } catch { index = []; }
  }
  if (!index.includes(dateKey)) index.push(dateKey);
  index.sort();
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`Parsed ${inputPath} -> ${dateKey}.json (${parsed.sections.length} sections found)`);
}

if (require.main === module) main();

module.exports = { parseFxReport, parseAllTables, normalizeTable };
