# Benchmark run #1246 · 100 seeds from `rearch-e2e-20261022` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39780157107) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 305.1 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -1.5% (p 0.8323)**

- Clears the Bonferroni line (p < 0.0012): recon.reportsDelivered 887 to 554 (-37.5%, p 0.0001); recon.contacts 212 to 139 (-34.4%, p 0.0002).
- Under 0.05 only: recon.orders 1874 to 1782 (-4.9%, p 0.0097); recon.retriggerBlocked 957 to 917 (-4.2%, p 0.0186).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.057 (gate 1.25)
- the 97 changed records first part at simulated second: min 233.1, p10 254.1, median 305.1, p90 377.1, max 557.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3442 | 3390 | -0.52 | 89 | 43 | 46 | 0.8323 |
| `usKills` | 1723 | 1833 | 1.1 | 84 | 48 | 36 | 0.2299 |
| `geKills` | 1719 | 1557 | -1.62 | 82 | 33 | 49 | 0.097 |
| `fire.total` | 16539 | 15802 | -7.37 | 92 | 45 | 47 | 0.917 |
| `fire.hits` | 7114 | 7004 | -1.1 | 91 | 47 | 44 | 0.8341 |
| `retreatSamples` | 94222 | 96582 | 23.6 | 89 | 49 | 40 | 0.3966 |
| `movementResolver.changes` | 135850 | 134007 | -18.43 | 96 | 47 | 49 | 0.9188 |
| `grenades.throws` | 21 | 24 | 0.03 | 4 | 2 | 2 | 1 |
| `grenades.bursts` | 20 | 24 | 0.04 | 4 | 2 | 2 | 1 |
| `grenades.wounded` | 38 | 38 | 0 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 13 | 11 | -0.02 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 86 | 70 | -0.16 | 5 | 1 | 4 | 0.375 |
| `grenades.friendlyWounded` | 3 | 5 | 0.02 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 33 | 40 | 0.07 | 15 | 7 | 8 | 1 |
| `routeStalls.length` | 147 | 146 | -0.01 | 16 | 8 | 8 | 1 |
| `targetlessStalls.length` | 10 | 6 | -0.04 | 6 | 1 | 5 | 0.2188 |
| `vacantObjectiveStalls.length` | 323 | 321 | -0.02 | 55 | 26 | 29 | 0.7877 |
| `loopAlerts.length` | 897 | 950 | 0.53 | 81 | 45 | 36 | 0.3742 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 136 | 147 | 0.11 | 59 | 32 | 27 | 0.6029 |
| `stallOutcomes.wakes` | 3 | 4 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 4 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 46 | 49 | 0.03 | 17 | 7 | 10 | 0.6291 |
| `timeline.stalledSamples` | 189 | 1130 | 9.41 | 18 | 8 | 10 | 0.8145 |
| `timeline.stalledOnsetsRepeated` | 46 | 49 | 0.03 | 17 | 7 | 10 | 0.6291 |
| `timeline.stalledSamplesRepeated` | 189 | 1130 | 9.41 | 18 | 8 | 10 | 0.8145 |
| `recon.orders` | 1874 | 1782 | -0.92 | 87 | 31 | 56 | 0.0097 |
| `recon.contacts` | 212 | 139 | -0.73 | 57 | 14 | 43 | 0.0002 |
| `recon.noContact` | 396 | 388 | -0.08 | 66 | 29 | 37 | 0.3891 |
| `recon.timeouts` | 510 | 517 | 0.07 | 34 | 18 | 16 | 0.8642 |
| `recon.cancelled` | 645 | 620 | -0.25 | 72 | 29 | 43 | 0.1249 |
| `recon.reportsDelivered` | 887 | 554 | -3.33 | 60 | 15 | 45 | 0.0001 |
| `recon.retriggerBlocked` | 957 | 917 | -0.4 | 73 | 26 | 47 | 0.0186 |
| `squadPerformance.meanOverall` | 8544.199999999999 | 8519.899999999998 | -0.243 | 92 | 43 | 49 | 0.6024 |
| `squadPerformance.p10Overall` | 7511.000000000003 | 7462.100000000001 | -0.489 | 65 | 25 | 40 | 0.0817 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 7084.799999999999 | 7046.2 | -0.386 | 88 | 42 | 46 | 0.7493 |
| `squadPerformance.meanMovement` | 9797.800000000005 | 9797.099999999999 | -0.007 | 80 | 42 | 38 | 0.7376 |
| `squadPerformance.meanControl` | 9559.4 | 9536.800000000007 | -0.226 | 87 | 44 | 43 | 1 |
| `squadPerformance.meanCohesion` | 9678.900000000001 | 9696.500000000004 | 0.176 | 83 | 48 | 35 | 0.1875 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-e2e-20261022-0076 233.1 s (timeline) · rearch-e2e-20261022-0029 236.1 s (timeline) · rearch-e2e-20261022-0002 238.05 s (timeline) · rearch-e2e-20261022-0044 241.05 s (timeline) · rearch-e2e-20261022-0055 244.05 s (timeline) · rearch-e2e-20261022-0013 246 s (timeline) · rearch-e2e-20261022-0095 247.05 s (timeline) · rearch-e2e-20261022-0026 248.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1246&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1246&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1246`); it opens the seed that parts earliest, and the dropdowns choose another.

