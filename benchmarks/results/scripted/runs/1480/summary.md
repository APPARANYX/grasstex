# Benchmark run #1480 · 60 seeds from `u697` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s697-de6546f4 @ de6546f · [run](https://github.com/APPARANYX/grasstex/actions/runs/41194609732) · build v29-dev

## Verdict

**QUIET: 50 of 50 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.029 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 701 | 701 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 261 | 261 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 440 | 440 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 15951 | 15951 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1623 | 1623 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 4352 | 4352 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 86774 | 86774 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 359 | 359 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 233 | 233 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 788 | 788 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 84 | 84 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 289 | 289 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 362 | 362 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 404 | 404 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 386 | 386 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4357.000000000001 | 4357.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3935.3999999999996 | 3935.3999999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3938.6000000000004 | 3938.6000000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 4971.5 | 4971.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 4756 | 4756 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4340.300000000001 | 4340.300000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

u697-0001 (identical) · u697-0002 (identical) · u697-0003 (identical) · u697-0004 (identical) · u697-0006 (identical) · u697-0007 (identical) · u697-0008 (identical) · u697-0009 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1480&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s697-de6546f4/ai_flow_live.html?bench=1480&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1480`); it opens the seed that parts earliest, and the dropdowns choose another.

