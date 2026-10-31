# Benchmark run #1450 · 60 seeds from `ambush-20261031` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAmbush=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-9nqzwp @ 1e6cda5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41163852249) · build v29-dev

## Verdict

**QUIET: 28 of 58 pairs changed (median first part 200.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.9% (p 0.7905)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **58** pairs (unpaired: off 0, on 0) · identical in every field: **30** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 19 changed records first part at simulated second: min 113.1, p10 120, median 200.1, p90 241.05, max 268.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 930 | 922 | -0.1379 | 14 | 6 | 8 | 0.7905 |
| `usKills` | 328 | 332 | 0.069 | 12 | 8 | 4 | 0.3877 |
| `geKills` | 602 | 590 | -0.2069 | 16 | 7 | 9 | 0.8036 |
| `fire.total` | 17566 | 17315 | -4.3276 | 19 | 10 | 9 | 1 |
| `fire.hits` | 1917 | 1918 | 0.0172 | 16 | 7 | 9 | 0.8036 |
| `retreatSamples` | 9131 | 9192 | 1.0517 | 16 | 6 | 10 | 0.4545 |
| `movementResolver.changes` | 104913 | 105096 | 3.1552 | 19 | 13 | 6 | 0.1671 |
| `grenades.throws` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 13 | 12 | -0.0172 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 54 | 53 | -0.0172 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 2 | 3 | 0.0172 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 5 | 0.0172 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 566 | 583 | 0.2931 | 13 | 8 | 5 | 0.5811 |
| `writerConflicts` | 0 | 2 | 0.0345 | 1 | 1 | 0 | 1 |
| `regroups.entries` | 260 | 264 | 0.069 | 12 | 6 | 6 | 1 |
| `stallOutcomes.wakes` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1435 | 1435 | 0 | 15 | 7 | 8 | 1 |
| `recon.contacts` | 241 | 250 | 0.1552 | 14 | 8 | 6 | 0.7905 |
| `recon.noContact` | 345 | 347 | 0.0345 | 5 | 3 | 2 | 1 |
| `recon.timeouts` | 33 | 34 | 0.0172 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 761 | 747 | -0.2414 | 15 | 6 | 9 | 0.6072 |
| `recon.reportsDelivered` | 1047 | 1056 | 0.1552 | 13 | 8 | 5 | 0.5811 |
| `recon.retriggerBlocked` | 510 | 509 | -0.0172 | 9 | 5 | 4 | 1 |
| `squadPerformance.meanOverall` | 4978.4 | 4979.2 | 0.0138 | 17 | 7 | 10 | 0.6291 |
| `squadPerformance.p10Overall` | 4508.4 | 4518.499999999999 | 0.1741 | 17 | 10 | 7 | 0.6291 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4378 | 4399.2 | 0.3655 | 16 | 10 | 6 | 0.4545 |
| `squadPerformance.meanMovement` | 5782.000000000002 | 5781.500000000001 | -0.0086 | 12 | 4 | 8 | 0.3877 |
| `squadPerformance.meanControl` | 5480.000000000001 | 5474.6 | -0.0931 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.meanCohesion` | 5079.699999999998 | 5056.499999999999 | -0.4 | 17 | 5 | 12 | 0.1435 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ambush-20261031-0028 113.1 s (timeline) · ambush-20261031-0001 120 s (timeline) · ambush-20261031-0023 145.05 s (timeline) · ambush-20261031-0057 153 s (timeline) · ambush-20261031-0054 179.1 s (timeline) · ambush-20261031-0026 181.05 s (timeline) · ambush-20261031-0021 182.1 s (timeline) · ambush-20261031-0044 185.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1450&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1450`); it opens the seed that parts earliest, and the dropdowns choose another.

