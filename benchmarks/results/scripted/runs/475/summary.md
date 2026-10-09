# Benchmark run #475 · 60 seeds from `retreat398p` (us-defend), windows `contact+600`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- claude/retreat-anchor-slot @ 8bf6933 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37871874701) · build v29-dev

## Verdict

**WEAK: 33 of 55 pairs changed (median first part 375.07500000000005 s); 2 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.2% (p 0.6476)**

- Under 0.05 only: movementResolver.changes 148044 to 149682 (+1.1%, p 0.029); recon.orders 1786 to 1828 (+2.4%, p 0.0414).

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **22** · runtime errors off 0 / on 0 · wall time on/off x0.994 (gate 1.25)
- the 26 changed records first part at simulated second: min 153, p10 200.1, median 375.07500000000005, p90 549, max 584.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2675 | 2681 | 0.1091 | 19 | 11 | 8 | 0.6476 |
| `usKills` | 1330 | 1304 | -0.4727 | 15 | 5 | 10 | 0.3018 |
| `geKills` | 1345 | 1377 | 0.5818 | 18 | 13 | 5 | 0.0963 |
| `fire.total` | 18284 | 18347 | 1.1455 | 21 | 10 | 11 | 1 |
| `fire.hits` | 6548 | 6550 | 0.0364 | 20 | 9 | 11 | 0.8238 |
| `retreatSamples` | 95708 | 92603 | -56.4545 | 21 | 8 | 13 | 0.3833 |
| `movementResolver.changes` | 148044 | 149682 | 29.7818 | 26 | 19 | 7 | 0.029 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 75 | 79 | 0.0727 | 14 | 8 | 6 | 0.7905 |
| `loopAlerts.length` | 198 | 214 | 0.2909 | 16 | 10 | 6 | 0.4545 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 205 | 202 | -0.0545 | 13 | 6 | 7 | 1 |
| `stallOutcomes.wakes` | 10 | 9 | -0.0182 | 3 | 1 | 2 | 1 |
| `stallOutcomes.repeats` | 5 | 4 | -0.0182 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1786 | 1828 | 0.7636 | 20 | 15 | 5 | 0.0414 |
| `recon.contacts` | 254 | 264 | 0.1818 | 13 | 5 | 8 | 0.5811 |
| `recon.noContact` | 603 | 616 | 0.2364 | 12 | 9 | 3 | 0.146 |
| `recon.timeouts` | 465 | 462 | -0.0545 | 12 | 5 | 7 | 0.7744 |
| `recon.cancelled` | 435 | 452 | 0.3091 | 16 | 10 | 6 | 0.4545 |
| `recon.reportsDelivered` | 874 | 859 | -0.2727 | 14 | 3 | 11 | 0.0574 |
| `recon.retriggerBlocked` | 679 | 689 | 0.1818 | 15 | 10 | 5 | 0.3018 |
| `squadPerformance.meanOverall` | 4550.699999999999 | 4557.899999999998 | 0.1309 | 20 | 10 | 10 | 1 |
| `squadPerformance.p10Overall` | 4114.1 | 4124.5 | 0.1891 | 9 | 7 | 2 | 0.1797 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3737 | 3759.8 | 0.4145 | 21 | 12 | 9 | 0.6636 |
| `squadPerformance.meanMovement` | 5467.899999999999 | 5468.8 | 0.0164 | 19 | 9 | 10 | 1 |
| `squadPerformance.meanControl` | 5367.700000000001 | 5358.300000000001 | -0.1709 | 20 | 6 | 14 | 0.1153 |
| `squadPerformance.meanCohesion` | 4918.399999999998 | 4912.499999999999 | -0.1073 | 20 | 8 | 12 | 0.5034 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

retreat398p-0019 153 s (timeline) · retreat398p-0005 195 s (stress) · retreat398p-0059 200.1 s (timeline) · retreat398p-0011 210 s (timeline) · retreat398p-0013 261 s (timeline) · retreat398p-0014 264 s (stress) · retreat398p-0038 273 s (stress) · retreat398p-0040 282 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=475&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=475`); it opens the seed that parts earliest, and the dropdowns choose another.

