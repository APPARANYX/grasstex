# Benchmark run #1478 · 60 seeds from `u697` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s697-de6546f4 @ de6546f · [run](https://github.com/APPARANYX/grasstex/actions/runs/41194521696) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.016 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 866 | 866 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 345 | 345 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 521 | 521 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 21325 | 21325 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1870 | 1870 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 5045 | 5045 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 170247 | 170247 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 645 | 645 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 139 | 139 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1011 | 1011 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 545 | 545 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 396 | 396 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 340 | 340 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 872 | 872 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5099.5999999999985 | 5099.5999999999985 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4695.300000000001 | 4695.300000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4348.299999999999 | 4348.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5922 | 5922 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5552.3 | 5552.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5399.999999999999 | 5399.999999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

u697-0001 (identical) · u697-0002 (identical) · u697-0003 (identical) · u697-0004 (identical) · u697-0005 (identical) · u697-0006 (identical) · u697-0007 (identical) · u697-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1478&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s697-de6546f4/ai_flow_live.html?bench=1478&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1478`); it opens the seed that parts earliest, and the dropdowns choose another.

