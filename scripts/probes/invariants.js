/* Observe-only invariant probe: asks real battles whether basic state invariants ever break
   (non-finite or off-map positions, roster/alive-count disagreement, hp<=0 but alive, a dead man
   with a target, one man on two squads, an Engagement state outside the declared table, a man
   standing still far from his destination for a long time with no reason). */
(function (root) {
  'use strict';
  var found,
    counts,
    still,
    STILL_SECONDS = 30;
  function note(kind, sim, detail) {
    counts[kind] = (counts[kind] || 0) + 1;
    if (
      found.length < 40 &&
      !found.some(function (f) {
        return f.kind === kind && f.who === detail.who;
      })
    )
      found.push(Object.assign({ kind: kind, t: +(+sim.time).toFixed(1) }, detail));
  }
  function fin(v) {
    return v != null && isFinite(+v);
  }
  (root.BattleProbes = root.BattleProbes || {}).invariants = {
    every: 0.6,
    start: function () {
      found = [];
      counts = {};
      still = new Map();
      counts.samples = 0;
    },
    sample: function (sim) {
      counts.samples++;
      var states = root.BattleEngagement && root.BattleEngagement.states;
      var seen = new Map(),
        alive = { us: 0, ge: 0 };
      ['us', 'ge'].forEach(function (f) {
        var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
        squads.forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            var who = f + ':' + sq.id + ':' + s.id;
            if (seen.has(s)) note('two-squads', sim, { who: who, other: seen.get(s) });
            seen.set(s, who);
            if (s.dead) {
              if (s.target) note('dead-with-target', sim, { who: who });
              return;
            }
            alive[f]++;
            var p = s.root && s.root.position;
            if (!p || !fin(p.x) || !fin(p.y) || !fin(p.z)) {
              note('bad-position', sim, { who: who });
              return;
            }
            if (Math.abs(p.x) > 1500 || Math.abs(p.z) > 1500)
              note('off-map', sim, { who: who, x: p.x, z: p.z });
            if (s.destination && (!fin(s.destination.x) || !fin(s.destination.z)))
              note('bad-destination', sim, { who: who });
            if (s.hp <= 0) note('hp-nonpositive-alive', sim, { who: who, hp: s.hp });
            if (s.eng && s.eng.state && states && !states[s.eng.state])
              note('unknown-eng-state', sim, { who: who, state: s.eng.state });
            // long stationary spell far from the destination with nothing explaining it
            var d = s.destination,
              far = d && Math.hypot(d.x - p.x, d.z - p.z) > 6;
            var explained =
              s.reloading ||
              s.clearingStoppage ||
              s.suppressedUntil > sim.time ||
              s.target ||
              (s.squad &&
                (s.squad.inContact ||
                  s.squad.commandPhase === 'hold' ||
                  s.squad.commandPhase === 'defend')) ||
              (s.eng && /^(pinned|engage|orient|alert|cower|freeze|station)$/.test(s.eng.state || ''));
            var rec = still.get(s);
            if (far && !explained && rec && Math.hypot(rec.x - p.x, rec.z - p.z) < 0.5) {
              if (sim.time - rec.t > STILL_SECONDS) {
                note('stuck-still', sim, {
                  who: who,
                  seconds: +(sim.time - rec.t).toFixed(0),
                  dist: +Math.hypot(d.x - p.x, d.z - p.z).toFixed(1),
                  phase: s.squad && s.squad.commandPhase,
                  eng: s.eng && s.eng.state,
                  owner: s._movementResolver && s._movementResolver.last && s._movementResolver.last.owner,
                  kind: s._movementResolver && s._movementResolver.last && s._movementResolver.last.kind,
                  stop: s._movementStopReason
                });
                rec.t = sim.time;
              }
            } else still.set(s, { x: p.x, z: p.z, t: sim.time });
          });
        });
      });
      ['us', 'ge'].forEach(function (f) {
        if (sim.factions[f].alive !== alive[f])
          note('alive-count', sim, { who: f, counter: sim.factions[f].alive, actual: alive[f] });
      });
    },
    report: function () {
      return { counts: counts, found: found };
    }
  };
})(window);
