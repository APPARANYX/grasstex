# Benchmark run #329 · 100 seeds from `phase-0e-posture-100` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=1&commandMovement=0&commandRelay=0`
- main @ fa78be6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37298387423) · build v29-dev

## Verdict

**QUIET: 100 of 100 pairs changed (median first part 87 s); 0 of 32 counters under p 0.05 (about 1.6 by chance); casualties -9.3% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.067 (gate 1.25)
- the 100 changed records first part at simulated second: min 39, p10 61.05, median 87, p90 119.1, max 163.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 666 | 604 | -0.62 | 83 | 41 | 42 | 1 |
| `usKills` | 316 | 277 | -0.39 | 71 | 30 | 41 | 0.2351 |
| `geKills` | 350 | 327 | -0.23 | 70 | 40 | 30 | 0.282 |
| `fire.total` | 6518 | 6519 | 0.01 | 92 | 44 | 48 | 0.7547 |
| `fire.hits` | 1244 | 1154 | -0.9 | 92 | 49 | 43 | 0.6024 |
| `retreatSamples` | 1198 | 1335 | 1.37 | 66 | 37 | 29 | 0.3891 |
| `movementResolver.changes` | 169351 | 170326 | 9.75 | 99 | 51 | 48 | 0.8408 |
| `movementStalls.length` | 9 | 10 | 0.01 | 4 | 3 | 1 | 0.625 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 46 | 69 | 0.23 | 39 | 23 | 16 | 0.3368 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 22 | 26 | 0.04 | 20 | 13 | 7 | 0.2632 |
| `stallOutcomes.wakes` | 4 | 7 | 0.03 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 18 | 20 | 0.02 | 4 | 3 | 1 | 0.625 |
| `timeline.stalledSamples` | 253 | 567 | 3.14 | 4 | 4 | 0 | 0.125 |
| `recon.orders` | 1385 | 1376 | -0.09 | 57 | 24 | 33 | 0.2892 |
| `recon.contacts` | 29 | 22 | -0.07 | 20 | 7 | 13 | 0.2632 |
| `recon.noContact` | 1288 | 1281 | -0.07 | 41 | 16 | 25 | 0.211 |
| `recon.timeouts` | 13 | 16 | 0.03 | 13 | 8 | 5 | 0.5811 |
| `recon.cancelled` | 45 | 41 | -0.04 | 31 | 14 | 17 | 0.7201 |
| `recon.reportsDelivered` | 162 | 155 | -0.07 | 18 | 8 | 10 | 0.8145 |
| `recon.retriggerBlocked` | 1287 | 1279 | -0.08 | 47 | 20 | 27 | 0.3817 |
| `squadPerformance.meanOverall` | 8967.8 | 8953.599999999997 | -0.142 | 93 | 42 | 51 | 0.4069 |
| `squadPerformance.p10Overall` | 8559.099999999999 | 8524.799999999997 | -0.343 | 91 | 43 | 48 | 0.6752 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8291.599999999999 | 8266.199999999997 | -0.254 | 82 | 44 | 38 | 0.5811 |
| `squadPerformance.meanMovement` | 9921.799999999997 | 9939.699999999999 | 0.179 | 74 | 41 | 33 | 0.416 |
| `squadPerformance.meanControl` | 9814.5 | 9805.200000000003 | -0.093 | 69 | 34 | 35 | 1 |
| `squadPerformance.meanCohesion` | 9405.7 | 9347.400000000003 | -0.583 | 95 | 39 | 56 | 0.1002 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-posture-100-0065 39 s (timeline) · phase-0e-posture-100-0082 42 s (timeline) · phase-0e-posture-100-0045 43.05 s (timeline) · phase-0e-posture-100-0093 45 s (timeline) · phase-0e-posture-100-0079 49.05 s (timeline) · phase-0e-posture-100-0036 50.1 s (timeline) · phase-0e-posture-100-0018 53.1 s (timeline) · phase-0e-posture-100-0032 53.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=329&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=329`); it opens the seed that parts earliest, and the dropdowns choose another.

