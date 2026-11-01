# Benchmark run #1555 · 20 seeds from `vret` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&controllerRetreat=0`
- work/pin/retreat-54aff277 @ 54aff27 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257200884) · build v29-dev

## Verdict

**INERT: all 20 pairs identical in every field**


## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.986 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 840 | 840 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 358 | 358 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 482 | 482 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 14988 | 14988 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1778 | 1778 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 37499 | 37499 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 56152 | 56152 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 212 | 212 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 535 | 535 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 236 | 236 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 177 | 177 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 288 | 288 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 247 | 247 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1629.0000000000002 | 1629.0000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1514.7000000000003 | 1514.7000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1294 | 1294 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1997 | 1997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1913.6999999999994 | 1913.6999999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1826.0000000000002 | 1826.0000000000002 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

vret-0001 (identical) · vret-0002 (identical) · vret-0003 (identical) · vret-0004 (identical) · vret-0005 (identical) · vret-0006 (identical) · vret-0007 (identical) · vret-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1555&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-retreat-54aff277/ai_flow_live.html?bench=1555&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1555`); it opens the seed that parts earliest, and the dropdowns choose another.

