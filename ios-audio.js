// iPhone/iPad sound fix for the web build (added by build-web.sh, loaded before the engine).
// 1. Play sound even when the ring/silent switch is on (Safari 16.4+ audioSession).
// 2. iOS only unlocks Web Audio on touchend/click, not touchstart, and suspends it
//    when the app goes to the background. Keep every AudioContext, and resume it
//    (plus play one silent sample) on every tap until it is running.
(function () {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  var ctxs = window.__kindredAudio = [];
  var Orig = window.AudioContext || window.webkitAudioContext;
  if (!Orig) return;
  function Wrapped(opts) {
    var c = opts === undefined ? new Orig() : new Orig(opts);
    ctxs.push(c);
    return c;
  }
  Wrapped.prototype = Orig.prototype;
  try { Object.setPrototypeOf(Wrapped, Orig); } catch (e) {}
  window.AudioContext = Wrapped;
  if (window.webkitAudioContext) window.webkitAudioContext = Wrapped;

  function unlock() {
    for (var i = 0; i < ctxs.length; i++) {
      var c = ctxs[i];
      if (c.state === 'running') continue;
      try {
        c.resume();
        var b = c.createBuffer(1, 1, 22050);
        var s = c.createBufferSource();
        s.buffer = b; s.connect(c.destination); s.start(0);
      } catch (e) {}
    }
  }
  ['touchend', 'click', 'pointerup', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, unlock, true);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) unlock();
  });
})();
