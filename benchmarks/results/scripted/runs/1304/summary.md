# Benchmark run #1304 · 100 seeds from `point-20261024-c` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&suppressPoint=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1`
- work/suppressor-lock-20261024 @ 754b42f · [run](https://github.com/APPARANYX/grasstex/actions/runs/40106177573) · build v29-dev

## Verdict

**WEAK: 98 of 100 pairs changed (median first part 147.525 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties -3.7% (p 0.2604)**

- Under 0.05 only: squadPerformance.meanMission 7289.499999999997 to 7135 (-2.1%, p 0.0106); recon.timeouts 132 to 103 (-22.0%, p 0.0226); retreatSamples 166441 to 187940 (+12.9%, p 0.0475); squadPerformance.meanCohesion 8861.700000000003 to 8923.300000000003 (+0.7%, p 0.0475).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x1.045 (gate 1.25)
- the 84 changed records first part at simulated second: min 83.1, p10 112.05, median 147.525, p90 195, max 503.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4356 | 4197 | -1.59 | 79 | 34 | 45 | 0.2604 |
| `usKills` | 2000 | 1896 | -1.04 | 80 | 33 | 47 | 0.1456 |
| `geKills` | 2356 | 2301 | -0.55 | 81 | 43 | 38 | 0.657 |
| `fire.total` | 33772 | 36677 | 29.05 | 84 | 50 | 34 | 0.1011 |
| `fire.hits` | 7993 | 7743 | -2.5 | 83 | 34 | 49 | 0.1239 |
| `retreatSamples` | 166441 | 187940 | 214.99 | 83 | 51 | 32 | 0.0475 |
| `movementResolver.changes` | 213233 | 219512 | 62.79 | 84 | 49 | 35 | 0.1557 |
| `grenades.throws` | 41 | 25 | -0.16 | 13 | 6 | 7 | 1 |
| `grenades.bursts` | 41 | 25 | -0.16 | 13 | 6 | 7 | 1 |
| `grenades.wounded` | 25 | 16 | -0.09 | 8 | 4 | 4 | 1 |
| `grenades.casualties` | 12 | 6 | -0.06 | 6 | 2 | 4 | 0.6875 |
| `grenades.suppressed` | 68 | 26 | -0.42 | 10 | 3 | 7 | 0.3438 |
| `grenades.friendlyWounded` | 8 | 2 | -0.06 | 5 | 1 | 4 | 0.375 |
| `grenades.friendlyCasualties` | 2 | 1 | -0.01 | 3 | 1 | 2 | 1 |
| `grenades.aborted` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 198 | 186 | -0.12 | 63 | 30 | 33 | 0.8013 |
| `loopAlerts.length` | 603 | 692 | 0.89 | 73 | 42 | 31 | 0.2416 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 400 | 383 | -0.17 | 70 | 33 | 37 | 0.7202 |
| `stallOutcomes.wakes` | 2 | 6 | 0.04 | 8 | 6 | 2 | 0.2891 |
| `stallOutcomes.repeats` | 0 | 4 | 0.04 | 4 | 4 | 0 | 0.125 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1956 | 1956 | 0 | 80 | 40 | 40 | 1 |
| `recon.contacts` | 206 | 192 | -0.14 | 58 | 27 | 31 | 0.694 |
| `recon.noContact` | 1112 | 1127 | 0.15 | 67 | 37 | 30 | 0.4638 |
| `recon.timeouts` | 132 | 103 | -0.29 | 44 | 14 | 30 | 0.0226 |
| `recon.cancelled` | 398 | 420 | 0.22 | 72 | 40 | 32 | 0.4096 |
| `recon.reportsDelivered` | 854 | 723 | -1.31 | 74 | 31 | 43 | 0.2007 |
| `recon.retriggerBlocked` | 1138 | 1150 | 0.12 | 72 | 35 | 37 | 0.9063 |
| `squadPerformance.meanOverall` | 8478 | 8434.899999999998 | -0.431 | 81 | 32 | 49 | 0.0748 |
| `squadPerformance.p10Overall` | 7771.700000000003 | 7766.500000000003 | -0.052 | 54 | 29 | 25 | 0.6835 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7289.499999999997 | 7135 | -1.545 | 82 | 29 | 53 | 0.0106 |
| `squadPerformance.meanMovement` | 9986.599999999991 | 9987.79999999999 | 0.012 | 46 | 29 | 17 | 0.1038 |
| `squadPerformance.meanControl` | 9671.299999999997 | 9672.199999999999 | 0.009 | 81 | 40 | 41 | 1 |
| `squadPerformance.meanCohesion` | 8861.700000000003 | 8923.300000000003 | 0.616 | 83 | 51 | 32 | 0.0475 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

point-20261024-c-0048 83.1 s (timeline) · point-20261024-c-0099 106.05 s (timeline) · point-20261024-c-0060 109.05 s (timeline) · point-20261024-c-0062 109.05 s (timeline) · point-20261024-c-0064 110.1 s (timeline) · point-20261024-c-0070 110.1 s (timeline) · point-20261024-c-0083 110.1 s (timeline) · point-20261024-c-0029 111 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1304&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/suppressor-lock-20261024/ai_flow_live.html?bench=1304&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1304`); it opens the seed that parts earliest, and the dropdowns choose another.

