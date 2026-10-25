# Benchmark run #1344 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- claude/project-thread-a5sq10 @ 0dd2771 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40223028192) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 348.07500000000005 s); 2 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -3.9% (p 0.2188)**

- Clears the Bonferroni line (p < 0.0012): recon.cancelled 63 to 42 (-33.3%, p 0).
- Under 0.05 only: recon.orders 279 to 265 (-5.0%, p 0.0023).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.023 (gate 1.25)
- the 10 changed records first part at simulated second: min 340.05, p10 340.05, median 348.07500000000005, p90 356.1, max 356.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 413 | 397 | -0.6957 | 6 | 1 | 5 | 0.2188 |
| `usKills` | 169 | 179 | 0.4348 | 10 | 4 | 6 | 0.7539 |
| `geKills` | 244 | 218 | -1.1304 | 10 | 5 | 5 | 1 |
| `fire.total` | 345 | 395 | 2.1739 | 6 | 3 | 3 | 1 |
| `fire.hits` | 179 | 169 | -0.4348 | 5 | 2 | 3 | 1 |
| `retreatSamples` | 2155 | 2232 | 3.3478 | 8 | 4 | 4 | 1 |
| `movementResolver.changes` | 15935 | 15031 | -39.3043 | 10 | 6 | 4 | 0.7539 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 0 | -0.087 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 31 | 30 | -0.0435 | 5 | 3 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 20 | 18 | -0.087 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 279 | 265 | -0.6087 | 17 | 2 | 15 | 0.0023 |
| `recon.contacts` | 24 | 20 | -0.1739 | 4 | 0 | 4 | 0.125 |
| `recon.noContact` | 76 | 84 | 0.3478 | 5 | 5 | 0 | 0.0625 |
| `recon.timeouts` | 69 | 70 | 0.0435 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 63 | 42 | -0.913 | 17 | 0 | 17 | 0 |
| `recon.reportsDelivered` | 147 | 123 | -1.0435 | 4 | 0 | 4 | 0.125 |
| `recon.retriggerBlocked` | 106 | 106 | 0 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 2096.2 | 2092.2999999999997 | -0.1696 | 9 | 4 | 5 | 1 |
| `squadPerformance.p10Overall` | 1891.2999999999997 | 1891.8999999999996 | 0.0261 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1906.2 | 1894.6 | -0.5043 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.meanMovement` | 2239.5 | 2237 | -0.1087 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.meanControl` | 2279.4999999999995 | 2280.3000000000006 | 0.0348 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.meanCohesion` | 2075.8 | 2087.5 | 0.5087 | 9 | 6 | 3 | 0.5078 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 340.05 s (timeline) · phase-c-natural-20261012-0003 356.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1344&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1344`); it opens the seed that parts earliest, and the dropdowns choose another.

