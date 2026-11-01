#!/usr/bin/env node
'use strict';
/* Men start on their fireteam slots (16-squad-plan-stability.js `placeAtSlots`, AGENTS.md open issue
   "Personal-space corrections"). Spawn used to scatter them up to 4 m round the lane point with no
   regard for their team, and about half of all cross-team body crossings came in the first minute.
   - Before its first brief a squad's objective is its own home, so its axis collapses: the squad
     faces the scenario centre instead, and its fireteams stand apart instead of on one point.
   - The first order the Squad Leader publishes is the ground each man already stands on.
   - A defending garrison is left to module 21, which places it on its prepared posts. */
const assert = require('node:assert/strict'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function setup() {
  H.resetIds();
  const r = H.bootstrap({search:'?commandMovement=0&commandRelay=0'}),
    b = H.makeBattle(r);
  b.scene = { metadata: { battleScenario: { center: { x: 300, z: 0 } } } };
  /* At spawn the objective is the squad's home until Force Command's first brief. */
  const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: -400, objective: { x: 0, z: -400 } }),
    ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 400, objective: { x: 0, z: 400 } });
  return { r, b, us, ge, S: r.BattleSquadStability };
}
const at = s => ({ x: s.root.position.x, z: s.root.position.z });
const d = (a, c) => Math.hypot(a.x - c.x, a.z - c.z);

test('a squad with no brief yet faces the battle and its fireteams stand apart', () => {
  const { b, us, S } = setup();
  S.placeAtSlots(b, us);
  const f = us._formationForward,
    want = { x: 300 / Math.hypot(300, 400), z: 400 / Math.hypot(300, 400) };
  assert.ok(f && Math.abs(f.x - want.x) < 1e-9 && Math.abs(f.z - want.z) < 1e-9, 'faces the scenario centre');
  const teams = {};
  us.members.forEach(s => {
    const k = S.teamKeyFor(s);
    (teams[k] = teams[k] || []).push(at(s));
  });
  const centre = m => ({
      x: m.reduce((a, p) => a + p.x, 0) / m.length,
      z: m.reduce((a, p) => a + p.z, 0) / m.length
    }),
    keys = Object.keys(teams);
  assert.equal(keys.length, 4);
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const g = d(centre(teams[keys[i]]), centre(teams[keys[j]]));
      assert.ok(g >= 5, keys[i] + '/' + keys[j] + ' only ' + g.toFixed(1) + ' m apart');
    }
  let min = Infinity;
  for (let i = 0; i < us.members.length; i++)
    for (let j = i + 1; j < us.members.length; j++)
      min = Math.min(min, d(at(us.members[i]), at(us.members[j])));
  assert.ok(min >= 1.2, 'no two men start within arm reach: closest ' + min.toFixed(2) + ' m');
});

test("the Squad Leader's first order is the ground each man already stands on", () => {
  const { r, b, us, S } = setup();
  S.placeAtSlots(b, us);
  r.SquadAI.updateSquad(us, b);
  let worst = 0;
  us.members.forEach(s => {
    assert.ok(s._fireteamDestination, 'man ' + s.id + ' has a fireteam order');
    worst = Math.max(worst, d(s._fireteamDestination, at(s)));
  });
  assert.ok(worst <= 1, 'furthest first order ' + worst.toFixed(2) + ' m from where he stands');
});

test("a defending garrison is module 21's to place", () => {
  const { r, b, us, ge, S } = setup();
  r.BattleDefenseWorks = { garrisons: (sim, sq) => sq.faction === 'ge' };
  const before = ge.members.map(at);
  S.placeAtSlots(b, ge);
  S.placeAtSlots(b, us);
  assert.deepEqual(ge.members.map(at), before, 'the defenders stay where spawn put them');
  assert.equal(ge._formationForward, undefined);
  assert.ok(us._formationForward, 'the attackers are still placed');
});

console.log(n + ' spawn slot checks passed');
