/* Unattended, presentation-only 10v10 audio history lab.
   Uses the battle's real weapon pools, propagation queue, mix and listener acoustics.
   No combat simulation, soldier mesh, AI controller, ammunition authority or RNG is touched. */
(function (root) {
  'use strict';
  var query = new URLSearchParams(location.search);
  var duration = Math.max(12, Math.min(600, Number(query.get('duration')) || 220));
  var scale = Math.max(1, Math.min(8, Number(query.get('speed')) || 4));
  var seed = 11027;
  var events = [], history = [], errors = [], status = 'booting', started = false;
  var shotCounts = Object.create(null);
  var obs = null, engine = null, scene = null, audio = null, analyser = null;
  var silentTap = null, ctx = null, monitor = null, simulationTimer = null;
  var startTime = 0, sampleAt = 0, simSeconds = 0, lastWall = 0, previousShotCount = 0;
  var longTasks = 0, longTaskMs = 0, shotCount = 0;
  var audioBase = query.get('audioBase') || (location.origin + '/grasstex/Assets/audio/');
  var dom = function (id) { return document.getElementById(id); };
  function rand() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function event(kind, data) {
    if (events.length < 3000) events.push(Object.assign({ wallMs: Math.round(performance.now() - startTime), simSeconds: +simSeconds.toFixed(2), kind: kind }, data || {}));
  }
  function phase(t) {
    var r = t / duration;
    return r < .10 ? 'first-contact' : r < .54 ? 'exchange' : r < .72 ? 'sustained-fire' :
      r < .84 ? 'lull' : r < .96 ? 'second-exchange' : 'recovery';
  }
  var shooters = [];
  function setupShooters() {
    var rosters = {
      us: ['rifle','rifle','rifle','rifle','rifle','rifle','smg','smg','lmg','carbine'],
      ge: ['rifle','rifle','rifle','rifle','rifle','rifle','smg','smg','lmg','carbine']
    };
    Object.keys(rosters).forEach(function (faction) {
      rosters[faction].forEach(function (kind, i) {
        var weapon = root.BattleWeapons.PROFILES[faction][kind], model = weapon.model;
        var x = (i - 4.5) * 8, z = faction === 'us' ? -60 : 60;
        shooters.push({
          id: faction + '-' + (i + 1), faction: faction, kind: kind, model: model,
          position: new BABYLON.Vector3(x, 1.5, z),
          weapon: { profile: model, kind: kind },
          rof: weapon.rof || (kind === 'rifle' ? .9 : 1),
          cyclic: weapon.cyclic || 0, mag: weapon.magazine || (kind === 'rifle' ? 8 : 30),
          ammo: weapon.magazine || (kind === 'rifle' ? 8 : 30),
          reload: weapon.reloadTime || (kind === 'lmg' ? 5 : 2.6),
          next: rand() * 3, burst: 0, shots: 0
        });
      });
    });
  }
  function emit(s) {
    if (s.ammo <= 0) {
      s.ammo = s.mag;
      s.burst = 0;
      s.next += s.reload;
      return;
    }
    s.ammo--;
    s.shots++;
    shotCount++;
    shotCounts[s.model] = (shotCounts[s.model] || 0) + 1;
    root.BattleAudioScheduler.enqueue(audio, audio.keyFor(s.weapon), s.position, scene.activeCamera);
    if (s.cyclic) {
      if (s.burst === 0) s.burst = Math.min(s.ammo + 1, Math.round(3 + rand() * 5));
      s.burst--;
      s.next += 1 / s.cyclic;
      if (s.burst === 0) s.next += .65 + rand() * .65;
    } else {
      s.next += 1 / s.rof * (.88 + rand() * .24);
    }
  }
  function step() {
    if (status !== 'running') return;
    var now = performance.now(), dt = Math.min(.15, (now - lastWall) / 1000);
    lastWall = now;
    simSeconds = Math.min(duration, simSeconds + dt * scale);
    var activePhase = phase(simSeconds);
    if (activePhase !== lab.phase) {
      lab.phase = activePhase;
      event('phase', { name: activePhase });
    }
    shooters.forEach(function (s) {
      var turns = 0;
      while (s.next <= simSeconds && turns++ < 40) {
        if (activePhase === 'recovery') {
          s.next = simSeconds + .6;
        } else if (activePhase === 'lull' && s.id !== 'us-9' && s.id !== 'ge-9') {
          s.next = simSeconds + 1;
        } else if (activePhase === 'first-contact' && s.id.match(/-(2|4|6|8|10)$/)) {
          s.next = simSeconds + .8;
        } else {
          emit(s);
        }
      }
    });
    if (simSeconds >= duration) finishAfterTail();
  }
  function meter() {
    if (!analyser) return { peak: null, rms: null, clippedSamples: null };
    var samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    var sum = 0, peak = 0, clipped = 0;
    for (var i = 0; i < samples.length; i++) {
      var v = Math.abs(samples[i]);
      sum += v * v; peak = Math.max(peak, v);
      if (v >= .98) clipped++;
    }
    return { peak: +peak.toFixed(4), rms: +Math.sqrt(sum / samples.length).toFixed(5), clippedSamples: clipped };
  }
  function sample() {
    if (!audio) return;
    var s = audio.summary(), clock = performance.now();
    var entry = Object.assign({
      wallMs: Math.round(clock - startTime), simSeconds: +simSeconds.toFixed(2),
      phase: lab.phase, audioContextState: ctx ? ctx.state : 'missing',
      contextTime: ctx ? +ctx.currentTime.toFixed(3) : null,
      activeVoices: s.active, capacity: s.capacity,
      attempts: s.playRequests, droppedBusy: s.droppedBusy,
      droppedNotReady: s.droppedNotReady, droppedLocked: s.droppedLocked,
      errors: s.errors, propagationQueue: root.BattleAudioScheduler.queued,
      simulatedShots: shotCount, shotsSinceLast: shotCount - previousShotCount,
      acousticActive: root.BattleListenerAcoustics ? root.BattleListenerAcoustics.active : null,
      heapBytes: performance.memory ? performance.memory.usedJSHeapSize : null,
      longTasks: longTasks, longTaskMs: Math.round(longTaskMs)
    }, meter());
    previousShotCount = shotCount;
    history.push(entry);
    lab.latest = entry;
    dom('status').textContent = status + ' / ' + lab.phase;
    dom('progress').textContent = Math.round(simSeconds) + '/' + duration + ' sim s · ' + shotCount + ' shots · ' +
      s.active + ' active · ' + s.droppedBusy + ' busy drops · ' + s.droppedNotReady + ' not ready';
    dom('meter').textContent = 'RMS ' + entry.rms + ' · peak ' + entry.peak + ' · queue ' + entry.propagationQueue +
      ' · AudioContext ' + entry.audioContextState;
  }
  function tapOutput() {
    var ae = BABYLON.Engine && BABYLON.Engine.audioEngine;
    ctx = ae && ae.audioContext;
    if (!ctx) throw new Error('Babylon Web Audio context missing');
    var master = ae.masterGain;
    if (!master || !ctx.createAnalyser) {
      event('meter-unavailable', { reason: 'no-master-gain-or-analyser' });
      return;
    }
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    silentTap = ctx.createGain();
    silentTap.gain.value = 0;
    master.connect(analyser);
    analyser.connect(silentTap);
    silentTap.connect(ctx.destination); // Passive, zero-gain analysis branch; main audio routing untouched.
  }
  function exportReport() {
    var first = history[0] || null, last = history[history.length - 1] || null;
    var max = function (field) { return history.reduce(function (m, x) { return Math.max(m, x[field] || 0); }, 0); };
    var quietUnderFire = history.filter(function (x) {
      return x.audioContextState === 'running' && x.shotsSinceLast >= 4 &&
        x.rms !== null && x.rms < .0005;
    }).length;
    return {
      schema: 'grasstex-audio-lab/v1', status: status, ref: root.BATTLE_REF || 'static-page',
      url: location.href, seed: 11027, squadSizes: { us: 10, ge: 10 },
      speed: scale, simulatedDurationSeconds: duration,
      wallDurationSeconds: +((performance.now() - startTime) / 1000).toFixed(2),
      manifestUrl: audioBase + 'manifest.json', audioFormat: root.BattleAudioFormat.state,
      audioMix: root.BattleAudioMix ? { settings: root.BattleAudioMix.get(), legacy: root.BattleAudioMix.legacy,
        tacticalSafety: root.BattleAudioMix.tacticalSafety, stats: root.BattleAudioMix.stats } : null,
      acoustics: root.BattleListenerAcoustics ? { quality: root.BattleListenerAcoustics.quality,
        stats: root.BattleListenerAcoustics.stats } : null,
      summary: { simulatedShots: shotCount, byModel: shotCounts,
        playRequests: last && last.attempts || 0,
        droppedBusy: last && last.droppedBusy || 0,
        droppedNotReady: last && last.droppedNotReady || 0,
        droppedLocked: last && last.droppedLocked || 0,
        playbackErrors: last && last.errors || 0,
        maxActiveVoices: max('activeVoices'), maxQueue: max('propagationQueue'),
        maxPeak: max('peak'), maxRms: max('rms'), samplesQuietUnderFire: quietUnderFire,
        longTasks: longTasks, longTaskMs: Math.round(longTaskMs),
        startingContext: first && first.audioContextState,
        endingContext: last && last.audioContextState },
      shooters: shooters.map(function (s) { return { id: s.id, faction: s.faction, model: s.model, shots: s.shots }; }),
      events: events, timeline: history, errors: errors
    };
  }
  var lab = root.__audioLab = {
    done: false, phase: 'boot', latest: null, history: history, events: events,
    report: function () { return exportReport(); },
    stop: function () { finish('stopped'); }
  };
  var endScheduled = false;
  function finishAfterTail() {
    if (endScheduled) return;
    endScheduled = true;
    clearInterval(simulationTimer);
    status = 'draining';
    event('drain', { seconds: 2.5 });
    setTimeout(function () { finish('completed'); }, 2500);
  }
  function finish(result) {
    if (lab.done) return;
    status = result;
    clearInterval(simulationTimer);
    clearInterval(monitor);
    sample();
    lab.done = true;
    lab.final = exportReport();
    dom('status').textContent = status;
    dom('report').textContent = JSON.stringify(lab.final, null, 2);
    console.log('AUDIO_LAB_REPORT:' + JSON.stringify(lab.final));
    root.dispatchEvent(new Event('audioLabComplete'));
    if (obs) obs.disconnect();
    if (engine) engine.stopRenderLoop();
    if (silentTap) try { silentTap.disconnect(); } catch (_) {}
    if (analyser) try { analyser.disconnect(); } catch (_) {}
  }
  async function boot() {
    startTime = performance.now();
    root.BATTLE_AUDIO_BASE = audioBase;
    dom('status').textContent = 'Loading licensed sample manifest';
    var response = await fetch(audioBase + 'manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('audio manifest HTTP ' + response.status);
    root.BATTLE_AUDIO_MANIFEST = await response.json();
    var canvas = dom('scene');
    engine = new BABYLON.Engine(canvas, false, { audioEngine: true, stencil: false });
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(.04,.06,.08,1);
    var camera = new BABYLON.FreeCamera('listener', new BABYLON.Vector3(0, 5, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 2, 60));
    scene.activeCamera = camera;
    engine.runRenderLoop(function () { scene.render(); });
    // Probe the actual deployed codec; audio format's earlier auto-probe had no manifest yet.
    if (root.BattleAudioFormat) await root.BattleAudioFormat.probe({ manifest: root.BATTLE_AUDIO_MANIFEST, base: audioBase });
    var ae = BABYLON.Engine.audioEngine;
    if (ae && ae.unlock) ae.unlock();
    if (ae && ae.audioContext && ae.audioContext.state === 'suspended') {
      try { await ae.audioContext.resume(); } catch (err) { event('unlock-error', { message: String(err) }); }
    }
    tapOutput();
    if (ctx.state !== 'running') throw new Error('AudioContext is ' + ctx.state + '; headless Chromium needs --autoplay-policy=no-user-gesture-required');
    if (root.BattleAudioMix) root.BattleAudioMix.ensureLimiter(scene);
    if (root.BattleListenerAcoustics) root.BattleListenerAcoustics.bind({
      scene: scene, heightAt: function () { return 0; }, obstacles: []
    });
    setupShooters();
    audio = root.BattleSim.buildWeaponAudio(scene, audioBase);
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        obs = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (e) { longTasks++; longTaskMs += e.duration; });
        });
        obs.observe({ entryTypes: ['longtask'] });
      } catch (_) { obs = null; }
    }
    dom('status').textContent = 'Preparing sample pools';
    // Real pools are intentionally allowed to load rather than substituting synthetic samples.
    await new Promise(function (resolve) { setTimeout(resolve, 2500); });
    event('start', { shooterCount: shooters.length, audioContext: ctx.state, capacity: audio.summary().capacity });
    status = 'running'; lab.phase = 'first-contact'; started = true;
    lastWall = performance.now();
    simulationTimer = setInterval(step, 20);
    monitor = setInterval(sample, 250);
    sample();
  }
  boot().catch(function (err) {
    errors.push(String(err && err.stack || err));
    console.error('[AUDIO LAB]', err);
    finish('error');
  });
})(window);
