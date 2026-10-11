#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const r = H.bootstrap({ modules: false });
let hooks;
r.BattleModules = {
  registerSystem(name, h) {
    hooks = h;
  }
};
loadModule(r, 'battle/modules/54-tactical-situation.js');
const T = r.BattleTacticalSituation,
  b = H.makeBattle(r, { seed: 12345 });
const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 120 } });
const ge = H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 80, objective: { x: 0, z: 0 } });
b.time = 10;
us.contact = { x: 12, z: 40, at: 9, seenBy: us.members[0].id };
us._macroMission = { intent: 'reserve' };
ge.contact = { x: -200, z: -200, at: 8 };
const c = us.contact;
r.SquadAI.squadContact = () => {
  throw Error('observer must not invoke mutating contact API');
};
const first = T.compute(b, 'us');
assert.equal(first.contacts.length, 1);
assert.equal(first.contacts[0].age, 1);
assert.equal(first.contacts[0].confidence, null, 'unknown confidence is not fabricated');
assert.equal(first.availableReserves, 1);
assert.deepEqual(T.compute(b, 'us'), first);
assert.strictEqual(us.contact, c);
for (const s of ge.members) s.root.position.x += 400;
ge.contact.x = 1000;
assert.deepEqual(T.compute(b, 'us'), first, 'opposing truth and reports cannot affect own picture');
assert.equal(T.compute(b, 'ge').contacts[0].x, 1000);
hooks.onCommanderTick(b);
assert.equal(b._tacticalSituation, undefined, 'default collector does no work');
r.location = { search: '?tacticalSituation=1' };
hooks.onCommanderTick(b);
const stored = b._tacticalSituation;
b.time += 0.45;
hooks.onCommanderTick(b);
assert.strictEqual(b._tacticalSituation, stored, 'bounded sim-time collection');
const copy = T.summary(b);
copy.tacticalSituation.us.contacts[0].x = 999;
assert.equal(b._tacticalSituation.us.contacts[0].x, 12, 'export cannot mutate observer state');
hooks.onBattleRestart(b);
assert.equal(T.summary(b).tacticalSituation, null);
us.contact = null;
ge.contact = null;
b.time = 0;
hooks.onCommanderTick(b);
assert.equal(b._tacticalSituation.us.contactCount, 0, 'same-object restart has no stale contact');
hooks.onBattleStart(b);
assert.equal(b._tacticalSituation, null);
b.time = 40;
us.contact = c;
assert.equal(T.compute(b, 'us').contactCount, 0);
assert.strictEqual(us.contact, c, 'expired report is ignored without clearing gameplay state');

b.time = 10;
us.members[0]._beliefs = {
  byKey: {
    reported: {
      x: 20,
      z: 40,
      observedAt: 8,
      expiresAt: 20,
      baseConfidence: 0.6,
      source: 'told',
      targetId: 'reported-target',
      combatThreat: true
    }
  }
};
const belief = T.compute(b, 'us').contacts[0];
assert.equal(belief.source, 'told');
assert.equal(belief.provenance, 'member-belief');
assert.equal(belief.targetId, 'reported-target');
assert.equal(belief.sourceSoldier, us.members[0].id);
assert.ok(belief.confidence > 0 && belief.confidence < 0.6);
function stateJSON(value) {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return '[cycle]';
      seen.add(v);
    }
    return v;
  });
}
const owned = stateJSON(us);
T.compute(b, 'us');
assert.equal(stateJSON(us), owned, 'observer leaves all own squad/soldier state unchanged');
b._objectives = [{ id: 'public-zone', def: { x: 20, z: 40, radius: 30 } }];
b.objectiveControl = { sectors: { 'public-zone': { owner: 'neutral', us: 3, ge: 99, contested: true } } };
const pressure = T.compute(b, 'us').objectivePressure;
assert.equal(pressure[0].reportedThreats, 1);
b.objectiveControl.sectors['public-zone'].ge = 0;
assert.deepEqual(
  T.compute(b, 'us').objectivePressure,
  pressure,
  'hidden capture-zone weights do not become intelligence'
);

console.log('PASS TacticalSituation stable read-only reports, faction isolation, cadence and restart');
