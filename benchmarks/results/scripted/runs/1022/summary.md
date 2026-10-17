# Benchmark run #1022 · 60 seeds from `exec361p` (ge-defend), windows `contact+600`

- **OFF** flags: `screenStallHold=0&transportHandoff=0` · **ON** flags: `none`
- work/strategic-interception-macro-20261016 @ 1b465cd · [run](https://github.com/APPARANYX/grasstex/actions/runs/39003937207) · build v29-dev

## Verdict

**INERT: all 53 pairs identical in every field**


## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **53** · runtime errors off 0 / on 0 · wall time on/off x0.984 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2869 | 2869 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1287 | 1287 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1582 | 1582 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 13078 | 13078 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5361 | 5361 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 95253 | 95253 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 110105 | 110105 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 130 | 130 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 635 | 635 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 208 | 208 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1412 | 1412 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 208 | 208 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 704 | 704 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 417 | 417 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 858 | 858 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 698 | 698 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4376.499999999999 | 4376.499999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4009.7 | 4009.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3797.1000000000013 | 3797.1000000000013 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5282.9 | 5282.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 4960.500000000001 | 4960.500000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4612.500000000002 | 4612.500000000002 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0001 (identical) · exec361p-0002 (identical) · exec361p-0006 (identical) · exec361p-0007 (identical) · exec361p-0008 (identical) · exec361p-0010 (identical) · exec361p-0011 (identical) · exec361p-0013 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1022&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-interception-macro-20261016/ai_flow_live.html?bench=1022&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1022`); it opens the seed that parts earliest, and the dropdowns choose another.

