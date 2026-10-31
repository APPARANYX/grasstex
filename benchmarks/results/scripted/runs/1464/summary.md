# Benchmark run #1464 · 60 seeds from `s697` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerStructure=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- claude/project-thread-ngjdqx @ d1f3035 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41188402208) · build v29-dev

## Verdict

**QUIET: 21 of 21 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Unpaired records: off 3, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **21** pairs (unpaired: off 3, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.049 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 284 | 284 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 99 | 99 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 185 | 185 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5732 | 5732 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 584 | 584 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1756 | 1756 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 35470 | 35470 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 154 | 154 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 95 | 95 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 299 | 299 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 103 | 103 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 141 | 141 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 213 | 213 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 158 | 158 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1840.0000000000002 | 1840.0000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1656.2 | 1656.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1689 | 1689 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 2088.9 | 2088.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1998.1 | 1998.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1822.2000000000003 | 1822.2000000000003 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

s697-0007 (identical) · s697-0008 (identical) · s697-0009 (identical) · s697-0010 (identical) · s697-0011 (identical) · s697-0012 (identical) · s697-0019 (identical) · s697-0020 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1464&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1464`); it opens the seed that parts earliest, and the dropdowns choose another.

