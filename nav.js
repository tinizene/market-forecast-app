// Shared top navigation for Scere Markets.
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
  // A real landmark, not a styled div: it is what lets assistive tech jump straight to
  // navigation, and what makes the skip link's "main content" target meaningful.
  var nav = document.createElement('nav');
  nav.id = el.id;
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'Primary');
  nav.innerHTML =
    '<a class="nav-brand" href="./index.html">Scere<span class="nav-dot" aria-hidden="true">.</span>Markets</a>' +
    '<div class="nav-links">' + linksHtml + '</div>' +
    '<span class="nav-spacer"></span>' +
    // The padlock is decoration. Hiding it stops screen readers announcing "locked"
    // ahead of the label, which reads as a warning rather than a way in.
    '<a class="nav-access" href="./research.html"><span aria-hidden="true">🔒</span> Get access</a>';

  el.parentNode.replaceChild(nav, el);
})();
