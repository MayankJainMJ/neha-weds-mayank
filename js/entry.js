/* The Entry Moment v2 — "Cherry Blossom Keepsake".
   A physical piece of stationery on the invitation's own watercolour paper:
   layered envelope (body/interior/insert/folds/flap), dusty-rose wax seal
   with embossed monogram + SVG crack, weighted flap, and a SHARED-CARD
   transition: the insert becomes the real invite card via FLIP.
   Sequence target: ~2.8s after tap. Once per browser session
   (sessionStorage), ?entry=1 forces, ?entry=0 skips, reduced-motion skips.
   The personalised illustrated logo is used AS-IS (small, on the flap). */
(function () {
  'use strict';

  var card = document.querySelector('.invite-card');
  if (!card) return;

  /* the envelope greets EVERY visit — only ?entry=0 (tests/deep-links)
     and reduced-motion skip it. If the bootstrap's 4s safety net already
     released the card (entry.js arrived very late), stay skipped rather
     than yanking the visible invite back behind an envelope. */
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var skip = false;
  try {
    if (new URLSearchParams(location.search).get('entry') === '0') skip = true;
    if (window.mwnEnvExpired) skip = true;
  } catch (e) {}

  /* ---------- countdown ---------- */
  function addCountdown() {
    if (document.getElementById('invCount')) return;
    var days = Math.ceil((new Date('2026-12-03T00:00:00+05:30') - Date.now()) / 864e5);
    var p = document.createElement('p');
    p.id = 'invCount';
    p.className = 'inv-count';
    p.textContent = days > 1 ? 'in ' + days + ' days' : days === 1 ? 'tomorrow' : days === 0 ? 'today' : 'just married \u2726';
    var year = document.querySelector('.inv-year');
    if (year) year.insertAdjacentElement('afterend', p);
  }

  function addCardLogo() {
    if (document.querySelector('.card-logo')) return;
    var d = document.createElement('div');
    d.className = 'card-logo';
    d.innerHTML = '<picture><source srcset="img/logo.webp" type="image/webp"><img src="img/logo.png" alt="Neha and Mayank" decoding="async"></picture>';
    card.insertBefore(d, card.firstChild);
  }

  /* ---------- names: handwritten, then kept as a faint gold watermark ---------- */
  function inkNames(run) {
    var names = document.querySelector('.inv-names');
    if (!names || matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.querySelector('.ink-names')) return;
    var ink = document.createElement('div');
    ink.className = 'ink-names';
    ink.innerHTML = '<span class="ink-wipe"><span class="ink-line">Neha &amp; Mayank</span></span>';
    ink.style.position = 'absolute';
    ink.style.left = '0';
    ink.style.right = '0';
    ink.style.top = (names.offsetTop - 4) + 'px';
    names.style.opacity = '0';
    names.parentNode.style.position = 'relative';
    names.parentNode.appendChild(ink);
    setTimeout(function () {
      if (run.dead) return;
      ink.classList.add('ink-keep');            /* lifts + dissolves, one motion */
      names.style.transition = 'opacity .45s ease';
      names.style.opacity = '1';
      setTimeout(function () { ink.remove(); }, 650); /* gone the moment the fade completes */
    }, 900);
  }

  /* ---------- wax seal: two halves + crack ---------- */
  /* custom NM wax-seal monogram — hand-authored serif paths (font-free).
     N sits left + higher; its thick diagonal descends and merges into M's
     first stem (the single controlled overlap). A tiny five-petal sakura
     marks the shared-stem junction. Artwork ~54x50 units in a 100 viewBox.
     This is NOT derived from the illustrated invite logo (separate asset). */
  var MG =
    'M24.7 25 H27.3 V59 H24.7 Z M22.9 25 H29.1 V26.5 H22.9 Z M22.9 57.5 H29.1 V59 H22.9 Z ' + /* N left stem + serifs */
    'M24.9 25 L30.6 25 L50.6 59.8 L44.9 59.8 Z ' +                                             /* N thick diagonal -> M stem */
    'M47.7 33 H50.3 V75 H47.7 Z M45.7 33 H52.3 V34.5 H45.7 Z M45.7 73.5 H52.3 V75 H45.7 Z ' + /* M first stem + serifs */
    'M47.7 33 L53.2 33 L63.6 57.6 L58.6 57.6 Z ' +                                             /* M thick down-diagonal */
    'M59.7 57.6 L62.4 57.6 L75.8 33 L73.1 33 Z ' +                                             /* M hairline up-diagonal */
    'M72.7 33 H75.3 V75 H72.7 Z M70.7 33 H77.3 V34.5 H70.7 Z M70.7 73.5 H77.3 V75 H70.7 Z';   /* M right stem + serifs */

  function junctionBloom() {
    var p = 'M0 -1 C -2.1 -2.2, -2.5 -4.6, 0 -5.6 C 2.5 -4.6, 2.1 -2.2, 0 -1 Z';
    var s = '<g transform="translate(49.2,59)">';
    for (var i = 0; i < 5; i++) {
      s += '<path transform="rotate(' + (i * 72) + ')" d="' + p + '" fill="' + (i % 2 ? '#e4aec2' : '#eec2d0') +
           '" stroke="#c98aa2" stroke-width=".3" stroke-opacity=".5"/>';
    }
    return s + '<circle r="1.5" fill="#b98c28"/></g>';
  }

  /* organic wax: irregular edge, radial depth, soft top-left light,
     bottom-right inner shade — no rings, no button styling */
  function sealSVG() {
    var L = 'M50 3 L46 22 L54 40 L47 60 L52 78 L47 97 C 38 96.5, 29 94, 21 87.5 C 13 81, 7.5 72, 5.5 62 C 3.5 51, 4.5 40, 9 30.5 C 13.5 21, 21 12.5, 31 8 C 37 5.2, 43.5 3.4, 50 3 Z';
    var R = 'M50 3 C 57 2.6, 64.5 4.4, 71.5 8.5 C 80 13.5, 87 21.5, 90.5 31 C 94 40.5, 94.5 51.5, 92 61.5 C 89.5 71.5, 83.5 80.5, 75.5 86.5 C 67.5 92.5, 57.5 96.5, 47 97 L52 78 L47 60 L54 40 L46 22 L50 3 Z';
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="ckwaxg" cx=".42" cy=".38" r=".78">' +
      '<stop offset="0" stop-color="#b26380"/><stop offset=".55" stop-color="#9f526b"/><stop offset="1" stop-color="#86405a"/></radialGradient>' +
      '<filter id="ckwsoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>' +
      '<g class="ck-half ck-half-l"><path class="ck-wax" d="' + L + '"/></g>' +
      '<g class="ck-half ck-half-r"><path class="ck-wax" d="' + R + '"/></g>' +
      '<ellipse cx="38" cy="33" rx="19" ry="13" fill="#ffdac9" opacity=".17" filter="url(#ckwsoft)"/>' +
      '<ellipse cx="63" cy="69" rx="21" ry="15" fill="#4a1d2e" opacity=".18" filter="url(#ckwsoft)"/>' +
      '<g class="ck-mg-sh" transform="translate(1.1,1.3)"><path d="' + MG + '"/></g>' +
      '<g class="ck-mg-hi" transform="translate(-0.9,-1)"><path d="' + MG + '"/></g>' +
      '<g class="ck-mg"><path d="' + MG + '"/></g>' +
      junctionBloom() +
      '<path class="ck-crack" d="M50 3 L46 22 L54 40 L47 60 L52 78 L47 97" fill="none"/>' +
      '<rect class="ck-sweep" x="-40" y="0" width="26" height="100" transform="rotate(18)"/>' +
      '</svg>';
  }

  /* watercolour sakura pieces — same petal geometry as the invitation's
     own clusters (js/sakura.js), rendered static + self-contained (own
     gradient/filter defs, so it matches on the lotus theme too) */
  var SP1 = 'M0 0 C -8.5 -4.5, -10.5 -14.5, -4.5 -20.5 C -2.4 -18.7, 1.8 -19.2, 3.6 -20.1 C 9.6 -15.4, 7.6 -5, 0 0 Z';
  var SP2 = 'M0 0 C -7.6 -5, -7.6 -15.4, -3.6 -20.1 C -1.8 -19.2, 2.4 -18.7, 4.5 -20.5 C 10.5 -14.5, 8.5 -4.5, 0 0 Z';

  function ckDefs() {
    return '<defs>' +
      '<radialGradient id="ckgP" cx=".48" cy=".62" r=".85">' +
      '<stop offset="0" stop-color="#fff8fa"/><stop offset=".32" stop-color="#fff8fa"/><stop offset=".58" stop-color="#f8dce5"/><stop offset="1" stop-color="#e99ab5"/></radialGradient>' +
      '<radialGradient id="ckgD" cx=".48" cy=".62" r=".85">' +
      '<stop offset="0" stop-color="#fdeff3"/><stop offset=".45" stop-color="#f2b9cc"/><stop offset="1" stop-color="#de789d"/></radialGradient>' +
      '<linearGradient id="ckgL" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#87975f"/><stop offset="1" stop-color="#536b3e"/></linearGradient>' +
      '<filter id="ckedge" x="-12%" y="-12%" width="124%" height="124%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="8" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>' +
      '<filter id="ckblush" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
      '</defs>';
  }

  function ckBlossom(x, y, s, deep) {
    var g = deep ? 'ckgD' : 'ckgP';
    var out = '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" filter="url(#ckedge)">';
    for (var i = 0; i < 5; i++) {
      var a = i * 72 + (i % 2 ? 5 : -4);
      var pd = i % 2 ? SP2 : SP1;
      out += '<g transform="rotate(' + a + ') scale(' + (0.94 + (i % 3) * 0.05).toFixed(2) + ')">' +
        '<path d="' + pd + '" fill="url(#' + g + ')"/>' +
        '<path d="' + pd + '" fill="none" stroke="#de789d" stroke-width="1.3" opacity=".22" filter="url(#ckblush)"/>' +
        '<path d="M0 -2 C -1 -8, -1 -13, 0 -17" stroke="#e087a8" stroke-width=".45" fill="none" opacity=".45"/></g>';
    }
    out += '<g>';
    for (var k = 0; k < 9; k++) {
      var th = k / 9 * Math.PI * 2 + .3, r2 = 5.6 + (k % 3) * 1.2;
      var x2 = (Math.cos(th) * r2).toFixed(1), y2 = (Math.sin(th) * r2).toFixed(1);
      out += '<line x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '" stroke="#b67a52" stroke-width=".7"/>' +
             '<circle cx="' + x2 + '" cy="' + y2 + '" r="1.15" fill="' + (k % 4 === 3 ? '#c2454f' : '#d89b28') + '"/>';
    }
    return out + '<circle r="1.9" fill="#f3e2b8"/></g></g>';
  }

  function ckBud(x, y, rot) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(.72)" filter="url(#ckedge)">' +
      '<path transform="rotate(-14)" d="M0 0 C -8.5 -4, -9.5 -15, -2.5 -21 C 2 -17, 3.5 -7, 0 0 Z" fill="#f3b6c9"/>' +
      '<path transform="rotate(14)" d="M0 0 C 8.5 -4, 9.5 -15, 2.5 -21 C -2 -17, -3.5 -7, 0 0 Z" fill="#d96891"/>' +
      '<path d="M0 0 C -6 -5, -6 -16, 0 -21 C 6 -16, 6 -5, 0 0 Z" fill="#eda2bd" opacity=".95"/>' +
      '<g fill="#687c43"><path transform="rotate(-18)" d="M0 1 C -1.8 -2.5, -1.2 -6.5, 0 -9 C 1.2 -6.5, 1.8 -2.5, 0 1 Z"/>' +
      '<path transform="rotate(18)" d="M0 1 C -1.8 -2.5, -1.2 -6.5, 0 -9 C 1.2 -6.5, 1.8 -2.5, 0 1 Z"/>' +
      '<path d="M0 2 C -1.8 -1.5, -1.2 -5.5, 0 -8 C 1.2 -5.5, 1.8 -1.5, 0 2 Z"/></g></g>';
  }

  function ckLeaf(x, y, rot) {
    return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ') scale(.7)">' +
      '<path d="M0 0 C -9 -6, -9 -16, 0 -22 C 9 -16, 9 -6, 0 0 Z" fill="url(#ckgL)" opacity=".85"/>' +
      '<path d="M0 -2 L 0 -19 M 0 -7 L -4 -11 M 0 -7 L 4 -11 M 0 -13 L -3 -16 M 0 -13 L 3 -16" stroke="#667a4b" stroke-width=".55" fill="none" opacity=".8"/></g>';
  }

  function branchSVG() {
    return '<svg viewBox="0 0 220 150" fill="none">' + ckDefs() +
      /* single continuous tapered twig + sub-twigs originating ON the curve */
      '<g filter="url(#ckedge)">' +
      '<path d="M-8 10 C 40 24, 86 52, 132 108 C 140 118, 146 128, 149 140" stroke="#654a38" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M52 32 C 66 25, 80 23, 94 26" stroke="#654a38" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M96 62 C 106 58, 116 58, 124 62" stroke="#654a38" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M-8 10 C 40 24, 86 52, 132 108" stroke="#503728" stroke-width="1" opacity=".45"/>' +
      '</g>' +
      ckLeaf(84, 48, 115) +
      ckBlossom(66, 38, .8, false) +
      ckBlossom(95, 26, .6, true) +
      ckBlossom(121, 86, .72, false) +
      ckBud(146, 126, 150) +
      '</svg>';
  }

  function looseSVG() {
    /* three recognisable drifting petals, lower-right */
    return '<svg width="96" height="72" viewBox="0 0 96 72" fill="none">' +
      '<g transform="translate(22,30) rotate(38) scale(.78)" opacity=".55"><path d="' + SP1 + '" fill="#f0a3bd"/></g>' +
      '<g transform="translate(58,48) rotate(-24) scale(.62)" opacity=".48"><path d="' + SP2 + '" fill="#f6bfd0"/></g>' +
      '<g transform="translate(80,18) rotate(84) scale(.5)" opacity=".36" filter="url(#ckblush)"><path d="' + SP1 + '" fill="#f0b4c7"/></g>' +
      '</svg>';
  }

  function buildOverlay() {
    var ov = document.createElement('div');
    ov.className = 'ck-ov';
    ov.id = 'envOv';
    ov.innerHTML =
      '<div class="ck-vignette" aria-hidden="true"></div>' +
      '<div class="ck-glow" aria-hidden="true"></div>' +
      '<div class="ck-branch" aria-hidden="true">' + branchSVG() + '</div>' +
      '<div class="ck-loose" aria-hidden="true">' + looseSVG() + '</div>' +
      '<div class="ck-head">' +
        '<p class="ck-eyebrow">Together with their families</p>' +
        '<p class="ck-topnames">Neha &nbsp;&middot;&nbsp; Mayank</p>' +
      '</div>' +
      '<div class="ck-scene">' +
        '<div class="ck-env">' +
          '<div class="ck-body"></div>' +
          '<div class="ck-insert"></div>' +
          '<div class="ck-interior"></div>' +
          '<div class="ck-fold ck-fold-l"></div>' +
          '<div class="ck-fold ck-fold-r"></div>' +
          '<div class="ck-fold ck-fold-b"></div>' +
          '<div class="ck-grain"></div>' +
          '<div class="ck-flapcast" aria-hidden="true"></div>' +
          '<div class="ck-flap"><picture><source srcset="img/logo.webp" type="image/webp"><img class="ck-flaplogo" src="img/logo.png" alt=""></picture></div>' +
          '<button type="button" class="ck-seal" aria-label="Open Neha and Mayank\u2019s wedding invitation">' + sealSVG() + '</button>' +
        '</div>' +
      '</div>' +
      '<p class="ck-hint">Tap the seal to open<span class="ck-hintline" aria-hidden="true"></span></p>';
    return ov;
  }

  /* staggered blossom release: upper-left first, sides, lower-right, petals last */
  function releaseBloom(run) {
    var b = document.body;
    b.classList.add('go1');
    setTimeout(function () { if (!run.dead) b.classList.add('go2'); }, 140);
    setTimeout(function () { if (!run.dead) b.classList.add('go3'); }, 280);
    setTimeout(function () { if (!run.dead) b.classList.add('go4'); }, 900);
    setTimeout(function () { if (!run.dead) b.classList.remove('hold-bloom', 'go1', 'go2', 'go3', 'go4'); }, 1600);
  }

  /* card content groups revealed in sequence after the FLIP lands */
  function contentGroups() {
    var sel = [
      ['.inv-script', '.inv-year', '#invCount'],            /* date + countdown */
      ['.inv-rule', '.inv-venue'],                          /* venue */
      ['.inv-note', '.inv-rsvp', '.inv-links']              /* note + actions */
    ];
    return sel.map(function (g) {
      return g.map(function (s) { return card.querySelector(s); }).filter(Boolean);
    });
  }

  /* force-finish: if reduced-motion is switched on mid-entry, the overlay
     would go display:none with the page still locked — release everything.
     run.dead invalidates every timer/rAF queued by this play() run. */
  function bail(mq, onmq, run) {
    run.dead = true;
    try { if (mq.removeEventListener) mq.removeEventListener('change', onmq); else mq.removeListener(onmq); } catch (e) {}
    var o = document.getElementById('envOv');
    if (o) o.remove();
    try { card.getAnimations().forEach(function (a) { a.cancel(); }); } catch (e) {}
    card.style.opacity = '';
    document.body.classList.remove('hold-bloom', 'env-locked', 'ck-flip', 'go1', 'go2', 'go3', 'go4');
    var els = document.querySelectorAll('.ck-g');
    for (var i = 0; i < els.length; i++) els[i].classList.remove('ck-g', 'ckh');
    var names = document.querySelector('.inv-names');
    if (names) { names.style.opacity = ''; names.style.transition = ''; }
    var ink = document.querySelector('.ink-names');
    if (ink) ink.remove();
  }

  function play() {
    /* live check: replay must never build an overlay the reduced-motion CSS hides */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.getElementById('envOv')) return;
    document.body.classList.add('hold-bloom', 'env-locked');
    var run = { dead: false };
    var mq = matchMedia('(prefers-reduced-motion: reduce)');
    var onmq = function (e) { if (e.matches) bail(mq, onmq, run); };
    try { if (mq.addEventListener) mq.addEventListener('change', onmq); else mq.addListener(onmq); } catch (e) {}
    var ov = buildOverlay();
    document.body.appendChild(ov);
    requestAnimationFrame(function () {
      if (run.dead) return;
      ov.classList.add('ck-in');
      /* keyboard users start at the only interactive thing on screen */
      try { ov.querySelector('.ck-seal').focus({ preventScroll: true }); } catch (e) {}
    });

    var opened = false;
    ov.querySelector('.ck-seal').addEventListener('click', function () {
      if (opened) return;
      opened = true;
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}

      var staleInk = document.querySelector('.ink-names');
      if (staleInk) staleInk.remove();                    /* replay: clear last run's watermark */

      ov.classList.add('ck-crack');                       /* 0-220 compress, 180-460 crack+separate */
      setTimeout(function () { if (!run.dead) ov.classList.add('ck-open'); }, 240);   /* flap 240-960, insert rises 540+ */

      var groups = contentGroups();
      /* shared-card FLIP: the insert becomes the real invitation.
         ck-flip (z/visibility swap) must COMMIT a frame before the transform
         animation starts, or the compositor never re-sorts the card above
         the overlay. Hence the double-rAF. */
      setTimeout(function () {
        if (run.dead) return;
        card.style.opacity = '0';                         /* no flash while layers commit */
        document.body.classList.add('ck-flip');           /* card above envelope */
        /* the z drop must COMMIT before ov's own opacity transition begins —
           Chromium freezes layer order once the overlay starts fading */
        ov.style.zIndex = '10';
        /* below the fold of the moment: content arrives in sequence */
        groups.forEach(function (g) { g.forEach(function (el) {
          el.style.animation = 'none';   /* load-time entrance anims would override .ckh */
          el.classList.add('ck-g', 'ckh');
        }); });
        var nm = card.querySelector('.inv-names');
        if (nm) nm.style.opacity = '0';  /* no flash before the ink writes them */
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          if (run.dead) { card.style.opacity = ''; return; }
          ov.classList.add('ck-away');                    /* envelope lowers + fades */
          var insert = ov.querySelector('.ck-insert');
          var first = insert.getBoundingClientRect();     /* read at launch — it is mid-rise */
          var last = card.getBoundingClientRect();
          insert.style.transition = 'none';               /* vanish instantly — the card takes over */
          insert.style.opacity = '0';
          card.style.opacity = '';
          /* UNIFORM scale (no distortion): width-matched; the not-yet-emerged
             lower portion is clipped and released like paper leaving a pocket */
          var s = first.width / last.width;
          var dx = first.left - last.left, dy = first.top - last.top;
          var hid = Math.max(0, (1 - first.height / (last.height * s)) * 100);
          try {
            var fl = card.animate([
              { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', transformOrigin: 'top left' },
              { transform: 'translate(0,0) scale(1)', transformOrigin: 'top left' }
            ], { duration: 800, easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'both' });
            fl.onfinish = function () { fl.cancel(); };   /* lingering transform breaks text painting */
            var cl = card.animate([
              { clipPath: 'inset(0 0 ' + hid.toFixed(2) + '% 0 round 6px)' },
              { clipPath: 'inset(0 0 0% 0 round 6px)' }
            ], { duration: 560, easing: 'cubic-bezier(.3, .4, .2, 1)', fill: 'both' });
            cl.onfinish = function () { cl.cancel(); };
          } catch (e) {}
        }); });
      }, 950);

      setTimeout(function () { if (!run.dead) inkNames(run); }, 1200);
      setTimeout(function () { if (!run.dead) releaseBloom(run); }, 1250);
      /* staggered reveal: date/countdown -> venue -> note/actions */
      [1600, 1750, 1900].forEach(function (t, i) {
        setTimeout(function () {
          if (run.dead) return;
          groups[i].forEach(function (el) { el.classList.remove('ckh'); });
        }, t);
      });
      setTimeout(function () {
        if (run.dead) return;
        try { if (mq.removeEventListener) mq.removeEventListener('change', onmq); else mq.removeListener(onmq); } catch (e) {}
        ov.remove();
        document.body.classList.remove('env-locked', 'ck-flip');
        groups.forEach(function (g) { g.forEach(function (el) { el.classList.remove('ck-g', 'ckh'); }); });
        var names = document.querySelector('.inv-names');
        if (names) {
          /* idempotent: if the ink pass never ran, restore visibility here */
          if (!document.querySelector('.ink-names')) { names.style.opacity = ''; names.style.transition = ''; }
          names.setAttribute('tabindex', '-1');
          names.addEventListener('blur', function () { names.removeAttribute('tabindex'); }, { once: true });
          try { names.focus({ preventScroll: true }); } catch (e) {}
        }
      }, 2450);
    });
  }

  addCardLogo();
  addCountdown();

  /* play SYNCHRONOUSLY — the fonts gate caused the card to flash before
     the envelope. env-locked lands in the same task, then the inline
     bootstrap lock (html.env-boot) hands over without a visible gap. */
  if (!skip && !reduced) play();
  document.documentElement.classList.remove('env-boot');
})();
