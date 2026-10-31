# Benchmark run #1493 · 60 seeds from `p698` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&supportWait=0&releasedOrder=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s698-bc23ab80 @ bc23ab8 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41217966516) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.6% (p 0.148)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.011 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2539 | 2474 | -1.0833 | 58 | 23 | 35 | 0.148 |
| `usKills` | 1138 | 1032 | -1.7667 | 58 | 26 | 32 | 0.5118 |
| `geKills` | 1401 | 1442 | 0.6833 | 58 | 26 | 32 | 0.5118 |
| `fire.total` | 59315 | 57614 | -28.35 | 60 | 28 | 32 | 0.6989 |
| `fire.hits` | 5891 | 5480 | -6.85 | 59 | 27 | 32 | 0.6029 |
| `retreatSamples` | 117120 | 119602 | 41.3667 | 60 | 33 | 27 | 0.519 |
| `movementResolver.changes` | 291420 | 287433 | -66.45 | 60 | 23 | 37 | 0.0925 |
| `grenades.throws` | 37 | 53 | 0.2667 | 23 | 13 | 10 | 0.6776 |
| `grenades.bursts` | 37 | 53 | 0.2667 | 23 | 13 | 10 | 0.6776 |
| `grenades.wounded` | 22 | 50 | 0.4667 | 17 | 10 | 7 | 0.6291 |
| `grenades.casualties` | 7 | 15 | 0.1333 | 13 | 8 | 5 | 0.5811 |
| `grenades.suppressed` | 69 | 92 | 0.3833 | 19 | 12 | 7 | 0.3593 |
| `grenades.friendlyWounded` | 2 | 1 | -0.0167 | 3 | 1 | 2 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 7 | 7 | 0 | 10 | 6 | 4 | 0.7539 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 273 | 287 | 0.2333 | 55 | 30 | 25 | 0.5901 |
| `loopAlerts.length` | 973 | 980 | 0.1167 | 27 | 14 | 13 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 252 | 274 | 0.3667 | 53 | 28 | 25 | 0.7838 |
| `stallOutcomes.wakes` | 6 | 5 | -0.0167 | 10 | 5 | 5 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 6 | 3 | 3 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1726 | 1741 | 0.25 | 55 | 31 | 24 | 0.4188 |
| `recon.contacts` | 85 | 82 | -0.05 | 43 | 19 | 24 | 0.5424 |
| `recon.noContact` | 894 | 941 | 0.7833 | 55 | 31 | 24 | 0.4188 |
| `recon.timeouts` | 7 | 6 | -0.0167 | 13 | 6 | 7 | 1 |
| `recon.cancelled` | 650 | 644 | -0.1 | 52 | 26 | 26 | 1 |
| `recon.reportsDelivered` | 453 | 462 | 0.15 | 49 | 21 | 28 | 0.3916 |
| `recon.retriggerBlocked` | 1375 | 1427 | 0.8667 | 54 | 30 | 24 | 0.4966 |
| `squadPerformance.meanOverall` | 4803.899999999998 | 4791.600000000003 | -0.205 | 59 | 22 | 37 | 0.0674 |
| `squadPerformance.p10Overall` | 4481.099999999999 | 4478.300000000001 | -0.0467 | 30 | 16 | 14 | 0.8555 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3625.800000000002 | 3654.400000000001 | 0.4767 | 60 | 28 | 32 | 0.6989 |
| `squadPerformance.meanMovement` | 5982.800000000002 | 5983.6 | 0.0133 | 47 | 29 | 18 | 0.1439 |
| `squadPerformance.meanControl` | 5602.900000000002 | 5575.200000000002 | -0.4617 | 59 | 29 | 30 | 1 |
| `squadPerformance.meanCohesion` | 5587.6 | 5547.300000000001 | -0.6717 | 59 | 27 | 32 | 0.6029 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p698-0001 0.15 s (timeline) · p698-0002 0.15 s (timeline) · p698-0003 0.15 s (timeline) · p698-0004 0.15 s (timeline) · p698-0005 0.15 s (timeline) · p698-0006 0.15 s (timeline) · p698-0007 0.15 s (timeline) · p698-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1493&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s698-bc23ab80/ai_flow_live.html?bench=1493&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1493`); it opens the seed that parts earliest, and the dropdowns choose another.

