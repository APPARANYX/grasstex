#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const C = require('../../battle/tactical-capability-contract');
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}
function world(range = 100, flags = '&commandPosture=0') {
  H.resetIds();
  const r = H.bootstrap({
    search: '?stressAct=0&commandRelay=0&tacticalController=new' + flags,
    stats: true
  });
  const systems = {};
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  r.BattleModules.unitsFor = b => b._roster.us.concat(b._roster.ge);
  r.BattleTacticalCapabilityContract = C;
  for (const f of [
    'battle/movement-resolver.js',
    'battle/modules/13a-tactical-controller.js',
    'battle/modules/13b-tactical-owner-adapters.js',
    'battle/modules/13c-tactical-march-provider.js',
    'battle/modules/13d-tactical-contact-skills.js'
  ])
    loadModule(r, f, { location: r.location });
  r.BattleCommanderAI = { policyFor: () => ({ routeArrivalRadius: 8 }) };
  const b = H.makeBattle(r, { seed: 77 });
  b.time = 10;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 300 },
    facing: 0
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: range,
    objective: { x: 0, z: -300 },
    facing: Math.PI
  });
  q.commandPhase = 'assault';
  q.state = 'advance';
  q._macroMission = { version: 1, owner: 'force-command', intent: 'capture', status: 'executing' };
  q.route = [{ x: 0, z: 300 }];
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  const w = {
    r,
    b,
    q,
    ge,
    target: ge.members[2],
    E: r.BattleEngagement,
    TC: r.BattleTacticalController,
    S: r.BattleTacticalContactSkills
  };
  systems['tactical-march-provider'].onBattleStart(b);
  see(w);
  return w;
}
function see(w, target = w.target) {
  w.target = target;
  w.q.members.forEach(s => {
    s.target = target;
    s.moving = false;
    s.moveSpeed = 0;
    s.root.rotation.y = 0;
    w.r.SquadAI.rememberSeen(s, target, w.b, true, 'contact-fixture');
  });
  w.q.contact = {
    unit: target,
    x: target.root.position.x,
    z: target.root.position.z,
    at: w.b.time,
    firstHandAt: w.b.time,
    seenBy: w.q.members[2].id,
    stance: 'stand'
  };
}
function squad(w) {
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.r.SquadAI.updateSquad(w.q, w.b);
}
function micro(w) {
  w.q.members.forEach(s => {
    w.E.updateSoldier(s, w.b);
    w.r.BattleMovementResolver.resolve(s, w.b);
  });
}
function live(w, cap) {
  return (w.TC.summary(w.b).live || []).filter(a => !cap || a.capability === cap);
}
function clean(w) {
  const s = w.TC.summary(w.b);
  assert.equal(s.stats.faults, 0, JSON.stringify(s.stats.faultExamples || []));
  assert.equal(s.pending, 0);
}

test('controller publishes HOLD through Meso and the native per-man preparation keeps fire closed', () => {
  const w = world();
  squad(w);
  micro(w);
  assert.equal(w.q.fireControl.state, 'hold');
  assert.equal(live(w, 'fire.control').length, 1);
  assert.equal(live(w, 'combat.contact').length, w.q.members.length);
  w.q.members.forEach(s => assert.equal(w.E.fireAuthorized(s, w.b), false));
  assert.equal(w.S.summary(w.q).reason, 'prepare-line');
  clean(w);
});
test('HOLD and replacement OPEN still wait for each man to adopt the actual Meso envelope', () => {
  const w = world(100, '&commandPosture=1'),
    s = w.q.members[4],
    CR = w.r.BattleCommandReception;
  squad(w);
  let rec = CR.snapshot(s, w.b).records['posture-fire|squad'];
  assert.ok(rec.adoptedAt > w.b.time);
  assert.equal(w.E.fireAuthorized(s, w.b), true, 'pending HOLD is not personal truth');
  w.b.time = rec.adoptedAt + 0.001;
  assert.equal(w.E.fireAuthorized(s, w.b), false);
  micro(w);
  w.b.time = 16.1;
  see(w);
  squad(w);
  assert.equal(w.q.fireControl.state, 'open');
  rec = CR.snapshot(s, w.b).records['posture-fire|squad'];
  assert.equal(w.E.fireAuthorized(s, w.b), false, 'pending OPEN cannot release adopted HOLD');
  w.b.time = rec.adoptedAt + 0.001;
  assert.equal(w.E.fireAuthorized(s, w.b), true);
  clean(w);
});
test('PRECISION selects a qualified marksman; the existing preparation deadline ends it', () => {
  const w = world(141.5),
    marksman = w.q.members
      .filter(s => s.role === 'rifleman')
      .sort(
        (a, b) =>
          Math.hypot(
            a.root.position.x - w.target.root.position.x,
            a.root.position.z - w.target.root.position.z
          ) -
          Math.hypot(
            b.root.position.x - w.target.root.position.x,
            b.root.position.z - w.target.root.position.z
          )
      )[0];
  w.q.members.forEach(s => (w.r.BattleSoldierStats.of(s).mkm = 0.45));
  w.r.BattleSoldierStats.of(marksman).mkm = 0.9;
  squad(w);
  micro(w);
  w.b.time += 1.3;
  see(w);
  squad(w);
  micro(w);
  assert.equal(w.q.fireControl.state, 'precision');
  assert.equal(String(w.q.fireControl.shooterId), String(marksman.id));
  w.q.members.forEach(s => assert.equal(w.E.fireAuthorized(s, w.b), s === marksman));
  w.b.time = 16.1;
  see(w);
  squad(w);
  micro(w);
  assert.equal(w.q.fireControl.state, 'open');
  assert.equal(w.S.summary(w.q).reason, 'preparation-deadline');
  clean(w);
});
test('changing contacts cannot restart the HOLD clock and a zero-line preparation still terminates', () => {
  const w = world(600);
  squad(w);
  const started = w.S.summary(w.q).startedAt;
  for (let i = 1; i <= 7; i++) {
    w.b.time = 10 + i;
    see(w, w.ge.members[i % w.ge.members.length]);
    squad(w);
  }
  assert.equal(w.S.summary(w.q).startedAt, started);
  assert.equal(w.q.fireControl.state, 'open');
  assert.equal(w.S.summary(w.q).ready, 0);
  clean(w);
});
test('incoming fire opens the squad and preserves individual return-fire authority', () => {
  const w = world();
  squad(w);
  micro(w);
  w.q.members[3].suppressedUntil = w.b.time + 2;
  w.b.time += 0.15;
  squad(w);
  micro(w);
  assert.equal(w.q.fireControl.state, 'open');
  assert.equal(w.E.fireAuthorized(w.q.members[3], w.b), true);
  assert.equal(w.q.members[3].eng.state, 'pinned');
  clean(w);
});
test('OPEN publication stays stable through changing reports so personal adoption can finish', () => {
  const w = world(100, '&commandPosture=1'),
    s = w.q.members[4],
    CR = w.r.BattleCommandReception;
  squad(w);
  w.b.time = 16.1;
  see(w);
  squad(w);
  const first = CR.snapshot(s, w.b).records['posture-fire|squad'];
  assert.equal(first.data.state, 'open');
  for (let i = 0; i < 5; i++) {
    w.b.time += 0.15;
    see(w, w.ge.members[i]);
    squad(w);
  }
  const latest = CR.snapshot(s, w.b).records['posture-fire|squad'];
  assert.equal(latest.envelopeId, first.envelopeId);
  w.b.time = Math.max(w.b.time, latest.adoptedAt + 0.001);
  assert.equal(w.E.fireAuthorized(s, w.b), true);
  clean(w);
});
test('covered personal contact may use standing ballistic line rather than getting stuck in MARCH', () => {
  const w = world(55);
  const man = w.q.members.find(s => s.role === 'rifleman');
  w.b.time = 18;
  see(w);
  squad(w);
  // Simulate authentic stance-dependent geometry: low eye/muzzle is hidden
  // behind cover, but higher stance can physically see and discharge.
  const sight = w.r.SquadAI.hasLineOfSight;
  const previousBallistics = w.r.BattleBallistics;
  const ball = previousBallistics && previousBallistics.fireLineBlocked;
  w.r.SquadAI.hasLineOfSight = (shooter, target, height, obstacles) =>
    shooter === man || (shooter && shooter.weapon === man.weapon)
      ? !(shooter.prone || shooter.crouching || shooter.tacticalCrouch)
      : sight(shooter, target, height, obstacles);
  w.r.BattleBallistics = {
    ...(previousBallistics || {}),
    fireLineBlocked: (shooter, target, battle) =>
      shooter && shooter.weapon === man.weapon
        ? !!(shooter.prone || shooter.crouching || shooter.tacticalCrouch)
        : ball
          ? ball(shooter, target, battle)
          : false
  };
  man.prone = true;
  man.tacticalCrouch = false;
  w.E.commitStance(man, w.b, 'prone', 0, 'fixture-covered');
  // Wait for the existing native fire-control preparation deadline; the
  // cover-peek test does not bypass leader authorization or force OPEN.
  w.b.time = 26;
  see(w);
  squad(w);
  assert.equal(w.q.fireControl.state, 'open');
  w.TC.dispatch(w.b, w.q, 'engagement', man);
  assert.equal(
    w.S.summary(w.q).roles.find(r => r.actorId === String(man.id))?.drill,
    'fire',
    'available standing sight and muzzle line is a fire drill, not perpetual march'
  );
  assert.equal(
    w.E.firingLineClear(man, man.target, man.root.position, 'stand', w.b),
    true,
    'the personal target has a legitimate standing ballistic line before stance change'
  );
  for (let i = 0; i < 12; i++) {
    w.b.time += 0.15;
    w.TC.dispatch(w.b, w.q, 'engagement', man);
    w.E.updateSoldier(man, w.b);
  }
  assert.equal(man.prone, false, 'only the existing Engagement stance owner raises him');
  assert.equal(man.tacticalCrouch, false, 'he rises high enough for the actual firing line');
  w.r.SquadAI.hasLineOfSight = sight;
  w.r.BattleBallistics = previousBallistics;
  clean(w);
});
test('a fresh squadmate SEEN sector authorizes real area suppression from covered stance', () => {
  const w = world(80);
  w.b.time = 16.1;
  see(w);
  const shooter = w.q.members.find(s => s.role === 'rifleman');
  shooter.target = null;
  shooter._beliefs = { byKey: {} }; // no personal target or firsthand belief
  const A = w.r.SquadAI,
    actual = A.canSuppress,
    attempts = [];
  // Physical cover masks prone and crouch, but the real upright muzzle
  // line remains clear; Engagement must own the eventual stance change.
  A.canSuppress = (s, point, battle, readOnly) =>
    !s.prone && !s.crouching && !s.tacticalCrouch && actual(s, point, battle, readOnly);
  squad(w);
  assert.equal(w.q.fireControl.state, 'open');
  assert.equal(shooter.target, null, 'shared report cannot create a personal target');
  const role = w.S.summary(w.q).roles.find(x => x.actorId === String(shooter.id));
  assert.equal(role?.drill, 'suppress', 'eyewitness sector supports an area-fire assignment');
  assert.ok(role.reportedPoint && Number.isFinite(role.reportedPoint.z));
  const actualAreaFire = A.areaFire;
  A.areaFire = (man, point, battle) => {
    if (man === shooter) attempts.push({ x: point.x, z: point.z });
    return actualAreaFire(man, point, battle);
  };
  for (let i = 0; i < 12; i++) {
    w.b.time += 0.15;
    w.E.updateSoldier(shooter, w.b);
    shooter.fireCooldown = 0;
  }
  assert.equal(w.E.stateOf(shooter).stance, 'stand', 'only native Engagement raises the hidden rifleman');
  assert.ok(attempts.length > 0, 'the native area-fire primitive, not tryFire on an unseen target, is called');
  assert.equal(shooter.target, null, 'area fire never forges a direct target');
  A.canSuppress = actual;
  A.areaFire = actualAreaFire;
  clean(w);
});
test('contact execution fires real rounds after recognition and honors ammo/range gates', () => {
  const w = world();
  let shots = 0;
  w.b.onFire = () => shots++;
  squad(w);
  micro(w);
  assert.equal(shots, 0);
  for (let i = 0; i < 70; i++) {
    w.b.time += 0.15;
    see(w);
    squad(w);
    micro(w);
    w.q.members.forEach(s => (s.fireCooldown = Math.max(0, (s.fireCooldown || 0) - 0.15)));
  }
  assert.ok(shots > 0, 'the shipping firing path discharged');
  const before = shots;
  w.q.members.forEach(s => (s.outOfAmmo = true));
  w.b.time += 1;
  see(w);
  squad(w);
  micro(w);
  assert.equal(shots, before, 'empty weapons do not shoot');
  clean(w);
});
test('contact and march never retain competing locomotion actions for one actor', () => {
  const w = world(600);
  squad(w);
  micro(w);
  w.b.time += 7;
  see(w);
  squad(w);
  micro(w);
  squad(w);
  assert.equal(w.q.fireControl.state, 'open');
  const actors = new Set();
  live(w)
    .filter(a => a.actorId !== null && a.capability !== 'combat.march')
    .forEach(a => {
      assert.ok(!actors.has(a.actorId), 'one action per actor');
      actors.add(a.actorId);
    });
  assert.ok(live(w, 'movement.move').length > 0, 'unusable distant line yields to route movement');
  clean(w);
});
test('a quiet march regains native standing posture after preparation ends', () => {
  const w = world();
  squad(w);
  micro(w);
  const s = w.q.members.find(s => s.role === 'rifleman');
  assert.equal(s.prone, true);
  w.r.SquadAI.resetPerceptionBattleState(w.b);
  w.q.members.forEach(s => (s.target = null));
  w.q.inContact = false;
  w.b.time = 30;
  squad(w);
  micro(w);
  squad(w);
  micro(w);
  assert.equal(s.prone, false);
  assert.ok(live(w, 'movement.move').some(a => a.actorId === String(s.id)));
  assert.ok(live(w, 'combat.march').some(a => a.actorId === String(s.id)));
  clean(w);
});
test('a recent personal sighting can support; heard-only knowledge cannot create a suppressor', () => {
  const w = world();
  squad(w);
  micro(w);
  w.b.time += 7;
  see(w);
  squad(w);
  const candidate = w.q.members.find(s => s.role === 'rifleman');
  candidate.target = null;
  squad(w);
  micro(w);
  assert.ok(live(w, 'combat.contact').some(a => a.actorId === String(candidate.id)));
  assert.equal(candidate.eng.suppressOrder, true);
  w.r.SquadAI.resetPerceptionBattleState(w.b);
  w.q.members.forEach(s => (s.target = null));
  w.q.contact = null;
  w.q.inContact = false;
  w.b.time += 5;
  squad(w);
  micro(w);
  assert.equal(
    w.q.members.some(s => s.eng.suppressOrder),
    false
  );
  clean(w);
});
test('retreat, mission supersession, possession and restart cancel native contact handles', () => {
  const w = world();
  squad(w);
  micro(w);
  const old = live(w).map(a => a.actionId);
  w.q._macroMission = { ...w.q._macroMission, version: 2 };
  w.b.time += 0.15;
  squad(w);
  micro(w);
  assert.ok(live(w).every(a => !old.includes(a.actionId)));
  const s = w.q.members[2];
  w.TC.interrupt(w.b, w.q, s.id, 'player-owned');
  s.isPlayer = true;
  assert.equal(
    live(w).some(a => a.actorId === String(s.id)),
    false
  );
  w.q.state = 'retreat';
  w.q.commandPhase = 'retreat';
  w.TC.dispatch(w.b, w.q, 'fireAndMovement', { underFire: 1 });
  w.TC.dispatch(w.b, w.q, 'squadCommand');
  assert.equal(live(w).length, 0);
  assert.equal(w.q.fireControl, null);
  w.TC.beforeRestart(w.b);
  assert.equal(w.TC.summary(w.b).actions, 0);
  clean(w);
});
test('native emergency cover cancels contact without changing the transition beneath its owner', () => {
  const w = world(),
    s = w.q.members.find(s => s.role === 'rifleman');
  loadModule(w.r, 'battle/modules/44-combat-urgency.js', { location: w.r.location });
  squad(w);
  micro(w);
  w.E.findCover = man => ({
    x: man.root.position.x + 10,
    z: man.root.position.z,
    distance: 10,
    quality: 0.5,
    type: 'fixture'
  });
  s.suppressedUntil = w.b.time + 3;
  w.b.time += 0.15;
  squad(w);
  assert.doesNotThrow(() => w.E.updateSoldier(s, w.b));
  assert.equal(s.eng.state, 'bound');
  assert.equal(s.eng.urgentBound, true);
  assert.equal(
    live(w, 'combat.contact').some(a => a.actorId === String(s.id)),
    false
  );
  w.b.time += 0.15;
  assert.doesNotThrow(() => w.E.updateSoldier(s, w.b));
  assert.equal(s._movementResolver.combat.kind, 'cover-bound');
  clean(w);
});
test('explicit contact requests conflict with movement and reject malformed fire control', () => {
  const req = {
    battleId: 'b',
    generation: 0,
    faction: 'us',
    squadId: 's',
    actorId: '1',
    missionVersion: 1,
    rosterRevision: 0,
    controllerEpoch: 1,
    mode: 'new',
    actionId: 'a',
    capability: 'combat.contact',
    params: { drill: 'fire' }
  };
  const move = { ...req, actionId: 'b', capability: 'movement.move', params: { point: { x: 1, z: 2 } } };
  assert.equal(C.resourceConflicts(req, move).reason, 'resource-conflict');
  const ctx = { ...req, now: 10, actors: [{ id: '1', dead: false, player: false, transportLocked: false }] };
  delete ctx.actionId;
  delete ctx.actorId;
  delete ctx.capability;
  delete ctx.params;
  for (const params of [
    { state: 'precision', targetId: '2', shooterId: null },
    { state: 'open', targetId: null, shooterId: '1' },
    { state: 'hold', targetId: 1, shooterId: null }
  ]) {
    assert.equal(
      C.validateRequest({ ...req, actorId: null, capability: 'fire.control', params }, ctx).reason,
      'invalid-parameters'
    );
  }
});
test('contact decisions have no authoritative writes, new timers, random draws or legacy policy calls', () => {
  const src = fs
    .readFileSync(require.resolve('../../battle/modules/13d-tactical-contact-skills.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(
    src,
    /\.destination\s*=(?!=)|\.commandPhase\s*=(?!=)|\.fireControl\s*=(?!=)|\.suppressOrder\s*=(?!=)|\.eng\s*=(?!=)/
  );
  assert.doesNotMatch(
    src,
    /setTimeout|setInterval|Math\.random|\.updateFireControl\(|\.assignSuppressors\(|\.decide\(/
  );
});
console.log(count + ' tactical contact skill checks passed');
