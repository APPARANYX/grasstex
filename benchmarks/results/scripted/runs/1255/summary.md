# Benchmark run #1255 · 100 seeds from `sector-memory-20261022` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&sectorMemory=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1`
- work/sector-memory-20261022 @ 91ca910 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39806358575) · build v29-dev

## Verdict

**WEAK: 74 of 100 pairs changed (median first part 256.57500000000005 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- Under 0.05 only: movementResolver.changes 222135 to 224946 (+1.3%, p 0.0094).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **26** · runtime errors off 0 / on 0 · wall time on/off x1.036 (gate 1.25)
- the 26 changed records first part at simulated second: min 127.05, p10 169.05, median 256.57500000000005, p90 360, max 477

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4677 | 4678 | 0.01 | 19 | 9 | 10 | 1 |
| `usKills` | 2215 | 2190 | -0.25 | 19 | 5 | 14 | 0.0636 |
| `geKills` | 2462 | 2488 | 0.26 | 20 | 11 | 9 | 0.8238 |
| `fire.total` | 22837 | 23024 | 1.87 | 21 | 14 | 7 | 0.1892 |
| `fire.hits` | 8547 | 8599 | 0.52 | 22 | 14 | 8 | 0.2863 |
| `retreatSamples` | 150980 | 151746 | 7.66 | 22 | 9 | 13 | 0.5235 |
| `movementResolver.changes` | 222135 | 224946 | 28.11 | 26 | 20 | 6 | 0.0094 |
| `grenades.throws` | 17 | 16 | -0.01 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 17 | 16 | -0.01 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 15 | 13 | -0.02 | 2 | 0 | 2 | 0.5 |
| `grenades.casualties` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 40 | 41 | 0.01 | 2 | 1 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 4 | 0.02 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 230 | 228 | -0.02 | 16 | 7 | 9 | 0.8036 |
| `loopAlerts.length` | 503 | 495 | -0.08 | 19 | 7 | 12 | 0.3593 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 363 | 359 | -0.04 | 15 | 6 | 9 | 0.6072 |
| `stallOutcomes.wakes` | 3 | 2 | -0.01 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 263 | 421 | 1.58 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 263 | 421 | 1.58 | 2 | 1 | 1 | 1 |
| `recon.orders` | 2017 | 2046 | 0.29 | 18 | 13 | 5 | 0.0963 |
| `recon.contacts` | 190 | 196 | 0.06 | 12 | 7 | 5 | 0.7744 |
| `recon.noContact` | 1145 | 1153 | 0.08 | 17 | 9 | 8 | 1 |
| `recon.timeouts` | 106 | 106 | 0 | 13 | 7 | 6 | 1 |
| `recon.cancelled` | 457 | 466 | 0.09 | 16 | 10 | 6 | 0.4545 |
| `recon.reportsDelivered` | 769 | 771 | 0.02 | 15 | 6 | 9 | 0.6072 |
| `recon.retriggerBlocked` | 1244 | 1252 | 0.08 | 15 | 10 | 5 | 0.3018 |
| `squadPerformance.meanOverall` | 8481.1 | 8483.300000000003 | 0.022 | 20 | 10 | 10 | 1 |
| `squadPerformance.p10Overall` | 7686.6 | 7690.4 | 0.038 | 11 | 6 | 5 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7390.699999999996 | 7396.399999999997 | 0.057 | 20 | 11 | 9 | 0.8238 |
| `squadPerformance.meanMovement` | 9983.499999999996 | 9983.799999999996 | 0.003 | 8 | 5 | 3 | 0.7266 |
| `squadPerformance.meanControl` | 9684.4 | 9684.8 | 0.004 | 20 | 13 | 7 | 0.2632 |
| `squadPerformance.meanCohesion` | 8927.4 | 8928 | 0.006 | 21 | 10 | 11 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sector-memory-20261022-0046 127.05 s (timeline) · sector-memory-20261022-0035 167.1 s (timeline) · sector-memory-20261022-0020 169.05 s (timeline) · sector-memory-20261022-0077 176.1 s (stress) · sector-memory-20261022-0010 183 s (timeline) · sector-memory-20261022-0021 198 s (timeline) · sector-memory-20261022-0081 204 s (timeline) · sector-memory-20261022-0005 210 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1255&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/sector-memory-20261022/ai_flow_live.html?bench=1255&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1255`); it opens the seed that parts earliest, and the dropdowns choose another.

