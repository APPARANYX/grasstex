/* Combat audio: what a round sounds like after it leaves the muzzle.
   Presentation only. It reads each shot as drawn (muzzle to where the round ended, the line its
   tracer draws, the bodies it went through and what they suffered) and the active camera, and
   never writes simulation state or draws the combat RNG: variants and ricochets are picked by a
   hash of the shot and a counter, never a random number. `?combatAudio=0` installs nothing.

   One sound per instance:
   - flyby: a round whose line passes within FLYBY.range (10 m) of the camera plays one clip, when
     its tracer shows, from where it passed closest. A supersonic round (every rifle, carbine, MG
     and 9 mm round) cracks within CRACK_WITHIN (6 m) and zips beyond; a .45 (Thompson, M1911A1)
     only whizzes. A round still within MUZZLE_SKIP (6 m) of its muzzle at its closest point is the
     shooter's own report (a man firing beside the camera, the possessed soldier himself): nothing.
   - the end of the round: one impact clip for the surface it stopped in (dirt, masonry, wood, metal,
     vegetation), or on stone and metal sometimes a ricochet instead (more often at a grazing angle).
     A round stopped by a man ends in his body: that is the flesh hit, not an impact.
   - each body it strikes: one flesh hit.
   - each man it hits: one cry, `wounded` if he fights on, `down` if it dropped him; nothing for a
     killing head shot, and never again from the same man within PAIN_REPEAT.
   Sounds beyond the camera wait for the sound to arrive (343 m/s).

   No cacophony: each group has its own range, its own cap on clips sounding at once and a least gap
   between starts; a sound that would break either is dropped, first come first served. A clip
   already sounding is never restarted: the next free variant plays.

   Clips: Assets/audio/manifest.json categories flyby, ricochet, impacts, flesh and pain, declared
   with their ElevenLabs prompts in Assets/audio/combat-sfx-manifest.json. A category with no files
   plays nothing. */
(function (root) {
  'use strict';
  var SPEED_OF_SOUND = 343,
    CRACK_WITHIN = 6,
    MUZZLE_SKIP = 6,
    PAIN_REPEAT = 3000,
    SUBSONIC = { thompson: true, m1911a1: true };
  /* range m, voices at once, least gap between starts ms, loudest gain, clip length s. */
  var GROUPS = {
    flyby: { range: 10, voices: 2, gap: 70, gain: 0.55, len: { crack: 0.35, whiz: 0.45 } },
    impacts: { range: 40, voices: 3, gap: 35, gain: 0.4, len: 0.5 },
    ricochet: { range: 60, voices: 1, gap: 250, gain: 0.45, len: 1.1 },
    flesh: { range: 40, voices: 2, gap: 50, gain: 0.45, len: 0.45 },
    pain: { range: 60, voices: 2, gap: 120, gain: 0.5, len: 1.3 }
  };
  var RICOCHET = { masonry: 0.2, metal: 0.4 },
    RICOCHET_GRAZING = 0.35;
  var ON = !(typeof location !== 'undefined' && /[?&]combatAudio=0\b/.test(location.search || ''));

  function v3(p) {
    return p ? { x: +p.x || 0, y: +p.y || 0, z: +p.z || 0 } : null;
  }
  function dist(a, b) {
    var dx = a.x - b.x,
      dy = a.y - b.y,
      dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  /* Closest approach of the segment a -> b to the point c: {miss, along, point} or null. */
  function closest(a, b, c) {
    if (!a || !b || !c) return null;
    a = v3(a);
    b = v3(b);
    c = v3(c);
    var dx = b.x - a.x,
      dy = b.y - a.y,
      dz = b.z - a.z,
      len2 = dx * dx + dy * dy + dz * dz;
    if (!(len2 > 1e-6)) return null;
    var t = ((c.x - a.x) * dx + (c.y - a.y) * dy + (c.z - a.z) * dz) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var p = { x: a.x + dx * t, y: a.y + dy * t, z: a.z + dz * t };
    return { miss: dist(c, p), along: Math.sqrt(len2) * t, point: p };
  }
  function falloff(group, d) {
    var g = GROUPS[group],
      near = Math.max(0, 1 - d / g.range);
    return g.gain * (0.12 + 0.88 * Math.pow(near, 1.3));
  }
  function subsonic(shooter) {
    var w = shooter && shooter.weapon;
    return !!(w && SUBSONIC[w.profile]);
  }
  /* The flyby a round's line makes past the listener, or null. */
  function flyby(from, to, listener, shooter) {
    var c = closest(from, to, listener);
    if (!c || c.miss > GROUPS.flyby.range || c.along < MUZZLE_SKIP) return null;
    return {
      group: 'flyby',
      kind: !subsonic(shooter) && c.miss <= CRACK_WITHIN ? 'crack' : 'whiz',
      d: c.miss,
      point: c.point,
      gain: falloff('flyby', c.miss),
      travel: false
    };
  }
  /* What a round stopped in, the way the impact effects classify it, with wood told apart. */
  function surface(end) {
    if (!end) return null;
    if (end.stoppedBy === 'soldier') return 'flesh';
    if (end.blocker === 'ground') return 'dirt';
    var s = String(end.surface || '').toLowerCase();
    if (/metal|steel|iron|armou?r|vehicle/.test(s)) return 'metal';
    if (/tree|log|wood|timber|plank|door/.test(s)) return 'wood';
    if (/hedge|bush|grass|leaf|vegetation/.test(s)) return 'vegetation';
    if (/dirt|earth|soil|ground|sand|mud/.test(s)) return 'dirt';
    return 'masonry';
  }
  function hash01(n) {
    n = n | 0 || 1;
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return (n >>> 0) / 4294967296;
  }
  function seedOf(p, k) {
    return (Math.round(p.x * 97) * 73856093) ^ (Math.round(p.y * 89) * 19349663) ^ (Math.round(p.z * 83) * 83492791) ^ (k | 0);
  }
  /* Impact or ricochet at the round's end, or null for a body (the flesh hit covers it). */
  function ending(end, listener) {
    var kind = surface(end),
      at = end && v3(end.impact);
    if (!kind || kind === 'flesh' || !at || !listener) return null;
    var d = dist(at, v3(listener)),
      chance = RICOCHET[kind] || 0;
    if (chance && end.direction && end.normal) {
      var n = end.normal,
        r = end.direction,
        nl = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1,
        rl = Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z) || 1,
        cos = Math.abs((n.x * r.x + n.y * r.y + n.z * r.z) / (nl * rl));
      if (cos < 0.35) chance += RICOCHET_GRAZING;
    }
    if (chance && d <= GROUPS.ricochet.range && hash01(seedOf(at, 7)) < chance)
      return { group: 'ricochet', kind: 'whine', d: d, point: at, gain: falloff('ricochet', d), travel: true };
    if (d > GROUPS.impacts.range) return null;
    return { group: 'impacts', kind: kind, d: d, point: at, gain: falloff('impacts', d), travel: true };
  }
  /* A flesh hit and a cry for each body the round struck. */
  function bodies(shot, target, hit, listener) {
    var out = [];
    if (!listener) return out;
    var L = v3(listener),
      passes = (shot && shot.passes) || [];
    if (!passes.length && hit && target && target.root) {
      var tp = target.root.position;
      passes = [{ victim: target, entry: { x: tp.x, y: (tp.y || 0) + 1.2, z: tp.z }, wound: null }];
    }
    passes.forEach(function (p) {
      var at = v3(p.entry);
      if (!at) return;
      var d = dist(at, L);
      if (d <= GROUPS.flesh.range) out.push({ group: 'flesh', kind: 'hit', d: d, point: at, gain: falloff('flesh', d), travel: true });
      var w = p.wound,
        outcome = w && w.outcome;
      if (!outcome || d > GROUPS.pain.range || (outcome === 'killed' && w.zone === 'head')) return;
      out.push({
        group: 'pain',
        kind: outcome === 'wounded' ? 'wounded' : 'down',
        d: d,
        point: at,
        gain: falloff('pain', d),
        travel: true,
        who: p.victim && p.victim.id
      });
    });
    return out;
  }

  /* One group's limiter: clips sounding now and the last start, on the wall clock (sound plays in
     real time whatever the battle's time scale). */
  function limiter(group, now) {
    var g = GROUPS[group],
      st = { ends: [], last: -1e9, played: 0, dropped: 0 };
    st.admit = function (len) {
      var t = now();
      st.ends = st.ends.filter(function (e) {
        return e > t;
      });
      if (t - st.last < g.gap || st.ends.length >= g.voices) {
        st.dropped++;
        return false;
      }
      st.last = t;
      st.ends.push(t + len * 1000);
      st.played++;
      return true;
    };
    return st;
  }
  function files(group, kind) {
    var m = root.BATTLE_AUDIO_MANIFEST,
      c = m && m.categories && m.categories[group],
      list = c && c[kind];
    return list && list.length ? list : [];
  }
  function nowMs() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  /* Babylon voices, one per clip file, each panned to where its sound happens; loudness is ours. */
  function buildVoices(scene, base) {
    var pools = {};
    Object.keys(GROUPS).forEach(function (group) {
      var c = (root.BATTLE_AUDIO_MANIFEST && root.BATTLE_AUDIO_MANIFEST.categories && root.BATTLE_AUDIO_MANIFEST.categories[group]) || {};
      Object.keys(c).forEach(function (kind) {
        pools[group + '.' + kind] = files(group, kind).map(function (f, i) {
          return {
            endsAt: 0,
            sound: new BABYLON.Sound('combat-' + group + '-' + kind + i, root.BattleAudioFormat ? root.BattleAudioFormat.url(base + f) : base + f, scene, null, {
              spatialSound: true,
              distanceModel: 'linear',
              rolloffFactor: 0,
              maxDistance: 1000,
              volume: 0,
              autoplay: false
            })
          };
        });
      });
    });
    return pools;
  }

  function install(sim, opts) {
    opts = opts || {};
    if (!ON || !sim || sim._combatAudioInstalled) return sim;
    sim._combatAudioInstalled = true;
    var scene = sim.scene,
      now = opts.now || nowMs,
      later =
        opts.later ||
        function (ms, fn) {
          if (ms > 0) setTimeout(fn, ms);
          else fn();
        },
      count = 0,
      lastCry = {},
      pools = opts.voices || {},
      limits = {},
      stats = (sim._combatAudio = { played: {}, dropped: {}, limits: limits });
    /* Voices are built once the audio format is settled (modules/00-audio-format.js: Opus twins or MP3). */
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
    Object.keys(GROUPS).forEach(function (g) {
      limits[g] = limiter(g, now);
      stats.played[g] = 0;
      stats.dropped[g] = 0;
    });
    function listener() {
      var cam = opts.camera ? opts.camera() : scene && scene.activeCamera;
      return cam && (cam.globalPosition || cam.position);
    }
    function sound(s) {
      var pool = pools[s.group + '.' + s.kind];
      if (!pool || !pool.length) return;
      var t = now(),
        free = [];
      for (var i = 0; i < pool.length; i++) if (pool[i].endsAt <= t) free.push(pool[i]);
      if (!free.length) return void stats.dropped[s.group]++;
      var len = GROUPS[s.group].len;
      len = typeof len === 'object' ? len[s.kind] : len;
      if (!limits[s.group].admit(len)) return void stats.dropped[s.group]++;
      if (s.group === 'pain' && s.who != null) lastCry[s.who] = t;
      var v = free[(count++ + (hash01(seedOf(s.point, count)) * free.length) | 0) % free.length];
      v.endsAt = t + len * 1000;
      stats.played[s.group]++;
      try {
        var snd = v.sound,
          p = s.point;
        if (snd.setPosition) snd.setPosition(typeof BABYLON !== 'undefined' && BABYLON.Vector3 ? new BABYLON.Vector3(p.x, p.y, p.z) : p);
        if (snd.setVolume) snd.setVolume(s.gain);
        if (snd.setPlaybackRate) snd.setPlaybackRate(1);
        snd.play();
      } catch (_) {}
    }
    function emit(s) {
      if (!s) return;
      /* A man cries out once: a second hit within PAIN_REPEAT is not a second cry. */
      if (s.group === 'pain' && s.who != null && s.who in lastCry && now() - lastCry[s.who] < PAIN_REPEAT) return;
      if (s.travel && s.d > 1) later((s.d / SPEED_OF_SOUND) * 1000, sound.bind(null, s));
      else sound(s);
    }
    /* At the moment the tracer shows: the camera may have moved since the tick. */
    function present(delay, fn) {
      if (delay > 0 && sim.presentAfter) sim.presentAfter(delay, fn);
      else fn();
    }
    function muzzle(shooter, shot) {
      if (shot && shot.origin) return v3(shot.origin);
      var r = shooter && shooter.root && shooter.root.position;
      return r ? { x: r.x, y: (r.y || 0) + 1.4, z: r.z } : null;
    }
    var oldShot = sim.onShot,
      oldSuppressive = sim.onSuppressiveShot;
    sim.onShot = function (shooter, target, hit, d, shot) {
      if (oldShot) oldShot.apply(sim, arguments);
      var final = shot && (shot.final || (shot.stoppedBy !== 'soldier' ? shot : null)),
        end = (shot && ((shot.final && shot.final.impact) || shot.impact)) || null,
        from = muzzle(shooter, shot);
      if (!end && hit && target && target.root) {
        var tp = target.root.position;
        end = { x: tp.x, y: (tp.y || 0) + 1.2, z: tp.z };
      }
      present(shot && shot.delay, function () {
        var L = listener();
        if (!L) return;
        if (from && end) emit(flyby(from, end, L, shooter));
        if (final && final.impact) emit(ending(final, L));
        bodies(shot, target, hit, L).forEach(emit);
      });
    };
    sim.onSuppressiveShot = function (shooter, point) {
      if (oldSuppressive) oldSuppressive.apply(sim, arguments);
      if (!point) return;
      var y = sim.heightAt ? sim.heightAt(point.x, point.z) + 1 : point.y || 0,
        from = muzzle(shooter, null),
        L = listener();
      if (from && L) emit(flyby(from, { x: point.x, y: y, z: point.z }, L, shooter));
    };
    return sim;
  }

  root.BattleCombatAudio = {
    on: ON,
    GROUPS: GROUPS,
    CRACK_WITHIN: CRACK_WITHIN,
    MUZZLE_SKIP: MUZZLE_SKIP,
    PAIN_REPEAT: PAIN_REPEAT,
    closest: closest,
    flyby: flyby,
    surface: surface,
    ending: ending,
    bodies: bodies,
    install: install
  };
  if (root.BattleSim && root.BattleSim.start && typeof BABYLON !== 'undefined') {
    var oldStart = root.BattleSim.start;
    root.BattleSim.start = function (scene, opts) {
      return install(oldStart(scene, opts), { audioBase: opts && opts.audioBase });
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
