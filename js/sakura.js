/* Live cherry-blossom stationery background (theme: bg-sakura).
   Modeled on the reference template: white/blush watercolor card paper,
   sakura clusters (5-petal blossoms, tulip buds, green leaves) on brown
   twigs entering from the corners, petals drifting down.
   Shared blossom layer contract:
     .lotus-bg  — canvas watercolor paper (behind content)
     .lotus-fg  — blooming blossoms + falling petals (above, pointer-events:none)
   Reuses the .petal bloom / .lotus-sway / .drift CSS animations. */
(function () {
  'use strict';
  if (!document.body.classList.contains('bg-sakura')) return;

  /* Blossom Season: perpetual bud->bloom->shed cycle, invite page only.
     MID = arrive mid-season (negative phase delays); envelope entries start
     each blossom at grow(0%) so the go1-go4 release choreography still owns
     the first bloom. Separate RNG seed — paperTexture's stays untouched. */
  var SEASON = !document.body.classList.contains('rsvp-page');
  if (SEASON) document.body.classList.add('blossom-season');
  var MID = false;
  try {
    MID = SEASON && (new URLSearchParams(location.search).get('entry') === '0' ||
                     matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) {}
  var srng = mulberry32(20261203);
  var PERM = (function () {          /* stratified phases: shuffled even slots */
    var p = [];
    for (var i = 0; i < 24; i++) p.push(i);
    for (var j = p.length - 1; j > 0; j--) {
      var k = Math.floor(srng() * (j + 1));
      var t = p[j]; p[j] = p[k]; p[k] = t;
    }
    return p;
  })();
  var bIdx = 0;

  /* sakura petal: rounded obovate with the characteristic tip notch.
     Base at (0,0), tip at (0,-21). */
  var SPETAL = 'M0 0 C -8.5 -4.5, -10.5 -14.5, -4.5 -20.5 C -2.4 -18.7, 1.8 -19.2, 3.6 -20.1 C 9.6 -15.4, 7.6 -5, 0 0 Z';
  var SPETAL2 = 'M0 0 C -7.6 -5, -7.6 -15.4, -3.6 -20.1 C -1.8 -19.2, 2.4 -18.7, 4.5 -20.5 C 10.5 -14.5, 8.5 -4.5, 0 0 Z';

  var DEFS =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<radialGradient id="sgP" cx=".48" cy=".62" r=".85">' +
    '<stop offset="0" stop-color="#fff8fa"/><stop offset=".32" stop-color="#fff8fa"/><stop offset=".58" stop-color="#f8dce5"/><stop offset="1" stop-color="#e99ab5"/></radialGradient>' +
    '<radialGradient id="sgD" cx=".48" cy=".62" r=".85">' +
    '<stop offset="0" stop-color="#fdeff3"/><stop offset=".45" stop-color="#f2b9cc"/><stop offset="1" stop-color="#de789d"/></radialGradient>' +
    '<linearGradient id="sgB" x1="0" y1="1" x2="0" y2="0">' +
    '<stop offset="0" stop-color="#d96891"/><stop offset="1" stop-color="#f3b6c9"/></linearGradient>' +
    '<linearGradient id="sgL" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#87975f"/><stop offset="1" stop-color="#536b3e"/></linearGradient>' +
    '<filter id="sedge" x="-12%" y="-12%" width="124%" height="124%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="8" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/></filter>' +
    '<filter id="sblush" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
    '<filter id="sbr" x="-10%" y="-10%" width="120%" height="120%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="5" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.3"/></filter>' +
    '</defs></svg>';

  /* one open blossom: 5 notched petals + stamens.
     Season mode: per-blossom cycle phase (--cy) + duration (--cdur, 20-26s so
     phases drift apart over minutes), per-petal wind vectors (--dx/--dy/--spin),
     and NO sedge filter on the group (its region clips detach flights). */
  function blossom(size, delay, deep) {
    var g = deep ? 'sgD' : 'sgP';
    var vars = '';
    if (SEASON) {
      var cdur = 20 + srng() * 6;
      var slot = PERM[bIdx++ % PERM.length];
      /* MID: subtract this blossom's --d and use half-slots so the effective
         delay is ALWAYS negative — no late "snap to bud" on ?entry=0 */
      var cy = MID ? -((slot + .5) / PERM.length) * cdur - delay - srng() * 1.5
                   : slot * 0.07 + srng() * 0.2;
      vars = ' style="--cy:' + cy.toFixed(2) + 's;--cdur:' + cdur.toFixed(2) + 's"';
    }
    var s = '<svg class="sak sak-bloom" width="' + size + '" height="' + size + '" viewBox="-26 -26 52 52" aria-hidden="true"' + vars + '><g' + (SEASON ? '' : ' filter="url(#sedge)"') + '>';
    for (var i = 0; i < 5; i++) {
      var a = i * 72 + (i % 2 ? 5 : -4);
      var pd = i % 2 ? SPETAL2 : SPETAL;
      var wind = '';
      if (SEASON) {
        var ar = a * Math.PI / 180;
        wind = ';--dx:' + (Math.sin(ar) * 10 + 24 + srng() * 18).toFixed(1) + 'px' +
               ';--dy:' + (-Math.cos(ar) * 10 + 40 + srng() * 22).toFixed(1) + 'px' +
               ';--spin:' + ((srng() < .5 ? -1 : 1) * (70 + srng() * 80)).toFixed(0) + 'deg' +
               ';--pi:' + (i * 0.09).toFixed(2) + 's'; /* time-typed: old Safari can't multiply number*time */
      }
      s += '<g class="petal" style="--a:' + a + 'deg;--i:' + i + ';--s:' + (0.94 + (i % 3) * 0.05).toFixed(2) + ';--d:' + delay + 's' + wind + '">' +
           '<path d="' + pd + '" fill="url(#' + g + ')"/>' +
           '<path d="' + pd + '" fill="none" stroke="#de789d" stroke-width="1.3" opacity=".22" filter="url(#sblush)"/>' +
           '<path d="M0 -2 C -1 -8, -1 -13, 0 -17" stroke="#e087a8" stroke-width=".45" fill="none" opacity=".45"/>' +
           '</g>';
    }
    /* stamens */
    s += '<g class="lotus-heart" style="--d:' + delay + 's">';
    for (var k = 0; k < 9; k++) {
      var th = k / 9 * Math.PI * 2 + .3;
      var r2 = 5.6 + (k % 3) * 1.2;
      var x2 = Math.cos(th) * r2, y2 = Math.sin(th) * r2;
      s += '<line x1="0" y1="0" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#b67a52" stroke-width=".7"/>' +
           '<circle cx="' + x2.toFixed(1) + '" cy="' + y2.toFixed(1) + '" r="1.15" fill="' + (k % 4 === 3 ? '#c2454f' : '#d89b28') + '"/>';
    }
    s += '<circle r="1.9" fill="#f3e2b8"/></g></g></svg>';
    return s;
  }

  /* tulip-shaped bud — the young generation; keeps its one-time bloom */
  function bud(size, delay) {
    return '<svg class="sak sak-bud" width="' + size + '" height="' + (size * 1.6) + '" viewBox="-12 -25 24 38" aria-hidden="true"><g filter="url(#sedge)">' +
      '<path class="petal" style="--a:-14deg;--i:0;--s:1;--d:' + delay + 's" d="M0 0 C -8.5 -4, -9.5 -15, -2.5 -21 C 2 -17, 3.5 -7, 0 0 Z" fill="url(#sgB)"/>' +
      '<path class="petal" style="--a:14deg;--i:1;--s:1;--d:' + delay + 's" d="M0 0 C 8.5 -4, 9.5 -15, 2.5 -21 C -2 -17, -3.5 -7, 0 0 Z" fill="#d96891"/>' +
      '<path class="petal" style="--a:0deg;--i:2;--s:.92;--d:' + (delay + .15) + 's" d="M0 0 C -6 -5, -6 -16, 0 -21 C 6 -16, 6 -5, 0 0 Z" fill="url(#sgB)" opacity=".95"/>' +
      '<g fill="#687c43">' +
      '<path transform="rotate(-18)" d="M0 1 C -1.8 -2.5, -1.2 -6.5, 0 -9 C 1.2 -6.5, 1.8 -2.5, 0 1 Z"/>' +
      '<path transform="rotate(18)" d="M0 1 C -1.8 -2.5, -1.2 -6.5, 0 -9 C 1.2 -6.5, 1.8 -2.5, 0 1 Z"/>' +
      '<path d="M0 2 C -1.8 -1.5, -1.2 -5.5, 0 -8 C 1.2 -5.5, 1.8 -1.5, 0 2 Z"/>' +
      '</g>' +
      '<path d="M0 2 C 0 6, -1 9, -1 12" stroke="#687c43" stroke-width="1.1" fill="none"/>' +
      '</g></svg>';
  }

  /* green leaf */
  function leaf(size, rot) {
    return '<svg class="sak" width="' + size + '" height="' + size + '" viewBox="-12 -24 24 26" style="transform:rotate(' + rot + 'deg)" aria-hidden="true">' +
      '<path d="M0 0 C -9 -6, -9 -16, 0 -22 C 9 -16, 9 -6, 0 0 Z" fill="url(#sgL)" opacity=".88"/>' +
      '<path d="M0 -2 L 0 -19 M 0 -7 L -4 -11 M 0 -7 L 4 -11 M 0 -13 L -3 -16 M 0 -13 L 3 -16" stroke="#667a4b" stroke-width=".55" fill="none" opacity=".8"/>' +
      '</svg>';
  }

  /* a cluster: twig + mix of blossoms/buds/leaves absolutely placed inside */
  function cluster(kind, delay) {
    /* single continuous main strokes; sub-twigs originate ON the main curve
       and overlap into it, so no joints or gaps are visible */
    var twigTL =
      '<svg class="twig" viewBox="0 0 160 130" aria-hidden="true" fill="none" filter="url(#sbr)">' +
      '<path d="M-6 6 C 28 16, 60 36, 96 84 C 100 90, 102 96, 103 103" stroke="#654a38" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M38 23 C 50 17, 62 15, 74 17" stroke="#654a38" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M74 17 C 80 14, 86 14, 90 16" stroke="#654a38" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M64 42 C 76 38, 88 40, 96 46" stroke="#654a38" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M-6 6 C 28 16, 60 36, 96 84" stroke="#503728" stroke-width="1" opacity=".45"/></svg>';
    var twigB =
      '<svg class="twig" viewBox="0 0 200 110" aria-hidden="true" fill="none" filter="url(#sbr)">' +
      '<path d="M206 98 C 156 86, 112 62, 60 22 C 52 16, 46 11, 41 7" stroke="#654a38" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M150 83 C 139 71, 133 59, 133 48" stroke="#654a38" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M100 53 C 89 45, 81 35, 79 26" stroke="#654a38" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M133 48 C 132 42, 133 37, 136 33" stroke="#654a38" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M206 98 C 156 86, 112 62, 60 22" stroke="#503728" stroke-width="1" opacity=".45"/></svg>';
    var h = '<div class="scluster sc-' + kind + ' lotus-sway ' + (kind === 'tl' ? '' : 's2') + '">';
    if (kind === 'tl') {
      h += twigTL +
        '<div class="sp" style="left:2%;top:-6%">' + blossom(58, delay, false) + '</div>' +
        '<div class="sp" style="left:26%;top:12%">' + blossom(46, delay + .3, true) + '</div>' +
        '<div class="sp" style="left:46%;top:34%">' + blossom(38, delay + .55, false) + '</div>' +
        '<div class="sp" style="left:12%;top:34%">' + bud(22, delay + .7) + '</div>' +
        '<div class="sp" style="left:38%;top:2%">' + bud(18, delay + .85) + '</div>' +
        '<div class="sp" style="left:20%;top:52%">' + leaf(30, 40) + '</div>' +
        '<div class="sp" style="left:52%;top:16%">' + leaf(24, -30) + '</div>' +
        '<div class="sp" style="left:60%;top:40%">' + blossom(34, delay + .75, true) + '</div>' +
        '<div class="sp" style="left:6%;top:14%">' + bud(20, delay + .95) + '</div>';
    } else if (kind === 'br') {
      h += twigB +
        '<div class="sp" style="right:0;top:8%">' + blossom(62, delay, true) + '</div>' +
        '<div class="sp" style="right:24%;top:26%">' + blossom(48, delay + .3, false) + '</div>' +
        '<div class="sp" style="right:44%;top:6%">' + blossom(36, delay + .5, false) + '</div>' +
        '<div class="sp" style="right:14%;top:56%">' + bud(24, delay + .7) + '</div>' +
        '<div class="sp" style="right:36%;top:44%">' + leaf(30, 160) + '</div>' +
        '<div class="sp" style="right:56%;top:24%">' + leaf(24, -140) + '</div>' +
        '<div class="sp" style="right:8%;top:44%">' + blossom(40, delay + .85, false) + '</div>' +
        '<div class="sp" style="right:60%;top:2%">' + blossom(32, delay + 1.0, true) + '</div>' +
        '<div class="sp" style="right:30%;top:60%">' + leaf(22, 120) + '</div>';
    } else if (kind === 'le') { /* left edge column, reference-style cascade */
      h += '<div class="sp" style="left:4%;top:0">' + blossom(40, delay, false) + '</div>' +
        '<div class="sp" style="left:26%;top:13%">' + blossom(30, delay + .25, true) + '</div>' +
        '<div class="sp" style="left:0;top:27%">' + blossom(44, delay + .5, false) + '</div>' +
        '<div class="sp" style="left:30%;top:42%">' + bud(18, delay + .7) + '</div>' +
        '<div class="sp" style="left:8%;top:52%">' + blossom(34, delay + .85, true) + '</div>' +
        '<div class="sp" style="left:24%;top:66%">' + blossom(26, delay + 1.05, false) + '</div>' +
        '<div class="sp" style="left:2%;top:78%">' + bud(16, delay + 1.2) + '</div>' +
        '<div class="sp" style="left:16%;top:90%">' + leaf(20, 30) + '</div>';
    } else if (kind === 'rm') { /* right mid sprig */
      h += '<div class="sp" style="right:0;top:0">' + blossom(36, delay, true) + '</div>' +
        '<div class="sp" style="right:30%;top:38%">' + bud(18, delay + .3) + '</div>' +
        '<div class="sp" style="right:10%;top:64%">' + blossom(28, delay + .55, false) + '</div>';
    } else { /* bl small */
      h += '<div class="sp" style="left:0;top:22%">' + blossom(44, delay, false) + '</div>' +
        '<div class="sp" style="left:34%;top:0">' + bud(20, delay + .4) + '</div>' +
        '<div class="sp" style="left:20%;top:56%">' + leaf(26, 70) + '</div>';
    }
    return h + '</div>';
  }

  /* dense bottom border band: blossoms cropped by the viewport edge */
  function bottomBand(delay) {
    var h = '<div class="sband">';
    var xs = [2, 10, 18, 27, 35, 44, 53, 62, 70, 79, 87, 94];
    xs.forEach(function (x, i) {
      var sz = 34 + ((i * 17) % 26);
      var kind = i % 3;
      var item = kind === 0 ? blossom(sz, delay + i * .18, i % 2 === 0)
        : kind === 1 ? bud(sz * .55, delay + i * .18)
        : leaf(sz * .6, (i * 47) % 360 - 180);
      h += '<div class="sp" style="left:' + x + 'vw;bottom:' + (-(sz * (kind === 0 ? .32 : .2))) + 'px">' + item + '</div>';
    });
    return h + '</div>';
  }

  function driftPetal(i) {
    /* deterministic spread across the whole viewport (the old 6+i*11vw put
       petals 8-14 offscreen) + negative delays so the weather is already
       falling — prepopulated mid-air, released with go4 on envelope entries */
    var left = (2 + srng() * 94).toFixed(1);
    var dl = -(i * 1.9 + srng() * 2).toFixed(1);
    return '<svg class="drift" style="--dl:' + dl + 's;--dur:' + (11 + (i % 5) * 2.6) + 's;left:' + left + 'vw" width="15" height="15" viewBox="-11 -22 22 24"><path d="' + SPETAL + '" fill="' + (i % 2 ? '#f6bfd0' : '#f0a3bd') + '" transform="scale(.62)" opacity=".85"/></svg>';
  }

  /* blush watercolor paper (deterministic canvas, Safari-safe) */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function paperTexture() {
    try {
      var rand = mulberry32(20260307);
      var tiny = document.createElement('canvas'); tiny.width = 120; tiny.height = 240;
      var t = tiny.getContext('2d');
      var gb = t.createLinearGradient(0, 0, 30, 240);
      gb.addColorStop(0, '#fdf6f4'); gb.addColorStop(.5, '#fbeff0'); gb.addColorStop(1, '#f8e7ea');
      t.fillStyle = gb; t.fillRect(0, 0, 120, 240);
      var cols = ['#f6d3da', '#f3c6d2', '#efb9c8', '#f8dee2'];
      function blobf(cx, cy, r, col, a) {
        t.beginPath();
        for (var i = 0; i <= 14; i++) {
          var th = i / 14 * Math.PI * 2;
          var rr = r * (.66 + .5 * rand());
          i ? t.lineTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr * 1.25)
            : t.moveTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr * 1.25);
        }
        t.closePath(); t.globalAlpha = a; t.fillStyle = col; t.fill();
        t.globalAlpha = a * .6; t.lineWidth = 2; t.strokeStyle = col; t.stroke();
        t.globalAlpha = 1;
      }
      for (var i = 0; i < 14; i++) {
        blobf(rand() * 130 - 5, rand() * 240, 14 + rand() * 26, cols[(rand() * cols.length) | 0], .05 + rand() * .07);
      }
      blobf(60, 115, 40, '#fffdfb', .5);
      var c = document.createElement('canvas'); c.width = 480; c.height = 960;
      var x = c.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(tiny, 0, 0, 480, 960);
      var id = x.getImageData(0, 0, 480, 960), d = id.data;
      for (var p = 0; p < d.length; p += 4) {
        var n = (rand() - .5) * 9;
        d[p] += n; d[p + 1] += n * .94; d[p + 2] += n * .96;
      }
      x.putImageData(id, 0, 0);
      return c.toDataURL('image/png');
    } catch (e) { return null; }
  }

  var bg = document.createElement('div');
  bg.className = 'lotus-bg';
  bg.setAttribute('aria-hidden', 'true');
  var tex = paperTexture();
  if (tex) {
    bg.style.backgroundImage = 'url(' + tex + ')';
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
  }
  bg.innerHTML = DEFS;

  var fg = document.createElement('div');
  fg.className = 'lotus-fg';
  fg.setAttribute('aria-hidden', 'true');
  var petals = '';
  for (var i = 0; i < 14; i++) petals += driftPetal(i);
  fg.innerHTML = cluster('tl', .3) + cluster('br', .9) + cluster('le', .7) + cluster('rm', 1.1) + bottomBand(1.2) + petals;

  document.body.insertBefore(bg, document.body.firstChild);
  document.body.appendChild(fg);
})();
