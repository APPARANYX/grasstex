'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const r = H.bootstrap({ modules: false }),
  hooks = {};
r.BattleModules = {
  registerSystem(id, h) {
    hooks[id] = h;
  }
};
loadModule(r, 'battle/modules/54-tactical-situation.js');
loadModule(r, 'battle/modules/54a-urban-operating-picture.js');
const U = r.BattleUrbanOperatingPicture,
  b = H.makeBattle(r, { seed: 12345 });
const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 0, objective: { x: 0, z: 0 } });
const building = { id: 'rotated', x: 0, z: 0, w: 4, d: 20, rot: Math.PI / 2 };
b.scene = {
  metadata: {
    battleScenario: {
      buildings: [building],
      roads: [{ id: 'street', ax: -100, az: 0, bx: 100, bz: 0, width: 10 }]
    }
  }
};
for (const s of us.members) {
  s.root.position.x = 8;
  s.root.position.z = 0;
}
b.time = 10;
us.contact = { x: 8, z: 0, at: 9, source: 'heard' };
const first = U.compute(b, 'us');
assert.equal(first.buildings[0].friendlyOccupants, 10, 'rotated half-extents match navigation schema');
assert.equal(first.buildings[0].reportedThreats, 1);
assert.equal(first.buildings[0].control, 'unknown', 'presence is not cleared room control');
assert.equal(first.buildings[0].reports[0].source, 'heard');
assert.equal(first.buildings[0].reports[0].confidence, null);
assert.equal(first.buildings[0].observationAge, 1);
assert.equal(first.streets[0].status, 'reported-contest');
assert.equal(first.streets[0].cleared, false);
assert.equal(first.sectorVisibility.length, 8);
assert.ok(first.sectorVisibility.every(s => s.source === 'terrain-los-probe'));
assert.deepEqual(U.compute(b, 'us'), first);
for (const s of ge.members) s.root.position.x = 400;
ge.contact = { x: 0, z: 0, at: 10 };
assert.deepEqual(U.compute(b, 'us'), first, 'enemy transforms and knowledge are invisible');
for (const s of us.members) s.root.position.z = 15;
assert.equal(U.compute(b, 'us').buildings[0].friendlyOccupants, 0, 'own movement updates occupancy');
us.contact = null;
assert.equal(U.compute(b, 'us').streets[0].status, 'unknown', 'no hostile report is not clearance');
const terrain = b.heightAt;
b.heightAt = (x, z) => (Math.abs(z + 15) < 3 ? 20 : 0);
assert.equal(
  U.compute(b, 'us').sectorVisibility.find(s => s.sector === 'N').clear,
  false,
  'shipping terrain LOS detects the intervening ridge'
);
b.heightAt = terrain;
const los = r.SquadAI.hasLineOfSight;
r.SquadAI.hasLineOfSight = () => false;
assert.ok(
  U.compute(b, 'us').sectorVisibility.every(s => s.clear === false),
  'authoritative blocked rays stay blocked'
);
r.SquadAI.hasLineOfSight = los;
const sys = hooks['urban-operating-picture'];
sys.onCommanderTick(b);
assert.equal(b._urbanOperatingPicture, undefined);
r.location = { search: '?urbanPicture=1' };
sys.onCommanderTick(b);
const rec = b._urbanOperatingPicture;
b.time += 0.45;
sys.onCommanderTick(b);
assert.strictEqual(b._urbanOperatingPicture, rec);
U.summary(b).urbanOperatingPicture.us.buildings[0].control = 'cleared';
assert.equal(b._urbanOperatingPicture.us.buildings[0].control, 'unknown');
sys.onBattleRestart(b);
assert.equal(U.summary(b).urbanOperatingPicture, null);
b.scene.metadata.battleScenario = { buildings: [], roads: [] };
b.time = 0;
sys.onCommanderTick(b);
assert.equal(
  b._urbanOperatingPicture.us.buildings.length,
  0,
  'new geometry replaces old world after same-object restart'
);
sys.onBattleStart(b);
assert.equal(b._urbanOperatingPicture, null);
console.log(
  'PASS UrbanOperatingPicture rotated geometry, LOS, observed-only reports, movement and lifecycle'
);
