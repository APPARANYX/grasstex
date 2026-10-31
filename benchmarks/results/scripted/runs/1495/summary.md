# Benchmark run #1495 · 60 seeds from `p698` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&supportWait=0&releasedOrder=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s698-bc23ab80 @ bc23ab8 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41217972061) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.0% (p 0.2116)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.955 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2157 | 2178 | 0.35 | 52 | 31 | 21 | 0.2116 |
| `usKills` | 1073 | 1030 | -0.7167 | 47 | 20 | 27 | 0.3817 |
| `geKills` | 1084 | 1148 | 1.0667 | 51 | 29 | 22 | 0.4011 |
| `fire.total` | 56246 | 57538 | 21.5333 | 52 | 27 | 25 | 0.8899 |
| `fire.hits` | 5211 | 5088 | -2.05 | 49 | 22 | 27 | 0.5682 |
| `retreatSamples` | 132306 | 139126 | 113.6667 | 52 | 29 | 23 | 0.4885 |
| `movementResolver.changes` | 193499 | 185836 | -127.7167 | 59 | 28 | 31 | 0.7948 |
| `grenades.throws` | 63 | 51 | -0.2 | 23 | 8 | 15 | 0.21 |
| `grenades.bursts` | 63 | 51 | -0.2 | 23 | 8 | 15 | 0.21 |
| `grenades.wounded` | 44 | 15 | -0.4833 | 16 | 4 | 12 | 0.0768 |
| `grenades.casualties` | 10 | 5 | -0.0833 | 9 | 2 | 7 | 0.1797 |
| `grenades.suppressed` | 92 | 66 | -0.4333 | 17 | 6 | 11 | 0.3323 |
| `grenades.friendlyWounded` | 8 | 4 | -0.0667 | 8 | 3 | 5 | 0.7266 |
| `grenades.friendlyCasualties` | 2 | 0 | -0.0333 | 2 | 0 | 2 | 0.5 |
| `grenades.aborted` | 9 | 10 | 0.0167 | 10 | 4 | 6 | 0.7539 |
| `movementStalls.length` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 88 | 107 | 0.3167 | 42 | 23 | 19 | 0.644 |
| `loopAlerts.length` | 828 | 831 | 0.05 | 19 | 8 | 11 | 0.6476 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 243 | 221 | -0.3667 | 45 | 22 | 23 | 1 |
| `stallOutcomes.wakes` | 6 | 7 | 0.0167 | 8 | 4 | 4 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 4 | 0 | -0.0667 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 4 | 0 | -0.0667 | 1 | 0 | 1 | 1 |
| `recon.orders` | 1490 | 1388 | -1.7 | 48 | 19 | 29 | 0.1934 |
| `recon.contacts` | 253 | 214 | -0.65 | 46 | 22 | 24 | 0.883 |
| `recon.noContact` | 576 | 564 | -0.2 | 39 | 18 | 21 | 0.7493 |
| `recon.timeouts` | 57 | 52 | -0.0833 | 33 | 16 | 17 | 1 |
| `recon.cancelled` | 525 | 496 | -0.4833 | 46 | 19 | 27 | 0.302 |
| `recon.reportsDelivered` | 1029 | 872 | -2.6167 | 51 | 23 | 28 | 0.5758 |
| `recon.retriggerBlocked` | 643 | 625 | -0.3 | 43 | 19 | 24 | 0.5424 |
| `squadPerformance.meanOverall` | 4950.599999999999 | 4964.1 | 0.225 | 51 | 31 | 20 | 0.1608 |
| `squadPerformance.p10Overall` | 4615.6 | 4629.8 | 0.2367 | 19 | 13 | 6 | 0.1671 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3935.0999999999995 | 3936.5999999999995 | 0.025 | 51 | 28 | 23 | 0.5758 |
| `squadPerformance.meanMovement` | 5990.999999999999 | 5990.999999999998 | 0 | 24 | 13 | 11 | 0.8388 |
| `squadPerformance.meanControl` | 5763.499999999999 | 5766.200000000001 | 0.045 | 48 | 19 | 29 | 0.1934 |
| `squadPerformance.meanCohesion` | 5577.899999999999 | 5601.500000000003 | 0.3933 | 52 | 30 | 22 | 0.3317 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p698-0001 0.15 s (timeline) · p698-0002 0.15 s (timeline) · p698-0003 0.15 s (timeline) · p698-0004 0.15 s (timeline) · p698-0005 0.15 s (timeline) · p698-0006 0.15 s (timeline) · p698-0007 0.15 s (timeline) · p698-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1495&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s698-bc23ab80/ai_flow_live.html?bench=1495&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1495`); it opens the seed that parts earliest, and the dropdowns choose another.

