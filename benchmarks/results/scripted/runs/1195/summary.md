# Benchmark run #1195 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- experiment/ai-skills-compact-factorial-20261021 @ b51e125 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39657888356) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 278.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance); casualties +7.5% (p 0.7266)**

- Under 0.05 only: retreatSamples 4001 to 3280 (-18.0%, p 0.0078); usKills 223 to 194 (-13.0%, p 0.0156); recon.orders 272 to 257 (-5.5%, p 0.0156); recon.retriggerBlocked 86 to 77 (-10.5%, p 0.0156); squadPerformance.meanCohesion 1769.8999999999999 to 1789.0000000000002 (+1.1%, p 0.0391).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.088 (gate 1.25)
- the 11 changed records first part at simulated second: min 278.1, p10 278.1, median 278.1, p90 347.1, max 347.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 348 | 374 | 1.3 | 8 | 5 | 3 | 0.7266 |
| `usKills` | 223 | 194 | -1.45 | 7 | 0 | 7 | 0.0156 |
| `geKills` | 125 | 180 | 2.75 | 7 | 5 | 2 | 0.4531 |
| `fire.total` | 441 | 569 | 6.4 | 8 | 3 | 5 | 0.7266 |
| `fire.hits` | 209 | 201 | -0.4 | 7 | 3 | 4 | 1 |
| `retreatSamples` | 4001 | 3280 | -36.05 | 8 | 0 | 8 | 0.0078 |
| `movementResolver.changes` | 13842 | 14119 | 13.85 | 11 | 5 | 6 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 17 | 18 | 0.05 | 5 | 2 | 3 | 1 |
| `loopAlerts.length` | 37 | 39 | 0.1 | 6 | 4 | 2 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 2 | 0.1 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 2 | 0.1 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 272 | 257 | -0.75 | 7 | 0 | 7 | 0.0156 |
| `recon.contacts` | 12 | 9 | -0.15 | 7 | 2 | 5 | 0.4531 |
| `recon.noContact` | 27 | 26 | -0.05 | 5 | 2 | 3 | 1 |
| `recon.timeouts` | 71 | 68 | -0.15 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 125 | 121 | -0.2 | 5 | 1 | 4 | 0.375 |
| `recon.reportsDelivered` | 40 | 36 | -0.2 | 6 | 2 | 4 | 0.6875 |
| `recon.retriggerBlocked` | 86 | 77 | -0.45 | 7 | 0 | 7 | 0.0156 |
| `squadPerformance.meanOverall` | 1627.5 | 1641.6000000000001 | 0.705 | 10 | 7 | 3 | 0.3438 |
| `squadPerformance.p10Overall` | 1475.7 | 1478.1999999999996 | 0.125 | 7 | 4 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1288.2000000000005 | 1319.8000000000002 | 1.58 | 10 | 8 | 2 | 0.1094 |
| `squadPerformance.meanMovement` | 1816.0999999999997 | 1814.5 | -0.08 | 9 | 4 | 5 | 1 |
| `squadPerformance.meanControl` | 1877.4000000000003 | 1875.8000000000002 | -0.08 | 9 | 2 | 7 | 0.1797 |
| `squadPerformance.meanCohesion` | 1769.8999999999999 | 1789.0000000000002 | 0.955 | 9 | 8 | 1 | 0.0391 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 278.1 s (timeline) · phase-c-natural-20261012-0003 347.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1195&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1195`); it opens the seed that parts earliest, and the dropdowns choose another.

