/* How often does the reactive stack take the firing-position step and the team bound, and how do they end?
   Built for #640 (`?firstSupporter=1`): counts the Squad Leader's `decision-firing-position` (the step is granted),
   its receipts (`firing-position-arrived`, `-failed`, with reasons) and `decision-bound` (a team bound is granted).
   Observe only: wraps the telemetry sink the probe runner has already turned into a no-op; reads and writes no battle state. */
(function (root) {
  var out;
  function add(map, key, v) {
    map[key] = (map[key] || 0) + v;
  }
  (root.BattleProbes = root.BattleProbes || {})['firing-steps'] = {
    every: 0,
    start: function () {
      out = { steps: 0, verify: 0, receipts: {}, failReasons: {}, bounds: 0 };
      var tel = root.BattleTelemetry;
      if (tel && typeof tel.record === 'function' && !tel.record.__firingSteps) {
        var inner = tel.record,
          tap = function (type, data) {
            if (out) {
              if (type === 'decision-firing-position') {
                out.steps++;
                if (data && data.verify) out.verify++;
              } else if (/^firing-position-/.test(type)) {
                add(out.receipts, type.slice(16), 1);
                if (type === 'firing-position-failed') add(out.failReasons, (data && data.reason) || '?', 1);
              } else if (type === 'decision-bound') out.bounds++;
            }
            return inner.apply(this, arguments);
          };
        tap.__firingSteps = true;
        tel.record = tap;
      }
    },
    sample: function () {},
    report: function () {
      return out;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
