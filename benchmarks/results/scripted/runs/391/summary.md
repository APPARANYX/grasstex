# Benchmark run #391 · 60 seeds from `hill` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ c8ab9c6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37743672456) · build v29-dev

## Verdict

**MOVED: 257 of 275 pairs changed (median first part 168 s); 11 of 34 counters under p 0.05 (about 1.7 by chance), 10 under 0.0015; casualties +21.5% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5587 to 6787 (+21.5%, p 0); geKills 2926 to 3881 (+32.6%, p 0); fire.total 13199 to 16632 (+26.0%, p 0); fire.hits 4616 to 5644 (+22.3%, p 0); retreatSamples 80917 to 91035 (+12.5%, p 0); movementResolver.changes 408839 to 465712 (+13.9%, p 0); stallOutcomes.wakes 137 to 25 (-81.8%, p 0); stallOutcomes.repeats 35 to 0 (-100.0%, p 0); recon.cancelled 1704 to 1958 (+14.9%, p 0); recon.orders 11610 to 12271 (+5.7%, p 0.0001).
- Under 0.05 only: recon.retriggerBlocked 4902 to 5089 (+3.8%, p 0.0325).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x0.982 (gate 1.25)
- the 214 changed records first part at simulated second: min 55.05, p10 119.1, median 168, p90 215.1, max 363

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5587 | 6787 | 4.3636 | 192 | 143 | 49 | 0 |
| `usKills` | 2661 | 2906 | 0.8909 | 185 | 104 | 81 | 0.1055 |
| `geKills` | 2926 | 3881 | 3.4727 | 195 | 143 | 52 | 0 |
| `fire.total` | 13199 | 16632 | 12.4836 | 200 | 136 | 64 | 0 |
| `fire.hits` | 4616 | 5644 | 3.7382 | 198 | 136 | 62 | 0 |
| `retreatSamples` | 80917 | 91035 | 36.7927 | 195 | 128 | 67 | 0 |
| `movementResolver.changes` | 408839 | 465712 | 206.8109 | 214 | 187 | 27 | 0 |
| `movementStalls.length` | 0 | 2 | 0.0073 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 32 | 0.0255 | 39 | 21 | 18 | 0.7493 |
| `loopAlerts.length` | 146 | 199 | 0.1927 | 119 | 69 | 50 | 0.0985 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 474 | 501 | 0.0982 | 116 | 65 | 51 | 0.2273 |
| `stallOutcomes.wakes` | 137 | 25 | -0.4073 | 78 | 5 | 73 | 0 |
| `stallOutcomes.repeats` | 35 | 0 | -0.1273 | 27 | 0 | 27 | 0 |
| `timeline.stalledOnsets` | 0 | 3 | 0.0109 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamples` | 0 | 102 | 0.3709 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 4 | 0.0145 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamplesRepeated` | 0 | 102 | 0.3709 | 1 | 1 | 0 | 1 |
| `recon.orders` | 11610 | 12271 | 2.4036 | 170 | 111 | 59 | 0.0001 |
| `recon.contacts` | 909 | 987 | 0.2836 | 156 | 82 | 74 | 0.5753 |
| `recon.noContact` | 4635 | 4815 | 0.6545 | 112 | 65 | 47 | 0.1078 |
| `recon.timeouts` | 3980 | 4074 | 0.3418 | 159 | 80 | 79 | 1 |
| `recon.cancelled` | 1704 | 1958 | 0.9236 | 186 | 127 | 59 | 0 |
| `recon.reportsDelivered` | 4431 | 4861 | 1.5636 | 177 | 98 | 79 | 0.1759 |
| `recon.retriggerBlocked` | 4902 | 5089 | 0.68 | 160 | 94 | 66 | 0.0325 |
| `squadPerformance.meanOverall` | 24286.4 | 24241.69999999998 | -0.1625 | 201 | 94 | 107 | 0.3974 |
| `squadPerformance.p10Overall` | 22635.79999999998 | 22516.39999999998 | -0.4342 | 160 | 73 | 87 | 0.3041 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21521.499999999985 | 21347.499999999985 | -0.6327 | 200 | 88 | 112 | 0.1036 |
| `squadPerformance.meanMovement` | 27337.700000000004 | 27318.50000000001 | -0.0698 | 171 | 82 | 89 | 0.6465 |
| `squadPerformance.meanControl` | 27350.3 | 27356.899999999994 | 0.024 | 176 | 99 | 77 | 0.1132 |
| `squadPerformance.meanCohesion` | 23317.399999999998 | 23265.199999999997 | -0.1898 | 206 | 107 | 99 | 0.6259 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0029 55.05 s (timeline) · hill-0043 94.05 s (timeline) · hill-0031 106.05 s (timeline) · hill-0013 107.1 s (timeline) · hill-0024 119.1 s (timeline) · hill-0045 123 s (timeline) · hill-0019 128.1 s (timeline) · hill-0010 130.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=391&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=391`); it opens the seed that parts earliest, and the dropdowns choose another.

