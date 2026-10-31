# Benchmark run #1515 · 60 seeds from `c699b` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699b-a69e4a40 @ a69e4a4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41242492236) · build v29-dev

## Verdict

**WEAK: 51 of 54 pairs changed (median first part 174 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.1% (p 0.883)**

- Under 0.05 only: geKills 461 to 498 (+8.0%, p 0.0315).

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.984 (gate 1.25)
- the 49 changed records first part at simulated second: min 124.05, p10 132, median 174, p90 243, max 278.85

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 830 | 829 | -0.0185 | 46 | 22 | 24 | 0.883 |
| `usKills` | 369 | 331 | -0.7037 | 38 | 14 | 24 | 0.1433 |
| `geKills` | 461 | 498 | 0.6852 | 43 | 29 | 14 | 0.0315 |
| `fire.total` | 20318 | 20451 | 2.463 | 48 | 25 | 23 | 0.8854 |
| `fire.hits` | 1878 | 1836 | -0.7778 | 41 | 24 | 17 | 0.3489 |
| `retreatSamples` | 4984 | 5532 | 10.1481 | 44 | 24 | 20 | 0.6516 |
| `movementResolver.changes` | 106326 | 106579 | 4.6852 | 49 | 31 | 18 | 0.0854 |
| `grenades.throws` | 17 | 18 | 0.0185 | 6 | 3 | 3 | 1 |
| `grenades.bursts` | 15 | 15 | 0 | 6 | 3 | 3 | 1 |
| `grenades.wounded` | 6 | 10 | 0.0741 | 3 | 3 | 0 | 0.25 |
| `grenades.casualties` | 2 | 1 | -0.0185 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 13 | 23 | 0.1852 | 4 | 4 | 0 | 0.125 |
| `grenades.friendlyWounded` | 0 | 2 | 0.037 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 5 | 0.0556 | 4 | 3 | 1 | 0.625 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 1 | -0.0185 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 526 | 486 | -0.7407 | 41 | 19 | 22 | 0.7552 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 78 | 80 | 0.037 | 22 | 12 | 10 | 0.8318 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1385 | 1367 | -0.3333 | 42 | 21 | 21 | 1 |
| `recon.contacts` | 184 | 184 | 0 | 40 | 21 | 19 | 0.8746 |
| `recon.noContact` | 394 | 401 | 0.1296 | 17 | 12 | 5 | 0.1435 |
| `recon.timeouts` | 27 | 26 | -0.0185 | 5 | 2 | 3 | 1 |
| `recon.cancelled` | 716 | 686 | -0.5556 | 40 | 16 | 24 | 0.2682 |
| `recon.reportsDelivered` | 858 | 845 | -0.2407 | 35 | 17 | 18 | 1 |
| `recon.retriggerBlocked` | 505 | 502 | -0.0556 | 29 | 13 | 16 | 0.7111 |
| `squadPerformance.meanOverall` | 4669 | 4658.3 | -0.1981 | 48 | 23 | 25 | 0.8854 |
| `squadPerformance.p10Overall` | 4230 | 4205.499999999999 | -0.4537 | 38 | 17 | 21 | 0.6271 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4228.2 | 4206.3 | -0.4056 | 45 | 22 | 23 | 1 |
| `squadPerformance.meanMovement` | 5370.5 | 5375.800000000001 | 0.0981 | 40 | 23 | 17 | 0.4296 |
| `squadPerformance.meanControl` | 5080.299999999999 | 5100.4 | 0.3722 | 46 | 25 | 21 | 0.6587 |
| `squadPerformance.meanCohesion` | 4643.400000000001 | 4621.8 | -0.4 | 47 | 18 | 29 | 0.1439 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699b-0018 124.05 s (timeline) · c699b-0024 124.05 s (timeline) · c699b-0035 124.05 s (timeline) · c699b-0041 124.05 s (timeline) · c699b-0019 132 s (timeline) · c699b-0040 134.1 s (timeline) · c699b-0006 140.1 s (timeline) · c699b-0029 141 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1515&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699b-a69e4a40/ai_flow_live.html?bench=1515&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1515`); it opens the seed that parts earliest, and the dropdowns choose another.

