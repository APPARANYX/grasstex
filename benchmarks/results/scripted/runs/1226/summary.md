# Benchmark run #1226 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/squad-firing-positions-20261021 @ c98d12e · [run](https://github.com/APPARANYX/grasstex/actions/runs/39705589248) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 349.05 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties +0.8% (p 1)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 321 to 289 (-10.0%, p 0); recon.cancelled 82 to 64 (-22.0%, p 0).
- Under 0.05 only: movementResolver.changes 14921 to 16244 (+8.9%, p 0.002); recon.contacts 27 to 21 (-22.2%, p 0.0313); recon.reportsDelivered 198 to 162 (-18.2%, p 0.0313).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.058 (gate 1.25)
- the 10 changed records first part at simulated second: min 342, p10 342, median 349.05, p90 356.1, max 356.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 378 | 381 | 0.1304 | 9 | 5 | 4 | 1 |
| `usKills` | 113 | 141 | 1.2174 | 8 | 7 | 1 | 0.0703 |
| `geKills` | 265 | 240 | -1.087 | 7 | 2 | 5 | 0.4531 |
| `fire.total` | 341 | 325 | -0.6957 | 8 | 3 | 5 | 0.7266 |
| `fire.hits` | 155 | 158 | 0.1304 | 7 | 4 | 3 | 1 |
| `retreatSamples` | 2658 | 2555 | -4.4783 | 7 | 1 | 6 | 0.125 |
| `movementResolver.changes` | 14921 | 16244 | 57.5217 | 10 | 10 | 0 | 0.002 |
| `grenades.throws` | 1 | 0 | -0.0435 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0435 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 3 | 0.087 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 4 | 0.1304 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 27 | 25 | -0.087 | 6 | 2 | 4 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 21 | 26 | 0.2174 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 4 | 0.087 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 16 | 0.2609 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 8 | 0.1739 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamplesRepeated` | 20 | 32 | 0.5217 | 2 | 2 | 0 | 0.5 |
| `recon.orders` | 321 | 289 | -1.3913 | 21 | 0 | 21 | 0 |
| `recon.contacts` | 27 | 21 | -0.2609 | 6 | 0 | 6 | 0.0313 |
| `recon.noContact` | 85 | 77 | -0.3478 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 73 | 76 | 0.1304 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 82 | 64 | -0.7826 | 18 | 0 | 18 | 0 |
| `recon.reportsDelivered` | 198 | 162 | -1.5652 | 6 | 0 | 6 | 0.0313 |
| `recon.retriggerBlocked` | 117 | 115 | -0.087 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 2070.1000000000004 | 2079.5 | 0.4087 | 8 | 7 | 1 | 0.0703 |
| `squadPerformance.p10Overall` | 1871.1999999999998 | 1876.2999999999997 | 0.2217 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1834.4 | 1852.1000000000001 | 0.7696 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.meanMovement` | 2250.1 | 2252.7 | 0.113 | 7 | 4 | 3 | 1 |
| `squadPerformance.meanControl` | 2282.4 | 2283.2 | 0.0348 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanCohesion` | 2056.3 | 2064.7999999999997 | 0.3696 | 8 | 6 | 2 | 0.2891 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 342 s (timeline) · phase-c-natural-20261012-0003 356.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1226&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-firing-positions-20261021/ai_flow_live.html?bench=1226&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1226`); it opens the seed that parts earliest, and the dropdowns choose another.

