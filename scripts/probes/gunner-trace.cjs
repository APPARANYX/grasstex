/* Per-soldier causal-chain trace, change-triggered. Observe only: reads live fields
   (engagement state machine, target, stance, MG setUp, squad state/contact, adopted fire order
   from the command-reception record store) and keeps its own rows outside the sim. The onFire
   wrap only observes. NEVER call BattleCommandReception.adopted() or BattleDirectFireLOSGate
   .blocked() from the observer: both mutate runtime caches/command settlement.
   Select with URL params probeSide/probeRole/probeIds/probeSquads. */
(function (root) {
  'use strict';
  var params = new URLSearchParams((root.location && root.location.search) || '');
  function csv(k) {
    return String(params.get(k) || '')
      .split(',')
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
  }
  var opts = {
      side: params.get('probeSide') || 'all',
      role: params.get('probeRole') || 'gunner',
      ids: csv('probeIds'),
      squads: csv('probeSquads')
    },
    MAX_ROWS = 6000,
    data,
    prev,
    originalFire;
  function r2(n) {
    return +Number(n || 0).toFixed(2);
  }
  function choose(s) {
    if (!s || !s.root || !s.squad) return false;
    return (
      (opts.side === 'all' || s.faction === opts.side) &&
      (opts.role === 'all' || opts.role.split(',').indexOf(s.role) >= 0) &&
      (!opts.ids.length || opts.ids.indexOf(String(s.id)) >= 0) &&
      (!opts.squads.length || opts.squads.indexOf(String(s.squad.id)) >= 0)
    );
  }
  function adoptedOrder(s, sim) {
    var a = sim._commandReception && sim._commandReception.adoptedBySoldier,
      b = a && a[String(s.id)],
      rec = b && b['posture-fire|squad'];
    return (rec && rec.data && rec.data.state) || 'none';
  }
  function stance(s) {
    return s.prone ? 'prone' : s.crouching || s.tacticalCrouch ? 'crouch' : 'stand';
  }
  function contactInfo(sq, sim) {
    var c = sq && sq.contact;
    if (!c) return null;
    var src = c.heard ? 'heard' : c.relayedFrom ? 'relay' : 'own';
    return {
      u: c.unit ? String(c.unit.id) : null,
      src: src,
      age: r2(sim.time - (+c.at || 0))
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['gunner-trace'] = {
    every: 1,
    start: function (sim) {
      data = {
        schema: 'grasstex-gunner-trace-v1',
        config: opts,
        rows: [],
        rowsOmitted: 0,
        shots: [],
        deaths: [],
        actors: 0
      };
      prev = new Map();
      originalFire = sim.onFire;
      sim.onFire = function (s) {
        var result = originalFire && originalFire.apply(this, arguments);
        if (choose(s) && data.shots.length < 2000)
          data.shots.push({ t: r2(sim.time), id: String(s.faction) + ':' + String(s.id) });
        return result;
      };
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim),
        actors = 0;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!choose(s)) continue;
        var key = String(s.faction) + ':' + String(s.id),
          e = s.eng || {};
        if (s.dead) {
          if (!prev.has(key + ':dead')) {
            prev.set(key + ':dead', true);
            if (data.deaths.length < 100)
              data.deaths.push({
                t: r2(sim.time),
                id: key,
                st: String(e.state || 'advance'),
                tgt: s.target && !s.target.dead ? String(s.target.id) : null,
                ord: adoptedOrder(s, sim)
              });
          }
          continue;
        }
        actors++;
        var t = s.target && !s.target.dead && s.target.root ? s.target : null,
          p = s.root.position,
          rng = t
            ? +Math.hypot(t.root.position.x - p.x, t.root.position.z - p.z).toFixed(1)
            : null,
          row = {
            t: r2(sim.time),
            id: key,
            st: String(e.state || 'advance'),
            since: r2(e.since),
            until: r2(e.until),
            ready: e.fireReadyAt != null ? r2(e.fireReadyAt) : null,
            tgt: t ? String(t.id) : null,
            rng: rng,
            up: !!s.setUp,
            upSince: e.setUpSince != null ? r2(e.setUpSince) : null,
            stance: stance(s),
            spd: r2(s.moveSpeed),
            sup: s.suppressedUntil > sim.time,
            sq: String(s.squad.state),
            ord: adoptedOrder(s, sim),
            ct: contactInfo(s.squad, sim)
          },
          q = prev.get(key),
          sig =
            row.st + '|' + row.tgt + '|' + row.up + '|' + row.stance + '|' + row.sq + '|' +
            row.ord + '|' + row.sup + '|' + (row.spd > 0.35) + '|' + row.since;
        if (!q || q.sig !== sig || sim.time - q.t >= 5) {
          if (data.rows.length >= MAX_ROWS) data.rowsOmitted++;
          else data.rows.push(row);
          prev.set(key, { sig: sig, t: sim.time });
        }
      }
      data.actors = Math.max(data.actors, actors);
    },
    report: function () {
      return data;
    }
  };
})(window);
