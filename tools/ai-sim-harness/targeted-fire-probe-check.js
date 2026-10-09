/* Pure observer contract for the focused fire-control benchmark.
   Catches accidentally changing RNG, target selection, command settlement, LOS caches,
   and unit filters while inspecting the live battle. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../../scripts/probes/targeted-fire-control.js'), 'utf8');
let originalFires = 0, observedSettlements = 0, losRecomputes = 0, randomCalls = 0;
const squad = { id: 'ge-2', inContact: true, state: 'engage', fireControl: { state: 'hold' } };
const target = { id: 7, dead: false, root: { position: { x: 0, z: 20 } } };
function man(id, faction, role, sq) {
  return { id, faction, role, squad: sq, dead: false,
    root: { position: { x: 0, z: 0 }, rotation: { y: 0 } },
    target, weapon: { kind: 'lmg', profile: 'mg42', ammo: 250, reserveAmmo: 250, stats: { range: 165 } },
    eng: { state: 'engage', fireReadyAt: 0 }, setUp: true, speed: 2, moveSpeed: 0,
    suppressedUntil: 0, fireCooldown: 0, mind: { band: 0, shockUntil: 0 },
    _losBlockedFire: 0, _crestBlockedFire: 0 };
}
const selected = man(76, 'ge', 'gunner', squad);
const ignoredID = man(77, 'ge', 'gunner', squad);
const ignoredSide = man(76, 'us', 'gunner', { ...squad, id: 'us-2' });
const men = [selected, ignoredID, ignoredSide];
const root = {
  location: { search: '?probeSide=ge&probeRole=gunner&probeIds=76&probeSquads=ge-2' },
  BattleModules: { unitsFor: () => men },
  BattleProbes: {},
  BattleSquadAI: {},
  SquadAI: { isMachineGun: s => s.role === 'gunner', engageRange: () => 160 },
  BattleSoldierMind: { recentIncoming: () => false },
  BattleCommandReception: { postureEnabled: () => true,
    adopted: () => { observedSettlements++; throw Error('observer settled command reception'); } },
  BattleDirectFireLOSGate: { blocked: () => { losRecomputes++; throw Error('observer recomputed LOS'); } },
  Math: { random: () => { randomCalls++; throw Error('observer drew RNG'); } }
};
const context = vm.createContext({ window: root, URLSearchParams, Math });
vm.runInContext(source, context, { filename: 'targeted-fire-control.js' });
const probe = root.BattleProbes['targeted-fire-control'];
assert.ok(probe);
const sim = { time: 10,
  _commandReception: { adoptedBySoldier: { 76: {
    'posture-fire|squad': { data: { state: 'hold' } }
  } } },
  onFire: () => { originalFires++; }
};
probe.start(sim);
probe.sample(sim);
assert.equal(probe.report(sim).units['ge:76'].gates['fire-order:hold'], 1);
assert.equal(Object.keys(probe.report(sim).units).length, 1, 'strict side/role/id/squad selection');
sim.onFire(selected, false); sim.onFire(selected, true);
sim.time += .15;
selected.setUp = false;
probe.sample(sim);
sim.time += .15;
selected.eng.state = 'cower';
selected._losBlockedFire = 2;
selected._crestBlockedFire = 3;
probe.sample(sim);
const r = probe.report(sim);
const d = r.units['ge:76'];
assert.equal(d.rounds, 2);
assert.equal(d.pulls, 1);
assert.equal(d.setupTransitions, 1);
assert.equal(d.cowerTransitions, 1);
assert.equal(d.gates['mg-setup'], 1);
assert.equal(d.gates['stress:cower'], 1);
assert.equal(d.LOSRejected, 2);
assert.equal(d.crestRejected, 3);
assert.equal(originalFires, 2, 'existing fire callback preserved');
assert.equal(observedSettlements, 0, 'never settle command-reception state');
assert.equal(losRecomputes, 0, 'never change direct-fire LOS cache');
assert.equal(randomCalls, 0, 'never advance battle RNG');
console.log('targeted-fire-probe: selection, fire events, gate classifications and no-side-effect checks passed');
