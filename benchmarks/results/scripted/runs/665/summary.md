# Benchmark run #665 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 5de6cf7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38271115462) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 150 s); 12 of 42 counters under p 0.05 (about 2.1 by chance), 6 under 0.0012; casualties -0.5% (p 0.8318)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 462 to 383 (-17.1%, p 0); recon.contacts 67 to 31 (-53.7%, p 0); recon.reportsDelivered 341 to 135 (-60.4%, p 0); retreatSamples 7231 to 4911 (-32.1%, p 0.0001); squadPerformance.meanMission 1565 to 1715.8999999999999 (+9.6%, p 0.0001); usKills 292 to 185 (-36.6%, p 0.0002).
- Under 0.05 only: squadPerformance.meanControl 2296.5 to 2289.7999999999997 (-0.3%, p 0.0013); recon.retriggerBlocked 273 to 234 (-14.3%, p 0.0074); recon.cancelled 102 to 79 (-22.5%, p 0.0075); recon.timeouts 25 to 14 (-44.0%, p 0.0078); squadPerformance.meanCohesion 2094.2999999999997 to 2007.9000000000003 (-4.1%, p 0.0169); loopAlerts.length 4 to 14 (+250.0%, p 0.0391).
- Unpaired records: off 2, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 2, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.038 (gate 1.25)
- the 23 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 732 | 728 | -0.1739 | 22 | 10 | 12 | 0.8318 |
| `usKills` | 292 | 185 | -4.6522 | 21 | 2 | 19 | 0.0002 |
| `geKills` | 440 | 543 | 4.4783 | 22 | 14 | 8 | 0.2863 |
| `fire.total` | 706 | 781 | 3.2609 | 21 | 11 | 10 | 1 |
| `fire.hits` | 264 | 288 | 1.0435 | 20 | 8 | 12 | 0.5034 |
| `retreatSamples` | 7231 | 4911 | -100.8696 | 23 | 2 | 21 | 0.0001 |
| `movementResolver.changes` | 42899 | 45119 | 96.5217 | 23 | 13 | 10 | 0.6776 |
| `grenades.throws` | 1 | 0 | -0.0435 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0435 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 1 | 0 | -0.0435 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 6 | 8 | 0.087 | 9 | 5 | 4 | 1 |
| `loopAlerts.length` | 4 | 14 | 0.4348 | 9 | 8 | 1 | 0.0391 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 17 | 42 | 1.087 | 10 | 8 | 2 | 0.1094 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 462 | 383 | -3.4348 | 21 | 1 | 20 | 0 |
| `recon.contacts` | 67 | 31 | -1.5652 | 18 | 0 | 18 | 0 |
| `recon.noContact` | 250 | 238 | -0.5217 | 11 | 5 | 6 | 1 |
| `recon.timeouts` | 25 | 14 | -0.4783 | 8 | 0 | 8 | 0.0078 |
| `recon.cancelled` | 102 | 79 | -1 | 18 | 3 | 15 | 0.0075 |
| `recon.reportsDelivered` | 341 | 135 | -8.9565 | 16 | 0 | 16 | 0 |
| `recon.retriggerBlocked` | 273 | 234 | -1.6957 | 15 | 2 | 13 | 0.0074 |
| `squadPerformance.meanOverall` | 1985.3000000000002 | 2013.1 | 1.2087 | 22 | 16 | 6 | 0.0525 |
| `squadPerformance.p10Overall` | 1833.2999999999995 | 1851.3999999999992 | 0.787 | 17 | 8 | 9 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1565 | 1715.8999999999999 | 6.5609 | 23 | 21 | 2 | 0.0001 |
| `squadPerformance.meanMovement` | 2291.6000000000004 | 2280 | -0.5043 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.meanControl` | 2296.5 | 2289.7999999999997 | -0.2913 | 18 | 2 | 16 | 0.0013 |
| `squadPerformance.meanCohesion` | 2094.2999999999997 | 2007.9000000000003 | -3.7565 | 22 | 5 | 17 | 0.0169 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=665&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=665&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=665`); it opens the seed that parts earliest, and the dropdowns choose another.

