#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');
const { loadModule } = require('./module-loader');
function world(search = '') {
  const root = H.bootstrap({ search });
  loadModule(root, 'battle/module-registry.js');
  loadModule(root, 'battle/modules/60-ai-skills.js');
  const battle = H.makeBattle(root, { seed: 602 });
  battle.time = 10;
  const squad = { state: 'advance', _macroMission: { status: 'executing', version: 1 } };
  const actor = {
    id: '602',
    faction: 'us',
    squad,
    dead: false,
    _beliefs: {
      byKey: {
        a: { key: 'a', source: 'told', x: 4, z: 6, observedAt: 8, expiresAt: 20, baseConfidence: 0.8 }
      },
      history: []
    }
  };
  const hostile = Object.defineProperty({}, 'root', {
    get() {
      throw new Error('Hidden enemy truth accessed');
    }
  });
  actor._beliefs.byKey.a.unit = hostile;
  battle._roster = { us: [actor], ge: [] };
  battle._commandReception = {
    bySoldier: {
      '602': {
        'movement|soldier:602': {
          phase: 'issued',
          receivedAt: 1,
          processedAt: 2,
          adoptedAt: 3,
          envelopeId: 'env1',
          data: { missionVersion: 1 }
        }
      }
    }
  };
  const hook = name => root.BattleModules.runHook(name, battle, {});
  hook('onBattleStart');
  return { root, api: root.BattleAISkills, battle, actor, squad, hook };
}
const enabled = (names, extra = {}) => ({
  mode: 'shadow',
  skills: Object.fromEntries(names.map(name => [name, { enabled: true }])),
  ...extra
});
function register(api, name, score, extra = {}) {
  return api.registerSkill({
    id: name,
    scope: 'soldier',
    requires: [],
    resources: [],
    parameters: {},
    evaluate: () => ({ eligible: true, score, reason: 'test-eligible', evidence: [] }),
    ...extra
  });
}
{
  const { api, battle, actor, hook } = world();
  const before = JSON.stringify({ actor, reception: battle._commandReception, events: battle.events });
  hook('onCommanderTick');
  assert.equal(JSON.stringify({ actor, reception: battle._commandReception, events: battle.events }), before);
  assert.equal(api.config().mode, 'legacy');
  assert.equal(api.diagnostics(battle).prepared, 0, 'disabled mode prepares no snapshots');
  let executed = 0;
  register(api, 'z.test', 0.8, {
    createPlan() {
      executed++;
      throw new Error('Must never execute');
    }
  });
  register(api, 'a.test', 0.8);
  assert.throws(() => register(api, 'a.test', 0.8));
  assert.throws(() => register(api, 'bad.scope', 1, { scope: 'enemy' }));
  assert.throws(() => register(api, 'bad.resource', 1, { resources: ['destination'] }));
  for (const parameters of [null, 5, [], false])
    assert.throws(() => register(api, 'bad.schema', 1, { parameters }));
  api.configure(enabled(['z.test', 'a.test']));
  const snap = api.snapshot(battle, actor);
  assert.ok(Object.isFrozen(snap) && Object.isFrozen(snap.facts[0].location));
  assert.equal(snap.facts[0].unit, undefined);
  assert.equal(snap.facts[0].source, 'told');
  assert.equal(snap.facts[0].observedAt, 8);
  assert.throws(() => {
    snap.facts[0].location.x = 50;
  });
  assert.equal(api.select(snap, snap, api.config()).chosen, 'a.test', 'ASCII deterministic tie');
  hook('onCommanderTick');
  assert.equal(executed, 0);
  assert.equal(
    JSON.stringify({ actor, reception: battle._commandReception, events: battle.events }),
    before,
    'shadow may only mutate private diagnostics'
  );
  assert.equal(api.diagnostics(battle).prepared, 1);
  hook('onCommanderTick');
  assert.equal(api.diagnostics(battle).prepared, 1, 'once per simulated commander time');
  assert.ok(Object.isFrozen(api.diagnostics(battle).receipts));
  for (const [field, value] of [
    ['generation', 99],
    ['missionVersion', 2],
    ['now', 11],
    ['entity', 'other'],
    ['scope', 'squad']
  ]) {
    const result = api.select(snap, { ...snap, [field]: value }, api.config());
    assert.equal(result.chosen, null, field + ' context mismatch denied');
    assert.equal(result.decisions[0].reason, 'stale-context');
  }
  for (const guard of ['alive', 'safe', 'mission', 'receipt', 'roe', 'budget']) {
    const invalid = { ...snap, guards: { ...snap.guards, [guard]: false } };
    assert.equal(api.select(invalid, invalid, api.config()).chosen, null, 'hard guard ' + guard);
  }
  for (const row of [
    { ...snap.facts[0], expiresAt: 9 },
    { ...snap.facts[0], observedAt: 11 },
    { ...snap.facts[0], generation: 99 },
    { ...snap.facts[0], source: 'truth' }
  ]) {
    const invalid = { ...snap, facts: [row] };
    assert.equal(api.select(invalid, invalid, api.config()).decisions[0].reason, 'stale-intel');
  }
  register(api, 'resource.test', 1, { resources: ['locomotion'] });
  register(api, 'cover.test', 1, { requires: ['reachable-cover'] });
  api.configure(enabled(['resource.test', 'cover.test']));
  const result = api.select(snap, snap, api.config());
  assert.equal(result.chosen, null);
  assert.equal(result.decisions.find(d => d.skill === 'resource.test').reason, 'resource-conflict');
  assert.equal(result.decisions.find(d => d.skill === 'cover.test').reason, 'missing-capability');
  assert.equal(result.decisions.find(d => d.skill === 'a.test').reason, 'disabled');
  api.configure({ mode: 'pilot' });
  assert.equal(api.config().mode, 'legacy');
  assert.equal(api.diagnostics(battle).error, 'invalid-profile');
  api.configure({ mode: 'shadow', skills: { unknown: { enabled: true } } });
  assert.equal(api.config().mode, 'legacy', 'unknown manifest entries fail closed');
  for (const threshold of ['1', NaN, -1, 2, null]) {
    api.configure({
      mode: 'shadow',
      skills: {
        'soldier.observe-threat': {
          enabled: true,
          parameters: { threshold }
        }
      }
    });
    assert.equal(api.config().mode, 'legacy', 'typed bounded parameters');
  }
}
{
  const { root, api, actor, battle, squad, hook } = world('?aiSkills=shadow');
  const snapshot = api.snapshot(battle, actor);
  assert.equal(api.select(snapshot, snapshot, api.config()).chosen, 'soldier.observe-threat');
  hook('onCommanderTick');
  assert.equal(api.diagnostics(battle).receipts.length, 1);
  squad.fireControl = { state: 'hold' };
  assert.equal(api.snapshot(battle, actor).guards.roe, false);
  squad.fireControl = null;
  actor.dead = true;
  const dead = api.snapshot(battle, actor);
  assert.equal(api.select(dead, dead, api.config()).chosen, null);
  actor.dead = false;
  actor.eng = { state: 'cower' };
  assert.equal(api.snapshot(battle, actor).guards.safe, false);
  actor.eng = null;
  squad._macroMission.version = 2;
  assert.equal(api.snapshot(battle, actor).guards.receipt, false, 'old personally adopted order denied');
  squad._macroMission.version = 1;
  const firstGeneration = api.diagnostics(battle).generation;
  hook('beforeBattleRestart');
  assert.equal(api.snapshot(battle, actor), null, 'no work between reset stages');
  hook('onBattleRestart');
  assert.equal(api.diagnostics(battle).generation, firstGeneration + 1);
  assert.equal(api.diagnostics(battle).receipts.length, 0);
  assert.equal(api.select(snapshot, api.snapshot(battle, actor), api.config()).chosen, null);
  for (let i = 0; i < 4; i++) {
    hook('beforeBattleRestart');
    hook('onBattleRestart');
  }
  assert.equal(api.diagnostics(battle).generation, firstGeneration + 5);
  // A second sim uses the same registry but owns its generation/state independently.
  const second = H.makeBattle(root, { seed: 99 });
  root.BattleModules.runHook('onBattleStart', second, {});
  assert.equal(api.diagnostics(second).generation, 1);
  hook('beforeBattleRestart');
  hook('onBattleRestart');
  assert.equal(api.diagnostics(second).generation, 1, 'restart is battle-local');
  assert.equal(api.diagnostics(second).receipts.length, 0);
  const on = api.select(api.snapshot(battle, actor), api.snapshot(battle, actor), api.config());
  api.configure(enabled(['soldier.observe-threat'], { observer: false }));
  battle.time += 0.45;
  hook('onCommanderTick');
  const offSnap = api.snapshot(battle, actor);
  assert.equal(api.select(offSnap, offSnap, api.config()).chosen, on.chosen);
  assert.equal(api.diagnostics(battle).receipts.length, 0, 'observer off still selects, records nothing');
  assert.equal(api.diagnostics(battle).prepared, 1);
  api.configure(enabled([]));
  battle.time += 0.45;
  hook('onCommanderTick');
  assert.equal(api.diagnostics(battle).prepared, 0, 'all skills disabled skips preparation');
  assert.equal(api.diagnostics(battle).receipts.length, 0, 'disable clears prior decisions immediately');
}
{
  const { api, actor, battle, hook } = world('?aiSkills=shadow');
  for (let i = 0; i < 200; i++) {
    battle.time = 10 + i * 0.01;
    hook('onCommanderTick');
  }
  assert.equal(api.diagnostics(battle).receipts.length, api.limits.receipts);
  for (let i = 0; i <= api.limits.facts; i++)
    actor._beliefs.byKey['b' + i] = { ...actor._beliefs.byKey.a, key: 'b' + i };
  assert.equal(api.snapshot(battle, actor).guards.budget, false);
  battle._roster.us = Array.from({ length: api.limits.actors + 3 }, (_, i) => ({ ...actor, id: i }));
  api.configure(enabled(['soldier.observe-threat']));
  battle.time += 0.45;
  hook('onCommanderTick');
  assert.equal(api.diagnostics(battle).prepared, api.limits.actors);
  assert.equal(api.diagnostics(battle).omitted, 3);
  for (let i = 1; i < api.limits.skills; i++) register(api, 'skill.' + i, 0.1);
  assert.throws(() => register(api, 'budget.overflow', 0.1));
}
{
  const { api, actor, battle } = world('?aiSkills=shadow');
  let attemptedMutation = false;
  register(api, 'bad.evaluator', 1, {
    evaluate(snap) {
      attemptedMutation = true;
      snap.facts[0].location.x = 123;
    }
  });
  register(api, 'invalid.evaluator', 1, { evaluate: () => ({ eligible: true, score: Infinity }) });
  api.configure(enabled(['bad.evaluator', 'invalid.evaluator']));
  const snap = api.snapshot(battle, actor);
  const result = api.select(snap, snap, api.config());
  assert.ok(attemptedMutation);
  assert.equal(result.chosen, null);
  assert.equal(result.decisions.find(d => d.skill === 'bad.evaluator').reason, 'evaluation-error');
  assert.equal(result.decisions.find(d => d.skill === 'invalid.evaluator').reason, 'invalid-evaluation');
  assert.equal(actor._beliefs.byKey.a.x, 4);
}
{
  const { api, battle, hook } = world();
  const requested = enabled(['late.skill']);
  api.configure(requested);
  assert.equal(api.config().mode, 'legacy', 'unknown skill fails closed until it registers');
  register(api, 'late.skill', 0.8);
  requested.mode = 'legacy';
  hook('onCommanderTick');
  assert.equal(api.config().mode, 'shadow', 'resolve detached central profile after module registration');
  assert.ok(api.config().skills['late.skill'].enabled);
  assert.equal(api.diagnostics(battle).prepared, 1);
}
const source = fs.readFileSync(path.join(__dirname, '../../battle/modules/60-ai-skills.js'), 'utf8');
assert.doesNotMatch(source, /BattleSim\.(?:start|restart)\s*=|updateSoldier\s*=|\.destination\s*=/);
assert.doesNotMatch(
  source,
  /Math\.random|Date\.now|performance\.now|proposeCombat\(|proposeOrder\(|createPlan\(/
);
console.log(
  'PASS AI skills shadow: registry/config, immutable provenance, guards, deterministic ties, no actions, lifecycle, disable/observer neutrality and bounded work'
);
