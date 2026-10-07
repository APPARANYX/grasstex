#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');

(async () => {
  const { scoreSquadPerformance, summarizeSquadPerformance } = await import(
    '../../scripts/lib/squad-performance.mjs'
  );

  const good = scoreSquadPerformance({
    faction: 'us',
    squad: 'US-1',
    samples: 20,
    roleSamples: { maneuver: 20 },
    phaseSamples: { assault: 20 },
    aliveStart: 10,
    aliveEnd: 8,
    assignedSamples: 20,
    targetlessSamples: 0,
    inContactSamples: 12,
    overCohesionSamples: 0,
    regroupSamples: 0,
    retreatSamples: 0,
    supportHoldSamples: 0,
    insideObjectiveSamples: 4,
    friendlyOwnedTargetSamples: 2,
    contestingTargetSamples: 5,
    travelMeters: 120,
    objectiveProgressMeters: 100,
    objectiveRegressionMeters: 5,
    targetSwitches: 0,
    phaseSwitches: 1,
    movementResolverChanges: 12,
    routeStalls: 0,
    movementStalls: 0,
    targetlessStalls: 0,
    longRegroups: 0,
    loopAlerts: 0,
    writerConflicts: 0,
    combat: {
      total: 30,
      direct: 20,
      hits: 8,
      suppressive: 5,
      suppressedTargets: 10
    }
  });
  assert.equal(good.role, 'maneuver');
  assert.ok(good.overall > 80, 'clean advancing squad should score strongly');
  assert.ok(good.movement > 90, 'forward progress with little regression should score strongly');
  assert.ok(good.mission > 80, 'assigned squad making objective progress should have strong mission score');
  assert.equal(
    good.metrics.insideObjectiveSamples,
    4,
    'raw mission inputs remain attached to the scored row'
  );
  assert.equal(good.metrics.friendlyOwnedTargetSamples, 2);

  const backwards = scoreSquadPerformance({
    faction: 'us',
    squad: 'US-3',
    samples: 20,
    roleSamples: { maneuver: 20 },
    phaseSamples: { assault: 20 },
    aliveStart: 10,
    aliveEnd: 4,
    assignedSamples: 20,
    targetlessSamples: 2,
    inContactSamples: 15,
    overCohesionSamples: 10,
    regroupSamples: 6,
    retreatSamples: 0,
    supportHoldSamples: 0,
    insideObjectiveSamples: 0,
    friendlyOwnedTargetSamples: 0,
    contestingTargetSamples: 0,
    travelMeters: 90,
    objectiveProgressMeters: 5,
    objectiveRegressionMeters: 80,
    targetSwitches: 3,
    phaseSwitches: 8,
    movementResolverChanges: 70,
    routeStalls: 1,
    movementStalls: 2,
    targetlessStalls: 1,
    longRegroups: 1,
    loopAlerts: 3,
    writerConflicts: 1,
    combat: {
      total: 14,
      direct: 10,
      hits: 1,
      suppressive: 2,
      suppressedTargets: 1
    }
  });
  assert.ok(
    backwards.overall < good.overall - 25,
    'backtracking/churn must be visible in the overall diagnostic score'
  );
  assert.ok(
    backwards.movement < 35,
    'large objective regression should dominate movement score'
  );
  assert.ok(
    backwards.control < 60,
    'loops/conflicts/target churn should reduce command-control score'
  );

  const support = scoreSquadPerformance({
    faction: 'ge',
    squad: 'GE-2',
    samples: 20,
    roleSamples: { support: 20 },
    phaseSamples: { 'support-hold': 20 },
    aliveStart: 8,
    aliveEnd: 8,
    assignedSamples: 0,
    targetlessSamples: 0,
    inContactSamples: 0,
    overCohesionSamples: 0,
    regroupSamples: 0,
    retreatSamples: 0,
    supportHoldSamples: 20,
    insideObjectiveSamples: 0,
    friendlyOwnedTargetSamples: 0,
    contestingTargetSamples: 0,
    travelMeters: 0,
    objectiveProgressMeters: 0,
    objectiveRegressionMeters: 0,
    targetSwitches: 0,
    phaseSwitches: 0,
    movementResolverChanges: 0,
    routeStalls: 0,
    movementStalls: 0,
    targetlessStalls: 0,
    longRegroups: 0,
    loopAlerts: 0,
    writerConflicts: 0,
    combat: {
      total: 0,
      direct: 0,
      hits: 0,
      suppressive: 0,
      suppressedTargets: 0
    }
  });
  assert.ok(
    support.mission >= 90,
    'support squad is rewarded for holding its support brief instead of being forced to capture'
  );
  assert.equal(
    support.movement,
    100,
    'stationary support is not treated as failed movement'
  );
  assert.equal(
    support.combat,
    null,
    'no combat opportunity is omitted rather than scored as a failure'
  );

  const reserve = scoreSquadPerformance({
    faction: 'ge',
    squad: 'GE-4',
    samples: 12,
    roleSamples: { reserve: 12 },
    phaseSamples: { reserve: 12 },
    aliveStart: 8,
    aliveEnd: 8,
    assignedSamples: 0,
    targetlessSamples: 0,
    inContactSamples: 0,
    overCohesionSamples: 0,
    regroupSamples: 0,
    retreatSamples: 0,
    supportHoldSamples: 0,
    travelMeters: 1,
    objectiveProgressMeters: 0,
    objectiveRegressionMeters: 0,
    targetSwitches: 0,
    phaseSwitches: 0,
    routeStalls: 0,
    movementStalls: 0,
    targetlessStalls: 0,
    longRegroups: 0,
    loopAlerts: 0,
    writerConflicts: 0,
    combat: {
      total: 0,
      direct: 0,
      hits: 0,
      suppressive: 0,
      suppressedTargets: 0
    }
  });
  assert.ok(reserve.mission >= 95, 'reserve is not penalized for having no objective');
  assert.ok(reserve.overall > 90, 'clean reserve behavior remains healthy');

  for (const row of [good, backwards, support, reserve]) {
    for (const key of ['overall', 'mission', 'movement', 'control', 'cohesion', 'preservation']) {
      if (row[key] != null)
        assert.ok(row[key] >= 0 && row[key] <= 100, `${key} stays in 0..100`);
    }
    if (row.combat != null)
      assert.ok(row.combat >= 0 && row.combat <= 100, 'combat stays in 0..100');
  }

  const summary = summarizeSquadPerformance([
    { ...good, seed: 'a' },
    { ...backwards, seed: 'b' },
    { ...support, seed: 'c' },
    { ...reserve, seed: 'd' }
  ]);
  assert.equal(summary.squads, 4);
  assert.ok(
    summary.p10Overall < summary.medianOverall,
    'bottom-decile exposes the weak tail'
  );
  assert.equal(
    summary.lowScoreSquads,
    1,
    'the intentionally bad squad is counted in the below-60 tail'
  );
  assert.equal(summary.worst[0].squad, 'US-3');
  assert.equal(summary.worst[0].seed, 'b');
  assert.ok(
    summary.meanCombat > 70,
    'run-level combat mean excludes squads whose combat dimension is null'
  );

  console.log(
    'PASS squad performance scores are role-aware, bounded, and expose backtracking/churn without punishing support or reserve'
  );
})().catch(err => {
  console.error(err);
  process.exit(1);
});
