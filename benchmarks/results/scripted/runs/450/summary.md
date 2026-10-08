# Benchmark run #450 · 60 seeds from `scripted-seeds` (meeting), windows `contact+120`

- **OFF** flags: `garrisonRelease=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ 5932572 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37825958186) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.976 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1161 | 1161 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 519 | 519 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 642 | 642 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 7783 | 7783 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2840 | 2840 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 6251 | 6251 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 128494 | 128494 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 297 | 297 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 297 | 297 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1365 | 1365 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 949 | 949 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 306 | 306 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 352 | 352 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1052 | 1052 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5170.499999999998 | 5170.499999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4671.799999999999 | 4671.799999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4443.400000000001 | 4443.400000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5936.300000000002 | 5936.300000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5900.600000000002 | 5900.600000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5309.500000000001 | 5309.500000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

scripted-seeds-0001 (identical) · scripted-seeds-0002 (identical) · scripted-seeds-0003 (identical) · scripted-seeds-0004 (identical) · scripted-seeds-0005 (identical) · scripted-seeds-0006 (identical) · scripted-seeds-0007 (identical) · scripted-seeds-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=450&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=450`); it opens the seed that parts earliest, and the dropdowns choose another.

