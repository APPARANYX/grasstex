/* Local-listener game-audio mix. Presentation only; no soldier or simulation state.
   Source clips retain their calibrated masters and one-shot transients. We apply
   category compensation once, before Babylon spatial attenuation, and route
   the main SoundTrack through a mild output compressor where Web Audio permits.
   User sliders represent percentages of this new, louder balanced mix.
   ?audioMix=legacy is an exact unboosted comparison and does not erase settings. */
(function (root) {
  'use strict';
  if (typeof window === 'undefined' || root.BattleAudioMix) return;

  var KEY = 'grasstex.audioMix.v1';
  var LIMIT = 150;
  var MIX = { weapon: 1.8, tail: 1.35, voice: 1.65, foley: 1.25, combat: 1.3 };
  var CATEGORIES = { weapon: 'weapons', tail: 'weapons', voice: 'voices', foley: 'effects', combat: 'effects' };
  var legacy = typeof location !== 'undefined' && /(?:^|[?&])audioMix=legacy(?:&|$)/.test(location.search || '');
  var defaults = { master: 100, weapons: 100, voices: 100, effects: 100 };
  var settings = {};
  var sceneLimiter = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var pending = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var stats = { routed: 0, unavailable: 0, limited: 0 };
  function bounded(v) {
    v = Number(v);
    return Number.isFinite(v) ? Math.max(0, Math.min(LIMIT, Math.round(v / 5) * 5)) : 100;
  }
  function snapshot() {
    return {
      master: settings.master,
      weapons: settings.weapons,
      voices: settings.voices,
      effects: settings.effects
    };
  }
  function save() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(snapshot()));
    } catch (_) {}
  }
  function load() {
    var stored = null;
    try {
      if (typeof localStorage !== 'undefined') stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (_) {}
    Object.keys(defaults).forEach(function (key) {
      settings[key] = stored && Object.prototype.hasOwnProperty.call(stored, key) ? bounded(stored[key]) : defaults[key];
    });
  }
  function set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) return snapshot();
    settings[key] = bounded(value);
    save();
    return snapshot();
  }
  function reset() {
    Object.keys(defaults).forEach(function (key) {
      settings[key] = defaults[key];
    });
    save();
    return snapshot();
  }
  function gain(kind, raw, scene) {
    if (scene) ensureLimiter(scene);
    var base = Number(raw);
    if (!Number.isFinite(base) || base <= 0) return 0;
    if (legacy) return base;
    var category = CATEGORIES[kind] || 'effects';
    return Math.min(1, base * (MIX[kind] || 1) * settings.master / 100 * settings[category] / 100);
  }
  /* The SoundTrack bus already has a direct connection to masterGain in
     Babylon 9. Disconnect only that connection and reinsert one compressor
     into the same route; leave each spatial Sound's graph intact. */
  function install(scene) {
    if (!scene || !sceneLimiter || legacy) return false;
    if (sceneLimiter.has(scene)) return true;
    try {
      var ae = root.BABYLON && root.BABYLON.Engine && root.BABYLON.Engine.audioEngine,
        ctx = ae && ae.audioContext,
        master = ae && ae.masterGain,
        track = scene.mainSoundTrack && scene.mainSoundTrack._outputAudioNode;
      if (!ctx || !master || !track || typeof track.disconnect !== 'function' || !ctx.createDynamicsCompressor) return false;
      var compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 12;
      compressor.ratio.value = 2.5;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.18;
      compressor.connect(master);
      try {
        track.disconnect(master);
        track.connect(compressor);
      } catch (err) {
        try { track.connect(master); } catch (_) {}
        try { compressor.disconnect(); } catch (_) {}
        throw err;
      }
      sceneLimiter.set(scene, compressor);
      stats.routed++;
      return true;
    } catch (_) {
      stats.unavailable++;
      return false;
    }
  }
  function ensureLimiter(scene) {
    if (!scene || !sceneLimiter || legacy || sceneLimiter.has(scene) || pending.has(scene)) return;
    if (install(scene)) return;
    if (typeof setTimeout !== 'function') return;
    var attempts = 0;
    pending.set(scene, true);
    function retry() {
      if (install(scene) || ++attempts >= 20 || (typeof scene.isDisposed === 'function' && scene.isDisposed())) {
        pending.delete(scene);
        return;
      }
      setTimeout(retry, 250);
    }
    setTimeout(retry, 250);
  }

  load();
  root.BattleAudioMix = {
    gain: gain,
    get: snapshot,
    set: set,
    reset: reset,
    ensureLimiter: ensureLimiter,
    stats: stats,
    legacy: !!legacy,
    presets: MIX
  };
})(typeof window !== 'undefined' ? window : globalThis);
