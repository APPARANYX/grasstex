# Benchmark run #1251 · 50 seeds from `rearch-classic-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&contactCoverFirst=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39793922006) · build v29-dev

## Verdict

**WEAK: 50 of 50 pairs changed (median first part 154.05 s); 7 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.4% (p 0.4408)**

- Under 0.05 only: recon.cancelled 361 to 256 (-29.1%, p 0.0039); recon.orders 1256 to 1115 (-11.2%, p 0.0054); fire.total 11635 to 10791 (-7.3%, p 0.0226); retreatSamples 79935 to 73041 (-8.6%, p 0.0226); squadPerformance.p10Overall 3863.8 to 3889.1999999999994 (+0.7%, p 0.029); recon.noContact 655 to 629 (-4.0%, p 0.0336); squadPerformance.meanOverall 4239.700000000001 to 4270.900000000001 (+0.7%, p 0.0488).

## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.09 (gate 1.25)
- the 44 changed records first part at simulated second: min 95.1, p10 115.05, median 154.05, p90 244.05, max 351

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2397 | 2340 | -1.14 | 42 | 18 | 24 | 0.4408 |
| `usKills` | 1074 | 1042 | -0.64 | 42 | 19 | 23 | 0.644 |
| `geKills` | 1323 | 1298 | -0.5 | 40 | 17 | 23 | 0.4296 |
| `fire.total` | 11635 | 10791 | -16.88 | 44 | 14 | 30 | 0.0226 |
| `fire.hits` | 4497 | 4290 | -4.14 | 44 | 20 | 24 | 0.6516 |
| `retreatSamples` | 79935 | 73041 | -137.88 | 44 | 14 | 30 | 0.0226 |
| `movementResolver.changes` | 109651 | 111936 | 45.7 | 43 | 28 | 15 | 0.066 |
| `grenades.throws` | 5 | 9 | 0.08 | 6 | 5 | 1 | 0.2188 |
| `grenades.bursts` | 5 | 9 | 0.08 | 6 | 5 | 1 | 0.2188 |
| `grenades.wounded` | 1 | 4 | 0.06 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 7 | 15 | 0.16 | 5 | 3 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 134 | 121 | -0.26 | 34 | 16 | 18 | 0.8642 |
| `loopAlerts.length` | 258 | 235 | -0.46 | 40 | 17 | 23 | 0.4296 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 161 | 173 | 0.24 | 36 | 18 | 18 | 1 |
| `stallOutcomes.wakes` | 0 | 2 | 0.04 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 1 | 0.02 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1256 | 1115 | -2.82 | 43 | 12 | 31 | 0.0054 |
| `recon.contacts` | 126 | 105 | -0.42 | 34 | 12 | 22 | 0.1214 |
| `recon.noContact` | 655 | 629 | -0.52 | 38 | 12 | 26 | 0.0336 |
| `recon.timeouts` | 52 | 50 | -0.04 | 21 | 8 | 13 | 0.3833 |
| `recon.cancelled` | 361 | 256 | -2.1 | 36 | 9 | 27 | 0.0039 |
| `recon.reportsDelivered` | 501 | 427 | -1.48 | 43 | 16 | 27 | 0.1263 |
| `recon.retriggerBlocked` | 672 | 657 | -0.3 | 41 | 18 | 23 | 0.5327 |
| `squadPerformance.meanOverall` | 4239.700000000001 | 4270.900000000001 | 0.624 | 44 | 29 | 15 | 0.0488 |
| `squadPerformance.p10Overall` | 3863.8 | 3889.1999999999994 | 0.508 | 26 | 19 | 7 | 0.029 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3693.2 | 3795.1 | 2.038 | 44 | 28 | 16 | 0.0961 |
| `squadPerformance.meanMovement` | 4993.8 | 4993.4 | -0.008 | 17 | 8 | 9 | 1 |
| `squadPerformance.meanControl` | 4842.6 | 4823.800000000002 | -0.376 | 42 | 18 | 24 | 0.4408 |
| `squadPerformance.meanCohesion` | 4479.599999999999 | 4455.699999999999 | -0.478 | 44 | 18 | 26 | 0.2912 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0011 95.1 s (timeline) · rearch-classic-20261022-0001 100.05 s (timeline) · rearch-classic-20261022-0026 110.1 s (timeline) · rearch-classic-20261022-0027 114 s (stress) · rearch-classic-20261022-0039 115.05 s (stress) · rearch-classic-20261022-0016 117 s (timeline) · rearch-classic-20261022-0030 118.05 s (timeline) · rearch-classic-20261022-0031 118.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1251&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1251&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1251`); it opens the seed that parts earliest, and the dropdowns choose another.

