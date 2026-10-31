# Benchmark run #1463 · 60 seeds from `s697` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- claude/project-thread-ngjdqx @ d1f3035 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41188221245) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.012 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 930 | 930 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 384 | 384 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 546 | 546 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 21809 | 21809 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2051 | 2051 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 5479 | 5479 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 169698 | 169698 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 615 | 615 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 135 | 135 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1054 | 1054 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 59 | 59 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 559 | 559 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 423 | 423 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 320 | 320 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 893 | 893 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5086.8 | 5086.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4654.5999999999985 | 4654.5999999999985 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4327.000000000002 | 4327.000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5926.699999999999 | 5926.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5578.600000000003 | 5578.600000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5369.000000000002 | 5369.000000000002 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

s697-0001 (identical) · s697-0002 (identical) · s697-0003 (identical) · s697-0004 (identical) · s697-0005 (identical) · s697-0006 (identical) · s697-0007 (identical) · s697-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1463&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1463`); it opens the seed that parts earliest, and the dropdowns choose another.

