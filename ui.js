// Shared UX primitives for Scere Markets — accessible dialogs, live-region
// announcements, busy states, skeletons and offline detection.
//
// Why this file exists: the app was using window.prompt() and window.alert() for the
// two things that matter most commercially — restoring access and reporting a failed
// checkout. Those are unstylable, unlabelled, untranslatable, block the main thread,
// and on mobile Safari can be suppressed entirely, which means a paying customer can
// hit a dead end with no visible reason. Everything here replaces them.
//
// Deliberately zero-dependency and no build step, matching the rest of the repo. The
// modal is the native <dialog> element, which gives focus trapping, Escape-to-close,
// an inert background and focus restoration for free — all things a hand-rolled modal
// gets wrong.
//
// All user-facing text lives in SCERE_UI_STRINGS so a translation layer has one place
// to override, rather than strings baked into markup.

(function () {
  'use strict';

  var STRINGS = {
    close: 'Close',
    cancel: 'Cancel',
    dismiss: 'Dismiss',
    offline: 'You’re offline. Some things won’t load until the connection returns.',
    backOnline: 'Back online.',
    loading: 'Loading…',
    required: 'This field is required.',
    invalidEmail: 'Enter a valid email address, e.g. name@example.com.',
    working: 'Working…',
    skipToContent: 'Skip to main content',
    restoreTitle: 'Restore your access',
    restoreMessage: 'Enter the email address you paid with and we’ll send you a sign-in link.',
    restoreSubmit: 'Email me a link',
    restoreBusy: 'Sending…',
    restoreFieldLabel: 'Email address',
    restoreHint: 'The address on your Stripe receipt.',
    restoreSentTitle: 'Check your email',
    restoreSentMessage: 'If that address has a purchase, a sign-in link is on its way. It works once and expires in 15 minutes.',
    restoreUnavailableTitle: 'Email recovery isn’t switched on yet',
    restoreUnavailableMessage: 'We can’t send sign-in links from this site right now. Please reply to your Stripe receipt and we’ll restore your access by hand.',
    restoreRateLimited: 'That’s several links in a short time. Check your inbox and spam folder — if none arrived, try again in an hour.',
    restoreOffline: 'Couldn’t reach us just now. Check your connection and try again.',
    restoreFailed: 'Something went wrong sending the link. Please try again in a moment.',
  };
  window.SCERE_UI_STRINGS = Object.assign(STRINGS, window.SCERE_UI_STRINGS || {});

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- live-region announcements ------------------------------------------
  // Screen readers get no notification when a region is re-rendered by fetch. One
  // polite region for progress, one assertive for failures — both created once and
  // reused, because a live region added to the DOM at the same moment as its text is
  // frequently missed entirely.

  var politeEl = null;
  var assertiveEl = null;

  function liveRegion(kind) {
    var el = document.createElement('div');
    el.setAttribute('role', kind === 'assertive' ? 'alert' : 'status');
    el.setAttribute('aria-live', kind);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    document.body.appendChild(el);
    return el;
  }

  // Both regions are created at mount, BEFORE any message exists. Creating a live
  // region and filling it in the same tick is the classic way to have the first
  // announcement — usually the most important one, like a payment result — silently
  // dropped, because the region was not being observed when the text arrived.
  function mountLiveRegions() {
    if (!politeEl) politeEl = liveRegion('polite');
    if (!assertiveEl) assertiveEl = liveRegion('assertive');
  }

  function say(message, urgent) {
    if (!document.body) return;
    mountLiveRegions();
    var el = urgent ? assertiveEl : politeEl;
    // Clearing first makes a repeated identical message announce again rather than
    // being treated as "no change".
    el.textContent = '';
    window.setTimeout(function () { el.textContent = message; }, 30);
  }

  // ---- busy state on a control --------------------------------------------
  // A button that silently swaps its own label tells a sighted user something is
  // happening and tells everyone else nothing. This disables it (so the action can't
  // be fired twice — double-charging risk on a checkout button), marks aria-busy, and
  // announces the change.

  function setBusy(btn, label) {
    if (!btn) return function () {};
    var prevHtml = btn.innerHTML;
    var prevDisabled = btn.disabled;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span>' + esc(label || STRINGS.working);
    say(label || STRINGS.working);
    return function restore() {
      btn.innerHTML = prevHtml;
      btn.disabled = prevDisabled;
      btn.removeAttribute('aria-busy');
    };
  }

  // ---- modal dialog --------------------------------------------------------

  var openDialogEl = null;

  function buildDialog(opts) {
    var d = document.createElement('dialog');
    d.className = 'ui-dialog' + (opts.tone ? ' tone-' + opts.tone : '');
    var titleId = 'uidlg-title';
    var descId = 'uidlg-desc';
    d.setAttribute('aria-labelledby', titleId);
    if (opts.message) d.setAttribute('aria-describedby', descId);

    var html = '<form class="ui-dialog-form" novalidate>';
    html += '<h2 class="ui-dialog-title" id="' + titleId + '">' + esc(opts.title) + '</h2>';
    if (opts.message) html += '<p class="ui-dialog-msg" id="' + descId + '">' + esc(opts.message) + '</p>';

    if (opts.field) {
      var f = opts.field;
      html += '<div class="ui-field">';
      html += '<label class="ui-label" for="uidlg-input">' + esc(f.label) + '</label>';
      html += '<input class="ui-input" id="uidlg-input" name="value"' +
        ' type="' + esc(f.type || 'text') + '"' +
        (f.autocomplete ? ' autocomplete="' + esc(f.autocomplete) + '"' : '') +
        (f.inputmode ? ' inputmode="' + esc(f.inputmode) + '"' : '') +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
        ' aria-describedby="' + (f.hint ? 'uidlg-hint ' : '') + 'uidlg-err">';
      if (f.hint) html += '<p class="ui-hint" id="uidlg-hint">' + esc(f.hint) + '</p>';
      // The error node exists from the start and is empty. Injecting it on failure
      // would change what aria-describedby points at mid-interaction, which some
      // screen readers simply do not re-read.
      html += '<p class="ui-error" id="uidlg-err" role="alert"></p>';
      html += '</div>';
    }

    html += '<div class="ui-dialog-actions">';
    html += '<button type="button" class="ui-btn ui-btn-ghost" data-ui-cancel>' + esc(opts.cancelLabel || STRINGS.cancel) + '</button>';
    html += '<button type="submit" class="ui-btn ui-btn-primary">' + esc(opts.submitLabel || 'OK') + '</button>';
    html += '</div></form>';
    d.innerHTML = html;
    return d;
  }

  // Returns a promise resolving to the submitted value, or null if dismissed.
  // onSubmit may return a rejected promise / throw with .message to keep the dialog
  // open and show an inline error — the failure stays attached to the field that
  // caused it instead of replacing the whole dialog with an error screen.
  function openDialog(opts) {
    return new Promise(function (resolve) {
      if (openDialogEl) { try { openDialogEl.close(); } catch (e) {} }
      var restoreFocusTo = document.activeElement;
      var d = buildDialog(opts);
      document.body.appendChild(d);
      openDialogEl = d;

      var form = d.querySelector('form');
      var input = d.querySelector('#uidlg-input');
      var errEl = d.querySelector('#uidlg-err');
      var submitBtn = d.querySelector('button[type=submit]');
      var settled = null;

      function showError(msg) {
        if (!errEl) return;
        errEl.textContent = msg;
        if (input) {
          input.setAttribute('aria-invalid', 'true');
          input.focus();          // put the cursor where the fix has to happen
          try { input.select(); } catch (e) {}
        }
      }

      function clearError() {
        if (errEl) errEl.textContent = '';
        if (input) input.removeAttribute('aria-invalid');
      }

      function finish(value) {
        settled = value;
        try { d.close(); } catch (e) { cleanup(); }
      }

      function cleanup() {
        d.remove();
        if (openDialogEl === d) openDialogEl = null;
        // Native <dialog> restores focus in modern browsers, but not reliably when
        // the dialog is removed from the DOM in the same tick.
        if (restoreFocusTo && document.contains(restoreFocusTo)) {
          try { restoreFocusTo.focus(); } catch (e) {}
        }
        resolve(settled === undefined ? null : settled);
      }

      d.addEventListener('close', cleanup);
      // Escape fires 'cancel'; treat it exactly like pressing Cancel.
      d.addEventListener('cancel', function () { settled = null; });
      d.querySelector('[data-ui-cancel]').addEventListener('click', function () { finish(null); });
      if (input) input.addEventListener('input', clearError);

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var value = input ? input.value.trim() : true;
        if (opts.field && opts.field.required !== false && !value) { showError(STRINGS.required); return; }
        if (opts.field && opts.field.validate) {
          var problem = opts.field.validate(value);
          if (problem) { showError(problem); return; }
        }
        if (!opts.onSubmit) { finish(value); return; }
        clearError();
        var restore = setBusy(submitBtn, opts.busyLabel);
        Promise.resolve()
          .then(function () { return opts.onSubmit(value); })
          .then(function () { restore(); finish(value); })
          .catch(function (err) {
            restore();
            showError((err && err.message) || 'Something went wrong. Please try again.');
          });
      });

      if (typeof d.showModal === 'function') {
        d.showModal();
      } else {
        // No <dialog> support: fall back to a non-modal panel rather than silently
        // doing nothing. Rare, but a dead button is worse than a plain one.
        d.setAttribute('open', '');
        d.classList.add('is-fallback');
      }
      if (input) input.focus();
    });
  }

  // A message with no decision to make still needs a real, focusable, dismissible
  // surface — and needs to be announced, which alert() never is.
  function alertDialog(opts) {
    var d = document.createElement('dialog');
    d.className = 'ui-dialog' + (opts.tone ? ' tone-' + opts.tone : '');
    d.setAttribute('aria-labelledby', 'uidlg-title');
    d.setAttribute('aria-describedby', 'uidlg-desc');
    d.innerHTML =
      '<form method="dialog" class="ui-dialog-form">' +
      '<h2 class="ui-dialog-title" id="uidlg-title">' + esc(opts.title) + '</h2>' +
      '<p class="ui-dialog-msg" id="uidlg-desc">' + esc(opts.message) + '</p>' +
      '<div class="ui-dialog-actions"><button class="ui-btn ui-btn-primary" value="ok">' +
      esc(opts.dismissLabel || STRINGS.dismiss) + '</button></div></form>';

    var restoreFocusTo = document.activeElement;
    document.body.appendChild(d);
    d.addEventListener('close', function () {
      d.remove();
      if (restoreFocusTo && document.contains(restoreFocusTo)) { try { restoreFocusTo.focus(); } catch (e) {} }
    });
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    say(opts.title + '. ' + opts.message, true);
    var btn = d.querySelector('button');
    if (btn) btn.focus();
    return d;
  }

  // ---- skeletons -----------------------------------------------------------
  // Shown while content loads. A skeleton communicates SHAPE — how much is coming and
  // roughly what it looks like — which a spinner cannot, and it prevents the layout
  // shift that a spinner-then-content swap causes.

  function skeleton(rows, kind) {
    var out = '<div class="skeleton-wrap" role="status" aria-live="polite" aria-label="' + esc(STRINGS.loading) + '">';
    for (var i = 0; i < (rows || 3); i++) {
      out += '<div class="skeleton-row' + (kind ? ' skeleton-' + kind : '') + '" aria-hidden="true">' +
        '<span class="skeleton-bar w-40"></span><span class="skeleton-bar w-80"></span></div>';
    }
    return out + '</div>';
  }

  // ---- offline awareness ---------------------------------------------------
  // The service worker means pages still open offline while every API call fails.
  // Without this, that reads as "the app is broken" rather than "you have no signal".

  function mountOfflineBanner() {
    if (document.getElementById('uiOfflineBanner')) return;
    var b = document.createElement('div');
    b.id = 'uiOfflineBanner';
    b.className = 'ui-offline';
    b.setAttribute('role', 'status');
    b.hidden = true;
    b.textContent = STRINGS.offline;
    document.body.appendChild(b);

    function sync(initial) {
      var off = navigator.onLine === false;
      b.hidden = !off;
      if (!initial) say(off ? STRINGS.offline : STRINGS.backOnline, off);
    }
    window.addEventListener('online', function () { sync(false); });
    window.addEventListener('offline', function () { sync(false); });
    sync(true);
  }

  // Focus the heading of a freshly rendered region. Without this, activating a link
  // that re-renders content in place leaves focus on the old element (or on <body>),
  // so a keyboard or screen-reader user has no idea anything changed and has to
  // traverse the whole page again to find it.
  function focusHeading(container) {
    if (!container) return;
    var h = container.querySelector('h1, h2, [data-focus-target]');
    if (!h) return;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    try { h.focus({ preventScroll: false }); } catch (e) { h.focus(); }
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
  }

  // ---- campaign discount codes --------------------------------------------
  // A campaign link arrives as ?code=LAUNCH50. The code is remembered for the visit so
  // it survives the walk from the syllabus into a lesson and on to checkout — someone
  // who clicks an emailed link, reads two free lessons and then buys should still get
  // the discount they were promised. sessionStorage, not localStorage: a discount from
  // a link belongs to that visit, not permanently to that browser.
  var CODE_KEY = 'scere_promo';
  var CODE_RE = /^[A-Za-z0-9_-]{1,64}$/;

  function promoCode() {
    try { return window.sessionStorage.getItem(CODE_KEY) || null; } catch (e) { return null; }
  }

  function captureCode() {
    try {
      var c = (new URLSearchParams(window.location.search).get('code') || '').trim();
      // Storage throws in some private-browsing modes; the code is a nicety, never a
      // requirement, so failing to remember it must not break the page.
      if (c && CODE_RE.test(c)) window.sessionStorage.setItem(CODE_KEY, c);
    } catch (e) { /* ignore */ }
    return promoCode();
  }

  function clearCode() {
    try { window.sessionStorage.removeItem(CODE_KEY); } catch (e) { /* ignore */ }
  }


  // ---- reading preferences -------------------------------------------------
  // Text size and line spacing for the lesson bodies, persisted locally. WCAG 1.4.4
  // asks that text scale to 200%; browser zoom technically satisfies it but scales the
  // whole layout, which on a phone means horizontal scrolling. This scales the prose
  // only, which is what someone reading a 7.5-hour course actually wants.
  var READ_KEY = 'scere_reading_v1';
  var SIZES = { s: 0.94, m: 1, l: 1.14, xl: 1.3 };
  var LEADING = { tight: 1.5, normal: 1.65, loose: 1.85 };

  function readPrefs() {
    try {
      var raw = window.localStorage.getItem(READ_KEY);
      var p = raw ? JSON.parse(raw) : {};
      return { size: SIZES[p.size] ? p.size : 'm', leading: LEADING[p.leading] ? p.leading : 'normal' };
    } catch (e) {
      return { size: 'm', leading: 'normal' };
    }
  }

  function applyPrefs(p) {
    var el = document.documentElement;
    el.style.setProperty('--reading-scale', String(SIZES[p.size]));
    el.style.setProperty('--reading-leading', String(LEADING[p.leading]));
  }

  function savePrefs(p) {
    try { window.localStorage.setItem(READ_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
    applyPrefs(p);
  }

  // Rendered wherever a caller mounts it; returns nothing, wires itself.
  function mountReadingControls(container) {
    if (!container) return;
    var p = readPrefs();
    applyPrefs(p);
    var sizeBtn = function (k, label) {
      return '<button type="button" data-size="' + k + '" aria-pressed="' + (p.size === k) + '"' +
        ' aria-label="Text size ' + label + '">' + label + '</button>';
    };
    var leadBtn = function (k, label) {
      return '<button type="button" data-leading="' + k + '" aria-pressed="' + (p.leading === k) + '"' +
        ' aria-label="Line spacing ' + label + '">' + label + '</button>';
    };
    container.className = 'reading-controls';
    container.innerHTML =
      '<span id="rcTextLabel">Text</span>' +
      '<span class="rc-group" role="group" aria-labelledby="rcTextLabel">' +
        sizeBtn('s', 'S') + sizeBtn('m', 'M') + sizeBtn('l', 'L') + sizeBtn('xl', 'XL') +
      '</span>' +
      '<span id="rcSpaceLabel">Spacing</span>' +
      '<span class="rc-group" role="group" aria-labelledby="rcSpaceLabel">' +
        leadBtn('tight', 'Tight') + leadBtn('normal', 'Normal') + leadBtn('loose', 'Loose') +
      '</span>';

    container.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var group = btn.dataset.size ? 'size' : (btn.dataset.leading ? 'leading' : null);
      if (!group) return;
      p[group] = btn.dataset.size || btn.dataset.leading;
      savePrefs(p);
      // Only the buttons in the same group change state.
      container.querySelectorAll('button[data-' + (group === 'size' ? 'size' : 'leading') + ']').forEach(function (b) {
        b.setAttribute('aria-pressed', String((b.dataset.size || b.dataset.leading) === p[group]));
      });
      say(group === 'size' ? 'Text size ' + btn.textContent : 'Line spacing ' + btn.textContent);
    });
  }

  // ---- access recovery -----------------------------------------------------
  //
  // The highest-stakes interaction in the app: someone has paid, cannot get in, and
  // this is the only way back. It lives here rather than in research.js or learn.js
  // because both pages need it and the copy must not drift between them.
  //
  // The server answers identically whether or not the address has a purchase, so this
  // dialog cannot say "found you" or "no account" — and deliberately does not try.
  // Anything more specific would be a way to ask the site which of your customers'
  // email addresses are real.
  function requestAccessLink() {
    return openDialog({
      title: STRINGS.restoreTitle,
      message: STRINGS.restoreMessage,
      submitLabel: STRINGS.restoreSubmit,
      busyLabel: STRINGS.restoreBusy,
      field: {
        label: STRINGS.restoreFieldLabel,
        type: 'email',
        inputmode: 'email',
        autocomplete: 'email',
        placeholder: 'name@example.com',
        hint: STRINGS.restoreHint,
        validate: function (v) { return isEmail(v) ? null : STRINGS.invalidEmail; },
      },
      // Throwing keeps the dialog open with the message inline, beside the field the
      // person needs to change, rather than closing and leaving them to guess.
      onSubmit: function (email) {
        return fetch('/api/auth?fn=request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email }),
        }).then(function (res) {
          if (res.ok) return;
          if (res.status === 429) throw new Error(STRINGS.restoreRateLimited);
          if (res.status === 503) throw new Error(STRINGS.restoreUnavailableMessage);
          throw new Error(STRINGS.restoreFailed);
        }, function () {
          throw new Error(STRINGS.restoreOffline);
        });
      },
    }).then(function (value) {
      if (!value) return null;   // dismissed
      alertDialog({ title: STRINGS.restoreSentTitle, message: STRINGS.restoreSentMessage });
      say(STRINGS.restoreSentMessage, true);
      return value;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    mountLiveRegions();
    mountOfflineBanner();
    captureCode();
    applyPrefs(readPrefs());
  });

  window.SCERE_UI = {
    say: say,
    setBusy: setBusy,
    openDialog: openDialog,
    alertDialog: alertDialog,
    skeleton: skeleton,
    focusHeading: focusHeading,
    isEmail: isEmail,
    mountReadingControls: mountReadingControls,
    requestAccessLink: requestAccessLink,
    promoCode: promoCode,
    captureCode: captureCode,
    clearCode: clearCode,
    strings: STRINGS,
    escapeHtml: esc,
  };
})();
