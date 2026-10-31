#!/usr/bin/env node
'use strict';
/* Controller ambush skill (module 13h): the legacy masked firing line carried out through capability
   requests only. A crest gives masked posts; without a crest, fresh reports, or three men, nothing
   happens; contact, pressure and owner endings release every man through his owner. */
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
function world({ terrain = true, flags = '', reports = true } = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search: '?stressAct=0&commandRelay=0&tacticalController=new&effectiveFire=0&commandPosture=0' + flags,
    stats: true
  });
  const systems = {};
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  r.BattleModules.unitsFor = b => b._roster.us.concat(b._roster.ge);
  r.BattleTacticalCapabilityContract = C;
  for (const f of [
    'battle/movement-resolver.js',
    'battle/battle-navigation.js',
    'battle/modules/39-navigation-physicality-debug.js',
    'battle/modules/13a-tactical-controller.js',
    'battle/modules/13b-tactical-owner-adapters.js',
    'battle/modules/13c-tactical-march-provider.js',
    'battle/modules/13d-tactical-contact-skills.js',
    'battle/modules/13h-tactical-ambush-skill.js'
  ])
    loadModule(r, f, { console: quietConsole, location: r.location });
  r.BattleBallistics = r.BattleBallistics || { environmentLineBlocked: () => false };
  r.BattleCommanderAI = { policyFor: () => ({ routeArrivalRadius: 8 }) };
  const scene = { buildings: [], roads: [] },
    b = H.makeBattle(r, {
      seed: 77,
      heightAt: (x, z) => (terrain ? 1.4 * Math.exp(-Math.pow((z - 8) / 1.4, 2)) : 0)
    });
  b.scene = { metadata: { battleScenario: scene } };
  r.BattleNavigation.installScenario(scene);
  b.time = 10;
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  q.members.forEach((s, i) => {
    s.root.position.x = (i - 5) * 2;
    s.root.position.z = 0;
    s.root.position.y = b.heightAt(s.root.position.x, 0);
  });
  q.commandPhase = 'assault';
  q.state = 'advance';
  q._macroMission = { version: 1, owner: 'force-command', intent: 'capture', status: 'executing' };
  q.route = [{ x: 0, z: 80 }];
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  systems['tactical-march-provider'].onBattleStart(b);
  const w = { r, b, q, TC: r.BattleTacticalController, K: r.BattleTacticalAmbushSkill };
  if (reports) report(w);
  return w;
}
function report(w, at = w.b.time) {
  w.r.SquadAI.rememberReportedContact(w.q.members[0], w.b, {
    x: 0,
    z: 20,
    observedAt: at,
    confidence: 1,
    sourceSoldier: 999,
    source: 'heard',
    combatThreat: true
  });
}
function tick(w, facts = {}) {
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.TC.dispatch(w.b, w.q, 'squadCommand');
  w.TC.dispatch(w.b, w.q, 'fireAndMovement', facts);
}
function step(w, seconds, facts) {
  for (let t = 0; t < seconds; t += 0.15) {
    w.b.time += 0.15;
    report(w);
    if (facts) tick(w, facts);
    else {
      w.TC.dispatch(w.b, w.q, 'executeMission');
      w.r.SquadAI.updateSquad(w.q, w.b);
    }
    w.q.members.forEach(s => {
      w.r.BattleEngagement.updateSoldier(s, w.b);
      w.r.BattleMovementResolver.resolve(s, w.b);
    });
  }
}
function live(w, cap) {
  return (w.TC.summary(w.b).live || []).filter(a => !cap || a.capability === cap);
}
const phase = w => (w.K.summary(w.q) || {}).phase;

test('a crest and fresh own-faction reports put three men on masked posts through movement requests', () => {
  const w = world();
  assert.equal(w.K.on, true);
  tick(w);
  assert.equal(phase(w), 'assemble', JSON.stringify(w.K.summary(w.q)));
  const moves = live(w, 'movement.move').filter(a => w.K.summary(w.q).men.includes(String(a.actorId)));
  assert.ok(moves.length >= 3, 'ambush men are asked to move, one request each');
  assert.equal(w.TC.summary(w.b).stats.faults, 0);
});

test('without a masking crest no line is published and the march keeps the squad', () => {
  const w = world({ terrain: false });
  tick(w);
  assert.equal(phase(w), 'idle');
  assert.equal(w.K.summary(w.q).reason, 'no-masked-line');
  assert.equal(live(w, 'movement.move').length > 0, true, 'the march still asks for its slots');
});

test('no fresh report, no ambush', () => {
  const w = world({ reports: false });
  tick(w);
  assert.equal(w.K.summary(w.q).started, 0);
  assert.equal(phase(w), 'idle');
});

test('?controllerAmbush=0 restores the old behaviour', () => {
  const w = world({ flags: '&controllerAmbush=0' });
  assert.equal(w.K.on, false);
  tick(w);
  assert.ok(!w.K.summary(w.q));
  assert.ok(live(w, 'movement.move').length > 0, 'the march keeps the squad');
});

test('pressure before readiness releases every man through his owner and waits out the cooldown', () => {
  const w = world();
  tick(w);
  assert.equal(phase(w), 'assemble');
  tick(w, { underFire: 2 });
  assert.equal(phase(w), 'idle', JSON.stringify(w.TC.summary(w.b).stats.faultExamples));
  assert.equal(w.K.summary(w.q).releases.pressure, 1);
  assert.equal(w.K.summary(w.q).men.length, 0);
  tick(w);
  assert.equal(phase(w), 'idle', 'cooldown');
  assert.equal(w.TC.summary(w.b).stats.faults, 0);
});

test('a casualty ends the line and the march resumes his slot', () => {
  const w = world();
  tick(w);
  const id = w.K.summary(w.q).men[0];
  w.q.members.find(s => String(s.id) === id).dead = true;
  tick(w);
  assert.equal(phase(w), 'idle', 'the controller cancels on the roster change and the skill starts clean');
  assert.equal(live(w, 'movement.move').filter(a => String(a.actorId) === id).length, 0);
});

test('a retreat ends the line', () => {
  const w = world();
  tick(w);
  w.q.state = 'retreat';
  tick(w);
  assert.equal(phase(w), 'idle');
  assert.equal(w.K.summary(w.q).releases['retained-skill'], 1);
});

function arrive(w) {
  /* The resolver owns locomotion; a fixture stands each man on his post and lets the owners report it. */
  w.K.summary(w.q).posts.forEach(p => {
    const m = w.q.members.find(s => String(s.id) === p.id);
    const goal =
      (m._movementResolver && m._movementResolver.last && m._movementResolver.last.intentPoint) || p.point;
    m.root.position.x = goal.x;
    m.root.position.z = goal.z;
    m.moving = false;
  });
}
test('the men reach their posts and hold, then the line is ready after the minimum hold, then contact keeps it', () => {
  const w = world();
  step(w, 1);
  assert.equal(phase(w), 'assemble');
  arrive(w);
  step(w, 2);
  assert.ok(
    w.K.summary(w.q).posts.every(p => p.kind === 'hold'),
    JSON.stringify(w.K.summary(w.q))
  );
  assert.ok(live(w, 'movement.hold').length >= 3, 'each post is held through the movement owner');
  step(w, 1);
  assert.equal(phase(w), 'hold', 'not ready before the minimum hold');
  step(w, 4);
  assert.equal(phase(w), 'ready', JSON.stringify(w.K.summary(w.q)));
  w.q.inContact = true;
  tick(w);
  assert.equal(phase(w), 'contact');
  assert.equal(w.K.summary(w.q).contacts, 1);
  w.q.inContact = false;
  tick(w);
  assert.equal(phase(w), 'idle');
  assert.equal(w.K.summary(w.q).releases['contact-ended'], 1);
  assert.equal(w.TC.summary(w.b).stats.faults, 0);
});

test('a post a man never reaches is released after the preparation budget', () => {
  const w = world();
  tick(w);
  w.K.summary(w.q).posts.forEach(p => {
    const m = w.q.members.find(s => String(s.id) === p.id);
    m.root.position.x += 40; // the fixture does not walk: he stays away from his post
  });
  step(w, 13);
  assert.equal(phase(w), 'idle');
  assert.equal(w.K.summary(w.q).releases['preparation-timed-out'], 1);
});

test('a ready line with no first-hand contact stands down after the observation budget', () => {
  const w = world();
  step(w, 1);
  arrive(w);
  step(w, 7);
  assert.equal(phase(w), 'ready');
  step(w, 13);
  assert.equal(w.K.summary(w.q).releases['no-firsthand-contact'], 1);
});

test('first-hand contact before the line is ready does not keep a half-built ambush', () => {
  const w = world();
  tick(w);
  w.q.inContact = true;
  tick(w);
  assert.equal(phase(w), 'idle');
  assert.equal(w.K.summary(w.q).releases['contact-before-ready'], 1);
});

test('a possessed or incapacitated man ends the line; an active engagement plan blocks a start', () => {
  const w = world();
  tick(w);
  assert.equal(phase(w), 'assemble');
  w.q.members[3].isPlayer = true;
  tick(w);
  assert.equal(phase(w), 'idle');
  assert.equal(w.K.summary(w.q).releases['roster-or-possession'], 1);
  const v = world();
  v.q._engagementPlan = { status: 'active' };
  tick(v);
  assert.equal(phase(v), 'idle');
  assert.equal(v.K.summary(v.q).started, 0);
});

test('the covered-maneuver mover choice skips a man the ambush holds', () => {
  const w = world();
  tick(w);
  const held = w.q.members.filter(s => w.K.wants(s));
  assert.ok(held.length >= 3);
  const B = w.r.BattleTacticalCoveredManeuver;
  assert.ok(!B || !held.some(s => B.wants(s, w.b)), 'no ambush man has a bound role');
});

console.log('tactical ambush skill checks passed: ' + count);
