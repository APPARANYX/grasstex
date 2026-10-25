/* Detached #602 contract checks. No scenario injection, combat outcome or live adapter claims. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../../battle/tactical-capability-contract');
const REPO = path.resolve(__dirname, '../..');
let checks = 0;
function check(name, fn) {
  fn();
  checks++;
  console.log('PASS ' + name);
}
function context(patch = {}) {
  return {
    battleId: 'sim-A',
    generation: 2,
    faction: 'us',
    squadId: 'us-0',
    missionVersion: 3,
    rosterRevision: 4,
    controllerEpoch: 5,
    mode: 'new',
    now: 10,
    actors: [
      { id: '1', dead: false, player: false, transportLocked: false },
      { id: '2', dead: false, player: false, transportLocked: false }
    ],
    ...patch
  };
}
function request(patch = {}) {
  const { now, actors, ...token } = context();
  return {
    ...token,
    actionId: 'bound-1',
    actorId: '1',
    capability: 'movement.move',
    params: { point: { x: 1, z: 2 } },
    ...patch
  };
}
function evidence(req, stage, at, patch = {}) {
  const { params, ...token } = req;
  const def = C.capabilities[req.capability];
  const index = ['cancelled', 'rejected'].includes(stage) ? 0 : def.stages.indexOf(stage);
  return {
    ...token,
    stage,
    owner: def.stageOwners[index],
    at,
    ...(req.capability === 'movement.move' && index > 0 ? { envelopeId: 'envelope-1' } : {}),
    ...patch
  };
}
function begin(req = request(), ctx = context()) {
  const result = C.createReceipt(req, 'accepted', 'owner-accepted', evidence(req, 'accepted', 0), ctx);
  assert.equal(result.ok, true);
  return result.receipt;
}
check('normalization detaches and freezes request without mutating owner projection', () => {
  const req = request(),
    ctx = context(),
    before = JSON.stringify([req, ctx]);
  const valid = C.validateRequest(req, ctx);
  assert.equal(valid.ok, true);
  assert.equal(JSON.stringify([req, ctx]), before);
  req.params.point.x = 999;
  assert.equal(valid.request.params.point.x, 1);
  assert(Object.isFrozen(valid.request.params.point));
  assert.throws(() => {
    valid.request.mode = 'shadow';
  }, TypeError);
  assert(Object.values(C.capabilities).every(def => def.adapter === 'missing'));
  assert.equal(Object.hasOwn(C.capabilities, 'fire.control'), false);
  assert.equal(Object.hasOwn(C.capabilities, 'cover.reserve'), false);
});
check('all identity dimensions invalidate requests and owner evidence independently', () => {
  const req = request();
  const changes = {
    battleId: 'sim-B',
    generation: 3,
    faction: 'ge',
    squadId: 'us-1',
    missionVersion: 4,
    rosterRevision: 5,
    controllerEpoch: 6,
    mode: 'legacy'
  };
  for (const [key, value] of Object.entries(changes)) {
    assert.equal(C.validateRequest(req, context({ [key]: value })).ok, false, key);
    assert.equal(
      C.createReceipt(
        req,
        'accepted',
        'owner-accepted',
        evidence(req, 'accepted', 0, { [key]: value }),
        context()
      ).ok,
      false,
      key
    );
  }
  for (const patch of [{ actionId: 'other' }, { actorId: '2' }, { capability: 'movement.hold' }])
    assert.equal(
      C.createReceipt(req, 'accepted', 'owner-accepted', evidence(req, 'accepted', 0, patch), context()).ok,
      false
    );
  // Two simultaneous simulations may share all numeric revisions and actor IDs.
  assert.equal(C.validateRequest(req, context({ battleId: 'sim-B' })).reason, 'wrong-battle');
});
check('malformed values, inherited/constructor keys and accessors fail closed', () => {
  for (const capability of ['constructor', '__proto__', 'toString', {}, null, Symbol('capability')])
    assert.equal(C.validateRequest(request({ capability }), context()).reason, 'unknown-capability');
  const inherited = Object.assign(Object.create({ intruder: true }), request());
  assert.equal(C.validateRequest(inherited, context()).ok, false);
  const accessor = request();
  Object.defineProperty(accessor, 'params', {
    get() {
      throw Error('must not run');
    }
  });
  assert.equal(C.validateRequest(accessor, context()).ok, false);
  for (const patch of [
    { constructor: {} },
    { actorId: 1 },
    { generation: NaN },
    { generation: Infinity },
    { generation: -1 },
    { missionVersion: '3' },
    { params: { point: { x: Infinity, z: 0 } } },
    { params: { point: { x: '1', z: 2 } } },
    { params: { point: { x: 1, z: 2, y: 0 } } },
    { params: { point: null } },
    { [Symbol('extra')]: 1 }
  ])
    assert.equal(C.validateRequest(request(patch), context()).ok, false);
  for (const patch of [
    { now: Infinity },
    { now: -1 },
    { generation: 2.5 },
    {
      actors: [
        { id: '1', dead: false, player: false, transportLocked: false },
        { id: '1', dead: false, player: false, transportLocked: false }
      ]
    },
    { actors: [{ id: '1', dead: false, player: false }] }
  ])
    assert.equal(C.validateRequest(request(), context(patch)).ok, false);
});
check('dead, possessed and transport-owned actors cannot receive fresh effects', () => {
  for (const [key, reason] of [
    ['dead', 'actor-dead'],
    ['player', 'player-owned'],
    ['transportLocked', 'transport-owned']
  ]) {
    const ctx = context();
    ctx.actors[0][key] = true;
    assert.equal(C.validateRequest(request(), ctx).reason, reason);
  }
  assert.equal(C.validateRequest(request({ actorId: 'outsider' }), context()).reason, 'invalid-actor');
  assert.equal(C.validateRequest(request({ mode: 'shadow' }), context()).reason, 'no-authority');
});
check('ordinary movement requires every native publication/adoption/application/result stage', () => {
  const req = request();
  let receipt = begin(req);
  assert.equal(receipt.status, 'accepted');
  assert.equal(C.validateProgress(receipt, evidence(req, 'arrived', 1), context()).ok, false);
  const stages = ['published', 'adopted', 'applied', 'resolved', 'arrived'];
  for (let i = 0; i < stages.length; i++) {
    const proof = evidence(req, stages[i], i + 1);
    const result = C.validateProgress(receipt, proof, context());
    assert.equal(result.ok, true, stages[i]);
    receipt = result.receipt;
    assert.equal(receipt.status, i === stages.length - 1 ? 'completed' : 'running');
    assert.equal(C.validateProgress(receipt, proof, context()).ok, false, 'replayed stage');
  }
  assert.equal(receipt.envelopeId, 'envelope-1');
  assert.equal(C.validateProgress(receipt, evidence(req, 'arrived', 6), context()).reason, 'terminal');
});
check('later stages reject wrong envelope, wrong source, stale time and stale action tokens', () => {
  const req = request();
  const published = C.validateProgress(begin(req), evidence(req, 'published', 2), context()).receipt;
  for (const [patch, reason] of [
    [{ envelopeId: 'other' }, 'wrong-envelope'],
    [{ owner: 'BattleMovementResolver' }, 'invalid-evidence'],
    [{ at: 1 }, 'out-of-order'],
    [{ at: 11 }, 'invalid-evidence'],
    [{ at: NaN }, 'invalid-evidence']
  ])
    assert.equal(C.validateProgress(published, evidence(req, 'adopted', 3, patch), context()).reason, reason);
  for (const [key, value] of Object.entries({
    battleId: 'sim-B',
    generation: 3,
    missionVersion: 4,
    rosterRevision: 9,
    controllerEpoch: 6,
    faction: 'ge',
    squadId: 'us-2',
    actorId: '2',
    actionId: 'bound-2',
    mode: 'shadow'
  }))
    assert.equal(
      C.validateProgress(published, evidence(req, 'adopted', 3, { [key]: value }), context()).ok,
      false,
      key
    );
  assert.equal(
    C.validateProgress(published, evidence(req, 'adopted', 3), context({ rosterRevision: 9 })).reason,
    'stale-roster'
  );
  for (const envelopeId of [null, undefined, {}, 1])
    assert.equal(
      C.validateProgress({ ...published, envelopeId }, evidence(req, 'adopted', 3), context()).reason,
      'invalid-receipt'
    );
});
check('native rejection and cancellation are explicit terminal receipts, including invalidated work', () => {
  const req = request();
  const rejected = C.createReceipt(req, 'rejected', 'blocked-route', evidence(req, 'rejected', 1), context());
  assert.equal(rejected.receipt.status, 'rejected');
  assert.equal(
    C.validateProgress(rejected.receipt, evidence(req, 'published', 2), context()).reason,
    'terminal'
  );
  const cancelled = C.createReceipt(
    req,
    'cancelled',
    'mission-superseded',
    evidence(req, 'cancelled', 3),
    context({ missionVersion: 4, mode: 'legacy' })
  );
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.receipt.request.missionVersion, 3, 'cancellation retains original identity');
  assert.equal(cancelled.receipt.status, 'cancelled');
  for (const [patch, reason] of [
    [{ battleId: 'sim-B' }, 'wrong-battle'],
    [{ faction: 'ge' }, 'wrong-squad'],
    [{ squadId: 'us-1' }, 'wrong-squad']
  ])
    assert.equal(
      C.createReceipt(req, 'cancelled', 'battle-restart', evidence(req, 'cancelled', 3), context(patch))
        .reason,
      reason
    );
  const badStatus = {
    toString() {
      throw Error('must not coerce status');
    }
  };
  assert.equal(
    C.createReceipt(req, badStatus, 'owner-accepted', evidence(req, 'accepted', 0), context()).ok,
    false
  );
  assert.equal(
    C.createReceipt(req, 'running', 'anything', evidence(req, 'accepted', 0), context()).ok,
    false
  );
  assert.equal(
    C.createReceipt(req, 'accepted', 'made-up', evidence(req, 'accepted', 0), context()).ok,
    false
  );
});
check(
  'capability parameters preserve lowering-only posture, owner mission and canonical position identities',
  () => {
    const cases = [
      ['movement.hold', '1', { point: { x: 0, z: 0 } }],
      ['posture.lower', '1', { stance: 'crouch' }],
      ['station.claim', '1', { stationId: 'station-1', threat: { x: 9, z: 2 } }],
      ['mission.accept', null, { version: 3 }],
      ['transport.consider', null, {}],
      ['transport.cancel', null, {}]
    ];
    for (const [capability, actorId, params] of cases)
      assert.equal(
        C.validateRequest(request({ capability, actorId, params }), context()).ok,
        true,
        capability
      );
    assert.equal(
      C.validateRequest(request({ capability: 'posture.lower', params: { stance: 'stand' } }), context())
        .reason,
      'invalid-parameters'
    );
    assert.equal(
      C.validateRequest(
        request({ capability: 'mission.accept', actorId: null, params: { version: 4 } }),
        context()
      ).reason,
      'invalid-parameters'
    );
    assert.equal(
      C.validateRequest(
        request({ capability: 'transport.cancel', actorId: null, params: { reason: 'arrival' } }),
        context()
      ).reason,
      'invalid-parameters'
    );
  }
);
check(
  'intent conflict projection catches squad/member and physical-slot overlap without grants or priorities',
  () => {
    const move = request();
    assert.equal(C.resourceConflicts(move, request({ actionId: 'other' })).reason, 'resource-conflict');
    assert.equal(C.resourceConflicts(move, request({ actorId: '2', actionId: 'other' })).ok, true);
    const transport = request({
      actionId: 'ride',
      capability: 'transport.consider',
      actorId: null,
      params: {}
    });
    assert(C.resourceConflicts(move, transport).conflicts.includes('locomotion'));
    assert.equal(C.resourceConflicts(move, request({ faction: 'ge', actionId: 'other' })).ok, true);
    const station = request({
      capability: 'station.claim',
      params: { stationId: 'window-1', threat: { x: 0, z: 9 } }
    });
    assert(
      C.resourceConflicts(station, { ...station, faction: 'ge', actionId: 'other' }).conflicts.includes(
        'physical-slot'
      )
    );
    assert.equal(C.resourceConflicts(move, request()).reason, 'same-request');
    assert.equal(
      C.resourceConflicts(move, request({ params: { point: { x: 9, z: 9 } } })).reason,
      'action-id-reuse'
    );
    assert.equal(C.resourceConflicts(move, request({ actorId: '2' })).reason, 'action-id-reuse');
    assert.equal(C.resourceConflicts(move, request({ battleId: 'sim-B' })).reason, 'wrong-battle');
    assert.equal(C.resourceConflicts(move, request({ generation: 9 })).reason, 'stale-generation');
    for (const [key, value, reason] of [
      ['missionVersion', 9, 'stale-mission'],
      ['rosterRevision', 9, 'stale-roster'],
      ['controllerEpoch', 9, 'stale-controller']
    ]) {
      assert.equal(C.resourceConflicts(move, request({ [key]: value })).reason, reason);
      assert.equal(
        C.resourceConflicts(move, request({ squadId: 'us-1', [key]: value })).ok,
        true,
        'different squads have independent revisions'
      );
    }
  }
);
check(
  'standalone module is absent from all production entry points and does not register runtime systems',
  () => {
    for (const file of [
      'battle_sim.php',
      'battle_sim_local.php',
      'runtime-contract.php',
      'battle/battle_sim.html',
      'tools/ai-sim-harness/harness.js'
    ])
      assert.equal(
        fs.readFileSync(path.join(REPO, file), 'utf8').includes('tactical-capability-contract'),
        false,
        file
      );
    assert.equal(fs.existsSync(path.join(REPO, 'battle/modules/tactical-capability-contract.js')), false);
    const root = {},
      source = fs.readFileSync(path.join(REPO, 'battle/tactical-capability-contract.js'), 'utf8');
    new Function('window', 'module', 'Math', source)(root, undefined, {
      random() {
        throw Error('contract must never draw RNG');
      }
    });
    assert.deepEqual(Object.keys(root), ['BattleTacticalCapabilityContract']);
    assert.equal(root.BattleTacticalCapabilityContract.validateRequest(request(), context()).ok, true);
  }
);
console.log(
  'PASS tactical capability contract: ' + checks + ' checks (detached; no gameplay adapter acceptance)'
);
