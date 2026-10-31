# Benchmark run #1497 · 60 seeds from `p698` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1` · **ON** flags: `strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/main-9db774e1 @ 9db774e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41217983313) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2271 | 2271 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 937 | 937 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1334 | 1334 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 33504 | 33504 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4869 | 4869 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 96185 | 96185 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 141789 | 141789 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 68 | 68 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 563 | 563 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 225 | 225 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1133 | 1133 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 128 | 128 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 623 | 623 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 53 | 53 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 280 | 280 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 562 | 562 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 635 | 635 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5016.999999999998 | 5016.999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4635.099999999999 | 4635.099999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4204.999999999998 | 4204.999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5991.000000000001 | 5991.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5750.000000000002 | 5750.000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5401.9 | 5401.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p698-0001 (identical) · p698-0002 (identical) · p698-0003 (identical) · p698-0004 (identical) · p698-0005 (identical) · p698-0006 (identical) · p698-0007 (identical) · p698-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1497&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-9db774e1/ai_flow_live.html?bench=1497&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1497`); it opens the seed that parts earliest, and the dropdowns choose another.

