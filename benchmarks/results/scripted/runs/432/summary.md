# Benchmark run #432 · 60 seeds from `exec361` (meeting), windows `contact+300`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- claude/project-thread-d6qmpr @ 281eecf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37780252402) · build v29-dev

## Verdict

**QUIET: 6 of 60 pairs changed (median first part 276.525 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.7% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- the 2 changed records first part at simulated second: min 117, p10 117, median 276.525, p90 436.05, max 436.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2729 | 2748 | 0.3167 | 1 | 1 | 0 | 1 |
| `usKills` | 1304 | 1314 | 0.1667 | 1 | 1 | 0 | 1 |
| `geKills` | 1425 | 1434 | 0.15 | 1 | 1 | 0 | 1 |
| `fire.total` | 20018 | 20185 | 2.7833 | 1 | 1 | 0 | 1 |
| `fire.hits` | 6684 | 6714 | 0.5 | 1 | 1 | 0 | 1 |
| `retreatSamples` | 51705 | 51476 | -3.8167 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 173691 | 173506 | -3.0833 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 163 | 164 | 0.0167 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 187 | 188 | 0.0167 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 173 | 170 | -0.05 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 23 | 25 | 0.0333 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 562 | 652 | 1.5 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 562 | 652 | 1.5 | 1 | 1 | 0 | 1 |
| `recon.orders` | 1732 | 1727 | -0.0833 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 82 | 82 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1065 | 1062 | -0.05 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 473 | 471 | -0.0333 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 434 | 434 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1276 | 1271 | -0.0833 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 4910.499999999998 | 4910.999999999998 | 0.0083 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 4493.399999999999 | 4495.099999999999 | 0.0283 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3921.0000000000005 | 3925.3 | 0.0717 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 5939.299999999999 | 5938.399999999999 | -0.015 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanControl` | 5815.800000000001 | 5815.300000000001 | -0.0083 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanCohesion` | 5343.500000000001 | 5342.100000000001 | -0.0233 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

exec361-0037 117 s (timeline) · exec361-0049 436.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=432&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=432`); it opens the seed that parts earliest, and the dropdowns choose another.

