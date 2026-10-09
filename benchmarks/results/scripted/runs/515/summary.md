# Benchmark run #515 · 12 seeds from `fix437-retreat-20261009` (ge-defend), windows `contact+120`

- **OFF** flags: `retreatLostContact=0` · **ON** flags: `retreatLostContact=1`
- work/fix437-isolated-retreat-fallback @ 8714f4b · [run](https://github.com/APPARANYX/grasstex/actions/runs/37967837777) · build v29-dev

## Verdict

**INERT: all 12 pairs identical in every field**


## Paired comparison (off against on)

- **12** pairs (unpaired: off 0, on 0) · identical in every field: **12** · runtime errors off 0 / on 0 · wall time on/off x0.955 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 288 | 288 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 120 | 120 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 168 | 168 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 1361 | 1361 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 557 | 557 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2572 | 2572 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 15151 | 15151 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 225 | 225 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 105 | 105 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 102 | 102 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1041.3 | 1041.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 931.1 | 931.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 911.8000000000002 | 911.8000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1196.9999999999998 | 1196.9999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1187.9 | 1187.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1084.9 | 1084.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fix437-retreat-20261009-0001 (identical) · fix437-retreat-20261009-0002 (identical) · fix437-retreat-20261009-0003 (identical) · fix437-retreat-20261009-0004 (identical) · fix437-retreat-20261009-0005 (identical) · fix437-retreat-20261009-0006 (identical) · fix437-retreat-20261009-0007 (identical) · fix437-retreat-20261009-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=515&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/fix437-isolated-retreat-fallback/ai_flow_live.html?bench=515&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=515`); it opens the seed that parts earliest, and the dropdowns choose another.

