# Benchmark run #295 · 20 seeds from `phase-0e-rally-area-fixed` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ 1d55e10 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37198866154) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 0.15 s); 6 of 32 counters under p 0.05 (about 1.6 by chance), 4 under 0.0016; casualties -14.1% (p 0.8238)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 34833 to 27081 (-22.3%, p 0); regroups.entries 4 to 50 (+1150.0%, p 0); squadPerformance.meanOverall 1779.8 to 1712.2 (-3.8%, p 0); squadPerformance.meanCohesion 1889.1999999999998 to 1485.9 (-21.3%, p 0).
- Under 0.05 only: squadPerformance.p10Overall 1699.7000000000003 to 1606.2000000000005 (-5.5%, p 0.0118); recon.timeouts 2 to 9 (+350.0%, p 0.0156).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.036 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 149 | 128 | -1.05 | 20 | 11 | 9 | 0.8238 |
| `usKills` | 62 | 60 | -0.1 | 15 | 8 | 7 | 1 |
| `geKills` | 87 | 68 | -0.95 | 18 | 7 | 11 | 0.4807 |
| `fire.total` | 1639 | 1267 | -18.6 | 19 | 12 | 7 | 0.3593 |
| `fire.hits` | 292 | 266 | -1.3 | 20 | 12 | 8 | 0.5034 |
| `retreatSamples` | 363 | 398 | 1.75 | 15 | 9 | 6 | 0.6072 |
| `movementResolver.changes` | 34833 | 27081 | -387.6 | 20 | 0 | 20 | 0 |
| `movementStalls.length` | 0 | 6 | 0.3 | 2 | 2 | 0 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 10 | 28 | 0.9 | 12 | 9 | 3 | 0.146 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 50 | 2.3 | 20 | 19 | 1 | 0 |
| `stallOutcomes.wakes` | 101 | 112 | 0.55 | 8 | 5 | 3 | 0.7266 |
| `stallOutcomes.repeats` | 16 | 17 | 0.05 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 2 | 12 | 0.5 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamples` | 93 | 181 | 4.4 | 3 | 2 | 1 | 1 |
| `recon.orders` | 288 | 280 | -0.4 | 17 | 7 | 10 | 0.6291 |
| `recon.contacts` | 5 | 6 | 0.05 | 4 | 3 | 1 | 0.625 |
| `recon.noContact` | 274 | 254 | -1 | 13 | 3 | 10 | 0.0923 |
| `recon.timeouts` | 2 | 9 | 0.35 | 7 | 7 | 0 | 0.0156 |
| `recon.cancelled` | 6 | 6 | 0 | 7 | 3 | 4 | 1 |
| `recon.reportsDelivered` | 39 | 40 | 0.05 | 5 | 3 | 2 | 1 |
| `recon.retriggerBlocked` | 274 | 263 | -0.55 | 13 | 5 | 8 | 0.5811 |
| `squadPerformance.meanOverall` | 1779.8 | 1712.2 | -3.38 | 20 | 1 | 19 | 0 |
| `squadPerformance.p10Overall` | 1699.7000000000003 | 1606.2000000000005 | -4.675 | 20 | 4 | 16 | 0.0118 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1611.9 | 1613.1999999999998 | 0.065 | 19 | 9 | 10 | 1 |
| `squadPerformance.meanMovement` | 1986 | 1979 | -0.35 | 18 | 5 | 13 | 0.0963 |
| `squadPerformance.meanControl` | 1949.2999999999997 | 1936.7000000000003 | -0.63 | 19 | 6 | 13 | 0.1671 |
| `squadPerformance.meanCohesion` | 1889.1999999999998 | 1485.9 | -20.165 | 20 | 0 | 20 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-rally-area-fixed-0001 0.15 s (timeline) · phase-0e-rally-area-fixed-0002 0.15 s (timeline) · phase-0e-rally-area-fixed-0003 0.15 s (timeline) · phase-0e-rally-area-fixed-0004 0.15 s (timeline) · phase-0e-rally-area-fixed-0005 0.15 s (timeline) · phase-0e-rally-area-fixed-0006 0.15 s (timeline) · phase-0e-rally-area-fixed-0007 0.15 s (timeline) · phase-0e-rally-area-fixed-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=295&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=295&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=295`); it opens the seed that parts earliest, and the dropdowns choose another.

