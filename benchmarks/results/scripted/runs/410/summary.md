# Benchmark run #410 · 60 seeds from `enrollmissing` (meeting), windows `every60`

- **OFF** flags: `enrollMissing=0` · **ON** flags: `none`
- claude/enroll-missing-recipient @ 0067bf7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37773504866) · build v29-dev

## Verdict

**INERT: all 574 pairs identical in every field**


## Paired comparison (off against on)

- **574** pairs (unpaired: off 0, on 0) · identical in every field: **574** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 14334 | 14334 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 6309 | 6309 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 8025 | 8025 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 21588 | 21588 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 7546 | 7546 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 91052 | 91052 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1162880 | 1162880 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 274 | 274 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 218 | 218 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1035 | 1035 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 156 | 156 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 959 | 959 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 5320 | 5320 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 12891 | 12891 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 498 | 498 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 8755 | 8755 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 376 | 376 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 2843 | 2843 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2767 | 2767 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 9972 | 9972 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 50412.399999999994 | 50412.399999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 47605.199999999895 | 47605.199999999895 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 42474.599999999984 | 42474.599999999984 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 56672.70000000002 | 56672.70000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 57077.30000000002 | 57077.30000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 50341.7 | 50341.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

enrollmissing-0001 (identical) · enrollmissing-0002 (identical) · enrollmissing-0003 (identical) · enrollmissing-0004 (identical) · enrollmissing-0005 (identical) · enrollmissing-0006 (identical) · enrollmissing-0007 (identical) · enrollmissing-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=410&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=410`); it opens the seed that parts earliest, and the dropdowns choose another.

