# Benchmark run #960 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ dc56795 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38648673479) · build v29-dev

## Verdict

**MOVED: 24 of 24 pairs changed (median first part 150 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 4 under 0.0012; casualties -2.7% (p 0.6776)**

- Clears the Bonferroni line (p < 0.0012): regroups.entries 33 to 16 (-51.5%, p 0.0002); movementResolver.changes 44962 to 42704 (-5.0%, p 0.0003); recon.cancelled 120 to 79 (-34.2%, p 0.0005); recon.timeouts 21 to 32 (+52.4%, p 0.001).
- Under 0.05 only: recon.orders 445 to 421 (-5.4%, p 0.0023); usKills 408 to 261 (-36.0%, p 0.0227); squadPerformance.meanCohesion 2052.1 to 2135.7999999999997 (+4.1%, p 0.0347).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **24** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.104 (gate 1.25)
- the 24 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 161.1, max 161.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 860 | 837 | -0.9583 | 23 | 13 | 10 | 0.6776 |
| `usKills` | 408 | 261 | -6.125 | 24 | 6 | 18 | 0.0227 |
| `geKills` | 452 | 576 | 5.1667 | 23 | 16 | 7 | 0.0931 |
| `fire.total` | 779 | 797 | 0.75 | 19 | 12 | 7 | 0.3593 |
| `fire.hits` | 324 | 270 | -2.25 | 20 | 9 | 11 | 0.8238 |
| `retreatSamples` | 5718 | 6181 | 19.2917 | 24 | 17 | 7 | 0.0639 |
| `movementResolver.changes` | 44962 | 42704 | -94.0833 | 24 | 3 | 21 | 0.0003 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 9 | 0.1667 | 6 | 5 | 1 | 0.2188 |
| `loopAlerts.length` | 64 | 52 | -0.5 | 22 | 12 | 10 | 0.8318 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 33 | 16 | -0.7083 | 13 | 0 | 13 | 0.0002 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 445 | 421 | -1 | 17 | 2 | 15 | 0.0023 |
| `recon.contacts` | 65 | 51 | -0.5833 | 15 | 7 | 8 | 1 |
| `recon.noContact` | 223 | 234 | 0.4583 | 13 | 7 | 6 | 1 |
| `recon.timeouts` | 21 | 32 | 0.4583 | 11 | 11 | 0 | 0.001 |
| `recon.cancelled` | 120 | 79 | -1.7083 | 16 | 1 | 15 | 0.0005 |
| `recon.reportsDelivered` | 319 | 307 | -0.5 | 19 | 11 | 8 | 0.6476 |
| `recon.retriggerBlocked` | 213 | 232 | 0.7917 | 14 | 11 | 3 | 0.0574 |
| `squadPerformance.meanOverall` | 2086.7 | 2077.9000000000005 | -0.3667 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.p10Overall` | 1904.4999999999998 | 1907.9999999999993 | 0.1458 | 14 | 9 | 5 | 0.424 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1766.4999999999998 | 1694.1 | -3.0167 | 23 | 7 | 16 | 0.0931 |
| `squadPerformance.meanMovement` | 2388.9 | 2376.8 | -0.5042 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.meanControl` | 2370 | 2371.8000000000006 | 0.075 | 23 | 11 | 12 | 1 |
| `squadPerformance.meanCohesion` | 2052.1 | 2135.7999999999997 | 3.4875 | 23 | 17 | 6 | 0.0347 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 161.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=960&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=960&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=960`); it opens the seed that parts earliest, and the dropdowns choose another.

