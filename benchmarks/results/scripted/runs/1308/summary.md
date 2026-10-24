# Benchmark run #1308 · 100 seeds from `tg-20261024-a` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&talkingGuns=1`
- work/talking-guns-20261024 @ e91fa6d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40116007699) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 201.075 s); 1 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +6.3% (p 0.0642)**

- Clears the Bonferroni line (p < 0.0012): fire.total 54115 to 47933 (-11.4%, p 0.0002).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.971 (gate 1.25)
- the 100 changed records first part at simulated second: min 137.1, p10 170.1, median 201.075, p90 254.1, max 296.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4767 | 5067 | 3 | 95 | 57 | 38 | 0.0642 |
| `usKills` | 2229 | 2336 | 1.07 | 96 | 50 | 46 | 0.7596 |
| `geKills` | 2538 | 2731 | 1.93 | 94 | 51 | 43 | 0.4705 |
| `fire.total` | 54115 | 47933 | -61.82 | 98 | 30 | 68 | 0.0002 |
| `fire.hits` | 9337 | 9772 | 4.35 | 98 | 57 | 41 | 0.1293 |
| `retreatSamples` | 187114 | 187345 | 2.31 | 99 | 45 | 54 | 0.4215 |
| `movementResolver.changes` | 328649 | 330016 | 13.67 | 100 | 49 | 51 | 0.9204 |
| `grenades.throws` | 14 | 8 | -0.06 | 8 | 2 | 6 | 0.2891 |
| `grenades.bursts` | 14 | 8 | -0.06 | 8 | 2 | 6 | 0.2891 |
| `grenades.wounded` | 14 | 7 | -0.07 | 5 | 2 | 3 | 1 |
| `grenades.casualties` | 5 | 3 | -0.02 | 3 | 1 | 2 | 1 |
| `grenades.suppressed` | 32 | 12 | -0.2 | 6 | 2 | 4 | 0.6875 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 511 | 542 | 0.31 | 88 | 52 | 36 | 0.1093 |
| `loopAlerts.length` | 1012 | 1001 | -0.11 | 92 | 47 | 45 | 0.917 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 399 | 403 | 0.04 | 82 | 39 | 43 | 0.7407 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 16 | 8 | 8 | 1 |
| `stallOutcomes.repeats` | 0 | 2 | 0.02 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 3 | 2 | -0.01 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 3 | 2 | -0.01 | 2 | 1 | 1 | 1 |
| `recon.orders` | 3085 | 2929 | -1.56 | 95 | 42 | 53 | 0.3049 |
| `recon.contacts` | 138 | 131 | -0.07 | 54 | 27 | 27 | 1 |
| `recon.noContact` | 1958 | 1878 | -0.8 | 90 | 40 | 50 | 0.3428 |
| `recon.timeouts` | 17 | 25 | 0.08 | 26 | 16 | 10 | 0.3269 |
| `recon.cancelled` | 816 | 773 | -0.43 | 92 | 40 | 52 | 0.2513 |
| `recon.reportsDelivered` | 586 | 509 | -0.77 | 61 | 27 | 34 | 0.4426 |
| `recon.retriggerBlocked` | 2423 | 2330 | -0.93 | 94 | 44 | 50 | 0.6063 |
| `squadPerformance.meanOverall` | 8062.199999999996 | 8070.599999999999 | 0.084 | 97 | 46 | 51 | 0.6849 |
| `squadPerformance.p10Overall` | 7467.3 | 7458.600000000002 | -0.087 | 45 | 22 | 23 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6267.799999999999 | 6333.9 | 0.661 | 96 | 53 | 43 | 0.3584 |
| `squadPerformance.meanMovement` | 9974.699999999992 | 9973.7 | -0.01 | 69 | 29 | 40 | 0.2284 |
| `squadPerformance.meanControl` | 9427.800000000003 | 9408.000000000004 | -0.198 | 98 | 46 | 52 | 0.6137 |
| `squadPerformance.meanCohesion` | 9122.4 | 9110.799999999997 | -0.116 | 100 | 46 | 54 | 0.4841 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

tg-20261024-a-0012 137.1 s (timeline) · tg-20261024-a-0075 161.1 s (timeline) · tg-20261024-a-0033 162 s (stress) · tg-20261024-a-0038 164.1 s (stress) · tg-20261024-a-0017 167.1 s (stress) · tg-20261024-a-0007 168 s (timeline) · tg-20261024-a-0064 168 s (stress) · tg-20261024-a-0040 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1308&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/talking-guns-20261024/ai_flow_live.html?bench=1308&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1308`); it opens the seed that parts earliest, and the dropdowns choose another.

