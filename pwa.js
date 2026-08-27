// Service worker registration, shared by every live page.
//
// This used to be an inline snippet in index.html alone, which meant anyone
// arriving straight at a lesson - a shared link, a bookmark, a search result -
// never registered the worker and got no offline support at all. Registration
// belongs on every page a student can land on, so it lives in one file that
// each page loads.
//
// Registering the same script URL twice is a no-op in the browser, so pages
// that get here more than once cost nothing.
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    // Offline support is best-effort: a failed registration must never surface
    // to a student who is simply reading a lesson.
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
})();
