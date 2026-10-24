# Benchmark run #1302 · 100 seeds from `point-20261024-a` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&suppressPoint=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1`
- work/suppressor-lock-20261024 @ 754b42f · [run](https://github.com/APPARANYX/grasstex/actions/runs/40106172256) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 182.1 s); 8 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -0.8% (p 0.4797)**

- Clears the Bonferroni line (p < 0.0012): fire.total 40351 to 48497 (+20.2%, p 0).
- Under 0.05 only: retreatSamples 143105 to 164022 (+14.6%, p 0.0035); squadPerformance.meanMission 6582.8 to 6408.500000000004 (-2.6%, p 0.021); squadPerformance.meanOverall 8139.899999999999 to 8096.5 (-0.5%, p 0.0315); grenades.throws 51 to 21 (-58.8%, p 0.0352); grenades.bursts 51 to 20 (-60.8%, p 0.0352); grenades.wounded 54 to 18 (-66.7%, p 0.0386); grenades.suppressed 121 to 56 (-53.7%, p 0.0386).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.959 (gate 1.25)
- the 100 changed records first part at simulated second: min 138, p10 154.05, median 182.1, p90 230.1, max 337.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4816 | 4779 | -0.37 | 98 | 45 | 53 | 0.4797 |
| `usKills` | 2195 | 2247 | 0.52 | 97 | 52 | 45 | 0.5426 |
| `geKills` | 2621 | 2532 | -0.89 | 95 | 40 | 55 | 0.1505 |
| `fire.total` | 40351 | 48497 | 81.46 | 100 | 72 | 28 | 0 |
| `fire.hits` | 9337 | 9367 | 0.3 | 99 | 49 | 50 | 1 |
| `retreatSamples` | 143105 | 164022 | 209.17 | 100 | 65 | 35 | 0.0035 |
| `movementResolver.changes` | 313982 | 316447 | 24.65 | 100 | 56 | 44 | 0.2713 |
| `grenades.throws` | 51 | 21 | -0.3 | 15 | 3 | 12 | 0.0352 |
| `grenades.bursts` | 51 | 20 | -0.31 | 15 | 3 | 12 | 0.0352 |
| `grenades.wounded` | 54 | 18 | -0.36 | 12 | 2 | 10 | 0.0386 |
| `grenades.casualties` | 14 | 6 | -0.08 | 7 | 2 | 5 | 0.4531 |
| `grenades.suppressed` | 121 | 56 | -0.65 | 12 | 2 | 10 | 0.0386 |
| `grenades.friendlyWounded` | 5 | 1 | -0.04 | 3 | 0 | 3 | 0.25 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 4 | 2 | 2 | 1 |
| `movementStalls.length` | 1 | 2 | 0.01 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 498 | 496 | -0.02 | 92 | 50 | 42 | 0.4657 |
| `loopAlerts.length` | 871 | 910 | 0.39 | 90 | 46 | 44 | 0.9161 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 397 | 383 | -0.14 | 84 | 46 | 38 | 0.4452 |
| `stallOutcomes.wakes` | 4 | 3 | -0.01 | 7 | 3 | 4 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 1 | 2 | 0.01 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 7 | 15 | 0.08 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 2 | 0.01 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 7 | 15 | 0.08 | 2 | 1 | 1 | 1 |
| `recon.orders` | 3037 | 2900 | -1.37 | 88 | 41 | 47 | 0.5943 |
| `recon.contacts` | 129 | 128 | -0.01 | 66 | 33 | 33 | 1 |
| `recon.noContact` | 1961 | 1901 | -0.6 | 88 | 40 | 48 | 0.4557 |
| `recon.timeouts` | 35 | 29 | -0.06 | 26 | 11 | 15 | 0.5572 |
| `recon.cancelled` | 762 | 692 | -0.7 | 84 | 35 | 49 | 0.1557 |
| `recon.reportsDelivered` | 603 | 601 | -0.02 | 66 | 33 | 33 | 1 |
| `recon.retriggerBlocked` | 2384 | 2287 | -0.97 | 86 | 37 | 49 | 0.2354 |
| `squadPerformance.meanOverall` | 8139.899999999999 | 8096.5 | -0.434 | 96 | 37 | 59 | 0.0315 |
| `squadPerformance.p10Overall` | 7500.799999999998 | 7484.800000000002 | -0.16 | 53 | 21 | 32 | 0.169 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6582.8 | 6408.500000000004 | -1.743 | 100 | 38 | 62 | 0.021 |
| `squadPerformance.meanMovement` | 9973.099999999997 | 9974.3 | 0.012 | 65 | 36 | 29 | 0.457 |
| `squadPerformance.meanControl` | 9371.499999999996 | 9403.099999999999 | 0.316 | 98 | 54 | 44 | 0.3634 |
| `squadPerformance.meanCohesion` | 9014.899999999998 | 9090.499999999998 | 0.756 | 98 | 58 | 40 | 0.0854 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

point-20261024-a-0036 138 s (timeline) · point-20261024-a-0045 139.05 s (timeline) · point-20261024-a-0017 147 s (timeline) · point-20261024-a-0048 147 s (timeline) · point-20261024-a-0095 147 s (timeline) · point-20261024-a-0059 148.05 s (stress) · point-20261024-a-0063 151.05 s (timeline) · point-20261024-a-0080 152.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1302&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/suppressor-lock-20261024/ai_flow_live.html?bench=1302&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1302`); it opens the seed that parts earliest, and the dropdowns choose another.

