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
      savedBanner.textContent = savedBanner.textContent.replace('saved on this phone \u2014 it will sync automatically', 'sent to Neha & Mayank');
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
      empty.textContent = 'No runs on this phone yet \u2014 the board is yours for the taking.';
      lbRows.appendChild(empty);
    }
  }
  var greet = document.getElementById('greet');
  if (greet && state.name) {
    greet.textContent = 'Hi ' + state.name + '!';
    greet.hidden = false;
  }
  var editBtn = document.getElementById('editRsvp');

  /* RSVP'd: collapse the form into summary + edit button (page stays one screen) */
  function showSummary() {
    savedBanner.textContent = state.rsvp.attending
      ? '\u2713 You\u2019ve RSVP\u2019d \u2014 ' + (state.rsvp.partySize > 1 ? 'you + 1, ' : '') + 'arriving on the ' + (state.rsvp.arrivalDay === '2' ? '2nd' : '3rd') + '. See you on the hill!'
      : '\u2713 Your response is saved. Changed your mind? The hill awaits.';
    savedBanner.classList.add('show');
    form.hidden = true;
    editBtn.hidden = false;
    document.body.classList.remove('editing');
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
  if (lbModal && lbOpen) {
    lbOpen.addEventListener('click', function () { lbModal.hidden = false; });
    lbClose.addEventListener('click', function () { lbModal.hidden = true; });
    lbModal.addEventListener('click', function (e) { if (e.target === lbModal) lbModal.hidden = true; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lbModal.hidden = true; });
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
      showToast('Pick an arrival day \u2014 2nd or 3rd?');
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
      ? '\u2713 RSVP saved \u2014 it will sync automatically. See you on the ' + (state.rsvp.arrivalDay === '2' ? '2nd' : '3rd') + '!'
      : '\u2713 Saved. You will be missed (and mentioned at the bonfire).';
    showToast(state.rsvp.attending ? 'Spot claimed \u{1F525}' : 'Saved \u{1F494}');
    if (window.CLOUD) window.CLOUD.schedulePush();
  });
})();
