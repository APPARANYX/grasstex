/* #456 R3: render-only animation cadence, camera frustum, shadow-aware culling
   and terrain-aligned pose scheduling. The battle remains the owner of semantic poses. */
(function (root) {
  'use strict';
  if (root.BattleFbxRenderLod) return;
  root.BattleFbxRenderLod = {
    create: function (deps) {
      var BABYLON = deps.BABYLON,
        MX = deps.MX,
        V3 = deps.V3,
        MESH_LOD = deps.MESH_LOD,
        meshLodApply = deps.meshLodApply,
        perfNow = deps.perfNow,
        POSE = deps.POSE,
        poseMix = deps.poseMix,
        poseClipSig = deps.poseClipSig,
        poseWeaponSig = deps.poseWeaponSig,
        topEntry = deps.topEntry,
        applyPose = deps.applyPose,
        poseSoldier = deps.poseSoldier,
        poseFrame = deps.poseFrame;
      /* ---- animation detail by distance (presentation only) ---------------------------------------
     applyPose is most of a soldier's per-frame cost, and at the default overview camera every man is
     hundreds of metres away. The render hook therefore re-poses each soldier on a schedule and
     otherwise leaves the last pose on the bones (it rides the soldier root, which the sim still moves
     every frame):
       - near the camera (< near m): every frame;
       - medium (< mid m): about midHz; beyond: about farHz, each soldier on his own phase so the
         far group does not pose on the same frame;
       - outside the view frustum: not re-posed until he is back in view. A soldier whose meshes cast
         shadows (in any shadow generator's caster list) counts as in view while his shadow could be:
         he is held only when both his body and the ground his shadow falls on are outside the view;
       - static (clip state, weapon and hold unchanged since his last pose, not aiming; e.g. a
         finished death clip or a paused sim): posed once, then held.
     A soldier is always posed the first time. Clip clocks stay on simulation time in update(); this
     only decides how often the result is written. `near` and `mid` are 1080p/default-FOV reference
     distances; runtime scales them by projected screen resolution/FOV through BattleScreenSpaceLod.
     They remain presentation-only and never affect gameplay. `?animLod=0` poses every soldier every
     frame (the previous behaviour). */
      /* `clock` (ms) defaults to performance.now(); the full-fidelity benchmark's cadence mode swaps in a
     virtual frame clock so a slow software renderer is scheduled as a 60 FPS device would be. */
      var LOD = {
        on: !(typeof location !== 'undefined' && /[?&]animLod=0\b/.test(location.search || '')),
        near: 35,
        mid: 100,
        screenScale: 1,
        midHz: 30,
        farHz: 10,
        offscreen: true,
        radius: 1.6,
        clock: null,
        skeletons: true
      };
      /* `?farHz=<n>` re-poses soldiers beyond `mid` at n Hz instead of 10 (a device test knob). */
      (function () {
        var m = typeof location !== 'undefined' && /[?&]farHz=([0-9.]+)/.exec(location.search || '');
        if (m && +m[1] > 0) LOD.farHz = +m[1];
      })();
      /* Off-screen culling of soldier meshes. Bind makes each soldier's skinned meshes always active (their
     bounds are the bind pose and never re-synced), so Babylon never culls them and the GPU skinned all
     100 every frame, wherever the camera looked (device benchmark, follow camera: 100 of ~145 draws with
     ~8% of soldiers in view). The render hook disables a soldier's meshes while a sphere of `radius` m
     around him (wider than the animation LOD's, so a lying or falling body stays whole) is outside the
     view and no shadow of his could be in it, and enables them again before the frame that brings him
     back. Weapons and wound decals are culled by Babylon as before. Presentation only. `?soldierCull=0`
     draws every soldier every frame (the previous behaviour). */
      var CULL = {
        on: !(typeof location !== 'undefined' && /[?&]soldierCull=0\b/.test(location.search || '')),
        radius: 3
      };
      var lodVP = new MX(),
        lodPlanes = [0, 1, 2, 3, 4, 5].map(function () {
          return new BABYLON.Plane(0, 0, 0, 0);
        }),
        lodEye = new V3(),
        lodSeq = 0;
      function lodCamera(scene) {
        var cam = scene.activeCamera;
        if (!cam) return false;
        /* The camera as it is now: the scene's own planes are last frame's and lag a camera jump. */
        cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), lodVP);
        BABYLON.Frustum.GetPlanesToRef(lodVP, lodPlanes);
        lodEye.copyFrom(cam.globalPosition || cam.position);
        return true;
      }
      function lodScreenScale(scene) {
        var S = root.BattleScreenSpaceLod,
          scale = 1;
        try {
          if (S && S.scale) scale = +S.scale(scene) || 1;
        } catch (_) {
          scale = 1;
        }
        /* This is presentation scaling, not device classification: the same camera/render size yields
       the same thresholds on phone and desktop. Keep the last value visible for diagnostics. */
        LOD.screenScale = MESH_LOD.screenScale = scale;
        return scale;
      }
      /* Shadow-casting lights this frame: every enabled light with a shadow generator. A soldier casts if
     one of his meshes is in a generator's render list (or the generator selects casters with a
     predicate, which we cannot see into, so every soldier counts). Caster sets are rebuilt only when a
     render list changes length. */
      var lodShadowMaps = [],
        lodShadowDir = new V3(),
        LOD_SHADOW_HEIGHT = 2,
        LOD_SHADOW_MAX = 40;
      function lodShadows(scene) {
        lodShadowMaps.length = 0;
        var lights = scene.lights || [];
        for (var i = 0; i < lights.length; i++) {
          var light = lights[i];
          if (!light.isEnabled() || !light.getShadowGenerators) continue;
          var gens = light.getShadowGenerators();
          if (!gens || !gens.size) continue;
          gens.forEach(function (g) {
            var sm = g && g.getShadowMap && g.getShadowMap();
            if (!sm) return;
            var list = sm.renderList || [];
            if (!sm._lodCasters || sm._lodCastersFrom !== list || sm._lodCastersLen !== list.length) {
              sm._lodCasters = new Set(list);
              sm._lodCastersFrom = list;
              sm._lodCastersLen = list.length;
            }
            lodShadowMaps.push({ light: light, map: sm, all: !!sm.renderListPredicate });
          });
        }
        return lodShadowMaps.length > 0;
      }
      function lodCasts(fx, entry) {
        if (entry.all) return true;
        for (var i = 0; i < fx.meshes.length; i++) if (entry.map._lodCasters.has(fx.meshes[i])) return true;
        return false;
      }
      function lodSphereOut(x, y, z, r) {
        for (var i = 0; i < 6; i++) {
          var pl = lodPlanes[i];
          if (pl.normal.x * x + pl.normal.y * y + pl.normal.z * z + pl.d < -r) return true;
        }
        return false;
      }
      /* Could this soldier's shadow from this light be in view? The shadow of a body LOD_SHADOW_HEIGHT m
     tall falls along the light's horizontal direction; test a sphere around that ground strip. A
     grazing light (very long shadows) always counts as in view. */
      function lodShadowInView(fx, entry) {
        var light = entry.light,
          p = fx.root.position;
        var directional = light.getTypeID
          ? light.getTypeID() === BABYLON.Light.LIGHTTYPEID_DIRECTIONALLIGHT
          : !!light.direction;
        if (directional)
          lodShadowDir.copyFrom(light.direction); /* point and spot lights: from the light through his head */
        else {
          var lp = light.getAbsolutePosition ? light.getAbsolutePosition() : light.position;
          if (!lp) return true;
          lodShadowDir.set(p.x - lp.x, p.y + LOD_SHADOW_HEIGHT - lp.y, p.z - lp.z);
        }
        var len = lodShadowDir.length();
        if (!(len > 1e-6)) return true;
        var dx = lodShadowDir.x / len,
          dy = lodShadowDir.y / len,
          dz = lodShadowDir.z / len;
        if (dy > -0.05) return true;
        var k = LOD_SHADOW_HEIGHT / 2 / -dy,
          half = Math.sqrt(dx * dx + dz * dz) * k;
        if (half > LOD_SHADOW_MAX) return true;
        return !lodSphereOut(p.x + dx * k, p.y, p.z + dz * k, half + LOD.radius);
      }
      /* Is this soldier's body (a sphere of r m around his waist) out of view with no shadow of his in view? */
      function lodOut(fx, shadows, r) {
        var p = fx.root.position;
        if (!lodSphereOut(p.x, p.y + 0.9, p.z, r)) return false;
        if (shadows)
          for (var i = 0; i < lodShadowMaps.length; i++) {
            var e = lodShadowMaps[i];
            if (lodCasts(fx, e) && lodShadowInView(fx, e)) return false;
          }
        return true;
      }
      function cullApply(fx, out) {
        if (!!fx._culled === out) return;
        fx._culled = out;
        for (var i = 0; i < fx.meshes.length; i++) fx.meshes[i].setEnabled(!out);
      }
      function lodSig(fx) {
        if (fx.aim > 0.01) return null; /* the aim twist follows a moving world target */
        var h = poseMix(poseClipSig(fx, false), poseWeaponSig(fx));
        h = poseMix(h, Math.round((fx.cupW == null ? 1 : fx.cupW) * 1e3));
        h = poseMix(h, Math.round((fx.cupRamp == null ? 1 : fx.cupRamp) * 1e3));
        return poseMix(h, Math.round((fx.cupReach == null ? 1 : fx.cupReach) * 1e3));
      }
      /* Why this soldier is not re-posed this frame, or null to pose him. */
      function lodHold(fx, now, cam, shadows, screenScale) {
        /* Signature of the inputs this pose would use, taken before posing: a pose that still moved an
       eased value (the pistol cup) leaves a different signature for the next frame, so it re-poses. */
        var sig = (fx._lodNext = lodSig(fx));
        if (fx._lodAt == null) return null;
        if (sig !== null && sig === fx._lodSig) return 'static';
        if (!cam) return null;
        var p = fx.root.position,
          x = p.x,
          y = p.y + 0.9,
          z = p.z;
        fx._lodShadowKept = false;
        if (LOD.offscreen && lodSphereOut(x, y, z, LOD.radius)) {
          var kept = false;
          if (shadows)
            for (var i = 0; i < lodShadowMaps.length && !kept; i++) {
              var e = lodShadowMaps[i];
              if (lodCasts(fx, e) && lodShadowInView(fx, e)) kept = true;
            }
          if (!kept) return 'offscreen';
          fx._lodShadowKept = true; /* body out of view, shadow maybe in view: schedule by distance */
        }
        var dx = lodEye.x - x,
          dy = lodEye.y - y,
          dz = lodEye.z - z,
          d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        screenScale = screenScale || 1;
        if (d < LOD.near * screenScale) {
          fx._lodEvery = 0;
          return null;
        }
        var every = (fx._lodEvery = 1000 / (d < LOD.mid * screenScale ? LOD.midHz : LOD.farHz));
        return now - fx._lodAt >= every ? null : 'interval';
      }
      function lodPosed(fx, now) {
        /* Each soldier keeps his own phase: first poses are spread over a far interval (golden-ratio
       phase per soldier), and later stamps advance by whole intervals, so soldiers that all came due
       at once (after a pause, a hidden tab or a fast-forward) do not stay in lockstep. */
        var every = fx._lodEvery || 0;
        if (fx._lodAt == null) fx._lodAt = now - ((lodSeq++ * 0.618034) % 1) * (1000 / LOD.farHz);
        else if (every > 0 && now - fx._lodAt < every * 8)
          fx._lodAt += every * Math.floor((now - fx._lodAt) / every);
        else if (every > 0) fx._lodAt = now - ((lodSeq++ * 0.618034) % 1) * every;
        else fx._lodAt = now;
        fx._lodSig = fx._lodNext;
      }

      function hookRender(scene, st) {
        if (st.hooked) return;
        st.hooked = true;
        scene.onBeforeRenderObservable.add(function () {
          var list = st.active,
            on = POSE.on,
            t0 = on ? perfNow() : 0,
            posed = 0,
            lod = LOD.on,
            cull = CULL.on,
            now = lod ? (LOD.clock ? LOD.clock() : perfNow()) : 0,
            cam = (lod || cull) && lodCamera(scene),
            shadows = cam && (cull || LOD.offscreen) && lodShadows(scene),
            screenScale = lodScreenScale(scene);
          var ac = scene.activeCamera,
            eye = ac && (ac.globalPosition || ac.position),
            mf = MESH_LOD.far * screenScale,
            mb = MESH_LOD.band * screenScale;
          for (var i = list.length - 1; i >= 0; i--) {
            var fx = list[i];
            if (fx.holder.isDisposed()) {
              list.splice(i, 1);
              continue;
            }
            if (!fx.root.isEnabled()) continue;
            /* Terrain-follow is presentation-only. Keep active on animation-LOD hold frames
             and after death clips finish so fallen men do not lie horizontally across hills.
             The authoritative root yaw, physics, shot origin, and navigation remain upright. */
            var battle = root.__battle__,
              tilt = { pitch: 0, roll: 0 },
              pronePose = fx.stance === 'prone',
              dying = !!fx.death;
            if (
              (pronePose || dying) &&
              root.BattleBallistics &&
              root.BattleBallistics.proneTerrainTilt &&
              battle &&
              battle.heightAt
            ) {
              tilt = root.BattleBallistics.proneTerrainTilt(fx.soldier, battle);
              if (dying && !pronePose) {
                /* Let the standing/crouched fall play before leaning the whole render rig.
                 By the time the body has landed, it has the slope's final pitch and roll. */
                var deathEntry = topEntry(fx.lower),
                  progress =
                    deathEntry && deathEntry.clip && deathEntry.clip.duration > 0
                      ? deathEntry.t / deathEntry.clip.duration
                      : 1,
                  contact = Math.max(0, Math.min(1, (progress - 0.2) / 0.55));
                tilt.pitch *= contact;
                tilt.roll *= contact;
              }
            }
            var frameDt = Math.max(0, Math.min(0.05, (scene.getEngine().getDeltaTime() || 16.7) / 1000)),
              follow = 1 - Math.exp(-10 * frameDt);
            fx.holder.rotation.x += (tilt.pitch - fx.holder.rotation.x) * follow;
            fx.holder.rotation.z += (tilt.roll - fx.holder.rotation.z) * follow;
            cullApply(fx, !!(cull && cam && lodOut(fx, shadows, CULL.radius)));
            if (on && fx._culled) POSE.lod.culled++;
            /* Mesh LOD: full detail within `far` (with a `band` of hysteresis), the simplified list beyond. */
            if (fx.meshLod) {
              if (!MESH_LOD.on || !eye) meshLodApply(fx, false);
              else {
                var mp = fx.root.position,
                  mx = eye.x - mp.x,
                  my = eye.y - mp.y - 0.9,
                  mz = eye.z - mp.z,
                  md = Math.sqrt(mx * mx + my * my + mz * mz);
                meshLodApply(fx, fx._meshFar ? md > mf - mb : md > mf + mb);
              }
            }
            if (lod) {
              var hold = (fx._lodHold = lodHold(fx, now, cam, shadows, screenScale));
              if (on && fx._lodShadowKept) POSE.lod.shadowKept++;
              if (hold) {
                if (on) POSE.lod[hold]++;
                continue;
              }
              fx._poseDt = fx._lodAt == null ? null : (now - fx._lodAt) / 1000;
            }
            if (on) {
              var a = perfNow();
              applyPose(fx);
              poseSoldier(fx, perfNow() - a, scene);
              posed++;
              POSE.lod.posed++;
            } else applyPose(fx);
            fx.poseRef.serial++; /* the bones moved: his skeletons prepare once this frame */
            if (lod) lodPosed(fx, now);
          }
          if (on) poseFrame(perfNow() - t0, posed);
        });
      }
      return { LOD: LOD, CULL: CULL, hookRender: hookRender };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
