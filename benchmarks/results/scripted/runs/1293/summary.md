# Benchmark run #1293 · 100 seeds from `first-20261024-m` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&firstSupporter=1`
- work/first-supporter-20261024 @ 32455eb · [run](https://github.com/APPARANYX/grasstex/actions/runs/40061903172) · build v29-dev

## Verdict

**QUIET: 99 of 100 pairs changed (median first part 252 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.2% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.011 (gate 1.25)
- the 75 changed records first part at simulated second: min 166.05, p10 184.05, median 252, p90 332.1, max 449.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5140 | 5148 | 0.08 | 65 | 33 | 32 | 1 |
| `usKills` | 2440 | 2497 | 0.57 | 58 | 34 | 24 | 0.237 |
| `geKills` | 2700 | 2651 | -0.49 | 58 | 28 | 30 | 0.8957 |
| `fire.total` | 24335 | 23970 | -3.65 | 66 | 29 | 37 | 0.3891 |
| `fire.hits` | 9820 | 9873 | 0.53 | 63 | 33 | 30 | 0.8013 |
| `retreatSamples` | 128340 | 130383 | 20.43 | 67 | 39 | 28 | 0.2215 |
| `movementResolver.changes` | 322329 | 322182 | -1.47 | 74 | 39 | 35 | 0.7275 |
| `grenades.throws` | 43 | 44 | 0.01 | 10 | 5 | 5 | 1 |
| `grenades.bursts` | 42 | 43 | 0.01 | 10 | 5 | 5 | 1 |
| `grenades.wounded` | 49 | 45 | -0.04 | 7 | 3 | 4 | 1 |
| `grenades.casualties` | 20 | 21 | 0.01 | 7 | 3 | 4 | 1 |
| `grenades.suppressed` | 105 | 104 | -0.01 | 9 | 5 | 4 | 1 |
| `grenades.friendlyWounded` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 508 | 479 | -0.29 | 56 | 25 | 31 | 0.5044 |
| `loopAlerts.length` | 740 | 684 | -0.56 | 60 | 28 | 32 | 0.6989 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 434 | 442 | 0.08 | 54 | 30 | 24 | 0.4966 |
| `stallOutcomes.wakes` | 5 | 7 | 0.02 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 3 | 6 | 0.03 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3130 | 3130 | 0 | 63 | 30 | 33 | 0.8013 |
| `recon.contacts` | 156 | 159 | 0.03 | 32 | 18 | 14 | 0.5966 |
| `recon.noContact` | 1979 | 1979 | 0 | 63 | 31 | 32 | 1 |
| `recon.timeouts` | 29 | 31 | 0.02 | 13 | 8 | 5 | 0.5811 |
| `recon.cancelled` | 827 | 833 | 0.06 | 57 | 33 | 24 | 0.2892 |
| `recon.reportsDelivered` | 731 | 765 | 0.34 | 35 | 18 | 17 | 1 |
| `recon.retriggerBlocked` | 2467 | 2491 | 0.24 | 60 | 34 | 26 | 0.3663 |
| `squadPerformance.meanOverall` | 8171.499999999996 | 8171.699999999998 | 0.002 | 66 | 29 | 37 | 0.3891 |
| `squadPerformance.p10Overall` | 7502.700000000003 | 7506.800000000004 | 0.041 | 35 | 18 | 17 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6781.900000000002 | 6764.400000000002 | -0.175 | 68 | 26 | 42 | 0.0681 |
| `squadPerformance.meanMovement` | 9975.7 | 9975.1 | -0.006 | 35 | 15 | 20 | 0.4996 |
| `squadPerformance.meanControl` | 9364.699999999999 | 9376.499999999996 | 0.118 | 65 | 36 | 29 | 0.457 |
| `squadPerformance.meanCohesion` | 8947.500000000002 | 8942.1 | -0.054 | 68 | 32 | 36 | 0.7163 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

first-20261024-m-0017 166.05 s (timeline) · first-20261024-m-0053 166.05 s (timeline) · first-20261024-m-0034 167.1 s (timeline) · first-20261024-m-0100 169.05 s (timeline) · first-20261024-m-0059 177 s (timeline) · first-20261024-m-0097 182.1 s (timeline) · first-20261024-m-0070 183 s (timeline) · first-20261024-m-0054 184.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1293&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/first-supporter-20261024/ai_flow_live.html?bench=1293&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1293`); it opens the seed that parts earliest, and the dropdowns choose another.

