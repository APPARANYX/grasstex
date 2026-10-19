# Benchmark run #1027 · scripted scenario `live-mvfkx3w6-8ekep` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1`
- work/strategic-preview-review-20261019 @ a254532 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39306821580) · build v29-dev

## Verdict

**INERT: all 6 pairs identical in every field**


## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.938 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 120 | 120 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 112 | 112 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 111 | 111 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 68 | 68 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1244 | 1244 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 2756 | 2756 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 528.9000000000001 | 528.9000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 473.5 | 473.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 431.5 | 431.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 588.4 | 588.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 598.4 | 598.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 551.5 | 551.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mvfkx3w6-8ekep (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1027&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-preview-review-20261019/ai_flow_live.html?bench=1027&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1027`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

