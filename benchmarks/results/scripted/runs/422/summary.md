# Benchmark run #422 · 60 seeds from `control` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ 3bd3143 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778724126) · build v29-dev

## Verdict

**MOVED: 258 of 276 pairs changed (median first part 174.6 s); 14 of 34 counters under p 0.05 (about 1.7 by chance), 13 under 0.0015; casualties +26.8% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5336 to 6765 (+26.8%, p 0); usKills 2359 to 2985 (+26.5%, p 0); geKills 2977 to 3780 (+27.0%, p 0); fire.hits 4589 to 5562 (+21.2%, p 0); movementResolver.changes 405355 to 479222 (+18.2%, p 0); stallOutcomes.wakes 134 to 20 (-85.1%, p 0); recon.orders 11448 to 12402 (+8.3%, p 0); recon.contacts 764 to 1144 (+49.7%, p 0); recon.cancelled 1751 to 2070 (+18.2%, p 0); recon.reportsDelivered 3580 to 5092 (+42.2%, p 0); stallOutcomes.repeats 22 to 5 (-77.3%, p 0.0002); fire.total 13127 to 16425 (+25.1%, p 0.0003); retreatSamples 74750 to 83166 (+11.3%, p 0.0007).
- Under 0.05 only: loopAlerts.length 133 to 209 (+57.1%, p 0.0297).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x1.034 (gate 1.25)
- the 216 changed records first part at simulated second: min 110.1, p10 121.05, median 174.6, p90 224.1, max 309

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5336 | 6765 | 5.1775 | 200 | 156 | 44 | 0 |
| `usKills` | 2359 | 2985 | 2.2681 | 190 | 132 | 58 | 0 |
| `geKills` | 2977 | 3780 | 2.9094 | 193 | 141 | 52 | 0 |
| `fire.total` | 13127 | 16425 | 11.9493 | 204 | 128 | 76 | 0.0003 |
| `fire.hits` | 4589 | 5562 | 3.5254 | 201 | 133 | 68 | 0 |
| `retreatSamples` | 74750 | 83166 | 30.4928 | 201 | 125 | 76 | 0.0007 |
| `movementResolver.changes` | 405355 | 479222 | 267.6341 | 215 | 194 | 21 | 0 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 41 | 0.0507 | 35 | 22 | 13 | 0.1755 |
| `loopAlerts.length` | 133 | 209 | 0.2754 | 103 | 63 | 40 | 0.0297 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 332 | 380 | 0.1739 | 115 | 63 | 52 | 0.3511 |
| `stallOutcomes.wakes` | 134 | 20 | -0.413 | 71 | 6 | 65 | 0 |
| `stallOutcomes.repeats` | 22 | 5 | -0.0616 | 13 | 0 | 13 | 0.0002 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 44 | 37 | -0.0254 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 11 | 8 | -0.0109 | 5 | 1 | 4 | 0.375 |
| `timeline.stalledSamplesRepeated` | 157 | 127 | -0.1087 | 8 | 1 | 7 | 0.0703 |
| `recon.orders` | 11448 | 12402 | 3.4565 | 186 | 133 | 53 | 0 |
| `recon.contacts` | 764 | 1144 | 1.3768 | 160 | 132 | 28 | 0 |
| `recon.noContact` | 4466 | 4489 | 0.0833 | 125 | 59 | 66 | 0.5917 |
| `recon.timeouts` | 4108 | 4275 | 0.6051 | 145 | 84 | 61 | 0.0673 |
| `recon.cancelled` | 1751 | 2070 | 1.1558 | 176 | 118 | 58 | 0 |
| `recon.reportsDelivered` | 3580 | 5092 | 5.4783 | 179 | 142 | 37 | 0 |
| `recon.retriggerBlocked` | 4795 | 4937 | 0.5145 | 168 | 94 | 74 | 0.1425 |
| `squadPerformance.meanOverall` | 24458 | 24407.500000000004 | -0.183 | 205 | 95 | 110 | 0.3282 |
| `squadPerformance.p10Overall` | 22835.59999999998 | 22707.699999999975 | -0.4634 | 174 | 77 | 97 | 0.1495 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 21951.59999999996 | 21830.299999999974 | -0.4395 | 200 | 96 | 104 | 0.6207 |
| `squadPerformance.meanMovement` | 27398.499999999993 | 27419.6 | 0.0764 | 174 | 77 | 97 | 0.1495 |
| `squadPerformance.meanControl` | 27454.499999999978 | 27445.19999999999 | -0.0337 | 170 | 94 | 76 | 0.1921 |
| `squadPerformance.meanCohesion` | 23037.199999999993 | 22953.900000000016 | -0.3018 | 207 | 98 | 109 | 0.4871 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0018 110.1 s (timeline) · control-0052 116.1 s (timeline) · control-0054 116.1 s (timeline) · control-0058 117 s (timeline) · control-0038 121.05 s (timeline) · control-0008 124.05 s (timeline) · control-0021 125.1 s (timeline) · control-0047 129 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=422&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=422`); it opens the seed that parts earliest, and the dropdowns choose another.

