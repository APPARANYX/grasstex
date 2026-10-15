# Benchmark run #1017 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/recon-ambush-causality-20261015 @ 75d181c · [run](https://github.com/APPARANYX/grasstex/actions/runs/38722710625) · build v29-dev

## Verdict

**WEAK: 17 of 17 pairs changed (median first part 168 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -20.9% (p 0.0023)**

- Under 0.05 only: casualties 645 to 510 (-20.9%, p 0.0023); usKills 329 to 210 (-36.2%, p 0.0213).
- Unpaired records: off 5, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **17** pairs (unpaired: off 5, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.114 (gate 1.25)
- the 17 changed records first part at simulated second: min 162, p10 162, median 168, p90 188.1, max 188.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 645 | 510 | -7.9412 | 17 | 2 | 15 | 0.0023 |
| `usKills` | 329 | 210 | -7 | 16 | 3 | 13 | 0.0213 |
| `geKills` | 316 | 300 | -0.9412 | 15 | 9 | 6 | 0.6072 |
| `fire.total` | 618 | 1051 | 25.4706 | 16 | 10 | 6 | 0.4545 |
| `fire.hits` | 300 | 231 | -4.0588 | 16 | 5 | 11 | 0.2101 |
| `retreatSamples` | 4013 | 3052 | -56.5294 | 16 | 8 | 8 | 1 |
| `movementResolver.changes` | 42460 | 41913 | -32.1765 | 17 | 8 | 9 | 1 |
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
| `vacantObjectiveStalls.length` | 10 | 12 | 0.1176 | 5 | 3 | 2 | 1 |
| `loopAlerts.length` | 43 | 32 | -0.6471 | 10 | 3 | 7 | 0.3438 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 45 | 49 | 0.2353 | 10 | 5 | 5 | 1 |
| `stallOutcomes.wakes` | 4 | 0 | -0.2353 | 4 | 0 | 4 | 0.125 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 340 | 364 | 1.4118 | 14 | 5 | 9 | 0.424 |
| `recon.contacts` | 13 | 12 | -0.0588 | 5 | 2 | 3 | 1 |
| `recon.noContact` | 243 | 261 | 1.0588 | 8 | 6 | 2 | 0.2891 |
| `recon.timeouts` | 6 | 2 | -0.2353 | 4 | 0 | 4 | 0.125 |
| `recon.cancelled` | 71 | 72 | 0.0588 | 12 | 4 | 8 | 0.3877 |
| `recon.reportsDelivered` | 62 | 46 | -0.9412 | 13 | 4 | 9 | 0.2668 |
| `recon.retriggerBlocked` | 269 | 292 | 1.3529 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.meanOverall` | 1466.3999999999999 | 1465.3 | -0.0647 | 17 | 8 | 9 | 1 |
| `squadPerformance.p10Overall` | 1365.4 | 1351.6999999999998 | -0.8059 | 15 | 7 | 8 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1199.7 | 1199 | -0.0412 | 17 | 8 | 9 | 1 |
| `squadPerformance.meanMovement` | 1665.1000000000001 | 1664.3000000000002 | -0.0471 | 15 | 10 | 5 | 0.3018 |
| `squadPerformance.meanControl` | 1671.7000000000003 | 1673.9 | 0.1294 | 17 | 10 | 7 | 0.6291 |
| `squadPerformance.meanCohesion` | 1528.4 | 1498.4 | -1.7647 | 16 | 6 | 10 | 0.4545 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 162 s (timeline) · phase-c-natural-20261012-0002 168 s (timeline) · phase-c-natural-20261012-0001 188.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1017&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/recon-ambush-causality-20261015/ai_flow_live.html?bench=1017&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1017`); it opens the seed that parts earliest, and the dropdowns choose another.

