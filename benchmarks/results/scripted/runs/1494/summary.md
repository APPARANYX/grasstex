# Benchmark run #1494 · 60 seeds from `p698` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1` · **ON** flags: `strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/main-9db774e1 @ 9db774e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41217969140) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.984 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2301 | 2301 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1052 | 1052 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1249 | 1249 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 36674 | 36674 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4991 | 4991 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 98397 | 98397 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 152088 | 152088 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 56 | 56 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 98 | 98 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 643 | 643 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 206 | 206 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1152 | 1152 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 134 | 134 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 622 | 622 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 255 | 255 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 623 | 623 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 649 | 649 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4996.8 | 4996.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4619.799999999999 | 4619.799999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4156.299999999999 | 4156.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5991.900000000001 | 5991.900000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5737.600000000002 | 5737.600000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5435.399999999999 | 5435.399999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p698-0001 (identical) · p698-0002 (identical) · p698-0003 (identical) · p698-0004 (identical) · p698-0005 (identical) · p698-0006 (identical) · p698-0007 (identical) · p698-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1494&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-9db774e1/ai_flow_live.html?bench=1494&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1494`); it opens the seed that parts earliest, and the dropdowns choose another.

