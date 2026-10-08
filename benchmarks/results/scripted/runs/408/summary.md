# Benchmark run #408 · 60 seeds from `reconposts` (us-defend), windows `every60`

- **OFF** flags: `reconPosts=0` · **ON** flags: `none`
- claude/recon-skip-posted-men @ 27bbde4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37773148213) · build v29-dev

## Verdict

**MOVED: 491 of 564 pairs changed (median first part 194.1 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 7 under 0.0015; casualties +4.6% (p 0.0038)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 835970 to 858208 (+2.7%, p 0); recon.orders 22907 to 23601 (+3.0%, p 0); recon.noContact 9043 to 9630 (+6.5%, p 0); recon.cancelled 3304 to 3644 (+10.3%, p 0); recon.reportsDelivered 6793 to 5857 (-13.8%, p 0); recon.contacts 1460 to 1324 (-9.3%, p 0.0001); squadPerformance.meanOverall 50250.00000000005 to 50154.40000000005 (-0.2%, p 0.0001).
- Under 0.05 only: casualties 10907 to 11412 (+4.6%, p 0.0038); usKills 4813 to 5040 (+4.7%, p 0.0121); retreatSamples 84349 to 88567 (+5.0%, p 0.0205).

## Paired comparison (off against on)

- **564** pairs (unpaired: off 0, on 0) · identical in every field: **73** · runtime errors off 0 / on 0 · wall time on/off x0.983 (gate 1.25)
- the 344 changed records first part at simulated second: min 124.05, p10 142.05, median 194.1, p90 293.1, max 573

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 10907 | 11412 | 0.8954 | 288 | 169 | 119 | 0.0038 |
| `usKills` | 4813 | 5040 | 0.4025 | 281 | 162 | 119 | 0.0121 |
| `geKills` | 6094 | 6372 | 0.4929 | 260 | 141 | 119 | 0.1927 |
| `fire.total` | 13743 | 14784 | 1.8457 | 287 | 156 | 131 | 0.1565 |
| `fire.hits` | 4784 | 5110 | 0.578 | 267 | 142 | 125 | 0.3275 |
| `retreatSamples` | 84349 | 88567 | 7.4787 | 284 | 162 | 122 | 0.0205 |
| `movementResolver.changes` | 835970 | 858208 | 39.4291 | 354 | 238 | 116 | 0 |
| `movementStalls.length` | 16 | 21 | 0.0089 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 48 | 43 | -0.0089 | 52 | 26 | 26 | 1 |
| `loopAlerts.length` | 182 | 168 | -0.0248 | 88 | 48 | 40 | 0.4557 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 796 | 859 | 0.1117 | 149 | 82 | 67 | 0.2513 |
| `stallOutcomes.wakes` | 181 | 188 | 0.0124 | 89 | 45 | 44 | 1 |
| `stallOutcomes.repeats` | 29 | 25 | -0.0071 | 14 | 4 | 10 | 0.1796 |
| `timeline.stalledOnsets` | 16 | 21 | 0.0089 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 2376 | 2163 | -0.3777 | 4 | 1 | 3 | 0.625 |
| `timeline.stalledOnsetsRepeated` | 90 | 100 | 0.0177 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamplesRepeated` | 8807 | 8259 | -0.9716 | 5 | 0 | 5 | 0.0625 |
| `recon.orders` | 22907 | 23601 | 1.2305 | 285 | 191 | 94 | 0 |
| `recon.contacts` | 1460 | 1324 | -0.2411 | 252 | 95 | 157 | 0.0001 |
| `recon.noContact` | 9043 | 9630 | 1.0408 | 213 | 164 | 49 | 0 |
| `recon.timeouts` | 8174 | 8041 | -0.2358 | 232 | 106 | 126 | 0.2122 |
| `recon.cancelled` | 3304 | 3644 | 0.6028 | 275 | 189 | 86 | 0 |
| `recon.reportsDelivered` | 6793 | 5857 | -1.6596 | 268 | 96 | 172 | 0 |
| `recon.retriggerBlocked` | 9075 | 9234 | 0.2819 | 246 | 136 | 110 | 0.1108 |
| `squadPerformance.meanOverall` | 50250.00000000005 | 50154.40000000005 | -0.1695 | 309 | 120 | 189 | 0.0001 |
| `squadPerformance.p10Overall` | 46838.799999999814 | 46774.89999999979 | -0.1133 | 202 | 91 | 111 | 0.1811 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0018 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 45104.80000000003 | 44845.800000000025 | -0.4592 | 292 | 136 | 156 | 0.2662 |
| `squadPerformance.meanMovement` | 56065.60000000006 | 56069.30000000003 | 0.0066 | 214 | 105 | 109 | 0.8376 |
| `squadPerformance.meanControl` | 56239.00000000004 | 56240.00000000008 | 0.0018 | 181 | 98 | 83 | 0.298 |
| `squadPerformance.meanCohesion` | 46957.29999999996 | 46857.79999999991 | -0.1764 | 309 | 147 | 162 | 0.4258 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

reconposts-0030 124.05 s (timeline) · reconposts-0059 128.1 s (stress) · reconposts-0041 136.05 s (stress) · reconposts-0034 137.1 s (timeline) · reconposts-0016 142.05 s (timeline) · reconposts-0045 155.1 s (stress) · reconposts-0006 156 s (stress) · reconposts-0053 156 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=408&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=408`); it opens the seed that parts earliest, and the dropdowns choose another.

