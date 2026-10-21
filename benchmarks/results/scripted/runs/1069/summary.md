# Benchmark run #1069 · scripted scenario `ai-skills-v1-602` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&aiSkills=legacy` · **ON** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&aiSkills=legacy`
- main @ eba6c71 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39577918794) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 178 | 178 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 577 | 577 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1068 | 1068 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 90.9 | 90.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 81.7 | 81.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 82.4 | 82.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.4 | 99.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 95.9 | 95.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 95.7 | 95.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

ai-skills-v1-602 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1069&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1069`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

