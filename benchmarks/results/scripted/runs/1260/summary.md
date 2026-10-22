# Benchmark run #1260 · 100 seeds from `sector-clear-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0&verifySight=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 8ed5a81 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39815568168) · build v29-dev

## Verdict

**QUIET: 76 of 100 pairs changed (median first part 308.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.4% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **24** · runtime errors off 0 / on 0 · wall time on/off x0.985 (gate 1.25)
- the 23 changed records first part at simulated second: min 191.1, p10 250.05, median 308.1, p90 359.1, max 512.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5205 | 5227 | 0.22 | 15 | 7 | 8 | 1 |
| `usKills` | 2560 | 2526 | -0.34 | 15 | 5 | 10 | 0.3018 |
| `geKills` | 2645 | 2701 | 0.56 | 15 | 8 | 7 | 1 |
| `fire.total` | 24704 | 24739 | 0.35 | 18 | 8 | 10 | 0.8145 |
| `fire.hits` | 10003 | 10070 | 0.67 | 18 | 8 | 10 | 0.8145 |
| `retreatSamples` | 135005 | 135176 | 1.71 | 17 | 9 | 8 | 1 |
| `movementResolver.changes` | 321075 | 321411 | 3.36 | 23 | 13 | 10 | 0.6776 |
| `grenades.throws` | 23 | 25 | 0.02 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 23 | 25 | 0.02 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 11 | 12 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 47 | 50 | 0.03 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 527 | 516 | -0.11 | 11 | 4 | 7 | 0.5488 |
| `loopAlerts.length` | 711 | 704 | -0.07 | 16 | 8 | 8 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 437 | 434 | -0.03 | 14 | 7 | 7 | 1 |
| `stallOutcomes.wakes` | 10 | 11 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 2 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 70 | 70 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 70 | 70 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3182 | 3179 | -0.03 | 14 | 7 | 7 | 1 |
| `recon.contacts` | 146 | 150 | 0.04 | 8 | 4 | 4 | 1 |
| `recon.noContact` | 1991 | 1995 | 0.04 | 14 | 8 | 6 | 0.7905 |
| `recon.timeouts` | 37 | 36 | -0.01 | 5 | 2 | 3 | 1 |
| `recon.cancelled` | 871 | 864 | -0.07 | 15 | 5 | 10 | 0.3018 |
| `recon.reportsDelivered` | 688 | 698 | 0.1 | 8 | 4 | 4 | 1 |
| `recon.retriggerBlocked` | 2478 | 2478 | 0 | 14 | 8 | 6 | 0.7905 |
| `squadPerformance.meanOverall` | 8170.000000000002 | 8169.500000000004 | -0.005 | 16 | 6 | 10 | 0.4545 |
| `squadPerformance.p10Overall` | 7522.400000000004 | 7532.800000000006 | 0.104 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6743.0999999999985 | 6735.899999999997 | -0.072 | 16 | 5 | 11 | 0.2101 |
| `squadPerformance.meanMovement` | 9972.499999999998 | 9972.399999999998 | -0.001 | 11 | 5 | 6 | 1 |
| `squadPerformance.meanControl` | 9384.799999999997 | 9385.5 | 0.007 | 17 | 9 | 8 | 1 |
| `squadPerformance.meanCohesion` | 8940.999999999998 | 8946.499999999996 | 0.055 | 17 | 9 | 8 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-clear-20261022-0027 191.1 s (timeline) · sector-clear-20261022-0044 243 s (timeline) · sector-clear-20261022-0057 250.05 s (timeline) · sector-clear-20261022-0015 254.1 s (timeline) · sector-clear-20261022-0086 263.1 s (timeline) · sector-clear-20261022-0083 280.05 s (timeline) · sector-clear-20261022-0022 283.05 s (timeline) · sector-clear-20261022-0014 295.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1260&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1260&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1260`); it opens the seed that parts earliest, and the dropdowns choose another.

