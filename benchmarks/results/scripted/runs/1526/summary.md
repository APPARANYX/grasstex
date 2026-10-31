# Benchmark run #1526 · 60 seeds from `nse-l` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&navStationExit=0` · **ON** flags: `strategicInterception=0`
- work/pin/nse-c4a65b24 @ c4a65b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243587645) · build v29-dev

## Verdict

**QUIET: 41 of 60 pairs changed (median first part 312 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.4% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **19** · runtime errors off 0 / on 0 · wall time on/off x0.996 (gate 1.25)
- the 21 changed records first part at simulated second: min 173.1, p10 183, median 312, p90 394.05, max 499.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2569 | 2558 | -0.1833 | 15 | 7 | 8 | 1 |
| `usKills` | 1131 | 1133 | 0.0333 | 12 | 9 | 3 | 0.146 |
| `geKills` | 1438 | 1425 | -0.2167 | 15 | 6 | 9 | 0.6072 |
| `fire.total` | 42356 | 42458 | 1.7 | 16 | 8 | 8 | 1 |
| `fire.hits` | 5638 | 5643 | 0.0833 | 16 | 7 | 9 | 0.8036 |
| `retreatSamples` | 126434 | 126842 | 6.8 | 16 | 8 | 8 | 1 |
| `movementResolver.changes` | 168929 | 169351 | 7.0333 | 18 | 8 | 10 | 0.8145 |
| `grenades.throws` | 42 | 53 | 0.1833 | 4 | 3 | 1 | 0.625 |
| `grenades.bursts` | 41 | 51 | 0.1667 | 4 | 3 | 1 | 0.625 |
| `grenades.wounded` | 37 | 45 | 0.1333 | 2 | 2 | 0 | 0.5 |
| `grenades.casualties` | 12 | 14 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `grenades.suppressed` | 65 | 78 | 0.2167 | 3 | 2 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 111 | 113 | 0.0333 | 12 | 6 | 6 | 1 |
| `loopAlerts.length` | 753 | 750 | -0.05 | 11 | 4 | 7 | 0.5488 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 219 | 210 | -0.15 | 14 | 7 | 7 | 1 |
| `stallOutcomes.wakes` | 12 | 12 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 4 | 3 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1714 | 1687 | -0.45 | 15 | 5 | 10 | 0.3018 |
| `recon.contacts` | 273 | 275 | 0.0333 | 11 | 5 | 6 | 1 |
| `recon.noContact` | 778 | 786 | 0.1333 | 11 | 7 | 4 | 0.5488 |
| `recon.timeouts` | 45 | 44 | -0.0167 | 4 | 2 | 2 | 1 |
| `recon.cancelled` | 553 | 528 | -0.4167 | 12 | 3 | 9 | 0.146 |
| `recon.reportsDelivered` | 1168 | 1209 | 0.6833 | 13 | 7 | 6 | 1 |
| `recon.retriggerBlocked` | 792 | 786 | -0.1 | 12 | 5 | 7 | 0.7744 |
| `squadPerformance.meanOverall` | 4867.499999999999 | 4870.2 | 0.045 | 16 | 8 | 8 | 1 |
| `squadPerformance.p10Overall` | 4486.9 | 4492.9 | 0.1 | 5 | 5 | 0 | 0.0625 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3884.599999999999 | 3881.2999999999993 | -0.055 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.meanMovement` | 5991.199999999999 | 5991.299999999998 | 0.0017 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanControl` | 5709.499999999998 | 5716.699999999999 | 0.12 | 15 | 9 | 6 | 0.6072 |
| `squadPerformance.meanCohesion` | 5430.3 | 5434.6 | 0.0717 | 16 | 9 | 7 | 0.8036 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

nse-l-0007 173.1 s (stress) · nse-l-0044 175.05 s (stress) · nse-l-0043 183 s (stress) · nse-l-0012 188.1 s (stress) · nse-l-0027 219 s (stress) · nse-l-0025 221.1 s (stress) · nse-l-0047 233.1 s (stress) · nse-l-0055 260.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1526&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-c4a65b24/ai_flow_live.html?bench=1526&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1526`); it opens the seed that parts earliest, and the dropdowns choose another.

