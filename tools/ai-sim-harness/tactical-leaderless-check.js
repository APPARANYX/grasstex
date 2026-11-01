#!/usr/bin/env node
'use strict';
/* Succession under the tactical controller (15d, `?tacticalController=new`; `?controllerLeaderless=0`
   restores the old behaviour). While a controlled squad has no living leader its skills start no new
   Meso command: no new fire-discipline preparation, no ambush, no covered bound. What the dead leader
   set stands, the men fight, a retreat is never held, and the episode's actions are noted in the
   same leaderless telemetry legacy squads report. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const C = require('../../battle/tactical-capability-contract');
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}
const MODULES = [
  'battle/movement-resolver.js',
  'battle/battle-navigation.js',
  'battle/modules/39-navigation-physicality-debug.js',
  'battle/modules/13a-tactical-controller.js',
  'battle/modules/13b-tactical-owner-adapters.js',
  'battle/modules/13c-tactical-march-provider.js',
  'battle/modules/13d-tactical-contact-skills.js',
  'battle/modules/13h-tactical-ambush-skill.js'
];
function boot(flags) {
  H.resetIds();
  const r = H.bootstrap({
    search: '?stressAct=0&commandRelay=0&tacticalController=new&commandPosture=0' + flags,
    stats: true
  });
  const systems = {};
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  r.BattleModules.unitsFor = b => b._roster.us.concat(b._roster.ge);
  r.BattleTacticalCapabilityContract = C;
  for (const f of MODULES) loadModule(r, f, { console: quietConsole, location: r.location });
  r.BattleBallistics = r.BattleBallistics || { environmentLineBlocked: () => false };
  r.BattleCommanderAI = { policyFor: () => ({ routeArrivalRadius: 8 }) };
  return { r, systems };
}
function order(q) {
  q.commandPhase = 'assault';
  q.state = 'advance';
  q._macroMission = { version: 1, owner: 'force-command', intent: 'capture', status: 'executing' };
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
}
/* A squad in first-hand contact with an enemy squad 100 m ahead (the contact-skills fixture). */
function contactWorld(flags = '') {
  const { r, systems } = boot(flags + '&effectiveFire=1');
  const b = H.makeBattle(r, { seed: 77 });
  b.scene = { metadata: { battleScenario: { buildings: [], roads: [] } } };
  r.BattleNavigation.installScenario(b.scene.metadata.battleScenario);
  b.time = 10;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 300 },
    facing: 0
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 100,
    objective: { x: 0, z: -300 },
    facing: Math.PI
  });
  order(q);
  q.route = [{ x: 0, z: 300 }];
  systems['tactical-march-provider'].onBattleStart(b);
  const w = {
    r,
    b,
    q,
    target: ge.members[2],
    TC: r.BattleTacticalController,
    S: r.BattleTacticalContactSkills
  };
  see(w);
  return w;
}
function see(w) {
  const t = w.target;
  w.q.members.forEach(s => {
    if (s.dead) return;
    s.target = t;
    s.moving = false;
    s.moveSpeed = 0;
    s.root.rotation.y = 0;
    w.r.SquadAI.rememberSeen(s, t, w.b, true, 'contact-fixture');
  });
  w.q.contact = {
    unit: t,
    x: t.root.position.x,
    z: t.root.position.z,
    at: w.b.time,
    firstHandAt: w.b.time,
    seenBy: w.q.members[2].id,
    stance: 'stand'
  };
}
function squad(w) {
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.r.SquadAI.updateSquad(w.q, w.b);
}
/* A masking crest 8 m ahead and fresh relayed reports beyond it (the ambush-skill fixture). */
function ambushWorld(flags = '') {
  const { r, systems } = boot(flags + '&effectiveFire=0');
  const scene = { buildings: [], roads: [] },
    b = H.makeBattle(r, { seed: 77, heightAt: (x, z) => 1.4 * Math.exp(-Math.pow((z - 8) / 1.4, 2)) });
  b.scene = { metadata: { battleScenario: scene } };
  r.BattleNavigation.installScenario(scene);
  b.time = 10;
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  q.members.forEach((s, i) => {
    s.root.position.x = (i - 5) * 2;
    s.root.position.z = 0;
    s.root.position.y = b.heightAt(s.root.position.x, 0);
  });
  order(q);
  q.route = [{ x: 0, z: 80 }];
  systems['tactical-march-provider'].onBattleStart(b);
  const w = { r, b, q, TC: r.BattleTacticalController, K: r.BattleTacticalAmbushSkill };
  report(w);
  return w;
}
function report(w) {
  w.r.SquadAI.rememberReportedContact(
    w.q.members.find(s => !s.dead),
    w.b,
    {
      x: 0,
      z: 20,
      observedAt: w.b.time,
      confidence: 1,
      sourceSoldier: 999,
      source: 'heard',
      combatThreat: true
    }
  );
}
function dispatchAll(w, facts = {}) {
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.TC.dispatch(w.b, w.q, 'squadCommand');
  w.TC.dispatch(w.b, w.q, 'fireAndMovement', facts);
}
function killLeader(w) {
  const leader = w.r.SquadAI.leaderOf(w.q);
  assert.ok(leader, 'the fixture squad starts with a leader');
  leader.dead = true;
  leader.hp = 0;
  return leader;
}
function clean(w) {
  const s = w.TC.summary(w.b);
  assert.equal(s.stats.faults, 0, JSON.stringify(s.stats.faultExamples || []));
}

test('with no leader a fresh contact gets no new HOLD: the men fire on their own', () => {
  const w = contactWorld();
  killLeader(w);
  squad(w);
  assert.equal(w.q.fireControl.state, 'open');
  assert.equal(w.S.summary(w.q).reason, 'succession-no-command');
  assert.equal(w.r.BattleSquadStability.controllerSuccession(w.b, w.q), true);
  clean(w);
});

test('?controllerLeaderless=0 restores the old rule: the leaderless squad still prepares a HOLD', () => {
  const w = contactWorld('&controllerLeaderless=0');
  killLeader(w);
  squad(w);
  assert.equal(w.r.BattleSquadStability.controllerSuccession(w.b, w.q), false);
  assert.equal(w.q.fireControl.state, 'hold');
  assert.equal(w.S.summary(w.q).reason, 'prepare-line');
  clean(w);
});

test('the HOLD the dead leader ordered stands through succession, until its own deadline', () => {
  const w = contactWorld();
  squad(w);
  assert.equal(w.q.fireControl.state, 'hold');
  killLeader(w);
  w.b.time += 0.5;
  see(w);
  squad(w);
  assert.equal(w.q.fireControl.state, 'hold');
  assert.equal(w.S.summary(w.q).reason, 'succession-inherited');
  w.b.time = 10 + w.r.BattleSquadStability.tuning.fireControl.maxHold + 0.1;
  see(w);
  squad(w);
  assert.equal(w.q.fireControl.state, 'open', 'the preparation deadline still opens fire');
  clean(w);
});

test('a controlled squad in succession reports its actions in the leaderless telemetry', () => {
  const w = contactWorld();
  squad(w);
  killLeader(w);
  w.b.time += 0.2;
  see(w);
  squad(w);
  const t = w.r.BattleSquadStability.leaderlessTelemetry(w.b);
  assert.ok(t && t.episodes >= 1, JSON.stringify(t));
  const actions = Object.keys(t.actions);
  assert.ok(actions.length > 0, 'an episode with no noted action would hide what the squad did');
  actions.forEach(a =>
    assert.ok(['immediate-contact', 'finish-committed-move', 'hold-and-fight', 'hold-intent'].includes(a), a)
  );
  clean(w);
});

test('a squad in succession lays no ambush; ?controllerLeaderless=0 lays one as before', () => {
  for (const [flags, phase] of [
    ['', 'idle'],
    ['&controllerLeaderless=0', 'assemble']
  ]) {
    const w = ambushWorld(flags);
    killLeader(w);
    report(w);
    dispatchAll(w);
    assert.equal(w.K.summary(w.q).phase, phase, flags + ' ' + JSON.stringify(w.K.summary(w.q)));
    if (!flags) assert.equal(w.K.summary(w.q).reason, 'succession');
    clean(w);
  }
});

test('once a successor commands the squad the ambush skill may lay one again', () => {
  const w = ambushWorld();
  const dead = killLeader(w);
  report(w);
  dispatchAll(w);
  assert.equal(w.K.summary(w.q).phase, 'idle');
  w.q.leaderId = w.q.members.find(s => s !== dead && !s.dead).id;
  w.b.time += 0.2;
  report(w);
  dispatchAll(w);
  assert.equal(w.K.summary(w.q).phase, 'assemble', JSON.stringify(w.K.summary(w.q)));
  clean(w);
});

test('a retreat is never held by succession', () => {
  const w = ambushWorld();
  killLeader(w);
  w.q.state = 'retreat';
  assert.equal(w.r.BattleSquadStability.controllerSuccession(w.b, w.q), false);
  w.q.state = 'advance';
  w.q.commandPhase = 'retreat';
  assert.equal(w.r.BattleSquadStability.controllerSuccession(w.b, w.q), false);
});

test('a legacy squad is never in controller succession', () => {
  const w = ambushWorld();
  w.TC.requestMode(w.b, w.q, 'legacy');
  killLeader(w);
  assert.equal(w.TC.controls(w.b, w.q), false);
  assert.equal(w.r.BattleSquadStability.controllerSuccession(w.b, w.q), false);
});

console.log(count + ' tactical leaderless checks passed');
