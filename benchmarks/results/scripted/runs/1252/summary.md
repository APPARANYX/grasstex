# Benchmark run #1252 · 50 seeds from `rearch-classic-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39793926623) · build v29-dev

## Verdict

**WEAK: 50 of 50 pairs changed (median first part 150.6 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.6% (p 1)**

- Under 0.05 only: recon.orders 1256 to 1098 (-12.6%, p 0.0015); recon.cancelled 361 to 257 (-28.8%, p 0.0076); recon.contacts 126 to 87 (-31.0%, p 0.0113).

## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.034 (gate 1.25)
- the 44 changed records first part at simulated second: min 95.1, p10 115.05, median 150.6, p90 204, max 270

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2397 | 2358 | -0.78 | 41 | 21 | 20 | 1 |
| `usKills` | 1074 | 1015 | -1.18 | 41 | 21 | 20 | 1 |
| `geKills` | 1323 | 1343 | 0.4 | 41 | 21 | 20 | 1 |
| `fire.total` | 11635 | 10965 | -13.4 | 44 | 16 | 28 | 0.0961 |
| `fire.hits` | 4497 | 4387 | -2.2 | 44 | 21 | 23 | 0.8804 |
| `retreatSamples` | 79935 | 75572 | -87.26 | 44 | 17 | 27 | 0.1742 |
| `movementResolver.changes` | 109651 | 112485 | 56.68 | 43 | 28 | 15 | 0.066 |
| `grenades.throws` | 5 | 4 | -0.02 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 5 | 4 | -0.02 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 7 | 1 | -0.12 | 2 | 0 | 2 | 0.5 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 134 | 125 | -0.18 | 37 | 14 | 23 | 0.1877 |
| `loopAlerts.length` | 258 | 213 | -0.9 | 42 | 17 | 25 | 0.28 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 161 | 177 | 0.32 | 39 | 20 | 19 | 1 |
| `stallOutcomes.wakes` | 0 | 1 | 0.02 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1256 | 1098 | -3.16 | 41 | 10 | 31 | 0.0015 |
| `recon.contacts` | 126 | 87 | -0.78 | 36 | 10 | 26 | 0.0113 |
| `recon.noContact` | 655 | 629 | -0.52 | 36 | 14 | 22 | 0.243 |
| `recon.timeouts` | 52 | 53 | 0.02 | 23 | 13 | 10 | 0.6776 |
| `recon.cancelled` | 361 | 257 | -2.08 | 37 | 10 | 27 | 0.0076 |
| `recon.reportsDelivered` | 501 | 361 | -2.8 | 42 | 15 | 27 | 0.0884 |
| `recon.retriggerBlocked` | 672 | 666 | -0.12 | 42 | 19 | 23 | 0.644 |
| `squadPerformance.meanOverall` | 4239.700000000001 | 4254.400000000001 | 0.294 | 44 | 28 | 16 | 0.0961 |
| `squadPerformance.p10Overall` | 3863.8 | 3867.3999999999996 | 0.072 | 25 | 13 | 12 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3693.2 | 3745.0999999999995 | 1.038 | 43 | 25 | 18 | 0.3604 |
| `squadPerformance.meanMovement` | 4993.8 | 4993.3 | -0.01 | 20 | 8 | 12 | 0.5034 |
| `squadPerformance.meanControl` | 4842.6 | 4842.800000000002 | 0.004 | 43 | 22 | 21 | 1 |
| `squadPerformance.meanCohesion` | 4479.599999999999 | 4461.500000000002 | -0.362 | 44 | 22 | 22 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0011 95.1 s (timeline) · rearch-classic-20261022-0001 100.05 s (timeline) · rearch-classic-20261022-0026 110.1 s (timeline) · rearch-classic-20261022-0027 114 s (stress) · rearch-classic-20261022-0039 115.05 s (stress) · rearch-classic-20261022-0016 117 s (timeline) · rearch-classic-20261022-0030 118.05 s (timeline) · rearch-classic-20261022-0031 118.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1252&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1252&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1252`); it opens the seed that parts earliest, and the dropdowns choose another.

