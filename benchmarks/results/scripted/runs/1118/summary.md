# Benchmark run #1118 · scripted scenario `phase-c-natural-20261012-0002` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=legacy` · **ON** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=squad-shadow`
- work/issue-602-ai-skills-squad @ 816fbfd · [run](https://github.com/APPARANYX/grasstex/actions/runs/39597781376) · build v29-dev

## Verdict

**INERT: all 1 pairs identical in every field**


## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.059 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 177 | 177 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 640 | 640 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 1019 | 1019 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 88.1 | 88.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 78.7 | 78.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 78.9 | 78.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.2 | 99.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 94.2 | 94.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 92.9 | 92.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

phase-c-natural-20261012-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1118&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue-602-ai-skills-squad/ai_flow_live.html?bench=1118&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1118`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

