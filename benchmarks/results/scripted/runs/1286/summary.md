# Benchmark run #1286 · 100 seeds from `gap-sup-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1`
- work/suppress-believed-20261022 @ d09a0f7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39849307523) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 147 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -3.7% (p 0.0558)**

- Clears the Bonferroni line (p < 0.0012): fire.total 24250 to 33722 (+39.1%, p 0).
- Under 0.05 only: usKills 2473 to 2233 (-9.7%, p 0.0178); squadPerformance.meanCohesion 8768.799999999994 to 8861.400000000001 (+1.1%, p 0.0334).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 91 changed records first part at simulated second: min 85.05, p10 116.1, median 147, p90 205.05, max 366

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4996 | 4810 | -1.86 | 89 | 35 | 54 | 0.0558 |
| `usKills` | 2473 | 2233 | -2.4 | 87 | 32 | 55 | 0.0178 |
| `geKills` | 2523 | 2577 | 0.54 | 85 | 52 | 33 | 0.0503 |
| `fire.total` | 24250 | 33722 | 94.72 | 90 | 82 | 8 | 0 |
| `fire.hits` | 9181 | 8838 | -3.43 | 89 | 42 | 47 | 0.6718 |
| `retreatSamples` | 157791 | 174500 | 167.09 | 89 | 52 | 37 | 0.1374 |
| `movementResolver.changes` | 228238 | 222857 | -53.81 | 90 | 42 | 48 | 0.5984 |
| `grenades.throws` | 23 | 32 | 0.09 | 20 | 10 | 10 | 1 |
| `grenades.bursts` | 23 | 32 | 0.09 | 20 | 10 | 10 | 1 |
| `grenades.wounded` | 13 | 6 | -0.07 | 8 | 4 | 4 | 1 |
| `grenades.casualties` | 4 | 5 | 0.01 | 6 | 3 | 3 | 1 |
| `grenades.suppressed` | 47 | 19 | -0.28 | 10 | 6 | 4 | 0.7539 |
| `grenades.friendlyWounded` | 9 | 0 | -0.09 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 3 | 1 | -0.02 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 262 | 251 | -0.11 | 75 | 34 | 41 | 0.4887 |
| `loopAlerts.length` | 523 | 573 | 0.5 | 84 | 44 | 40 | 0.7436 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 403 | 356 | -0.47 | 78 | 33 | 45 | 0.2127 |
| `stallOutcomes.wakes` | 10 | 7 | -0.03 | 13 | 6 | 7 | 1 |
| `stallOutcomes.repeats` | 3 | 2 | -0.01 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsets` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 24 | 3 | -0.21 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 1 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 24 | 3 | -0.21 | 1 | 0 | 1 | 1 |
| `recon.orders` | 2149 | 2078 | -0.71 | 84 | 36 | 48 | 0.2299 |
| `recon.contacts` | 219 | 203 | -0.16 | 72 | 31 | 41 | 0.2888 |
| `recon.noContact` | 1226 | 1186 | -0.4 | 81 | 37 | 44 | 0.5052 |
| `recon.timeouts` | 117 | 107 | -0.1 | 52 | 21 | 31 | 0.2116 |
| `recon.cancelled` | 503 | 494 | -0.09 | 84 | 43 | 41 | 0.9132 |
| `recon.reportsDelivered` | 886 | 754 | -1.32 | 79 | 36 | 43 | 0.4999 |
| `recon.retriggerBlocked` | 1286 | 1244 | -0.42 | 75 | 31 | 44 | 0.1654 |
| `squadPerformance.meanOverall` | 8445.2 | 8412.799999999997 | -0.324 | 88 | 39 | 49 | 0.3374 |
| `squadPerformance.p10Overall` | 7657.9 | 7647.400000000001 | -0.105 | 63 | 35 | 28 | 0.45 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7402.899999999999 | 7222.299999999997 | -1.806 | 90 | 36 | 54 | 0.0725 |
| `squadPerformance.meanMovement` | 9984.299999999996 | 9985.499999999989 | 0.012 | 45 | 22 | 23 | 1 |
| `squadPerformance.meanControl` | 9661.199999999999 | 9670.099999999999 | 0.089 | 90 | 44 | 46 | 0.9161 |
| `squadPerformance.meanCohesion` | 8768.799999999994 | 8861.400000000001 | 0.926 | 89 | 55 | 34 | 0.0334 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

gap-sup-20261022-0077 85.05 s (timeline) · gap-sup-20261022-0070 95.1 s (timeline) · gap-sup-20261022-0041 97.05 s (timeline) · gap-sup-20261022-0085 103.05 s (timeline) · gap-sup-20261022-0083 108 s (timeline) · gap-sup-20261022-0032 112.05 s (timeline) · gap-sup-20261022-0006 114 s (timeline) · gap-sup-20261022-0073 114 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1286&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/suppress-believed-20261022/ai_flow_live.html?bench=1286&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1286`); it opens the seed that parts earliest, and the dropdowns choose another.

