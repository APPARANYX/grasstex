/* Phase D4: Structure-control state machine. When a squad clears a building:
   enter -> clear (room-by-room) -> secure -> release. Behavioral, behind
   ?structureControl=1 (default OFF). Reads building graph, writes
   battle._buildingGraph cell states. */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.SquadAI || root.BattleStructureControl) return;

  var A = root.SquadAI;

  function dist(a, b) {
    return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
  }

  function flagOn() {
    return /[?&]structureControl=1\b/.test(typeof location !== 'undefined' ? location.search : '');
  }

  /* Track per-squad structure-clearing state. */
  function getSqState(sq) {
    if (!sq._structureClearState) sq._structureClearState = { current: null, phase: null, startedAt: 0 };
    return sq._structureClearState;
  }

  /* D4 FSM: enter -> clear -> secure -> release */
  function updateStructureControl(sim, sq) {
    if (!flagOn()) return;
    var st = getSqState(sq);
    var bg = sim._buildingGraph;
    if (!bg || !bg.buildings) return;

    var pos = A.avgPos ? A.avgPos(sq) : null;
    if (!pos) return;

    /* Find building the squad is inside */
    var inside = null;
    for (var i = 0; i < bg.buildings.length; i++) {
      var b = bg.buildings[i];
      if (Math.abs(pos.x - b.x) < (b.width || 20) && Math.abs(pos.z - b.z) < (b.depth || 20)) {
        inside = b;
        break;
      }
    }

    if (!inside) {
      /* Not in a building: release if we were clearing one */
      if (st.current) {
        st.phase = 'release';
        st.current = null;
      }
      return;
    }

    /* Entered a new building */
    if (st.current !== inside.id) {
      st.current = inside.id;
      st.phase = 'enter';
      st.startedAt = +sim.time || 0;
    }

    /* FSM transitions based on time in building */
    var elapsed = (+sim.time || 0) - st.startedAt;
    if (st.phase === 'enter' && elapsed > 2) st.phase = 'clear';
    else if (st.phase === 'clear' && elapsed > 8) {
      st.phase = 'secure';
      /* Mark building as controlled by this faction */
      if (inside.cells) {
        for (var c = 0; c < inside.cells.length; c++) {
          inside.cells[c].control = sq.faction;
          inside.cells[c].occupied = true;
        }
      }
      inside.control = sq.faction;
      inside.controlled = true;
    }
  }

  root.BattleStructureControl = {
    version: '1.0-d4',
    updateStructureControl: updateStructureControl,
    flagOn: flagOn
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('structure-control', {
      version: '1.0-d4',
      onCommanderTick: function (sim) {
        if (!flagOn()) return;
        ['us', 'ge'].forEach(function (f) {
          var squads = sim.factions && sim.factions[f] && sim.factions[f].squads || [];
          for (var i = 0; i < squads.length; i++) updateStructureControl(sim, squads[i]);
        });
      }
    });
  }
  console.log('[TACTICS] D4: Structure-control FSM loaded (?structureControl=1 to enable)');
})(typeof window !== 'undefined' ? window : globalThis);
