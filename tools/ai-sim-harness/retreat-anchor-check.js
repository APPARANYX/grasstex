#!/usr/bin/env node
'use strict';
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
/* Phase 2 retreat-anchor stability.

   v278's retreat loop repeatedly moved legal formation endpoints while the men made little net progress.
   The Squad Leader now leases one retreat anchor while it is useful. This check proves:
   - many retreat command ticks keep one stable anchor and coalesce identical fireteam intents;
   - measured no-progress replaces the anchor with a bounded recovery endpoint instead of pushing it farther away;
   - useful progress renews the commitment, and arrival advances the anchor in material steps;
   - a materially changed retreat goal invalidates the old lease immediately.

   The movement resolver remains the physical endpoint arbiter; this check moves men toward its published
   orderDestination rather than bypassing it. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
function load(r, p) {
  return loadModule(r, p, { console: quietConsole });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const SEED = +(process.env.HARNESS_SEED || 12345);
function fixture() {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {};
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    getSystem(id) {
      return systems[id];
    },
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8, captureCommitRatio: 0.82 };
    }
  };
  load(r, 'battle/movement-resolver.js');
  loadSquadCommandStack(load, r);
  const b = H.makeBattle(r, { seed: SEED });
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 120,
    objective: { x: 0, z: 300 },
    seed: SEED
  });
  q.home = { x: 0, z: 0 };
  q.baseHome = { x: 0, z: 0 }; // fixture setup: this is the squad's original rear base
  q.orderAnchor = { x: 0, z: 120 };
  q.rally = { x: 0, z: 120 };
  q._orderGoal = { x: 0, z: 120 };
  q.members.forEach((s, i) => {
    s.root.position.x = (i % 2 ? -1 : 1) * (1 + i * 0.15);
    s.root.position.z = 120 + (i % 3);
  });
  /* Keep five survivors so this fixture exercises the ordinary squad-retreat anchor, not the
     1-4-man extraction path. Stress holds the already-retreating squad below its morale-rally gate. */
  q.members.slice(5).forEach(s => {
    s.dead = true;
  });
  q.state = 'retreat';
  q.mind = { mean: 0.5, n: 5, max: 0.5 };
  return { r, b, q, L: r.BattleLeases, S: r.BattleSquadStability, systems };
}
function p(v) {
  return v ? { x: +v.x, z: +v.z } : null;
}
function d(a, b) {
  return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
}
function live(q) {
  return q.members.filter(s => !s.dead);
}
function centre(q) {
  const a = live(q);
  return {
    x: a.reduce((n, s) => n + s.root.position.x, 0) / a.length,
    z: a.reduce((n, s) => n + s.root.position.z, 0) / a.length
  };
}
function command(w, dt = 0.45) {
  w.b.time += dt;
  w.r.SquadAI.updateSquad(w.q, w.b);
  return p(w.q.orderAnchor);
}
function moveTowardOrders(w, metres) {
  for (const s of live(w.q)) {
    const g = s.orderDestination;
    if (!g) continue;
    const dx = g.x - s.root.position.x,
      dz = g.z - s.root.position.z,
      len = Math.hypot(dx, dz);
    if (len < 1e-9) continue;
    const step = Math.min(metres, len);
    s.root.position.x += (dx / len) * step;
    s.root.position.z += (dz / len) * step;
  }
}
test('a 1-4 man remnant extracts straight home and never recentres on a lagging survivor', () => {
  const w = fixture();
  /* Cross the shared remnant boundary and recreate GE-0's geometry: one man is already far toward home,
     two are in the middle, and one is still far forward. Tactical cohesion is intentionally awful. */
  const men = live(w.q);
  men[4].dead = true;
  w.q.mind = { mean: 0.5, n: 4, max: 0.5 };
  const a = live(w.q);
  a[0].root.position.z = 32;
  a[1].root.position.z = 78;
  a[2].root.position.z = 118;
  a[3].root.position.z = 156;
  w.q._regroupRecovery = { serial: 9, startedAt: w.b.time, anchor: { x: 0, z: 94 } };
  w.q.orderAnchor = { x: 0, z: 118 };
  w.q.rally = { x: 0, z: 118 };
  const home = { x: 0, z: 0 };
  for (let tick = 0; tick < 24; tick++) {
    command(w, 0.45);
    assert.equal(w.q.state, 'retreat');
    assert.ok(w.r.SquadAI.isExtractionToHome(w.q), 'the four-man squad stays in extraction state');
    assert.deepEqual(p(w.q.orderAnchor), home, 'the squad anchor is home, never a midpoint');
    assert.equal(
      w.L.get(w.q, 'retreat-anchor'),
      null,
      'tiny extraction holds no sliding retreat-anchor lease'
    );
    assert.equal(w.q._regroupRecovery, null, 'old tactical regroup recovery is discarded');
    for (const man of live(w.q)) {
      assert.deepEqual(p(man.orderDestination), home, 'every survivor is independently ordered home');
      assert.deepEqual(p(man._fireteamDestination), home, 'no formation slot replaces the homeward intent');
    }
    /* Three survivors make progress; the forward straggler is effectively frozen/dazed for the whole
       interval. His presence must never pull the men already rearward back toward him. */
    for (let i = 0; i < 3; i++) {
      const man = a[i],
        z = man.root.position.z;
      man.root.position.z = Math.max(0, z - 2.5);
    }
  }
  assert.ok(a[0].root.position.z < a[1].root.position.z, 'the leading survivor is allowed to stay far ahead');
  assert.equal(a[3].root.position.z, 156, 'the delayed survivor may lag without becoming a rally point');
});
test('five-man strategic prepared garrison retreats toward rear base, not forward post', () => {
  const w = fixture(),
    base = { x: 700, z: 1000 },
    sectorFallback = { x: 5, z: 108 };
  /* ge-4 replay: five survivors remain above the remnant cutoff; initial prepared
     deployment rewrote tactical home near objective 11, 1+ km from the real base. */
  w.q.home = sectorFallback;
  w.q.baseHome = base;
  w.q.homeBaseId = 'ge-base-1';
  assert.equal(w.r.SquadAI.isExtractionToHome(w.q), false);
  assert.deepEqual(p(w.r.SquadAI.retreatGoal(w.q)), base, 'ordinary strategic retreat goes to base');
  const first = command(w);
  const lease = w.L.get(w.q, 'retreat-anchor');
  assert.ok(lease && lease.data);
  assert.deepEqual(p(lease.data.goal), base, 'leased retreat path has rear-base destination');
  assert.ok(first.x > 0 && first.z > 120, 'first physical stride moves rearward, not to forward fallback');

  /* The existing compact-map contract remains a retreat to the prepared sector
     fallback for ordinary squads; 1-4 man remnants extract to base separately. */
  w.q.homeBaseId = null;
  assert.deepEqual(p(w.r.SquadAI.retreatGoal(w.q)), sectorFallback);
  command(w);
  assert.deepEqual(p(w.L.get(w.q, 'retreat-anchor').data.goal), sectorFallback);
});
test('many retreat ticks keep one leased useful anchor and coalesce identical urgent intents', () => {
  const w = fixture(),
    T = w.S.tuning.retreatAnchor;
  const first = command(w);
  assert.equal(w.q.state, 'retreat');
  const lease = w.L.get(w.q, 'retreat-anchor');
  assert.ok(lease && lease.owner === 'squad-leader');
  assert.equal(lease.data.reason, 'retreat start');
  assert.ok(Math.abs(first.z - 107) < 1.5, 'first endpoint is one 13 m retreat stride, got ' + first.z);
  /* Stay inside the lease without moving: the Meso endpoint must not walk away every tick. */
  const ticks = Math.floor((T.lease - 0.7) / 0.45);
  for (let i = 0; i < ticks; i++) assert.ok(d(command(w), first) < 1e-9, 'anchor changed inside its lease');
  const st = w.b._squadCommandPublishStats;
  assert.ok(st.intentChecks > 0);
  assert.ok(
    st.intentCoalesced > st.intentPublishes,
    'repeated urgent retreat intents are coalesced: ' + JSON.stringify(st)
  );
  /* Once measured no-progress expires the lease, recovery rebases from the men and uses a shorter stride. */
  while (w.b.time < lease.data.lastProgressAt + T.noProgress + 0.6) command(w);
  const next = p(w.q.orderAnchor),
    held = w.L.get(w.q, 'retreat-anchor');
  assert.equal(held.data.reason, 'no retreat progress');
  assert.ok(d(next, first) > 3, 'recovery materially replaces the stale endpoint');
  assert.ok(
    d(centre(w.q), next) < d(centre(w.q), first),
    'recovery pulls the endpoint back into useful reach'
  );
});
test('useful retreat progress renews the lease; arrival advances in material steps with far fewer destination changes than ticks', () => {
  const w = fixture(),
    start = centre(w.q),
    anchors = [];
  for (let i = 0; i < 36; i++) {
    const a = command(w);
    if (!anchors.length || d(a, anchors[anchors.length - 1]) > 0.05) anchors.push(a);
    moveTowardOrders(w, 1.6);
  }
  const end = centre(w.q),
    travel = d(start, end),
    st = w.b._squadCommandPublishStats,
    living = live(w.q).length;
  assert.ok(travel > 28, 'retreat makes useful net progress: ' + travel.toFixed(1) + ' m');
  assert.ok(anchors.length >= 2, 'arrival advances to another leased anchor');
  for (let i = 1; i < anchors.length; i++)
    assert.ok(d(anchors[i - 1], anchors[i]) > 3, 'anchor changes are material');
  assert.ok(
    st.intentPublishes < st.intentChecks * 0.45,
    'destination changes are coalesced: ' + JSON.stringify(st)
  );
  assert.ok(
    st.intentCoalesced > st.intentPublishes,
    'most repeated retreat requests do not rewrite endpoints'
  );
  console.log(
    '  retreat stability: ' +
      anchors.length +
      ' anchor goals, ' +
      st.intentPublishes +
      ' publishes / ' +
      st.intentChecks +
      ' checks, ' +
      travel.toFixed(1) +
      ' m net travel, ' +
      living +
      ' men'
  );
});
test('a materially changed retreat goal invalidates the old lease immediately', () => {
  const w = fixture(),
    first = command(w),
    old = w.L.get(w.q, 'retreat-anchor');
  w.q.home = { x: 80, z: 0 };
  const next = command(w),
    held = w.L.get(w.q, 'retreat-anchor');
  assert.notEqual(held, old);
  assert.equal(held.data.reason, 'retreat goal moved');
  assert.ok(d(next, first) > 3);
  assert.deepEqual(held.data.goal, { x: 80, z: 0 });
});
test('a majority physically blocked on the leased endpoint gets one bounded recovery rebase, not one every tick', () => {
  const w = fixture(),
    first = command(w);
  live(w.q)
    .slice(0, 3)
    .forEach(s => {
      s._movementStopReason = 'path-blocked';
    });
  const next = command(w),
    held = w.L.get(w.q, 'retreat-anchor');
  assert.equal(held.data.reason, 'route blocked');
  assert.ok(d(next, first) > 3);
  assert.ok(
    d(centre(w.q), next) < 13,
    'recovery uses the half-stride instead of pushing the anchor another full stride'
  );
  for (let i = 0; i < 6; i++)
    assert.ok(d(command(w), next) < 1e-9, 'persistent blocked flags do not churn the recovery anchor');
});
function settleAtSlotOffset(w, arrived) {
  command(w);
  const a = p(w.q.orderAnchor),
    men = live(w.q);
  /* every man stands at his own slot, whose mean sits 6.5 m from the anchor (a lone rifleman's offset) */
  men.forEach((s, i) => {
    s.root.position.x = a.x + 6.5 + (i % 2 ? -0.4 : 0.4);
    s.root.position.z = a.z;
    s._movementStopReason = arrived ? 'arrived' : 'moving';
  });
  for (let i = 0; i < 8; i++) command(w, 0.45);
  return w.L.get(w.q, 'retreat-anchor');
}
test('men who all arrived at their slots count as having reached the anchor despite the slot offset', () => {
  const held = settleAtSlotOffset(fixture(), true);
  assert.equal(held.data.reason, 'anchor reached', 'got ' + held.data.reason);
});
test('a slot offset alone is not arrival while any man is still walking, and ?retreatArrival=0 restores the old test', () => {
  // Walking men near their slots now get the next stride (?retreatStride, below); the whole-squad test is
  // the one this guards.
  const saved = global.location;
  global.location = { search: '?retreatStride=0' };
  try {
    const walking = settleAtSlotOffset(fixture(), false);
    assert.notEqual(walking.data.reason, 'anchor reached');
  } finally {
    global.location = saved;
  }
  global.location = { search: '?retreatArrival=0&retreatStride=0' };
  try {
    const w = fixture();
    // module flag is read at load time, so fixture() above loaded it under the flag
    const held = settleAtSlotOffset(w, true);
    assert.notEqual(held.data.reason, 'anchor reached');
  } finally {
    global.location = saved;
  }
});
// Ivan's 10-19 report: retreating men "run a bit, then stop, then run". The leading man stood at his slot
// until the whole squad had closed on the anchor. The next stride now comes once one man is within the
// march arrival radius of his slot while the centre is within a stride; ?retreatStride=0 restores waiting
// for the whole squad.
function leadAtSlot(w) {
  command(w);
  const a = p(w.q.orderAnchor),
    men = live(w.q);
  // The squad closes on the anchor (progress), then its first man comes within 8 m of his slot.
  for (const [lead, rest] of [
    [11, 12],
    [6, 9]
  ]) {
    men.forEach((s, i) => {
      s.root.position.x = a.x + (i === 0 ? lead : rest);
      s.root.position.z = a.z;
      s.orderDestination = { x: a.x, z: a.z };
      s._movementStopReason = 'moving';
    });
    command(w, 0.45);
  }
  return w.L.get(w.q, 'retreat-anchor');
}
test('the next retreat stride comes as the first man nears his slot, and ?retreatStride=0 waits for the squad', () => {
  assert.equal(leadAtSlot(fixture()).data.reason, 'anchor reached');
  const saved = global.location;
  global.location = { search: '?retreatStride=0' };
  try {
    assert.notEqual(leadAtSlot(fixture()).data.reason, 'anchor reached');
  } finally {
    global.location = saved;
  }
});
test('a squad strung out more than a stride behind its anchor still waits for the centre', () => {
  const w = fixture();
  command(w);
  const a = p(w.q.orderAnchor);
  live(w.q).forEach((s, i) => {
    s.root.position.x = a.x + (i === 0 ? 0.5 : 40);
    s.root.position.z = a.z;
    s.orderDestination = { x: a.x, z: a.z };
    s._movementStopReason = i === 0 ? 'arrived' : 'moving';
  });
  command(w, 0.45);
  assert.notEqual(w.L.get(w.q, 'retreat-anchor').data.reason, 'anchor reached');
});
// Terrain-aware actual movement proof. No synthetic _movementStopReason assignment:
// the shipping stepMovement integrator determines physical arrival at the committed
// individual goal, and real navigation plans the subsequent route around an obstacle.
test('terrain obstacle: genuinely arrived retreat slots allow anchor stride and legal onward path', () => {
  const w = fixture(),
    b = w.b;
  load(w.r, 'battle/battle-navigation.js');
  load(w.r, 'battle/modules/39-navigation-physicality-debug.js');
  const N = w.r.BattleNavigation;
  b.scene = { metadata: { battleScenario: { buildings: [] } } };
  b.obstacles = [];
  b.obstacles.__physicalFootprints = [
    {
      id: 'rally-hedge',
      type: 'hedge',
      shape: 'obb',
      x: 4,
      z: 85,
      hx: 2.1,
      hz: 8,
      ux: 1,
      uz: 0,
      vx: 0,
      vz: 1
    }
  ];
  b.heightAt = (x, z) => Math.sin(x / 15) * 0.4 + Math.cos(z / 19) * 0.6;
  N.installScenario(b.scene.metadata.battleScenario);
  w.systems['navigation-physicality-debug'].onBattleStart(b);
  const anchor = command(w);
  for (const s of live(w.q)) {
    s.root.position.x = anchor.x + 6.5;
    s.root.position.z = anchor.z;
    const assigned = { x: s.root.position.x, z: s.root.position.z };
    s.destination = { ...assigned };
    s.orderDestination = { ...assigned };
    H.stepMovement(b, s, 0.15);
    assert.equal(
      s._movementStopReason,
      'arrived',
      'physical step reports arrival at its actual committed slot'
    );
    assert.ok(N.movementClear(assigned, assigned), 'arrival lies outside the hedge body');
  }
  const old = p(w.q.orderAnchor),
    oldGoal = p(w.q.home);
  const updated = command(w);
  assert.ok(d(old, updated) > 5, 'genuine slot arrivals advance the retreat anchor by a physical stride');
  const start = p(live(w.q)[0].root.position);
  const path = w.r.BattleNavigationPhysicality.planPath(b, start, oldGoal);
  assert.ok(path.length > 0, 'onward route around hedge is available');
  const fp = b.obstacles.__physicalFootprints[0];
  assert.ok(
    path.every(
      (q, i) =>
        !w.r.BattleNavigationPhysicality.shapeHit(
          i ? path[i - 1] : start,
          q,
          fp,
          w.r.BattleNavigationPhysicality.routeMargin
        )
    ),
    'planned route never intersects hedge'
  );
});

console.log('retreat-anchor-check: ' + n + ' passed');
