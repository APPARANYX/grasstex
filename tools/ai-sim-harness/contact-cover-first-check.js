'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world({ legacy = false, cover = true, reported = false } = {}) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: '?stressAct=0' + (legacy ? '&contactCoverFirst=0' : '') });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  for (const f of [
    'battle/battle-navigation.js',
    'battle/movement-resolver.js',
    'battle/modules/39-navigation-physicality-debug.js'
  ])
    loadModule(r, f, { console: quietConsole, location: r.location });
  const b = H.makeBattle(r);
  b.time = 5;
  const scenario = { buildings: [] };
  b.scene = { metadata: { battleScenario: scenario } };
  r.__battle__ = b;
  r.BattleNavigation.installScenario(scenario);
  b.obstacles = cover
    ? [
        {
          id: 'contact-wall',
          physicalId: 'contact-wall',
          shape: 'obb',
          type: 'wall',
          x: 0,
          z: 0,
          hx: 6,
          hz: 0.5,
          ux: 1,
          uz: 0,
          vx: 0,
          vz: 1,
          radius: 1,
          y: 0,
          height: 1.1,
          cover: 0.5
        }
      ]
    : [];
  b.obstacles.__physicalFootprints = b.obstacles;
  b.obstacles.__physicalVersion = 1;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: -10,
    objective: { x: 0, z: 50 },
    composition: ['rifleman']
  });
  const enemy = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 60,
    objective: { x: 0, z: -50 },
    composition: ['rifleman']
  }).members[0];
  const s = q.members[0];
  s.root.position.set(0, 0, -10);
  s.root.rotation.y = Math.PI / 2;
  enemy.root.position.set(0, 0, 60);
  enemy.isPlayer = true;
  enemy.hp = 100000;
  s.target = reported ? null : enemy;
  q.fireControl = { state: 'hold' };
  const contact = { x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' };
  r.SquadAI.soldierContact = () => (reported ? contact : null);
  return { r, b, q, s, enemy, contact, E: r.BattleEngagement };
}
const w = world();
const { r, b, q, s, E } = w;
const observer = require('../../scripts/lib/benchmark-contact-cover.cjs').create(r, b);
const fire = b.onFire;
b.onFire = function (man) {
  observer.shot(man);
  return fire.apply(this, arguments);
};
E.updateSoldier(s, b);
assert.equal(
  E.stateOf(s).state,
  'bound',
  'first contact seeks physical cover before HOLD preparation/orientation'
);
assert.equal(E.stateOf(s).moveReason, 'contact cover first');
observer.sample();
assert.ok(E.stateOf(s).cover.slotId, 'real reserved physical cover');
assert.equal(E.fireAllowed(s, b), false, 'no direct fire during contact ingress');
let arrived = false;
for (let i = 0; i < 100; i++) {
  b.time += 0.15;
  E.updateSoldier(s, b);
  r.BattleMovementResolver.resolve(s, b);
  H.stepMovement(b, s, 0.15);
  observer.sample();
  assert.equal(b.events.fired, 0, 'HOLD never becomes a trigger pull during cover ingress');
  if (E.stateOf(s).state === 'orient') {
    arrived = true;
    break;
  }
}
assert.ok(arrived, 'actual movement finishes before orientation');
assert.ok(s.root.position.z > -9, 'physical progress');
assert.ok(
  Math.hypot(s.root.position.x - E.stateOf(s).cover.x, s.root.position.z - E.stateOf(s).cover.z) < 0.45
);
q.fireControl = { state: 'open' };
for (let i = 0; i < 35; i++) {
  b.time += 0.15;
  E.updateSoldier(s, b);
  r.BattleMovementResolver.resolve(s, b);
  H.stepMovement(b, s, 0.15);
  observer.sample();
}
assert.ok(b.events.fired > 0, 'native aiming and actual fire resume after cover arrival');
const shared = world({ reported: true });
shared.E.updateSoldier(shared.s, shared.b);
assert.equal(shared.E.stateOf(shared.s).state, 'bound', 'delivered personal contact also seeks cover');
const stale = world({ reported: true });
stale.contact.at = -100;
stale.E.updateSoldier(stale.s, stale.b);
assert.notEqual(stale.E.stateOf(stale.s).state, 'bound', 'stale report cannot start contact ingress');
const old = world({ legacy: true });
old.E.updateSoldier(old.s, old.b);
assert.notEqual(old.E.stateOf(old.s).state, 'bound', 'legacy control retains HOLD preparation');
const bare = world({ cover: false });
bare.E.updateSoldier(bare.s, bare.b);
assert.notEqual(bare.E.stateOf(bare.s).state, 'bound', 'no invented cover or exposed rush');
const retreat = world();
retreat.q.state = 'retreat';
retreat.E.updateSoldier(retreat.s, retreat.b);
assert.equal(retreat.E.stateOf(retreat.s).state, 'withdraw', 'retreat retains priority');
console.log(
  'PASS contact cover first: native physical arrival -> orientation -> actual fire; HOLD, reported contact, stale report, no-cover, legacy and retreat gates'
);

assert.equal(observer.snapshot().arrived, 1);
assert.equal(observer.snapshot().orientedAfterArrival, 1);
assert.equal(observer.snapshot().shotsBeforeArrival, 0);
console.log('CONTACT_COVER_CAUSAL', JSON.stringify(observer.snapshot()));

// No physical cover: every role goes low and can become genuine support.
for (const role of ['rifleman', 'gunner', 'sergeant', 'scout', 'engineer']) {
  const x = world({ cover: false });
  x.s.role = role;
  x.q.fireControl = { state: 'open' };
  x.E.updateSoldier(x.s, x.b);
  assert.equal(x.E.stateOf(x.s).stance, 'prone', role + ' goes prone before orienting in open ground');
}
const proneSupport = world({ cover: false });
proneSupport.q.fireControl = { state: 'open' };
proneSupport.s.root.rotation.y = 0;
for (let i = 0; i < 35; i++) {
  proneSupport.b.time += 0.15;
  proneSupport.E.updateSoldier(proneSupport.s, proneSupport.b);
  proneSupport.r.BattleMovementResolver.resolve(proneSupport.s, proneSupport.b);
  H.stepMovement(proneSupport.b, proneSupport.s, 0.15);
}
assert.equal(proneSupport.E.stateOf(proneSupport.s).stance, 'prone');
assert.ok(proneSupport.b.events.fired > 0, 'prone in open ground produces actual support shots');
assert.equal(
  proneSupport.E.supportReady(proneSupport.s, proneSupport.b),
  true,
  'prone shooting capability is native support'
);
assert.ok(
  proneSupport.r.SquadAI.shotReceipt(proneSupport.s, proneSupport.b),
  'own discharge receipt verifies prone fire'
);
assert.ok(
  proneSupport.E.updateSquad(proneSupport.q, proneSupport.b).fireSupport.includes(proneSupport.s),
  'native Meso report includes the prone shooter'
);
proneSupport.s.reloading = true;
assert.equal(
  proneSupport.E.supportReady(proneSupport.s, proneSupport.b),
  false,
  'prone posture alone is not support'
);
console.log('PASS no-cover prone fallback for all roles and independently verified native support');

// An exposed contact must not refresh its initial prone lease every alert tick.
const searching = world({ cover: false });
searching.q.fireControl = { state: 'open' };
searching.E.updateSoldier(searching.s, searching.b);
const proneUntil = searching.s.eng.stanceUntil;
searching.s.target = null;
searching.s.eng.state = 'alert';
searching.s.eng.until = searching.b.time + 5;
searching.b.time += 0.15;
searching.E.updateSoldier(searching.s, searching.b);
assert.equal(searching.s.eng.stanceUntil, proneUntil, 'alert does not perpetually renew initial prone commitment');
