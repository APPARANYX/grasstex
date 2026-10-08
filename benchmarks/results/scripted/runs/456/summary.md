# Benchmark run #456 · 60 seeds from `exec361p` (meeting), windows `contact+600`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- bench/exec-pair-5b9e513 @ 5b9e513 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37845562933) · build v29-dev

## Verdict

**QUIET: 6 of 60 pairs changed (median first part 173.1 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.1% (p 0.5)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- the 3 changed records first part at simulated second: min 91.05, p10 91.05, median 173.1, p90 256.05, max 256.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3149 | 3151 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `usKills` | 1380 | 1389 | 0.15 | 3 | 2 | 1 | 1 |
| `geKills` | 1769 | 1762 | -0.1167 | 3 | 1 | 2 | 1 |
| `fire.total` | 20835 | 20845 | 0.1667 | 3 | 1 | 2 | 1 |
| `fire.hits` | 7436 | 7444 | 0.1333 | 3 | 2 | 1 | 1 |
| `retreatSamples` | 94780 | 95335 | 9.25 | 3 | 1 | 2 | 1 |
| `movementResolver.changes` | 190926 | 190698 | -3.8 | 3 | 0 | 3 | 0.25 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 265 | 272 | 0.1167 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 238 | 242 | 0.0667 | 3 | 3 | 0 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 172 | 163 | -0.15 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.wakes` | 12 | 11 | -0.0167 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2162 | 2164 | 0.0333 | 3 | 2 | 1 | 1 |
| `recon.contacts` | 105 | 106 | 0.0167 | 3 | 2 | 1 | 1 |
| `recon.noContact` | 1285 | 1279 | -0.1 | 3 | 1 | 2 | 1 |
| `recon.timeouts` | 68 | 72 | 0.0667 | 3 | 3 | 0 | 0.25 |
| `recon.cancelled` | 619 | 622 | 0.05 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 515 | 514 | -0.0167 | 3 | 2 | 1 | 1 |
| `recon.retriggerBlocked` | 1509 | 1512 | 0.05 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 4897.400000000001 | 4894.8 | -0.0433 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.p10Overall` | 4503.700000000001 | 4503.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3911.9 | 3903.500000000001 | -0.14 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 5935.9 | 5936.299999999998 | 0.0067 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 5778.2 | 5778.200000000001 | 0 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 5381.199999999999 | 5383.5999999999985 | 0.04 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

exec361p-0026 91.05 s (timeline) · exec361p-0018 173.1 s (timeline) · exec361p-0004 256.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=456&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=456`); it opens the seed that parts earliest, and the dropdowns choose another.

