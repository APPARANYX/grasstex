# Benchmark run #376 · 60 seeds from `hill` (us-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ c6cef94 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37728821773) · build v29-dev

## Verdict

**MOVED: 244 of 264 pairs changed (median first part 179.1 s); 11 of 34 counters under p 0.05 (about 1.7 by chance), 8 under 0.0015; casualties +10.9% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5794 to 6426 (+10.9%, p 0); movementResolver.changes 424081 to 469345 (+10.7%, p 0); recon.cancelled 2035 to 2263 (+11.2%, p 0); stallOutcomes.wakes 69 to 26 (-62.3%, p 0.0001); recon.contacts 727 to 988 (+35.9%, p 0.0001); usKills 2321 to 2796 (+20.5%, p 0.0004); recon.reportsDelivered 3152 to 3776 (+19.8%, p 0.0005); recon.orders 11477 to 11862 (+3.4%, p 0.0007).
- Under 0.05 only: retreatSamples 79467 to 89341 (+12.4%, p 0.0015); fire.hits 4716 to 5253 (+11.4%, p 0.0068); stallOutcomes.repeats 10 to 1 (-90.0%, p 0.0391).
- Unpaired records: off 11, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **264** pairs (unpaired: off 11, on 1) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x1.03 (gate 1.25)
- the 205 changed records first part at simulated second: min 108, p10 121.05, median 179.1, p90 234, max 342.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5794 | 6426 | 2.3939 | 185 | 124 | 61 | 0 |
| `usKills` | 2321 | 2796 | 1.7992 | 166 | 106 | 60 | 0.0004 |
| `geKills` | 3473 | 3630 | 0.5947 | 174 | 95 | 79 | 0.2554 |
| `fire.total` | 13374 | 14998 | 6.1515 | 193 | 108 | 85 | 0.1131 |
| `fire.hits` | 4716 | 5253 | 2.0341 | 188 | 113 | 75 | 0.0068 |
| `retreatSamples` | 79467 | 89341 | 37.4015 | 184 | 114 | 70 | 0.0015 |
| `movementResolver.changes` | 424081 | 469345 | 171.4545 | 204 | 172 | 32 | 0 |
| `movementStalls.length` | 5 | 7 | 0.0076 | 7 | 4 | 3 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 39 | 0.0455 | 37 | 23 | 14 | 0.1877 |
| `loopAlerts.length` | 183 | 170 | -0.0492 | 107 | 60 | 47 | 0.2459 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 341 | 361 | 0.0758 | 114 | 64 | 50 | 0.2232 |
| `stallOutcomes.wakes` | 69 | 26 | -0.1629 | 50 | 11 | 39 | 0.0001 |
| `stallOutcomes.repeats` | 10 | 1 | -0.0341 | 9 | 1 | 8 | 0.0391 |
| `timeline.stalledOnsets` | 4 | 8 | 0.0152 | 6 | 4 | 2 | 0.6875 |
| `timeline.stalledSamples` | 81 | 790 | 2.6856 | 7 | 5 | 2 | 0.4531 |
| `timeline.stalledOnsetsRepeated` | 10 | 19 | 0.0341 | 8 | 5 | 3 | 0.7266 |
| `timeline.stalledSamplesRepeated` | 218 | 1699 | 5.6098 | 8 | 5 | 3 | 0.7266 |
| `recon.orders` | 11477 | 11862 | 1.4583 | 169 | 107 | 62 | 0.0007 |
| `recon.contacts` | 727 | 988 | 0.9886 | 153 | 101 | 52 | 0.0001 |
| `recon.noContact` | 3930 | 3755 | -0.6629 | 115 | 50 | 65 | 0.1915 |
| `recon.timeouts` | 4350 | 4401 | 0.1932 | 154 | 84 | 70 | 0.2948 |
| `recon.cancelled` | 2035 | 2263 | 0.8636 | 165 | 111 | 54 | 0 |
| `recon.reportsDelivered` | 3152 | 3776 | 2.3636 | 163 | 104 | 59 | 0.0005 |
| `recon.retriggerBlocked` | 4551 | 4582 | 0.1174 | 158 | 88 | 70 | 0.176 |
| `squadPerformance.meanOverall` | 23326.300000000003 | 23281.299999999996 | -0.1705 | 194 | 86 | 108 | 0.1314 |
| `squadPerformance.p10Overall` | 21747.999999999993 | 21697.09999999999 | -0.1928 | 139 | 68 | 71 | 0.8654 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20843.899999999998 | 20653.899999999965 | -0.7197 | 187 | 80 | 107 | 0.057 |
| `squadPerformance.meanMovement` | 26246.80000000002 | 26254.400000000023 | 0.0288 | 161 | 82 | 79 | 0.8748 |
| `squadPerformance.meanControl` | 26244.599999999995 | 26256.600000000002 | 0.0455 | 159 | 88 | 71 | 0.2043 |
| `squadPerformance.meanCohesion` | 22064.40000000002 | 22139.899999999998 | 0.286 | 193 | 107 | 86 | 0.1498 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0007 108 s (timeline) · hill-0034 114 s (timeline) · hill-0020 118.05 s (timeline) · hill-0022 119.1 s (timeline) · hill-0025 121.05 s (stress) · hill-0044 126 s (timeline) · hill-0030 128.1 s (timeline) · hill-0011 132 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=376&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=376`); it opens the seed that parts earliest, and the dropdowns choose another.

