#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');

const root = {};
loadModule(root, 'battle/strategic-transport-core.js');
const T = root.BattleStrategicTransportCore;
const scenario = {
  profile: 'strategic',
  objectives: [
    { id: 'a', x: 0, z: 0 },
    { id: 'b', x: 1000, z: 0 }
  ],
  roads: [{ fromObjectiveId: 'a', toObjectiveId: 'b' }]
};
const points = [
  { x: 0, z: 0 },
  { x: 500, z: 0 },
  { x: 1000, z: 0 },
  { x: 1000, z: 80 }
];
const clear = () => true;
assert.equal(T.plan(scenario, points, {}).reason, 'clearance-required');
assert.equal(T.plan({ ...scenario, profile: 'tactical' }, points, { clearance: clear }).ok, false);
const plan = T.plan(scenario, points, { clearance: clear });
assert.equal(plan.ok, true);
assert.equal(plan.roadMeters, 1000);
assert.equal(plan.meters, 1080);
assert.ok(Math.abs(plan.travelSeconds - (1000 / 12 + 80 / 3.2)) < 1e-6);
assert.ok(plan.readySeconds > plan.travelSeconds + 70);
assert.equal(T.plan(scenario, points, { clearance: () => false }).reason, 'blocked');
assert.equal(
  T.plan(
    scenario,
    [
      { x: 0, z: 0 },
      { x: 1000, z: 300 }
    ],
    { clearance: clear }
  ).reason,
  'offroad-detour-too-long'
);
const first = T.step(plan, null, 10);
assert.equal(first.status, 'embarked');
assert.ok(Math.abs(first.meters - 120) < 1e-6);
assert.ok(Math.abs(first.point.x - 120) < 1e-6);
assert.equal(first.point.z, 0);
const aborted = T.step(plan, first, 100, { blocked: true });
assert.equal(aborted.status, 'aborted');
assert.equal(aborted.meters, 120);
assert.deepEqual(aborted.point, first.point);
const contact = T.step(plan, first, 100, { contact: true });
assert.equal(contact.status, 'aborted');
assert.equal(contact.reason, 'contact');
assert.equal(T.step(plan, contact, 100).status, 'aborted');
const halfway = T.step(plan, first, 74);
assert.equal(halfway.status, 'embarked');
assert.ok(halfway.point.z > 0 && halfway.point.z < 80);
const dismounted = T.step(plan, halfway, 30);
assert.equal(dismounted.status, 'dismounted');
assert.deepEqual(dismounted.point, plan.dismountPoint);
assert.ok(Math.abs(dismounted.elapsedSeconds - plan.travelSeconds) < 1e-6);
assert.equal(T.step(plan, dismounted, 50).status, 'dismounted');
assert.equal(first.meters, 120, 'a later plan step must not mutate prior snapshots');
console.log('PASS abstract transport core: road speed, ETA, nav clearance, abort, dismount');
