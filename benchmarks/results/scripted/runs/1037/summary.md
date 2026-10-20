# Benchmark run #1037 · 15 seeds from `pr585-full50-us-defend-20261019` (us-defend), windows `0+10800`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-benchmark-endurance-20261019 @ 8c80298 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39354140713) · build v29-dev

## Verdict

**INERT: all 15 pairs identical in every field**


## Paired comparison (off against on)

- **15** pairs (unpaired: off 0, on 0) · identical in every field: **15** · runtime errors off 0 / on 0 · wall time on/off x0.886 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1819 | 1819 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 863 | 863 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 956 | 956 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 8583 | 8583 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 3583 | 3583 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 882846 | 882846 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 59784 | 59784 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 300 | 300 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 145 | 145 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 296 | 296 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 360 | 360 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 395 | 395 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1857 | 1857 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 395 | 395 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1857 | 1857 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 556 | 556 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 282 | 282 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 189 | 189 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 153 | 153 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 376 | 376 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1183.1 | 1183.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1106.8 | 1106.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 917.8000000000001 | 917.8000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1432.6999999999998 | 1432.6999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1418.1 | 1418.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1448.5 | 1448.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr585-full50-us-defend-20261019-0001 (identical) · pr585-full50-us-defend-20261019-0002 (identical) · pr585-full50-us-defend-20261019-0003 (identical) · pr585-full50-us-defend-20261019-0004 (identical) · pr585-full50-us-defend-20261019-0005 (identical) · pr585-full50-us-defend-20261019-0006 (identical) · pr585-full50-us-defend-20261019-0007 (identical) · pr585-full50-us-defend-20261019-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1037&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-benchmark-endurance-20261019/ai_flow_live.html?bench=1037&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1037`); it opens the seed that parts earliest, and the dropdowns choose another.

