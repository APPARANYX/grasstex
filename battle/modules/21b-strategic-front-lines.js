/* Front-lines rules for the 5 km ?frontLines=1 layout (scenario.frontLines, scenario-generator.js).
   One owner for four things:
   - which line a side may attack: only the first line, counted from its own rear, that it does not
     fully hold (so a lost rear line is retaken before anything further forward);
   - the start ownership of every line (bases belong to their side; the battle type decides the
     centre);
   - each squad's rear assembly point: the nearest objective of the frontmost line its side fully
     holds. Retreat, extraction and reconstitution keep their owners and read this point through
     SquadAI.extractionHome; nothing here moves a soldier;
   - which road into a line a capture brief takes (approachFor, read by the General when he
     writes the brief's road route), so a side's attack uses the main and the side road.
   Reads ownership from BattleObjectiveSystem. Writes only the start ownership and
   squad._frontLineRear. Without scenario.frontLines every function is inert. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleFrontLines) return;

  function layout(sim) {
    var town = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    return town && town.profile === 'strategic' && town.frontLines ? town : null;
  }
  function owner(sim, id) {
    var api = root.BattleObjectiveSystem,
      st = api && api.status ? api.status(sim, id) : null;
    return (st && st.owner) || 'neutral';
  }
  /* Lines from this side's rear to the enemy's rear. */
  function ordered(town, faction) {
    var lines = town.frontLines.lines.slice();
    return faction === 'ge' ? lines.reverse() : lines;
  }
  function frontIndex(sim, town, faction) {
    var lines = ordered(town, faction);
    for (var i = 0; i < lines.length; i++)
      if (
        !lines[i].objectiveIds.every(function (id) {
          return owner(sim, id) === faction;
        })
      )
        return i;
    return lines.length;
  }
  /* ?frontLineRule=0 keeps the layout but lets the General attack any objective. */
  function ruleOn() {
    return !/(?:^|[?&])frontLineRule=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  /* Objectives this side already holds are never attack targets. */
  function attackable(sim, faction, objectiveId) {
    var town = layout(sim);
    if (!town || !ruleOn() || (faction !== 'us' && faction !== 'ge')) return true;
    var line = ordered(town, faction)[frontIndex(sim, town, faction)];
    return !!line && line.objectiveIds.indexOf(objectiveId) >= 0 && owner(sim, objectiveId) !== faction;
  }
  function objective(town, id) {
    return (
      (town.objectives || []).find(function (o) {
        return o.id === id;
      }) || null
    );
  }
  function centre(sq) {
    var men = (sq.members || []).filter(function (m) {
      return m && !m.dead && m.root && m.root.position;
    });
    if (!men.length) return sq.baseHome || sq.home || null;
    return {
      x:
        men.reduce(function (v, m) {
          return v + m.root.position.x;
        }, 0) / men.length,
      z:
        men.reduce(function (v, m) {
          return v + m.root.position.z;
        }, 0) / men.length
    };
  }
  /* The held line behind the front: every objective of it is this side's. If the side has lost
     part of its base line, the bases it still holds. None held: no front-line rear point. */
  function rearFor(sim, sq) {
    var town = layout(sim);
    if (!town || !sq || (sq.faction !== 'us' && sq.faction !== 'ge')) return null;
    var lines = ordered(town, sq.faction),
      i = frontIndex(sim, town, sq.faction),
      line = i > 0 ? lines[i - 1] : lines[0],
      held = line.objectiveIds.filter(function (id) {
        return owner(sim, id) === sq.faction;
      }),
      from = centre(sq),
      best = null;
    if (!from) return null;
    held.forEach(function (id) {
      var o = objective(town, id);
      if (
        o &&
        (!best || Math.hypot(o.x - from.x, o.z - from.z) < Math.hypot(best.x - from.x, best.z - from.z))
      )
        best = o;
    });
    return best ? { x: best.x, z: best.z, objectiveId: best.id, line: line.index } : null;
  }
  /* ?splitRoads=0 sends every squad by the shortest road, as before. */
  function splitOn() {
    return !/(?:^|[?&])splitRoads=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function routeLength(origin, route, goal) {
    var total = 0,
      last = origin;
    route.concat([goal]).forEach(function (p) {
      total += Math.hypot(p.x - last.x, p.z - last.z);
      last = p;
    });
    return total;
  }
  /* A capture brief against a line enters it by one of the roads from ground this side holds
     (the main road and the side road). Each brief takes the road fewest of the side's other
     live capture briefs on that objective use, the shorter on a tie; a brief re-issued on the
     same objective keeps its road. Null (shortest road, unchanged) when no road from held
     ground leads in. */
  function approachFor(sim, sq, goalId, origin) {
    var town = layout(sim),
      routes = root.BattleCommanderRoutes;
    if (!town || !splitOn() || !sq || !routes || !routes.missionRouteVia) return null;
    var goal = objective(town, goalId);
    if (!goal || goal.baseFaction) return null;
    var options = [];
    (town.roads || []).forEach(function (road) {
      var entryId =
        road.fromObjectiveId === goalId
          ? road.toObjectiveId
          : road.toObjectiveId === goalId
            ? road.fromObjectiveId
            : null;
      if (!entryId || owner(sim, entryId) !== sq.faction) return;
      var route = routes.missionRouteVia(sq, town, goalId, origin, entryId);
      if (route)
        options.push({
          roadId: road.id,
          entryId: entryId,
          route: route,
          length: routeLength(origin, route, goal)
        });
    });
    // A route that passes another road's entry would drive past that road to reach its own.
    options = options.filter(function (o) {
      return !options.some(function (other) {
        var e = other !== o && objective(town, other.entryId);
        return (
          e &&
          o.route.slice(0, -1).some(function (p) {
            return Math.hypot(p.x - e.x, p.z - e.z) <= 8;
          })
        );
      });
    });
    if (!options.length) return null;
    // One road from here: take it, and count it, so squads with a choice balance against it.
    if (options.length === 1) return options[0];
    var old = sq._macroMission;
    if (old && old.objectiveId === goalId && old.approachRoadId)
      for (var k = 0; k < options.length; k++)
        if (options[k].roadId === old.approachRoadId) return options[k];
    var load = {};
    ((sim.factions && sim.factions[sq.faction] && sim.factions[sq.faction].squads) || []).forEach(
      function (other) {
        var m = other && other !== sq && other._macroMission;
        if (
          m &&
          m.intent === 'capture' &&
          m.objectiveId === goalId &&
          m.approachRoadId &&
          (m.status === 'issued' || m.status === 'executing') &&
          other.state !== 'retreat'
        )
          load[m.approachRoadId] = (load[m.approachRoadId] || 0) + 1;
      }
    );
    options.sort(function (a, b) {
      return (load[a.roadId] || 0) - (load[b.roadId] || 0) || a.length - b.length;
    });
    return options[0];
  }
  function telemetry(sim, kind, data) {
    if (root.BattleTelemetry && root.BattleTelemetry.record) root.BattleTelemetry.record(kind, data, sim);
  }
  /* The only start-ownership writer in this layout (21-defender-engineers seedOwnership stands down). */
  function seed(sim) {
    var town = layout(sim),
      api = root.BattleObjectiveSystem;
    if (!town || !api || !api.get) return;
    var defender = sim._sides && sim._sides.defender,
      owners = town.frontLines.startOwners[defender || 'meeting'] || town.frontLines.startOwners.meeting;
    town.frontLines.lines.forEach(function (line) {
      line.objectiveIds.forEach(function (id) {
        var o = api.get(sim, id);
        if (!o || !o.state) return;
        o.state.owner = owners[line.index] || 'neutral';
        o.state.active = null;
        o.state.lastActive = null;
        o.state.progress = 0;
        o.state.phase = owners[line.index] ? 'held' : 'idle';
      });
    });
    if (api.tick) api.tick(sim, 0);
    telemetry(sim, 'strategic-front-lines-seeded', { defender: defender || null, owners: owners.slice() });
  }
  function publish(sim) {
    if (!layout(sim)) return;
    ['us', 'ge'].forEach(function (f) {
      ((sim.factions && sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
        sq._frontLineRear = rearFor(sim, sq);
      });
    });
  }
  function summary(sim) {
    var town = layout(sim);
    if (!town) return null;
    return {
      lines: town.frontLines.lines.map(function (line) {
        return {
          index: line.index,
          owners: line.objectiveIds.map(function (id) {
            return owner(sim, id);
          })
        };
      }),
      front: { us: frontIndex(sim, town, 'us'), ge: frontIndex(sim, town, 'ge') }
    };
  }

  root.BattleModules.registerSystem('strategic-front-lines', {
    version: '1-front-lines',
    onBattleStart: function (sim) {
      seed(sim);
      publish(sim);
    },
    onBattleRestart: function (sim) {
      seed(sim);
      publish(sim);
    },
    onCommanderTick: function (sim) {
      publish(sim);
    }
  });
  root.BattleFrontLines = {
    active: function (sim) {
      return !!layout(sim);
    },
    attackable: attackable,
    rearFor: rearFor,
    approachFor: approachFor,
    summary: summary,
    seed: seed
  };
})(typeof window !== 'undefined' ? window : globalThis);
