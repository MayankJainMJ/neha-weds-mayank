/* Page-to-page "paper veil" transitions.
   Exit: theme-tinted wash fades in 180ms, then real navigation.
   Arrival: the destination boots behind its own-coloured veil (raised by the
   inline head snippet before first paint) and fades through in ~250ms.
   Where cross-document View Transitions exist (Chrome 126+/Safari 18.2+) the
   native root dissolve takes over and the manual veil steps aside.
   bfcache-safe via pageshow; never uses beforeunload/unload. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nativeVT = ('onpagereveal' in window);
  var leaving = false;

  function veilFor(url) {
    /* destination-aware wash: game = warm marigold, paper pages = theme wash */
    if (/index\.html(\?|#|$)|\/$/.test(url)) return '#f2debc';
    return '';   /* keep the theme veil set by the head snippet */
  }

  function go(url) {
    if (leaving) return;
    leaving = true;
    try { if (window.MUSIC && MUSIC.stop) MUSIC.stop(); } catch (e) {}
    if (reduced || nativeVT) { location.assign(url); return; }
    var v = veilFor(url);
    if (v) html.style.setProperty('--nav-veil', v);
    html.classList.add('nav-leaving');
    setTimeout(function () { location.assign(url); }, 180);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var tgt = (a.target || '').toLowerCase();
    if (tgt && tgt !== '_self') return;               /* _blank/_top/_parent/named */
    if (a.hasAttribute('download')) return;
    if (!/^https?:$/.test(a.protocol)) return;        /* mailto:, tel:, etc. */
    if (a.origin !== location.origin) return;
    /* same-document fragment jumps stay native */
    if (a.hash && a.pathname === location.pathname && a.search === location.search) return;
    e.preventDefault();
    go(a.href);
  });

  /* arrival: two frames so the veil's opaque state commits, then dissolve */
  function arrive() {
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      html.classList.add('nav-ready');
      setTimeout(function () { html.classList.remove('nav-arriving'); }, 350);
    }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrive);
  else arrive();

  window.addEventListener('pageshow', function (ev) {
    leaving = false;
    html.classList.remove('nav-leaving');
    html.style.removeProperty('--nav-veil');   /* bfcache: drop destination override */
    if (ev.persisted) {           /* bfcache restore: no veils, page is live */
      html.classList.add('nav-ready');
      html.classList.remove('nav-arriving');
    }
  });

  window.MWN_NAV = { go: go };
})();
