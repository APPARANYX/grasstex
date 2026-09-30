#!/usr/bin/env node
/* Adds up `run_probe.cjs` output for the `morale-decisions` and `coa-decisions` probes and divides by
   squad-battles, so a lever is reported as decisions per 100 squad-battles and not as "battles that differ".

   Usage: node scripts/summarize_lever_probes.cjs [--json] <label>=<probe-output.json>[,<more.json>] ...
   Each label is one arm (a comma list pools files: same arm, more battles). Files come from
   `PROBE=morale-decisions,coa-decisions PROBE_OUTPUT=<file> node scripts/run_probe.cjs`.
   Exit 1 if any probe self-check failed, a page raised an error or a control battle differed. */
const fs = require('node:fs');

const args = process.argv.slice(2),
  JSON_OUT = args.includes('--json'),
  arms = args
    .filter(a => a !== '--json')
    .map(a => {
      const i = a.indexOf('=');
      if (i < 1) throw new Error('give each arm as <label>=<file>[,<file>]: ' + a);
      return { label: a.slice(0, i), battles: a.slice(i + 1).split(',').flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).battles) };
    });
if (!arms.length) throw new Error('usage: summarize_lever_probes.cjs [--json] <label>=<file>[,<file>] ...');

const sum = (a, f) => a.reduce((n, x) => n + (f ? f(x) : x), 0);
const r = (x, k = 2) => (Number.isFinite(x) ? +x.toFixed(k) : null);
function pct(sorted, q) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}
/* Percentile of a histogram {bin: seconds} with bins of 0.05 (the bin's lower edge). */
function histPct(h, q) {
  const bins = Object.keys(h).map(Number).sort((a, b) => a - b),
    total = sum(bins, b => h[b]);
  if (!total) return null;
  let acc = 0;
  for (const b of bins) {
    acc += h[b];
    if (acc >= q * total) return r(b * 0.05 + 0.05, 2);
  }
  return null;
}
function mergeHist(list) {
  const out = {};
  for (const h of list) for (const k of Object.keys(h)) out[k] = (out[k] || 0) + h[k];
  return out;
}

function morale(arm) {
  const rs = arm.battles.map(b => b.reports && b.reports['morale-decisions']).filter(Boolean);
  if (!rs.length) return null;
  const sb = sum(rs, x => x.squadBattles),
    per = x => r((100 * x) / sb, 2);
  const dis = k => ({
    ticks: sum(rs, x => x.disagree[k].ticks),
    seconds: r(sum(rs, x => x.disagree[k].sec), 1),
    episodes: sum(rs, x => x.disagree[k].episodes)
  });
  const out = {
    battles: rs.length,
    squadBattles: sb,
    flagOn: rs[0].flagOn,
    tuning: rs[0].tuning,
    selfCheckMismatches: sum(rs, x => x.selfCheck.mismatched),
    selfCheckChecked: sum(rs, x => x.selfCheck.checked)
  };
  out.disagree = {};
  for (const k of ['earlyBreak', 'heldRetreat', 'heldRetreatPostMerge', 'earlyRally']) {
    const d = dis(k);
    out.disagree[k] = { ...d, ticksPer100SquadBattles: per(d.ticks), episodesPer100SquadBattles: per(d.episodes) };
  }
  const hc = mergeHist(rs.map(x => x.hist.contact)),
    hq = mergeHist(rs.map(x => x.hist.quiet)),
    share = (h, lo) => {
      const t = sum(Object.values(h));
      return t ? r(sum(Object.keys(h).filter(b => +b * 0.05 >= lo - 1e-9), b => h[b]) / t, 4) : null;
    };
  out.stress = {
    inContact: { seconds: r(sum(Object.values(hc)), 0), p50: histPct(hc, 0.5), p90: histPct(hc, 0.9), p99: histPct(hc, 0.99), shareAbove_1_3: share(hc, 1 / 3), shareAbove_2_3: share(hc, 2 / 3) },
    quiet: { seconds: r(sum(Object.values(hq)), 0), p50: histPct(hq, 0.5), p90: histPct(hq, 0.9), p99: histPct(hq, 0.99), shareAbove_1_3: share(hq, 1 / 3), shareAbove_2_3: share(hq, 2 / 3) }
  };
  out.byCasualties = {};
  for (let k = 0; k <= 6; k++) {
    const rows = rs.map(x => x.byCasualties[k]).filter(Boolean);
    if (!rows.length) continue;
    const h = mergeHist(rows.map(x => x.stress)),
      sec = sum(rows, x => x.sec);
    out.byCasualties[k] = {
      squadSecondsPer100SquadBattles: r((100 * sec) / sb, 1),
      stressP50: histPct(h, 0.5),
      stressP90: histPct(h, 0.9),
      maxStress: Math.max(...rows.map(x => x.maxStress)),
      secondsMoraleBreaksPer100SquadBattles: r((100 * sum(rows, x => x.secMoraleBreaks)) / sb, 2)
    };
  }
  const R = k => sum(rs, x => x.retreat[k]);
  out.retreat = {
    entriesPer100SquadBattles: per(sum(rs, x => x.entries.length)),
    entriesByCause: rs.flatMap(x => x.entries).reduce((o, e) => ((o[e.cause] = (o[e.cause] || 0) + 1), o), {}),
    entryMeanStress: r(sum(rs.flatMap(x => x.entries), e => e.meanStress) / Math.max(1, sum(rs, x => x.entries.length)), 3),
    entryCasualtyFrac: rs.flatMap(x => x.entries).reduce((o, e) => ((o[e.casualtyFrac] = (o[e.casualtyFrac] || 0) + 1), o), {}),
    seconds: r(R('sec'), 0),
    secondsPer100SquadBattles: r((100 * R('sec')) / sb, 0),
    shareCalm: r(R('secCalm') / Math.max(1, R('sec')), 3),
    shareCasualtyOk: r(R('secCasualtyOk') / Math.max(1, R('sec')), 3),
    shareBothRallyHalves: r(R('secBoth') / Math.max(1, R('sec')), 3),
    sharePostMerge: r(R('secPostMerge') / Math.max(1, R('sec')), 3),
    exitsByHow: rs.flatMap(x => x.exits).reduce((o, e) => ((o[e.how] = (o[e.how] || 0) + 1), o), {}),
    stillRetreatingAtEnd: sum(rs, x => x.stillRetreatingAtEnd.length),
    stillRetreatingPostMergeAtEnd: sum(rs, x => x.stillRetreatingAtEnd.filter(s => s.postMerge).length)
  };
  const lag = rs.flatMap(x => x.exits).filter(e => e.secondsSinceMerge != null).map(e => e.secondsSinceMerge).sort((a, b) => a - b);
  out.mergeReleaseLagSeconds = { n: lag.length, p50: pct(lag, 0.5), p90: pct(lag, 0.9), max: lag.length ? lag[lag.length - 1] : null };
  const mergeStress = rs.flatMap(x => x.merges).map(m => m.meanStress).sort((a, b) => a - b);
  out.merges = { n: mergeStress.length, per100SquadBattles: per(mergeStress.length), meanStressP50: pct(mergeStress, 0.5), meanStressP90: pct(mergeStress, 0.9), shareAtOrAboveRallyStress: r(mergeStress.filter(s => s >= rs[0].tuning.rallyStress).length / Math.max(1, mergeStress.length), 3) };
  const groups = rs.flatMap(x => x.groups);
  out.groups = { formed: groups.length, singleton: groups.filter(g => g.singleton).length, singletonRecentlyMerged: groups.filter(g => g.singleton && g.recentlyMerged).length };
  return out;
}

function coa(arm) {
  const rs = arm.battles.map(b => b.reports && b.reports['coa-decisions']).filter(Boolean);
  if (!rs.length) return null;
  const sb = sum(rs, x => x.squadBattles),
    per = x => r((100 * x) / sb, 2),
    cs = rs.flatMap(x => x.contacts),
    bnd = cs.filter(c => c.bounding),
    lens = a => a.filter(c => c.length != null).map(c => c.length).sort((x, y) => x - y),
    shareOf = (a, f) => r(a.filter(f).length / Math.max(1, a.length), 3);
  const out = {
    battles: rs.length,
    squadBattles: sb,
    flagOn: rs[0].flagOn,
    weights: rs[0].weights,
    boundPhases: rs[0].boundPhases,
    selfCheckMismatches: sum(rs, x => x.selfCheck.mismatched),
    selfCheckChecked: sum(rs, x => x.selfCheck.checked),
    authViolations: sum(rs, x => x.authViolations),
    contactStartsPer100SquadBattles: per(cs.length),
    contactStartsByPhase: cs.reduce((o, c) => ((o[c.phase || '-'] = (o[c.phase || '-'] || 0) + 1), o), {}),
    shareStartedInBoundingPhase: shareOf(cs, c => c.bounding),
    winnerShare: { defend: shareOf(cs, c => c.winner === 'defend'), defendInBoundingPhase: shareOf(bnd, c => c.winner === 'defend') },
    defendReasons: {
      leaderDown: shareOf(cs.filter(c => c.winner === 'defend'), c => c.leaderDown === 1),
      casualtiesAndStress: shareOf(cs.filter(c => c.winner === 'defend'), c => c.leaderDown === 0)
    },
    inputsAtStart: {
      casualtyFracMean: r(sum(cs, c => c.casualtyFrac) / Math.max(1, cs.length), 3),
      stressMean: r(sum(cs, c => c.stress) / Math.max(1, cs.length), 3),
      leaderDownShare: shareOf(cs, c => c.leaderDown === 1),
      casualtyFracAtLeast_0_3: shareOf(cs, c => c.casualtyFrac >= 0.3 - 1e-9)
    },
    contactLengthSeconds: { p50: pct(lens(cs), 0.5), p90: pct(lens(cs), 0.9), shareUnder9s: shareOf(cs.filter(c => c.length != null), c => c.length < 9) },
    boundingContactLengthSeconds: { p50: pct(lens(bnd), 0.5), p90: pct(lens(bnd), 0.9), shareUnder9s: shareOf(bnd.filter(c => c.length != null), c => c.length < 9) },
    phaseChangedShare: shareOf(cs, c => c.phaseChanged)
  };
  const byWinner = w => {
    const a = bnd.filter(c => c.winner === w),
      sec = sum(a, c => c.secBounding);
    return {
      contacts: a.length,
      boundingContactMinutes: r(sec / 60, 1),
      boundsSent: sum(a, c => c.boundsSent),
      boundsPerBoundingContactMinute: sec ? r(sum(a, c => c.boundsSent) / (sec / 60), 3) : null,
      opportunityTicks: sum(a, c => c.opportunityTicks),
      blockedTicks: sum(a, c => c.blockedTicks)
    };
  };
  out.boundingPhaseContacts = { assault: byWinner('assault'), defend: byWinner('defend') };
  out.boundsSentAllContactsPer100SquadBattles = per(sum(cs, c => c.boundsSent));
  out.blockedByCoa = {
    ticksPer100SquadBattles: per(sum(cs, c => c.blockedTicks)),
    /* what the withheld ticks would have been at the rate a squad under `assault` bounds at */
    withheldBoundsEstimatePer100SquadBattles: (() => {
      const a = out.boundingPhaseContacts.assault.boundsPerBoundingContactMinute,
        sec = sum(bnd.filter(c => c.winner === 'defend'), c => c.secBounding);
      return a == null ? null : per(a * (sec / 60));
    })()
  };
  return out;
}

const report = arms.map(a => ({
  arm: a.label,
  battles: a.battles.length,
  errors: sum(a.battles, b => (b.errors || []).length),
  sameBattleFalse: a.battles.filter(b => b.sameBattle === false).length,
  winners: a.battles.reduce((o, b) => ((o[b.winner || 'none'] = (o[b.winner || 'none'] || 0) + 1), o), {}),
  wallSecondsMedian: pct(a.battles.map(b => b.wallSeconds).sort((x, y) => x - y), 0.5),
  morale: morale(a),
  coa: coa(a)
}));
if (JSON_OUT) console.log(JSON.stringify(report, null, 1));
else
  for (const x of report) {
    console.log('==== ' + x.arm + ': ' + x.battles + ' battles, page errors ' + x.errors + ', control mismatches ' + x.sameBattleFalse + ', winners ' + JSON.stringify(x.winners) + ', median wall ' + x.wallSecondsMedian + ' s');
    if (x.morale) console.log('-- morale-decisions\n' + JSON.stringify(x.morale, null, 1));
    if (x.coa) console.log('-- coa-decisions\n' + JSON.stringify(x.coa, null, 1));
  }
process.exit(report.some(x => x.errors || x.sameBattleFalse || (x.morale && x.morale.selfCheckMismatches) || (x.coa && (x.coa.selfCheckMismatches || x.coa.authViolations))) ? 1 : 0);
