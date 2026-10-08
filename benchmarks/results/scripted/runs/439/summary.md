# Benchmark run #439 · 60 seeds from `control` (meeting), windows `every120`

- **OFF** flags: `woundRally=0` · **ON** flags: `none`
- claude/project-thread-kxo7sg @ f8e48cd · [run](https://github.com/APPARANYX/grasstex/actions/runs/37821543767) · build v29-dev

## Verdict

**WEAK: 191 of 291 pairs changed (median first part 333.15 s); 1 of 34 counters under p 0.05 (about 1.7 by chance); casualties +1.1% (p 0.2132)**

- Under 0.05 only: movementResolver.changes 635989 to 638652 (+0.4%, p 0.0118).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **291** pairs (unpaired: off 2, on 2) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.979 (gate 1.25)
- the 118 changed records first part at simulated second: min 230.1, p10 272.1, median 333.15, p90 428.1, max 580.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8105 | 8196 | 0.3127 | 93 | 53 | 40 | 0.2132 |
| `usKills` | 3658 | 3595 | -0.2165 | 84 | 35 | 49 | 0.1557 |
| `geKills` | 4447 | 4601 | 0.5292 | 84 | 50 | 34 | 0.1011 |
| `fire.total` | 21826 | 21884 | 0.1993 | 97 | 51 | 46 | 0.6849 |
| `fire.hits` | 7468 | 7522 | 0.1856 | 96 | 50 | 46 | 0.7596 |
| `retreatSamples` | 94077 | 95674 | 5.488 | 96 | 54 | 42 | 0.2615 |
| `movementResolver.changes` | 635989 | 638652 | 9.1512 | 116 | 72 | 44 | 0.0118 |
| `movementStalls.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 296 | 302 | 0.0206 | 62 | 33 | 29 | 0.7035 |
| `loopAlerts.length` | 248 | 254 | 0.0206 | 63 | 32 | 31 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 509 | 499 | -0.0344 | 44 | 18 | 26 | 0.2912 |
| `stallOutcomes.wakes` | 64 | 66 | 0.0069 | 12 | 7 | 5 | 0.7744 |
| `stallOutcomes.repeats` | 28 | 31 | 0.0103 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 730 | 764 | 0.1168 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1906 | 1937 | 0.1065 | 2 | 1 | 1 | 1 |
| `recon.orders` | 6637 | 6678 | 0.1409 | 79 | 45 | 34 | 0.2604 |
| `recon.contacts` | 302 | 308 | 0.0206 | 35 | 19 | 16 | 0.7359 |
| `recon.noContact` | 4433 | 4436 | 0.0103 | 55 | 27 | 28 | 1 |
| `recon.timeouts` | 167 | 177 | 0.0344 | 29 | 17 | 12 | 0.4583 |
| `recon.cancelled` | 1555 | 1564 | 0.0309 | 62 | 31 | 31 | 1 |
| `recon.reportsDelivered` | 1608 | 1628 | 0.0687 | 39 | 24 | 15 | 0.1996 |
| `recon.retriggerBlocked` | 5081 | 5092 | 0.0378 | 72 | 38 | 34 | 0.7239 |
| `squadPerformance.meanOverall` | 25256.599999999988 | 25263.99999999999 | 0.0254 | 102 | 61 | 41 | 0.0594 |
| `squadPerformance.p10Overall` | 23764.79999999998 | 23800.299999999985 | 0.122 | 50 | 29 | 21 | 0.3222 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21035.499999999985 | 21025.59999999998 | -0.034 | 91 | 46 | 45 | 1 |
| `squadPerformance.meanMovement` | 28792.299999999996 | 28799 | 0.023 | 85 | 50 | 35 | 0.1284 |
| `squadPerformance.meanControl` | 28788.399999999994 | 28786.999999999996 | -0.0048 | 83 | 46 | 37 | 0.38 |
| `squadPerformance.meanCohesion` | 25674.799999999996 | 25682.99999999998 | 0.0282 | 100 | 55 | 45 | 0.3682 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0039 230.1 s (timeline) · control-0030 251.1 s (timeline) · control-0018 255 s (timeline) · control-0006 262.05 s (timeline) · control-0015 272.1 s (timeline) · control-0014 274.05 s (timeline) · control-0045 274.05 s (timeline) · control-0022 275.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=439&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=439`); it opens the seed that parts earliest, and the dropdowns choose another.

