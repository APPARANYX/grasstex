# Benchmark run #405 · 60 seeds from `control` (us-defend), windows `every120`

- **OFF** flags: `unreachableAnchor=0` · **ON** flags: `none`
- claude/fix-stale-ack-anchor @ 8e5f3ee · [run](https://github.com/APPARANYX/grasstex/actions/runs/37772771511) · build v29-dev

## Verdict

**WEAK: 133 of 276 pairs changed (median first part 275.1 s); 1 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.4% (p 0.2295)**

- Under 0.05 only: squadPerformance.meanOverall 24405.700000000004 to 24412.500000000004 (+0.0%, p 0.0436).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **143** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 50 changed records first part at simulated second: min 31.05, p10 31.05, median 275.1, p90 496.05, max 564

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6135 | 6112 | -0.0833 | 34 | 13 | 21 | 0.2295 |
| `usKills` | 2793 | 2814 | 0.0761 | 33 | 16 | 17 | 1 |
| `geKills` | 3342 | 3298 | -0.1594 | 38 | 19 | 19 | 1 |
| `fire.total` | 14958 | 14979 | 0.0761 | 42 | 24 | 18 | 0.4408 |
| `fire.hits` | 4979 | 4993 | 0.0507 | 42 | 20 | 22 | 0.8776 |
| `retreatSamples` | 78707 | 78501 | -0.7464 | 38 | 17 | 21 | 0.6271 |
| `movementResolver.changes` | 454576 | 452446 | -7.7174 | 48 | 22 | 26 | 0.6655 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 38 | 43 | 0.0181 | 9 | 4 | 5 | 1 |
| `loopAlerts.length` | 154 | 145 | -0.0326 | 19 | 8 | 11 | 0.6476 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 513 | 498 | -0.0543 | 28 | 14 | 14 | 1 |
| `stallOutcomes.wakes` | 90 | 92 | 0.0072 | 7 | 5 | 2 | 0.4531 |
| `stallOutcomes.repeats` | 10 | 14 | 0.0145 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11985 | 11974 | -0.0399 | 37 | 19 | 18 | 1 |
| `recon.contacts` | 697 | 715 | 0.0652 | 26 | 18 | 8 | 0.0755 |
| `recon.noContact` | 4837 | 4877 | 0.1449 | 28 | 17 | 11 | 0.3449 |
| `recon.timeouts` | 4038 | 3993 | -0.163 | 30 | 10 | 20 | 0.0987 |
| `recon.cancelled` | 2027 | 2002 | -0.0906 | 28 | 12 | 16 | 0.5716 |
| `recon.reportsDelivered` | 2985 | 2987 | 0.0072 | 28 | 16 | 12 | 0.5716 |
| `recon.retriggerBlocked` | 4932 | 4984 | 0.1884 | 30 | 19 | 11 | 0.2005 |
| `squadPerformance.meanOverall` | 24405.700000000004 | 24412.500000000004 | 0.0246 | 42 | 28 | 14 | 0.0436 |
| `squadPerformance.p10Overall` | 22690.19999999996 | 22721.799999999956 | 0.1145 | 30 | 20 | 10 | 0.0987 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 21699.599999999988 | 21727.999999999993 | 0.1029 | 38 | 24 | 14 | 0.1433 |
| `squadPerformance.meanMovement` | 27432.100000000017 | 27439.70000000002 | 0.0275 | 36 | 20 | 16 | 0.6177 |
| `squadPerformance.meanControl` | 27444.499999999993 | 27447.299999999996 | 0.0101 | 27 | 16 | 11 | 0.4421 |
| `squadPerformance.meanCohesion` | 23263.89999999999 | 23224.899999999994 | -0.1413 | 45 | 21 | 24 | 0.766 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0034 31.05 s (timeline) · control-0026 63.15 s (timeline) · control-0031 86.1 s (timeline) · control-0042 153 s (stress) · control-0054 221.1 s (timeline) · control-0022 275.1 s (timeline) · control-0037 310.05 s (timeline) · control-0009 330 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=405&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=405`); it opens the seed that parts earliest, and the dropdowns choose another.

