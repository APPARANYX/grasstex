'use strict';
/* Independent one-world operation lifecycle regression. Existing tactical
   regressions remain unchanged. Do not inject contact or fire authority. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
H.resetIds();
const r = H.bootstrap({
  search:
    '?effectiveFire=0&localPlan=1&coa=0&commandMovement=0&slStress=0&scoutsForward=0&stressAct=0' +
    '&localAmbush=1&localManeuver=1&coveredBounds=1&fireManeuverOperation=1'
});
const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
load('battle/movement-resolver.js');
load('battle/battle-navigation.js');
load('battle/modules/39-navigation-physicality-debug.js');
const b = H.makeBattle(r, {
  heightAt: (x, z) => 1.4 * Math.exp(-Math.pow((z - 8) / 1.4, 2))
});
const scenario = { buildings: [], roads: [] };
b.scene = { metadata: { battleScenario: scenario } };
r.BattleNavigation.installScenario(scenario);
const sq = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
sq.members.forEach((man, i) => {
  man.root.position.x = (i - 5) * 2;
  man.root.position.z = 0;
  man.root.position.y = b.heightAt(man.root.position.x, 0);
});
r.BattleCommanderAI = {
  acceptMission(sim, squad) {
    squad._macroMission.status = 'executing';
  }
};
sq._macroMission = {
  version: 1,
  status: 'issued',
  intent: 'capture',
  action: 'assault',
  point: { x: 0, z: 100 },
  route: [{ x: 0, z: 0 }, { x: 0, z: 80 }]
};
const S = r.BattleSquadStability;
S.executeMission(b, sq, null);
sq.commandPhase = 'assault';
r.SquadAI.rememberReportedContact(sq.members[0], b, {
  x: 0,
  z: 20,
  observedAt: 0,
  confidence: 1,
  sourceSoldier: 999,
  source: 'heard',
  combatThreat: true
});
S.localPlan.update(b, sq);
const P = S.tacticalPostures;
assert.equal(P.operationOn, true);
let reporting = true;
r.SquadAI.squadContactsMap = () =>
  reporting ? [{ x: 0, z: 20, at: 0, confidence: 1, targetId: 'reported-001', source: 'told' }] : [];
const initial = P.update(b, sq);
assert.ok(initial && initial.operation && initial.operation.phase === 'stage');
let reachedReady = false;
let operationTicks = 0;
console.log('operation-lifecycle-fixture: running native ticks');
H.run(r, b, 6, () => {
  operationTicks++;
  if (operationTicks % 7 === 0)
    console.log('operation-lifecycle-fixture: tick', operationTicks, b.time, P.current(b, sq)?.stage);
  if (P.current(b, sq)?.readyAt != null) reachedReady = true;
});
console.log('operation-lifecycle-fixture: native ticks completed', operationTicks);
assert.equal(reachedReady, true, 'three real soldiers establish the entire 4-second stationary hold');
const held = P.current(b, sq);
assert.ok(held && held.operation.phase === 'observe');
const ids = held.heldActorIds.slice();
const posts = JSON.stringify(held.heldPositions);
reporting = false;
assert.ok(P.update(b, sq) === held, 'expired/lost report does not dissolve safe observation');
assert.equal(held.operation.phase, 'observe');
assert.deepEqual(held.heldActorIds, ids);
assert.equal(JSON.stringify(held.heldPositions), posts);
assert.equal(r.BattleLeases.get(sq, 'bound'), null, 'no report means no bound authorization');
assert.equal(b.events.fired, 0, 'no independent contact means no shots');
assert.ok(held.operation.transitions.some(t => t.to === 'prepare'));
assert.ok(held.operation.transitions.some(t => t.to === 'observe'));
r.BattleCoverPositions.maskedPost = () => false;
assert.equal(P.update(b, sq), null, 'exposed verified observation posts revoke the operation');
assert.equal(held.operation.phase, 'abort');
console.log('phase-c-operation-continuity-check: PASS independent hold, safe observation, abort, no fake authority');
