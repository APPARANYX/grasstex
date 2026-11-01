# Benchmark run #1532 · 100 seeds from `c699r` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699r-ff508237 @ ff50823 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41254606628) · build v29-dev

## Verdict

**WEAK: 86 of 87 pairs changed (median first part 196.05 s); 5 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.1% (p 0.7122)**

- Under 0.05 only: movementResolver.changes 176295 to 178529 (+1.3%, p 0.0088); squadPerformance.p10Overall 6795.800000000002 to 6735.600000000001 (-0.9%, p 0.0187); recon.reportsDelivered 1275 to 1394 (+9.3%, p 0.0226); loopAlerts.length 844 to 776 (-8.1%, p 0.0271); squadPerformance.meanMovement 8656.199999999997 to 8660.9 (+0.1%, p 0.0396).

## Paired comparison (off against on)

- **87** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.003 (gate 1.25)
- the 85 changed records first part at simulated second: min 103.05, p10 141, median 196.05, p90 255, max 275.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1281 | 1280 | -0.0115 | 66 | 35 | 31 | 0.7122 |
| `usKills` | 631 | 658 | 0.3103 | 65 | 37 | 28 | 0.3211 |
| `geKills` | 650 | 622 | -0.3218 | 61 | 26 | 35 | 0.3057 |
| `fire.total` | 37622 | 38492 | 10 | 83 | 47 | 36 | 0.2723 |
| `fire.hits` | 2913 | 2904 | -0.1034 | 76 | 38 | 38 | 1 |
| `retreatSamples` | 8234 | 9100 | 9.954 | 73 | 43 | 30 | 0.1597 |
| `movementResolver.changes` | 176295 | 178529 | 25.6782 | 85 | 55 | 30 | 0.0088 |
| `grenades.throws` | 28 | 25 | -0.0345 | 10 | 5 | 5 | 1 |
| `grenades.bursts` | 27 | 22 | -0.0575 | 8 | 3 | 5 | 0.7266 |
| `grenades.wounded` | 34 | 37 | 0.0345 | 7 | 4 | 3 | 1 |
| `grenades.casualties` | 11 | 12 | 0.0115 | 4 | 2 | 2 | 1 |
| `grenades.suppressed` | 87 | 91 | 0.046 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 7 | 9 | 0.023 | 3 | 2 | 1 | 1 |
| `grenades.friendlyCasualties` | 3 | 2 | -0.0115 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 6 | 4 | -0.023 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 844 | 776 | -0.7816 | 67 | 24 | 43 | 0.0271 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 120 | 111 | -0.1034 | 34 | 14 | 20 | 0.3915 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2099 | 2102 | 0.0345 | 65 | 33 | 32 | 1 |
| `recon.contacts` | 327 | 329 | 0.023 | 53 | 27 | 26 | 1 |
| `recon.noContact` | 747 | 743 | -0.046 | 20 | 11 | 9 | 0.8238 |
| `recon.timeouts` | 30 | 32 | 0.023 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 903 | 905 | 0.023 | 61 | 28 | 33 | 0.6089 |
| `recon.reportsDelivered` | 1275 | 1394 | 1.3678 | 63 | 41 | 22 | 0.0226 |
| `recon.retriggerBlocked` | 818 | 804 | -0.1609 | 37 | 14 | 23 | 0.1877 |
| `squadPerformance.meanOverall` | 7511.9 | 7498.299999999998 | -0.1563 | 80 | 38 | 42 | 0.7376 |
| `squadPerformance.p10Overall` | 6795.800000000002 | 6735.600000000001 | -0.692 | 66 | 23 | 43 | 0.0187 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6745.199999999999 | 6680.300000000001 | -0.746 | 71 | 30 | 41 | 0.2351 |
| `squadPerformance.meanMovement` | 8656.199999999997 | 8660.9 | 0.054 | 61 | 39 | 22 | 0.0396 |
| `squadPerformance.meanControl` | 8192.100000000002 | 8242.500000000004 | 0.5793 | 75 | 46 | 29 | 0.0639 |
| `squadPerformance.meanCohesion` | 7556.600000000003 | 7602.999999999999 | 0.5333 | 78 | 42 | 36 | 0.5716 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699r-0096 103.05 s (timeline) · c699r-0054 116.1 s (timeline) · c699r-0092 116.1 s (timeline) · c699r-0033 128.1 s (timeline) · c699r-0063 128.1 s (timeline) · c699r-0044 134.1 s (timeline) · c699r-0036 138 s (timeline) · c699r-0060 138 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1532&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699r-ff508237/ai_flow_live.html?bench=1532&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1532`); it opens the seed that parts earliest, and the dropdowns choose another.

