# Benchmark run #514 · 12 seeds from `fix437-retreat-20261009` (us-defend), windows `contact+120`

- **OFF** flags: `retreatLostContact=0` · **ON** flags: `retreatLostContact=1`
- work/fix437-isolated-retreat-fallback @ 8714f4b · [run](https://github.com/APPARANYX/grasstex/actions/runs/37967833413) · build v29-dev

## Verdict

**INERT: all 12 pairs identical in every field**


## Paired comparison (off against on)

- **12** pairs (unpaired: off 0, on 0) · identical in every field: **12** · runtime errors off 0 / on 0 · wall time on/off x0.95 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 309 | 309 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 127 | 127 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 182 | 182 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 1538 | 1538 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 623 | 623 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2229 | 2229 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 17211 | 17211 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 254 | 254 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 71 | 71 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 105 | 105 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1036.6 | 1036.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 920 | 920 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 914.5999999999999 | 914.5999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1196.9 | 1196.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1185.6 | 1185.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1065.6000000000001 | 1065.6000000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fix437-retreat-20261009-0001 (identical) · fix437-retreat-20261009-0002 (identical) · fix437-retreat-20261009-0003 (identical) · fix437-retreat-20261009-0004 (identical) · fix437-retreat-20261009-0005 (identical) · fix437-retreat-20261009-0006 (identical) · fix437-retreat-20261009-0007 (identical) · fix437-retreat-20261009-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=514&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/fix437-isolated-retreat-fallback/ai_flow_live.html?bench=514&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=514`); it opens the seed that parts earliest, and the dropdowns choose another.

