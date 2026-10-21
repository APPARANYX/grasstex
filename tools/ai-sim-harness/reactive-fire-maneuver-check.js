'use strict';
/* Phase C causal integration: shipping Engagement reports the base of fire,
   shipping Meso publishes one bound, and the real Engagement/Resolver/movement
   path executes it. Only the already-qualified posture and local-task snapshot
   are supplied at the policy seam: they are separately proven by the terrain/
   Navigation posture and covered-route checks. Never substitute an artificial
   cover candidate, line-of-sight verdict, or movement executor. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');

function world(withWall = true, extraRifle = false) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?reactiveFireManeuver=1&localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&coa=0&slStress=0&scoutsForward=0&fireteamSplit=0&stressAct=0'
  });
  r.BattleModules = {
    registerSystem() {},
    unitsFor: b => b._roster.us.concat(b._roster.ge)
  };
  const load = file => loadModule(r, file, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  loadSquadCommandStack((root, file) => load(file), r);
  const b = H.makeBattle(r);
  b.time = 5;
  const scenario = { buildings: [] };
  b.scene = { metadata: { battleScenario: scenario } };
  r.__battle__ = b;
  r.BattleNavigation.installScenario(scenario);
  const wall = {
    id: 'causal-wall',
    physicalId: 'causal-wall',
    shape: 'obb',
    type: 'wall',
    x: 0,
    z: 0,
    hx: 14,
    hz: 1,
    ux: 1,
    uz: 0,
    vx: 0,
    vz: 1,
    radius: 1,
    y: 0,
    height: 1.1,
    cover: 0.62
  };
  b.obstacles = withWall ? [wall] : [];
  b.obstacles.__physicalFootprints = b.obstacles;
  b.obstacles.__physicalVersion = 1;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: -4,
    objective: { x: 0, z: 50 },
    composition: extraRifle
      ? ['rifleman', 'rifleman', 'rifleman', 'rifleman', 'sergeant']
      : ['rifleman', 'rifleman', 'rifleman', 'sergeant']
  });
  const hostile = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 60,
    objective: { x: 0, z: -50 },
    composition: ['rifleman']
  }).members[0];
  hostile.isPlayer = true;
  hostile.hp = 100000;
  hostile.root.position.set(0, 0, 60);
  const positions = [
    { x: 0, z: -4 },
    { x: -4, z: -36 },
    { x: 0, z: -36 },
    { x: 4, z: -36 },
    { x: 8, z: -36 }
  ];
  q.members.forEach((s, i) => {
    s.root.position.set(positions[i].x, 0, positions[i].z);
    s.root.rotation.y = 0;
    s.destination = { x: positions[i].x, z: positions[i].z };
    s.orderDestination = { x: positions[i].x, z: positions[i].z };
    s.target = hostile;
    s._fireteamKey = i === 0 ? 'alpha' : 'bravo';
    const e = r.BattleEngagement.stateOf(s);
    e.state = 'engage';
    e.fireReadyAt = 0;
    r.BattleEngagement.commitStance(s, b, 'prone', 0, 'fixture:defensive-position');
  });
  q.state = 'engaged';
  q.inContact = true;
  q.commandPhase = 'assault';
  q.fireControl = { state: 'open', since: 0, startedAt: 0 };
  q._macroMission = {
    version: 1,
    status: 'executing',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 50 }
  };
  const reportContact = { x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' };
  r.SquadAI.soldierContact = () => reportContact;
  r.SquadAI.squadContactsMap = () => [reportContact];
  const S = r.BattleSquadStability;
  const P = S.tacticalPostures;

  return { r, b, q, hostile, S, P, wall };
}

// Actual low cover lets the holding element fire crouched without being
// exposed; an engage label alone must not certify a defensive position.
function protectHoldingElement(w) {
  for (const s of w.q.members.slice(1)) {
    const p = s.root.position;
    w.b.obstacles.push({
      ...w.wall,
      id: 'holding-log-' + s.id,
      physicalId: 'holding-log-' + s.id,
      type: 'log',
      x: p.x + 1,
      z: p.z + 0.5,
      hx: 0.3,
      hz: 1,
      radius: 1,
      height: 0.62,
      cover: 0.45
    });
  }
  w.b.obstacles.__physicalVersion++;
}
const initial = world();
protectHoldingElement(initial);
const { r, b, q, S } = initial;
const E = r.BattleEngagement,
  L = r.BattleLeases,
  R = r.BattleReactiveFireManeuver;
const mover = q.members[0],
  support = q.members.slice(1);
assert.equal(S.localPlan.update(b, q, { fireSupport: [], underFire: 0 }).kind, 'support');
for (let i = 0; i < 20; i++) {
  b.time += 0.15;
  for (const s of support) {
    E.updateSoldier(s, b);
    r.BattleMovementResolver.resolve(s, b);
    H.stepMovement(b, s, 0.15);
  }
}
assert.ok(R.supporters(b, q, E.updateSquad(q, b), [mover]).length >= 2, 'real independent shots');
// A genuine base of fire cannot release a team before the remaining
// member is defensively positioned, even if that member is not a shooter.
assert.equal(R.defensiveReadiness(b, q).ready, true, JSON.stringify(R.defensiveReadiness(b, q)));
const waiting = support[support.length - 1];
const waitingX = waiting.root.position.x;
waiting.root.position.x += 50;
E.commitStance(waiting, b, 'stand', 0, 'fixture:unsettled');
assert.equal(R.defensiveReadiness(b, q).ready, false, 'standing exposed is not defensible');
const priorTarget = waiting.target;
waiting.target = null;
waiting.eng.state = 'advance';
E.updateSoldier(waiting, b);
r.BattleMovementResolver.resolve(waiting, b);
assert.equal(waiting.target, null, 'delivered report never creates a direct target');
assert.equal(waiting.eng.state, 'alert', 'real base of fire settles report-only members');
assert.equal(waiting.eng.moveReason, 'base of fire: take position');
assert.equal(waiting.prone, true, 'no cover settles report-only member prone');
assert.equal(waiting.moving, false);
waiting.target = priorTarget;
waiting.eng.state = 'engage';
E.commitStance(waiting, b, 'stand', 0, 'fixture:unsettled');

assert.equal(R.assessTeam(b, q, [mover], E.updateSquad(q, b)).reason, 'squad-not-settled');
waiting.dead = true;
assert.equal(R.defensiveReadiness(b, q).ready, true, 'casualties do not hold a live squad forever');
waiting.dead = false;
waiting.incapacitated = true;
assert.equal(R.defensiveReadiness(b, q).ready, true, 'incapacitated members are not a moving element');
waiting.incapacitated = false;
E.commitStance(waiting, b, 'prone', 0, 'fixture:no-cover-fallback');
assert.equal(R.defensiveReadiness(b, q).ready, true, 'stationary prone fallback is defensible');
waiting.eng.state = 'bound';
assert.equal(R.defensiveReadiness(b, q).ready, false, 'individual cover ingress must finish');
waiting.eng.state = 'engage';
assert.equal(
  R.defensiveReadiness(b, { members: [] }).ready,
  false,
  'empty squads cannot acknowledge positions'
);
waiting.root.position.x = waitingX;
waiting.moving = true;
S.fireAndMovement(q, b);
assert.equal(L.holds(q, 'bound', b.time), false, 'two shooters do not release a still-moving squad member');
waiting.moving = false;
E.updateSoldier(waiting, b);
assert.equal(R.defensiveReadiness(b, q).ready, true);
const events = [];
r.BattleTelemetry = {
  record(type, data) {
    events.push({ type, ...data });
  }
};
q.inContact = false; // A genuinely new contact must not restart a blind startup timer after support is proven.
S.fireAndMovement(q, b);
assert.equal(q._localTask.kind, 'maneuver', 'native local arbiter selects reactive maneuver');
assert.ok(L.holds(q, 'bound', b.time), JSON.stringify({ events, task: q._localTask }));
const lease = L.get(q, 'bound');
assert.equal(lease.data.reactiveFireManeuver, true);
assert.equal(R.adoptionAllowed(mover, b, lease), true);
assert.equal(
  R.supporters(b, q, { fireSupport: [support[0], support[0]] }, [mover]).length,
  1,
  'duplicate supporter cannot supply two elements'
);
// Current holding positions are checked again at adoption, but already-
// authorized moving peers do not invalidate the same team's remaining orders.
waiting.moving = true;
assert.equal(R.adoptionAllowed(mover, b, lease), false, 'holding member left defensive position');
waiting.moving = false;
mover.moving = true;
assert.equal(R.adoptionAllowed(mover, b, lease), true, 'authorized mover may leave the starting position');
mover.moving = false;
support[0].dead = true;
assert.equal(R.adoptionAllowed(mover, b, lease), false, 'support casualty invalidates unconsumed order');
support[0].dead = false;
support[0].outOfAmmo = true;
assert.equal(R.adoptionAllowed(mover, b, lease), false, 'empty supporter invalidates order');
support[0].outOfAmmo = false;
const clock = b.time;
b.time = lease.until;
assert.equal(R.adoptionAllowed(mover, b, lease), false, 'lease expires');
b.time = clock;

for (const s of support) s.reloading = true;
assert.equal(R.adoptionAllowed(mover, b, lease), false, 'reload invalidates unconsumed authorization');
for (const s of support) s.reloading = false;
const start = { ...mover.root.position };
let shots = 0,
  arrival = false;
const fire = b.onFire;
b.onFire = function (s) {
  if (support.includes(s) && E.stateOf(mover).state === 'bound' && mover.moving) shots++;
  return fire.apply(this, arguments);
};
for (let i = 0; i < 100; i++) {
  b.time += 0.15;
  for (const s of q.members) {
    E.updateSoldier(s, b);
    r.BattleMovementResolver.resolve(s, b);
    H.stepMovement(b, s, 0.15);
  }
  const c = E.stateOf(mover).cover;
  if (c && Math.hypot(mover.root.position.x - c.x, mover.root.position.z - c.z) < 0.45) {
    arrival = true;
    break;
  }
}
assert.ok(arrival, 'native physical arrival');
assert.ok(shots > 0, 'real covering fire during movement');
assert.ok(Math.hypot(mover.root.position.x - start.x, mover.root.position.z - start.z) > 0.75);
q._macroMission.status = 'cancelled';
assert.equal(R.adoptionAllowed(mover, b, lease), false, 'mission withdrawal');
const input = { contact: true, confidence: 0.9, pressure: 0.5, supporting: 2 };
q._macroMission.status = 'executing';
assert.equal(R.canTask(q, input), true);
assert.equal(R.canTask(q, { ...input, pressure: 0.75 }), false, 'emergency pressure');
assert.equal(R.canTask(q, { ...input, confidence: 0.1 }), false, 'no invented confidence');
q.commandPhase = 'defend';
assert.equal(R.canTask(q, input), false, 'mission phase');
assert.equal(H.bootstrap().BattleReactiveFireManeuver.on, false, 'default off');
console.log(
  'PASS reactive native arbiter -> Meso lease -> Engagement -> physical arrival',
  JSON.stringify({
    shots,
    metres: Math.hypot(mover.root.position.x - start.x, mover.root.position.z - start.z)
  })
);

// A fresh controlled reported picture and nearby physical cover allow the
// complete native cycle, including a newly arrived rifle becoming support.
const cycle = world(true, true);
const cr = cycle.r,
  cb = cycle.b,
  cq = cycle.q,
  CE = cr.BattleEngagement,
  CL = cr.BattleLeases;
cq.members.slice(1).forEach(s => {
  s.root.position.z = -8;
  s.destination.z = -8;
  s.orderDestination.z = -8;
});
protectHoldingElement(cycle);
cq.members[3]._fireteamKey = 'charlie';
cq.members[4]._fireteamKey = 'charlie';
const picture = { x: 0, z: 60, confidence: 0.9, source: 'told' };
cr.SquadAI.soldierContact = () => ({ ...picture, at: cb.time });
cr.SquadAI.squadContactsMap = () => [{ ...picture, at: cb.time }];
const observer = require('../../scripts/lib/benchmark-reactive-maneuver.cjs').create(cr, cb);
const oldFire = cb.onFire;
cb.onFire = function (s) {
  observer.shot(s);
  return oldFire.apply(this, arguments);
};
const observations = [];
cr.BattleTelemetry = {
  record(type, data) {
    if (type === 'decision-bound') observations.push({ ...data, at: cb.time });
  }
};
let arrivedSupport = false;
for (let i = 0; i < 220; i++) {
  cb.time += 0.15;
  for (const s of cq.members) {
    CE.updateSoldier(s, cb);
    cr.BattleMovementResolver.resolve(s, cb);
    H.stepMovement(cb, s, 0.15);
  }
  if (
    CE.stateOf(cq.members[0]).cover &&
    CE.supportReady(cq.members[0], cb) &&
    cr.SquadAI.shotReceipt(cq.members[0], cb)
  )
    arrivedSupport = true;
  cycle.S.fireAndMovement(cq, cb);
  observer.sample();
}
assert.ok(observations.length >= 2, JSON.stringify(observations));
assert.ok(arrivedSupport, 'arrived mover establishes genuine support');
assert.equal(
  cr.BattleReactiveFireManeuver.defensiveReadiness(cb, cq).ready,
  true,
  'native occupied slots remain defensible within arrival tolerance'
);
assert.ok(new Set(observations.map(x => x.team)).size >= 2, 'native fireteam rotation survives the handoff');
console.log('PASS successive native bounds and arrived-mover support', JSON.stringify(observations));

assert.ok(observer.snapshot().completed >= 2, JSON.stringify(observer.snapshot()));
assert.ok(observer.snapshot().successiveSquads >= 1, 'distinct leases physically complete');
assert.ok(observer.snapshot().supportShotsDuringMovement > 0);

const occupied = cq.members.find(s => cr.BattleCoverPositions.occupied(s, cb));
assert.ok(occupied, 'native completed bounds retain an occupied claim');
cb.obstacles.__physicalVersion++;
assert.equal(cr.BattleCoverPositions.occupied(occupied, cb), false, 'stale obstacle provenance is not cover');
cb.obstacles.__physicalVersion--;
assert.equal(
  cr.BattleCoverPositions.occupied(occupied, cb),
  true,
  'read-only occupancy did not prune or rebuild the claim'
);
const occupiedX = occupied.root.position.x;
occupied.root.position.x += 5;
assert.equal(
  cr.BattleCoverPositions.occupied(occupied, cb),
  false,
  'a reservation without physical arrival is not occupancy'
);
occupied.root.position.x = occupiedX;

const warningOnly = world(false);
const warned = warningOnly.q.members[0];
warned.target = null;
warned.eng.state = 'advance';
warningOnly.r.BattleEngagement.updateSoldier(warned, warningOnly.b);
assert.equal(warned.eng.state, 'advance', 'a warning without real supporting shots retains native transit');
