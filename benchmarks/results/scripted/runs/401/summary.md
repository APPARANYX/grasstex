# Benchmark run #401 · 60 seeds from `control` (meeting), windows `every120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ be66725 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37772726518) · build v29-dev

## Verdict

**INERT: all 293 pairs identical in every field**


## Paired comparison (off against on)

- **293** pairs (unpaired: off 0, on 0) · identical in every field: **293** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8160 | 8160 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 3672 | 3672 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 4488 | 4488 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 21871 | 21871 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 7452 | 7452 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 94918 | 94918 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 642877 | 642877 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 295 | 295 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 246 | 246 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 516 | 516 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 66 | 66 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 730 | 730 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1906 | 1906 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 6687 | 6687 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 306 | 306 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 4473 | 4473 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 166 | 166 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1560 | 1560 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1626 | 1626 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 5127 | 5127 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 25428.29999999999 | 25428.29999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 23923.699999999986 | 23923.699999999986 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21175.699999999986 | 21175.699999999986 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 28989.999999999996 | 28989.999999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 28988.799999999996 | 28988.799999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 25843.39999999999 | 25843.39999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0001 (identical) · control-0002 (identical) · control-0003 (identical) · control-0004 (identical) · control-0005 (identical) · control-0006 (identical) · control-0007 (identical) · control-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=401&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=401`); it opens the seed that parts earliest, and the dropdowns choose another.

