// The app's colour tokens, for pages that cannot link styles.css.
//
// The FX reports under /reports are standalone documents: they sit behind the
// middleware's basic auth, get shared as links, and have to keep working when saved
// to disk, so they cannot depend on styles.css being fetchable. Before this they
// carried a third palette of their own — cyan and green hard-coded in the renderer —
// which is why they stayed dark-only when the app gained a light theme.
//
// Rather than maintain that palette twice, this reads the real token blocks out of
// styles.css and inlines them. One source of truth, so contrast-audit.js still covers
// every colour a report can paint, and a token edit reaches the reports on the next
// render instead of drifting.

const fs = require('fs');
const path = require('path');

const CSS = path.join(__dirname, '..', '..', 'styles.css');

function blockOf(css, selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([\\s\\S]*?)\\n\\}');
  const m = css.match(re);
  if (!m) throw new Error(`theme-css: no ${selector} block in styles.css`);
  return m[1].replace(/\n\s*\/\*[\s\S]*?\*\//g, '').replace(/\n{2,}/g, '\n');
}

// Both palettes, verbatim, so a report resolves the same colours the app does.
function tokens() {
  const css = fs.readFileSync(CSS, 'utf8');
  return `:root{${blockOf(css, ':root')}}\n`
    + `:root[data-theme="light"]{${blockOf(css, ':root[data-theme="light"]')}}\n`;
}

// The same pre-paint block every page carries. Without it a light-theme reader gets a
// dark flash on each report they open, which is most of the value gone.
const PREPAINT = `<script>(function(){try{var p=window.localStorage.getItem('scere-theme');`
  + `if(p!=='light'&&p!=='dark'){p=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';}`
  + `document.documentElement.setAttribute('data-theme',p);}`
  + `catch(e){document.documentElement.setAttribute('data-theme','dark');}})();</script>`;

module.exports = { tokens, PREPAINT };
