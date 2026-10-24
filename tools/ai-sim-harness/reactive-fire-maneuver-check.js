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

function world(withWall = true, extraRifle = false, extraSearch = '') {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?reactiveFireManeuver=1&localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&coa=0&slStress=0&scoutsForward=0&fireteamSplit=0&stressAct=0' +
      extraSearch
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

// A settled report-only man in useful cover that blocks his own line receives a
// native covered firing-position slot; the shooters stay put and keep firing,
// and the objective bound waits until he has arrived.
function positionWorld(options = {}) {
  const fp = world(false, true, options.search || '');
  const { r: fr, b: fb, q: fq, S: fS, hostile: fh, wall: fw } = fp;
  const [lone, ...shooters] = fq.members;
  const place = (s, x, z) => {
    s.root.position.set(x, 0, z);
    s.destination = { x, z };
    s.orderDestination = { x, z };
  };
  const box = (id, x, z, hx, hz, height, cover, type) => ({
    ...fw,
    id,
    physicalId: id,
    type,
    x,
    z,
    hx,
    hz,
    radius: 1,
    height,
    cover
  });
  place(lone, -12, -7);
  shooters.forEach((s, i) => place(s, 12 + 4 * i, -8));
  // A tall wall shelters the lone man from the reported enemy and from his own
  // view. Chest-high cover 6 m away hides a crouched body but not a standing rifle.
  fb.obstacles = [
    box('blocker', -12, -6, 2.5, 0.4, 3.5, 0.55, 'wall'),
    options.slot === 'log'
      ? box('firing-wall', -18, -6, 1.2, 0.3, 0.62, 0.45, 'log')
      : options.slot === 'none'
        ? null
        : box('firing-wall', -18, -6, 1.2, 0.3, 1.3, 0.55, 'wall')
  ]
    .filter(Boolean)
    .concat(
      shooters.map(s =>
        box('log-' + s.id, s.root.position.x + 1, s.root.position.z + 0.5, 0.3, 1, 0.62, 0.45, 'log')
      )
    );
  fb.obstacles.__physicalFootprints = fb.obstacles;
  fb.obstacles.__physicalVersion = 1;
  fq.members.forEach((s, i) => (s._fireteamKey = ['alpha', 'bravo', 'bravo', 'charlie', 'charlie'][i]));
  lone.target = null; // Report-only: a delivered report never creates a direct target.
  const fresh = { x: 0, z: 60, confidence: 0.9, source: 'told' };
  fr.SquadAI.soldierContact = () => ({ ...fresh, at: fb.time });
  fr.SquadAI.squadContactsMap = () => [{ ...fresh, at: fb.time }];
  const events = { decisions: [], bounds: [], receipts: [] };
  fr.BattleTelemetry = {
    record(type, data) {
      if (type === 'decision-firing-position') events.decisions.push({ ...data, at: fb.time });
      if (type === 'decision-bound') events.bounds.push({ ...data, at: fb.time });
      if (/^firing-position-/.test(type)) events.receipts.push({ type, ...data, at: fb.time });
    }
  };
  const tick = () => {
    fb.time += 0.15;
    for (const s of fq.members) {
      fr.BattleEngagement.updateSoldier(s, fb);
      fr.BattleMovementResolver.resolve(s, fb);
      H.stepMovement(fb, s, 0.15);
    }
    fS.fireAndMovement(fq, fb);
  };
  return { fr, fb, fq, fS, fh, lone, shooters, events, tick };
}
{
  const { fr, fb, fq, fh, lone, shooters, events, tick } = positionWorld();
  const FE = fr.BattleEngagement,
    FL = fr.BattleLeases,
    FR = fr.BattleReactiveFireManeuver;
  const { decisions, bounds, receipts } = events,
    support = new Set();
  const fired = fb.onFire,
    watcher = require('../../scripts/lib/benchmark-reactive-maneuver.cjs').create(fr, fb);
  let moving = false;
  fb.onFire = function (s) {
    watcher.shot(s);
    if (moving && shooters.includes(s)) support.add(s.id);
    return fired.apply(this, arguments);
  };
  const start = shooters.map(s => ({ ...s.root.position }));
  let arrivedAt = null,
    heldObjective = true,
    slot = null,
    atArrival = null,
    leased = null,
    pauseUntil = null;
  const trace = [];
  for (let i = 0; i < 220 && !(arrivedAt !== null && bounds.length); i++) {
    tick();
    watcher.sample();
    const stage = FR.squadStage(fb, fq),
      label = stage.stage + ':' + stage.reason;
    if (trace[trace.length - 1] !== label) trace.push(label);
    const lease = FL.get(fq, 'bound');
    if (lease && lease.data && lease.data.firingPosition) {
      slot = lease.data.point;
      leased = lease;
      pauseUntil = pauseUntil || FL.until(fq, 'bound-cycle');
      moving = FE.firingPositionActive(lone);
      if (FL.holds(fq, 'bound', fb.time) && fq._assaultAuthorized) heldObjective = false;
    }
    if (
      arrivedAt === null &&
      slot &&
      FE.stateOf(lone).state !== 'bound' &&
      Math.hypot(lone.root.position.x - slot.x, lone.root.position.z - slot.z) < 0.45
    ) {
      arrivedAt = fb.time;
      atArrival = watcher.snapshot();
    }
  }
  const hide = { x: -12, y: 0, z: -7 };
  assert.equal(FR.firingLineAt(lone, fb, hide), false, 'sheltered from the enemy and from his own line');
  assert.equal(decisions.length, 1, JSON.stringify(decisions));
  assert.equal(decisions[0].soldier, lone.id);
  assert.ok(slot && slot.slotId === decisions[0].slotId, 'lease carries the native slot Engagement reserves');
  assert.ok(arrivedAt !== null, 'native movement reaches the assigned firing position');
  assert.equal(FR.firingLineAt(lone, fb, lone.root.position), true, 'the slot has an actual firing line');
  assert.equal(
    FE.firingLineClear(lone, fh, lone.root.position, 'stand', fb),
    true,
    'BattleEngagement.firingLineClear(s, target, pt, stance, battle) reaches the stance module'
  );
  assert.equal(
    FE.firingLineClear(lone, fh, hide, 'stand', fb),
    false,
    'the tall wall blocks the old position'
  );
  assert.equal(heldObjective, true, 'an objective bound is not authorized while he takes position');
  // The arrival receipt is judged in the tick that detects it, so the next bound may share that tick.
  assert.equal(bounds.filter(x => x.at < arrivedAt).length, 0, 'no ordinary bound before arrival');
  assert.ok(support.size >= 2, 'at least two shooters kept firing while he moved: ' + [...support]);
  shooters.forEach((s, i) =>
    assert.ok(
      Math.hypot(s.root.position.x - start[i].x, s.root.position.z - start[i].z) < 0.5,
      'a man with a usable line stays put'
    )
  );
  // The benchmark observer reports this step separately from team bounds.
  assert.equal(atArrival.firingAssigned, 1, JSON.stringify(atArrival));
  assert.equal(atArrival.firingAdopted, 1);
  assert.equal(atArrival.firingArrived, 1);
  assert.equal(atArrival.firingLineGained, 1, 'the observer re-measures the line on arrival');
  assert.equal(atArrival.firingInterrupted, 0);
  assert.ok(atArrival.firingSupportShots > 0, 'covering shots while he moved');
  // Only the ordinary bound the receipt released in the arrival tick counts as a team bound.
  assert.equal(
    atArrival.authorized,
    bounds.filter(x => x.at <= arrivedAt).length,
    'a firing position is not counted as a team bound'
  );
  assert.equal(atArrival.adopted, 0);
  assert.ok(atArrival.firingPendingSamples > 0, 'the pending opportunity is sampled before assignment');
  assert.ok(watcher.snapshot().stages.positions > 0, 'the observer samples the positions stage');

  // The executor's arrival receipt ends the step; the window is only the backstop.
  assert.equal(receipts.length, 1, JSON.stringify(receipts));
  assert.equal(receipts[0].type, 'firing-position-arrived');
  assert.equal(receipts[0].soldier, lone.id);
  const ended = fq._leases.ended.find(l => l.kind === 'bound' && l.data && l.data.firingPosition);
  assert.ok(ended && ended.endReason === 'firing position arrived', JSON.stringify(ended));
  assert.ok(ended.endedAt <= arrivedAt + 0.5, 'the lease ends at arrival, not at window expiry');
  assert.ok(ended.endedAt < leased.until - 1, 'it ended before its window ran out');
  assert.ok(
    bounds[0].at < pauseUntil - 0.3,
    'the next step starts before the pause that followed the assignment would have lapsed: ' +
      JSON.stringify({ next: bounds[0].at, pauseUntil, arrivedAt })
  );
  // Derived stage: cover and support first, then the assigned position, then advance.
  const at = label => trace.findIndex(x => x.startsWith(label));
  assert.ok(at('positions:assigned') >= 0, JSON.stringify(trace));
  assert.ok(at('advance:') > at('positions:assigned'), JSON.stringify(trace));
  assert.ok(
    trace.slice(at('positions:assigned')).every(x => !x.startsWith('cover')),
    'a man walking to his slot is the positions step, not unsettled cover: ' + JSON.stringify(trace)
  );
  console.log(
    'PASS squad leader assigns a covered firing position to a settled man without a line',
    JSON.stringify({
      slot: decisions[0].slotId,
      arrivedAt,
      nextBoundAt: bounds[0].at,
      pauseUntil,
      supporters: support.size,
      stages: trace
    })
  );
}

// ?firstSupporter=1: with only one real supporter left, the firing-position step still moves the man who has no
// line. By default it asks for two supporters first, so a squad with no base of fire could not get one.
{
  const run = search => {
    const w = positionWorld({ search });
    // The others are alive and in the squad but cannot fire: one real supporter is left.
    w.shooters.slice(1).forEach(s => {
      s.reloading = true;
      s.outOfAmmo = true;
    });
    for (let i = 0; i < 220 && !w.events.receipts.length; i++) w.tick();
    return w;
  };
  const on = run('&firstSupporter=1'),
    off = run('');
  assert.equal(on.fr.BattleReactiveFireManeuver.firingSupportMin, 1);
  assert.equal(off.fr.BattleReactiveFireManeuver.firingSupportMin, 2);
  assert.equal(
    on.events.decisions.length,
    1,
    'one supporter is enough to move the man: ' + JSON.stringify(on.events)
  );
  assert.equal(on.events.receipts[0] && on.events.receipts[0].type, 'firing-position-arrived');
  assert.equal(off.events.decisions.length, 0, 'default: two supporters first');
}
console.log('PASS ?firstSupporter=1 lets one supporter cover the firing-position step');

// A casualty, or an Engagement move that ends without reaching the slot, ends the
// step immediately. Only an arrival also ends the pause after it.
for (const mode of ['casualty', 'engagement-failure']) {
  const { fr, fb, fq, lone, events, tick } = positionWorld();
  const FE = fr.BattleEngagement,
    FL = fr.BattleLeases;
  let lease = null;
  for (let i = 0; i < 160 && !lease; i++) {
    tick();
    const l = FL.get(fq, 'bound');
    if (l && l.data && l.data.firingPosition && FE.firingPositionActive(lone)) lease = l;
  }
  assert.ok(lease, mode + ': assigned');
  if (mode === 'casualty') {
    lone.dead = true;
    lone.hp = 0;
  } else FE.stateOf(lone).until = fb.time - 1; // the bound overruns its own window
  for (let i = 0; i < 4 && !events.receipts.length; i++) {
    if (mode === 'casualty') fr.BattleSquadStability.fireAndMovement(fq, fb);
    else tick();
  }
  assert.equal(events.receipts.length, 1, mode + ': ' + JSON.stringify(events.receipts));
  assert.equal(events.receipts[0].type, 'firing-position-failed');
  assert.equal(events.receipts[0].reason, mode === 'casualty' ? 'casualty' : 'firing position overran');
  assert.ok(!FL.holds(fq, 'bound', fb.time), mode + ': the failed step no longer holds the squad');
  assert.ok(FL.holds(fq, 'bound-cycle', fb.time), mode + ': a failure keeps the pause, so no instant retry');
}
console.log('PASS a casualty or failed move ends the firing-position step at once and keeps the pause');

// Only low cover is in reach: a 0.62 m log, 28% crouched. The firing slot is judged on the cover it
// gives at the stance that has the line, not on being hidden from the reported position (the old
// concealed-destination rule turned this slot away). The `firingCover` bar decides.
{
  const low = positionWorld({ slot: 'log' });
  const strict = positionWorld({ slot: 'log', search: '&firingCover=40&verifyContact=0' });
  assert.equal(low.fr.BattleReactiveFireManeuver.firingCover, 0.25, 'default bar');
  assert.equal(strict.fr.BattleReactiveFireManeuver.firingCover, 0.4, '?firingCover=40');

  let arrivedAt = null;
  for (let i = 0; i < 200 && arrivedAt === null; i++) {
    low.tick();
    const slot = low.events.decisions[0];
    if (slot && low.fr.BattleEngagement.stateOf(low.lone).state !== 'bound' && low.events.receipts.length)
      arrivedAt = low.fb.time;
  }
  assert.equal(low.events.decisions.length, 1, 'a log gives the default bar: ' + JSON.stringify(low.events));
  assert.equal(low.events.receipts[0].type, 'firing-position-arrived');
  const LR = low.fr.BattleReactiveFireManeuver;
  const there = LR.firingSlotAt(low.lone, low.fb, low.lone.root.position);
  assert.equal(there.ok, true, JSON.stringify(there));
  assert.equal(there.stance, 'crouch', 'the lowest stance that sees over a 0.62 m log');
  assert.ok(there.cover >= 0.25 && there.cover < 0.4, 'a log gives about 28% crouched: ' + there.cover);

  let rejectedLow = 0,
    planned = 0;
  for (let i = 0; i < 200; i++) {
    strict.tick();
    const plan = strict.fr.BattleReactiveFireManeuver.firingPositionPlan(strict.fb, strict.fq, {
      fireSupport: strict.fq.members
    });
    if (plan.pending) planned++;
    rejectedLow += plan.audit['low-cover'] || 0;
  }
  assert.equal(strict.events.decisions.length, 0, 'a 40% bar turns the log away');
  assert.ok(
    planned > 0 && rejectedLow > 0,
    'it is rejected for cover, not for lack of a slot: ' + rejectedLow
  );
}
console.log('PASS the firing slot is judged on cover at the stance that sees, not on concealment');

// A settled man in the open with no cover slot in reach is sent to a nearby prone firing point so
// Perception can see the enemy the report only describes. The report guides him; it is not support.
{
  const on = positionWorld({ slot: 'none' });
  const off = positionWorld({ slot: 'none', search: '&verifyContact=0' });
  const OE = on.fr.BattleEngagement,
    OR = on.fr.BattleReactiveFireManeuver;
  assert.equal(OR.verifyContact, true);
  assert.equal(off.fr.BattleReactiveFireManeuver.verifyContact, false);
  for (let i = 0; i < 220 && !(on.events.receipts.length && on.events.bounds.length); i++) on.tick();
  for (let i = 0; i < 220; i++) off.tick();
  const d = on.events.decisions[0];
  assert.ok(
    d && d.verify === true && d.slotId == null,
    'a point-only verify lease: ' + JSON.stringify(on.events)
  );
  assert.equal(on.events.receipts[0].type, 'firing-position-arrived', JSON.stringify(on.events.receipts));
  assert.equal(off.events.decisions.length, 0, '?verifyContact=0 restores the slot-only step');
  const there = OR.firingLineAt(on.lone, on.fb, on.lone.root.position);
  assert.equal(there, true, 'he stopped on a point that has a line');
  assert.equal(on.lone.prone, true, 'and went prone to use it');
  assert.equal(OE.stateOf(on.lone).positionReceipt.slotId == null, true, 'no slot was reserved');
  const moved = Math.hypot(on.lone.root.position.x + 12, on.lone.root.position.z + 7);
  assert.ok(moved > 1 && moved <= 12.5, 'a short move inside the 12 m reach: ' + moved);
  assert.equal(
    OR.supporters(on.fb, on.fq, { fireSupport: [on.lone] }, []).length,
    0,
    'a clear line to a report is not supporting fire'
  );
}
{
  // The line is re-measured where he actually stops: a wall raised across it makes the arrival a failure.
  const w = positionWorld({ slot: 'none' });
  let blocked = false;
  for (let i = 0; i < 220 && !w.events.receipts.length; i++) {
    w.tick();
    const lease = w.fr.BattleLeases.get(w.fq, 'bound');
    if (
      !blocked &&
      lease &&
      lease.data &&
      lease.data.point &&
      lease.data.point.verify &&
      w.fr.BattleEngagement.firingPositionActive(w.lone)
    ) {
      const q = lease.data.point;
      w.fb.obstacles.push({
        id: 'late-wall',
        physicalId: 'late-wall',
        shape: 'obb',
        type: 'wall',
        x: q.x,
        z: q.z + 1.5,
        hx: 30,
        hz: 0.3,
        ux: 1,
        uz: 0,
        vx: 0,
        vz: 1,
        radius: 1,
        y: 0,
        height: 4,
        cover: 0.5
      });
      w.fb.obstacles.__physicalFootprints = w.fb.obstacles;
      w.fb.obstacles.__physicalVersion++;
      blocked = true;
    }
  }
  assert.ok(blocked, 'a verify lease was granted');
  const r = w.events.receipts[0];
  assert.ok(
    r && r.type === 'firing-position-failed',
    'a lost line fails the arrival: ' + JSON.stringify(w.events.receipts)
  );
}
{
  // A report that goes stale during the move is named as such, not as a blocked line.
  const w = positionWorld({ slot: 'none' });
  let gone = false;
  for (let i = 0; i < 220 && !w.events.receipts.length; i++) {
    w.tick();
    const lease = w.fr.BattleLeases.get(w.fq, 'bound'),
      q = lease && lease.data && lease.data.point;
    // The report lapses just as he gets there, so the arrival is what finds it gone.
    if (
      !gone &&
      q &&
      w.fr.BattleEngagement.firingPositionActive(w.lone) &&
      Math.hypot(w.lone.root.position.x - q.x, w.lone.root.position.z - q.z) < 0.6
    ) {
      const C = w.fr.BattleCoverPositions,
        was = C.boundThreats;
      C.boundThreats = (m, b2) =>
        m === w.lone && w.fr.BattleEngagement.firingPositionActive(m) ? [] : was(m, b2);
      gone = true;
    }
  }
  const r = w.events.receipts[0];
  assert.ok(gone && r && r.type === 'firing-position-failed', 'a stale report fails the arrival');
  assert.match(String(r.reason), /report stale/, 'and says so: ' + (r && r.reason));
}
{
  // A man who hesitates before going keeps his lease, and its execution deadline restarts when he
  // accepts the order, so the wait does not eat his move.
  const run = search => {
    const w = positionWorld({ slot: 'none', search });
    // Only the hesitation matters here; every other mind query reads as neutral.
    w.fr.BattleSoldierMind = new Proxy(
      { hesitation: () => 2 },
      { get: (t, k) => (k in t ? t[k] : /Scale$/.test(String(k)) ? () => 1 : () => 0) }
    );
    let issued = 0,
      adopted = null;
    for (let i = 0; i < 400 && !w.events.receipts.length; i++) {
      w.tick();
      const lease = w.fr.BattleLeases.get(w.fq, 'bound');
      if (lease && lease.data && lease.data.firingPosition) {
        issued = issued || lease.until;
        if (!adopted && w.fr.BattleEngagement.firingPositionActive(w.lone))
          adopted = { at: w.fb.time, until: lease.until };
      }
    }
    return { receipt: w.events.receipts[0], issued, adopted };
  };
  const on = run('');
  assert.ok(
    on.receipt && on.receipt.type === 'firing-position-arrived',
    'the hesitating man arrives: ' + JSON.stringify(on.receipt)
  );
  assert.ok(on.adopted && on.adopted.until >= on.issued, 'adoption never shortens the lease');
  const old = run('&leaseClock=0');
  assert.ok(
    old.adopted && old.adopted.until <= old.issued + 1e-9,
    '?leaseClock=0 leaves the lease as issued'
  );
}
console.log(
  'PASS verify contact: a prone firing point when no cover slot is in reach, line re-measured at arrival, a report is not support'
);
