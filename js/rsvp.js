/* RSVP form: prefill from mwn.v1, save locally, edit-in-place.
   Captures ONLY: name, coming?, arrival day, +1 yes/no + their name. (v2.4)
   Firebase sync arrives in P3 — cloud.js will push state.rsvp from the same doc. */
(function () {
  'use strict';

  var state = window.MWN.load();

  var form = document.getElementById('rsvpForm');
  var nameEl = document.getElementById('name');
  var plusNameGroup = document.getElementById('plusNameGroup');
  var plusNameEl = document.getElementById('plusName');
  var detailsBlock = document.getElementById('detailsBlock');
  var savedBanner = document.getElementById('savedBanner');
  var toast = document.getElementById('toast');
  var rsvpModal = document.getElementById('rsvpModal');
  var rsvpSection = document.getElementById('rsvp');
  var rsvpOpen = document.querySelector('.inv-rsvp');
  var rsvpClose = document.getElementById('rsvpClose');
  var rsvpHead = rsvpModal.querySelector('.rsvp-dialog-head');
  var pendingOpen = location.hash === '#rsvp';
  var savedScroll = 0;

  function entryReady() {
    return !rsvpSection.inert && !document.body.classList.contains('env-locked') &&
      !document.documentElement.classList.contains('env-boot');
  }
  function openRsvp() {
    if (!entryReady()) { pendingOpen = true; return; }
    pendingOpen = false;
    if (rsvpModal.open) return;
    savedScroll = window.scrollY;
    document.body.style.setProperty('--rsvp-scroll-top', -savedScroll + 'px');
    document.body.classList.add('rsvp-open');
    rsvpModal.appendChild(toast); // validation messages must be in the dialog's top layer
    rsvpModal.showModal();
    rsvpOpen.setAttribute('aria-expanded', 'true');
    rsvpSection.scrollTop = 0;
    rsvpClose.focus({ preventScroll: true });
  }
  function closeRsvp() {
    pendingOpen = false;
    if (rsvpModal.open) rsvpModal.close();
  }
  rsvpOpen.addEventListener('click', openRsvp);
  rsvpClose.addEventListener('click', closeRsvp);
  document.getElementById('rsvpBack').addEventListener('click', closeRsvp);
  rsvpModal.addEventListener('cancel', function (e) {
    e.preventDefault();
    if (lbModal && !lbModal.hidden) closeBoard();
    else closeRsvp();
  });
  rsvpModal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || e.defaultPrevented) return;
    var controls = Array.prototype.filter.call(rsvpModal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]'), function (el) {
      return !el.disabled && el.tabIndex >= 0 && !el.closest('[inert]') && el.getClientRects().length;
    });
    var first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && (document.activeElement === first || controls.indexOf(document.activeElement) === -1)) {
      e.preventDefault(); if (last) last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || controls.indexOf(document.activeElement) === -1)) {
      e.preventDefault(); if (first) first.focus();
    }
  });
  rsvpModal.addEventListener('click', function (e) {
    if (e.target !== rsvpModal) return;
    var box = rsvpModal.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) closeRsvp();
  });
  rsvpModal.addEventListener('close', function () {
    if (lbModal && !lbModal.hidden) closeBoard();
    document.body.appendChild(toast);
    toast.classList.remove('show');
    document.body.classList.remove('rsvp-open');
    document.body.style.removeProperty('--rsvp-scroll-top');
    rsvpOpen.setAttribute('aria-expanded', 'false');
    if (location.hash === '#rsvp') history.replaceState(history.state, '', location.pathname + location.search);
    var scrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedScroll);
    document.documentElement.style.scrollBehavior = scrollBehavior;
    rsvpOpen.focus({ preventScroll: true });
  });
  function flushPendingOpen() {
    if (!entryReady()) return;
    entryObserver.disconnect();
    if (pendingOpen) openRsvp();
  }
  var entryObserver = new MutationObserver(flushPendingOpen);
  entryObserver.observe(rsvpSection, { attributes: true, attributeFilter: ['inert'] });
  entryObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  entryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('hashchange', function () {
    pendingOpen = location.hash === '#rsvp';
    if (pendingOpen) openRsvp();
    else closeRsvp();
  });
  flushPendingOpen();

  /* ---------- helpers ---------- */

  function radios(name) {
    return Array.prototype.slice.call(document.querySelectorAll('input[name="' + name + '"]'));
  }

  function radioValue(name) {
    var r = radios(name).filter(function (x) { return x.checked; })[0];
    return r ? r.value : null;
  }

  function setRadio(name, value) {
    radios(name).forEach(function (r) { r.checked = (r.value === value); });
    highlightChoices();
  }

  function highlightChoices() {
    Array.prototype.slice.call(document.querySelectorAll('.choice')).forEach(function (label) {
      var input = label.querySelector('input');
      label.classList.toggle('selected', !!(input && input.checked));
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  function updatePlusVisibility() {
    plusNameGroup.style.display = radioValue('plusOne') === 'yes' ? '' : 'none';
  }

  function updateDetailsVisibility() {
    var attending = radioValue('attending');
    detailsBlock.style.display = attending === 'no' ? 'none' : '';
    var btn = document.getElementById('submitBtn');
    if (btn) btn.textContent = attending === 'no' ? 'Send my response' : 'Submit';
  }

  /* ---------- prefill ---------- */

  nameEl.value = state.name || '';
  window.addEventListener('mwn-synced', function () {
    if (savedBanner.classList.contains('show') && savedBanner.textContent.indexOf('sent') === -1) {
      savedBanner.textContent = savedBanner.textContent.replace('saved on this phone - it will sync automatically', 'sent to Neha & Mayank');
      if (savedBanner.textContent.indexOf('\u2713') === -1) savedBanner.textContent += ' \u00B7 sent \u2713';
    }
  });
  var lbRows = document.getElementById('lbRows');
  if (lbRows) {
    if (state.scores && state.scores.length) {
      state.scores.slice(0, 5).forEach(function (e, i) {
        var row = document.createElement('p');
        row.style.cssText = 'font-size:.95rem;margin:.3rem 0;letter-spacing:.02em';
        row.innerHTML = (i + 1) + '. <b>' + e.n.replace(/[<>&]/g, '') + '</b> \u00B7 <span style="color:#ffd23f">' + e.s + '</span>';
        lbRows.appendChild(row);
      });
    } else {
      var empty = document.createElement('p');
      empty.className = 'muted';
      empty.style.cssText = 'font-size:.88rem;line-height:1.6';
      empty.textContent = 'No runs on this phone yet - the board is yours for the taking.';
      lbRows.appendChild(empty);
    }
  }
  var greet = document.getElementById('greet');
  if (greet && state.name) {
    greet.textContent = 'Hi ' + state.name + '!';
    greet.hidden = false;
  }
  var editBtn = document.getElementById('editRsvp');

  /* RSVP'd: collapse the form into a summary + edit button. */
  function showSummary() {
    var returnToSummary = rsvpModal.open;
    savedBanner.textContent = state.rsvp.attending
      ? '\u2713 You\u2019ve RSVP\u2019d - ' + (state.rsvp.partySize > 1 ? 'you + 1, ' : '') + 'arriving on the ' + (state.rsvp.arrivalDay === '2' ? '2nd' : '3rd') + '. See you on the hill!'
      : '\u2713 Your response is saved. Changed your mind? The hill awaits.';
    savedBanner.classList.add('show');
    form.hidden = true;
    editBtn.hidden = false;
    document.body.classList.remove('editing');
    if (returnToSummary) {
      savedBanner.setAttribute('tabindex', '-1');
      savedBanner.focus({ preventScroll: true });
      rsvpSection.scrollTop = 0;
    }
  }

  if (state.rsvp) {
    setRadio('attending', state.rsvp.attending ? 'yes' : 'no');
    setRadio('arrivalDay', state.rsvp.arrivalDay);
    if (state.rsvp.partySize > 1) {
      setRadio('plusOne', 'yes');
      plusNameEl.value = (state.rsvp.partyNames && state.rsvp.partyNames[0]) || '';
    }
    showSummary();
  }

  editBtn.addEventListener('click', function () {
    savedBanner.classList.remove('show');
    editBtn.hidden = true;
    form.hidden = false;
    document.body.classList.add('editing');
    nameEl.focus();
  });
  updatePlusVisibility();
  updateDetailsVisibility();
  highlightChoices();

  /* ---------- events ---------- */

  radios('attending').forEach(function (r) {
    r.addEventListener('change', function () { updateDetailsVisibility(); highlightChoices(); });
  });
  radios('arrivalDay').forEach(function (r) {
    r.addEventListener('change', highlightChoices);
  });
  radios('plusOne').forEach(function (r) {
    r.addEventListener('change', function () { updatePlusVisibility(); highlightChoices(); });
  });

  /* ---------- leaderboard modal ---------- */

  var lbModal = document.getElementById('lbModal');
  var lbOpen = document.getElementById('lbOpen');
  var lbClose = document.getElementById('lbClose');
  function closeBoard() {
    if (!lbModal || lbModal.hidden) return;
    lbModal.hidden = true;
    rsvpSection.inert = false;
    rsvpHead.inert = false;
    try { lbOpen.focus({ preventScroll: true }); } catch (e) {}
  }
  if (lbModal && lbOpen) {
    rsvpModal.appendChild(lbModal); // nested board stays above the native RSVP dialog
    lbOpen.addEventListener('click', function () {
      lbModal.hidden = false;
      rsvpSection.inert = true;
      rsvpHead.inert = true;
      try { lbClose.focus({ preventScroll: true }); } catch (e) {}
      /* the leaderboard tempts guests toward the game — warm up that hop */
      if (!document.getElementById('pfGame') && !(navigator.connection && navigator.connection.saveData)) {
        var l = document.createElement('link');
        l.id = 'pfGame'; l.rel = 'prefetch'; l.href = 'game.html';
        document.head.appendChild(l);
      }
    });
    lbClose.addEventListener('click', closeBoard);
    lbModal.addEventListener('click', function (e) { if (e.target === lbModal) closeBoard(); });
    lbModal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeBoard(); return; }
      if (e.key !== 'Tab' || lbModal.hidden) return;
      var focusable = lbModal.querySelectorAll('button, a[href]');
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = nameEl.value.trim();
    if (!name) {
      nameEl.focus();
      showToast('Tell us who you are first \u{1F60A}');
      return;
    }
    var attending = radioValue('attending');
    if (!attending) {
      showToast('Coming or not? We need to count the laddoos.');
      return;
    }
    if (attending === 'yes' && !radioValue('arrivalDay')) {
      showToast('Pick an arrival day - 2nd or 3rd?');
      return;
    }
    var plusOne = attending === 'yes' && radioValue('plusOne') === 'yes';
    var plusName = plusNameEl.value.trim();
    if (plusOne && !plusName) {
      plusNameEl.focus();
      showToast('What\u2019s your +1\u2019s name?');
      return;
    }

    state.name = name.slice(0, 40);
    state.rsvp = {
      attending: attending === 'yes',
      arrivalDay: radioValue('arrivalDay') || '3',
      partySize: plusOne ? 2 : 1,
      partyNames: plusOne ? [plusName.slice(0, 40)] : []
    };
    state = window.MWN.save(window.MWN.sanitizeState(state));

    showSummary();
    savedBanner.textContent = state.rsvp.attending
      ? '\u2713 RSVP saved - it will sync automatically. See you on the ' + (state.rsvp.arrivalDay === '2' ? '2nd' : '3rd') + '!'
      : '\u2713 Saved. You will be missed (and mentioned at the bonfire).';
    showToast(state.rsvp.attending ? 'Spot claimed \u{1F525}' : 'Saved \u{1F494}');
    if (window.CLOUD) window.CLOUD.schedulePush();
  });
})();
