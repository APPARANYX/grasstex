# Benchmark run #1486 · 60 seeds from `v697` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s697-3e7df6e1 @ 3e7df6e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41201402637) · build v29-dev

## Verdict

**QUIET: 54 of 54 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 772 | 772 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 304 | 304 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 468 | 468 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 18849 | 18849 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1712 | 1712 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 4925 | 4925 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 92117 | 92117 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 435 | 435 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 293 | 293 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 853 | 853 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 320 | 320 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 43 | 43 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 396 | 396 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 291 | 291 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 417 | 417 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4704.000000000001 | 4704.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4248.3 | 4248.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4255.2 | 4255.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5371.700000000001 | 5371.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5122.300000000001 | 5122.300000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4716.999999999999 | 4716.999999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

v697-0001 (identical) · v697-0002 (identical) · v697-0004 (identical) · v697-0006 (identical) · v697-0007 (identical) · v697-0008 (identical) · v697-0009 (identical) · v697-0010 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1486&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s697-3e7df6e1/ai_flow_live.html?bench=1486&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1486`); it opens the seed that parts earliest, and the dropdowns choose another.

