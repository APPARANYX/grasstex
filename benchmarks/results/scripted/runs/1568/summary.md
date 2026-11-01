# Benchmark run #1568 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/controller-meso-wrap-20261101 @ 902f870 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41289312756) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 322.05 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -3.2% (p 1)**

- Under 0.05 only: recon.cancelled 100 to 73 (-27.0%, p 0.0078); loopAlerts.length 66 to 76 (+15.2%, p 0.0156); geKills 143 to 114 (-20.3%, p 0.0215).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.046 (gate 1.25)
- the 14 changed records first part at simulated second: min 266.1, p10 266.1, median 322.05, p90 468, max 468

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 313 | 303 | -0.5 | 11 | 5 | 6 | 1 |
| `usKills` | 170 | 189 | 0.95 | 14 | 9 | 5 | 0.424 |
| `geKills` | 143 | 114 | -1.45 | 10 | 1 | 9 | 0.0215 |
| `fire.total` | 1180 | 1312 | 6.6 | 13 | 8 | 5 | 0.5811 |
| `fire.hits` | 212 | 213 | 0.05 | 13 | 6 | 7 | 1 |
| `retreatSamples` | 4262 | 4229 | -1.65 | 13 | 6 | 7 | 1 |
| `movementResolver.changes` | 16519 | 17955 | 71.8 | 14 | 11 | 3 | 0.0574 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 5 | 4 | -0.05 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 6 | 0.05 | 5 | 3 | 2 | 1 |
| `loopAlerts.length` | 66 | 76 | 0.5 | 7 | 7 | 0 | 0.0156 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 2 | 4 | 0.1 | 5 | 4 | 1 | 0.375 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 46 | 0 | -2.3 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 5 | 0 | -0.25 | 5 | 0 | 5 | 0.0625 |
| `timeline.stalledSamplesRepeated` | 186 | 0 | -9.3 | 5 | 0 | 5 | 0.0625 |
| `recon.orders` | 232 | 212 | -1 | 8 | 1 | 7 | 0.0703 |
| `recon.contacts` | 12 | 7 | -0.25 | 5 | 0 | 5 | 0.0625 |
| `recon.noContact` | 23 | 26 | 0.15 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 58 | 65 | 0.35 | 5 | 5 | 0 | 0.0625 |
| `recon.cancelled` | 100 | 73 | -1.35 | 8 | 0 | 8 | 0.0078 |
| `recon.reportsDelivered` | 58 | 28 | -1.5 | 5 | 0 | 5 | 0.0625 |
| `recon.retriggerBlocked` | 76 | 70 | -0.3 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.meanOverall` | 1629.5 | 1630.1 | 0.03 | 14 | 9 | 5 | 0.424 |
| `squadPerformance.p10Overall` | 1474.9999999999995 | 1486.0999999999997 | 0.555 | 11 | 6 | 5 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1275.8999999999999 | 1273.8999999999999 | -0.1 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanMovement` | 1822.3 | 1842.7 | 1.02 | 12 | 7 | 5 | 0.7744 |
| `squadPerformance.meanControl` | 1873.4 | 1868.4 | -0.25 | 12 | 3 | 9 | 0.146 |
| `squadPerformance.meanCohesion` | 1823.3999999999999 | 1803 | -1.02 | 13 | 5 | 8 | 0.5811 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 266.1 s (timeline) · phase-c-natural-20261012-0003 322.05 s (timeline) · phase-c-natural-20261012-0002 468 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1568&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/controller-meso-wrap-20261101/ai_flow_live.html?bench=1568&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1568`); it opens the seed that parts earliest, and the dropdowns choose another.

