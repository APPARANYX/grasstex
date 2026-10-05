# Benchmark run #326 · 20 seeds from `phase-0e-posture-20` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=1&commandMovement=0&commandRelay=0`
- main @ 0545a54 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37265770623) · build v29-dev

## Verdict

**QUIET: 20 of 20 pairs changed (median first part 81.07499999999999 s); 0 of 32 counters under p 0.05 (about 1.6 by chance); casualties +20.6% (p 0.4807)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.333 is over the 1.25 gate.

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.333 (gate 1.25)
- the 20 changed records first part at simulated second: min 46.05, p10 46.05, median 81.07499999999999, p90 140.1, max 158.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 107 | 129 | 1.1 | 18 | 7 | 11 | 0.4807 |
| `usKills` | 49 | 60 | 0.55 | 12 | 7 | 5 | 0.7744 |
| `geKills` | 58 | 69 | 0.55 | 16 | 6 | 10 | 0.4545 |
| `fire.total` | 1016 | 1479 | 23.15 | 19 | 13 | 6 | 0.1671 |
| `fire.hits` | 192 | 270 | 3.9 | 19 | 10 | 9 | 1 |
| `retreatSamples` | 174 | 412 | 11.9 | 11 | 8 | 3 | 0.2266 |
| `movementResolver.changes` | 32359 | 33195 | 41.8 | 20 | 13 | 7 | 0.2632 |
| `movementStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 8 | 10 | 0.1 | 4 | 3 | 1 | 0.625 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 3 | 1 | 2 | 1 |
| `stallOutcomes.wakes` | 6 | 3 | -0.15 | 3 | 1 | 2 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1445 | 1445 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 247 | 241 | -0.3 | 8 | 3 | 5 | 0.7266 |
| `recon.contacts` | 3 | 6 | 0.15 | 3 | 3 | 0 | 0.25 |
| `recon.noContact` | 240 | 231 | -0.45 | 9 | 2 | 7 | 0.1797 |
| `recon.timeouts` | 1 | 3 | 0.1 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 2 | 1 | -0.05 | 3 | 1 | 2 | 1 |
| `recon.reportsDelivered` | 22 | 48 | 1.3 | 4 | 4 | 0 | 0.125 |
| `recon.retriggerBlocked` | 238 | 231 | -0.35 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.meanOverall` | 1805.8 | 1792.4999999999998 | -0.665 | 18 | 6 | 12 | 0.2379 |
| `squadPerformance.p10Overall` | 1745.9 | 1719.8999999999999 | -1.3 | 18 | 8 | 10 | 0.8145 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1685.6 | 1643.3 | -2.115 | 14 | 3 | 11 | 0.0574 |
| `squadPerformance.meanMovement` | 1988.9 | 1987.8000000000002 | -0.055 | 12 | 7 | 5 | 0.7744 |
| `squadPerformance.meanControl` | 1970.8999999999999 | 1973.1999999999998 | 0.115 | 12 | 9 | 3 | 0.146 |
| `squadPerformance.meanCohesion` | 1903.1999999999998 | 1912.8999999999999 | 0.485 | 19 | 11 | 8 | 0.6476 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-posture-20-0002 46.05 s (timeline) · phase-0e-posture-20-0019 46.05 s (timeline) · phase-0e-posture-20-0009 48 s (timeline) · phase-0e-posture-20-0003 64.05 s (timeline) · phase-0e-posture-20-0006 67.05 s (timeline) · phase-0e-posture-20-0001 78 s (timeline) · phase-0e-posture-20-0008 78 s (timeline) · phase-0e-posture-20-0018 78 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=326&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=326`); it opens the seed that parts earliest, and the dropdowns choose another.

