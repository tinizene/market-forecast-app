// Shared top navigation for Scere Markets.
// Each page includes <div id="siteNav" data-active="home|learn|research"></div>
// and this script fills it with a consistent nav bar, highlighting the active section.
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
  el.className = 'site-nav';
  el.innerHTML =
    '<a class="nav-brand" href="./index.html">Scere<span class="nav-dot">.</span>Markets</a>' +
    '<div class="nav-links">' + linksHtml + '</div>' +
    '<span class="nav-spacer"></span>' +
    '<a class="nav-access" href="./research.html">🔒 Get access</a>';
})();
