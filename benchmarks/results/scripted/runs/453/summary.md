# Benchmark run #453 · 60 seeds from `control` (meeting), windows `every120`

- **OFF** flags: `medic=0` · **ON** flags: `none`
- claude/medic-at-base @ 1acb9bf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37833605430) · build v29-dev

## Verdict

**WEAK: 176 of 292 pairs changed (median first part 371.55 s); 4 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.1% (p 1)**

- Under 0.05 only: usKills 3865 to 3841 (-0.6%, p 0.0039); squadPerformance.meanCohesion 25677.899999999987 to 25655.99999999999 (-0.1%, p 0.0043); movementResolver.changes 660094 to 660626 (+0.1%, p 0.007); fire.hits 7386 to 7403 (+0.2%, p 0.0352).

## Paired comparison (off against on)

- **292** pairs (unpaired: off 0, on 0) · identical in every field: **116** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 120 changed records first part at simulated second: min 268.05, p10 296.1, median 371.55, p90 432, max 597

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8556 | 8546 | -0.0342 | 13 | 6 | 7 | 1 |
| `usKills` | 3865 | 3841 | -0.0822 | 9 | 0 | 9 | 0.0039 |
| `geKills` | 4691 | 4705 | 0.0479 | 10 | 8 | 2 | 0.1094 |
| `fire.total` | 21299 | 21352 | 0.1815 | 16 | 11 | 5 | 0.2101 |
| `fire.hits` | 7386 | 7403 | 0.0582 | 15 | 12 | 3 | 0.0352 |
| `retreatSamples` | 96908 | 96498 | -1.4041 | 19 | 5 | 14 | 0.0636 |
| `movementResolver.changes` | 660094 | 660626 | 1.8219 | 32 | 24 | 8 | 0.007 |
| `movementStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 310 | 309 | -0.0034 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 238 | 238 | 0 | 8 | 4 | 4 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 537 | 532 | -0.0171 | 4 | 1 | 3 | 0.625 |
| `stallOutcomes.wakes` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 546 | 546 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1435 | 1435 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 6832 | 6837 | 0.0171 | 16 | 11 | 5 | 0.2101 |
| `recon.contacts` | 308 | 306 | -0.0068 | 4 | 1 | 3 | 0.625 |
| `recon.noContact` | 4501 | 4512 | 0.0377 | 9 | 7 | 2 | 0.1797 |
| `recon.timeouts` | 206 | 207 | 0.0034 | 3 | 2 | 1 | 1 |
| `recon.cancelled` | 1594 | 1592 | -0.0068 | 7 | 3 | 4 | 1 |
| `recon.reportsDelivered` | 1624 | 1615 | -0.0308 | 4 | 1 | 3 | 0.625 |
| `recon.retriggerBlocked` | 5243 | 5247 | 0.0137 | 10 | 6 | 4 | 0.7539 |
| `squadPerformance.meanOverall` | 25264.89999999999 | 25263.299999999992 | -0.0055 | 17 | 7 | 10 | 0.6291 |
| `squadPerformance.p10Overall` | 23728.299999999967 | 23729.19999999997 | 0.0031 | 9 | 6 | 3 | 0.5078 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21040.09999999998 | 21051.299999999985 | 0.0384 | 17 | 11 | 6 | 0.3323 |
| `squadPerformance.meanMovement` | 28793.600000000017 | 28790.300000000017 | -0.0113 | 15 | 8 | 7 | 1 |
| `squadPerformance.meanControl` | 28783.600000000013 | 28781.200000000004 | -0.0082 | 12 | 4 | 8 | 0.3877 |
| `squadPerformance.meanCohesion` | 25677.899999999987 | 25655.99999999999 | -0.075 | 22 | 4 | 18 | 0.0043 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0024 268.05 s (stress) · control-0038 280.05 s (stress) · control-0027 287.1 s (stress) · control-0023 296.1 s (stress) · control-0046 297 s (stress) · control-0025 308.1 s (stress) · control-0009 317.1 s (stress) · control-0057 323.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=453&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=453`); it opens the seed that parts earliest, and the dropdowns choose another.

