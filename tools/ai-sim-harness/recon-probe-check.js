#!/usr/bin/env node
'use strict';

/* Defender reconnaissance (#393): a progressive probe instead of a centroid-driven repeat scan.
   A defender's scout goal hung off the whole-squad centroid, so scouts walking out moved the 12 m signature
   cell and the same standing DEFEND brief dispatched a new scan after every no-contact end (#361 defect 4).
   The probe key is the objective plus a bearing sector; the depth step advances only when the scouts physically
   got further than the last probe, up to a cap. ?reconProbe=0 restores the old keying. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

function load(root, rel) {
  const source = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', source)(root, root, console);
}
function world(opts = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search: '?scoutsForward=1&commandMovement=0&commandRelay=0&stressAct=0' + (opts.extra || '')
  });
  r.BattleNavigation = {
    movementClear() {
      return true;
    },
    lineOfSightBlocked() {
      return false;
    },
    invalidateNavPath() {},
    invalidateNavCache() {}
  };
  load(r, 'battle/movement-resolver.js');
  const b = H.makeBattle(r, {
    seed: 24680,
    heightAt: opts.heightAt || (() => 0),
    obstacles: []
  });
  b._movementRoot = r;
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 0 }, facing: 0 });
  for (let i = q.members.length - 1; i >= (opts.men || q.members.length); i--) q.members[i].dead = true;
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
    action: opts.action || 'defend',
    objectiveId: 'owned',
    point: { x: 0, z: 0 },
    route: [],
    status: 'executing'
  };
  return { r, b, q, S: r.BattleSquadStability };
}
function walkOut(w, metres) {
  for (const id of w.q._reconTask.scoutIds) {
    const scout = w.q.members.find(s => String(s.id) === String(id));
    scout.root.position.z += metres;
  }
}
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
/* The scouts walk out, find nothing, the task ends, the Squad Leader re-evaluates. Returns each defender task's point
   (a squad whose scouts drift it off the objective is the approach path's business, not a defender's). */
function churn(extra, rounds, move) {
  const w = world({ extra });
  w.S.executeMission(w.b, w.q, null);
  const points = [];
  for (let round = 0; round < rounds && w.q._reconTask; round++) {
    if (w.q._reconTask.defenderOrigin) points.push(Object.assign({}, w.q._reconTask.point));
    walkOut(w, move);
    w.S.endRecon(w.q, w.b, 'observed-no-contact');
    /* The body edges up behind its scouts (staying on its objective), which also moves the centroid across a 12 m cell. */
    if (move) for (const m of w.q.members) m.root.position.z += 4;
    w.b.time += 1;
    w.S.executeMission(w.b, w.q, null);
  }
  return points;
}

/* 1. The 20-task churn: scouts moving must not manufacture scans without bound. */
{
  const probed = churn('', 6, 40);
  const control = churn('&reconProbe=0', 6, 40);
  assert.ok(probed.length >= 1, 'a stationed defender still opens a first probe');
  assert.ok(probed.length <= 3, 'the probe is capped at 3 depth steps, got ' + probed.length);
  assert.ok(control.length > 3, '?reconProbe=0 is the control: the centroid shift re-triggers recon');
}

/* 2. Discovery is preserved: each successive probe goes to newly unobserved ground, further out. */
{
  const p = churn('', 6, 40);
  assert.ok(p.length >= 2, 'a no-contact probe is followed by a second look');
  for (let i = 1; i < p.length; i++)
    assert.ok(
      dist(p[i], { x: 0, z: 0 }) > dist(p[i - 1], { x: 0, z: 0 }) + 20,
      'probe ' + (i + 1) + ' reaches ground the last one did not'
    );
}

/* 3. A scout that never got anywhere (blocked, no forward progress) does not escalate or repeat. */
{
  const p = churn('', 6, 0);
  assert.equal(p.length, 1, 'no physical progress, no new scan: ' + p.length);
}

/* 4. A crest between the defender and the enemy still qualifies the first probe. */
{
  const w = world({
    heightAt(x, z) {
      return z > 40 && z < 60 ? 8 - Math.abs(50 - z) * 0.4 : 0;
    }
  });
  w.S.executeMission(w.b, w.q, null);
  const task = w.q._reconTask;
  assert.ok(task && task.defenderOrigin, 'the defender opens recon toward the crest');
  assert.equal(task.reason, 'crest', 'the first probe is aimed at the crest');
  w.S.endRecon(w.q, w.b, 'scout-contact');
  assert.equal(
    w.q._reconProbes && Object.keys(w.q._reconProbes).length,
    1,
    'contact leaves one probe record'
  );
  const key = Object.keys(w.q._reconProbes)[0];
  assert.equal(w.q._reconProbes[key].step, 0, 'a contact does not count as an escalation step');
}

/* 5. Squad sizes and holds: 4-man and 5-man squads release the anchor after a no-contact probe;
   a 3-man squad does not scout; a prepared garrison hold never opens recon. */
for (const men of [4, 5]) {
  const w = world({ men });
  w.S.executeMission(w.b, w.q, null);
  assert.ok(w.q._reconTask, men + '-man squad can probe');
  walkOut(w, 40);
  w.S.endRecon(w.q, w.b, 'observed-no-contact');
  assert.ok(
    w.r.BattleLeases.holds(w.q, 'regroup-bypass', w.b.time),
    men + '-man squad: the returning scouts get the rejoin grace, so the main body releases the anchor'
  );
  assert.equal(w.r.BattleLeases.get(w.q, 'recon'), null, men + '-man squad: the recon lease is released');
}
{
  const w = world({ men: 3 });
  w.S.executeMission(w.b, w.q, null);
  assert.equal(w.q._reconTask || null, null, 'a 3-man squad does not send scouts');
}
{
  const w = world({ action: 'support' });
  w.S.executeMission(w.b, w.q, null);
  assert.equal(w.q._reconTask || null, null, 'a prepared support/garrison hold never opens recon');
}

console.log('recon-probe-check: ok');
