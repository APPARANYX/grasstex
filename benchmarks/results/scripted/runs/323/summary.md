# Benchmark run #323 · 100 seeds from `phase-0e-posture-v3` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=1&commandMovement=0&commandRelay=0`
- main @ 9da5788 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37264106820) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 83.025 s); 3 of 32 counters under p 0.05 (about 1.6 by chance), 1 under 0.0016; casualties +17.2% (p 0.0352)**

- Clears the Bonferroni line (p < 0.0016): geKills 285 to 394 (+38.2%, p 0.0005).
- Under 0.05 only: casualties 592 to 694 (+17.2%, p 0.0352); retreatSamples 1032 to 1460 (+41.5%, p 0.0479).
- Wall time on/off x1.366 is over the 1.25 gate.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.366 (gate 1.25)
- the 100 changed records first part at simulated second: min 46.05, p10 56.1, median 83.025, p90 115.05, max 170.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 592 | 694 | 1.02 | 82 | 51 | 31 | 0.0352 |
| `usKills` | 307 | 300 | -0.07 | 79 | 37 | 42 | 0.653 |
| `geKills` | 285 | 394 | 1.09 | 72 | 51 | 21 | 0.0005 |
| `fire.total` | 6026 | 6344 | 3.18 | 96 | 56 | 40 | 0.1253 |
| `fire.hits` | 1203 | 1354 | 1.51 | 89 | 50 | 39 | 0.2891 |
| `retreatSamples` | 1032 | 1460 | 4.28 | 58 | 37 | 21 | 0.0479 |
| `movementResolver.changes` | 168727 | 168766 | 0.39 | 100 | 50 | 50 | 1 |
| `movementStalls.length` | 7 | 6 | -0.01 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 2 | 0.01 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 43 | 57 | 0.14 | 31 | 19 | 12 | 0.281 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 35 | 33 | -0.02 | 16 | 7 | 9 | 0.8036 |
| `stallOutcomes.wakes` | 8 | 6 | -0.02 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 15 | 14 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 246 | 242 | -0.04 | 3 | 1 | 2 | 1 |
| `recon.orders` | 1393 | 1377 | -0.16 | 54 | 24 | 30 | 0.4966 |
| `recon.contacts` | 24 | 20 | -0.04 | 19 | 8 | 11 | 0.6476 |
| `recon.noContact` | 1302 | 1295 | -0.07 | 42 | 19 | 23 | 0.644 |
| `recon.timeouts` | 13 | 12 | -0.01 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 36 | 37 | 0.01 | 28 | 16 | 12 | 0.5716 |
| `recon.reportsDelivered` | 149 | 137 | -0.12 | 16 | 8 | 8 | 1 |
| `recon.retriggerBlocked` | 1302 | 1295 | -0.07 | 42 | 19 | 23 | 0.644 |
| `squadPerformance.meanOverall` | 8972.8 | 8948.7 | -0.241 | 96 | 43 | 53 | 0.3584 |
| `squadPerformance.p10Overall` | 8594.700000000003 | 8528.8 | -0.659 | 94 | 39 | 55 | 0.1214 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8307 | 8262.199999999999 | -0.448 | 84 | 40 | 44 | 0.7436 |
| `squadPerformance.meanMovement` | 9945.700000000003 | 9942.599999999997 | -0.031 | 67 | 29 | 38 | 0.3284 |
| `squadPerformance.meanControl` | 9833.500000000004 | 9827.3 | -0.062 | 72 | 37 | 35 | 0.9063 |
| `squadPerformance.meanCohesion` | 9347.899999999994 | 9342.900000000001 | -0.05 | 92 | 45 | 47 | 0.917 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-posture-v3-0009 46.05 s (timeline) · phase-0e-posture-v3-0052 47.1 s (timeline) · phase-0e-posture-v3-0035 48 s (timeline) · phase-0e-posture-v3-0033 50.1 s (timeline) · phase-0e-posture-v3-0089 52.05 s (timeline) · phase-0e-posture-v3-0042 54 s (timeline) · phase-0e-posture-v3-0073 54 s (timeline) · phase-0e-posture-v3-0026 55.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=323&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=323`); it opens the seed that parts earliest, and the dropdowns choose another.

