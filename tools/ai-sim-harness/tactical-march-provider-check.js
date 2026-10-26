#!/usr/bin/env node
'use strict';
/* March provider (13c, `?tacticalController=new`): the first provider on the tactical controller. It
   takes the squad, walks the brief's route legs in Meso's formation layout and holds on the last leg,
   asking only through the owner adapters; without the flag it registers nothing. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness'),
  { loadModule } = require('./module-loader');
const CONTRACT = require('../../battle/tactical-capability-contract');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  log('PASS ' + name);
}
const LEGS = [
  { x: 0, z: 40 },
  { x: 0, z: 80 }
];
function world(search) {
  H.resetIds();
  const r = H.bootstrap({ search: search || '?stressAct=0&commandRelay=0&tacticalController=new' }),
    systems = {};
  r.BattleTacticalCapabilityContract = CONTRACT;
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  loadModule(r, 'battle/movement-resolver.js');
  loadModule(r, 'battle/modules/13a-tactical-controller.js');
  loadModule(r, 'battle/modules/13b-tactical-owner-adapters.js');
  loadModule(r, 'battle/modules/13c-tactical-march-provider.js', { location: r.location });
  r.BattleCommanderAI = { policyFor: () => ({ routeArrivalRadius: 8 }) };
  const b = H.makeBattle(r, { seed: 57 });
  b.time = 10;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 80 },
    facing: 0
  });
  q.state = 'advance';
  q.commandPhase = 'approach';
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  q.objective = { x: 0, z: 80 };
  q._macroMission = { owner: 'force-command', intent: 'capture', status: 'executing', version: 1 };
  q.route = LEGS.map(p => Object.assign({}, p));
  return { r, b, q, systems, TC: r.BattleTacticalController, MP: r.BattleTacticalMarchProvider };
}
function tick(w) {
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.r.SquadAI.updateSquad(w.q, w.b);
}
function record(w, s) {
  return w.r.BattleCommandReception.peek(s, w.b, 'movement', 'soldier:' + String(s.id));
}
function alive(w) {
  return w.q.members.filter(s => !s.dead && !s.isPlayer);
}
function place(s, p) {
  s.root.position.x = p.x;
  s.root.position.z = p.z;
}
function row(w) {
  return w.MP.summary(w.b).find(x => x.squad === 'us:us-0');
}

test('without the flag the provider registers nothing and the squad stays legacy', () => {
  const w = world('?stressAct=0&commandRelay=0');
  assert.equal(w.MP.on, false);
  assert.equal(w.systems['tactical-march-provider'], undefined);
  assert.equal(w.TC.requestMode(w.b, w.q, 'new', 'march').reason, 'unknown-provider');
  assert.equal(w.TC.controls(w.b, w.q), false);
});

test('with the flag it takes every squad at battle start through the guarded switch', () => {
  const w = world();
  assert.equal(w.MP.on, true);
  w.systems['tactical-march-provider'].onBattleStart(w.b);
  assert.equal(w.TC.controls(w.b, w.q), true);
});

test('each man is asked to his Meso formation slot around the first leg, through Meso publication', () => {
  const w = world();
  w.systems['tactical-march-provider'].onBattleStart(w.b);
  tick(w);
  const slots = w.r.BattleSquadStability.formationSlots(w.q, LEGS[0], { x: 0, z: 1 });
  assert.equal(slots.length, alive(w).length, 'every living man has a slot');
  slots.forEach(({ man, point }) => {
    const r = record(w, man);
    assert.ok(
      r && /^controller:squadCommand-/.test(r.data.publishKey),
      'a controller order, not a fireteam slot'
    );
    assert.ok(Math.hypot(r.point.x - point.x, r.point.z - point.z) < 1e-6, 'at his formation slot');
  });
  const summary = row(w);
  assert.equal(summary.controlled, true);
  assert.equal(summary.leg, 0);
  assert.equal(summary.stages['move:published'], alive(w).length, 'every man’s stage is the owner’s');
  const before = alive(w).map(s => record(w, s).envelopeId);
  w.b.time += 0.2;
  tick(w);
  assert.deepEqual(
    alive(w).map(s => record(w, s).envelopeId),
    before,
    'asked once per leg: no reissue while the men process the order'
  );
});

test('the squad moves on to the next leg when its centre reaches the leg', () => {
  const w = world();
  w.systems['tactical-march-provider'].onBattleStart(w.b);
  tick(w);
  const first = alive(w).map(s => record(w, s).data.publishKey);
  alive(w).forEach(s => place(s, LEGS[0]));
  w.b.time += 0.5;
  tick(w);
  assert.equal(row(w).leg, 1);
  alive(w).forEach((s, i) =>
    assert.notEqual(record(w, s).data.publishKey, first[i], 'a new order for the new leg')
  );
  assert.equal(
    w.TC.summary(w.b).actions,
    alive(w).length,
    'the old leg’s orders were finished, not left beside the new'
  );
  assert.equal(w.TC.summary(w.b).pending, 0);
});

test('on the last leg a man who arrives holds there with a native resolver hold', () => {
  const w = world();
  w.q.route = [{ x: 0, z: 30 }];
  w.systems['tactical-march-provider'].onBattleStart(w.b);
  tick(w);
  const man = alive(w)[3],
    r = record(w, man);
  w.b.time = Math.max(...alive(w).map(s => record(w, s).adoptedAt)) + 0.01;
  tick(w);
  w.r.BattleMovementResolver.resolve(man, w.b);
  place(man, r.point);
  tick(w);
  const p = man._movementResolver.combat;
  assert.ok(p && p.owner === 'tactical-controller' && p.kind === 'hold', 'he holds at his slot');
  assert.ok(Math.hypot(p.intentPoint.x - r.point.x, p.intentPoint.z - r.point.z) < 1e-6);
  assert.equal(row(w).stages['hold:holding'] || row(w).stages['hold:accepted'] || 0, 1);
});

test('a man the owner refuses is listed as stopped with the reason, and not asked again on that leg', () => {
  const w = world();
  w.systems['tactical-march-provider'].onBattleStart(w.b);
  const man = alive(w)[2];
  man._survivalMovementKey = 'survival';
  tick(w);
  assert.equal(row(w).stopped['refused:owner-rejected'], 1);
  const requests = w.TC.summary(w.b).actions;
  w.b.time += 0.2;
  tick(w);
  assert.equal(w.TC.summary(w.b).actions, requests, 'no retry loop');
});

test('a retreating squad gets no new orders from the provider; retreat stays with its owner', () => {
  const w = world();
  w.systems['tactical-march-provider'].onBattleStart(w.b);
  w.q.state = 'retreat';
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.TC.dispatch(w.b, w.q, 'squadCommand');
  assert.equal(w.TC.summary(w.b).actions, 0);
});

test('static: the provider adds no timer, RNG draw, movement writer or squad/soldier field', () => {
  const src = fs.readFileSync(path.join(H.REPO, 'battle/modules/13c-tactical-march-provider.js'), 'utf8');
  assert.doesNotMatch(src, /setTimeout|setInterval|requestAnimationFrame|Math\.random|\.random\(/);
  assert.doesNotMatch(src, /\.destination\s*=(?!=)|proposeOrder|proposeCombat|publishPersonalMovement/);
  assert.doesNotMatch(src, /\b(sq|s|squad|soldier|man|q|m)\.[A-Za-z_$]+\s*=[^=]/);
});

log(n + ' march provider checks passed');
