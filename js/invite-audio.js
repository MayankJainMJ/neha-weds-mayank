/* Invitation soundtrack. Attempt autoplay on page load, then fade in.
   Browsers that require a gesture fall back to the same fade on seal tap.
   The game owns its separate MUSIC controller. */
(function () {
  'use strict';

  var audio = document.getElementById('inviteAudio');
  if (!audio) return;

  var hasPlayed = false;
  var resumeNeeded = false;
  var state = 'pending';
  var waitTimer = 0;
  var requested = false;
  var started = false;
  var attempt = 0;
  var fadeFrame = 0;
  var targetVolume = 0.4;
  var fadeDuration = 2400;
  var audioContext = null;
  var gainNode = null;
  var autoAttempted = false;
  try { audio.volume = 0; } catch (e) {}

  // iOS ignores HTMLMediaElement.volume. Route through a gain node there so
  // the seal-triggered fallback still fades instead of starting abruptly.
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
    window.dispatchEvent(new CustomEvent('invite-audio-state', { detail: state }));
  }

  function pause(nextState) {
    clearTimeout(waitTimer);
    state = typeof nextState === 'string' ? nextState : 'paused';
    requested = false;
    started = false;
    attempt++;
    if (fadeFrame) cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
    audio.pause();
    if (gainNode) {
      try {
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      } catch (e) {}
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
    state = 'pending';
    var currentAttempt = ++attempt;
    render();
    clearTimeout(waitTimer);
    waitTimer = setTimeout(function () {
      if (currentAttempt === attempt && !started) {
        state = 'blocked';
        render();
      }
    }, 1200);
    function failed(error) {
      if (currentAttempt === attempt) pause(error && error.name === 'NotAllowedError' ? 'blocked' : 'error');
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
        if (currentAttempt !== attempt || !requested || audio.paused ||
            (audioContext && audioContext.state !== 'running')) return failed();
        started = true;
        hasPlayed = true;
        resumeNeeded = false;
        clearTimeout(waitTimer);
        state = 'playing';
        fadeIn(currentAttempt);
        render();
        return true;
      }, failed);
    } catch (e) { return Promise.resolve(failed()); }
  }

  function retry() {
    if (started && !audio.paused) return Promise.resolve(true);
    if (requested) pause(); // replace a pending autoplay attempt in this gesture
    return play();
  }

  // A cancelled pending play must never restart after backgrounding/navigation.
  function playbackRequested() {
    if (!requested) audio.pause();
    render();
  }
  function playbackStarted() {
    if (!requested) audio.pause();
    // Only the play + AudioContext promises together confirm output readiness.
    render();
  }
  audio.addEventListener('play', playbackRequested);
  audio.addEventListener('playing', playbackStarted);
  audio.addEventListener('pause', function () {
    if (audio.paused) {
      requested = false; started = false; attempt++;
      clearTimeout(waitTimer);
      if (state === 'playing' || state === 'pending') state = 'paused';
    }
    render();
  });
  audio.addEventListener('error', function () { pause('error'); });

  // Never play in a hidden page. With no separate music control, restore an
  // already-started soundtrack on return; a real page tap can unlock a blocked
  // resume after entry. Before entry, the seal remains the only retry action.
  function suspend() {
    if (hasPlayed) resumeNeeded = true;
    pause();
  }
  function attemptAutoPlay() {
    if (document.hidden) return;
    if (autoAttempted) {
      if (resumeNeeded && !requested) play();
      return;
    }
    autoAttempted = true;
    play();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) suspend();
    else attemptAutoPlay();
  });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', attemptAutoPlay);
  document.addEventListener('click', function (event) {
    if (event.isTrusted && resumeNeeded && !document.hidden &&
        !document.getElementById('envOv')) retry();
  }, true);

  window.INVITE_AUDIO = {
    getState: function () { return state; },
    open: retry
  };
  render();
  attemptAutoPlay();
})();
