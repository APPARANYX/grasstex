#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const H = require('./harness');
const { loadModule } = require('./module-loader');
function serialized(value) {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, row) => {
    if (row && typeof row === 'object') {
      if (seen.has(row)) return '[reference]';
      seen.add(row);
    }
    return row;
  });
}
function world(observer = true) {
  const root = H.bootstrap();
  loadModule(root, 'battle/module-registry.js');
  for (const file of ['60-ai-skills.js', '60a-ai-skills-runtime.js', '60b-ai-skill-crouch-warning.js'])
    loadModule(root, 'battle/modules/' + file);
  const b = H.makeBattle(root, { seed: 602 });
  H.resetIds();
  const q = H.addSquad(root, b, {
    id: 'q',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 100, z: 100 },
    composition: ['rifleman']
  });
  const a = q.members[0],
    api = root.BattleAISkills;
  b.time = 10;
  q.state = 'advance';
  q._macroMission = { status: 'executing', version: 1 };
  const e = root.BattleEngagement.stateOf(a);
  e.state = 'advance';
  e.stance = 'stand';
  e.stanceUntil = 0;
  a._beliefs = {
    byKey: {
      warning: {
        key: 'warning',
        source: 'told',
        x: 4,
        z: 6,
        observedAt: 9,
        expiresAt: 25,
        baseConfidence: 0.8,
        combatThreat: true,
        unit: Object.defineProperty({}, 'root', {
          get() {
            throw new Error('Hidden truth');
          }
        })
      }
    },
    history: []
  };
  b._commandReception = {
    bySoldier: {
      [a.id]: {
        ['movement|soldier:' + a.id]: {
          phase: 'issued',
          receivedAt: 1,
          attendedAt: 2,
          processedAt: 3,
          adoptedAt: 4,
          envelopeId: 'env1',
          data: { missionVersion: 1 }
        }
      }
    }
  };
  const profile = {
    mode: 'pilot',
    observer,
    pilot: { faction: 'us', entity: String(a.id) },
    skills: { 'soldier.crouch-on-warning': { enabled: true } }
  };
  api.configure(profile);
  root.BattleModules.runHook('onBattleStart', b, {});
  const tick = (dt = 0.45) => {
    b.time += dt;
    root.BattleModules.runHook('onCommanderTick', b, {});
  };
  const execution = () => api.diagnostics(b).execution;
  return { root, api, b, a, q, e, profile, tick, execution };
}
{
  const w = world(),
    { api, b, a, tick, execution } = w;
  let requests = 0;
  const request = w.root.BattleEngagement.requestStance;
  w.root.BattleEngagement.requestStance = (...args) => {
    requests++;
    return request(...args);
  };
  const reception = JSON.stringify(b._commandReception),
    dest = a.destination;
  tick();
  assert.equal(execution().active, 1);
  assert.equal(requests, 0);
  tick();
  assert.equal(execution().active, 0);
  assert.equal(requests, 1);
  assert.equal(a.tacticalCrouch, true);
  assert.equal(w.e.stance, 'crouch');
  assert.equal(w.e.stanceUntil, b.time + 0.45, 'hold belongs to Engagement');
  assert.equal(a.destination, dest);
  assert.equal(JSON.stringify(b._commandReception), reception);
  assert.deepEqual(
    execution()
      .receipts.filter(r => r.action === 'crouch')
      .map(r => r.lifecycle),
    ['not-started', 'running', 'succeeded']
  );
  for (let i = 0; i < 8; i++) tick();
  assert.equal(requests, 1, 'one attempt per mission, no repeated orders or stance renewal');
  const before = serialized({ a, cr: b._commandReception });
  for (let i = 0; i < 10; i++) {
    api.snapshot(b, a);
    api.diagnostics(b);
  }
  assert.equal(serialized({ a, cr: b._commandReception }), before, 'diagnostics never reconcile');
}
for (const [name, change] of [
  [
    'contact',
    w => {
      w.q.inContact = true;
    }
  ],
  [
    'pin',
    w => {
      w.e.state = 'pinned';
    }
  ],
  [
    'retreat',
    w => {
      w.q.state = 'retreat';
    }
  ],
  [
    'reload',
    w => {
      w.a.reloading = true;
    }
  ],
  [
    'death',
    w => {
      w.a.dead = true;
    }
  ],
  [
    'incoming',
    w => {
      w.a.suppressedUntil = w.b.time + 10;
    }
  ],
  [
    'possession',
    w => {
      w.a.isPlayer = true;
    }
  ],
  [
    'transport',
    w => {
      w.root.BattleSquadTransport = { isPassenger: () => true };
    }
  ],
  [
    'mission',
    w => {
      w.q._macroMission.version++;
    }
  ],
  [
    'receipt',
    w => {
      w.b._commandReception.bySoldier[w.a.id]['movement|soldier:' + w.a.id].data.missionVersion++;
    }
  ],
  [
    'ROE',
    w => {
      w.q.fireControl = { state: 'hold' };
    }
  ]
]) {
  const w = world();
  w.tick();
  change(w);
  w.tick();
  assert.equal(w.a.tacticalCrouch, false, name + ' preempts pending effect');
  assert.equal(w.execution().active, 0, name + ' releases scheduler claims');
  assert.ok(
    w.execution().receipts.some(r => r.lifecycle === 'cancelled'),
    name + ' receipt'
  );
}
{
  const w = world();
  w.tick();
  w.root.BattleLeases.define('test-existing', { priority: 1 });
  w.root.BattleLeases.grant(w.q, 'test-existing', 'squad-leader', w.b.time, w.b.time + 0.6);
  const leases = JSON.stringify(w.q._leases);
  w.tick();
  assert.equal(w.execution().active, 1);
  assert.equal(w.a.tacticalCrouch, false);
  assert.equal(JSON.stringify(w.q._leases), leases);
  assert.ok(w.execution().receipts.some(r => r.reason === 'suspended'));
  w.tick();
  assert.equal(w.a.tacticalCrouch, true);
  assert.ok(w.execution().receipts.some(r => r.reason === 'resumed'));
}
{
  const w = world();
  w.tick();
  w.a._beliefs.byKey.warning.expiresAt = w.b.time;
  w.tick();
  assert.equal(w.a.tacticalCrouch, false);
  assert.ok(w.execution().receipts.some(r => r.reason === 'stale-intel'));
}
{
  const w = world();
  w.tick();
  w.api.configure({ ...w.profile, mode: 'legacy' });
  w.tick();
  assert.equal(w.a.tacticalCrouch, false);
  assert.equal(w.execution().active, 0);
  assert.ok(w.execution().receipts.some(r => r.lifecycle === 'cancelled'));
  assert.equal(w.api.diagnostics(w.b).prepared, 0);
}
{
  const w = world();
  w.tick();
  w.api.configure({ ...w.profile, observer: false });
  w.tick();
  assert.equal(w.a.tacticalCrouch, true, 'observer toggle preserves running commitment');
  assert.equal(w.execution().receipts.length, 0);
  w.api.configure(w.profile);
  w.tick();
  assert.equal(w.execution().active, 0, 'observer toggle never repeats the completed action');
}
{
  const w = world();
  w.tick();
  const old = w.api.snapshot(w.b, w.a),
    generation = w.api.diagnostics(w.b).generation;
  w.root.BattleModules.runHook('beforeBattleRestart', w.b, {});
  w.root.BattleModules.runHook('onBattleRestart', w.b, {});
  assert.equal(w.api.diagnostics(w.b).generation, generation + 1);
  assert.equal(w.api.select(old, w.api.snapshot(w.b, w.a), w.api.config()).chosen, null);
  assert.equal(w.execution(), null);
  w.tick();
  assert.equal(w.a.tacticalCrouch, false);
}
{
  const w = world();
  w.e.stanceUntil = w.b.time + 1;
  w.tick();
  w.tick();
  assert.equal(
    w.a.tacticalCrouch,
    true,
    'Engagement permits lowering during its ordinary upright march timer'
  );
}
function alternate(w, factory, score = 0.9, id = 'test.alternate') {
  w.api.registerSkill({
    id,
    scope: 'soldier',
    requires: [],
    resources: ['posture'],
    parameters: {},
    evaluate: () => ({ eligible: true, score, reason: 'test', evidence: [] }),
    createPlan: factory
  });
  w.profile.skills[id] = { enabled: true };
  w.api.configure(w.profile);
}
{
  const w = world();
  let score = 0.7;
  w.api.registerSkill({
    id: 'test.near',
    scope: 'soldier',
    requires: [],
    resources: ['posture'],
    parameters: {},
    evaluate: () => ({ eligible: true, score, reason: 'test', evidence: [] }),
    createPlan: (s, a) => a.posture()
  });
  w.profile.skills['test.near'] = { enabled: true };
  w.api.configure(w.profile);
  w.tick();
  score = 0.99;
  w.tick();
  assert.equal(
    w.execution().receipts.filter(r => r.lifecycle === 'not-started' && r.action === 'plan').length,
    1
  );
  assert.ok(
    w.execution().receipts.some(r => r.skill === 'soldier.crouch-on-warning' && r.lifecycle === 'succeeded'),
    'utility reversal cannot preempt committed plan'
  );
}
for (const [name, factory, reason, ticks] of [
  ['unknown-action', () => ({ type: 'action', action: 'move' }), 'unsupported-action', 1],
  ['invalid-tree', () => ({ type: 'wait', seconds: Infinity }), 'unsupported-action', 1],
  [
    'node-budget',
    (s, a) => a.sequence(...Array.from({ length: 33 }, () => a.wait(0))),
    'unsupported-action',
    1
  ],
  [
    'depth-budget',
    (s, a) => Array.from({ length: 9 }).reduce(n => a.timeout(1, n), a.wait(0)),
    'unsupported-action',
    1
  ],
  [
    'factory-throw',
    () => {
      throw new Error('factory');
    },
    'unsupported-action',
    1
  ],
  ['timeout', (s, a) => a.timeout(0.45, a.wait(2)), 'never-arrived', 3],
  ['global-timeout', (s, a) => a.wait(10), 'never-arrived', 25],
  ['bounded-retry', (s, a) => a.retry(3, { type: 'action', action: 'move' }), 'unsupported-action', 8],
  ['selector', (s, a) => a.selector({ type: 'action', action: 'move' }, a.posture()), 'accepted', 1]
]) {
  const w = world();
  alternate(w, factory);
  for (let i = 0; i < ticks; i++) w.tick();
  assert.equal(w.execution().active, 0, name + ' cannot remain Running indefinitely');
  assert.ok(
    w.execution().receipts.some(r => r.action === 'plan' && r.reason === reason),
    name
  );
  assert.ok(w.execution().receipts.length <= 128);
}
{
  const w = world();
  w.api.registerSkill({
    id: 'test.no-resource',
    scope: 'soldier',
    requires: [],
    resources: [],
    parameters: {},
    evaluate: () => ({ eligible: true, score: 1, reason: 'test', evidence: [] }),
    createPlan: (s, a) => a.posture()
  });
  w.profile.skills['test.no-resource'] = { enabled: true };
  w.api.configure(w.profile);
  w.tick();
  assert.equal(w.a.tacticalCrouch, false);
  assert.ok(w.execution().receipts.some(r => r.reason === 'no-authority'));
}
{
  const w = world();
  w.tick();
  w.root.BattleEngagement.requestStance = () => {
    throw new Error('Owner unavailable');
  };
  w.tick();
  assert.equal(w.execution().active, 0);
  assert.ok(w.execution().receipts.some(r => r.lifecycle === 'failed' && r.reason === 'no-authority'));
}
{
  const w = world();
  w.tick();
  w.b._roster.us = [{ ...w.a }];
  w.tick();
  assert.equal(w.a.tacticalCrouch, false, 'retained actor cannot receive an effect');
  assert.ok(w.execution().receipts.some(r => r.lifecycle === 'cancelled'));
}
{
  const on = world(true),
    off = world(false);
  on.b.random = off.b.random = () => {
    throw new Error('Pilot consumed RNG');
  };
  on.tick();
  off.tick();
  on.tick();
  off.tick();
  assert.deepEqual(JSON.parse(serialized(on.a)), JSON.parse(serialized(off.a)));
  assert.equal(off.execution().receipts.length, 0);
}
{
  const root = H.bootstrap({ search: '?aiSkills=pilot' });
  loadModule(root, 'battle/module-registry.js');
  for (const file of ['60-ai-skills.js', '60a-ai-skills-runtime.js', '60b-ai-skill-crouch-warning.js'])
    loadModule(root, 'battle/modules/' + file);
  const b = H.makeBattle(root, { seed: 602 });
  root.BattleModules.runHook('onBattleStart', b, {});
  assert.equal(root.BattleAISkills.config().mode, 'pilot');
  assert.equal(root.BattleAISkills.config().pilot.entity, '31');
  assert.equal(root.BattleAISkills.config().skills['soldier.crouch-on-warning'].enabled, true);
}
{
  const w = world(),
    b2 = H.makeBattle(w.root, { seed: 603 });
  H.resetIds();
  const q2 = H.addSquad(w.root, b2, {
    id: 'q2',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 100, z: 100 },
    composition: ['rifleman']
  });
  const a2 = q2.members[0];
  b2.time = w.b.time;
  q2.state = 'advance';
  q2._macroMission = { status: 'executing', version: 1 };
  const e2 = w.root.BattleEngagement.stateOf(a2);
  e2.state = 'advance';
  e2.stance = 'stand';
  e2.stanceUntil = 0;
  a2._beliefs = JSON.parse(JSON.stringify(w.a._beliefs));
  b2._commandReception = JSON.parse(JSON.stringify(w.b._commandReception));
  w.root.BattleModules.runHook('onBattleStart', b2, {});
  w.tick();
  b2.time += 0.45;
  w.root.BattleModules.runHook('onCommanderTick', b2, {});
  w.a.dead = true;
  w.tick();
  b2.time += 0.45;
  w.root.BattleModules.runHook('onCommanderTick', b2, {});
  assert.equal(w.a.tacticalCrouch, false);
  assert.equal(a2.tacticalCrouch, true, 'same-ID independent battle keeps its commitment');
}
for (const file of ['60-ai-skills.js', '60a-ai-skills-runtime.js', '60b-ai-skill-crouch-warning.js']) {
  const source = fs.readFileSync('battle/modules/' + file, 'utf8');
  assert.doesNotMatch(
    source,
    /\.destination\s*=|\.commandPhase\s*=|\._macroMission\s*=|\.stance\s*=|setTimeout\(|Math\.random\(/
  );
}
console.log(
  'PASS pilot: real Engagement adapter, explicit lifecycle, owner priorities, commitment, lease suspension, bounded BTs, scoped rollback, restart and observer neutrality'
);
