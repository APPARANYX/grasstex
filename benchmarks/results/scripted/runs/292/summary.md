# Benchmark run #292 · 20 seeds from `phase-0e-tactical-radius` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ 7e9761c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37196932225) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 0.15 s); 6 of 32 counters under p 0.05 (about 1.6 by chance), 5 under 0.0016; casualties +14.6% (p 1)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 34500 to 25707 (-25.5%, p 0); regroups.entries 7 to 53 (+657.1%, p 0); squadPerformance.meanOverall 1786.9999999999998 to 1734.2999999999995 (-2.9%, p 0); squadPerformance.meanCohesion 1882.7000000000003 to 1529.9 (-18.7%, p 0); squadPerformance.p10Overall 1699.4999999999998 to 1637.9000000000005 (-3.6%, p 0.0007).
- Under 0.05 only: recon.reportsDelivered 72 to 23 (-68.1%, p 0.0391).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.051 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 103 | 118 | 0.75 | 17 | 8 | 9 | 1 |
| `usKills` | 57 | 53 | -0.2 | 15 | 6 | 9 | 0.6072 |
| `geKills` | 46 | 65 | 0.95 | 16 | 10 | 6 | 0.4545 |
| `fire.total` | 1168 | 1223 | 2.75 | 20 | 10 | 10 | 1 |
| `fire.hits` | 196 | 241 | 2.25 | 18 | 9 | 9 | 1 |
| `retreatSamples` | 224 | 141 | -4.15 | 9 | 3 | 6 | 0.5078 |
| `movementResolver.changes` | 34500 | 25707 | -439.65 | 20 | 0 | 20 | 0 |
| `movementStalls.length` | 2 | 1 | -0.05 | 3 | 1 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 11 | 19 | 0.4 | 13 | 10 | 3 | 0.0923 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 53 | 2.3 | 18 | 18 | 0 | 0 |
| `stallOutcomes.wakes` | 116 | 100 | -0.8 | 6 | 1 | 5 | 0.2188 |
| `stallOutcomes.repeats` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 3 | 1 | 2 | 1 |
| `timeline.stalledSamples` | 78 | 67 | -0.55 | 3 | 1 | 2 | 1 |
| `recon.orders` | 280 | 275 | -0.25 | 13 | 4 | 9 | 0.2668 |
| `recon.contacts` | 11 | 4 | -0.35 | 7 | 1 | 6 | 0.125 |
| `recon.noContact` | 259 | 257 | -0.1 | 14 | 7 | 7 | 1 |
| `recon.timeouts` | 3 | 6 | 0.15 | 5 | 4 | 1 | 0.375 |
| `recon.cancelled` | 5 | 4 | -0.05 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 72 | 23 | -2.45 | 9 | 1 | 8 | 0.0391 |
| `recon.retriggerBlocked` | 261 | 259 | -0.1 | 15 | 6 | 9 | 0.6072 |
| `squadPerformance.meanOverall` | 1786.9999999999998 | 1734.2999999999995 | -2.635 | 20 | 1 | 19 | 0 |
| `squadPerformance.p10Overall` | 1699.4999999999998 | 1637.9000000000005 | -3.08 | 19 | 2 | 17 | 0.0007 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1643.7 | 1652.1 | 0.42 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.meanMovement` | 1988.5000000000002 | 1978.5 | -0.5 | 20 | 7 | 13 | 0.2632 |
| `squadPerformance.meanControl` | 1953.1000000000004 | 1944.9999999999998 | -0.405 | 16 | 5 | 11 | 0.2101 |
| `squadPerformance.meanCohesion` | 1882.7000000000003 | 1529.9 | -17.64 | 20 | 0 | 20 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-tactical-radius-0001 0.15 s (timeline) · phase-0e-tactical-radius-0002 0.15 s (timeline) · phase-0e-tactical-radius-0003 0.15 s (timeline) · phase-0e-tactical-radius-0004 0.15 s (timeline) · phase-0e-tactical-radius-0005 0.15 s (timeline) · phase-0e-tactical-radius-0006 0.15 s (timeline) · phase-0e-tactical-radius-0007 0.15 s (timeline) · phase-0e-tactical-radius-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=292&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=292&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=292`); it opens the seed that parts earliest, and the dropdowns choose another.

