/* #456 R3: FBX rest-pose hierarchy and quaternion correction plan.
   Pure once-per-model preparation for both quaternion and matrix retarget paths.
   FBX parsing, prepared-clip conversion and scene/lifecycle state stay in the backend. */
(function (root) {
  'use strict';
  if (root.BattleFbxRetargetRest) return;
  if (!root.BattleFbxRetargetQuat) return;
  var hamilton = root.BattleFbxRetargetQuat.hamilton;

  function planOrder(parent) {
    var n = parent.length,
      i;
    /* Parents before children. */
    var order = [],
      depth = function (k) {
        var d = 0;
        while (parent[k] >= 0) {
          k = parent[k];
          d++;
        }
        return d;
      };
    for (i = 0; i < n; i++) order.push(i);
    order.sort(function (a, b) {
      return depth(a) - depth(b);
    });
    return order;
  }

  function quatCalibration(parent, order, restS, restT) {
    var n = parent.length,
      i;
    /* Quaternion form (the default): per bone, K = conj(S0)⊗T0 once per model. */
    var rS = new Float64Array(n * 4),
      rT = new Float64Array(n * 4),
      K = new Float64Array(n * 4),
      S0q = new Float64Array(n * 4),
      T0q = new Float64Array(n * 4),
      cq = new Float64Array(4);
    for (i = 0; i < n; i++) {
      var qs = restS[i],
        qt = restT[i];
      rS[i * 4] = qs.x;
      rS[i * 4 + 1] = qs.y;
      rS[i * 4 + 2] = qs.z;
      rS[i * 4 + 3] = qs.w;
      rT[i * 4] = qt.x;
      rT[i * 4 + 1] = qt.y;
      rT[i * 4 + 2] = qt.z;
      rT[i * 4 + 3] = qt.w;
    }
    for (var oq = 0; oq < n; oq++) {
      var iq = order[oq],
        pq = parent[iq],
        i4 = iq * 4;
      if (pq >= 0) {
        hamilton(S0q, i4, S0q, pq * 4, rS, i4);
        hamilton(T0q, i4, T0q, pq * 4, rT, i4);
      } else
        for (var j4 = 0; j4 < 4; j4++) {
          S0q[i4 + j4] = rS[i4 + j4];
          T0q[i4 + j4] = rT[i4 + j4];
        }
      cq[0] = -S0q[i4];
      cq[1] = -S0q[i4 + 1];
      cq[2] = -S0q[i4 + 2];
      cq[3] = S0q[i4 + 3];
      hamilton(K, i4, cq, 0, T0q, i4);
    }
    return { rS: rS, rT: rT, K: K };
  }

  root.BattleFbxRetargetRest = {
    planOrder: planOrder,
    quatCalibration: quatCalibration
  };
})(typeof window !== 'undefined' ? window : globalThis);
