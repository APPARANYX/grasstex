# Benchmark run #906 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ dc630f4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38422694216) · build v29-dev

## Verdict

**WEAK: 22 of 22 pairs changed (median first part 150 s); 5 of 42 counters under p 0.05 (about 2.1 by chance); casualties +5.7% (p 1)**

- Under 0.05 only: geKills 518 to 380 (-26.6%, p 0.0026); recon.noContact 224 to 198 (-11.6%, p 0.0034); recon.retriggerBlocked 239 to 205 (-14.2%, p 0.0129); usKills 150 to 326 (+117.3%, p 0.0414); squadPerformance.meanControl 2190.7 to 2187.8 (-0.1%, p 0.049).
- Unpaired records: off 0, on 3 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 3) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.135 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 156, max 156

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 668 | 706 | 1.7273 | 21 | 11 | 10 | 1 |
| `usKills` | 150 | 326 | 8 | 20 | 15 | 5 | 0.0414 |
| `geKills` | 518 | 380 | -6.2727 | 20 | 3 | 17 | 0.0026 |
| `fire.total` | 857 | 1131 | 12.4545 | 22 | 12 | 10 | 0.8318 |
| `fire.hits` | 281 | 326 | 2.0455 | 20 | 11 | 9 | 0.8238 |
| `retreatSamples` | 5050 | 4884 | -7.5455 | 21 | 9 | 12 | 0.6636 |
| `movementResolver.changes` | 41924 | 44477 | 116.0455 | 22 | 15 | 7 | 0.1338 |
| `grenades.throws` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 5 | 0 | -0.2273 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 3 | 0 | -0.1364 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 8 | 0 | -0.3636 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 7 | -0.0909 | 7 | 4 | 3 | 1 |
| `loopAlerts.length` | 10 | 15 | 0.2273 | 11 | 4 | 7 | 0.5488 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 24 | 0.0455 | 12 | 7 | 5 | 0.7744 |
| `stallOutcomes.wakes` | 3 | 4 | 0.0455 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 354 | -4.1818 | 19 | 5 | 14 | 0.0636 |
| `recon.contacts` | 50 | 55 | 0.2273 | 17 | 10 | 7 | 0.6291 |
| `recon.noContact` | 224 | 198 | -1.1818 | 13 | 1 | 12 | 0.0034 |
| `recon.timeouts` | 14 | 17 | 0.1364 | 3 | 3 | 0 | 0.25 |
| `recon.cancelled` | 138 | 75 | -2.8636 | 18 | 5 | 13 | 0.0963 |
| `recon.reportsDelivered` | 240 | 264 | 1.0909 | 18 | 12 | 6 | 0.2379 |
| `recon.retriggerBlocked` | 239 | 205 | -1.5455 | 14 | 2 | 12 | 0.0129 |
| `squadPerformance.meanOverall` | 1933.5 | 1928.0999999999997 | -0.2455 | 22 | 8 | 14 | 0.2863 |
| `squadPerformance.p10Overall` | 1779.9 | 1758.6999999999994 | -0.9636 | 19 | 6 | 13 | 0.1671 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.4000000000003 | 1637.8000000000004 | 0.5636 | 22 | 12 | 10 | 0.8318 |
| `squadPerformance.meanMovement` | 2185.7 | 2186.5 | 0.0364 | 18 | 9 | 9 | 1 |
| `squadPerformance.meanControl` | 2190.7 | 2187.8 | -0.1318 | 17 | 13 | 4 | 0.049 |
| `squadPerformance.meanCohesion` | 1976.4000000000003 | 1932.6000000000004 | -1.9909 | 21 | 7 | 14 | 0.1892 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 156 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=906&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=906&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=906`); it opens the seed that parts earliest, and the dropdowns choose another.

