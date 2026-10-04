# Benchmark run #308 · 20 seeds from `phase-0e-rally-release` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ be88c37 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37208130945) · build v29-dev

## Verdict

**QUIET: 20 of 20 pairs changed (median first part 0.15 s); 0 of 32 counters under p 0.05 (about 1.6 by chance); casualties -8.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.13 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 112 | 103 | -0.45 | 15 | 7 | 8 | 1 |
| `usKills` | 43 | 37 | -0.3 | 14 | 5 | 9 | 0.424 |
| `geKills` | 69 | 66 | -0.15 | 15 | 8 | 7 | 1 |
| `fire.total` | 1632 | 1325 | -15.35 | 20 | 8 | 12 | 0.5034 |
| `fire.hits` | 258 | 204 | -2.7 | 19 | 8 | 11 | 0.6476 |
| `retreatSamples` | 208 | 171 | -1.85 | 14 | 7 | 7 | 1 |
| `movementResolver.changes` | 35202 | 33897 | -65.25 | 20 | 6 | 14 | 0.1153 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 6 | 6 | 0 | 10 | 5 | 5 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 1 | -0.15 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.wakes` | 1 | 2 | 0.05 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 1 | 0.05 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 5 | 0.25 | 1 | 1 | 0 | 1 |
| `recon.orders` | 289 | 290 | 0.05 | 14 | 7 | 7 | 1 |
| `recon.contacts` | 7 | 6 | -0.05 | 8 | 4 | 4 | 1 |
| `recon.noContact` | 270 | 272 | 0.1 | 14 | 8 | 6 | 0.7905 |
| `recon.timeouts` | 2 | 4 | 0.1 | 4 | 3 | 1 | 0.625 |
| `recon.cancelled` | 6 | 4 | -0.1 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 53 | 32 | -1.05 | 7 | 3 | 4 | 1 |
| `recon.retriggerBlocked` | 269 | 273 | 0.2 | 15 | 9 | 6 | 0.6072 |
| `squadPerformance.meanOverall` | 1794.7000000000003 | 1803.7 | 0.45 | 19 | 11 | 8 | 0.6476 |
| `squadPerformance.p10Overall` | 1700.1000000000001 | 1709.1000000000001 | 0.45 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1654.9000000000003 | 1658.7 | 0.19 | 19 | 9 | 10 | 1 |
| `squadPerformance.meanMovement` | 1987.8999999999999 | 1986.8000000000002 | -0.055 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.meanControl` | 1965.8000000000002 | 1965.2 | -0.03 | 18 | 8 | 10 | 0.8145 |
| `squadPerformance.meanCohesion` | 1867.8999999999996 | 1891.2000000000003 | 1.165 | 20 | 13 | 7 | 0.2632 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-rally-release-0001 0.15 s (timeline) · phase-0e-rally-release-0002 0.15 s (timeline) · phase-0e-rally-release-0003 0.15 s (timeline) · phase-0e-rally-release-0004 0.15 s (timeline) · phase-0e-rally-release-0005 0.15 s (timeline) · phase-0e-rally-release-0006 0.15 s (timeline) · phase-0e-rally-release-0007 0.15 s (timeline) · phase-0e-rally-release-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=308&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=308&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=308`); it opens the seed that parts earliest, and the dropdowns choose another.

