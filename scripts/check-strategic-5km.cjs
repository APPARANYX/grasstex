'use strict';
/* Deterministic generator and route-graph contract, without Babylon or browser resources. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function runtime(query, lab) {
  const sandbox = { console: { log() {} }, location: { search: query || '' }, PHASE_C_COMBAT_LAB: !!lab };
  vm.createContext(sandbox);
  ['battle/core-runtime.js', 'battle/scenario-generator.js', 'battle/commander-routes.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox;
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
function segmentDistance(p, road) {
  const dx = road.bx - road.ax;
  const dz = road.bz - road.az;
  const t = Math.max(0, Math.min(1, ((p.x - road.ax) * dx + (p.z - road.az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - road.ax - t * dx, p.z - road.az - t * dz);
}
function check(seed, g, routes) {
  const a = g.create(seed, { profile: 'strategic' });
  assert.equal(a.profile, 'strategic');
  assert.equal(a.map.width, 5000);
  assert.equal(a.map.depth, 5000);
  assert.equal(a.timeLimitSeconds, 1800);
  assert.equal(a.objectives.length, 12);
  assert.equal(a.roads.length, 21);
  assert.equal(a.settlements.length, 6);
  assert.equal(JSON.stringify(a), JSON.stringify(g.create(seed, { profile: 'strategic' })), 'seeded replay');
  const objectiveIds = new Set(a.objectives.map((o) => o.id));
  assert.equal(objectiveIds.size, 12, 'unique objectives');
  for (const obj of a.objectives) {
    assert.ok(Math.abs(obj.x) < 2400 && Math.abs(obj.z) < 2400, 'objective inside field');
  }
  for (let i = 0; i < a.objectives.length; i++) {
    for (let j = i + 1; j < a.objectives.length; j++) {
      assert.ok(distance(a.objectives[i], a.objectives[j]) > 500, 'distributed objective spacing');
    }
  }
  for (const faction of ['us', 'ge']) {
    const bases = a.spawnZones[faction].bases;
    assert.equal(bases.length, 3);
    const sideObjectives = a.objectives.filter((o) => o.baseFaction === faction);
    assert.equal(sideObjectives.length, 3);
    assert.ok(distance(bases[0], bases[1]) > 650);
    assert.ok(distance(bases[1], bases[2]) > 650);
    for (const base of bases) {
      const obj = a.objectives.find((o) => o.id === base.objectiveId);
      assert.ok(obj && obj.baseFaction === faction, 'owned base objective');
      assert.equal(base.x, obj.x);
      assert.equal(base.z, obj.z);
      assert.ok(Math.abs(base.x) < 2400 && Math.abs(base.z) < 2400, 'base within safe field');
    }
    for (let i = 0; i < 5; i++) {
      const base = bases[i % 3];
      const sq = { faction, home: { x: base.x, z: base.z }, homeBaseObjectiveId: base.objectiveId };
      /* Unlike the spawn-time role route, these routes must be encoded in
         live Macro briefs after target selection. Exercise re-tasking from
         every base to EVERY objective, not only the initial approach target. */
      for (const objective of a.objectives) {
        const origin = { x: base.x, z: base.z };
        const route = routes.missionRouteFor(sq, a, objective.id, origin);
        assert.equal(JSON.stringify(route),
          JSON.stringify(routes.missionRouteFor(sq, a, objective.id, origin)),
          'same origin, target and roads produce identical mission waypoints');
        const steps = [origin, ...route, { x: objective.x, z: objective.z }];
        for (const step of route) {
          assert.ok(Math.abs(step.x) < 2500 && Math.abs(step.z) < 2500,
            'road waypoint remains inside strategic battlefield');
          assert.ok(a.roads.some((road) => segmentDistance(step, road) < 0.01),
            'waypoint lies on a real generated road, not an invented shortcut');
        }
        for (let k = 1; k < steps.length; k++) {
          assert.ok(distance(steps[k - 1], steps[k]) < 5000, 'no giant out-of-bounds leg');
          if (distance(steps[k - 1], steps[k]) < 0.01) continue;
          assert.ok(a.roads.some((road) =>
            segmentDistance(steps[k - 1], road) < 0.01 && segmentDistance(steps[k], road) < 0.01
          ), 'live mission uses connected road edges from base to objective');
        }
        if (distance(origin, objective) <= 160) assert.equal(route.length, 0,
          'short approach must use local soldier navigation without a road detour');
      }
      /* A new General brief may arrive when a squad is halfway down a road:
         the new route must start on that road, not march back to its base. */
      const road = a.roads.find((r) => r.fromObjectiveId === base.objectiveId);
      assert.ok(road, 'base has an outgoing road for en-route re-tasking');
      const halfway = { x: (road.ax + road.bx) / 2, z: (road.az + road.bz) / 2 };
      const newObjective = a.objectives.find((o) =>
        o.id !== road.fromObjectiveId && o.id !== road.toObjectiveId &&
        distance(o, halfway) > 700
      );
      assert.ok(newObjective);
      const retask = routes.missionRouteFor(sq, a, newObjective.id, halfway);
      assert.ok(retask.length >= 1, 'distant re-task includes live road approach');
      const steps = [halfway, ...retask, newObjective];
      for (let k = 1; k < steps.length; k++) {
        assert.ok(a.roads.some((segment) =>
          segmentDistance(steps[k - 1], segment) < 0.01 &&
          segmentDistance(steps[k], segment) < 0.01
        ), 'retasked squad follows connected roads from its actual position');
      }
      for (const role of ['left', 'center', 'right', 'support', 'reserve']) {
        const route = routes.routeFor(sq, role, a, i);
        assert.ok(route.length > 0);
        assert.equal(route[0].x, base.x);
        assert.equal(route[0].z, base.z);
        for (let k = 1; k < route.length; k++) {
          const prev = route[k - 1], next = route[k];
          assert.ok(a.roads.some((r) =>
            (r.ax === prev.x && r.az === prev.z && r.bx === next.x && r.bz === next.z) ||
            (r.bx === prev.x && r.bz === prev.z && r.ax === next.x && r.az === next.z)
          ), 'route leg belongs to a generated road');
        }
      }
    }
  }
  const legacyRouteResult = routes.missionRouteFor(
    { faction: 'us' }, { ...a, profile: 'legacy' }, a.objectives[9].id, a.objectives[0]
  );
  assert.equal(legacyRouteResult.length, 0, 'live road-brief routing is strategic-only');
  const missingGraph = routes.missionRouteFor(
    { faction: 'us' }, { ...a, roads: [] }, a.objectives[9].id, a.objectives[0]
  );
  assert.equal(missingGraph.length, 0, 'missing road network does not invent waypoints');
  const connected = new Set([a.objectives[0].id]);
  for (let pass = 0; pass < 12; pass++) {
    a.roads.forEach((r) => {
      if (connected.has(r.fromObjectiveId)) connected.add(r.toObjectiveId);
      if (connected.has(r.toObjectiveId)) connected.add(r.fromObjectiveId);
    });
  }
  assert.equal(connected.size, 12, 'all objectives reachable by road');
  for (const road of a.roads) {
    assert.ok(objectiveIds.has(road.fromObjectiveId) && objectiveIds.has(road.toObjectiveId));
    for (const [x, z] of [[road.ax, road.az], [road.bx, road.bz]]) {
      assert.ok(Math.abs(x) < 2500 && Math.abs(z) < 2500);
    }
  }
  assert.ok(a.buildings.length >= 8, 'hamlet structures generated');
  for (const b of a.buildings) {
    assert.ok(Math.abs(b.x) < 2400 && Math.abs(b.z) < 2400);
    for (const road of a.roads) {
      assert.ok(segmentDistance(b, road) > road.width / 2 + Math.hypot(b.w, b.d) / 2 + 5,
        'buildings do not obstruct a road corridor');
    }
  }
}
const defaults = runtime('', false);
const defaultMap = defaults.BattleScenarioGenerator.create('default-front-lines-0001');
assert.equal(defaultMap.profile, 'strategic', '5 km strategic mode is default');
assert.ok(defaultMap.frontLines, 'front-line objective layout is default');
const normal = runtime('?frontLines=0', false);
const legacyRuntime = runtime('?strategicInterception=0&frontLines=0', false);
const legacy = legacyRuntime.BattleScenarioGenerator.create('strategic-compat-0001');
assert.equal(legacy.map.width, 2000);
assert.equal(legacy.map.depth, 1200);
assert.equal(legacy.objectives[0].id, 'obj-center');
assert.equal(JSON.stringify(legacy), JSON.stringify(legacyRuntime.BattleScenarioGenerator.create('strategic-compat-0001')));
const query = runtime('?strategicInterception=1', false);
assert.equal(query.BattleScenarioGenerator.create('url-opt-in').profile, 'strategic');
const lab = runtime('?strategicInterception=1', true);
assert.equal(lab.BattleScenarioGenerator.create('combat-lab', { profile: 'strategic' }).map.width, 280);
for (let i = 0; i < 40; i++) check('strategic-seed-' + i, normal.BattleScenarioGenerator, normal.BattleCommanderRoutes);
console.log('PASS strategic 5km: 40 deterministic seeds, 480 objectives, 240 bases, live/re-tasked road routes, route topology, clear roads, default-on front lines, opt-out classic 5km, legacy and Combat Lab isolation');
