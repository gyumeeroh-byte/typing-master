/* ============================================================
   타이핑 마스터 — 효과음 (Web Audio API, 외부 파일 없음)
   ============================================================ */
(function () {
  'use strict';

  var ctx = null;
  var on = true;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!on) return;
    var c = ac();
    if (!c) return;
    var t0 = c.currentTime + (delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  window.Sfx = {
    /* 첫 사용자 동작에서 오디오 컨텍스트를 깨운다 */
    unlock: function () { ac(); },
    setEnabled: function (v) { on = !!v; },
    isEnabled: function () { return on; },

    key:   function () { tone(880 + Math.random() * 90, 0.035, 'triangle', 0.035); },
    error: function () { tone(150, 0.16, 'sawtooth', 0.075); },
    word:  function () { tone(660, 0.09, 'sine', 0.07); tone(990, 0.13, 'sine', 0.06, 0.07); },
    level: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'sine', 0.075, i * 0.075); }); },
    life:  function () { tone(300, 0.13, 'square', 0.06); tone(180, 0.22, 'square', 0.06, 0.1); },
    over:  function () { [520, 420, 330, 240].forEach(function (f, i) { tone(f, 0.26, 'triangle', 0.08, i * 0.14); }); },
    click: function () { tone(520, 0.05, 'sine', 0.045); }
  };
})();
