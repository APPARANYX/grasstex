# Benchmark run #1500 · 60 seeds from `c699` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699-0760b932 @ 0760b93 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41232546320) · build v29-dev

## Verdict

**WEAK: 49 of 50 pairs changed (median first part 178.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.3% (p 0.5114)**

- Under 0.05 only: recon.noContact 428 to 438 (+2.3%, p 0.0391).

## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.989 (gate 1.25)
- the 47 changed records first part at simulated second: min 86.1, p10 136.05, median 178.05, p90 238.05, max 280.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 790 | 792 | 0.04 | 37 | 21 | 16 | 0.5114 |
| `usKills` | 357 | 382 | 0.5 | 41 | 24 | 17 | 0.3489 |
| `geKills` | 433 | 410 | -0.46 | 39 | 20 | 19 | 1 |
| `fire.total` | 21792 | 21509 | -5.66 | 47 | 18 | 29 | 0.1439 |
| `fire.hits` | 1784 | 1785 | 0.02 | 43 | 26 | 17 | 0.2221 |
| `retreatSamples` | 5450 | 5276 | -3.48 | 43 | 24 | 19 | 0.5424 |
| `movementResolver.changes` | 103477 | 101867 | -32.2 | 47 | 17 | 30 | 0.0789 |
| `grenades.throws` | 16 | 13 | -0.06 | 4 | 1 | 3 | 0.625 |
| `grenades.bursts` | 15 | 13 | -0.04 | 3 | 1 | 2 | 1 |
| `grenades.wounded` | 5 | 11 | 0.12 | 4 | 3 | 1 | 0.625 |
| `grenades.casualties` | 1 | 3 | 0.04 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 30 | 37 | 0.14 | 4 | 2 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 3 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 500 | 489 | -0.22 | 37 | 18 | 19 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 65 | 67 | 0.04 | 17 | 10 | 7 | 0.6291 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1156 | 1177 | 0.42 | 42 | 26 | 16 | 0.1641 |
| `recon.contacts` | 173 | 171 | -0.04 | 34 | 19 | 15 | 0.6076 |
| `recon.noContact` | 428 | 438 | 0.2 | 9 | 8 | 1 | 0.0391 |
| `recon.timeouts` | 14 | 13 | -0.02 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 492 | 487 | -0.1 | 37 | 16 | 21 | 0.5114 |
| `recon.reportsDelivered` | 694 | 707 | 0.26 | 31 | 17 | 14 | 0.7201 |
| `recon.retriggerBlocked` | 453 | 448 | -0.1 | 21 | 8 | 13 | 0.3833 |
| `squadPerformance.meanOverall` | 4291 | 4306.9 | 0.318 | 44 | 27 | 17 | 0.1742 |
| `squadPerformance.p10Overall` | 3860.5000000000014 | 3894.1999999999994 | 0.674 | 36 | 24 | 12 | 0.0652 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3791 | 3809.5 | 0.37 | 45 | 23 | 22 | 1 |
| `squadPerformance.meanMovement` | 4978.9 | 4977.900000000001 | -0.02 | 31 | 16 | 15 | 1 |
| `squadPerformance.meanControl` | 4710.599999999999 | 4723 | 0.248 | 45 | 25 | 20 | 0.5515 |
| `squadPerformance.meanCohesion` | 4442.2 | 4418.600000000002 | -0.472 | 44 | 17 | 27 | 0.1742 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699-0060 86.1 s (timeline) · c699-0049 116.1 s (timeline) · c699-0055 128.1 s (timeline) · c699-0059 134.1 s (timeline) · c699-0021 136.05 s (timeline) · c699-0022 143.1 s (timeline) · c699-0020 148.05 s (timeline) · c699-0050 151.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1500&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699-0760b932/ai_flow_live.html?bench=1500&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1500`); it opens the seed that parts earliest, and the dropdowns choose another.

