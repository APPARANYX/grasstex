# Benchmark run #1465 · 60 seeds from `s697` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- claude/project-thread-ngjdqx @ d1f3035 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41188429949) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 885 | 885 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 107 | 107 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 346 | 346 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 5508 | 5508 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 256 | 256 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 229.4 | 229.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 218.20000000000002 | 218.20000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 295.90000000000003 | 295.90000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 286.1 | 286.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 267 | 267 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

s697-0028 (identical) · s697-0029 (identical) · s697-0030 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1465&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1465`); it opens the seed that parts earliest, and the dropdowns choose another.

