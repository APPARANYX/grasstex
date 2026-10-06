/* Weapon foley and burst tails: what a gun sounds like when it is not firing a round.
   Presentation only. It watches each man near the camera and his weapon (reloading, clearing a
   stoppage, prone behind a bipod, the rounds left after a shot) and never writes simulation state or
   draws the combat RNG: takes are picked by a hash of the man and a counter. Its own memory of what
   each man was doing lives in a WeakMap, not on the soldier. `?weaponFoley=0` installs nothing.

   Clips: Assets/audio/manifest.json category `weapon.<model>` (licensed private clips; layout and actions
   in Assets/audio/weapon-clip-manifest.json). An action with no files plays nothing, so a model
   decides its own reload by which stage clips it has:
   - belt-fed (reloadCoverOpen): cover open, belt laid, cover shut, charging handle;
   - en-bloc clip (reloadClipInsert): clip thumbed in, operating rod home; the clip pings out on the
     shot that empties it (clipPing);
   - stripper clip (reloadStripperClip): bolt open, clip, bolt shut (or a bolt cycle); a bolt gun also
     cycles its bolt BOLT_AFTER after every shot that leaves a round (boltCycle);
   - break action (reloadOpen): open, shell in, close;
   - magazine (reloadMagOut): magazine out, magazine in, charge or slide release.
   Stages sit at fractions of the reload's own length, so a slow reload spreads them out. A stoppage
   clicks when it starts (stoppageClick) and is racked clear near its end (stoppageClear). A man going
   prone with a bipod gun deploys it, and folds it getting up (bipodDeploy/bipodFold).

   Burst tails: an automatic that has fired and then stays quiet for TAIL_QUIET cyclic intervals plays
   one fireTail (the echo after the last round, no transient), so single-round `fire` clips can stay
   short. Tails carry much farther than handling noise (TAIL_RANGE against FOLEY_RANGE). Every sound
   waits for the speed of sound. */
(function (root) {
  'use strict';
  var SPEED_OF_SOUND = 343,
    FOLEY_RANGE = 30,
    TAIL_RANGE = 1500,
    FOLEY_GAIN = 0.5,
    TAIL_GAIN = 0.32,
    BOLT_AFTER = 0.35,
    TAIL_QUIET = 1.5,
    TAIL_MIN_QUIET = 0.15,
    CLEAR_AT = 0.8;
  /* Each stage: the actions it may play, first one the model has wins, and when (fraction of the reload). */
  var PLANS = [
    { needs: 'reloadCoverOpen', stages: [[['reloadCoverOpen'], 0.1], [['reloadBeltLay'], 0.4], [['reloadCoverClose'], 0.68], [['reloadCharge'], 0.86]] },
    { needs: 'reloadClipInsert', stages: [[['reloadClipInsert'], 0.45], [['reloadBoltRelease'], 0.8]] },
    { needs: 'reloadStripperClip', stages: [[['reloadBoltOpen'], 0.08], [['reloadStripperClip'], 0.4], [['reloadBoltClose', 'boltCycle', 'reloadCharge'], 0.85]] },
    { needs: 'reloadOpen', stages: [[['reloadOpen'], 0.1], [['reloadShell'], 0.45], [['reloadClose'], 0.85]] },
    { needs: 'reloadMagOut', stages: [[['reloadMagOut'], 0.12], [['reloadMagIn'], 0.55], [['reloadCharge', 'reloadSlideRelease'], 0.85]] }
  ];
  /* Never preload actions that no runtime path plays. */
  var UNPLAYED = { fire: true, fireDistant: true, handling: true, grab: true, safety: true, mode: true };
  var ON = !(typeof location !== 'undefined' && /[?&]weaponFoley=0\b/.test(location.search || ''));

  function clips(model) {
    var m = root.BATTLE_AUDIO_MANIFEST,
      c = m && m.categories && m.categories['weapon.' + model];
    return c || {};
  }
  function has(c, action) {
    return !!(c[action] && c[action].length);
  }
  /* The reload of a model with these clips: [{action, at}] in order, `at` a fraction of the reload. */
  function reloadStages(c) {
    for (var i = 0; i < PLANS.length; i++) {
      if (!has(c, PLANS[i].needs)) continue;
      var out = [];
      PLANS[i].stages.forEach(function (st) {
        for (var k = 0; k < st[0].length; k++) if (has(c, st[0][k])) return void out.push({ action: st[0][k], at: st[1] });
      });
      return out;
    }
    return [];
  }
  /* Seconds of quiet after an automatic's last round before its tail plays. */
  function tailQuiet(cyclic) {
    return Math.max(TAIL_MIN_QUIET, cyclic > 0 ? TAIL_QUIET / cyclic : 0);
  }
  function hash01(n) {
    n = (n ^ 61) ^ (n >>> 16);
    n = (n + (n << 3)) | 0;
    n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d);
    n = n ^ (n >>> 15);
    return (n >>> 0) / 4294967296;
  }
  function v3(p) {
    return p ? { x: +p.x || 0, y: +p.y || 0, z: +p.z || 0 } : null;
  }
  var dist=root.GTMath.distStrict;
  function foleyGain(d) {
    var near = Math.max(0, 1 - d / FOLEY_RANGE);
    return FOLEY_GAIN * (0.1 + 0.9 * Math.pow(near, 1.3));
  }
  function tailGain(d) {
    return TAIL_GAIN * Math.pow(Math.max(1, d), -0.36);
  }
  function nowMs() {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  /* One Babylon voice per clip file of every model the sides field; loudness and delay are ours. */
  function buildVoices(scene, base) {
    var pools = {},
      P = (root.BattleWeapons && root.BattleWeapons.PROFILES) || {};
    Object.keys(P).forEach(function (f) {
      Object.keys(P[f]).forEach(function (kind) {
        var model = P[f][kind] && P[f][kind].model,
          c = model ? clips(model) : {};
        Object.keys(c).forEach(function (action) {
          if (UNPLAYED[action] || pools[model + '.' + action]) return;
          pools[model + '.' + action] = c[action].map(function (file, i) {
            return {
              endsAt: 0,
              sound: new BABYLON.Sound('foley-' + model + '-' + action + i, root.BattleAudioFormat ? root.BattleAudioFormat.url(base + file) : base + file, scene, null, {
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
    });
    return pools;
  }

  function install(sim, opts) {
    opts = opts || {};
    if (!ON || !sim || sim._weaponFoleyInstalled) return sim;
    sim._weaponFoleyInstalled = true;
    var scene = sim.scene,
      now = opts.now || nowMs,
      later =
        opts.later ||
        function (ms, fn) {
          if (ms > 0) setTimeout(fn, ms);
          else fn();
        },
      pools = opts.voices || {},
      seen = typeof WeakMap !== 'undefined' ? new WeakMap() : null,
      count = 0,
      stats = (sim._weaponFoley = { played: {}, scheduled: 0 });
    if (!seen) return sim;
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
    function where(s) {
      var r = s && s.root && s.root.position;
      return r ? { x: r.x, y: (r.y || 0) + 1.1, z: r.z } : null;
    }
    function modelOf(s) {
      return s && s.weapon && s.weapon.profile;
    }
    /* Play `action` of the man's weapon from where he stands, after the sound has travelled. */
    function play(s, action, tail) {
      var model = modelOf(s),
        pool = model && pools[model + '.' + action],
        L = listener(),
        p = where(s);
      if (!pool || !pool.length || !L || !p) return;
      var d = dist(L, p);
      if (d > (tail ? TAIL_RANGE : FOLEY_RANGE)) return;
      var gain = tail ? tailGain(d) : foleyGain(d);
      later((d / SPEED_OF_SOUND) * 1000, function () {
        var t = now(),
          free = pool.filter(function (v) {
            return v.endsAt <= t;
          });
        if (!free.length) return;
        var v = free[(hash01(((+s.id || 0) * 7919) ^ count++) * free.length) | 0];
        v.endsAt = t + (tail ? 2500 : 900);
        stats.played[action] = (stats.played[action] || 0) + 1;
        try {
          var snd = v.sound;
          if (snd.setPosition) snd.setPosition(typeof BABYLON !== 'undefined' && BABYLON.Vector3 ? new BABYLON.Vector3(p.x, p.y, p.z) : p);
          if (snd.setVolume) snd.setVolume(gain);
          if (snd.setPlaybackRate) snd.setPlaybackRate(1);
          snd.play();
        } catch (_) {}
      });
    }
    /* Wall-clock ms for sim seconds: the battle runs at timeScale. */
    function wallMs(simSeconds) {
      var k = +sim.timeScale > 0 ? +sim.timeScale : 1;
      return Math.max(0, (simSeconds / k) * 1000);
    }
    function stateOf(s) {
      var st = seen.get(s);
      if (!st) {
        st = { reloading: !!s.reloading, stoppage: !!s.clearingStoppage, lying: !!s.prone, lastShot: 0, tailDue: false, model: modelOf(s) };
        seen.set(s, st);
      }
      return st;
    }
    function startReload(s) {
      var c = clips(modelOf(s)),
        len = wallMs(Math.max(0.5, (+s.reloadUntil || 0) - (+sim.time || 0)));
      reloadStages(c).forEach(function (stage) {
        stats.scheduled++;
        later(len * stage.at, function () {
          if (!s.dead && s.reloading) play(s, stage.action, false);
        });
      });
    }
    function startStoppage(s) {
      play(s, 'stoppageClick', false);
      var len = wallMs(Math.max(0.5, (+s.stoppageUntil || 0) - (+sim.time || 0)));
      stats.scheduled++;
      later(len * CLEAR_AT, function () {
        if (!s.dead && s.clearingStoppage) play(s, 'stoppageClear', false);
      });
    }
    function step() {
      var L = listener();
      if (!L) return;
      var t = now(),
        men = (sim.rosterOf ? (sim.rosterOf('us') || []).concat(sim.rosterOf('ge') || []) : []);
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.weapon) continue;
        var st = stateOf(s),
          p = where(s);
        if (st.model !== modelOf(s)) {
          st.model = modelOf(s);
          st.reloading = !!s.reloading;
          st.stoppage = !!s.clearingStoppage;
          st.tailDue = false;
        }
        var near = p && dist(L, p) <= FOLEY_RANGE;
        if (!!s.reloading !== st.reloading) {
          st.reloading = !!s.reloading;
          if (st.reloading && near) startReload(s);
        }
        if (!!s.clearingStoppage !== st.stoppage) {
          st.stoppage = !!s.clearingStoppage;
          if (st.stoppage && near) startStoppage(s);
        }
        if (!!s.prone !== st.lying) {
          st.lying = !!s.prone;
          if (near) play(s, st.lying ? 'bipodDeploy' : 'bipodFold', false);
        }
        if (st.tailDue) {
          var cyc = (s.weapon.stats && +s.weapon.stats.cyclic) || 0;
          if (t - st.lastShot >= tailQuiet(cyc) * 1000) {
            st.tailDue = false;
            play(s, 'fireTail', true);
          }
        }
      }
    }
    /* A round leaves the gun (when its report is presented): bolt cycle, clip ping, and arm the tail. */
    function shot(s) {
      if (!s || s.dead || !s.weapon) return;
      var st = stateOf(s),
        w = s.weapon,
        c = clips(modelOf(s));
      st.lastShot = now();
      if ((w.stats && +w.stats.cyclic) > 0 && has(c, 'fireTail')) st.tailDue = true;
      var left = +w.ammo || 0;
      if (left <= 0 && has(c, 'clipPing')) later(40, function () { play(s, 'clipPing', false); });
      else if (left > 0 && has(c, 'boltCycle') && !((w.stats && +w.stats.cyclic) > 0))
        later(BOLT_AFTER * 1000, function () {
          if (!s.dead) play(s, 'boltCycle', false);
        });
    }
    var oldFire = sim.onFire;
    sim.onFire = function (soldier, delay) {
      var r = oldFire ? oldFire.apply(sim, arguments) : undefined;
      if (delay > 0 && sim.presentAfter) sim.presentAfter(delay, function () { shot(soldier); });
      else shot(soldier);
      return r;
    };
    if (opts.observe) opts.observe(step);
    else if (scene && scene.onBeforeRenderObservable) scene.onBeforeRenderObservable.add(step);
    return sim;
  }

  root.BattleWeaponFoley = {
    on: ON,
    UNPLAYED: UNPLAYED,
    FOLEY_RANGE: FOLEY_RANGE,
    TAIL_RANGE: TAIL_RANGE,
    BOLT_AFTER: BOLT_AFTER,
    reloadStages: reloadStages,
    tailQuiet: tailQuiet,
    install: install
  };
  if (root.BattleSim && root.BattleSim.start && typeof BABYLON !== 'undefined') {
    var oldStart = root.BattleSim.start;
    root.BattleSim.start = function (scene, opts) {
      return install(oldStart(scene, opts), { audioBase: opts && opts.audioBase });
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
