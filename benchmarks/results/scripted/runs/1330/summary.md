# Benchmark run #1330 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/hold-keep-clock-20261025 @ 87442d8 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40197375560) · build v29-dev

## Verdict

**QUIET: 20 of 20 pairs changed (median first part 278.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.5% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.05 (gate 1.25)
- the 11 changed records first part at simulated second: min 278.1, p10 278.1, median 278.1, p90 324, max 324

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 380 | 378 | -0.1 | 7 | 4 | 3 | 1 |
| `usKills` | 261 | 272 | 0.55 | 8 | 7 | 1 | 0.0703 |
| `geKills` | 119 | 106 | -0.65 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 373 | 344 | -1.45 | 7 | 4 | 3 | 1 |
| `fire.hits` | 191 | 176 | -0.75 | 6 | 3 | 3 | 1 |
| `retreatSamples` | 3936 | 3859 | -3.85 | 9 | 3 | 6 | 0.5078 |
| `movementResolver.changes` | 14707 | 13732 | -48.75 | 11 | 3 | 8 | 0.2266 |
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
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 16 | 14 | -0.1 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 28 | 30 | 0.1 | 6 | 4 | 2 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 227 | 222 | -0.25 | 4 | 0 | 4 | 0.125 |
| `recon.contacts` | 13 | 12 | -0.05 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 31 | 27 | -0.2 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 80 | 79 | -0.05 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 68 | 67 | -0.05 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 1632.3 | 1636.9 | 0.23 | 9 | 5 | 4 | 1 |
| `squadPerformance.p10Overall` | 1477 | 1483.8 | 0.34 | 7 | 6 | 1 | 0.125 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 1291.8 | 1299.1000000000001 | 0.365 | 10 | 6 | 4 | 0.7539 |
| `squadPerformance.meanMovement` | 1840.5 | 1842.5 | 0.1 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 1881.2 | 1880.1000000000004 | -0.055 | 9 | 4 | 5 | 1 |
| `squadPerformance.meanCohesion` | 1748.1 | 1753.2 | 0.255 | 9 | 7 | 2 | 0.1797 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 278.1 s (timeline) · phase-c-natural-20261012-0003 324 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1330&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/hold-keep-clock-20261025/ai_flow_live.html?bench=1330&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1330`); it opens the seed that parts earliest, and the dropdowns choose another.

