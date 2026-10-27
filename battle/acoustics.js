/* Battlefield acoustics runtime v17.
   One Babylon world unit is treated as approximately one metre.
   Real propagation timing and source-class attenuation are handled by the schedulers below.
   Babylon.Sound itself is intentionally left untouched because Babylon 8 exposes Sound as a
   getter-only namespace property in some builds. */
(function (root) {
  'use strict';
  if (typeof window === 'undefined' || typeof BABYLON === 'undefined') return;

  var SPEED_OF_SOUND = 343;
  var cfg = {
    voiceShout: { sourceDb: 84, cull: 150, maxGain: 0.28, exponent: 0.45 },
    smallArms: { sourceDb: 160, cull: 1200, maxGain: 0.2, exponent: 0.36 }
  };
  root.BATTLE_ACOUSTICS = root.BATTLE_ACOUSTICS || { speedOfSoundMps: SPEED_OF_SOUND, profiles: cfg };

  try {
    var base = root.BATTLE_AUDIO_BASE || 'https://test.ivandpopov.com/grasstex/Assets/audio/';
    fetch(base + 'acoustics.json?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        if (j) {
          root.BATTLE_ACOUSTICS_SPEC = j;
          if (j.speedOfSoundMps) SPEED_OF_SOUND = +j.speedOfSoundMps || 343;
          root.GTLog('[ACOUSTICS] spec loaded; c=' + SPEED_OF_SOUND + 'm/s');
        }
      })
      .catch(function () {});
  } catch (_) {}

  function cameraPos(cam) {
    return (cam && (cam.globalPosition || cam.position)) || null;
  }
  function distance(a, b) {
    if (!a || !b) return 0;
    var dx = a.x - b.x,
      dy = (a.y || 0) - (b.y || 0),
      dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function copyPos(p) {
    return p && p.clone ? p.clone() : { x: p.x, y: p.y || 0, z: p.z };
  }
  function arrivalDelayMs(d) {
    return (Math.max(0, d) / SPEED_OF_SOUND) * 1000;
  }
  function compressedGain(profile, d) {
    d = Math.max(1, d);
    return profile.maxGain * Math.pow(d, -profile.exponent);
  }

  root.BattleAudioScheduler = (function () {
    var q = [],
      running = false,
      recentFar = {};
    var MAX_PER_FRAME = 2,
      MAX_QUEUE = 128;
    // Diagnostic accounting only; the existing admission and playback rules are unchanged.
    var stats = {
      received: 0,
      enqueuedPrimary: 0,
      enqueuedEcho: 0,
      culledDistance: 0,
      skippedFar: 0,
      throttledFar: 0,
      evictedPrimary: 0,
      evictedEcho: 0,
      rejectedPrimary: 0,
      rejectedEcho: 0,
      startedPrimary: 0,
      startedEcho: 0,
      playExceptions: 0,
      maxQueued: 0
    };
    // Queue policy is deliberately formatted as one audited unit.
    // prettier-ignore
    function push(e) {
      if (q.length >= MAX_QUEUE) {
        // Preserve imminent gunshots, not FIFO arrival order: a later near shot can
        // arrive before an earlier distant one. Optional echoes are always first to go.
        var victim = -1,
          latestDue = -Infinity;
        for (var i = 0; i < q.length; i++) {
          var waiting = q[i];
          if (e.echo && !waiting.echo) continue;
          if (!e.echo && victim >= 0 && !q[victim].echo && waiting.echo) {
            victim = -1;
            latestDue = -Infinity;
          }
          if (!e.echo && victim >= 0 && q[victim].echo && !waiting.echo) continue;
          if (waiting.due > latestDue) {
            latestDue = waiting.due;
            victim = i;
          }
        }
        // Never evict a sooner event for one with a later due time. Also, an
        // optional echo must not evict a primary even when the queue is full.
        if (victim < 0 || (e.echo || !q[victim].echo) && e.due >= q[victim].due) {
          if (e.echo) stats.rejectedEcho++;
          else stats.rejectedPrimary++;
          return;
        }
        if (q[victim].echo) stats.evictedEcho++;
        else stats.evictedPrimary++;
        q.splice(victim, 1);
      }
      q.push(e);
      if (e.echo) stats.enqueuedEcho++;
      else stats.enqueuedPrimary++;
      if (q.length > stats.maxQueued) stats.maxQueued = q.length;
      if (!running) {
        running = true;
        requestAnimationFrame(drain);
      }
    }
    function enqueue(audio, kind, pos, cam) {
      var cp = cameraPos(cam),
        d = distance(cp, pos),
        p = cfg.smallArms,
        now = performance.now();
      stats.received++;
      if (d > p.cull) {
        stats.culledDistance++;
        return;
      }
      if (d > 260 && Math.random() < 0.55) {
        stats.skippedFar++;
        return;
      }
      if (d > 140) {
        var last = recentFar[kind] || 0;
        if (now - last < 45) {
          stats.throttledFar++;
          return;
        }
        recentFar[kind] = now;
      }
      var gain = compressedGain(p, d),
        due = now + arrivalDelayMs(d) + Math.random() * 8;
      push({ audio: audio, kind: kind, pos: copyPos(pos), gain: gain, due: due, echo: false });
      if (d > 55 && Math.random() < (d > 180 ? 0.23 : 0.11)) {
        var extra = 90 + Math.min(420, d * 0.55) + Math.random() * 85;
        push({
          audio: audio,
          kind: kind,
          pos: copyPos(pos),
          gain: gain * (d > 180 ? 0.14 : 0.09),
          due: due + extra,
          echo: true
        });
      }
    }
    // Keep arrival selection and source-preference checks together.
    // prettier-ignore
    function drain() {
      var now = performance.now(),
        started = 0;
      // Play due primaries before optional echoes, earliest due first.
      // Keep the two-starts-per-frame audio budget unchanged.
      while (started < MAX_PER_FRAME) {
        var best = -1;
        for (var i = 0; i < q.length; i++) {
          var e = q[i];
          if (e.due > now) continue;
          if (best < 0 || (q[best].echo && !e.echo) ||
              (q[best].echo === e.echo && e.due < q[best].due)) best = i;
        }
        if (best < 0) break;
        var due = q.splice(best, 1)[0];
        try {
          due.audio.play(due.kind, due.pos, due.gain, 1);
          if (due.echo) stats.startedEcho++;
          else stats.startedPrimary++;
        } catch (_) {
          stats.playExceptions++;
        }
        started++;
      }
      if (q.length) requestAnimationFrame(drain);
      else running = false;
    }
    return {
      enqueue: enqueue,
      // Non-authoritative audio presentation counters; snapshots in Audio Lab only.
      get stats() {
        return Object.assign({}, stats);
      },
      get limits() {
        return { maxPerFrame: MAX_PER_FRAME, maxQueue: MAX_QUEUE };
      },
      get queued() {
        return q.length;
      }
    };
  })();

  /* squad-ai.js owns the ready-aware voice scheduler; retain this implementation only as a
     fallback for older pages that did not load it. */
  if (!root.BattleVoiceScheduler)
    root.BattleVoiceScheduler = (function () {
      var cache = {},
        failed = {},
        q = [],
        running = false,
        lastGlobal = 0,
        squadLast = {};
      function ensure(file, soldier) {
        if (cache[file] || failed[file]) return cache[file] || null;
        var entry = (cache[file] = { file: file, sound: null, ready: false });
        try {
          var scene = soldier.root.getScene(),
            base = root.BATTLE_AUDIO_BASE || 'https://test.ivandpopov.com/grasstex/Assets/audio/';
          root.GTLog('[VOICE] request ' + base + file);
          entry.sound = new BABYLON.Sound(
            'voice-' + file,
            root.BattleAudioFormat ? root.BattleAudioFormat.url(base + file) : base + file,
            scene,
            function () {
              entry.ready = true;
              root.GTLog('[VOICE] ready ' + file);
            },
            {
              spatialSound: true,
              distanceModel: 'linear',
              maxDistance: 150,
              rolloffFactor: 0.7,
              volume: 0.28,
              autoplay: false
            }
          );
        } catch (e) {
          failed[file] = true;
          delete cache[file];
          console.error('[VOICE] create failed ' + file + ': ' + ((e && e.message) || e));
          return null;
        }
        return entry;
      }
      function enqueue(soldier, type, cam) {
        var m = root.BATTLE_AUDIO_MANIFEST;
        if (!m || !m.callouts || !m.callouts[soldier.faction]) return;
        var files = (m.callouts[soldier.faction].events || {})[type];
        if (!files || !files.length) return;
        var now = performance.now(),
          rules = (m.rules && m.rules.voice) || {},
          squadGap = (rules.perSquadCooldownSeconds || 2.5) * 1000;
        if (now - lastGlobal < 700) return;
        var sid = (soldier.squad && soldier.squad.id) || soldier.faction;
        if (now - (squadLast[sid] || 0) < squadGap) return;
        var pos = copyPos(soldier.root.position),
          d = distance(cameraPos(cam), pos),
          p = cfg.voiceShout;
        if (d > p.cull) return;
        var file = files[Math.floor(Math.random() * files.length)],
          entry = ensure(file, soldier);
        if (!entry) return;
        lastGlobal = now;
        squadLast[sid] = now;
        q.push({
          entry: entry,
          file: file,
          pos: pos,
          gain: compressedGain(p, d),
          due: now + arrivalDelayMs(d)
        });
        if (!running) {
          running = true;
          requestAnimationFrame(drain);
        }
      }
      function drain() {
        var now = performance.now(),
          remain = [];
        for (var i = 0; i < q.length; i++) {
          var e = q[i];
          if (e.due <= now && e.entry.ready) {
            try {
              e.entry.sound.setPosition(e.pos);
              if (e.entry.sound.setVolume) e.entry.sound.setVolume(e.gain);
              e.entry.sound.play();
              root.GTLog('[VOICE] play ' + e.file + ' gain=' + e.gain.toFixed(3));
            } catch (err) {
              console.error('[VOICE] play failed ' + e.file + ': ' + ((err && err.message) || err));
            }
          } else remain.push(e);
        }
        q = remain;
        if (q.length) requestAnimationFrame(drain);
        else running = false;
      }
      return { enqueue: enqueue };
    })();

  root.GTLog(
    '[ACOUSTICS] runtime v17 active; voice 150m cull, small arms 1200m cull, delayed at ' +
      SPEED_OF_SOUND +
      'm/s'
  );
})(typeof window !== 'undefined' ? window : globalThis);
