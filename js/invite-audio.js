/* Invitation soundtrack. Attempt autoplay on page load, then fade in.
   Browsers that require a gesture fall back to the same fade on button tap.
   The game owns its separate MUSIC controller. */
(function () {
  'use strict';

  var audio = document.getElementById('inviteAudio');
  var button = document.getElementById('inviteSound');
  if (!audio || !button) return;

  var preferenceKey = 'mwn.inviteMusicMuted';
  var muted = false;
  var requested = false;
  var started = false;
  var attempt = 0;
  var fadeFrame = 0;
  var targetVolume = 0.4;
  var fadeDuration = 2400;
  var audioContext = null;
  var gainNode = null;
  var autoReady = true;
  var autoAttempted = false;
  try { muted = localStorage.getItem(preferenceKey) === '1'; } catch (e) {}
  try { audio.volume = 0; } catch (e) {}

  // iOS ignores HTMLMediaElement.volume. Route through a gain node there so
  // the button-triggered fallback still fades instead of starting abruptly.
  if (audio.volume > 0) {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContext = new AudioContext();
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        audioContext.createMediaElementSource(audio).connect(gainNode).connect(audioContext.destination);
      }
    } catch (e) {
      audioContext = null;
      gainNode = null;
    }
  }

  function render() {
    var playing = requested && started && !audio.paused && !audio.error;
    button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    button.title = (playing ? 'Mute' : 'Play') + ' invitation music — Darkhaast';
  }

  function pause() {
    requested = false;
    started = false;
    attempt++;
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
    audio.pause();
    if (gainNode) {
      try { gainNode.gain.setValueAtTime(0, audioContext.currentTime); } catch (e) {}
    }
    try { audio.volume = 0; } catch (e) {}
    render();
  }

  function fadeIn(currentAttempt) {
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    if (gainNode) {
      try {
        var now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration / 1000);
      } catch (e) {}
      return;
    }
    var started = performance.now();
    function step(now) {
      if (currentAttempt !== attempt || !requested || audio.paused) return;
      var progress = Math.min(1, (now - started) / fadeDuration);
      try { audio.volume = targetVolume * progress; } catch (e) {}
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else fadeFrame = 0;
    }
    fadeFrame = requestAnimationFrame(step);
  }

  function play() {
    if (requested) return Promise.resolve(!audio.paused);
    requested = true;
    var currentAttempt = ++attempt;
    function failed() {
      if (currentAttempt === attempt) pause();
      return false;
    }
    try {
      if (audio.error) audio.load(); // a fresh tap may retry a failed download
      if (!gainNode) audio.volume = 0;
      var outputReady = audioContext && audioContext.state !== 'running'
        ? audioContext.resume()
        : Promise.resolve();
      var result = audio.play();
      var mediaReady = result && typeof result.then === 'function' ? result : Promise.resolve();
      return Promise.all([mediaReady, outputReady]).then(function () {
        if (currentAttempt !== attempt || !requested ||
            (audioContext && audioContext.state !== 'running')) return failed();
        started = true;
        fadeIn(currentAttempt);
        render();
        return true;
      }, failed);
    } catch (e) { return Promise.resolve(failed()); }
  }

  function remember(value) {
    muted = value;
    try { localStorage.setItem(preferenceKey, value ? '1' : '0'); } catch (e) {}
  }

  button.addEventListener('click', function () {
    try { button.focus({ preventScroll: true }); } catch (e) {}
    if (started && !audio.paused) {
      remember(true);
      pause();
    } else {
      remember(false);
      if (requested) pause(); // replace a pending autoplay attempt in this gesture
      play();
    }
  });

  // A cancelled pending play must never restart after muting or navigation.
  function playbackRequested() {
    if (!requested) audio.pause();
    render();
  }
  function playbackStarted() {
    if (!requested) audio.pause();
    else if (!audioContext || audioContext.state === 'running') started = true;
    render();
  }
  audio.addEventListener('play', playbackRequested);
  audio.addEventListener('playing', playbackStarted);
  audio.addEventListener('pause', function () {
    if (audio.paused) { requested = false; started = false; attempt++; }
    render();
  });
  audio.addEventListener('error', pause);

  // Stop on backgrounding/navigation, including bfcache. Resume only through
  // the music button, not an automatic page event.
  function attemptAutoPlay() {
    if (!autoReady || autoAttempted || document.hidden) return;
    autoAttempted = true;
    window.INVITE_AUDIO.open();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause();
    else attemptAutoPlay();
  });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', render);

  window.INVITE_AUDIO = {
    open: function () {
      if (muted) { button.hidden = false; render(); return Promise.resolve(false); }
      var revealTimer = setTimeout(function () { button.hidden = false; render(); }, 1200);
      return play().then(function (playing) {
        clearTimeout(revealTimer);
        button.hidden = false;
        render();
        return playing;
      });
    }
  };
  render();
  attemptAutoPlay();
})();
