# Benchmark run #1254 · 100 seeds from `sector-memory-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 91ca910 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39806353464) · build v29-dev

## Verdict

**WEAK: 62 of 100 pairs changed (median first part 345.075 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.2% (p 1)**

- Under 0.05 only: recon.cancelled 779 to 797 (+2.3%, p 0.0156).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **38** · runtime errors off 0 / on 0 · wall time on/off x0.999 (gate 1.25)
- the 12 changed records first part at simulated second: min 210, p10 228, median 345.075, p90 492, max 525

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5287 | 5297 | 0.1 | 10 | 5 | 5 | 1 |
| `usKills` | 2611 | 2611 | 0 | 10 | 5 | 5 | 1 |
| `geKills` | 2676 | 2686 | 0.1 | 8 | 4 | 4 | 1 |
| `fire.total` | 25383 | 25449 | 0.66 | 12 | 5 | 7 | 0.7744 |
| `fire.hits` | 10224 | 10219 | -0.05 | 12 | 5 | 7 | 0.7744 |
| `retreatSamples` | 136521 | 135874 | -6.47 | 11 | 4 | 7 | 0.5488 |
| `movementResolver.changes` | 330176 | 329227 | -9.49 | 12 | 5 | 7 | 0.7744 |
| `grenades.throws` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 504 | 509 | 0.05 | 8 | 5 | 3 | 0.7266 |
| `loopAlerts.length` | 735 | 729 | -0.06 | 6 | 2 | 4 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 404 | 394 | -0.1 | 5 | 1 | 4 | 0.375 |
| `stallOutcomes.wakes` | 9 | 10 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 177 | 177 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 177 | 177 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2977 | 2998 | 0.21 | 9 | 6 | 3 | 0.5078 |
| `recon.contacts` | 133 | 133 | 0 | 5 | 3 | 2 | 1 |
| `recon.noContact` | 1916 | 1913 | -0.03 | 8 | 3 | 5 | 0.7266 |
| `recon.timeouts` | 31 | 29 | -0.02 | 2 | 0 | 2 | 0.5 |
| `recon.cancelled` | 779 | 797 | 0.18 | 7 | 7 | 0 | 0.0156 |
| `recon.reportsDelivered` | 603 | 597 | -0.06 | 3 | 2 | 1 | 1 |
| `recon.retriggerBlocked` | 2367 | 2370 | 0.03 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanOverall` | 8174.9 | 8177.599999999999 | 0.027 | 11 | 7 | 4 | 0.5488 |
| `squadPerformance.p10Overall` | 7519.500000000003 | 7521.300000000003 | 0.018 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6788.599999999998 | 6789.299999999998 | 0.007 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.meanMovement` | 9972.200000000003 | 9971.7 | -0.005 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanControl` | 9398.1 | 9395.2 | -0.029 | 10 | 5 | 5 | 1 |
| `squadPerformance.meanCohesion` | 8973.7 | 8981 | 0.073 | 11 | 8 | 3 | 0.2266 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-memory-20261022-0059 210 s (timeline) · sector-memory-20261022-0015 228 s (timeline) · sector-memory-20261022-0042 264 s (timeline) · sector-memory-20261022-0083 288 s (timeline) · sector-memory-20261022-0030 334.05 s (timeline) · sector-memory-20261022-0016 342 s (timeline) · sector-memory-20261022-0053 348.15 s (timeline) · sector-memory-20261022-0060 354 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1254&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1254&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1254`); it opens the seed that parts earliest, and the dropdowns choose another.

