# Benchmark run #1414 · 60 seeds from `pr683-gate-20261029` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/main-b913a742 @ b913a74 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40907262245) · build v29-dev

## Verdict

**INERT: all 54 pairs identical in every field**


## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x1.004 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1355 | 1355 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 536 | 536 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 819 | 819 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6375 | 6375 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2520 | 2520 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 7440 | 7440 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 67119 | 67119 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 109 | 109 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 71 | 71 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 823 | 823 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 485 | 485 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 199 | 199 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 381 | 381 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 481 | 481 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4750.000000000002 | 4750.000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4255.8 | 4255.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4356.100000000001 | 4356.100000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5381.8 | 5381.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5309.6 | 5309.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4786.0999999999985 | 4786.0999999999985 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 (identical) · pr683-gate-20261029-0002 (identical) · pr683-gate-20261029-0003 (identical) · pr683-gate-20261029-0004 (identical) · pr683-gate-20261029-0005 (identical) · pr683-gate-20261029-0006 (identical) · pr683-gate-20261029-0007 (identical) · pr683-gate-20261029-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1414&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-b913a742/ai_flow_live.html?bench=1414&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1414`); it opens the seed that parts earliest, and the dropdowns choose another.

