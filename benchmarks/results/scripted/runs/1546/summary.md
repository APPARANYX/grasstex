# Benchmark run #1546 · 60 seeds from `vret` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerRetreat=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/retreat-54aff277 @ 54aff27 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256987009) · build v29-dev

## Verdict

**QUIET: 59 of 60 pairs changed (median first part 259.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.0% (p 0.7709)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.999 (gate 1.25)
- the 53 changed records first part at simulated second: min 189, p10 221.1, median 259.05, p90 290.1, max 307.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1141 | 1118 | -0.3833 | 47 | 22 | 25 | 0.7709 |
| `usKills` | 492 | 487 | -0.0833 | 39 | 23 | 16 | 0.3368 |
| `geKills` | 649 | 631 | -0.3 | 43 | 16 | 27 | 0.1263 |
| `fire.total` | 31917 | 31808 | -1.8167 | 51 | 26 | 25 | 1 |
| `fire.hits` | 2520 | 2468 | -0.8667 | 43 | 21 | 22 | 1 |
| `retreatSamples` | 7260 | 7342 | 1.3667 | 41 | 21 | 20 | 1 |
| `movementResolver.changes` | 208205 | 209317 | 18.5333 | 53 | 32 | 21 | 0.169 |
| `grenades.throws` | 18 | 17 | -0.0167 | 6 | 2 | 4 | 0.6875 |
| `grenades.bursts` | 16 | 17 | 0.0167 | 4 | 2 | 2 | 1 |
| `grenades.wounded` | 16 | 26 | 0.1667 | 5 | 4 | 1 | 0.375 |
| `grenades.casualties` | 4 | 8 | 0.0667 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 43 | 54 | 0.1833 | 4 | 4 | 0 | 0.125 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 3 | -0.0167 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 9 | -0.0167 | 7 | 3 | 4 | 1 |
| `loopAlerts.length` | 794 | 796 | 0.0333 | 25 | 14 | 11 | 0.69 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 43 | 47 | 0.0667 | 13 | 8 | 5 | 0.5811 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1200 | 1201 | 0.0167 | 15 | 7 | 8 | 1 |
| `recon.contacts` | 48 | 43 | -0.0833 | 5 | 0 | 5 | 0.0625 |
| `recon.noContact` | 686 | 688 | 0.0333 | 4 | 3 | 1 | 0.625 |
| `recon.timeouts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 449 | 454 | 0.0833 | 10 | 7 | 3 | 0.3438 |
| `recon.reportsDelivered` | 295 | 271 | -0.4 | 7 | 1 | 6 | 0.125 |
| `recon.retriggerBlocked` | 1034 | 1032 | -0.0333 | 11 | 5 | 6 | 1 |
| `squadPerformance.meanOverall` | 5033.2 | 5032.699999999998 | -0.0083 | 47 | 22 | 25 | 0.7709 |
| `squadPerformance.p10Overall` | 4597.7 | 4614.2 | 0.275 | 28 | 16 | 12 | 0.5716 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4283.200000000002 | 4263.700000000001 | -0.325 | 43 | 24 | 19 | 0.5424 |
| `squadPerformance.meanMovement` | 5915.700000000002 | 5918.400000000001 | 0.045 | 38 | 21 | 17 | 0.6271 |
| `squadPerformance.meanControl` | 5508.000000000001 | 5518.1 | 0.1683 | 44 | 22 | 22 | 1 |
| `squadPerformance.meanCohesion` | 5390.099999999999 | 5410.8 | 0.345 | 44 | 23 | 21 | 0.8804 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

vret-0004 189 s (stress) · vret-0036 207 s (timeline) · vret-0033 210 s (timeline) · vret-0007 219 s (timeline) · vret-0048 220.05 s (timeline) · vret-0010 221.1 s (timeline) · vret-0040 221.1 s (timeline) · vret-0042 227.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1546&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-retreat-54aff277/ai_flow_live.html?bench=1546&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1546`); it opens the seed that parts earliest, and the dropdowns choose another.

