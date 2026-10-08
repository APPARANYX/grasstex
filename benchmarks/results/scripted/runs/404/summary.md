# Benchmark run #404 · 60 seeds from `control` (meeting), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 8e5f3ee · [run](https://github.com/APPARANYX/grasstex/actions/runs/37772767939) · build v29-dev

## Verdict

**WEAK: 237 of 292 pairs changed (median first part 282 s); 4 of 34 counters under p 0.05 (about 1.7 by chance); casualties -1.2% (p 0.1875)**

- Under 0.05 only: stallOutcomes.repeats 28 to 39 (+39.3%, p 0.002); stallOutcomes.wakes 66 to 83 (+25.8%, p 0.0026); regroups.entries 498 to 468 (-6.0%, p 0.0328); retreatSamples 94369 to 93943 (-0.5%, p 0.0399).
- Unpaired records: off 1, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **292** pairs (unpaired: off 1, on 1) · identical in every field: **55** · runtime errors off 0 / on 0 · wall time on/off x0.955 (gate 1.25)
- the 115 changed records first part at simulated second: min 32.1, p10 131.1, median 282, p90 442.05, max 580.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8108 | 8008 | -0.3425 | 83 | 35 | 48 | 0.1875 |
| `usKills` | 3643 | 3548 | -0.3253 | 81 | 32 | 49 | 0.0748 |
| `geKills` | 4465 | 4460 | -0.0171 | 73 | 35 | 38 | 0.8151 |
| `fire.total` | 21735 | 21603 | -0.4521 | 90 | 43 | 47 | 0.752 |
| `fire.hits` | 7394 | 7266 | -0.4384 | 87 | 38 | 49 | 0.2836 |
| `retreatSamples` | 94369 | 93943 | -1.4589 | 86 | 33 | 53 | 0.0399 |
| `movementResolver.changes` | 640096 | 633579 | -22.3185 | 113 | 47 | 66 | 0.09 |
| `movementStalls.length` | 11 | 9 | -0.0068 | 6 | 2 | 4 | 0.6875 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 291 | 290 | -0.0034 | 47 | 24 | 23 | 1 |
| `loopAlerts.length` | 246 | 234 | -0.0411 | 49 | 27 | 22 | 0.5682 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 498 | 468 | -0.1027 | 50 | 17 | 33 | 0.0328 |
| `stallOutcomes.wakes` | 66 | 83 | 0.0582 | 23 | 19 | 4 | 0.0026 |
| `stallOutcomes.repeats` | 28 | 39 | 0.0377 | 10 | 10 | 0 | 0.002 |
| `timeline.stalledOnsets` | 11 | 9 | -0.0068 | 6 | 2 | 4 | 0.6875 |
| `timeline.stalledSamples` | 730 | 562 | -0.5753 | 8 | 5 | 3 | 0.7266 |
| `timeline.stalledOnsetsRepeated` | 32 | 21 | -0.0377 | 7 | 1 | 6 | 0.125 |
| `timeline.stalledSamplesRepeated` | 1906 | 1471 | -1.4897 | 10 | 5 | 5 | 1 |
| `recon.orders` | 6656 | 6642 | -0.0479 | 77 | 40 | 37 | 0.8199 |
| `recon.contacts` | 305 | 314 | 0.0308 | 37 | 21 | 16 | 0.5114 |
| `recon.noContact` | 4454 | 4421 | -0.113 | 52 | 22 | 30 | 0.3317 |
| `recon.timeouts` | 165 | 176 | 0.0377 | 33 | 21 | 12 | 0.1628 |
| `recon.cancelled` | 1550 | 1529 | -0.0719 | 60 | 26 | 34 | 0.3663 |
| `recon.reportsDelivered` | 1625 | 1680 | 0.1884 | 40 | 22 | 18 | 0.6358 |
| `recon.retriggerBlocked` | 5104 | 5081 | -0.0788 | 67 | 31 | 36 | 0.6254 |
| `squadPerformance.meanOverall` | 25345.799999999985 | 25347.399999999994 | 0.0055 | 94 | 52 | 42 | 0.3533 |
| `squadPerformance.p10Overall` | 23844.199999999983 | 23870.499999999978 | 0.0901 | 72 | 38 | 34 | 0.7239 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21109.79999999999 | 21084.199999999986 | -0.0877 | 91 | 46 | 45 | 1 |
| `squadPerformance.meanMovement` | 28895.399999999994 | 28877.700000000008 | -0.0606 | 86 | 40 | 46 | 0.59 |
| `squadPerformance.meanControl` | 28889.299999999996 | 28887.49999999999 | -0.0062 | 79 | 33 | 46 | 0.1766 |
| `squadPerformance.meanCohesion` | 25765.099999999995 | 25769.699999999997 | 0.0158 | 97 | 47 | 50 | 0.8392 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0034 32.1 s (timeline) · control-0002 36 s (timeline) · control-0046 131.1 s (timeline) · control-0013 135 s (timeline) · control-0039 136.05 s (timeline) · control-0042 137.1 s (timeline) · control-0004 139.05 s (timeline) · control-0030 149.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=404&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=404`); it opens the seed that parts earliest, and the dropdowns choose another.

