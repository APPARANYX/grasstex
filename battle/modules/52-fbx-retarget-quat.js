/* #456 R3: pure typed-array quaternion retargeting kernel.
   No Babylon, clip loading, model state, per-frame allocations beyond the original
   four scratch buffers allocated once per retargetRotations() invocation. */
(function (root) {
  'use strict';
  if (root.BattleFbxRetargetQuat) return;
  function hamilton(o, oi, a, ai, b, bi) {
    var ax = a[ai],
      ay = a[ai + 1],
      az = a[ai + 2],
      aw = a[ai + 3],
      bx = b[bi],
      by = b[bi + 1],
      bz = b[bi + 2],
      bw = b[bi + 3];
    o[oi] = ax * bw + ay * bz - az * by + aw * bx;
    o[oi + 1] = -ax * bz + ay * bw + az * bx + aw * by;
    o[oi + 2] = ax * by - ay * bx + az * bw + aw * bz;
    o[oi + 3] = -ax * bx - ay * by - az * bz + aw * bw;
  }
  function retargetRotations(frames, n, order, parent, K, rS, rT, src, dst) {
    var Ws = new Float64Array(n * 4),
      Wt = new Float64Array(n * 4),
      L = new Float64Array(4),
      C = new Float64Array(4),
      j;
    for (var fr = 0; fr < frames; fr++) {
      var a = fr * 4;
      for (var o = 0; o < n; o++) {
        var i = order[o],
          p = parent[i],
          i4 = i * 4,
          s = src[i],
          d = dst[i];
        if (s) {
          if (p >= 0) hamilton(Ws, i4, Ws, p * 4, s, a);
          else for (j = 0; j < 4; j++) Ws[i4 + j] = s[a + j];
        } else if (p >= 0) hamilton(Ws, i4, Ws, p * 4, rS, i4);
        else for (j = 0; j < 4; j++) Ws[i4 + j] = rS[i4 + j];
        if (!d) {
          if (p >= 0) hamilton(Wt, i4, Wt, p * 4, rT, i4);
          else for (j = 0; j < 4; j++) Wt[i4 + j] = rT[i4 + j];
          continue;
        }
        hamilton(Wt, i4, Ws, i4, K, i4);
        if (p >= 0) {
          var p4 = p * 4;
          C[0] = -Wt[p4];
          C[1] = -Wt[p4 + 1];
          C[2] = -Wt[p4 + 2];
          C[3] = Wt[p4 + 3];
          hamilton(L, 0, C, 0, Wt, i4);
        } else for (j = 0; j < 4; j++) L[j] = Wt[i4 + j];
        /* Keep neighbouring samples in one hemisphere, as convertClip does. */
        if (fr && L[0] * d[a - 4] + L[1] * d[a - 3] + L[2] * d[a - 2] + L[3] * d[a - 1] < 0)
          for (j = 0; j < 4; j++) L[j] = -L[j];
        d[a] = L[0];
        d[a + 1] = L[1];
        d[a + 2] = L[2];
        d[a + 3] = L[3];
      }
    }
  }
  root.BattleFbxRetargetQuat = {
    hamilton: hamilton,
    retargetRotations: retargetRotations
  };
})(typeof window !== 'undefined' ? window : globalThis);
