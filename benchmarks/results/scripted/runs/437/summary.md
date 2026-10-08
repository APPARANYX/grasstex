# Benchmark run #437 · 60 seeds from `exec361` (us-defend), windows `contact+300`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- claude/project-thread-d6qmpr @ 9c613aa · [run](https://github.com/APPARANYX/grasstex/actions/runs/37817844595) · build v29-dev

## Verdict

**INERT: all 54 pairs identical in every field**


## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x0.971 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1749 | 1749 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 821 | 821 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 928 | 928 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 11801 | 11801 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4217 | 4217 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 31123 | 31123 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 109405 | 109405 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 122 | 122 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 88 | 88 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2810 | 2810 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 236 | 236 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1035 | 1035 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 991 | 991 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 474 | 474 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1136 | 1136 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1126 | 1126 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4587.000000000001 | 4587.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4128.3 | 4128.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3983.7 | 3983.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5377.900000000002 | 5377.900000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5302.299999999999 | 5302.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4604.7 | 4604.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361-0002 (identical) · exec361-0003 (identical) · exec361-0004 (identical) · exec361-0005 (identical) · exec361-0006 (identical) · exec361-0007 (identical) · exec361-0008 (identical) · exec361-0010 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=437&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=437`); it opens the seed that parts earliest, and the dropdowns choose another.

