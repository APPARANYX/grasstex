# Benchmark run #1021 · 60 seeds from `exec361p` (us-defend), windows `contact+600`

- **OFF** flags: `screenStallHold=0&transportHandoff=0` · **ON** flags: `none`
- work/strategic-interception-macro-20261016 @ 1b465cd · [run](https://github.com/APPARANYX/grasstex/actions/runs/39003935335) · build v29-dev

## Verdict

**INERT: all 53 pairs identical in every field**


## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **53** · runtime errors off 0 / on 0 · wall time on/off x0.943 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2903 | 2903 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1225 | 1225 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1678 | 1678 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 14435 | 14435 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5568 | 5568 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 104421 | 104421 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 123240 | 123240 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 151 | 151 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 721 | 721 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 188 | 188 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1434 | 1434 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 215 | 215 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 701 | 701 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 45 | 45 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 421 | 421 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 997 | 997 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 747 | 747 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4313.4 | 4313.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3942.1000000000004 | 3942.1000000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3641.500000000001 | 3641.500000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5283.5999999999985 | 5283.5999999999985 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 4920.700000000001 | 4920.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4673.399999999999 | 4673.399999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0001 (identical) · exec361p-0002 (identical) · exec361p-0006 (identical) · exec361p-0007 (identical) · exec361p-0008 (identical) · exec361p-0010 (identical) · exec361p-0011 (identical) · exec361p-0013 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1021&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-interception-macro-20261016/ai_flow_live.html?bench=1021&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1021`); it opens the seed that parts earliest, and the dropdowns choose another.

