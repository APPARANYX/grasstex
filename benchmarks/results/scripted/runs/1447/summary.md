# Benchmark run #1447 · 60 seeds from `roundstats-20261030` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0&roundStats=0` · **ON** flags: `strategicInterception=0`
- work/pin/roundstats-a018ab1b @ a018ab1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41133765322) · build v29-dev

## Verdict

**INERT: all 53 pairs identical in every field**


## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **53** · runtime errors off 0 / on 0 · wall time on/off x1.029 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 803 | 803 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 276 | 276 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 527 | 527 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 10079 | 10079 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1622 | 1622 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 4609 | 4609 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 68397 | 68397 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 180 | 180 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 56 | 56 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 834 | 834 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 82 | 82 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 502 | 502 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 186 | 186 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 429 | 429 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 433 | 433 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4656.9000000000015 | 4656.9000000000015 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4206.4 | 4206.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4270.599999999999 | 4270.599999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5274.700000000001 | 5274.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5171.999999999999 | 5171.999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4606.8 | 4606.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

roundstats-20261030-0001 (identical) · roundstats-20261030-0002 (identical) · roundstats-20261030-0003 (identical) · roundstats-20261030-0004 (identical) · roundstats-20261030-0005 (identical) · roundstats-20261030-0006 (identical) · roundstats-20261030-0007 (identical) · roundstats-20261030-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1447&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-roundstats-a018ab1b/ai_flow_live.html?bench=1447&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1447`); it opens the seed that parts earliest, and the dropdowns choose another.

