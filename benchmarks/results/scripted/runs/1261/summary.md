# Benchmark run #1261 · 100 seeds from `sector-clear-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0&verifySight=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 8ed5a81 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39815572338) · build v29-dev

## Verdict

**WEAK: 81 of 100 pairs changed (median first part 232.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.4% (p 1)**

- Under 0.05 only: vacantObjectiveStalls.length 241 to 207 (-14.1%, p 0.0075).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **19** · runtime errors off 0 / on 0 · wall time on/off x1.004 (gate 1.25)
- the 25 changed records first part at simulated second: min 107.1, p10 144, median 232.05, p90 438, max 571.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4691 | 4711 | 0.2 | 22 | 11 | 11 | 1 |
| `usKills` | 2158 | 2174 | 0.16 | 20 | 12 | 8 | 0.5034 |
| `geKills` | 2533 | 2537 | 0.04 | 21 | 11 | 10 | 1 |
| `fire.total` | 22331 | 22785 | 4.54 | 25 | 16 | 9 | 0.2295 |
| `fire.hits` | 8504 | 8602 | 0.98 | 23 | 12 | 11 | 1 |
| `retreatSamples` | 151372 | 151513 | 1.41 | 23 | 12 | 11 | 1 |
| `movementResolver.changes` | 227773 | 226067 | -17.06 | 25 | 11 | 14 | 0.69 |
| `grenades.throws` | 10 | 12 | 0.02 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 10 | 12 | 0.02 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 241 | 207 | -0.34 | 18 | 3 | 15 | 0.0075 |
| `loopAlerts.length` | 530 | 531 | 0.01 | 20 | 11 | 9 | 0.8238 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 421 | 419 | -0.02 | 17 | 9 | 8 | 1 |
| `stallOutcomes.wakes` | 2 | 4 | 0.02 | 4 | 3 | 1 | 0.625 |
| `stallOutcomes.repeats` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2178 | 2167 | -0.11 | 21 | 10 | 11 | 1 |
| `recon.contacts` | 189 | 192 | 0.03 | 15 | 8 | 7 | 1 |
| `recon.noContact` | 1219 | 1207 | -0.12 | 15 | 5 | 10 | 0.3018 |
| `recon.timeouts` | 98 | 94 | -0.04 | 9 | 3 | 6 | 0.5078 |
| `recon.cancelled` | 525 | 532 | 0.07 | 21 | 13 | 8 | 0.3833 |
| `recon.reportsDelivered` | 776 | 777 | 0.01 | 14 | 5 | 9 | 0.424 |
| `recon.retriggerBlocked` | 1274 | 1259 | -0.15 | 21 | 7 | 14 | 0.1892 |
| `squadPerformance.meanOverall` | 8482.800000000001 | 8487.800000000001 | 0.05 | 24 | 14 | 10 | 0.5413 |
| `squadPerformance.p10Overall` | 7709.600000000001 | 7715.200000000002 | 0.056 | 15 | 8 | 7 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7390.499999999998 | 7399.499999999999 | 0.09 | 20 | 11 | 9 | 0.8238 |
| `squadPerformance.meanMovement` | 9985.39999999999 | 9985.19999999999 | -0.002 | 9 | 3 | 6 | 0.5078 |
| `squadPerformance.meanControl` | 9649.900000000001 | 9653.1 | 0.032 | 23 | 8 | 15 | 0.21 |
| `squadPerformance.meanCohesion` | 8977.9 | 8977.300000000001 | -0.006 | 23 | 10 | 13 | 0.6776 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-clear-20261022-0037 107.1 s (timeline) · sector-clear-20261022-0033 143.1 s (timeline) · sector-clear-20261022-0062 144 s (timeline) · sector-clear-20261022-0041 152.1 s (timeline) · sector-clear-20261022-0031 161.1 s (timeline) · sector-clear-20261022-0094 164.1 s (timeline) · sector-clear-20261022-0054 185.1 s (timeline) · sector-clear-20261022-0008 190.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1261&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1261&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1261`); it opens the seed that parts earliest, and the dropdowns choose another.

