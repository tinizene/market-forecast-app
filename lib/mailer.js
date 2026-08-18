// Transactional email, over plain fetch. Zero npm dependencies, like the rest of
// this repo — Stripe is called this way too (see lib/entitlement.js).
//
// WHY TWO PROVIDERS: ROADMAP.md listed picking one (Resend / Postmark / SES) as a
// decision that blocked this feature. It does not have to. Both Resend and Postmark
// send with a single JSON POST and an API-key header, so supporting both costs about
// thirty lines and removes the blocker entirely: set whichever key you have and the
// mailer uses it. If both are set, Postmark wins — it is the one chosen for
// deliverability, so having it configured is a deliberate act.
//
// SES is deliberately not supported here. It needs SigV4 request signing, which is a
// meaningful amount of crypto code for no benefit at this volume; if it is ever
// wanted, it belongs behind this same send() interface.
//
// SENDING ADDRESS: use a dedicated transactional address (login@your-domain) with
// Reply-To pointing at a real monitored inbox. Never send auth mail from an address
// that also sends anything promotional — one spam complaint against that address puts
// LOGIN mail in the spam folder, which locks paying customers out of what they bought.

const PROVIDERS = {
  postmark: {
    envKey: 'POSTMARK_API_TOKEN',
    url: 'https://api.postmarkapp.com/email',
    headers: (key) => ({
      'X-Postmark-Server-Token': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: (m) => JSON.stringify({
      From: m.from,
      To: m.to,
      Subject: m.subject,
      TextBody: m.text,
      HtmlBody: m.html,
      ReplyTo: m.replyTo || undefined,
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || 'outbound',
    }),
  },
  resend: {
    envKey: 'RESEND_API_KEY',
    url: 'https://api.resend.com/emails',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    body: (m) => JSON.stringify({
      from: m.from,
      to: [m.to],
      subject: m.subject,
      text: m.text,
      html: m.html,
      reply_to: m.replyTo || undefined,
    }),
  },
};

// Tests point this at a local stub. Never set in production.
function baseUrlOverride() {
  return process.env.MAIL_API_BASE || '';
}

function chosenProvider() {
  for (const name of ['postmark', 'resend']) {
    if (process.env[PROVIDERS[name].envKey]) return name;
  }
  return null;
}

function fromAddress() {
  return process.env.AUTH_EMAIL_FROM || '';
}

// Configured means: a provider key AND a From address. A provider with no verified
// sender is not a working mailer, and discovering that at the moment a locked-out
// customer asks for a link is the worst possible time.
function mailerConfigured() {
  return Boolean(chosenProvider() && fromAddress());
}

// Names what is missing rather than just saying "not configured", so the operator can
// act on it without reading this file.
function mailerDiagnostic() {
  if (!chosenProvider()) return 'no email provider key set (POSTMARK_API_TOKEN or RESEND_API_KEY)';
  if (!fromAddress()) return 'AUTH_EMAIL_FROM is not set';
  return null;
}

async function sendMail(message) {
  const name = chosenProvider();
  if (!name) throw new Error('mailer_not_configured');
  if (!fromAddress()) throw new Error('mailer_missing_from');
  const p = PROVIDERS[name];
  const key = process.env[p.envKey];
  const url = baseUrlOverride() ? `${baseUrlOverride()}/${name}` : p.url;

  const res = await fetch(url, {
    method: 'POST',
    headers: p.headers(key),
    body: p.body({
      from: fromAddress(),
      replyTo: process.env.AUTH_EMAIL_REPLY_TO || '',
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`mail_${res.status}`);
    err.statusCode = res.status;
    // Truncated: provider errors can echo the whole payload back, and this string
    // ends up in logs.
    err.detail = detail.slice(0, 300);
    throw err;
  }
  return { provider: name };
}

module.exports = { sendMail, mailerConfigured, mailerDiagnostic, chosenProvider };
