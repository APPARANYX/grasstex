'use strict';
/* ?coverRelay=1: the Squad Leader bounds only on a base of fire he has heard about.
   Off: the leader reads who can fire straight from Engagement's report (as before).
   On: each man putting rounds on a point calls it (callout kind coverFire, addressed to the leader); the
   leader's report keeps only men heard inside COVER_KEEP, so a missed call, a dead or silent man, or an old
   word is no base of fire. The leader counts himself without a call. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');

function world(search) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?coa=0&slStress=0&fireteamSplit=0&scoutsForward=0&stressAct=0&callouts=1&soldierBeliefs=1' + search
  });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  load('battle/modules/09-tactical-callouts.js');
  loadSquadCommandStack((root, file) => load(file), r);
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['sergeant', 'rifleman', 'rifleman', 'rifleman', 'rifleman']
    });
  b.time = 5;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.members.forEach((s, i) => {
    s._fireteamKey = i < 3 ? 'alpha' : 'bravo';
    r.BattleEngagement.stateOf(s).state = 'engage';
  });
  q.state = 'engaged';
  q.inContact = true;
  q.commandPhase = 'assault';
  q._macroMission = { version: 1, intent: 'capture', status: 'executing', point: { x: 0, z: 50 } };
  const E = r.BattleEngagement;
  const report = {
    contactStarted: false,
    underFire: 0,
    pinned: 0,
    effective: 5,
    fireSupport: q.members.slice(),
    reacting: [],
    fled: []
  };
  E.updateSquad = () => report;
  return { r, b, q, S: r.BattleSquadStability, L: r.BattleLeases, E, C: r.BattleCallouts, report };
}
function bounds(w) {
  w.S.fireAndMovement(w.q, w.b);
  return !!w.L.holds(w.q, 'bound', w.b.time);
}

{
  const w = world('');
  assert.equal(w.C.coverRelayOn(), false);
  assert.equal(bounds(w), true, 'flag off: the leader reads the report directly and bounds');
}
{
  const w = world('&coverRelay=1');
  assert.equal(w.C.coverRelayOn(), true);
  assert.equal(bounds(w), false, 'flag on, nobody has called: no base of fire, no bound');
  assert.equal(w.q.heardEffectiveCount, 0);
}
{
  const w = world('&coverRelay=1');
  const [lead, a, b2] = w.q.members;
  assert.ok(w.C.reportCover(w.b, a, 0, 60), 'a rifleman sends a cover call');
  assert.equal(w.C.reportCover(w.b, a, 0, 60), null, 'one call per COVER_REPEAT');
  w.b.time += 0.3;
  assert.equal(Object.keys(w.C.coverHeard(w.b, w.q)).length, 0, 'saying it takes time: not heard yet');
  w.b.time += 2;
  const heard = w.C.coverHeard(w.b, w.q);
  assert.ok(heard[a.id] || w.C.telemetry(w.b).missed > 0, 'delivered, or missed deterministically');
  // The leader counts himself with no call and no delay.
  w.C.reportCover(w.b, lead, 0, 60);
  assert.ok(w.C.coverHeard(w.b, w.q)[lead.id], 'the leader knows he is firing');
  // Words expire.
  w.b.time += w.C.tuning.COVER_KEEP + 0.1;
  assert.equal(Object.keys(w.C.coverHeard(w.b, w.q)).length, 0, 'an old call is not a base of fire');
}
{
  const w = world('&coverRelay=1');
  const [lead, a, b2] = w.q.members;
  // Everyone calls; wait for delivery (calls are deterministic, retry a few cycles if one is missed).
  let ok = false;
  for (let k = 0; k < 6 && !ok; k++) {
    w.q.members.forEach(m => w.C.reportCover(w.b, m, 0, 60));
    w.b.time += 1.5;
    w.C.coverHeard(w.b, w.q);
    ok = Object.keys(w.C.coverHeard(w.b, w.q)).length >= 3;
    w.b.time += 1.2;
  }
  assert.ok(ok, 'enough of the squad is heard over a few cycles');
  w.q.members.forEach(m => w.C.reportCover(w.b, m, 0, 60));
  w.b.time += 1.5;
  assert.equal(bounds(w), true, 'heard base of fire lets the leader bound');
  assert.ok(w.q.heardEffectiveCount >= 2);
}
console.log('cover-relay-check: PASS heard base of fire gates the bound, flag off is unchanged');
