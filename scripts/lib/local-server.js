// A local stand-in for the Vercel runtime, used by scripts/verify-i18n-browser.js.
//
// It serves the repo statically AND runs the real api/*.js handlers, so the browser
// check exercises the code the deployment actually runs rather than a fixture that can
// quietly drift from it. The handlers are plain (req, res) functions; the only thing
// missing under bare Node is Vercel's res.status()/res.json() sugar and the parsed
// req.query, which is what this adds.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.join(__dirname, '..', '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

function vercelShim(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

async function handle(req, res) {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname.startsWith('/api/')) {
    const name = parsed.pathname.slice('/api/'.length).split('/')[0];
    const file = path.join(ROOT, 'api', `${name}.js`);
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('{}'); return; }
    req.query = parsed.query;
    try {
      await require(file)(req, vercelShim(res));
    } catch (err) {
      console.error(`  api/${name}: ${err.message}`);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'handler_threw', detail: err.message }));
    }
    return;
  }

  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = path.join(ROOT, pathname);
  // Refuse anything that escapes the repo, so a ../ in the URL cannot read the disk.
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
}

function start(port) {
  // The handlers resolve data/ against process.cwd(), exactly as they do on Vercel,
  // so the server has to be running from the repo root for them to find the course.
  process.chdir(ROOT);
  return new Promise((resolve, reject) => {
    const server = http.createServer(handle);
    server.on('error', reject);
    server.listen(port, () => resolve(server));
  });
}

module.exports = { start };
