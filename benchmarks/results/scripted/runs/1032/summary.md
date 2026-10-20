# Benchmark run #1032 · 50 seeds from `strategic-581-5km-screen-20261019` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-preview-review-20261019 @ 3da39b1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39352735943) · build v29-dev

## Verdict

**INERT: all 50 pairs identical in every field**


## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **50** · runtime errors off 0 / on 0 · wall time on/off x1.006 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1565 | 1565 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 743 | 743 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 822 | 822 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 7392 | 7392 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 3217 | 3217 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 42655 | 42655 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 43121 | 43121 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 219 | 219 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 184 | 184 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 329 | 329 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 76 | 76 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 348 | 348 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1792 | 1792 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 348 | 348 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1792 | 1792 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 425 | 425 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 178 | 178 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 164 | 164 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 157 | 157 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 252 | 252 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4334.5 | 4334.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3804.0999999999995 | 3804.0999999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3691.2999999999993 | 3691.2999999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 4870.399999999999 | 4870.399999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 4821.700000000001 | 4821.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4845.8 | 4845.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

strategic-581-5km-screen-20261019-0001 (identical) · strategic-581-5km-screen-20261019-0002 (identical) · strategic-581-5km-screen-20261019-0003 (identical) · strategic-581-5km-screen-20261019-0004 (identical) · strategic-581-5km-screen-20261019-0005 (identical) · strategic-581-5km-screen-20261019-0006 (identical) · strategic-581-5km-screen-20261019-0007 (identical) · strategic-581-5km-screen-20261019-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1032&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-preview-review-20261019/ai_flow_live.html?bench=1032&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1032`); it opens the seed that parts earliest, and the dropdowns choose another.

