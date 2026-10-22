# Benchmark run #1278 · 100 seeds from `gap-hold-fh-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1`
- work/gap-holding-20261022 @ 4d53487 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39844910238) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 180.525 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.1% (p 0.1548)**

- Under 0.05 only: regroups.entries 461 to 405 (-12.1%, p 0.0422).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.966 (gate 1.25)
- the 100 changed records first part at simulated second: min 155.1, p10 162, median 180.525, p90 214.05, max 238.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5391 | 5280 | -1.11 | 97 | 41 | 56 | 0.1548 |
| `usKills` | 2461 | 2510 | 0.49 | 98 | 51 | 47 | 0.762 |
| `geKills` | 2930 | 2770 | -1.6 | 97 | 41 | 56 | 0.1548 |
| `fire.total` | 26053 | 25871 | -1.82 | 100 | 50 | 50 | 1 |
| `fire.hits` | 10406 | 10201 | -2.05 | 99 | 47 | 52 | 0.6879 |
| `retreatSamples` | 137880 | 138587 | 7.07 | 100 | 44 | 56 | 0.2713 |
| `movementResolver.changes` | 326603 | 324003 | -26 | 100 | 46 | 54 | 0.4841 |
| `grenades.throws` | 32 | 23 | -0.09 | 16 | 4 | 12 | 0.0768 |
| `grenades.bursts` | 32 | 23 | -0.09 | 16 | 4 | 12 | 0.0768 |
| `grenades.wounded` | 22 | 21 | -0.01 | 11 | 4 | 7 | 0.5488 |
| `grenades.casualties` | 8 | 6 | -0.02 | 11 | 5 | 6 | 1 |
| `grenades.suppressed` | 55 | 41 | -0.14 | 14 | 4 | 10 | 0.1796 |
| `grenades.friendlyWounded` | 3 | 11 | 0.08 | 6 | 3 | 3 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.aborted` | 0 | 3 | 0.03 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 3 | 3 | 0 | 3 | 1 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 507 | 561 | 0.54 | 93 | 54 | 39 | 0.1462 |
| `loopAlerts.length` | 721 | 687 | -0.34 | 90 | 41 | 49 | 0.4608 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 461 | 405 | -0.56 | 88 | 34 | 54 | 0.0422 |
| `stallOutcomes.wakes` | 13 | 7 | -0.06 | 15 | 5 | 10 | 0.3018 |
| `stallOutcomes.repeats` | 4 | 4 | 0 | 6 | 3 | 3 | 1 |
| `timeline.stalledOnsets` | 4 | 3 | -0.01 | 3 | 1 | 2 | 1 |
| `timeline.stalledSamples` | 342 | 55 | -2.87 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 3 | -0.01 | 3 | 1 | 2 | 1 |
| `timeline.stalledSamplesRepeated` | 342 | 55 | -2.87 | 3 | 1 | 2 | 1 |
| `recon.orders` | 3138 | 3103 | -0.35 | 92 | 42 | 50 | 0.4657 |
| `recon.contacts` | 139 | 135 | -0.04 | 65 | 34 | 31 | 0.8043 |
| `recon.noContact` | 1973 | 1969 | -0.04 | 94 | 54 | 40 | 0.1797 |
| `recon.timeouts` | 37 | 33 | -0.04 | 36 | 17 | 19 | 0.8679 |
| `recon.cancelled` | 839 | 825 | -0.14 | 93 | 42 | 51 | 0.4069 |
| `recon.reportsDelivered` | 599 | 605 | 0.06 | 68 | 36 | 32 | 0.7163 |
| `recon.retriggerBlocked` | 2445 | 2442 | -0.03 | 93 | 48 | 45 | 0.8358 |
| `squadPerformance.meanOverall` | 8160.699999999999 | 8170.600000000001 | 0.099 | 99 | 49 | 50 | 1 |
| `squadPerformance.p10Overall` | 7507.399999999998 | 7518.100000000001 | 0.107 | 66 | 35 | 31 | 0.7122 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6742.400000000002 | 6778.399999999997 | 0.36 | 99 | 57 | 42 | 0.1591 |
| `squadPerformance.meanMovement` | 9971.499999999998 | 9973.49999999999 | 0.02 | 70 | 42 | 28 | 0.1196 |
| `squadPerformance.meanControl` | 9385 | 9394.499999999998 | 0.095 | 98 | 49 | 49 | 1 |
| `squadPerformance.meanCohesion` | 8954.799999999997 | 8932.300000000001 | -0.225 | 99 | 45 | 54 | 0.4215 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-hold-fh-20261022-0054 155.1 s (stress) · gap-hold-fh-20261022-0030 156 s (timeline) · gap-hold-fh-20261022-0097 156 s (timeline) · gap-hold-fh-20261022-0010 158.1 s (timeline) · gap-hold-fh-20261022-0029 159 s (timeline) · gap-hold-fh-20261022-0065 159 s (timeline) · gap-hold-fh-20261022-0024 160.05 s (timeline) · gap-hold-fh-20261022-0075 160.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1278&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1278&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1278`); it opens the seed that parts earliest, and the dropdowns choose another.

