# Benchmark run #860 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ 6b2df53 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38395723256) · build v29-dev

## Verdict

**WEAK: 22 of 22 pairs changed (median first part 150 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties -4.2% (p 0.8318)**

- Under 0.05 only: geKills 518 to 400 (-22.8%, p 0.0015); recon.noContact 224 to 205 (-8.5%, p 0.0063); recon.orders 446 to 362 (-18.8%, p 0.0309); usKills 150 to 240 (+60.0%, p 0.0414).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.147 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 156, max 156

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 668 | 640 | -1.2727 | 22 | 12 | 10 | 0.8318 |
| `usKills` | 150 | 240 | 4.0909 | 20 | 15 | 5 | 0.0414 |
| `geKills` | 518 | 400 | -5.3636 | 21 | 3 | 18 | 0.0015 |
| `fire.total` | 857 | 991 | 6.0909 | 21 | 10 | 11 | 1 |
| `fire.hits` | 281 | 269 | -0.5455 | 19 | 9 | 10 | 1 |
| `retreatSamples` | 5050 | 5175 | 5.6818 | 21 | 11 | 10 | 1 |
| `movementResolver.changes` | 41924 | 42203 | 12.6818 | 22 | 11 | 11 | 1 |
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
| `loopAlerts.length` | 10 | 15 | 0.2273 | 11 | 5 | 6 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 21 | -0.0909 | 12 | 7 | 5 | 0.7744 |
| `stallOutcomes.wakes` | 3 | 4 | 0.0455 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 0 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 446 | 362 | -3.8182 | 18 | 4 | 14 | 0.0309 |
| `recon.contacts` | 50 | 52 | 0.0909 | 18 | 10 | 8 | 0.8145 |
| `recon.noContact` | 224 | 205 | -0.8636 | 12 | 1 | 11 | 0.0063 |
| `recon.timeouts` | 14 | 19 | 0.2273 | 3 | 3 | 0 | 0.25 |
| `recon.cancelled` | 138 | 75 | -2.8636 | 19 | 5 | 14 | 0.0636 |
| `recon.reportsDelivered` | 240 | 269 | 1.3182 | 20 | 12 | 8 | 0.5034 |
| `recon.retriggerBlocked` | 239 | 221 | -0.8182 | 13 | 5 | 8 | 0.5811 |
| `squadPerformance.meanOverall` | 1933.5 | 1919.1999999999998 | -0.65 | 22 | 7 | 15 | 0.1338 |
| `squadPerformance.p10Overall` | 1779.9 | 1755.5999999999992 | -1.1045 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.4000000000003 | 1593.4000000000003 | -1.4545 | 22 | 11 | 11 | 1 |
| `squadPerformance.meanMovement` | 2185.7 | 2183.7 | -0.0909 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.meanControl` | 2190.7 | 2187.5 | -0.1455 | 17 | 12 | 5 | 0.1435 |
| `squadPerformance.meanCohesion` | 1976.4000000000003 | 1957.2000000000003 | -0.8727 | 21 | 8 | 13 | 0.3833 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 156 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=860&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=860&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=860`); it opens the seed that parts earliest, and the dropdowns choose another.

