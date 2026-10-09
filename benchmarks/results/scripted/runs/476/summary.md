# Benchmark run #476 · 60 seeds from `retreat398p` (ge-defend), windows `contact+600`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- claude/retreat-anchor-slot @ 8bf6933 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37871876824) · build v29-dev

## Verdict

**QUIET: 44 of 55 pairs changed (median first part 389.55 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.5% (p 0.5235)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **11** · runtime errors off 0 / on 0 · wall time on/off x0.96 (gate 1.25)
- the 36 changed records first part at simulated second: min 174, p10 247.05, median 389.55, p90 552.15, max 584.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2524 | 2512 | -0.2182 | 22 | 13 | 9 | 0.5235 |
| `usKills` | 986 | 1001 | 0.2727 | 21 | 10 | 11 | 1 |
| `geKills` | 1538 | 1511 | -0.4909 | 24 | 10 | 14 | 0.5413 |
| `fire.total` | 18684 | 18468 | -3.9273 | 29 | 11 | 18 | 0.2649 |
| `fire.hits` | 6085 | 6013 | -1.3091 | 28 | 14 | 14 | 1 |
| `retreatSamples` | 99435 | 99221 | -3.8909 | 30 | 14 | 16 | 0.8555 |
| `movementResolver.changes` | 145111 | 145005 | -1.9273 | 35 | 18 | 17 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 44 | 42 | -0.0364 | 10 | 5 | 5 | 1 |
| `loopAlerts.length` | 217 | 214 | -0.0545 | 15 | 6 | 9 | 0.6072 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 218 | 229 | 0.2 | 14 | 6 | 8 | 0.7905 |
| `stallOutcomes.wakes` | 11 | 12 | 0.0182 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1827 | 1805 | -0.4 | 22 | 6 | 16 | 0.0525 |
| `recon.contacts` | 235 | 220 | -0.2727 | 16 | 5 | 11 | 0.2101 |
| `recon.noContact` | 584 | 591 | 0.1273 | 13 | 8 | 5 | 0.5811 |
| `recon.timeouts` | 470 | 468 | -0.0364 | 17 | 7 | 10 | 0.6291 |
| `recon.cancelled` | 514 | 499 | -0.2727 | 23 | 10 | 13 | 0.6776 |
| `recon.reportsDelivered` | 958 | 883 | -1.3636 | 19 | 6 | 13 | 0.1671 |
| `recon.retriggerBlocked` | 664 | 667 | 0.0545 | 17 | 9 | 8 | 1 |
| `squadPerformance.meanOverall` | 4540.299999999999 | 4538.100000000001 | -0.04 | 27 | 12 | 15 | 0.7011 |
| `squadPerformance.p10Overall` | 4121.6 | 4120.9 | -0.0127 | 6 | 3 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3690.4999999999995 | 3680.4 | -0.1836 | 24 | 10 | 14 | 0.5413 |
| `squadPerformance.meanMovement` | 5466.400000000001 | 5466.8 | 0.0073 | 13 | 10 | 3 | 0.0923 |
| `squadPerformance.meanControl` | 5362.5 | 5365 | 0.0455 | 20 | 12 | 8 | 0.5034 |
| `squadPerformance.meanCohesion` | 4933.300000000002 | 4932.7 | -0.0109 | 28 | 12 | 16 | 0.5716 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

retreat398p-0018 174 s (timeline) · retreat398p-0034 194.1 s (timeline) · retreat398p-0049 241.05 s (timeline) · retreat398p-0051 247.05 s (timeline) · retreat398p-0011 265.05 s (timeline) · retreat398p-0002 274.05 s (timeline) · retreat398p-0023 284.1 s (timeline) · retreat398p-0013 292.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=476&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=476`); it opens the seed that parts earliest, and the dropdowns choose another.

