# Benchmark run #291 · 20 seeds from `phase-0e-regroup-grace` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ bfd0969 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37195788049) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 0.15 s); 2 of 32 counters under p 0.05 (about 1.6 by chance), 2 under 0.0016; casualties -28.5% (p 0.2101)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 37011 to 30842 (-16.7%, p 0); regroups.entries 97 to 259 (+167.0%, p 0).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.142 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 130 | 93 | -1.85 | 16 | 5 | 11 | 0.2101 |
| `usKills` | 45 | 33 | -0.6 | 12 | 3 | 9 | 0.146 |
| `geKills` | 85 | 60 | -1.25 | 15 | 5 | 10 | 0.3018 |
| `fire.total` | 1362 | 930 | -21.6 | 19 | 8 | 11 | 0.6476 |
| `fire.hits` | 278 | 158 | -6 | 17 | 6 | 11 | 0.3323 |
| `retreatSamples` | 309 | 131 | -8.9 | 11 | 2 | 9 | 0.0654 |
| `movementResolver.changes` | 37011 | 30842 | -308.45 | 20 | 1 | 19 | 0 |
| `movementStalls.length` | 4 | 0 | -0.2 | 2 | 0 | 2 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 0 | -0.15 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 6 | 14 | 0.4 | 9 | 7 | 2 | 0.1797 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 97 | 259 | 8.1 | 20 | 20 | 0 | 0 |
| `stallOutcomes.wakes` | 124 | 120 | -0.2 | 3 | 1 | 2 | 1 |
| `stallOutcomes.repeats` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 5 | 0 | -0.25 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 53 | 0 | -2.65 | 2 | 0 | 2 | 0.5 |
| `recon.orders` | 298 | 295 | -0.15 | 13 | 6 | 7 | 1 |
| `recon.contacts` | 10 | 6 | -0.2 | 9 | 2 | 7 | 0.1797 |
| `recon.noContact` | 276 | 279 | 0.15 | 15 | 8 | 7 | 1 |
| `recon.timeouts` | 3 | 5 | 0.1 | 5 | 3 | 2 | 1 |
| `recon.cancelled` | 8 | 3 | -0.25 | 11 | 3 | 8 | 0.2266 |
| `recon.reportsDelivered` | 70 | 45 | -1.25 | 11 | 3 | 8 | 0.2266 |
| `recon.retriggerBlocked` | 273 | 280 | 0.35 | 13 | 9 | 4 | 0.2668 |
| `squadPerformance.meanOverall` | 1784.8000000000002 | 1781.1999999999998 | -0.18 | 18 | 9 | 9 | 1 |
| `squadPerformance.p10Overall` | 1700.4 | 1694.7 | -0.285 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1632.6999999999998 | 1651.8999999999999 | 0.96 | 19 | 10 | 9 | 1 |
| `squadPerformance.meanMovement` | 1983.1000000000001 | 1984.2999999999995 | 0.06 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.meanControl` | 1952.3000000000002 | 1945.7000000000003 | -0.33 | 18 | 8 | 10 | 0.8145 |
| `squadPerformance.meanCohesion` | 1880.3999999999996 | 1824.5 | -2.795 | 20 | 6 | 14 | 0.1153 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-regroup-grace-0001 0.15 s (timeline) · phase-0e-regroup-grace-0002 0.15 s (timeline) · phase-0e-regroup-grace-0003 0.15 s (timeline) · phase-0e-regroup-grace-0004 0.15 s (timeline) · phase-0e-regroup-grace-0005 0.15 s (timeline) · phase-0e-regroup-grace-0006 0.15 s (timeline) · phase-0e-regroup-grace-0007 0.15 s (timeline) · phase-0e-regroup-grace-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=291&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=291&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=291`); it opens the seed that parts earliest, and the dropdowns choose another.

