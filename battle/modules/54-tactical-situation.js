/* Phase A1. Observer only: no perception refresh, enemy transforms, RNG or orders.
   Automatic collection is opt-in (?tacticalSituation=1), once per simulated second.
   compute() is a pure read; sample() owns only sim._tacticalSituation. */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.SquadAI || root.BattleTacticalSituation) return;
  var A = root.SquadAI;
  var SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function enabled() {
    return /[?&]tacticalSituation=1\b/.test((root.location && root.location.search) || '');
  }
  function sector(from, to) {
    return SECTORS[(Math.round(Math.atan2(to.x - from.x, from.z - to.z) / (Math.PI / 4)) + 8) % 8];
  }
  function posture(sq) {
    if (sq.state === 'retreat') return 'retreating';
    var intent = sq._macroMission && sq._macroMission.intent;
    return (
      { capture: 'attacking', defend: 'defending', reserve: 'reserve', reconstitute: 'recovering' }[intent] ||
      'unassigned'
    );
  }
  function compute(sim, faction) {
    if (!sim || !sim.factions || !sim.factions[faction] || !/^(us|ge)$/.test(faction)) return null;
    var now = +sim.time || 0;
    var squads = (sim.factions[faction].squads || []).slice().sort(function (a, b) {
      return String(a.id).localeCompare(String(b.id));
    });
    var counts = { attacking: 0, defending: 0, reserve: 0, retreating: 0, recovering: 0, unassigned: 0 };
    var contacts = [],
      reserves = [],
      centroid = { x: 0, z: 0 },
      n = 0,
      aliveSquads = 0;
    squads.forEach(function (sq) {
      var members = (sq.members || []).filter(function (s) {
        return s && !s.dead;
      });
      if (!members.length) return;
      aliveSquads++;
      counts[posture(sq)]++;
      if (posture(sq) === 'reserve' && !sq.inContact) reserves.push(sq.id);
      members.forEach(function (s) {
        var p = s.root.position;
        centroid.x += p.x;
        centroid.z += p.z;
        n++;
      });
      var rows = A.squadContactsMap(sq, sim) || [];
      rows.forEach(function (c) {
        contacts.push({
          squad: sq.id,
          x: c.x,
          z: c.z,
          at: c.at,
          age: Math.max(0, now - c.at),
          source: c.source || null,
          confidence: c.confidence == null ? null : c.confidence,
          targetId: c.targetId == null ? null : c.targetId,
          sourceSoldier: c.sourceSoldier == null ? null : c.sourceSoldier,
          provenance: 'member-belief'
        });
      });
      /* squadContact() expires/clears gameplay state. Read the stored upward report
         instead, without consulting the live target's health/disposition/position. */
      var c = sq.contact;
      if (
        !rows.length &&
        c &&
        isFinite(c.x) &&
        isFinite(c.z) &&
        isFinite(c.at) &&
        now - c.at <= A.CONTACT_MEMORY
      ) {
        contacts.push({
          squad: sq.id,
          x: +c.x,
          z: +c.z,
          at: +c.at,
          age: Math.max(0, now - c.at),
          source: c.source || (c.heard ? 'heard' : c.seenBy != null ? 'seen' : null),
          confidence: null,
          targetId: c.knownUnitId == null ? null : c.knownUnitId,
          sourceSoldier: c.seenBy == null ? null : c.seenBy,
          provenance: 'squad-report'
        });
      }
    });
    if (n) {
      centroid.x /= n;
      centroid.z /= n;
    }
    contacts.sort(function (a, b) {
      return String(a.squad).localeCompare(String(b.squad)) || a.x - b.x || a.z - b.z || a.at - b.at;
    });
    var threats = {};
    SECTORS.forEach(function (s) {
      threats[s] = { reports: 0, youngestAge: null };
    });
    contacts.forEach(function (c) {
      var t = threats[sector(centroid, c)];
      t.reports++;
      t.youngestAge = t.youngestAge == null ? c.age : Math.min(t.youngestAge, c.age);
    });
    /* Public objective ownership is lawful Macro input. Enemy pressure is ONLY
       reported contact proximity; never capture-zone enemy counts. */
    var objectives = (sim._objectives || [])
      .map(function (o) {
        var st = sim.objectiveControl && sim.objectiveControl.sectors && sim.objectiveControl.sectors[o.id];
        var p = o.def && (o.def.point || o.def);
        return {
          id: o.id,
          owner: (st && st.owner) || 'unknown',
          reportedThreats:
            p && isFinite(p.x) && isFinite(p.z)
              ? contacts.filter(function (c) {
                  return Math.hypot(c.x - p.x, c.z - p.z) <= (+o.def.radius || 30) * 1.5;
                }).length
              : null,
          provenance: 'public-owner/reported-contacts'
        };
      })
      .sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      });
    var force =
      counts.attacking && counts.defending
        ? 'mixed'
        : counts.attacking
          ? 'attacking'
          : counts.defending
            ? 'defending'
            : counts.retreating
              ? 'retreating'
              : counts.reserve
                ? 'reserve'
                : 'unassigned';
    return {
      faction: faction,
      time: now,
      forcePosture: force,
      postureBreakdown: counts,
      aliveSquads: aliveSquads,
      contacts: contacts.slice(0, 64),
      contactCount: contacts.length,
      contactsOmitted: Math.max(0, contacts.length - 64),
      threatSectors: threats,
      objectivePressure: objectives,
      availableReserves: reserves.length,
      reserveSquads: reserves
    };
  }
  function sample(sim) {
    if (!sim) return null;
    sim._tacticalSituation = { time: +sim.time || 0, us: compute(sim, 'us'), ge: compute(sim, 'ge') };
    return summary(sim).tacticalSituation;
  }
  function summary(sim) {
    return {
      tacticalSituation:
        sim && sim._tacticalSituation ? JSON.parse(JSON.stringify(sim._tacticalSituation)) : null
    };
  }
  function reset(sim) {
    if (sim) sim._tacticalSituation = null;
  }
  function tick(sim) {
    if (!enabled() || !sim) return;
    var rec = sim._tacticalSituation,
      now = +sim.time || 0;
    if (!rec || now < rec.time || now - rec.time >= 1) sample(sim);
  }
  root.BattleTacticalSituation = {
    version: '2.0-a1',
    enabled: enabled,
    compute: compute,
    sample: sample,
    summary: summary
  };
  root.BattleModules.registerSystem('tactical-situation', {
    version: '2.0-a1',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: tick
  });
})(typeof window !== 'undefined' ? window : globalThis);
