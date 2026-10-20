'use strict';
// Real Meso/reception/resolver handoff after a carrier passes a road corner.
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');
for (const phase of ['dismounted', 'aborted', 'boarding-abort']) {
  H.resetIds();
  const r = H.bootstrap({ search: '?commandMovement=1&commandRelay=0&stressAct=0&scoutsForward=0' });
  loadModule(r, 'battle/movement-resolver.js');
  const b = H.makeBattle(r, { seed: 57 });
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 300 } });
  q.state = 'advance';
  q.commandPhase = 'approach';
  const Q = r.BattleSquadStability,
    R = r.BattleMovementResolver;
  q._macroMission = {
    version: 1,
    intent: 'screen',
    status: 'executing',
    point: { x: 0, z: 300 },
    route: [{ x: 0, z: 150 }],
    observations: { squad: { position: { x: 0, z: 0 } } }
  };
  Q.executeMission(b, q, null);
  Q.updateFireteams(q, b);
  b.time = 3;
  Q.updateFireteams(q, b);
  const oldEnvelopes = q.members.map(s => s._fireteamAdoptedEnvelope);
  // Transport body owner carried everyone forward; infantry anchor is still near spawn.
  q.members.forEach(s => {
    s.root.position.z += 200;
    R.restoreAfterTransport(s);
  });
  q._transport = {
    phase: phase === 'boarding-abort' ? 'aborted' : phase,
    missionVersion: 1,
    travelled: phase === 'boarding-abort' ? 0 : 200,
    access: phase === 'boarding-abort',
    boardedCount: phase === 'boarding-abort' ? 2 : 10,
    initialPosition: { x: 0, z: 0 },
    vehicleId: 'truck-1'
  };
  const positions = q.members.map(s => ({ x: s.root.position.x, z: s.root.position.z }));
  Q.executeMission(b, q, null);
  assert.ok(q.orderAnchor.z > 190, 'Meso anchor resumes at physical dismount, not spawn');
  assert.equal(q.routeIndex, 1, 'next ordered road segment remains authoritative');
  q.members.forEach((s, i) =>
    assert.deepEqual({ x: s.root.position.x, z: s.root.position.z }, positions[i], 'no body teleport')
  );
  const anchor = { ...q.orderAnchor };
  Q.executeMission(b, q, null);
  assert.deepEqual(q.orderAnchor, anchor, 'handoff happens once, not every command tick');
  Q.advanceSquadAnchor(q, b);
  Q.updateFireteams(q, b);
  b.time = 6;
  Q.updateFireteams(q, b);
  assert.ok(
    q.members.every((s, i) => s._fireteamAdoptedEnvelope !== oldEnvelopes[i]),
    'new local formation is personally adopted'
  );
  assert.ok(
    q.members.every(s => s.orderDestination.z > 190),
    'no stale pre-ride formation order'
  );
  const start = q.members.map(s => s.root.position.z);
  H.run(r, b, 8);
  assert.ok(
    q.members.every((s, i) => s.root.position.z > start[i] + 2),
    'all men physically advance after release'
  );
}
console.log('PASS arrival/abort rebase the Meso formation once and resume physical forward travel');
