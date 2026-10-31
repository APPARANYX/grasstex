# Benchmark run #1524 · 60 seeds from `nse-l` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&navStationExit=0` · **ON** flags: `strategicInterception=0`
- work/pin/nse-c4a65b24 @ c4a65b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243576309) · build v29-dev

## Verdict

**QUIET: 36 of 60 pairs changed (median first part 259.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.3% (p 0.3877)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **24** · runtime errors off 0 / on 0 · wall time on/off x0.989 (gate 1.25)
- the 22 changed records first part at simulated second: min 153, p10 187.05, median 259.05, p90 396, max 412.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2541 | 2509 | -0.5333 | 12 | 4 | 8 | 0.3877 |
| `usKills` | 973 | 948 | -0.4167 | 11 | 4 | 7 | 0.5488 |
| `geKills` | 1568 | 1561 | -0.1167 | 13 | 6 | 7 | 1 |
| `fire.total` | 36443 | 36696 | 4.2167 | 14 | 6 | 8 | 0.7905 |
| `fire.hits` | 5585 | 5462 | -2.05 | 13 | 4 | 9 | 0.2668 |
| `retreatSamples` | 110735 | 111524 | 13.15 | 15 | 9 | 6 | 0.6072 |
| `movementResolver.changes` | 161342 | 159691 | -27.5167 | 19 | 5 | 14 | 0.0636 |
| `grenades.throws` | 33 | 32 | -0.0167 | 5 | 3 | 2 | 1 |
| `grenades.bursts` | 32 | 31 | -0.0167 | 5 | 3 | 2 | 1 |
| `grenades.wounded` | 14 | 23 | 0.15 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 5 | 10 | 0.0833 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 52 | 83 | 0.5167 | 4 | 2 | 2 | 1 |
| `grenades.friendlyWounded` | 2 | 3 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 3 | 0.0167 | 3 | 2 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 64 | 64 | 0 | 9 | 4 | 5 | 1 |
| `loopAlerts.length` | 702 | 725 | 0.3833 | 13 | 9 | 4 | 0.2668 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 256 | 258 | 0.0333 | 9 | 5 | 4 | 1 |
| `stallOutcomes.wakes` | 11 | 12 | 0.0167 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1757 | 1750 | -0.1167 | 14 | 6 | 8 | 0.7905 |
| `recon.contacts` | 288 | 293 | 0.0833 | 13 | 7 | 6 | 1 |
| `recon.noContact` | 765 | 761 | -0.0667 | 14 | 6 | 8 | 0.7905 |
| `recon.timeouts` | 96 | 100 | 0.0667 | 5 | 4 | 1 | 0.375 |
| `recon.cancelled` | 566 | 552 | -0.2333 | 12 | 4 | 8 | 0.3877 |
| `recon.reportsDelivered` | 1109 | 1113 | 0.0667 | 11 | 6 | 5 | 1 |
| `recon.retriggerBlocked` | 699 | 698 | -0.0167 | 11 | 4 | 7 | 0.5488 |
| `squadPerformance.meanOverall` | 4898.700000000002 | 4898.500000000003 | -0.0033 | 15 | 8 | 7 | 1 |
| `squadPerformance.p10Overall` | 4500.4 | 4504 | 0.06 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3984.7999999999997 | 3982.1 | -0.045 | 13 | 5 | 8 | 0.5811 |
| `squadPerformance.meanMovement` | 5991.199999999999 | 5991.399999999999 | 0.0033 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanControl` | 5710.999999999999 | 5713.099999999999 | 0.035 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanCohesion` | 5335.799999999999 | 5336.399999999999 | 0.01 | 14 | 6 | 8 | 0.7905 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

nse-l-0022 153 s (stress) · nse-l-0017 162 s (stress) · nse-l-0049 187.05 s (stress) · nse-l-0018 207 s (stress) · nse-l-0019 209.1 s (timeline) · nse-l-0014 234 s (stress) · nse-l-0044 238.05 s (stress) · nse-l-0025 244.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1524&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-c4a65b24/ai_flow_live.html?bench=1524&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1524`); it opens the seed that parts earliest, and the dropdowns choose another.

