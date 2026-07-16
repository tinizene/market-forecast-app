// Vercel Edge Middleware — gates the /reports section behind a single shared
// HTTP Basic Auth username/password, since these are FX Intelligence reports
// meant for a small group of students, not the general public.
//
// This is framework-agnostic Vercel platform middleware (this repo has no
// Next.js/other framework — see the absence of package.json), triggered
// automatically by Vercel because this file exists at the repo root.
//
// SETUP (required, one-time, per Vercel project — see README, this repo has
// more than one Vercel project connected to it as of writing): in the Vercel
// dashboard, go to Project Settings -> Environment Variables and add:
//   REPORTS_PASSWORD = <a password you choose and share with your students>
//   REPORTS_USER     = <optional; defaults to "student" if not set>
// Then redeploy (or just push again — either triggers a fresh deploy that
// picks up the new env vars).
//
// SECURITY NOTE: HTTP Basic Auth is not bank-grade — credentials are base64
// (not encrypted) inside the request header, though HTTPS still protects them
// in transit. This is meant to stop casual/accidental visitors and search
// engines, not a determined attacker. Good enough for sharing a few reports
// with a small group; not appropriate for sensitive financial/account data.
//
// FAILS CLOSED: if REPORTS_PASSWORD isn't set, this blocks access with a
// clear error rather than silently leaving the reports open to the public.

export const config = {
  matcher: ['/reports', '/reports/:path*'],
};

export default function middleware(request) {
  const expectedPassword = process.env.REPORTS_PASSWORD;
  const expectedUser = process.env.REPORTS_USER || 'student';

  if (!expectedPassword) {
    return new Response(
      "Reports access isn't configured yet. Set REPORTS_PASSWORD (and optionally REPORTS_USER) in this Vercel project's Settings -> Environment Variables, then redeploy.",
      { status: 500, headers: { 'content-type': 'text/plain' } }
    );
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(authHeader.slice(6));
    } catch {
      decoded = '';
    }
    const sepIndex = decoded.indexOf(':');
    const user = sepIndex >= 0 ? decoded.slice(0, sepIndex) : '';
    const pass = sepIndex >= 0 ? decoded.slice(sepIndex + 1) : '';

    if (user === expectedUser && pass === expectedPassword) {
      return; // no Response returned -> request continues through normally
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="FX Intelligence Reports"' },
  });
}
