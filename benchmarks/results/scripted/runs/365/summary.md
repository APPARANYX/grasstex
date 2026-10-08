# Benchmark run #365 · 12 seeds from `command-audit361` (meeting), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/audit361-pr359-on-current-main @ 1fee48e · [run](https://github.com/APPARANYX/grasstex/actions/runs/37711002301) · build v29-dev

## Verdict

**INERT: all 110 pairs identical in every field**


## Paired comparison (off against on)

- **110** pairs (unpaired: off 0, on 0) · identical in every field: **110** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2677 | 2677 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1286 | 1286 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1391 | 1391 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 4281 | 4281 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1406 | 1406 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 16763 | 16763 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 221706 | 221706 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 98 | 98 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2435 | 2435 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 84 | 84 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1670 | 1670 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 564 | 564 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 368 | 368 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1834 | 1834 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 9679.100000000002 | 9679.100000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 9136.300000000005 | 9136.300000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8168.600000000002 | 8168.600000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 10856.399999999998 | 10856.399999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 10938.599999999997 | 10938.599999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9666.4 | 9666.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

command-audit361-0001 (identical) · command-audit361-0002 (identical) · command-audit361-0003 (identical) · command-audit361-0004 (identical) · command-audit361-0005 (identical) · command-audit361-0006 (identical) · command-audit361-0007 (identical) · command-audit361-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=365&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/audit361-pr359-on-current-main/ai_flow_live.html?bench=365&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=365`); it opens the seed that parts earliest, and the dropdowns choose another.

