// Course progress — which lessons have been read, and where to pick up.
//
// Local only, no account, no server. That is a deliberate choice and not just the
// cheap one: the course has 58 lessons and no sign-in, and asking someone to create an
// account before they can be told "you are 6 lessons in" would cost more people than
// it helps. The trade-off is honest and stated in the UI — progress lives in this
// browser.
//
// Storage is versioned so a future shape change can migrate rather than silently
// discard what someone has read. Every access is guarded: Safari in private mode
// throws on localStorage, and progress is a nicety that must never break the page.

(function () {
  'use strict';

  var KEY = 'scere_progress_v1';
  var supported = (function () {
    try {
      window.localStorage.setItem('__t', '1');
      window.localStorage.removeItem('__t');
      return true;
    } catch (e) {
      return false;
    }
  })();

  function read() {
    if (!supported) return { done: {}, last: null };
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return { done: {}, last: null };
      var parsed = JSON.parse(raw);
      return {
        done: parsed && typeof parsed.done === 'object' && parsed.done ? parsed.done : {},
        last: parsed && parsed.last ? parsed.last : null,
      };
    } catch (e) {
      // Corrupt or foreign data: start clean rather than throw on every page load.
      return { done: {}, last: null };
    }
  }

  function write(state) {
    if (!supported) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* quota or private mode — progress is best-effort */ }
  }

  function isDone(id) {
    return !!read().done[id];
  }

  function setDone(id, done) {
    var s = read();
    if (done) s.done[id] = Date.now();
    else delete s.done[id];
    write(s);
    return !!done;
  }

  function toggle(id) {
    return setDone(id, !isDone(id));
  }

  // Recorded on every lesson view, so "continue where you left off" points at what the
  // reader was actually last looking at rather than at the furthest lesson they ticked.
  function touch(id) {
    var s = read();
    s.last = { id: id, at: Date.now() };
    write(s);
  }

  function lastLesson() {
    var s = read();
    return s.last && s.last.id ? s.last.id : null;
  }

  // Stats over an ordered list of lesson ids.
  function stats(ids) {
    var s = read();
    var total = ids.length;
    var done = 0;
    for (var i = 0; i < total; i++) if (s.done[ids[i]]) done++;
    return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  // The first lesson in order that has not been read. This is what "continue" should
  // target when there is no last-viewed lesson, and what a track page should expand to.
  function nextIncomplete(ids) {
    var s = read();
    for (var i = 0; i < ids.length; i++) if (!s.done[ids[i]]) return ids[i];
    return null;
  }

  function anyProgress() {
    var s = read();
    return !!(s.last || Object.keys(s.done).length);
  }

  function clearAll() {
    if (!supported) return;
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  window.SCERE_PROGRESS = {
    supported: supported,
    isDone: isDone,
    setDone: setDone,
    toggle: toggle,
    touch: touch,
    lastLesson: lastLesson,
    stats: stats,
    nextIncomplete: nextIncomplete,
    anyProgress: anyProgress,
    clearAll: clearAll,
  };
})();
