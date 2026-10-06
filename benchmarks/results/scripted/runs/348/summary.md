# Benchmark run #348 · 100 seeds from `pr314-incoming-fire` (meeting), windows `contact+120`

- **OFF** flags: `incomingFireReveal=0` · **ON** flags: `incomingFireReveal=1`
- work/diag-audio-fire-reveal-overlay @ b2e266c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37479685150) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 194.025 s); 4 of 32 counters under p 0.05 (about 1.6 by chance), 1 under 0.0016; casualties -3.9% (p 0.6718)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 201308 to 207121 (+2.9%, p 0).
- Under 0.05 only: recon.reportsDelivered 329 to 432 (+31.3%, p 0.0046); squadPerformance.meanMission 7462.999999999998 to 7372.6 (-1.2%, p 0.0197); geKills 1190 to 1107 (-7.0%, p 0.0334).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.028 (gate 1.25)
- the 100 changed records first part at simulated second: min 145.05, p10 164.1, median 194.025, p90 237, max 265.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2068 | 1987 | -0.81 | 89 | 42 | 47 | 0.6718 |
| `usKills` | 878 | 880 | 0.02 | 93 | 46 | 47 | 1 |
| `geKills` | 1190 | 1107 | -0.83 | 89 | 34 | 55 | 0.0334 |
| `fire.total` | 14659 | 13785 | -8.74 | 100 | 44 | 56 | 0.2713 |
| `fire.hits` | 5084 | 4604 | -4.8 | 97 | 40 | 57 | 0.1038 |
| `retreatSamples` | 9642 | 9908 | 2.66 | 97 | 52 | 45 | 0.5426 |
| `movementResolver.changes` | 201308 | 207121 | 58.13 | 99 | 72 | 27 | 0 |
| `movementStalls.length` | 14 | 14 | 0 | 7 | 4 | 3 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 26 | 21 | -0.05 | 17 | 6 | 11 | 0.3323 |
| `loopAlerts.length` | 116 | 108 | -0.08 | 58 | 23 | 35 | 0.148 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 363 | 354 | -0.09 | 33 | 12 | 21 | 0.1628 |
| `stallOutcomes.wakes` | 12 | 15 | 0.03 | 7 | 5 | 2 | 0.4531 |
| `stallOutcomes.repeats` | 1 | 2 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 35 | 33 | -0.02 | 7 | 3 | 4 | 1 |
| `timeline.stalledSamples` | 660 | 701 | 0.41 | 12 | 6 | 6 | 1 |
| `recon.orders` | 2498 | 2477 | -0.21 | 70 | 31 | 39 | 0.403 |
| `recon.contacts` | 65 | 72 | 0.07 | 24 | 16 | 8 | 0.1516 |
| `recon.noContact` | 1383 | 1393 | 0.1 | 25 | 16 | 9 | 0.2295 |
| `recon.timeouts` | 106 | 111 | 0.05 | 15 | 10 | 5 | 0.3018 |
| `recon.cancelled` | 914 | 884 | -0.3 | 74 | 30 | 44 | 0.1302 |
| `recon.reportsDelivered` | 329 | 432 | 1.03 | 33 | 25 | 8 | 0.0046 |
| `recon.retriggerBlocked` | 2261 | 2251 | -0.1 | 62 | 27 | 35 | 0.3742 |
| `squadPerformance.meanOverall` | 8534.400000000001 | 8500.100000000004 | -0.343 | 98 | 43 | 55 | 0.2664 |
| `squadPerformance.p10Overall` | 7729.7000000000035 | 7690.299999999999 | -0.394 | 92 | 39 | 53 | 0.175 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanMission` | 7462.999999999998 | 7372.6 | -0.904 | 98 | 37 | 61 | 0.0197 |
| `squadPerformance.meanMovement` | 9641.300000000001 | 9616.4 | -0.249 | 96 | 45 | 51 | 0.6101 |
| `squadPerformance.meanControl` | 9794.599999999999 | 9810.299999999997 | 0.157 | 93 | 51 | 42 | 0.4069 |
| `squadPerformance.meanCohesion` | 8535.699999999999 | 8518.4 | -0.173 | 95 | 43 | 52 | 0.4119 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr314-incoming-fire-0043 145.05 s (timeline) · pr314-incoming-fire-0100 154.05 s (timeline) · pr314-incoming-fire-0046 155.1 s (timeline) · pr314-incoming-fire-0023 157.05 s (timeline) · pr314-incoming-fire-0090 158.1 s (timeline) · pr314-incoming-fire-0007 159 s (timeline) · pr314-incoming-fire-0038 161.1 s (timeline) · pr314-incoming-fire-0060 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=348&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/diag-audio-fire-reveal-overlay/ai_flow_live.html?bench=348&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=348`); it opens the seed that parts earliest, and the dropdowns choose another.

