# Benchmark run #1247 · 100 seeds from `rearch-classic-20261022` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/ai-rearch-consolidated-20261022 @ 3a126d6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39780220715) · build v29-dev

## Verdict

**WEAK: 95 of 95 pairs changed (median first part 201 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties +3.4% (p 0.0784)**

- Under 0.05 only: movementResolver.changes 312378 to 316779 (+1.4%, p 0.0097); recon.orders 3037 to 2891 (-4.8%, p 0.0116); recon.cancelled 849 to 764 (-10.0%, p 0.0225); recon.contacts 152 to 132 (-13.2%, p 0.0402).

## Paired comparison (off against on)

- **95** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.985 (gate 1.25)
- the 89 changed records first part at simulated second: min 148.05, p10 164.1, median 201, p90 299.1, max 583.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4960 | 5131 | 1.8 | 83 | 50 | 33 | 0.0784 |
| `usKills` | 2249 | 2334 | 0.8947 | 81 | 46 | 35 | 0.2664 |
| `geKills` | 2711 | 2797 | 0.9053 | 84 | 48 | 36 | 0.2299 |
| `fire.total` | 23548 | 24241 | 7.2947 | 88 | 45 | 43 | 0.9152 |
| `fire.hits` | 9578 | 9953 | 3.9474 | 88 | 50 | 38 | 0.2408 |
| `retreatSamples` | 130293 | 136343 | 63.6842 | 87 | 48 | 39 | 0.3912 |
| `movementResolver.changes` | 312378 | 316779 | 46.3263 | 87 | 56 | 31 | 0.0097 |
| `grenades.throws` | 21 | 21 | 0 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 21 | 21 | 0 | 8 | 4 | 4 | 1 |
| `grenades.wounded` | 37 | 37 | 0 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 10 | 11 | 0.0105 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 69 | 67 | -0.0211 | 4 | 2 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0105 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 12 | 13 | 0.0105 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 511 | 519 | 0.0842 | 75 | 40 | 35 | 0.6445 |
| `loopAlerts.length` | 631 | 683 | 0.5474 | 72 | 36 | 36 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 369 | 409 | 0.4211 | 70 | 39 | 31 | 0.403 |
| `stallOutcomes.wakes` | 12 | 10 | -0.0211 | 12 | 5 | 7 | 0.7744 |
| `stallOutcomes.repeats` | 2 | 3 | 0.0105 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 14 | 15 | 0.0105 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 1183 | 994 | -1.9895 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 14 | 15 | 0.0105 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1183 | 994 | -1.9895 | 1 | 0 | 1 | 1 |
| `recon.orders` | 3037 | 2891 | -1.5368 | 84 | 30 | 54 | 0.0116 |
| `recon.contacts` | 152 | 132 | -0.2105 | 54 | 19 | 35 | 0.0402 |
| `recon.noContact` | 1867 | 1848 | -0.2 | 74 | 33 | 41 | 0.416 |
| `recon.timeouts` | 33 | 30 | -0.0316 | 23 | 10 | 13 | 0.6776 |
| `recon.cancelled` | 849 | 764 | -0.8947 | 70 | 25 | 45 | 0.0225 |
| `recon.reportsDelivered` | 646 | 570 | -0.8 | 62 | 24 | 38 | 0.098 |
| `recon.retriggerBlocked` | 2362 | 2296 | -0.6947 | 78 | 30 | 48 | 0.0535 |
| `squadPerformance.meanOverall` | 7770.599999999998 | 7749.2000000000035 | -0.2253 | 84 | 34 | 50 | 0.1011 |
| `squadPerformance.p10Overall` | 7161.399999999999 | 7143.6 | -0.1874 | 53 | 26 | 27 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6409.699999999998 | 6366.699999999996 | -0.4526 | 85 | 39 | 46 | 0.5154 |
| `squadPerformance.meanMovement` | 9473.599999999997 | 9473.199999999997 | -0.0042 | 49 | 23 | 26 | 0.7754 |
| `squadPerformance.meanControl` | 8949.499999999998 | 8920 | -0.3105 | 85 | 41 | 44 | 0.8284 |
| `squadPerformance.meanCohesion` | 8504.099999999999 | 8530 | 0.2726 | 85 | 45 | 40 | 0.6646 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rearch-classic-20261022-0006 148.05 s (timeline) · rearch-classic-20261022-0090 157.05 s (timeline) · rearch-classic-20261022-0005 158.1 s (timeline) · rearch-classic-20261022-0025 158.1 s (timeline) · rearch-classic-20261022-0084 158.1 s (timeline) · rearch-classic-20261022-0031 161.1 s (timeline) · rearch-classic-20261022-0063 163.05 s (timeline) · rearch-classic-20261022-0016 164.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1247&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/ai-rearch-consolidated-20261022/ai_flow_live.html?bench=1247&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1247`); it opens the seed that parts earliest, and the dropdowns choose another.

