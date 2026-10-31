/* Contact-fire churn under the tactical controller (13d, ?tacticalController=new). Per squad: fire-control
   state changes and how short each state lasted, hold->open->hold cycles inside 20 s, and per man the
   contact-drill changes (fire, march, watch, pinned, prepare, suppress, grenade) in each other's way.
   Squad-seconds in contact give the rate denominator. Observe only: reads BattleTacticalContactSkills.summary. */
(function (root) {
  var st;
  function key(sq) {
    return sq.faction + ':' + sq.id;
  }
  (root.BattleProbes = root.BattleProbes || {})['contact-churn'] = {
    every: 0,
    start: function () {
      st = {
        sq: {},
        men: {},
        c: {
          contactSeconds: 0,
          fireChanges: 0,
          shortFire: 0,
          holdOpenHold: 0,
          drillChanges: 0,
          drillFlipBack: 0,
          reContacts: 0,
          reContactsWithin20: 0
        },
        last: 0,
        drills: {},
        pairs: {},
        gap: {}
      };
    },
    sample: function (sim) {
      var dt = sim.time - st.last;
      st.last = sim.time;
      var S = root.BattleTacticalContactSkills;
      if (!S) return;
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var sum = S.summary(sq);
          var kk = key(sq),
            g = st.gap[kk] || (st.gap[kk] = { on: false, off: null });
          if (sum && sum.active && !g.on) {
            if (g.off !== null) {
              st.c.reContacts++;
              if (sim.time - g.off <= 20) st.c.reContactsWithin20++;
            }
            g.on = true;
          } else if ((!sum || !sum.active) && g.on) {
            g.on = false;
            g.off = sim.time;
          }
          if (!sum || !sum.active) return;
          st.c.contactSeconds += dt;
          var k = key(sq),
            r = st.sq[k] || (st.sq[k] = { state: null, since: sim.time, hist: [] });
          if (sum.state && sum.state !== r.state) {
            if (r.state) {
              st.c.fireChanges++;
              if (sim.time - r.since < 2) st.c.shortFire++;
              r.hist.push({ s: r.state, t: sim.time });
              r.hist = r.hist.filter(function (h) {
                return sim.time - h.t <= 20;
              });
              var n = r.hist.length;
              if (n >= 2 && r.hist[n - 1].s === 'hold' && r.hist[n - 2].s === 'open') st.c.holdOpenHold++;
            }
            r.state = sum.state;
            r.since = sim.time;
          }
          (sum.roles || []).forEach(function (role) {
            var m =
              st.men[role.actorId] || (st.men[role.actorId] = { drill: null, prev: null, at: sim.time });
            st.drills[role.drill] = (st.drills[role.drill] || 0) + dt;
            if (m.drill !== role.drill) {
              if (m.drill) {
                st.c.drillChanges++;
                var pk = m.drill + '>' + role.drill;
                st.pairs[pk] = (st.pairs[pk] || 0) + 1;
                if (m.prev === role.drill && sim.time - m.at < 4) st.c.drillFlipBack++;
              }
              m.prev = m.drill;
              m.drill = role.drill;
              m.at = sim.time;
            }
          });
        });
      });
    },
    report: function () {
      var c = st.c,
        m = Math.max(1, c.contactSeconds / 60);
      return {
        contactSquadSeconds: +c.contactSeconds.toFixed(0),
        fireChanges: c.fireChanges,
        fireChangesPerMin: +(c.fireChanges / m).toFixed(2),
        shortFireStates: c.shortFire,
        holdOpenHold: c.holdOpenHold,
        reContacts: c.reContacts,
        reContactsWithin20: c.reContactsWithin20,
        drillChanges: c.drillChanges,
        drillChangesPerMin: +(c.drillChanges / m).toFixed(2),
        drillFlipBack: c.drillFlipBack,
        drillPairs: Object.keys(st.pairs)
          .sort(function (a, b) {
            return st.pairs[b] - st.pairs[a];
          })
          .slice(0, 10)
          .reduce(function (o, k) {
            o[k] = st.pairs[k];
            return o;
          }, {}),
        drillSeconds: Object.keys(st.drills).reduce(function (o, d) {
          o[d] = +st.drills[d].toFixed(0);
          return o;
        }, {})
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
