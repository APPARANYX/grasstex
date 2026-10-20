#!/usr/bin/env node
'use strict';
// Optional forensic probes must register through the existing runner and never
// alter the simulated battle. They are NOT loaded into normal gameplay.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function freezeDeep(o, seen = new Set()) {
  if (!o || typeof o !== 'object' || seen.has(o)) return o;
  seen.add(o);
  for (const k of Object.keys(o)) freezeDeep(o[k], seen);
  return Object.freeze(o);
}
function load(name) {
  const file = path.join(__dirname, '../../scripts/probes/', name + '.js');
  const root = { BattleProbes: {}, SquadAI: {
    soldierContact: () => null,
    squadContact: () => null,
    hasFirstHandMemory: () => false
  }};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window: root }, { filename: file });
  const probe = root.BattleProbes[name];
  assert.ok(probe && typeof probe.start === 'function', name + ': start');
  assert.equal(typeof probe.sample, 'function', name + ': sample');
  assert.equal(typeof probe.report, 'function', name + ': report');
  assert.ok(probe.every > 0, name + ': sampling cadence');
  return probe;
}
function sample(time, inContact = false, alerts = []) {
  const soldier = { id: 5, dead: false, root: { position: { x: 0, y: 0, z: 0 } },
    eng: { state: 'alert', engaged: true, lastSeen: { x: 3, z: 2 }, lastSeenAt: 1,
      suppressOrder: true, stanceTrail: [{ at: 1, stance: 'crouch' }] },
    mind: { band: 'alert' } };
  const squad = { id: 'us-0', members: [soldier], commandPhase: 'approach',
    inContact, clearContact: false, state: 'active' };
  return freezeDeep({ time, factions: { us: { squads: [squad] },
    ge: { squads: [] } }, _aiLoopWatch: { alerts } });
}
for (const name of ['hold-reason', 'stale-threat']) {
  const p = load(name);
  p.start();
  const sim = sample(50);
  const before = JSON.stringify(sim);
  p.sample(sim);
  assert.equal(JSON.stringify(sim), before, name + ': mutated simulation');
  if (name === 'hold-reason') assert.equal(p.report()['stale:none'], 2);
  if (name === 'stale-threat') {
    assert.equal(p.report().old_30_plus, 2);
    assert.equal(p.report().supStale10, 2);
  }
}
{
  const p = load('contact-flicker');
  p.start();
  for (let i = 0; i < 40; i++) {
    const sim = sample(i * 2, Math.floor(i / 5) % 2 === 1);
    const before = JSON.stringify(sim);
    p.sample(sim);
    assert.equal(JSON.stringify(sim), before, 'contact-flicker: mutated simulation');
  }
  assert.ok(p.report().count > 0, 'contact-flicker: missed stationary toggles');
}
{
  const p = load('loop-alerts');
  const alert = { key: 'us-0:5', at: 50, faction: 'us', squadId: 'us-0',
    soldierId: 5, reason: 'movement-stalled' };
  const sim = sample(50, false, [alert]);
  p.start(sim);
  p.sample(sim);
  const before = JSON.stringify(sim);
  assert.equal(p.report(sim).count, 1, 'loop-alerts: duplicates an alert');
  assert.equal(JSON.stringify(sim), before, 'loop-alerts: mutated simulation');
}
console.log('PASS optional forensic probe contracts (registration, read-only and sample reports)');
