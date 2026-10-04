# Benchmark run #298 · 20 seeds from `phase-0e-rally-release` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ fa8d2b6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37200277279) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 0.15 s); 2 of 32 counters under p 0.05 (about 1.6 by chance); casualties -4.1% (p 0.8145)**

- Under 0.05 only: stallOutcomes.wakes 88 to 119 (+35.2%, p 0.0078); recon.noContact 285 to 298 (+4.6%, p 0.0386).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.113 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 121 | 116 | -0.25 | 18 | 8 | 10 | 0.8145 |
| `usKills` | 50 | 54 | 0.2 | 14 | 5 | 9 | 0.424 |
| `geKills` | 71 | 62 | -0.45 | 16 | 7 | 9 | 0.8036 |
| `fire.total` | 1642 | 1358 | -14.2 | 20 | 7 | 13 | 0.2632 |
| `fire.hits` | 262 | 261 | -0.05 | 17 | 5 | 12 | 0.1435 |
| `retreatSamples` | 191 | 219 | 1.4 | 11 | 6 | 5 | 1 |
| `movementResolver.changes` | 35954 | 34573 | -69.05 | 20 | 6 | 14 | 0.1153 |
| `movementStalls.length` | 2 | 1 | -0.05 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 6 | 14 | 0.4 | 10 | 8 | 2 | 0.1094 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 6 | 2 | -0.2 | 4 | 0 | 4 | 0.125 |
| `stallOutcomes.wakes` | 88 | 119 | 1.55 | 8 | 8 | 0 | 0.0078 |
| `stallOutcomes.repeats` | 16 | 16 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 10 | 20 | 0.5 | 2 | 1 | 1 | 1 |
| `recon.orders` | 303 | 315 | 0.6 | 13 | 8 | 5 | 0.5811 |
| `recon.contacts` | 6 | 4 | -0.1 | 8 | 3 | 5 | 0.7266 |
| `recon.noContact` | 285 | 298 | 0.65 | 12 | 10 | 2 | 0.0386 |
| `recon.timeouts` | 2 | 5 | 0.15 | 5 | 4 | 1 | 0.375 |
| `recon.cancelled` | 7 | 5 | -0.1 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 38 | 22 | -0.8 | 7 | 2 | 5 | 0.4531 |
| `recon.retriggerBlocked` | 284 | 298 | 0.7 | 14 | 10 | 4 | 0.1796 |
| `squadPerformance.meanOverall` | 1782.8000000000004 | 1788.6000000000004 | 0.29 | 19 | 13 | 6 | 0.1671 |
| `squadPerformance.p10Overall` | 1697.1000000000001 | 1701.8 | 0.235 | 20 | 8 | 12 | 0.5034 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1639.5999999999997 | 1641.2 | 0.08 | 18 | 9 | 9 | 1 |
| `squadPerformance.meanMovement` | 1988 | 1987.1 | -0.045 | 19 | 8 | 11 | 0.6476 |
| `squadPerformance.meanControl` | 1951.0999999999997 | 1947.1999999999996 | -0.195 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.meanCohesion` | 1851.5999999999995 | 1873.6 | 1.1 | 20 | 10 | 10 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-rally-release-0001 0.15 s (timeline) · phase-0e-rally-release-0002 0.15 s (timeline) · phase-0e-rally-release-0003 0.15 s (timeline) · phase-0e-rally-release-0004 0.15 s (timeline) · phase-0e-rally-release-0005 0.15 s (timeline) · phase-0e-rally-release-0006 0.15 s (timeline) · phase-0e-rally-release-0007 0.15 s (timeline) · phase-0e-rally-release-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=298&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=298&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=298`); it opens the seed that parts earliest, and the dropdowns choose another.

