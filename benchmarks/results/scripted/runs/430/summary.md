# Benchmark run #430 · 40 seeds from `reconref` (us-defend), windows `every60`

- **OFF** flags: `reconRef=0` · **ON** flags: `none`
- claude/recon-signature @ f25e3b7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37779310039) · build v29-dev

## Verdict

**MOVED: 364 of 364 pairs changed (median first part 36.15 s); 18 of 34 counters under p 0.05 (about 1.7 by chance), 15 under 0.0015; casualties -14.2% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 7407 to 6358 (-14.2%, p 0); geKills 3808 to 3323 (-12.7%, p 0); fire.hits 3501 to 2673 (-23.7%, p 0); movementResolver.changes 544736 to 474069 (-13.0%, p 0); recon.orders 14546 to 4450 (-69.4%, p 0); recon.contacts 997 to 113 (-88.7%, p 0); recon.noContact 5183 to 2062 (-60.2%, p 0); recon.timeouts 5652 to 1830 (-67.6%, p 0); recon.cancelled 2136 to 381 (-82.2%, p 0); recon.reportsDelivered 4440 to 628 (-85.9%, p 0); recon.retriggerBlocked 5703 to 4161 (-27.0%, p 0); squadPerformance.meanOverall 32498.599999999995 to 32894.299999999996 (+1.2%, p 0); squadPerformance.meanCohesion 30572.299999999996 to 32854.50000000001 (+7.5%, p 0); stallOutcomes.wakes 49 to 135 (+175.5%, p 0.0001); squadPerformance.p10Overall 30267.09999999997 to 30469.39999999994 (+0.7%, p 0.0001).
- Under 0.05 only: usKills 3599 to 3035 (-15.7%, p 0.0043); fire.total 10202 to 8341 (-18.2%, p 0.0153); squadPerformance.meanMovement 36169.000000000015 to 36199.20000000002 (+0.1%, p 0.0159).

## Paired comparison (off against on)

- **364** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.973 (gate 1.25)
- the 362 changed records first part at simulated second: min 22.05, p10 31.05, median 36.15, p90 45, max 47.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7407 | 6358 | -2.8819 | 275 | 92 | 183 | 0 |
| `usKills` | 3599 | 3035 | -1.5495 | 261 | 107 | 154 | 0.0043 |
| `geKills` | 3808 | 3323 | -1.3324 | 263 | 95 | 168 | 0 |
| `fire.total` | 10202 | 8341 | -5.1126 | 273 | 116 | 157 | 0.0153 |
| `fire.hits` | 3501 | 2673 | -2.2747 | 259 | 92 | 167 | 0 |
| `retreatSamples` | 53752 | 52459 | -3.5522 | 267 | 127 | 140 | 0.4628 |
| `movementResolver.changes` | 544736 | 474069 | -194.1401 | 364 | 51 | 313 | 0 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 12 | 19 | 0.0192 | 24 | 15 | 9 | 0.3075 |
| `loopAlerts.length` | 99 | 79 | -0.0549 | 101 | 42 | 59 | 0.1109 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 401 | 449 | 0.1319 | 177 | 97 | 80 | 0.229 |
| `stallOutcomes.wakes` | 49 | 135 | 0.2363 | 95 | 67 | 28 | 0.0001 |
| `stallOutcomes.repeats` | 10 | 38 | 0.0769 | 32 | 22 | 10 | 0.0501 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 14546 | 4450 | -27.7363 | 364 | 0 | 364 | 0 |
| `recon.contacts` | 997 | 113 | -2.4286 | 256 | 2 | 254 | 0 |
| `recon.noContact` | 5183 | 2062 | -8.5742 | 354 | 3 | 351 | 0 |
| `recon.timeouts` | 5652 | 1830 | -10.5 | 346 | 0 | 346 | 0 |
| `recon.cancelled` | 2136 | 381 | -4.8214 | 277 | 14 | 263 | 0 |
| `recon.reportsDelivered` | 4440 | 628 | -10.4725 | 244 | 8 | 236 | 0 |
| `recon.retriggerBlocked` | 5703 | 4161 | -4.2363 | 334 | 64 | 270 | 0 |
| `squadPerformance.meanOverall` | 32498.599999999995 | 32894.299999999996 | 1.0871 | 361 | 263 | 98 | 0 |
| `squadPerformance.p10Overall` | 30267.09999999997 | 30469.39999999994 | 0.5558 | 269 | 168 | 101 | 0.0001 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0027 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 29175.600000000002 | 29169.300000000003 | -0.0173 | 282 | 126 | 156 | 0.084 |
| `squadPerformance.meanMovement` | 36169.000000000015 | 36199.20000000002 | 0.083 | 188 | 111 | 77 | 0.0159 |
| `squadPerformance.meanControl` | 36303.09999999999 | 36306.70000000001 | 0.0099 | 189 | 100 | 89 | 0.4671 |
| `squadPerformance.meanCohesion` | 30572.299999999996 | 32854.50000000001 | 6.2698 | 361 | 279 | 82 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

reconref-0001 22.05 s (timeline) · reconref-0033 23.1 s (timeline) · reconref-0012 30 s (timeline) · reconref-0004 30.15 s (timeline) · reconref-0010 31.05 s (timeline) · reconref-0013 31.05 s (timeline) · reconref-0016 33 s (timeline) · reconref-0026 33 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=430&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=430`); it opens the seed that parts earliest, and the dropdowns choose another.

