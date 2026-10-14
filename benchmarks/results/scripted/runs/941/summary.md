# Benchmark run #941 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/combat-lab-main-integration @ a8b70b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38499841427) · build v29-dev

## Verdict

**WEAK: 19 of 19 pairs changed (median first part 288 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.6% (p 0.7744)**

- Under 0.05 only: usKills 362 to 445 (+22.9%, p 0.0063); geKills 460 to 356 (-22.6%, p 0.0063).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **19** pairs (unpaired: off 2, on 2) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.126 (gate 1.25)
- the 13 changed records first part at simulated second: min 185.1, p10 185.1, median 288, p90 410.1, max 410.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 822 | 801 | -1.1053 | 12 | 5 | 7 | 0.7744 |
| `usKills` | 362 | 445 | 4.3684 | 12 | 11 | 1 | 0.0063 |
| `geKills` | 460 | 356 | -5.4737 | 12 | 1 | 11 | 0.0063 |
| `fire.total` | 724 | 677 | -2.4737 | 8 | 3 | 5 | 0.7266 |
| `fire.hits` | 371 | 337 | -1.7895 | 7 | 3 | 4 | 1 |
| `retreatSamples` | 4111 | 3542 | -29.9474 | 10 | 4 | 6 | 0.7539 |
| `movementResolver.changes` | 46393 | 45557 | -44 | 13 | 4 | 9 | 0.2668 |
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
| `vacantObjectiveStalls.length` | 18 | 18 | 0 | 4 | 2 | 2 | 1 |
| `loopAlerts.length` | 45 | 53 | 0.4211 | 8 | 5 | 3 | 0.7266 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 38 | 36 | -0.1053 | 4 | 1 | 3 | 0.625 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 378 | 389 | 0.5789 | 9 | 6 | 3 | 0.5078 |
| `recon.contacts` | 17 | 22 | 0.2632 | 7 | 4 | 3 | 1 |
| `recon.noContact` | 267 | 276 | 0.4737 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 90 | 79 | -0.5789 | 8 | 2 | 6 | 0.2891 |
| `recon.reportsDelivered` | 44 | 96 | 2.7368 | 7 | 5 | 2 | 0.4531 |
| `recon.retriggerBlocked` | 298 | 303 | 0.2632 | 7 | 4 | 3 | 1 |
| `squadPerformance.meanOverall` | 1641.6000000000001 | 1633 | -0.4526 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.p10Overall` | 1516.3999999999994 | 1499.0999999999997 | -0.9105 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1368.3999999999999 | 1357.3000000000002 | -0.5842 | 11 | 5 | 6 | 1 |
| `squadPerformance.meanMovement` | 1866.5 | 1857 | -0.5 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.meanControl` | 1865.8 | 1860.1000000000001 | -0.3 | 10 | 5 | 5 | 1 |
| `squadPerformance.meanCohesion` | 1669.5999999999997 | 1654.4 | -0.8 | 11 | 5 | 6 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0002 288 s (timeline) · phase-c-natural-20261012-0003 410.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=941&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/combat-lab-main-integration/ai_flow_live.html?bench=941&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=941`); it opens the seed that parts earliest, and the dropdowns choose another.

