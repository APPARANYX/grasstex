# Benchmark run #290 · 20 seeds from `phase-0e-movement-isolation` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- main @ dab5cb5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37194958705) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 0.15 s); 3 of 32 counters under p 0.05 (about 1.6 by chance), 2 under 0.0016; casualties -16.5% (p 0.8145)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 37125 to 30597 (-17.6%, p 0); regroups.entries 110 to 259 (+135.5%, p 0).
- Under 0.05 only: squadPerformance.meanCohesion 1889.2999999999995 to 1801.7000000000005 (-4.6%, p 0.0118).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.105 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 133 | 111 | -1.1 | 18 | 8 | 10 | 0.8145 |
| `usKills` | 58 | 56 | -0.1 | 14 | 7 | 7 | 1 |
| `geKills` | 75 | 55 | -1 | 16 | 6 | 10 | 0.4545 |
| `fire.total` | 1434 | 1193 | -12.05 | 20 | 7 | 13 | 0.2632 |
| `fire.hits` | 257 | 207 | -2.5 | 20 | 10 | 10 | 1 |
| `retreatSamples` | 256 | 103 | -7.65 | 17 | 7 | 10 | 0.6291 |
| `movementResolver.changes` | 37125 | 30597 | -326.4 | 20 | 1 | 19 | 0 |
| `movementStalls.length` | 2 | 1 | -0.05 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 7 | 17 | 0.5 | 8 | 6 | 2 | 0.2891 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 110 | 259 | 7.45 | 20 | 20 | 0 | 0 |
| `stallOutcomes.wakes` | 119 | 116 | -0.15 | 7 | 3 | 4 | 1 |
| `stallOutcomes.repeats` | 9 | 5 | -0.2 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsets` | 6 | 3 | -0.15 | 3 | 1 | 2 | 1 |
| `timeline.stalledSamples` | 42 | 5 | -1.85 | 4 | 1 | 3 | 0.625 |
| `recon.orders` | 292 | 300 | 0.4 | 15 | 11 | 4 | 0.1185 |
| `recon.contacts` | 5 | 6 | 0.05 | 10 | 6 | 4 | 0.7539 |
| `recon.noContact` | 279 | 278 | -0.05 | 15 | 7 | 8 | 1 |
| `recon.timeouts` | 2 | 3 | 0.05 | 5 | 3 | 2 | 1 |
| `recon.cancelled` | 6 | 7 | 0.05 | 8 | 4 | 4 | 1 |
| `recon.reportsDelivered` | 35 | 31 | -0.2 | 9 | 5 | 4 | 1 |
| `recon.retriggerBlocked` | 279 | 278 | -0.05 | 13 | 6 | 7 | 1 |
| `squadPerformance.meanOverall` | 1782.7999999999997 | 1774.1999999999998 | -0.43 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.p10Overall` | 1695.7 | 1698.8 | 0.155 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1625.1000000000001 | 1639.4999999999995 | 0.72 | 20 | 10 | 10 | 1 |
| `squadPerformance.meanMovement` | 1983.7 | 1986.9 | 0.16 | 17 | 8 | 9 | 1 |
| `squadPerformance.meanControl` | 1949.6000000000001 | 1939.5999999999997 | -0.5 | 18 | 6 | 12 | 0.2379 |
| `squadPerformance.meanCohesion` | 1889.2999999999995 | 1801.7000000000005 | -4.38 | 20 | 4 | 16 | 0.0118 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-movement-isolation-0001 0.15 s (timeline) · phase-0e-movement-isolation-0002 0.15 s (timeline) · phase-0e-movement-isolation-0003 0.15 s (timeline) · phase-0e-movement-isolation-0004 0.15 s (timeline) · phase-0e-movement-isolation-0005 0.15 s (timeline) · phase-0e-movement-isolation-0006 0.15 s (timeline) · phase-0e-movement-isolation-0007 0.15 s (timeline) · phase-0e-movement-isolation-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=290&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=290`); it opens the seed that parts earliest, and the dropdowns choose another.

