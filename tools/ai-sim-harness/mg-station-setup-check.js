#!/usr/bin/env node
/* Machine-gun setup discipline: a gunner at a firing station holds fire until his gun is set
   up. Same room-and-squad-command fixture as the window-port suite, with the gunner first. */
'use strict';
const assert = require('node:assert/strict');
const { fixture, counted, targetAt } = require('./tactical-fixture');
let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS ' + name);
}

test('a machine gunner at a firing station does not fire before his gun is set up', () => {
  const f = fixture({ composition: ['gunner', 'rifleman', 'sergeant', 'rifleman'] }),
    SA = f.r.SquadAI;
  assert.ok(SA.isMachineGun(f.s), 'fixture man is the gun');
  const c = counted(f);
  const t = f.claim();
  assert.ok(t);
  targetAt(f, 0, 40);
  let early = 0,
    setUpAt = null;
  for (let i = 0; i < 600; i++) {
    const before = c.shots;
    f.tick();
    if (f.s.setUp && setUpAt == null) setUpAt = i;
    if (c.shots > before && !f.s.setUp) early += c.shots - before;
  }
  c.restore();
  assert.ok(setUpAt != null, 'the gun does get set up');
  assert.equal(early, 0, 'no round fired while the gun was not set up');
});
console.log(checks + ' checks passed');
