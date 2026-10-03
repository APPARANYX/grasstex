/* Scouts Forward on real battles. Observe only: decision telemetry plus sampled ownership/stall context.
   The runtime's own recon telemetry supplies orders, reasons, selections, distance/time, endings, contact,
   actual told-belief deliveries and same-approach retrigger blocks. This probe adds correlation with main-body
   anchor drift and movement-stop/churn state while a recon lease is live. */
(function (root) {
  var st, originalRecord;
  function key(sq) {
    return sq.faction + ':' + sq.id;
  }
  function inc(map, k) {
    map[k] = (map[k] || 0) + 1;
  }
  function median(a) {
    var b = a.slice().sort(function (x, y) { return x - y; });
    return b.length ? +b[b.length >> 1].toFixed(2) : 0;
  }
  (root.BattleProbes = root.BattleProbes || {})['scouts-forward'] = {
    every: 1,
    start: function () {
      st = {
        orders: 0,
        ended: {},
        reports: 0,
        retriggerBlocks: 0,
        activeSquadSeconds: 0,
        activeStopReasonSeconds: 0,
        anchorDrift: [],
        taskKeys: {},
        orderKeys: {},
        open: {}
      };
      var T = root.BattleTelemetry;
      if (T && T.record && !originalRecord) {
        originalRecord = T.record;
        T.record = function (type, data) {
          if (type === 'decision-recon-order' && data) {
            st.orders++;
            var k = String(data.faction) + ':' + String(data.squad),
              sig = k + '|' + String(data.signature);
            inc(st.orderKeys, sig);
          } else if (type === 'decision-recon-end' && data) inc(st.ended, data.reason || 'unknown');
          else if (type === 'decision-recon-report-delivered') st.reports++;
          else if (type === 'decision-recon-retrigger-blocked') st.retriggerBlocks++;
          return originalRecord.apply(this, arguments);
        };
      }
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (side) {
        var squads = (sim.factions && sim.factions[side] && sim.factions[side].squads) || [];
        for (var i = 0; i < squads.length; i++) {
          var sq = squads[i],
            lease = root.BattleLeases && root.BattleLeases.get(sq, 'recon'),
            k = key(sq),
            open = st.open[k];
          if (!lease || !sq._reconTask) {
            if (open) delete st.open[k];
            continue;
          }
          st.activeSquadSeconds++;
          var task = sq._reconTask,
            sig = k + '|' + String(task.signature);
          st.taskKeys[sig] = 1;
          if (!open && sq.orderAnchor) {
            open = st.open[k] = { x: sq.orderAnchor.x, z: sq.orderAnchor.z };
          }
          if (open && sq.orderAnchor)
            st.anchorDrift.push(Math.hypot(sq.orderAnchor.x - open.x, sq.orderAnchor.z - open.z));
          var selected = {};
          for (var j = 0; j < task.scoutIds.length; j++) selected[String(task.scoutIds[j])] = 1;
          var stopped = false;
          for (j = 0; j < (sq.members || []).length; j++) {
            var man = sq.members[j];
            if (!man || man.dead || selected[String(man.id)]) continue;
            if (man._movementStopReason) { stopped = true; break; }
          }
          if (stopped) st.activeStopReasonSeconds++;
        }
      });
    },
    report: function (sim) {
      var runtime = root.BattleSquadStability && root.BattleSquadStability.reconTelemetry
        ? root.BattleSquadStability.reconTelemetry(sim)
        : null;
      var duplicates = 0;
      Object.keys(st.orderKeys).forEach(function (k) {
        if (st.orderKeys[k] > 1) duplicates += st.orderKeys[k] - 1;
      });
      return {
        runtime: runtime,
        decisionOrders: st.orders,
        endedBy: st.ended,
        deliveredReportEvents: st.reports,
        retriggerBlockEvents: st.retriggerBlocks,
        uniqueTasks: Object.keys(st.taskKeys).length,
        duplicateOrdersForSameSignature: duplicates,
        activeSquadSeconds: st.activeSquadSeconds,
        activeWithMainBodyStopReasonSeconds: st.activeStopReasonSeconds,
        anchorDriftMedian: median(st.anchorDrift),
        anchorDriftMax: st.anchorDrift.length ? +Math.max.apply(null, st.anchorDrift).toFixed(2) : 0
      };
    }
  };
})(window);
