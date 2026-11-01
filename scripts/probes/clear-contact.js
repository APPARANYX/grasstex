/* Clearing the last contact (module 16 `sq.clearContact`, `?alertAdvance=0` the old hold), on real battles. From
   the Squad Leader's own decisions (`decision-clear-contact`, `decision-clear-contact-end`, read through a
   pass-through wrapper of `BattleTelemetry.record`): orders begun, how each ended (sighting, under fire,
   cleared, timeout, holding phase, retreat, battle over) and how long it ran; sampled each simulated second: the
   squad-seconds clearing, and how far the squad's anchor moved during each order. Observe only. */
(function (root) {
  var st, record;
  function key(sq) {
    return sq.faction + ':' + sq.id;
  }
  function median(a) {
    var m = a.slice().sort(function (x, y) {
      return x - y;
    });
    return m.length ? +m[m.length >> 1].toFixed(1) : 0;
  }
  (root.BattleProbes = root.BattleProbes || {})['clear-contact'] = {
    every: 1,
    start: function () {
      st = { orders: 0, ended: {}, seconds: [], clearingSeconds: 0, moved: [], open: {} };
      var T = root.BattleTelemetry;
      if (T && T.record && !record) {
        record = T.record;
        T.record = function (type, data) {
          if (type === 'decision-clear-contact') st.orders++;
          else if (type === 'decision-clear-contact-end' && data) {
            st.ended[data.reason] = (st.ended[data.reason] || 0) + 1;
            st.seconds.push(+data.seconds || 0);
          }
          return record.apply(this, arguments);
        };
      }
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var k = key(sq),
            o = st.open[k],
            a = sq.orderAnchor;
          if (sq.clearContact) {
            st.clearingSeconds++;
            if (!o && a) st.open[k] = { x: a.x, z: a.z };
          } else if (o) {
            if (a) st.moved.push(Math.hypot(a.x - o.x, a.z - o.z));
            delete st.open[k];
          }
        });
      });
    },
    report: function () {
      return {
        orders: st.orders,
        endedBy: st.ended,
        secondsMedian: median(st.seconds),
        secondsMax: st.seconds.length ? +Math.max.apply(null, st.seconds).toFixed(1) : 0,
        clearingSquadSeconds: st.clearingSeconds,
        anchorMovedMedian: median(st.moved),
        anchorMovedMax: st.moved.length ? +Math.max.apply(null, st.moved).toFixed(1) : 0
      };
    }
  };
})(window);
