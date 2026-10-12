# Benchmark run #625 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ d9bdb2c · [run](https://github.com/APPARANYX/grasstex/actions/runs/38262485129) · build v29-dev

## Verdict

**MOVED: 24 of 24 pairs changed (median first part 150 s); 2 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +5.4% (p 0.8318)**

- Clears the Bonferroni line (p < 0.0012): recon.contacts 66 to 40 (-39.4%, p 0).
- Under 0.05 only: recon.orders 451 to 397 (-12.0%, p 0.0072).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **24** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.123 (gate 1.25)
- the 24 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 777 | 819 | 1.75 | 22 | 10 | 12 | 0.8318 |
| `usKills` | 301 | 311 | 0.4167 | 22 | 12 | 10 | 0.8318 |
| `geKills` | 476 | 508 | 1.3333 | 23 | 13 | 10 | 0.6776 |
| `fire.total` | 601 | 773 | 7.1667 | 21 | 11 | 10 | 1 |
| `fire.hits` | 247 | 306 | 2.4583 | 21 | 9 | 12 | 0.6636 |
| `retreatSamples` | 7316 | 7584 | 11.1667 | 23 | 13 | 10 | 0.6776 |
| `movementResolver.changes` | 46433 | 47707 | 53.0833 | 24 | 12 | 12 | 1 |
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
| `vacantObjectiveStalls.length` | 10 | 7 | -0.125 | 8 | 3 | 5 | 0.7266 |
| `loopAlerts.length` | 8 | 25 | 0.7083 | 12 | 9 | 3 | 0.146 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 40 | 44 | 0.1667 | 17 | 9 | 8 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 451 | 397 | -2.25 | 21 | 4 | 17 | 0.0072 |
| `recon.contacts` | 66 | 40 | -1.0833 | 18 | 0 | 18 | 0 |
| `recon.noContact` | 237 | 242 | 0.2083 | 13 | 6 | 7 | 1 |
| `recon.timeouts` | 20 | 16 | -0.1667 | 4 | 0 | 4 | 0.125 |
| `recon.cancelled` | 106 | 88 | -0.75 | 16 | 6 | 10 | 0.4545 |
| `recon.reportsDelivered` | 270 | 173 | -4.0417 | 19 | 6 | 13 | 0.1671 |
| `recon.retriggerBlocked` | 257 | 254 | -0.125 | 15 | 4 | 11 | 0.1185 |
| `squadPerformance.meanOverall` | 2069.2000000000007 | 2074.7000000000003 | 0.2292 | 24 | 14 | 10 | 0.5413 |
| `squadPerformance.p10Overall` | 1915.9999999999993 | 1913.199999999999 | -0.1167 | 17 | 7 | 10 | 0.6291 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1653.8 | 1638.6 | -0.6333 | 23 | 8 | 15 | 0.21 |
| `squadPerformance.meanMovement` | 2388.1 | 2394 | 0.2458 | 16 | 11 | 5 | 0.2101 |
| `squadPerformance.meanControl` | 2394.6 | 2387.8999999999996 | -0.2792 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.meanCohesion` | 2138.1000000000004 | 2210.9999999999995 | 3.0375 | 23 | 16 | 7 | 0.0931 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=625&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=625&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=625`); it opens the seed that parts earliest, and the dropdowns choose another.

