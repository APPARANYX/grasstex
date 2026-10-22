# Benchmark run #1262 · 100 seeds from `sector-clear-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0&verifySight=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 8ed5a81 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39815576432) · build v29-dev

## Verdict

**QUIET: 71 of 100 pairs changed (median first part 238.5 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.4% (p 0.6636)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **29** · runtime errors off 0 / on 0 · wall time on/off x1.004 (gate 1.25)
- the 24 changed records first part at simulated second: min 117, p10 138, median 238.5, p90 396, max 460.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4886 | 4868 | -0.18 | 21 | 9 | 12 | 0.6636 |
| `usKills` | 2338 | 2349 | 0.11 | 19 | 7 | 12 | 0.3593 |
| `geKills` | 2548 | 2519 | -0.29 | 21 | 9 | 12 | 0.6636 |
| `fire.total` | 22374 | 22602 | 2.28 | 22 | 10 | 12 | 0.8318 |
| `fire.hits` | 8836 | 8856 | 0.2 | 21 | 9 | 12 | 0.6636 |
| `retreatSamples` | 148051 | 150984 | 29.33 | 23 | 15 | 8 | 0.21 |
| `movementResolver.changes` | 220970 | 221211 | 2.41 | 24 | 13 | 11 | 0.8388 |
| `grenades.throws` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 213 | 214 | 0.01 | 14 | 5 | 9 | 0.424 |
| `loopAlerts.length` | 506 | 504 | -0.02 | 17 | 7 | 10 | 0.6291 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 396 | 402 | 0.06 | 16 | 11 | 5 | 0.2101 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 4 | 5 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1984 | 1997 | 0.13 | 21 | 12 | 9 | 0.6636 |
| `recon.contacts` | 207 | 215 | 0.08 | 13 | 9 | 4 | 0.2668 |
| `recon.noContact` | 1161 | 1155 | -0.06 | 16 | 6 | 10 | 0.4545 |
| `recon.timeouts` | 95 | 96 | 0.01 | 7 | 4 | 3 | 1 |
| `recon.cancelled` | 430 | 434 | 0.04 | 17 | 8 | 9 | 1 |
| `recon.reportsDelivered` | 806 | 807 | 0.01 | 17 | 9 | 8 | 1 |
| `recon.retriggerBlocked` | 1151 | 1143 | -0.08 | 18 | 6 | 12 | 0.2379 |
| `squadPerformance.meanOverall` | 8498.200000000003 | 8486.6 | -0.116 | 22 | 10 | 12 | 0.8318 |
| `squadPerformance.p10Overall` | 7720.800000000003 | 7702.100000000003 | -0.187 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7486.9000000000015 | 7444.9 | -0.42 | 22 | 10 | 12 | 0.8318 |
| `squadPerformance.meanMovement` | 9986.699999999992 | 9986.799999999994 | 0.001 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanControl` | 9683.100000000002 | 9690.900000000001 | 0.078 | 20 | 11 | 9 | 0.8238 |
| `squadPerformance.meanCohesion` | 8827.800000000005 | 8839.300000000005 | 0.115 | 23 | 13 | 10 | 0.6776 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-clear-20261022-0023 117 s (timeline) · sector-clear-20261022-0012 121.05 s (timeline) · sector-clear-20261022-0067 138 s (timeline) · sector-clear-20261022-0086 166.05 s (timeline) · sector-clear-20261022-0019 167.1 s (timeline) · sector-clear-20261022-0047 176.1 s (timeline) · sector-clear-20261022-0089 200.1 s (timeline) · sector-clear-20261022-0094 202.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1262&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1262&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1262`); it opens the seed that parts earliest, and the dropdowns choose another.

