# Benchmark run #413 · 24 seeds from `fl13` (meeting), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- claude/fled-man-regroup @ 854dd13 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37774355794) · build v29-dev

## Verdict

**INERT: all 228 pairs identical in every field**


## Paired comparison (off against on)

- **228** pairs (unpaired: off 0, on 0) · identical in every field: **228** · runtime errors off 0 / on 0 · wall time on/off x0.952 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5791 | 5791 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2337 | 2337 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 3454 | 3454 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 8302 | 8302 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2753 | 2753 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 34915 | 34915 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 455414 | 455414 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 96 | 96 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 75 | 75 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 272 | 272 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 111 | 111 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 5139 | 5139 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 278 | 278 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 3319 | 3319 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 150 | 150 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1213 | 1213 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1423 | 1423 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3884 | 3884 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 20017.59999999999 | 20017.59999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 18953.099999999995 | 18953.099999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 16881.70000000001 | 16881.70000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 22557.2 | 22557.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 22673.29999999998 | 22673.29999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 19948.89999999999 | 19948.89999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fl13-0001 (identical) · fl13-0002 (identical) · fl13-0003 (identical) · fl13-0004 (identical) · fl13-0005 (identical) · fl13-0006 (identical) · fl13-0007 (identical) · fl13-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=413&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=413`); it opens the seed that parts earliest, and the dropdowns choose another.

