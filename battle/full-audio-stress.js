/* Presentation-only full battlefield audio mix exercise.
   Generates synthetic EVENT INPUTS to the same shipping audio owners used by battle_sim:
   weapon foley, combat impacts/flybys/pain, grenades and voice variation.
   No combat simulation, orders, damage, or combat RNG are mutated.
   Optional catalog samples (ambience, footsteps, vehicles and aircraft) exercise
   loaded content not normally present on an infantry-only Skills Lab map. */
(function (root) {
  'use strict';
  // Snapshot of the declared unrecorded inventory; regression checks keep it current.
  var UNRECORDED = [
    'aircraft/bomb-drop-01.mp3',
    'aircraft/bomb-explosion-01.mp3',
    'aircraft/bomb-explosion-02.mp3',
    'aircraft/bomber-pass-01.mp3',
    'aircraft/bomber-pass-02.mp3',
    'aircraft/dive-01.mp3',
    'aircraft/fighter-pass-01.mp3',
    'aircraft/fighter-pass-02.mp3',
    'aircraft/strafing-01.mp3',
    'aircraft/strafing-02.mp3',
    'ambience/distant-battle-01.mp3',
    'ambience/distant-battle-02.mp3',
    'ambience/wind-01.mp3',
    'vehicles/tank-cannon-01.mp3',
    'vehicles/tank-cannon-02.mp3',
    'vehicles/tank-destroyed-01.mp3',
    'vehicles/tank-destroyed-02.mp3',
    'vehicles/tank-impact-01.mp3',
    'vehicles/tank-impact-02.mp3'
  ];
  function create(opts) {
    var scene = opts.scene,
      base = opts.audioBase,
      cam = scene.activeCamera,
      actors = [],
      counters = {
        fireEvents: 0,
        foleyEvents: 0,
        combatEvents: 0,
        grenadeEvents: 0,
        voiceAccepted: 0,
        voiceStarted: 0,
        catalogRequested: 0,
        catalogPlayed: 0,
        catalogFailed: 0
      },
      catalog = [],
      tick = 0,
      lastVoice = 0,
      lastGrenade = 0,
      lastCatalog = 0;
    var roster = { us: [], ge: [] },
      kinds = ['rifle', 'smg', 'lmg', 'carbine'];
    ['us', 'ge'].forEach(function (faction, fi) {
      for (var i = 0; i < 10; i++) {
        var kind = kinds[i % kinds.length],
          profile = root.BattleWeapons.PROFILES[faction][kind],
          model = profile.model,
          pos = new BABYLON.Vector3(((i % 5) - 2) * 3.2, 1.2, 8 + ((i / 5) | 0) * 12 + fi * 3),
          mesh = new BABYLON.TransformNode('audio-lab-' + faction + '-' + i, scene),
          sq = { id: 'audio-lab-' + faction + '-' + ((i / 5) | 0), disbanded: false };
        mesh.position.copyFrom(pos);
        var actor = {
          id: faction + '-audio-' + i,
          faction: faction,
          squad: sq,
          root: mesh,
          role: i % 5 === 0 ? 'captain' : 'rifleman',
          weapon: { profile: model, kind: kind, stats: { cyclic: profile.cyclic || 0 }, ammo: 8 },
          dead: false,
          reloading: false,
          clearingStoppage: false,
          prone: false,
          _labGrenadePending: false,
          _labBaseX: pos.x,
          _labBaseZ: pos.z
        };
        actors.push(actor);
        roster[faction].push(actor);
      }
    });
    var sim = {
      scene: scene,
      time: 0,
      timeScale: opts.speed || 4,
      heightAt: function () {
        return 0;
      },
      rosterOf: function (faction) {
        return roster[faction] || [];
      },
      presentAfter: function (seconds, fn) {
        setTimeout(fn, (1000 * Math.max(0, seconds)) / Math.max(0.05, sim.timeScale));
      }
    };
    // All installed owners are the actual battle modules, not reimplementations.
    root.BattleWeaponFoley.install(sim, { audioBase: base });
    root.BattleCombatAudio.install(sim, { audioBase: base });
    root.BattleGrenadeAudio.install(sim, { audioBase: base });
    var categories = ['ambience', 'footsteps', 'vehicles', 'aircraft'];
    var m = root.BATTLE_AUDIO_MANIFEST;
    categories.forEach(function (name) {
      var groups = m && m.categories && m.categories[name];
      if (!groups) return;
      Object.keys(groups).forEach(function (action) {
        if (!groups[action] || !groups[action].length) return;
        catalog.push({
          category: name,
          action: action,
          file: groups[action].find(function (file) {
            return UNRECORDED.indexOf(file) < 0;
          }),
          sound: null,
          ready: false,
          failed: false
        });
      });
    });
    catalog = catalog.filter(function (item) {
      return !!item.file;
    });
    function catalogSample(at) {
      if (!catalog.length) return;
      var item = catalog[(tick + ((tick / 3) | 0)) % catalog.length],
        p = new BABYLON.Vector3(((tick % 5) - 2) * 5, 1.6, 10 + (tick % 20));
      counters.catalogRequested++;
      function play() {
        if (!item.ready || item.failed || !item.sound || item.sound.isPlaying) return;
        try {
          item.sound.setPosition(p);
          var gain = root.BattleAudioMix ? root.BattleAudioMix.gain('foley', 0.11, scene) : 0.11,
            a = root.BattleListenerAcoustics;
          if (!a || !a.prepare(item.sound, p, 'foley', gain, scene)) item.sound.setVolume(gain);
          if (item.sound.play() === false) return;
          counters.catalogPlayed++;
        } catch (err) {
          item.failed = true;
          counters.catalogFailed++;
          console.error('[AUDIO LAB] catalog playback failed', item.file, err);
        }
      }
      if (item.ready) return play();
      if (item.sound || item.failed) return;
      item.sound = new (root.BattleAudioBackend ? root.BattleAudioBackend.Sound : BABYLON.Sound)(
        'audio-lab-catalog-' + item.category + '-' + item.action,
        root.BattleAudioFormat ? root.BattleAudioFormat.url(base + item.file) : base + item.file,
        scene,
        function () {
          item.ready = true;
          play();
        },
        {
          spatialSound: true,
          distanceModel: 'linear',
          maxDistance: 140,
          rolloffFactor: 0,
          volume: 0,
          autoplay: false
        }
      );
    }
    function fire(s, ordinal) {
      s.weapon.ammo = (s.weapon.ammo + 7) % 9;
      sim.onFire(s, 0); // fireTail/bolt/clip hooks, real foley owner
      counters.fireEvents++;
      var pos = s.root.position,
        x = pos.x,
        z = pos.z;
      var end = { x: x * 0.25, y: 1.3, z: 5 + (ordinal % 15) },
        start = { x: x, y: 1.5, z: z + 3 };
      var hit = ordinal % 6 === 0,
        target = actors[(ordinal + 4) % actors.length],
        shot = {
          origin: start,
          impact: end,
          final: hit
            ? null
            : {
                stoppedBy: 'ground',
                blocker: 'ground',
                impact: end,
                surface: ['dirt', 'masonry', 'wood', 'metal', 'vegetation'][ordinal % 5]
              },
          passes: hit
            ? [
                {
                  victim: target,
                  entry: end,
                  wound: { outcome: ordinal % 12 === 0 ? 'down' : 'wounded', zone: 'torso' }
                }
              ]
            : []
        };
      sim.onShot(s, target, hit, 20, shot);
      if (ordinal % 5 === 0) sim.onSuppressiveShot(s, { x: 0, y: 1.4, z: 9 });
      counters.combatEvents++;
    }
    function grenade(s, n) {
      s._labGrenadePending = true;
      var from = { x: s.root.position.x, y: 1.5, z: s.root.position.z },
        to = { x: ((n % 3) - 1) * 3, y: 0, z: 12 + (n % 12) };
      // Native audio owner observes arming through onBeforeRenderObservable.
      setTimeout(function () {
        s._labGrenadePending = false;
      }, 500);
      setTimeout(function () {
        sim.onGrenade({ kind: s.faction === 'ge' ? 'm24' : 'mk2', from: from, to: to }, s);
        counters.grenadeEvents++;
      }, 250);
      setTimeout(function () {
        sim.onGrenadeBurst({ to: to });
        counters.grenadeEvents++;
      }, 2200);
    }
    function step(nowSeconds) {
      sim.time = nowSeconds;
      tick++;
      var index = tick % actors.length,
        s = actors[index];
      if (tick % 3 === 0) {
        fire(s, tick);
        // The owner watches state transitions through its real scene observer.
        if (tick % 21 === 0) {
          s.reloading = true;
          s.reloadUntil = sim.time + 2.5;
          s.clearingStoppage = tick % 42 === 0;
          s.stoppageUntil = sim.time + 2;
          s.prone = !s.prone;
          counters.foleyEvents++;
          setTimeout(function () {
            s.reloading = false;
            s.clearingStoppage = false;
          }, 1050);
        }
      }
      if (nowSeconds - lastVoice >= 1.5) {
        lastVoice = nowSeconds;
        var speaker = actors[(tick * 7) % actors.length],
          events = ['coverMe', 'advance', 'takingFire', 'grenadeOut', 'hold', 'idleQuip'];
        var h = root.BattleVoiceScheduler.enqueue(speaker, events[((tick / 7) | 0) % events.length], cam, {
          onEnded: function () {}
        });
        if (h && h.accepted) {
          counters.voiceAccepted++;
          if (h.started) counters.voiceStarted++;
        }
      }
      if (nowSeconds - lastGrenade >= 7) {
        lastGrenade = nowSeconds;
        grenade(actors[(tick * 3) % actors.length], tick);
      }
      if (nowSeconds - lastCatalog >= 4) {
        lastCatalog = nowSeconds;
        catalogSample(nowSeconds);
      }
    }
    function summary() {
      return {
        eventInputs: Object.assign({}, counters),
        voice:
          root.BattleVoiceScheduler && root.BattleVoiceScheduler.summary
            ? root.BattleVoiceScheduler.summary()
            : null,
        foley: sim._weaponFoley ? Object.assign({}, sim._weaponFoley) : null,
        combat: sim._combatAudio
          ? {
              played: Object.assign({}, sim._combatAudio.played),
              dropped: Object.assign({}, sim._combatAudio.dropped)
            }
          : null,
        grenades: sim._grenadeAudio
          ? {
              played: Object.assign({}, sim._grenadeAudio.played),
              dropped: sim._grenadeAudio.dropped
            }
          : null,
        catalog: {
          declaredUnrecorded: UNRECORDED.slice(),
          total: catalog.length,
          loaded: catalog.filter(function (x) {
            return x.ready;
          }).length,
          failures: catalog
            .filter(function (x) {
              return x.failed;
            })
            .map(function (x) {
              return x.file;
            })
        }
      };
    }
    return { step: step, summary: summary };
  }
  root.BattleFullAudioStress = { create: create };
})(typeof window !== 'undefined' ? window : globalThis);
