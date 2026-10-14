# Benchmark run #938 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/ship-soldier-autonomy-house-ingress-lab @ 9aabb4b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38495481665) · build v29-dev

## Verdict

**MOVED: 24 of 24 pairs changed (median first part 150 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -2.9% (p 1)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 43306 to 38326 (-11.5%, p 0).
- Under 0.05 only: recon.orders 460 to 388 (-15.7%, p 0.0118); recon.noContact 240 to 230 (-4.2%, p 0.0309); recon.contacts 67 to 54 (-19.4%, p 0.049).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **24** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.096 (gate 1.25)
- the 24 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 161.1, max 161.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 890 | 864 | -1.0833 | 21 | 10 | 11 | 1 |
| `usKills` | 376 | 458 | 3.4167 | 23 | 11 | 12 | 1 |
| `geKills` | 514 | 406 | -4.5 | 22 | 10 | 12 | 0.8318 |
| `fire.total` | 864 | 676 | -7.8333 | 19 | 7 | 12 | 0.3593 |
| `fire.hits` | 332 | 272 | -2.5 | 17 | 6 | 11 | 0.3323 |
| `retreatSamples` | 6945 | 6662 | -11.7917 | 21 | 11 | 10 | 1 |
| `movementResolver.changes` | 43306 | 38326 | -207.5 | 24 | 2 | 22 | 0 |
| `grenades.throws` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 9 | 4 | 5 | 1 |
| `loopAlerts.length` | 41 | 38 | -0.125 | 15 | 7 | 8 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 54 | 35 | -0.7917 | 18 | 5 | 13 | 0.0963 |
| `stallOutcomes.wakes` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 460 | 388 | -3 | 20 | 4 | 16 | 0.0118 |
| `recon.contacts` | 67 | 54 | -0.5417 | 17 | 4 | 13 | 0.049 |
| `recon.noContact` | 240 | 230 | -0.4167 | 18 | 4 | 14 | 0.0309 |
| `recon.timeouts` | 16 | 20 | 0.1667 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 121 | 71 | -2.0833 | 22 | 7 | 15 | 0.1338 |
| `recon.reportsDelivered` | 363 | 280 | -3.4583 | 20 | 7 | 13 | 0.2632 |
| `recon.retriggerBlocked` | 237 | 249 | 0.5 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanOverall` | 2075.2999999999997 | 2078.5 | 0.1333 | 24 | 14 | 10 | 0.5413 |
| `squadPerformance.p10Overall` | 1895.2999999999995 | 1906.6999999999991 | 0.475 | 14 | 9 | 5 | 0.424 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1719.4000000000005 | 1691.5000000000002 | -1.1625 | 23 | 9 | 14 | 0.4049 |
| `squadPerformance.meanMovement` | 2393.4 | 2392.3 | -0.0458 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanControl` | 2377.2999999999997 | 2377.9 | 0.025 | 19 | 11 | 8 | 0.6476 |
| `squadPerformance.meanCohesion` | 2070.3 | 2122.7 | 2.1833 | 24 | 16 | 8 | 0.1516 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 161.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=938&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ship-soldier-autonomy-house-ingress-lab/ai_flow_live.html?bench=938&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=938`); it opens the seed that parts earliest, and the dropdowns choose another.

