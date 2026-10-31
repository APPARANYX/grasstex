# Benchmark run #1499 · 60 seeds from `c699` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699-0760b932 @ 0760b93 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41232543463) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 202.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +2.7% (p 0.4188)**

- Under 0.05 only: recon.retriggerBlocked 1054 to 1029 (-2.4%, p 0.0135).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.094 (gate 1.25)
- the 60 changed records first part at simulated second: min 162, p10 178.05, median 202.05, p90 243, max 273

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1098 | 1128 | 0.5 | 55 | 31 | 24 | 0.4188 |
| `usKills` | 477 | 485 | 0.1333 | 49 | 24 | 25 | 1 |
| `geKills` | 621 | 643 | 0.3667 | 52 | 24 | 28 | 0.6778 |
| `fire.total` | 26710 | 28617 | 31.7833 | 60 | 36 | 24 | 0.155 |
| `fire.hits` | 2482 | 2489 | 0.1167 | 57 | 27 | 30 | 0.7914 |
| `retreatSamples` | 7052 | 7011 | -0.6833 | 59 | 31 | 28 | 0.7948 |
| `movementResolver.changes` | 207472 | 209762 | 38.1667 | 60 | 36 | 24 | 0.155 |
| `grenades.throws` | 33 | 36 | 0.05 | 12 | 7 | 5 | 0.7744 |
| `grenades.bursts` | 31 | 34 | 0.05 | 10 | 6 | 4 | 0.7539 |
| `grenades.wounded` | 51 | 31 | -0.3333 | 8 | 3 | 5 | 0.7266 |
| `grenades.casualties` | 18 | 12 | -0.1 | 5 | 1 | 4 | 0.375 |
| `grenades.suppressed` | 107 | 80 | -0.45 | 5 | 3 | 2 | 1 |
| `grenades.friendlyWounded` | 3 | 0 | -0.05 | 3 | 0 | 3 | 0.25 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 7 | 0.0833 | 6 | 5 | 1 | 0.2188 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 8 | -0.0333 | 6 | 3 | 3 | 1 |
| `loopAlerts.length` | 822 | 815 | -0.1167 | 40 | 20 | 20 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 40 | 42 | 0.0333 | 30 | 17 | 13 | 0.5847 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1251 | 1227 | -0.4 | 34 | 14 | 20 | 0.3915 |
| `recon.contacts` | 66 | 71 | 0.0833 | 27 | 16 | 11 | 0.4421 |
| `recon.noContact` | 683 | 679 | -0.0667 | 16 | 6 | 10 | 0.4545 |
| `recon.timeouts` | 3 | 3 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 492 | 464 | -0.4667 | 31 | 10 | 21 | 0.0708 |
| `recon.reportsDelivered` | 323 | 412 | 1.4833 | 29 | 20 | 9 | 0.0614 |
| `recon.retriggerBlocked` | 1054 | 1029 | -0.4167 | 33 | 9 | 24 | 0.0135 |
| `squadPerformance.meanOverall` | 5024.299999999999 | 5036.699999999999 | 0.2067 | 58 | 29 | 29 | 1 |
| `squadPerformance.p10Overall` | 4597.6 | 4603.799999999998 | 0.1033 | 52 | 30 | 22 | 0.3317 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4251.400000000001 | 4308.499999999999 | 0.9517 | 57 | 29 | 28 | 1 |
| `squadPerformance.meanMovement` | 5911.899999999998 | 5905.9 | -0.1 | 54 | 28 | 26 | 0.8919 |
| `squadPerformance.meanControl` | 5510.299999999998 | 5502.099999999999 | -0.1367 | 56 | 29 | 27 | 0.8939 |
| `squadPerformance.meanCohesion` | 5396.6 | 5350.8 | -0.7633 | 59 | 24 | 35 | 0.1925 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699-0026 162 s (timeline) · c699-0056 166.05 s (timeline) · c699-0017 172.05 s (timeline) · c699-0050 173.1 s (timeline) · c699-0024 176.1 s (timeline) · c699-0003 178.05 s (timeline) · c699-0011 178.05 s (timeline) · c699-0060 178.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1499&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699-0760b932/ai_flow_live.html?bench=1499&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1499`); it opens the seed that parts earliest, and the dropdowns choose another.

