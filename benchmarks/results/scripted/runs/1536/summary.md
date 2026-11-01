# Benchmark run #1536 · 20 seeds from `o703` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/pr703-4b875e44 @ 4b875e4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256111340) · build v29-dev

## Verdict

**INERT: all 20 pairs identical in every field**


## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.978 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 928 | 928 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 436 | 436 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 492 | 492 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 14313 | 14313 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2033 | 2033 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 42401 | 42401 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 72218 | 72218 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 96 | 96 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 202 | 202 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 86 | 86 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 579 | 579 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 369 | 369 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 159 | 159 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 108 | 108 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 452 | 452 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1590.3000000000002 | 1590.3000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1484.6000000000001 | 1484.6000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1215.0000000000002 | 1215.0000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1995.0999999999997 | 1995.0999999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1887.3999999999999 | 1887.3999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1814.3 | 1814.3 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

o703-0001 (identical) · o703-0002 (identical) · o703-0003 (identical) · o703-0004 (identical) · o703-0005 (identical) · o703-0006 (identical) · o703-0007 (identical) · o703-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1536&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr703-4b875e44/ai_flow_live.html?bench=1536&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1536`); it opens the seed that parts earliest, and the dropdowns choose another.

