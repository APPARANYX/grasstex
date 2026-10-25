'use strict';
/* ?coverStagger=1 (with ?coverRelay=1): a man in the open who is not pinned does not leave for cover unless the leader has
   heard two other men firing who are not themselves moving. Pinned men, small squads and the flag-off game are unchanged. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');

function world(search, size = 6) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?callouts=1&soldierBeliefs=1' + search });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/09-tactical-callouts.js');
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['sergeant', 'rifleman', 'rifleman', 'rifleman', 'rifleman', 'rifleman'].slice(0, size)
    });
  b.time = 5;
  const wall = {
    id: 'w',
    physicalId: 'w',
    shape: 'obb',
    type: 'wall',
    x: 0,
    z: 0,
    hx: 14,
    hz: 1,
    ux: 1,
    uz: 0,
    vx: 0,
    vz: 1,
    radius: 1,
    y: 0,
    height: 1.4,
    cover: 0.62
  };
  b.obstacles = [wall];
  b.obstacles.__physicalFootprints = b.obstacles;
  b.obstacles.__physicalVersion = 1;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.inContact = true;
  q.state = 'engaged';
  q.commandPhase = 'capture';
  const man = q.members[2];
  man.target = { id: 900, root: { position: { x: 0, y: 0, z: 60 } } };
  r.SquadAI.soldierContact = () => ({ x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' });
  r.SquadAI.squadContactsMap = () => [{ x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' }];
  return { r, b, q, man, E: r.BattleEngagement, C: r.BattleCallouts };
}
function decideNow(w) {
  w.E.resetSoldier(w.man);
  const e = w.E.stateOf(w.man);
  e.state = 'orient';
  w.E.decide(w.man, w.b, 'oriented');
  return e;
}
function heardTwo(w) {
  const others = w.q.members.filter(m => m !== w.man);
  for (let k = 0; k < 8; k++) {
    others.forEach(m => w.C.reportCover(w.b, m, 0, 60));
    w.b.time += 1.4;
    w.C.coverHeard(w.b, w.q);
    others.forEach(m => w.C.reportCover(w.b, m, 0, 60));
    if (Object.keys(w.C.coverHeard(w.b, w.q)).length >= 3) return;
    w.b.time += 1.4;
  }
  assert.fail('could not get calls delivered');
}

{
  const w = world('');
  const e = decideNow(w);
  assert.equal(e.state, 'bound', 'flag off: he goes for the cover');
}
{
  const w = world('&coverRelay=1&coverStagger=1');
  const e = decideNow(w);
  assert.equal(e.state, 'engage', 'nobody heard firing: his cover move is held, he keeps firing');
  assert.ok(/held/.test(e.moveReason || ''), 'recorded as held');
  assert.ok(w.q.staggerHolds >= 1);
}
{
  const w = world('&coverRelay=1&coverStagger=1');
  heardTwo(w);
  const e = decideNow(w);
  assert.equal(e.state, 'bound', 'two others heard firing: he may go');
}
{
  const w = world('&coverRelay=1&coverStagger=1');
  w.man.suppressedUntil = 99;
  const e = decideNow(w);
  assert.notEqual(/held/.test(e.moveReason || ''), true, 'a pinned man is never held');
}
{
  const w = world('&coverRelay=1&coverStagger=1', 3);
  const e = decideNow(w);
  assert.equal(e.state, 'bound', 'a squad under four men is not held');
}
{
  const w = world('&coverStagger=1');
  const e = decideNow(w);
  assert.equal(e.state, 'bound', 'without the relay there is nothing to wait for');
}
console.log(
  'cover-stagger-check: PASS held without a heard base of fire, released by two, pinned and small squads exempt'
);
