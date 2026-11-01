#!/usr/bin/env node
'use strict';
/* Ballistic obstruction queries that throw are counted and conservatively block the ray.

   `segmentBlocked` (14-z) asks BattleObstacleField and BattleNavigation whether a round's segment is
   blocked. A throw from either used to vanish and the segment read as clear. Now an unknown obstruction
   result blocks the shot, while failures are counted by source, the last message is kept, and the console
   hears of it only on the 1st, 10th, 100th... failure.

     node tools/ai-sim-harness/ballistic-query-errors-check.js */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const repo = path.resolve(__dirname, '../..'),
  read = f => fs.readFileSync(path.join(repo, f), 'utf8');
function load(fieldThrows, navThrows, search) {
  const warns = [],
    r = { console: { log() {}, warn: (...a) => warns.push(a.join(' ')) } };
  r.window = r;
  if (search != null) r.location = { search };
  r.SquadAI = {
    applyHit: () => null,
    stanceOf: () => 'stand',
    eyeHeight: () => 1.55,
    isMachineGun: () => false
  };
  vm.createContext(r);
  vm.runInContext(read('battle/core-runtime.js'), r);
  vm.runInContext(read('battle/obstacle-field.js'), r);
  if (fieldThrows)
    r.BattleObstacleField.sightBlocker = r.BattleObstacleField.sightBlocked = () => {
      throw new Error('field broke');
    };
  r.BattleNavigation = {
    lineOfSightBlocked() {
      if (navThrows) throw new Error('nav broke');
      return false;
    }
  };
  vm.runInContext(read('battle/modules/14-z-ballistic-raycast.js'), r);
  return { r, warns };
}
const o = { x: 0, y: 1, z: 0 },
  p = { x: 50, y: 1, z: 0 },
  battle = { obstacles: [], heightAt: () => 0, time: 0 };

const clean = load(false, false);
assert.equal(clean.r.BattleBallistics.environmentLineBlocked(o, p, battle), false);
assert.equal(
  JSON.stringify(clean.r.BattleBallistics.queryErrors()),
  JSON.stringify({ obstacleField: 0, navigation: 0, last: null })
);
console.log('PASS healthy queries record no errors');

const bad = load(true, true);
for (let i = 0; i < 120; i++)
  assert.equal(
    bad.r.BattleBallistics.environmentLineBlocked(o, p, battle),
    true,
    'a thrown obstacle and navigation query must not authorize a clear ray'
  );
const q = bad.r.BattleBallistics.queryErrors();
assert.ok(q.obstacleField >= 120 && q.navigation >= 120, 'every failure is counted: ' + JSON.stringify(q));
assert.equal(q.last.message.length > 0, true);
assert.ok(bad.warns.length > 0 && bad.warns.length <= 8, 'console warnings are bounded: ' + bad.warns.length);
console.log('PASS thrown queries are counted by source and the console stays bounded: ' + JSON.stringify(q));

const nav = load(false, true);
assert.equal(
  nav.r.BattleBallistics.environmentLineBlocked(o, p, battle),
  true,
  'navigation-only query failure is blocked'
);
assert.equal(nav.r.BattleBallistics.queryErrors().navigation >= 1, true);
assert.equal(nav.r.BattleBallistics.queryErrors().obstacleField, 0);
console.log('PASS the failing source is the one named');

const field = load(true, false);
assert.equal(
  field.r.BattleBallistics.environmentLineBlocked(o, p, battle),
  true,
  'obstacle-field-only query failure is blocked'
);
assert.equal(field.r.BattleBallistics.queryErrors().navigation, 0);
console.log('PASS error policy fails closed without changing healthy rays');

const open = load(true, true, '?ballisticFailClosed=0');
assert.equal(open.r.BattleBallistics.failClosed(), false);
assert.equal(
  open.r.BattleBallistics.environmentLineBlocked(o, p, battle),
  false,
  '?ballisticFailClosed=0 restores the old read-as-clear'
);
assert.equal(open.r.BattleBallistics.queryErrors().obstacleField >= 1, true, 'the failure is still counted');
assert.match(open.warns[0], /segment read as clear/);
assert.equal(load(true, true, '?x=1').r.BattleBallistics.failClosed(), true);
assert.match(bad.warns[0], /segment blocked/);
console.log('PASS ?ballisticFailClosed=0 restores fail-open, counts still recorded, message matches policy');
