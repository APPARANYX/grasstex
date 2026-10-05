# Benchmark run #333 · 100 seeds from `three-more-bugs` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ c849087 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37319234727) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.989 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 489 | 489 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 243 | 243 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 246 | 246 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 4623 | 4623 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 953 | 953 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 929 | 929 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 168114 | 168114 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 56 | 56 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 484 | 484 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1342 | 1342 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1222 | 1222 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 252 | 252 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1212 | 1212 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 9001.400000000003 | 9001.400000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8615.499999999996 | 8615.499999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8301.9 | 8301.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9954.699999999995 | 9954.699999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9817.699999999997 | 9817.699999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9357.700000000003 | 9357.700000000003 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

three-more-bugs-0001 (identical) · three-more-bugs-0002 (identical) · three-more-bugs-0003 (identical) · three-more-bugs-0004 (identical) · three-more-bugs-0005 (identical) · three-more-bugs-0006 (identical) · three-more-bugs-0007 (identical) · three-more-bugs-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=333&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=333`); it opens the seed that parts earliest, and the dropdowns choose another.

