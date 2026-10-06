#!/usr/bin/env node
'use strict';
/* Engagement fire/stance factory ctx + firing (battle/engagement.js fire split 2/2).
   The fire-permission layer, the stance engine, fire permission and suppression, fire-control
   targeting and observation, the bound and the fire position moved verbatim to
   modules/19b-engagement-fire-stance.js. Same reversed wiring as the cover and stress modules:
   engagement.js publishes _engagementFireStanceCtx (its closure utilities plus the constants
   its export's tuning reads - they stay there) and the _engagementFireStanceAttach sink, and
   the module calls its own factory at load time and installs the twenty-six names back. This
   file pins:

     - install: the module global exists, the factory takes exactly one ctx, every name the
       moved bodies consume reaches it defined (the 21 closure utilities and 19 constants);
     - seam: the parent's delegating closures keep the pre-split names and arities, the tuning
       export still reads the parent-side constants (same objects the ctx hands over), and a
       bad api is rejected by the attach sink without disturbing the installed one;
     - firing: through the re-attached seam a man commits a crouch (the stance lands on his
       body flags) and fire permission answers for an armed threat;
     - loud failure both ways: engagement.js without the module throws 'fire/stance system
       missing' on the first use, and the module without engagement.js throws at load. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, { log() {}, warn() {} });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const CTX_KEYS = [
  'AIM_CONE', 'AIM_SETTLE', 'ALERT_HOLD', 'ALERT_LATCH', 'BOUND_ARRIVED', 'BOUND_BACK_ALLOW',
  'BOUND_METERS', 'CONTACT_STANCE', 'COVER_FIRE', 'COVER_RANGE_UNDER_FIRE', 'COVER_STANCE',
  'GUNNER_SETUP', 'MOVE_FIRE_FRACTION', 'PRONE_HOLD', 'PRONE_ROLES', 'SA', 'STANCE_HOLD',
  'SUPPRESS_BURST', 'SUPPRESS_PAUSE', 'USEFUL_COVER', 'assault', 'bound', 'combatThreat',
  'dist', 'facingError', 'field', 'findCover', 'holdPosition', 'jitter', 'knownThreat',
  'mind', 'move', 'noteShock', 'posOf', 'root', 'shockUntil', 'squadContact', 'statScale',
  'state', 'transition'
];
const API = [
  'engagementLive', 'squadOnHeels', 'underFireNow', 'fireAuthorized', 'fireControlPreparing',
  'canCrawlTo', 'seesFrom', 'seeingStance', 'applyStance', 'commitStance', 'requestStance',
  'commitStanceRespectHold', 'holdStance', 'inCover', 'fightingStance', 'fireAllowed',
  'tryFire', 'suppress', 'firingLineClear', 'crestPrepPoint', 'fireControlObservation',
  'fireControlReady', 'prepareFireControl', 'boundForward', 'orderedBound', 'station'
];

test('the module installs the verbatim set back into engagement.js through the ctx sink', () => {
  const r = H.bootstrap({ modules: false });
  assert.equal(typeof r._engagementFireStance, 'function', 'module factory global');
  assert.equal(r._engagementFireStance.length, 1, 'factory takes exactly the ctx');
  const ctx = r._engagementFireStanceCtx();
  assert.deepEqual(Object.keys(ctx).sort(), CTX_KEYS, 'ctx carries exactly the closure utilities and constants the moved bodies consume');
  Object.keys(ctx).forEach(k => assert.notEqual(ctx[k], undefined, 'ctx.' + k + ' defined at install time'));
  const api = r._engagementFireStance(ctx);
  API.forEach(k => assert.equal(typeof api[k], 'function', 'factory returns ' + k));
  assert.equal(api.fireAllowed.length, 2, 'fireAllowed(s, battle)');
  assert.equal(api.commitStance.length, 5, 'commitStance(s, battle, stance, seconds, reason)');
  assert.equal(api.seesFrom.length, 4, 'seesFrom(pt, stance, target, battle)');
  assert.equal(api.fightingStance.length, 4, 'fightingStance(s, battle, distanceToTarget, coverValue)');
  assert.equal(api.suppress.length, 3, 'suppress(s, battle, point)');
  assert.equal(api.canCrawlTo.length, 3, 'canCrawlTo(s, battle, d)');
  assert.equal(api.crestPrepPoint.length, 3, 'crestPrepPoint(s, target, battle)');
  assert.equal(api.boundForward.length, 1, 'boundForward(s)');
  assert.equal(api.station.length, 2, 'station(s, battle)');
});
test('the parent seam keeps the pre-split names and arities and the tuning export reads the parent constants', () => {
  const r = H.bootstrap({ modules: false }),
    E = r.BattleEngagement;
  assert.equal(E.underFireNow.length, 2, 'BattleEngagement.underFireNow(s, battle)');
  assert.equal(E.fireAllowed.length, 2, 'BattleEngagement.fireAllowed(s, battle)');
  assert.equal(E.fireAuthorized.length, 2, 'BattleEngagement.fireAuthorized(s, battle)');
  assert.equal(E.fireControlReady.length, 2, 'BattleEngagement.fireControlReady(s, battle)');
  assert.equal(E.fireControlObservation.length, 2, 'BattleEngagement.fireControlObservation(s, battle)');
  assert.equal(E.firingLineClear.length, 4, 'BattleEngagement.firingLineClear(target, pt, stance, battle)');
  assert.equal(E.crestPrepPoint.length, 3, 'BattleEngagement.crestPrepPoint(s, target, battle)');
  assert.equal(E.commitStance.length, 5, 'BattleEngagement.commitStance(s, battle, stance, seconds, reason)');
  assert.equal(E.requestStance.length, 4, 'BattleEngagement.requestStance(s, battle, stance, seconds)');
  assert.equal(E.applyStance.length, 2, 'BattleEngagement.applyStance(s, stance)');
  const ctx = r._engagementFireStanceCtx();
  assert.equal(E.tuning.STANCE_HOLD, ctx.STANCE_HOLD, 'tuning.STANCE_HOLD stays a parent constant');
  assert.equal(E.tuning.COVER_STANCE, ctx.COVER_STANCE, 'tuning.COVER_STANCE stays a parent constant');
  assert.equal(E.tuning.CRAWL_FIT !== undefined && ctx.CRAWL_FIT === undefined, true, 'CRAWL_FIT stays in the parent (the module gets it through no other channel)');
  assert.equal(E.tuning.COVER_FIRE, ctx.COVER_FIRE, 'tuning.COVER_FIRE stays a parent constant');
  assert.equal(E.tuning.ALERT_LATCH, ctx.ALERT_LATCH, 'tuning.ALERT_LATCH stays a parent constant');
  assert.equal(E.tuning.COMBAT_HANDOFF_ON, ctx.COMBAT_HANDOFF_ON === undefined ? E.tuning.COMBAT_HANDOFF_ON : ctx.COMBAT_HANDOFF_ON, 'tuning.COMBAT_HANDOFF_ON stays a parent constant');
  assert.equal(r._engagementFireStanceAttach({}), false, 'the attach sink rejects an api without fireAllowed/commitStance');
  const b = H.makeBattle(r);
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 50 } });
  assert.equal(E.stateOf(q.members[0]).stance, 'stand', 'the rejected attach did not disturb the installed api');
});

test('firing: a committed crouch lands on the body and fire permission answers through the seam', () => {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 50 } }),
    s = q.members.find(m => m.role === 'rifleman'),
    E = r.BattleEngagement;
  s.target = { id: 99, dead: false, root: { position: { x: 0, y: 0, z: 30 } } };
  E.commitStance(s, b, 'crouch', 3, 'ctx-check');
  assert.equal(E.stateOf(s).stance, 'crouch', 'the committed stance went through the seam into his eng state');
  assert.equal(s.tacticalCrouch, true, 'and onto his body flags');
  E.commitStance(s, b, 'stand', 1, 'ctx-check');
  assert.equal(E.stateOf(s).stance, 'stand', 'committing stand raises him again through the seam');
  assert.equal(E.fireAllowed(s, b), false, 'an unarmed unready man does not get fire permission through the seam');
  s.reloading = false;
  s.target.root.position.z = 6;
  assert.equal(typeof E.fireControlReady(s, b), 'boolean', 'fireControlReady answers through the seam');
  assert.equal(typeof E.fireAuthorized(s, b), 'boolean', 'fireAuthorized answers through the seam');
});

test('engagement.js without the module fails loudly on the first fire or stance use', () => {
  const r = {};
  r.window = r;
  load(r, 'battle/core-runtime.js');
  load(r, 'battle/engagement.js');
  assert.ok(r.BattleEngagement, 'engagement.js alone still loads and exports');
  assert.throws(() => r.BattleEngagement.fireAllowed({ root: { position: { x: 0, z: 0 } } }, { time: 0 }), /fire\/stance system missing/, 'no silent fire-when-unready battlefield');
});

test('the module without engagement.js fails loudly at load', () => {
  const r = {};
  r.window = r;
  load(r, 'battle/core-runtime.js');
  assert.throws(() => load(r, 'battle/modules/19b-engagement-fire-stance.js'), /engagement\.js must load before/, 'the reversed install needs its parent first');
});

console.log('PASS ' + n + ' fire-stance ctx checks');

