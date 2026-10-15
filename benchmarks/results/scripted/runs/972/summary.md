# Benchmark run #972 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-support-window-20261015 @ 15be126 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38673766098) · build v29-dev

## Verdict

**MOVED: 25 of 25 pairs changed (median first part 124.05 s); 10 of 42 counters under p 0.05 (about 2.1 by chance), 5 under 0.0012; casualties -2.5% (p 0.6776)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 571 to 375 (-34.3%, p 0); recon.cancelled 244 to 96 (-60.7%, p 0); recon.reportsDelivered 298 to 146 (-51.0%, p 0); regroups.entries 34 to 95 (+179.4%, p 0.0001); recon.contacts 57 to 28 (-50.9%, p 0.0001).
- Under 0.05 only: geKills 397 to 492 (+23.9%, p 0.0026); squadPerformance.meanOverall 2183.4000000000005 to 2155.5999999999995 (-1.3%, p 0.0041); squadPerformance.meanCohesion 2167.4000000000005 to 2080.1 (-4.0%, p 0.0227); recon.timeouts 18 to 24 (+33.3%, p 0.0313); retreatSamples 5368 to 6330 (+17.9%, p 0.0433).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **25** pairs (unpaired: off 0, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.247 (gate 1.25)
- the 25 changed records first part at simulated second: min 109.05, p10 109.05, median 124.05, p90 166.05, max 166.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 886 | 864 | -0.88 | 23 | 13 | 10 | 0.6776 |
| `usKills` | 489 | 372 | -4.68 | 23 | 8 | 15 | 0.21 |
| `geKills` | 397 | 492 | 3.8 | 23 | 19 | 4 | 0.0026 |
| `fire.total` | 907 | 1142 | 9.4 | 24 | 14 | 10 | 0.5413 |
| `fire.hits` | 329 | 298 | -1.24 | 23 | 12 | 11 | 1 |
| `retreatSamples` | 5368 | 6330 | 38.48 | 25 | 18 | 7 | 0.0433 |
| `movementResolver.changes` | 43291 | 43570 | 11.16 | 25 | 17 | 8 | 0.1078 |
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
| `vacantObjectiveStalls.length` | 11 | 8 | -0.12 | 10 | 5 | 5 | 1 |
| `loopAlerts.length` | 31 | 60 | 1.16 | 18 | 12 | 6 | 0.2379 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 34 | 95 | 2.44 | 19 | 18 | 1 | 0.0001 |
| `stallOutcomes.wakes` | 0 | 5 | 0.2 | 4 | 4 | 0 | 0.125 |
| `stallOutcomes.repeats` | 0 | 1 | 0.04 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 571 | 375 | -7.84 | 25 | 0 | 25 | 0 |
| `recon.contacts` | 57 | 28 | -1.16 | 15 | 0 | 15 | 0.0001 |
| `recon.noContact` | 230 | 215 | -0.6 | 13 | 4 | 9 | 0.2668 |
| `recon.timeouts` | 18 | 24 | 0.24 | 6 | 6 | 0 | 0.0313 |
| `recon.cancelled` | 244 | 96 | -5.92 | 25 | 0 | 25 | 0 |
| `recon.reportsDelivered` | 298 | 146 | -6.08 | 17 | 0 | 17 | 0 |
| `recon.retriggerBlocked` | 213 | 217 | 0.16 | 19 | 13 | 6 | 0.1671 |
| `squadPerformance.meanOverall` | 2183.4000000000005 | 2155.5999999999995 | -1.112 | 25 | 5 | 20 | 0.0041 |
| `squadPerformance.p10Overall` | 1992.4999999999993 | 2008.7999999999993 | 0.652 | 22 | 14 | 8 | 0.2863 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1857.8999999999996 | 1795.9000000000003 | -2.48 | 25 | 8 | 17 | 0.1078 |
| `squadPerformance.meanMovement` | 2488.9999999999995 | 2493.1000000000004 | 0.164 | 19 | 11 | 8 | 0.6476 |
| `squadPerformance.meanControl` | 2478.2999999999997 | 2469 | -0.372 | 21 | 9 | 12 | 0.6636 |
| `squadPerformance.meanCohesion` | 2167.4000000000005 | 2080.1 | -3.492 | 24 | 6 | 18 | 0.0227 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 109.05 s (timeline) · phase-c-natural-20261012-0001 124.05 s (timeline) · phase-c-natural-20261012-0002 166.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=972&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-support-window-20261015/ai_flow_live.html?bench=972&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=972`); it opens the seed that parts earliest, and the dropdowns choose another.

