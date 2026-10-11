# Benchmark run #594 · 2 seeds from `phase-a-control` (ge-defend), windows `contact+120`

- **OFF** flags: `localPlan=1&localResources=1&coveredBounds=1&localDegrade=1&localTasks=0` · **ON** flags: `localPlan=1&localResources=1&coveredBounds=1&localDegrade=1&localTasks=1`
- work/tactics-c-mission-tasks @ 9e02053 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38176349497) · build v29-dev

## Verdict

**QUIET: 2 of 2 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.001 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 43 | 43 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 200 | 200 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 77 | 77 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 334 | 334 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 2551 | 2551 | 0 | 0 | 0 | 0 | 1 |
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
| `loopAlerts.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 174.6 | 174.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 153.1 | 153.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 152.2 | 152.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 199.7 | 199.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 198.89999999999998 | 198.89999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 181.2 | 181.2 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0001 (identical) · phase-a-control-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=594&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-c-mission-tasks/ai_flow_live.html?bench=594&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=594`); it opens the seed that parts earliest, and the dropdowns choose another.

