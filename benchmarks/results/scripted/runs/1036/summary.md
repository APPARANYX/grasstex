# Benchmark run #1036 · 20 seeds from `pr585-full50-meeting-20261019` (meeting), windows `0+10800`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-benchmark-endurance-20261019 @ 8c80298 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39354133492) · build v29-dev

## Verdict

**INERT: all 20 pairs identical in every field**


## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x1.037 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2369 | 2369 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 822 | 822 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1547 | 1547 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 11671 | 11671 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4754 | 4754 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 405792 | 405792 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 105880 | 105880 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 376 | 376 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 122 | 122 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 403 | 403 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 714 | 714 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 226 | 226 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 529 | 529 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 2523 | 2523 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 529 | 529 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 2523 | 2523 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 564 | 564 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 297 | 297 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 172 | 172 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 142 | 142 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 405 | 405 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1549.3 | 1549.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1452.7000000000003 | 1452.7000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1147.5 | 1147.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1876.6999999999998 | 1876.6999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1860.5000000000002 | 1860.5000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1941.6 | 1941.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr585-full50-meeting-20261019-0001 (identical) · pr585-full50-meeting-20261019-0002 (identical) · pr585-full50-meeting-20261019-0003 (identical) · pr585-full50-meeting-20261019-0004 (identical) · pr585-full50-meeting-20261019-0005 (identical) · pr585-full50-meeting-20261019-0006 (identical) · pr585-full50-meeting-20261019-0007 (identical) · pr585-full50-meeting-20261019-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1036&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-benchmark-endurance-20261019/ai_flow_live.html?bench=1036&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1036`); it opens the seed that parts earliest, and the dropdowns choose another.

