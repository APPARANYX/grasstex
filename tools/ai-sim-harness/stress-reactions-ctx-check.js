#!/usr/bin/env node
'use strict';
/* Engagement stress-reactions factory ctx + firing (battle/engagement.js stress split 1/2).
   The stress machine (reactionState/reacting/reaction, guardOnHit, entranced, noteKill,
   finishFreeze, fledPhase/fledTick/releaseFled and every break helper behind them) moved
   verbatim to modules/19a-engagement-stress-reactions.js. Same reversed wiring as the cover
   module: engagement.js publishes _engagementStressCtx (closure utilities plus the ACT /
   ACTING / ACT_TUNING / AIM_CONE / PRONE / RAGE constants, which stay there because the
   export's tuning reads them) and the _engagementStressAttach sink, and the module calls its
   own factory at load time and installs the ten names back. This file pins:

     - install: the module global exists, the factory takes exactly one ctx, every name the
       moved bodies consume reaches it defined (the 16 closure utilities and 10 constants) -
       the var-ordering class of bug a moved constant or a renamed utility would introduce;
     - seam: the parent's delegating closures keep the pre-split names and arities, the
       tuning export still reads the parent-side constants (same objects the ctx hands over),
       and a bad api is rejected by the attach sink without disturbing the installed one;
     - firing: a broken flee-tempered man under ?stressAct=flee really breaks through the
       re-attached seam (state 'flee', phase 'run', rifle left behind, report through
       BattleEngagement.fledPhase);
     - loud failure both ways: engagement.js without the module throws 'stress reactions
       missing' on the first reaction use, and the module without engagement.js throws at
       load. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
function load(r, p, search) {
  new Function('window', 'globalThis', 'console', 'BABYLON', 'location', fs.readFileSync(path.join(H.REPO, p), 'utf8') + '\n//# sourceURL=' + p)(
    r, r, { log() {}, warn() {} }, r.BABYLON, search == null ? undefined : { search });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
/* Same fixture family as fled-man-check.js: base Engagement plus the soldier-events/mind pair
   (the temper the break reads lives in module 17) and the movement resolver (flee proposes
   destinations through it). One US squad out in the field. */
function world(search) {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: search || '?stressAct=flee' });
  r.BattleSim = { start() {} };
  r.BattleModules = { registerSystem() {}, registerUnitType() {}, registerObjectiveType() {}, runHook() {}, unitsFor: b => (b._roster.us || []).concat(b._roster.ge || []) };
  load(r, 'battle/modules/08-soldier-events.js', search);
  load(r, 'battle/modules/17-soldier-mind.js', search);
  load(r, 'battle/movement-resolver.js', search);
  const b = H.makeBattle(r);
  b.scene = { metadata: {} };
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: -300, z: -500, objective: { x: -300, z: 0 } });
  q.route = [];
  q.commandRole = 'center';
  q.members.forEach(s => {
    s.root.position.z += 150;
    s.destination = { x: s.root.position.x, z: s.root.position.z };
  });
  return { r, b, q, E: r.BattleEngagement, M: r.BattleSoldierMind };
}
const HERE = { x: -300, z: -350 };
/* The squad's picture says trouble sits at HERE, kept fresh while `fn` runs; and the man's
   temper is flee with stress at the top (fled-man-check's snap). */
function press(w, s, fn) {
  const unit = w.q._threat || (w.q._threat = { id: 'fixture-threat', faction: 'ge', dead: false, root: { position: { x: HERE.x, y: 0, z: HERE.z } } });
  w.q.contact = { x: HERE.x, z: HERE.z, at: w.b.time, firstHandAt: w.b.time, seenBy: -1, unit };
  w.M.of(s).temper = { flee: 1, freeze: 0, rage: 0 };
  w.M.of(s).stress = 0.95;
  w.M.of(s).pub = 0.95;
  w.M.of(s).at = w.b.time;
  if (fn) fn();
}

test('the module installs the verbatim set back into engagement.js through the ctx sink', () => {
  const r = H.bootstrap({ modules: false });
  assert.equal(typeof r._engagementStressReactions, 'function', 'module factory global');
  assert.equal(r._engagementStressReactions.length, 1, 'factory takes exactly the ctx');
  const ctx = r._engagementStressCtx();
  assert.deepEqual(
    Object.keys(ctx).sort(),
    ['ACT', 'ACTING', 'ACT_TUNING', 'AIM_CONE', 'PRONE_HOLD', 'PRONE_ROLES', 'RAGE_GUARD_CHARGE', 'RAGE_LOCK', 'RAGE_TRANCE', 'SA', 'clamp', 'combatThreat', 'commitStance', 'dist', 'facingError', 'holdPosition', 'markUrgent', 'mind', 'move', 'posOf', 'relief', 'root', 'squadContact', 'state', 'telemetry', 'transition'],
    'ctx carries exactly the closure utilities and constants the moved bodies consume'
  );
  Object.keys(ctx).forEach(k => assert.notEqual(ctx[k], undefined, 'ctx.' + k + ' defined at install time'));
  const api = r._engagementStressReactions(ctx);
  ['reactionState', 'reacting', 'reaction', 'guardOnHit', 'entranced', 'noteKill', 'finishFreeze', 'fledPhase', 'fledTick', 'releaseFled'].forEach(k =>
    assert.equal(typeof api[k], 'function', 'factory returns ' + k)
  );
  assert.equal(api.reactionState.length, 1, 'reactionState(s)');
  assert.equal(api.reaction.length, 2, 'reaction(s, battle)');
  assert.equal(api.guardOnHit.length, 3, 'guardOnHit(victim, battle, damage)');
  assert.equal(api.noteKill.length, 1, 'noteKill(by)');
  assert.equal(api.finishFreeze.length, 3, 'finishFreeze(s, battle, why)');
  assert.equal(api.fledPhase.length, 1, 'fledPhase(s)');
  assert.equal(api.fledTick.length, 2, 'fledTick(s, battle)');
  assert.equal(api.releaseFled.length, 3, 'releaseFled(s, battle, why)');
});
test('the parent seam keeps the pre-split names and arities and the tuning export reads the parent constants', () => {
  const r = H.bootstrap({ modules: false }),
    E = r.BattleEngagement;
  assert.equal(E.reactionState.length, 1, 'BattleEngagement.reactionState(s)');
  assert.equal(E.reacting.length, 1, 'BattleEngagement.reacting(s)');
  assert.equal(E.guardOnHit.length, 3, 'BattleEngagement.guardOnHit(victim, battle, damage)');
  assert.equal(E.noteKill.length, 1, 'BattleEngagement.noteKill(by)');
  assert.equal(E.entranced.length, 1, 'BattleEngagement.entranced(s)');
  assert.equal(E.fledPhase.length, 1, 'BattleEngagement.fledPhase(s)');
  assert.equal(E.releaseFled.length, 3, 'BattleEngagement.releaseFled(s, battle, why)');
  const ctx = r._engagementStressCtx();
  assert.equal(E.tuning.ACT, ctx.ACT, 'tuning.ACT is the parent-side flag set the module consumes');
  assert.equal(E.tuning.ACT_TUNING, ctx.ACT_TUNING, 'tuning.ACT_TUNING stays a parent constant');
  assert.equal(E.tuning.RAGE_LOCK, ctx.RAGE_LOCK, 'tuning.RAGE_LOCK stays a parent constant');
  assert.equal(E.tuning.RAGE_GUARD_CHARGE, ctx.RAGE_GUARD_CHARGE, 'tuning.RAGE_GUARD_CHARGE stays a parent constant');
  assert.equal(E.tuning.RAGE_TRANCE, ctx.RAGE_TRANCE, 'tuning.RAGE_TRANCE stays a parent constant');
  assert.equal(r._engagementStressAttach({}), false, 'the attach sink rejects an api without reaction/guardOnHit');
  const f = world(),
    s = f.q.members.find(m => m.role === 'rifleman');
  assert.equal(f.E.reactionState(s), null, 'the rejected attach did not disturb the installed api');
});

test('firing: a flee-tempered man under fresh trouble breaks through the re-attached seam', () => {
  const w = world(),
    { b, q, E } = w,
    s = q.members.find(m => m.role === 'rifleman');
  H.run(w.r, b, 1); // a quiet moment first: his squad's safe point is where it stands
  assert.notEqual(s.eng.state, 'flee', 'he holds while nobody has seen trouble');
  H.run(w.r, b, 1.5, () => press(w, s)); // trouble ahead, stress at the top, flee temper
  assert.equal(s.eng.state, 'flee', 'the break went through reaction() into the flee state');
  assert.equal(s.weapon, null, 'the rifle stays where he stood');
  assert.equal(E.reactionState(s), 'flee', 'the parent seam reports the acting state');
  assert.equal(E.fledPhase(s), 'run', 'and the seam reports his flee phase');
  assert.equal(E.reacting(s), true, 'reacting() covers him for the squad report');
});

test('engagement.js without the module fails loudly on the first reaction use', () => {
  const r = {};
  r.window = r;
  load(r, 'battle/core-runtime.js');
  load(r, 'battle/engagement.js');
  assert.ok(r.BattleEngagement, 'engagement.js alone still loads and exports');
  assert.throws(
    () => r.BattleEngagement.reactionState({ root: { position: { x: 0, z: 0 } } }),
    /stress reactions missing/,
    'no silent cannot-break battlefield'
  );
});

test('the module without engagement.js fails loudly at load', () => {
  const r = {};
  r.window = r;
  load(r, 'battle/core-runtime.js');
  assert.throws(
    () => load(r, 'battle/modules/19a-engagement-stress-reactions.js'),
    /engagement\.js must load before/,
    'the reversed install needs its parent first'
  );
});

console.log('PASS ' + n + ' stress-reactions ctx checks');

