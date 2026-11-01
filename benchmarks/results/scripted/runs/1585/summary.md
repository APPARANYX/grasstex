# Benchmark run #1585 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/controller-meso-wrap-20261101 @ 2e4086d · [run](https://github.com/APPARANYX/grasstex/actions/runs/41311948451) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 348 s); 2 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -1.9% (p 1)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 278 to 259 (-6.8%, p 0.001).
- Under 0.05 only: recon.cancelled 56 to 43 (-23.2%, p 0.0018).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.075 (gate 1.25)
- the 6 changed records first part at simulated second: min 348, p10 348, median 348, p90 565.05, max 565.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 268 | 263 | -0.2174 | 5 | 2 | 3 | 1 |
| `usKills` | 105 | 82 | -1 | 4 | 0 | 4 | 0.125 |
| `geKills` | 163 | 181 | 0.7826 | 5 | 5 | 0 | 0.0625 |
| `fire.total` | 1006 | 977 | -1.2609 | 5 | 3 | 2 | 1 |
| `fire.hits` | 167 | 161 | -0.2609 | 5 | 3 | 2 | 1 |
| `retreatSamples` | 3057 | 3027 | -1.3043 | 4 | 3 | 1 | 0.625 |
| `movementResolver.changes` | 16292 | 16279 | -0.5652 | 6 | 3 | 3 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 1 | -0.2609 | 3 | 0 | 3 | 0.25 |
| `loopAlerts.length` | 35 | 32 | -0.1304 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 8 | 9 | 0.0435 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 278 | 259 | -0.8261 | 15 | 1 | 14 | 0.001 |
| `recon.contacts` | 19 | 20 | 0.0435 | 1 | 1 | 0 | 1 |
| `recon.noContact` | 73 | 67 | -0.2609 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 81 | 80 | -0.0435 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 56 | 43 | -0.5652 | 14 | 1 | 13 | 0.0018 |
| `recon.reportsDelivered` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 109 | 100 | -0.3913 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanOverall` | 2061 | 2060.6 | -0.0174 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.p10Overall` | 1859.2999999999997 | 1859.1999999999998 | -0.0043 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1823.3999999999999 | 1819.6999999999998 | -0.1609 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanMovement` | 2232.3 | 2239.1000000000004 | 0.2957 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanControl` | 2279.2 | 2280.3 | 0.0478 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanCohesion` | 2075.9000000000005 | 2069.6000000000004 | -0.2739 | 5 | 2 | 3 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 348 s (timeline) · phase-c-natural-20261012-0003 565.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1585&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/controller-meso-wrap-20261101/ai_flow_live.html?bench=1585&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1585`); it opens the seed that parts earliest, and the dropdowns choose another.

