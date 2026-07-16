#!/usr/bin/env node
// Generates the daily "Institutional FX Dashboard & Intelligence Report" directly via
// the Anthropic Messages API (with the server-side web_search tool), then feeds the
// result through the existing local parsers (parse-fx-report.js, sync-daily-dashboard.js)
// so `data/fx-reports/` and `data/daily-dashboard/` come out identical in shape to what
// the Cowork-based pipeline has always produced.
//
// WHY THIS EXISTS: the original pipeline (Cowork's `daily-fx-dashboard` scheduled task)
// only fires reliably when the Cowork app/session is active — in practice, when the
// laptop it runs on is on. This script does the same job from a cloud runner (see
// .github/workflows/daily-fx-report.yml) with no dependency on any local machine being
// awake. It is a replacement for daily-fx-dashboard + fx-report-app-sync combined, not
// an addition to them — running both would double-write the same files.
//
// WHY ONE API CALL PRODUCES BOTH .md AND .html: earlier hand-run sessions of this report
// hit a real bug where the markdown and HTML versions drifted out of sync because they
// were written in two separate passes. Asking for both in a single response, split by
// explicit markers, makes that class of bug structurally impossible here.
//
// CONTINUITY: Section 2 (Performance Review), Section 9's confidence deltas, and Section
// 15's overall-confidence delta all require knowing what the previous report said. This
// script reads data/fx-reports/latest.json (already committed from the last run) and
// includes a compact summary of it in the prompt, so the "still pending" ideas /
// hit-rate tracker / deltas continue correctly across runs.
//
// REQUIRES: ANTHROPIC_API_KEY env var — a real API key from console.anthropic.com. This
// is billed separately from any claude.ai / Cowork subscription; check current pricing
// before enabling the schedule. Also verify ANTHROPIC_MODEL below is still a current,
// available model at https://docs.claude.com/en/docs/about-claude/models before relying
// on this in production — it's set from an env var with a fallback default specifically
// so it can be updated without touching this file.
//
// USAGE: node scripts/generate-fx-report.js
// Writes reports-source/fx-dashboard-<date>.md and .html, then runs the existing
// parsers to refresh data/fx-reports/ and data/daily-dashboard/.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'reports-source');
const FX_REPORTS_DATA_DIR = path.join(ROOT, 'data', 'fx-reports');
const DASHBOARD_DATA_DIR = path.join(ROOT, 'data', 'daily-dashboard');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Default is a real, known-good model as of this script's writing — but models are
// deprecated/replaced over time. If this call starts failing with a "model not found"
// style error, check the docs link above and set ANTHROPIC_MODEL in the environment
// (e.g. as a repo variable, not a secret, since it isn't sensitive) rather than editing
// this file blind.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '16000', 10);

function todayIso() {
  // en-CA gives YYYY-MM-DD directly.
  return new Date().toLocaleDateString('en-CA', { timeZone: process.env.REPORT_TIMEZONE || 'Europe/Berlin' });
}

function isWeekday(isoDate) {
  const day = new Date(`${isoDate}T12:00:00Z`).getUTCDay(); // noon UTC avoids date-boundary edge cases
  return day >= 1 && day <= 5;
}

function loadPriorContext() {
  const latestPath = path.join(FX_REPORTS_DATA_DIR, 'latest.json');
  if (!fs.existsSync(latestPath)) return null;
  try {
    const prior = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    return {
      reportDateLabel: prior.reportDateLabel,
      performanceIdeas: prior.performanceReview ? prior.performanceReview.ideas : [],
      tradeIdeas: prior.tradeIdeas ? prior.tradeIdeas.ideas : [],
      overallConfidence: prior.decisionDashboard ? prior.decisionDashboard.overallConfidence : null,
    };
  } catch (err) {
    console.error('Could not parse prior latest.json, continuing without prior-day context:', err.message);
    return null;
  }
}

// ---------- the master prompt ----------
//
// Reconstructed from the report's own locked structure as established across many
// manually-run sessions (not a byte-for-byte copy of the original Cowork
// `daily-fx-dashboard` SKILL.md, which this script does not have access to). Compare
// against that file if it's ever available and reconcile differences — this is a
// faithful best-effort recreation of the same rules, not a guaranteed-identical copy.
function buildPrompt(dateIso, dateLabel, priorContext) {
  const priorBlock = priorContext
    ? `PRIOR REPORT CONTEXT (from ${priorContext.reportDateLabel || 'the most recent prior run'}) — use this to write an accurate Section 2 Performance Review, Section 9 confidence deltas, and Section 15 overall-confidence delta. Re-check each idea's current level via web search rather than assuming no movement.\n\nOpen ideas carried into today (from the prior report's Performance Review table):\n${JSON.stringify(priorContext.performanceIdeas, null, 2)}\n\nPrior report's high-conviction trade ideas (with prior confidence scores):\n${JSON.stringify(priorContext.tradeIdeas, null, 2)}\n\nPrior overall market confidence: ${priorContext.overallConfidence != null ? priorContext.overallConfidence + '/100' : 'unknown'}\n`
    : `PRIOR REPORT CONTEXT: none found — this is either the first run or prior data is unavailable. Section 2 should note that no prior open ideas exist yet; Section 9 confidence deltas should be marked N/A (first reading); Section 15 delta should be marked N/A.`;

  return `You are producing today's "Institutional FX Dashboard & Intelligence Report" (brand: "Appelton Intelligent Trading") for ${dateLabel}. Use the web_search tool to gather current, real, dated data — do not fabricate levels, rates, or news. Cite what you can verify; where data conflicts across sources or can't be confirmed, say so explicitly rather than picking one arbitrarily.

${priorBlock}

CURRENCY & PAIR UNIVERSE — this report covers 13 currencies total, organized in two tiers:
- G10 majors (10): USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD, SEK, NOK — central banks: Fed (US Federal Reserve, United States), ECB (European Central Bank, Eurozone), BoE (Bank of England, United Kingdom), BoJ (Bank of Japan, Japan), SNB (Swiss National Bank, Switzerland), BoC (Bank of Canada, Canada), RBA (Reserve Bank of Australia, Australia), RBNZ (Reserve Bank of New Zealand, New Zealand), Riksbank (Sweden), Norges Bank (Norway).
- EM (3, phase-one expansion — keep to exactly this set, do not add further EM currencies without being told to): CNH / offshore yuan (China, PBoC), MXN (Mexico, Banxico), ZAR (South Africa, SARB).

Apply this universe as follows:
- Section 3 (Central Bank Policy Rates): one row per bank, all 13, G10 first then EM. The Legend line must name all 13.
- Section 4 (Currency Strength Overview): score all 13 currencies.
- Section 5 (Tier 1 Pairs — Directional Read): organize with three "###" subheadings inside this one section (do NOT create new numbered top-level sections — the report structure is locked at exactly 17):
  - "### G10 vs USD" — the 9 USD-crosses of the G10 non-USD currencies (EUR/USD, GBP/USD, USD/JPY, USD/CHF, USD/CAD, AUD/USD, NZD/USD, USD/SEK, USD/NOK).
  - "### EM vs USD" — USD/CNH, USD/MXN, USD/ZAR.
  - "### Key Cross Pairs" — EUR/GBP, EUR/JPY, GBP/JPY, AUD/JPY, EUR/AUD, GBP/CHF (six liquid G10 crosses, chosen because they often show cleaner technical setups than USD-pairs).
- Section 9 (High-Conviction Trade Ideas): the eligible universe for new ideas is now everything above — G10 pairs, EM pairs, and cross pairs — not just USD-majors. Still only publish an idea when it genuinely meets the confidence bar; do not force one idea per tier just to cover the new universe.

EM DATA QUALITY (applies to CNH, MXN, ZAR specifically): be especially rigorous here. This report's own Section 17 has repeatedly logged conflicting data reads even for G10 currencies — expect EM to be worse. If a figure can't be confirmed from a clearly dated source, say so explicitly and log it in Section 17 rather than presenting an EM number with the same confidence as a G10 one. If publishing a Section 9 trade idea on an EM pair, explicitly note that EM pairs carry materially wider typical spreads than G10 majors, since that affects real-world risk/reward beyond what the stated ratio captures.

OUTPUT FORMAT — this is critical: respond with exactly two blocks, in this order, and nothing else outside them:

<REPORT_MARKDOWN>
...the full markdown report goes here...
</REPORT_MARKDOWN>

<REPORT_HTML>
...a self-contained HTML page rendering the same report goes here...
</REPORT_HTML>

MARKDOWN REPORT RULES:
- Title line: "# Institutional FX Dashboard & Intelligence Report — ${dateLabel}"
- Second line, italic: a short disclaimer that spot levels are same-day/last-close reference not live ticks, and this is not personalized financial advice.
- Exactly these 17 numbered "## N. Title" sections, in this order:
  1. Market Regime & Executive Summary
  2. Performance Review
  3. Central Bank Policy Rates
  4. Currency Strength Overview
  5. Tier 1 Pairs — Directional Read
  6. Layer-by-Layer Synthesis
  7. Correlation Check
  8. Rates & Risk Backdrop
  9. High-Conviction Trade Ideas
  10. Contrarian Check & Risks
  11. Global Equity Leaderboard
  12. Economic Catalyst Check
  13. No-Trade Zone Flag
  14. Key Theme Driving Everything Right Now
  15. Decision Dashboard Snapshot
  16. Historical Parallel Watch
  17. Known issues / refinements
- Section 2 (Performance Review) is mandatory every run: a markdown table reviewing every still-open idea from the prior context above (re-verify each pair's current level via search), a "Running Hit Rate: X played out / Y invalidated / Z still pending" line, and note which idea needs closest watching.
- Section 2 EDUCATIONAL BREAKDOWN (this report is used for teaching, so this is mandatory, not optional): for every idea that changes status THIS run — i.e. it first becomes "Played Out" (target hit) or first becomes "Invalidated" (stop hit) — add a dedicated "**Educational Breakdown**" directly under that idea's row/block, written in plain teaching language for students, not terse trader shorthand. It must cover, as clearly-labeled parts:
  - **What we expected, and why:** restate the original thesis in one or two sentences, then name the SPECIFIC signal(s) that drove the call — pull directly from that idea's original Section 9 confidence breakdown (which of Macro/Technicals/Positioning/Sentiment/Volatility scored highest when the idea was published, and what that score was based on). Be concrete: "we expected X because [specific macro/technical/positioning signal]," not a vague restatement.
  - **What actually happened:** describe the real catalyst and price action that produced the resolution — name the specific event/data/headline that moved the pair, not just the price levels.
  - **Match or divergence — and why:** state plainly whether the outcome matched the original reasoning. If it matched, name which specific signal proved most predictive and why that signal type (macro catalyst, technical level, positioning unwind, etc.) worked this time. If it diverged — including a full invalidation — name PRECISELY what was different between the expectation and reality (e.g. "we expected the Fed to stay hawkish through the print; instead cooler CPI shifted rhetoric two weeks earlier than modeled") and identify the root cause of that gap (a wrong assumption, an unmodeled event, a timing miss, crowded positioning that reversed faster than expected, etc.) rather than just noting that it didn't work.
  Ideas that remain unchanged (still pending, no new resolution this run) keep the existing short "Key Lesson" line only — do not force a full Educational Breakdown onto an idea that hasn't resolved yet.
- HINDSIGHT VALUE CHECK (mandatory alongside the Educational Breakdown, for both outcomes): immediately under the Educational Breakdown for any idea resolving this run, add a "**Hindsight Value Check**" showing what a hypothetical $1,000, unleveraged position would have become. Compute it as: $1,000 × (1 + favorable percentage move), using the same percentage already established for that idea's "Hypothetical P&L" figure (entry-zone midpoint to resolution price). Show the entry price, exit price, the percentage, and the resulting dollar figure explicitly (e.g. "$1,000 → $1,029.53, a gain of $29.53 (+2.95%)"). Apply this to BOTH played-out (win) and invalidated (loss) ideas — do not only show it for wins. Always append a one-line disclaimer: this is a simplified illustrative calculation only — no leverage, spread, financing/swap costs, or slippage modeled, and not a recommended position size or investment advice.
  - For a LOSS (invalidated idea) specifically, follow the dollar figure with a "**Risk Management Note**" (3-5 sentences, not a scare tactic, matter-of-fact and practical) that: (a) explicitly names the stop-loss level that was published for this idea and states plainly that this predefined stop is what capped the loss at the figure just shown — without a stop in place, the loss could have run further; (b) names the actual Risk/Reward ratio this idea was published with (from its original Section 9 entry) and notes that a favorable, predefined ratio is itself a loss-limiting technique, set before entry rather than decided emotionally mid-trade; and (c) briefly teaches one or two additional risk-limiting techniques relevant to trading generally, chosen from: position sizing so no single idea risks more than a small, fixed percentage of total account equity (commonly cited as 1-2%), scaling out of part of a position or trailing the stop as a trade moves favorably to lock in partial gains, reducing size on lower-confidence ideas (compare this idea's published confidence score to the tracker's higher-confidence ideas), or diversifying across uncorrelated ideas rather than concentrating risk in one pair. Keep this general and educational — do not recommend a specific dollar amount, leverage level, or broker/product for the reader's own account.
- Section 3 (Central Bank Policy Rates) must end with a "**Legend:**" line spelling out every central bank's full name and issuing country (e.g. "Fed = US Federal Reserve (United States)"), and the first prose mention of any bank elsewhere in the report should also name its country/region.
- Section 9 (High-Conviction Trade Ideas) must give each idea a full weighted confidence table with components Macro (35%), Technicals (25%), Positioning (20%), Sentiment (15%), Volatility (5%), each with a numeric contribution and reasoning, plus a "Total Confidence: NN/100 (∆ vs last report: ...)" line using the prior context above. If no fresh high-conviction idea is warranted, say so explicitly rather than forcing one.
- Section 17 (Known issues / refinements) is markdown-only — it must NOT appear in the HTML version at all. End it with an italic note that this section is for the user to edit directly and carries forward to future runs.
- Every numeric claim should reflect something found via web_search this session, dated. Flag any data gaps explicitly (e.g. "could not confirm via search this session") rather than inventing a figure.

HTML REPORT RULES:
- A complete, self-contained HTML document (inline <style>, optionally Chart.js from cdn.jsdelivr.net) rendering sections 1–16 only (never section 17) of the SAME content as the markdown above — same numbers, same conclusions, no new analysis introduced only in one format.
- Dark dashboard visual style: dark background, card-based layout, color-coded tags for bullish/bearish/neutral and pending/good/invalid outcomes.
- Title: "Institutional FX Dashboard & Intelligence Report — ${dateLabel}".

Begin your research now, then produce the two blocks.`;
}

async function callAnthropic(prompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it as a GitHub Actions secret (Settings → Secrets and variables → Actions) named ANTHROPIC_API_KEY.');
  }

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 20,
      },
    ],
    messages: [{ role: 'user', content: prompt }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  // Concatenate all text blocks in the response (web_search tool use produces
  // interleaved tool_use/tool_result content blocks alongside text blocks — only
  // the text blocks contain the actual report content we want).
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (!text) {
    throw new Error(`No text content in Anthropic response: ${JSON.stringify(data).slice(0, 2000)}`);
  }
  return text;
}

function extractBlock(text, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

async function main() {
  const dateIso = process.env.REPORT_DATE_OVERRIDE || todayIso();

  if (!process.env.REPORT_DATE_OVERRIDE && !isWeekday(dateIso)) {
    console.log(`${dateIso} is a weekend — nothing to do (this mirrors the Mon–Fri schedule of the original pipeline).`);
    return;
  }

  const existingMd = path.join(SOURCE_DIR, `fx-dashboard-${dateIso}.md`);
  if (fs.existsSync(existingMd)) {
    console.log(`${existingMd} already exists — nothing to do (already generated today).`);
    return;
  }

  const dateLabel = new Date(`${dateIso}T12:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const priorContext = loadPriorContext();
  const prompt = buildPrompt(dateIso, dateLabel, priorContext);

  console.log(`Requesting report for ${dateLabel} from ${MODEL}...`);
  const responseText = await callAnthropic(prompt);

  const markdown = extractBlock(responseText, 'REPORT_MARKDOWN');
  const html = extractBlock(responseText, 'REPORT_HTML');

  if (!markdown) {
    throw new Error('Could not find <REPORT_MARKDOWN> block in the API response — aborting without writing partial/broken files. Raw response saved to reports-source/_debug-last-response.txt for inspection.');
  }

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(existingMd, markdown, 'utf8');
  console.log(`Wrote ${existingMd} (${markdown.length} chars)`);

  if (html) {
    const htmlPath = path.join(SOURCE_DIR, `fx-dashboard-${dateIso}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`Wrote ${htmlPath} (${html.length} chars)`);
  } else {
    console.warn('No <REPORT_HTML> block found — the Daily Dashboard iframe view will not have a fresh file today. The markdown-derived FX Intelligence Desk view is unaffected.');
  }

  // Re-run the existing, already-battle-tested parsers rather than reimplementing
  // their logic here.
  console.log('Running parse-fx-report.js...');
  execFileSync('node', [path.join(ROOT, 'scripts', 'parse-fx-report.js'), existingMd, FX_REPORTS_DATA_DIR], { stdio: 'inherit' });

  if (html) {
    console.log('Running sync-daily-dashboard.js...');
    execFileSync('node', [path.join(ROOT, 'scripts', 'sync-daily-dashboard.js'), path.join(SOURCE_DIR, `fx-dashboard-${dateIso}.html`)], { stdio: 'inherit' });
  }

  console.log(`Done: ${dateIso} generated and synced.`);
}

main().catch((err) => {
  console.error('generate-fx-report.js failed:', err.message);
  process.exit(1);
});
