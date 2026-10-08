# Benchmark run #418 · 24 seeds from `fl13` (ge-defend), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ be66725 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37774379472) · build v29-dev

## Verdict

**INERT: all 230 pairs identical in every field**


## Paired comparison (off against on)

- **230** pairs (unpaired: off 0, on 0) · identical in every field: **230** · runtime errors off 0 / on 0 · wall time on/off x0.964 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3997 | 3997 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1996 | 1996 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2001 | 2001 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6457 | 6457 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1967 | 1967 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 29237 | 29237 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 330741 | 330741 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 56 | 56 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 216 | 216 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 9454 | 9454 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 784 | 784 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 3564 | 3564 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 3573 | 3573 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1169 | 1169 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 3921 | 3921 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3948 | 3948 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 20506.699999999993 | 20506.699999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 19116.900000000012 | 19116.900000000012 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 18516.899999999998 | 18516.899999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 22835.100000000006 | 22835.100000000006 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 22939.40000000001 | 22939.40000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 18992.799999999996 | 18992.799999999996 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fl13-0001 (identical) · fl13-0002 (identical) · fl13-0003 (identical) · fl13-0004 (identical) · fl13-0005 (identical) · fl13-0006 (identical) · fl13-0007 (identical) · fl13-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=418&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=418`); it opens the seed that parts earliest, and the dropdowns choose another.

