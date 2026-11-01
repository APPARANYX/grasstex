#!/usr/bin/env node
'use strict';
/* Retreat is a retained Squad Leader service under the tactical controller (13a handoff matrix; 16
   squadCommand, `?controllerReconstitute=0` the control). A controlled squad in retreat keeps the Squad
   Leader's retreat anchor and urgent fireteam orders, so a remnant briefed to a reconstitution rally
   walks to the rally (#339: the group converges on its assembly point) instead of each man falling back
   to his squad's home. */
const assert = require('node:assert/strict'),
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
const HOME = { x: 0, z: 0 },
  RALLY = { x: 100, z: 0 };
function world(extra) {
  H.resetIds();
  const r = H.bootstrap({ search: '?stressAct=0&commandRelay=0&tacticalController=new' + (extra || '') }),
    systems = {};
  r.BattleTacticalCapabilityContract = CONTRACT;
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  loadModule(r, 'battle/movement-resolver.js');
  loadModule(r, 'battle/modules/13a-tactical-controller.js');
  loadModule(r, 'battle/modules/13b-tactical-owner-adapters.js');
  loadModule(r, 'battle/modules/13c-tactical-march-provider.js', { location: r.location });
  loadModule(r, 'battle/modules/13d-tactical-contact-skills.js');
  const accepted = [];
  r.BattleCommanderAI = {
    policyFor: () => ({ routeArrivalRadius: 8 }),
    acceptMission(b, q) {
      accepted.push(q.id);
      q._macroMission.status = 'executing';
    }
  };
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
  q.home = Object.assign({}, HOME);
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  q.objective = { x: 0, z: 80 };
  q._macroMission = { owner: 'force-command', intent: 'capture', status: 'executing', version: 1 };
  q.route = [
    { x: 0, z: 40 },
    { x: 0, z: 80 }
  ];
  systems['tactical-march-provider'].onBattleStart(b);
  tick(r, b, q);
  /* A four-man remnant, broken off and back at base, then briefed to a reconstitution rally 100 m away. */
  q.members.slice(4).forEach(s => (s.dead = true));
  q.state = 'retreat';
  q.commandPhase = 'retreat';
  q._assembly = { phase: 'at-base', since: b.time, missionVersion: null };
  q._macroMission = {
    owner: 'force-command',
    intent: 'reconstitute',
    status: 'issued',
    version: 2,
    point: Object.assign({}, RALLY)
  };
  return { r, b, q, accepted, TC: r.BattleTacticalController };
}
function tick(r, b, q) {
  r.BattleTacticalController.dispatch(b, q, 'executeMission');
  r.SquadAI.updateSquad(q, b);
}
function goals(w) {
  return w.q.members
    .filter(s => !s.dead && !s.isPlayer)
    .map(s => {
      const g = w.r.BattleMovementResolver.resolve(s, w.b);
      return { kind: g && g.kind, point: g && g.point };
    });
}
function d(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
/* The men walk: each tick every man is put where the resolver sends him (arrival is all the anchor waits for). */
function run(w, seconds, walk) {
  for (let t = 0; t < seconds; t += 0.5) {
    w.b.time += 0.5;
    tick(w.r, w.b, w.q);
    if (walk)
      w.q.members.forEach(s => {
        const g = !s.dead && w.r.BattleMovementResolver.resolve(s, w.b);
        if (!g || !g.point) return;
        const k = Math.min(1, 2 / Math.max(1e-6, d(s.root.position, g.point)));
        s.root.position.x += (g.point.x - s.root.position.x) * k;
        s.root.position.z += (g.point.z - s.root.position.z) * k;
      });
  }
}

test('a controlled remnant briefed to a reconstitution rally is ordered to the rally, not home', () => {
  const w = world();
  assert.equal(w.TC.controls(w.b, w.q), true);
  run(w, 90, true);
  assert.equal(w.q._assembly.phase, 'to-rally');
  assert.deepEqual(w.accepted, ['us-0'], 'the Squad Leader accepted the brief once');
  const g = goals(w);
  assert.ok(g.length > 0);
  g.forEach(x => {
    assert.equal(x.kind, 'retreat');
    assert.ok(d(x.point, RALLY) < 30, 'goal ' + JSON.stringify(x.point) + ' is at the rally');
  });
  assert.ok(Object.keys(w.q._fireteamOrders || {}).length > 0, 'urgent fireteam orders carry the retreat');
  assert.equal(w.TC.summary(w.b).actions, 0, 'the provider stays stood down: no second mover');
});

test('?controllerReconstitute=0 is the control: no fireteam orders, every man falls back to home', () => {
  const w = world('&controllerReconstitute=0');
  run(w, 90, true);
  assert.equal(w.q._assembly.phase, 'to-rally');
  const g = goals(w);
  g.forEach(x => {
    assert.equal(x.kind, 'retreat');
    assert.ok(d(x.point, HOME) < 30, 'goal ' + JSON.stringify(x.point) + ' is home');
  });
});

log(n + ' controlled retreat checks passed');
