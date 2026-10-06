#!/usr/bin/env node
'use strict';
/* Engagement cover-positions factory ctx + firing (battle/engagement.js cover split 1/1).
   The cover subsystem (coverRegistry, buildCoverSlots, claim lifecycle, coverCandidates,
   findCover) moved verbatim to modules/19-engagement-cover-positions.js. The wiring is the
   reverse of the 15m -> 16 pattern: every module loads AFTER engagement.js in both chains, so
   engagement.js publishes _engagementCoverCtx (closure utilities + the COVER_* constants,
   which stay there) and the _engagementCoverAttach sink, and the module calls its own factory
   at load time and installs the returned functions back into the parent. This file pins:

     - install: the module global exists, the factory takes exactly one ctx, and every name the
       moved bodies consume reaches it defined (dist, posOf, field, state, SA, seesFrom and the
       five COVER_* constants) - the var-ordering class of bug a moved constant or a renamed
       utility would introduce;
     - seam: the parent's delegating closures keep the pre-split names and arities
       (findCover 3, reserveCover 4, releaseCover 3, currentCover 2, coverCandidates 4,
       coverSnapshot 1, warm 1) and BattleCoverPositions.spacing is still the 1.8 m claim
       spacing the parent exports; a bad api is rejected by the attach sink without disturbing
       the installed one;
     - firing: on a hedge fixture the re-attached seam warms slots, finds a fightable slot,
       reserves it (snapshot: reserved, then occupied once he stands in it), reports it through
       current, and frees it on release (snapshot: free);
     - loud failure both ways: engagement.js without the module throws 'cover system missing'
       on the first cover use (not a silent no-cover battlefield), and the module without
       engagement.js throws at load. */
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
/* Same fixture family as cover-positions-check.js: base Engagement (modules:false is enough -
   the cover module loads with the runtime block), navigation, one US squad in contact. */
function fixture(obstacles, physical) {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {};
  r.BattleModules = { registerSystem(id, h) { systems[id] = h; }, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  load(r, 'battle/battle-navigation.js');
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/39-navigation-physicality-debug.js');
  const b = H.makeBattle(r);
  b.obstacles = obstacles;
  b.obstacles.__physicalFootprints = physical || obstacles;
  b.obstacles.__physicalVersion = 1;
  const scenario = { buildings: [] };
  b.scene = { metadata: { battleScenario: scenario } };
  r.__battle__ = b;
  r.BattleNavigation.installScenario(scenario);
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: -8, objective: { x: 0, z: 50 }, composition: ['rifleman', 'rifleman', 'rifleman'] });
  q.commandPhase = 'support-hold';
  q.state = 'engaged';
  q.inContact = true;
  q.members.forEach((s, i) => {
    s.root.position.x = i * 2;
    s.root.position.z = -8;
    s.target = { id: 99, dead: false, root: { position: { x: 0, y: 0, z: 60 } } };
  });
  return { r, b, q, s: q.members[0], E: r.BattleEngagement, C: r.BattleCoverPositions };
}
function hedge() {
  return { id: 'hedge', physicalId: 'hedge', shape: 'obb', type: 'hedge', x: 0, z: 0, hx: 14, hz: 1, ux: 1, uz: 0, vx: 0, vz: 1, radius: 1, y: 0, height: 2, cover: 0.62 };
}

test('the module installs the verbatim set back into engagement.js through the ctx sink', () => {
  const r = H.bootstrap({ modules: false });
  assert.equal(typeof r._engagementCoverPositions, 'function', 'module factory global');
  assert.equal(r._engagementCoverPositions.length, 1, 'factory takes exactly the ctx');
  const ctx = r._engagementCoverCtx();
  assert.deepEqual(
    Object.keys(ctx).sort(),
    ['COVER_CELL', 'COVER_FIRE', 'COVER_RANGE', 'COVER_SPACING', 'SA', 'USEFUL_COVER', 'dist', 'field', 'posOf', 'root', 'seesFrom', 'state'],
    'ctx carries exactly the closure utilities and constants the moved bodies consume'
  );
  Object.keys(ctx).forEach(k => assert.notEqual(ctx[k], undefined, 'ctx.' + k + ' defined at install time'));
  const api = r._engagementCoverPositions(ctx);
  ['coverRegistry', 'buildCoverSlots', 'currentCover', 'releaseCover', 'reserveCover', 'coverCandidates', 'coverSnapshot', 'findCover', 'warm'].forEach(k =>
    assert.equal(typeof api[k], 'function', 'factory returns ' + k)
  );
  assert.equal(api.findCover.length, 3, 'findCover(s, battle, opts)');
  assert.equal(api.reserveCover.length, 4, 'reserveCover(s, battle, slot, kind)');
  assert.equal(api.releaseCover.length, 3, 'releaseCover(s, battle, kind)');
  assert.equal(api.currentCover.length, 2, 'currentCover(s, battle)');
  assert.equal(api.coverCandidates.length, 4, 'coverCandidates(s, battle, threat, maxRange)');
  assert.equal(api.coverSnapshot.length, 1, 'coverSnapshot(battle)');
  assert.equal(api.coverRegistry.length, 1, 'coverRegistry(battle)');
  assert.equal(api.buildCoverSlots.length, 1, 'buildCoverSlots(c)');
  assert.equal(api.warm.length, 1, 'warm(battle)');
});

test('the parent seam keeps the pre-split names, arities and the spacing export', () => {
  const r = H.bootstrap({ modules: false }),
    E = r.BattleEngagement,
    C = r.BattleCoverPositions;
  assert.equal(E.findCover.length, 3, 'BattleEngagement.findCover(s, battle, opts)');
  assert.equal(C.reserve.length, 4, 'BattleCoverPositions.reserve(s, battle, slot, kind)');
  assert.equal(C.release.length, 3, 'BattleCoverPositions.release(s, battle, kind)');
  assert.equal(C.current.length, 2, 'BattleCoverPositions.current(s, battle)');
  assert.equal(C.candidates.length, 4, 'BattleCoverPositions.candidates(s, battle, threat, maxRange)');
  assert.equal(C.snapshot.length, 1, 'BattleCoverPositions.snapshot(battle)');
  assert.equal(C.warm.length, 1, 'BattleCoverPositions.warm(battle)');
  assert.equal(C.spacing, 1.8, 'the claim spacing export still reads the parent constant');
  assert.equal(r._engagementCoverAttach({}), false, 'the attach sink rejects an api without findCover/reserveCover');
  const f = fixture([]),
    claim = f.C.reserve(f.s, f.b, { id: 'probe:0', x: 0, z: -6, normalX: 0, normalZ: -1 }, 'engagement');
  assert.ok(claim, 'the real installation still works after a rejected attach');
  assert.equal(f.C.current(f.s, f.b), claim, 'the rejected attach did not disturb the installed api');
});

test('firing: warm, find, reserve, occupy, release through the re-attached seam', () => {
  const f = fixture([hedge()]),
    { b, s, E, C } = f;
  const slots = C.warm(b);
  assert.ok(slots > 0, 'warm builds the slot rings (' + slots + ' slots)');
  const pick = E.findCover(s, b, { evade: true });
  assert.ok(pick && pick.slotId, 'findCover returns a fightable slot with its id');
  const claim = C.reserve(s, b, pick.slot, 'engagement');
  assert.ok(claim, 'reserve takes the slot');
  let row = C.snapshot(b).find(p => p.id === pick.slotId);
  assert.equal(row.status, 'reserved', 'the snapshot shows the claim reserved while he is away');
  assert.equal(row.soldierId, s.id, 'the claim names its soldier');
  s.root.position.x = pick.x;
  s.root.position.z = pick.z;
  row = C.snapshot(b).find(p => p.id === pick.slotId);
  assert.equal(row.status, 'occupied', 'standing in the slot the claim reads occupied');
  assert.equal(C.current(s, b), claim, 'current follows the live claim');
  C.release(s, b);
  assert.equal(C.current(s, b), null, 'release frees the claim');
  row = C.snapshot(b).find(p => p.id === pick.slotId);
  assert.equal(row.status, 'free', 'the snapshot shows the slot free again');
});

test('engagement.js without the module fails loudly on the first cover use', () => {
  const r = {};
  r.window = r;
  load(r, 'battle/core-runtime.js');
  load(r, 'battle/engagement.js');
  assert.ok(r.BattleEngagement, 'engagement.js alone still loads and exports');
  assert.throws(
    () => r.BattleEngagement.findCover({ root: { position: { x: 0, z: 0 } } }, { time: 0, obstacles: [] }, {}),
    /cover system missing/,
    'no silent no-cover battlefield'
  );
});

test('the module without engagement.js fails loudly at load', () => {
  const r = {};
  r.window = r;
  load(r, 'battle/core-runtime.js');
  assert.throws(
    () => load(r, 'battle/modules/19-engagement-cover-positions.js'),
    /engagement\.js must load before/,
    'the reversed install needs its parent first'
  );
});

console.log('PASS ' + n + ' cover-positions ctx checks');
