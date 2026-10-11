/* Phase A2. Known geometry + own presence + reported threats, never enemy truth.
   Building footprint cells match today's single-level scenario schema; presence
   and a clear sample ray are NOT structure/street control. Collection is opt-in
   (?urbanPicture=1), once per five simulated seconds. */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.BattleTacticalSituation || root.BattleUrbanOperatingPicture) return;
  var A = root.SquadAI,
    T = root.BattleTacticalSituation;
  var SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function enabled() {
    return /[?&]urbanPicture=1\b/.test((root.location && root.location.search) || '');
  }
  function inside(b, p) {
    var dx = p.x - b.x,
      dz = p.z - b.z,
      co = Math.cos(+b.rot || 0),
      si = Math.sin(+b.rot || 0);
    return Math.abs(dx * co - dz * si) <= b.w / 2 && Math.abs(dx * si + dz * co) <= b.d / 2;
  }
  function nearRoad(r, p) {
    var dx = r.bx - r.ax,
      dz = r.bz - r.az,
      len = dx * dx + dz * dz;
    var u = len ? Math.max(0, Math.min(1, ((p.x - r.ax) * dx + (p.z - r.az) * dz) / len)) : 0;
    return Math.hypot(p.x - r.ax - u * dx, p.z - r.az - u * dz) <= (+r.width || 0) / 2;
  }
  function evidence(rows) {
    return rows.map(function (c) {
      return {
        squad: c.squad,
        source: c.source,
        sourceSoldier: c.sourceSoldier,
        targetId: c.targetId,
        at: c.at,
        age: c.age,
        confidence: c.confidence,
        provenance: c.provenance
      };
    });
  }
  function compute(sim, faction) {
    var tactical = T.compute(sim, faction);
    if (!tactical) return null;
    var now = +sim.time || 0,
      meta = sim.scene && sim.scene.metadata;
    var scenario = meta && (meta.battleScenario || meta.battleTown);
    var squads = (sim.factions[faction].squads || []).slice().sort(function (a, b) {
      return String(a.id).localeCompare(String(b.id));
    });
    var friendly = [],
      visibility = [];
    squads.forEach(function (sq) {
      var living = (sq.members || []).filter(function (s) {
        return s && !s.dead;
      });
      living.forEach(function (s) {
        friendly.push(s.root.position);
      });
      var observer =
        living.filter(function (s) {
          return s.id === sq.leaderId;
        })[0] || living[0];
      if (!observer) return;
      var p = observer.root.position;
      SECTORS.forEach(function (sector, i) {
        var angle = (i * Math.PI) / 4,
          point = { x: p.x + Math.sin(angle) * 40, z: p.z - Math.cos(angle) * 40 };
        /* Use shipping geometry LOS, never findTarget/lookYaw/soldierContact.
           This is potential line visibility at one point, not a detected enemy
           or proof of what the squad has actually observed in its view cone. */
        var marker = { root: { position: point } };
        var clear =
          typeof sim.heightAt === 'function' && A.hasLineOfSight
            ? A.hasLineOfSight(observer, marker, sim.heightAt, sim.obstacles)
            : null;
        visibility.push({
          squad: sq.id,
          observer: observer.id,
          sector: sector,
          point: point,
          range: 40,
          clear: clear,
          at: now,
          source: 'terrain-los-probe',
          scope: 'sample-point-only'
        });
      });
    });
    var contacts = tactical.contacts;
    var buildings = ((scenario && scenario.buildings) || [])
      .map(function (b, i) {
        var known = contacts.filter(function (c) {
          return inside(b, c);
        });
        var present = friendly.filter(function (p) {
          return inside(b, p);
        }).length;
        return {
          id: b.id || 'building-' + i,
          cell: 'ground-footprint',
          x: b.x,
          z: b.z,
          w: b.w,
          d: b.d,
          rotation: +b.rot || 0,
          friendlyOccupants: present,
          reportedThreats: known.length,
          reports: evidence(known),
          observationAge: known.length
            ? Math.min.apply(
                null,
                known.map(function (c) {
                  return c.age;
                })
              )
            : null,
          control: 'unknown'
        };
      })
      .sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      });
    var streets = ((scenario && scenario.roads) || [])
      .map(function (r, i) {
        var known = contacts.filter(function (c) {
          return nearRoad(r, c);
        });
        var present = friendly.filter(function (p) {
          return nearRoad(r, p);
        }).length;
        return {
          id: r.id || 'road-' + i,
          start: { x: r.ax, z: r.az },
          end: { x: r.bx, z: r.bz },
          width: r.width,
          friendlyPresence: present,
          reports: evidence(known),
          status: known.length ? (present ? 'reported-contest' : 'reported-threat') : 'unknown',
          cleared: false
        };
      })
      .sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
      });
    return {
      faction: faction,
      time: now,
      geometrySource: scenario ? 'scenario-navigation-schema' : 'unavailable',
      granularity: 'ground-footprints/no-room-control',
      buildings: buildings,
      streets: streets,
      sectorVisibility: visibility,
      contactsOmitted: tactical.contactsOmitted
    };
  }
  function sample(sim) {
    if (!sim) return null;
    sim._urbanOperatingPicture = { time: +sim.time || 0, us: compute(sim, 'us'), ge: compute(sim, 'ge') };
    return summary(sim).urbanOperatingPicture;
  }
  function summary(sim) {
    return {
      urbanOperatingPicture:
        sim && sim._urbanOperatingPicture ? JSON.parse(JSON.stringify(sim._urbanOperatingPicture)) : null
    };
  }
  function reset(sim) {
    if (sim) sim._urbanOperatingPicture = null;
  }
  function tick(sim) {
    if (!enabled() || !sim) return;
    var rec = sim._urbanOperatingPicture,
      now = +sim.time || 0;
    if (!rec || now < rec.time || now - rec.time >= 5) sample(sim);
  }
  root.BattleUrbanOperatingPicture = {
    version: '2.0-a2',
    enabled: enabled,
    compute: compute,
    sample: sample,
    summary: summary
  };
  root.BattleModules.registerSystem('urban-operating-picture', {
    version: '2.0-a2',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: tick
  });
})(typeof window !== 'undefined' ? window : globalThis);
