# Benchmark run #455 · 60 seeds from `control` (ge-defend), windows `every120`

- **OFF** flags: `medic=0` · **ON** flags: `none`
- claude/medic-at-base @ 1acb9bf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37833612324) · build v29-dev

## Verdict

**WEAK: 130 of 276 pairs changed (median first part 351 s); 3 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.1% (p 0.5488)**

- Under 0.05 only: retreatSamples 83051 to 82689 (-0.4%, p 0.0075); recon.orders 12412 to 12423 (+0.1%, p 0.0309); squadPerformance.meanCohesion 22957.400000000016 to 22942.500000000015 (-0.1%, p 0.049).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **146** · runtime errors off 0 / on 0 · wall time on/off x0.945 (gate 1.25)
- the 93 changed records first part at simulated second: min 228, p10 266.1, median 351, p90 479.1, max 594

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6768 | 6763 | -0.0181 | 11 | 4 | 7 | 0.5488 |
| `usKills` | 2996 | 2999 | 0.0109 | 7 | 3 | 4 | 1 |
| `geKills` | 3772 | 3764 | -0.029 | 9 | 3 | 6 | 0.5078 |
| `fire.total` | 16454 | 16502 | 0.1739 | 16 | 10 | 6 | 0.4545 |
| `fire.hits` | 5562 | 5548 | -0.0507 | 14 | 6 | 8 | 0.7905 |
| `retreatSamples` | 83051 | 82689 | -1.3116 | 18 | 3 | 15 | 0.0075 |
| `movementResolver.changes` | 479532 | 480024 | 1.7826 | 22 | 16 | 6 | 0.0525 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 41 | 43 | 0.0072 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 208 | 205 | -0.0109 | 5 | 1 | 4 | 0.375 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 380 | 383 | 0.0109 | 6 | 4 | 2 | 0.6875 |
| `stallOutcomes.wakes` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 127 | 127 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 12412 | 12423 | 0.0399 | 18 | 14 | 4 | 0.0309 |
| `recon.contacts` | 1150 | 1145 | -0.0181 | 9 | 3 | 6 | 0.5078 |
| `recon.noContact` | 4482 | 4484 | 0.0072 | 9 | 6 | 3 | 0.5078 |
| `recon.timeouts` | 4274 | 4271 | -0.0109 | 13 | 7 | 6 | 1 |
| `recon.cancelled` | 2082 | 2093 | 0.0399 | 11 | 8 | 3 | 0.2266 |
| `recon.reportsDelivered` | 5101 | 5094 | -0.0254 | 11 | 6 | 5 | 1 |
| `recon.retriggerBlocked` | 4931 | 4928 | -0.0109 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.meanOverall` | 24408.200000000004 | 24405.700000000004 | -0.0091 | 17 | 6 | 11 | 0.3323 |
| `squadPerformance.p10Overall` | 22711.59999999998 | 22712.499999999978 | 0.0033 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21831.59999999997 | 21835.99999999997 | 0.0159 | 18 | 11 | 7 | 0.4807 |
| `squadPerformance.meanMovement` | 27417.800000000003 | 27419.5 | 0.0062 | 11 | 6 | 5 | 1 |
| `squadPerformance.meanControl` | 27445.79999999999 | 27447.59999999998 | 0.0065 | 8 | 4 | 4 | 1 |
| `squadPerformance.meanCohesion` | 22957.400000000016 | 22942.500000000015 | -0.054 | 17 | 4 | 13 | 0.049 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0044 228 s (stress) · control-0040 260.1 s (stress) · control-0015 266.1 s (stress) · control-0009 280.05 s (stress) · control-0024 280.05 s (stress) · control-0035 295.05 s (stress) · control-0056 315 s (stress) · control-0004 316.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=455&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=455`); it opens the seed that parts earliest, and the dropdowns choose another.

