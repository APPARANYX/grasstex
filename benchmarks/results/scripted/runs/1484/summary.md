# Benchmark run #1484 · 60 seeds from `v697` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s697-3e7df6e1 @ 3e7df6e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41201396085) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.027 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 921 | 921 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 341 | 341 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 580 | 580 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 23165 | 23165 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2038 | 2038 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 5099 | 5099 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 172291 | 172291 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 679 | 679 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 125 | 125 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1110 | 1110 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 575 | 575 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 448 | 448 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 317 | 317 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 921 | 921 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5090 | 5090 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4663.100000000001 | 4663.100000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4346.799999999999 | 4346.799999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5905.200000000002 | 5905.200000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5537.299999999999 | 5537.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5367.599999999999 | 5367.599999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

v697-0001 (identical) · v697-0002 (identical) · v697-0003 (identical) · v697-0004 (identical) · v697-0005 (identical) · v697-0006 (identical) · v697-0007 (identical) · v697-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1484&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s697-3e7df6e1/ai_flow_live.html?bench=1484&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1484`); it opens the seed that parts earliest, and the dropdowns choose another.

