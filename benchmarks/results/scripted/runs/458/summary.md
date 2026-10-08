# Benchmark run #458 · 60 seeds from `exec361p` (ge-defend), windows `contact+600`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- bench/exec-pair-5b9e513 @ 5b9e513 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37845569662) · build v29-dev

## Verdict

**INERT: all 53 pairs identical in every field**


## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **53** · runtime errors off 0 / on 0 · wall time on/off x1.012 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2590 | 2590 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1110 | 1110 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1480 | 1480 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 17973 | 17973 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 6013 | 6013 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 89234 | 89234 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 142480 | 142480 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 172 | 172 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 145 | 145 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3525 | 3525 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 304 | 304 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1277 | 1277 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1119 | 1119 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 747 | 747 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1347 | 1347 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1387 | 1387 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4396.799999999999 | 4396.799999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3996.4999999999995 | 3996.4999999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3645.4999999999995 | 3645.4999999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5268.8 | 5268.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5177.4 | 5177.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4644.2 | 4644.2 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0001 (identical) · exec361p-0002 (identical) · exec361p-0006 (identical) · exec361p-0007 (identical) · exec361p-0008 (identical) · exec361p-0010 (identical) · exec361p-0011 (identical) · exec361p-0013 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=458&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=458`); it opens the seed that parts earliest, and the dropdowns choose another.

