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

// The performance table's column HEADERS drift between reports: "Idea (as
// published)" becomes "Idea as published — July 24", "Outcome" becomes "Outcome
// update", "Status change" becomes "Status on July 29", and the hypothetical P&L
// column disappears entirely in some runs. The track record is the free, in-the-open
// section of the Research Desk, so a renamed column must not blank it out. Map
// whatever arrived onto stable keys, keeping the original keys alongside.
const PERFORMANCE_ALIASES = [
  ['idea_as_published', (k) => /^idea/.test(k)],
  ['outcome', (k) => /^outcome/.test(k)],
  ['outcome', (k) => /^status/.test(k)],
  ['hypothetical_p_l_if_followed', (k) => /p_l|pnl|hypothetical/.test(k)],
  ['key_lesson', (k) => /lesson|notes/.test(k)],
];

function canonicalizePerformanceRow(row) {
  const out = Object.assign({}, row);
  for (const [canonical, matches] of PERFORMANCE_ALIASES) {
    if (out[canonical]) continue;
    const hit = Object.keys(row).find((k) => k !== canonical && matches(k) && row[k]);
    if (hit) out[canonical] = row[hit];
  }
  return out;
}

function extractPerformanceReview(section) {
  if (!section) return null;
  const tables = parseAllTables(section.raw).map(normalizeTable).filter((t) => t.type === 'rows');
  const ideas = tables.length ? tables[0].rows.map(canonicalizePerformanceRow) : [];
  // Capture the whole line, plus the date-range parenthetical the label carries in
  // newer reports. Stopping at the first period truncated the summary mid-number,
  // since it routinely quotes prices ("stopped out at ~93.50").
  const hitRateMatch = section.raw.match(/Running Hit Rate\s*([^\n:]*):?\*{0,2}([^\n]*)\n?([\s\S]*)/i);
  let summary = null;
  if (hitRateMatch) {
    const range = hitRateMatch[1].replace(/\*/g, '').trim();
    let body = hitRateMatch[2].trim();
    // 30 Jul puts the summary on the lines BELOW the label as a bullet list rather
    // than inline. Gather those bullets instead of grabbing only the first one.
    if (!body) {
      const bullets = [];
      for (const line of hitRateMatch[3].split('\n')) {
        if (/^\s*[-*]\s+/.test(line)) bullets.push(line.replace(/^\s*[-*]\s+/, '').trim());
        else if (bullets.length) break;
        else if (line.trim()) break;
      }
      body = bullets.join(' / ');
    }
    if (body) summary = stripMd(((range ? range + ': ' : '') + body).trim());
  }
  return { ideas, hitRateSummary: summary };
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

// Setup fields arrive either as a two-column table (27 Jul) or as a bullet list
// under a "**Setup:**" heading (30 Jul): "- **Entry zone:** 115.00-116.50".
function parseFieldBullets(chunk) {
  const fields = {};
  const re = /^\s*[-*]\s+\*\*([^*:]+):?\*\*[:\s]*(.+)$/gm;
  let m;
  while ((m = re.exec(chunk))) {
    const key = m[1].trim();
    if (key) fields[key] = stripMd(m[2].trim());
  }
  return fields;
}

// The six-pillar score arrives either as a table (27 Jul) or inline in the prose
// layer read (30 Jul): "**Macro (35%, score 32/35):** reasoning...". Normalised to
// the same {component, weight, contribution, reasoning} row shape either way, so
// the free score bars on the Research Desk keep rendering.
function parseInlineScoring(chunk) {
  const re = /\*\*([A-Za-z][A-Za-z /&-]*?)\s*\((\d+)%\s*,\s*score\s*([\d.]+\s*\/\s*[\d.]+)\)\s*:?\*\*\s*([\s\S]*?)(?=\*\*[A-Za-z][A-Za-z /&-]*?\s*\(\d+%\s*,\s*score|\n\*\*Total Confidence|$)/g;
  const rows = [];
  let m;
  while ((m = re.exec(chunk))) {
    rows.push({
      component: `${m[1].trim()} (${m[2]}%)`,
      weight: `${m[2]}%`,
      contribution: m[3].replace(/\s+/g, ''),
      reasoning: stripMd(m[4].trim()).slice(0, 800),
    });
  }
  return rows;
}

function extractTradeIdeas(section) {
  if (!section) return null;
  const raw = section.raw;
  // Idea headings have appeared as "**Idea 1: ...**" (27 Jul) and as
  // "### New Idea #1: ..." (30 Jul). Match both.
  const ideaSplitRe = /(?:\*\*(?:New\s+)?Idea\s*#?\s*\d+\s*[:.][^\n*]*\*\*|^#{2,4}\s*(?:New\s+)?Idea\s*#?\s*\d+\s*[:.][^\n]*)/gim;
  const marks = [];
  let m;
  while ((m = ideaSplitRe.exec(raw))) {
    marks.push({ index: m.index, headline: stripMd(m[0].replace(/^#+\s*/, '').trim()) });
  }

  const ideas = marks.map((mark, i) => {
    // Bound the last idea at the next non-idea heading ("### Considered and
    // Excluded This Run") so its chunk does not swallow the rest of the section.
    let end = i + 1 < marks.length ? marks[i + 1].index : raw.length;
    if (i + 1 === marks.length) {
      const tail = raw.slice(mark.index + 1).search(/\n#{2,4}\s+/);
      if (tail !== -1) end = mark.index + 1 + tail;
    }
    const chunk = raw.slice(mark.index, end);
    const tables = parseAllTables(chunk).map(normalizeTable);
    const keyValueTables = tables.filter((t) => t.type === 'keyValue');
    const mergedFields = Object.assign({}, ...keyValueTables.map((t) => t.pairs));
    const fields = Object.keys(mergedFields).length ? mergedFields : parseFieldBullets(chunk);
    const scoreTable = tables.find((t) => t.type === 'rows');
    const inlineRows = scoreTable ? null : parseInlineScoring(chunk);
    const confMatch = chunk.match(/Total Confidence:?\*{0,2}\s*(\d+)\s*\/\s*100[\s*]*(?:\(([^)]*)\))?/i);
    const confirmMatch = chunk.match(/Confirmation (?:Criteria|to watch(?:\s+for)?)[^:]*:?\*{0,2}\s*([\s\S]*?)(?=\n\||\n\n\*\*|\|---|\n\*\*Total Confidence|\*\*Biggest risk)/i);
    return {
      headline: mark.headline,
      fields,
      scoring: scoreTable
        ? { headers: scoreTable.headers, rows: scoreTable.rows }
        : (inlineRows && inlineRows.length ? { headers: ['Component', 'Weight', 'Contribution', 'Reasoning'], rows: inlineRows } : null),
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
  // Newer reports drop the single "Primary thesis risk" line for a numbered
  // "**Primary regime risks:**" list. Take the first item — it is the one the desk
  // ranks highest — so the morning brief still has a real risk to quote.
  const regimeRisk = primaryRisk
    ? null
    : section.raw.match(/\*\*Primary regime risks?:?\*\*\s*\n+\s*1\.\s*([\s\S]*?)(?=\n\s*2\.\s|\n\n\*\*)/i);
  const invalidation = section.raw.match(/\*\*Overall[- ]view invalidation factor:?\*\*\s*([\s\S]*?)(?=\n\n-\s*\*\*Bull case|\n-\s*\*\*Bull case)/i);
  const bull = section.raw.match(/\*\*Bull case[^:]*:?\*\*\s*([\s\S]*?)(?=\n-\s*\*\*Base case)/i);
  const base = section.raw.match(/\*\*Base case[^:]*:?\*\*\s*([\s\S]*?)(?=\n-\s*\*\*Bear case)/i);
  const bear = section.raw.match(/\*\*Bear case[^:]*:?\*\*\s*([\s\S]*?)$/i);
  return {
    primaryRisk: primaryRisk
      ? stripMd(primaryRisk[1].trim())
      : regimeRisk ? stripMd(regimeRisk[1].trim()) : null,
    invalidationFactor: invalidation ? stripMd(invalidation[1].trim()) : null,
    bullCase: bull ? stripMd(bull[1].trim()) : null,
    baseCase: base ? stripMd(base[1].trim()) : null,
    bearCase: bear ? stripMd(bear[1].trim()).split(/\n##/)[0] : null,
  };
}

// Classify a No-Trade Zone verdict clause into flagged / partial / clear.
// "Partial" covers any verdict that lifts the zone for part of the book only
// ("partially lifted", "selectively lifted") — the zone still binds elsewhere, so
// it must not read as a blanket all-clear. Returns null when the wording is
// genuinely unrecognised, which is honest and visible rather than a wrong boolean.
function classifyNoTradeVerdict(verdict) {
  const t = String(verdict || '').toLowerCase();
  if (/partial|selective|mixed|bifurcat/.test(t)) return 'partial';
  const lead = t.match(/^\**\s*(yes|no|reinstated|reimposed|lifted|clear\w*|active|in\s+effect)\b/);
  if (lead) {
    const word = lead[1].replace(/\s+/g, ' ');
    if (/^(yes|reinstated|reimposed|active|in effect)$/.test(word)) return 'flagged';
    return 'clear';
  }
  if (/\breinstated|reimposed|remains? in effect\b/.test(t)) return 'flagged';
  if (/\blifted\b/.test(t)) return 'clear';
  return null;
}

function extractNoTradeZone(section) {
  if (!section) return null;

  // Newer template states the verdict inline. Every run so far has invented new
  // wording for it:
  //   **No-Trade Zone Flag: NO — LIFTED as of July 27.**        (27 Jul)
  //   **No-Trade Zone Flag: YES — REINSTATED as of July 28.**   (28 Jul)
  //   **No-Trade Zone Flag: PARTIALLY LIFTED.**                 (29 Jul)
  //   **No-Trade Zone Flag: SELECTIVELY LIFTED.**               (30 Jul)
  // So do NOT enumerate the vocabulary in the match — grab whatever clause is
  // there and classify it afterwards. Enumerating meant an unrecognised verdict
  // fell through to the legacy pattern below, which matches the literal "No" in
  // "No-Trade" and reports the exact opposite of the truth.
  const labelled = section.raw.match(/no-?trade\s+zone[^:\n]*:\s*\**\s*([^\n]+)/i);
  if (labelled) {
    // The verdict runs to the end of its own sentence. Split it off the body so the
    // prose that follows reads as prose — otherwise the morning brief quotes
    // "LIFTED." as the day's biggest risk.
    const rest = labelled[1];
    const clause = rest.match(/^([\s\S]{0,160}?[.!?])(?=\s|\*|$)/);
    const verdict = stripMd((clause ? clause[1] : rest).trim());
    const body = clause ? rest.slice(clause[0].length) + section.raw.slice(labelled.index + labelled[0].length) : '';

    const status = classifyNoTradeVerdict(verdict);
    return {
      flagged: status == null ? null : status !== 'clear',
      status,
      verdict,
      text: stripMd(body.replace(/^[\s*—–-]*/, '').trim()) || stripMd(section.raw),
    };
  }

  // Older template: the section opens with a bare **Yes** / **No** verdict.
  const flagMatch = section.raw.match(/^\*\*(Yes|No)\b[^*]*\*\*\s*([\s\S]*)/i);
  const flagged = flagMatch ? /yes/i.test(flagMatch[1]) : null;
  return {
    flagged,
    status: flagged == null ? null : (flagged ? 'flagged' : 'clear'),
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
  // The heading carries a parenthetical in newer reports — "**Portfolio Tilt Note
  // (MAJOR INFLECTION vs. July 28):**" — so match up to the closing bold marker
  // rather than assuming the label ends at the colon.
  const tiltMatch = section.raw.match(/\*\*Portfolio Tilt Note\b[^*]*\*\*\s*([\s\S]*?)$/i);
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
  // Headings run "Idea 1: ..." (27 Jul) or "New Idea #1: ..." (30 Jul).
  const prefix = /^(?:New\s+)?Idea\s*#?\s*\d+\s*[:.]\s*/i;
  const m = headline.match(/(?:New\s+)?Idea\s*#?\s*\d+\s*[:.]\s*(Short|Long)\s+([A-Za-z]{3}\/[A-Za-z]{3})/i);
  if (m) return { direction: m[1], pair: m[2].toUpperCase(), short: `${m[1]} ${m[2].toUpperCase()}` };
  const cleaned = headline
    .replace(prefix, '')
    .split(/\s*\(theme/i)[0]
    .split(/\s*—/)[0]
    // A trailing "(Revised 73/100)" / "(NEW, 64/100)" is score metadata, not part of
    // the idea's name — confidence is rendered separately, so drop it.
    .replace(/\s*\([^)]*\d+\s*\/\s*100[^)]*\)\s*$/i, '')
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
  // A fully flagged No-Trade Zone opens with the reason it was flagged, so its first
  // sentence IS the day's biggest risk. A partially-lifted one opens with what is now
  // tradeable again — quoting that as "biggest risk" would say the opposite of the
  // truth, so fall through to the explicit risk list instead.
  const nt = result.noTradeZone;
  const riskText = (nt && nt.flagged && nt.status !== 'partial' && nt.text)
    ? nt.text
    : ((result.contrarianCheck && result.contrarianCheck.primaryRisk)
      || (nt && nt.flagged && nt.text)
      || null);
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
  // "Central Bank Policy Rates" was renamed "Central Bank Rates & Calendar" in the
  // 27 Jul template — keep both spellings so the rates table keeps parsing.
  const policyRatesSection = findSection(sections, ['central bank policy rates', 'central bank rates', 'policy rates']);
  const currencyStrengthSection = findSection(sections, ['currency strength']);
  const tier1Section = findSection(sections, ['tier 1 pairs', 'tier-1 pairs']);
  const synthesisSection = findSection(sections, ['layer-by-layer synthesis']);
  const correlationSection = findSection(sections, ['correlation check']);
  const ratesRiskSection = findSection(sections, ['rates & risk backdrop', 'rates and risk backdrop']);
  const tradeIdeasSection = findSection(sections, ['high-conviction trade ideas']);
  const contrarianSection = findSection(sections, ['contrarian check']);
  const equityLeaderboardSection = findSection(sections, ['global equity leaderboard']);
  const catalystSection = findSection(sections, ['economic catalyst check']);
  // Matches both report templates: the pre-20-Jul layout had a dedicated
  // "No-Trade Zone Flag" section; later runs fold it into a combined
  // "Risks, Contrarian Check & No-Trade Zone" section. Keyed on the shorter
  // phrase so both resolve.
  const noTradeSection = findSection(sections, ['no-trade zone']);
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

module.exports = {
  parseFxReport,
  parseAllTables,
  normalizeTable,
  // Exported so the verdict logic can be regression-tested against the raw text of
  // reports whose source markdown is no longer on hand.
  extractNoTradeZone,
  classifyNoTradeVerdict,
};
