# Benchmark run #360 · 12 seeds from `command-audit361` (ge-defend), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ d246945 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37710750164) · build v29-dev

## Verdict

**INERT: all 102 pairs identical in every field**


## Paired comparison (off against on)

- **102** pairs (unpaired: off 0, on 0) · identical in every field: **102** · runtime errors off 0 / on 0 · wall time on/off x0.969 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2066 | 2066 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 973 | 973 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1093 | 1093 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 2392 | 2392 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 892 | 892 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 14539 | 14539 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 142559 | 142559 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 212 | 212 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4201 | 4201 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 320 | 320 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1341 | 1341 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1774 | 1774 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 590 | 590 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1491 | 1491 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1750 | 1750 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 9049.699999999999 | 9049.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8449.200000000003 | 8449.200000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8162.799999999999 | 8162.799999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 10137.399999999998 | 10137.399999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 10175.199999999995 | 10175.199999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 8225.499999999996 | 8225.499999999996 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

command-audit361-0001 (identical) · command-audit361-0002 (identical) · command-audit361-0003 (identical) · command-audit361-0004 (identical) · command-audit361-0005 (identical) · command-audit361-0006 (identical) · command-audit361-0007 (identical) · command-audit361-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=360&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=360`); it opens the seed that parts earliest, and the dropdowns choose another.

