#!/usr/bin/env node
'use strict';
/* One publisher for the squad's anchor pair (`orderAnchor` and `rally`), and the writer-ping-pong that two
   publishers produced.

   Observed on the standard benchmark battles under the default genome: every `writer-ping-pong` module 36
   raised (21 in 30 battles, on no other field) was the Squad Leader, module 16, against itself. Its per-step
   advance (`advanceSquadAnchor`, the `squadCommand` slot) and its regroup commit (`updateCohesion`, inside
   the `squad-command` commander hook) each assigned the pair, and module 36 labels a write with the hook it
   runs in, or with a pre-M3C guess (`squad-orders`) when it runs in none, so one owner reached by two paths
   read as two owners: squad-orders, squad-stability, squad-orders inside 8 s. The General's reconstitution
   merge wrote the pair a third way. `rally` never differed from `orderAnchor` in those battles.

   The invariant: the Squad Leader publishes the pair from one function, `BattleSquadStability.publishAnchor`,
   and everything that moves it (its own advance, the regroup, the General's merge, the garrison setup) calls
   that function, so the pair cannot disagree and the provenance log names one owner. This check runs the two
   paths that raised the conflicts against the shipping Squad Leader with module 36 loaded and its hook
   wrapping in place, exactly as the browser has it, and asserts on the recorded labels. GRASSTEX_SOURCE_ROOT
   points it at another checkout (main before the fix must fail). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

const REPO = process.env.GRASSTEX_SOURCE_ROOT || H.REPO;
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}

/* The Squad Leader and module 36 on a bare registry. Module 36 wraps every registered system's hooks in an
   owner context (`squad-command` becomes `squad-stability`); it does so at load and again at battle start,
   so the Squad Leader loads first, as it does in the page (16 before 36). */
function world() {
  H.resetIds();
  const r = H.bootstrap({ modules: false });
  const systems = {};
  r.BattleModules = {
    registerSystem(id, s) {
      s.id = id;
      systems[id] = s;
    },
    getSystem: id => systems[id],
    listSystems: () => Object.values(systems),
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8, captureCommitRatio: 0.82 };
    }
  };
  r.BattleCommanderAI = {
    acceptMission(sim, sq) {
      const m = sq._macroMission;
      if (m && m.status === 'issued') {
        m.status = 'executing';
        m.acceptedAt = sim.time;
      }
    }
  };
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/15a-squad-leader-fire-control.js'); load(r, 'battle/modules/15b-squad-leader-buddy-pairs.js'); load(r, 'battle/modules/15c-squad-leader-scouts-forward.js'); load(r, 'battle/modules/16-squad-plan-stability.js');
  load(r, 'battle/modules/36-order-provenance.js');
  const b = H.makeBattle(r);
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 400 } });
  r.BattleOrderProvenance.instrument(b);
  return { r, b, q, leader: systems['squad-command'], P: r.BattleOrderProvenance };
}
/* The squad's AI step (the `squadCommand` slot: advanceSquadAnchor) with every man reporting he has arrived on
   his order, so the anchor is free to advance. */
function aiStep(w) {
  w.b.time += H.AI_TICK;
  w.q.members.forEach(s => {
    if (!s.dead) s.orderDestination = { x: s.root.position.x, z: s.root.position.z };
  });
  w.r.SquadAI.updateSquad(w.q, w.b);
}
/* The Squad Leader's command tick, inside its `squad-command` hook (updateCohesion: the regroup). */
function commandTick(w, dt) {
  w.b.time += dt == null ? 0.45 : dt;
  w.leader.onCommanderTick(w.b, { town: null });
}
const scatter = q =>
  q.members.forEach((s, i) => {
    s.root.position.x = (i % 2 ? -1 : 1) * (20 + i * 6);
    s.root.position.z = (i % 3) * 25;
  });
const gather = (q, p) =>
  q.members.forEach((s, i) => {
    s.root.position.x = p.x + (i % 4);
    s.root.position.z = p.z + Math.floor(i / 4);
  });
const events = (w, field) => w.P.history(w.q, field, 32);

/* March, disperse and commit a regroup, restore cohesion, march again: the two paths, back to back inside
   8 s. Returns the regroup lease so a test can tell the scenario really visited both. */
function marchRegroupMarch(w) {
  const L = w.r.BattleLeases;
  w.q.commandPhase = 'approach';
  for (let i = 0; i < 4; i++) aiStep(w);
  const before = w.q.rally.z;
  scatter(w.q);
  for (let i = 0; i < 12 && !L.get(w.q, 'regroup'); i++) commandTick(w);
  const lease = L.get(w.q, 'regroup');
  assert.ok(lease, 'a dispersed squad commits to a regroup');
  gather(w.q, lease.data.anchor);
  for (let i = 0; i < 10 && L.get(w.q, 'regroup'); i++) commandTick(w);
  assert.equal(L.get(w.q, 'regroup'), null, 'the regroup ended on cohesion');
  /* Back on the mission: executeMission restores the objective the regroup replaced with its anchor. */
  w.q.objective = { x: 0, z: 400 };
  w.q.commandPhase = 'approach';
  for (let i = 0; i < 4; i++) aiStep(w);
  return { lease, before };
}

test('the scenario visits both paths: the per-step advance and the regroup commit', () => {
  const w = world();
  const { lease, before } = marchRegroupMarch(w);
  assert.ok(before > 0, 'the anchor advanced before the regroup (' + before + ' m)');
  const rally = events(w, 'rally');
  assert.ok(rally.length >= 3, 'advance, regroup commit, advance are all recorded: ' + rally.length);
  assert.ok(
    rally.some(e => Math.hypot(e.to.x - lease.data.anchor.x, e.to.z - lease.data.anchor.z) < 0.01),
    'the regroup commit moved the pair onto the regroup anchor'
  );
});

test('the Squad Leader is not a writer conflict with itself across advance, regroup, advance', () => {
  const w = world();
  marchRegroupMarch(w);
  const conflicts = w.P.conflicts(w.b).filter(c => c.field === 'rally' || c.field === 'orderAnchor');
  assert.deepEqual(
    conflicts.map(c => c.field + ' ' + c.kind + ': ' + c.owners.join(' > ')),
    [],
    'the benchmark counts these as strategic writer conflicts'
  );
});

test('the pair has one owner in the provenance log, whichever path wrote it', () => {
  const w = world();
  marchRegroupMarch(w);
  for (const field of ['rally', 'orderAnchor']) {
    const owners = [...new Set(events(w, field).map(e => e.owner))];
    assert.deepEqual(
      owners,
      ['squad-stability'],
      field + ' is written by one owner, not ' + owners.join(' / ')
    );
  }
});

test('rally is the order anchor: the pair agrees after every advance, regroup and hold tick', () => {
  const w = world();
  const L = w.r.BattleLeases;
  const same = where => assert.deepEqual(w.q.rally, w.q.orderAnchor, where);
  w.q.commandPhase = 'approach';
  for (let i = 0; i < 6; i++) {
    aiStep(w);
    same('advance ' + i);
  }
  scatter(w.q);
  for (let i = 0; i < 12 && !L.get(w.q, 'regroup'); i++) {
    commandTick(w);
    same('command tick ' + i);
  }
  assert.ok(L.get(w.q, 'regroup'));
  for (let i = 0; i < 4; i++) {
    aiStep(w);
    same('held in regroup ' + i);
  }
});

test("publishAnchor is the Squad Leader's API: both fields, copies, no aliasing", () => {
  const w = world();
  const S = w.r.BattleSquadStability;
  assert.equal(typeof S.publishAnchor, 'function', 'BattleSquadStability.publishAnchor');
  const p = { x: 11.5, z: -4.25 };
  S.publishAnchor(w.q, p);
  assert.deepEqual(w.q.orderAnchor, p);
  assert.deepEqual(w.q.rally, p);
  assert.notEqual(w.q.orderAnchor, w.q.rally, 'two objects: moving one never moves the other');
  p.x = 99;
  assert.equal(w.q.orderAnchor.x, 11.5, 'the argument is copied, not kept');
  const recorded = events(w, 'rally').at(-1);
  assert.equal(
    recorded.owner,
    'squad-stability',
    'a call from outside any hook still names the Squad Leader'
  );
});

/* The General's reconstitution merge is asserted in reconstitution-check.js, where the merge scenario lives. */
console.log('anchor-publisher-check: ' + count + ' passed');
