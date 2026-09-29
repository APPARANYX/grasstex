/* Who fills each slot of a spawned squad (stats lever `deal`, module 10-soldier-stats). Observe only: reads the
   roster and the men's stats, at the end of the battle, whoever is still alive or not (a dead man stays in
   his squad's `members`).

   Report:
     squads        squads seen, and how many hold ten consecutive ids (the deal permutes a squad's own ids, so
                   with or without the lever every squad is one run of ten)
     roles         per role, how many men, and the mean of the stat pair the deal ranks that role on
                   (sergeant FOR+TAC, gunner PHY+TEC, scout AGI+MKM) and of all six, so a dealt roster shows
                   sergeants above the riflemen on FOR+TAC and an undealt one shows them level
     weapons       per role, the weapon kinds carried (the role still decides the weapon, so a dealt squad's
                   gunner still has the LMG: only the man in the slot changed)
     slotZero      how many squads have their lowest id in slot 0 (with the deal off, all of them) */
(function (root) {
  var PAIRS = { sergeant: ['for', 'tac'], gunner: ['phy', 'tec'], scout: ['agi', 'mkm'] };
  function mean(list) {
    return list.length
      ? +(
          list.reduce(function (a, v) {
            return a + v;
          }, 0) / list.length
        ).toFixed(4)
      : null;
  }
  (root.BattleProbes = root.BattleProbes || {})['deal-roster'] = {
    every: 0,
    start: function () {},
    sample: function () {},
    report: function (sim) {
      var S = root.BattleSoldierStats,
        roles = {},
        weapons = {},
        squads = 0,
        runs = 0,
        slotZero = 0;
      if (!S) return { loaded: false };
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (q) {
          var ids = q.members
            .map(function (m) {
              return m.id;
            })
            .sort(function (a, b) {
              return a - b;
            });
          squads++;
          if (
            ids.every(function (id, i) {
              return id === ids[0] + i;
            })
          )
            runs++;
          if (q.members[0] && q.members[0].id === ids[0]) slotZero++;
          q.members.forEach(function (m) {
            var st = S.of(m),
              row = roles[m.role] || (roles[m.role] = { n: 0, pair: [], all: [] });
            row.n++;
            if (PAIRS[m.role]) row.pair.push(st[PAIRS[m.role][0]] + st[PAIRS[m.role][1]]);
            row.all.push((st.phy + st.mkm + st.for + st.tac + st.agi + st.tec) / 6);
            var w = weapons[m.role] || (weapons[m.role] = {}),
              kind = (m.weapon && m.weapon.kind) || 'none';
            w[kind] = (w[kind] || 0) + 1;
          });
        });
      });
      var out = {};
      Object.keys(roles).forEach(function (r) {
        out[r] = {
          n: roles[r].n,
          pairMean: PAIRS[r] ? mean(roles[r].pair) : null,
          pair: PAIRS[r] ? PAIRS[r].join('+') : null,
          allMean: mean(roles[r].all)
        };
      });
      return {
        loaded: true,
        mode: S.mode().flag,
        deal: S.on('deal'),
        squads: { seen: squads, consecutiveIds: runs },
        slotZero: slotZero,
        roles: out,
        weapons: weapons
      };
    }
  };
})(window);
