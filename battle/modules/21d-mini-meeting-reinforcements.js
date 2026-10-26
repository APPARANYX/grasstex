/* Preview-only 280x240m balanced meeting reinforcements.
   Two finite matched waves of native infantry (one 10-man squad PER side each
   wave), not revived actors or fabricated AI orders. ?balancedMeeting=1
   ?combatLab=1&labPreset=A. Real mortality, AI, cover, ballistics unchanged. */
(function (root) {
  'use strict';
  var params = typeof location === 'undefined' ? null : new URLSearchParams(location.search);
  var enabled = !!(params && params.get('balancedMeeting') === '1' &&
    params.get('combatLab') === '1' && params.get('labPreset') === 'A' &&
    !params.get('defender') && root.BATTLE_PREVIEW &&
    root.PHASE_C_COMBAT_LAB && !root.SKILLS_LAB);
  if (!enabled || !root.BattleModules || !root.SquadAI) return;
  var DUE = [75, 150], SAFE = 24, states = new WeakMap();
  function reset(sim) {
    states.set(sim, { next: 0, entries: [], blockedSince: null, error: null });
  }
  function state(sim) {
    var s = states.get(sim);
    if (!s) { reset(sim); s = states.get(sim); }
    return s;
  }
  function entry(sim, side, index) {
    var town = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    var zone = town && town.spawnZones && town.spawnZones[side];
    if (!zone || !zone.lanes || zone.lanes.length !== 2) return null;
    return {
      x: (index === 0 ? -62 : 62) * (side === 'us' ? 1 : -1),
      z: +zone.z + (side === 'us' ? -3 : 3)
    };
  }
  function clear(sim, side, p) {
    var enemy = side === 'us' ? 'ge' : 'us';
    return (sim._roster[enemy] || []).every(function (s) {
      if (!s || s.dead || !s.root || !s.root.position) return true;
      return Math.hypot(s.root.position.x - p.x, s.root.position.z - p.z) >= SAFE;
    });
  }
  function tick(sim) {
    if (!sim || sim.winner) return;
    var s = state(sim), wave = s.next;
    if (wave >= DUE.length || sim.time < DUE[wave]) return;
    var us = entry(sim, 'us', wave), ge = entry(sim, 'ge', wave);
    if (!us || !ge) { s.error = 'unbalanced-spawn-zones'; return; }
    if (!clear(sim, 'us', us) || !clear(sim, 'ge', ge)) {
      if (s.blockedSince == null) s.blockedSince = sim.time;
      return;
    }
    var created = [], requests = [['us', us], ['ge', ge]];
    for (var i = 0; i < requests.length; i++) {
      var f = requests[i][0], p = requests[i][1];
      var result = root.BattleModules.spawnUnitType('infantry-squad', sim, f, p);
      if (!result || !result.squad || result.count !== root.SquadAI.COMPOSITION.length) {
        s.error = 'native-infantry-spawn-failed:' + f;
        throw new Error('Mini meeting reinforcement: ' + s.error);
      }
      result.squad._miniMeetingReinforcementWave = wave + 1;
      created.push({ faction: f, squad: result.squad.id, soldiers: result.count });
    }
    var e = {
      wave: wave + 1, at: +sim.time.toFixed(2),
      kind: 'timed-native-reinforcement',
      delayedSeconds: s.blockedSince == null ? 0 : +(sim.time - s.blockedSince).toFixed(2),
      squads: created
    };
    s.next++;
    s.entries.push(e);
    s.blockedSince = null;
    if (root.BattleTelemetry?.record)
      root.BattleTelemetry.record('mini-meeting-reinforcement', e, sim);
  }
  function summary(sim) {
    if (!sim) return null;
    var s = state(sim);
    return {
      enabled: true, dueSeconds: DUE.slice(), wavesCompleted: s.next,
      remaining: DUE.length - s.next, blockedSince: s.blockedSince,
      error: s.error, entries: s.entries.slice()
    };
  }
  root.BattleModules.registerSystem('mini-meeting-reinforcements', {
    version: '1-native-finite-preview',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: tick
  });
  root.BattleMiniMeetingReinforcements = { summary: summary };
})(typeof window !== 'undefined' ? window : globalThis);
