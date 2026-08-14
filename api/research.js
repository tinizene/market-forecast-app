// Research Desk data API — the ONLY way the FX report data reaches the browser
// now that middleware blocks raw /data/fx-reports/* access.
//
//   fn=index   → list of available report dates            (public)
//   fn=public  → the FREE subset: regime headline, top idea, track record, and
//                each live idea's headline + six-pillar score bars ONLY. Never
//                includes entries, targets, invalidation or scoring reasoning.  (public)
//   fn=full    → the ENTIRE report. Requires an active subscription when the
//                paywall is configured; fully open when it is not.
//
// The full report files live in the deployment bundle (see vercel.json
// includeFiles) and are read from disk here — they are never served statically.

const fs = require('fs');
const path = require('path');
const { checkEntitlement, paywallActive } = require('../lib/entitlement.js');

const REPORT_DIR = path.join(process.cwd(), 'data', 'fx-reports');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadReport(dateKey) {
  if (dateKey) {
    if (!DATE_RE.test(dateKey)) return null; // guards against path traversal
    const p = path.join(REPORT_DIR, 'history', `${dateKey}.json`);
    return fs.existsSync(p) ? readJson(p) : null;
  }
  const p = path.join(REPORT_DIR, 'latest.json');
  return fs.existsSync(p) ? readJson(p) : null;
}

// Build the free payload — an explicit allow-list so no locked field can leak.
function toPublic(data) {
  const ds = data.decisionSummary || {};
  const top = ds.topIdea || null;
  const pr = data.performanceReview || {};
  const ti = data.tradeIdeas || {};

  const liveIdeas = (Array.isArray(ti.ideas) ? ti.ideas : []).map((idea) => ({
    headline: idea.headline || '',
    totalConfidence: idea.totalConfidence != null ? idea.totalConfidence : null,
    // score bars only: component + contribution. NO reasoning column.
    scoring: {
      rows: (idea.scoring && Array.isArray(idea.scoring.rows) ? idea.scoring.rows : [])
        .map((r) => ({ component: r.component, weight: r.weight, contribution: r.contribution })),
    },
  }));

  return {
    reportDate: data.reportDate || null,
    reportDateLabel: data.reportDateLabel || null,
    // regime headline only — the executive summary / justification stays locked.
    regime: { classification: (data.regime && data.regime.classification) || null },
    decisionSummary: {
      overallConfidence: ds.overallConfidence != null ? ds.overallConfidence : null,
      topIdea: top ? { label: top.label, pair: top.pair, direction: top.direction, confidence: top.confidence, delta: top.delta } : null,
    },
    noTradeZone: data.noTradeZone
      ? { flagged: !!data.noTradeZone.flagged, status: data.noTradeZone.status || null, text: data.noTradeZone.text || '' }
      : { flagged: false, status: 'clear', text: '' },
    // track record is explicitly free and in the open.
    performanceReview: {
      hitRateSummary: pr.hitRateSummary || '',
      ideas: (Array.isArray(pr.ideas) ? pr.ideas : []).map((it) => ({
        idea_as_published: it.idea_as_published || '',
        outcome: it.outcome || '',
        hypothetical_p_l_if_followed: it.hypothetical_p_l_if_followed || '',
      })),
    },
    liveIdeas,
  };
}

module.exports = async function handler(req, res) {
  const fn = req.query.fn || 'public';
  const dateKey = req.query.date;

  try {
    if (fn === 'index') {
      const p = path.join(REPORT_DIR, 'index.json');
      const dates = fs.existsSync(p) ? readJson(p) : [];
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.status(200).json({ dates });
      return;
    }

    const data = loadReport(dateKey);
    if (!data) {
      res.status(404).json({ error: 'no_data', message: 'No research report found for that date yet.' });
      return;
    }

    if (fn === 'public') {
      // Ideas gate on ideasActive, which is true whether access comes from the
      // 90 days included with the course or from a monthly subscription. The extra
      // fields let the page say WHY someone has access and when it runs out.
      const ent = await checkEntitlement(req, res);
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({
        ...toPublic(data),
        entitled: ent.ideasActive,
        ownsCourse: ent.ownsCourse,
        ideasUntil: ent.ideasUntil,
        ideasSource: ent.ideasSource,
        paywallActive: ent.paywallActive,
      });
      return;
    }

    if (fn === 'full') {
      if (paywallActive()) {
        const ent = await checkEntitlement(req, res);
        if (!ent.ideasActive) {
          res.status(402).json({
            error: 'ideas_access_required',
            message: ent.ownsCourse
              ? 'Your three months of included ideas have ended. Subscribe to keep receiving them.'
              : 'The daily ideas are included with the course for three months, or available monthly on their own.',
            ownsCourse: ent.ownsCourse,
          });
          return;
        }
      }
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({ report: data, entitled: true });
      return;
    }

    res.status(400).json({ error: 'Unknown or missing fn query parameter' });
  } catch (err) {
    console.error('research api failed:', err);
    res.status(500).json({ error: 'server_error', message: 'Could not load research data.' });
  }
};
