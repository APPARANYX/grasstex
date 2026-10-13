# Benchmark run #773 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 5a73d95 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38336496848) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 150 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties +23.1% (p 0.1338)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 446 to 349 (-21.7%, p 0); recon.contacts 50 to 16 (-68.0%, p 0.0003).
- Under 0.05 only: recon.reportsDelivered 240 to 89 (-62.9%, p 0.0013); usKills 150 to 364 (+142.7%, p 0.0072); recon.noContact 224 to 210 (-6.3%, p 0.0386).
- Unpaired records: off 0, on 3 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 3) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.095 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 668 | 822 | 7 | 22 | 15 | 7 | 0.1338 |
| `usKills` | 150 | 364 | 9.7273 | 21 | 17 | 4 | 0.0072 |
| `geKills` | 518 | 458 | -2.7273 | 22 | 8 | 14 | 0.2863 |
| `fire.total` | 857 | 959 | 4.6364 | 21 | 13 | 8 | 0.3833 |
| `fire.hits` | 281 | 331 | 2.2727 | 21 | 15 | 6 | 0.0784 |
| `retreatSamples` | 5050 | 6210 | 52.7273 | 20 | 14 | 6 | 0.1153 |
| `movementResolver.changes` | 41924 | 40801 | -51.0455 | 22 | 12 | 10 | 0.8318 |
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
| `vacantObjectiveStalls.length` | 9 | 5 | -0.1818 | 7 | 3 | 4 | 1 |
| `loopAlerts.length` | 10 | 23 | 0.5909 | 11 | 6 | 5 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 21 | -0.0909 | 11 | 5 | 6 | 1 |
| `stallOutcomes.wakes` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 349 | -4.4091 | 21 | 1 | 20 | 0 |
| `recon.contacts` | 50 | 16 | -1.5455 | 17 | 1 | 16 | 0.0003 |
| `recon.noContact` | 224 | 210 | -0.6364 | 12 | 2 | 10 | 0.0386 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 138 | 100 | -1.7273 | 20 | 9 | 11 | 0.8238 |
| `recon.reportsDelivered` | 240 | 89 | -6.8636 | 18 | 2 | 16 | 0.0013 |
| `recon.retriggerBlocked` | 239 | 223 | -0.7273 | 14 | 4 | 10 | 0.1796 |
| `squadPerformance.meanOverall` | 1933.5 | 1921.3000000000002 | -0.5545 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.p10Overall` | 1779.9 | 1772.4999999999995 | -0.3364 | 17 | 7 | 10 | 0.6291 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.4000000000003 | 1566 | -2.7 | 21 | 7 | 14 | 0.1892 |
| `squadPerformance.meanMovement` | 2185.7 | 2187.3 | 0.0727 | 18 | 9 | 9 | 1 |
| `squadPerformance.meanControl` | 2190.7 | 2189.7000000000003 | -0.0455 | 17 | 11 | 6 | 0.3323 |
| `squadPerformance.meanCohesion` | 1976.4000000000003 | 2035.1000000000001 | 2.6682 | 22 | 14 | 8 | 0.2863 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=773&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=773&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=773`); it opens the seed that parts earliest, and the dropdowns choose another.

