# Benchmark run #1250 · 50 seeds from `rearch-classic-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39793917284) · build v29-dev

## Verdict

**WEAK: 47 of 47 pairs changed (median first part 158.025 s); 6 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.2% (p 0.5327)**

- Under 0.05 only: recon.cancelled 339 to 241 (-28.9%, p 0.0029); recon.orders 1187 to 1055 (-11.1%, p 0.0043); recon.noContact 625 to 601 (-3.8%, p 0.0288); squadPerformance.p10Overall 3621.5 to 3637.999999999999 (+0.5%, p 0.0433); fire.total 11138 to 10389 (-6.7%, p 0.0436); retreatSamples 74865 to 69637 (-7.0%, p 0.0436).

## Paired comparison (off against on)

- **47** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.043 (gate 1.25)
- the 42 changed records first part at simulated second: min 100.05, p10 117, median 158.025, p90 244.05, max 351

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2284 | 2234 | -1.0638 | 41 | 18 | 23 | 0.5327 |
| `usKills` | 1032 | 996 | -0.766 | 41 | 18 | 23 | 0.5327 |
| `geKills` | 1252 | 1238 | -0.2979 | 38 | 17 | 21 | 0.6271 |
| `fire.total` | 11138 | 10389 | -15.9362 | 42 | 14 | 28 | 0.0436 |
| `fire.hits` | 4274 | 4115 | -3.383 | 42 | 20 | 22 | 0.8776 |
| `retreatSamples` | 74865 | 69637 | -111.234 | 42 | 14 | 28 | 0.0436 |
| `movementResolver.changes` | 104996 | 106072 | 22.8936 | 41 | 26 | 15 | 0.1173 |
| `grenades.throws` | 5 | 9 | 0.0851 | 6 | 5 | 1 | 0.2188 |
| `grenades.bursts` | 5 | 9 | 0.0851 | 6 | 5 | 1 | 0.2188 |
| `grenades.wounded` | 1 | 4 | 0.0638 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 7 | 15 | 0.1702 | 5 | 3 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 129 | 117 | -0.2553 | 32 | 15 | 17 | 0.8601 |
| `loopAlerts.length` | 252 | 227 | -0.5319 | 38 | 16 | 22 | 0.4177 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 159 | 161 | 0.0426 | 34 | 16 | 18 | 0.8642 |
| `stallOutcomes.wakes` | 0 | 2 | 0.0426 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0213 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1187 | 1055 | -2.8085 | 41 | 11 | 30 | 0.0043 |
| `recon.contacts` | 119 | 95 | -0.5106 | 32 | 11 | 21 | 0.1102 |
| `recon.noContact` | 625 | 601 | -0.5106 | 36 | 11 | 25 | 0.0288 |
| `recon.timeouts` | 47 | 49 | 0.0426 | 20 | 8 | 12 | 0.5034 |
| `recon.cancelled` | 339 | 241 | -2.0851 | 34 | 8 | 26 | 0.0029 |
| `recon.reportsDelivered` | 470 | 382 | -1.8723 | 41 | 15 | 26 | 0.1173 |
| `recon.retriggerBlocked` | 639 | 622 | -0.3617 | 39 | 17 | 22 | 0.5224 |
| `squadPerformance.meanOverall` | 3977.7999999999997 | 4004.3999999999996 | 0.566 | 42 | 27 | 15 | 0.0884 |
| `squadPerformance.p10Overall` | 3621.5 | 3637.999999999999 | 0.3511 | 25 | 18 | 7 | 0.0433 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3462.6 | 3547.1000000000004 | 1.7979 | 42 | 26 | 16 | 0.1641 |
| `squadPerformance.meanMovement` | 4694 | 4693.7 | -0.0064 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanControl` | 4546.9 | 4530.000000000002 | -0.3596 | 40 | 18 | 22 | 0.6358 |
| `squadPerformance.meanCohesion` | 4201.1 | 4190.399999999999 | -0.2277 | 42 | 18 | 24 | 0.4408 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0001 100.05 s (timeline) · rearch-classic-20261022-0026 110.1 s (timeline) · rearch-classic-20261022-0027 114 s (stress) · rearch-classic-20261022-0039 115.05 s (stress) · rearch-classic-20261022-0016 117 s (timeline) · rearch-classic-20261022-0030 118.05 s (timeline) · rearch-classic-20261022-0031 118.05 s (timeline) · rearch-classic-20261022-0003 120 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1250&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1250&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1250`); it opens the seed that parts earliest, and the dropdowns choose another.

