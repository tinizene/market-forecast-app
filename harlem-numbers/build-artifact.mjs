/**
 * Build the single-file version of the app for a host that supplies its own
 * document skeleton (Claude Artifacts): inline game.js, drop the <html>/<head>/
 * <body> wrapper and the head-only meta tags, and lead with the <title>.
 *
 * Usage: node harlem-numbers/build-artifact.mjs [outfile]
 *
 * The app itself is unchanged - this exists so the published page is generated
 * from index.html rather than forked from it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, 'dist-artifact.html');

const html = readFileSync(join(here, 'index.html'), 'utf8');
const game = readFileSync(join(here, 'game.js'), 'utf8');

const style = html.match(/<style>[\s\S]*?<\/style>/)[0];
const body = html.match(/<body>\n([\s\S]*?)\n<\/body>/)[1];

const inlined = body.replace(
  /  <script src="game\.js"><\/script>/,
  ['  <script>', game.trimEnd(), '  </script>'].join('\n')
);

if (inlined.includes('<script src=')) throw new Error('an external script survived inlining');

writeFileSync(out, ['<title>Harlem Numbers</title>', style, inlined, ''].join('\n'));
console.log(`wrote ${out}`);
