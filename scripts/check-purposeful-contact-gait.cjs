'use strict';
/* Native gait policy regression: no synthetic supporter count or direct physical writes.
 * The lab switch must promote tactical firing-station ingress without changing the
 * baseline gait, suppression hold, reload safety, or Squad Leader orders. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('battle/modules/11-soldier-individuality.js', 'utf8');
const root = {
  GTLog() {},
  GTMath: { clamp: (v, a, b) => Math.max(a, Math.min(b, v)) },
  BattleModules: {
    unitsFor(sim) { return sim.units; },
    registerSystem(name, system) { this.system = system; }
  },
  BattleSoldierModel: { animateWalk() {} },
  PhaseCCombatLab: { movementPace: 'purposeful' }
};
vm.runInNewContext(source, { window: root, console, Math });
const gait = root.BattleSoldierIndividuality;
assert.ok(gait && typeof gait.desiredGait === 'function');
function soldier(distance, kind, contact = false, extra = {}) {
  return Object.assign({
    id: 11, faction: 'us', role: 'rifleman',
    root: { position: { x: 0, z: 0 } },
    destination: { x: distance, z: 0 },
    _movementResolver: { goal: { kind } },
    tacticalCrouch: true, prone: false, crawling: false,
    suppressedUntil: 0, squad: { inContact: contact, commandPhase: 'defend' },
    eng: { state: 'station' }, moving: true, dead: false
  }, extra);
}
const sim = { time: 12 };
const caseGait = (distance, kind, contact, extra) =>
  gait.desiredGait(soldier(distance, kind, contact, extra), sim);
assert.equal(caseGait(12, 'firing-station', false), 'crouchRun',
  'station ingress remains urgent after contact expires');
assert.equal(caseGait(2, 'firing-station', false), 'crouchRun',
  'the old four-metre slowdown is gone on station ingress');
assert.equal(caseGait(1, 'firing-station', false), 'crouchWalk',
  'final firing posture still settles within 1.5m');
assert.equal(caseGait(12, 'formation', false), 'crouchWalk',
  'ordinary uncontacted formation is still cautious');
assert.equal(caseGait(2.1, 'formation', true), 'crouchRun',
  'near-contact reposition is purposeful beyond final settle distance');
assert.equal(caseGait(1.2, 'formation', true), 'crouchWalk');
assert.equal(caseGait(3, 'firing-station', false, { suppressedUntil: 20 }), 'crouchWalk',
  'suppression never authorizes a new speed promotion');
assert.equal(caseGait(12, 'firing-station', false, { reloading: true }), 'crouchWalk');
assert.equal(caseGait(12, 'firing-station', false, { clearingStoppage: true }), 'crouchWalk');
assert.equal(caseGait(12, 'cover-bound', false, { eng: { state: 'bound' } }), 'crouchRun',
  'native Squad Leader bound remains fast');
root.PhaseCCombatLab.movementPace = 'baseline';
assert.equal(caseGait(12, 'firing-station', false), 'crouchWalk',
  'A/B baseline reproduces original movement');
assert.equal(caseGait(2.1, 'formation', true), 'crouchWalk',
  'baseline preserves the original four-metre cutoff');
assert.equal(caseGait(5, 'formation', true), 'crouchRun');
root.PhaseCCombatLab = null;
assert.equal(caseGait(12, 'firing-station', false), 'crouchWalk',
  'production default does not change');
root.PhaseCCombatLab = { movementPace: 'purposeful' };
const s = soldier(12, 'firing-station', false);
root.BattleModules.system.onBattleStart({ time: 12, units: [s] });
assert.equal(s._locomotionGait, 'crouchRun');
assert.ok(s._locomotionGroundSpeed >= 2.5 && s._locomotionGroundSpeed <= 3.5,
  'ground speed is in the historically calibrated crouch-run band');
assert.ok(Math.abs(s.speed * 0.58 - s._locomotionGroundSpeed) < 0.01,
  'the native integrator crouch factor does not slow the chosen gait twice');
/* Only Engagement is allowed to raise a suppressed soldier. When it has
 * already committed a real cover bound at standing height, locomotion must
 * not silently replace that explicit dash with a crouch gait. */
const dash = soldier(12, 'cover-bound', true, {
  tacticalCrouch: false, suppressedUntil: 20,
  eng: { state: 'bound', stance: 'stand' }
});
assert.equal(gait.desiredGait(dash, sim), 'sprint',
  'a stand-height cover dash is not converted to crouchRun by suppression');
root.BattleModules.system.onSimulationStep({ time: 12, units: [dash] });
assert.equal(dash._locomotionGait, 'sprint');
assert.ok(dash._locomotionGroundSpeed >= 5.5 && dash._locomotionGroundSpeed <= 6.7);
assert.ok(Math.abs(dash.speed - dash._locomotionGroundSpeed) < 0.01,
  'upright sprint speed is not compensated as crouch speed');
dash.eng.stance = 'crouch';
dash.tacticalCrouch = true;
assert.equal(gait.desiredGait(dash, sim), 'crouchRun',
  'Engagement crouched bound still requires crouch gait');
dash.eng.state = 'pinned';
dash.eng.stance = 'stand';
dash.tacticalCrouch = false;
assert.notEqual(gait.desiredGait(dash, sim), 'sprint',
  'an uncommitted upright pinned body cannot sprint under suppression');
assert.equal(gait.desiredGait(dash, sim), 'crouchRun',
  'existing in-contact crouch-run policy still applies when more than four metres remain');
root.PhaseCCombatLab.movementPace = 'baseline';
root.BattleModules.system.onSimulationStep({ time: 12, units: [s] });
assert.equal(s._locomotionGait, 'crouchWalk');
assert.ok(s._locomotionGroundSpeed >= 0.7 && s._locomotionGroundSpeed <= 1.0);
console.log('PASS purposeful contact gait: native movement bands, baseline and safety gates');