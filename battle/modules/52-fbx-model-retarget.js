/* #456 R3: model-specific FBX clip retargeting and stride-speed estimation.
   The prepared clip converter, fast/matrix parity switch and clip data ownership
   remain unchanged. Runtime dependencies are captured once on backend install. */
(function (root) {
  'use strict';
  if (root.BattleFbxModelRetarget) return;
  root.BattleFbxModelRetarget = {
    create: function (deps) {
      var Q = deps.Q,
        V3 = deps.V3,
        MX = deps.MX,
        FPS = deps.FPS,
        canon = deps.canon,
        BONE = deps.BONE,
        RETARGET_QUAT = root.BattleFbxRetargetQuat,
        RETARGET_REST = root.BattleFbxRetargetRest;
      var rtA = new MX(),
        rtB = new MX(),
        rtC = new MX(),
        rtQ = new Q();
      function quatMatrix(x, y, z, w, out) {
        rtQ.set(x, y, z, w);
        rtQ.toRotationMatrix(out);
        return out;
      }
      /* The same retarget in quaternions on plain arrays, ~5x cheaper than the matrix loop below and
     equal to it within float32 rounding (Babylon's row-vector M(a)×M(b) is the product b⊗a, a
     transpose is a conjugate): Ws = Ws_parent⊗q, Wt = Ws⊗K with K = conj(S0)⊗T0 fixed per bone,
     local = conj(Wt_parent)⊗Wt; a bone the model does not animate follows its rest pose.
     `?fastRetarget=0` runs the matrix loop instead (scripts/probe_retarget.cjs compares them). */
      var FAST_RETARGET = !(
        typeof location !== 'undefined' && /[?&]fastRetarget=0\b/.test(location.search || '')
      );
      /* Pure quaternion multiplications and frame retargets live in the lexical 52 helper.
       Keep rest-pose preparation, fallback matrix math, clip channels and timing here. */
      var RETARGET_QUAT = root.BattleFbxRetargetQuat,
        retargetRotations = RETARGET_QUAT.retargetRotations,
        RETARGET_REST = root.BattleFbxRetargetRest;
      function retargetClips(lib, src, clips, bones) {
        var n = bones.length,
          parent = new Int32Array(n),
          restS = [],
          restT = [],
          i;
        var nodes = bones.map(function (name) {
          return lib.nodes[name] || null;
        });
        for (i = 0; i < n; i++) {
          var node = nodes[i],
            pn = node && node.parent ? bones.indexOf(canon(node.parent.name, lib.scheme)) : -1;
          parent[i] = pn;
          restS[i] = src.rest[bones[i]].q;
          restT[i] = node ? node.rotationQuaternion || Q.FromEulerVector(node.rotation) : restS[i];
        }
        /* Stable parent-before-child order shared by matrix and quaternion retarget paths. */
        var order = RETARGET_REST.planOrder(parent);
        var worst = 0;
        for (i = 0; i < n; i++)
          if (nodes[i]) worst = Math.max(worst, 1 - Math.abs(Q.Dot(restS[i], restT[i])));
        var hipsS = src.rest.hips.p,
          hipsT = lib.nodes.hips.position,
          k = hipsT.length() / Math.max(1e-6, hipsS.length());
        lib.speedScale = lib.hipsHeight / Math.max(1e-6, hipsS.z);
        /* Rest-to-model world quaternion correction is prepared once per imported model. */
        var restPlan = RETARGET_REST.quatCalibration(parent, order, restS, restT),
          rS = restPlan.rS,
          rT = restPlan.rT,
          K = restPlan.K;
        var out = {};
        Object.keys(clips).forEach(function (key) {
          var clip = clips[key],
            copy = {};
          for (var f in clip) copy[f] = clip[f];
          copy.speed = clip.travel * lib.speedScale;
          out[key] = copy;
          if (worst < 1e-4 && Math.abs(k - 1) < 1e-3) return;
          var frames = clip.frames,
            chans = new Array(n),
            S0 = [],
            T0 = [],
            Ws = [],
            Wt = [];
          if (FAST_RETARGET) {
            var srcRot = new Array(n),
              dstRot = new Array(n);
            for (i = 0; i < n; i++) {
              var ch0 = clip.channels[i];
              srcRot[i] = (ch0 && ch0.rot) || null;
              dstRot[i] = null;
              if (!ch0 || !nodes[i]) continue;
              chans[i] = { rot: ch0.rot ? (dstRot[i] = new Float32Array(frames * 4)) : null, pos: null };
              if (ch0.pos) {
                var pos0 = new Float32Array(ch0.pos.length),
                  rs0 = src.rest[bones[i]].p,
                  rt0 = nodes[i].position;
                for (var j0 = 0; j0 < frames; j0++) {
                  var b0 = j0 * 3;
                  pos0[b0] = rt0.x + (ch0.pos[b0] - rs0.x) * k;
                  pos0[b0 + 1] = rt0.y + (ch0.pos[b0 + 1] - rs0.y) * k;
                  pos0[b0 + 2] = rt0.z + (ch0.pos[b0 + 2] - rs0.z) * k;
                }
                chans[i].pos = pos0;
              }
            }
            retargetRotations(frames, n, order, parent, K, rS, rT, srcRot, dstRot);
            copy.channels = chans;
            return;
          }
          for (i = 0; i < n; i++) {
            S0[i] = new MX();
            T0[i] = new MX();
            Ws[i] = new MX();
            Wt[i] = new MX();
          }
          for (var o = 0; o < n; o++) {
            i = order[o];
            var ps = parent[i];
            quatMatrix(restS[i].x, restS[i].y, restS[i].z, restS[i].w, rtA);
            if (ps >= 0) rtA.multiplyToRef(S0[ps], S0[i]);
            else S0[i].copyFrom(rtA);
            quatMatrix(restT[i].x, restT[i].y, restT[i].z, restT[i].w, rtA);
            if (ps >= 0) rtA.multiplyToRef(T0[ps], T0[i]);
            else T0[i].copyFrom(rtA);
            var ch = clip.channels[i];
            if (ch && nodes[i]) chans[i] = { rot: ch.rot ? new Float32Array(frames * 4) : null, pos: null };
            if (ch && ch.pos && nodes[i]) {
              var pos = new Float32Array(ch.pos.length),
                rs = src.rest[bones[i]].p,
                rt = nodes[i].position;
              for (var j = 0; j < frames; j++) {
                var b = j * 3;
                pos[b] = rt.x + (ch.pos[b] - rs.x) * k;
                pos[b + 1] = rt.y + (ch.pos[b + 1] - rs.y) * k;
                pos[b + 2] = rt.z + (ch.pos[b + 2] - rs.z) * k;
              }
              chans[i].pos = pos;
            }
          }
          for (var fr = 0; fr < frames; fr++) {
            for (o = 0; o < n; o++) {
              i = order[o];
              var p = parent[i],
                c = clip.channels[i],
                q = c && c.rot ? c.rot : null,
                a = fr * 4;
              if (q) quatMatrix(q[a], q[a + 1], q[a + 2], q[a + 3], rtA);
              else quatMatrix(restS[i].x, restS[i].y, restS[i].z, restS[i].w, rtA);
              if (p >= 0) rtA.multiplyToRef(Ws[p], Ws[i]);
              else Ws[i].copyFrom(rtA);
              if (!chans[i] || !chans[i].rot) {
                quatMatrix(restT[i].x, restT[i].y, restT[i].z, restT[i].w, rtA);
                if (p >= 0) rtA.multiplyToRef(Wt[p], Wt[i]);
                else Wt[i].copyFrom(rtA);
                continue;
              }
              /* delta = S0^-1 * Ws (world-space change), Wt = T0 * delta, local = Wt * parentWt^-1 */
              S0[i].transposeToRef(rtB);
              rtB.multiplyToRef(Ws[i], rtC);
              T0[i].multiplyToRef(rtC, Wt[i]);
              if (p >= 0) {
                Wt[p].transposeToRef(rtB);
                Wt[i].multiplyToRef(rtB, rtC);
              } else rtC.copyFrom(Wt[i]);
              Q.FromRotationMatrixToRef(rtC, rtQ);
              var r = chans[i].rot;
              if (fr && rtQ.x * r[a - 4] + rtQ.y * r[a - 3] + rtQ.z * r[a - 2] + rtQ.w * r[a - 1] < 0)
                rtQ.scaleInPlace(-1);
              r[a] = rtQ.x;
              r[a + 1] = rtQ.y;
              r[a + 2] = rtQ.z;
              r[a + 3] = rtQ.w;
            }
          }
          copy.channels = chans;
        });
        /* In-place loops have no travel: use the stride speed. Root-motion loops keep their measured
       travel (the stride estimate is kept alongside for diagnostics). */
        Object.keys(out).forEach(function (key) {
          var c = out[key];
          if (!c.loop) return;
          c.stride = strideSpeed(lib, c, bones);
          if (c.speed < 0.05 && c.stride > 0) c.speed = c.stride;
        });
        lib.clips = out;
        lib.retargeted = !(worst < 1e-4 && Math.abs(k - 1) < 1e-3);
        return out;
      }

      /* Natural ground speed of an in-place clip, read from its feet: while a foot is planted it slides
     backwards under the hips at the speed the body would travel. Forward kinematics runs from the
     hips to each foot on the model's own rest offsets; for every frame the lower foot (by at least a
     few centimetres) is the planted one, and the median of its horizontal speed relative to the hips
     is the stride speed, in metres per second. */
      var skA = new MX(),
        skB = new MX(),
        skQ = new Q(),
        skP = new V3(),
        skOne = new V3(1, 1, 1);
      function strideSpeed(lib, clip, bones) {
        var hipsNode = lib.nodes.hips;
        if (!hipsNode) return 0;
        var index = {};
        bones.forEach(function (b, i) {
          index[b] = i;
        });
        var unit =
          lib.hipsHeight / Math.max(1e-6, Math.abs(hipsNode.position.z) || hipsNode.position.length());
        var feet = [BONE.leftFoot, BONE.rightFoot].map(function (name) {
          var chain = [],
            node = lib.nodes[name];
          while (node && node !== hipsNode) {
            chain.unshift(node);
            node = node.parent;
          }
          return node ? chain : null;
        });
        if (!feet[0] || !feet[1]) return 0;
        function localOf(node, frame, out) {
          var i = index[canon(node.name, lib.scheme)],
            ch = i != null ? clip.channels[i] : null,
            r = ch && ch.rot,
            a = frame * 4;
          if (r) skQ.set(r[a], r[a + 1], r[a + 2], r[a + 3]);
          else skQ.copyFrom(node.rotationQuaternion || Q.FromEulerVector(node.rotation));
          MX.ComposeToRef(skOne, skQ, node.position, out);
          return out;
        }
        function footAt(chain, frame) {
          /* Hips rotation only (its horizontal travel is what the stride is measured against). */
          localOf(hipsNode, frame, skB);
          skB.setTranslationFromFloats(0, 0, 0);
          for (var c = 0; c < chain.length; c++) {
            localOf(chain[c], frame, skA);
            skA.multiplyToRef(skB, skB);
          }
          return skB.getTranslation();
        }
        var speeds = [],
          prev = null,
          fps = FPS,
          gap = 0.03 / unit;
        for (var f = 0; f < clip.frames; f++) {
          var l = footAt(feet[0], f),
            r = footAt(feet[1], f),
            planted = l.z < r.z - gap ? 0 : r.z < l.z - gap ? 1 : -1,
            pos = planted === 0 ? l : r;
          if (prev && planted >= 0 && planted === prev.planted)
            speeds.push(
              Math.sqrt(
                (pos.x - prev.pos.x) * (pos.x - prev.pos.x) + (pos.y - prev.pos.y) * (pos.y - prev.pos.y)
              ) *
                fps *
                unit
            );
          prev = { planted: planted, pos: pos };
        }
        if (!speeds.length) return 0;
        speeds.sort(function (a, b) {
          return a - b;
        });
        return speeds[Math.floor(speeds.length / 2)];
      }
      return { retargetClips: retargetClips, strideSpeed: strideSpeed };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
