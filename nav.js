// Shared top navigation for Scere Training.
// Each page includes <div id="siteNav" data-active="home|learn|research"></div>
// and this script replaces it with a real <nav> landmark, highlighting the active
// section.
// Kept deliberately dependency-free (no build step) to match the rest of the app.
//
// The surface is deliberately three items. Due Diligence and FX Intelligence are
// retired (their routes redirect home) and the manifesto now lives inside the intro
// page as its mission section, so there is nothing else to link to.
(function () {
  var el = document.getElementById('siteNav');
  if (!el) return;
  var active = el.getAttribute('data-active') || '';
  var links = [
    { key: 'home', label: 'Home', href: './index.html' },
    { key: 'learn', label: 'Course', href: './learn.html' },
    { key: 'research', label: 'Ideas', href: './research.html' },
  ];
  var linksHtml = links
    .map(function (l) {
      var cls = 'nav-link' + (l.key === active ? ' is-active' : '');
      var current = l.key === active ? ' aria-current="page"' : '';
      return '<a class="' + cls + '" href="' + l.href + '"' + current + '>' + l.label + '</a>';
    })
    .join('');
  // Offered only when more than one language actually has a locale file — a switcher
  // with a single entry is a control that does nothing. A native <select> rather than a
  // custom menu: it is keyboard operable, screen-reader labelled and usable on a phone
  // without any of that having to be rebuilt here.
  function languageSwitcher() {
    var i18n = window.SCERE_I18N;
    if (!i18n || i18n.languages.length < 2) return '';
    var current = i18n.lang();
    // A preview language is not offered, but if you are reading one the control has to
    // say so — a switcher showing "English" on a Swahili page is worse than no switcher.
    var offered = i18n.languages.slice();
    if (!offered.some(function (l) { return l.code === current; })) {
      var active = i18n.entry && i18n.entry();
      if (active) offered.push(active);
    }
    var options = offered.map(function (l) {
      return '<option value="' + l.code + '"' + (l.code === current ? ' selected' : '') + '>'
        + l.label + '</option>';
    }).join('');
    return '<label class="nav-lang">'
      + '<span class="sr-only" data-i18n="nav.language">Language</span>'
      + '<select class="nav-lang-select">' + options + '</select>'
      + '</label>';
  }

  // A real landmark, not a styled div: it is what lets assistive tech jump straight to
  // navigation, and what makes the skip link's "main content" target meaningful.
  var nav = document.createElement('nav');
  nav.id = el.id;
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'Primary');
  nav.innerHTML =
        // The mark is decorative here: the link already reads "Scere Training", so
    // announcing the logo as well would say the brand twice to a screen reader.
    '<a class="nav-brand" href="./index.html">'
      + '<img class="nav-mark" src="./icons/mark.svg" alt="" width="22" height="22" aria-hidden="true">'
      + '<span>Scere<span class="nav-dot" aria-hidden="true">.</span>Training</span></a>' +
    '<div class="nav-links">' + linksHtml + '</div>' +
    '<span class="nav-spacer"></span>' +
    // The padlock is decoration. Hiding it stops screen readers announcing "locked"
    // ahead of the label, which reads as a warning rather than a way in.
    '<a class="nav-access" href="./research.html"><span aria-hidden="true">🔒</span> <span data-i18n="nav.get-access">Get access</span></a>'
    + languageSwitcher();

  var picker = nav.querySelector('.nav-lang-select');
  if (picker) {
    picker.addEventListener('change', function () {
      window.SCERE_I18N.setLanguage(picker.value);
    });
  }

  el.parentNode.replaceChild(nav, el);
})();
