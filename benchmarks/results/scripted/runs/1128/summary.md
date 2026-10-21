# Benchmark run #1128 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=legacy` · **ON** flags: `strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&aiSkills=squad`
- work/issue-602-ai-skills-squad @ da518f1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39598451447) · build v29-dev

## Verdict

**QUIET: 1 of 3 pairs changed (median first part 368.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +9.6% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x1.045 (gate 1.25)
- the 1 changed records first part at simulated second: min 368.1, p10 368.1, median 368.1, p90 368.1, max 368.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 94 | 103 | 3 | 1 | 1 | 0 | 1 |
| `usKills` | 47 | 50 | 1 | 1 | 1 | 0 | 1 |
| `geKills` | 47 | 53 | 2 | 1 | 1 | 0 | 1 |
| `fire.total` | 395 | 413 | 6 | 1 | 1 | 0 | 1 |
| `fire.hits` | 169 | 184 | 5 | 1 | 1 | 0 | 1 |
| `retreatSamples` | 2239 | 2237 | -0.6667 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 3433 | 3425 | -2.6667 | 1 | 0 | 1 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 30 | 32 | 0.6667 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 8 | 0.3333 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 48 | 45 | -1 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 18 | 16 | -0.6667 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 24 | 23 | -0.3333 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 258.7 | 259.1 | 0.1333 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 233.70000000000002 | 233.90000000000003 | 0.0667 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 219.20000000000002 | 220.60000000000002 | 0.4667 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 296.8 | 296.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 285.20000000000005 | 284.90000000000003 | -0.1 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanCohesion` | 280.70000000000005 | 280.20000000000005 | -0.1667 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-c-natural-20261012-0003 368.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1128&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue-602-ai-skills-squad/ai_flow_live.html?bench=1128&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1128`); it opens the seed that parts earliest, and the dropdowns choose another.

