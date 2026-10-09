/* Pure observer contract for the per-soldier gunner trace: no command settlement,
 * no LOS recompute, no RNG; change-triggered rows with a 5 s heartbeat, selector
 * filters, wrapped onFire that preserves the original call, one death row per man,
 * and bounded storage. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../scripts/probes/gunner-trace.cjs'), 'utf8');

function fixture(search) {
  let mutations = 0,
    randoms = 0,
    originalFires = 0,
    originalReturn = null;
  const squad = {
    id: 'ge-2',
    state: 'advance',
    contact: { unit: { id: 9 }, at: 4, relayedFrom: { id: 3 } }
  };
  const target = { id: 9, dead: false, root: { position: { x: 0, z: 60 } } };
  const soldier = {
    id: 76,
    faction: 'ge',
    role: 'gunner',
    squad,
    root: { position: { x: 0, z: 0 } },
    dead: false,
    target,
    moveSpeed: 0,
    prone: false,
    crouching: false,
    tacticalCrouch: false,
    setUp: false,
    suppressedUntil: 0,
    eng: { state: 'alert', since: 2, until: 8, fireReadyAt: 6, setUpSince: 0 }
  };
  const wrongSide = { ...soldier, id: 71, faction: 'us', squad: { ...squad, id: 'us-1', contact: null } };
  const wrongRole = { ...soldier, id: 72, role: 'rifleman' };
  const wrongSquad = { ...soldier, id: 73, squad: { ...squad, id: 'ge-3', contact: null } };
  const root = {
    location: { search },
    BattleProbes: {},
    BattleModules: { unitsFor: () => [soldier, wrongSide, wrongRole, wrongSquad] },
    BattleCommandReception: {
      adopted: () => {
        mutations++;
        throw Error('command settled');
      }
    },
    BattleDirectFireLOSGate: {
      blocked: () => {
        mutations++;
        throw Error('LOS recomputed');
      }
    }
  };
  const math = Object.create(Math);
  math.random = () => {
    randoms++;
    throw Error('RNG touched');
  };
  vm.runInNewContext(source, { window: root, URLSearchParams, Math: math, Map }, {
    filename: 'gunner-trace.cjs'
  });
  const probe = root.BattleProbes['gunner-trace'];
  assert.ok(probe, 'probe registered');
  const sim = {
    time: 0,
    onFire: () => {
      originalFires++;
      return originalReturn;
    },
    _commandReception: { adoptedBySoldier: { 76: { 'posture-fire|squad': { data: { state: 'hold' } } } } }
  };
  probe.start(sim);
  return {
    soldier,
    squad,
    sim,
    probe,
    setOriginalReturn(v) {
      originalReturn = v;
    },
    stats: () => ({ mutations, randoms, originalFires }),
    sample(t) {
      sim.time = t;
      probe.sample(sim);
    }
  };
}

// Selectors: only the chosen gunner is traced, and its first row carries the full schema.
const a = fixture('?probeSide=ge&probeRole=gunner&probeIds=76&probeSquads=ge-2');
a.sample(0.15);
a.sample(0.3);
let report = a.probe.report();
assert.equal(report.schema, 'grasstex-gunner-trace-v1');
assert.equal(report.config.ids.join(','), '76');
assert.equal(report.rows.length, 1, 'no change, no heartbeat: still one row');
const row = report.rows[0];
assert.equal(row.id, 'ge:76');
assert.equal(row.st, 'alert');
assert.equal(row.since, 2);
assert.equal(row.until, 8);
assert.equal(row.ready, 6);
assert.equal(row.tgt, '9');
assert.equal(row.rng, 60);
assert.equal(row.stance, 'stand');
assert.equal(row.sq, 'advance');
assert.equal(row.ord, 'hold');
assert.equal(row.ct.src, 'relay');
assert.equal(row.ct.u, '9');
assert.equal(row.ct.age, -3.85);
assert.equal(a.stats().mutations, 0);
assert.equal(a.stats().randoms, 0);

// A changed field emits a new row; a 5 s heartbeat emits one even without change.
a.soldier.eng = { ...a.soldier.eng, state: 'engage' };
a.soldier.setUp = true;
a.sample(0.45);
a.sample(0.6);
assert.equal(a.probe.report().rows.length, 2, 'change-triggered row only');
a.sample(5.6);
assert.equal(a.probe.report().rows.length, 3, '5 s heartbeat row');
assert.equal(a.probe.report().rows[2].up, true);

// Squad contact source mapping: own lands with a state change, heard needs the heartbeat
// (contact fields are row payload, not part of the change signature).
a.squad.contact = { unit: { id: 4 }, at: 5.5 };
a.soldier.eng = { ...a.soldier.eng, state: 'alert' };
a.sample(6);
assert.equal(a.probe.report().rows[3].ct.src, 'own');
assert.equal(a.probe.report().rows[3].ct.age, 0.5);
a.squad.contact = { unit: { id: 4 }, at: 5.5, heard: true };
a.sample(11.2);
assert.equal(a.probe.report().rows[4].ct.src, 'heard');

// The onFire wrap observes shots for chosen men only and keeps the original behavior.
a.setOriginalReturn({ observed: true });
const through = a.sim.onFire(a.soldier);
assert.deepEqual(through, { observed: true }, 'original onFire return value propagates');
a.sim.onFire(a.soldier);
a.sim.onFire({ ...a.soldier, id: 71, faction: 'us' });
assert.equal(a.stats().originalFires, 3, 'every call still reaches the original onFire');
assert.equal(a.probe.report().shots.length, 2, 'only chosen units are recorded');
assert.equal(a.probe.report().shots[0].id, 'ge:76');
assert.equal(a.probe.report().shots[0].t, 11.2);

// Death is recorded once with the state, target and adopted order; nothing after.
a.soldier.eng = { ...a.soldier.eng, state: 'orient' };
a.soldier.dead = true;
a.sample(11.35);
a.sample(11.5);
report = a.probe.report();
assert.equal(report.deaths.length, 1);
assert.equal(report.deaths[0].t, 11.35);
assert.equal(report.deaths[0].st, 'orient');
assert.equal(report.deaths[0].tgt, '9');
assert.equal(report.deaths[0].ord, 'hold');
assert.equal(report.rows.length, 5, 'dead men stop emitting rows');
assert.equal(report.actors, 1, 'he was an actor while alive');

// Bounded storage: past MAX_ROWS the report counts omissions instead of growing.
const b = fixture('?probeIds=76');
for (let k = 0; k <= 6002; k++) {
  b.soldier.eng = { ...b.soldier.eng, since: k };
  b.sample(k * 0.15);
}
report = b.probe.report();
assert.equal(report.rows.length, 6000);
assert.equal(report.rowsOmitted, 3);
assert.equal(b.stats().mutations, 0);
assert.equal(b.stats().randoms, 0);
console.log('PASS gunner trace: purity, selectors, change/heartbeat rows, shots, deaths, bounds');
