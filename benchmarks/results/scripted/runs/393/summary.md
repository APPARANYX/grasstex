# Benchmark run #393 · 60 seeds from `sqrelay` (us-defend), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/squad-relay @ 768c593 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37762212030) · build v29-dev

## Verdict

**MOVED: 268 of 274 pairs changed (median first part 88.05 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties -0.7% (p 0.1783)**

- Clears the Bonferroni line (p < 0.0015): recon.orders 13096 to 13750 (+5.0%, p 0); recon.noContact 5360 to 5887 (+9.8%, p 0); recon.cancelled 1778 to 2070 (+16.4%, p 0); retreatSamples 80493 to 75672 (-6.0%, p 0.0003); recon.timeouts 4616 to 4355 (-5.7%, p 0.001); squadPerformance.meanMission 21634.69999999998 to 21877.699999999964 (+1.1%, p 0.0011).
- Under 0.05 only: squadPerformance.meanOverall 24218.49999999999 to 24279.400000000005 (+0.3%, p 0.0017); movementResolver.changes 444522 to 455288 (+2.4%, p 0.004); loopAlerts.length 121 to 160 (+32.2%, p 0.0134); squadPerformance.meanControl 27268.999999999975 to 27246.099999999973 (-0.1%, p 0.0251).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **274** pairs (unpaired: off 0, on 1) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x1.001 (gate 1.25)
- the 231 changed records first part at simulated second: min 22.05, p10 23.1, median 88.05, p90 198, max 501

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5707 | 5668 | -0.1423 | 179 | 80 | 99 | 0.1783 |
| `usKills` | 2491 | 2280 | -0.7701 | 163 | 69 | 94 | 0.0598 |
| `geKills` | 3216 | 3388 | 0.6277 | 170 | 96 | 74 | 0.107 |
| `fire.total` | 13749 | 14453 | 2.5693 | 186 | 92 | 94 | 0.9416 |
| `fire.hits` | 4921 | 5023 | 0.3723 | 181 | 93 | 88 | 0.7663 |
| `retreatSamples` | 80493 | 75672 | -17.5949 | 174 | 63 | 111 | 0.0003 |
| `movementResolver.changes` | 444522 | 455288 | 39.292 | 224 | 134 | 90 | 0.004 |
| `movementStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 44 | 48 | 0.0146 | 39 | 21 | 18 | 0.7493 |
| `loopAlerts.length` | 121 | 160 | 0.1423 | 95 | 60 | 35 | 0.0134 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 338 | 359 | 0.0766 | 109 | 57 | 52 | 0.7018 |
| `stallOutcomes.wakes` | 87 | 92 | 0.0182 | 70 | 38 | 32 | 0.5504 |
| `stallOutcomes.repeats` | 9 | 22 | 0.0474 | 19 | 14 | 5 | 0.0636 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 97 | 97 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 291 | 291 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 13096 | 13750 | 2.3869 | 190 | 127 | 63 | 0 |
| `recon.contacts` | 894 | 969 | 0.2737 | 152 | 84 | 68 | 0.2236 |
| `recon.noContact` | 5360 | 5887 | 1.9234 | 162 | 110 | 52 | 0 |
| `recon.timeouts` | 4616 | 4355 | -0.9526 | 165 | 61 | 104 | 0.001 |
| `recon.cancelled` | 1778 | 2070 | 1.0657 | 165 | 109 | 56 | 0 |
| `recon.reportsDelivered` | 4334 | 4506 | 0.6277 | 176 | 78 | 98 | 0.1519 |
| `recon.retriggerBlocked` | 5200 | 5399 | 0.7263 | 167 | 88 | 79 | 0.536 |
| `squadPerformance.meanOverall` | 24218.49999999999 | 24279.400000000005 | 0.2223 | 206 | 126 | 80 | 0.0017 |
| `squadPerformance.p10Overall` | 22579.399999999972 | 22665.799999999977 | 0.3153 | 147 | 83 | 64 | 0.1374 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21634.69999999998 | 21877.699999999964 | 0.8869 | 183 | 114 | 69 | 0.0011 |
| `squadPerformance.meanMovement` | 27226.199999999993 | 27245.300000000017 | 0.0697 | 150 | 76 | 74 | 0.935 |
| `squadPerformance.meanControl` | 27268.999999999975 | 27246.099999999973 | -0.0836 | 157 | 64 | 93 | 0.0251 |
| `squadPerformance.meanCohesion` | 22822.700000000004 | 22810.799999999992 | -0.0434 | 215 | 103 | 112 | 0.5854 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sqrelay-0012 22.05 s (timeline) · sqrelay-0017 22.05 s (timeline) · sqrelay-0041 22.05 s (timeline) · sqrelay-0023 23.1 s (timeline) · sqrelay-0027 23.1 s (timeline) · sqrelay-0044 23.1 s (timeline) · sqrelay-0045 23.1 s (timeline) · sqrelay-0054 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=393&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=393`); it opens the seed that parts earliest, and the dropdowns choose another.

