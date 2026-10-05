# Benchmark run #331 · 100 seeds from `three-bugs-fix` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ a5efa8e · [run](https://github.com/APPARANYX/grasstex/actions/runs/37307458298) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x1.005 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 524 | 524 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 211 | 211 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 313 | 313 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5606 | 5606 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1061 | 1061 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1395 | 1395 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 171802 | 171802 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 83 | 83 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1052 | 1052 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1382 | 1382 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1258 | 1258 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 103 | 103 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1252 | 1252 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8962.999999999998 | 8962.999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8504.4 | 8504.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8239.3 | 8239.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9925.799999999997 | 9925.799999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9800.200000000003 | 9800.200000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9346.699999999999 | 9346.699999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

three-bugs-fix-0001 (identical) · three-bugs-fix-0002 (identical) · three-bugs-fix-0003 (identical) · three-bugs-fix-0004 (identical) · three-bugs-fix-0005 (identical) · three-bugs-fix-0006 (identical) · three-bugs-fix-0007 (identical) · three-bugs-fix-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=331&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=331`); it opens the seed that parts earliest, and the dropdowns choose another.

