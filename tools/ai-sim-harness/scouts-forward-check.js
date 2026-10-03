#!/usr/bin/env node
'use strict';

/* Scouts Forward: deterministic Squad Leader recon without hidden truth.
   Exercises the command lease, Movement Resolver handoff, personal beliefs/callouts and every bounded release. */
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
  let navCalls = 0;
  const r = H.bootstrap({ search: opts.search == null ? '?scoutsForward=1' : opts.search });
  r.BattleNavigation = {
    movementClear() {
      navCalls++;
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
    seed: +(process.env.HARNESS_SEED || 24680),
    heightAt: opts.heightAt || (() => 0),
    obstacles: opts.obstacles || []
  });
  b._movementRoot = r;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: opts.objective || { x: 0, z: 64 },
    facing: 0
  });
  q.commandPhase = 'approach';
  q.commandRole = 'center';
  q.route = [Object.assign({}, opts.objective || { x: 0, z: 64 })];
  q.routeIndex = 0;
  q.objective = Object.assign({}, q.route[0]);
  return { r, b, q, S: r.BattleSquadStability, navCalls: () => navCalls };
}
function enemy(r, b, id = 900, x = 0, z = 42) {
  const model = { root: { position: H.vec(x, b.heightAt(x, z), z), rotation: { x: 0, y: Math.PI, z: 0 } } };
  const deal = r.SquadAI.dealLoadout(null, {}, 'rifleman', 'ge');
  const e = r.SquadAI.createSoldier({
    id,
    faction: 'ge',
    role: 'rifleman',
    squad: { id: 'ge-hidden', faction: 'ge', members: [], state: 'advance' },
    slotIndex: 0,
    model,
    weapon: deal.weapon,
    secondary: deal.secondary
  });
  e.fireCooldown = 0;
  b._roster.ge.push(e);
  b.factions.ge.alive++;
  return e;
}
function ids(a) {
  return a.map(s => s.id);
}
function start(w) {
  w.S.executeMission(w.b, w.q, null);
  assert.ok(w.r.BattleLeases.get(w.q, 'recon'), 'qualifying unknown approach opens one recon lease');
  assert.ok(w.q._reconTask, 'Squad Leader owns one recon task');
  return w.q._reconTask;
}
function freshTask(w) {
  const c = {
    signature: 'test-' + String(++freshTask.serial),
    reason: 'unknown-approach',
    from: { x: 0, z: 0 },
    goal: { x: 0, z: 64 },
    point: { x: 0, z: 26 },
    axis: { x: 0, z: 1 },
    goalDistance: 64
  };
  assert.equal(w.S.startRecon(w.q, w.b, c), true);
  return w.q._reconTask;
}
freshTask.serial = 0;

/* Flag/control arm and qualifying terrain. */
{
  const off = world({ search: '?scoutsForward=0' });
  assert.equal(off.S.scoutsForwardOn(), false);
  assert.equal(off.S.reconCandidate(off.q, off.b, off.q.objective), null, 'flag-off is a legacy control');
  off.S.executeMission(off.b, off.q, null);
  assert.equal(off.r.BattleLeases.get(off.q, 'recon'), null, 'flag-off does not create a recon task');

  const hill = world({
    objective: { x: 0, z: 140 },
    heightAt(x, z) {
      return z > 15 && z < 26 ? 8 - Math.abs(20.5 - z) * 0.4 : 0;
    }
  });
  const c = hill.S.reconCandidate(hill.q, hill.b, hill.q.objective);
  assert.ok(c && c.reason === 'crest', 'a visible crest can qualify a far unknown approach');
}

/* Selection is deterministic, scout-first and the tactical decision consumes no combat RNG. */
{
  const w = world();
  let draws = 0;
  const random = w.b.random;
  w.b.random = function () {
    draws++;
    return random.call(w.b);
  };
  const before = draws;
  const a = w.S.selectReconScouts(w.q, w.b);
  const b = w.S.selectReconScouts(w.q, w.b);
  assert.deepEqual(ids(a), ids(b), 'scout selection is deterministic');
  assert.ok(a.length > 0 && a.length < w.q.members.length, 'recon never sends the whole squad');
  assert.equal(a[0].role, 'scout', 'existing scout role is preferred');
  const c = w.S.reconCandidate(w.q, w.b, w.q.objective);
  assert.ok(c);
  assert.equal(w.S.startRecon(w.q, w.b, c), true);
  assert.equal(draws, before, 'recon decision/selection/start draws no combat RNG');
}

/* A current personal threat picture suppresses recon; aggregate contact alone does not become leader knowledge. */
{
  const w = world();
  const e = enemy(w.r, w.b);
  const leader = w.r.SquadAI.leaderOf(w.q);
  w.r.SquadAI.rememberSeen(leader, e, w.b, true, 'test-direct-sight');
  assert.equal(w.S.reconCandidate(w.q, w.b, w.q.objective), null, 'fresh leader belief is adequate current picture');

  const u = world();
  const hidden = enemy(u.r, u.b);
  u.q.contact = { unit: hidden, x: hidden.root.position.x, z: hidden.root.position.z, at: u.b.time, seenBy: 999 };
  assert.equal(u.r.SquadAI.soldierContact(u.r.SquadAI.leaderOf(u.q), u.b), null, 'aggregate squad.contact is not personal knowledge');
  assert.ok(u.S.reconCandidate(u.q, u.b, u.q.objective), 'aggregate contact is not an omniscient recon veto');
}

/* Main body holds; scouts are published through the ordinary squad-stability -> Movement Resolver path. */
{
  const w = world();
  const task = start(w);
  const selected = new Set(task.scoutIds.map(String));
  const body = w.q.members.filter(s => !selected.has(String(s.id)) && !s.dead);
  const bodyBefore = new Map(body.map(s => [String(s.id), { x: s.root.position.x, z: s.root.position.z }]));
  w.S.updateFireteams(w.q, w.b);
  assert.ok(w.navCalls() > 0, 'normal Movement Resolver legalization consulted navigation');
  for (const s of body) {
    const h = bodyBefore.get(String(s.id));
    assert.ok(Math.hypot(s._fireteamDestination.x - h.x, s._fireteamDestination.z - h.z) < 1e-9, 'main body holds its actual position');
  }
  for (const id of task.scoutIds) {
    const s = w.q.members.find(m => String(m.id) === String(id));
    assert.equal(s._movementResolver.order.owner, 'squad-stability', 'scout order belongs to existing squad-stability producer');
    assert.equal(s._movementResolver.order.kind, 'formation', 'scout uses ordinary order proposal kind');
    w.r.BattleMovementResolver.resolve(s, w.b);
    assert.ok(s.destination && s.destination.z > s.root.position.z, 'Movement Resolver writes the scout physical destination');
  }
  const anchor = { x: w.q.orderAnchor.x, z: w.q.orderAnchor.z };
  w.S.updateFireteams(w.q, w.b);
  assert.deepEqual(w.q.orderAnchor, anchor, 'recon order refresh does not move the main-body anchor');
}

/* Intentional scout separation belongs to recon, not the regroup lifecycle. */
{
  const w = world();
  const task = start(w);
  for (const id of task.scoutIds) {
    const scout = w.q.members.find(s => String(s.id) === String(id));
    scout.root.position.z += 70;
  }
  w.S.updateCohesion(w.b, w.q);
  assert.equal(w.r.BattleLeases.get(w.q, 'regroup'), null, 'live recon cannot open a competing regroup lease');
  w.S.endRecon(w.q, w.b, 'observed-no-contact');
  assert.ok(w.r.BattleLeases.holds(w.q, 'regroup-bypass', w.b.time), 'recon release grants a bounded rejoin grace');
  w.S.updateCohesion(w.b, w.q);
  assert.equal(w.r.BattleLeases.get(w.q, 'regroup'), null, 'rejoin grace prevents an immediate recon-to-regroup flip');
}

/* Hidden enemies are not known. Scout direct sight is personal until the existing callout actually delivers it. */
{
  const w = world();
  const task = start(w);
  const scout = w.q.members.find(s => String(s.id) === String(task.scoutIds[0]));
  const e = enemy(w.r, w.b, 901, scout.root.position.x, scout.root.position.z + 38);
  const leader = w.r.SquadAI.leaderOf(w.q);
  const far = w.q.members.find(s => !task.scoutIds.map(String).includes(String(s.id)) && s !== leader);
  far.root.position.x = scout.root.position.x + 100; // outside CALL_RANGE at send time

  assert.equal(w.r.SquadAI.soldierContact(scout, w.b), null);
  assert.equal(w.r.SquadAI.soldierContact(leader, w.b), null);
  const c1 = w.S.reconCandidate(w.q, w.b, w.q.objective);
  /* A live task itself prevents executeMission from creating another; candidate may be structurally valid,
     but it must not gain knowledge from the hidden enemy. */
  e.root.position.z += 20;
  const c2 = w.S.reconCandidate(w.q, w.b, w.q.objective);
  assert.deepEqual(c2 && c2.reason, c1 && c1.reason, 'moving a hidden enemy cannot change terrain/information qualification');

  w.r.SquadAI.perceive(scout, w.b);
  const seen = w.r.SquadAI.soldierContact(scout, w.b);
  assert.ok(seen && seen.source === 'seen', 'Perception gives direct sight only to the scout');
  assert.equal(w.r.SquadAI.soldierContact(leader, w.b), null, 'direct sight has not teleported to the leader');
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: true });
  assert.equal(w.q._reconLast.reason, 'scout-contact', 'reportable scout contact releases recon');

  w.b.time += 1.6;
  let told = 0;
  for (const man of w.q.members) {
    if (man === scout || man.dead) continue;
    w.r.SquadAI.applyCalloutBelief(man, w.b);
    const snap = w.r.SquadAI.beliefSnapshot(man, w.b);
    if ((snap.beliefs || []).some(x => x.source === 'told' && String(x.sourceSoldierId) === String(scout.id))) told++;
  }
  assert.ok(told > 0, 'delivered scout callout creates told beliefs only at actual recipients');
  const farSnap = w.r.SquadAI.beliefSnapshot(far, w.b);
  assert.equal((farSnap.beliefs || []).some(x => x.source === 'told'), false, 'out-of-range callout creates no knowledge');
  w.S.updateRecon(w.q, w.b, null);
  assert.ok(w.S.reconTelemetry(w.b).reportsDelivered > 0, 'recon telemetry observes actual told-belief delivery');
}

/* No-contact completion is uncertainty, not enemy-absence knowledge; the same approach cannot re-trigger. */
{
  const w = world();
  const task = start(w);
  enemy(w.r, w.b, 902, 0, 150); // exists in hidden truth but is never perceived
  for (const id of task.scoutIds) {
    const s = w.q.members.find(m => String(m.id) === String(id));
    const d = task.destinations[String(id)];
    s.root.position.x = d.x;
    s.root.position.z = d.z;
  }
  w.b.time += 0.1;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  w.b.time += w.S.tuning.scoutsForward.observe + 0.1;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  assert.equal(w.q._reconLast.reason, 'observed-no-contact');
  for (const id of task.scoutIds) {
    const s = w.q.members.find(m => String(m.id) === String(id));
    assert.equal(w.r.SquadAI.beliefSnapshot(s, w.b).unknown, true, 'nothing observed leaves scout knowledge unknown');
  }
  assert.equal(w.S.reconCandidate(w.q, w.b, w.q.objective), null, 'same approach cannot immediately re-enter recon');
  assert.equal(w.S.reconCandidate(w.q, w.b, w.q.objective), null);
  assert.equal(w.S.reconTelemetry(w.b).retriggerBlocked, 1, 'same-approach retrigger is diagnosed once, not churned');
}

/* Every invalidation releases the lease; timeout is bounded. */
for (const reason of ['under-fire', 'retreat', 'phase-change', 'battle-end']) {
  const w = world();
  const task = freshTask(w);
  if (reason === 'under-fire') w.S.updateRecon(w.q, w.b, { underFire: 1, contactStarted: false });
  else if (reason === 'retreat') {
    w.q.state = 'retreat';
    w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  } else if (reason === 'phase-change') {
    w.q.commandPhase = 'assault';
    w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  } else {
    w.b.winner = 'us';
    w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  }
  assert.equal(w.r.BattleLeases.get(w.q, 'recon'), null, reason + ' releases recon');
  assert.equal(w.q._reconLast.reason, reason);
  assert.ok(task.scoutIds.length < w.q.members.length);
}
{
  const w = world();
  const task = freshTask(w);
  w.b.time = task.until + 0.01;
  w.S.updateRecon(w.q, w.b, { underFire: 0, contactStarted: false });
  assert.equal(w.r.BattleLeases.get(w.q, 'recon'), null, 'bounded timeout releases the main body');
  assert.equal(w.q._reconLast.reason, 'timeout');
}

console.log('PASS Scouts Forward lease, terrain/personal-information decision, deterministic selection, Movement Resolver ownership, callout delivery, uncertainty, cancellation and timeout');
