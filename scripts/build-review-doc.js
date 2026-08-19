#!/usr/bin/env node
//
// Builds the proofreading document a native speaker actually works from.
//
// The overlay in data/course/i18n/<lang>.json is the right storage format and the wrong
// reading format: it is 4,700 hash-keyed entries in file order. This turns it into one
// self-contained HTML page per track — English and translation side by side, in the
// order a reader meets them, grouped by chapter and lesson.
//
// Three things are surfaced that a reviewer would otherwise have to reverse-engineer:
//
//   • The conventions the translation was written to (_conventions in the overlay).
//     Without these a fluent reviewer will "fix" 40% into "asilimia arobaini" and
//     10:00am into "saa nne", both of which are better Swahili and wrong here.
//   • Every term deliberately left in English, with the reason recorded for it, so the
//     reviewer can disagree with the decision rather than assume it was an oversight.
//   • Which strings carry numbers, money or percentages — the machine gate already
//     verified those, and an edit that changes them will fail it.
//
// The Swahili column is editable in the browser. "Show corrections" collects only the
// cells that changed into a JSON batch that scripts/merge-translation.js consumes
// directly, so a review comes back as a patch rather than as prose in an email.
//
// The output is gitignored on purpose. It is the entire course, both languages, as
// plain static HTML — and this repo deploys statically, so a committed review/ would
// be public. middleware.js already hard-blocks /data/course/* for that reason; this
// is the same content in a friendlier shape. Generate it locally, send the files to
// the reviewer, merge what comes back.
//
// USAGE: node scripts/build-review-doc.js [lang]        (default: sw)
//        writes review/<lang>-index.html and review/<lang>-<track>.html

const fs = require('fs');
const path = require('path');
const { keyOf, walkProse, numbersIn, symbolsIn, TRACKS } = require('./lib/course-i18n');

const ROOT = path.join(__dirname, '..');
const COURSE = path.join(ROOT, 'data', 'course');
const OUT = path.join(ROOT, 'review');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Which field a string came from, in words a reviewer can use. The field name alone
// ("def", "feedbackWrong") means nothing to someone who has not read the schema.
const FIELD_LABEL = {
  title: 'heading',
  keyIdea: 'key idea',
  text: 'body',
  caption: 'diagram caption',
  alt: 'diagram description',
  question: 'quiz question',
  options: 'quiz answer',
  feedbackCorrect: 'quiz feedback (correct)',
  feedbackWrong: 'quiz feedback (wrong)',
  term: 'glossary term',
  def: 'glossary definition',
  chapterTitle: 'chapter title',
  trackTitle: 'track title',
  trackTagline: 'track tagline',
};

function styles() {
  return `
:root {
  --bg: #fbfaf8; --fg: #1a1a1a; --muted: #6b6b6b; --rule: #e2ddd5;
  --card: #ffffff; --accent: #7a5c2e; --warn: #8a5a00; --warn-bg: #fdf6e6;
  --note-bg: #f2f6fb; --note-rule: #c9d8ea;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg);
  font: 16px/1.55 Georgia, 'Times New Roman', serif; }
.wrap { max-width: 1180px; margin: 0 auto; padding: 32px 20px 120px; }
h1 { font-size: 28px; margin: 0 0 4px; }
h2 { font-size: 21px; margin: 40px 0 6px; padding-top: 20px; border-top: 2px solid var(--rule); }
h3 { font-size: 17px; margin: 26px 0 10px; color: var(--accent); }
.sub { color: var(--muted); margin: 0 0 26px; font-size: 15px; }
.note { background: var(--note-bg); border: 1px solid var(--note-rule);
  border-radius: 6px; padding: 16px 20px; margin: 22px 0; font-size: 15px; }
.note h4 { margin: 0 0 8px; font-size: 15px; letter-spacing: .02em; text-transform: uppercase; }
.note ol, .note ul { margin: 8px 0 0; padding-left: 20px; }
.note li { margin: 6px 0; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 0; }
td { vertical-align: top; padding: 10px 12px; border-top: 1px solid var(--rule);
  width: 50%; white-space: pre-wrap; }
tr:hover td { background: var(--card); }
td.sw { border-left: 1px solid var(--rule); }
td.sw:focus { outline: 2px solid var(--accent); outline-offset: -2px; background: #fff; }
tr.edited td.sw { background: #f3fbf3; }
.meta { font: 12px/1.4 ui-monospace, Menlo, Consolas, monospace; color: var(--muted);
  margin-bottom: 4px; display: block; }
.badge { display: inline-block; font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace;
  padding: 1px 6px; border-radius: 3px; margin-left: 6px; }
.badge.num { background: #eef3ee; color: #2f5d3a; }
.badge.keep { background: var(--warn-bg); color: var(--warn); }
.keepwhy { display: block; margin-top: 6px; font-size: 13px; color: var(--warn);
  background: var(--warn-bg); border-left: 3px solid var(--warn); padding: 6px 10px; }
.bar { position: fixed; left: 0; right: 0; bottom: 0; background: var(--card);
  border-top: 1px solid var(--rule); padding: 10px 20px; display: flex; gap: 14px;
  align-items: center; font-size: 14px; box-shadow: 0 -2px 10px rgba(0,0,0,.05); }
button { font: inherit; font-size: 14px; padding: 7px 14px; border: 1px solid var(--accent);
  background: var(--accent); color: #fff; border-radius: 5px; cursor: pointer; }
button.ghost { background: transparent; color: var(--accent); }
#out { width: 100%; height: 240px; margin-top: 12px; display: none;
  font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace; padding: 10px; }
a { color: var(--accent); }
@media (max-width: 760px) { td { display: block; width: 100%; }
  td.sw { border-left: none; border-top: 1px dashed var(--rule); } }
`;
}

function script() {
  return `
const rows = () => Array.from(document.querySelectorAll('td.sw'));
rows().forEach((td) => {
  td.dataset.original = td.textContent;
  td.addEventListener('input', () => {
    const changed = td.textContent !== td.dataset.original;
    td.closest('tr').classList.toggle('edited', changed);
    count();
  });
});
function corrections() {
  const out = {};
  rows().forEach((td) => {
    if (td.textContent !== td.dataset.original) out[td.dataset.key] = td.textContent;
  });
  return out;
}
function count() {
  document.getElementById('n').textContent = Object.keys(corrections()).length;
}
document.getElementById('show').addEventListener('click', () => {
  const box = document.getElementById('out');
  box.style.display = 'block';
  box.value = JSON.stringify(corrections(), null, 2);
  box.select();
});
document.getElementById('copy').addEventListener('click', async () => {
  const text = JSON.stringify(corrections(), null, 2);
  try { await navigator.clipboard.writeText(text); alert('Copied ' + Object.keys(corrections()).length + ' correction(s).'); }
  catch (e) { const box = document.getElementById('out'); box.style.display = 'block'; box.value = text; box.select(); }
});
count();
`;
}

function page({ title, subtitle, body, editable }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${styles()}</style>
</head><body><div class="wrap">
<h1>${esc(title)}</h1>
<p class="sub">${subtitle}</p>
${body}
</div>
${editable ? `<div class="bar">
  <strong><span id="n">0</span></strong> correction(s) marked
  <button id="copy">Copy corrections JSON</button>
  <button id="show" class="ghost">Show corrections JSON</button>
  <span style="color:var(--muted)">Edit the right-hand column directly.</span>
</div>
<div class="wrap" style="padding-top:0"><textarea id="out" readonly></textarea></div>
<script>${script()}</script>` : ''}
</body></html>
`;
}

function conventionsBlock(conventions, note) {
  return `<div class="note">
<h4>Read this first</h4>
<p>${esc(note)}</p>
<p><strong>The translation was written to these conventions.</strong> Several of them
produce Swahili that a fluent reader would improve — and the improvement would be wrong
here. Please change them only deliberately:</p>
<ol>${conventions.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
<p><strong>Rows marked <span class="badge num">figures</span></strong> contain numbers,
currency or percent markers. A machine gate already checks that none were dropped or
altered, and it runs on every change — so an edit that rewrites <code>40%</code> as
<em>asilimia arobaini</em> will be rejected rather than silently shipped.</p>
<p><strong>Rows marked <span class="badge keep">kept in English</span></strong> were left
untranslated on purpose, with the reason shown beneath. Disagree freely: the reason is
recorded so the decision can be argued with rather than guessed at.</p>
</div>`;
}

function main() {
  const lang = process.argv[2] || 'sw';
  const overlayPath = path.join(COURSE, 'i18n', `${lang}.json`);
  const raw = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
  const strings = raw.strings || {};
  const keepAsIs = raw.keepAsIs || {};
  const conventions = raw._conventions || [];
  const note = raw._note || '';

  fs.mkdirSync(OUT, { recursive: true });

  const seen = new Set();
  const index = [];

  for (const track of TRACKS) {
    const payload = JSON.parse(fs.readFileSync(path.join(COURSE, `${track}.json`), 'utf8'));
    const sections = [];
    let rows = 0;
    let kept = 0;

    // One collector per lesson, so a reviewer reads a lesson end to end rather than a
    // flat list. Strings already met earlier are skipped — they are translated once.
    const collect = (node, heading) => {
      const items = [];
      walkProse(node, (s, field) => {
        const key = keyOf(s);
        if (seen.has(key)) return;
        seen.add(key);
        items.push({ key, en: s, field });
      });
      if (!items.length) return;
      const body = items.map((it) => {
        const entry = strings[it.key];
        const sw = entry && entry[lang] ? entry[lang] : '';
        const why = keepAsIs[it.key];
        const figures = numbersIn(it.en).length || symbolsIn(it.en);
        if (why) kept++;
        rows++;
        return `<tr><td><span class="meta">${esc(FIELD_LABEL[it.field] || it.field)} · ${it.key}` +
          `${figures ? '</span><span class="badge num">figures</span>' : '</span>'}` +
          `${why ? '<span class="badge keep">kept in English</span>' : ''}` +
          `${esc(it.en)}${why ? `<span class="keepwhy">${esc(why)}</span>` : ''}</td>` +
          `<td class="sw" contenteditable="true" spellcheck="false" data-key="${it.key}">${esc(sw)}</td></tr>`;
      }).join('\n');
      sections.push(`<h3>${esc(heading)}</h3>\n<table>${body}</table>`);
    };

    collect({ trackTitle: payload.trackTitle, trackTagline: payload.trackTagline }, 'Track heading');

    let chapter = null;
    for (const lesson of payload.lessons) {
      if (lesson.chapterTitle && lesson.chapterTitle !== chapter) {
        chapter = lesson.chapterTitle;
        sections.push(`<h2>${esc(chapter)}</h2>`);
      }
      collect(lesson, `Lesson ${lesson.lessonNumber || ''}: ${lesson.title}`.replace(/^Lesson : /, ''));
    }

    const title = `${payload.trackTitle} — Swahili review`;
    const file = `${lang}-${track}.html`;
    fs.writeFileSync(path.join(OUT, file), page({
      title,
      subtitle: `${rows} strings across ${payload.lessons.length} lessons. English left, ${lang} right. ` +
        `A sentence the course reuses is reviewed once, in the track where it first appears, ` +
        `so a lesson here may skip a line you have already read elsewhere.`,
      body: conventionsBlock(conventions, note) + sections.join('\n'),
      editable: true,
    }));
    index.push({ track, file, title: payload.trackTitle, rows, lessons: payload.lessons.length, kept });
    console.log(`  ${file.padEnd(22)} ${String(rows).padStart(5)} strings  ${payload.lessons.length} lessons`);
  }

  const keepRows = Object.entries(keepAsIs).map(([key, why]) => {
    const entry = strings[key];
    return `<tr><td><span class="meta">${key}</span>${esc(entry ? entry.en : '(orphaned)')}</td>` +
      `<td>${esc(why)}</td></tr>`;
  }).join('\n');

  fs.writeFileSync(path.join(OUT, `${lang}-index.html`), page({
    title: 'Scere Training — Swahili course review',
    subtitle: `${[...seen].length} unique strings across ${index.length} tracks.`,
    body: conventionsBlock(conventions, note) +
      '<h2>Tracks</h2><table>' + index.map((t) =>
        `<tr><td><a href="${t.file}">${esc(t.title)}</a></td>` +
        `<td>${t.rows} strings · ${t.lessons} lessons · ${t.kept} kept in English</td></tr>`).join('') + '</table>' +
      `<h2>Terms deliberately kept in English</h2>
<p class="sub">${Object.keys(keepAsIs).length} decisions, each with the reason for it.
These are the ones most worth arguing with.</p>
<table>${keepRows}</table>`,
    editable: false,
  }));
  console.log(`  ${lang}-index.html         ${[...seen].length} strings total`);
}

main();
