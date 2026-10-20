# Benchmark run #1030 · 50 seeds from `strategic-581-5km-screen-20261019` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-capture-boarding-20261019 @ 45f79b6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39351669472) · build v29-dev

## Verdict

**INERT: all 50 pairs identical in every field**


## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **50** · runtime errors off 0 / on 0 · wall time on/off x1.006 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2669 | 2669 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1103 | 1103 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1566 | 1566 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 11892 | 11892 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5624 | 5624 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 78836 | 78836 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 65567 | 65567 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 279 | 279 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 266 | 266 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 191 | 191 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 469 | 469 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 95 | 95 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 449 | 449 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1826 | 1826 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 449 | 449 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1826 | 1826 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 330 | 330 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 38 | 38 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 148 | 148 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 107 | 107 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 134 | 134 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 197 | 197 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4075.499999999999 | 4075.499999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3671 | 3671 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3031.5000000000005 | 3031.5000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 4761.3 | 4761.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 4825.500000000001 | 4825.500000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4873 | 4873 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

strategic-581-5km-screen-20261019-0001 (identical) · strategic-581-5km-screen-20261019-0002 (identical) · strategic-581-5km-screen-20261019-0003 (identical) · strategic-581-5km-screen-20261019-0004 (identical) · strategic-581-5km-screen-20261019-0005 (identical) · strategic-581-5km-screen-20261019-0006 (identical) · strategic-581-5km-screen-20261019-0007 (identical) · strategic-581-5km-screen-20261019-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1030&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-capture-boarding-20261019/ai_flow_live.html?bench=1030&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1030`); it opens the seed that parts earliest, and the dropdowns choose another.

