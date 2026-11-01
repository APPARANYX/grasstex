'use strict';
/* Reproduce the GE-4 natural handoff: seven men reach the rally; three
   arrive at their last acknowledged order while the rally remains unheard.
   Native Command Reception owns delivery; Meso releases its own regroup. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world(options = {}) {
  H.resetIds();
  const r = H.bootstrap({ search: '?tacticalController=new' + (options.reachable ? '&commandRelay=0' : '') });
  loadModule(r, 'battle/movement-resolver.js', { console: quietConsole });
  const b = H.makeBattle(r, { seed: 41 });
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 300, z: 0 } });
  q._macroMission = { version: 1 };
  q.state = 'advance';
  q.commandPhase = 'regroup';
  q.inContact = false;
  q.orderAnchor = q.rally = q.objective = { x: 0, z: 0 };
  const L = r.BattleLeases,
    C = r.BattleCommandReception;
  b.time = 10;
  L.grant(q, 'regroup', 'squad-leader', 0, Infinity, 'squad dispersed', 'cohesion', {
    anchor: { x: 0, z: 0 },
    missionVersion: 1,
    resumePhase: 'assault',
    forward: { x: -1, z: 0 }
  });
  const distant = q.members.slice(7);
  q.members.forEach((s, i) => {
    s.root.position.x = i < 7 ? i * 0.4 : 200 + i;
    s.root.position.z = i < 7 ? 0 : 80;
    s.orderDestination = { x: s.root.position.x, z: s.root.position.z };
    s._movementStopReason = options.travelling ? null : 'arrived';
    s._movementProgress = null; // This is not a physical path stall.
  });
  distant.forEach(s =>
    C.publish(q, b, 'movement', [s], {
      scope: 'soldier:' + s.id,
      action: options.action || 'regroup',
      signature: 'rally-test',
      spatial: true,
      reference: 'point',
      point: { x: 0, z: 0 },
      data: { missionVersion: 1, kind: 'regroup' }
    })
  );
  const rec = C.peek(distant[0], b, 'movement', 'soldier:' + distant[0].id);
  assert.equal(rec.unreachable, !options.reachable, 'actual owner reports delivery availability');
  return { r, b, q, L, C, distant, rec };
}
const w = world();
const before = w.distant.map(s => ({ ...s.orderDestination }));
w.r.BattleSquadStability.updateCohesion(w.b, w.q);
assert.equal(w.L.get(w.q, 'regroup'), null, 'undeliverable rally cannot hold the squad forever');
assert.equal(w.q.commandPhase, 'assault');
assert.equal(w.L.get(w.q, 'regroup-bypass').reason, 'regroup escalation: undeliverable order');
assert.deepEqual(
  w.distant.map(s => s.orderDestination),
  before,
  'unheard orders never reach soldiers'
);
assert.equal(w.C.peek(w.distant[0], w.b, 'movement', 'soldier:' + w.distant[0].id).unreachable, true);
const moving = world({ travelling: true });
moving.r.BattleSquadStability.updateCohesion(moving.b, moving.q);
assert(moving.L.get(moving.q, 'regroup'), 'finishing a prior order is still allowed');
const mixed = world();
mixed.distant[1]._movementStopReason = null;
mixed.r.BattleSquadStability.updateCohesion(mixed.b, mixed.q);
assert(mixed.L.get(mixed.q, 'regroup'), 'the whole blocked cohort must finish its prior orders');
const holding = world();
holding.distant[1].orderDestination.x += 20;
holding.r.BattleSquadStability.updateCohesion(holding.b, holding.q);
assert(holding.L.get(holding.q, 'regroup'), 'arrival at a temporary hold is not arrival at the old order');
// A released failed cohort is not retried after the ordinary cooldown. New
// movement publications may replace the receipt but do not improve delivery.
for (const s of w.distant)
  w.C.publish(w.q, w.b, 'movement', [s], {
    scope: 'soldier:' + s.id,
    action: 'controller',
    signature: 'unheard-march',
    spatial: true,
    reference: 'point',
    point: { x: -100, z: 0 },
    data: { missionVersion: 1 }
  });
for (const time of [15, 17, 30, 60]) {
  w.b.time = time;
  w.r.BattleSquadStability.updateCohesion(w.b, w.q);
  assert.equal(w.L.get(w.q, 'regroup'), null, 'unchanged delivery failure cannot restart regroup');
}
assert.deepEqual(
  w.distant.map(s => s.orderDestination),
  before
);
// Actual delivery changes invalidate the outcome; a new geometry problem may
// then open another regroup through the ordinary owner path.
w.r.SquadAI.leaderOf(w.q).root.position.x = 200;
w.r.SquadAI.leaderOf(w.q).root.position.z = 80;
for (const s of w.distant) {
  w.C.publish(w.q, w.b, 'movement', [s], {
    scope: 'soldier:' + s.id,
    action: 'controller',
    signature: 'reachable-march',
    spatial: true,
    reference: 'point',
    point: { x: -100, z: 0 },
    data: { missionVersion: 1 }
  });
}
assert.equal(w.C.peek(w.distant[0], w.b, 'movement', 'soldier:' + w.distant[0].id).unreachable, false);
w.r.BattleSquadStability.updateCohesion(w.b, w.q);
assert.equal(w.q._regroupHysteresis.deliveryBlock, null, 'real link recovery ends the terminal block');
const young = world();
young.L.get(young.q, 'regroup').since = young.b.time - 3;
young.r.BattleSquadStability.updateCohesion(young.b, young.q);
assert(young.L.get(young.q, 'regroup'), 'existing escalation age remains required');
const delayed = world({ reachable: true });
delayed.r.BattleSquadStability.updateCohesion(delayed.b, delayed.q);
assert(delayed.L.get(delayed.q, 'regroup'), 'a deliverable order still processing is not unreachable');
const stale = world();
stale.q._macroMission.version = 2;
stale.L.get(stale.q, 'regroup').data.missionVersion = 2;
stale.r.BattleSquadStability.updateCohesion(stale.b, stale.q);
assert(stale.L.get(stale.q, 'regroup'), 'an old mission receipt cannot release this regroup');
const older = world();
older.b.time = 20;
older.L.get(older.q, 'regroup').since = 11;
older.r.BattleSquadStability.updateCohesion(older.b, older.q);
assert(older.L.get(older.q, 'regroup'), 'a receipt issued before this lease is not its handoff');
const formation = world({ action: 'formation' });
formation.r.BattleSquadStability.updateCohesion(formation.b, formation.q);
assert(formation.L.get(formation.q, 'regroup'), 'an unrelated unheard command is not a regroup failure');
const blocked = world({ travelling: true });
blocked.distant[0]._movementProgress = { stuck: true, kind: 'regroup' };
blocked.r.BattleSquadStability.updateCohesion(blocked.b, blocked.q);
assert.equal(blocked.L.get(blocked.q, 'regroup'), null, 'physical-stall escalation still works');
assert.equal(blocked.L.get(blocked.q, 'regroup-bypass').reason, 'regroup escalation: stuck straggler');
console.log('REGROUP_COMMAND_HANDOFF_CHECK passed');
