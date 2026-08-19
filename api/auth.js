// Email recovery for course access — the magic-link flow.
//
// WHY THIS EXISTS: the course is sold as "yours forever", and until now that depended
// on the scere_cus cookie surviving. Clearing cookies on a new laptop lost a EUR 200
// purchase with no way back. lib/entitlement.js says as much in its own comments.
//
// WHAT IT REPLACES: api/billing.js previously had fn=restore, which re-issued FULL
// entitlement to anyone who posted a customer's email address — no verification of
// any kind. Knowing a buyer's email was enough to be granted their course and their
// ideas subscription, and its 404-vs-200 responses confirmed which addresses had
// bought. That endpoint is gone; this is what replaces it.
//
//   fn=request  POST {email}  → always the same neutral answer, whatever exists
//   fn=verify   GET  ?token=  → a confirm page (see PREFETCH below)
//   fn=consume  POST {token}  → burns the token, re-issues cookies from Stripe
//
// PREFETCH: mail clients and security scanners follow links in email before a human
// does. A single-use token consumed by a GET is therefore routinely burned in transit,
// and the customer gets "this link has already been used" on their first click. So the
// link lands on a page with a button, and only the POST behind that button consumes
// the token. The page works without JavaScript — the button is a real form submit.
//
// REQUIRES A STORE: this flow refuses to run without Vercel KV / Upstash configured.
// Without it a token cannot be burned (so a link is replayable for its whole lifetime)
// and requests cannot be rate limited (so the endpoint is an email-bombing tool aimed
// at a customer's inbox, which is also how a sending domain's reputation is destroyed).
// Both protections are the reason to trust the link at all, so this fails closed and
// says exactly what is missing rather than degrading quietly.

const {
  paywallActive, stripeRequest, deriveFromStripe, issueEntitlement,
  signToken, verifyToken, storeConfigured, claimOnce, hitRateLimit,
} = require('../lib/entitlement.js');
const { sendMail, mailerConfigured, mailerDiagnostic } = require('../lib/mailer.js');

const LINK_TTL_SECONDS = 15 * 60;      // long enough to walk to another device, short enough to matter
const EMAIL_LIMIT = 3;                 // links per address per window
const IP_LIMIT = 10;                   // links per source address per window
const RATE_WINDOW_SECONDS = 60 * 60;

const DEST = { course: '/learn.html', ideas: '/research.html' };

// ---- configuration ----

function authDiagnostic() {
  if (!paywallActive()) return 'the paywall is not configured (Stripe key, entitlement secret, and at least one price)';
  if (!mailerConfigured()) return mailerDiagnostic();
  if (!storeConfigured()) return 'no KV store configured (KV_REST_API_URL / KV_REST_API_TOKEN), which is required to make links single-use and rate limited';
  // Without an origin the emailed link would be a relative path — unclickable, and
  // discovered only by the customer it was sent to. Treated as unconfigured rather
  // than sent and hoped for.
  if (!linkOrigin()) return 'no link origin available (set PUBLIC_BASE_URL; on Vercel this is normally supplied automatically)';
  return null;
}

const authConfigured = () => authDiagnostic() === null;

// The origin the emailed link points at.
//
// Deliberately NOT taken from the Host header. An attacker can send a request with a
// forged Host, and the victim then receives a genuine, correctly signed link pointing
// at the attacker's domain — the classic host-header injection against password reset.
// Vercel exposes the real deployment host in the environment, so use that, and let an
// operator on a custom domain set PUBLIC_BASE_URL explicitly.
function linkOrigin() {
  const explicit = process.env.PUBLIC_BASE_URL || '';
  if (explicit) return explicit.replace(/\/+$/, '');
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
  return host ? `https://${host}` : '';
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'] || '';
  return String(fwd).split(',')[0].trim() || req.headers['x-real-ip'] || 'unknown';
}

const normaliseEmail = (v) => String(v || '').trim().toLowerCase();

// Deliberately permissive: the address is only ever used as a lookup key and as a
// destination the provider itself will validate. Rejecting unusual but legal
// addresses here would lock out the very people this endpoint exists for.
function looksLikeEmail(v) {
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

// ---- the email ----

function buildEmail(link) {
  const text = [
    'Here is your sign-in link for Scere Training.',
    '',
    link,
    '',
    'The link works once and expires in 15 minutes.',
    '',
    'If you did not ask for this, you can ignore this email — nothing has changed on your account, and no one can use this link without opening it from your inbox.',
  ].join('\n');

  // Kept plain on purpose. Auth mail full of images and tracking pixels is what spam
  // filters are built to catch, and this is the one message that must arrive.
  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#0f172a">',
    '<p>Here is your sign-in link for Scere Training.</p>',
    `<p><a href="${escapeAttr(link)}" style="display:inline-block;padding:12px 20px;background:#0f766e;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold">Restore my access</a></p>`,
    '<p style="color:#475569;font-size:13px">The link works once and expires in 15 minutes.</p>',
    `<p style="color:#475569;font-size:13px">If the button does not work, copy this address into your browser:<br><span style="word-break:break-all">${escapeHtml(link)}</span></p>`,
    '<p style="color:#475569;font-size:13px">If you did not ask for this, you can ignore this email — nothing has changed on your account.</p>',
    '</div>',
  ].join('');

  return { subject: 'Your Scere Training sign-in link', text, html };
}

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const escapeAttr = escapeHtml;

// ---- the confirm page ----
//
// Self-contained: no external stylesheet, no script required. The token rides in a
// hidden field so that consuming it is a POST a person performed, not a GET some
// scanner performed on their behalf.
function confirmPage(token, opts) {
  const o = opts || {};
  const bad = o.error;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex,nofollow">
<title>${bad ? 'Link expired' : 'Restore your access'} · Scere Training</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0f172a; color:#e2e8f0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; padding:24px; }
  .card { max-width:30rem; width:100%; background:#1e293b; border:1px solid #475569; border-radius:16px; padding:32px; }
  .brand { font-size:0.78rem; letter-spacing:0.14em; text-transform:uppercase; color:#5eead4; margin:0 0 14px; font-weight:700; }
  h1 { font-size:1.35rem; margin:0 0 12px; }
  p { color:#94a3b8; line-height:1.6; margin:0 0 16px; font-size:0.95rem; }
  button { font:inherit; font-weight:600; color:#0f172a; background:#2dd4bf; border:0;
           border-radius:10px; padding:12px 22px; cursor:pointer; }
  button:focus-visible { outline:3px solid #facc15; outline-offset:2px; }
  a { color:#5eead4; }
</style>
</head><body>
<main class="card">
<p class="brand">Scere Training</p>
${bad
    ? `<h1>That link no longer works</h1>
<p>${escapeHtml(bad)}</p>
<p><a href="/learn.html">Go to the course</a> and choose “Restore access” to send a fresh link.</p>`
    : `<h1>Restore your access</h1>
<p>Confirm below and we will unlock your purchases on this device. This link works once.</p>
<form method="POST" action="/api/auth?fn=consume">
  <input type="hidden" name="token" value="${escapeAttr(token)}">
  <button type="submit">Restore my access</button>
</form>`}
</main>
</body></html>`;
}

function sendPage(res, status, html) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Frame-Options', 'DENY');
  res.status(status).send(html);
}

// A form POST wants a redirect; fetch() wants JSON. Supporting both is what keeps the
// confirm page working with JavaScript disabled.
function wantsJson(req) {
  const accept = String(req.headers.accept || '');
  const ctype = String(req.headers['content-type'] || '');
  return accept.includes('application/json') || ctype.includes('application/json');
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* fall through to form parsing */ }
    return Object.fromEntries(new URLSearchParams(req.body));
  }
  return {};
}

module.exports = async function handler(req, res) {
  const fn = req.query.fn;

  try {
    // ---- config: lets the client decide what to offer, and tells an operator why not ----
    if (fn === 'config') {
      const reason = authDiagnostic();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ configured: reason === null, reason });
      return;
    }

    // ---- request: email a single-use link, revealing nothing about who exists ----
    if (fn === 'request') {
      if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
      if (!authConfigured()) {
        // Not a neutral answer, because this is not about the visitor: recovery is
        // switched off for everyone, and pretending an email was sent would leave a
        // locked-out customer waiting for mail that is never coming.
        console.error('auth not configured:', authDiagnostic());
        res.status(503).json({ error: 'not_configured' });
        return;
      }

      const email = normaliseEmail(readBody(req).email);
      if (!looksLikeEmail(email)) { res.status(400).json({ error: 'invalid_email' }); return; }

      // Rate limit BEFORE any lookup, so the limits cannot themselves be used to probe
      // which addresses exist. The email counter stops one inbox being flooded; the IP
      // counter stops one source enumerating many addresses.
      const [byEmail, byIp] = await Promise.all([
        hitRateLimit(`magic:rl:e:${email}`, EMAIL_LIMIT, RATE_WINDOW_SECONDS),
        hitRateLimit(`magic:rl:i:${clientIp(req)}`, IP_LIMIT, RATE_WINDOW_SECONDS),
      ]);
      if ((byEmail && !byEmail.allowed) || (byIp && !byIp.allowed)) {
        res.status(429).json({ error: 'rate_limited' });
        return;
      }

      // Everything below runs the same way whether or not this address bought
      // anything, and the response is identical either way. Only the mail send
      // differs, which is a timing difference of a few hundred milliseconds — small
      // against network noise, and stated here rather than pretended away.
      let customer = null;
      try {
        const customers = await stripeRequest('GET', '/v1/customers', { email, limit: 1 });
        customer = (customers && customers.data && customers.data[0]) || null;
      } catch (e) {
        console.error('customer lookup failed:', e.message);
      }

      if (customer) {
        try {
          const derived = await deriveFromStripe(customer.id);
          if (derived.ownsCourse || derived.ideasActive) {
            const jti = require('crypto').randomBytes(16).toString('base64url');
            const token = signToken({
              k: 'login',
              cus: customer.id,
              jti,
              exp: Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS,
            });
            const origin = linkOrigin();
            const link = `${origin}/api/auth?fn=verify&token=${encodeURIComponent(token)}`;
            const mail = buildEmail(link);
            await sendMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html });
          }
        } catch (e) {
          // Logged, not surfaced: telling the caller that sending failed would also
          // tell them the address exists.
          console.error('magic link send failed:', e.message);
        }
      }

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ sent: true });
      return;
    }

    // ---- verify: the page the emailed link opens ----
    if (fn === 'verify') {
      const token = String(req.query.token || '');
      const claims = verifyToken(token);
      const now = Math.floor(Date.now() / 1000);
      if (!claims || claims.k !== 'login' || !claims.cus || !claims.jti || !claims.exp || claims.exp <= now) {
        sendPage(res, 400, confirmPage('', { error: 'Sign-in links expire after 15 minutes and can only be used once.' }));
        return;
      }
      sendPage(res, 200, confirmPage(token));
      return;
    }

    // ---- consume: burn the token and issue the cookies ----
    if (fn === 'consume') {
      if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
      if (!authConfigured()) {
        console.error('auth not configured:', authDiagnostic());
        if (wantsJson(req)) { res.status(503).json({ error: 'not_configured' }); return; }
        sendPage(res, 503, confirmPage('', { error: 'Sign-in links are temporarily unavailable. Please try again shortly.' }));
        return;
      }

      const token = String(readBody(req).token || '');
      const claims = verifyToken(token);
      const now = Math.floor(Date.now() / 1000);
      const fail = (message) => {
        if (wantsJson(req)) { res.status(400).json({ error: 'invalid_token', message }); return; }
        sendPage(res, 400, confirmPage('', { error: message }));
      };

      if (!claims || claims.k !== 'login' || !claims.cus || !claims.jti || !claims.exp || claims.exp <= now) {
        fail('Sign-in links expire after 15 minutes and can only be used once.');
        return;
      }

      // Burn first. Deriving entitlement before claiming would leave a window in which
      // two simultaneous requests both succeed with the same link.
      const claimed = await claimOnce(`magic:used:${claims.jti}`, LINK_TTL_SECONDS + 60);
      if (claimed !== true) {
        fail('That link has already been used. Request a fresh one and it will work.');
        return;
      }

      const derived = await deriveFromStripe(claims.cus);
      if (!derived.ownsCourse && !derived.ideasActive) {
        // Entitlement can disappear between sending the link and following it — a
        // refund, a cancellation. Say so plainly instead of setting empty cookies.
        fail('We could not find an active purchase on that account any more.');
        return;
      }

      issueEntitlement(res, derived, claims.cus);
      const dest = derived.ownsCourse ? DEST.course : DEST.ideas;

      if (wantsJson(req)) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({
          ok: true,
          ownsCourse: derived.ownsCourse,
          ideasActive: derived.ideasActive,
          ideasUntil: derived.ideasUntil,
          redirect: dest,
        });
        return;
      }
      // 303 so the browser follows with GET and a refresh cannot re-post the token.
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Location', `${dest}?restored=1`);
      res.status(303).end();
      return;
    }

    res.status(400).json({ error: 'Unknown or missing fn query parameter' });
  } catch (err) {
    console.error('auth api failed:', err.message);
    // fn=verify and fn=consume are reached by a human following a link from their
    // inbox. Handing them a JSON error object would be the last thing they see.
    if ((fn === 'verify' || fn === 'consume') && !wantsJson(req)) {
      sendPage(res, 502, confirmPage('', { error: 'Something went wrong on our side. Request a fresh link and try again.' }));
      return;
    }
    res.status(502).json({ error: 'auth_error', message: 'Something went wrong. Please try again in a moment.' });
  }
};
