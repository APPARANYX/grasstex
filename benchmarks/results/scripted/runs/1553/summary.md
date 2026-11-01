# Benchmark run #1553 · 60 seeds from `c13ib` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-e761ef42 @ e761ef4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257122207) · build v29-dev

## Verdict

**WEAK: 54 of 60 pairs changed (median first part 216 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.1% (p 0.7754)**

- Under 0.05 only: recon.timeouts 35 to 43 (+22.9%, p 0.049).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.965 (gate 1.25)
- the 51 changed records first part at simulated second: min 143.1, p10 165, median 216, p90 326.1, max 397.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2017 | 1974 | -0.7167 | 49 | 23 | 26 | 0.7754 |
| `usKills` | 743 | 736 | -0.1167 | 41 | 20 | 21 | 1 |
| `geKills` | 1274 | 1238 | -0.6 | 47 | 20 | 27 | 0.3817 |
| `fire.total` | 51646 | 51758 | 1.8667 | 51 | 25 | 26 | 1 |
| `fire.hits` | 4615 | 4679 | 1.0667 | 50 | 27 | 23 | 0.6718 |
| `retreatSamples` | 127981 | 130786 | 46.75 | 51 | 32 | 19 | 0.0919 |
| `movementResolver.changes` | 172289 | 171097 | -19.8667 | 52 | 20 | 32 | 0.1263 |
| `grenades.throws` | 45 | 45 | 0 | 20 | 11 | 9 | 0.8238 |
| `grenades.bursts` | 45 | 45 | 0 | 20 | 11 | 9 | 0.8238 |
| `grenades.wounded` | 33 | 28 | -0.0833 | 8 | 4 | 4 | 1 |
| `grenades.casualties` | 9 | 7 | -0.0333 | 4 | 2 | 2 | 1 |
| `grenades.suppressed` | 118 | 78 | -0.6667 | 12 | 5 | 7 | 0.7744 |
| `grenades.friendlyWounded` | 2 | 0 | -0.0333 | 2 | 0 | 2 | 0.5 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 10 | 6 | -0.0667 | 5 | 1 | 4 | 0.375 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 55 | 63 | 0.1333 | 28 | 15 | 13 | 0.8506 |
| `loopAlerts.length` | 834 | 817 | -0.2833 | 14 | 5 | 9 | 0.424 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 183 | 220 | 0.6167 | 34 | 20 | 14 | 0.3915 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 7 | 3 | 4 | 1 |
| `stallOutcomes.repeats` | 2 | 0 | -0.0333 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2675 | 2648 | -0.45 | 48 | 20 | 28 | 0.3123 |
| `recon.contacts` | 576 | 641 | 1.0833 | 46 | 26 | 20 | 0.4614 |
| `recon.noContact` | 565 | 562 | -0.05 | 41 | 19 | 22 | 0.7552 |
| `recon.timeouts` | 35 | 43 | 0.1333 | 17 | 13 | 4 | 0.049 |
| `recon.cancelled` | 1453 | 1358 | -1.5833 | 47 | 19 | 28 | 0.243 |
| `recon.reportsDelivered` | 2375 | 2496 | 2.0167 | 48 | 19 | 29 | 0.1934 |
| `recon.retriggerBlocked` | 710 | 732 | 0.3667 | 40 | 23 | 17 | 0.4296 |
| `squadPerformance.meanOverall` | 4966.5 | 4973.300000000002 | 0.1133 | 50 | 26 | 24 | 0.8877 |
| `squadPerformance.p10Overall` | 4603.6 | 4621.000000000001 | 0.29 | 30 | 20 | 10 | 0.0987 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3969.299999999999 | 3987.400000000001 | 0.3017 | 51 | 23 | 28 | 0.5758 |
| `squadPerformance.meanMovement` | 5992.899999999998 | 5992.299999999998 | -0.01 | 23 | 9 | 14 | 0.4049 |
| `squadPerformance.meanControl` | 5739.199999999999 | 5726.499999999999 | -0.2117 | 48 | 22 | 26 | 0.6655 |
| `squadPerformance.meanCohesion` | 5561.400000000001 | 5552.6 | -0.1467 | 49 | 26 | 23 | 0.7754 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ib-0037 143.1 s (timeline) · c13ib-0015 150 s (timeline) · c13ib-0044 154.05 s (timeline) · c13ib-0009 159 s (timeline) · c13ib-0014 165 s (timeline) · c13ib-0033 165 s (timeline) · c13ib-0054 167.1 s (timeline) · c13ib-0057 167.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1553&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-e761ef42/ai_flow_live.html?bench=1553&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1553`); it opens the seed that parts earliest, and the dropdowns choose another.

