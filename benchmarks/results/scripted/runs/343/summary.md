# Benchmark run #343 · 100 seeds from `flag-audit-secondary-threat` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `secondaryThreat=1`
- main @ bac2b23 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37457857477) · build v29-dev

## Verdict

**WEAK: 97 of 100 pairs changed (median first part 240.525 s); 2 of 32 counters under p 0.05 (about 1.6 by chance); casualties +2.6% (p 0.1507)**

- Under 0.05 only: squadPerformance.meanControl 9805.499999999996 to 9790.5 (-0.2%, p 0.0169); fire.total 16204 to 14729 (-9.1%, p 0.0192).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.03 (gate 1.25)
- the 90 changed records first part at simulated second: min 172.05, p10 189, median 240.525, p90 282, max 318

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2249 | 2308 | 0.59 | 82 | 48 | 34 | 0.1507 |
| `usKills` | 989 | 1009 | 0.2 | 78 | 41 | 37 | 0.7343 |
| `geKills` | 1260 | 1299 | 0.39 | 75 | 39 | 36 | 0.8176 |
| `fire.total` | 16204 | 14729 | -14.75 | 89 | 33 | 56 | 0.0192 |
| `fire.hits` | 5343 | 5378 | 0.35 | 85 | 49 | 36 | 0.1928 |
| `retreatSamples` | 10461 | 10068 | -3.93 | 84 | 38 | 46 | 0.4452 |
| `movementResolver.changes` | 207227 | 207766 | 5.39 | 87 | 40 | 47 | 0.5203 |
| `movementStalls.length` | 14 | 17 | 0.03 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 26 | 33 | 0.07 | 16 | 11 | 5 | 0.2101 |
| `loopAlerts.length` | 121 | 137 | 0.16 | 38 | 25 | 13 | 0.073 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 348 | 348 | 0 | 17 | 10 | 7 | 0.6291 |
| `stallOutcomes.wakes` | 15 | 14 | -0.01 | 5 | 2 | 3 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 24 | 26 | 0.02 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 682 | 846 | 1.64 | 3 | 2 | 1 | 1 |
| `recon.orders` | 2524 | 2522 | -0.02 | 37 | 16 | 21 | 0.5114 |
| `recon.contacts` | 71 | 70 | -0.01 | 16 | 7 | 9 | 0.8036 |
| `recon.noContact` | 1416 | 1428 | 0.12 | 14 | 11 | 3 | 0.0574 |
| `recon.timeouts` | 102 | 97 | -0.05 | 5 | 0 | 5 | 0.0625 |
| `recon.cancelled` | 904 | 891 | -0.13 | 34 | 14 | 20 | 0.3915 |
| `recon.reportsDelivered` | 428 | 436 | 0.08 | 17 | 10 | 7 | 0.6291 |
| `recon.retriggerBlocked` | 2274 | 2275 | 0.01 | 36 | 19 | 17 | 0.8679 |
| `squadPerformance.meanOverall` | 8503.500000000002 | 8511.3 | 0.078 | 86 | 41 | 45 | 0.7465 |
| `squadPerformance.p10Overall` | 7696.100000000001 | 7717.999999999999 | 0.219 | 75 | 37 | 38 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanMission` | 7378.900000000001 | 7416.500000000002 | 0.376 | 82 | 40 | 42 | 0.9122 |
| `squadPerformance.meanMovement` | 9636.699999999997 | 9637.3 | 0.006 | 86 | 42 | 44 | 0.9142 |
| `squadPerformance.meanControl` | 9805.499999999996 | 9790.5 | -0.15 | 78 | 28 | 50 | 0.0169 |
| `squadPerformance.meanCohesion` | 8489.599999999997 | 8454.9 | -0.347 | 87 | 42 | 45 | 0.8304 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

flag-audit-secondary-threat-0063 172.05 s (stress) · flag-audit-secondary-threat-0044 180 s (stress) · flag-audit-secondary-threat-0036 181.05 s (timeline) · flag-audit-secondary-threat-0012 183 s (timeline) · flag-audit-secondary-threat-0051 187.05 s (timeline) · flag-audit-secondary-threat-0049 188.1 s (timeline) · flag-audit-secondary-threat-0005 189 s (stress) · flag-audit-secondary-threat-0020 189 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=343&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=343`); it opens the seed that parts earliest, and the dropdowns choose another.

