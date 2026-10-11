/* Damage range scene lineup, real shot dispatch and presentation session owner. */
(function (root) {
  'use strict';
  root.BattleDamageRangeSession = {
    create: function (deps) {
      var q = deps.q,
        api = deps.api,
        ROLES = deps.ROLES,
        ZONES = deps.ZONES,
        clamp = deps.clamp,
        num = deps.num,
        label = deps.label,
        pickRole = deps.pickRole,
        setEnabled = deps.setEnabled,
        neutral = deps.neutral,
        rangeZonePoint = deps.rangeZonePoint,
        rangeShot = deps.rangeShot,
        rangePanelCss = deps.rangePanelCss,
        rangePanelMarkup = deps.rangePanelMarkup,
        shapedAxis = deps.shapedAxis,
        buttonValue = deps.buttonValue,
        rangeKeyboardAction = deps.rangeKeyboardAction,
        rangePadCommands = deps.rangePadCommands;
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

        var rangeIndex = clamp(
            Math.floor(num('rangeTarget', 0, 0, targets.length - 1)),
            0,
            targets.length - 1
          ),
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
          view,
          panel;

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
        var life = root.BattleDamageRangeLifetime.create(scene);
        life.own(function () {
          floor.dispose();
          back.dispose();
          floorMat.dispose();
          backMat.dispose();
        });
        life.own(function () {
          api.ready = false;
        });
        view = root.BattleDamageRangeView.create({
          scene: scene,
          canvas: canvas,
          targets: targets,
          shooter: shooter,
          baseY: baseY,
          rowZ: rowZ,
          shooterZ: shooterZ,
          center: center,
          distance: distance,
          rangeIndex: rangeIndex,
          selected: selected,
          zone: function () {
            return zone;
          },
          zonePoint: zonePoint,
          clamp: clamp,
          shapedAxis: shapedAxis,
          buttonValue: buttonValue,
          rangePadCommands: rangePadCommands,
          life: life,
          isFps: function () {
            return fps;
          },
          setFpsState: function (on) {
            fps = on;
          },
          updateUi: updateUi,
          applyRangeAction: applyRangeAction
        });
        var cam = view.camera,
          fpsCam = view.fpsCamera;
        function placeFpsCamera(recenter) {
          view.placeFpsCamera(recenter);
        }
        function setFps(on) {
          return view.setFps(on);
        }
        function updateUi() {
          if (panel) panel.update();
        }
        function setPanelCollapsed(on) {
          panel.setCollapsed(on);
        }
        alignShooter();

        function zonePoint(t, z) {
          return rangeZonePoint(t, z, serial);
        }
        function makeShot(t, z, p, dir) {
          z = z || zone;
          return rangeShot(t, z, p || zonePoint(t, z), dir || { x: 0, y: 0, z: 1 }, exit, backZ);
        }
        function aimAtTargetPlane() {
          var ray = fpsCam.getForwardRay(100),
            d = ray.direction,
            o = ray.origin || fpsCam.position;
          if (!d || Math.abs(d.z) < 1e-5) return null;
          var tt = (rowZ - o.z) / d.z;
          if (tt <= 0) return null;
          return {
            point: { x: o.x + d.x * tt, y: o.y + d.y * tt, z: rowZ },
            dir: { x: d.x, y: d.y, z: d.z }
          };
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
          life.timeout(updateUi, 80);
          return shot;
        }
        function burst3() {
          fire();
          life.timeout(fire, 170);
          life.timeout(fire, 340);
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
            life.cancelInterval(autoTimer);
            autoTimer = null;
          }
          if (auto)
            autoTimer = life.interval(function () {
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
        function applyRangeAction(action) {
          if (action === 'fire') fire();
          else if (action === 'clear') clear();
          else if (action === 'burst3') burst3();
          else if (action === 'kill') kill();
          else if (action === 'toggleAuto') setAuto(!auto);
          else if (action === 'toggleFps') setFps(!fps);
          else if (action === 'togglePanel') setPanelCollapsed(!panelCollapsed);
          else if (action === 'toggleExit') {
            exit = !exit;
            updateUi();
          } else if (action === 'toggleOrbit') {
            orbit = !orbit;
            updateUi();
          } else if (action === 'previousZone')
            setZone(ZONES[(ZONES.indexOf(zone) + ZONES.length - 1) % ZONES.length]);
          else if (action === 'nextZone') setZone(ZONES[(ZONES.indexOf(zone) + 1) % ZONES.length]);
          else if (action === 'previousTarget') choose(rangeIndex - 1);
          else if (action === 'nextTarget') choose(rangeIndex + 1);
          else if (action.slice(0, 5) === 'zone:') setZone(action.slice(5));
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
        life.observe(scene.onBeforeRenderObservable, function damageRangePresentation() {
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
          view.stepGamepad(dt);
          if (fps) placeFpsCamera(false);
          var t = selected();
          if (t && t.root) {
            cam.target.set(t.root.position.x, t.root.position.y + 1.05, t.root.position.z);
            if (!fps && orbit) cam.alpha += dt * 0.32;
          }
        });

        panel = root.BattleDamageRangePanel.create({
          api: api,
          targets: targets,
          label: label,
          life: life,
          rangePanelCss: rangePanelCss,
          rangePanelMarkup: rangePanelMarkup,
          rangeKeyboardAction: rangeKeyboardAction,
          status: status,
          applyRangeAction: applyRangeAction,
          choose: choose,
          setZone: setZone,
          setAuto: setAuto,
          setFps: setFps,
          fire: fire,
          burst3: burst3,
          kill: kill,
          clear: clear,
          isCollapsed: function () {
            return panelCollapsed;
          },
          setCollapsedState: function (on) {
            panelCollapsed = on;
          },
          setExit: function (on) {
            exit = on;
            updateUi();
          },
          setOrbit: function (on) {
            orbit = on;
            updateUi();
          }
        });
        setPanelCollapsed(panelCollapsed);
        setFps(fps);

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

      return setup(deps.sim);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
