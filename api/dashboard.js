// Daily Dashboard delivery — serves the raw, self-contained daily report HTML
// into the daily-report.html iframe, gated by the subscription paywall now that
// middleware blocks direct /data/daily-dashboard/* access.
//
//   fn=index        → { dates }                     (public — for the date picker)
//   (default)       → the report HTML for ?date= or latest. When the paywall is
//                     active and the viewer isn't subscribed, a small styled
//                     "subscribe" HTML page is returned instead (so nothing leaks
//                     even if the iframe src is hit directly).

const fs = require('fs');
const path = require('path');
const { checkEntitlement, paywallActive } = require('../lib/entitlement.js');

const DIR = path.join(process.cwd(), 'data', 'daily-dashboard');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readIndex() {
  const p = path.join(DIR, 'index.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
}

function htmlPath(date) {
  if (date) {
    if (!DATE_RE.test(date)) return null; // guards against path traversal
    return path.join(DIR, 'history', `${date}.html`);
  }
  return path.join(DIR, 'latest.html');
}

function gateHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0b0e14;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem;text-align:center}.c{max-width:26rem}.i{font-size:2rem}h1{font-size:1.15rem;margin:.5rem 0}p{color:#94a3b8;font-size:.9rem;line-height:1.55}a{display:inline-block;margin-top:1.1rem;background:linear-gradient(90deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;font-weight:600;padding:.6rem 1.4rem;border-radius:.75rem}</style></head>
<body><div class="c"><div class="i">🔒</div><h1>The Daily Dashboard is for subscribers</h1>
<p>The full generated daily report — regime, currency strength, trade ideas and charts — unlocks with a subscription. The Research Desk shows today's regime, top idea and the full track record for free.</p>
<a href="/research.html" target="_top">Subscribe on the Research Desk &rarr;</a></div></body></html>`;
}

function sendHtml(res, status, html) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  res.status(status).send(html);
}

module.exports = async function handler(req, res) {
  try {
    if (req.query.fn === 'index') {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.status(200).json({ dates: readIndex() });
      return;
    }

    if (paywallActive()) {
      const { entitled } = await checkEntitlement(req, res);
      if (!entitled) { sendHtml(res, 200, gateHtml()); return; }
    }

    const p = htmlPath(req.query.date);
    if (!p || !fs.existsSync(p)) {
      sendHtml(res, 404, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;background:#0b0e14;color:#94a3b8;padding:2rem">No report found for that date yet.</body>');
      return;
    }
    sendHtml(res, 200, fs.readFileSync(p, 'utf8'));
  } catch (err) {
    console.error('dashboard api failed:', err);
    sendHtml(res, 500, '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;background:#0b0e14;color:#94a3b8;padding:2rem">Could not load the report.</body>');
  }
};
