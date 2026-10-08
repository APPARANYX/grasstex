#!/usr/bin/env node
'use strict';

/* Recon time budget (#393): the 28 s RECON_TUNING.timeout was a constant, not derived from the walk. A defender's scouts
   walk at the pace of their own gait (about 1.0-1.3 m/s once adoption is counted), so a point 41-50 m out is not
   reached in 28 s: the task ends in 'timeout' (no report) and the ledger retries once, then closes the point unobserved.
   The budget is now the walk to the farthest destination at the slowest scout's own ground speed plus the observation
   window and the report allowance, never shorter than the old constant. ?reconBudget=0 restores the constant. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

function load(root, rel) {
  const source = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', source)(root, root, console);
}
function world(extra = '', opts = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search: '?scoutsForward=1&commandMovement=0&commandRelay=0&stressAct=0' + extra
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
  const b = H.makeBattle(r, { seed: 24680, heightAt: () => 0, obstacles: [] });
  b._movementRoot = r;
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 0 }, facing: 0 });
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
  if (opts.pace) for (const m of q.members) m._locomotionGroundSpeed = opts.pace;
  return { r, b, q, S: r.BattleSquadStability };
}
function budget(w) {
  w.S.executeMission(w.b, w.q, null);
  const task = w.q._reconTask;
  assert.ok(task && task.defenderOrigin, 'a stationed defender opens recon');
  return { task, seconds: task.until - w.b.time };
}

/* 1. The budget follows the walk: a slow pace over a 50 m point exceeds the old constant. */
{
  const w = world('', { pace: 1.0 });
  const { task, seconds } = budget(w);
  const t = w.S.tuning.scoutsForward;
  const walk = Math.max(
    ...task.scoutIds.map(id => {
      const m = w.q.members.find(s => String(s.id) === String(id)),
        d = task.destinations[String(id)];
      return Math.hypot(m.root.position.x - d.x, m.root.position.z - d.z);
    })
  );
  const needed = walk / 1.0 + t.observe + t.reportWatch;
  assert.ok(
    needed > t.timeout,
    'the fixture point is further than 28 s of walking (' + needed.toFixed(1) + ' s)'
  );
  assert.ok(
    Math.abs(seconds - needed) < 0.3,
    'budget is walk / pace + observe + report allowance (' + seconds.toFixed(1) + ')'
  );
}

/* 2. Never shorter than the old constant: a fast pace over the same point keeps 28 s. */
{
  const w = world('', { pace: 6 });
  const { seconds } = budget(w);
  assert.equal(+seconds.toFixed(2), w.S.tuning.scoutsForward.timeout, 'a fast pace keeps the old floor');
}

/* 3. No pace known (a soldier with no gait yet): fall back to the old constant, no invented number. */
{
  const w = world('');
  for (const m of w.q.members) {
    delete m._locomotionGroundSpeed;
    m.walkSpeed = undefined;
  }
  const { seconds } = budget(w);
  assert.equal(+seconds.toFixed(2), w.S.tuning.scoutsForward.timeout, 'unknown pace keeps the constant');
}

/* 4. ?reconBudget=0 restores the constant at any pace. */
{
  const w = world('&reconBudget=0', { pace: 1.0 });
  const { seconds } = budget(w);
  assert.equal(+seconds.toFixed(2), w.S.tuning.scoutsForward.timeout, 'the control arm keeps 28 s');
}

/* 5. Physically: scouts walking at 1.0 m/s to a 50 m point observe it with the derived budget and time out on the old one. */
function reasonAfter(extra) {
  const w = world(extra, { pace: 1.0 });
  w.S.executeMission(w.b, w.q, null);
  assert.ok(w.q._reconTask, 'task open');
  for (const m of w.q.members) m.speed = 1.0;
  let reason = null;
  H.run(w.r, w.b, 75, () => {
    if (!reason && w.q._reconLast) reason = w.q._reconLast.reason;
  });
  return reason;
}
{
  const derived = reasonAfter('');
  const control = reasonAfter('&reconBudget=0');
  assert.equal(control, 'timeout', 'the old constant times out before the scouts arrive (' + control + ')');
  assert.equal(
    derived,
    'observed-no-contact',
    'the derived budget lets the scouts arrive and observe (' + derived + ')'
  );
}

console.log('recon-budget-check: ok');
