# Benchmark run #595 · 6 seeds from `c-structure-security-517` (meeting), windows `0+180`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localResources=1&localDegrade=1&coveredBounds=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/benchmark-source/299-c-structure-4977f796 @ 4977f79 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38191164263) · build v29-dev

## Verdict

**QUIET: 6 of 6 pairs changed (median first part 179.55 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.053 (gate 1.25)
- the 2 changed records first part at simulated second: min 179.1, p10 179.1, median 179.55, p90 180, max 180

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 7042 | 7032 | -1.6667 | 2 | 0 | 2 | 0.5 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
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
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 100 | 98 | -0.3333 | 2 | 0 | 2 | 0.5 |
| `recon.contacts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 71 | 71 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 552.5 | 552.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 541.8 | 541.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 508.20000000000005 | 508.20000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 599.9 | 599.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 591.9 | 591.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 531.4 | 531.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

c-structure-security-517-0001 179.1 s (timeline) · c-structure-security-517-0005 180 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=595&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-source-299-c-structure-4977f796/ai_flow_live.html?bench=595&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=595`); it opens the seed that parts earliest, and the dropdowns choose another.

