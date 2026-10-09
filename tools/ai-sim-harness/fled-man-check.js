#!/usr/bin/env node
'use strict';
/* The man who has fled (Engagement `flee`, `?stressAct=flee`; owner direction 2026-10-01): a broken man who runs is done
   with the fight for good.

   - He leaves his weapons where he stands (the sim removes them: BattleWeapons.abandon), tells the soldier condition (his
     stress never drains below FLED_FLOOR) and runs to the last place his squad stood out of contact with nobody known
     near (`squad.safePoint`, the Squad Leader's), or to his squad's home when the trouble is known to be near it.
   - He leaves the squad's roster (the Squad Leader, from Engagement's report) and is a squad of one in retreat; the
     squad he left reads as having lost him, and a leader who runs leaves it leaderless.
   - At his refuge he waits (a hold, no fire, no orders) for FLED_WAIT seconds, however calm he gets. A retreating squad
     out of contact within the General's pick-up range takes him in (he is on its roster, goes home with it); an enemy
     known within FLED_ENEMY_NEAR, or the end of the wait, sends him home on his own.
   - At base he is issued a weapon again and is a man of a retreating squad (at-base: reconstitution can group him); he
     never goes back to the squad he left.
   - Nothing of it draws from the combat RNG; an unarmed man runs through the whole pipeline without a fault.
   Mechanism, not dice. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
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
  LANES = [-300, -100, 100, 300, 500];
function world(search) {
  search = search == null ? '?stressAct=flee' : search;
  H.resetIds();
  const r = H.bootstrap({ modules: false, search }),
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
    registerUnitType() {},
    registerObjectiveType() {},
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  r.BattleSim = { start() {} };
  load(r, 'battle/modules/08-soldier-events.js', search);
  load(r, 'battle/modules/17-soldier-mind.js', search);
  load(r, 'battle/commander-doctrine.js', search);
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  load(r, 'battle/modules/22-commander-reconstitution.js', search);
  load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/15a-squad-leader-fire-control.js', search);
  load(
    r,
    'battle/modules/15b-squad-leader-buddy-pairs.js',
    'battle/modules/15c-squad-leader-scouts-forward.js',
    search
  );
  load(r, 'battle/modules/15c-squad-leader-scouts-forward.js', search);
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
  load(r, 'battle/modules/16-squad-plan-stability.js', search);
  load(r, 'battle/modules/46-ammunition-stoppages.js', search);
  const b = H.makeBattle(r);
  b.macroCommandEnabled = true;
  b.scene = { metadata: {} };
  const w = { r, b, leader: systems['squad-command'], ammo: systems['ammunition-stoppages'], events, sq: [] };
  w.ammo.onBattleStart(b);
  return w;
}
/* A US squad of ten at lane `lane`'s home, walked `forward` metres out and cut down to `alive` men (the leader first). */
function squad(w, lane, alive, forward, id) {
  const q = H.addSquad(w.r, w.b, {
    id: id || 'us-' + lane,
    faction: 'us',
    x: LANES[lane],
    z: HOME_Z,
    objective: { x: LANES[lane], z: 0 }
  });
  q.route = [];
  q.commandRole = 'center';
  q.members.forEach(s => {
    s.root.position.z += forward == null ? 150 : forward;
    s.destination = { x: s.root.position.x, z: s.root.position.z };
  });
  const order = [
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
    ],
    keep = [];
  order.forEach(role => {
    const s = q.members.find(m => m.role === role && !keep.includes(m));
    if (s && keep.length < (alive == null ? 10 : alive)) keep.push(s);
  });
  q.members.forEach(s => {
    if (!keep.includes(s)) w.b.killSoldier(s, null);
  });
  w.sq.push(q);
  return q;
}
/* The General's and the Squad Leader's command tick, then the AI tick, as the page runs them. */
function run(w, seconds, onTick) {
  const C = w.r.BattleCommanderAI;
  let acc = 0;
  H.run(w.r, w.b, seconds, function (b) {
    if (onTick) onTick(b); // a test sets the scene after the tick's updates and before the commanders look at it
    w.ammo.onSimulationStep(b, { dt: H.AI_TICK });
    acc += H.AI_TICK;
    if (acc >= C.commandTick - 1e-9) {
      acc = 0;
      C.update(b, null, C.commandTick);
      w.leader.onCommanderTick(b, { town: null });
    }
  });
}
const E = w => w.r.BattleEngagement,
  T = w => w.r.BattleEngagement.tuning.ACT_TUNING;
const here = s => ({ x: s.root.position.x, z: s.root.position.z });
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const living = q => q.members.filter(s => !s.dead);
const rifleman = (q, i) => q.members.filter(s => s.role === 'rifleman' && !s.dead)[i || 0];
/* The squad has run into trouble `d` metres ahead of it: its picture says so (kept fresh while `fn` runs). */
function trouble(w, q, at) {
  const unit =
    q._fixtureThreat ||
    (q._fixtureThreat = {
      id: 'fixture-threat-' + q.id,
      faction: q.faction === 'us' ? 'ge' : 'us',
      dead: false,
      root: { position: { x: at.x, y: 0, z: at.z } }
    });
  unit.root.position.x = at.x;
  unit.root.position.z = at.z;
  q.contact = {
    x: at.x,
    z: at.z,
    at: w.b.time,
    firstHandAt: w.b.time,
    seenBy: -1,
    unit
  };
  /* These lifecycle tests say the threat is "known". Under personal beliefs that means the man
     needs Perception-owned evidence too; aggregate q.contact alone is intentionally not his truth. */
  if (w.r.SquadAI.soldierBeliefsOn && w.r.SquadAI.soldierBeliefsOn())
    q.members
      .filter(s => s && !s.dead)
      .forEach(s => w.r.SquadAI.rememberSeen(s, unit, w.b, true, 'fixture-known-trouble'));
}
/* Break a man for good: stress at the top, a flee temper. */
function snap(w, s) {
  const M = w.r.BattleSoldierMind;
  M.of(s).temper = { flee: 1, freeze: 0, rage: 0 };
  M.of(s).stress = 0.95;
  M.of(s).pub = 0.95;
  M.of(s).at = w.b.time;
}
/* Every living man is on exactly one squad's roster, his own; the side's count does not move. */
function invariants(w, alive) {
  const seen = new Set();
  w.b.factions.us.squads.forEach(q =>
    q.members.forEach(s => {
      assert.ok(!seen.has(s.id) || s.dead, 'soldier ' + s.id + ' is on two rosters');
      seen.add(s.id);
    })
  );
  w.b._roster.us
    .filter(s => !s.dead)
    .forEach(s =>
      assert.ok(s.squad.members.includes(s), 'living soldier ' + s.id + " is on his own squad's roster")
    );
  if (alive != null) assert.equal(w.b.factions.us.alive, alive);
}
/* One squad out in the field, a man of it broken and running, trouble ahead. Returns the pieces. */
function broken(w, opts) {
  opts = opts || {};
  const q = squad(w, opts.lane || 0, opts.alive, opts.forward),
    s = opts.role ? q.members.find(m => m.role === opts.role) : rifleman(q);
  if (opts.tacticalHome) q.home = { x: opts.tacticalHome.x, z: opts.tacticalHome.z };
  run(w, 1); // a quiet moment: the squad's safe point is where it stands
  if (opts.safe) q.safePoint = opts.safe;
  trouble(w, q, opts.at || { x: q.members[0].root.position.x, z: HOME_Z + 150 + 120 });
  const spot = here(s);
  snap(w, s);
  run(w, 0.5, () => {
    snap(w, s);
    trouble(w, q, opts.at || { x: spot.x, z: spot.z + 120 });
  });
  return { q, s, spot };
}

test('an ordinary one-man remnant retreats and cannot continue as a one-man assault squad', () => {
  const w = world(),
    q = squad(w, 0, 1, 150),
    man = living(q)[0];
  q.commandPhase = 'assault';
  q.targetObjective = 'obj-center';
  q._macroMission = {
    version: 1,
    owner: 'force-command',
    intent: 'capture',
    action: 'assault',
    objectiveId: 'obj-center',
    point: { x: LANES[0], z: 0 },
    route: [],
    role: 'center',
    requestKey: null,
    plannedObjectiveId: null,
    reason: 'fixture',
    status: 'executing',
    acceptedAt: w.b.time
  };
  run(w, 1.5, () => (q.contact = null));
  assert.equal(living(q).length, 1);
  assert.equal(w.r.SquadAI.establishment(q), 10, 'casualties stay measured against the original squad');
  assert.equal(q.state, 'retreat', '90% casualties force the ordinary remnant to withdraw');
  assert.equal(man.eng.state, 'withdraw', 'the last man executes retreat, not the stale assault phase');
  assert.equal(q._macroMission.status, 'failed', 'the assault brief is ended');
  assert.equal(q._macroMission.endReason, 'squad-retreat');
  assert.ok(q._assembly && q._assembly.phase === 'to-base', 'he is in the survivor/reconstitution pipeline');
  assert.equal(q.fledId, undefined, 'an ordinary remnant is not a fled detachment');
  assert.notEqual(man.countsForElimination, false, 'an ordinary surviving soldier still counts for his side');
});

test("he leaves his weapons, tells the soldier condition and runs to the squad's last safe point", () => {
  const w = world(),
    safe = { x: LANES[0], z: HOME_Z + 90 },
    { q, s } = broken(w, { safe });
  assert.equal(s.eng.state, 'flee');
  assert.equal(s.eng.fledPhase, 'run');
  assert.equal(s.weapon, null, 'the rifle stays where he stood');
  assert.equal(s.secondary, null);
  assert.equal(E(w).fledPhase(s), 'run');
  /* Out of the fight, out of the count: the General's force accounting (elimination and the
     time-limit force score) does not see him until a retreating squad takes him in. */
  assert.equal(s.countsForElimination, false, 'a fled man does not count toward elimination');
  const force = w.r.BattleCommanderDoctrine.forceUnits(w.b, 'us');
  assert.ok(!force.includes(s), 'he is not in the us force count');
  assert.equal(force.length, 9, 'the nine men still fighting are');
  /* The refuge now includes a per-soldier offset (fleeOffset) to prevent orbiting, so check
     proximity rather than exact equality. */
  assert.ok(
    dist(s.eng.refuge, safe) < 5,
    'the refuge is near the squad safe point (with per-soldier offset): ' +
      JSON.stringify(s.eng.refuge) +
      ' vs ' +
      JSON.stringify(safe)
  );
  assert.ok(
    dist(s.destination, s.eng.refuge) < 1,
    'and that is where he runs (to his offset refuge): ' +
      JSON.stringify([
        s.destination,
        safe,
        s.eng.refuge,
        here(s),
        s.orderDestination,
        s.eng.state,
        s.eng.fledPhase,
        s._movementGoal || null
      ])
  );
  assert.equal(w.r.BattleSoldierMind.of(s).fled, true, 'his stress knows he has fled');
  assert.ok(
    w.events.some(e => e.type === 'decision-fled' && e.data.soldier === s.id && e.data.weaponLeft === true)
  );
  /* The man he was is out of the squad: a squad of one in retreat, a full squad's strength missing. */
  assert.ok(!q.members.includes(s));
  const lone = s.squad;
  assert.notEqual(lone, q);
  assert.equal(lone.fledId, s.id);
  assert.equal(lone.state, 'retreat');
  assert.equal(lone.establishment, 10);
  assert.deepEqual(lone.members, [s]);
  assert.equal(lone.leaderId, s.id);
  assert.ok(w.b.factions.us.squads.includes(lone));
  assert.ok(w.events.some(e => e.type === 'decision-fled-detach' && e.data.lone === lone.id));
  assert.equal(living(q).length, 9, 'the squad he left lost him');
  invariants(w, 10);
});

test("his squad's safe point is the last place it stood out of contact with nobody known near", () => {
  const w = world(),
    q = squad(w, 0, 10, 100);
  run(w, 3);
  const quiet = w.r.BattleCommanderDoctrine.avgPos(q);
  assert.ok(q.safePoint && dist(q.safePoint, quiet) < 15, 'out of contact it follows the squad');
  trouble(w, q, { x: 0, z: 0 });
  const before = { x: q.safePoint.x, z: q.safePoint.z };
  q.members.forEach(s => (s.root.position.z += 40));
  run(w, 2, () => trouble(w, q, { x: 0, z: 0 }));
  assert.deepEqual(q.safePoint, before, 'with trouble known it stays where it was');
});

test('he runs home instead when the trouble is known to be near the safe point', () => {
  const w = world(),
    safe = { x: LANES[0], z: HOME_Z + 90 },
    { s } = broken(w, { safe, at: { x: LANES[0], z: HOME_Z + 90 + 50 } });
  assert.equal(s.eng.state, 'flee');
  /* Refuge now has a per-soldier offset; check proximity to home instead of exact equality. */
  assert.ok(
    dist(s.eng.refuge, { x: LANES[0], z: HOME_Z }) < 5,
    "within FLED_SAFE of the safe point: his squad's home (with per-soldier offset)"
  );
});

test('a prepared defender flees and extracts to its immutable base, not the tactical garrison home', () => {
  const w = world(),
    base = { x: LANES[0], z: HOME_Z },
    tactical = { x: LANES[0] + 70, z: HOME_Z + 180 },
    { q, s } = broken(w, {
      tacticalHome: tactical,
      safe: tactical,
      at: { x: tactical.x, z: tactical.z + 30 }
    });
  assert.ok(dist(q.home, tactical) < 1e-9, 'the prepared squad keeps its tactical fallback');
  assert.ok(dist(q.baseHome, base) < 1e-9, 'the original rear base is preserved');
  assert.ok(dist(s.eng.fledHome, base) < 1e-9, 'Engagement remembers the true base for the fled lifecycle');
  assert.ok(dist(s.squad.home, base) < 1e-9, 'the detached one-man squad inherits the extraction base');
  run(w, 300, () => (s.squad.contact = null));
  assert.equal(s.eng.fledPhase, null, 'he reaches base and rearms');
  assert.ok(dist(here(s), base) <= T(w).FLED_HOME_RADIUS + 3);
  assert.ok(
    s.squad._assembly && s.squad._assembly.phase === 'at-base',
    'the defender remnant enters the reconstitution pool'
  );
});

test('at the refuge he waits FLED_WAIT seconds, however calm he gets, then goes home on his own', () => {
  const w = world(),
    safe = { x: LANES[0], z: HOME_Z + 60 },
    { s } = broken(w, { safe, at: { x: LANES[0], z: HOME_Z + 400 } });
  run(w, 40, () => {
    w.r.BattleSoldierMind.of(s).stress = 0;
    s.squad.contact = null;
  });
  assert.equal(s.eng.fledPhase, 'wait', 'there');
  assert.equal(s.eng.refugeHere, true);
  const at = s.eng.fledAt;
  assert.ok(s.crouching || s.prone, 'down at his refuge');
  const p = here(s);
  let shots = 0;
  const real = w.r.SquadAI.tryFire;
  w.r.SquadAI.tryFire = (...a) => (shots++, real.apply(w.r.SquadAI, a));
  run(w, T(w).FLED_WAIT - (w.b.time - at) - 5, () => {
    w.r.BattleSoldierMind.of(s).stress = 0;
    s.squad.contact = null;
  });
  assert.equal(s.eng.fledPhase, 'wait', 'still waiting five seconds before the end');
  assert.ok(dist(p, here(s)) < 1, 'where he sat');
  assert.equal(s.eng.state, 'flee', 'calm does not end it');
  run(w, 10);
  assert.equal(s.eng.fledPhase, 'home', 'the wait is over');
  assert.equal(shots, 0);
  assert.equal(w.r.BattleSoldierMind.telemetry(w.b).bySide.us.acts.flee.homeTimeout, 1);
});

test('an enemy known near him sends him home at once', () => {
  const w = world(),
    { s, q } = broken(w, { safe: { x: LANES[0], z: HOME_Z + 60 }, at: { x: LANES[0], z: HOME_Z + 400 } });
  run(w, 40, () => (s.squad.contact = null));
  assert.equal(s.eng.fledPhase, 'wait');
  const lone = s.squad;
  trouble(w, lone, { x: s.root.position.x, z: s.root.position.z + T(w).FLED_ENEMY_NEAR - 5 });
  run(w, 0.5);
  assert.equal(s.eng.fledPhase, 'home');
  assert.equal(w.r.BattleSoldierMind.telemetry(w.b).bySide.us.acts.flee.homeEnemy, 1);
  assert.ok(q);
});

test('at base he is issued a weapon again, is a man of a retreating squad of one and recovers, never below FLED_FLOOR', () => {
  const w = world(),
    { s } = broken(w, { safe: { x: LANES[0], z: HOME_Z + 60 }, at: { x: LANES[0], z: HOME_Z + 400 } });
  run(w, 300, () => (s.squad.contact = null));
  assert.equal(s.eng.fledPhase, null, 'he got home');
  assert.ok(dist(here(s), { x: LANES[0], z: HOME_Z }) <= T(w).FLED_HOME_RADIUS + 3);
  assert.ok(s.weapon && s.weapon.kind === 'rifle', 'a rifleman has his rifle again');
  assert.ok(s.weapon.ammo > 0 && s.weapon.stats, "a full magazine of the side's weapon");
  assert.equal(s.eng.refuge, null);
  assert.notEqual(s.eng.state, 'flee');
  assert.equal(s.squad.fledId, s.id, 'still on his own');
  assert.equal(s.squad.state, 'retreat');
  assert.ok(w.events.some(e => e.type === 'decision-fled-rearmed' && e.data.armed === true));
  run(w, 120);
  const stress = w.r.BattleSoldierMind.of(s).stress;
  assert.ok(stress >= w.r.BattleSoldierMind.tuning.FLED_FLOOR - 1e-9, 'never below the floor: ' + stress);
  assert.ok(stress < 0.6, 'but he recovers toward it: ' + stress);
  assert.equal(w.r.BattleSoldierMind.telemetry(w.b).bySide.us.acts.flee.rearmed, 1);
});

test('rallied or re-briefed on his own he is not: no state, mission or plan of ordinary command reaches a fled detachment', () => {
  const w = world(),
    { s } = broken(w, { safe: { x: LANES[0], z: HOME_Z + 60 }, at: { x: LANES[0], z: HOME_Z + 400 } });
  const lone = s.squad,
    missions = new Set();
  let draws = 0;
  const real = w.b.random;
  w.b.random = () => (draws++, real.call(w.b));
  const before = draws;
  /* The detachment's whole life - the wait at the refuge, the walk home, the rifle at base and
     long past the 120 s dwell that sends a small retreating squad back out - with the General
     briefing on every command tick. Nothing of ordinary command may reach him: the solo redeploy
     and the morale rally are for squads that retreated, not for broken men, so no mission is ever
     issued (and without a mission no plan phase runs: `approach` is the detach's inert scaffold,
     `assault` can never come). He comes back under command by a roster rewrite only. */
  run(w, 500, () => {
    s.squad.contact = null;
    missions.add(lone._macroMission ? lone._macroMission.intent + ':' + lone._macroMission.status : 'none');
  });
  assert.equal(s.eng.fledPhase, null, 'he got home');
  assert.ok(s.weapon, 'and his rifle');
  assert.equal(lone.fledId, s.id, 'the detachment is still what it is');
  assert.equal(lone.state, 'retreat', 'no rally, no solo redeploy: retreat does not end for him');
  assert.deepEqual([...missions], ['none'], 'the General never briefed him');
  assert.ok(!lone._macroMission, 'and nothing of a mission remains on him');
  assert.ok(
    lone._assembly && lone._assembly.phase === 'at-base',
    'at base, where reconstitution can group him'
  );
  assert.equal(s.countsForElimination, false, 'still counting for nobody');
  assert.equal(draws, before, 'and none of it drew from the combat RNG');
});

test('a retreating squad out of contact near the waiting man takes him in; one in contact or far off does not', () => {
  const w = world();
  const a = squad(w, 0, 10, 150),
    s = rifleman(a);
  run(w, 1);
  const refuge = { x: LANES[0], z: HOME_Z + 150 };
  a.safePoint = refuge;
  trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  snap(w, s);
  run(w, 0.5, () => {
    snap(w, s);
    trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  });
  run(w, 3, () => (s.squad.contact = null));
  assert.equal(s.eng.fledPhase, 'wait');
  const lone = s.squad;
  /* A retreating squad far off, and one near but in contact: neither. */
  const far = squad(w, 3, 4, 150),
    near = squad(w, 1, 4, 150);
  far.members.forEach(m => (m.root.position.x = LANES[0] + 400));
  near.members.forEach(m => ((m.root.position.x = refuge.x + 20), (m.root.position.z = refuge.z)));
  near.inContact = true;
  const hold = () => {
    near.inContact = true;
    far.inContact = false;
  };
  run(w, 2, hold);
  assert.equal(s.eng.fledPhase, 'wait', 'nobody who can take him in');
  assert.equal(s.squad, lone);
  /* Out of contact and near: taken in. */
  near.members.forEach(m => ((m.root.position.x = refuge.x + 20), (m.root.position.z = refuge.z)));
  near.inContact = false;
  const before = living(near).length;
  run(w, 1.5, () => {
    near.members.forEach(m => ((m.root.position.x = refuge.x + 20), (m.root.position.z = refuge.z)));
    near.inContact = false;
  });
  assert.equal(s.squad, near, "on the retreating squad's roster");
  assert.equal(living(near).length, before + 1);
  assert.equal(lone.disbanded, true);
  assert.equal(lone.mergedInto, near.id);
  assert.equal(s.eng.fledPhase, 'home', 'and he goes home with them');
  assert.equal(s.countsForElimination, true, 'taken back onto a fighting roster: he counts again');
  assert.ok(w.r.BattleCommanderDoctrine.forceUnits(w.b, 'us').includes(s), 'and the General counts him');
  assert.equal(w.r.BattleSoldierMind.telemetry(w.b).bySide.us.acts.flee.homePickup, 1);
  assert.ok(w.events.some(e => e.type === 'decision-fled-pickup' && e.data.squad === near.id));
  invariants(w);
});

function pickedUp(search) {
  const w = world(search),
    a = squad(w, 0, 10, 150),
    s = rifleman(a);
  run(w, 1);
  const refuge = { x: LANES[0], z: HOME_Z + 150 };
  a.safePoint = refuge;
  trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  snap(w, s);
  run(w, 0.5, () => {
    snap(w, s);
    trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  });
  run(w, 3, () => (s.squad.contact = null));
  const lone = s.squad;
  /* The General has the lone man in a reconstitution group with an executing brief when a squad takes him in. */
  lone._reconGroup = 'us-reconstitution-9';
  lone._macroMission = {
    version: 1,
    owner: 'force-command',
    intent: 'reconstitute',
    action: 'assemble',
    objectiveId: null,
    point: refuge,
    route: [],
    role: 'center',
    requestKey: null,
    plannedObjectiveId: null,
    reason: 'fixture',
    status: 'executing',
    acceptedAt: w.b.time
  };
  const near = squad(w, 1, 4, 150),
    put = () => {
      near.members.forEach(m => ((m.root.position.x = refuge.x + 20), (m.root.position.z = refuge.z)));
      near.inContact = false;
    };
  put();
  run(w, 1.5, put);
  return { w, s, lone, near };
}
test('a squad that takes in a waiting man ends his reconstitute brief and group (?fledBriefEnd=0 keeps them open)', () => {
  const on = pickedUp();
  assert.equal(on.lone.disbanded, true);
  assert.equal(
    on.lone._macroMission.status,
    'completed',
    'the absorbed lone squad brief is ended like a merged squad'
  );
  assert.equal(on.lone._macroMission.endReason, 'absorbed');
  assert.equal(on.lone._reconGroup, null, 'and it is out of its group');
  const off = pickedUp('?stressAct=flee&fledBriefEnd=0');
  assert.equal(off.lone.disbanded, true);
  assert.equal(
    off.lone._macroMission.status,
    'executing',
    'old behaviour: the dead object keeps an executing brief'
  );
  assert.equal(off.lone._reconGroup, 'us-reconstitution-9');
});
test('an id shared by a disbanded lone squad and a live one resolves to the live one (?fledBriefEnd=0 the first)', () => {
  const find = search => {
    const w = world(search),
      stale = { id: 'us-0-fled-5', disbanded: true },
      live = { id: 'us-0-fled-5' };
    w.b.factions.us.squads.push(stale, live);
    return {
      got: w.r
        ._commanderReconstitutionPositions(w.r._commanderReconstitutionCtx())
        .squadById(w.b, 'us', 'us-0-fled-5'),
      stale,
      live
    };
  };
  const on = find();
  assert.equal(on.got, on.live);
  const off = find('?stressAct=flee&fledBriefEnd=0');
  assert.equal(off.got, off.stale);
});
test('?fledElimination=0 is the paired control: a fled man still counts', () => {
  const w = world('?stressAct=flee&fledElimination=0'),
    safe = { x: LANES[0], z: HOME_Z + 90 };
  const { s } = broken(w, { safe });
  assert.equal(s.eng.fledPhase, 'run');
  assert.equal(s.countsForElimination, false, 'Engagement still marks him');
  assert.ok(
    w.r.BattleCommanderDoctrine.forceUnits(w.b, 'us').includes(s),
    'but the force count keeps him (the old behavior)'
  );
  invariants(w, 10);
});

test('a man still running to his refuge is not picked up, only one who waits', () => {
  const w = world(),
    a = squad(w, 0, 10, 150),
    s = rifleman(a),
    r = squad(w, 1, 4, 150);
  run(w, 1);
  a.safePoint = { x: LANES[0], z: HOME_Z + 20 };
  trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  snap(w, s);
  run(w, 0.5, () => {
    snap(w, s);
    trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  });
  r.members.forEach(
    m => ((m.root.position.x = s.root.position.x + 10), (m.root.position.z = s.root.position.z))
  );
  const lone = s.squad;
  assert.equal(s.eng.fledPhase, 'run');
  run(w, 0.5, () =>
    r.members.forEach(
      m => ((m.root.position.x = s.root.position.x + 10), (m.root.position.z = s.root.position.z))
    )
  );
  assert.equal(s.squad, lone, 'still his own');
  assert.equal(E(w).releaseFled(s, w.b, 'pickup'), false, 'and Engagement refuses the release');
});

test('a leader who runs leaves his squad leaderless; the next man takes command after the succession lease', () => {
  const w = world(),
    { q, s } = broken(w, { role: 'sergeant', safe: { x: LANES[0], z: HOME_Z + 90 } });
  assert.ok(!q.members.includes(s));
  assert.equal(w.r.SquadAI.leaderOf(q), null, 'nobody commands');
  assert.equal(q.accuracyMultiplier, 0.8);
  run(w, 8);
  const next = w.r.SquadAI.leaderOf(q);
  assert.ok(next && next !== s && q.members.includes(next), 'a successor leads');
  assert.equal(s.squad.leaderId, s.id, 'and he leads his squad of one');
});

test('a lone man at base is grouped by reconstitution with enough other survivors and rejoins a viable squad', () => {
  const w = world(),
    { s } = broken(w, { safe: { x: LANES[0], z: HOME_Z + 40 }, at: { x: LANES[0], z: HOME_Z + 400 } });
  squad(w, 1, 3, 20);
  squad(w, 2, 2, 20);
  /* Five ordinary survivors wait at base; none can independently redeploy. The fled man's 180 s
     refuge wait ends later, and when he finally reaches base he is the sixth survivor: the pool
     crosses the viable minimum and reconstitution becomes his legal road back under command. */
  const shaken = w.sq.slice(1).flatMap(q => q.members.filter(m => !m.dead));
  const mergedYet = () => w.b.factions.us.squads.some(q => q.reconstitutedFrom && !q.disbanded);
  run(w, 380, () => {
    s.squad.contact = null;
    if (!mergedYet()) shaken.forEach(m => (w.r.BattleSoldierMind.of(m).stress = 0.4));
  });
  const merged = w.b.factions.us.squads.find(q => q.reconstitutedFrom && !q.disbanded);
  assert.ok(merged, 'the survivors and the fled man were pooled into one squad');
  assert.ok(merged.members.includes(s), 'he is in it');
  assert.equal(s.squad, merged, 'on its roster');
  assert.ok(s.weapon, 'armed');
  assert.equal(merged.members.length, 6, 'a viable understrength squad');
  assert.ok(
    merged.members.every(m => m.squad === merged),
    'every man of it on the one roster'
  );
  assert.equal(
    s.countsForElimination,
    true,
    'reconstitution returns the former fled man to force accounting'
  );
  assert.ok(
    w.r.BattleCommanderDoctrine.forceUnits(w.b, 'us').includes(s),
    'the General counts him again after the successful roster merge'
  );
  invariants(w);
  /* Calm again (the pin is off), the reconstituted squad rallies and the General, who ignored the
     detachment, briefs the squad the man is part of again - the only legal road back under
     command, taken. */
  run(w, 100);
  assert.notEqual(merged.state, 'retreat', 'back in the fight');
  assert.ok(merged._macroMission, 'the reconstituted squad holds a mission');
  assert.ok(['executing', 'issued'].includes(merged._macroMission.status), 'a live one');
  invariants(w);
});

test('a fled sergeant can supply the surviving squad object without leaving the rebuilt squad marked fled', () => {
  const w = world(),
    { s } = broken(w, {
      role: 'sergeant',
      safe: { x: LANES[0], z: HOME_Z + 40 },
      at: { x: LANES[0], z: HOME_Z + 400 }
    }),
    lone = s.squad,
    survivors = [squad(w, 1, 4, 20), squad(w, 2, 3, 20)];

  /* Leave three and two riflemen in the ordinary remnants. Their successors are riflemen while
     the fled detachment still has its sergeant, so when he arrives the 1 + 3 + 2 pool reaches
     the six-man minimum and the fled squad object wins survivor selection by seniority. */
  survivors.forEach(q => {
    const leader = w.r.SquadAI.leaderOf(q);
    assert.ok(leader && leader.role === 'sergeant');
    w.b.killSoldier(leader, null);
  });
  const shaken = survivors.flatMap(q => q.members.filter(m => !m.dead)),
    mergedYet = () => w.b.factions.us.squads.some(q => q.reconstitutedFrom && !q.disbanded);
  run(w, 420, () => {
    s.squad.contact = null;
    if (!mergedYet()) shaken.forEach(m => (w.r.BattleSoldierMind.of(m).stress = 0.4));
  });

  const merged = w.b.factions.us.squads.find(q => q.reconstitutedFrom && !q.disbanded);
  assert.ok(merged, 'the six survivors reconstituted');
  assert.equal(merged, lone, 'the senior fled sergeant made his detachment the surviving squad object');
  assert.equal(merged.fledId, null, 'the one-man detachment identity ended at the merge');
  assert.equal(merged.fledFrom, null, 'its source marker ended with it');
  assert.equal(merged.members.length, 6, 'the survivor object is now a viable rebuilt squad');
  assert.equal(s.countsForElimination, true, 'the sergeant is back in force accounting');
  assert.ok(w.r.BattleCommanderDoctrine.forceUnits(w.b, 'us').includes(s));

  run(w, 100);
  assert.notEqual(merged.state, 'retreat', 'the viable rebuilt squad can rally normally');
  assert.ok(merged._macroMission, 'and return to ordinary command');
  assert.ok(['issued', 'executing'].includes(merged._macroMission.status));
  invariants(w);
});

test('an unarmed man runs through the whole pipeline: ammunition, sidearm, fire, the report and the snapshot', () => {
  const w = world(),
    { s, q } = broken(w, { safe: { x: LANES[0], z: HOME_Z + 60 }, at: { x: LANES[0], z: HOME_Z + 400 } });
  assert.equal(s.weapon, null);
  assert.equal(w.r.SquadAI.tryFire(s, w.b), false, 'no weapon, no shot');
  assert.doesNotThrow(() => w.ammo.onSimulationStep(w.b, { dt: 0.15 }));
  assert.doesNotThrow(() => w.r.BattleAmmunition.summary(w.b));
  assert.equal(w.r.BattleAmmunition.available(s), false);
  assert.doesNotThrow(() => run(w, 30));
  assert.ok(q);
});

test('none of it draws from the combat RNG', () => {
  const w = world();
  let draws = 0;
  const real = w.b.random;
  w.b.random = () => (draws++, real.call(w.b));
  const { s } = broken(w, { safe: { x: LANES[0], z: HOME_Z + 60 }, at: { x: LANES[0], z: HOME_Z + 400 } });
  const before = draws;
  run(w, 400, () => (s.squad.contact = null));
  assert.equal(s.eng.fledPhase, null, 'the whole lifecycle ran');
  assert.equal(draws, before, 'no draw from the break to the weapon at base');
});

test('flee is the only reaction that leaves a man his weapons nowhere: cower and freeze keep them', () => {
  for (const [k, temper] of [
    ['freeze', { flee: 0, freeze: 1, rage: 0 }],
    ['cower', null]
  ]) {
    const w = world('?stressAct=cower,freeze'),
      q = squad(w, 0, 10, 100),
      s = rifleman(q);
    run(w, 1);
    trouble(w, q, { x: s.root.position.x, z: s.root.position.z + 100 });
    const M = w.r.BattleSoldierMind;
    if (temper) M.of(s).temper = temper;
    M.of(s).stress = k === 'cower' ? 0.6 : 0.95;
    M.of(s).pub = M.of(s).stress;
    M.of(s).at = w.b.time;
    run(w, 0.6, () => w.r.SquadAI.pin(s, w.b, 2));
    assert.equal(s.eng.state, k);
    assert.ok(s.weapon, k + ' keeps his rifle');
    assert.equal(s.squad, q, k + " stays on his squad's roster");
    assert.equal(s.eng.fledPhase, undefined);
  }
});

test('a man going home who was taken in by a squad in regroup keeps running home, not to the regroup anchor', () => {
  const w = world();
  const a = squad(w, 0, 10, 150),
    s = rifleman(a);
  run(w, 1);
  const refuge = { x: LANES[0], z: HOME_Z + 150 };
  a.safePoint = refuge;
  trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  snap(w, s);
  run(w, 0.5, () => {
    snap(w, s);
    trouble(w, a, { x: LANES[0], z: HOME_Z + 400 });
  });
  run(w, 3, () => (s.squad.contact = null));
  const near = squad(w, 1, 4, 150);
  const stay = () => {
    near.members.forEach(m => ((m.root.position.x = refuge.x + 20), (m.root.position.z = refuge.z)));
    near.inContact = false;
  };
  stay();
  run(w, 1.5, stay);
  assert.equal(s.squad, near, 'taken in');
  assert.equal(s.eng.fledPhase, 'home');
  near.commandPhase = 'regroup';
  near.rally = { x: refuge.x + 30, z: refuge.z - 40 };
  run(w, 1, () => {
    stay();
    near.commandPhase = 'regroup';
  });
  const goal = s._movementResolver && s._movementResolver.goal;
  assert.notEqual(goal && goal.kind, 'regroup', 'the regroup order does not take over a man going home');
  assert.equal(s.eng.fledPhase, 'home');
});

test("a man in a fled phase is not part of the squad's cohesion: a squad that took him in and rallied does not regroup on his account", () => {
  const w = world(),
    q = squad(w, 0, 10, 150),
    S = w.r.BattleRegroupHysteresis,
    limit = 34;
  run(w, 1);
  /* Three men 200 m behind the squad (more than the two stragglers a ten-man squad lets lag): running home, or scattered. */
  const behind = [rifleman(q, 1), rifleman(q, 2), rifleman(q, 3)];
  behind.forEach(s => (s.root.position.z -= 200));
  const control = S.assessment(q, limit);
  assert.ok(
    control.rawSpread > limit && control.dispersed,
    'three ordinary men 200 m behind are a dispersal (the control)'
  );
  behind.forEach(s => (s.eng.fledPhase = 'home'));
  const fled = S.assessment(q, limit);
  assert.ok(
    fled.rawSpread < limit,
    'in a fled phase they are not counted: spread ' + fled.rawSpread.toFixed(1)
  );
  assert.equal(fled.dispersed, false);
  assert.ok(behind.every(s => !fled.members.includes(s) && !fled.outrunners.includes(String(s.id))));
  /* A man who is merely scattered still counts, fled men or none. */
  const other = rifleman(q, 4);
  other.root.position.z -= 200;
  assert.ok(S.assessment(q, limit).rawSpread > limit, 'a scattered man is still counted beside them');
  behind.forEach(s => (s.eng.fledPhase = null));
  other.root.position.z += 200;
  behind.forEach(s => (s.root.position.z += 200));
  assert.equal(S.assessment(q, limit).dispersed, false, 'back with the squad, nobody is');
});

console.log('fled-man-check: ' + n + ' tests passed');
