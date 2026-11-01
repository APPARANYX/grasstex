# Benchmark run #1533 · 60 seeds from `p703` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerLeaderless=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/pr703-4b875e44 @ 4b875e4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256106807) · build v29-dev

## Verdict

**WEAK: 46 of 51 pairs changed (median first part 369 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.4% (p 1)**

- Under 0.05 only: fire.hits 4330 to 4292 (-0.9%, p 0.0386).

## Paired comparison (off against on)

- **51** pairs (unpaired: off 0, on 0) · identical in every field: **5** · runtime errors off 0 / on 0 · wall time on/off x0.989 (gate 1.25)
- the 14 changed records first part at simulated second: min 203.1, p10 252, median 369, p90 556.05, max 596.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1839 | 1832 | -0.1373 | 10 | 5 | 5 | 1 |
| `usKills` | 927 | 926 | -0.0196 | 7 | 4 | 3 | 1 |
| `geKills` | 912 | 906 | -0.1176 | 9 | 5 | 4 | 1 |
| `fire.total` | 50684 | 50086 | -11.7255 | 12 | 4 | 8 | 0.3877 |
| `fire.hits` | 4330 | 4292 | -0.7451 | 12 | 2 | 10 | 0.0386 |
| `retreatSamples` | 121935 | 121496 | -8.6078 | 11 | 4 | 7 | 0.5488 |
| `movementResolver.changes` | 159974 | 159689 | -5.5882 | 13 | 5 | 8 | 0.5811 |
| `grenades.throws` | 38 | 34 | -0.0784 | 3 | 0 | 3 | 0.25 |
| `grenades.bursts` | 38 | 34 | -0.0784 | 3 | 0 | 3 | 0.25 |
| `grenades.wounded` | 20 | 19 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 8 | 6 | -0.0392 | 2 | 0 | 2 | 0.5 |
| `grenades.suppressed` | 54 | 52 | -0.0392 | 2 | 0 | 2 | 0.5 |
| `grenades.friendlyWounded` | 2 | 1 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 75 | 75 | 0 | 5 | 2 | 3 | 1 |
| `loopAlerts.length` | 723 | 720 | -0.0588 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 212 | 215 | 0.0588 | 6 | 3 | 3 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2142 | 2158 | 0.3137 | 10 | 6 | 4 | 0.7539 |
| `recon.contacts` | 488 | 491 | 0.0588 | 9 | 3 | 6 | 0.5078 |
| `recon.noContact` | 581 | 582 | 0.0196 | 6 | 3 | 3 | 1 |
| `recon.timeouts` | 38 | 41 | 0.0588 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 974 | 977 | 0.0588 | 11 | 6 | 5 | 1 |
| `recon.reportsDelivered` | 1787 | 1734 | -1.0392 | 10 | 4 | 6 | 0.7539 |
| `recon.retriggerBlocked` | 617 | 624 | 0.1373 | 7 | 4 | 3 | 1 |
| `squadPerformance.meanOverall` | 4198.599999999999 | 4197.299999999999 | -0.0255 | 10 | 5 | 5 | 1 |
| `squadPerformance.p10Overall` | 3918.3999999999996 | 3916.6999999999994 | -0.0333 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3321.6000000000004 | 3324.100000000001 | 0.049 | 9 | 4 | 5 | 1 |
| `squadPerformance.meanMovement` | 5093.200000000001 | 5093.400000000001 | 0.0039 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanControl` | 4892.800000000001 | 4892.000000000002 | -0.0157 | 11 | 4 | 7 | 0.5488 |
| `squadPerformance.meanCohesion` | 4733.400000000001 | 4729.100000000001 | -0.0843 | 11 | 4 | 7 | 0.5488 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p703-0006 203.1 s (timeline) · p703-0060 252 s (timeline) · p703-0031 255 s (timeline) · p703-0058 256.05 s (stress) · p703-0048 264 s (stress) · p703-0013 358.05 s (timeline) · p703-0011 363 s (timeline) · p703-0018 375 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1533&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr703-4b875e44/ai_flow_live.html?bench=1533&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1533`); it opens the seed that parts earliest, and the dropdowns choose another.

