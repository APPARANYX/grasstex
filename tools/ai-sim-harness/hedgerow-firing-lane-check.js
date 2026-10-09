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
  new Function('window', 'globalThis', 'console', src)(r, r, {log(){}, warn(){}});
}
function scenario(flag) {
  H.resetIds();
  globalThis.location = {search: flag};
  let r;
  try { r = H.bootstrap({modules: false, search: flag}); }
  finally { delete globalThis.location; }
  const systems = {};
  r.BattleModules = {
    registerSystem(id, hooks) { systems[id] = hooks; },
    getSystem(id) { return systems[id]; },
    unitsFor(b) { return b._roster.us.concat(b._roster.ge); }
  };
  load(r, 'battle/battle-navigation.js');
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/39-navigation-physicality-debug.js');
  load(r, 'battle/modules/52-survival-tactical-route.js');
  const b = H.makeBattle(r);
  const hedge = {
    id: 'tall-bocage', physicalId: 'tall-bocage', type: 'hedge',
    shape: 'obb', x: 0, z: 0, hx: 14, hz: 1, ux: 1, uz: 0, vx: 0, vz: 1,
    y: 0, height: 2, cover: 0.62
  };
  b.obstacles = [hedge];
  b.obstacles.__physicalFootprints = [hedge];
  b.obstacles.__physicalVersion = 1;
  b.scene = {metadata:{battleScenario:{buildings:[]}}};
  r.__battle__ = b;
  b._movementRoot = r;
  r.BattleNavigation.installScenario(b.scene.metadata.battleScenario);
  const q = H.addSquad(r,b,{
    id:'us-0',faction:'us',x:0,z:-8,objective:{x:0,z:50},
    composition:['rifleman','rifleman','rifleman']
  });
  q.commandPhase = 'defend';
  q.state='engaged';
  q.inContact=true;
  const s=q.members[0];
  s.root.position.x=0;s.root.position.z=-8;
  s.target={root:{position:{x:0,y:0,z:60}}};
  s.eng=null;
  return {r,b,q,s,hedge,E:r.BattleEngagement};
}
const f=scenario('?coverPeek=1');
assert.equal(f.E.findCover(f.s,f.b),null,
  'there is no covered slot with a shot over this tall hedge');
console.log('HEDGE_PEEK_DIAG ' + JSON.stringify({
  soldier:f.s.root.position, target:f.s.target.root.position,
  coverHere:f.r.BattleObstacleField.coverPotentialAt(f.b.obstacles,f.s.root.position.x,f.s.root.position.z),
  hasLine:f.r.SquadAI.hasLineOfSight(f.s,f.s.target,f.b.heightAt,f.b.obstacles),
  nearSlotCount:f.r.BattleCoverPositions.snapshot(f.b).length
}));
f.E.decide(f.s,f.b,'no firing line');
const e=f.E.stateOf(f.s);
assert.equal(e.state,'bound','blind defender must begin a bounded move to a real firing lane');
assert.ok(e.cover && e.cover.type==='firing-lane','move must target a firing-lane endpoint');
assert.ok(Math.abs(e.cover.x)>14,
  'firing lane should go around a hedge end, not through its middle');
assert.ok(f.r.BattleNavigation.movementClear(e.cover,e.cover),
  'destination is outside solid hedge footprint');
const route=f.r.BattleNavigation.findPath(f.s.root.position,e.cover);
assert.ok(route && route.length,'destination must be navigable');
console.log('PASS tall-hedge defender relocates to a reachable firing lane');

const legacy=scenario('?coverPeek=0');
legacy.E.decide(legacy.s,legacy.b,'no firing line');
assert.notEqual(legacy.E.stateOf(legacy.s).state,'bound',
  'legacy arm exposes old no-relocation behavior');
console.log('PASS coverPeek legacy control retains old behavior');
