// Translation runtime for Scere Training. Zero dependencies, no build step, matching
// the rest of the repo.
//
// THE CENTRAL DESIGN CHOICE: English stays inline in the HTML, and `data-i18n` keys sit
// alongside it rather than replacing it. That means:
//
//   • English costs nothing — no fetch, no swap, and the page is correct before any
//     script runs.
//   • A failed or slow locale fetch degrades to English rather than to empty elements,
//     which is what a key-only approach gives you on a bad connection.
//   • Deleting this file would leave the site working in English, so the translation
//     layer can never be the reason the product is down.
//
// Language resolution, in order: ?lang= in the URL (so a link can be shared in a
// specific language), then the stored preference, then the browser's own languages,
// then English.
//
// Adding a language is a data change: drop i18n/<code>.json in, add it to LANGUAGES,
// and — for lesson bodies — data/course/<track>.<code>.json, which api/course.js
// already serves per its `lang` parameter.

(function () {
  'use strict';

  // Order follows course/Forex_Course_Style_Guide.md section 6. `dir` is declared now
  // so that adding Arabic later is a data change rather than a code change.
  // `available` is what the switcher offers. A language with no i18n/<code>.json yet is
  // declared here but not offered, so shipping one is dropping in the file and flipping
  // this flag — never a half-translated switcher entry that looks broken to the person
  // who picks it.
  var LANGUAGES = [
    { code: 'en', label: 'English', dir: 'ltr', available: true },
    { code: 'fr', label: 'Français', dir: 'ltr', available: true },
    { code: 'pt', label: 'Português', dir: 'ltr', available: false },
    { code: 'sw', label: 'Kiswahili', dir: 'ltr', available: false },
  ];
  var DEFAULT = 'en';
  var STORE_KEY = 'scere_lang';

  var strings = {};          // the active locale; empty for English
  var active = DEFAULT;

  function supported(code) {
    var c = String(code || '').toLowerCase();
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === c) return LANGUAGES[i].available;
    }
    return false;
  }

  function stored() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }

  function remember(code) {
    try { localStorage.setItem(STORE_KEY, code); } catch (e) { /* private mode */ }
  }

  // "fr-CA" and "pt-BR" should both find their base language rather than falling all
  // the way back to English over a region suffix.
  function fromNavigator() {
    var list = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var base = String(list[i]).toLowerCase().split('-')[0];
      if (supported(base)) return base;
    }
    return null;
  }

  function resolve() {
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get('lang');
    } catch (e) { /* very old browser */ }
    if (supported(fromUrl)) return String(fromUrl).toLowerCase();
    if (supported(stored())) return String(stored()).toLowerCase();
    return fromNavigator() || DEFAULT;
  }

  // Interpolates {name} placeholders. Missing keys return the fallback — which for the
  // renderers is the English sentence itself, so a gap in a locale reads as untranslated
  // rather than as a blank or a raw key.
  function t(key, fallback, vars) {
    var out = Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : fallback;
    if (out == null) out = key;
    if (vars) {
      out = String(out).replace(/\{(\w+)\}/g, function (m, name) {
        return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m;
      });
    }
    return out;
  }

  function applyOne(el) {
    if (el.hasAttribute('data-i18n')) {
      var key = el.getAttribute('data-i18n');
      // The element's existing English is the fallback, so a key missing from a locale
      // leaves the sentence readable instead of blanking it.
      if (!el.hasAttribute('data-i18n-src')) el.setAttribute('data-i18n-src', el.textContent);
      var value = t(key, el.getAttribute('data-i18n-src'));
      if (value != null) el.textContent = value;
    }

    // For copy that legitimately contains markup — a bolded phrase mid-sentence, a
    // link. Locale values here are authored by us, never user input.
    if (el.hasAttribute('data-i18n-html')) {
      var hKey = el.getAttribute('data-i18n-html');
      if (!el.hasAttribute('data-i18n-src')) el.setAttribute('data-i18n-src', el.innerHTML);
      var hValue = t(hKey, el.getAttribute('data-i18n-src'));
      if (hValue != null) el.innerHTML = hValue;
    }

    // data-i18n-attr="placeholder:some.key, aria-label:other.key"
    if (el.hasAttribute('data-i18n-attr')) {
      String(el.getAttribute('data-i18n-attr')).split(',').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length !== 2) return;
        var attr = bits[0].trim();
        var aKey = bits[1].trim();
        var aValue = t(aKey, el.getAttribute(attr));
        if (aValue != null) el.setAttribute(attr, aValue);
      });
    }
  }

  function apply(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]')
      .forEach(applyOne);
  }

  // Most of the product surface is not in the HTML at all — learn.js and research.js
  // build it with innerHTML after a fetch. Requiring each renderer to remember a
  // SCERE_I18N.apply(root) call would mean the translation silently stops working at
  // whichever render site someone forgets, and that failure looks like "the French is
  // missing" rather than like a bug. Observing instead makes tagging an element the
  // only thing anyone has to do.
  //
  // Only runs off the default language, so English pays nothing for this.
  var applying = false;
  function observe() {
    if (active === DEFAULT || typeof MutationObserver === 'undefined') return;
    var pending = [];
    var scheduled = false;
    function flush() {
      scheduled = false;
      var batch = pending;
      pending = [];
      // apply() writes textContent, which is itself a childList mutation. Without this
      // guard the observer would answer its own edits forever.
      applying = true;
      try {
        for (var i = 0; i < batch.length; i++) {
          var el = batch[i];
          if (!el.isConnected) continue;
          if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-html')
              || el.hasAttribute('data-i18n-attr')) applyOne(el);
          apply(el);
        }
      } finally { applying = false; }
    }
    new MutationObserver(function (records) {
      if (applying) return;
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) pending.push(added[j]);
        }
      }
      if (pending.length && !scheduled) {
        scheduled = true;
        // One pass per frame rather than one per inserted node: a renderer that appends
        // in a loop would otherwise re-walk its own output on every iteration.
        (window.requestAnimationFrame || window.setTimeout)(flush, 0);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  function meta(code) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === code) return LANGUAGES[i];
    }
    return LANGUAGES[0];
  }

  function applyDocumentLanguage(code) {
    var m = meta(code);
    document.documentElement.setAttribute('lang', m.code);
    document.documentElement.setAttribute('dir', m.dir);
  }

  // English needs no fetch: it is already the text in the document.
  function load(code) {
    if (code === DEFAULT) { strings = {}; return Promise.resolve({}); }
    return fetch('./i18n/' + code + '.json', { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : {}; })
      .catch(function () { return {}; });
  }

  active = resolve();
  applyDocumentLanguage(active);

  var ready = load(active).then(function (data) {
    strings = data || {};
    // ui.js keeps a closure over this object and reads STRINGS.x at call time, so the
    // merge has to MUTATE it rather than assign a fresh one — replacing the global
    // would leave every dialog rendering the English it captured at script-eval time.
    // Mutating also makes the merge order-independent: ui.js may evaluate before or
    // after this promise resolves and the result is the same either way.
    window.SCERE_UI_STRINGS = Object.assign(window.SCERE_UI_STRINGS || {}, strings.ui || {});
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { apply(); observe(); });
    } else {
      apply();
      observe();
    }
    return strings;
  });

  function setLanguage(code) {
    if (!supported(code) || code === active) return;
    remember(code);
    // A full reload rather than a live swap: page scripts have already rendered from
    // the old language, and re-rendering every surface correctly is far more code —
    // and far more places to get it wrong — than simply starting again.
    var url = new URL(window.location.href);
    url.searchParams.set('lang', code);
    window.location.href = url.toString();
  }

  window.SCERE_I18N = {
    t: t,
    apply: apply,
    applyOne: applyOne,
    ready: ready,
    lang: function () { return active; },
    languages: LANGUAGES.filter(function (l) { return l.available; }),
    isDefault: function () { return active === DEFAULT; },
    setLanguage: setLanguage,
    supported: supported,
  };
})();
