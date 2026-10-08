# Benchmark run #380 · 60 seeds from `hill` (ge-defend), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 3004ab0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37735975803) · build v29-dev

## Verdict

**WEAK: 88 of 275 pairs changed (median first part 277.05 s); 1 of 32 counters under p 0.05 (about 1.6 by chance); casualties +1.0% (p 0.1078)**

- Under 0.05 only: recon.cancelled 1669 to 1691 (+1.3%, p 0.0309).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **187** · runtime errors off 0 / on 0 · wall time on/off x0.973 (gate 1.25)
- the 32 changed records first part at simulated second: min 55.05, p10 55.05, median 277.05, p90 480, max 549

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5502 | 5555 | 0.1927 | 25 | 17 | 8 | 0.1078 |
| `usKills` | 2681 | 2703 | 0.08 | 22 | 13 | 9 | 0.5235 |
| `geKills` | 2821 | 2852 | 0.1127 | 22 | 12 | 10 | 0.8318 |
| `fire.total` | 13044 | 13196 | 0.5527 | 26 | 14 | 12 | 0.845 |
| `fire.hits` | 4534 | 4554 | 0.0727 | 25 | 14 | 11 | 0.69 |
| `retreatSamples` | 79525 | 79081 | -1.6145 | 26 | 11 | 15 | 0.5572 |
| `movementResolver.changes` | 408275 | 408902 | 2.28 | 33 | 21 | 12 | 0.1628 |
| `movementStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 24 | -0.0036 | 3 | 1 | 2 | 1 |
| `loopAlerts.length` | 137 | 129 | -0.0291 | 10 | 3 | 7 | 0.3438 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 499 | 485 | -0.0509 | 13 | 5 | 8 | 0.5811 |
| `stallOutcomes.wakes` | 144 | 143 | -0.0036 | 8 | 3 | 5 | 0.7266 |
| `stallOutcomes.repeats` | 38 | 33 | -0.0182 | 5 | 0 | 5 | 0.0625 |
| `timeline.stalledOnsets` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 6909 | 6909 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11607 | 11768 | 0.5855 | 24 | 15 | 9 | 0.3075 |
| `recon.contacts` | 911 | 924 | 0.0473 | 19 | 13 | 6 | 0.1671 |
| `recon.noContact` | 4678 | 4736 | 0.2109 | 13 | 9 | 4 | 0.2668 |
| `recon.timeouts` | 3964 | 4021 | 0.2073 | 18 | 11 | 7 | 0.4807 |
| `recon.cancelled` | 1669 | 1691 | 0.08 | 18 | 14 | 4 | 0.0309 |
| `recon.reportsDelivered` | 4531 | 4633 | 0.3709 | 22 | 12 | 10 | 0.8318 |
| `recon.retriggerBlocked` | 4927 | 4983 | 0.2036 | 19 | 10 | 9 | 1 |
| `squadPerformance.meanOverall` | 24297.40000000001 | 24306.400000000005 | 0.0327 | 28 | 15 | 13 | 0.8506 |
| `squadPerformance.p10Overall` | 22643.399999999983 | 22634.499999999985 | -0.0324 | 18 | 8 | 10 | 0.8145 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21593.99999999998 | 21612.29999999998 | 0.0665 | 23 | 12 | 11 | 1 |
| `squadPerformance.meanMovement` | 27343.899999999998 | 27344.199999999997 | 0.0011 | 21 | 8 | 13 | 0.3833 |
| `squadPerformance.meanControl` | 27353.8 | 27356.999999999996 | 0.0116 | 20 | 13 | 7 | 0.2632 |
| `squadPerformance.meanCohesion` | 23240.9 | 23248.700000000008 | 0.0284 | 27 | 14 | 13 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0029 55.05 s (timeline) · hill-0031 122.1 s (timeline) · hill-0010 130.05 s (stress) · hill-0028 248.1 s (stress) · hill-0052 306 s (timeline) · hill-0030 391.05 s (timeline) · hill-0014 396.15 s (timeline) · hill-0016 459 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=380&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=380`); it opens the seed that parts earliest, and the dropdowns choose another.

