# Benchmark run #388 · 60 seeds from `hill` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ c8ab9c6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37739002309) · build v29-dev

## Verdict

**MOVED: 249 of 282 pairs changed (median first part 207 s); 11 of 34 counters under p 0.05 (about 1.7 by chance), 5 under 0.0015; casualties +7.7% (p 0.0001)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 605796 to 636515 (+5.1%, p 0); casualties 7448 to 8021 (+7.7%, p 0.0001); fire.hits 6334 to 7143 (+12.8%, p 0.0002); stallOutcomes.wakes 52 to 22 (-57.7%, p 0.0006); geKills 3782 to 4380 (+15.8%, p 0.001).
- Under 0.05 only: stallOutcomes.repeats 25 to 8 (-68.0%, p 0.0041); recon.timeouts 220 to 191 (-13.2%, p 0.0045); loopAlerts.length 235 to 309 (+31.5%, p 0.0111); regroups.entries 515 to 581 (+12.8%, p 0.0346); recon.noContact 4352 to 4408 (+1.3%, p 0.038); fire.total 18285 to 20208 (+10.5%, p 0.0439).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **282** pairs (unpaired: off 2, on 2) · identical in every field: **33** · runtime errors off 0 / on 0 · wall time on/off x0.976 (gate 1.25)
- the 192 changed records first part at simulated second: min 65.1, p10 141, median 207, p90 267, max 398.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7448 | 8021 | 2.0319 | 171 | 111 | 60 | 0.0001 |
| `usKills` | 3666 | 3641 | -0.0887 | 166 | 87 | 79 | 0.5871 |
| `geKills` | 3782 | 4380 | 2.1206 | 172 | 108 | 64 | 0.001 |
| `fire.total` | 18285 | 20208 | 6.8191 | 180 | 104 | 76 | 0.0439 |
| `fire.hits` | 6334 | 7143 | 2.8688 | 173 | 111 | 62 | 0.0002 |
| `retreatSamples` | 88553 | 91941 | 12.0142 | 179 | 102 | 77 | 0.0725 |
| `movementResolver.changes` | 605796 | 636515 | 108.9326 | 191 | 145 | 46 | 0 |
| `movementStalls.length` | 14 | 15 | 0.0035 | 4 | 2 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 300 | 282 | -0.0638 | 105 | 49 | 56 | 0.5584 |
| `loopAlerts.length` | 235 | 309 | 0.2624 | 114 | 71 | 43 | 0.0111 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 515 | 581 | 0.234 | 109 | 66 | 43 | 0.0346 |
| `stallOutcomes.wakes` | 52 | 22 | -0.1064 | 43 | 10 | 33 | 0.0006 |
| `stallOutcomes.repeats` | 25 | 8 | -0.0603 | 25 | 5 | 20 | 0.0041 |
| `timeline.stalledOnsets` | 15 | 19 | 0.0142 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamples` | 593 | 647 | 0.1915 | 5 | 3 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 55 | 64 | 0.0319 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamplesRepeated` | 1886 | 1964 | 0.2766 | 8 | 3 | 5 | 0.7266 |
| `recon.orders` | 6407 | 6492 | 0.3014 | 143 | 79 | 64 | 0.2416 |
| `recon.contacts` | 253 | 281 | 0.0993 | 88 | 51 | 37 | 0.1654 |
| `recon.noContact` | 4352 | 4408 | 0.1986 | 113 | 68 | 45 | 0.038 |
| `recon.timeouts` | 220 | 191 | -0.1028 | 85 | 29 | 56 | 0.0045 |
| `recon.cancelled` | 1403 | 1429 | 0.0922 | 141 | 79 | 62 | 0.1776 |
| `recon.reportsDelivered` | 1290 | 1319 | 0.1028 | 90 | 46 | 44 | 0.9161 |
| `recon.retriggerBlocked` | 4956 | 4983 | 0.0957 | 134 | 67 | 67 | 1 |
| `squadPerformance.meanOverall` | 24430.19999999998 | 24531.199999999997 | 0.3582 | 181 | 85 | 96 | 0.4574 |
| `squadPerformance.p10Overall` | 23049.499999999978 | 23088.29999999998 | 0.1376 | 143 | 65 | 78 | 0.3156 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20418.699999999997 | 20526.79999999999 | 0.3833 | 180 | 92 | 88 | 0.8231 |
| `squadPerformance.meanMovement` | 27778.399999999994 | 27900.399999999983 | 0.4326 | 170 | 86 | 84 | 0.9389 |
| `squadPerformance.meanControl` | 27793.599999999995 | 27878.700000000015 | 0.3018 | 165 | 77 | 88 | 0.4364 |
| `squadPerformance.meanCohesion` | 24730.60000000002 | 24824.5 | 0.333 | 181 | 98 | 83 | 0.298 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0016 65.1 s (timeline) · hill-0017 72 s (timeline) · hill-0046 119.1 s (timeline) · hill-0052 133.05 s (timeline) · hill-0059 141 s (timeline) · hill-0031 143.1 s (timeline) · hill-0060 166.05 s (stress) · hill-0002 170.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=388&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=388`); it opens the seed that parts earliest, and the dropdowns choose another.

