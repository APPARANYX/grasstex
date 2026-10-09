# Benchmark run #482 · 60 seeds from `retreat398late` (meeting), windows `contact+900`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- work/retreat398-900-validation @ 000ff98 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873890729) · build v29-dev

## Verdict

**WEAK: 42 of 60 pairs changed (median first part 392.1 s); 1 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.1% (p 0.4807)**

- Under 0.05 only: regroups.entries 339 to 289 (-14.7%, p 0.049).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x1.016 (gate 1.25)
- the 33 changed records first part at simulated second: min 245.1, p10 284.1, median 392.1, p90 544.05, max 638.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3291 | 3295 | 0.0667 | 18 | 11 | 7 | 0.4807 |
| `usKills` | 1520 | 1543 | 0.3833 | 15 | 10 | 5 | 0.3018 |
| `geKills` | 1771 | 1752 | -0.3167 | 14 | 3 | 11 | 0.0574 |
| `fire.total` | 20858 | 21246 | 6.4667 | 21 | 13 | 8 | 0.3833 |
| `fire.hits` | 7635 | 7681 | 0.7667 | 19 | 9 | 10 | 1 |
| `retreatSamples` | 135496 | 139125 | 60.4833 | 24 | 14 | 10 | 0.5413 |
| `movementResolver.changes` | 211696 | 211460 | -3.9333 | 29 | 19 | 10 | 0.136 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 344 | 352 | 0.1333 | 16 | 10 | 6 | 0.4545 |
| `loopAlerts.length` | 295 | 259 | -0.6 | 19 | 5 | 14 | 0.0636 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 339 | 289 | -0.8333 | 17 | 4 | 13 | 0.049 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 4 | 3 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2369 | 2346 | -0.3833 | 23 | 9 | 14 | 0.4049 |
| `recon.contacts` | 114 | 103 | -0.1833 | 10 | 3 | 7 | 0.3438 |
| `recon.noContact` | 1295 | 1294 | -0.0167 | 17 | 9 | 8 | 1 |
| `recon.timeouts` | 132 | 126 | -0.1 | 16 | 7 | 9 | 0.8036 |
| `recon.cancelled` | 722 | 714 | -0.1333 | 22 | 9 | 13 | 0.5235 |
| `recon.reportsDelivered` | 448 | 415 | -0.55 | 11 | 4 | 7 | 0.5488 |
| `recon.retriggerBlocked` | 1757 | 1752 | -0.0833 | 23 | 12 | 11 | 1 |
| `squadPerformance.meanOverall` | 4869.200000000001 | 4872.700000000001 | 0.0583 | 22 | 13 | 9 | 0.5235 |
| `squadPerformance.p10Overall` | 4491.7 | 4487.9 | -0.0633 | 6 | 3 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3854.599999999999 | 3849.999999999999 | -0.0767 | 19 | 10 | 9 | 1 |
| `squadPerformance.meanMovement` | 5948.2999999999965 | 5949.5999999999985 | 0.0217 | 16 | 10 | 6 | 0.4545 |
| `squadPerformance.meanControl` | 5746.599999999999 | 5762.000000000001 | 0.2567 | 22 | 16 | 6 | 0.0525 |
| `squadPerformance.meanCohesion` | 5425.199999999999 | 5438.499999999998 | 0.2217 | 22 | 13 | 9 | 0.5235 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

retreat398late-0046 245.1 s (timeline) · retreat398late-0001 276 s (timeline) · retreat398late-0010 282 s (timeline) · retreat398late-0003 284.1 s (timeline) · retreat398late-0015 296.1 s (timeline) · retreat398late-0005 304.05 s (timeline) · retreat398late-0013 306 s (timeline) · retreat398late-0045 324 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=482&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/retreat398-900-validation/ai_flow_live.html?bench=482&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=482`); it opens the seed that parts earliest, and the dropdowns choose another.

