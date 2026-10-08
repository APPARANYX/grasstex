# Benchmark run #426 · 60 seeds from `wakefresh` (meeting), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 8e5f3ee · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778932697) · build v29-dev

## Verdict

**QUIET: 185 of 283 pairs changed (median first part 228 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.2% (p 0.7493)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Unpaired records: off 0, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **283** pairs (unpaired: off 0, on 2) · identical in every field: **98** · runtime errors off 0 / on 0 · wall time on/off x0.981 (gate 1.25)
- the 113 changed records first part at simulated second: min 37.05, p10 83.1, median 228, p90 447, max 582

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7813 | 7829 | 0.0565 | 88 | 46 | 42 | 0.7493 |
| `usKills` | 3658 | 3617 | -0.1449 | 81 | 43 | 38 | 0.657 |
| `geKills` | 4155 | 4212 | 0.2014 | 84 | 47 | 37 | 0.3261 |
| `fire.total` | 19836 | 20432 | 2.106 | 90 | 47 | 43 | 0.752 |
| `fire.hits` | 6873 | 6965 | 0.3251 | 86 | 46 | 40 | 0.59 |
| `retreatSamples` | 87369 | 87883 | 1.8163 | 86 | 40 | 46 | 0.59 |
| `movementResolver.changes` | 605042 | 605626 | 2.0636 | 107 | 43 | 64 | 0.0527 |
| `movementStalls.length` | 9 | 9 | 0 | 3 | 1 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 263 | 269 | 0.0212 | 50 | 24 | 26 | 0.8877 |
| `loopAlerts.length` | 202 | 237 | 0.1237 | 61 | 31 | 30 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 478 | 500 | 0.0777 | 48 | 28 | 20 | 0.3123 |
| `stallOutcomes.wakes` | 70 | 58 | -0.0424 | 17 | 5 | 12 | 0.1435 |
| `stallOutcomes.repeats` | 23 | 19 | -0.0141 | 7 | 2 | 5 | 0.4531 |
| `timeline.stalledOnsets` | 10 | 10 | 0 | 3 | 1 | 2 | 1 |
| `timeline.stalledSamples` | 877 | 763 | -0.4028 | 6 | 3 | 3 | 1 |
| `timeline.stalledOnsetsRepeated` | 27 | 29 | 0.0071 | 4 | 2 | 2 | 1 |
| `timeline.stalledSamplesRepeated` | 1652 | 1554 | -0.3463 | 7 | 3 | 4 | 1 |
| `recon.orders` | 6428 | 6445 | 0.0601 | 70 | 34 | 36 | 0.905 |
| `recon.contacts` | 243 | 243 | 0 | 45 | 21 | 24 | 0.766 |
| `recon.noContact` | 4329 | 4359 | 0.106 | 56 | 32 | 24 | 0.3497 |
| `recon.timeouts` | 252 | 244 | -0.0283 | 45 | 18 | 27 | 0.2327 |
| `recon.cancelled` | 1437 | 1432 | -0.0177 | 68 | 33 | 35 | 0.9036 |
| `recon.reportsDelivered` | 1143 | 1170 | 0.0954 | 45 | 27 | 18 | 0.2327 |
| `recon.retriggerBlocked` | 5004 | 5022 | 0.0636 | 63 | 32 | 31 | 1 |
| `squadPerformance.meanOverall` | 24610.50000000001 | 24627.90000000002 | 0.0615 | 97 | 49 | 48 | 1 |
| `squadPerformance.p10Overall` | 23122.09999999999 | 23116.99999999999 | -0.018 | 77 | 39 | 38 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20534.599999999988 | 20587.199999999997 | 0.1859 | 91 | 51 | 40 | 0.2945 |
| `squadPerformance.meanMovement` | 27977.499999999996 | 27978.000000000004 | 0.0018 | 83 | 45 | 38 | 0.5104 |
| `squadPerformance.meanControl` | 28008.30000000004 | 27999.099999999995 | -0.0325 | 81 | 39 | 42 | 0.8243 |
| `squadPerformance.meanCohesion` | 25083.600000000013 | 25052.699999999993 | -0.1092 | 93 | 44 | 49 | 0.6785 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

wakefresh-0044 37.05 s (stress) · wakefresh-0059 50.1 s (timeline) · wakefresh-0018 83.1 s (timeline) · wakefresh-0011 111 s (timeline) · wakefresh-0020 128.1 s (timeline) · wakefresh-0003 129 s (timeline) · wakefresh-0002 143.1 s (timeline) · wakefresh-0052 165 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=426&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=426`); it opens the seed that parts earliest, and the dropdowns choose another.

