# Benchmark run #297 · 20 seeds from `phase-0e-rally-release` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ f47bcdd · [run](https://github.com/APPARANYX/grasstex/actions/runs/37199884730) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 0.15 s); 2 of 32 counters under p 0.05 (about 1.6 by chance); casualties -0.8% (p 1)**

- Under 0.05 only: stallOutcomes.wakes 88 to 119 (+35.2%, p 0.0078); squadPerformance.meanOverall 1782.8000000000004 to 1792.8 (+0.6%, p 0.0414).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.129 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 121 | 120 | -0.05 | 17 | 8 | 9 | 1 |
| `usKills` | 50 | 52 | 0.1 | 15 | 6 | 9 | 0.6072 |
| `geKills` | 71 | 68 | -0.15 | 15 | 7 | 8 | 1 |
| `fire.total` | 1642 | 1186 | -22.8 | 20 | 6 | 14 | 0.1153 |
| `fire.hits` | 262 | 244 | -0.9 | 16 | 5 | 11 | 0.2101 |
| `retreatSamples` | 191 | 171 | -1 | 11 | 5 | 6 | 1 |
| `movementResolver.changes` | 35954 | 34525 | -71.45 | 20 | 6 | 14 | 0.1153 |
| `movementStalls.length` | 2 | 0 | -0.1 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 6 | 13 | 0.35 | 9 | 7 | 2 | 0.1797 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 6 | 1 | -0.25 | 4 | 0 | 4 | 0.125 |
| `stallOutcomes.wakes` | 88 | 119 | 1.55 | 8 | 8 | 0 | 0.0078 |
| `stallOutcomes.repeats` | 16 | 16 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 2 | 0 | -0.1 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 10 | 0 | -0.5 | 1 | 0 | 1 | 1 |
| `recon.orders` | 303 | 316 | 0.65 | 13 | 8 | 5 | 0.5811 |
| `recon.contacts` | 6 | 4 | -0.1 | 8 | 3 | 5 | 0.7266 |
| `recon.noContact` | 285 | 297 | 0.6 | 13 | 10 | 3 | 0.0923 |
| `recon.timeouts` | 2 | 7 | 0.25 | 6 | 5 | 1 | 0.2188 |
| `recon.cancelled` | 7 | 5 | -0.1 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 38 | 22 | -0.8 | 7 | 2 | 5 | 0.4531 |
| `recon.retriggerBlocked` | 284 | 298 | 0.7 | 14 | 10 | 4 | 0.1796 |
| `squadPerformance.meanOverall` | 1782.8000000000004 | 1792.8 | 0.5 | 20 | 15 | 5 | 0.0414 |
| `squadPerformance.p10Overall` | 1697.1000000000001 | 1710 | 0.645 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1639.5999999999997 | 1650.1000000000001 | 0.525 | 18 | 10 | 8 | 0.8145 |
| `squadPerformance.meanMovement` | 1988 | 1987.8 | -0.01 | 17 | 6 | 11 | 0.3323 |
| `squadPerformance.meanControl` | 1951.0999999999997 | 1946.6999999999996 | -0.22 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanCohesion` | 1851.5999999999995 | 1878 | 1.32 | 20 | 11 | 9 | 0.8238 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-rally-release-0001 0.15 s (timeline) · phase-0e-rally-release-0002 0.15 s (timeline) · phase-0e-rally-release-0003 0.15 s (timeline) · phase-0e-rally-release-0004 0.15 s (timeline) · phase-0e-rally-release-0005 0.15 s (timeline) · phase-0e-rally-release-0006 0.15 s (timeline) · phase-0e-rally-release-0007 0.15 s (timeline) · phase-0e-rally-release-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=297&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=297&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=297`); it opens the seed that parts earliest, and the dropdowns choose another.

