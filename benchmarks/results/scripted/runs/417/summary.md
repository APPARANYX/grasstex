# Benchmark run #417 · 24 seeds from `fl13` (ge-defend), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- claude/fled-man-regroup @ 854dd13 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37774375761) · build v29-dev

## Verdict

**INERT: all 230 pairs identical in every field**


## Paired comparison (off against on)

- **230** pairs (unpaired: off 0, on 0) · identical in every field: **230** · runtime errors off 0 / on 0 · wall time on/off x0.974 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3980 | 3980 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1999 | 1999 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1981 | 1981 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6501 | 6501 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1979 | 1979 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 28916 | 28916 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 331113 | 331113 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 220 | 220 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 9472 | 9472 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 793 | 793 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 3564 | 3564 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 3572 | 3572 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1177 | 1177 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 3951 | 3951 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3954 | 3954 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 20507.399999999994 | 20507.399999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 19116.900000000012 | 19116.900000000012 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 18533.999999999996 | 18533.999999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 22833.900000000005 | 22833.900000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 22938.800000000007 | 22938.800000000007 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 18966.499999999993 | 18966.499999999993 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fl13-0001 (identical) · fl13-0002 (identical) · fl13-0003 (identical) · fl13-0004 (identical) · fl13-0005 (identical) · fl13-0006 (identical) · fl13-0007 (identical) · fl13-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=417&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=417`); it opens the seed that parts earliest, and the dropdowns choose another.

