#!/usr/bin/env node
'use strict';
/* Squad reconstitution (commander-ai.js reconstitute + the Squad Leader's assembly march): retreated squads
   form a survivor pool at home. Only true 1-4-man remnants enter it; 5+ survivors remain a viable squad
   and use normal morale recovery. Nearby remnants totaling at least six men may form an understrength squad.
   Their rendezvous starts at the geometric centre of their real positions, then slides toward the front only
   inside a 15% travel-detour budget. They merge under one leader and are re-tasked by the General. Runs the shipping
   squad, engagement, resolver, Squad Leader and General code with no enemy on the field. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
function load(r, p, search) {
  new Function('window', 'globalThis', 'console', 'location', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(
    r,
    r,
    { log() {}, warn() {} },
    search == null ? undefined : { search }
  );
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}

const C_TICK = 0.45,
  HOME_Z = -500,
  FORWARD = 150,
  LANES = [-300, -100, 100, 300, 500];
function world(opts) {
  opts = opts || {};
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    systems = {},
    events = [];
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    getSystem(id) {
      return systems[id];
    },
    runHook() {},
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  r.BattleSim = { start() {} };
  load(r, 'battle/commander-doctrine.js');
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  load(r, 'battle/modules/22-commander-reconstitution.js');
  load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/15a-squad-leader-fire-control.js', opts.search);
  load(
    r,
    'battle/modules/15b-squad-leader-buddy-pairs.js',
    'battle/modules/15c-squad-leader-scouts-forward.js',
    opts.search
  );
  load(r, 'battle/modules/15c-squad-leader-scouts-forward.js', opts.search);
  load(r, 'battle/modules/15d-squad-leader-leaderless-intent.js');
  load(r, 'battle/modules/15e-squad-leader-morale-coa.js');
  load(r, 'battle/modules/15f-squad-leader-retreat-anchor.js');
  load(r, 'battle/modules/15g-squad-leader-formation.js');
  load(r, 'battle/modules/15h-squad-leader-fireteams.js');
  load(r, 'battle/modules/15i-squad-leader-clear-contact.js');
  load(r, 'battle/modules/15j-squad-leader-fire-and-movement.js');
  load(r, 'battle/modules/15k-squad-leader-reconstitution.js');
  load(r, 'battle/modules/15l-squad-leader-mission-execution.js');
  load(r, 'battle/modules/15m-squad-leader-cohesion-regroup.js');
  load(r, 'battle/modules/16-squad-plan-stability.js', opts.search);
  const b = H.makeBattle(r);
  b.macroCommandEnabled = opts.macro !== false;
  b.scene = { metadata: {} };
  return { r, b, leader: systems['squad-command'], events, sq: [] };
}
/* A squad spawned at its lane's home, walked `forward` metres out (default 150), then cut down to
   `alive` men. `keep` picks which roles survive (default: the leader first, then riflemen). */
function squad(w, lane, alive, keep, forward) {
  const q = H.addSquad(w.r, w.b, {
    id: 'us-' + lane,
    faction: 'us',
    x: LANES[lane],
    z: HOME_Z,
    objective: { x: LANES[lane], z: 0 }
  });
  q.route = [];
  q.commandRole = 'center';
  q.members.forEach(s => {
    s.root.position.z += forward == null ? FORWARD : forward;
    s.destination = { x: s.root.position.x, z: s.root.position.z };
  });
  const order = keep || [
    'sergeant',
    'rifleman',
    'rifleman',
    'rifleman',
    'rifleman',
    'rifleman',
    'rifleman',
    'scout',
    'scout',
    'gunner'
  ];
  const survivors = [];
  order.forEach(role => {
    const s = q.members.find(m => m.role === role && !survivors.includes(m));
    if (s && survivors.length < alive) survivors.push(s);
  });
  q.members.forEach(s => {
    if (!survivors.includes(s)) w.b.killSoldier(s, null);
  });
  w.sq.push(q);
  return q;
}
function run(w, seconds, onTick) {
  const C = w.r.BattleCommanderAI;
  let acc = 0;
  H.run(w.r, w.b, seconds, function (b) {
    acc += H.AI_TICK;
    if (acc >= C.commandTick - 1e-9) {
      acc = 0;
      C.update(b, null, C.commandTick);
      w.leader.onCommanderTick(b, { town: null });
    }
    if (onTick) onTick(b);
  });
}
const living = q => q.members.filter(s => !s.dead);
const recon = w =>
  w.r.BattleCommanderAI.missionState(w.b).reconstitution || {
    active: [],
    ended: [],
    merges: 0,
    groupsFormed: 0,
    groupsDissolved: 0,
    promotions: 0
  };
function invariants(w, expectAlive) {
  const seen = new Set();
  w.b.factions.us.squads.forEach(q =>
    q.members.forEach(s => {
      assert.ok(!seen.has(s.id) || s.dead, 'soldier ' + s.id + ' is in two squads');
      seen.add(s.id);
    })
  );
  w.b._roster.us
    .filter(s => !s.dead)
    .forEach(s =>
      assert.ok(s.squad.members.includes(s), 'living soldier ' + s.id + ' belongs to his own squad')
    );
  assert.equal(w.b.factions.us.alive, expectAlive, "merging never changes the side's alive count");
}
/* Run until the General has planned a group; returns it with every grouped squad's distance from home
   at that moment. */
function untilGrouped(w, limit) {
  let seen = null;
  for (let t = 0; t < limit && !seen; t += C_TICK)
    run(w, C_TICK, () => {
      const g = recon(w).active[0];
      if (g && !seen)
        seen = {
          group: g,
          time: w.b.time,
          homeDist: g.squads.map(id => {
            const q = w.sq.find(x => x.id === id),
              p = w.r.BattleCommanderDoctrine.avgPos(q);
            return Math.hypot(p.x - q.home.x, p.z - q.home.z);
          }),
          atBase: g.squads.map(id => w.sq.find(x => x.id === id)._assembly.phase)
        };
    });
  assert.ok(seen, 'no group planned within ' + limit + 's');
  return seen;
}
function merged(w) {
  const m = w.b.factions.us.squads.filter(q => q.reconstitutedFrom);
  assert.equal(m.length, 1, 'exactly one re-formed squad');
  return m[0];
}

test('a prepared defender remnant extracts to its immutable base, not its in-field tactical home', () => {
  const w = world(),
    q = squad(w, 0, 4),
    base = { x: q.baseHome.x, z: q.baseHome.z },
    tactical = { x: q.home.x + 80, z: q.home.z + 220 };
  q.home = tactical;
  q.state = 'retreat';
  run(w, 90);
  const p = w.r.BattleCommanderDoctrine.avgPos(q);
  assert.ok(
    q._assembly && q._assembly.phase === 'at-base',
    'the tiny defender remnant enters the survivor pool'
  );
  assert.ok(Math.hypot(p.x - base.x, p.z - base.z) <= 20, 'the remnant reaches the rear base');
  assert.ok(
    Math.hypot(p.x - tactical.x, p.z - tactical.z) > 100,
    'it is not stranded at the tactical garrison fallback'
  );
});

test('three four-man remnants rebuild the nearest pair and leave the third in the pool', () => {
  const w = world();
  [0, 1, 2].forEach(l => squad(w, l, 4));
  let homeFirst = true;
  const published = [],
    S = w.r.BattleSquadStability,
    real = S.reform;
  S.reform = function (sq, men, leader, p) {
    const out = real.apply(this, arguments);
    published.push({
      squad: sq.id,
      at: w.b.time,
      p: { x: p.x, z: p.z },
      anchor: { x: sq.orderAnchor.x, z: sq.orderAnchor.z },
      rally: { x: sq.rally.x, z: sq.rally.z }
    });
    return out;
  };
  run(w, 420, () =>
    w.sq.forEach(q => {
      if (q._assembly && q._assembly.phase === 'to-rally' && !q._sawRally) {
        q._sawRally = true;
        const p = w.r.BattleCommanderDoctrine.avgPos(q);
        if (Math.abs(p.z - HOME_Z) > 20) homeFirst = false;
      }
    })
  );
  const st = recon(w),
    q = merged(w),
    rally = st.ended.find(g => g.status === 'merged').rally,
    handed = published.filter(
      x =>
        x.squad === q.id &&
        Math.hypot(x.p.x - rally.x, x.p.z - rally.z) < 1e-9 &&
        Math.hypot(x.anchor.x - rally.x, x.anchor.z - rally.z) < 1e-9 &&
        Math.hypot(x.rally.x - rally.x, x.rally.z - rally.z) < 1e-9
    );
  assert.equal(handed.length, 1, 'the Squad Leader publishes the rebuilt squad once at the group rally');
  assert.equal(st.groupsFormed, 1);
  assert.equal(st.merges, 1);
  assert.ok(homeFirst, 'no remnant turns for the rendezvous before reaching base');
  assert.equal(living(q).length, 8);
  assert.equal(q.reconstitutedFrom.length, 2);
  assert.equal(living(q).filter(s => w.r.SquadAI.isLeader(s)).length, 1, 'exactly one leader');
  assert.notEqual(q.state, 'retreat', 'the rebuilt squad returns to command');
  const leftover = w.sq.find(x => !x.disbanded && x !== q && living(x).length);
  assert.ok(leftover && living(leftover).length === 4, 'the unneeded remnant keeps waiting');
  assert.ok(!leftover._reconGroup);
  invariants(w, 12);
});
test('no group is planned until enough survivors are actually home and out of contact', () => {
  const w = world();
  squad(w, 0, 3, null, 40);
  squad(w, 1, 2, null, 150);
  squad(w, 2, 1, null, 420);
  const home = [];
  let grouped = null;
  run(w, 420, b => {
    w.sq.forEach((q, i) => {
      if (!home[i] && q._assembly && q._assembly.phase !== 'to-base') home[i] = b.time;
    });
    if (!grouped && recon(w).active.length) grouped = b.time;
  });
  assert.ok(grouped, 'a viable six-man group was planned');
  assert.ok(
    home.every(t => t <= grouped),
    'planned at ' + grouped + 's, squads home at ' + home.map(t => t.toFixed(1)).join('/')
  );
  assert.ok(
    grouped - Math.min(...home) > 60,
    'the five men already home waited for the far survivor instead of grouping early'
  );
  assert.equal(recon(w).groupsDissolved, 0);
  const q = merged(w);
  assert.equal(living(q).length, 6);
  invariants(w, 6);
});
test("the rendezvous slides toward the next objective only inside each remnant's 15% travel budget", () => {
  const w = world();
  w.b._objectives = [{ id: 'church', def: { x: -40, z: 0, radius: 30, value: 1 }, state: { owner: 'ge' } }];
  [0, 1].forEach(l => squad(w, l, 4));
  const g = untilGrouped(w, 120).group;
  assert.equal(g.objectiveId, 'church');
  assert.ok(
    g.forwardShift > 0 && g.forwardShift <= 180,
    'the neutral centre moves forward, but stays capped'
  );
  const centerToObjective = Math.hypot(g.center.x + 40, g.center.z),
    rallyToObjective = Math.hypot(g.rally.x + 40, g.rally.z);
  assert.ok(rallyToObjective < centerToObjective, 'the rebuilt squad starts closer to its next objective');
  g.sourceTravel.forEach(row => {
    assert.ok(
      row.rallyDistance <= row.centerDistance * 1.15 + 1e-5,
      row.id + ' stays within the Pythagorean detour budget'
    );
    const q = w.sq.find(x => x.id === row.id);
    assert.equal(q._macroMission.plannedObjectiveId, 'church');
    assert.equal(q.targetObjective, null, 'a retreating squad is never counted at the objective');
  });
  run(w, 300);
  const q = merged(w),
    mergeAt = w.events.findIndex(e => e.type === 'decision-squad-merge'),
    next = w.events.slice(mergeAt).find(e => e.type === 'decision-mission-issued' && e.data.squad === q.id);
  assert.equal(next.data.objectiveId, 'church', 'the rebuilt squad goes for the objective it rallied toward');
  assert.equal(next.data.intent, 'capture');
});
test('far-apart remnants wait instead of accepting an absurd cross-map assembly march', () => {
  const w = world();
  squad(w, 0, 4, null, 20);
  squad(w, 4, 4, null, 20);
  run(w, 120);
  const st = recon(w);
  assert.equal(st.groupsFormed, 0);
  assert.equal(st.pool.us.survivors, 8);
  assert.equal(st.pool.us.ready, false);
  assert.equal(st.pool.us.blockedByDistance, true);
});
test('four three-man remnants rebuild as two nearby six-man squads', () => {
  const w = world();
  [0, 1, 2, 3].forEach(l => squad(w, l, 3));
  run(w, 480);
  const rebuilt = w.b.factions.us.squads.filter(q => q.reconstitutedFrom);
  assert.equal(rebuilt.length, 2);
  assert.deepEqual(
    rebuilt.map(q => living(q).length).sort((x, y) => x - y),
    [6, 6]
  );
  assert.ok(rebuilt.every(q => q.reconstitutedFrom.length === 2));
  invariants(w, 12);
});
test('a four-man remnant stays in the survivor pool past the old 120-second solo-redeploy window', () => {
  const w = world(),
    q = squad(w, 0, 4, null, 20);
  run(w, 240);
  const st = recon(w);
  assert.equal(q.state, 'retreat', 'the remnant never redeployed itself');
  assert.ok(q._assembly && q._assembly.phase === 'at-base', 'it waits at base');
  assert.equal(st.groupsFormed, 0, 'one remnant cannot reconstitute with itself');
  assert.equal(st.pool.us.survivors, 4);
  assert.equal(st.pool.us.squads.length, 1);
  assert.equal(st.pool.us.squads[0].id, q.id);
  assert.equal(st.pool.us.squads[0].survivors, 4);
  assert.equal(st.pool.us.ready, false);
  assert.ok(!q._macroMission || q._macroMission.status !== 'executing', 'no combat brief was revived');
});

test('a five-man squad remains a viable squad and is not consumed by the survivor pool', () => {
  const w = world(),
    q = squad(w, 0, 5, null, 20);
  q.mind = { mean: 0.4, n: 5 };
  run(w, 60);
  const st = recon(w);
  assert.equal(st.groupsFormed, 0);
  assert.equal(
    st.pool.us.survivors,
    0,
    '5+ survivors recover as their own squad instead of becoming pool manpower'
  );
  assert.ok(!q._reconGroup);
});

test('two four-man remnants form a viable understrength squad instead of waiting for ten', () => {
  const w = world();
  [0, 1].forEach(l => squad(w, l, 4));
  run(w, 360);
  const st = recon(w),
    q = merged(w);
  assert.equal(st.groupsFormed, 1, '8 survivors are enough for one viable group');
  assert.equal(st.merges, 1);
  assert.equal(living(q).length, 8);
  assert.equal(q.establishment, 10, 'the rebuilt squad still measures casualties against full establishment');
  invariants(w, 8);
});
test('geography beats raw strength: two nearby threes group before a distant four', () => {
  const w = world();
  const a = squad(w, 0, 3, null, 20),
    bq = squad(w, 1, 3, null, 20),
    far = squad(w, 4, 4, null, 20);
  const seen = untilGrouped(w, 120),
    ids = seen.group.squads.slice().sort();
  assert.deepEqual(
    ids,
    [a.id, bq.id].sort(),
    'the nearby six-man cluster wins over the stronger far remnant'
  );
  assert.ok(seen.group.centerTravelMax <= 300);
  run(w, 360);
  const q = merged(w);
  assert.equal(living(q).length, 6);
  assert.ok(!far.disbanded && living(far).length === 4 && !far._reconGroup);
  invariants(w, 10);
});
test('the most senior leader takes command: a sergeant outranks a rifleman who stepped up', () => {
  const w = world(),
    noLead = ['rifleman', 'rifleman', 'rifleman', 'scout', 'gunner'];
  squad(w, 0, 3, noLead, 20);
  const c = squad(w, 1, 3, null, 20);
  run(w, 360);
  const q = merged(w),
    cap = c.members.find(s => s.role === 'sergeant');
  assert.equal(q, c, 'the squad with the living sergeant keeps its identity');
  assert.equal(q.leaderId, cap.id);
  assert.equal(recon(w).promotions, 0);
  invariants(w, 6);
});
test("with every leader dead each remnant's successor steps up and the merge keeps one of them", () => {
  const w = world(),
    keep = ['gunner', 'scout', 'rifleman', 'rifleman'];
  [0, 1].forEach(l => (squad(w, l, 4, keep, 20).accuracyMultiplier = 0.8));
  run(w, 360);
  const q = merged(w),
    lead = q.members.find(s => s.id === q.leaderId);
  assert.equal(lead.role, 'rifleman');
  assert.equal(recon(w).promotions, 0, 'successors already lead; the merge promotes nobody');
  assert.equal(w.events.filter(e => e.type === 'decision-leader-succession').length, 2);
  assert.equal(q.accuracyMultiplier, 1, 'the leaderless accuracy penalty ends once someone leads');
  assert.equal(lead.slotIndex, 0);
  assert.equal(
    q.members.filter(s => s.role === 'gunner' && !s.slotRole).length,
    1,
    'one gun keeps the gunner slot'
  );
  invariants(w, 8);
});
test('a forming group dissolves only when losses take it below the six-man viable minimum', () => {
  const w = world();
  [0, 1].forEach(l => squad(w, l, 4));
  untilGrouped(w, 120);
  assert.equal(recon(w).active.length, 1);
  living(w.sq[1])
    .slice(0, 3)
    .forEach(s => w.b.killSoldier(s, null));
  run(w, 30);
  const st = recon(w);
  assert.equal(st.groupsDissolved, 1);
  assert.equal(st.merges, 0);
  assert.equal(st.active.length, 0);
  assert.ok(
    w.sq.filter(q => living(q).length).every(q => !q.disbanded && !q._reconGroup && q.state === 'retreat')
  );
  assert.ok(w.sq.every(q => !q._macroMission || q._macroMission.status === 'failed'));
  invariants(w, 5);
});
test('a re-formed squad holds together and retreats again only at 60% of full strength', () => {
  const w = world();
  [0, 1].forEach(l => squad(w, l, 4));
  run(w, 360);
  const q = merged(w);
  let retreated = false;
  run(w, 30, () => {
    if (q.state === 'retreat') retreated = true;
  });
  assert.equal(retreated, false, 'no re-retreat without new casualties');
  living(q)
    .filter(s => !w.r.SquadAI.isLeader(s))
    .slice(0, 3)
    .forEach(s => w.b.killSoldier(s, null));
  run(w, 1);
  assert.notEqual(q.state, 'retreat', '5 of 10 left');
  living(q)
    .filter(s => !w.r.SquadAI.isLeader(s))
    .slice(0, 1)
    .forEach(s => w.b.killSoldier(s, null));
  run(w, 1);
  assert.equal(q.state, 'retreat', '4 of 10 left');
});
test('Macro OFF: no General, no reconstitution', () => {
  const w = world({ macro: false });
  [0, 1, 2].forEach(l => squad(w, l, 4));
  run(w, 300);
  assert.equal(recon(w).groupsFormed, 0);
  assert.ok(w.sq.every(q => !q.disbanded));
});
test('the same battle reconstitutes identically', () => {
  function trace() {
    const w = world();
    [0, 1].forEach(l => squad(w, l, 4));
    run(w, 360);
    return JSON.stringify(w.events.filter(e => /reconstitute|merge|promoted|assembly/.test(e.type)));
  }
  assert.equal(trace(), trace());
});
test('a member that leaves retreat dissolves its forming group and returns the other remnant to the pool', () => {
  const w = world(),
    a = squad(w, 0, 4, null, 20),
    bq = squad(w, 1, 4, null, 20),
    grouped = untilGrouped(w, 120);
  assert.deepEqual(grouped.group.squads.slice().sort(), [a.id, bq.id].sort());
  a.state = 'advance';
  w.r.BattleCommanderAI.reconstitute(w.b, 'us');
  const st = recon(w),
    ended = st.ended.find(g => g.id === grouped.group.id);
  assert.ok(ended && ended.status === 'dissolved' && ended.endReason === 'squad-rallied');
  assert.equal(st.active.length, 0);
  assert.equal(bq.state, 'retreat');
  assert.equal(bq._reconGroup, null);
});
test('a merged squad that is still shaken rests at base: it is not grouped with itself again, tick after tick', () => {
  /* Group morale keeps a merged squad in `retreat` until its men are calm. A rebuilt viable squad at base that is not yet calm
     must wait for its men, not be pooled alone, merged with itself and re-tasked on every command tick (a group of
     one squad reaches full strength by itself: there is nothing to reconstitute). */
  const w = world({ search: '?morale=1' });
  [0, 1].forEach(l => squad(w, l, 4));
  const shaken = () => {
    const q = w.b.factions.us.squads.find(x => x.reconstitutedFrom);
    if (q) q.mind = { mean: 0.5, n: 8 };
  };
  run(w, 360, shaken);
  const q = merged(w),
    formed = recon(w).groupsFormed;
  assert.equal(formed, 1, 'one group made the one merge');
  assert.equal(q.state, 'retreat', '8 men, but shaken: it stays at base until they calm (group morale)');
  run(w, 120, shaken);
  assert.equal(recon(w).groupsFormed, formed, 'two more minutes at base: no new group');
  assert.equal(recon(w).merges, 1, 'and no merge with itself');
  q.mind = { mean: 0.1, n: 8 };
  run(w, 3);
  assert.equal(q.state, 'retreat', 'calm men still complete physical rally/reform before hand-back');
  run(w, 3);
  assert.notEqual(q.state, 'retreat', 'stable calm men rally and go back to the fight');
});
test('the fresh brief for a rebuilt squad waits for its rally, not issued into the retreat to die a tick later', () => {
  const w = world();
  [0, 1].forEach(l => squad(w, l, 4));
  run(w, 420);
  const q = merged(w),
    mergeAt = w.events.findIndex(e => e.type === 'decision-squad-merge');
  assert.ok(mergeAt >= 0, 'the two remnants merged');
  const after = w.events.slice(mergeAt);
  assert.ok(
    after.every(
      e => !(e.type === 'decision-mission-end' && e.data.squad === q.id && e.data.reason === 'squad-retreat')
    ),
    'no brief is issued into the still-retreating rebuild and auto-failed one tick later'
  );
  const issued = after.filter(e => e.type === 'decision-mission-issued' && e.data.squad === q.id);
  assert.ok(issued.length >= 1, 'the General re-tasks the rebuilt squad once it is back under command');
  assert.notEqual(q._macroMission.status, 'failed', 'the re-tasking brief stands');
});
test('wound floors do not freeze a rebuilt squad: the rally gate measures the still-drainable stress', () => {
  const w = world();
  /* Soldier Mind's reading contract, stubbed: the live battle caches the squad mean in sq.mind and
     each man's permanent floor in mind.memory.floor (BattleSoldierMind.squadFloor is their mean).
     A merge concentrates wounded survivors - live case: mean 0.27 pinned at a 0.18 floor, above
     the 0.15 rally line however long the squad rests. Every other member the loaded stack calls
     on BattleSoldierMind once it exists is stubbed at its absent-API neutral value, and a miss
     throws rather than silently skewing the battle. */
  const mindStub = {
    squadStress: q => (q && q.mind && q.mind.mean) || 0,
    squadFloor: q => (q && q.mind && q.mind.floor) || 0,
    reactScale: () => 1,
    shockUntil: () => 0,
    recentIncoming: () => false,
    view: () => null,
    noteReact() {},
    noteShock() {},
    noteLapse() {}
  };
  w.r.BattleSoldierMind = new Proxy(mindStub, {
    get(target, key) {
      if (key in target) return target[key];
      if (typeof key !== 'string') return undefined;
      throw new Error('reconstitution-check mind stub lacks BattleSoldierMind.' + key);
    }
  });
  [0, 1].forEach(l => squad(w, l, 3));
  const pinned = () => {
    const q = w.b.factions.us.squads.find(x => x.reconstitutedFrom);
    if (q) q.mind = { mean: 0.27, n: 6, floor: 0.18 };
  };
  run(w, 420, pinned);
  const q = merged(w),
    mergeAt = w.events.findIndex(e => e.type === 'decision-squad-merge');
  assert.equal(living(q).length, 6, 'the two three-man remnants rebuild at the viable minimum');
  assert.notEqual(
    q.state,
    'retreat',
    'a squad pinned above the rally line by permanent wound floors still rallies: 0.27 - 0.18 = 0.09 < 0.15'
  );
  const issued = w.events
    .slice(mergeAt)
    .filter(e => e.type === 'decision-mission-issued' && e.data.squad === q.id);
  assert.ok(issued.length >= 1, 'and the General re-tasks it');
  assert.notEqual(q._macroMission.status, 'failed', 'the fresh brief stands');
});
test('short retreat-anchor recovery still moves every reconstitution survivor toward the rally', () => {
  const w = world(),
    q = squad(w, 0, 10, null, 20),
    leader = q.members.find(s => s.slotIndex === 0),
    rear = q.members.find(s => s.slotIndex === 8 || s.slotIndex === 9);
  assert.ok(leader && rear, 'fixture has command and rear-team survivors');
  q.members.forEach(s => {
    if (s !== leader && s !== rear) w.b.killSoldier(s, null);
  });
  const p = w.r.BattleCommanderDoctrine.avgPos(q),
    point = { x: p.x, z: p.z + 120 },
    version = 7;
  q.state = 'retreat';
  q.orderAnchor = { x: p.x, z: p.z };
  q.rally = { x: p.x, z: p.z };
  q._assembly = { phase: 'to-rally', since: 0, missionVersion: version };
  q._macroMission = {
    version,
    intent: 'reconstitute',
    action: 'assemble',
    status: 'executing',
    point
  };

  w.b.time = 0;
  w.r.BattleSquadStability.advanceSquadAnchor(q, w.b);
  w.b.time = w.r.BattleSquadStability.tuning.retreatAnchor.noProgress + 0.1;
  w.r.BattleSquadStability.advanceSquadAnchor(q, w.b);
  const held = w.r.BattleLeases.get(q, 'retreat-anchor');
  assert.equal(held.data.reason, 'no retreat progress');
  assert.ok(Math.abs(held.data.distance - 6.5) < 0.05, 'expected the live 6.5 m recovery stride');

  w.r.BattleSquadStability.updateFireteams(q, w.b);
  living(q).forEach(s => {
    const d = s._fireteamDestination,
      forward = d.z - s.root.position.z,
      message = 'survivor ' + s.id + ' forward movement was ' + forward.toFixed(2) + ' m';
    assert.ok(forward > 2, message);
  });
});

test('a dissolved rally sends an en-route remnant back through to-base instead of declaring it home', () => {
  const w = world(),
    a = squad(w, 0, 4, null, 20),
    bq = squad(w, 1, 4, null, 20),
    grouped = untilGrouped(w, 120);
  assert.deepEqual(grouped.group.squads.slice().sort(), [a.id, bq.id].sort());
  assert.equal(bq._assembly.phase, 'to-rally', 'precondition: remnant accepted the assembly brief');
  const home = w.r.SquadAI.extractionHome(bq);
  bq.members
    .filter(s => !s.dead)
    .forEach(s => {
      s.root.position.x = home.x;
      s.root.position.z = home.z + 80;
    });
  a.state = 'advance';
  w.r.BattleCommanderAI.reconstitute(w.b, 'us');
  run(w, H.AI_TICK);
  assert.equal(bq._reconGroup, null, 'dissolution releases group ownership');
  assert.equal(bq._assembly.phase, 'to-base', '80 m from base remains physical transit, not at-base');
});

test('a source squad wiped during assembly is cleaned when the surviving sources merge', () => {
  const w = world(),
    a = squad(w, 0, 4, null, 20),
    wiped = squad(w, 1, 1, null, 20),
    c = squad(w, 2, 4, null, 20),
    grouped = untilGrouped(w, 120);
  assert.deepEqual(
    grouped.group.squads.slice().sort(),
    [a.id, wiped.id, c.id].sort(),
    'all three sources are needed for the viable group'
  );
  living(wiped).forEach(s => w.b.killSoldier(s, null));
  run(w, 360);
  const ended = recon(w).ended.find(g => g.id === grouped.group.id);
  assert.ok(ended && ended.status === 'merged', 'the eight surviving men still merge successfully');
  assert.equal(wiped._reconGroup, null, 'the wiped source is detached from the terminal group');
  assert.ok(wiped._macroMission, 'the wiped source keeps its terminal mission record for diagnostics');
  assert.equal(wiped._macroMission.status, 'failed', 'its reconstitution brief is terminal');
});
console.log(n + ' reconstitution checks passed');
