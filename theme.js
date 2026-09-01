// ============================================================================
// Theme
// ============================================================================
// Three states, not two: 'light', 'dark', and 'system' (the default), which follows
// the OS and keeps following it if the OS flips while the page is open.
//
// The <html data-theme> attribute is set by a tiny inline script in each page's
// <head>, BEFORE the stylesheet loads — otherwise a light-theme visitor gets a dark
// flash on every navigation. This file is the part that can afford to wait: the
// toggle, the persistence, and keeping <meta name="theme-color"> in step so the
// browser chrome on a phone does not stay dark behind a light page.
//
// Everything here is wrapped against storage throwing. Safari in private mode
// throws on localStorage, and a theme preference must never break a page.
(function () {
  'use strict';

  var KEY = 'scere-theme';
  var ORDER = ['system', 'light', 'dark'];

  function canStore() {
    try {
      window.localStorage.setItem('__t', '1');
      window.localStorage.removeItem('__t');
      return true;
    } catch (e) { return false; }
  }

  function stored() {
    try {
      var v = window.localStorage.getItem(KEY);
      return ORDER.indexOf(v) === -1 ? 'system' : v;
    } catch (e) { return 'system'; }
  }

  function prefersLight() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  }

  function resolve(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return prefersLight() ? 'light' : 'dark';
  }

  function apply(pref) {
    var theme = resolve(pref);
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      // Read the value the stylesheet actually resolved, rather than repeating a hex
      // here that would drift from the palette the moment anyone edits it.
      var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-app');
      if (bg && bg.trim()) meta.setAttribute('content', bg.trim());
    }
    document.dispatchEvent(new CustomEvent('scere:theme', { detail: { preference: pref, theme: theme } }));
  }

  function set(pref) {
    if (ORDER.indexOf(pref) === -1) pref = 'system';
    try { if (canStore()) window.localStorage.setItem(KEY, pref); } catch (e) { /* ignore */ }
    apply(pref);
  }

  function cycle() {
    var next = ORDER[(ORDER.indexOf(stored()) + 1) % ORDER.length];
    set(next);
    return next;
  }

  // A 'system' preference means system, continuously — not "whatever it was at load".
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function () { if (stored() === 'system') apply('system'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  window.SCERE_THEME = {
    get: stored,
    resolved: function () { return resolve(stored()); },
    set: set,
    cycle: cycle,
    apply: function () { apply(stored()); },
    order: ORDER.slice(),
  };

  // The inline head script set the attribute already; this re-runs it so theme-color
  // and the event fire once the stylesheet is definitely parsed.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(stored()); });
  } else {
    apply(stored());
  }
})();
