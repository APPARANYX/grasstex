# Benchmark run #1262 · 100 seeds from `sector-clear-20261022` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0&verifySight=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 8ed5a81 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39815576432) · build v29-dev

## Verdict

**QUIET: 70 of 95 pairs changed (median first part 238.5 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.4% (p 0.6636)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **95** pairs (unpaired: off 0, on 0) · identical in every field: **25** · runtime errors off 0 / on 0 · wall time on/off x0.983 (gate 1.25)
- the 24 changed records first part at simulated second: min 117, p10 138, median 238.5, p90 396, max 460.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4652 | 4634 | -0.1895 | 21 | 9 | 12 | 0.6636 |
| `usKills` | 2232 | 2243 | 0.1158 | 19 | 7 | 12 | 0.3593 |
| `geKills` | 2420 | 2391 | -0.3053 | 21 | 9 | 12 | 0.6636 |
| `fire.total` | 21380 | 21608 | 2.4 | 22 | 10 | 12 | 0.8318 |
| `fire.hits` | 8427 | 8447 | 0.2105 | 21 | 9 | 12 | 0.6636 |
| `retreatSamples` | 141799 | 144732 | 30.8737 | 23 | 15 | 8 | 0.21 |
| `movementResolver.changes` | 211297 | 211538 | 2.5368 | 24 | 13 | 11 | 0.8388 |
| `grenades.throws` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 206 | 207 | 0.0105 | 14 | 5 | 9 | 0.424 |
| `loopAlerts.length` | 471 | 469 | -0.0211 | 17 | 7 | 10 | 0.6291 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 381 | 387 | 0.0632 | 16 | 11 | 5 | 0.2101 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 2 | 3 | 0.0105 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1884 | 1897 | 0.1368 | 21 | 12 | 9 | 0.6636 |
| `recon.contacts` | 191 | 199 | 0.0842 | 13 | 9 | 4 | 0.2668 |
| `recon.noContact` | 1109 | 1103 | -0.0632 | 16 | 6 | 10 | 0.4545 |
| `recon.timeouts` | 89 | 90 | 0.0105 | 7 | 4 | 3 | 1 |
| `recon.cancelled` | 412 | 416 | 0.0421 | 17 | 8 | 9 | 1 |
| `recon.reportsDelivered` | 758 | 759 | 0.0105 | 17 | 9 | 8 | 1 |
| `recon.retriggerBlocked` | 1099 | 1091 | -0.0842 | 18 | 6 | 12 | 0.2379 |
| `squadPerformance.meanOverall` | 8064.500000000002 | 8052.899999999999 | -0.1221 | 22 | 10 | 12 | 0.8318 |
| `squadPerformance.p10Overall` | 7322.700000000002 | 7304.000000000002 | -0.1968 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7096.000000000002 | 7054 | -0.4421 | 22 | 10 | 12 | 0.8318 |
| `squadPerformance.meanMovement` | 9487.399999999992 | 9487.499999999995 | 0.0011 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanControl` | 9202.100000000002 | 9209.900000000001 | 0.0821 | 20 | 11 | 9 | 0.8238 |
| `squadPerformance.meanCohesion` | 8380.600000000004 | 8392.100000000004 | 0.1211 | 23 | 13 | 10 | 0.6776 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-clear-20261022-0023 117 s (timeline) · sector-clear-20261022-0012 121.05 s (timeline) · sector-clear-20261022-0067 138 s (timeline) · sector-clear-20261022-0086 166.05 s (timeline) · sector-clear-20261022-0019 167.1 s (timeline) · sector-clear-20261022-0047 176.1 s (timeline) · sector-clear-20261022-0089 200.1 s (timeline) · sector-clear-20261022-0094 202.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1262&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1262&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1262`); it opens the seed that parts earliest, and the dropdowns choose another.

