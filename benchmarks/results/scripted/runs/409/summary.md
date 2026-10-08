# Benchmark run #409 · 60 seeds from `reconposts` (ge-defend), windows `every60`

- **OFF** flags: `reconPosts=0` · **ON** flags: `none`
- claude/recon-skip-posted-men @ 27bbde4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37773151770) · build v29-dev

## Verdict

**MOVED: 513 of 564 pairs changed (median first part 184.05 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 1 under 0.0015; casualties -1.1% (p 0.5004)**

- Clears the Bonferroni line (p < 0.0015): recon.noContact 9886 to 10237 (+3.6%, p 0).
- Under 0.05 only: movementResolver.changes 802650 to 802759 (+0.0%, p 0.0049); recon.orders 24205 to 24422 (+0.9%, p 0.0077); squadPerformance.meanMission 45239.89999999999 to 45442.49999999997 (+0.4%, p 0.0133); recon.timeouts 8280 to 8140 (-1.7%, p 0.0175); geKills 5736 to 5537 (-3.5%, p 0.0232); timeline.stalledOnsetsRepeated 36 to 24 (-33.3%, p 0.0313); timeline.stalledSamplesRepeated 843 to 412 (-51.1%, p 0.0313); usKills 4686 to 4774 (+1.9%, p 0.0376); recon.reportsDelivered 9260 to 8808 (-4.9%, p 0.041).

## Paired comparison (off against on)

- **564** pairs (unpaired: off 0, on 0) · identical in every field: **51** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- the 376 changed records first part at simulated second: min 106.05, p10 126, median 184.05, p90 278.1, max 529.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 10422 | 10311 | -0.1968 | 317 | 152 | 165 | 0.5004 |
| `usKills` | 4686 | 4774 | 0.156 | 284 | 160 | 124 | 0.0376 |
| `geKills` | 5736 | 5537 | -0.3528 | 296 | 128 | 168 | 0.0232 |
| `fire.total` | 13262 | 13425 | 0.289 | 311 | 158 | 153 | 0.8206 |
| `fire.hits` | 4640 | 4805 | 0.2926 | 303 | 164 | 139 | 0.1679 |
| `retreatSamples` | 77111 | 75940 | -2.0762 | 310 | 144 | 166 | 0.2329 |
| `movementResolver.changes` | 802650 | 802759 | 0.1933 | 384 | 220 | 164 | 0.0049 |
| `movementStalls.length` | 4 | 3 | -0.0018 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 28 | 29 | 0.0018 | 29 | 15 | 14 | 1 |
| `loopAlerts.length` | 139 | 127 | -0.0213 | 97 | 47 | 50 | 0.8392 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 619 | 677 | 0.1028 | 199 | 109 | 90 | 0.2018 |
| `stallOutcomes.wakes` | 183 | 177 | -0.0106 | 88 | 41 | 47 | 0.5943 |
| `stallOutcomes.repeats` | 19 | 17 | -0.0035 | 14 | 5 | 9 | 0.424 |
| `timeline.stalledOnsets` | 5 | 3 | -0.0035 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 142 | 60 | -0.1454 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 36 | 24 | -0.0213 | 6 | 0 | 6 | 0.0313 |
| `timeline.stalledSamplesRepeated` | 843 | 412 | -0.7642 | 6 | 0 | 6 | 0.0313 |
| `recon.orders` | 24205 | 24422 | 0.3848 | 312 | 180 | 132 | 0.0077 |
| `recon.contacts` | 1794 | 1721 | -0.1294 | 267 | 120 | 147 | 0.1114 |
| `recon.noContact` | 9886 | 10237 | 0.6223 | 236 | 163 | 73 | 0 |
| `recon.timeouts` | 8280 | 8140 | -0.2482 | 270 | 115 | 155 | 0.0175 |
| `recon.cancelled` | 3344 | 3429 | 0.1507 | 284 | 145 | 139 | 0.7668 |
| `recon.reportsDelivered` | 9260 | 8808 | -0.8014 | 311 | 137 | 174 | 0.041 |
| `recon.retriggerBlocked` | 10538 | 10521 | -0.0301 | 274 | 141 | 133 | 0.6725 |
| `squadPerformance.meanOverall` | 50262.29999999998 | 50324.199999999975 | 0.1098 | 338 | 184 | 154 | 0.1146 |
| `squadPerformance.p10Overall` | 46889.099999999904 | 46865.89999999991 | -0.0411 | 265 | 129 | 136 | 0.7125 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 45239.89999999999 | 45442.49999999997 | 0.3592 | 317 | 181 | 136 | 0.0133 |
| `squadPerformance.meanMovement` | 56006.8 | 56037.100000000006 | 0.0537 | 246 | 126 | 120 | 0.75 |
| `squadPerformance.meanControl` | 56244.60000000004 | 56253.20000000005 | 0.0152 | 196 | 93 | 103 | 0.5204 |
| `squadPerformance.meanCohesion` | 46753.00000000003 | 46793.600000000006 | 0.072 | 342 | 178 | 164 | 0.4821 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

reconposts-0017 106.05 s (timeline) · reconposts-0036 117 s (stress) · reconposts-0018 120 s (timeline) · reconposts-0008 121.05 s (timeline) · reconposts-0037 126 s (timeline) · reconposts-0054 130.05 s (stress) · reconposts-0046 131.1 s (timeline) · reconposts-0026 138 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=409&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=409`); it opens the seed that parts earliest, and the dropdowns choose another.

