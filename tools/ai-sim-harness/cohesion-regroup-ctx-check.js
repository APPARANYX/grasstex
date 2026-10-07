#!/usr/bin/env node
'use strict';
/* 15m cohesion-regroup factory ctx + firing (16-squad-plan-stability.js bare-bones split 10/10).
   The dispersion state machine (cohesionState, markCatchup, endRegroup, updateCohesion) moved to
   15m-squad-leader-cohesion-regroup.js; 16 calls its factory with its closure utilities and
   re-attaches the returned functions as closure variables. cohesionAssessment stays in 16 (15k's
   ctx consumes it at factory time; BattleRegroupHysteresis.assessment exports it). This file pins:

     - ctx: 16 hands the factory every name the moved bodies consume - utilities (telemetry, dist,
       copy, commanded, alive, leaderAlive, cfg, missionVersion, averageMembers), the analyzer that
       stays in 16 (cohesionAssessment), re-attached sub-module functions (leaderlessActive from 15d,
       commandForward/forwardMajority from 15g, publishAnchor from 15f), the phase machine
       (transitionPhase) and the regroup constants (REGROUP_*, REENTRY, STRAGGLER_BYPASS) - and none
       of them is undefined at factory time (the var-ordering class of bug a missing re-attach or a
       moved factory call would introduce);
     - seam: BattleSquadStability.updateCohesion is the re-attached real function, not the no-write
       fallback (a 15m missing from a load chain would silently no-op squad cohesion);
     - firing: a scattered squad commits a regroup on the commander tick (lease, phase, objective =
       order anchor, recovery serial, decision-regroup-commit telemetry); contact ends it with a
       reentry cooldown; a cohered squad releases on 'cohesion restored' once the lease is older
       than REGROUP_MIN; an active recon lease suppresses the request (intentional scout geometry
       is not a cohesion failure). */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
const MODS = 'battle/modules/';
const CHAIN = [
  'battle/movement-resolver.js',
  MODS + '15a-squad-leader-fire-control.js',
  MODS + '15b-squad-leader-buddy-pairs.js',
  MODS + '15c-squad-leader-scouts-forward.js',
  MODS + '15d-squad-leader-leaderless-intent.js',
  MODS + '15e-squad-leader-morale-coa.js',
  MODS + '15f-squad-leader-retreat-anchor.js',
  MODS + '15g-squad-leader-formation.js',
  MODS + '15h-squad-leader-fireteams.js',
  MODS + '15i-squad-leader-clear-contact.js',
  MODS + '15j-squad-leader-fire-and-movement.js',
  MODS + '15k-squad-leader-reconstitution.js',
  MODS + '15l-squad-leader-mission-execution.js',
  MODS + '15m-squad-leader-cohesion-regroup.js',
  MODS + '16-squad-plan-stability.js'
];
const EXPECTED_CTX = [
  'root',
  'telemetry',
  'dist',
  'copy',
  'commanded',
  'alive',
  'leaderAlive',
  'cfg',
  'missionVersion',
  'averageMembers',
  'cohesionAssessment',
  'leaderlessActive',
  'commandForward',
  'forwardMajority',
  'publishAnchor',
  'transitionPhase',
  'REGROUP_ENTER',
  'REGROUP_RELEASE',
  'REGROUP_MIN',
  'REGROUP_ESCALATION_SECS',
  'REENTRY',
  'STRAGGLER_BYPASS'
];
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function world(audit) {
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
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8, captureCommitRatio: 0.82 };
    }
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  for (const p of CHAIN) {
    if (audit && p === MODS + '16-squad-plan-stability.js') {
      const real = r._squadLeaderCohesionRegroup;
      assert.equal(typeof real, 'function', '15m registered its factory before 16 loads');
      r.ctxSeen = {};
      r.ctxUndefined = [];
      r._squadLeaderCohesionRegroup = function (ctx) {
        for (const k of Object.keys(ctx)) {
          r.ctxSeen[k] = true;
          if (ctx[k] === undefined) r.ctxUndefined.push(k);
        }
        return real(ctx);
      };
    }
    load(r, p);
  }
  return { r, leader: systems['squad-command'], events };
}
function tick(leader, b) {
  b.time += 0.45;
  leader.onCommanderTick(b, { town: null });
}
function squad(r, b) {
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 150, z: 0 } });
  q.commandPhase = 'approach';
  return q;
}
function scatter(q) {
  q.members.forEach((s, i) => {
    s.root.position.x = (i % 2 ? -1 : 1) * (22 + i * 6);
    s.root.position.z = (i % 3) * 26;
  });
}
test('16 hands the 15m factory a complete ctx (nothing undefined at factory time)', () => {
  const { r } = world(true);
  assert.ok(r._squadLeaderCohesionRegroup, 'the factory is registered');
  assert.deepEqual(r.ctxUndefined, [], 'every ctx value is defined when the factory runs');
  for (const k of EXPECTED_CTX) assert.ok(r.ctxSeen[k], 'ctx carries ' + k);
  assert.equal(
    r.BattleSquadStability.updateCohesion.length,
    2,
    'the re-attached updateCohesion is the real (sim, sq) function, not a no-write fallback'
  );
  assert.equal(
    r.BattleRegroupHysteresis.assessment.length,
    2,
    'the analyzer stayed in 16 and is still exported'
  );
});

test('a scattered squad commits a regroup through the re-attached seam', () => {
  const { r, leader, events } = world(false),
    L = r.BattleLeases,
    b = H.makeBattle(r),
    q = squad(r, b);
  H.run(r, b, 1.5, () => tick(leader, b));
  scatter(q);
  let committed = false;
  for (let i = 0; i < 12 && !committed; i++) {
    tick(leader, b);
    committed = !!L.get(q, 'regroup');
  }
  assert.ok(committed, 'the dispersed squad opens a regroup lease');
  assert.equal(q.commandPhase, 'regroup', 'the squad phase follows the regroup');
  assert.equal(
    q._regroupRecovery && q._regroupRecovery.serial,
    1,
    'the recovery record is armed with serial 1'
  );
  assert.ok(q.orderAnchor, 'publishAnchor ran: the order anchor exists');
  assert.ok(
    Math.hypot(q.objective.x - q.orderAnchor.x, q.objective.z - q.orderAnchor.z) < 0.1,
    'the objective is the rally anchor'
  );
  assert.ok(
    events.some(e => e.type === 'decision-regroup-commit' && e.data.squad === 'us-0'),
    'the commit telemetry fired'
  );
});

test('contact ends the regroup and arms the reentry cooldown', () => {
  const { r, leader } = world(false),
    L = r.BattleLeases,
    b = H.makeBattle(r),
    q = squad(r, b);
  H.run(r, b, 1.5, () => tick(leader, b));
  scatter(q);
  for (let i = 0; i < 12 && !L.get(q, 'regroup'); i++) tick(leader, b);
  assert.ok(L.get(q, 'regroup'), 'precondition: regrouping');
  q.members[3]._regroupUnstick = { since: b.time };
  q.inContact = true;
  tick(leader, b);
  assert.equal(L.get(q, 'regroup'), null, 'contact ends the regroup lease');
  assert.equal(q.commandPhase, 'approach', 'ending the lease restores the phase regroup interrupted');
  const end = q._leases && q._leases.ended ? q._leases.ended.filter(l => l.kind === 'regroup').at(-1) : null;
  assert.ok(end, 'the lease records its end');
  assert.equal(end.endReason, 'contact');
  assert.ok(L.get(q, 'regroup-cooldown'), 'the reentry cooldown is granted');
  assert.equal(q.members[3]._regroupUnstick, null, 'endRegroup clears the unstick records');
});

test('a cohered squad releases on cohesion restored once the lease is older than REGROUP_MIN', () => {
  const { r, leader } = world(false),
    L = r.BattleLeases,
    b = H.makeBattle(r),
    q = squad(r, b),
    anchor = { x: 0, z: 0 };
  H.run(r, b, 1.5, () => tick(leader, b));
  scatter(q);
  for (let i = 0; i < 12 && !L.get(q, 'regroup'); i++) tick(leader, b);
  assert.ok(L.get(q, 'regroup'), 'precondition: regrouping');
  /* Everyone closes up on the rally anchor and the lease ages past REGROUP_MIN. */
  const rg = L.get(q, 'regroup');
  rg.since = b.time - 3;
  q.members.forEach((s, i) => {
    s.root.position.x = anchor.x + ((i % 3) - 1) * 2;
    s.root.position.z = anchor.z + (((i / 3) | 0) - 1) * 2;
  });
  tick(leader, b);
  const end = q._leases && q._leases.ended ? q._leases.ended.filter(l => l.kind === 'regroup').at(-1) : null;
  assert.ok(end, 'the regroup ended');
  assert.equal(end.endReason, 'cohesion restored');
  assert.ok(L.get(q, 'regroup-cooldown'), 'release grants the reentry cooldown');
});

test('an active recon lease suppresses the regroup request', () => {
  const { r, leader } = world(false),
    L = r.BattleLeases,
    b = H.makeBattle(r),
    q = squad(r, b);
  H.run(r, b, 1.5, () => tick(leader, b));
  L.grant(q, 'recon', 'squad-leader', b.time, b.time + 30, 'scouts out');
  scatter(q);
  for (let i = 0; i < 12 && !L.get(q, 'regroup'); i++) tick(leader, b);
  assert.equal(L.get(q, 'regroup'), null, 'no regroup while the scouts hold the geometry');
  assert.notEqual(q.commandPhase, 'regroup');
});

console.log('PASS ' + n + ' cohesion-regroup ctx checks');
