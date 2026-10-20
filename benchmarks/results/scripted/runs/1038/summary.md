# Benchmark run #1038 · 15 seeds from `pr585-full50-ge-defend-20261019` (ge-defend), windows `0+10800`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-benchmark-endurance-20261019 @ 8c80298 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39354145231) · build v29-dev

## Verdict

**INERT: all 15 pairs identical in every field**


## Paired comparison (off against on)

- **15** pairs (unpaired: off 0, on 0) · identical in every field: **15** · runtime errors off 0 / on 0 · wall time on/off x1.023 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1798 | 1798 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 730 | 730 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1068 | 1068 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 8486 | 8486 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 3370 | 3370 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 651781 | 651781 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 56675 | 56675 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 334 | 334 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 174 | 174 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 273 | 273 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 297 | 297 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 392 | 392 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 2689 | 2689 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 392 | 392 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 2689 | 2689 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 606 | 606 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 284 | 284 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 216 | 216 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 184 | 184 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 396 | 396 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1195.1000000000001 | 1195.1000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1103 | 1103 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 951.3000000000002 | 951.3000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1434.6000000000001 | 1434.6000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1420.6000000000001 | 1420.6000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1427.3999999999996 | 1427.3999999999996 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr585-full50-ge-defend-20261019-0001 (identical) · pr585-full50-ge-defend-20261019-0002 (identical) · pr585-full50-ge-defend-20261019-0003 (identical) · pr585-full50-ge-defend-20261019-0004 (identical) · pr585-full50-ge-defend-20261019-0005 (identical) · pr585-full50-ge-defend-20261019-0006 (identical) · pr585-full50-ge-defend-20261019-0007 (identical) · pr585-full50-ge-defend-20261019-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1038&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-benchmark-endurance-20261019/ai_flow_live.html?bench=1038&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1038`); it opens the seed that parts earliest, and the dropdowns choose another.

