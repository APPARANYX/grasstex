# Benchmark run #364 · 24 seeds from `audit-after` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- bench/only354-356 @ ff52cf5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37710772219) · build v29-dev

## Verdict

**INERT: all 177 pairs identical in every field**


## Paired comparison (off against on)

- **177** pairs (unpaired: off 0, on 0) · identical in every field: **177** · runtime errors off 0 / on 0 · wall time on/off x0.978 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5878 | 5878 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2771 | 2771 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 3107 | 3107 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 8390 | 8390 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2854 | 2854 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 37352 | 37352 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 436324 | 436324 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 109 | 109 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 114 | 114 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 307 | 307 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 68 | 68 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 2173 | 2173 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4391 | 4391 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 219 | 219 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2851 | 2851 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 153 | 153 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1090 | 1090 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1281 | 1281 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3392 | 3392 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 15156.099999999999 | 15156.099999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 14091.600000000011 | 14091.600000000011 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 12318.099999999997 | 12318.099999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 17343.100000000006 | 17343.100000000006 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 17596.099999999995 | 17596.099999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 15329.499999999996 | 15329.499999999996 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

audit-after-0001 (identical) · audit-after-0002 (identical) · audit-after-0003 (identical) · audit-after-0004 (identical) · audit-after-0005 (identical) · audit-after-0006 (identical) · audit-after-0007 (identical) · audit-after-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=364&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=364`); it opens the seed that parts earliest, and the dropdowns choose another.

