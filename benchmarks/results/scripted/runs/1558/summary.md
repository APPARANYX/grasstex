# Benchmark run #1558 · 60 seeds from `c13ic` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-057c1f7c @ 057c1f7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257345608) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 254.1 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.4% (p 0.5901)**

- Under 0.05 only: regroups.entries 327 to 355 (+8.6%, p 0.0186); grenades.suppressed 57 to 121 (+112.3%, p 0.0352); grenades.wounded 24 to 53 (+120.8%, p 0.0386).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.973 (gate 1.25)
- the 57 changed records first part at simulated second: min 182.1, p10 211.05, median 254.1, p90 321, max 401.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2485 | 2425 | -1 | 55 | 25 | 30 | 0.5901 |
| `usKills` | 1145 | 1143 | -0.0333 | 52 | 26 | 26 | 1 |
| `geKills` | 1340 | 1282 | -0.9667 | 51 | 26 | 25 | 1 |
| `fire.total` | 67326 | 65907 | -23.65 | 57 | 25 | 32 | 0.427 |
| `fire.hits` | 5565 | 5325 | -4 | 57 | 28 | 29 | 1 |
| `retreatSamples` | 129311 | 128746 | -9.4167 | 57 | 27 | 30 | 0.7914 |
| `movementResolver.changes` | 289522 | 288378 | -19.0667 | 57 | 28 | 29 | 1 |
| `grenades.throws` | 42 | 60 | 0.3 | 25 | 16 | 9 | 0.2295 |
| `grenades.bursts` | 42 | 60 | 0.3 | 25 | 16 | 9 | 0.2295 |
| `grenades.wounded` | 24 | 53 | 0.4833 | 12 | 10 | 2 | 0.0386 |
| `grenades.casualties` | 6 | 13 | 0.1167 | 5 | 4 | 1 | 0.375 |
| `grenades.suppressed` | 57 | 121 | 1.0667 | 15 | 12 | 3 | 0.0352 |
| `grenades.friendlyWounded` | 1 | 2 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 8 | 17 | 0.15 | 10 | 7 | 3 | 0.3438 |
| `movementStalls.length` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 309 | 328 | 0.3167 | 49 | 24 | 25 | 1 |
| `loopAlerts.length` | 987 | 996 | 0.15 | 19 | 11 | 8 | 0.6476 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 327 | 355 | 0.4667 | 47 | 32 | 15 | 0.0186 |
| `stallOutcomes.wakes` | 2 | 6 | 0.0667 | 5 | 4 | 1 | 0.375 |
| `stallOutcomes.repeats` | 0 | 3 | 0.05 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 12 | 0 | -0.2 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 12 | 0 | -0.2 | 1 | 0 | 1 | 1 |
| `recon.orders` | 1817 | 1924 | 1.7833 | 53 | 33 | 20 | 0.0984 |
| `recon.contacts` | 95 | 113 | 0.3 | 31 | 21 | 10 | 0.0708 |
| `recon.noContact` | 919 | 935 | 0.2667 | 45 | 26 | 19 | 0.3713 |
| `recon.timeouts` | 10 | 9 | -0.0167 | 11 | 5 | 6 | 1 |
| `recon.cancelled` | 730 | 783 | 0.8833 | 48 | 28 | 20 | 0.3123 |
| `recon.reportsDelivered` | 483 | 555 | 1.2 | 34 | 23 | 11 | 0.0576 |
| `recon.retriggerBlocked` | 1437 | 1476 | 0.65 | 51 | 29 | 22 | 0.4011 |
| `squadPerformance.meanOverall` | 4770.000000000001 | 4775.400000000002 | 0.09 | 54 | 29 | 25 | 0.6835 |
| `squadPerformance.p10Overall` | 4464.200000000001 | 4461.400000000001 | -0.0467 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3560.6000000000004 | 3580.5 | 0.3317 | 56 | 30 | 26 | 0.6889 |
| `squadPerformance.meanMovement` | 5981.800000000002 | 5979.9 | -0.0317 | 40 | 14 | 26 | 0.0807 |
| `squadPerformance.meanControl` | 5623.2 | 5612.3 | -0.1817 | 57 | 27 | 30 | 0.7914 |
| `squadPerformance.meanCohesion` | 5564.000000000001 | 5555.6 | -0.14 | 56 | 30 | 26 | 0.6889 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ic-0053 182.1 s (timeline) · c13ic-0034 196.05 s (timeline) · c13ic-0035 196.05 s (timeline) · c13ic-0021 198 s (timeline) · c13ic-0016 209.1 s (timeline) · c13ic-0049 211.05 s (timeline) · c13ic-0006 214.05 s (timeline) · c13ic-0007 214.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1558&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-057c1f7c/ai_flow_live.html?bench=1558&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1558`); it opens the seed that parts earliest, and the dropdowns choose another.

