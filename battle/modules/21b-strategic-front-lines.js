/* Front-lines rules for the 5 km ?frontLines=1 layout (scenario.frontLines, scenario-generator.js).
   One owner for three things:
   - which line a side may attack: only the first line, counted from its own rear, that it does not
     fully hold (so a lost rear line is retaken before anything further forward);
   - the start ownership of every line (bases belong to their side; the battle type decides the
     centre);
   - each squad's rear assembly point: the nearest objective of the frontmost line its side fully
     holds. Retreat, extraction and reconstitution keep their owners and read this point through
     SquadAI.extractionHome; nothing here moves a soldier.
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
    summary: summary,
    seed: seed
  };
})(typeof window !== 'undefined' ? window : globalThis);
