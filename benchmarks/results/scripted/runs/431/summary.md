# Benchmark run #431 · 40 seeds from `reconref` (ge-defend), windows `every60`

- **OFF** flags: `reconRef=0` · **ON** flags: `none`
- claude/recon-signature @ f25e3b7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37779314026) · build v29-dev

## Verdict

**MOVED: 364 of 364 pairs changed (median first part 33 s); 16 of 34 counters under p 0.05 (about 1.7 by chance), 14 under 0.0015; casualties -23.1% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 7106 to 5465 (-23.1%, p 0); usKills 3198 to 2039 (-36.2%, p 0); movementResolver.changes 517338 to 406286 (-21.5%, p 0); regroups.entries 403 to 159 (-60.5%, p 0); recon.orders 14454 to 4252 (-70.6%, p 0); recon.contacts 952 to 100 (-89.5%, p 0); recon.noContact 5338 to 1974 (-63.0%, p 0); recon.timeouts 5351 to 1899 (-64.5%, p 0); recon.cancelled 2266 to 241 (-89.4%, p 0); recon.reportsDelivered 4531 to 573 (-87.4%, p 0); recon.retriggerBlocked 5987 to 4075 (-31.9%, p 0); squadPerformance.meanOverall 32337.299999999985 to 32790.7 (+1.4%, p 0); squadPerformance.meanCohesion 30289.400000000005 to 32627.49999999999 (+7.7%, p 0); geKills 3908 to 3426 (-12.3%, p 0.0009).
- Under 0.05 only: stallOutcomes.wakes 102 to 169 (+65.7%, p 0.0039); fire.hits 2994 to 2570 (-14.2%, p 0.0234).

## Paired comparison (off against on)

- **364** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.95 (gate 1.25)
- the 364 changed records first part at simulated second: min 21, p10 31.05, median 33, p90 39, max 48

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7106 | 5465 | -4.5082 | 281 | 70 | 211 | 0 |
| `usKills` | 3198 | 2039 | -3.1841 | 252 | 63 | 189 | 0 |
| `geKills` | 3908 | 3426 | -1.3242 | 267 | 106 | 161 | 0.0009 |
| `fire.total` | 8970 | 8163 | -2.217 | 260 | 115 | 145 | 0.0719 |
| `fire.hits` | 2994 | 2570 | -1.1648 | 253 | 108 | 145 | 0.0234 |
| `retreatSamples` | 56350 | 48280 | -22.1703 | 265 | 126 | 139 | 0.4611 |
| `movementResolver.changes` | 517338 | 406286 | -305.0879 | 363 | 20 | 343 | 0 |
| `movementStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 13 | 5 | -0.022 | 12 | 3 | 9 | 0.146 |
| `loopAlerts.length` | 76 | 97 | 0.0577 | 82 | 39 | 43 | 0.7407 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 403 | 159 | -0.6703 | 163 | 26 | 137 | 0 |
| `stallOutcomes.wakes` | 102 | 169 | 0.1841 | 102 | 66 | 36 | 0.0039 |
| `stallOutcomes.repeats` | 23 | 43 | 0.0549 | 36 | 23 | 13 | 0.1325 |
| `timeline.stalledOnsets` | 1 | 11 | 0.0275 | 6 | 5 | 1 | 0.2188 |
| `timeline.stalledSamples` | 11 | 3 | -0.022 | 5 | 3 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 8 | 62 | 0.1484 | 15 | 7 | 8 | 1 |
| `timeline.stalledSamplesRepeated` | 81 | 15 | -0.1813 | 14 | 6 | 8 | 0.7905 |
| `recon.orders` | 14454 | 4252 | -28.0275 | 364 | 0 | 364 | 0 |
| `recon.contacts` | 952 | 100 | -2.3407 | 272 | 0 | 272 | 0 |
| `recon.noContact` | 5338 | 1974 | -9.2418 | 351 | 0 | 351 | 0 |
| `recon.timeouts` | 5351 | 1899 | -9.4835 | 344 | 0 | 344 | 0 |
| `recon.cancelled` | 2266 | 241 | -5.5632 | 281 | 4 | 277 | 0 |
| `recon.reportsDelivered` | 4531 | 573 | -10.8736 | 255 | 1 | 254 | 0 |
| `recon.retriggerBlocked` | 5987 | 4075 | -5.2527 | 337 | 54 | 283 | 0 |
| `squadPerformance.meanOverall` | 32337.299999999985 | 32790.7 | 1.2456 | 360 | 258 | 102 | 0 |
| `squadPerformance.p10Overall` | 30145.099999999933 | 30329.09999999998 | 0.5055 | 273 | 150 | 123 | 0.1154 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanMission` | 28804.1 | 29048.800000000017 | 0.6723 | 282 | 146 | 136 | 0.5921 |
| `squadPerformance.meanMovement` | 36155.299999999996 | 36109.69999999999 | -0.1253 | 198 | 106 | 92 | 0.3556 |
| `squadPerformance.meanControl` | 36316.6 | 36312.4 | -0.0115 | 180 | 90 | 90 | 1 |
| `squadPerformance.meanCohesion` | 30289.400000000005 | 32627.49999999999 | 6.4234 | 360 | 287 | 73 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

reconref-0027 21 s (timeline) · reconref-0015 26.1 s (timeline) · reconref-0002 31.05 s (timeline) · reconref-0016 31.05 s (timeline) · reconref-0017 31.05 s (timeline) · reconref-0022 31.05 s (timeline) · reconref-0028 31.05 s (timeline) · reconref-0029 31.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=431&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=431`); it opens the seed that parts earliest, and the dropdowns choose another.

