# Benchmark run #1485 · 60 seeds from `v697` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s697-3e7df6e1 @ 3e7df6e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41201397572) · build v29-dev

## Verdict

**QUIET: 54 of 54 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.005 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 723 | 723 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 356 | 356 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 367 | 367 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 18924 | 18924 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1535 | 1535 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 6277 | 6277 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 91601 | 91601 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 397 | 397 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 140 | 140 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 746 | 746 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 381 | 381 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 245 | 245 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 288 | 288 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 397 | 397 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4657.200000000001 | 4657.200000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4180.9000000000015 | 4180.9000000000015 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4117.000000000001 | 4117.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5373.799999999999 | 5373.799999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5153.1 | 5153.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4741.800000000002 | 4741.800000000002 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

v697-0001 (identical) · v697-0002 (identical) · v697-0004 (identical) · v697-0006 (identical) · v697-0007 (identical) · v697-0008 (identical) · v697-0009 (identical) · v697-0010 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1485&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s697-3e7df6e1/ai_flow_live.html?bench=1485&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1485`); it opens the seed that parts earliest, and the dropdowns choose another.

