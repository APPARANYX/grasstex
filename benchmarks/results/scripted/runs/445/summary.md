# Benchmark run #445 · 60 seeds from `exec361` (meeting), windows `contact+300`

- **OFF** flags: `none` · **ON** flags: `none`
- bench/387-control-3a11b52 @ 3a11b52 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37825135215) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2731 | 2731 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1306 | 1306 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1425 | 1425 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 20019 | 20019 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 6686 | 6686 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 51706 | 51706 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 173699 | 173699 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 163 | 163 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 186 | 186 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 173 | 173 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 562 | 562 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 562 | 562 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1732 | 1732 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 82 | 82 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1065 | 1065 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 473 | 473 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 437 | 437 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1276 | 1276 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4910.499999999998 | 4910.499999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4493.399999999999 | 4493.399999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3921.0000000000005 | 3921.0000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5939.199999999999 | 5939.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5816.200000000002 | 5816.200000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5343.700000000002 | 5343.700000000002 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361-0001 (identical) · exec361-0002 (identical) · exec361-0003 (identical) · exec361-0004 (identical) · exec361-0005 (identical) · exec361-0006 (identical) · exec361-0007 (identical) · exec361-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=445&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=445`); it opens the seed that parts earliest, and the dropdowns choose another.

