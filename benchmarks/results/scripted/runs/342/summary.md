# Benchmark run #342 · 100 seeds from `flag-audit-broadcast-split` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `squadBroadcast=1&fireteamSplit=1`
- main @ bac2b23 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37457854692) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 225 s); 4 of 32 counters under p 0.05 (about 1.6 by chance); casualties -7.5% (p 0.0073)**

- Under 0.05 only: vacantObjectiveStalls.length 24 to 15 (-37.5%, p 0.0039); usKills 1213 to 1041 (-14.2%, p 0.006); casualties 2357 to 2180 (-7.5%, p 0.0073); fire.hits 5920 to 5550 (-6.3%, p 0.0375).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- the 97 changed records first part at simulated second: min 163.05, p10 186, median 225, p90 263.1, max 290.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2357 | 2180 | -1.77 | 88 | 31 | 57 | 0.0073 |
| `usKills` | 1213 | 1041 | -1.72 | 84 | 29 | 55 | 0.006 |
| `geKills` | 1144 | 1139 | -0.05 | 83 | 42 | 41 | 1 |
| `fire.total` | 17148 | 16193 | -9.55 | 92 | 44 | 48 | 0.7547 |
| `fire.hits` | 5920 | 5550 | -3.7 | 93 | 36 | 57 | 0.0375 |
| `retreatSamples` | 10900 | 10272 | -6.28 | 85 | 34 | 51 | 0.0821 |
| `movementResolver.changes` | 206326 | 204442 | -18.84 | 96 | 39 | 57 | 0.0822 |
| `movementStalls.length` | 12 | 11 | -0.01 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 24 | 15 | -0.09 | 9 | 0 | 9 | 0.0039 |
| `loopAlerts.length` | 101 | 110 | 0.09 | 43 | 22 | 21 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 353 | 364 | 0.11 | 26 | 17 | 9 | 0.1686 |
| `stallOutcomes.wakes` | 15 | 21 | 0.06 | 5 | 5 | 0 | 0.0625 |
| `stallOutcomes.repeats` | 1 | 2 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 20 | 19 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 701 | 874 | 1.73 | 2 | 1 | 1 | 1 |
| `recon.orders` | 2537 | 2556 | 0.19 | 51 | 30 | 21 | 0.2624 |
| `recon.contacts` | 70 | 65 | -0.05 | 15 | 5 | 10 | 0.3018 |
| `recon.noContact` | 1379 | 1378 | -0.01 | 12 | 5 | 7 | 0.7744 |
| `recon.timeouts` | 120 | 124 | 0.04 | 10 | 7 | 3 | 0.3438 |
| `recon.cancelled` | 938 | 954 | 0.16 | 49 | 29 | 20 | 0.2529 |
| `recon.reportsDelivered` | 409 | 364 | -0.45 | 19 | 6 | 13 | 0.1671 |
| `recon.retriggerBlocked` | 2311 | 2326 | 0.15 | 47 | 27 | 20 | 0.3817 |
| `squadPerformance.meanOverall` | 8481.1 | 8505.300000000001 | 0.242 | 92 | 52 | 40 | 0.2513 |
| `squadPerformance.p10Overall` | 7680.200000000001 | 7700.3 | 0.201 | 80 | 41 | 39 | 0.9111 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 7346.399999999999 | 7386.700000000002 | 0.403 | 89 | 52 | 37 | 0.1374 |
| `squadPerformance.meanMovement` | 9599.300000000003 | 9647.599999999999 | 0.483 | 89 | 50 | 39 | 0.2891 |
| `squadPerformance.meanControl` | 9818.700000000003 | 9815.700000000006 | -0.03 | 77 | 36 | 41 | 0.6488 |
| `squadPerformance.meanCohesion` | 8533.2 | 8535.400000000001 | 0.022 | 89 | 49 | 40 | 0.3966 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

flag-audit-broadcast-split-0015 163.05 s (timeline) · flag-audit-broadcast-split-0029 169.05 s (timeline) · flag-audit-broadcast-split-0025 173.1 s (timeline) · flag-audit-broadcast-split-0077 173.1 s (timeline) · flag-audit-broadcast-split-0078 173.1 s (timeline) · flag-audit-broadcast-split-0070 176.1 s (timeline) · flag-audit-broadcast-split-0088 178.05 s (timeline) · flag-audit-broadcast-split-0053 179.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=342&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=342`); it opens the seed that parts earliest, and the dropdowns choose another.

