// Course data API — the ONLY way lesson content reaches the browser.
//
//   fn=index            → the whole syllabus as metadata: track, chapter, title,
//                         key idea, and whether each lesson is free. Public, always.
//                         The catalogue stays browsable (and indexable) without
//                         payment; it is the lesson BODIES that are sold.
//   fn=lesson&id=<id>   → one full lesson. Free tracks are open to anyone; paid
//                         tracks require entitlement and return 402 without it.
//
// Content files live in data/course/ (see scripts/build-course-data.js), are shipped
// into the deployment bundle by vercel.json includeFiles, and are blocked from static
// serving by middleware.js. Reading them here is the only route in.

const fs = require('fs');
const path = require('path');
const { checkEntitlement, paywallActive } = require('../lib/entitlement.js');

const COURSE_DIR = path.join(process.cwd(), 'data', 'course');
const TRACK_ORDER = ['foundation', 'crypto', 'forex', 'stocks'];

// The app is to be translatable, so language is a first-class parameter from the
// start rather than a retrofit. A translated track lives at <track>.<lang>.json and
// English (<track>.json) is the fallback for any track not yet translated, which
// means a partial translation degrades per-track instead of failing outright.
const DEFAULT_LANG = 'en';
const LANG_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

const caches = new Map();

// Read once per warm lambda per language: the files are static per deployment, and
// re-reading ~890 KB of JSON on every lesson view would be pure waste.
function loadTracks(lang) {
  const key = lang || DEFAULT_LANG;
  if (caches.has(key)) return caches.get(key);
  const out = [];
  for (const track of TRACK_ORDER) {
    const localised = path.join(COURSE_DIR, `${track}.${key}.json`);
    const fallback = path.join(COURSE_DIR, `${track}.json`);
    const p = key !== DEFAULT_LANG && fs.existsSync(localised) ? localised : fallback;
    if (!fs.existsSync(p)) continue;
    out.push(JSON.parse(fs.readFileSync(p, 'utf8')));
  }
  caches.set(key, out);
  return out;
}

function requestedLang(req) {
  const raw = (req.query && req.query.lang) || '';
  // Reject anything that is not a plain language tag — this value becomes part of a
  // filename, so it must never be able to walk the filesystem.
  return LANG_RE.test(raw) ? raw.toLowerCase() : DEFAULT_LANG;
}

// Public metadata only. Deliberately an allow-list rather than a delete-list, so a
// new field added to a lesson cannot leak into the free catalogue by default.
function toIndex(tracks) {
  const lessons = [];
  for (const t of tracks) {
    t.lessons.forEach((l) => {
      lessons.push({
        track: t.track,
        trackTitle: t.trackTitle,
        trackTagline: t.trackTagline,
        free: !!t.free,
        type: t.type,
        id: l.id,
        chapterNumber: l.chapterNumber != null ? l.chapterNumber : null,
        chapterTitle: l.chapterTitle || null,
        lessonNumber: l.lessonNumber,
        title: l.title,
        keyIdea: l.keyIdea || '',
      });
    });
  }
  return lessons;
}

function findLesson(tracks, id) {
  for (const t of tracks) {
    const l = t.lessons.find((x) => x.id === id);
    if (l) return { track: t, lesson: l };
  }
  return null;
}

module.exports = async function handler(req, res) {
  const fn = (req.query && req.query.fn) || '';
  const lang = requestedLang(req);

  try {
    const tracks = loadTracks(lang);
    if (!tracks.length) {
      res.status(500).json({ error: 'no_content', message: 'Course content is not available in this deployment.' });
      return;
    }

    if (fn === 'index') {
      // Cached publicly: the syllabus is identical for everyone, entitled or not.
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.status(200).json({ lessons: toIndex(tracks), lang, paywallActive: paywallActive() });
      return;
    }

    if (fn === 'lesson') {
      const id = (req.query && req.query.id) || '';
      const hit = findLesson(tracks, id);
      if (!hit) {
        res.status(404).json({ error: 'not_found', message: 'No such lesson.' });
        return;
      }

      const free = !!hit.track.free;
      let entitled = true;
      let active = false;
      if (!free) {
        const check = await checkEntitlement(req, res);
        // Course lessons gate on ownership, which never expires. Deliberately NOT
        // ideasActive: someone whose ideas subscription lapsed still owns the course.
        entitled = check.ownsCourse;
        active = check.paywallActive;
        if (active && !entitled) {
          // Enough for the page to render a useful locked state without the body.
          res.status(402).json({
            error: 'course_required',
            message: 'This lesson is part of the paid course.',
            lesson: {
              id: hit.lesson.id,
              title: hit.lesson.title,
              keyIdea: hit.lesson.keyIdea || '',
              track: hit.track.track,
              trackTitle: hit.track.trackTitle,
              free: false,
            },
          });
          return;
        }
      }

      // Private: an entitled response must never be cached by a shared proxy and
      // served to someone who has not paid.
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
      res.status(200).json({
        lesson: Object.assign({}, hit.lesson, {
          track: hit.track.track,
          trackTitle: hit.track.trackTitle,
          type: hit.track.type,
          free,
        }),
        entitled: free ? true : entitled,
        paywallActive: paywallActive(),
      });
      return;
    }

    res.status(400).json({ error: 'Unknown or missing fn query parameter' });
  } catch (err) {
    console.error('course api failed:', err);
    res.status(500).json({ error: 'server_error', message: 'Could not load course content.' });
  }
};
