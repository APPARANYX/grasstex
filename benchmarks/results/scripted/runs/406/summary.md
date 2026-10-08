# Benchmark run #406 · 60 seeds from `control` (ge-defend), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 8e5f3ee · [run](https://github.com/APPARANYX/grasstex/actions/runs/37772774316) · build v29-dev

## Verdict

**MOVED: 91 of 276 pairs changed (median first part 145.05 s); 2 of 34 counters under p 0.05 (about 1.7 by chance), 1 under 0.0015; casualties +1.0% (p 1)**

- Clears the Bonferroni line (p < 0.0015): recon.cancelled 1751 to 1693 (-3.3%, p 0.0009).
- Under 0.05 only: recon.retriggerBlocked 4795 to 4831 (+0.8%, p 0.0106).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **185** · runtime errors off 0 / on 0 · wall time on/off x0.965 (gate 1.25)
- the 44 changed records first part at simulated second: min 34.05, p10 34.05, median 145.05, p90 416.1, max 543

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5336 | 5388 | 0.1884 | 33 | 17 | 16 | 1 |
| `usKills` | 2359 | 2390 | 0.1123 | 29 | 16 | 13 | 0.7111 |
| `geKills` | 2977 | 2998 | 0.0761 | 26 | 13 | 13 | 1 |
| `fire.total` | 13127 | 13068 | -0.2138 | 33 | 13 | 20 | 0.2962 |
| `fire.hits` | 4589 | 4584 | -0.0181 | 31 | 14 | 17 | 0.7201 |
| `retreatSamples` | 74750 | 76986 | 8.1014 | 34 | 21 | 13 | 0.2295 |
| `movementResolver.changes` | 405355 | 403361 | -7.2246 | 43 | 18 | 25 | 0.3604 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 22 | -0.0181 | 7 | 2 | 5 | 0.4531 |
| `loopAlerts.length` | 133 | 130 | -0.0109 | 16 | 7 | 9 | 0.8036 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 332 | 341 | 0.0326 | 19 | 11 | 8 | 0.6476 |
| `stallOutcomes.wakes` | 134 | 133 | -0.0036 | 12 | 5 | 7 | 0.7744 |
| `stallOutcomes.repeats` | 22 | 23 | 0.0036 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 157 | 157 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11448 | 11421 | -0.0978 | 34 | 16 | 18 | 0.8642 |
| `recon.contacts` | 764 | 773 | 0.0326 | 21 | 11 | 10 | 1 |
| `recon.noContact` | 4466 | 4489 | 0.0833 | 24 | 14 | 10 | 0.5413 |
| `recon.timeouts` | 4108 | 4113 | 0.0181 | 21 | 10 | 11 | 1 |
| `recon.cancelled` | 1751 | 1693 | -0.2101 | 25 | 4 | 21 | 0.0009 |
| `recon.reportsDelivered` | 3580 | 3739 | 0.5761 | 26 | 16 | 10 | 0.3269 |
| `recon.retriggerBlocked` | 4795 | 4831 | 0.1304 | 23 | 18 | 5 | 0.0106 |
| `squadPerformance.meanOverall` | 24458 | 24437.500000000007 | -0.0743 | 36 | 13 | 23 | 0.1325 |
| `squadPerformance.p10Overall` | 22835.59999999998 | 22799.299999999977 | -0.1315 | 27 | 10 | 17 | 0.2478 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21951.59999999996 | 21872.89999999996 | -0.2851 | 32 | 12 | 20 | 0.2153 |
| `squadPerformance.meanMovement` | 27398.499999999993 | 27411.199999999983 | 0.046 | 29 | 15 | 14 | 1 |
| `squadPerformance.meanControl` | 27454.499999999978 | 27455.199999999975 | 0.0025 | 26 | 16 | 10 | 0.3269 |
| `squadPerformance.meanCohesion` | 23037.199999999993 | 23084.299999999992 | 0.1707 | 37 | 19 | 18 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0059 34.05 s (stress) · control-0034 46.05 s (timeline) · control-0050 53.1 s (timeline) · control-0024 95.1 s (timeline) · control-0036 145.05 s (timeline) · control-0042 171 s (timeline) · control-0005 312 s (timeline) · control-0037 339 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=406&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=406`); it opens the seed that parts earliest, and the dropdowns choose another.

