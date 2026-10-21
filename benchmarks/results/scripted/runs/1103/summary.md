# Benchmark run #1103 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=legacy` · **ON** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=squad`
- work/issue-602-ai-skills-squad @ a140743 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39597195288) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.044 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 344 | 344 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 176 | 176 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 3886 | 3886 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3327 | 3327 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 252 | 252 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 221.3 | 221.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 206 | 206 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 295.5 | 295.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 286.1 | 286.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 286.5 | 286.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 (identical) · phase-c-natural-20261012-0002 (identical) · phase-c-natural-20261012-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1103&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue-602-ai-skills-squad/ai_flow_live.html?bench=1103&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1103`); it opens the seed that parts earliest, and the dropdowns choose another.

