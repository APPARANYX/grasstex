# Benchmark run #1196 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- experiment/ai-skills-compact-factorial-20261021 @ b51e125 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39657889915) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 535.05 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +0.4% (p 1)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 321 to 307 (-4.4%, p 0.0001).
- Under 0.05 only: recon.contacts 9 to 2 (-77.8%, p 0.0156); recon.cancelled 103 to 96 (-6.8%, p 0.0156); recon.reportsDelivered 42 to 16 (-61.9%, p 0.0156).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.064 (gate 1.25)
- the 3 changed records first part at simulated second: min 535.05, p10 535.05, median 535.05, p90 573.15, max 573.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 451 | 453 | 0.1 | 2 | 1 | 1 | 1 |
| `usKills` | 309 | 312 | 0.15 | 1 | 1 | 0 | 1 |
| `geKills` | 142 | 141 | -0.05 | 2 | 1 | 1 | 1 |
| `fire.total` | 565 | 534 | -1.55 | 3 | 1 | 2 | 1 |
| `fire.hits` | 268 | 256 | -0.6 | 2 | 1 | 1 | 1 |
| `retreatSamples` | 2712 | 2713 | 0.05 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 13296 | 13283 | -0.65 | 3 | 1 | 2 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 31 | 30 | -0.05 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 75 | 75 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 321 | 307 | -0.7 | 14 | 0 | 14 | 0.0001 |
| `recon.contacts` | 9 | 2 | -0.35 | 7 | 0 | 7 | 0.0156 |
| `recon.noContact` | 83 | 83 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 103 | 96 | -0.35 | 7 | 0 | 7 | 0.0156 |
| `recon.reportsDelivered` | 42 | 16 | -1.3 | 7 | 0 | 7 | 0.0156 |
| `recon.retriggerBlocked` | 162 | 162 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1798.5 | 1798.1000000000001 | -0.02 | 2 | 1 | 1 | 1 |
| `squadPerformance.p10Overall` | 1576.2 | 1577.6 | 0.07 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1577.5 | 1574.5 | -0.15 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMovement` | 1961.6000000000001 | 1963.1000000000001 | 0.075 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 1979.1999999999998 | 1979.6999999999998 | 0.025 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanCohesion` | 1831.9999999999998 | 1833.4999999999998 | 0.075 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 535.05 s (timeline) · phase-c-natural-20261012-0001 573.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1196&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1196`); it opens the seed that parts earliest, and the dropdowns choose another.

