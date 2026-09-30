/* POSITIVE CONTROL, diagnostic only, never shipped: turn a lever's declared numbers far past what ships, so a
   run shows whether the wiring from the number to the battle works.

   If a huge dose moves the counters (`morale-decisions`, `coa-decisions`) the lever is connected and the shipped
   dose is simply too small; if it does not, something between the number and the men overrides it.

   It is the only probe that WRITES: it sets numbers on `BattleSquadStability.tuning` (the layer's own tuning
   object, read live by the Squad Leader) before the first step, and nothing else. Never run it in a control
   arm or a benchmark. It draws no random number and touches no soldier or squad.

   The doses come from the page URL, so one probe serves every arm:
     ?dose=<path>:<value>[,<path>:<value>...]      a path into `BattleSquadStability.tuning`
   e.g. `?morale=1&dose=morale.breakSlope:0.9,morale.rallyStress:0.5,morale.rallyCasualty:0.7`
        `?coa=1&dose=coa.weights.assault.casualtyFrac:-6,coa.weights.assault.stress:-3,coa.weights.assault.leaderDown:-4.5`
        `?coa=1&dose=coa.weights.assault.base:-100`        (every contact is scored `defend`)
   Every override is echoed in the report with the value it replaced; a path that does not exist throws. */
(function (root) {
  'use strict';
  var applied;
  function parse() {
    var m = /[?&]dose=([^&#]*)/.exec((root.location && root.location.search) || ''),
      out = [];
    if (!m) return out;
    decodeURIComponent(m[1])
      .split(',')
      .forEach(function (item) {
        var i = item.lastIndexOf(':');
        if (i < 1) throw new Error('exaggerated-dose: bad item ' + item);
        var v = +item.slice(i + 1);
        if (!isFinite(v)) throw new Error('exaggerated-dose: bad value in ' + item);
        out.push({ path: item.slice(0, i), value: v });
      });
    return out;
  }
  (root.BattleProbes = root.BattleProbes || {})['exaggerated-dose'] = {
    every: 1e9,
    start: function () {
      applied = [];
      parse().forEach(function (d) {
        var o = root.BattleSquadStability.tuning,
          keys = d.path.split('.'),
          i;
        for (i = 0; i < keys.length - 1; i++) {
          o = o[keys[i]];
          if (!o) throw new Error('exaggerated-dose: no such tuning path ' + d.path);
        }
        var last = keys[keys.length - 1];
        if (typeof o[last] !== 'number') throw new Error('exaggerated-dose: ' + d.path + ' is not a number');
        applied.push({ path: d.path, was: o[last], now: d.value });
        o[last] = d.value;
      });
    },
    sample: function () {},
    report: function () {
      return { applied: applied };
    }
  };
})(window);
