'use strict';
/* Read-only Phase C operation ledger. Inputs: native probe_phase_c_natural
   JSON artifacts. This script does not alter battle logic or acceptance. */
const fs = require('node:fs');

function finite(v) {
  return typeof v === 'number' && Number.isFinite(v);
}
function releaseReason(a) {
  return (a.release && a.release.reason) || 'still-active';
}
function stageAt(a, label) {
  const event = (a.stageEvents || []).find(e => e.stage === label);
  return event ? event.t : null;
}
function readShards(paths) {
  const rows = [];
  for (const file of paths) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(data.results)) throw new Error('missing results: ' + file);
    const on = data.results.filter(x => x.arm === 'on');
    if (!on.length) throw new Error('no native ON battles: ' + file);
    for (const row of on) {
      if (!Array.isArray(row.readinessAttempts))
        throw new Error('missing readinessAttempts: ' + file + '/' + row.seed);
      if (!row.scenarioFingerprint) throw new Error('missing fingerprint: ' + file + '/' + row.seed);
      rows.push({
        type: data.type,
        seed: row.seed,
        fingerprint: row.scenarioFingerprint,
        row
      });
    }
  }
  return rows;
}
function collect(shards) {
  const battles = new Set();
  const attempts = [];
  for (const item of shards) {
    const battleKey = item.type + '/' + item.seed;
    if (battles.has(battleKey)) throw new Error('duplicate battle: ' + battleKey);
    battles.add(battleKey);
    for (const raw of item.row.readinessAttempts) {
      if (!raw || typeof raw.key !== 'string' || !finite(raw.startAt))
        throw new Error('malformed attempt: ' + battleKey);
      const reason = releaseReason(raw);
      const holdAt = stageAt(raw, 'hold');
      const readyAt = stageAt(raw, 'ready');
      const contactAt = stageAt(raw, 'contact');
      const stageNames = (raw.stageEvents || []).map(e => e.stage);
      const endAt = finite(raw.endAt) ? raw.endAt : null;
      const arrivedAt = finite(raw.firstFullReserveAt) ? raw.firstFullReserveAt : null;
      const snapshot = raw.firstFullReserveSnapshot || null;
      attempts.push({
        battle: battleKey,
        key: raw.key,
        startAt: raw.startAt,
        endAt,
        holdAt,
        readyAt,
        contactAt,
        terminal: (raw.release && raw.release.stage) || (reason === 'still-active' ? 'active' : 'unknown'),
        reason,
        reservePlan: raw.reservePlan || null,
        reserveStaged: Array.isArray(raw.reserveIds) && raw.reserveIds.length > 0,
        fullReserveAdopted:
          raw.maxReserveAdopted > 0 && raw.maxReserveAdopted === (raw.reserveIds || []).length,
        fullReserveArrived: arrivedAt !== null,
        arrivedAt,
        arrivedContact: raw.fullReserveContactSamples > 0,
        arrivedPrepared: raw.fullReservePreparedSamples > 0,
        arrivedAssault: raw.fullReserveAssaultSamples > 0,
        arrivedTwoSupport: raw.fullReserveTwoReadyRiflesSamples > 0,
        arrivedCandidate: raw.fullReserveCandidateWindowSamples > 0,
        readyBeforeRelease:
          readyAt !== null || !!(raw.release && raw.release.prepared) || stageNames.includes('contact'),
        holdTimeAtRelease: holdAt !== null && endAt !== null ? +(endAt - holdAt).toFixed(2) : null,
        arrivedTimeAtRelease: arrivedAt !== null && endAt !== null ? +(endAt - arrivedAt).toFixed(2) : null,
        firstArrivalPhase: snapshot ? snapshot.phase : null,
        firstArrivalCOA: snapshot ? snapshot.coa : null,
        reportCountOnFirstArrival: snapshot ? snapshot.reportCount : null,
        endFreshReports: raw.endContext ? raw.endContext.freshReports : null
      });
    }
  }
  return attempts;
}
function histogram(items, attr) {
  const values = {};
  for (const item of items) {
    const key = String(item[attr]);
    values[key] = (values[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(values).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}
function analyze(shards) {
  const attempts = collect(shards);
  const arrived = attempts.filter(a => a.fullReserveArrived);
  const unfinishedHold = attempts.filter(
    a => a.holdAt !== null && !a.readyBeforeRelease && finite(a.holdTimeAtRelease)
  );
  const sum = property => shards.reduce((n, x) => n + (+x.row[property] || 0), 0);
  const count = (items, predicate) => items.filter(predicate).length;
  const stages = [...new Set(attempts.map(a => a.terminal))].sort();
  return {
    totals: {
      battles: shards.length,
      ambushes: sum('ambush'),
      prepared: sum('prepared'),
      authorizedManeuvers: sum('maneuvers'),
      completeChains: shards.reduce((n, x) => n + (x.row.maneuverChains || []).length, 0),
      attempts: attempts.length,
      reserveStaged: count(attempts, a => a.reserveStaged),
      fullReserveAdopted: count(attempts, a => a.fullReserveAdopted),
      fullReserveArrived: arrived.length,
      arrivedContact: count(arrived, a => a.arrivedContact),
      arrivedPrepared: count(arrived, a => a.arrivedPrepared),
      arrivedAssault: count(arrived, a => a.arrivedAssault),
      arrivedTwoSupport: count(arrived, a => a.arrivedTwoSupport),
      arrivedJointCandidate: count(arrived, a => a.arrivedCandidate),
      endedBeforeFourSecondHold: count(unfinishedHold, a => a.holdTimeAtRelease < 4),
      unreachedReadinessAfterHold: unfinishedHold.length
    },
    terminationReasons: histogram(attempts, 'reason'),
    terminalStages: histogram(attempts, 'terminal'),
    releaseReasonsByTerminal: Object.fromEntries(
      stages.map(stage => [
        stage,
        histogram(
          attempts.filter(a => a.terminal === stage),
          'reason'
        )
      ])
    ),
    arrivedCases: arrived.map(a => ({
      battle: a.battle,
      key: a.key,
      phase: a.firstArrivalPhase,
      coa: a.firstArrivalCOA,
      at: a.arrivedAt,
      untilRelease: a.arrivedTimeAtRelease,
      contact: a.arrivedContact,
      prepared: a.arrivedPrepared,
      assault: a.arrivedAssault,
      twoEffective: a.arrivedTwoSupport,
      freshReports: a.reportCountOnFirstArrival,
      reason: a.reason
    })),
    sampleCases: {
      lostMaskDuringPreparation: attempts
        .filter(
          a => a.reason === 'firing station lost masking/ray' && a.holdAt !== null && !a.readyBeforeRelease
        )
        .slice(0, 8)
        .map(a => ({ battle: a.battle, key: a.key, held: a.holdTimeAtRelease })),
      reportExpiredAfterReady: attempts
        .filter(a => a.reason === 'no-fresh-reported-threat' && a.readyBeforeRelease)
        .slice(0, 8)
        .map(a => ({ battle: a.battle, key: a.key }))
    }
  };
}
function compare(before, after) {
  const baseline = new Map(before.map(x => [x.type + '/' + x.seed, JSON.stringify(x.fingerprint)]));
  if (before.length !== after.length) throw new Error('battle population mismatch');
  for (const x of after) {
    const key = x.type + '/' + x.seed;
    if (baseline.get(key) !== JSON.stringify(x.fingerprint))
      throw new Error('battle fingerprint mismatch: ' + key);
  }
  const previous = analyze(before);
  const current = analyze(after);
  return {
    baseline: previous,
    current,
    delta: Object.fromEntries(
      Object.keys(current.totals).map(k => [k, current.totals[k] - previous.totals[k]])
    )
  };
}
function main(argv) {
  const split = argv.indexOf('--baseline');
  const now = split < 0 ? argv : argv.slice(0, split);
  const baseline = split < 0 ? [] : argv.slice(split + 1);
  if (!now.length || (split >= 0 && !baseline.length))
    throw new Error('usage: analyze_phase_c_lifecycle.cjs current*.json [--baseline old*.json]');
  const report = baseline.length ? compare(readShards(baseline), readShards(now)) : analyze(readShards(now));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
module.exports = { readShards, collect, analyze, compare, releaseReason };
