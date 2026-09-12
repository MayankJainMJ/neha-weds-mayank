/* Road to Pawna — three-act auto-runner. One input: tap/Space = jump.
   Act 1 (him): Mumbai grind → boards BOM ✈ JAPAN.
   Act 2 (her): Calgary — snow, clocks, gates → boards YYC ✈ JAPAN.
   Act 3 (both): two flights land in Japan; they run TOGETHER (one tap, both
   jump) past the ring studio and Lake Kawaguchiko to a MANDAP ON A HILL.
   "It's not game over. It's game start."
   Fixed-timestep physics, rAF render, AABB. No lives, no game-over: obstacles
   cost 2 hearts (Sonic rule) and the journey always continues. levels.js/music.js. */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  var W = 320, H = 480, GROUND = 400;
  var GRAVITY = 1500, JUMP_V = -560, STEP = 1 / 60;
  var PLAYER_X = 56, PW = 18, PH = 26;
  var HIT = {
    chair:     { w: 24, h: 30 },
    excel:     { w: 30, h: 14 },
    door:      { w: 16, h: 46 },
    snowdrift: { w: 26, h: 16 },
    clock:     { w: 20, h: 26 },
    gate:      { w: 16, h: 46 },
    laddoo:    { w: 14, h: 14 },
    heartc:    { w: 14, h: 14 },
    puddle:    { w: 30, h: 8 },
    blackice:  { w: 56, h: 4 },
    cart:      { w: 26, h: 26 },
    token:     { w: 16, h: 16 },
    ring:      { w: 14, h: 14 }
  };

  /* ---------- dom ---------- */
  var gameEl = document.getElementById('game');
  var canvas = document.getElementById('gc');
  var ctx = canvas.getContext('2d');
  var hudLives = document.getElementById('hudLives');
  var hudScore = document.getElementById('hudScore');
  var hudMute = document.getElementById('hudMute');
  var overlay = document.getElementById('gameOverlay');
  var toast = document.getElementById('toast');

  /* ---------- state ---------- */
  var mode = 'idle'; // idle|chapter|run|boarding|landing|over|finale|clear|paused
  var actIdx = 0, act = null, items = [], taunts = [];
  var camX = 0, player = null, lives = 3;
  var laddoos = 0, sessionTokens = 0, ringGot = false; // persist across acts in a run
  var runTime = 0, acc = 0, lastT = 0, rafId = 0;
  var invincibleUntil = 0, scenery = [], clouds = [], flakes = [];
  var finaleT = 0, coupleX = 0, heartsFx = [];
  var monster = null, monsterDone = false, shots = [], monstersKilled = 0;
  var platforms = [], blocks = [], enemiesArr = [], drops = [];
  var support = null, icicles = [], onIce = false, climbMusic = false, petalsFx = [], lastScore = 0;
  var shootBtn = document.getElementById('shootBtn');
  var store = window.MWN.load();

  /* ---------- canvas scale ---------- */
  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / W, vh / H);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  canvas.width = W; canvas.height = H;
  window.addEventListener('resize', fit);

  /* ---------- ui helpers ---------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  function overlayHTML(lines, buttons, noSkip) {
    var h = '<div class="pixel-dialog">';
    h += '<p>' + lines.join('<br>') + '</p>';
    buttons.forEach(function (b) {
      h += '<button class="btn ' + (b.ghost ? 'btn-ghost" style="color:#2b2118"' : 'btn-primary"') + ' data-a="' + b.a + '">' + b.label + '</button>';
    });
    if (!noSkip) h += '<a class="skip-link" style="display:block;margin-top:1rem" href="./">Skip to the invitation \u2192</a>';
    h += '</div>';
    overlay.innerHTML = h;
    overlay.style.display = 'flex';
  }
  function hideOverlay() { overlay.style.display = 'none'; }

  overlay.addEventListener('click', function (e) {
    window.MUSIC.unlock();
    var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
    if (!a && mode === 'chapter') { startAct(); return; } // tap anywhere to GO
    if (!a) return;
    if (a === 'run') startAct();
    if (a === 'next') loadAct(actIdx + 1);
    if (a === 'continue') { loadAct(actIdx); startAct(); } // full act rebuild — no stale enemies/icicles
    if (a === 'replay') beginRun();
    if (a === 'resume') { mode = 'run'; hideOverlay(); lastT = 0; }
    if (a === 'goinvite') (window.MWN_NAV ? window.MWN_NAV.go : function (u) { location.href = u; })('./');
    if (a === 'gorsvp') (window.MWN_NAV ? window.MWN_NAV.go : function (u) { location.href = u; })('./?entry=0#rsvp');
    if (a === 'share') {
      var url = 'https://mayankjainmj.github.io/neha-weds-mayank/';
      var txt = (store.name ? store.name + ' scored ' : 'I scored ') + lastScore +
        ' on Neha \u2665 Mayank\u2019s wedding invite game \u2014 beat that: ' + url;
      if (navigator.share) {
        navigator.share({ title: 'Neha \u2665 Mayank', text: txt }).catch(function () {});
      } else {
        window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
      }
    }
  });

  if (hudMute) {
    hudMute.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      hudMute.textContent = window.MUSIC.toggleMute() ? '\u{1F507}' : '\u{1F50A}';
    });
  }

  function score(final) {
    return Math.min(9999,
      laddoos * 10 +
      sessionTokens * 100 +
      monstersKilled * 200 +
      (ringGot ? 150 : 0) +
      (final ? Math.max(0, 300 - Math.floor(runTime) * 4) : 0));
  }

  function hud() {
    hudLives.innerHTML = '<span style="color:#ffd23f">\u2665</span> ' + store.hearts;
    hudScore.innerHTML = act.name.split(' \u2014 ')[0] + (ringGot ? ' \u25CB' : '') + (sessionTokens ? ' \u2726' : '');
  }

  function resetPlayer() {
    player = { y: GROUND - PH, vy: 0, onGround: true, frame: 0 };
  }

  /* ---------- flow ---------- */
  function loadAct(i) {
    actIdx = i;
    act = window.LEVELS[window.LEVELS.acts[i]];
    items = act.items.map(function (it) { return { t: it.t, x: it.x, dy: it.dy || 0, hit: false }; });
    taunts = act.taunts;
    camX = 0; lives = 3; invincibleUntil = 0;
    finaleT = 0; heartsFx = [];
    monster = null; monsterDone = false; shots = [];
    if (shootBtn) shootBtn.hidden = true;
    platforms = (act.platforms || []).map(function (p) {
      return { x: p.x, y: p.y, baseY: p.y, w: p.w, kind: p.kind,
               move: p.move ? { dy: p.move.dy, speed: p.move.speed, phase: Math.random() * 6 } : null };
    });
    blocks = (act.blocks || []).map(function (b) { return { x: b.x, y: b.y, drop: b.drop, hit: false, hitFx: 0 }; });
    enemiesArr = (act.enemies || []).map(function (e) { return { x: e.x, baseX: e.x, kind: e.kind, t: Math.random() * 6, dead: false, deadT: 0 }; });
    drops = [];
    icicles = (act.icicles || []).map(function (ic) { return { x: ic.x, y: 150, vy: 0, state: 'hang', t: 0 }; });
    support = null; onIce = false; climbMusic = false; petalsFx = [];
    resetPlayer();
    buildScenery();
    mode = 'chapter';
    overlayHTML(act.chapter.concat(['', 'TAP ANYWHERE = JUMP \u2191', 'GRAB \u2665 \u00B7 DODGE THE REST']), [{ a: 'run', label: '\u25B6 GO' }]);
    hud();
  }

  function startAct() {
    hideOverlay();
    window.MUSIC.start(act.music);
    mode = 'run';
    lastT = 0;
  }

  function beginRun() {
    store = window.MWN.load(); // re-sync — splash dialog may have just saved the name
    laddoos = 0; sessionTokens = 0; ringGot = false; runTime = 0;
    monstersKilled = 0;
    store.plays += 1; window.MWN.save(store);
    gameEl.hidden = false;
    document.getElementById('splash').style.display = 'none';
    fit();
    loadAct(0);
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  function takeHit() {
    // Sonic rule, wedding edition: obstacles cost hearts, never the journey.
    store.hearts = Math.max(0, store.hearts - 2);
    window.MWN.save(store);
    window.MUSIC.sfx('hit');
    invincibleUntil = runTime + 1.2;
    hud();
  }

  function showActClear() {
    mode = 'clear';
    window.MUSIC.sfx('clear');
    overlayHTML(act.clearLine, [{ a: 'next', label: act.nextLabel }]);
  }

  function finishGame() {
    mode = 'clear';
    window.MUSIC.sfx('clear');
    var sc = score(true);
    if (sc > store.bestScore) store.bestScore = sc;
    store.unlocked = true;
    window.MWN.save(store);
    // device-local leaderboard: upsert this player's best
    var pname = (store.name || 'PLAYER 1').toUpperCase();
    var found = false;
    store.scores.forEach(function (e) {
      if (e.n.toUpperCase() === pname) { found = true; if (sc > e.s) e.s = sc; }
    });
    if (!found) store.scores.push({ n: store.name || 'PLAYER 1', s: sc });
    store.scores.sort(function (a, b) { return b.s - a.s; });
    store.scores = store.scores.slice(0, 5);
    window.MWN.save(store);
    lastScore = sc;
    if (window.CLOUD) window.CLOUD.schedulePush();
    var lines = act.clearLine.concat([
      '', (store.name ? store.name.toUpperCase() + ' \u00B7 ' : '') + 'SCORE ' + sc
    ]);
    overlayHTML(lines, [
      { a: 'goinvite', label: 'OPEN YOUR INVITATION \u2192' },
      { a: 'share', label: 'SHARE THE INVITE', ghost: true }
    ], true);
  }

  /* ---------- input ---------- */
  function jump() {
    if (mode === 'chapter') { startAct(); return; }
    if (mode !== 'run') return;
    if (player.onGround) {
      if (onIce) return; // sliding on black ice — jump suppressed until clear
      support = null;
      player.vy = JUMP_V * ((act.physics && act.physics.jumpScale) || 1);
      player.onGround = false;
      window.MUSIC.sfx('jump');
    }
  }
  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    window.MUSIC.unlock();
    if (mode === 'monster') shoot(); else jump();
  });
  if (shootBtn) {
    shootBtn.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); e.preventDefault();
      shoot();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (!gameEl.hidden) { e.preventDefault(); if (mode === 'monster') shoot(); else jump(); }
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && mode === 'run') {
      mode = 'paused';
      window.MUSIC.stop();
      overlayHTML(['PAUSED'], [{ a: 'resume', label: '\u25B6 RESUME' }]);
    }
  });

  /* ---------- physics ---------- */
  function update(dt) {
    camX += act.speed * dt;
    runTime += dt;
    player.frame += dt * 10;

    // moving platforms bob; carried player follows his support
    platforms.forEach(function (p) {
      if (p.move) p.y = p.baseY + Math.sin(runTime * p.move.speed + p.move.phase) * p.move.dy;
    });
    if (player.onGround && support && support !== 'ground') {
      player.y = support.y - PH;
    }
    var prevY = player.y;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    var worldX = camX + PLAYER_X;
    var pad = 3;
    function overlapX(ox, ow) { return worldX + pad < ox + ow && worldX + PW - pad > ox; }

    // ?-block head-hit (rising)
    if (player.vy < 0) {
      for (var bi = 0; bi < blocks.length; bi++) {
        var bk = blocks[bi];
        var bBottom = bk.y + 16;
        if (!overlapX(bk.x, 16)) continue;
        if (prevY >= bBottom - 1 && player.y < bBottom) {
          player.y = bBottom;
          player.vy = 90;
          if (!bk.hit) {
            bk.hit = true; bk.hitFx = 1;
            window.MUSIC.sfx('blockpop');
            if (bk.drop.indexOf('invite:') === 0) {
              // invitation reveals ON the hit (the drop is celebration only)
              var ibb = bk.drop.replace('invite:', '');
              if (store.inviteBits.indexOf(ibb) === -1) store.inviteBits.push(ibb);
              window.MWN.save(store);
              window.MUSIC.sfx('token');
              var IBT2 = { date: '\u2709 3 DEC 2026 \u00B7 4:00 PM', venue: '\u2709 KHANNA PAWNA ESTATE', dress: '\u2709 FESTIVE + A WARM LAYER', rsvp: '\u2709 RSVP: CLAIM YOUR SPOT \u2192' };
              showToast(IBT2[ibb] || ibb);
              drops.push({ x: bk.x + 1, y: bk.y - 16, type: bk.drop, t: 0, deco: true });
            } else {
              drops.push({ x: bk.x + 1, y: bk.y - 16, type: bk.drop === 'heart' ? 'heart' : bk.drop, t: 0 });
            }
          }
        }
      }
    }

    // landing: base ground + platform tops + block tops
    if (player.vy >= 0) {
      var feetPrev = prevY + PH, feetNew = player.y + PH;
      var best = null, bestRef = null;
      function tryTop(top, ox, ow, ref) {
        if (!overlapX(ox, ow)) return;
        if (feetPrev <= top + 6 && feetNew >= top) {
          if (best === null || top < best) { best = top; bestRef = ref; }
        }
      }
      platforms.forEach(function (p) { tryTop(p.y, p.x, p.w, p); });
      blocks.forEach(function (b) { tryTop(b.y, b.x, 16, b); });
      if (feetNew >= GROUND && (best === null || GROUND < best)) { best = GROUND; bestRef = 'ground'; }
      if (best !== null) {
        player.y = best - PH;
        player.vy = 0;
        player.onGround = true;
        support = bestRef;
      }
    }

    // walked off an elevated surface (support-ref based)
    if (player.onGround && support && support !== 'ground') {
      var sw = support.w || 16;
      if (!overlapX(support.x, sw)) { support = null; player.onGround = false; }
    }
    // black ice: jump suppressed while sliding over a zone
    onIce = false;
    if (player.onGround && support === 'ground') {
      for (var zi = 0; zi < items.length; zi++) {
        if (items[zi].t === 'blackice' && overlapX(items[zi].x, 56)) { onIce = true; break; }
      }
    }
    // icicles: drop when the runner approaches (ahead-only, per Codex A2-P#2)
    for (var ii = 0; ii < icicles.length; ii++) {
      var ic = icicles[ii];
      if (ic.state === 'hang') {
        var dist = ic.x - worldX;
        if (dist > 0 && dist < 110) { ic.state = 'warn'; ic.t = 0; }
      } else if (ic.state === 'warn') {
        ic.t += dt;
        if (ic.t > 0.4) { ic.state = 'fall'; ic.vy = 0; }
      } else if (ic.state === 'fall') {
        ic.vy += GRAVITY * dt;
        ic.y += ic.vy * dt;
        if (overlapX(ic.x, 10) && player.y + pad < ic.y + 22 && player.y + PH - pad > ic.y && runTime > invincibleUntil) {
          takeHit();
        }
        if (ic.y + 22 >= GROUND) { ic.state = 'shatter'; ic.t = 0; }
      } else if (ic.state === 'shatter') {
        ic.t += dt;
      }
    }

    // entities tick
    blocks.forEach(function (b) { if (b.hitFx > 0) b.hitFx = Math.max(0, b.hitFx - dt * 5); });
    enemiesArr.forEach(function (e) { window.ENT.updateEnemy(e, dt, camX, W); });
    for (var di = drops.length - 1; di >= 0; di--) {
      var dp = drops[di];
      window.ENT.updateDrop(dp, dt);
      if (dp.deco) { if (dp.t > 1.2) drops.splice(di, 1); continue; }
      if (dp.t > 0.25 && overlapX(dp.x, 14) && player.y + pad < dp.y + 14 && player.y + PH - pad > dp.y) {
        if (dp.type === 'heart') {
          laddoos++; store.hearts++; window.MWN.save(store);
          window.MUSIC.sfx('coin');
        } else if (dp.type.indexOf('invite:') === 0) {
          var ib = dp.type.replace('invite:', '');
          if (store.inviteBits.indexOf(ib) === -1) store.inviteBits.push(ib);
          window.MWN.save(store);
          window.MUSIC.sfx('token');
          var IBT = { date: '\u2709 3 DEC 2026 \u00B7 4:00 PM', venue: '\u2709 KHANNA PAWNA ESTATE', dress: '\u2709 FESTIVE + A WARM LAYER', rsvp: '\u2709 RSVP: CLAIM YOUR SPOT \u2192' };
          showToast(IBT[ib] || ib);
        } else {
          var pid = dp.type.replace('prop:', '');
          if (store.props.indexOf(pid) === -1) store.props.push(pid);
          window.MWN.save(store);
          window.MUSIC.sfx('token');
          var PT = { chai: '\u2615 Chai break, Mumbai style', boardingpass: '\u{1F3AB} Boarding pass acquired', scarf: '\u{1F9E3} Her Calgary scarf', coffee: '\u2615 Double-double, extra warm' };
          showToast(PT[pid] || pid);
        }
        drops.splice(di, 1);
        hud();
      }
    }

    // stompable enemies
    var now0 = runTime;
    for (var ei = 0; ei < enemiesArr.length; ei++) {
      var en = enemiesArr[ei];
      if (en.dead) continue;
      var es = window.ENT.SIZES[en.kind];
      if (!overlapX(en.x, es.w)) continue;
      var eTop = GROUND - es.h;
      if (player.y + PH > eTop && player.y < GROUND) {
        if (player.vy > 0 && (prevY + PH) <= eTop + 12) {
          en.dead = true; en.deadT = 0;
          player.vy = -320;
          player.onGround = false;
          laddoos++; store.hearts++; window.MWN.save(store);
          window.MUSIC.sfx('stomp');
          hud();
        } else if (now0 > invincibleUntil) {
          takeHit();
        }
      }
    }

    var px2 = PLAYER_X, py = player.y;
    var now = runTime;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.hit) continue;
      var box = HIT[it.t];
      var sx = it.x - camX;
      if (sx < -60 || sx > W + 60) continue;
      if (it.t === 'blackice') continue; // zone, handled above — never damages
      var collectible = (it.t === 'laddoo' || it.t === 'heartc' || it.t === 'token' || it.t === 'ring');
      var oy = collectible ? GROUND + it.dy - box.h : GROUND - box.h;
      if (px2 + pad < sx + box.w && px2 + PW - pad > sx &&
          py + pad < oy + box.h && py + PH - pad > oy) {
        if (it.t === 'laddoo' || it.t === 'heartc') {
          it.hit = true; laddoos++; store.hearts++; window.MWN.save(store);
          window.MUSIC.sfx('coin'); hud();
        } else if (it.t === 'token') {
          it.hit = true; sessionTokens++;
          store.tokens[act.tokenIndex] = true; window.MWN.save(store);
          window.MUSIC.sfx('token');
          showToast(act.tokenToast);
          hud();
        } else if (it.t === 'ring') {
          it.hit = true; ringGot = true;
          window.MUSIC.sfx('token');
          showToast('\u2726 You made each other\u2019s rings at the studio');
          hud();
        } else if (now > invincibleUntil) {
          takeHit();
        }
      }
    }

    if (act.monster && !monsterDone && camX >= act.monster.x - 240) {
      mode = 'monster';
      monster = { hp: act.monster.hp, max: act.monster.hp, hitT: 0, dead: false, deadT: 0 };
      shots = [];
      player.y = GROUND - PH; player.vy = 0; player.onGround = true;
      if (shootBtn) shootBtn.hidden = false;
      return;
    }
    if (!climbMusic && camX >= act.flagX - 800) {
      climbMusic = true;
      window.MUSIC.start('japan');   // the arrival gets its own sound
    }
    if (act.endScene === 'torii' && camX >= act.flagX - 190) {
      mode = 'finale'; finaleT = 0; coupleX = PLAYER_X;
      player.y = GROUND - PH;
      return;
    }
  }

  function updateMonster(dt) {
    runTime += dt;
    if (!monster) return;
    monster.hitT -= dt;
    var mx = act.monster.x - camX;
    for (var i = shots.length - 1; i >= 0; i--) {
      shots[i].x += 330 * dt;
      if (shots[i].x >= mx + 8 && !monster.dead) {
        shots.splice(i, 1);
        monster.hp--;
        monster.hitT = 0.18;
        window.MUSIC.sfx('boom');
        if (monster.hp <= 0) {
          monster.dead = true; monster.deadT = 0;
          monstersKilled++;
          if (shootBtn) shootBtn.hidden = true;
          window.MUSIC.sfx('token');
          showToast(act.monster.toast);
          hud();
        }
      } else if (shots[i] && shots[i].x > W + 30) {
        shots.splice(i, 1);
      }
    }
    if (monster.dead) {
      monster.deadT += dt;
      if (monster.deadT > 1) {
        monsterDone = true;
        monster = null;
        mode = 'run';
        lastT = 0;
      }
    }
  }

  function shoot() {
    if (mode !== 'monster' || !monster || monster.dead) return;
    if (shots.length < 6) {
      shots.push({ x: PLAYER_X + 16, y: player.y + 9 });
      window.MUSIC.sfx('shoot');
    }
  }

  function updateFinale(dt) {
    finaleT += dt;
    runTime += dt;
    var target = act.groomWaiting ? act.flagX - camX - 46 : act.flagX - camX - 12;
    if (coupleX < target) coupleX = Math.min(target, coupleX + 85 * dt);
    if (finaleT > 0.9 && Math.random() < dt * 6) {
      heartsFx.push({ x: coupleX + Math.random() * 60 - 20, y: GROUND - hillLift(coupleX) - 46, vy: -30 - Math.random() * 25, life: 1.6 });
    }
    if (act.groomWaiting && finaleT > 1.1 && Math.random() < dt * 14) {
      petalsFx.push({ x: act.flagX - camX - 60 + Math.random() * 110, y: GROUND - 150 - Math.random() * 40,
                      vy: 34 + Math.random() * 22, sway: Math.random() * 6, life: 3 });
    }
    for (var i = heartsFx.length - 1; i >= 0; i--) {
      var hh = heartsFx[i];
      hh.y += hh.vy * dt; hh.life -= dt;
      if (hh.life <= 0) heartsFx.splice(i, 1);
    }
    for (var pi = petalsFx.length - 1; pi >= 0; pi--) {
      var pp = petalsFx[pi];
      pp.y += pp.vy * dt; pp.life -= dt;
      if (pp.life <= 0 || pp.y > GROUND - hillLift(pp.x)) petalsFx.splice(pi, 1);
    }
    if (finaleT > 2) {
      if (actIdx < window.LEVELS.acts.length - 1) {
        mode = 'clear';
        window.MUSIC.sfx('clear');
        overlayHTML(act.clearLine, [{ a: 'next', label: act.nextLabel }]);
      } else {
        finishGame();
      }
    }
  }

  /* the ground swells into a hill under the mandap */
  function hillLift(screenX) {
    if (act.endScene !== 'mandap' && act.endScene !== 'torii') return 0;
    var mx = act.flagX - camX;
    var d = Math.abs(screenX - mx);
    if (d > 150) return 0;
    return Math.round(24 * (1 - d / 150));
  }

  /* ---------- scenery ---------- */
  function buildScenery() {
    scenery = []; clouds = []; flakes = [];
    var i, x;
    if (act.style === 'mumbai') {
      x = 0;
      while (x < (act.flagX + 800) * 0.55 + W) {
        scenery.push({ t: 'bldg', x: x, w: 30 + Math.random() * 50, h: 50 + Math.random() * 90 });
        x += 40 + Math.random() * 70;
      }
      scenery.push({ t: 'sakura', x: 1925, h: 58 });
      scenery.push({ t: 'sakura', x: 2040, h: 50 });
      scenery.push({ t: 'gateway', x: 260 });
      scenery.push({ t: 'cst', x: 680 });
      scenery.push({ t: 'tajdome', x: 1040 });
      scenery.push({ t: 'sealink', x: 1420 });
      scenery.push({ t: 'sealink', x: 1600 });
      scenery.push({ t: 'cst', x: 1960 });
      scenery.push({ t: 'gateway', x: 2320 });
    } else if (act.style === 'calgary') {
      scenery.push({ t: 'rockies', x: 60 });
      scenery.push({ t: 'rockies', x: 700 });
      scenery.push({ t: 'rockies', x: 1400 });
      scenery.push({ t: 'tower', x: 420 });
      scenery.push({ t: 'tower', x: 1700 });
      scenery.push({ t: 'sakura', x: 1925, h: 58 });
      scenery.push({ t: 'sakura', x: 2040, h: 50 });
      scenery.push({ t: 'saddledome', x: 760 });
      scenery.push({ t: 'saddledome', x: 2100 });
      scenery.push({ t: 'peacebridge', x: 1200 });
      scenery.push({ t: 'peacebridge', x: 2400 });
      x = 0;
      while (x < (act.flagX + 800) * 0.55 + W) {
        scenery.push({ t: 'pine', x: x, h: 34 + Math.random() * 26 });
        x += 70 + Math.random() * 90;
      }
      for (i = 0; i < 42; i++) {
        flakes.push({ x0: Math.random() * W, y0: Math.random() * H, spd: 22 + Math.random() * 26, w: 1 + Math.random() * 2 });
      }
    } else if (act.style === 'pawna') {
      scenery.push({ t: 'ridge', x: 100 });
      scenery.push({ t: 'ridge', x: 700 });
      scenery.push({ t: 'ridge', x: 1300 });
      scenery.push({ t: 'lakeglint', x: 300, w: 500 });
      scenery.push({ t: 'lakeglint', x: 1100, w: 400 });
      x = 0;
      while (x < (act.flagX + 600) * 0.55 + W) {
        if (Math.random() < .5) scenery.push({ t: 'marigold', x: x });
        x += 90 + Math.random() * 120;
      }
    } else {
      x = 0;
      while (x < 1300) {
        scenery.push({ t: 'sakura', x: x, h: 46 + Math.random() * 26 });
        x += 90 + Math.random() * 90;
      }
      scenery.push({ t: 'torii', x: 320 });
      scenery.push({ t: 'torii', x: 980 });
      scenery.push({ t: 'pagoda', x: 520 });
      scenery.push({ t: 'tokyotower', x: 840 });
      scenery.push({ t: 'castle', x: 1140 });
      scenery.push({ t: 'pagoda', x: 2260 });
      scenery.push({ t: 'fuji', x: 1560 });
      scenery.push({ t: 'lake', x: 1290, w: 830 });
      x = 1300;
      while (x < 2400) {
        if (Math.random() < .6) scenery.push({ t: 'sakura', x: x, h: 40 + Math.random() * 22 });
        x += 130 + Math.random() * 110;
      }
    }
    for (i = 0; i < 14; i++) {
      clouds.push({ x: Math.random() * (act.flagX + 800), y: 30 + Math.random() * 110, w: 30 + Math.random() * 40 });
    }
  }

  /* ---------- sprites ---------- */
  function px(n) { return Math.round(n); }

  function drawMayank(x, y, facingLeft, running, frame) {
    x = px(x); y = px(y);
    var f = running ? (Math.floor(frame) % 2) : 0;
    ctx.fillStyle = '#3b2d20';
    if (running) {
      if (f === 0) { ctx.fillRect(x + 2, y + 20, 5, 6); ctx.fillRect(x + 11, y + 22, 5, 4); }
      else { ctx.fillRect(x + 2, y + 22, 5, 4); ctx.fillRect(x + 11, y + 20, 5, 6); }
    } else { ctx.fillRect(x + 3, y + 20, 5, 6); ctx.fillRect(x + 10, y + 20, 5, 6); }
    ctx.fillStyle = '#e8703a';
    ctx.fillRect(x + 1, y + 9, 16, 12);
    ctx.fillStyle = '#c94f2a';
    ctx.fillRect(x + 1, y + 17, 16, 2);
    ctx.fillStyle = '#e8b88a';
    ctx.fillRect(x + 3, y + 1, 12, 9);
    ctx.fillStyle = '#241a12';
    ctx.fillRect(x + 3, y, 12, 3);
    ctx.fillRect(facingLeft ? x + 14 : x + 2, y + 1, 2, 4);
    ctx.fillRect(facingLeft ? x + 4 : x + 12, y + 4, 2, 2);
  }

  function drawNeha(x, y, running, frame) {
    x = px(x); y = px(y);
    var f = running ? (Math.floor(frame) % 2) : 0;
    // feet peeking under the lehenga
    ctx.fillStyle = '#3b2d20';
    if (running) {
      if (f === 0) { ctx.fillRect(x + 3, y + 23, 4, 3); ctx.fillRect(x + 11, y + 24, 4, 2); }
      else { ctx.fillRect(x + 3, y + 24, 4, 2); ctx.fillRect(x + 11, y + 23, 4, 3); }
    } else { ctx.fillRect(x + 4, y + 23, 4, 3); ctx.fillRect(x + 10, y + 23, 4, 3); }
    // lehenga skirt — flared
    ctx.fillStyle = '#e85d75';
    ctx.fillRect(x + 4, y + 14, 10, 3);
    ctx.fillRect(x + 3, y + 17, 12, 3);
    ctx.fillRect(x + 2, y + 20, 14, 3);
    ctx.fillStyle = '#ffd23f';                       // gold hem
    ctx.fillRect(x + 2, y + 22, 14, 2);
    ctx.fillStyle = '#c9455f';                       // skirt fold shading
    ctx.fillRect(x + 8, y + 15, 2, 7);
    // choli
    ctx.fillStyle = '#d94f70';
    ctx.fillRect(x + 4, y + 9, 10, 5);
    ctx.fillStyle = '#ffd23f';                       // waistband
    ctx.fillRect(x + 4, y + 13, 10, 1);
    // arms
    ctx.fillStyle = '#e8b88a';
    ctx.fillRect(x + 2, y + 10, 2, 4); ctx.fillRect(x + 14, y + 10, 2, 4);
    ctx.fillStyle = '#ffd23f';                       // bangles
    ctx.fillRect(x + 2, y + 13, 2, 1); ctx.fillRect(x + 14, y + 13, 2, 1);
    // long hair down the back
    ctx.fillStyle = '#241a12';
    ctx.fillRect(x + 1, y + 2, 3, 15);
    ctx.fillRect(x + 2, y + 16, 2, 3);
    // head
    ctx.fillStyle = '#e8b88a';
    ctx.fillRect(x + 4, y + 2, 11, 8);
    // hair top + side sweep
    ctx.fillStyle = '#241a12';
    ctx.fillRect(x + 3, y, 12, 3);
    ctx.fillRect(x + 3, y + 2, 2, 5);
    ctx.fillRect(x + 13, y + 2, 2, 2);
    // flower in her hair
    ctx.fillStyle = '#ffb3c1';
    ctx.fillRect(x + 2, y - 1, 4, 4);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x + 3, y, 2, 2);
    // bindi
    ctx.fillStyle = '#d64545';
    ctx.fillRect(x + 9, y + 4, 2, 2);
    // eye with lash line
    ctx.fillStyle = '#241a12';
    ctx.fillRect(x + 12, y + 4, 3, 1);
    ctx.fillRect(x + 12, y + 5, 2, 2);
    // smile
    ctx.fillStyle = '#b3543f';
    ctx.fillRect(x + 12, y + 8, 2, 1);
    // earring
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x + 14, y + 8, 2, 2);
  }

  function drawGoldRing(x, y, blinkPhase) {
    ctx.fillStyle = blinkPhase ? '#fff3c4' : '#ffd23f';
    ctx.fillRect(x, y, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.fillRect(x + 3, y + 3, 4, 4);
  }

  function drawBigTorii() {
    var mx = px(act.flagX - camX);
    if (mx > W + 160) return;
    // hill
    ctx.fillStyle = '#6f9a6a';
    ctx.beginPath();
    ctx.moveTo(mx - 150, GROUND);
    ctx.quadraticCurveTo(mx, GROUND - 52, mx + 150, GROUND);
    ctx.closePath(); ctx.fill();
    var top = GROUND - 24;
    ctx.fillStyle = '#c94f4f';
    ctx.fillRect(mx - 42, top - 84, 8, 84);
    ctx.fillRect(mx + 34, top - 84, 8, 84);
    ctx.fillRect(mx - 56, top - 94, 112, 9);   // upper lintel
    ctx.fillRect(mx - 46, top - 78, 92, 6);    // lower beam
    ctx.fillStyle = '#8f3b2e';
    ctx.fillRect(mx - 60, top - 96, 120, 4);   // kasagi cap
    // marigold string swinging under the lintel
    ctx.fillStyle = '#ffb703';
    for (var mg = 0; mg < 9; mg++) {
      var mgx = mx - 40 + mg * 10;
      var sag = Math.round(Math.sin((mg / 8) * Math.PI) * 8);
      ctx.fillRect(mgx, top - 74 + sag, 4, 4);
    }
    // diyas at the pillar bases (flickering)
    var fl = Math.floor(runTime * 6) % 2;
    ctx.fillStyle = '#c9a24b';
    ctx.fillRect(mx - 52, top - 4, 8, 4); ctx.fillRect(mx + 44, top - 4, 8, 4);
    ctx.fillStyle = fl ? '#ffd23f' : '#ff9b3d';
    ctx.fillRect(mx - 50, top - 9, 4, 5); ctx.fillRect(mx + 46, top - 9, 4, 5);
    // small bonfire beside the mandap
    var bx = mx + 78;
    ctx.fillStyle = '#7b4a12';
    ctx.fillRect(bx - 8, GROUND - hillLift(bx) - 4, 16, 4);
    ctx.fillStyle = fl ? '#fb8500' : '#e85d75';
    ctx.fillRect(bx - 4, GROUND - hillLift(bx) - 12, 8, 8);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(bx - 2, GROUND - hillLift(bx) - 16, 4, 5);
    // the groom, waiting at his mandap (Act 2)
    if (act.groomWaiting) {
      var gx = mx - 14;
      var gy = GROUND - hillLift(gx) - PH;
      drawMayank(gx, gy, true, false, 0);
      if (mode === 'run' || mode === 'finale') {
        var hy = gy - 14 + Math.sin(runTime * 3) * 3;
        ctx.fillStyle = '#e85d75';
        ctx.fillRect(gx + 5, px(hy), 3, 3); ctx.fillRect(gx + 10, px(hy), 3, 3);
        ctx.fillRect(gx + 5, px(hy) + 2, 8, 3); ctx.fillRect(gx + 7, px(hy) + 5, 4, 2);
      }
    }
  }

  /* ---------- item skins ---------- */
  function drawItem(it) {
    var box = HIT[it.t];
    var x = px(it.x - camX), y;
    var collectible = (it.t === 'laddoo' || it.t === 'heartc' || it.t === 'token' || it.t === 'ring');
    y = collectible ? px(GROUND + it.dy - box.h) : GROUND - box.h;

    if (it.t === 'blackice') {
      window.ENT.drawBlackIce(ctx, x);
    } else if (it.t === 'heartc') {
      window.ENT.drawHeartC(ctx, x, y, runTime);
    } else if (it.t === 'puddle') {
      window.ENT.drawPuddle(ctx, x);
    } else if (it.t === 'cart') {
      window.ENT.drawCart(ctx, x);
    } else if (it.t === 'laddoo') {
      ctx.fillStyle = '#fb8500';
      ctx.fillRect(x + 3, y + 1, 8, 12);
      ctx.fillRect(x + 1, y + 3, 12, 8);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x + 4, y + 3, 3, 3);
    } else if (it.t === 'token') {
      y += px(Math.sin(runTime * 4) * 3);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x + 2, y, 12, 12);
      ctx.fillStyle = '#e85d75';
      ctx.fillRect(x + 4, y + 3, 3, 3); ctx.fillRect(x + 9, y + 3, 3, 3);
      ctx.fillRect(x + 4, y + 5, 8, 3); ctx.fillRect(x + 6, y + 8, 4, 2);
    } else if (it.t === 'ring') {
      y += px(Math.sin(runTime * 4) * 3);
      drawGoldRing(x + 2, y + 2, Math.floor(runTime * 4) % 2 === 0);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(x + 13, y - 2, 2, 2);
    } else if (it.t === 'chair') {
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(x + 4, y, 16, 12);
      ctx.fillRect(x + 2, y + 12, 20, 5);
      ctx.fillRect(x + 10, y + 17, 4, 9);
      ctx.fillRect(x + 3, y + 26, 18, 3);
      ctx.fillStyle = '#6a6a7a';
      ctx.fillRect(x + 5, y + 1, 14, 3);
    } else if (it.t === 'excel') {
      ctx.fillStyle = '#1d6f42';
      ctx.fillRect(x, y, 30, 14);
      ctx.fillStyle = '#ffffff';
      for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) ctx.fillRect(x + 3 + c * 7, y + 3 + r * 6, 5, 4);
    } else if (it.t === 'door') {
      ctx.fillStyle = '#8d99ae';
      ctx.fillRect(x, y, 16, 46);
      ctx.fillStyle = '#5c677d';
      ctx.fillRect(x + 7, y, 2, 46);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x + 2, y + 20, 3, 6); ctx.fillRect(x + 11, y + 20, 3, 6);
    } else if (it.t === 'snowdrift') {
      ctx.fillStyle = '#8fb4d1';
      ctx.fillRect(x + 2, y + 6, 22, 10);
      ctx.fillRect(x + 6, y, 14, 8);
      ctx.fillStyle = '#dceaf5';
      ctx.fillRect(x + 7, y + 1, 6, 4);
      ctx.fillStyle = '#4a6d8c';
      ctx.fillRect(x + 2, y + 13, 22, 3);
    } else if (it.t === 'clock') {
      ctx.fillStyle = '#2f3b4a';
      ctx.fillRect(x + 8, y + 18, 4, 8);
      ctx.fillRect(x, y - 2, 20, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y, 16, 18);
      ctx.fillStyle = '#2b2118';
      ctx.fillRect(x + 9, y + 4, 2, 6);         // hands
      ctx.fillRect(x + 11, y + 8, 4, 2);
      ctx.fillStyle = '#c94f4f';
      ctx.fillRect(x + 2, y, 16, 2);
    } else if (it.t === 'gate') {
      ctx.fillStyle = '#3a4a63';
      ctx.fillRect(x, y, 16, 46);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x + 2, y + 4, 12, 3);
      ctx.fillRect(x + 2, y + 10, 12, 3);
      ctx.fillStyle = '#c94f4f';
      ctx.fillRect(x + 5, y - 4, 6, 4);          // top light
      ctx.fillStyle = '#8d99ae';
      ctx.fillRect(x + 2, y + 22, 12, 20);

    }
  }

  /* ---------- backgrounds ---------- */
  function hex2(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mixHex(a, b, t) {
    var A = hex2(a), B = hex2(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  var GOLDEN = ['#c9788c', '#f2a45e', '#ffd166']; // the sundowner both roads end in

  function renderSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    // the climb turns golden: 4 PM light as the mandap nears
    var climbT = act ? Math.max(0, Math.min(1, (camX - (act.flagX - 800)) / 600)) : 0;
    var base;
    if (act.style === 'mumbai') base = ['#8ecae6', '#bde0fe', '#ffe8b6'];
    else if (act.style === 'calgary') base = ['#7fa8cc', '#d8e6f2', '#f4f8fc'];
    else base = ['#8c6bb1', '#f2909e', '#ffd9a0'];
    g.addColorStop(0, mixHex(base[0], GOLDEN[0], climbT));
    g.addColorStop(.6, mixHex(base[1], GOLDEN[1], climbT));
    g.addColorStop(1, mixHex(base[2], GOLDEN[2], climbT));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (act.style === 'mumbai') { ctx.fillStyle = '#ffd23f'; ctx.fillRect(250, 40, 28, 28); }
    if (act.weather === 'rain') { ctx.fillStyle = 'rgba(110, 122, 138, .22)'; ctx.fillRect(0, 0, W, H); }
    else if (act.style === 'calgary') { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(244, 52, 26, 26); }
    else if (act.style === 'pawna') { ctx.fillStyle = '#ff7b3e'; ctx.fillRect(226, 150, 40, 40); }
    else { ctx.fillStyle = '#ff8b5e'; ctx.fillRect(236, 120, 34, 34); }
    ctx.fillStyle = act.style === 'japan' ? 'rgba(255,236,224,.8)' : 'rgba(255,255,255,.85)';
    clouds.forEach(function (c) {
      var cx = px(c.x - camX * 0.3);
      if (cx > -80 && cx < W + 80) { ctx.fillRect(cx, c.y, c.w, 8); ctx.fillRect(cx + 8, c.y - 6, c.w * .5, 6); }
    });
  }

  function renderScenery() {
    var F = 0.55;
    scenery.forEach(function (s) {
      var sx = px(s.x - camX * F);
      if (sx < -300 || sx > W + 80) return;
      if (s.t === 'bldg') {
        ctx.fillStyle = 'rgba(140, 160, 195, .38)';
        ctx.fillRect(sx, GROUND - s.h, s.w, s.h);
      } else if (s.t === 'gateway') {
        // Gateway of India
        ctx.fillStyle = 'rgba(172, 138, 104, .5)';
        ctx.fillRect(sx, GROUND - 58, 12, 58);          // left tower
        ctx.fillRect(sx + 42, GROUND - 58, 12, 58);     // right tower
        ctx.fillRect(sx + 8, GROUND - 46, 38, 46);      // body
        ctx.fillStyle = 'rgba(120, 92, 66, .55)';
        ctx.fillRect(sx + 18, GROUND - 32, 18, 32);     // arch opening
        ctx.fillStyle = 'rgba(172, 138, 104, .55)';
        ctx.fillRect(sx + 1, GROUND - 64, 10, 6);       // turret domes
        ctx.fillRect(sx + 43, GROUND - 64, 10, 6);
        ctx.fillRect(sx + 22, GROUND - 52, 10, 6);
      } else if (s.t === 'cst') {
        // CST clock tower
        ctx.fillStyle = 'rgba(150, 128, 110, .5)';
        ctx.fillRect(sx, GROUND - 78, 22, 78);
        ctx.fillStyle = 'rgba(120, 100, 86, .55)';
        ctx.beginPath();
        ctx.moveTo(sx - 2, GROUND - 78); ctx.lineTo(sx + 11, GROUND - 96); ctx.lineTo(sx + 24, GROUND - 78);
        ctx.closePath(); ctx.fill();                    // dome cap
        ctx.fillStyle = 'rgba(255, 245, 220, .75)';
        ctx.fillRect(sx + 6, GROUND - 68, 10, 10);      // clock face
        ctx.fillStyle = 'rgba(60, 50, 40, .6)';
        ctx.fillRect(sx + 10, GROUND - 66, 2, 5);       // hands
      } else if (s.t === 'tajdome') {
        // Taj Mahal Palace hotel
        ctx.fillStyle = 'rgba(180, 150, 120, .45)';
        ctx.fillRect(sx, GROUND - 42, 60, 42);
        ctx.fillStyle = 'rgba(190, 92, 78, .55)';
        ctx.beginPath();
        ctx.arc(sx + 30, GROUND - 42, 13, Math.PI, 0);
        ctx.fill();                                     // red dome
        ctx.fillRect(sx + 28, GROUND - 58, 4, 4);
        ctx.fillStyle = 'rgba(120, 92, 66, .4)';
        for (var wnd = 0; wnd < 5; wnd++) ctx.fillRect(sx + 5 + wnd * 11, GROUND - 30, 5, 8);
      } else if (s.t === 'sealink') {
        // Bandra–Worli Sea Link pylon + cables
        ctx.fillStyle = 'rgba(200, 210, 225, .55)';
        ctx.fillRect(sx + 26, GROUND - 92, 5, 92);      // pylon
        ctx.fillRect(sx + 20, GROUND - 92, 17, 4);
        ctx.strokeStyle = 'rgba(210, 220, 235, .45)';
        ctx.lineWidth = 1;
        for (var cb = 0; cb < 5; cb++) {
          ctx.beginPath();
          ctx.moveTo(sx + 28, GROUND - 86 + cb * 6);
          ctx.lineTo(sx - 8 - cb * 12, GROUND - 8);
          ctx.moveTo(sx + 29, GROUND - 86 + cb * 6);
          ctx.lineTo(sx + 66 + cb * 12, GROUND - 8);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(200, 210, 225, .5)';
        ctx.fillRect(sx - 40, GROUND - 10, 140, 4);     // deck
      } else if (s.t === 'saddledome') {
        // Scotiabank Saddledome
        ctx.fillStyle = 'rgba(140, 150, 165, .5)';
        ctx.fillRect(sx, GROUND - 26, 8, 26);
        ctx.fillRect(sx + 62, GROUND - 26, 8, 26);
        ctx.fillRect(sx + 4, GROUND - 18, 62, 18);      // bowl
        ctx.beginPath();                                 // saddle roofline
        ctx.moveTo(sx, GROUND - 26);
        ctx.quadraticCurveTo(sx + 35, GROUND - 10, sx + 70, GROUND - 26);
        ctx.lineTo(sx + 70, GROUND - 20);
        ctx.quadraticCurveTo(sx + 35, GROUND - 4, sx, GROUND - 20);
        ctx.closePath(); ctx.fill();
      } else if (s.t === 'peacebridge') {
        // Calgary Peace Bridge (red arch)
        ctx.fillStyle = 'rgba(205, 60, 60, .55)';
        for (var pb = 0; pb < 9; pb++) {
          var ang = (pb / 8) * Math.PI;
          var bx2 = sx + pb * 8;
          var by = GROUND - 8 - Math.sin(ang) * 22;
          ctx.fillRect(bx2, by, 4, 4);
        }
        ctx.fillRect(sx, GROUND - 8, 70, 3);            // deck
      } else if (s.t === 'pagoda') {
        // five-storey pagoda
        for (var tier = 0; tier < 5; tier++) {
          var tw = 44 - tier * 7;
          var ty = GROUND - 16 - tier * 14;
          ctx.fillStyle = 'rgba(150, 60, 55, .55)';
          ctx.fillRect(sx + (44 - tw) / 2 - 4, ty - 4, tw + 8, 4);   // eave
          ctx.fillStyle = 'rgba(105, 70, 60, .5)';
          ctx.fillRect(sx + (44 - tw) / 2, ty - 14, tw, 10);          // storey
        }
        ctx.fillStyle = 'rgba(150, 60, 55, .6)';
        ctx.fillRect(sx + 20, GROUND - 90, 4, 8);        // finial
      } else if (s.t === 'tokyotower') {
        // Tokyo Tower lattice
        ctx.strokeStyle = 'rgba(220, 85, 60, .6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, GROUND); ctx.lineTo(sx + 22, GROUND - 96);
        ctx.moveTo(sx + 44, GROUND); ctx.lineTo(sx + 22, GROUND - 96);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 6, GROUND - 26); ctx.lineTo(sx + 38, GROUND - 26);
        ctx.moveTo(sx + 11, GROUND - 50); ctx.lineTo(sx + 33, GROUND - 50);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, .55)';
        ctx.fillRect(sx + 14, GROUND - 60, 16, 6);       // observation deck
        ctx.fillStyle = 'rgba(220, 85, 60, .6)';
        ctx.fillRect(sx + 20, GROUND - 104, 4, 8);       // antenna
      } else if (s.t === 'castle') {
        // Himeji-style castle
        ctx.fillStyle = 'rgba(120, 125, 140, .45)';
        ctx.fillRect(sx, GROUND - 18, 56, 18);           // stone base
        ctx.fillStyle = 'rgba(245, 245, 240, .55)';
        ctx.fillRect(sx + 8, GROUND - 40, 40, 22);       // keep lower
        ctx.fillRect(sx + 14, GROUND - 58, 28, 18);      // keep upper
        ctx.fillStyle = 'rgba(90, 110, 130, .6)';
        ctx.fillRect(sx + 4, GROUND - 44, 48, 5);        // eave 1
        ctx.fillRect(sx + 10, GROUND - 62, 36, 5);       // eave 2
        ctx.beginPath();                                  // top roof
        ctx.moveTo(sx + 12, GROUND - 62); ctx.lineTo(sx + 28, GROUND - 74); ctx.lineTo(sx + 44, GROUND - 62);
        ctx.closePath(); ctx.fill();
      } else if (s.t === 'ridge') {
        // Sahyadri ridgeline, warm dusk
        ctx.fillStyle = 'rgba(110, 75, 60, .45)';
        ctx.beginPath();
        ctx.moveTo(sx - 160, GROUND); ctx.lineTo(sx - 40, GROUND - 88); ctx.lineTo(sx + 60, GROUND - 30);
        ctx.lineTo(sx + 150, GROUND - 70); ctx.lineTo(sx + 260, GROUND);
        ctx.closePath(); ctx.fill();
      } else if (s.t === 'lakeglint') {
        // Pawna Lake glinting below the climb
        ctx.fillStyle = 'rgba(255, 209, 102, .35)';
        ctx.fillRect(sx, GROUND - 14, s.w, 14);
        ctx.fillStyle = 'rgba(255, 240, 200, .55)';
        for (var lg = 0; lg < 5; lg++) ctx.fillRect(sx + 30 + lg * (s.w / 5), GROUND - 10 + (lg % 2) * 4, 20, 2);
      } else if (s.t === 'marigold') {
        ctx.fillStyle = 'rgba(251, 133, 0, .7)';
        ctx.fillRect(sx, GROUND - 10, 5, 5); ctx.fillRect(sx + 7, GROUND - 14, 5, 5); ctx.fillRect(sx + 13, GROUND - 8, 5, 5);
        ctx.fillStyle = 'rgba(90, 110, 60, .6)';
        ctx.fillRect(sx + 6, GROUND - 8, 3, 8);
      } else if (s.t === 'rockies') {
        ctx.fillStyle = 'rgba(120, 138, 160, .4)';
        ctx.beginPath();
        ctx.moveTo(sx - 130, GROUND); ctx.lineTo(sx - 40, GROUND - 95); ctx.lineTo(sx + 40, GROUND); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx - 20, GROUND); ctx.lineTo(sx + 70, GROUND - 120); ctx.lineTo(sx + 170, GROUND); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.beginPath();
        ctx.moveTo(sx + 44, GROUND - 86); ctx.lineTo(sx + 70, GROUND - 120); ctx.lineTo(sx + 96, GROUND - 86);
        ctx.lineTo(sx + 84, GROUND - 82); ctx.lineTo(sx + 70, GROUND - 90); ctx.lineTo(sx + 56, GROUND - 82);
        ctx.closePath(); ctx.fill();
      } else if (s.t === 'tower') {
        ctx.fillStyle = 'rgba(150, 160, 175, .55)';
        ctx.fillRect(sx + 6, GROUND - 96, 6, 96);
        ctx.fillStyle = 'rgba(201, 79, 79, .6)';
        ctx.fillRect(sx, GROUND - 108, 18, 12);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.fillRect(sx + 2, GROUND - 104, 14, 3);
        ctx.fillStyle = 'rgba(150, 160, 175, .55)';
        ctx.fillRect(sx + 7, GROUND - 116, 4, 8);
      } else if (s.t === 'pine') {
        ctx.fillStyle = 'rgba(78, 125, 99, .55)';
        ctx.beginPath();
        ctx.moveTo(sx, GROUND); ctx.lineTo(sx + 10, GROUND - s.h); ctx.lineTo(sx + 20, GROUND); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fillRect(sx + 6, GROUND - s.h + 8, 8, 2);
      } else if (s.t === 'sakura') {
        ctx.fillStyle = 'rgba(122, 85, 70, .5)';
        ctx.fillRect(sx + 8, GROUND - s.h + 18, 5, s.h - 18);
        ctx.fillStyle = 'rgba(244, 184, 200, .65)';
        ctx.fillRect(sx, GROUND - s.h, 22, 16);
        ctx.fillRect(sx + 4, GROUND - s.h - 7, 14, 8);
      } else if (s.t === 'torii') {
        ctx.fillStyle = 'rgba(201, 79, 79, .55)';
        ctx.fillRect(sx, GROUND - 64, 6, 64);
        ctx.fillRect(sx + 34, GROUND - 64, 6, 64);
        ctx.fillRect(sx - 6, GROUND - 70, 52, 7);
        ctx.fillRect(sx - 2, GROUND - 56, 44, 5);
      } else if (s.t === 'fuji') {
        ctx.fillStyle = 'rgba(125, 143, 168, .6)';
        ctx.beginPath();
        ctx.moveTo(sx - 110, GROUND - 8);
        ctx.lineTo(sx, GROUND - 128);
        ctx.lineTo(sx + 110, GROUND - 8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath();
        ctx.moveTo(sx - 34, GROUND - 90);
        ctx.lineTo(sx, GROUND - 128);
        ctx.lineTo(sx + 34, GROUND - 90);
        ctx.lineTo(sx + 22, GROUND - 84);
        ctx.lineTo(sx + 8, GROUND - 92);
        ctx.lineTo(sx - 8, GROUND - 84);
        ctx.lineTo(sx - 22, GROUND - 92);
        ctx.closePath(); ctx.fill();
      } else if (s.t === 'lake') {
        ctx.fillStyle = 'rgba(126, 178, 221, .55)';
        ctx.fillRect(sx, GROUND - 26, s.w, 26);
        ctx.fillStyle = 'rgba(255, 255, 255, .5)';
        for (var k = 0; k < 6; k++) ctx.fillRect(sx + 40 + k * (s.w / 6), GROUND - 18 + (k % 2) * 6, 18, 2);
      }
    });
    // snowfall (screen-space)
    if (act.style === 'calgary') {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      flakes.forEach(function (f) {
        var fy = (f.y0 + runTime * f.spd) % H;
        var fx2 = (f.x0 + Math.sin(runTime * 0.8 + f.y0) * 10 + W) % W;
        ctx.fillRect(px(fx2), px(fy), f.w, f.w);
      });
    }
    // haze band separating background from playfield
    var hzc = act.style === 'mumbai' ? '255, 232, 182' : act.style === 'calgary' ? '244, 248, 252' : '255, 217, 160';
    var hz = ctx.createLinearGradient(0, GROUND - 70, 0, GROUND);
    hz.addColorStop(0, 'rgba(' + hzc + ', 0)');
    hz.addColorStop(1, 'rgba(' + hzc + ', .55)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, GROUND - 70, W, 70);
  }

  function renderTrain() {
    if (act.style !== 'japan') return;
    var period = 7, tt = runTime % period;
    if (tt > 1.1) return;
    var tx = W + 120 - (tt / 1.1) * (W + 320);
    var ty = 208;
    ctx.fillStyle = '#f4f7fa';
    ctx.fillRect(px(tx), ty, 150, 16);
    ctx.beginPath();
    ctx.moveTo(px(tx), ty);
    ctx.lineTo(px(tx) - 22, ty + 16);
    ctx.lineTo(px(tx), ty + 16);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3d6bb0';
    ctx.fillRect(px(tx) - 14, ty + 10, 164, 3);
    ctx.fillStyle = '#9fc2e8';
    for (var i = 0; i < 6; i++) ctx.fillRect(px(tx) + 10 + i * 24, ty + 3, 12, 5);
  }

  function renderGround() {
    var g1 = act.style === 'mumbai' ? '#4a7c59' : act.style === 'calgary' ? '#e9f0f6' : act.style === 'pawna' ? '#8a9a55' : '#6f9a6a';
    var g2 = act.style === 'mumbai' ? '#3b6349' : act.style === 'calgary' ? '#c9d8e4' : act.style === 'pawna' ? '#75844a' : '#5b8258';
    ctx.fillStyle = g1;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = g2;
    for (var gx = -(px(camX) % 20); gx < W; gx += 20) ctx.fillRect(gx, GROUND, 10, 4);
    if (act.style === 'japan') {
      ctx.fillStyle = 'rgba(244, 184, 200, .8)';
      for (var pxl = -(px(camX) % 46); pxl < W; pxl += 46) ctx.fillRect(pxl, GROUND + 10, 3, 3);
    }
  }

  function renderEnd() {
    if (act.endScene === 'torii') { drawBigTorii(); }
  }

  function renderFinale() {
    var lift = hillLift(coupleX);
    var y = GROUND - PH - lift;
    var target = act.groomWaiting ? act.flagX - camX - 46 : act.flagX - camX - 12;
    var walking = coupleX < target;
    if (act.groomWaiting) {
      // she arrives; he is already there (drawn by drawBigTorii)
      drawNeha(coupleX, y, walking, runTime * 10);
      if (finaleT > 1.1) {
        var blink = Math.floor(runTime * 5) % 2 === 0;
        var midX = px((coupleX + (act.flagX - camX - 14)) / 2);
        drawGoldRing(midX - 4, y - 20, blink);
        drawGoldRing(midX + 7, y - 28, !blink);
      }
    } else {
      // Act 1: he climbs to the mandap alone and waits
      drawMayank(coupleX, y, false, walking, runTime * 10);
    }
    // marigold petals
    petalsFx.forEach(function (pp) {
      var pxx = px(pp.x + Math.sin(runTime * 3 + pp.sway) * 5), pyy = px(pp.y);
      ctx.globalAlpha = Math.max(0, Math.min(1, pp.life));
      ctx.fillStyle = (pp.sway > 3) ? '#ffd23f' : '#fb8500';
      ctx.fillRect(pxx, pyy, 3, 3);
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = '#e85d75';
    heartsFx.forEach(function (hh) {
      var hx2 = px(hh.x), hy = px(hh.y);
      ctx.globalAlpha = Math.max(0, Math.min(1, hh.life));
      ctx.fillRect(hx2, hy, 3, 3); ctx.fillRect(hx2 + 5, hy, 3, 3);
      ctx.fillRect(hx2, hy + 2, 8, 3); ctx.fillRect(hx2 + 2, hy + 5, 4, 2);
      ctx.globalAlpha = 1;
    });
  }

  function drawMonsterScene() {
    var mx = px(act.monster.x - camX);
    var bob = monster.dead ? 0 : Math.sin(runTime * 3) * 3;
    var my = px(GROUND - 44 + bob + (monster.dead ? monster.deadT * 70 : 0));
    ctx.globalAlpha = monster.dead ? Math.max(0, 1 - monster.deadT) : 1;
    // body — the Long-Distance Monster: signal-dead purple blob
    ctx.fillStyle = '#6d5590';
    ctx.fillRect(mx, my + 6, 46, 38);
    ctx.fillRect(mx + 4, my, 38, 10);
    ctx.fillStyle = '#57436f';
    ctx.fillRect(mx + 4, my + 34, 38, 10);
    // horns
    ctx.fillStyle = '#57436f';
    ctx.fillRect(mx + 4, my - 6, 6, 8); ctx.fillRect(mx + 36, my - 6, 6, 8);
    // angry eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx + 9, my + 10, 10, 8); ctx.fillRect(mx + 27, my + 10, 10, 8);
    ctx.fillStyle = '#c92a2a';
    ctx.fillRect(mx + 12, my + 12, 4, 4); ctx.fillRect(mx + 30, my + 12, 4, 4);
    // zigzag mouth
    ctx.fillStyle = '#2b2118';
    for (var z = 0; z < 5; z++) ctx.fillRect(mx + 10 + z * 6, my + 24 + (z % 2) * 3, 6, 3);
    // dead-signal antenna
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(mx + 22, my - 14, 3, 10);
    ctx.fillStyle = '#8d99ae';
    ctx.fillRect(mx + 27, my - 18, 3, 6); ctx.fillRect(mx + 31, my - 22, 3, 10);
    ctx.fillStyle = '#c92a2a';
    ctx.fillRect(mx + 26, my - 22, 2, 12); ctx.fillRect(mx + 34, my - 22, 2, 12); // red X-ish
    // hit flash
    if (monster.hitT > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillRect(mx, my - 6, 46, 50);
    }
    ctx.globalAlpha = 1;
    // hp pips
    if (!monster.dead) {
      for (var p = 0; p < monster.max; p++) {
        ctx.fillStyle = p < monster.hp ? '#e85d75' : 'rgba(255,255,255,.4)';
        ctx.fillRect(mx + 2 + p * 9, my - 32, 6, 6);
      }
      // name bubble
      ctx.font = '7px "Press Start 2P", monospace';
      var label = act.monster.name;
      var w = ctx.measureText(label).width + 14;
      var bx = Math.min(mx + 23 - w / 2, W - w - 4);
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.fillRect(bx, my - 58, w, 22);
      ctx.fillStyle = '#2b2118';
      ctx.fillText(label, bx + 7, my - 44);
    }
    // heart bullets
    ctx.fillStyle = '#e85d75';
    shots.forEach(function (sh) {
      var sx2 = px(sh.x), sy = px(sh.y);
      ctx.fillRect(sx2, sy, 3, 3); ctx.fillRect(sx2 + 5, sy, 3, 3);
      ctx.fillRect(sx2, sy + 2, 8, 3); ctx.fillRect(sx2 + 2, sy + 5, 4, 2);
    });
    // the shooter, standing their ground
    if (act.player === 'neha') drawNeha(PLAYER_X, GROUND - PH, false, 0);
    else drawMayank(PLAYER_X, GROUND - PH, false, false, 0);
  }

  function render() {
    renderSky();
    renderTrain();
    renderScenery();
    var cinematic = (mode === 'finale' || mode === 'monster' ||
                     (mode === 'clear' && finaleT > 0));
    if (!cinematic) {
      ctx.font = '7px "Press Start 2P", monospace';
      taunts.forEach(function (t) {
        var tx = px(t.x - camX);
        if (tx > -220 && tx < W + 40) {
          var w = ctx.measureText(t.text).width + 14;
          ctx.fillStyle = 'rgba(255,255,255,.92)';
          ctx.fillRect(tx, 180, w, 22);
          ctx.fillStyle = '#2b2118';
          ctx.fillText(t.text, tx + 7, 194);
        }
      });
    }
    renderGround();
    renderEnd();
    platforms.forEach(function (p) { window.ENT.drawPlatformExt(ctx, p, camX, runTime); });
    icicles.forEach(function (ic) { window.ENT.drawIcicle(ctx, ic, camX); });
    blocks.forEach(function (b) { window.ENT.drawBlock(ctx, b, camX, runTime); });
    items.forEach(function (it) { if (!it.hit) drawItem(it); });
    enemiesArr.forEach(function (e) { window.ENT.drawEnemy(ctx, e, camX, runTime); });
    drops.forEach(function (d) { window.ENT.drawDrop(ctx, d, camX); });

    if (mode === 'monster') { drawMonsterScene(); return; }
    if (mode === 'finale' || (mode === 'clear' && finaleT > 0)) { renderFinale(); return; }
    if (actIdx === 0 && mode === 'run' && runTime < 3 && camX < 600) {
      ctx.font = '8px "Press Start 2P", monospace';
      var hint = 'TAP = JUMP \u2191';
      var hw = ctx.measureText(hint).width + 16;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.fillRect(PLAYER_X - 8, 300, hw, 26);
      ctx.fillStyle = '#2b2118';
      ctx.fillText(hint, PLAYER_X, 317);
    }
    if (act.weather === 'rain') window.ENT.drawRain(ctx, runTime, W, H);
    var blinking = runTime < invincibleUntil && Math.floor(runTime * 12) % 2 === 0;
    if (!blinking && player) {
      if (act.player === 'neha') {
        drawNeha(PLAYER_X, player.y, player.onGround, player.frame);
      } else {
        drawMayank(PLAYER_X, player.y, false, player.onGround, player.frame);
      }
    }
  }

  /* ---------- loop ---------- */
  function loop(t) {
    rafId = requestAnimationFrame(loop);
    var dt;
    if (mode === 'run') {
      if (!lastT) lastT = t;
      acc += Math.min(0.1, (t - lastT) / 1000);
      lastT = t;
      while (acc >= STEP) { update(STEP); acc -= STEP; if (mode !== 'run') { acc = 0; break; } }
    } else if (mode === 'monster') {
      if (!lastT) lastT = t;
      dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      updateMonster(dt);
    } else if (mode === 'finale') {
      if (!lastT) lastT = t;
      dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      updateFinale(dt);
    } else {
      lastT = t;
    }
    render();
  }

  /* ---------- public ---------- */
  window.GAME = {
    begin: beginRun,
    /* test hooks — harmless in prod */
    _debug: function () {
      return { mode: mode, actIdx: actIdx, camX: camX, lives: lives, laddoos: laddoos,
               tokens: sessionTokens, ringGot: ringGot, playerY: player && player.y,
               finaleT: finaleT,
               monster: monster && { hp: monster.hp, dead: monster.dead }, kills: monstersKilled,
               hearts: store.hearts, props: store.props.slice(), onGround: player && player.onGround,
               onIce: onIce, supportKind: support === 'ground' ? 'ground' : (support && support.kind) || null,
               icicleStates: icicles.map(function (ic) { return ic.state; }),
               drops: drops.length, enemies: enemiesArr.filter(function (e) { return !e.dead; }).length,
               enemyXs: enemiesArr.map(function (e) { return { x: Math.round(e.x), kind: e.kind, dead: e.dead }; }),
               score: score(false) };
    },
    _warp: function (x) { camX = x; },
    _skip: function () { /* no cinematics left to skip */ },
    _freeze: function () { if (mode === 'run') mode = 'paused'; },
    _tick: function (ms) { // deterministic manual driver for tests (rAF-independent)
      var steps = Math.max(1, Math.round(ms / (1000 * STEP)));
      for (var i = 0; i < steps; i++) {
        if (mode === 'run') update(STEP);
        else if (mode === 'finale') updateFinale(STEP);
        else if (mode === 'monster') updateMonster(STEP);
        else break;
      }
      render();
      return mode;
    },
    _go: function () { if (mode === 'paused') { mode = 'run'; lastT = 0; hideOverlay(); } },
    _shoot: shoot,
    _jump: jump
  };
})();
