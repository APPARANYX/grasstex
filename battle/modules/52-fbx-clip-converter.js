/* #456 R3: original source FBX rig + animation clip resampling converter.
   Keep the function bodies literally identical to their original backend source:
   scripts/lib/clip-pack-sources.cjs hashes these exact bytes to guard the
   shipped prepared-clips.bin without regenerating the pack or weakening CI. */
(function (root) {
  'use strict';
  if (root.BattleFbxClipConverter) return;
  var Q, V3, FPS, rigScheme, canon, Z_UP;

  function sourceRig(container) {
    var real = container.transformNodes.filter(function (n) {
      return n.name !== '__fbx_root__' && n.name.indexOf('__fbx') < 0;
    });
    var scheme = rigScheme(
        real.map(function (n) {
          return n.name;
        })
      ),
      bones = [],
      rest = {};
    real.forEach(function (n) {
      var name = canon(n.name, scheme);
      bones.push(name);
      rest[name] = {
        q: (n.rotationQuaternion || Q.FromEulerVector(n.rotation)).clone(),
        p: n.position.clone()
      };
    });
    return { bones: bones, rest: rest, scheme: scheme };
  }
  function convertClip(container, key, spec, bones) {
    var group = container.animationGroups[0];
    if (!group) throw new Error('no animation in ' + spec[0]);
    var index = {};
    bones.forEach(function (name, i) {
      index[name] = i;
    });
    var scheme = rigScheme(
      container.transformNodes.map(function (n) {
        return n.name;
      })
    );
    var channels = new Array(bones.length),
      frames = 0,
      duration = 0,
      loop = !!spec[1];
    group.targetedAnimations.forEach(function (ta) {
      var i = ta.target ? index[canon(ta.target.name, scheme)] : null,
        a = ta.animation;
      if (i == null || !a) return;
      var prop = a.targetProperty;
      if (prop !== 'rotationQuaternion' && prop !== 'position') return;
      var afps = a.framePerSecond || FPS,
        span = (group.to - group.from) / afps;
      if (!frames) {
        frames = Math.max(2, Math.round(span * FPS) + 1);
        duration = (frames - 1) / FPS;
      }
      var size = prop === 'position' ? 3 : 4,
        data = new Float32Array(frames * size);
      for (var k = 0; k < frames; k++) {
        var v = a.evaluate(group.from + Math.min(span, k / FPS) * afps),
          o = k * size;
        data[o] = v.x;
        data[o + 1] = v.y;
        data[o + 2] = v.z;
        if (size === 4) {
          data[o + 3] = v.w;
          /* Keep neighbouring samples in one hemisphere so per-frame nlerp never takes the long way. */
          if (
            k &&
            data[o] * data[o - 4] +
              data[o + 1] * data[o - 3] +
              data[o + 2] * data[o - 2] +
              data[o + 3] * data[o - 1] <
              0
          )
            for (var j = 0; j < 4; j++) data[o + j] = -data[o + j];
        }
      }
      var ch = channels[i] || (channels[i] = { rot: null, pos: null });
      if (prop === 'position') ch.pos = data;
      else ch.rot = data;
    });
    if (!frames) throw new Error('no usable channels in ' + spec[0]);
    /* Hips travel is horizontal in the armature's Z-up space (forward is -Y). Its net displacement
     is the clip's natural ground speed (kept in the clip's own units until a model scales it).
     Looping clips are made in place by removing the linear drift, which keeps sway and bob but
     ends each cycle where it began. */
    var hips = channels[index.hips],
      travel = 0;
    if (hips && hips.pos) {
      var p = hips.pos,
        last = (frames - 1) * 3,
        dx = p[last] - p[0],
        dy = p[last + 1] - p[1];
      travel = Math.sqrt(dx * dx + dy * dy) / Math.max(1e-3, duration);
      if (loop || spec[2] === 'inplace' || spec[2] === 'turn')
        for (var f = 0; f < frames; f++) {
          var u = f / (frames - 1);
          p[f * 3] -= dx * u;
          p[f * 3 + 1] -= dy * u;
        }
    }
    /* Turn clips rotate the hips about the vertical by ~90 degrees; the soldier's root already turns
     in the sim, so that yaw is removed (linearly, like travel) and kept as the clip's turn rate. */
    var turnRate = 0;
    if (spec[2] === 'turn' && hips && hips.rot) {
      /* Heading = where the hips faced at frame 0 (armature -Y, forward), carried through each frame. */
      var r = hips.rot,
        last4 = (frames - 1) * 4,
        q = new Q(),
        R = new Q(),
        out = new Q(),
        face = new V3(),
        vf = new V3();
      q.set(r[0], r[1], r[2], r[3]);
      Q.InverseToRef(q, R);
      new V3(0, -1, 0).rotateByQuaternionToRef(R, vf);
      var yawOf = function (quat) {
        vf.rotateByQuaternionToRef(quat, face);
        return Math.atan2(face.x, -face.y);
      };
      var at = function (o) {
        q.set(r[o], r[o + 1], r[o + 2], r[o + 3]);
        return q;
      };
      var y0 = yawOf(at(0)),
        dyaw = Math.atan2(Math.sin(yawOf(at(last4)) - y0), Math.cos(yawOf(at(last4)) - y0));
      turnRate = Math.abs(dyaw) / Math.max(1e-3, duration);
      /* Remove the yaw about the armature's vertical (+Z). The multiplication order that actually
       cancels it is picked on the last frame, so no quaternion convention is assumed. */
      var undo = function (o, u, first) {
        Q.RotationAxisToRef(Z_UP, -dyaw * u, R);
        at(o);
        if (first) R.multiplyToRef(q, out);
        else q.multiplyToRef(R, out);
        return out;
      };
      var err = function (first) {
        var y = yawOf(undo(last4, 1, first));
        return Math.abs(Math.atan2(Math.sin(y - y0), Math.cos(y - y0)));
      };
      var first = err(true) <= err(false);
      for (var t4 = 0; t4 < frames; t4++) {
        var o = t4 * 4;
        undo(o, t4 / (frames - 1), first);
        r[o] = out.x;
        r[o + 1] = out.y;
        r[o + 2] = out.z;
        r[o + 3] = out.w;
      }
    }
    return {
      key: key,
      file: spec[0],
      loop: loop,
      frames: frames,
      duration: duration,
      travel: travel,
      speed: 0,
      turnRate: turnRate,
      channels: channels
    };
  }

  root.BattleFbxClipConverter = {
    create: function (deps) {
      Q = deps.Q;
      V3 = deps.V3;
      FPS = deps.FPS;
      rigScheme = deps.rigScheme;
      canon = deps.canon;
      Z_UP = new V3(0, 0, 1);
      return { sourceRig: sourceRig, convertClip: convertClip };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
