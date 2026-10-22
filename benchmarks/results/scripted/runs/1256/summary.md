# Benchmark run #1256 · 100 seeds from `sector-memory-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 91ca910 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39806363607) · build v29-dev

## Verdict

**QUIET: 60 of 100 pairs changed (median first part 240 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.6% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **40** · runtime errors off 0 / on 0 · wall time on/off x1.017 (gate 1.25)
- the 23 changed records first part at simulated second: min 110.1, p10 139.05, median 240, p90 397.05, max 463.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4740 | 4713 | -0.27 | 15 | 7 | 8 | 1 |
| `usKills` | 2281 | 2251 | -0.3 | 14 | 7 | 7 | 1 |
| `geKills` | 2459 | 2462 | 0.03 | 12 | 7 | 5 | 0.7744 |
| `fire.total` | 22825 | 22683 | -1.42 | 15 | 6 | 9 | 0.6072 |
| `fire.hits` | 8781 | 8654 | -1.27 | 15 | 5 | 10 | 0.3018 |
| `retreatSamples` | 153716 | 151952 | -17.64 | 14 | 5 | 9 | 0.424 |
| `movementResolver.changes` | 218055 | 218418 | 3.63 | 23 | 15 | 8 | 0.21 |
| `grenades.throws` | 53 | 57 | 0.04 | 2 | 2 | 0 | 0.5 |
| `grenades.bursts` | 53 | 57 | 0.04 | 2 | 2 | 0 | 0.5 |
| `grenades.wounded` | 23 | 24 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 8 | 9 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 59 | 63 | 0.04 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyWounded` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 5 | 0.01 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 210 | 210 | 0 | 9 | 5 | 4 | 1 |
| `loopAlerts.length` | 471 | 484 | 0.13 | 12 | 7 | 5 | 0.7744 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 385 | 380 | -0.05 | 9 | 4 | 5 | 1 |
| `stallOutcomes.wakes` | 10 | 11 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 4 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1934 | 1921 | -0.13 | 15 | 6 | 9 | 0.6072 |
| `recon.contacts` | 173 | 172 | -0.01 | 8 | 4 | 4 | 1 |
| `recon.noContact` | 1136 | 1129 | -0.07 | 12 | 5 | 7 | 0.7744 |
| `recon.timeouts` | 92 | 93 | 0.01 | 3 | 2 | 1 | 1 |
| `recon.cancelled` | 453 | 447 | -0.06 | 13 | 5 | 8 | 0.5811 |
| `recon.reportsDelivered` | 663 | 661 | -0.02 | 9 | 5 | 4 | 1 |
| `recon.retriggerBlocked` | 1171 | 1162 | -0.09 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanOverall` | 8493.699999999995 | 8499.599999999997 | 0.059 | 16 | 10 | 6 | 0.4545 |
| `squadPerformance.p10Overall` | 7702.900000000002 | 7707.200000000001 | 0.043 | 7 | 4 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7435.999999999999 | 7461.900000000001 | 0.259 | 14 | 9 | 5 | 0.424 |
| `squadPerformance.meanMovement` | 9987.19999999999 | 9987.299999999992 | 0.001 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 9695.099999999999 | 9691.599999999999 | -0.035 | 15 | 8 | 7 | 1 |
| `squadPerformance.meanCohesion` | 8864.8 | 8860 | -0.048 | 15 | 9 | 6 | 0.6072 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-memory-20261022-0077 110.1 s (stress) · sector-memory-20261022-0052 116.1 s (timeline) · sector-memory-20261022-0053 139.05 s (timeline) · sector-memory-20261022-0048 159 s (timeline) · sector-memory-20261022-0092 168 s (timeline) · sector-memory-20261022-0005 169.05 s (timeline) · sector-memory-20261022-0085 171 s (stress) · sector-memory-20261022-0001 173.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1256&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1256&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1256`); it opens the seed that parts earliest, and the dropdowns choose another.

