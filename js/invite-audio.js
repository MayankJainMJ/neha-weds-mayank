/* Invitation soundtrack. Play is called in the seal/button gesture, never
   during page load. The game owns its separate MUSIC controller. */
(function () {
  'use strict';

  var audio = document.getElementById('inviteAudio');
  var button = document.getElementById('inviteSound');
  if (!audio || !button) return;

  var preferenceKey = 'mwn.inviteMusicMuted';
  var muted = false;
  var requested = false;
  var attempt = 0;
  try { muted = localStorage.getItem(preferenceKey) === '1'; } catch (e) {}
  try { audio.volume = 0.4; } catch (e) {} // device volume still applies

  function render() {
    var playing = requested && !audio.paused && !audio.error;
    button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    button.title = (requested ? 'Mute' : 'Play') + ' invitation music — Darkhaast';
  }

  function pause() {
    requested = false;
    attempt++;
    audio.pause();
    render();
  }

  function play() {
    if (requested) return;
    requested = true;
    var currentAttempt = ++attempt;
    function failed() {
      if (currentAttempt === attempt) pause();
    }
    try {
      // Must remain synchronous: Safari requires the opening/button gesture.
      if (audio.error) audio.load(); // a fresh tap may retry a failed download
      var result = audio.play();
      if (result && typeof result.catch === 'function') result.catch(failed);
    } catch (e) { failed(); }
    render();
  }

  function remember(value) {
    muted = value;
    try { localStorage.setItem(preferenceKey, value ? '1' : '0'); } catch (e) {}
  }

  button.addEventListener('click', function () {
    if (requested || !audio.paused) {
      remember(true);
      pause();
    } else {
      remember(false);
      play();
    }
  });

  // A cancelled pending play must never restart after muting or navigation.
  function playbackStarted() {
    if (!requested) audio.pause();
    render();
  }
  audio.addEventListener('play', playbackStarted);
  audio.addEventListener('playing', playbackStarted);
  audio.addEventListener('pause', function () {
    if (audio.paused) { requested = false; attempt++; }
    render();
  });
  audio.addEventListener('error', pause);

  // Stop on backgrounding/navigation, including bfcache. Resume only through
  // the music button (or a fresh envelope tap), not an automatic page event.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause();
  });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', render);

  window.INVITE_AUDIO = {
    open: function () { if (!muted) play(); }
  };
  button.hidden = false;
  render();
})();
