# Benchmark run #749 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 97c0f56 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38329858181) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 150 s); 1 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +6.0% (p 0.4807)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 446 to 382 (-14.3%, p 0.0004).
- Unpaired records: off 0, on 3 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 3) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.137 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 668 | 708 | 1.8182 | 18 | 11 | 7 | 0.4807 |
| `usKills` | 150 | 252 | 4.6364 | 19 | 14 | 5 | 0.0636 |
| `geKills` | 518 | 456 | -2.8182 | 20 | 7 | 13 | 0.2632 |
| `fire.total` | 857 | 662 | -8.8636 | 20 | 7 | 13 | 0.2632 |
| `fire.hits` | 281 | 258 | -1.0455 | 20 | 12 | 8 | 0.5034 |
| `retreatSamples` | 5050 | 5513 | 21.0455 | 22 | 15 | 7 | 0.1338 |
| `movementResolver.changes` | 41924 | 42753 | 37.6818 | 22 | 15 | 7 | 0.1338 |
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
| `vacantObjectiveStalls.length` | 9 | 5 | -0.1818 | 4 | 1 | 3 | 0.625 |
| `loopAlerts.length` | 10 | 22 | 0.5455 | 11 | 5 | 6 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 17 | -0.2727 | 8 | 2 | 6 | 0.2891 |
| `stallOutcomes.wakes` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 382 | -2.9091 | 20 | 2 | 18 | 0.0004 |
| `recon.contacts` | 50 | 73 | 1.0455 | 17 | 12 | 5 | 0.1435 |
| `recon.noContact` | 224 | 224 | 0 | 9 | 4 | 5 | 1 |
| `recon.timeouts` | 14 | 15 | 0.0455 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 138 | 56 | -3.7273 | 21 | 6 | 15 | 0.0784 |
| `recon.reportsDelivered` | 240 | 305 | 2.9545 | 18 | 13 | 5 | 0.0963 |
| `recon.retriggerBlocked` | 239 | 245 | 0.2727 | 15 | 8 | 7 | 1 |
| `squadPerformance.meanOverall` | 1933.5 | 1917.5000000000005 | -0.7273 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.p10Overall` | 1779.9 | 1750.5999999999995 | -1.3318 | 14 | 5 | 9 | 0.424 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.4000000000003 | 1593.2 | -1.4636 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.meanMovement` | 2185.7 | 2191.2000000000007 | 0.25 | 18 | 9 | 9 | 1 |
| `squadPerformance.meanControl` | 2190.7 | 2189.2000000000003 | -0.0682 | 17 | 10 | 7 | 0.6291 |
| `squadPerformance.meanCohesion` | 1976.4000000000003 | 1948.8000000000002 | -1.2545 | 22 | 10 | 12 | 0.8318 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=749&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=749&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=749`); it opens the seed that parts earliest, and the dropdowns choose another.

