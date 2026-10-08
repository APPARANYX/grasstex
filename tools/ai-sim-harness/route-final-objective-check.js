#!/usr/bin/env node
'use strict';
/* A squad with no targetObjective (Macro OFF, or a brief with no objective) walks sq.route and the Squad
   Leader parks sq.objective on the CURRENT leg waypoint. Modules 43 (forward progress) and 44 (assault
   cover axis) read `_routeFinalObjective` for the strategic goal, but nothing ever wrote it, so both
   measured against the moving leg. The goal is now the last point of sq.route. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');

function load(root, file) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(
    root,
    root,
    { log() {}, warn() {} }
  );
}
const FINAL = { x: 0, z: 200 },
  routeOf = () => [{ x: 100, z: 0 }, { x: 100, z: 100 }, { ...FINAL }];

/* Module 43: the track goal must be the end of the route and must not reset when the leg moves on. */
function forwardProgress() {
  const systems = {},
    root = {
      BattleModules: {
        registerSystem(id, s) {
          systems[id] = s;
        }
      },
      BattleTelemetry: { record() {} }
    };
  load(root, 'battle/core-runtime.js');
  load(root, 'battle/modules/43-squad-forward-progress.js');
  const members = [1, 2].map(id => ({ id, dead: false, root: { position: { x: 0, y: 0, z: 0 } } })),
    route = routeOf(),
    sq = {
      id: 'us-0',
      faction: 'us',
      state: 'engaged',
      commandPhase: 'approach',
      route,
      routeIndex: 0,
      objective: { ...route[0] },
      targetObjective: null,
      members
    },
    sim = { time: 0, factions: { us: { squads: [sq] }, ge: { squads: [] } }, _objectives: [] },
    system = systems['squad-forward-progress'];
  system.onBattleStart(sim);
  /* Out and back along x for 15 s; the leader advances the leg part-way through (as 15l does). */
  for (let i = 0; i <= 30; i++) {
    const x = i <= 15 ? i : 30 - i;
    for (const m of members) m.root.position.x = x;
    if (i === 10) {
      sq.routeIndex = 1;
      sq.objective = { ...route[1] };
    }
    sim.time = i * 0.5;
    system.onCommanderTick(sim);
  }
  const s = root.BattleSquadForwardProgress.summary(sim);
  assert.equal(s.trackResets.goal, 0, 'a route leg advancing must not restart the progress track');
  assert.ok(s.totalAlerts >= 1, 'the out-and-back still alerts');
  assert.deepEqual(s.alerts[0].goal, FINAL, 'progress is measured against the end of the route');
}

/* Module 44: assault cover must be "forward" along the route's end, not the current leg. */
function coverAxis() {
  const root = {
    BattleModules: { registerSystem() {}, unitsFor: () => [] },
    BattleEngagement: { extend() {} },
    BattleMovementResolver: {}
  };
  load(root, 'battle/core-runtime.js');
  load(root, 'battle/modules/44-combat-urgency.js');
  const route = routeOf(),
    sq = {
      commandPhase: 'assault',
      state: 'engaged',
      route,
      routeIndex: 0,
      objective: { ...route[0] },
      targetObjective: null,
      orderAnchor: { x: 0, z: 0 }
    },
    s = { squad: sq, suppressedUntil: 0, root: { position: { x: 0, y: 0, z: 0 } } },
    sim = { time: 10, _objectives: [] },
    guard = root.BattleAssaultForwardGuard;
  assert.ok(guard && guard.allowCover, 'assault forward guard is exposed');
  assert.equal(
    guard.allowCover(s, sim, { x: 0, z: 10 }),
    true,
    'cover 10 m toward the end of the route is forward even while the leg points sideways'
  );
  assert.equal(
    guard.allowCover(s, sim, { x: 0, z: -10 }),
    false,
    'cover 10 m behind the end of the route is still refused'
  );
}

forwardProgress();
console.log('PASS forward progress measures against the route end across leg changes');
coverAxis();
console.log('PASS assault cover axis points at the route end, not the current leg');
