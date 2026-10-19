'use strict';
/* Front-lines variant of the 5 km profile (?frontLines=1): generator contract, the
   "only the next line" rule, start ownership, the held-line rear point and the
   defender's prepared lines. No Babylon or browser resources. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadModule, quietConsole } = require('../tools/ai-sim-harness/module-loader');
const repo = path.resolve(__dirname, '..');
// Arrays built inside vm contexts carry another realm's prototype; compare their content.
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

function runtime(query) {
  const sandbox = { console: { log() {} }, location: { search: query || '' } };
  vm.createContext(sandbox);
  ['battle/core-runtime.js', 'battle/scenario-generator.js', 'battle/commander-routes.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(repo, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox;
}
function segmentDistance(p, road) {
  const dx = road.bx - road.ax,
    dz = road.bz - road.az,
    t = Math.max(0, Math.min(1, ((p.x - road.ax) * dx + (p.z - road.az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - road.ax - t * dx, p.z - road.az - t * dz);
}

// Generator contract.
const off = runtime('?strategicInterception=1');
const on = runtime('?strategicInterception=1&frontLines=1');
const G = on.BattleScenarioGenerator,
  routes = on.BattleCommanderRoutes;
assert.equal(
  JSON.stringify(off.BattleScenarioGenerator.create('lines-0001', { profile: 'strategic' })),
  JSON.stringify(on.BattleScenarioGenerator.createStrategic('lines-0001', { profile: 'strategic' })),
  'without ?frontLines=1 the 5 km layout is unchanged'
);
assert.equal(
  off.BattleScenarioGenerator.create('lines-0001', { profile: 'strategic' }).frontLines,
  undefined
);
const flavors = new Set(),
  sites = new Set();
for (let n = 1; n <= 24; n++) {
  const seed = 'lines-' + String(n).padStart(4, '0'),
    a = G.create(seed, { profile: 'strategic' });
  assert.equal(JSON.stringify(a), JSON.stringify(G.create(seed, { profile: 'strategic' })), 'seeded replay');
  assert.equal(a.profile, 'strategic');
  assert.equal(a.map.width, 5000);
  assert.equal(a.objectives.length, 9, 'six bases and three line points');
  same(
    a.frontLines.lines.map(l => l.objectiveIds.length),
    [3, 1, 1, 1, 3],
    'five lines from base line to base line, one point per middle line'
  );
  same(a.frontLines.startOwners.meeting, ['us', 'us', null, 'ge', 'ge']);
  for (const f of ['us', 'ge']) {
    assert.equal(a.spawnZones[f].bases.length, 3);
    assert.equal(a.objectives.filter(o => o.baseFaction === f).length, 3);
  }
  const points = a.objectives.filter(o => !o.baseFaction);
  points.forEach((o, i) => {
    assert.equal(o.frontLine, i + 1);
    flavors.add(o.flavor);
    sites.add(i + ':' + o.siteIndex);
    if (i) assert.ok(o.z - points[i - 1].z > 700, 'lines run from the US rear to the German rear');
    const roads = a.roads.filter(r => r.fromObjectiveId === o.id || r.toObjectiveId === o.id);
    const behind = id => {
      const other = a.objectives.find(x => x.id === id);
      return other.frontLine;
    };
    for (const [side, rear] of [
      ['us', l => l < o.frontLine],
      ['ge', l => l > o.frontLine]
    ]) {
      const approaches = roads.filter(r =>
        rear(behind(r.fromObjectiveId === o.id ? r.toObjectiveId : r.fromObjectiveId))
      );
      if (o.frontLine === (side === 'us' ? 1 : 3))
        assert.ok(approaches.length >= 3, side + ' reaches its forward line from every base');
      else assert.ok(approaches.length >= 2, side + ' has a main and a side road into line ' + o.frontLine);
      assert.ok(approaches.some(r => r.frontLineRoad === 'main'));
    }
  });
  const towns = points.filter(o => o.flavor === 'town');
  assert.equal(a.settlements.length, towns.length, 'every town point gets a settlement');
  // Every base reaches every objective over generated roads.
  for (const base of a.spawnZones.us.bases.concat(a.spawnZones.ge.bases)) {
    const sq = { faction: base.id.slice(0, 2), home: base, homeBaseObjectiveId: base.objectiveId };
    for (const objective of a.objectives) {
      const route = routes.missionRouteFor(sq, a, objective.id, { x: base.x, z: base.z });
      for (const step of route)
        assert.ok(
          a.roads.some(r => segmentDistance(step, r) < 0.01),
          'waypoint on a road'
        );
    }
    const opening = routes.routeFor(sq, 'center', a, 0);
    const last = opening[opening.length - 1];
    assert.ok(
      Math.hypot(last.x - points[1].x, last.z - points[1].z) < 0.01,
      'squads open on the centre line'
    );
  }
}
assert.ok(flavors.size === 3, 'town, forest and open lines all occur');
assert.ok(sites.size >= 7, 'line points move between their seeded spots');

// Rules module against a deterministic objective system.
function world(defender, search = '?strategicInterception=1&frontLines=1') {
  const town = G.create('lines-0001', { profile: 'strategic' }),
    hooks = {},
    events = [],
    objectives = town.objectives.map(o => ({ id: o.id, def: o, state: { owner: 'neutral' } }));
  const root = {
    location: { search },
    BattleModules: {
      registerSystem: (id, api) => {
        hooks[id] = api;
      }
    },
    BattleTelemetry: { record: (kind, payload) => events.push({ kind, payload }) },
    BattleObjectiveSystem: {
      get: (sim, id) => objectives.find(o => o.id === id) || null,
      status: (sim, id) => {
        const o = objectives.find(x => x.id === id);
        return o ? { owner: o.state.owner } : null;
      },
      tick() {}
    }
  };
  loadModule(root, 'battle/modules/21b-strategic-front-lines.js');
  const squad = (f, x, z) => ({
    id: f + '-0',
    faction: f,
    members: [{ dead: false, root: { position: { x, z } } }]
  });
  const sim = {
    scene: { metadata: { battleScenario: town } },
    _sides: defender ? { defender } : { meeting: true },
    factions: { us: { squads: [squad('us', 0, -300)] }, ge: { squads: [squad('ge', 0, 300)] } }
  };
  hooks['strategic-front-lines'].onBattleStart(sim);
  const own = (id, f) => {
    objectives.find(o => o.id === id).state.owner = f;
  };
  return { root, sim, town, own, events, hooks, F: root.BattleFrontLines };
}
const m = world(null),
  [L1, L2, L3] = m.town.frontLines.lines.slice(1, 4).map(l => l.objectiveIds[0]);
same(
  m.town.objectives.map(o => m.root.BattleObjectiveSystem.status(m.sim, o.id).owner),
  ['us', 'us', 'us', 'ge', 'ge', 'ge', 'us', 'neutral', 'ge'],
  'meeting: bases and forward lines held, centre neutral'
);
assert.ok(m.events.some(e => e.kind === 'strategic-front-lines-seeded'));
for (const f of ['us', 'ge'])
  same(
    m.town.objectives.filter(o => m.F.attackable(m.sim, f, o.id)).map(o => o.id),
    [L2],
    f + ' may attack only the centre line'
  );
assert.equal(m.sim.factions.us.squads[0]._frontLineRear.objectiveId, L1, 'US rear point is its forward line');
assert.equal(
  m.sim.factions.ge.squads[0]._frontLineRear.objectiveId,
  L3,
  'German rear point is its forward line'
);
m.own(L2, 'us');
m.hooks['strategic-front-lines'].onCommanderTick(m.sim);
assert.ok(
  m.F.attackable(m.sim, 'us', L3) && !m.F.attackable(m.sim, 'us', 'strategic-obj-3'),
  'US moves on to the next line'
);
assert.ok(
  m.F.attackable(m.sim, 'ge', L2) && !m.F.attackable(m.sim, 'ge', L1),
  'Germans must retake the centre first'
);
assert.equal(
  m.sim.factions.us.squads[0]._frontLineRear.objectiveId,
  L2,
  'the captured line becomes the US rear point'
);
m.own('strategic-obj-1', 'ge');
same(
  m.town.objectives.filter(o => m.F.attackable(m.sim, 'us', o.id)).map(o => o.id),
  ['strategic-obj-1'],
  'a lost rear objective is retaken before anything further forward'
);
assert.ok(
  ['strategic-obj-0', 'strategic-obj-2'].includes(
    m.F.rearFor(m.sim, m.sim.factions.us.squads[0]).objectiveId
  ),
  'with the base line broken, the rear point is a base still held'
);
const g = world('ge');
assert.equal(
  g.root.BattleObjectiveSystem.status(g.sim, L2).owner,
  'ge',
  'a German defender holds the centre too'
);
same(
  g.town.objectives.filter(o => g.F.attackable(g.sim, 'us', o.id)).map(o => o.id),
  [L2],
  'the US attack opens on the centre'
);
const free = world(null, '?strategicInterception=1&frontLines=1&frontLineRule=0');
assert.ok(free.F.attackable(free.sim, 'us', L3), '?frontLineRule=0 lifts the next-line rule');

// After capture, retain one present squad at the exposed line. The rest may
// exploit forward; no squad is pulled back from a different mission or road.
{
  const w = world(null);
  w.own(L2, 'us');
  const o = w.town.objectives.find(o => o.id === L2);
  function guard(id, dx) {
    return { id, faction: 'us', state: 'advance',
      _macroMission: { intent: 'capture', objectiveId: L2, status: 'executing' },
      members: Array.from({ length: 6 }, () => ({ dead: false, root: { position: { x: o.x + dx, z: o.z } } })) };
  }
  const a = guard('us-a', 0), b = guard('us-b', 10);
  w.sim.factions.us.squads = [a, b];
  assert.equal(w.F.garrisonFor(w.sim, a).objectiveId, L2, 'the captured exposed line keeps a guard');
  assert.equal(w.F.garrisonFor(w.sim, b), null, 'one guard leaves the other squad free');
  a._macroMission.intent = 'defend';
  b.members.forEach(s => (s.root.position.x = o.x));
  a.members.forEach(s => (s.root.position.x = o.x + 15));
  assert.ok(w.F.garrisonFor(w.sim, a), 'closer arriving squads do not churn an established defender');
  w.sim.factions.us.squads.push(guard('us-c', 1000));
  a.state = 'retreat';
  assert.ok(w.F.garrisonFor(w.sim, b), 'a present replacement takes over from a retreating guard');
  const all = w.sim.factions.us.squads;
  w.sim.factions.us.squads = [b];
  assert.equal(w.F.garrisonFor(w.sim, b), null, 'the last active squad must not freeze the entire force on guard duty');
  w.sim.factions.us.squads = all;
  w.own(L3, 'us');
  assert.equal(w.F.garrisonFor(w.sim, b), null, 'advancing the front releases the old line');
  w.own(L2, 'ge');
  assert.equal(w.F.garrisonFor(w.sim, b), null, 'a lost line cannot retain a friendly garrison request');
}

// Defender's prepared lines.
const sidesRoot = {
  console: { log() {} },
  location: { search: '?log=0' },
  BattleModules: { registerSystem() {} }
};
loadModule(sidesRoot, 'battle/core-runtime.js', { console: quietConsole });
loadModule(sidesRoot, 'battle/modules/00-battle-sides.js', { console: quietConsole });
const S = sidesRoot.BattleSides;
assert.ok(S && S.build, 'battle sides loaded');
{
  const sides = S.build(m.town, { defender: 'ge' });
  assert.ok(sides.heldSectors.length >= 2, 'German defender prepares its lines');
  assert.equal(sides.heldSectors[0].objectiveId, L2, 'the front line is the security line');
  assert.equal(sides.heldSectors[1].objectiveId, L3);
  sides.heldSectors.forEach((s, i) =>
    assert.equal(
      s.fallbackSectorId,
      sides.heldSectors[i + 1] ? sides.heldSectors[i + 1].id : null,
      'each line falls back to the one behind'
    )
  );
  assert.ok(
    sides.heldSectors.every(
      s =>
        m.town.frontLines.startOwners.ge[m.town.objectives.find(o => o.id === s.objectiveId).frontLine] ===
        'ge'
    ),
    'only lines the defender holds at the start are prepared'
  );
}

// Split roads: a side's capture briefs on a line use both roads into it.
function splitWorld(search) {
  const w = world(null, search);
  w.root.BattleCommanderRoutes = routes;
  return w;
}
{
  const w = splitWorld('?strategicInterception=1&frontLines=1'),
    base = w.town.objectives.find(o => o.id === 'strategic-obj-2'),
    from = { x: base.x, z: base.z },
    a = { id: 'us-a', faction: 'us', state: 'advance' },
    b = { id: 'us-b', faction: 'us', state: 'advance' };
  w.sim.factions.us.squads = [a, b];
  const first = w.F.approachFor(w.sim, a, L2, from);
  assert.ok(first, 'two roads into the centre from US ground');
  a._macroMission = { intent: 'capture', objectiveId: L2, approachRoadId: first.roadId, status: 'executing' };
  const second = w.F.approachFor(w.sim, b, L2, from);
  assert.ok(second && second.roadId !== first.roadId, 'the next squad takes the other road');
  const entries = new Set([first.entryId, second.entryId]);
  assert.ok(
    entries.has(L1) && entries.has('strategic-obj-2'),
    'main road from line 1 and side road from the base'
  );
  for (const v of [first, second]) {
    assert.ok(
      !v.route.some(
        p =>
          Math.hypot(
            p.x - w.town.objectives.find(o => o.id === L2).x,
            p.z - w.town.objectives.find(o => o.id === L2).z
          ) < 8
      ),
      'never through the goal'
    );
    for (const p of v.route)
      assert.ok(
        w.town.roads.some(r => segmentDistance(p, r) < 0.01),
        'split route stays on roads'
      );
  }
  assert.equal(w.F.approachFor(w.sim, a, L2, from).roadId, first.roadId, 'a re-issued brief keeps its road');
  assert.equal(
    w.F.approachFor(w.sim, a, L3, from).entryId,
    L1,
    'one road from held ground into line 3: taken and counted'
  );
  const far = w.town.objectives.find(o => o.id === 'strategic-obj-0');
  assert.equal(
    w.F.approachFor(w.sim, b, L2, { x: far.x, z: far.z }).entryId,
    L1,
    'a squad that passes line 1 is not sent back to the side road'
  );
  const off = splitWorld('?strategicInterception=1&frontLines=1&splitRoads=0');
  assert.equal(off.F.approachFor(off.sim, a, L2, from), null, '?splitRoads=0 keeps the shortest road');
}

// A squad a truck left out on the side road, short of the centre, goes on from there (Ivan's
// 10-19 export: re-briefed on the same objective, us-2 walked back to its base to "enter" the
// side road). ?roadFromHere=0 restores the walk back.
{
  const goal = id => (w, x) => w.town.objectives.find(o => o.id === x || o.id === id);
  for (const [search, back] of [
    ['?strategicInterception=1&frontLines=1', false],
    ['?strategicInterception=1&frontLines=1&roadFromHere=0', true]
  ]) {
    const w = splitWorld(search),
      side = w.town.roads.find(
        r =>
          (r.fromObjectiveId === 'strategic-obj-2' && r.toObjectiveId === L2) ||
          (r.toObjectiveId === 'strategic-obj-2' && r.fromObjectiveId === L2)
      ),
      base = goal('strategic-obj-2')(w),
      centre = goal(L2)(w),
      atBase = r => (r.fromObjectiveId === 'strategic-obj-2' ? 0 : 1),
      t = Math.abs(atBase(side) - 0.85),
      dropped = { x: side.ax + t * (side.bx - side.ax) + 6, z: side.az + t * (side.bz - side.az) },
      sq = { id: 'us-a', faction: 'us', state: 'advance' };
    w.sim.factions.us.squads = [sq];
    const v = w.F.approachFor(w.sim, sq, L2, dropped),
      walked = v
        ? v.route.concat([centre]).reduce((acc, p, i, all) => {
            const prev = i ? all[i - 1] : dropped;
            return acc + Math.hypot(p.x - prev.x, p.z - prev.z);
          }, 0)
        : 0,
      straight = Math.hypot(centre.x - dropped.x, centre.z - dropped.z);
    assert.ok(v, 'a road from held ground');
    assert.equal(
      v.route.some(p => Math.hypot(p.x - base.x, p.z - base.z) < 8),
      back,
      back ? '?roadFromHere=0: back through the base' : 'never back to the base'
    );
    if (!back) {
      assert.equal(v.roadId, side.id, 'keeps the road it stands on');
      assert.ok(walked < straight + 20, 'goes straight on to the centre');
    }
  }
}

// A truck that dropped its squad short of the centre on the side road, re-claimed for the same
// objective, drives on from where it stands (Ivan's 10-19 export on 74e3da2: ge-2 and us-1
// "turned around after loading back up"; the truck drove back to the base end of its road and
// down again to the same spot). From 180 m out that leaves no ride worth taking, so the squad
// walks on. ?truckOnRoad=0 restores the round trip.
for (const [extra, roundTrip] of [
  ['', false],
  ['&truckOnRoad=0', true]
]) {
  const w = splitWorld('?strategicInterception=1&frontLines=1&motorTransport=1' + extra),
    hooks = {};
  Object.assign(w.root, {
    GTLog() {},
    BattleModules: { registerSystem: (id, api) => (hooks[id] = api) },
    BattleNavigation: { movementClear: () => true, invalidateNavPath() {} }
  });
  loadModule(w.root, 'battle/modules/58-strategic-abstract-transport.js', { console: quietConsole });
  w.sim.heightAt = () => 0;
  w.sim.time = 400;
  hooks['strategic-abstract-transport'].onBattleStart(w.sim);
  const obj = id => w.town.objectives.find(o => o.id === id),
    base = obj('strategic-obj-2'),
    centre = obj(L2),
    side = w.town.roads.find(
      r => [r.fromObjectiveId, r.toObjectiveId].sort().join() === ['strategic-obj-2', L2].sort().join()
    ),
    len = Math.hypot(side.bx - side.ax, side.bz - side.az),
    k = side.fromObjectiveId === L2 ? 200 / len : 1 - 200 / len,
    stop = { x: side.ax + k * (side.bx - side.ax), z: side.az + k * (side.bz - side.az) },
    truck = w.sim._strategicTransportFleet.vehicles.find(v => v.faction === 'us');
  Object.assign(truck, {
    phase: 'stopped',
    position: { ...stop },
    heading: { x: (centre.x - stop.x) / 200, z: (centre.z - stop.z) / 200 }
  });
  const sq = {
    id: 'us-a',
    faction: 'us',
    state: 'advance',
    inContact: false,
    members: Array.from({ length: 6 }, (_, i) => ({
      id: i,
      dead: false,
      suppressedUntil: 0,
      root: { position: { x: stop.x + (i % 3) * 2, z: stop.z + Math.floor(i / 3) * 2, y: 0 } }
    }))
  };
  w.sim.factions.us.squads = [sq];
  const mission = {
    owner: 'force-command',
    version: 2,
    status: 'issued',
    intent: 'capture',
    objectiveId: L2,
    approachRoadId: side.id,
    point: { x: centre.x, z: centre.z },
    route: []
  };
  const quote = w.root.BattleSquadTransport.quoteMission(w.sim, sq, mission);
  if (roundTrip) {
    assert.ok(quote, '?truckOnRoad=0: the truck is claimed again');
    assert.ok(
      quote.route.path.some(p => Math.hypot(p.point.x - base.x, p.point.z - base.z) < 40),
      '?truckOnRoad=0: back to the base end of the road and down again'
    );
  } else
    assert.equal(quote, null, 'no truck ride back to base and down again; the squad walks the last 180 m');
}

// A line changing hands earns each General one new sortie.
function sortieWorld(search) {
  const w = world(null, search);
  loadModule(w.root, 'battle/modules/59-strategic-aerial-recon.js', { console: quietConsole });
  w.sim.time = 80;
  w.sim.macroCommandEnabled = true;
  w.sim.factions.us.squads[0]._macroMission = {
    owner: 'force-command',
    status: 'executing',
    intent: 'capture'
  };
  return w;
}
{
  const w = sortieWorld('?strategicInterception=1&frontLines=1&aerialRecon=1&interception=1'),
    R = w.root.BattleAerialRecon,
    own = () => w.sim._strategicAerialRecon.us;
  R.request(w.sim, 'us');
  assert.ok(own().used && own().pass, 'the first sortie launches');
  own().pass = null;
  R.request(w.sim, 'us');
  assert.ok(!own().pass, 'no second sortie while the front stands');
  w.own(L1, 'neutral');
  R.request(w.sim, 'us');
  assert.ok(!own().pass, 'a line being neutralised has not changed hands yet');
  w.own(L1, 'us');
  w.own(L2, 'us');
  R.request(w.sim, 'us');
  assert.ok(own().pass && own().sorties === 2, 'the centre changing hands earns a new sortie');
  assert.ok(w.events.some(e => e.kind === 'strategic-aerial-recon-rearmed'));
  own().pass = null;
  R.request(w.sim, 'us');
  assert.ok(!own().pass, 'one sortie per change');
  const off = sortieWorld('?strategicInterception=1&frontLines=1&aerialRecon=1&interception=1&lineSortie=0');
  off.root.BattleAerialRecon.request(off.sim, 'us');
  off.sim._strategicAerialRecon.us.pass = null;
  off.own(L2, 'us');
  off.root.BattleAerialRecon.request(off.sim, 'us');
  assert.ok(!off.sim._strategicAerialRecon.us.pass, '?lineSortie=0 keeps one sortie per battle');
}

// Air-recon corridors: a watch point where the column leaves its trucks short of the next line.
function corridors(search, layout) {
  const r = { location: { search }, GTLog() {}, BattleModules: { registerSystem() {} } };
  loadModule(r, 'battle/modules/58-strategic-abstract-transport.js', { console: quietConsole });
  loadModule(r, 'battle/modules/59-strategic-aerial-recon.js', { console: quietConsole });
  const road = layout.roads.find(
    x => x.fromObjectiveId === 'strategic-obj-4' && x.toObjectiveId === 'strategic-obj-8'
  );
  assert.ok(road, 'a German base road into line 3');
  const len = Math.hypot(road.bx - road.ax, road.bz - road.az),
    contact = {
      squadId: 'ge-0',
      x: road.ax + (road.bx - road.ax) * 0.3,
      z: road.az + (road.bz - road.az) * 0.3,
      headingRadians: Math.atan2(road.bx - road.ax, road.bz - road.az),
      speedMps: 9,
      speedUncertaintyMps: 1,
      positionUncertaintyM: 40
    };
  assert.ok(len > 300);
  return {
    list: r.BattleAerialRecon.corridorsFor(layout, contact, 'us'),
    dismount: r.BattleSquadTransport.tuning.dismountMetres
  };
}
{
  const town = G.create('lines-0001', { profile: 'strategic' }),
    centre = town.objectives.find(o => o.id === 'strategic-obj-7'),
    flags = '?strategicInterception=1&frontLines=1&interception=1',
    near = (c, d) =>
      c.hop === 1 &&
      c.likelyObjectiveId === 'strategic-obj-7' &&
      Math.abs(Math.hypot(c.point.x - centre.x, c.point.z - centre.z) - d) < 1;
  const on = corridors(flags, town);
  assert.ok(
    on.list.some(c => near(c, on.dismount)),
    'a watch point where the column must dismount short of the centre'
  );
  const off = corridors(flags + '&lineApproachPost=0', town);
  assert.ok(
    !off.list.some(c => near(c, off.dismount)),
    '?lineApproachPost=0 keeps the 1/3 and 2/3 points only'
  );
  const plain = corridors(flags, Object.assign({}, town, { frontLines: undefined }));
  assert.ok(!plain.list.some(c => near(c, plain.dismount)), 'the ring layout is untouched');
}
console.log(
  'PASS front-lines layout, next-line rule, start ownership, held-line rear point, prepared lines, line approach posts, split roads, trucks on the road in, line sorties'
);
