'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * The operator console's static files.
 *
 * Read from a fixed list at startup rather than resolved from the request
 * path. There is no way to ask this for a file that is not one of these five,
 * which is the whole of its path-traversal defence: you cannot traverse to a
 * path nobody derives from your input.
 */

const DIRECTORY = path.join(__dirname, '..', 'console');

const FILES = [
  { url: '/console', file: 'index.html', type: 'text/html; charset=utf-8' },
  { url: '/console/console.css', file: 'console.css', type: 'text/css; charset=utf-8' },
  { url: '/console/console.js', file: 'console.js', type: 'text/javascript; charset=utf-8' },
  { url: '/console/console-core.js', file: 'console-core.js', type: 'text/javascript; charset=utf-8' },
  // Linked from the page so the browser stops asking the API for /favicon.ico
  // and logging a 404 an operator would reasonably report as a fault.
  { url: '/console/favicon.svg', file: 'favicon.svg', type: 'image/svg+xml' }
];

/**
 * A content security policy that permits exactly what the console does and
 * nothing else: its own two scripts, its own stylesheet, calls back to its own
 * origin. No inline script, no inline style, no remote anything - which is
 * also why the page carries no `onclick` attributes and no `style=`.
 */
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ');

const SECURITY_HEADERS = {
  'content-security-policy': CSP,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  // The console keeps its token in sessionStorage and sends it as a bearer
  // header. Nothing rides on a cookie, so there is no cross-site request that
  // can act as the operator - but say so out loud rather than by omission.
  'cache-control': 'no-store'
};

/** @returns {Array<{url, type, body}>} read once; the console is not hot-reloaded. */
function consoleFiles() {
  return FILES.map((entry) => ({
    url: entry.url,
    type: entry.type,
    body: fs.readFileSync(path.join(DIRECTORY, entry.file), 'utf8')
  }));
}

module.exports = { consoleFiles, SECURITY_HEADERS, CSP, DIRECTORY };
