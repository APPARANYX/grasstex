# Benchmark run #518 · 100 seeds from `grenades-409` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `grenades=1`
- work/issue409-grenade-vertical-slice @ e580659 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37989178183) · build v29-dev

## Verdict

**QUIET: 100 of 100 pairs changed (median first part 276 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.4% (p 0.625)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.011 (gate 1.25)
- the 5 changed records first part at simulated second: min 240, p10 240, median 276, p90 292.05, max 292.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2539 | 2549 | 0.1 | 4 | 3 | 1 | 0.625 |
| `usKills` | 1151 | 1150 | -0.01 | 4 | 3 | 1 | 0.625 |
| `geKills` | 1388 | 1399 | 0.11 | 5 | 4 | 1 | 0.375 |
| `fire.total` | 13344 | 13454 | 1.1 | 5 | 4 | 1 | 0.375 |
| `fire.hits` | 5132 | 5167 | 0.35 | 5 | 3 | 2 | 1 |
| `retreatSamples` | 12231 | 12274 | 0.43 | 4 | 2 | 2 | 1 |
| `movementResolver.changes` | 213327 | 213216 | -1.11 | 4 | 1 | 3 | 0.625 |
| `grenades.throws` | 0 | 14 | 0.14 | 5 | 5 | 0 | 0.0625 |
| `grenades.bursts` | 0 | 13 | 0.13 | 5 | 5 | 0 | 0.0625 |
| `grenades.wounded` | 0 | 20 | 0.2 | 3 | 3 | 0 | 0.25 |
| `grenades.casualties` | 0 | 3 | 0.03 | 3 | 3 | 0 | 0.25 |
| `grenades.suppressed` | 0 | 40 | 0.4 | 5 | 5 | 0 | 0.0625 |
| `grenades.friendlyWounded` | 0 | 5 | 0.05 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 17 | 17 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 139 | 138 | -0.01 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 147 | 147 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2136 | 2135 | -0.01 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1459 | 1459 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 525 | 525 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 491 | 491 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1751 | 1751 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8592 | 8590.2 | -0.018 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.p10Overall` | 7754.200000000001 | 7754.6 | 0.004 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7361.100000000001 | 7360.200000000001 | -0.009 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanMovement` | 9899.800000000001 | 9900.2 | 0.004 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 9791.399999999996 | 9791.999999999996 | 0.006 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 8963.699999999997 | 8962.999999999998 | -0.007 | 4 | 1 | 3 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 5 seeds that part earliest (simulated seconds)

grenades-409-0015 240 s (timeline) · grenades-409-0008 265.05 s (timeline) · grenades-409-0013 276 s (timeline) · grenades-409-0031 278.1 s (timeline) · grenades-409-0006 292.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=518&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue409-grenade-vertical-slice/ai_flow_live.html?bench=518&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=518`); it opens the seed that parts earliest, and the dropdowns choose another.

