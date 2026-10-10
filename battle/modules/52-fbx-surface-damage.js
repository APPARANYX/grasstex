/* #456 R3: skinned FBX wound anchors and per-mesh UV-space damage rendering.
   Model rig/pose semantics remain owned by the battle; this module paints only
   presentation damage, with the original deferred projection and disposal rules. */
(function (root) {
  'use strict';
  if (root.BattleFbxSurfaceDamage) return;
  root.BattleFbxSurfaceDamage = {
    create: function (deps) {
      var BABYLON = deps.BABYLON,
        V3 = deps.V3,
        applyPose = deps.applyPose;
    /* A presentation anchor on the actual skinned body. Wounds use this instead of a fixed
     per-zone radius: choose the nearest currently skinned vertex once, then resample only that
     vertex's bone weights each render. The anchor therefore follows the same skin deformation as
     the soldier without CPU-skinning the whole mesh every frame. */
    var skinTmp = new V3();
    function skinVertexLocal(raw, idx, wt, mats, vi, out) {
      var x = raw[vi * 3],
        y = raw[vi * 3 + 1],
        z = raw[vi * 3 + 2],
        px = 0,
        py = 0,
        pz = 0,
        total = 0;
      if (mats) {
        for (var set = 0; set < 2; set++) {
          if (!idx[set] || !wt[set]) continue;
          for (var j = 0; j < 4; j++) {
            var w = +wt[set][vi * 4 + j] || 0,
              bi = idx[set][vi * 4 + j] | 0,
              o = bi * 16;
            if (!(w > 1e-5) || o + 15 >= mats.length) continue;
            px += w * (x * mats[o] + y * mats[o + 4] + z * mats[o + 8] + mats[o + 12]);
            py += w * (x * mats[o + 1] + y * mats[o + 5] + z * mats[o + 9] + mats[o + 13]);
            pz += w * (x * mats[o + 2] + y * mats[o + 6] + z * mats[o + 10] + mats[o + 14]);
            total += w;
          }
        }
      }
      if (total < 1e-5) {
        out.x = x;
        out.y = y;
        out.z = z;
      } else {
        out.x = px / total;
        out.y = py / total;
        out.z = pz / total;
      }
      return out;
    }
    function skinAnchor(soldier, point) {
      var fx = soldier && soldier._fbx;
      if (!fx || !point) return null;
      /* A ballistic event can land between rendered frames (and the visual probes intentionally
       fast-forward without rendering). Bring this one soldier to his current animation state before
       locating the wound. This is paid only on a wound event, not per frame. Bumping poseRef makes
       Skeleton.prepare recompute the matrices we just changed instead of reusing the last render. */
      try {
        applyPose(fx);
        fx.poseRef.serial++;
      } catch (_) {}
      var best = null,
        bestD = Infinity,
        VB = BABYLON.VertexBuffer;
      for (var mi = 0; mi < fx.meshes.length; mi++) {
        var mesh = fx.meshes[mi],
          sk = mesh && mesh.skeleton;
        if (!sk || !mesh.getVerticesData) continue;
        var raw = mesh.getVerticesData(VB.PositionKind);
        if (!raw || !raw.length) continue;
        var idx = [
            mesh.getVerticesData(VB.MatricesIndicesKind),
            mesh.getVerticesData(VB.MatricesIndicesExtraKind)
          ],
          wt = [
            mesh.getVerticesData(VB.MatricesWeightsKind),
            mesh.getVerticesData(VB.MatricesWeightsExtraKind)
          ],
          normal = mesh.getVerticesData(VB.NormalKind),
          mats = null;
        try {
          sk.prepare();
          mats = sk.getTransformMatrices && sk.getTransformMatrices(mesh);
        } catch (_) {
          mats = null;
        }
        if (mesh.computeWorldMatrix) mesh.computeWorldMatrix(true);
        var world = mesh.getWorldMatrix(),
          vi = -1;
        for (var v = 0, nv = raw.length / 3; v < nv; v++) {
          skinVertexLocal(raw, idx, wt, mats, v, skinTmp);
          V3.TransformCoordinatesToRef(skinTmp, world, skinTmp);
          var dx = skinTmp.x - point.x,
            dy = skinTmp.y - point.y,
            dz = skinTmp.z - point.z,
            d = dx * dx + dy * dy + dz * dz;
          if (d < bestD) {
            bestD = d;
            vi = v;
          }
        }
        if (vi < 0) continue;
        var indices = [],
          weights = [];
        for (var set = 0; set < 2; set++) {
          if (!idx[set] || !wt[set]) continue;
          for (var j = 0; j < 4; j++) {
            var w = +wt[set][vi * 4 + j] || 0;
            if (w > 1e-5) {
              indices.push(idx[set][vi * 4 + j] | 0);
              weights.push(w);
            }
          }
        }
        best = {
          mesh: mesh,
          vertex: vi,
          position: [raw[vi * 3], raw[vi * 3 + 1], raw[vi * 3 + 2]],
          normal: normal ? [normal[vi * 3], normal[vi * 3 + 1], normal[vi * 3 + 2]] : [0, 1, 0],
          indices: indices,
          weights: weights,
          soldier: soldier,
          distance: Math.sqrt(bestD)
        };
      }
      /* Gameplay's hit ellipsoid is deliberately simple, so allow a modest model/ellipsoid gap but
       never jump a wound across the body to unrelated geometry. */
      return best && best.distance <= 0.55 ? best : null;
    }
    function skinSample(anchor, outPos, outNormal) {
      var mesh = anchor && anchor.mesh,
        sk = mesh && mesh.skeleton;
      if (!mesh || !sk || (mesh.isDisposed && mesh.isDisposed())) return false;
      try {
        sk.prepare();
      } catch (_) {}
      if (mesh.computeWorldMatrix) mesh.computeWorldMatrix(true);
      var mats = sk.getTransformMatrices && sk.getTransformMatrices(mesh),
        p = anchor.position,
        n = anchor.normal,
        px = 0,
        py = 0,
        pz = 0,
        nx = 0,
        ny = 0,
        nz = 0,
        total = 0;
      if (mats && anchor.indices.length) {
        for (var i = 0; i < anchor.indices.length; i++) {
          var w = anchor.weights[i],
            o = anchor.indices[i] * 16;
          if (!(w > 0) || o + 15 >= mats.length) continue;
          px += w * (p[0] * mats[o] + p[1] * mats[o + 4] + p[2] * mats[o + 8] + mats[o + 12]);
          py += w * (p[0] * mats[o + 1] + p[1] * mats[o + 5] + p[2] * mats[o + 9] + mats[o + 13]);
          pz += w * (p[0] * mats[o + 2] + p[1] * mats[o + 6] + p[2] * mats[o + 10] + mats[o + 14]);
          nx += w * (n[0] * mats[o] + n[1] * mats[o + 4] + n[2] * mats[o + 8]);
          ny += w * (n[0] * mats[o + 1] + n[1] * mats[o + 5] + n[2] * mats[o + 9]);
          nz += w * (n[0] * mats[o + 2] + n[1] * mats[o + 6] + n[2] * mats[o + 10]);
          total += w;
        }
      }
      if (total < 1e-5) {
        px = p[0];
        py = p[1];
        pz = p[2];
        nx = n[0];
        ny = n[1];
        nz = n[2];
        total = 1;
      } else if (Math.abs(total - 1) > 0.001) {
        px /= total;
        py /= total;
        pz /= total;
        nx /= total;
        ny /= total;
        nz /= total;
      }
      var wm = mesh.getWorldMatrix().m,
        x = px * wm[0] + py * wm[4] + pz * wm[8] + wm[12],
        y = px * wm[1] + py * wm[5] + pz * wm[9] + wm[13],
        z = px * wm[2] + py * wm[6] + pz * wm[10] + wm[14],
        wx = nx * wm[0] + ny * wm[4] + nz * wm[8],
        wy = nx * wm[1] + ny * wm[5] + nz * wm[9],
        wz = nx * wm[2] + ny * wm[6] + nz * wm[10],
        nl = Math.hypot(wx, wy, wz) || 1;
      outPos.x = x;
      outPos.y = y;
      outPos.z = z;
      outNormal.x = wx / nl;
      outNormal.y = wy / nl;
      outNormal.z = wz / nl;
      return true;
    }

    /* ---- Per-soldier UV-space surface damage ---------------------------------------------------
     V1 deliberately works with today's monolithic soldier meshes. The imported material and its
     base uniform/skin textures stay shared across every clone; only a wounded mesh gets a private
     512x512 transparent decal map. Babylon's UV-space projection shader includes bone skinning, so
     projecting at the live skin-anchor position writes into the correct UV island and the mark then
     deforms for free with later poses. Rigid/segmented helmet and gear meshes can use the same path
     later without changing this contract.
     On a phone each map is 256² with no UV edge blending: edge blending keeps two more full-size
     render targets per wounded mesh, so a desktop map is three 512² targets (~3.5 MB) and by the end
     of a battle ~40 of them held ~136 MB of GPU memory that is never given back. iOS reloads the tab
     when its memory runs out. 256² with no blending is one target (~0.35 MB). `?woundMap=512` or
     `=256` forces either; a phone is a coarse primary pointer. */
    var SURFACE_DAMAGE_PHONE = (function () {
      var q = root.location && /[?&]woundMap=(\d+)/.exec(root.location.search || '');
      if (q) return +q[1] < 512;
      return !!(root.matchMedia && root.matchMedia('(pointer:coarse)').matches);
    })();
    var SURFACE_DAMAGE_SIZE = SURFACE_DAMAGE_PHONE ? 256 : 512;
    function surfaceDamageMap(mesh) {
      if (!mesh || !BABYLON.MeshUVSpaceRenderer || !mesh.getScene || !mesh.getVerticesData) return null;
      if (mesh.isDisposed && mesh.isDisposed()) return null;
      var uv = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
      if (!uv || uv.length < 2) return null;
      var d = mesh._battleSurfaceDamage;
      if (d && d.renderer) return d;
      try {
        var renderer = new BABYLON.MeshUVSpaceRenderer(mesh, mesh.getScene(), {
          width: SURFACE_DAMAGE_SIZE,
          height: SURFACE_DAMAGE_SIZE,
          generateMipMaps: true,
          optimizeUVAllocation: true,
          uvEdgeBlending: !SURFACE_DAMAGE_PHONE
        });
        renderer.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        mesh.decalMap = renderer;
        d = mesh._battleSurfaceDamage = {
          renderer: renderer,
          resolution: SURFACE_DAMAGE_SIZE,
          wounds: 0,
          epoch: 0
        };
        return d;
      } catch (e) {
        console.warn('[ANIM] UV surface-damage map unavailable on ' + (mesh.name || 'soldier mesh'), e);
        return null;
      }
    }
    /* MeshUVSpaceRenderer.isReady() turns true before its first pass can draw: a projection made in the
     tick the map becomes ready (or the same tick it is created) leaves it empty, and only one made at
     least a scene frame later lands (measured: 7 of 7 fresh maps ink after one frame, none in the
     same tick). Every man's first wound hit that window, so the first mark on most bodies never
     appeared. Treat the map as ready once a frame has rendered since isReady() first said so. */
    function surfaceReady(d, scene) {
      if (!d.renderer.isReady || !d.renderer.isReady()) return false;
      var f = scene && scene.getFrameId ? scene.getFrameId() : 0;
      if (d.readyFrame == null) d.readyFrame = f;
      return f > d.readyFrame;
    }
    /* The projection is an ordinary render-target pass, and Babylon skips a disabled mesh in it. The
     off-screen cull (cullApply) disables a soldier's meshes, so a wound landing on a man out of view
     used to paint nothing into his permanent map: those men stayed clean while the ones on screen
     collected every decal. A culled man's wound waits (slow poll, no map or render target made for
     him yet) and paints once his meshes draw again; its anchor is a skin vertex, so it lands on the
     same spot of the body whatever pose he is in by then. */
    function surfaceDrawable(d, scene, mesh) {
      return mesh.isEnabled() && surfaceReady(d, scene);
    }
    function paintSurfaceWound(anchor, stamp, out, diameter, angle, depthCap) {
      var mesh = anchor && anchor.mesh;
      if (!mesh || !stamp) return null;
      var p = new V3(),
        n = new V3();
      if (!skinSample(anchor, p, n)) return null;
      if (out && n.x * out.x + n.y * out.y + n.z * out.z < 0) n.scaleInPlace(-1);
      var d = surfaceDamageMap(mesh);
      if (!d) return null;
      var size = Math.max(0.025, +diameter || 0.1),
        depth = Math.min(depthCap || 0.28, Math.max(0.06, size * 1.5)),
        epoch = d.epoch,
        woundNo = ++d.wounds,
        scene = mesh.getScene(),
        timer = scene && scene.getEngine ? root.setTimeout : setTimeout;
      function project() {
        /* First-use shader/RTT creation can finish after the hit event. Re-sample the live anchor at
         the actual draw moment so animation/fast-forward cannot make the projection miss the body. */
        if (
          !mesh._battleSurfaceDamage ||
          mesh._battleSurfaceDamage !== d ||
          d.epoch !== epoch ||
          (mesh.isDisposed && mesh.isDisposed())
        )
          return;
        try {
          if (!surfaceDrawable(d, scene, mesh)) {
            timer(project, mesh.isEnabled() ? 16 : 250);
            return;
          }
          var q = new V3(),
            sn = new V3();
          if (!skinSample(anchor, q, sn)) return;
          if (out && sn.x * out.x + sn.y * out.y + sn.z * out.z < 0) sn.scaleInPlace(-1);
          d.renderer.renderTexture(stamp, q, sn, new V3(size, size, depth), angle || 0, false);
        } catch (e) {
          console.warn('[ANIM] delayed UV wound projection failed', e);
        }
      }
      try {
        var ready = surfaceDrawable(d, scene, mesh);
        if (!ready) timer(project, mesh.isEnabled() ? 16 : 250);
        else d.renderer.renderTexture(stamp, p, n, new V3(size, size, depth), angle || 0, false);
        return {
          mesh: mesh,
          renderer: d.renderer,
          position: p,
          normal: n,
          resolution: d.resolution,
          wounds: woundNo,
          pending: !ready
        };
      } catch (e) {
        d.wounds = Math.max(0, d.wounds - 1);
        console.warn('[ANIM] UV wound projection failed; body FX will use its skinned-quad fallback', e);
        return null;
      }
    }
    function clearSurfaceDamage(soldier) {
      var fx = soldier && soldier._fbx,
        n = 0;
      if (!fx) return n;
      fx.meshes.forEach(function (mesh) {
        var d = mesh._battleSurfaceDamage;
        if (!d || !d.renderer) return;
        d.epoch++;
        try {
          d.renderer.clear();
          d.wounds = 0;
          n++;
        } catch (_) {}
      });
      return n;
    }
      return {
        skinAnchor: skinAnchor,
        skinSample: skinSample,
        paintSurfaceWound: paintSurfaceWound,
        clearSurfaceDamage: clearSurfaceDamage,
        surfaceDamageResolution: SURFACE_DAMAGE_SIZE,
        surfaceDamageMap: surfaceDamageMap,
        surfaceReady: surfaceReady
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
