# Benchmark run #386 · 60 seeds from `hill` (ge-defend), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 5193c96 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37738996850) · build v29-dev

## Verdict

**WEAK: 86 of 275 pairs changed (median first part 248.1 s); 1 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.6% (p 0.4049)**

- Under 0.05 only: recon.cancelled 1704 to 1726 (+1.3%, p 0.0213).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **189** · runtime errors off 0 / on 0 · wall time on/off x0.991 (gate 1.25)
- the 27 changed records first part at simulated second: min 55.05, p10 55.05, median 248.1, p90 480, max 519

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5587 | 5621 | 0.1236 | 23 | 14 | 9 | 0.4049 |
| `usKills` | 2661 | 2667 | 0.0218 | 21 | 11 | 10 | 1 |
| `geKills` | 2926 | 2954 | 0.1018 | 20 | 10 | 10 | 1 |
| `fire.total` | 13199 | 13322 | 0.4473 | 23 | 12 | 11 | 1 |
| `fire.hits` | 4616 | 4616 | 0 | 22 | 11 | 11 | 1 |
| `retreatSamples` | 80917 | 80526 | -1.4218 | 23 | 10 | 13 | 0.6776 |
| `movementResolver.changes` | 408839 | 409226 | 1.4073 | 28 | 17 | 11 | 0.3449 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 23 | -0.0073 | 4 | 1 | 3 | 0.625 |
| `loopAlerts.length` | 146 | 136 | -0.0364 | 10 | 3 | 7 | 0.3438 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 474 | 462 | -0.0436 | 11 | 5 | 6 | 1 |
| `stallOutcomes.wakes` | 137 | 136 | -0.0036 | 8 | 3 | 5 | 0.7266 |
| `stallOutcomes.repeats` | 35 | 30 | -0.0182 | 5 | 0 | 5 | 0.0625 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11610 | 11775 | 0.6 | 19 | 13 | 6 | 0.1671 |
| `recon.contacts` | 909 | 923 | 0.0509 | 16 | 12 | 4 | 0.0768 |
| `recon.noContact` | 4635 | 4697 | 0.2255 | 11 | 8 | 3 | 0.2266 |
| `recon.timeouts` | 3980 | 4036 | 0.2036 | 16 | 10 | 6 | 0.4545 |
| `recon.cancelled` | 1704 | 1726 | 0.08 | 16 | 13 | 3 | 0.0213 |
| `recon.reportsDelivered` | 4431 | 4561 | 0.4727 | 20 | 13 | 7 | 0.2632 |
| `recon.retriggerBlocked` | 4902 | 4961 | 0.2145 | 18 | 10 | 8 | 0.8145 |
| `squadPerformance.meanOverall` | 24286.4 | 24296.499999999996 | 0.0367 | 23 | 14 | 9 | 0.4049 |
| `squadPerformance.p10Overall` | 22635.79999999998 | 22635.799999999985 | 0 | 15 | 7 | 8 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21521.499999999985 | 21538.699999999986 | 0.0625 | 21 | 11 | 10 | 1 |
| `squadPerformance.meanMovement` | 27337.700000000004 | 27342.299999999996 | 0.0167 | 19 | 9 | 10 | 1 |
| `squadPerformance.meanControl` | 27350.3 | 27354.1 | 0.0138 | 19 | 12 | 7 | 0.3593 |
| `squadPerformance.meanCohesion` | 23317.399999999998 | 23325.600000000006 | 0.0298 | 24 | 14 | 10 | 0.5413 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0029 55.05 s (timeline) · hill-0031 122.1 s (timeline) · hill-0010 130.05 s (stress) · hill-0028 248.1 s (stress) · hill-0052 306 s (timeline) · hill-0014 435.15 s (timeline) · hill-0016 459 s (stress) · hill-0059 480 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=386&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=386`); it opens the seed that parts earliest, and the dropdowns choose another.

