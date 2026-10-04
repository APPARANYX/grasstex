# Benchmark run #296 · 20 seeds from `phase-0e-rally-release` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ 073eb52 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37199137111) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 0.15 s); 7 of 32 counters under p 0.05 (about 1.6 by chance), 4 under 0.0016; casualties -5.8% (p 0.6291)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 35954 to 26344 (-26.7%, p 0); squadPerformance.meanOverall 1782.8000000000004 to 1719 (-3.6%, p 0); squadPerformance.meanCohesion 1851.5999999999995 to 1440.2999999999997 (-22.2%, p 0); regroups.entries 6 to 52 (+766.7%, p 0.0001).
- Under 0.05 only: squadPerformance.p10Overall 1697.1000000000001 to 1630.8999999999999 (-3.9%, p 0.0044); loopAlerts.length 6 to 26 (+333.3%, p 0.0063); squadPerformance.meanControl 1951.0999999999997 to 1936.5000000000002 (-0.7%, p 0.0118).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.062 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 121 | 114 | -0.35 | 17 | 10 | 7 | 0.6291 |
| `usKills` | 50 | 42 | -0.4 | 13 | 7 | 6 | 1 |
| `geKills` | 71 | 72 | 0.05 | 14 | 7 | 7 | 1 |
| `fire.total` | 1642 | 933 | -35.45 | 19 | 6 | 13 | 0.1671 |
| `fire.hits` | 262 | 217 | -2.25 | 18 | 9 | 9 | 1 |
| `retreatSamples` | 191 | 114 | -3.85 | 10 | 5 | 5 | 1 |
| `movementResolver.changes` | 35954 | 26344 | -480.5 | 20 | 0 | 20 | 0 |
| `movementStalls.length` | 2 | 4 | 0.1 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 6 | 26 | 1 | 12 | 11 | 1 | 0.0063 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 6 | 52 | 2.3 | 19 | 18 | 1 | 0.0001 |
| `stallOutcomes.wakes` | 88 | 96 | 0.4 | 6 | 4 | 2 | 0.6875 |
| `stallOutcomes.repeats` | 16 | 18 | 0.1 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 2 | 5 | 0.15 | 3 | 2 | 1 | 1 |
| `timeline.stalledSamples` | 10 | 45 | 1.75 | 3 | 2 | 1 | 1 |
| `recon.orders` | 303 | 293 | -0.5 | 17 | 6 | 11 | 0.3323 |
| `recon.contacts` | 6 | 2 | -0.2 | 6 | 1 | 5 | 0.2188 |
| `recon.noContact` | 285 | 277 | -0.4 | 12 | 5 | 7 | 0.7744 |
| `recon.timeouts` | 2 | 4 | 0.1 | 4 | 3 | 1 | 0.625 |
| `recon.cancelled` | 7 | 6 | -0.05 | 8 | 4 | 4 | 1 |
| `recon.reportsDelivered` | 38 | 13 | -1.25 | 7 | 2 | 5 | 0.4531 |
| `recon.retriggerBlocked` | 284 | 281 | -0.15 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanOverall` | 1782.8000000000004 | 1719 | -3.19 | 20 | 0 | 20 | 0 |
| `squadPerformance.p10Overall` | 1697.1000000000001 | 1630.8999999999999 | -3.31 | 19 | 3 | 16 | 0.0044 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1639.5999999999997 | 1639.3999999999999 | -0.01 | 19 | 8 | 11 | 0.6476 |
| `squadPerformance.meanMovement` | 1988 | 1985.3999999999999 | -0.13 | 19 | 9 | 10 | 1 |
| `squadPerformance.meanControl` | 1951.0999999999997 | 1936.5000000000002 | -0.73 | 20 | 4 | 16 | 0.0118 |
| `squadPerformance.meanCohesion` | 1851.5999999999995 | 1440.2999999999997 | -20.565 | 20 | 0 | 20 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-rally-release-0001 0.15 s (timeline) · phase-0e-rally-release-0002 0.15 s (timeline) · phase-0e-rally-release-0003 0.15 s (timeline) · phase-0e-rally-release-0004 0.15 s (timeline) · phase-0e-rally-release-0005 0.15 s (timeline) · phase-0e-rally-release-0006 0.15 s (timeline) · phase-0e-rally-release-0007 0.15 s (timeline) · phase-0e-rally-release-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=296&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=296&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=296`); it opens the seed that parts earliest, and the dropdowns choose another.

