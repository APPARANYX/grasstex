# Benchmark run #425 · 60 seeds from `control` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/bench-stack-371-363 @ 4c8a599 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778735536) · build v29-dev

## Verdict

**MOVED: 258 of 276 pairs changed (median first part 173.1 s); 15 of 34 counters under p 0.05 (about 1.7 by chance), 13 under 0.0015; casualties +25.1% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5388 to 6743 (+25.1%, p 0); geKills 2998 to 3833 (+27.9%, p 0); fire.total 13068 to 16568 (+26.8%, p 0); fire.hits 4584 to 5594 (+22.0%, p 0); movementResolver.changes 403361 to 479879 (+19.0%, p 0); stallOutcomes.wakes 133 to 21 (-84.2%, p 0); recon.orders 11421 to 12355 (+8.2%, p 0); recon.contacts 773 to 1145 (+48.1%, p 0); recon.cancelled 1693 to 2024 (+19.6%, p 0); recon.reportsDelivered 3739 to 5125 (+37.1%, p 0); usKills 2390 to 2910 (+21.8%, p 0.0001); stallOutcomes.repeats 23 to 5 (-78.3%, p 0.0001); retreatSamples 76986 to 86747 (+12.7%, p 0.0008).
- Under 0.05 only: loopAlerts.length 130 to 258 (+98.5%, p 0.0046); timeline.stalledSamplesRepeated 157 to 126 (-19.7%, p 0.0156).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x0.975 (gate 1.25)
- the 215 changed records first part at simulated second: min 110.1, p10 121.05, median 173.1, p90 232.05, max 309

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5388 | 6743 | 4.9094 | 197 | 152 | 45 | 0 |
| `usKills` | 2390 | 2910 | 1.8841 | 187 | 121 | 66 | 0.0001 |
| `geKills` | 2998 | 3833 | 3.0254 | 190 | 138 | 52 | 0 |
| `fire.total` | 13068 | 16568 | 12.6812 | 204 | 133 | 71 | 0 |
| `fire.hits` | 4584 | 5594 | 3.6594 | 202 | 136 | 66 | 0 |
| `retreatSamples` | 76986 | 86747 | 35.3659 | 200 | 124 | 76 | 0.0008 |
| `movementResolver.changes` | 403361 | 479879 | 277.2391 | 214 | 196 | 18 | 0 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 22 | 42 | 0.0725 | 36 | 24 | 12 | 0.0652 |
| `loopAlerts.length` | 130 | 258 | 0.4638 | 106 | 68 | 38 | 0.0046 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 341 | 373 | 0.1159 | 119 | 60 | 59 | 1 |
| `stallOutcomes.wakes` | 133 | 21 | -0.4058 | 73 | 8 | 65 | 0 |
| `stallOutcomes.repeats` | 23 | 5 | -0.0652 | 15 | 0 | 15 | 0.0001 |
| `timeline.stalledOnsets` | 3 | 2 | -0.0036 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 44 | 36 | -0.029 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 11 | 7 | -0.0145 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledSamplesRepeated` | 157 | 126 | -0.1123 | 7 | 0 | 7 | 0.0156 |
| `recon.orders` | 11421 | 12355 | 3.3841 | 186 | 129 | 57 | 0 |
| `recon.contacts` | 773 | 1145 | 1.3478 | 162 | 130 | 32 | 0 |
| `recon.noContact` | 4489 | 4468 | -0.0761 | 129 | 60 | 69 | 0.4814 |
| `recon.timeouts` | 4113 | 4288 | 0.6341 | 147 | 80 | 67 | 0.3223 |
| `recon.cancelled` | 1693 | 2024 | 1.1993 | 178 | 117 | 61 | 0 |
| `recon.reportsDelivered` | 3739 | 5125 | 5.0217 | 181 | 139 | 42 | 0 |
| `recon.retriggerBlocked` | 4831 | 4920 | 0.3225 | 165 | 86 | 79 | 0.6406 |
| `squadPerformance.meanOverall` | 24437.500000000007 | 24385.5 | -0.1884 | 204 | 90 | 114 | 0.1071 |
| `squadPerformance.p10Overall` | 22799.299999999977 | 22682.49999999997 | -0.4232 | 175 | 76 | 99 | 0.096 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 21872.89999999996 | 21740.59999999998 | -0.4793 | 199 | 94 | 105 | 0.4785 |
| `squadPerformance.meanMovement` | 27411.199999999983 | 27429.799999999992 | 0.0674 | 175 | 75 | 100 | 0.0693 |
| `squadPerformance.meanControl` | 27455.199999999975 | 27435.899999999987 | -0.0699 | 175 | 94 | 81 | 0.3644 |
| `squadPerformance.meanCohesion` | 23084.299999999992 | 22999.300000000014 | -0.308 | 206 | 104 | 102 | 0.9445 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0018 110.1 s (timeline) · control-0052 116.1 s (timeline) · control-0054 116.1 s (timeline) · control-0058 117 s (timeline) · control-0038 121.05 s (timeline) · control-0008 124.05 s (timeline) · control-0021 125.1 s (timeline) · control-0047 129 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=425&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=425`); it opens the seed that parts earliest, and the dropdowns choose another.

