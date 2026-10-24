/* How does the clear-contact drill (module 15i) end? Counts the Squad Leader's drill orders (`decision-clear-contact`),
   how each ended (`decision-clear-contact-end` reason: sighting, under fire, retreat, holding phase, cleared, timeout,
   battle over) with its length, and `decision-squad-cleared` reports (#639). Built for #639: the paired runs showed
   `?squadCleared=1` changing almost nothing, so this asks whether the "reached the point" ending ever happens.
   Observe only: wraps the telemetry sink the probe runner has already turned into a no-op, reads and writes no battle state. */
(function (root) {
  var out;
  function add(map, key, v) {
    map[key] = (map[key] || 0) + v;
  }
  (root.BattleProbes = root.BattleProbes || {})['clear-contact-ends'] = {
    every: 0,
    start: function () {
      out = { orders: 0, ends: {}, secondsByEnd: {}, clearedReports: 0, byPhase: {} };
      var tel = root.BattleTelemetry;
      if (tel && typeof tel.record === 'function' && !tel.record.__clearContactEnds) {
        var inner = tel.record,
          tap = function (type, data) {
            if (out) {
              if (type === 'decision-clear-contact') {
                out.orders++;
                add(out.byPhase, (data && data.phase) || '?', 1);
              } else if (type === 'decision-clear-contact-end') {
                var why = (data && data.reason) || '?';
                add(out.ends, why, 1);
                add(out.secondsByEnd, why, +(data && data.seconds) || 0);
              } else if (type === 'decision-squad-cleared') out.clearedReports++;
            }
            return inner.apply(this, arguments);
          };
        tap.__clearContactEnds = true;
        tel.record = tap;
      }
    },
    sample: function () {},
    report: function () {
      var mean = {};
      Object.keys(out.ends).forEach(function (k) {
        mean[k] = +(out.secondsByEnd[k] / out.ends[k]).toFixed(1);
      });
      return {
        orders: out.orders,
        ends: out.ends,
        meanSecondsByEnd: mean,
        clearedReports: out.clearedReports,
        ordersByPhase: out.byPhase
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
