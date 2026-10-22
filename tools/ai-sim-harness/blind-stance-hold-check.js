'use strict';
/* A man whose lowered stance blinds him to his target. The engagement review (every ENGAGE_REVIEW)
   re-decides him with 'no firing line'; what that does depends on suppression. Suppressed, decide()
   runs findCover with evade:true, picks cover where he is, and he stays down. Unsuppressed, he
   relocates to cover that has a line. This pins both so a change to the Squad Leader's firing-position
   step cannot silently alter the stance logic it sits on top of. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');

function world() {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?reactiveFireManeuver=1&localPlan=1&coveredBounds=1&coa=0&slStress=0&scoutsForward=0&fireteamSplit=0'
  });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
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
  const box = (id, x, z, hx, hz, height, cover, type) => ({
    id,
    physicalId: id,
    shape: 'obb',
    type,
    x,
    z,
    hx,
    hz,
    ux: 1,
    uz: 0,
    vx: 0,
    vz: 1,
    radius: 1,
    y: 0,
    height,
    cover
  });
  // A 3 m wall right in front of him: no stance sees over it, only a flank has a line.
  b.obstacles = [
    box('front-wall', 0, 1.5, 6, 0.4, 3, 0.62, 'wall'),
    box('flank-log', 10, 0, 1, 0.3, 0.62, 0.45, 'log')
  ];
  b.obstacles.__physicalFootprints = b.obstacles;
  b.obstacles.__physicalVersion = 1;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 50 },
    composition: ['rifleman']
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
  const man = q.members[0];
  man.root.position.set(0, 0, 0);
  man.root.rotation.y = 0;
  man.destination = { x: 0, z: 0 };
  man.orderDestination = { x: 0, z: 0 };
  man.target = hostile;
  const e = r.BattleEngagement.stateOf(man);
  e.state = 'engage';
  e.fireReadyAt = 0;
  return { r, b, man, hostile };
}

function run(suppressed) {
  const { r, b, man } = world();
  const E = r.BattleEngagement;
  const start = { x: man.root.position.x, z: man.root.position.z };
  const stances = new Set();
  for (let i = 0; i < 200; i++) {
    b.time += 0.15;
    if (suppressed) man.suppressedUntil = b.time + 1;
    E.updateSoldier(man, b);
    r.BattleMovementResolver.resolve(man, b);
    H.stepMovement(b, man, 0.15);
    stances.add(man.prone ? 'prone' : man.crouched ? 'crouch' : 'stand');
  }
  const p = man.root.position;
  return { moved: Math.hypot(p.x - start.x, p.z - start.z), stances: [...stances] };
}

const down = run(true);
const free = run(false);
assert.ok(
  down.moved < 2,
  'a suppressed man made blind by the wall takes the cover beside him: ' + JSON.stringify(down)
);
assert.ok(
  free.moved > 5,
  'an unsuppressed blind man relocates to the flank log that has a line: ' + JSON.stringify(free)
);
console.log('PASS a suppressed blind man stays in cover, an unsuppressed one relocates to cover with a line');
