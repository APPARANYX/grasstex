# Benchmark run #1449 · 60 seeds from `ambush-20261031` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAmbush=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-9nqzwp @ 1e6cda5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41163849874) · build v29-dev

## Verdict

**WEAK: 43 of 58 pairs changed (median first part 198 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.0% (p 0.6636)**

- Under 0.05 only: squadPerformance.meanControl 5515.9000000000015 to 5498.700000000001 (-0.3%, p 0.0347).

## Paired comparison (off against on)

- **58** pairs (unpaired: off 0, on 0) · identical in every field: **15** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 29 changed records first part at simulated second: min 124.05, p10 138, median 198, p90 276, max 301.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 867 | 876 | 0.1552 | 21 | 12 | 9 | 0.6636 |
| `usKills` | 439 | 445 | 0.1034 | 22 | 13 | 9 | 0.5235 |
| `geKills` | 428 | 431 | 0.0517 | 21 | 11 | 10 | 1 |
| `fire.total` | 17621 | 18460 | 14.4655 | 27 | 16 | 11 | 0.4421 |
| `fire.hits` | 1825 | 1891 | 1.1379 | 23 | 12 | 11 | 1 |
| `retreatSamples` | 9522 | 9280 | -4.1724 | 23 | 9 | 14 | 0.4049 |
| `movementResolver.changes` | 105346 | 105076 | -4.6552 | 29 | 16 | 13 | 0.7111 |
| `grenades.throws` | 12 | 9 | -0.0517 | 3 | 2 | 1 | 1 |
| `grenades.bursts` | 10 | 6 | -0.069 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 6 | 4 | -0.0345 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 11 | 5 | -0.1034 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 2 | -0.0345 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 3 | 0.0172 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 598 | 598 | 0 | 20 | 13 | 7 | 0.2632 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 112 | 113 | 0.0172 | 10 | 6 | 4 | 0.7539 |
| `stallOutcomes.wakes` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1378 | 1367 | -0.1897 | 23 | 11 | 12 | 1 |
| `recon.contacts` | 216 | 201 | -0.2586 | 16 | 4 | 12 | 0.0768 |
| `recon.noContact` | 450 | 444 | -0.1034 | 7 | 1 | 6 | 0.125 |
| `recon.timeouts` | 31 | 32 | 0.0172 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 634 | 633 | -0.0172 | 19 | 10 | 9 | 1 |
| `recon.reportsDelivered` | 998 | 906 | -1.5862 | 18 | 6 | 12 | 0.2379 |
| `recon.retriggerBlocked` | 533 | 530 | -0.0517 | 11 | 4 | 7 | 0.5488 |
| `squadPerformance.meanOverall` | 4966.999999999999 | 4979.9000000000015 | 0.2224 | 24 | 15 | 9 | 0.3075 |
| `squadPerformance.p10Overall` | 4455.200000000001 | 4458.7 | 0.0603 | 19 | 9 | 10 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4248.8 | 4297 | 0.831 | 19 | 13 | 6 | 0.1671 |
| `squadPerformance.meanMovement` | 5779.400000000001 | 5777.299999999999 | -0.0362 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.meanControl` | 5515.9000000000015 | 5498.700000000001 | -0.2966 | 23 | 6 | 17 | 0.0347 |
| `squadPerformance.meanCohesion` | 5286.1 | 5267.200000000001 | -0.3259 | 24 | 9 | 15 | 0.3075 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ambush-20261031-0048 124.05 s (timeline) · ambush-20261031-0037 131.1 s (timeline) · ambush-20261031-0029 138 s (timeline) · ambush-20261031-0013 143.1 s (timeline) · ambush-20261031-0032 146.1 s (timeline) · ambush-20261031-0039 151.05 s (timeline) · ambush-20261031-0046 164.1 s (timeline) · ambush-20261031-0034 168 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1449&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1449`); it opens the seed that parts earliest, and the dropdowns choose another.

