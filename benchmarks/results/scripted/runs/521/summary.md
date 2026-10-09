# Benchmark run #521 · 100 seeds from `grenades-409` (meeting), windows `contact+120`

- **OFF** flags: `grenades=0` · **ON** flags: `none`
- work/grenade-select-fire-blast @ 393553a · [run](https://github.com/APPARANYX/grasstex/actions/runs/37998497757) · build v29-dev

## Verdict

**QUIET: 100 of 100 pairs changed (median first part 276 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.1% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.994 (gate 1.25)
- the 5 changed records first part at simulated second: min 240, p10 240, median 276, p90 292.05, max 292.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2539 | 2541 | 0.02 | 5 | 3 | 2 | 1 |
| `usKills` | 1151 | 1145 | -0.06 | 5 | 3 | 2 | 1 |
| `geKills` | 1388 | 1396 | 0.08 | 5 | 3 | 2 | 1 |
| `fire.total` | 13344 | 13390 | 0.46 | 5 | 3 | 2 | 1 |
| `fire.hits` | 5132 | 5128 | -0.04 | 5 | 2 | 3 | 1 |
| `retreatSamples` | 12231 | 12260 | 0.29 | 4 | 2 | 2 | 1 |
| `movementResolver.changes` | 213327 | 213254 | -0.73 | 5 | 2 | 3 | 1 |
| `grenades.throws` | 0 | 19 | 0.19 | 5 | 5 | 0 | 0.0625 |
| `grenades.bursts` | 0 | 17 | 0.17 | 5 | 5 | 0 | 0.0625 |
| `grenades.wounded` | 0 | 11 | 0.11 | 3 | 3 | 0 | 0.25 |
| `grenades.casualties` | 0 | 5 | 0.05 | 2 | 2 | 0 | 0.5 |
| `grenades.suppressed` | 0 | 34 | 0.34 | 5 | 5 | 0 | 0.0625 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 17 | 17 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 139 | 136 | -0.03 | 3 | 0 | 3 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 147 | 147 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2136 | 2136 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1459 | 1459 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 525 | 525 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 491 | 491 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1751 | 1751 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8592 | 8592.300000000001 | 0.003 | 3 | 2 | 1 | 1 |
| `squadPerformance.p10Overall` | 7754.200000000001 | 7757.1 | 0.029 | 4 | 4 | 0 | 0.125 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7361.100000000001 | 7357.000000000001 | -0.041 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 9899.800000000001 | 9901.000000000002 | 0.012 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanControl` | 9791.399999999996 | 9793.799999999996 | 0.024 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanCohesion` | 8963.699999999997 | 8965.8 | 0.021 | 4 | 3 | 1 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 5 seeds that part earliest (simulated seconds)

grenades-409-0015 240 s (timeline) · grenades-409-0008 265.05 s (timeline) · grenades-409-0013 276 s (timeline) · grenades-409-0031 278.1 s (timeline) · grenades-409-0006 292.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=521&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/grenade-select-fire-blast/ai_flow_live.html?bench=521&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=521`); it opens the seed that parts earliest, and the dropdowns choose another.

