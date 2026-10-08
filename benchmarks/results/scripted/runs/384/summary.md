# Benchmark run #384 · 60 seeds from `hill` (us-defend), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ 0277c68 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37735992285) · build v29-dev

## Verdict

**MOVED: 255 of 275 pairs changed (median first part 173.1 s); 14 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties +11.2% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5988 to 6659 (+11.2%, p 0); movementResolver.changes 438012 to 487145 (+11.2%, p 0); stallOutcomes.wakes 81 to 28 (-65.4%, p 0); recon.cancelled 2116 to 2339 (+10.5%, p 0); recon.contacts 742 to 1000 (+34.8%, p 0.0001); fire.hits 4837 to 5497 (+13.6%, p 0.0013).
- Under 0.05 only: recon.orders 11931 to 12345 (+3.5%, p 0.0018); usKills 2410 to 2880 (+19.5%, p 0.0019); retreatSamples 82164 to 92591 (+12.7%, p 0.003); recon.reportsDelivered 3232 to 3840 (+18.8%, p 0.0035); stallOutcomes.repeats 14 to 1 (-92.9%, p 0.0117); fire.total 13818 to 15858 (+14.8%, p 0.041); loopAlerts.length 185 to 188 (+1.6%, p 0.0415); squadPerformance.meanMission 21708.9 to 21522.79999999997 (-0.9%, p 0.0447).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 1) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x1.024 (gate 1.25)
- the 214 changed records first part at simulated second: min 19.05, p10 119.1, median 173.1, p90 234, max 342.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5988 | 6659 | 2.44 | 196 | 130 | 66 | 0 |
| `usKills` | 2410 | 2880 | 1.7091 | 176 | 109 | 67 | 0.0019 |
| `geKills` | 3578 | 3779 | 0.7309 | 183 | 102 | 81 | 0.1391 |
| `fire.total` | 13818 | 15858 | 7.4182 | 202 | 116 | 86 | 0.041 |
| `fire.hits` | 4837 | 5497 | 2.4 | 198 | 122 | 76 | 0.0013 |
| `retreatSamples` | 82164 | 92591 | 37.9164 | 192 | 117 | 75 | 0.003 |
| `movementResolver.changes` | 438012 | 487145 | 178.6655 | 213 | 178 | 35 | 0 |
| `movementStalls.length` | 5 | 8 | 0.0109 | 7 | 4 | 3 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 43 | 0.0582 | 41 | 26 | 15 | 0.1173 |
| `loopAlerts.length` | 185 | 188 | 0.0109 | 117 | 70 | 47 | 0.0415 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 355 | 380 | 0.0909 | 120 | 65 | 55 | 0.4114 |
| `stallOutcomes.wakes` | 81 | 28 | -0.1927 | 57 | 13 | 44 | 0 |
| `stallOutcomes.repeats` | 14 | 1 | -0.0473 | 11 | 1 | 10 | 0.0117 |
| `timeline.stalledOnsets` | 4 | 8 | 0.0145 | 6 | 4 | 2 | 0.6875 |
| `timeline.stalledSamples` | 81 | 1056 | 3.5455 | 7 | 5 | 2 | 0.4531 |
| `timeline.stalledOnsetsRepeated` | 10 | 19 | 0.0327 | 8 | 5 | 3 | 0.7266 |
| `timeline.stalledSamplesRepeated` | 218 | 1962 | 6.3418 | 8 | 5 | 3 | 0.7266 |
| `recon.orders` | 11931 | 12345 | 1.5055 | 183 | 113 | 70 | 0.0018 |
| `recon.contacts` | 742 | 1000 | 0.9382 | 161 | 105 | 56 | 0.0001 |
| `recon.noContact` | 4110 | 3952 | -0.5745 | 127 | 58 | 69 | 0.375 |
| `recon.timeouts` | 4513 | 4583 | 0.2545 | 161 | 90 | 71 | 0.1558 |
| `recon.cancelled` | 2116 | 2339 | 0.8109 | 175 | 115 | 60 | 0 |
| `recon.reportsDelivered` | 3232 | 3840 | 2.2109 | 171 | 105 | 66 | 0.0035 |
| `recon.retriggerBlocked` | 4755 | 4761 | 0.0218 | 161 | 84 | 77 | 0.6364 |
| `squadPerformance.meanOverall` | 24307.800000000003 | 24247.500000000004 | -0.2193 | 204 | 91 | 113 | 0.1413 |
| `squadPerformance.p10Overall` | 22669.89999999999 | 22613.799999999992 | -0.204 | 148 | 71 | 77 | 0.6812 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21708.9 | 21522.79999999997 | -0.6767 | 195 | 83 | 112 | 0.0447 |
| `squadPerformance.meanMovement` | 27330.700000000023 | 27343.30000000002 | 0.0458 | 171 | 86 | 85 | 1 |
| `squadPerformance.meanControl` | 27341.399999999998 | 27345 | 0.0131 | 165 | 86 | 79 | 0.6406 |
| `squadPerformance.meanCohesion` | 23037.80000000002 | 23058.099999999995 | 0.0738 | 202 | 106 | 96 | 0.5267 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0001 19.05 s (timeline) · hill-0007 108 s (timeline) · hill-0034 114 s (timeline) · hill-0020 118.05 s (timeline) · hill-0022 119.1 s (timeline) · hill-0025 121.05 s (stress) · hill-0044 126 s (timeline) · hill-0030 128.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=384&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=384`); it opens the seed that parts earliest, and the dropdowns choose another.

