/* Where the execution report (BattleExecutionOutcome / module 16 reportBlockedExecution) changes a battle.
   Per squad: every time a mission is issued for reason 'execution-blocked' (the General's answer to a block
   report), with the brief it replaced and what became of the squad's men afterwards, plus the number of
   squads that ever reported. Observe only. */
(function (root) {
  var c, seen;
  (root.BattleProbes = root.BattleProbes || {})['exec-report-trace'] = {
    every: 1,
    start: function () {
      c = { replacements: [], reports: 0, squadsReported: {} };
      seen = {};
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (f) {
        (sim.factions[f].squads || []).forEach(function (sq) {
          var key = f + ':' + sq.id,
            m = sq._macroMission,
            ex = sq._missionExecution;
          if (ex && ex.blockedReported && !seen['r' + key + (m && m.version)]) {
            seen['r' + key + (m && m.version)] = 1;
            c.reports++;
            c.squadsReported[key] = (c.squadsReported[key] || 0) + 1;
          }
          if (m && m.reason === 'execution-blocked' && !seen['m' + key + m.version]) {
            seen['m' + key + m.version] = 1;
            var O = root.BattleExecutionOutcome,
              e = O && O.squad(sq, sim);
            c.replacements.push({
              t: +sim.time.toFixed(1),
              squad: key,
              version: m.version,
              intent: m.intent,
              objective: m.objectiveId,
              before: sq._lastMacroMission ? sq._lastMacroMission.objectiveId : null,
              counts: e && e.counts
            });
          }
        });
      });
    },
    report: function () {
      return c;
    }
  };
})(window);
