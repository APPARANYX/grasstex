# Benchmark run #483 · 60 seeds from `retreat398late` (us-defend), windows `contact+900`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- work/retreat398-900-validation @ 000ff98 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873892610) · build v29-dev

## Verdict

**QUIET: 37 of 53 pairs changed (median first part 400.05 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.8% (p 0.6776)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **16** · runtime errors off 0 / on 0 · wall time on/off x0.944 (gate 1.25)
- the 31 changed records first part at simulated second: min 242.1, p10 280.05, median 400.05, p90 786, max 824.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2849 | 2826 | -0.434 | 23 | 13 | 10 | 0.6776 |
| `usKills` | 1389 | 1368 | -0.3962 | 20 | 9 | 11 | 0.8238 |
| `geKills` | 1460 | 1458 | -0.0377 | 24 | 12 | 12 | 1 |
| `fire.total` | 20139 | 19646 | -9.3019 | 23 | 7 | 16 | 0.0931 |
| `fire.hits` | 6638 | 6598 | -0.7547 | 23 | 10 | 13 | 0.6776 |
| `retreatSamples` | 180616 | 177990 | -49.5472 | 24 | 11 | 13 | 0.8388 |
| `movementResolver.changes` | 169720 | 174474 | 89.6981 | 28 | 17 | 11 | 0.3449 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 114 | 129 | 0.283 | 14 | 8 | 6 | 0.7905 |
| `loopAlerts.length` | 258 | 247 | -0.2075 | 15 | 6 | 9 | 0.6072 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 326 | 318 | -0.1509 | 19 | 8 | 11 | 0.6476 |
| `stallOutcomes.wakes` | 12 | 14 | 0.0377 | 4 | 2 | 2 | 1 |
| `stallOutcomes.repeats` | 3 | 2 | -0.0189 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2102 | 2099 | -0.0566 | 24 | 9 | 15 | 0.3075 |
| `recon.contacts` | 235 | 242 | 0.1321 | 15 | 8 | 7 | 1 |
| `recon.noContact` | 710 | 697 | -0.2453 | 19 | 11 | 8 | 0.6476 |
| `recon.timeouts` | 557 | 552 | -0.0943 | 20 | 8 | 12 | 0.5034 |
| `recon.cancelled` | 559 | 563 | 0.0755 | 20 | 8 | 12 | 0.5034 |
| `recon.reportsDelivered` | 1056 | 1016 | -0.7547 | 15 | 8 | 7 | 1 |
| `recon.retriggerBlocked` | 868 | 884 | 0.3019 | 18 | 11 | 7 | 0.4807 |
| `squadPerformance.meanOverall` | 4376.399999999999 | 4381.2 | 0.0906 | 23 | 14 | 9 | 0.4049 |
| `squadPerformance.p10Overall` | 3983.1999999999994 | 3975.7999999999997 | -0.1396 | 5 | 2 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3576.1 | 3586.2000000000003 | 0.1906 | 23 | 14 | 9 | 0.4049 |
| `squadPerformance.meanMovement` | 5273.7 | 5271.599999999999 | -0.0396 | 16 | 10 | 6 | 0.4545 |
| `squadPerformance.meanControl` | 5144.6 | 5145.799999999999 | 0.0226 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.meanCohesion` | 4820.699999999999 | 4817.799999999999 | -0.0547 | 21 | 9 | 12 | 0.6636 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

retreat398late-0055 242.1 s (timeline) · retreat398late-0054 246 s (timeline) · retreat398late-0021 253.05 s (timeline) · retreat398late-0039 280.05 s (timeline) · retreat398late-0020 293.1 s (timeline) · retreat398late-0042 295.05 s (timeline) · retreat398late-0030 297 s (stress) · retreat398late-0031 312 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=483&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/retreat398-900-validation/ai_flow_live.html?bench=483&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=483`); it opens the seed that parts earliest, and the dropdowns choose another.

