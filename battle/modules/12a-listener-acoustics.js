/* Listener-only battlefield acoustics.
   Presentation only: never touches BattleSim.random, soldier intent or command reception.
   One camera listener per client; each playing Babylon Sound is processed at most 5Hz.
   ?acoustics=off|standard|high (standard is the shipping default).
   The WebAudio BiquadFilter is inserted between the legacy Babylon Sound's spatial
   panner and gain node only when that graph is available. Otherwise attenuation is
   still applied and sound playback never depends on private Babylon internals. */
(function (root) {
  'use strict';
  if (typeof window === 'undefined' || typeof BABYLON === 'undefined' || root.BattleListenerAcoustics) return;

  var match = /(?:^|[?&])acoustics=(off|standard|high)(?:&|$)/.exec(
    typeof location !== 'undefined' ? location.search || '' : ''
  );
  var quality = match ? match[1] : 'standard';
  var sim = null,
    entries = [],
    running = false,
    wet = null,
    serial = 0;
  var TICK_MS = quality === 'high' ? 125 : 200;
  var MAX_ACTIVE = quality === 'high' ? 36 : 24;
  var stats = { prepared: 0, occluded: 0, filtered: 0, degraded: 0, sampled: 0 };
  function now() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  function finite(v, fallback) {
    return isFinite(+v) ? +v : fallback;
  }
  function point(p) {
    if (!p) return null;
    return { x: finite(p.x, 0), y: finite(p.y, 0), z: finite(p.z, 0) };
  }
  function distance(a, b) {
    var x = a.x - b.x,
      y = a.y - b.y,
      z = a.z - b.z;
    return Math.sqrt(x * x + y * y + z * z);
  }
  function listener(scene) {
    var cam = scene && scene.activeCamera,
      p = cam && (cam.globalPosition || cam.position);
    return point(p);
  }
  function cap(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function terrainObstructed(a, b) {
    if (!sim || typeof sim.heightAt !== 'function') return false;
    for (var i = 1; i <= 5; i++) {
      var t = i / 6,
        x = a.x + (b.x - a.x) * t,
        z = a.z + (b.z - a.z) * t;
      if (sim.heightAt(x, z) > a.y + (b.y - a.y) * t + 0.55) return true;
    }
    return false;
  }
  function obstruction(a, b, d) {
    if (!sim || d < 3 || d > 240) return 0;
    var terrain = terrainObstructed(a, b);
    var objects = false;
    try {
      objects = !!(
        root.BattleObstacleField &&
        root.BattleObstacleField.sightBlocked &&
        root.BattleObstacleField.sightBlocked(sim.obstacles, a, b)
      );
    } catch (_) {}
    return terrain ? (objects ? 1 : 0.8) : objects ? 0.5 : 0;
  }
  function nearBuilding(p) {
    var sc = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    var buildings = sc && sc.buildings;
    if (!buildings) return false;
    // Only the first enclosing/nearby structure is relevant to the inexpensive wet send.
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i],
        dx = p.x - finite(b.x, 0),
        dz = p.z - finite(b.z, 0);
      var angle = finite(b.rotation, finite(b.rot, 0));
      var co = Math.cos(angle),
        si = Math.sin(angle);
      var lx = dx * co + dz * si,
        lz = -dx * si + dz * co;
      if (Math.abs(lx) < finite(b.w, 10) / 2 + 3 && Math.abs(lz) < finite(b.d, 10) / 2 + 3) return true;
    }
    return false;
  }
  function makeWet(ctx, trackNode) {
    if (wet && wet.ctx === ctx) return wet;
    if (!ctx || !ctx.createConvolver || !ctx.createGain || !ctx.createBuffer) return null;
    try {
      var convolver = ctx.createConvolver(),
        output = ctx.createGain();
      var length = Math.max(128, Math.floor(ctx.sampleRate * 0.23));
      var impulse = ctx.createBuffer(2, length, ctx.sampleRate);
      for (var channel = 0; channel < 2; channel++) {
        var data = impulse.getChannelData(channel);
        for (var j = 0; j < length; j++) {
          // Deterministic sparse reflections, no combat RNG and no expensive convolution setup per shot.
          var k = Math.sin((j + 1) * (channel ? 12.9898 : 78.233)) * 43758.5453;
          var noise = (k - Math.floor(k)) * 2 - 1;
          data[j] = noise * Math.pow(1 - j / length, 3) * 0.19;
        }
      }
      convolver.buffer = impulse;
      output.gain.value = 0.23;
      convolver.connect(output);
      var ae = BABYLON.Engine && BABYLON.Engine.audioEngine;
      output.connect(trackNode || (ae && ae.masterGain) || ctx.destination);
      wet = { ctx: ctx, input: convolver };
    } catch (_) {
      wet = null;
    }
    return wet;
  }
  function filterFor(e) {
    if (e.filter || e.failedFilter || quality === 'off') return;
    var s = e.sound,
      gain = null;
    try {
      gain = s && (typeof s.getSoundGain === 'function' ? s.getSoundGain() : s._soundGain);
    } catch (_) {}
    var panner = s && s._soundPanner,
      ctx = gain && gain.context;
    // Babylon 9.27 Sound adapts AudioV2: its output is the gain node returned
    // by getSoundGain(), and the original destination is its SoundTrack bus.
    var scene = s && s._scene,
      track =
        scene &&
        (s.soundTrackId >= 0 && scene.soundTracks ? scene.soundTracks[s.soundTrackId] : scene.mainSoundTrack),
      trackNode = track && track._outputAudioNode,
      v2 = !!(s && s._soundV2 && trackNode && typeof s.connectToSoundTrackAudioNode === 'function');
    // A pooled Sound survives battle restarts. Reuse the existing nodes rather
    // than inserting another filter every time its acoustic record is recreated.
    if (s && s._battleAcousticFilter) {
      e.filter = s._battleAcousticFilter;
      e.send = s._battleAcousticSend || null;
      return;
    }
    if (!ctx || !ctx.createBiquadFilter) return;
    if (!v2 && (!panner || typeof panner.disconnect !== 'function')) {
      e.failedFilter = true;
      stats.degraded++;
      return;
    }
    var filter = null,
      switched = false;
    try {
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 20000;
      if (v2) {
        // Public rerouting API keeps Babylon's bookkeeping intact. The filter
        // returns to exactly the same SoundTrack bus used before it was inserted.
        filter.connect(trackNode);
        s.connectToSoundTrackAudioNode(filter);
      } else {
        // Legacy graph, if present: source -> spatial panner -> gain.
        panner.disconnect(gain);
        panner.connect(filter);
        filter.connect(gain);
      }
      switched = true;
      e.filter = filter;
      s._battleAcousticFilter = filter;
      var bus = makeWet(ctx, v2 ? trackNode : null);
      if (bus && ctx.createGain) {
        e.send = ctx.createGain();
        e.send.gain.value = 0;
        filter.connect(e.send);
        e.send.connect(bus.input);
        s._battleAcousticSend = e.send;
      }
      stats.filtered++;
    } catch (_) {
      try {
        if (switched && v2) s.connectToSoundTrackAudioNode(trackNode);
        else if (switched) {
          panner.disconnect(filter);
          panner.connect(gain);
        }
      } catch (_) {}
      try {
        if (filter) filter.disconnect();
      } catch (_) {}
      s._battleAcousticFilter = null;
      s._battleAcousticSend = null;
      e.filter = null;
      e.send = null;
      e.failedFilter = true;
      stats.degraded++;
    }
  }
  function sample(e) {
    if (!e || !e.sound || !e.scene) return;
    var p = point(typeof e.source === 'function' ? e.source() : e.source);
    var L = listener(e.scene);
    if (!p || !L) return;
    var d = distance(p, L),
      obstructionAmount = obstruction(p, L, d);
    var distant = cap((d - 12) / 340, 0, 1);
    var isVoice = e.kind === 'voice',
      isTail = e.kind === 'tail';
    var hz = (isVoice ? 14000 : 19000) * (1 - 0.8 * distant);
    hz *= 1 - (isVoice ? 0.77 : 0.68) * obstructionAmount;
    hz = cap(hz, isVoice ? 550 : 900, 20000);
    var gain = e.gain * (1 - (isVoice ? 0.62 : 0.47) * obstructionAmount);
    stats.sampled++;
    if (obstructionAmount > 0) stats.occluded++;
    filterFor(e);
    try {
      if (e.sound.setVolume) e.sound.setVolume(gain);
      if (e.filter) e.filter.frequency.setTargetAtTime(hz, e.filter.context.currentTime, 0.045);
      if (e.send) {
        var indoor = nearBuilding(p) || nearBuilding(L);
        var amount = indoor
          ? quality === 'high'
            ? 0.28
            : 0.12
          : isTail
            ? 0.045
            : quality === 'high'
              ? 0.065
              : 0.025;
        e.send.gain.setTargetAtTime(amount, e.send.context.currentTime, 0.06);
      }
    } catch (_) {}
  }
  function tick() {
    running = false;
    var t = now(),
      remain = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.until <= t) {
        if (e.send) {
          try {
            e.send.gain.value = 0;
          } catch (_) {}
        }
        continue;
      }
      // 5Hz standard / 8Hz high; no per-frame traversal or per-projectile raycast.
      sample(e);
      remain.push(e);
    }
    entries = remain;
    if (entries.length) wake();
  }
  function wake() {
    if (running) return;
    running = true;
    setTimeout(tick, TICK_MS);
  }
  function prepare(sound, source, kind, baseGain, scene) {
    if (quality === 'off' || !sound || !scene) return false;
    var e = null;
    for (var i = 0; i < entries.length; i++)
      if (entries[i].sound === sound) {
        e = entries[i];
        break;
      }
    if (!e) {
      if (entries.length >= MAX_ACTIVE) {
        // An already-filtered pooled Sound may be replayed after its slot expired.
        // Restore its dry frequency and mute its wet send rather than leaving stale occlusion.
        if (sound._battleAcousticFilter) {
          try {
            var f = sound._battleAcousticFilter;
            f.frequency.setTargetAtTime(20000, f.context.currentTime, 0.025);
            if (sound._battleAcousticSend) sound._battleAcousticSend.gain.value = 0;
          } catch (_) {}
        }
        return false;
      }
      e = { sound: sound };
      entries.push(e);
    }
    e.source = source;
    e.kind = kind || 'gun';
    e.scene = scene;
    e.gain = finite(baseGain, 0.18);
    e.until = now() + (kind === 'voice' ? 16000 : kind === 'tail' ? 2800 : 1700);
    e.serial = ++serial;
    stats.prepared++;
    sample(e);
    wake();
    return true;
  }
  function bind(battle) {
    sim = battle || null;
  }
  function reset() {
    // An already queued presentation must not carry a previous battle's acoustic source.
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (e.send) {
        try {
          e.send.gain.value = 0;
        } catch (_) {}
      }
      if (e.filter) {
        try {
          e.filter.frequency.value = 20000;
        } catch (_) {}
      }
    }
    entries = [];
  }
  if (root.BattleModules && root.BattleModules.registerSystem) {
    root.BattleModules.registerSystem('listener-acoustics', {
      version: '1.0',
      beforeBattleRestart: reset,
      onBattleRestart: reset
    });
  }
  root.BattleListenerAcoustics = {
    quality: quality,
    bind: bind,
    prepare: prepare,
    reset: reset,
    stats: stats,
    get active() {
      return entries.length;
    },
    // Pure geometry helpers exposed for fixed fixtures.
    _test: { terrainObstructed: terrainObstructed, obstruction: obstruction, distance: distance }
  };
})(typeof window !== 'undefined' ? window : globalThis);
