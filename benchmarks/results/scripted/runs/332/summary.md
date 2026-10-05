# Benchmark run #332 · 100 seeds from `three-bugs-validation` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 44fe2e3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37307811310) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.98 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 486 | 486 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 187 | 187 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 299 | 299 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 4648 | 4648 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1019 | 1019 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1150 | 1150 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 166788 | 166788 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 54 | 54 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 219 | 219 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1329 | 1329 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1213 | 1213 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 153 | 153 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1209 | 1209 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8993.200000000003 | 8993.200000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8570.899999999998 | 8570.899999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8290.5 | 8290.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9950.799999999996 | 9950.799999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9825.799999999997 | 9825.799999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9373.8 | 9373.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

three-bugs-validation-0001 (identical) · three-bugs-validation-0002 (identical) · three-bugs-validation-0003 (identical) · three-bugs-validation-0004 (identical) · three-bugs-validation-0005 (identical) · three-bugs-validation-0006 (identical) · three-bugs-validation-0007 (identical) · three-bugs-validation-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=332&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=332`); it opens the seed that parts earliest, and the dropdowns choose another.

