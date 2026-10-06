#!/usr/bin/env node
'use strict';
/* Commander reconstitution factory ctx + firing (battle/commander-ai.js split 1/1).
   The General's survivor pool (reconState, formGroup, dissolveGroup, mergeGroup, reconstitute)
   and the fled pickup (pickUpFled) moved verbatim to modules/22-commander-reconstitution.js.
   Same reversed install as 19-engagement-cover-positions: commander-ai.js loads before every
   module in both chains, so it publishes _commanderReconstitutionCtx (closure utilities, the
   mission-lifecycle functions the re-tasking goes through, the RECON_* and FLED_PICKUP_RANGE
   constants - which stay in the parent for the BattleCommanderAI export) and the
   _commanderReconstitutionAttach sink, and the module calls its own factory at load time and
   installs the returned functions back into the parent. This file pins:

     - install: the module global exists, the factory takes exactly one ctx, and every name the
       moved bodies consume reaches it defined (D, telemetry, generalFor, missionState,
       issueMission, finishMission, recordMacroWake and the eight constants) - the var-ordering
       class of bug a moved constant or a renamed utility would introduce;
     - seam: BattleCommanderAI.reconstitute keeps the pre-split name and arity, the exported
       constants keep their values, and a bad api is rejected without disturbing the installed
       one;
     - firing: two retreated at-base squads worth exactly RECON_STRENGTH men form one group
       through the parent seam (telemetry, _reconGroup, serial 1); with everyone at the rally
       point the same tick's group advance merges them - one survivor re-tasked
       (reconstitutedFrom), the other disbanded into it (mergedInto), group ended 'merged';
     - loud failure both ways: commander-ai.js without the module throws 'reconstitution
       missing' on the first commander tick, and the module without commander-ai.js throws at
       load. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
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
/* Commander world: the same load order macro-state-check uses, plus the module. Telemetry is
   recorded so the firing test can see the General's decisions. */
function world() {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
    events = [];
  r.BattleSim = { start() {} };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  load(r, 'battle/commander-doctrine.js');
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  load(r, 'battle/modules/22-commander-reconstitution.js');
  load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  const b = H.makeBattle(r);
  /* formGroup plans the rally around the objective the General expects to send the re-formed
     squad to; a fixed plan keeps the geometry deterministic without loading the objective stack. */
  r.BattleCommanderDoctrine.chooseObjective = function () {
    return { instance: { id: 'obj-1' }, point: { x: 0, z: 100 } };
  };
  /* The merge goes through the Squad Leader's roster rewrite; the wiring under test is the
     General's, so the Squad Leader side is a stub that records what it was asked. */
  const reformed = [];
  r.BattleSquadStability = {
    reform(survivor, men, leader, rally, strength) {
      reformed.push({
        survivor: survivor.id,
        men: men.length,
        rally: { x: rally.x, z: rally.z },
        strength: strength
      });
    },
    disband() {}
  };
  const sqA = H.addSquad(r, b, {
    id: 'us-1',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    composition: ['rifleman', 'rifleman', 'rifleman', 'rifleman']
  });
  const sqB = H.addSquad(r, b, {
    id: 'us-2',
    faction: 'us',
    x: 4,
    z: 0,
    objective: { x: 0, z: 100 },
    composition: ['rifleman', 'rifleman', 'rifleman', 'rifleman']
  });
  [sqA, sqB].forEach(sq => {
    sq.state = 'retreat';
    sq._assembly = { phase: 'at-base' };
    sq.inContact = false;
  });
  return { r, b, events, reformed, sqA, sqB, C: r.BattleCommanderAI };
}

test('the module installs the verbatim set back into commander-ai.js through the ctx sink', () => {
  const { r } = world();
  assert.equal(typeof r._commanderReconstitutionPositions, 'function', 'module factory global');
  assert.equal(r._commanderReconstitutionPositions.length, 1, 'factory takes exactly the ctx');
  const ctx = r._commanderReconstitutionCtx();
  assert.deepEqual(
    Object.keys(ctx).sort(),
    [
      'D',
      'FLED_PICKUP_RANGE',
      'RALLY_RADIUS',
      'RECON_FORWARD_DETOUR',
      'RECON_FORWARD_MAX',
      'RECON_MAX_CENTER_TRAVEL',
      'RECON_MIN_STRENGTH',
      'RECON_POOL_MAX',
      'RECON_STRENGTH',
      'finishMission',
      'generalFor',
      'issueMission',
      'missionState',
      'recordMacroWake',
      'root',
      'telemetry'
    ],
    'ctx carries exactly the closure utilities, lifecycle functions and constants the moved bodies consume'
  );
  Object.keys(ctx).forEach(k => assert.notEqual(ctx[k], undefined, 'ctx.' + k + ' defined at install time'));
  const api = r._commanderReconstitutionPositions(ctx);
  [
    'reconState',
    'squadById',
    'endGroup',
    'strongestFirst',
    'squadPoint',
    'centerPoint',
    'chooseGroup',
    'rallyGeometry',
    'rallyPoint',
    'formGroup',
    'dissolveGroup',
    'mergeGroup',
    'atRally',
    'reconstitute',
    'pickUpFled'
  ].forEach(k => assert.equal(typeof api[k], 'function', 'factory returns ' + k));
  assert.equal(api.reconState.length, 2, 'reconState(sim, faction)');
  assert.equal(api.squadById.length, 3, 'squadById(sim, faction, id)');
  assert.equal(api.endGroup.length, 5, 'endGroup(st, g, status, reason, t)');
  assert.equal(api.strongestFirst.length, 2, 'strongestFirst(sim, faction)');
  assert.equal(api.squadPoint.length, 1, 'squadPoint(sq)');
  assert.equal(api.centerPoint.length, 1, 'centerPoint(squads)');
  assert.equal(api.chooseGroup.length, 1, 'chooseGroup(pool)');
  assert.equal(api.rallyGeometry.length, 2, 'rallyGeometry(squads, plan)');
  assert.equal(api.rallyPoint.length, 4, 'rallyPoint(sim, faction, squads, plan)');
  assert.equal(api.formGroup.length, 3, 'formGroup(sim, faction, squads)');
  assert.equal(api.dissolveGroup.length, 4, 'dissolveGroup(sim, g, squads, reason)');
  assert.equal(api.mergeGroup.length, 3, 'mergeGroup(sim, g, squads)');
  assert.equal(api.atRally.length, 2, 'atRally(sq, g)');
  assert.equal(api.reconstitute.length, 2, 'reconstitute(sim, faction)');
  assert.equal(api.pickUpFled.length, 2, 'pickUpFled(sim, faction)');
});

test('the parent seam keeps the pre-split name, arities and the exported constants', () => {
  const { b, sqA, C } = world();
  assert.equal(C.reconstitute.length, 2, 'BattleCommanderAI.reconstitute(sim, faction)');
  assert.equal(C.reconstitutionStrength, 10, 'the target strength export still reads the parent constant');
  assert.equal(C.reconstitutionMinimumStrength, 6, 'the viable minimum stays owned by the parent');
  assert.equal(C.reconstitutionPoolMax, 4, 'only 1-4 man remnants enter the survivor pool');
  assert.equal(C.reconstitutionMaxCenterTravel, 300, 'geographic grouping cap stays parent-owned');
  assert.equal(C.reconstitutionForwardDetour, 1.15, 'frontward rally detour budget stays parent-owned');
  assert.equal(C.reconstitutionForwardMax, 180, 'frontward rally slide cap stays parent-owned');
  assert.equal(C.fledPickupRange, 50, 'the fled pickup export still reads the parent constant');
  assert.equal(
    C.missionState(b).reconstitution,
    null,
    'the aggregate roll-up is null before a commander tick'
  );
  assert.equal(
    C.missionState(b).generals.us.reconstitution,
    null,
    'no faction-local pool record before a commander tick'
  );
  C.reconstitute(b, 'us');
  const st = C.missionState(b).generals.us.reconstitution;
  assert.ok(st, 'the seam lazily creates the faction-local pool record through generalFor');
  assert.equal(st.strength, 10, 'the pool record carries the target strength');
  assert.equal(st.minimumStrength, 6, 'the pool record carries the viable minimum');
  assert.equal(C.missionState(b).reconstitution.groupsFormed, 1, 'the aggregate roll-up sees the group');
  assert.deepEqual(
    C.missionState(b).reconstitution.pool.us,
    {
      survivors: 0,
      squads: [],
      ready: false,
      blockedByDistance: false,
      poolMax: 4,
      minimumStrength: 6,
      targetStrength: 10
    },
    'the aggregate exposes the post-group survivor pool'
  );
  assert.notEqual(sqA, null, 'fixture sanity');
  test('firing: a viable 8-man pool forms one group, and the group at the rally point merges', () => {
    const { b, events, reformed, sqA, sqB, C } = world();
    C.reconstitute(b, 'us');
    const st = C.missionState(b).generals.us.reconstitution;
    assert.equal(st.serial, 1, 'one group formed');
    assert.equal(st.groupsFormed, 1, 'the pool crossed RECON_MIN_STRENGTH once');
    assert.equal(st.active.length, 1, 'the group is active');
    const g = st.active[0];
    assert.equal(g.id, 'us-reconstitution-1', "the group is the side's first reconstitution group");
    assert.equal(g.squads.slice().sort().join(','), 'us-1,us-2', 'the nearby remnants group together');
    assert.equal(g.status, 'assembling', 'the group assembles first');
    assert.equal(g.objectiveId, 'obj-1', 'the planned objective rides on the group');
    assert.equal(sqA._reconGroup, g.id, 'both members are briefed to the group');
    assert.equal(sqB._reconGroup, g.id, 'both members are briefed to the group');
    assert.ok(
      events.some(e => e.type === 'decision-reconstitute-group' && e.data.group === g.id),
      'the group commit telemetry fired'
    );
    assert.ok(g.forwardShift > 0, 'the neutral meeting point is nudged toward the next objective');
    [sqA, sqB].forEach(sq => {
      const p = r.BattleCommanderDoctrine.avgPos(sq),
        direct = Math.hypot(p.x - g.center.x, p.z - g.center.z),
        routed = Math.hypot(p.x - g.rally.x, p.z - g.rally.z);
      assert.ok(routed <= direct * 1.15 + 1e-6, 'frontward slide stays inside the 15% travel budget');
    });

    /* Everyone closed up on the rally point, out of contact: the next pass advances the group. */
    [sqA, sqB].forEach(sq => {
      sq._assembly = { phase: 'to-rally' };
      sq.members.forEach(s => {
        s.root.position.x = g.rally.x;
        s.root.position.z = g.rally.z;
      });
    });
    C.reconstitute(b, 'us');
    assert.equal(st.merges, 1, 'the group merged');
    assert.equal(st.active.length, 0, 'the group is no longer active');
    const end = st.ended[st.ended.length - 1];
    assert.equal(end.status, 'merged', 'the group record reads merged');
    assert.equal(end.endReason, 'reconstituted', 'the merge reason is reconstituted');
    assert.equal(reformed.length, 1, 'the Squad Leader rewrite was asked exactly once');
    assert.equal(reformed[0].survivor, 'us-1', 'the strongest (first) squad survives');
    assert.equal(reformed[0].men, 8, 'all eight survivors move into the re-formed squad');
    assert.equal(reformed[0].strength, 10, 'the reform is asked for the reconstitution strength');
    assert.deepEqual(
      reformed[0].rally,
      { x: g.rally.x, z: g.rally.z },
      'the re-form happens on the group rally'
    );
    assert.deepEqual(
      sqA.reconstitutedFrom,
      ['us-1', 'us-2'],
      'the survivor remembers what it was re-formed from'
    );
    assert.equal(sqB.disbanded, true, 'the absorbed squad is disbanded');
    assert.equal(sqB.mergedInto, 'us-1', 'the absorbed squad names its survivor');
    assert.equal(sqA._reconGroup, null, 'the survivor leaves the group');
    assert.ok(
      events.some(e => e.type === 'decision-squad-merge' && e.data.survivor === 'us-1'),
      'the merge telemetry fired'
    );
  });

  test('commander-ai.js without the module fails loudly on the first commander tick', () => {
    const r = H.bootstrap({ modules: false });
    r.BattleSim = { start() {} };
    load(r, 'battle/commander-doctrine.js');
    load(r, 'battle/commander-routes.js');
    load(r, 'battle/commander-ai.js');
    assert.ok(r.BattleCommanderAI, 'commander-ai.js alone still loads and exports');
    assert.throws(
      () => r.BattleCommanderAI.reconstitute({ factions: { us: { squads: [] } } }, 'us'),
      /reconstitution missing/,
      'no silent never-reconstituting General'
    );
  });

  test('the module without commander-ai.js fails loudly at load', () => {
    const r = {};
    r.window = r;
    assert.throws(
      () => load(r, 'battle/modules/22-commander-reconstitution.js'),
      /commander-ai\.js must load before/,
      'the reversed install needs its parent first'
    );
  });

  console.log('PASS ' + n + ' reconstitution ctx checks');
});
