'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  readShards,
  collect,
  analyze,
  compare
} = require('../../scripts/probes/analyze_phase_c_lifecycle.cjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase-c-lifecycle-'));
function row(seed, options = {}) {
  return {
    arm: 'on',
    seed,
    scenarioFingerprint: { version: 1, vector: [4, 2] },
    ambush: 1,
    prepared: options.prepared || 0,
    maneuvers: 0,
    maneuverChains: [],
    readinessAttempts: [
      {
        key: options.key || 'us:us-1#1',
        squad: 'us:us-1',
        serial: 1,
        startAt: 1,
        endAt: options.endAt || 8,
        stageEvents: options.events || [
          { stage: 'assemble', t: 1 },
          { stage: 'hold', t: 3 }
        ],
        reservePlan: 'whole-team-staged:alpha',
        reserveIds: ['4', '5'],
        maxReserveAdopted: 2,
        firstFullReserveAt: 5,
        fullReserveContactSamples: options.contact || 0,
        fullReservePreparedSamples: options.fullPrepared || 0,
        fullReserveAssaultSamples: options.assault || 0,
        fullReserveTwoReadyRiflesSamples: options.support || 0,
        fullReserveCandidateWindowSamples: options.candidate || 0,
        firstFullReserveSnapshot: {
          phase: options.phase || 'defend',
          coa: 'assault',
          reportCount: 1
        },
        release: {
          reason: options.reason || 'no-fresh-reported-threat',
          stage: options.stage || 'hold',
          prepared: false
        },
        endContext: { freshReports: 0, contact: false }
      }
    ]
  };
}
function write(name, rows, completed = 0) {
  const file = path.join(dir, name);
  fs.writeFileSync(
    file,
    JSON.stringify({
      type: 'meeting',
      arms: { on: { completedNaturalChains: completed } },
      results: rows
    })
  );
  return file;
}
try {
  const before = readShards([write('before.json', [row('s001')])]);
  const after = readShards([
    write('after.json', [
      row('s001', {
        reason: 'firing station lost masking/ray',
        endAt: 6,
        contact: 2,
        phase: 'defend'
      })
    ])
  ]);
  const report = analyze(after);
  assert.equal(report.totals.battles, 1);
  assert.equal(report.totals.endedBeforeFourSecondHold, 1);
  assert.equal(report.totals.arrivedContact, 1);
  assert.equal(report.totals.arrivedAssault, 0, 'COA assault does not override General defend');
  assert.equal(report.totals.arrivedTwoSupport, 0, 'contact cannot fabricate two shooters');
  assert.equal(report.totals.arrivedJointCandidate, 0, 'no synthetic movement credit');
  assert.equal(report.terminationReasons['firing station lost masking/ray'], 1);
  assert.equal(report.arrivedCases[0].untilRelease, 1);
  assert.equal(collect(after)[0].key, 'us:us-1#1');
  const comparison = compare(before, after);
  assert.equal(comparison.delta.arrivedContact, 1);
  assert.equal(comparison.delta.ambushes, 0);
  assert.equal(comparison.delta.completeChains, 0);
  const unfinished = row('s002');
  unfinished.maneuverChains = [{ stage: 'partial' }];
  const adjudicated = readShards([write('adjudication.json', [row('s001'), unfinished], 1)]);
  assert.equal(
    analyze(adjudicated).totals.completeChains,
    1,
    'native shard acceptance is counted once, never incomplete per-seed trace entries'
  );
  assert.throws(
    () => readShards([write('off.json', [{ ...row('s001'), arm: 'off' }])]),
    /no native ON battles/
  );
  assert.throws(
    () =>
      compare(
        before,
        readShards([
          write('different-map.json', [{ ...row('s001'), scenarioFingerprint: { version: 2, vector: [9] } }])
        ])
      ),
    /fingerprint mismatch/
  );
  assert.throws(
    () => analyze(readShards([write('duplicate.json', [row('s001'), row('s001')])])),
    /duplicate battle/
  );
  console.log(
    'phase-c-lifecycle-report-check: PASS serial attribution, General veto, genuine support, fingerprints'
  );
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
