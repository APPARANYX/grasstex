# Benchmark run #793 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 40534ed · [run](https://github.com/APPARANYX/grasstex/actions/runs/38340426873) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 150 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +7.8% (p 0.8318)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 446 to 326 (-26.9%, p 0).
- Under 0.05 only: recon.contacts 50 to 31 (-38.0%, p 0.0042); usKills 150 to 274 (+82.7%, p 0.0072); recon.reportsDelivered 240 to 143 (-40.4%, p 0.0075); retreatSamples 5050 to 6940 (+37.4%, p 0.0266).
- Unpaired records: off 0, on 3 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 3) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.15 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 668 | 720 | 2.3636 | 22 | 12 | 10 | 0.8318 |
| `usKills` | 150 | 274 | 5.6364 | 21 | 17 | 4 | 0.0072 |
| `geKills` | 518 | 446 | -3.2727 | 22 | 8 | 14 | 0.2863 |
| `fire.total` | 857 | 708 | -6.7727 | 20 | 10 | 10 | 1 |
| `fire.hits` | 281 | 267 | -0.6364 | 20 | 13 | 7 | 0.2632 |
| `retreatSamples` | 5050 | 6940 | 85.9091 | 21 | 16 | 5 | 0.0266 |
| `movementResolver.changes` | 41924 | 40935 | -44.9545 | 22 | 11 | 11 | 1 |
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
| `vacantObjectiveStalls.length` | 9 | 3 | -0.2727 | 6 | 2 | 4 | 0.6875 |
| `loopAlerts.length` | 10 | 22 | 0.5455 | 12 | 6 | 6 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 24 | 0.0455 | 10 | 5 | 5 | 1 |
| `stallOutcomes.wakes` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 326 | -5.4545 | 21 | 1 | 20 | 0 |
| `recon.contacts` | 50 | 31 | -0.8636 | 16 | 2 | 14 | 0.0042 |
| `recon.noContact` | 224 | 219 | -0.2273 | 11 | 3 | 8 | 0.2266 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 138 | 47 | -4.1364 | 21 | 6 | 15 | 0.0784 |
| `recon.reportsDelivered` | 240 | 143 | -4.4091 | 18 | 3 | 15 | 0.0075 |
| `recon.retriggerBlocked` | 239 | 227 | -0.5455 | 12 | 4 | 8 | 0.3877 |
| `squadPerformance.meanOverall` | 1933.5 | 1905.0000000000005 | -1.2955 | 22 | 6 | 16 | 0.0525 |
| `squadPerformance.p10Overall` | 1779.9 | 1754.5999999999995 | -1.15 | 16 | 6 | 10 | 0.4545 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.4000000000003 | 1515.2 | -5.0091 | 21 | 7 | 14 | 0.1892 |
| `squadPerformance.meanMovement` | 2185.7 | 2184.6000000000004 | -0.05 | 19 | 8 | 11 | 0.6476 |
| `squadPerformance.meanControl` | 2190.7 | 2190.5000000000005 | -0.0091 | 17 | 11 | 6 | 0.3323 |
| `squadPerformance.meanCohesion` | 1976.4000000000003 | 2033.2 | 2.5818 | 22 | 14 | 8 | 0.2863 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=793&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=793&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=793`); it opens the seed that parts earliest, and the dropdowns choose another.

