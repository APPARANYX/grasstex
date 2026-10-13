# Benchmark run #822 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ 1113979 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38384960186) · build v29-dev

## Verdict

**WEAK: 21 of 21 pairs changed (median first part 150 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties -6.9% (p 1)**

- Under 0.05 only: geKills 488 to 387 (-20.7%, p 0.0072); recon.noContact 211 to 196 (-7.1%, p 0.0215); recon.orders 411 to 339 (-17.5%, p 0.0309); recon.retriggerBlocked 223 to 194 (-13.0%, p 0.0386).
- Unpaired records: off 1, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **21** pairs (unpaired: off 1, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.139 (gate 1.25)
- the 21 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 156, max 156

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 636 | 592 | -2.0952 | 21 | 11 | 10 | 1 |
| `usKills` | 148 | 205 | 2.7143 | 18 | 12 | 6 | 0.2379 |
| `geKills` | 488 | 387 | -4.8095 | 21 | 4 | 17 | 0.0072 |
| `fire.total` | 842 | 943 | 4.8095 | 21 | 9 | 12 | 0.6636 |
| `fire.hits` | 280 | 254 | -1.2381 | 18 | 9 | 9 | 1 |
| `retreatSamples` | 4879 | 5124 | 11.6667 | 20 | 11 | 9 | 0.8238 |
| `movementResolver.changes` | 39375 | 39745 | 17.619 | 21 | 11 | 10 | 1 |
| `grenades.throws` | 1 | 0 | -0.0476 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0476 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 5 | 0 | -0.2381 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 3 | 0 | -0.1429 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 8 | 0 | -0.381 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 15 | 0.2857 | 7 | 5 | 2 | 0.4531 |
| `loopAlerts.length` | 10 | 20 | 0.4762 | 13 | 6 | 7 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 20 | 20 | 0 | 10 | 6 | 4 | 0.7539 |
| `stallOutcomes.wakes` | 3 | 4 | 0.0476 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1429 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 411 | 339 | -3.4286 | 18 | 4 | 14 | 0.0309 |
| `recon.contacts` | 44 | 44 | 0 | 14 | 7 | 7 | 1 |
| `recon.noContact` | 211 | 196 | -0.7143 | 10 | 1 | 9 | 0.0215 |
| `recon.timeouts` | 14 | 16 | 0.0952 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 125 | 71 | -2.5714 | 18 | 5 | 13 | 0.0963 |
| `recon.reportsDelivered` | 218 | 234 | 0.7619 | 18 | 12 | 6 | 0.2379 |
| `recon.retriggerBlocked` | 223 | 194 | -1.381 | 12 | 2 | 10 | 0.0386 |
| `squadPerformance.meanOverall` | 1843.1 | 1834.3 | -0.419 | 21 | 8 | 13 | 0.3833 |
| `squadPerformance.p10Overall` | 1699.3000000000002 | 1673.2999999999993 | -1.2381 | 18 | 7 | 11 | 0.4807 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1543.6000000000001 | 1523.7000000000003 | -0.9476 | 21 | 11 | 10 | 1 |
| `squadPerformance.meanMovement` | 2086.5 | 2087.3999999999996 | 0.0429 | 15 | 8 | 7 | 1 |
| `squadPerformance.meanControl` | 2091.5999999999995 | 2085.4 | -0.2952 | 18 | 11 | 7 | 0.4807 |
| `squadPerformance.meanCohesion` | 1892.5000000000002 | 1881.9000000000003 | -0.5048 | 20 | 8 | 12 | 0.5034 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 156 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=822&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=822&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=822`); it opens the seed that parts earliest, and the dropdowns choose another.

