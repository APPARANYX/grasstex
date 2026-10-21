# Benchmark run #1127 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=legacy` · **ON** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=squad`
- work/issue-602-ai-skills-squad @ da518f1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39598446860) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.036 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 66 | 66 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 545 | 545 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 231 | 231 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2759 | 2759 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4019 | 4019 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 56 | 56 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 257.6 | 257.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 227.1 | 227.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 222.3 | 222.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 298.8 | 298.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 282.5 | 282.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 280.70000000000005 | 280.70000000000005 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 (identical) · phase-c-natural-20261012-0002 (identical) · phase-c-natural-20261012-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1127&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue-602-ai-skills-squad/ai_flow_live.html?bench=1127&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1127`); it opens the seed that parts earliest, and the dropdowns choose another.

