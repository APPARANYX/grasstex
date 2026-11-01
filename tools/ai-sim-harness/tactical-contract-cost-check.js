'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(
  path.resolve(__dirname, '../../battle/tactical-capability-contract.js'),
  'utf8'
);
const hit = 'if (known) return known;';
assert.equal(source.split(hit).length, 2, 'control disables exactly the normalized-shape lookup');
function contract(text) {
  let inspections = 0;
  const reflection = {
    ownKeys(value) {
      inspections++;
      return Reflect.ownKeys(value);
    }
  };
  const module = { exports: {} };
  new Function('module', 'Reflect', text)(module, reflection);
  return { api: module.exports, inspections: () => inspections };
}
const cached = contract(source);
const uncached = contract(source.replace(hit, '/* Control repeats shape validation. */'));
const ctx = {
  battleId: 'cost-fixture',
  generation: 1,
  faction: 'us',
  squadId: 'us-0',
  missionVersion: 2,
  rosterRevision: 3,
  controllerEpoch: 4,
  mode: 'new',
  now: 10,
  actors: [{ id: '1', dead: false, player: false, transportLocked: false }]
};
const parameters = {
  'maneuver.cover': { direction: 'forward', team: 'alpha', coverTeam: 'bravo', moverId: '1' },
  'combat.bound': { point: { x: 2, z: 3 } },
  'combat.march': {},
  'fire.control': { state: 'open', targetId: null, shooterId: null },
  'combat.contact': { drill: 'fire' },
  'movement.move': { point: { x: 2, z: 3 } },
  'movement.hold': { point: { x: 2, z: 3 } },
  'posture.lower': { stance: 'prone' },
  'station.claim': { stationId: 'post-1', threat: { x: 4, z: 5 } },
  'mission.execute': { leg: 0, phase: 'assault', point: { x: 2, z: 3 } },
  'mission.accept': { version: 2 },
  'transport.consider': {},
  'transport.cancel': {}
};
function exercise(C) {
  const { now, actors, ...token } = ctx;
  const requests = Object.entries(parameters).map(([capability, params], i) => {
    const result = C.validateRequest(
      {
        ...token,
        actionId: 'action-' + i,
        actorId: C.capabilities[capability].scope === 'actor' ? '1' : null,
        capability,
        params
      },
      ctx
    );
    assert.equal(result.ok, true, capability + ': ' + result.reason);
    return result.request;
  });
  const results = [];
  for (const left of requests) {
    for (const right of requests) results.push(C.resourceConflicts(left, right));
    // Shape reuse must never reuse an authority or actor-availability verdict.
    for (const [key, value] of Object.entries({
      battleId: 'other',
      generation: 2,
      faction: 'ge',
      squadId: 'us-1',
      missionVersion: 3,
      rosterRevision: 4,
      controllerEpoch: 5,
      mode: 'legacy'
    })) {
      const result = C.validateRequest(left, { ...ctx, [key]: value });
      assert.equal(result.ok, false, key);
      results.push(result);
    }
    if (left.actorId !== null)
      for (const key of ['dead', 'player', 'transportLocked']) {
        const result = C.validateRequest(left, { ...ctx, actors: [{ ...actors[0], [key]: true }] });
        assert.equal(result.ok, false, key);
        results.push(result);
      }
    const normalized = C.validateRequest(left, ctx);
    assert.equal(normalized.ok, true);
    assert(Object.isFrozen(normalized.request));
    assert(Object.isFrozen(normalized.request.params));
  }
  // Mutating a caller's projection, including a shallow-frozen one, is still observed.
  const external = { ...requests[5], params: { point: { x: 2, z: 3 } } };
  Object.freeze(external);
  const valid = C.validateRequest(external, ctx);
  external.params.point.x = NaN;
  assert.equal(C.validateRequest(external, ctx).reason, 'invalid-parameters');
  assert.equal(valid.request.params.point.x, 2);
  // Frozen arbitrary input is not a trusted normalized shape.
  const bad = Object.freeze({ ...requests[5], extra: true });
  assert.equal(C.validateRequest(bad, ctx).reason, 'invalid-request');
  return results;
}
assert.deepEqual(exercise(cached.api), exercise(uncached.api));
assert(cached.inspections() < uncached.inspections());
console.log(
  'TACTICAL_CONTRACT_COST_CHECK passed',
  JSON.stringify({
    capabilities: Object.keys(parameters).length,
    cachedShapeInspections: cached.inspections(),
    controlShapeInspections: uncached.inspections(),
    avoidedPercent: +((1 - cached.inspections() / uncached.inspections()) * 100).toFixed(1)
  })
);
