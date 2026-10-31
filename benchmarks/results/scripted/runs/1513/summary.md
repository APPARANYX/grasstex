# Benchmark run #1513 · 60 seeds from `c699b` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699b-a69e4a40 @ a69e4a4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41242488716) · build v29-dev

## Verdict

**WEAK: 50 of 54 pairs changed (median first part 168.525 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties +10.2% (p 0.1263)**

- Under 0.05 only: squadPerformance.p10Overall 4240.7 to 4182.099999999999 (-1.4%, p 0.0064); fire.total 19118 to 20766 (+8.6%, p 0.0186); retreatSamples 4734 to 5830 (+23.2%, p 0.0357).

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- the 48 changed records first part at simulated second: min 115.05, p10 137.1, median 168.525, p90 246, max 286.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 716 | 789 | 1.3519 | 43 | 27 | 16 | 0.1263 |
| `usKills` | 366 | 410 | 0.8148 | 40 | 25 | 15 | 0.1539 |
| `geKills` | 350 | 379 | 0.537 | 37 | 19 | 18 | 1 |
| `fire.total` | 19118 | 20766 | 30.5185 | 47 | 32 | 15 | 0.0186 |
| `fire.hits` | 1629 | 1874 | 4.537 | 43 | 26 | 17 | 0.2221 |
| `retreatSamples` | 4734 | 5830 | 20.2963 | 45 | 30 | 15 | 0.0357 |
| `movementResolver.changes` | 109283 | 109407 | 2.2963 | 49 | 26 | 23 | 0.7754 |
| `grenades.throws` | 12 | 16 | 0.0741 | 6 | 4 | 2 | 0.6875 |
| `grenades.bursts` | 10 | 15 | 0.0926 | 4 | 4 | 0 | 0.125 |
| `grenades.wounded` | 7 | 12 | 0.0926 | 2 | 2 | 0 | 0.5 |
| `grenades.casualties` | 0 | 3 | 0.0556 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 8 | 19 | 0.2037 | 3 | 3 | 0 | 0.25 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.0185 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 510 | 516 | 0.1111 | 39 | 19 | 20 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 84 | 72 | -0.2222 | 22 | 10 | 12 | 0.8318 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1288 | 1267 | -0.3889 | 43 | 18 | 25 | 0.3604 |
| `recon.contacts` | 191 | 173 | -0.3333 | 29 | 11 | 18 | 0.2649 |
| `recon.noContact` | 482 | 479 | -0.0556 | 10 | 4 | 6 | 0.7539 |
| `recon.timeouts` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 531 | 528 | -0.0556 | 42 | 20 | 22 | 0.8776 |
| `recon.reportsDelivered` | 850 | 766 | -1.5556 | 33 | 13 | 20 | 0.2962 |
| `recon.retriggerBlocked` | 491 | 484 | -0.1296 | 27 | 10 | 17 | 0.2478 |
| `squadPerformance.meanOverall` | 4667.0999999999985 | 4626.299999999998 | -0.7556 | 45 | 16 | 29 | 0.0725 |
| `squadPerformance.p10Overall` | 4240.7 | 4182.099999999999 | -1.0852 | 40 | 11 | 29 | 0.0064 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4162.299999999999 | 4092.499999999999 | -1.2926 | 46 | 18 | 28 | 0.1839 |
| `squadPerformance.meanMovement` | 5373.300000000001 | 5372.900000000001 | -0.0074 | 36 | 20 | 16 | 0.6177 |
| `squadPerformance.meanControl` | 5089.100000000001 | 5088 | -0.0204 | 44 | 21 | 23 | 0.8804 |
| `squadPerformance.meanCohesion` | 4702.600000000001 | 4715.800000000001 | 0.2444 | 47 | 24 | 23 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699b-0054 115.05 s (timeline) · c699b-0005 116.1 s (timeline) · c699b-0033 121.05 s (timeline) · c699b-0030 135 s (timeline) · c699b-0022 137.1 s (timeline) · c699b-0027 143.1 s (timeline) · c699b-0039 146.1 s (timeline) · c699b-0004 149.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1513&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699b-a69e4a40/ai_flow_live.html?bench=1513&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1513`); it opens the seed that parts earliest, and the dropdowns choose another.

