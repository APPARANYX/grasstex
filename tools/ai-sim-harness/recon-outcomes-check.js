#!/usr/bin/env node
'use strict';

/* Recon outcome ledger (#393): defender reconnaissance follows observed ground, not the centroid.
   Churn under one unchanged DEFEND brief is gone, legitimate follow-on past a screen survives,
   timeouts/blocked scouts are reported and bounded, mission change and newer contact re-open ground,
   and the legacy arm stays reachable through ?reconLedger=0 for paired comparison. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

function load(root, rel) {
  const source = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', source)(root, root, console);
}
function defendWorld(opts = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search: opts.search == null ? '?scoutsForward=1&commandMovement=0&commandRelay=0' : opts.search
  });
  r.BattleNavigation = {
    movementClear() {
      return true;
    },
    lineOfSightBlocked() {
      return false;
    },
    invalidateNavPath() {},
    invalidateNavCache() {},
    nextWaypoint: (self, s, d) => d
  };
  load(r, 'battle/movement-resolver.js');
  const b = H.makeBattle(r, {
    seed: 24680,
    heightAt: opts.heightAt || (() => 0),
    obstacles: []
  });
  b._movementRoot = r;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 0 },
    facing: 0,
    composition: opts.composition
  });
  b.scene = { metadata: { battleTown: { center: { x: 0, z: 100 }, radius: 250 } } };
  r.BattleObjectiveSystem = {
    get() {
      return { def: { radius: 30 } };
    }
  };
  q.commandPhase = 'defend';
  q._macroMission = {
    version: 1,
    intent: 'defend',
    action: 'defend',
    objectiveId: 'owned',
    point: { x: 0, z: 0 },
    route: [],
    status: 'executing'
  };
  return { r, b, q, S: r.BattleSquadStability };
}
function member(q, id) {
  return q.members.find(s => String(s.id) === String(id));
}
function arrive(w, task) {
  for (const id of task.scoutIds) {
    const s = member(w.q, id),
      d = task.destinations[String(id)];
    s.root.position.x = d.x;
    s.root.position.z = d.z;
  }
}
/* The natural no-contact completion: scouts at their destinations, arrival + observation window. */
function observeAndEnd(w) {
  const task = w.q._reconTask;
  assert.ok(task, 'a recon task is running');
  arrive(w, task);
  w.b.time += 0.1;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  w.b.time += w.S.tuning.scoutsForward.observe + 0.1;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  assert.equal(w.q._reconLast.reason, 'observed-no-contact');
}
/* The #393 churn fixture: decide with scouts home, complete the task with scouts out, decide again
   with scouts still out (shifted centroid), then let them rejoin and decide once more. Monotonic
   scouting never churns; this alternation is what manufactured a fresh task every round on main. */
function churnRound(w, home) {
  if (!w.q._reconTask) return 0;
  let started = 0;
  arrive(w, w.q._reconTask);
  w.S.endRecon(w.q, w.b, 'observed-no-contact');
  w.b.time += 1;
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  if (w.q._reconTask) {
    started++;
    arrive(w, w.q._reconTask);
    w.S.endRecon(w.q, w.b, 'observed-no-contact');
    w.b.time += 1;
    w.q.commandPhase = 'defend';
  }
  for (const h of home) {
    h.s.root.position.x = h.x;
    h.s.root.position.z = h.z;
  }
  w.S.executeMission(w.b, w.q, null);
  if (w.q._reconTask) started++;
  return started;
}
function countTasks(w, rounds) {
  let total = 1; /* the opening task */
  for (let i = 0; i < rounds; i++) {
    const task = w.q._reconTask;
    if (!task) break;
    const home = task.scoutIds.map(id => {
      const s = member(w.q, id);
      return { s, x: s.root.position.x, z: s.root.position.z };
    });
    total += churnRound(w, home);
  }
  return total;
}

/* 1. Churn: one unchanged DEFEND brief yields exactly one defender task (issue #393 fixture —
   the legacy arm produces a fresh signature every centroid swing and churns unboundedly). */
{
  const w = defendWorld();
  let draws = 0;
  const random = w.b.random;
  w.b.random = function () {
    draws++;
    return random.call(w.b);
  };
  w.S.executeMission(w.b, w.q, null);
  assert.ok(w.q._reconTask && w.q._reconTask.defenderOrigin, 'stationed defender opens one recon task');
  const total = countTasks(w, 12);
  assert.equal(total, 1, 'scouts walking out and rejoining never manufactures a second task');
  assert.ok(
    Array.isArray(w.q._reconLedger) && w.q._reconLedger.length === 1,
    'the single investigation is recorded once'
  );
  const entry = w.q._reconLedger[0];
  assert.equal(entry.observed, true, 'arrival plus observation is a report');
  assert.equal(entry.attempts, 1, 'one dispatch for one observation point');
  assert.equal(entry.defenderOrigin, true, 'the entry is tagged with its decision origin');
  assert.equal(entry.missionVersion, 1, 'entries are keyed to the mission they served');
  assert.ok(
    w.S.reconTelemetry(w.b).retriggerBlocked >= 1,
    'the blocked duplicate re-trigger is diagnosed, not silently swallowed'
  );
  assert.equal(draws, 0, 'defender recon decisions draw no randomness');
}

/* 1b. Control arm: ?reconLedger=0 restores the centroid-derived goal and its oscillating churn —
   the paired evidence that the fixture still has teeth if the fix is ever reverted blindly. */
{
  const w = defendWorld({ search: '?scoutsForward=1&commandMovement=0&commandRelay=0&reconLedger=0' });
  w.S.executeMission(w.b, w.q, null);
  assert.ok(w.q._reconTask, 'control arm opens the first task');
  const total = countTasks(w, 12);
  assert.ok(
    total >= 10,
    'legacy centroid keying re-triggers on every out-and-back swing (' + total + ' tasks)'
  );
  assert.equal(w.q._reconLedger, undefined, 'control arm keeps the ledger off');
}

/* 2. Follow-on past a screen survives (the #388 regression guard): a crest mid-axis yields a
   first point short of it, then — only then — one justified point on its far side, and stop. */
{
  const w = defendWorld({
    heightAt: (x, z) => (z > 60 && z < 72 ? 9 - Math.abs(66 - z) * 0.5 : 0)
  });
  w.S.executeMission(w.b, w.q, null);
  const p1 = w.q._reconTask;
  assert.ok(p1 && p1.point.z < 60, 'first observation point sits short of the crest');
  observeAndEnd(w);
  w.b.time += 1;
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  const p2 = w.q._reconTask;
  assert.ok(p2, 'an unobserved screen on the far side justifies exactly one follow-on');
  assert.ok(p2.point.z > 72, 'the follow-on lands past the crest');
  assert.ok(p2.point.z - p1.point.z >= 16, 'the follow-on advances materially');
  assert.notEqual(p2.signature, p1.signature, 'the follow-on is a distinct investigation');
  arrive(w, p2);
  w.S.endRecon(w.q, w.b, 'observed-no-contact');
  w.b.time += 1;
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  assert.ok(!w.q._reconTask, 'open ground beyond the last observation needs no third task');
  assert.equal(w.q._reconLedger.length, 2, 'two observation points, two entries');
}

/* 3. Timeout with blocked scouts is reported and retried at most once, then the chain stops. */
{
  const w = defendWorld();
  w.r.BattleExecutionOutcome.man = () => ({ state: 'blocked', kind: 'obstacle' });
  w.S.executeMission(w.b, w.q, null);
  const p1 = w.q._reconTask;
  w.b.time = p1.until + 0.01;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  assert.equal(w.q._reconLast.reason, 'timeout', 'scouts that never arrive end in timeout');
  const first = w.q._reconLedger[0];
  assert.equal(first.observed, false, 'a timeout is not a report');
  assert.equal(first.attempts, 1, 'first failed dispatch counted');
  assert.equal(first.blockedScouts, p1.scoutIds.length, 'the #387 reader names the blocked scouts');
  assert.ok(first.blockers && first.blockers.obstacle >= 1, 'the physical blocker kind is recorded');
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  const retry = w.q._reconTask;
  assert.ok(retry, 'a point with no report earns one bounded retry');
  assert.ok(
    Math.hypot(retry.point.x - p1.point.x, retry.point.z - p1.point.z) <= 12,
    'the retry investigates the same ground'
  );
  w.b.time = retry.until + 0.01;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  assert.equal(w.q._reconLedger[0].attempts, 2, 'second failed dispatch counted');
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  assert.ok(!w.q._reconTask, 'retryCap stops the chain: no third dispatch of dead ground');
}

/* 4. Mission supersession: a new brief retires the standing task and starts fresh ground truth. */
{
  const w = defendWorld();
  w.S.executeMission(w.b, w.q, null);
  const p1 = w.q._reconTask;
  arrive(w, p1);
  w.q._macroMission = Object.assign({}, w.q._macroMission, { version: 2 });
  w.b.time += 1;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  assert.equal(w.q._reconLast.reason, 'mission-change', 'the old brief ends its own task');
  assert.equal(w.q._reconLedger[0].missionVersion, 1, 'the retired entry keeps its own mission key');
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  const fresh = w.q._reconTask;
  assert.ok(fresh && fresh.missionVersion === 2, 'the new brief may reconnoitre the same ground');
  assert.ok(
    Math.hypot(fresh.point.x - p1.point.x, fresh.point.z - p1.point.z) <= 12,
    'same ground under a new mission is a new investigation'
  );
}

/* 5. Newer enemy information re-opens observed ground — but only once per sighting. */
{
  const w = defendWorld();
  w.S.executeMission(w.b, w.q, null);
  observeAndEnd(w);
  const endedAt = w.q._reconLedger[0].endedAt;
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  assert.ok(!w.q._reconTask, 'stale observation stands until something changes');
  w.q.contact = { x: 0, z: 95, at: endedAt + 1, confidence: 0.9 };
  w.b.time = endedAt + 1;
  w.S.executeMission(w.b, w.q, null);
  assert.ok(w.q._reconTask, 'a newer squad contact re-opens the ground for investigation');
  observeAndEnd(w);
  w.q.commandPhase = 'defend';
  w.S.executeMission(w.b, w.q, null);
  assert.ok(
    !w.q._reconTask,
    'the same sighting does not renew itself: observation after it closes the ground'
  );
}

/* 6. Small squads stand the defense without scouts; full squads send a detachment. */
{
  const few = defendWorld({ composition: ['sergeant', 'rifleman', 'rifleman'] });
  few.S.executeMission(few.b, few.q, null);
  assert.ok(!few.q._reconTask, 'a 3-man squad cannot detach scouts');
  assert.equal(few.q.commandPhase, 'defend', 'it stands its defense instead');
  const small = defendWorld({ composition: ['sergeant', 'scout', 'rifleman', 'rifleman'] });
  small.S.executeMission(small.b, small.q, null);
  assert.ok(small.q._reconTask, 'a 4-man squad still reconnoitres');
  assert.equal(small.q._reconTask.scoutIds.length, 1, 'it detaches exactly one scout');
  assert.ok(small.q._reconTask.scoutIds.length < small.q.members.length, 'never the whole squad');
}

/* 7. Live discovery over a crest (the #365 stalemate): a defender's scouts cross the hill and
   acquire the attacker — without the churn that used to walk them off the objective. */
{
  H.resetIds();
  const r = H.bootstrap({ search: '?scoutsForward=1&commandMovement=0&commandRelay=0' });
  r.BattleNavigation = {
    movementClear() {
      return true;
    },
    lineOfSightBlocked() {
      return false;
    },
    invalidateNavPath() {},
    invalidateNavCache() {},
    nextWaypoint: (self, s, d) => d
  };
  load(r, 'battle/movement-resolver.js');
  const b = H.makeBattle(r, {
    seed: 13579,
    heightAt: (x, z) => (z > 20 && z < 28 ? 8 - Math.abs(24 - z) * 0.5 : 0),
    obstacles: []
  });
  b._movementRoot = r;
  const us = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 0 },
    facing: 0
  });
  b.scene = { metadata: { battleTown: { center: { x: 0, z: 60 }, radius: 250 } } };
  r.BattleObjectiveSystem = {
    get() {
      return { def: { radius: 30 } };
    }
  };
  us.commandPhase = 'defend';
  us._macroMission = {
    version: 1,
    intent: 'defend',
    action: 'defend',
    objectiveId: 'owned',
    point: { x: 0, z: 0 },
    route: [],
    status: 'executing'
  };
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: 190,
    objective: { x: 0, z: 0 },
    facing: Math.PI
  });
  ge.commandPhase = 'approach';
  ge.commandRole = 'center';
  ge.route = [{ x: 0, z: 0 }];
  ge.routeIndex = 0;
  let contactSeen = false;
  const signatures = new Set();
  H.run(r, b, 60, battle => {
    if (us.inContact || ge.inContact) contactSeen = true;
    if (us._reconTask) signatures.add(us._reconTask.signature);
  });
  assert.ok(contactSeen, 'scouts crossing the crest acquire the attacker through the fog');
  assert.ok(
    signatures.size <= 3,
    'the defense probes a bounded set of observation points (' + signatures.size + ' tasks)'
  );
}

/* 8. Attacker route reconnaissance is unchanged: it still fires on an unknown approach, cannot
   re-trigger on the same approach, and releases the main body to advance (parent mission). */
{
  H.resetIds();
  const r = H.bootstrap({ search: '?scoutsForward=1&commandMovement=0&commandRelay=0' });
  r.BattleNavigation = {
    movementClear() {
      return true;
    },
    lineOfSightBlocked() {
      return false;
    },
    invalidateNavPath() {},
    invalidateNavCache() {},
    nextWaypoint: (self, s, d) => d
  };
  load(r, 'battle/movement-resolver.js');
  const b = H.makeBattle(r, { seed: 24680, heightAt: () => 0, obstacles: [] });
  b._movementRoot = r;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 64 },
    facing: 0
  });
  q.commandPhase = 'approach';
  q.commandRole = 'center';
  q.route = [{ x: 0, z: 64 }];
  q.routeIndex = 0;
  q.objective = { x: 0, z: 64 };
  const S = r.BattleSquadStability;
  S.executeMission(b, q, null);
  const task = q._reconTask;
  assert.ok(task && !task.defenderOrigin, 'unknown approach opens route reconnaissance');
  for (const id of task.scoutIds) {
    const s = q.members.find(m => String(m.id) === String(id)),
      d = task.destinations[String(id)];
    s.root.position.x = d.x;
    s.root.position.z = d.z;
  }
  b.time += 0.1;
  S.updateRecon(q, b, { underFire: 0, contactStarted: false });
  b.time += S.tuning.scoutsForward.observe + 0.1;
  S.updateRecon(q, b, { underFire: 0, contactStarted: false });
  assert.equal(q._reconLast.reason, 'observed-no-contact');
  const ledger = q._reconLedger;
  assert.ok(
    ledger && ledger.length === 1 && ledger[0].defenderOrigin === false,
    'route outcomes are ledgered without the defender tag'
  );
  assert.equal(S.reconCandidate(q, b, q.objective), null, 'same approach cannot re-enter recon');
  const leader = r.SquadAI.leaderOf(q),
    leaderZ = leader.root.position.z;
  H.run(r, b, 8);
  const advanced = leader.root.position.z - leaderZ;
  assert.ok(
    advanced > 3,
    'the main body resumes its parent mission after the release (' + advanced.toFixed(1) + ' m)'
  );
}

console.log(
  'PASS Recon outcome ledger: defender churn eliminated, follow-on past screens preserved, timeouts reported and bounded, mission change and newer contact re-open ground, route reconnaissance unchanged'
);
