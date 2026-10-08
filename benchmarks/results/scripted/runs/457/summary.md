# Benchmark run #457 · 60 seeds from `exec361p` (us-defend), windows `contact+600`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- bench/exec-pair-5b9e513 @ 5b9e513 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37845566036) · build v29-dev

## Verdict

**QUIET: 2 of 53 pairs changed (median first part 317.1 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **51** · runtime errors off 0 / on 0 · wall time on/off x1.023 (gate 1.25)
- the 1 changed records first part at simulated second: min 317.1, p10 317.1, median 317.1, p90 317.1, max 317.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2554 | 2554 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1133 | 1137 | 0.0755 | 1 | 1 | 0 | 1 |
| `geKills` | 1421 | 1417 | -0.0755 | 1 | 0 | 1 | 1 |
| `fire.total` | 17817 | 17801 | -0.3019 | 1 | 0 | 1 | 1 |
| `fire.hits` | 6064 | 6028 | -0.6792 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 87161 | 87186 | 0.4717 | 1 | 1 | 0 | 1 |
| `movementResolver.changes` | 155208 | 154834 | -7.0566 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 69 | 69 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 234 | 234 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 176 | 161 | -0.283 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3299 | 3318 | 0.3585 | 1 | 1 | 0 | 1 |
| `recon.contacts` | 311 | 311 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1237 | 1244 | 0.1321 | 1 | 1 | 0 | 1 |
| `recon.timeouts` | 967 | 970 | 0.0566 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 723 | 732 | 0.1698 | 1 | 1 | 0 | 1 |
| `recon.reportsDelivered` | 1380 | 1374 | -0.1132 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 1264 | 1273 | 0.1698 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanOverall` | 4370.500000000001 | 4370.700000000001 | 0.0038 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 3976.799999999999 | 3976.1999999999994 | -0.0113 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3592.3 | 3592.7000000000003 | 0.0075 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 5270.099999999999 | 5269.7 | -0.0075 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanControl` | 5158.100000000001 | 5158.800000000001 | 0.0132 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4636.800000000001 | 4637.700000000001 | 0.017 | 1 | 1 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

exec361p-0001 317.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=457&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=457`); it opens the seed that parts earliest, and the dropdowns choose another.

