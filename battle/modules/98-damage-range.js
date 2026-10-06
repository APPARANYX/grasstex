/* Damage Range: opt-in visual QA lineup for the real soldier/damage pipeline.
   ?damageRange=1 turns the normal battle into a presentation-only firing range:
   - one real US rifleman is the shooter;
   - one US + one GE soldier for every infantry role stand in a fixed lineup;
   - the normal AI/movement step is disabled, but render-time animation/particles keep running;
   - Fire goes through the shipping onFire/onShot wrappers, so muzzle flash/audio, tracer,
     combat.hit, blood bursts, ground spray and UV-painted entry/exit wounds are the real systems.
   No gameplay damage is synthesized by Fire; Kill is explicit so wound accumulation can be viewed
   without the target dropping after one random combat result.

   URL controls: damageRange=1, rangeTarget=0..9, rangeZone=head|chest|abdomen|arm|leg,
   rangeExit=0|1, rangeAuto=0|1, rangeInterval=seconds, rangeOrbit=0|1, rangeDist=metres,
   rangeUi=full|compact, rangeFps=0|1. Xbox controls work in both manual and auto range modes. */
(function (root) {
  'use strict';
  if (
    !root.BattleSim ||
    !root.BattleModules ||
    typeof BABYLON === 'undefined' ||
    typeof document === 'undefined'
  )
    return;
  var q = new URLSearchParams((root.location && root.location.search) || '');
  if (q.get('damageRange') !== '1') {
    root.BattleDamageRange = { active: false };
    return;
  }
  var oldStart = root.BattleSim.start,
    ROLES = ['rifleman', 'sergeant', 'scout', 'gunner', 'engineer'],
    ZONES = ['head', 'chest', 'abdomen', 'arm', 'leg'],
    api = { active: true, ready: false, version: '1.2-fps-aim' };
  root.BattleDamageRange = api;

  var clamp = root.GTMath.clamp;
  function num(name, fallback, a, b) {
    var v = +q.get(name);
    return isFinite(v) ? clamp(v, a, b) : fallback;
  }
  function label(s) {
    return (s.faction === 'us' ? 'US' : 'GER') + ' ' + s.role;
  }
  function pickRole(sim, faction, role, skip) {
    var a = (sim._roster[faction] || []).filter(function (s) {
      return s && s.role === role && s !== skip;
    });
    return a[0] || null;
  }
  function setEnabled(s, on) {
    if (!s || !s.root) return;
    try {
      s.root.setEnabled(!!on);
    } catch (_) {}
  }
  function neutral(s, sim) {
    if (!s) return;
    s.destination = null;
    s.target = null;
    s._faceHint = null;
    s.moveSpeed = 0;
    s.moving = false;
    s.reloading = false;
    s.reloadUntil = 0;
    /* Even this presentation-only range respects the shipped stance ownership contract: Engagement
       is the only writer. The huge hold is harmless because normal AI is disabled in range mode. */
    try {
      if (root.BattleEngagement && root.BattleEngagement.commitStance)
        root.BattleEngagement.commitStance(s, sim, 'stand', 1e9);
    } catch (_) {}
  }
  function setup(sim) {
    var scene = sim.scene,
      canvas = scene.getEngine().getRenderingCanvas(),
      scenario = (scene.metadata && scene.metadata.battleScenario) || {},
      center = scenario.center || { x: 0, z: 0 },
      field = scene.getMeshByName && scene.getMeshByName('battleField'),
      maxY = -Infinity;
    try {
      if (field && field.computeWorldMatrix) field.computeWorldMatrix(true);
      if (field && field.getBoundingInfo) maxY = field.getBoundingInfo().boundingBox.maximumWorld.y;
    } catch (_) {}
    var baseY = Math.ceil(Math.max(isFinite(maxY) ? maxY + 7 : 35, sim.heightAt(center.x, center.z) + 7)),
      rowZ = center.z + 0.4,
      backZ = center.z + 3.1,
      shooterZ = center.z - 8.4,
      span = 17.1;

    var shooter = pickRole(sim, 'us', 'rifleman', null);
    var targets = [];
    ROLES.forEach(function (role) {
      var us = pickRole(sim, 'us', role, role === 'rifleman' ? shooter : null),
        ge = pickRole(sim, 'ge', role, null);
      if (us) targets.push(us);
      if (ge) targets.push(ge);
    });
    if (!shooter || targets.length < 2) {
      console.error('[RANGE] lineup unavailable');
      return sim;
    }

    var keep = targets.concat([shooter]),
      all = (sim._roster.us || []).concat(sim._roster.ge || []);
    all.forEach(function (s) {
      setEnabled(s, keep.indexOf(s) >= 0);
      neutral(s, sim);
    });
    targets.forEach(function (s, i) {
      var x = center.x - span / 2 + (targets.length === 1 ? span / 2 : (i * span) / (targets.length - 1));
      s.root.position.set(x, baseY, rowZ);
      s.root.rotation.y = Math.PI;
      setEnabled(s, true);
      if (s.root.computeWorldMatrix) s.root.computeWorldMatrix(true);
    });
    shooter.root.position.set(center.x, baseY, shooterZ);
    shooter.root.rotation.y = 0;
    setEnabled(shooter, true);
    if (shooter.root.computeWorldMatrix) shooter.root.computeWorldMatrix(true);

    /* Give blood pools and spray the raised deck as ground instead of the battlefield far below. */
    var oldHeight = sim.heightAt;
    sim.heightAt = function (x, z) {
      if (Math.abs(x - center.x) <= 12.5 && z >= center.z - 9.5 && z <= center.z + 3.5) return baseY;
      return oldHeight(x, z);
    };

    var floor = BABYLON.MeshBuilder.CreateBox(
      'damageRangeFloor',
      { width: 25, depth: 14, height: 0.24 },
      scene
    );
    floor.position.set(center.x, baseY - 0.12, center.z - 2.9);
    var floorMat = new BABYLON.StandardMaterial('damageRangeFloorMat', scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.2, 0.21, 0.18);
    floorMat.specularColor = BABYLON.Color3.Black();
    floor.material = floorMat;
    var back = BABYLON.MeshBuilder.CreateBox(
      'damageRangeBackstop',
      { width: 23, height: 3.4, depth: 0.28 },
      scene
    );
    back.position.set(center.x, baseY + 1.7, backZ);
    var backMat = new BABYLON.StandardMaterial('damageRangeBackstopMat', scene);
    backMat.diffuseColor = new BABYLON.Color3(0.26, 0.25, 0.23);
    backMat.specularColor = BABYLON.Color3.Black();
    back.material = backMat;

    var rangeIndex = clamp(Math.floor(num('rangeTarget', 0, 0, targets.length - 1)), 0, targets.length - 1),
      zone = ZONES.indexOf(q.get('rangeZone')) >= 0 ? q.get('rangeZone') : 'chest',
      exit = q.get('rangeExit') !== '0',
      auto = q.get('rangeAuto') === '1',
      orbit = q.get('rangeOrbit') === '1',
      interval = num('rangeInterval', 1.25, 0.35, 8),
      distance = num('rangeDist', 5.4, 2.5, 14),
      serial = 0,
      autoTimer = null,
      panelCollapsed = q.get('rangeUi') === 'compact' || (auto && q.get('rangeUi') !== 'full'),
      fps = q.get('rangeFps') === '1',
      fpsYaw = 0,
      fpsPitch = 0,
      pointerAim = null,
      padButtons = {},
      padId = null;

    /* A dedicated selected-target orbit camera is more useful here than following the busiest squad. */
    var previous = scene.activeCamera;
    try {
      if (previous && previous.detachControl) previous.detachControl(canvas);
    } catch (_) {}
    var cam = new BABYLON.ArcRotateCamera(
      'damageRangeCam',
      -Math.PI / 2,
      1.14,
      distance,
      new BABYLON.Vector3(targets[rangeIndex].root.position.x, baseY + 1.05, rowZ),
      scene
    );
    cam.minZ = 0.04;
    cam.maxZ = 500;
    cam.lowerRadiusLimit = 2.5;
    cam.upperRadiusLimit = 18;
    cam.lowerBetaLimit = 0.35;
    cam.upperBetaLimit = 1.48;
    cam.wheelPrecision = 18;
    cam.panningSensibility = 0;
    cam.attachControl(canvas, true);
    scene.activeCamera = cam;
    var fpsCam = new BABYLON.UniversalCamera(
      'damageRangeFpsCam',
      new BABYLON.Vector3(center.x, baseY + 1.52, shooterZ + 0.28),
      scene
    );
    fpsCam.inputs.clear();
    fpsCam.minZ = 0.025;
    fpsCam.maxZ = 500;
    fpsCam.fov = 0.92;

    function selected() {
      return targets[rangeIndex];
    }
    function alignShooter() {
      var t = selected();
      if (!t) return;
      shooter.root.position.x = t.root.position.x;
      shooter.root.position.y = baseY;
      shooter.root.position.z = shooterZ;
      shooter.root.rotation.y = 0;
      shooter.target = t;
      shooter._faceHint = t.root.position;
      if (shooter.root.computeWorldMatrix) shooter.root.computeWorldMatrix(true);
    }
    function fpsEye() {
      return new BABYLON.Vector3(
        shooter.root.position.x,
        shooter.root.position.y + 1.52,
        shooter.root.position.z + 0.28
      );
    }
    function placeFpsCamera(recenter) {
      var eye = fpsEye();
      fpsCam.position.copyFrom(eye);
      if (recenter) {
        var p = zonePoint(selected(), zone);
        fpsCam.setTarget(new BABYLON.Vector3(p.x, p.y, p.z));
        fpsYaw = fpsCam.rotation.y;
        fpsPitch = fpsCam.rotation.x;
      } else {
        fpsCam.rotation.y = fpsYaw;
        fpsCam.rotation.x = fpsPitch;
      }
    }
    function setFps(on) {
      fps = !!on;
      if (fps) {
        try {
          cam.detachControl(canvas);
        } catch (_) {}
        placeFpsCamera(true);
        scene.activeCamera = fpsCam;
      } else {
        scene.activeCamera = cam;
        try {
          cam.detachControl(canvas);
        } catch (_) {}
        try {
          cam.attachControl(canvas, true);
        } catch (_) {}
      }
      var r = document.getElementById('rangeReticle');
      if (r) r.style.display = fps ? 'block' : 'none';
      updateUi();
      return fps;
    }
    alignShooter();

    function zonePoint(t, z) {
      var y = { head: 1.7, chest: 1.34, abdomen: 1.06, arm: 1.33, leg: 0.69 }[z] || 1.34,
        side = serial & 1 ? 1 : -1,
        xoff = z === 'arm' ? 0.28 * side : z === 'leg' ? 0.13 * side : 0;
      return { x: t.root.position.x + xoff, y: t.root.position.y + y, z: t.root.position.z };
    }
    function makeShot(t, z, p, dir) {
      z = z || zone;
      p = p || zonePoint(t, z);
      dir = dir || { x: 0, y: 0, z: 1 };
      var entry = { x: p.x, y: p.y, z: p.z - 0.22 },
        leave = exit ? { x: p.x, y: p.y, z: p.z + 0.22 } : null,
        pass = {
          victim: t,
          zone: z,
          entry: entry,
          exit: leave,
          direction: dir,
          exitDirection: leave ? dir : undefined
        };
      return {
        mode: 'raycast',
        stoppedBy: 'soldier',
        surface: 'blood',
        victim: t,
        zone: z,
        impact: entry,
        normal: { x: 0, y: 0, z: -1 },
        direction: dir,
        delay: 0,
        passes: [pass],
        final: leave
          ? {
              stoppedBy: 'environment',
              surface: 'cement',
              blocker: 'wall',
              impact: { x: p.x, y: p.y, z: backZ - 0.14 },
              normal: { x: 0, y: 0, z: -1 }
            }
          : null
      };
    }
    function aimAtTargetPlane() {
      var ray = fpsCam.getForwardRay(100),
        d = ray.direction,
        o = ray.origin || fpsCam.position;
      if (!d || Math.abs(d.z) < 1e-5) return null;
      var tt = (rowZ - o.z) / d.z;
      if (tt <= 0) return null;
      return { point: { x: o.x + d.x * tt, y: o.y + d.y * tt, z: rowZ }, dir: { x: d.x, y: d.y, z: d.z } };
    }
    function aimedBody() {
      var a = aimAtTargetPlane();
      if (!a) return null;
      var best = null,
        bestDx = Infinity;
      targets.forEach(function (t) {
        if (!t || !t.root || t.dead) return;
        var relY = a.point.y - t.root.position.y,
          dx = Math.abs(a.point.x - t.root.position.x);
        if (dx > 0.48 || relY < 0.24 || relY > 1.92 || dx >= bestDx) return;
        var z =
          relY >= 1.53
            ? 'head'
            : dx > 0.23 && relY >= 0.98 && relY < 1.53
              ? 'arm'
              : relY >= 1.18
                ? 'chest'
                : relY >= 0.88
                  ? 'abdomen'
                  : 'leg';
        best = { target: t, zone: z, point: a.point, dir: a.dir };
        bestDx = dx;
      });
      return best;
    }
    function aimMissShot() {
      var ray = fpsCam.getForwardRay(100),
        d = ray.direction,
        o = ray.origin || fpsCam.position,
        tt = d && Math.abs(d.z) > 1e-5 ? (backZ - 0.14 - o.z) / d.z : -1;
      var p =
        tt > 0
          ? { x: o.x + d.x * tt, y: o.y + d.y * tt, z: backZ - 0.14 }
          : { x: o.x + d.x * 40, y: o.y + d.y * 40, z: o.z + d.z * 40 };
      return {
        mode: 'raycast',
        stoppedBy: 'environment',
        surface: 'cement',
        blocker: 'wall',
        impact: p,
        normal: { x: 0, y: 0, z: -1 },
        direction: { x: d.x, y: d.y, z: d.z },
        delay: 0,
        passes: []
      };
    }
    function status() {
      var st = sim._impactFx || {},
        body = st.body || [],
        uv = body.filter(function (e) {
          return e.uv;
        }).length,
        maps = (st.surfaceMaps || []).length,
        t = selected();
      return {
        ready: true,
        target: rangeIndex,
        label: label(t),
        zone: zone,
        exit: exit,
        auto: auto,
        orbit: orbit,
        fps: fps,
        camera: scene.activeCamera && scene.activeCamera.name,
        targets: targets.map(label),
        wounds: body.length,
        uvWounds: uv,
        surfaceMaps: maps,
        shooter: label(shooter),
        baseY: baseY,
        enabledSoldiers: all.filter(function (s) {
          return s.root && s.root.isEnabled && s.root.isEnabled();
        }).length
      };
    }
    function updateUi() {
      if (!api.panel) return;
      var t = selected(),
        sel = api.panel.querySelector('#rangeTarget'),
        zs = api.panel.querySelector('#rangeZone');
      if (sel) sel.value = String(rangeIndex);
      if (zs) zs.value = zone;
      var ex = api.panel.querySelector('#rangeExit');
      if (ex) ex.checked = exit;
      var au = api.panel.querySelector('#rangeAuto');
      if (au) au.checked = auto;
      var or = api.panel.querySelector('#rangeOrbit');
      if (or) or.checked = orbit;
      var fp = api.panel.querySelector('#rangeFps');
      if (fp) fp.checked = fps;
      var read = api.panel.querySelector('#rangeReadout'),
        st = status(),
        compact = api.panel.classList.contains('rangeCollapsed');
      if (read)
        read.textContent = compact
          ? st.label + ' · ' + st.zone + (st.fps ? ' · AIM' : '') + (st.auto ? ' · AUTO' : '')
          : st.label +
            ' · ' +
            st.zone +
            (st.fps ? ' · FPS AIM' : '') +
            (st.exit ? ' · through-shot' : ' · stopped') +
            ' · wounds ' +
            st.wounds +
            ' (UV ' +
            st.uvWounds +
            ') · maps ' +
            st.surfaceMaps;
    }
    function choose(i) {
      rangeIndex = (i + targets.length) % targets.length;
      alignShooter();
      cam.target.set(
        selected().root.position.x,
        selected().root.position.y + 1.05,
        selected().root.position.z
      );
      if (fps) placeFpsCamera(true);
      updateUi();
      return selected();
    }
    function setZone(z) {
      if (ZONES.indexOf(z) >= 0) zone = z;
      if (fps) placeFpsCamera(true);
      updateUi();
    }
    function fire() {
      var t = selected();
      if (!t) return null;
      serial++;
      alignShooter();
      if (fps) placeFpsCamera(false);
      if (shooter.weapon) {
        var cap = shooter.weapon.magSize || (shooter.weapon.stats && shooter.weapon.stats.magazine) || 8;
        shooter.weapon.ammo = cap;
      }
      try {
        if (sim.onFire) sim.onFire(shooter, 0);
      } catch (e) {
        console.warn('[RANGE] onFire', e);
      }
      var aimed = fps ? aimedBody() : null,
        hit = !fps || !!aimed,
        victim = aimed ? aimed.target : t,
        shot = aimed
          ? makeShot(aimed.target, aimed.zone, aimed.point, aimed.dir)
          : fps
            ? aimMissShot()
            : makeShot(t),
        end = (shot.final && shot.final.impact) || shot.impact,
        d = Math.hypot(
          ((end && end.x) || t.root.position.x) - shooter.root.position.x,
          ((end && end.z) || t.root.position.z) - shooter.root.position.z
        );
      try {
        if (sim.onShot) sim.onShot(shooter, victim, hit, d, shot);
      } catch (e) {
        console.error('[RANGE] onShot failed', e);
      }
      if (shooter.weapon)
        shooter.weapon.ammo =
          shooter.weapon.magSize || (shooter.weapon.stats && shooter.weapon.stats.magazine) || 8;
      setTimeout(updateUi, 80);
      return shot;
    }
    function burst3() {
      fire();
      setTimeout(fire, 170);
      setTimeout(fire, 340);
    }
    function kill() {
      var t = selected();
      if (t && !t.dead) sim.killSoldier(t, shooter);
      updateUi();
    }
    function clear() {
      if (root.BattleImpactFx && root.BattleImpactFx.clear) root.BattleImpactFx.clear(sim);
      updateUi();
    }
    function setAuto(on) {
      auto = !!on;
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      if (auto)
        autoTimer = setInterval(function () {
          fire();
          var zi = (ZONES.indexOf(zone) + 1) % ZONES.length;
          zone = ZONES[zi];
          if (zi === 0) choose(rangeIndex + 1);
          else {
            if (fps) placeFpsCamera(true);
            updateUi();
          }
        }, interval * 1000);
      updateUi();
    }
    function setPanelCollapsed(on) {
      panelCollapsed = !!on;
      if (!api.panel) return;
      api.panel.classList.toggle('rangeCollapsed', panelCollapsed);
      var b = api.panel.querySelector('#rangeCollapse');
      if (b) {
        b.textContent = panelCollapsed ? '▴' : '▾';
        b.title = panelCollapsed ? 'Show range controls' : 'Hide range controls';
        b.setAttribute('aria-expanded', panelCollapsed ? 'false' : 'true');
      }
      updateUi();
    }
    function shapedAxis(v) {
      v = isFinite(+v) ? +v : 0;
      var a = Math.abs(v),
        dead = 0.18;
      if (a <= dead) return 0;
      return (Math.sign(v) * (a - dead)) / (1 - dead);
    }
    function buttonValue(pad, index) {
      var b = pad && pad.buttons && pad.buttons[index];
      return b ? Math.max(b.pressed ? 1 : 0, +b.value || 0) : 0;
    }
    function activePad() {
      try {
        if (!root.navigator || typeof root.navigator.getGamepads !== 'function') return null;
        var pads = root.navigator.getGamepads() || [],
          fallback = null;
        for (var i = 0; i < pads.length; i++) {
          var p = pads[i];
          if (!p || p.connected === false) continue;
          if (!fallback) fallback = p;
          if (p.mapping === 'standard') return p;
        }
        return fallback;
      } catch (_) {
        return null;
      }
    }
    function padOnce(pad, index) {
      var down = buttonValue(pad, index) > 0.5,
        was = !!padButtons[index];
      padButtons[index] = down;
      return down && !was;
    }
    function stepGamepad(dt) {
      var pad = activePad();
      if (!pad) {
        padId = null;
        padButtons = {};
        return;
      }
      if (pad.id !== padId) {
        padId = pad.id || 'gamepad';
        padButtons = {};
        root.GTLog('[RANGE] gamepad active: ' + padId);
      }
      var axes = pad.axes || [],
        lookX = shapedAxis(axes[2]),
        lookY = shapedAxis(axes[3]);
      if (fps) {
        fpsYaw += lookX * 2.25 * dt;
        fpsPitch = clamp(fpsPitch + lookY * 1.7 * dt, -1.32, 1.32);
        fpsCam.rotation.y = fpsYaw;
        fpsCam.rotation.x = fpsPitch;
        fpsCam.fov = 0.92 - 0.3 * buttonValue(pad, 6);
      } else {
        if (lookX) cam.alpha += lookX * 2.25 * dt;
        if (lookY) cam.beta = clamp(cam.beta + lookY * 1.7 * dt, cam.lowerBetaLimit, cam.upperBetaLimit);
        var zoom = buttonValue(pad, 6) - buttonValue(pad, 7);
        if (zoom) cam.radius = clamp(cam.radius + zoom * 7 * dt, cam.lowerRadiusLimit, cam.upperRadiusLimit);
      }
      if (padOnce(pad, 0)) fire();
      if (fps && padOnce(pad, 7)) fire();
      if (padOnce(pad, 1)) clear();
      if (padOnce(pad, 2)) burst3();
      if (padOnce(pad, 3)) setAuto(!auto);
      if (padOnce(pad, 4)) {
        exit = !exit;
        updateUi();
      }
      if (padOnce(pad, 5)) {
        orbit = !orbit;
        updateUi();
      }
      if (padOnce(pad, 8)) setPanelCollapsed(!panelCollapsed);
      if (padOnce(pad, 9)) setFps(!fps);
      if (padOnce(pad, 11)) kill();
      if (padOnce(pad, 12)) setZone(ZONES[(ZONES.indexOf(zone) + ZONES.length - 1) % ZONES.length]);
      if (padOnce(pad, 13)) setZone(ZONES[(ZONES.indexOf(zone) + 1) % ZONES.length]);
      if (padOnce(pad, 14)) choose(rangeIndex - 1);
      if (padOnce(pad, 15)) choose(rangeIndex + 1);
      for (var i = 0; i <= 16; i++) padButtons[i] = buttonValue(pad, i) > 0.5;
    }

    /* Keep particles, hit/death animation and decal expiry alive without ever stepping combat AI. */
    sim.paused = false;
    sim.winner = null;
    sim._damageRangeActive = true;
    sim.pause = function () {
      this.paused = false;
    };
    sim.resume = function () {
      this.paused = false;
    };
    sim._frame = function () {};
    var last = performance.now();
    scene.onBeforeRenderObservable.add(function damageRangePresentation() {
      var now = performance.now(),
        dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      sim.time += dt;
      keep.forEach(function (s) {
        try {
          root.BattleSoldierModel.animateWalk(s, dt, 0);
        } catch (_) {}
      });
      if (root.BattleImpactFx && root.BattleImpactFx.tick) root.BattleImpactFx.tick(sim);
      stepGamepad(dt);
      if (fps) placeFpsCamera(false);
      var t = selected();
      if (t && t.root) {
        cam.target.set(t.root.position.x, t.root.position.y + 1.05, t.root.position.z);
        if (!fps && orbit) cam.alpha += dt * 0.32;
      }
    });

    function makePanel() {
      var style = document.createElement('style');
      style.textContent =
        '#damageRangePanel{position:fixed;left:12px;bottom:12px;z-index:2147483000;box-sizing:border-box;width:min(560px,calc(100vw - 24px));' +
        'font:13px/1.25 system-ui,-apple-system,sans-serif;background:rgba(18,18,18,.88);color:#fff;padding:10px 12px;' +
        'border:1px solid rgba(255,255,255,.2);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.35)}' +
        '#damageRangePanel .rangeHeader{display:flex;gap:8px;align-items:center;min-width:0}' +
        '#damageRangePanel .rangeHeader h2{font-size:14px;margin:0;letter-spacing:.03em;white-space:nowrap}' +
        '#rangeReadout{opacity:.82;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}' +
        '#rangeCollapse{margin-left:auto;padding:3px 8px!important;line-height:1.1}' +
        '#damageRangePanel .rangeRow{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:7px}' +
        '#damageRangePanel button,#damageRangePanel select{font:inherit;padding:6px 9px}' +
        '#damageRangePanel button.rangeFire{font-weight:700;padding-left:18px;padding-right:18px}' +
        '#damageRangePanel label{display:flex;gap:4px;align-items:center}#damageRangePanel small{opacity:.72}' +
        '#damageRangePanel.rangeCollapsed{width:min(430px,calc(100vw - 24px));padding:8px 10px}' +
        '#damageRangePanel.rangeCollapsed #rangeControls{display:none}' +
        '#rangeReticle{display:none;position:fixed;left:50%;top:50%;width:24px;height:24px;transform:translate(-50%,-50%);z-index:2147482998;pointer-events:none}' +
        '#rangeReticle:before,#rangeReticle:after{content:"";position:absolute;background:rgba(255,255,255,.92);box-shadow:0 0 2px rgba(0,0,0,.9)}' +
        '#rangeReticle:before{left:11px;top:2px;width:2px;height:20px}#rangeReticle:after{left:2px;top:11px;width:20px;height:2px}' +
        '#rangeReticle i{position:absolute;left:9px;top:9px;width:6px;height:6px;border:1px solid rgba(255,255,255,.95);border-radius:50%;box-sizing:border-box}' +
        '@media (max-width:900px) and (orientation:landscape){#damageRangePanel{left:10px;bottom:10px;width:min(400px,calc(100vw - 20px));font-size:12px;padding:8px 9px}' +
        '#damageRangePanel.rangeCollapsed{width:min(360px,calc(100vw - 20px))}#damageRangePanel button,#damageRangePanel select{padding:5px 7px}}';
      document.head.appendChild(style);
      var ret = document.createElement('div');
      ret.id = 'rangeReticle';
      ret.setAttribute('aria-hidden', 'true');
      ret.innerHTML = '<i></i>';
      document.body.appendChild(ret);
      var p = document.createElement('div');
      p.id = 'damageRangePanel';
      p.innerHTML =
        '<div class="rangeHeader"><h2>DAMAGE RANGE</h2><span id="rangeReadout"></span><button id="rangeCollapse" type="button" aria-label="Toggle range controls">▾</button></div>' +
        '<div id="rangeControls">' +
        '<div class="rangeRow"><button id="rangePrev">◀</button><select id="rangeTarget"></select><button id="rangeNext">▶</button>' +
        '<select id="rangeZone"><option>head</option><option>chest</option><option>abdomen</option><option>arm</option><option>leg</option></select>' +
        '<label><input id="rangeExit" type="checkbox"> exit</label><label><input id="rangeOrbit" type="checkbox"> orbit</label>' +
        '<label><input id="rangeAuto" type="checkbox"> auto</label><label><input id="rangeFps" type="checkbox"> FPS aim</label></div>' +
        '<div class="rangeRow"><button class="rangeFire" id="rangeFire">FIRE</button><button id="rangeBurst">3-shot</button>' +
        '<button id="rangeKill">Kill</button><button id="rangeClear">Clear blood</button><button id="rangeReset">Reset range</button></div>' +
        '<div class="rangeRow"><small>Keyboard: Space fire · ←/→ target · 1–5 zone · F FPS aim · E exit · O orbit · A auto · C clear</small></div>' +
        '<div class="rangeRow"><small>FPS aim: drag/mouse to aim · centered reticle · shots follow the reticle</small></div>' +
        '<div class="rangeRow"><small>Xbox: A/RT fire in FPS · X 3-shot · D-pad target/zone · Menu FPS · Y auto · B clear · LB exit · RB orbit · RS aim/orbit · LT ADS · R3 kill · View UI</small></div>' +
        '</div>';
      document.body.appendChild(p);
      api.panel = p;
      var ts = p.querySelector('#rangeTarget');
      targets.forEach(function (s, i) {
        var o = document.createElement('option');
        o.value = i;
        o.textContent = i + 1 + '. ' + label(s);
        ts.appendChild(o);
      });
      p.querySelector('#rangeCollapse').onclick = function () {
        setPanelCollapsed(!panelCollapsed);
      };
      p.querySelector('#rangePrev').onclick = function () {
        choose(rangeIndex - 1);
      };
      p.querySelector('#rangeNext').onclick = function () {
        choose(rangeIndex + 1);
      };
      ts.onchange = function () {
        choose(+ts.value || 0);
      };
      p.querySelector('#rangeZone').onchange = function () {
        setZone(this.value);
      };
      p.querySelector('#rangeExit').onchange = function () {
        exit = this.checked;
        updateUi();
      };
      p.querySelector('#rangeOrbit').onchange = function () {
        orbit = this.checked;
        updateUi();
      };
      p.querySelector('#rangeAuto').onchange = function () {
        setAuto(this.checked);
      };
      p.querySelector('#rangeFps').onchange = function () {
        setFps(this.checked);
      };
      p.querySelector('#rangeFire').onclick = fire;
      p.querySelector('#rangeBurst').onclick = burst3;
      p.querySelector('#rangeKill').onclick = kill;
      p.querySelector('#rangeClear').onclick = clear;
      p.querySelector('#rangeReset').onclick = function () {
        location.reload();
      };
      window.addEventListener('keydown', function (e) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        if (e.code === 'Space') {
          e.preventDefault();
          fire();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          choose(rangeIndex - 1);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          choose(rangeIndex + 1);
        } else if (/^Digit[1-5]$/.test(e.code)) setZone(ZONES[+e.code.slice(5) - 1]);
        else if (e.key.toLowerCase() === 'e') {
          exit = !exit;
          updateUi();
        } else if (e.key.toLowerCase() === 'o') {
          orbit = !orbit;
          updateUi();
        } else if (e.key.toLowerCase() === 'a') setAuto(!auto);
        else if (e.key.toLowerCase() === 'f') setFps(!fps);
        else if (e.key.toLowerCase() === 'c') clear();
      });
      canvas.addEventListener(
        'pointerdown',
        function (e) {
          if (!fps) return;
          pointerAim = { id: e.pointerId, x: e.clientX, y: e.clientY };
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (_) {}
          e.preventDefault();
        },
        { passive: false }
      );
      canvas.addEventListener(
        'pointermove',
        function (e) {
          if (!fps || !pointerAim || pointerAim.id !== e.pointerId) return;
          var dx = e.clientX - pointerAim.x,
            dy = e.clientY - pointerAim.y;
          pointerAim.x = e.clientX;
          pointerAim.y = e.clientY;
          fpsYaw += dx * 0.0032;
          fpsPitch = clamp(fpsPitch + dy * 0.0027, -1.32, 1.32);
          fpsCam.rotation.y = fpsYaw;
          fpsCam.rotation.x = fpsPitch;
          e.preventDefault();
        },
        { passive: false }
      );
      function endAim(e) {
        if (pointerAim && pointerAim.id === e.pointerId) pointerAim = null;
      }
      canvas.addEventListener('pointerup', endAim);
      canvas.addEventListener('pointercancel', endAim);
      canvas.addEventListener(
        'wheel',
        function (e) {
          if (!fps) return;
          e.preventDefault();
          fpsCam.fov = clamp(fpsCam.fov + e.deltaY * 0.0007, 0.52, 1.12);
        },
        { passive: false }
      );
      setPanelCollapsed(panelCollapsed);
      setFps(fps);
    }
    makePanel();

    /* Leave the normal page objects in the DOM for loader/start code, but make the range the UI. */
    ['hud', 'hudToggle', 'animationLab', 'animationLabToggle', 'banner'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.style.display = 'none';
    });
    var start = document.getElementById('startBtn');
    if (start) start.hidden = true;
    document.title = 'WW2FPS Damage Range · ' + (root.BATTLE_BUILD || 'dev');

    api.ready = true;
    api.sim = sim;
    api.targets = targets;
    api.shooter = shooter;
    api.camera = cam;
    api.state = status;
    api.fire = fire;
    api.burst3 = burst3;
    api.kill = kill;
    api.clear = clear;
    api.choose = choose;
    api.setZone = setZone;
    api.setAuto = setAuto;
    api.setPanelCollapsed = setPanelCollapsed;
    api.setFps = setFps;
    api.gamepadMap = {
      A: 'fire',
      RT: 'fire in FPS',
      B: 'clear',
      X: '3-shot',
      Y: 'auto',
      LB: 'exit',
      RB: 'orbit',
      DPad: 'target/zone',
      RS: 'aim/orbit',
      LT: 'ADS in FPS',
      R3: 'kill',
      View: 'toggle UI',
      Menu: 'toggle FPS'
    };
    updateUi();
    if (auto) setAuto(true);
    root.GTLog('[RANGE] ready: ' + targets.map(label).join(', ') + ' · deckY=' + baseY);
    return sim;
  }

  root.BattleSim.start = function (scene, opts) {
    return setup(oldStart(scene, opts));
  };
  root.BattleModules.registerSystem('damage-range', { version: '1.2-fps-aim' });
})(typeof window !== 'undefined' ? window : globalThis);
