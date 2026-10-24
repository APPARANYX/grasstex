/* The playtester: what a person would write down after watching a battle, per side.
   Observe only (reads soldiers and squads every 0.3 s; chains onFire and returns the same result).

   Reported per faction:
   - minutes: how long the side had living men, in man-minutes.
   - states: share of man-time in each Engagement state (engage, bound, pinned, withdraw, station, ...), so
     "are they fighting, moving, hiding or running" is a number, not a feeling.
   - phases: share of squad-time in each command phase.
   - pins: episodes of enemy fire holding one of this side's men down (suppressedUntil rising), their mean
     length, and the share of man-time spent pinned.
   - suppression: man-seconds a side's suppressors held a suppress job, seconds with two at once, and the
     share of squad contact time with at least one suppressor working.
   - rounds: onFire pulls and the share fired by men who are pinned.
   - bounds: man-seconds in `bound`, and fire-control states per squad-second (open / hold / precision).
   - squads: squads that went to retreat, the alive share at the end, and the time of the first contact and
     the first casualty.
   Keys are flat numbers so scripts/merge_probe_pack.cjs can compare arms without knowing the names. */
(function (root) {
  var c, last, pinUntil, sides;
  function bump(o, k, n) {
    o[k] = (o[k] || 0) + (n === undefined ? 1 : n);
  }
  function side(f) {
    return (
      sides[f] ||
      (sides[f] = {
        manSeconds: 0,
        states: {},
        phases: {},
        pinStarts: 0,
        pinnedSeconds: 0,
        pinLengthSum: 0,
        suppressorSeconds: 0,
        twoSuppressorSeconds: 0,
        contactSquadSeconds: 0,
        supportedContactSeconds: 0,
        rounds: 0,
        roundsPinned: 0,
        fireControl: {},
        squadSeconds: 0,
        retreatSquads: 0,
        boundSeconds: 0,
        firstContact: null,
        firstCasualty: null,
        startMen: 0
      })
    );
  }
  function r(n) {
    return +n.toFixed(4);
  }
  (root.BattleProbes = root.BattleProbes || {}).playtest = {
    every: 0.3,
    start: function (sim) {
      sides = {};
      last = sim.time;
      pinUntil = new Map();
      c = { retreating: new Set(), men: new Set(), dead: new Set(), wrapped: false };
      if (!c.wrapped) {
        var old = sim.onFire;
        sim.onFire = function (s, delay) {
          if (s && s.faction) {
            var k = side(s.faction);
            k.rounds++;
            if (s.suppressedUntil > sim.time) k.roundsPinned++;
          }
          return old ? old.apply(this, arguments) : undefined;
        };
        c.wrapped = true;
      }
    },
    sample: function (sim) {
      var dt = sim.time - last,
        now = sim.time,
        units = root.BattleModules.unitsFor(sim),
        squads = {},
        i;
      last = now;
      if (!(dt > 0)) return;
      for (i = 0; i < units.length; i++) {
        var s = units[i];
        if (!s || !s.faction) continue;
        var k = side(s.faction);
        if (!c.men.has(s)) {
          c.men.add(s);
          k.startMen++;
        }
        if (s.dead) {
          if (!c.dead.has(s)) {
            c.dead.add(s);
            if (k.firstCasualty === null) k.firstCasualty = r(now);
          }
          continue;
        }
        k.manSeconds += dt;
        var e = s.eng || {},
          st = e.state || 'none';
        bump(k.states, st, dt);
        if (st === 'bound') k.boundSeconds += dt;
        var pinned = s.suppressedUntil > now;
        if (pinned) {
          k.pinnedSeconds += dt;
          if (!pinUntil.get(s)) {
            k.pinStarts++;
            pinUntil.set(s, now);
          }
        } else if (pinUntil.get(s)) {
          k.pinLengthSum += now - pinUntil.get(s);
          pinUntil.set(s, 0);
        }
        if (e.suppressOrder) {
          k.suppressorSeconds += dt;
          if (s.squad) {
            var q = squads[s.squad.id] || (squads[s.squad.id] = { sq: s.squad, n: 0 });
            q.n++;
          }
        }
        if (s.squad && !squads[s.squad.id]) squads[s.squad.id] = { sq: s.squad, n: 0 };
      }
      Object.keys(squads).forEach(function (id) {
        var q = squads[id],
          sq = q.sq,
          k = side(sq.faction);
        k.squadSeconds += dt;
        bump(k.phases, sq.commandPhase || 'none', dt);
        if (sq.fireControl && sq.fireControl.state) bump(k.fireControl, sq.fireControl.state, dt);
        if (q.n >= 2) k.twoSuppressorSeconds += dt;
        if (sq.contactCount > 0) {
          k.contactSquadSeconds += dt;
          if (k.firstContact === null) k.firstContact = r(now);
          if (q.n > 0) k.supportedContactSeconds += dt;
        }
        if (sq.state === 'retreat' && !c.retreating.has(sq)) {
          c.retreating.add(sq);
          k.retreatSquads++;
        }
      });
    },
    report: function (sim) {
      var out = {};
      Object.keys(sides).forEach(function (f) {
        var k = sides[f],
          minutes = k.manSeconds / 60,
          o = {
            manMinutes: r(minutes),
            startMen: k.startMen,
            pinStarts: k.pinStarts,
            pinnedShare: k.manSeconds ? r(k.pinnedSeconds / k.manSeconds) : 0,
            pinMeanSeconds: k.pinStarts ? r(k.pinLengthSum / Math.max(1, k.pinStarts)) : 0,
            suppressorShare: k.manSeconds ? r(k.suppressorSeconds / k.manSeconds) : 0,
            twoSuppressorSquadShare: k.squadSeconds ? r(k.twoSuppressorSeconds / k.squadSeconds) : 0,
            supportedContactShare: k.contactSquadSeconds
              ? r(k.supportedContactSeconds / k.contactSquadSeconds)
              : 0,
            contactSquadSeconds: r(k.contactSquadSeconds),
            rounds: k.rounds,
            roundsPerManMinute: minutes ? r(k.rounds / minutes) : 0,
            pinnedRoundShare: k.rounds ? r(k.roundsPinned / k.rounds) : 0,
            boundShare: k.manSeconds ? r(k.boundSeconds / k.manSeconds) : 0,
            retreatSquads: k.retreatSquads,
            firstContact: k.firstContact,
            firstCasualty: k.firstCasualty
          };
        Object.keys(k.states).forEach(function (s) {
          o['state_' + s] = k.manSeconds ? r(k.states[s] / k.manSeconds) : 0;
        });
        Object.keys(k.phases).forEach(function (s) {
          o['phase_' + s] = k.squadSeconds ? r(k.phases[s] / k.squadSeconds) : 0;
        });
        Object.keys(k.fireControl).forEach(function (s) {
          o['fireControl_' + s] = k.squadSeconds ? r(k.fireControl[s] / k.squadSeconds) : 0;
        });
        out[f] = o;
      });
      return out;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
