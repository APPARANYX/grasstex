#!/usr/bin/env node
'use strict';
/* Issue #418: cover can be safe but totally blind. When no covered stand slot
   can fire over a tall hedge, find a reachable position around its end rather
   than pretending the soldier can fight from the same blind spot. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');
function load(r, file) {
  const src = fs.readFileSync(path.join(H.REPO, file), 'utf8');
  new Function('window', 'globalThis', 'console', src)(r, r, { log() {}, warn() {} });
}
function scenario(flag, variant = {}) {
  H.resetIds();
  globalThis.location = { search: flag };
  let r;
  try {
    r = H.bootstrap({ modules: false, search: flag });
  } finally {
    delete globalThis.location;
  }
  const systems = {};
  r.BattleModules = {
    registerSystem(id, hooks) {
      systems[id] = hooks;
    },
    getSystem(id) {
      return systems[id];
    },
    unitsFor(b) {
      return b._roster.us.concat(b._roster.ge);
    }
  };
  load(r, 'battle/battle-navigation.js');
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/39-navigation-physicality-debug.js');
  load(r, 'battle/modules/52-survival-tactical-route.js');
  const b = H.makeBattle(r);
  const hedge = {
    id: 'tall-bocage',
    physicalId: 'tall-bocage',
    type: 'hedge',
    shape: 'obb',
    x: 0,
    z: 0,
    hx: variant.halfWidth == null ? 14 : variant.halfWidth,
    hz: 1,
    ux: 1,
    uz: 0,
    vx: 0,
    vz: 1,
    y: 0,
    height: variant.height == null ? 2 : variant.height,
    cover: 0.62
  };
  b.obstacles = [hedge];
  b.obstacles.__physicalFootprints = [hedge];
  b.obstacles.__physicalVersion = 1;
  b.scene = { metadata: { battleScenario: { buildings: [] } } };
  r.__battle__ = b;
  b._movementRoot = r;
  r.BattleNavigation.installScenario(b.scene.metadata.battleScenario);
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: -8,
    objective: { x: 0, z: 50 },
    composition: ['rifleman', 'rifleman', 'rifleman']
  });
  q.commandPhase = 'defend';
  q.state = 'engaged';
  q.inContact = true;
  const s = q.members[0];
  s.root.position.x = 0;
  s.root.position.z = variant.startZ == null ? -2.3 : variant.startZ;
  s.target = { root: { position: { x: variant.targetX == null ? 0 : variant.targetX, y: 0, z: 60 } } };
  s.eng = null;
  return { r, b, q, s, hedge, E: r.BattleEngagement };
}
const f = scenario('?coverPeek=1');
assert.equal(f.E.findCover(f.s, f.b), null, 'there is no covered slot with a shot over this tall hedge');
f.E.decide(f.s, f.b, 'no firing line');
const e = f.E.stateOf(f.s);
assert.equal(e.state, 'bound', 'blind defender must begin a bounded move to a real firing lane');
assert.ok(e.cover && e.cover.type === 'firing-lane', 'move must target a firing-lane endpoint');
assert.ok(Math.abs(e.cover.x) > 14, 'firing lane should go around a hedge end, not through its middle');
assert.ok(
  f.r.BattleNavigation.movementClear(e.cover, e.cover),
  'destination is outside solid hedge footprint'
);
const route = f.r.BattleNavigation.findPath(f.s.root.position, e.cover);
assert.ok(route && route.length, 'destination must be navigable');

const start = { x: f.s.root.position.x, z: f.s.root.position.z };
let nearest = Infinity;
for (let i = 0; i < 240; i++) {
  f.b.time += 0.15;
  f.E.updateSoldier(f.s, f.b);
  f.r.BattleMovementResolver.resolve(f.s, f.b);
  H.stepMovement(f.b, f.s, 0.15);
  nearest = Math.min(nearest, Math.hypot(f.s.root.position.x - e.cover.x, f.s.root.position.z - e.cover.z));
  if (nearest < 0.6) break;
}
assert.ok(
  nearest < 0.6,
  'shipping movement integrator must physically reach the firing lane; closest=' + nearest
);
assert.ok(
  Math.hypot(f.s.root.position.x - start.x, f.s.root.position.z - start.z) > 9,
  'soldier must actually cross useful distance, not merely accept a new brief'
);
assert.equal(
  f.r.SquadAI.hasLineOfSight(f.s, f.s.target, f.b.heightAt, f.b.obstacles),
  true,
  'reached firing lane must grant an actual soldier sightline'
);

console.log('PASS tall-hedge defender relocates to a reachable firing lane');

const offset = scenario('?coverPeek=1');
offset.s.root.position.z = -8; // hedge blocks LOS, but cover shading only extends 1.5 m
assert.equal(offset.r.BattleObstacleField.coverPotentialAt(offset.b.obstacles, 0, -8), 1);
offset.E.decide(offset.s, offset.b, 'no firing line');
assert.equal(
  offset.E.stateOf(offset.s).state,
  'bound',
  'blind hedge must trigger reposition even from outside the immediate cover band'
);
assert.equal(offset.E.stateOf(offset.s).cover.type, 'firing-lane');

const noRoute = scenario('?coverPeek=1');
noRoute.r.BattleNavigation.movementClear = () => false;
noRoute.r.BattleNavigation.findPath = () => null;
noRoute.E.decide(noRoute.s, noRoute.b, 'no firing line');
assert.notEqual(
  noRoute.E.stateOf(noRoute.s).state,
  'bound',
  'no legal navigation must not manufacture a reachable hedge-end move'
);

const underFire = scenario('?coverPeek=1');
underFire.s.suppressedUntil = underFire.b.time + 8;
underFire.E.decide(underFire.s, underFire.b, 'incoming fire');
assert.notEqual(
  underFire.E.stateOf(underFire.s).cover?.type,
  'firing-lane',
  'suppressed soldier may seek any safe shelter but must not expose himself to peek'
);


/* Purpose-built 12-case exercise matrix: the ordinary 20-seed benchmark had
   zero feature activations, so identical battle totals cannot validate this
   particular hedge encounter. Each variant must actually reach a firing line. */
const variations = [];
for (const halfWidth of [10, 12, 14])
  for (const startZ of [-2.3, -8])
    for (const targetX of [0, 2]) variations.push({ halfWidth, startZ, targetX });
const coverage = {
  total: variations.length, selected: 0, arrived: 0, regainedSight: 0,
  cases: []
};
for (const variant of variations) {
  const w = scenario('?coverPeek=1', variant),
    blocked = !w.r.SquadAI.hasLineOfSight(w.s, w.s.target, w.b.heightAt, w.b.obstacles);
  assert.ok(blocked, 'matrix requires initially obstructed sight: ' + JSON.stringify(variant));
  w.E.decide(w.s, w.b, 'hedge fire-lane benchmark');
  const choice = w.E.stateOf(w.s),
    test = { ...variant, selected: choice.cover?.type === 'firing-lane' };
  assert.ok(test.selected, 'must choose a flank in ' + JSON.stringify(variant));
  coverage.selected++;
  const chosen = { x: choice.cover.x, z: choice.cover.z };
  let nearest = Infinity;
  for (let frame = 0; frame < 280; frame++) {
    w.b.time += 0.15;
    w.E.updateSoldier(w.s, w.b);
    w.r.BattleMovementResolver.resolve(w.s, w.b);
    H.stepMovement(w.b, w.s, 0.15);
    nearest = Math.min(nearest, Math.hypot(w.s.root.position.x - chosen.x, w.s.root.position.z - chosen.z));
    if (nearest < 0.6) break;
  }
  test.arrived = nearest < 0.6;
  assert.ok(test.arrived, 'must reach firing lane in ' + JSON.stringify(variant) + ', closest=' + nearest);
  coverage.arrived++;
  test.sight = w.r.SquadAI.hasLineOfSight(w.s, w.s.target, w.b.heightAt, w.b.obstacles);
  assert.ok(test.sight, 'must regain actual fire LOS in ' + JSON.stringify(variant));
  coverage.regainedSight++;
  coverage.cases.push(test);

  const old = scenario('?coverPeek=0', variant);
  old.E.decide(old.s, old.b, 'hedge fire-lane benchmark control');
  assert.notEqual(old.E.stateOf(old.s).cover?.type, 'firing-lane',
    'legacy control must not run experimental lane selection');
}
const lowWall = scenario('?coverPeek=1', { halfWidth: 12, startZ: -2.3, height: 0.6 });
assert.ok(lowWall.r.SquadAI.hasLineOfSight(lowWall.s, lowWall.s.target, lowWall.b.heightAt, lowWall.b.obstacles),
  'short wall is not a blocked firing line');
lowWall.E.decide(lowWall.s, lowWall.b, 'low wall negative control');
assert.notEqual(lowWall.E.stateOf(lowWall.s).cover?.type, 'firing-lane',
  'actor should not flank a harmless waist-high wall');
console.log('HEDGE_PEEK_MATRIX ' + JSON.stringify(coverage));

const legacy = scenario('?coverPeek=0');
legacy.E.decide(legacy.s, legacy.b, 'no firing line');
assert.notEqual(legacy.E.stateOf(legacy.s).state, 'bound', 'legacy arm exposes old no-relocation behavior');
console.log('PASS coverPeek legacy control retains old behavior');
