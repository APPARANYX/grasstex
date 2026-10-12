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

function world(withWall = true) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&coa=0&slStress=0&scoutsForward=0&fireteamSplit=0&stressAct=0'
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
    composition: ['rifleman', 'rifleman', 'rifleman', 'sergeant']
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
    { x: 4, z: -36 }
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
  const posture = { mode: 'maneuver', stats: { rejectedUnsafeBounds: 0 } };
  // Isolate acceptance of a qualified non-emergency posture. All subsequent
  // cover, shooter evidence, squad authorization and movement are native.
  P.current = () => posture;
  P.update = () => posture;
  S.localPlan.update = () => ({
    kind: 'protect',
    emergency: false,
    boundsAllowed: false,
    eligible: { protect: true, recover: false },
    inputs: { pressure: 0.5 }
  });
  return { r, b, q, hostile, S, P, wall };
}
const w = world();
const { r, b, q, S, P } = w;
const C = r.BattleCoverPositions,
  E = r.BattleEngagement,
  L = r.BattleLeases;
const mover = q.members[0],
  support = q.members.slice(1);
/* The support element is on the wall's open flank and must first establish
   genuine aiming and shot activity, not merely appear in a synthetic report. */
for (let i = 0; i < 20; i++) {
  b.time += 0.15;
  for (const s of support) {
    E.updateSoldier(s, b);
    r.BattleMovementResolver.resolve(s, b);
    H.stepMovement(b, s, 0.15);
  }
}
assert.ok(b.events.fired > 0, 'live base must actually fire before mover authorization');
const report = E.updateSquad(q, b);
console.log(
  'CAUSAL_SUPPORT_REPORT',
  JSON.stringify({
    fired: b.events.fired,
    supporters: report.fireSupport.map(s => s.id),
    men: q.members.map(s => ({
      id: s.id,
      state: E.stateOf(s).state,
      target: s.target && s.target.id,
      reload: s.reloading,
      shotClock: s.nextFireAt
    }))
  })
);
assert.ok(
  report.fireSupport.filter(s => support.includes(s)).length >= 2,
  'real Engagement must report at least two distinct supporting rifles'
);
assert.ok(
  P.coveredTeam(b, q, [mover], report),
  'real Navigation, Perception and physical cover slot must allow the prospective moving rifleman'
);
const start = { x: mover.root.position.x, z: mover.root.position.z };
S.fireAndMovement(q, b);
assert.ok(L.holds(q, 'bound', b.time), 'shipping Squad Leader issued the single native bound lease');
assert.equal(E.stateOf(mover).boundOrder, true, 'native Engagement received selected mover order');
assert.ok(
  support.every(s => !E.stateOf(s).boundOrder),
  'separate base of fire never receives bound order'
);
let moved = 0,
  supportShotsDuringMove = 0,
  goal = null,
  firstMoveAt = null;
const originalFire = b.onFire;
b.onFire = function (s) {
  if (s && support.includes(s) && moved > 0.35 && moved < 12) supportShotsDuringMove++;
  return originalFire.apply(this, arguments);
};
for (let i = 0; i < 120; i++) {
  b.time += 0.15;
  for (const s of q.members) {
    E.updateSoldier(s, b);
    r.BattleMovementResolver.resolve(s, b);
    H.stepMovement(b, s, 0.15);
  }
  moved = Math.hypot(mover.root.position.x - start.x, mover.root.position.z - start.z);
  if (moved > 0.35 && firstMoveAt == null) firstMoveAt = b.time;
  if (E.stateOf(mover).cover) goal = { x: E.stateOf(mover).cover.x, z: E.stateOf(mover).cover.z };
  if (
    goal &&
    moved > 0.75 &&
    Math.hypot(mover.root.position.x - goal.x, mover.root.position.z - goal.z) < 0.45
  )
    break;
}
assert.ok(goal, 'native Engagement adopted physical cover without exposed fallback');
assert.ok(moved > 0.75, 'moving fireteam physically displaced under shipping movement execution');
assert.ok(
  Math.hypot(mover.root.position.x - goal.x, mover.root.position.z - goal.z) < 0.45,
  'mover arrived at the actual selected covered slot'
);
console.log(
  'CAUSAL_DIAGNOSTICS',
  JSON.stringify({
    moved,
    firstMoveAt,
    goal,
    shots: b.events.fired,
    supportShotsDuringMove,
    support: support.map(s => ({
      id: s.id,
      state: E.stateOf(s).state,
      x: s.root.position.x,
      z: s.root.position.z,
      targetId: s.target && s.target.id
    }))
  })
);
assert.ok(supportShotsDuringMove > 0, 'two-element evidence requires actual support fire while bound moves');
assert.ok(
  support.every(s => !s.dead),
  'supporting rifles remain viable'
);
const negative = world(false);
const nr = negative.r.BattleEngagement.updateSquad(negative.q, negative.b);
assert.equal(
  negative.P.coveredTeam(negative.b, negative.q, [negative.q.members[0]], nr),
  false,
  'no physical cover is not authorization for an exposed rush'
);
negative.S.fireAndMovement(negative.q, negative.b);
assert.equal(negative.r.BattleLeases.get(negative.q, 'bound'), null);
console.log(
  'covered-fire-maneuver-causal-check: PASS',
  JSON.stringify({
    moverId: mover.id,
    supportIds: support.map(s => s.id),
    firstMoveAt,
    metres: +moved.toFixed(2),
    supportShotsDuringMove,
    cover: goal,
    unsafeBoundRejections: negative.P.current().stats.rejectedUnsafeBounds
  })
);
