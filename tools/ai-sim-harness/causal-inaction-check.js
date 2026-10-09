/* Pure observer contract: no LOS recompute, no RNG, no command settlement,
 * truthful verified/likely/unknown labels and bounded evidence. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,
  '../../scripts/probes/causal-inaction.cjs'), 'utf8');

function fixture(search, outcomeState) {
  let originalFires = 0, mutations = 0, randoms = 0, reads = 0;
  const sq = { id: 'ge-2', state: 'advance', commandPhase: 'approach',
    _macroMission: { version: 1 } };
  const target = { id: 99, dead: false, root: { position: { x: 0, z: 30 } } };
  const soldier = { id: 76, faction: 'ge', role: 'gunner', squad: sq,
    root: { position: { x: 0, z: 0 } }, destination: { x: 0, z: 50 },
    dead: false, target, moveSpeed: 0, eng: { state: 'engage' },
    _losBlockedFire: 0, _crestBlockedFire: 0,
    _terrainBlockedSuppressiveFire: 0, _movementStopReason: 'path-blocked',
    _movementResolver: { last: { owner: 'post', kind: 'firing-station', reason: 'prepared' } }
  };
  const ignored = { ...soldier, id: 77 };
  const state = { state: outcomeState, envelopeId: 'env-1', missionVersion: 1,
    current: true, by: outcomeState === 'held' ? 'post' : null,
    why: outcomeState === 'pending' ? 'undeliverable' : null,
    terminal: outcomeState === 'blocked', progressing: false };
  const root = {
    location: { search }, BattleProbes: {},
    BattleModules: { unitsFor: () => [soldier, ignored] },
    BattleExecutionOutcome: { man: () => { reads++; return state; } },
    BattleDirectFireLOSGate: { blocked: () => { mutations++; throw Error('LOS recomputed'); } },
    BattleCommandReception: { adopted: () => { mutations++; throw Error('command settled'); } }
  };
  const math = Object.create(Math);
  math.random = () => { randoms++; throw Error('RNG touched'); };
  vm.runInNewContext(source, { window: root, URLSearchParams, Math: math, Map },
    { filename: 'causal-inaction.cjs' });
  const probe = root.BattleProbes['causal-inaction'];
  assert.ok(probe, 'probe registered');
  const sim = { time: 0, onFire: () => { originalFires++; },
    _commandReception: { adoptedBySoldier: { 76: {} } } };
  probe.start(sim);
  return { soldier, target, state, sim, probe,
    stats: () => ({ originalFires, mutations, randoms, reads }),
    sample(t) { sim.time = t; probe.sample(sim); } };
}

// True firing rejection and an authoritative arbitration hold, not an inferred decision.
const a = fixture('?probeSide=ge&probeRole=gunner&probeIds=76&probeSquads=ge-2', 'held');
for (let t = 0; t <= 13; t++) {
  if (t === 4) a.soldier._losBlockedFire = 2;
  a.sample(t);
}
let report = a.probe.report(a.sim);
assert.equal(report.actorsObserved, 1, 'actor selectors applied');
assert.equal(report.counts['fire-silence'], 1);
assert.equal(report.counts['movement-inaction'], 1);
const fire = report.episodes.find(e => e.kind === 'fire-silence');
const move = report.episodes.find(e => e.kind === 'movement-inaction');
assert.equal(fire.code, 'observed-trigger-rejection');
assert.equal(fire.confidence, 'verified');
assert.equal(fire.scope, 'shot-attempt', 'does not claim entire silence proven');
assert.equal(fire.evidence.triggerRejectDeltas.los, 2);
assert.equal(move.code, 'resolver-hold');
assert.equal(move.confidence, 'verified');
assert.equal(move.evidence.order.heldBy, 'post');
assert.equal(move.evidence.order.missionVersion, 1);
assert.ok(move.history.length <= 10, 'bounded history');
assert.ok(a.stats().reads > 0 && a.stats().mutations === 0 && a.stats().randoms === 0);
a.sim.onFire(a.soldier, 0);
for (let t = 14; t <= 18; t++) a.sample(t);
report = a.probe.report(a.sim);
assert.equal(a.stats().originalFires, 1, 'preserve old onFire chain');
assert.equal(report.roundsObserved, 1);
assert.equal(report.counts['fire-silence'], 1, 'shot resets silence clock');

// A stationary executing soldier and a silent gun without call-site evidence are UNKNOWN.
const b = fixture('?probeSide=ge&probeIds=76', 'executing');
for (let t = 0; t <= 13; t++) b.sample(t);
const unknown = b.probe.report(b.sim);
assert.ok(unknown.episodes.some(e => e.code === 'unexplained-fire-silence' && e.confidence === 'unknown'));
assert.ok(unknown.episodes.some(e => e.code === 'unexplained-movement-stall' && e.confidence === 'unknown'));
assert.equal(b.stats().mutations, 0);

// An adopted HOLD is a state correlation, never a verified direct firing gate.
const c = fixture('?probeSide=ge&probeIds=76', 'pending');
c.sim._commandReception.adoptedBySoldier[76]['posture-fire|squad'] =
  { data: { state: 'hold' } };
for (let t = 0; t <= 13; t++) c.sample(t);
const correlated = c.probe.report(c.sim);
assert.ok(correlated.episodes.some(e => e.code === 'restrictive-fire-order' && e.confidence === 'likely'));
assert.ok(correlated.episodes.some(e => e.code === 'order-undeliverable' && e.confidence === 'verified'));

// No target is not a silent-fire incident.
const d = fixture('?probeSide=ge&probeIds=76', 'none');
d.soldier.target = null;
for (let t = 0; t <= 30; t++) d.sample(t);
assert.equal(d.probe.report(d.sim).episodes.length, 0);
console.log('PASS causal inaction: verified vs inferred evidence, firing + movement, purity, bounds and filters');
