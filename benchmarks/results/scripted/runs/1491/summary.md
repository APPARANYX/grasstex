# Benchmark run #1491 · 60 seeds from `p698` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1` · **ON** flags: `strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/main-9db774e1 @ 9db774e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41217960938) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.977 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2805 | 2805 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1168 | 1168 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1637 | 1637 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 42220 | 42220 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 6140 | 6140 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 101147 | 101147 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 221421 | 221421 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 313 | 313 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 641 | 641 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 244 | 244 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1700 | 1700 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1115 | 1115 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 434 | 434 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 289 | 289 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1331 | 1331 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4817.0999999999985 | 4817.0999999999985 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4483.9 | 4483.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3795.9 | 3795.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5984.700000000001 | 5984.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5628.400000000001 | 5628.400000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5443.899999999999 | 5443.899999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p698-0001 (identical) · p698-0002 (identical) · p698-0003 (identical) · p698-0004 (identical) · p698-0005 (identical) · p698-0006 (identical) · p698-0007 (identical) · p698-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1491&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-9db774e1/ai_flow_live.html?bench=1491&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1491`); it opens the seed that parts earliest, and the dropdowns choose another.

