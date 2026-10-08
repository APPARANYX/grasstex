# Benchmark run #416 · 24 seeds from `fl13` (us-defend), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ be66725 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37774371832) · build v29-dev

## Verdict

**INERT: all 228 pairs identical in every field**


## Paired comparison (off against on)

- **228** pairs (unpaired: off 0, on 0) · identical in every field: **228** · runtime errors off 0 / on 0 · wall time on/off x0.925 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4845 | 4845 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2350 | 2350 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2495 | 2495 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5927 | 5927 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2102 | 2102 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 36745 | 36745 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 349120 | 349120 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 171 | 171 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 10473 | 10473 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 647 | 647 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 4226 | 4226 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 3655 | 3655 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1522 | 1522 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 3066 | 3066 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 4462 | 4462 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 20277.700000000008 | 20277.700000000008 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 18838.899999999994 | 18838.899999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 17951.199999999997 | 17951.199999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 22689.3 | 22689.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 22743.899999999994 | 22743.899999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 19204.999999999996 | 19204.999999999996 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fl13-0001 (identical) · fl13-0002 (identical) · fl13-0003 (identical) · fl13-0004 (identical) · fl13-0005 (identical) · fl13-0006 (identical) · fl13-0007 (identical) · fl13-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=416&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=416`); it opens the seed that parts earliest, and the dropdowns choose another.

