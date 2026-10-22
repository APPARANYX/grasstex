# Benchmark run #1253 · 50 seeds from `rearch-classic-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1`
- main @ eba6c71 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39798433316) · build v29-dev

## Verdict

**MOVED: 48 of 48 pairs changed (median first part 151.05 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties -1.1% (p 0.6271)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 1243 to 1002 (-19.4%, p 0); recon.contacts 148 to 78 (-47.3%, p 0.0001); recon.cancelled 362 to 240 (-33.7%, p 0.0008).
- Under 0.05 only: recon.reportsDelivered 592 to 345 (-41.7%, p 0.0051).

## Paired comparison (off against on)

- **48** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.951 (gate 1.25)
- the 42 changed records first part at simulated second: min 95.1, p10 114, median 151.05, p90 213, max 295.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2281 | 2257 | -0.5 | 38 | 17 | 21 | 0.6271 |
| `usKills` | 1041 | 1076 | 0.7292 | 40 | 19 | 21 | 0.8746 |
| `geKills` | 1240 | 1181 | -1.2292 | 41 | 20 | 21 | 1 |
| `fire.total` | 11436 | 11458 | 0.4583 | 42 | 21 | 21 | 1 |
| `fire.hits` | 4387 | 4381 | -0.125 | 42 | 18 | 24 | 0.4408 |
| `retreatSamples` | 74363 | 81321 | 144.9583 | 42 | 27 | 15 | 0.0884 |
| `movementResolver.changes` | 104464 | 101865 | -54.1458 | 42 | 19 | 23 | 0.644 |
| `grenades.throws` | 11 | 12 | 0.0208 | 7 | 4 | 3 | 1 |
| `grenades.bursts` | 11 | 12 | 0.0208 | 7 | 4 | 3 | 1 |
| `grenades.wounded` | 4 | 13 | 0.1875 | 5 | 3 | 2 | 1 |
| `grenades.casualties` | 1 | 6 | 0.1042 | 3 | 2 | 1 | 1 |
| `grenades.suppressed` | 16 | 19 | 0.0625 | 6 | 3 | 3 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 1 | 0.0208 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 91 | 105 | 0.2917 | 36 | 21 | 15 | 0.405 |
| `loopAlerts.length` | 274 | 289 | 0.3125 | 38 | 25 | 13 | 0.073 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 191 | 198 | 0.1458 | 36 | 20 | 16 | 0.6177 |
| `stallOutcomes.wakes` | 1 | 3 | 0.0417 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0208 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1243 | 1002 | -5.0208 | 40 | 5 | 35 | 0 |
| `recon.contacts` | 148 | 78 | -1.4583 | 33 | 5 | 28 | 0.0001 |
| `recon.noContact` | 596 | 568 | -0.5833 | 36 | 12 | 24 | 0.0652 |
| `recon.timeouts` | 57 | 48 | -0.1875 | 23 | 8 | 15 | 0.21 |
| `recon.cancelled` | 362 | 240 | -2.5417 | 37 | 8 | 29 | 0.0008 |
| `recon.reportsDelivered` | 592 | 345 | -5.1458 | 38 | 10 | 28 | 0.0051 |
| `recon.retriggerBlocked` | 601 | 582 | -0.3958 | 35 | 15 | 20 | 0.4996 |
| `squadPerformance.meanOverall` | 4081.8 | 4063.6 | -0.3792 | 42 | 18 | 24 | 0.4408 |
| `squadPerformance.p10Overall` | 3721.5000000000005 | 3702.2999999999997 | -0.4 | 22 | 8 | 14 | 0.2863 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3556.299999999999 | 3510.3999999999983 | -0.9562 | 42 | 19 | 23 | 0.644 |
| `squadPerformance.meanMovement` | 4795.400000000001 | 4795.000000000001 | -0.0083 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.meanControl` | 4640.000000000001 | 4631.3 | -0.1812 | 41 | 14 | 27 | 0.0596 |
| `squadPerformance.meanCohesion` | 4311.799999999999 | 4332.7 | 0.4354 | 40 | 23 | 17 | 0.4296 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0011 95.1 s (timeline) · rearch-classic-20261022-0044 109.05 s (timeline) · rearch-classic-20261022-0001 113.1 s (timeline) · rearch-classic-20261022-0024 114 s (timeline) · rearch-classic-20261022-0027 114 s (timeline) · rearch-classic-20261022-0039 116.1 s (stress) · rearch-classic-20261022-0012 118.05 s (timeline) · rearch-classic-20261022-0030 118.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1253&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1253`); it opens the seed that parts earliest, and the dropdowns choose another.

