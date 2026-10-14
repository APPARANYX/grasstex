'use strict';
/* Deterministic joint soldier posture/gait policy checks.
 * These invoke the real native Individuality module. Neither General nor
 * Squad Leader may write stance, speed or movement from these probes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let shelter = 1;
let standRouteSafe = false;
let lastStance = null;
const root = {
  GTLog() {},
  GTMath: { clamp: (v, low, high) => Math.max(low, Math.min(high, v)) },
  BattleModules: {
    unitsFor(battle) { return battle.units; },
    registerSystem(id, sys) { this.system = sys; }
  },
  BattleSoldierModel: { animateWalk() {} },
  BattleEngagement: {
    commitStance(s, battle, stance, duration, reason) {
      lastStance = { stance, reason, duration };
      s.eng.stance = stance;
      s.prone = stance === 'prone' || stance === 'crawl';
      s.crawling = stance === 'crawl';
      s.tacticalCrouch = stance === 'crouch';
    }
  },
  BattleObstacleField: { coverPotentialAt() { return shelter; } },
  BattleNavigation: { movementClear() { return true; } },
  BattleCoverPositions: {
    boundThreats() { return [{ x: 20, z: 10, confidence: 1, at: 0 }]; },
    boundRoute(s, battle, p, reports, stance) {
      assert.equal(stance, 'stand');
      return { eligible: standRouteSafe };
    }
  },
  BattleSquadStability: {
    tacticalPostures: { soldierOrder(s) { return s._masked ? { point: s.destination } : null; } }
  },
  PhaseCCombatLab: { movementPace: 'autonomous' }
};
vm.runInNewContext(fs.readFileSync('battle/modules/11-soldier-individuality.js', 'utf8'),
  { window: root, Math, console });
const body = root.BattleSoldierIndividuality;
assert.ok(body && body.transitPlan && body.applyTransit && body.desiredGait);
const battle = { time: 9, obstacles: [], units: [] };
function soldier(kind = 'formation', distance = 12, extra = {}) {
  return Object.assign({
    dead: false, isPlayer: false, id: 8, faction: 'us', role: 'rifleman',
    root: { position: { x: 0, z: 0 } }, destination: { x: distance, z: 0 },
    _movementResolver: { goal: { kind } },
    squad: { inContact: true, commandPhase: 'defend' },
    eng: { state: kind === 'cover-bound' ? 'bound' :
      kind === 'assault-rush' ? 'assault' : kind === 'firing-station' ? 'station' : 'advance' },
    prone: false, tacticalCrouch: false, crawling: false,
    suppressedUntil: 0, moving: true, woundSpeed: 1
  }, extra);
}
function choose(s, kind, distance) {
  return body.transitPlan(s, battle, { kind, urgent: false }, { x: distance, z: 0 });
}
const open = soldier();
assert.equal(body.desiredGait(open, battle), 'walk',
  'the old defensive-phase rule actually walks on open contact');
let plan = choose(open, 'formation', 12);
assert.equal(plan.stance, 'stand');
assert.equal(plan.gait, 'run', 'open contact uses real run pace');
assert.match(plan.reason, /contact/);
assert.equal(body.applyTransit(open, battle, { kind: 'formation' }, { x: 12, z: 0 }).gait, 'run');
assert.match(lastStance.reason, /^body-autonomy:/);
assert.equal(body.desiredGait(open, battle), 'run');
root.BattleModules.system.onBattleStart({ time: 9, units: [open], obstacles: [] });
assert.ok(open._locomotionGroundSpeed >= 3.5 && open._locomotionGroundSpeed <= 4.5,
  'contact floor must reach real run ground speed');
assert.equal(open.speed, open._locomotionGroundSpeed);
shelter = 0.6;
const behind = soldier();
plan = choose(behind, 'formation', 12);
assert.equal(plan.stance, 'crouch', 'actual cover reduces silhouette');
assert.equal(plan.gait, 'crouchRun', 'covered contact is brisk, never a casual walk');
body.applyTransit(behind, battle, { kind: 'formation' }, { x: 12, z: 0 });
assert.equal(body.desiredGait(behind, battle), 'crouchRun');
root.BattleModules.system.onSimulationStep({ time: 9, units: [behind] });
assert.ok(behind._locomotionGroundSpeed >= 2.5 && behind._locomotionGroundSpeed <= 3.5);
assert.ok(Math.abs(behind.speed * 0.58 - behind._locomotionGroundSpeed) < 0.01);
shelter = 1;
const blockedEngage = soldier('formation', 12, {
  eng: { state: 'engage' }, target: { id: 'ge-0' }
});
assert.equal(choose(blockedEngage, 'formation', 12).gait, 'run',
  'when firing-line movement wins, an observing soldier must not walk');
const followingContact = soldier('formation', 12, { eng: { state: 'alert' } });
assert.equal(choose(followingContact, 'formation', 12).gait, 'run',
  'an alert soldier following a legitimate order remains brisk');
const personallyContacted = soldier('formation', 12, {
  squad: { inContact: false, commandPhase: 'defend' },
  target: { id: 'ge-personal' }
});
assert.equal(choose(personallyContacted, 'formation', 12).gait, 'run',
  'personal contact must not wait for the Squad Leader contact tick');
const ambush = soldier('formation', 10, { _masked: true });
plan = choose(ambush, 'formation', 10);
assert.equal(plan.gait, 'crouchWalk', 'masked ambush ingress is exempt from contact speed floor');
assert.equal(plan.stance, 'crouch');
const crest = soldier('contact-reaction', 4);
assert.equal(choose(crest, 'contact-reaction', 4), null,
  'fire-control crest micro-positioning is outside the floor');
const final = soldier('formation', 1.2);
assert.equal(choose(final, 'formation', 1.2), null,
  'last 1.5m of arrival may settle carefully');
const station = soldier('firing-station', 8);
assert.equal(choose(station, 'firing-station', 8).gait, 'crouchRun');
assert.equal(choose(soldier('firing-station', 1), 'firing-station', 1), null);
const pinned = soldier('formation', 10, { eng: { state: 'pinned' }, prone: true });
assert.equal(choose(pinned, 'formation', 10), null, 'a pinned body cannot be marched by the speed floor');
const loading = soldier('formation', 10, { reloading: true });
assert.equal(choose(loading, 'formation', 10), null, 'reload hold survives urgency');
const suppressed = soldier('formation', 10, { suppressedUntil: 20 });
assert.equal(choose(suppressed, 'formation', 10), null,
  'suppressed uncommitted formation does not get a free stand-up authorization');
const urgent = soldier('formation', 10, { suppressedUntil: 20, _combatUrgentUntil: 11 });
assert.equal(choose(urgent, 'formation', 10).gait, 'crouchRun',
  'survival urgency favors low rapid transit over walking');
const bound = soldier('cover-bound', 12, { eng: { state: 'bound', moveReason: 'oriented: moving to cover' } });
plan = choose(bound, 'cover-bound', 12);
assert.equal(plan.gait, 'sprint', 'real committed Micro cover dash can sprint');
assert.equal(plan.stance, 'stand');
const ordered = soldier('cover-bound', 10, {
  eng: { state: 'bound', moveReason: 'authorized fireteam bound: cover' }
});
plan = choose(ordered, 'cover-bound', 10);
assert.equal(plan.gait, 'crouchRun', 'crouch-certified Meso bound is not automatically safe standing');
standRouteSafe = true;
assert.equal(choose(ordered, 'cover-bound', 10).gait, 'sprint',
  'independent stand-height terrain check grants faster gait on safe Meso bound');
const crawl = soldier('cover-bound', 3, {
  eng: { state: 'bound' }, prone: true, crawling: true, suppressedUntil: 20
});
assert.equal(choose(crawl, 'cover-bound', 3).gait, 'proneFast',
  'a viable committed suppression crawl remains a personal survival choice');
assert.equal(choose(soldier('hold', 10), 'hold', 10), null,
  'no movement order means no stance or gait override');
assert.equal(choose(soldier('formation', 10, { isPlayer: true }), 'formation', 10), null);
assert.equal(choose(soldier('formation', 10, { squad: { inContact: false }, eng: { state: 'advance' } }),
  'formation', 10), null, 'quiet movement preserves legacy');
root.PhaseCCombatLab.movementPace = 'purposeful';
assert.equal(choose(soldier(), 'formation', 12), null, 'purposeful control untouched');
root.PhaseCCombatLab.movementPace = 'baseline';
assert.equal(choose(soldier(), 'formation', 12), null, 'baseline untouched');
root.PhaseCCombatLab = null;
assert.equal(choose(soldier(), 'formation', 12), null, 'headless fixtures without the PHP bootstrap retain legacy behavior');
root.BATTLE_BUILD_DEPLOYED = 'integration';
assert.equal(body.autonomousOn(), true, 'deployed battles enable autonomous stance and gait');
assert.equal(choose(soldier(), 'formation', 12).gait, 'run', 'real game contact transit uses run floor');
root.location = { search: '?bodyAutonomy=0' };
assert.equal(body.autonomousOn(), false, 'shipping A/B rollback stops autonomous locomotion');
assert.equal(choose(soldier(), 'formation', 12), null, 'rollback preserves earlier contact gait');
root.location = { search: '?bodyAutonomy=1' };
assert.equal(body.autonomousOn(), true, 'explicitly enabled production autonomy can be compared');
console.log('PASS autonomous body selection: contact floor, stance, safety, covered bound and stealth');
