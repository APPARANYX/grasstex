/* Grenade audio: arming foley and the detonation. Presentation only, gated by the core's `?grenades`
   switch; `?grenadeAudio=0` installs nothing. It reads the grenade owner's records (a man holding a
   committed throw, a released grenade, a burst) and the active camera, and never writes simulation
   state or draws the grenade or combat RNG: takes are picked by a hash of the place and a counter.
   Its memory of who is arming lives in a WeakMap, not on the soldier.

   - arming (when the throw is committed, during the wind-up): the US Mk 2 has its pin pulled (`pin`);
     the German M24 has its handle cap unscrewed and the cord pulled (`igniter`).
   - release: the Mk 2's lever flies off as it leaves the hand (`spoon`); the M24 has no lever.
   - burst: one `explosion` where it lands. It carries to EXPLOSION_RANGE; arming foley only to
     FOLEY_RANGE, like weapon handling. Every sound waits for the speed of sound.

   Clips: Assets/audio/manifest.json category `grenades`, declared with their ElevenLabs prompts in
   Assets/audio/combat-sfx-manifest.json group `grenades`. A kind with no files plays nothing. */
(function (root) {
  'use strict';
  var SPEED_OF_SOUND = 343,
    FOLEY_RANGE = 30,
    EXPLOSION_RANGE = 800,
    /* kind: loudest gain, clip length s. */
    KINDS = {
      pin: { gain: 0.5, len: 0.8 },
      igniter: { gain: 0.5, len: 1.6 },
      spoon: { gain: 0.5, len: 1 },
      explosion: { gain: 0.9, len: 3 }
    },
    ARMING = { mk2: 'pin', m24: 'igniter' },
    RELEASE = { mk2: 'spoon' };
  var ON = !!(
    root.BattleGrenades &&
    root.BattleGrenades.parseOn(typeof location !== 'undefined' ? location.search || '' : '') &&
    !(typeof location !== 'undefined' && /[?&]grenadeAudio=0\b/.test(location.search || ''))
  );

  function v3(p) {
    return p ? { x: +p.x || 0, y: +p.y || 0, z: +p.z || 0 } : null;
  }
  var dist = root.GTMath.distStrict;
  function foleyGain(d) {
    var near = Math.max(0, 1 - d / FOLEY_RANGE);
    return KINDS.pin.gain * (0.1 + 0.9 * Math.pow(near, 1.3));
  }
  /* Full within 5 m, then half per fourfold distance: a burst stays a burst across the field. */
  function explosionGain(d) {
    return KINDS.explosion.gain * Math.pow(Math.max(5, d) / 5, -0.5);
  }
  /* The sound a grenade event makes for a listener at L, or null when it is out of earshot. */
  function cue(kind, point, L) {
    if (!kind || !KINDS[kind] || !point || !L) return null;
    var p = v3(point),
      d = dist(p, v3(L)),
      blast = kind === 'explosion';
    if (d > (blast ? EXPLOSION_RANGE : FOLEY_RANGE)) return null;
    return { kind: kind, point: p, d: d, gain: blast ? explosionGain(d) : foleyGain(d) };
  }
  function grenadeKind(faction) {
    return faction === 'ge' ? 'm24' : 'mk2';
  }
  function hash01(n) {
    n = n | 0 || 1;
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return (n >>> 0) / 4294967296;
  }
  function seedOf(p, k) {
    return (Math.round(p.x * 97) * 73856093) ^ (Math.round(p.z * 83) * 83492791) ^ (k | 0);
  }
  function files(kind) {
    var m = root.BATTLE_AUDIO_MANIFEST,
      c = m && m.categories && m.categories.grenades,
      list = c && c[kind];
    return list && list.length ? list : [];
  }
  function nowMs() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  /* One Babylon voice per clip file, each panned to where its sound happens; loudness is ours. */
  function buildVoices(scene, base) {
    var pools = {};
    Object.keys(KINDS).forEach(function (kind) {
      pools[kind] = files(kind).map(function (f, i) {
        return {
          endsAt: 0,
          sound: new BABYLON.Sound(
            'grenade-' + kind + i,
            root.BattleAudioFormat ? root.BattleAudioFormat.url(base + f) : base + f,
            scene,
            null,
            {
              spatialSound: true,
              distanceModel: 'linear',
              rolloffFactor: 0,
              maxDistance: 1000,
              volume: 0,
              autoplay: false
            }
          )
        };
      });
    });
    return pools;
  }

  function install(sim, opts) {
    opts = opts || {};
    if (!ON || !sim || sim._grenadeAudioInstalled) return sim;
    sim._grenadeAudioInstalled = true;
    var scene = sim.scene,
      now = opts.now || nowMs,
      later =
        opts.later ||
        function (ms, fn) {
          if (ms > 0) setTimeout(fn, ms);
          else fn();
        },
      pools = opts.voices || {},
      arming = typeof WeakMap !== 'undefined' ? new WeakMap() : null,
      count = 0,
      stats = (sim._grenadeAudio = { played: {}, dropped: 0 });
    if (!arming) return sim;
    /* Voices are built once the audio format is settled (modules/00-audio-format.js). */
    if (!opts.voices && typeof BABYLON !== 'undefined' && scene) {
      var F = root.BattleAudioFormat,
        build = function () {
          var built = buildVoices(scene, String(opts.audioBase || root.BATTLE_AUDIO_BASE || 'audio/'));
          Object.keys(built).forEach(function (k) {
            pools[k] = built[k];
          });
        };
      if (F && F.state === 'probing' && F.ready) F.ready.then(build, build);
      else build();
    }
    function listener() {
      var cam = opts.camera ? opts.camera() : scene && scene.activeCamera;
      return v3(cam && (cam.globalPosition || cam.position));
    }
    function sound(c) {
      var pool = pools[c.kind];
      if (!pool || !pool.length) return;
      var t = now(),
        free = pool.filter(function (v) {
          return v.endsAt <= t;
        });
      if (!free.length) return void stats.dropped++;
      var v = free[((count++ + hash01(seedOf(c.point, count)) * free.length) | 0) % free.length];
      v.endsAt = t + KINDS[c.kind].len * 1000;
      stats.played[c.kind] = (stats.played[c.kind] || 0) + 1;
      try {
        var snd = v.sound,
          p = c.point,
          role = c.kind === 'explosion' ? 'combat' : 'foley',
          gain = c.gain;
        if (snd.setPosition)
          snd.setPosition(
            typeof BABYLON !== 'undefined' && BABYLON.Vector3 ? new BABYLON.Vector3(p.x, p.y, p.z) : p
          );
        var mix = root.BattleAudioMix;
        if (mix) gain = mix.gain(role, gain, scene);
        var acoustics = root.BattleListenerAcoustics;
        if (!acoustics || !acoustics.prepare(snd, p, role, gain, scene))
          if (snd.setVolume) snd.setVolume(gain);
        if (snd.setPlaybackRate) snd.setPlaybackRate(1);
        snd.play();
      } catch (_) {}
    }
    function emit(kind, point) {
      var c = cue(kind, point, listener());
      if (!c) return;
      later((c.d / SPEED_OF_SOUND) * 1000, sound.bind(null, c));
    }
    function hand(s) {
      var r = s && s.root && s.root.position;
      return r ? { x: r.x, y: (r.y || 0) + 1.4, z: r.z } : null;
    }
    /* A man who has just committed a throw arms his grenade. */
    function step() {
      var api = root.BattleGrenades;
      if (!api || !api.on()) return;
      var men = sim.rosterOf ? (sim.rosterOf('us') || []).concat(sim.rosterOf('ge') || []) : [];
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s) continue;
        var held = !s.dead && !!api.pendingOf(s, sim);
        if (held === !!arming.get(s)) continue;
        arming.set(s, held);
        if (held) emit(ARMING[grenadeKind(s.faction)], hand(s));
      }
    }
    var oldGrenade = sim.onGrenade,
      oldBurst = sim.onGrenadeBurst;
    sim.onGrenade = function (g, s) {
      var r = oldGrenade ? oldGrenade.apply(this, arguments) : undefined;
      if (g) emit(RELEASE[g.kind], g.from || hand(s));
      return r;
    };
    sim.onGrenadeBurst = function (g) {
      var r = oldBurst ? oldBurst.apply(this, arguments) : undefined;
      if (g && g.to) emit('explosion', g.to);
      return r;
    };
    if (opts.observe) opts.observe(step);
    else if (scene && scene.onBeforeRenderObservable) scene.onBeforeRenderObservable.add(step);
    return sim;
  }

  root.BattleGrenadeAudio = {
    on: ON,
    KINDS: KINDS,
    FOLEY_RANGE: FOLEY_RANGE,
    EXPLOSION_RANGE: EXPLOSION_RANGE,
    ARMING: ARMING,
    RELEASE: RELEASE,
    cue: cue,
    install: install
  };
  if (ON && root.BattleSim && root.BattleSim.start && typeof BABYLON !== 'undefined') {
    var oldStart = root.BattleSim.start;
    root.BattleSim.start = function (scene, opts) {
      return install(oldStart(scene, opts), { audioBase: opts && opts.audioBase });
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
