# Benchmark run #1247 · 100 seeds from `rearch-classic-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39780220715) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 202.5 s); 6 of 42 counters under p 0.05 (about 2.1 by chance); casualties +2.7% (p 0.1093)**

- Under 0.05 only: recon.orders 3198 to 3046 (-4.8%, p 0.0055); recon.contacts 165 to 137 (-17.0%, p 0.0119); recon.cancelled 892 to 809 (-9.3%, p 0.0186); movementResolver.changes 329251 to 333174 (+1.2%, p 0.028); recon.reportsDelivered 705 to 595 (-15.6%, p 0.0356); recon.retriggerBlocked 2488 to 2416 (-2.9%, p 0.0475).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.031 (gate 1.25)
- the 94 changed records first part at simulated second: min 148.05, p10 165, median 202.5, p90 316.05, max 583.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5252 | 5395 | 1.43 | 88 | 52 | 36 | 0.1093 |
| `usKills` | 2360 | 2441 | 0.81 | 86 | 49 | 37 | 0.2354 |
| `geKills` | 2892 | 2954 | 0.62 | 88 | 49 | 39 | 0.3374 |
| `fire.total` | 24823 | 25449 | 6.26 | 93 | 46 | 47 | 1 |
| `fire.hits` | 10133 | 10455 | 3.22 | 93 | 52 | 41 | 0.2997 |
| `retreatSamples` | 137574 | 142680 | 51.06 | 92 | 50 | 42 | 0.4657 |
| `movementResolver.changes` | 329251 | 333174 | 39.23 | 92 | 57 | 35 | 0.028 |
| `grenades.throws` | 26 | 24 | -0.02 | 11 | 5 | 6 | 1 |
| `grenades.bursts` | 26 | 24 | -0.02 | 11 | 5 | 6 | 1 |
| `grenades.wounded` | 46 | 41 | -0.05 | 5 | 2 | 3 | 1 |
| `grenades.casualties` | 13 | 13 | 0 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 92 | 78 | -0.14 | 6 | 2 | 4 | 0.6875 |
| `grenades.friendlyWounded` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 12 | 13 | 0.01 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 544 | 551 | 0.07 | 79 | 42 | 37 | 0.653 |
| `loopAlerts.length` | 667 | 710 | 0.43 | 76 | 38 | 38 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 401 | 426 | 0.25 | 74 | 39 | 35 | 0.7275 |
| `stallOutcomes.wakes` | 12 | 10 | -0.02 | 12 | 5 | 7 | 0.7744 |
| `stallOutcomes.repeats` | 2 | 3 | 0.01 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 14 | 15 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 1183 | 994 | -1.89 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 14 | 15 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1183 | 994 | -1.89 | 1 | 0 | 1 | 1 |
| `recon.orders` | 3198 | 3046 | -1.52 | 89 | 31 | 58 | 0.0055 |
| `recon.contacts` | 165 | 137 | -0.28 | 58 | 19 | 39 | 0.0119 |
| `recon.noContact` | 1965 | 1946 | -0.19 | 77 | 34 | 43 | 0.362 |
| `recon.timeouts` | 34 | 30 | -0.04 | 24 | 10 | 14 | 0.5413 |
| `recon.cancelled` | 892 | 809 | -0.83 | 73 | 26 | 47 | 0.0186 |
| `recon.reportsDelivered` | 705 | 595 | -1.1 | 66 | 24 | 42 | 0.0356 |
| `recon.retriggerBlocked` | 2488 | 2416 | -0.72 | 83 | 32 | 51 | 0.0475 |
| `squadPerformance.meanOverall` | 8178.099999999998 | 8155.600000000004 | -0.225 | 89 | 37 | 52 | 0.1374 |
| `squadPerformance.p10Overall` | 7537.900000000001 | 7517.100000000002 | -0.208 | 56 | 27 | 29 | 0.8939 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6742.7 | 6691.999999999996 | -0.507 | 89 | 41 | 48 | 0.525 |
| `squadPerformance.meanMovement` | 9971.999999999996 | 9972.199999999997 | 0.002 | 53 | 27 | 26 | 1 |
| `squadPerformance.meanControl` | 9418.1 | 9395.000000000002 | -0.231 | 90 | 44 | 46 | 0.9161 |
| `squadPerformance.meanCohesion` | 8951.999999999996 | 8981 | 0.29 | 90 | 48 | 42 | 0.5984 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0006 148.05 s (timeline) · rearch-classic-20261022-0090 157.05 s (timeline) · rearch-classic-20261022-0005 158.1 s (timeline) · rearch-classic-20261022-0025 158.1 s (timeline) · rearch-classic-20261022-0084 158.1 s (timeline) · rearch-classic-20261022-0031 161.1 s (timeline) · rearch-classic-20261022-0063 163.05 s (timeline) · rearch-classic-20261022-0016 164.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1247&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1247&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1247`); it opens the seed that parts earliest, and the dropdowns choose another.

