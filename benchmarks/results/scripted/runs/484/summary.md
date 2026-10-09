# Benchmark run #484 · 60 seeds from `retreat398late` (ge-defend), windows `contact+900`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- work/retreat398-900-validation @ 000ff98 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873894601) · build v29-dev

## Verdict

**QUIET: 39 of 53 pairs changed (median first part 435 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.6% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **14** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- the 28 changed records first part at simulated second: min 203.1, p10 234, median 435, p90 738, max 788.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2810 | 2794 | -0.3019 | 21 | 11 | 10 | 1 |
| `usKills` | 1147 | 1110 | -0.6981 | 21 | 9 | 12 | 0.6636 |
| `geKills` | 1663 | 1684 | 0.3962 | 22 | 13 | 9 | 0.5235 |
| `fire.total` | 20931 | 20603 | -6.1887 | 24 | 11 | 13 | 0.8388 |
| `fire.hits` | 6839 | 6785 | -1.0189 | 22 | 10 | 12 | 0.8318 |
| `retreatSamples` | 188310 | 190407 | 39.566 | 27 | 13 | 14 | 1 |
| `movementResolver.changes` | 166860 | 167588 | 13.7358 | 28 | 13 | 15 | 0.8506 |
| `movementStalls.length` | 0 | 2 | 0.0377 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 117 | 118 | 0.0189 | 11 | 6 | 5 | 1 |
| `loopAlerts.length` | 262 | 267 | 0.0943 | 20 | 11 | 9 | 0.8238 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 342 | 320 | -0.4151 | 16 | 5 | 11 | 0.2101 |
| `stallOutcomes.wakes` | 15 | 16 | 0.0189 | 3 | 1 | 2 | 1 |
| `stallOutcomes.repeats` | 3 | 2 | -0.0189 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 2 | 0.0377 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 220 | 4.1509 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 2 | 0.0377 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 220 | 4.1509 | 1 | 1 | 0 | 1 |
| `recon.orders` | 1994 | 1992 | -0.0377 | 24 | 12 | 12 | 1 |
| `recon.contacts` | 326 | 312 | -0.2642 | 17 | 9 | 8 | 1 |
| `recon.noContact` | 648 | 633 | -0.283 | 16 | 6 | 10 | 0.4545 |
| `recon.timeouts` | 513 | 534 | 0.3962 | 20 | 12 | 8 | 0.5034 |
| `recon.cancelled` | 488 | 495 | 0.1321 | 20 | 10 | 10 | 1 |
| `recon.reportsDelivered` | 1124 | 1128 | 0.0755 | 18 | 10 | 8 | 0.8145 |
| `recon.retriggerBlocked` | 787 | 782 | -0.0943 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanOverall` | 4367.499999999999 | 4364.399999999998 | -0.0585 | 23 | 11 | 12 | 1 |
| `squadPerformance.p10Overall` | 3967.999999999999 | 3960.2999999999997 | -0.1453 | 7 | 1 | 6 | 0.125 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3550.1 | 3549.2 | -0.017 | 24 | 11 | 13 | 0.8388 |
| `squadPerformance.meanMovement` | 5269.999999999998 | 5268.499999999999 | -0.0283 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanControl` | 5151.3 | 5147.699999999999 | -0.0679 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.meanCohesion` | 4797.4 | 4796.999999999999 | -0.0075 | 26 | 14 | 12 | 0.845 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

retreat398late-0047 203.1 s (timeline) · retreat398late-0014 226.05 s (timeline) · retreat398late-0036 234 s (timeline) · retreat398late-0028 244.05 s (timeline) · retreat398late-0057 247.05 s (timeline) · retreat398late-0030 257.1 s (timeline) · retreat398late-0020 288 s (timeline) · retreat398late-0038 291 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=484&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/retreat398-900-validation/ai_flow_live.html?bench=484&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=484`); it opens the seed that parts earliest, and the dropdowns choose another.

