# Benchmark run #1448 · 60 seeds from `ambush-20261031` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAmbush=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-9nqzwp @ 1e6cda5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41163847596) · build v29-dev

## Verdict

**WEAK: 56 of 60 pairs changed (median first part 226.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -3.4% (p 1)**

- Under 0.05 only: fire.total 20785 to 20180 (-2.9%, p 0.0237).
- Runtime errors: off 2, on 3.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 2 / on 3 · wall time on/off x0.969 (gate 1.25)
- the 40 changed records first part at simulated second: min 164.1, p10 180, median 226.05, p90 282, max 304.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1091 | 1054 | -0.6167 | 31 | 16 | 15 | 1 |
| `usKills` | 447 | 427 | -0.3333 | 32 | 14 | 18 | 0.5966 |
| `geKills` | 644 | 627 | -0.2833 | 35 | 20 | 15 | 0.4996 |
| `fire.total` | 20785 | 20180 | -10.0833 | 39 | 12 | 27 | 0.0237 |
| `fire.hits` | 2336 | 2239 | -1.6167 | 36 | 15 | 21 | 0.405 |
| `retreatSamples` | 9250 | 9362 | 1.8667 | 37 | 19 | 18 | 1 |
| `movementResolver.changes` | 178178 | 177610 | -9.4667 | 39 | 19 | 20 | 1 |
| `grenades.throws` | 15 | 13 | -0.0333 | 6 | 2 | 4 | 0.6875 |
| `grenades.bursts` | 14 | 11 | -0.05 | 5 | 1 | 4 | 0.375 |
| `grenades.wounded` | 10 | 7 | -0.05 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 2 | 4 | 0.0333 | 3 | 2 | 1 | 1 |
| `grenades.suppressed` | 22 | 14 | -0.1333 | 5 | 3 | 2 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 4 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 55 | 56 | 0.0167 | 8 | 5 | 3 | 0.7266 |
| `loopAlerts.length` | 819 | 795 | -0.4 | 23 | 9 | 14 | 0.4049 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 125 | 136 | 0.1833 | 19 | 13 | 6 | 0.1671 |
| `stallOutcomes.wakes` | 23 | 25 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1195 | 1204 | 0.15 | 20 | 14 | 6 | 0.1153 |
| `recon.contacts` | 87 | 92 | 0.0833 | 16 | 10 | 6 | 0.4545 |
| `recon.noContact` | 576 | 581 | 0.0833 | 4 | 4 | 0 | 0.125 |
| `recon.timeouts` | 9 | 9 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 520 | 515 | -0.0833 | 18 | 7 | 11 | 0.4807 |
| `recon.reportsDelivered` | 514 | 511 | -0.05 | 18 | 10 | 8 | 0.8145 |
| `recon.retriggerBlocked` | 969 | 968 | -0.0167 | 19 | 9 | 10 | 1 |
| `squadPerformance.meanOverall` | 5013.200000000001 | 5022.2 | 0.15 | 38 | 23 | 15 | 0.2559 |
| `squadPerformance.p10Overall` | 4577.699999999999 | 4588.000000000001 | 0.1717 | 32 | 18 | 14 | 0.5966 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4146.1 | 4145.699999999999 | -0.0067 | 36 | 20 | 16 | 0.6177 |
| `squadPerformance.meanMovement` | 5940.099999999996 | 5942.299999999998 | 0.0367 | 31 | 16 | 15 | 1 |
| `squadPerformance.meanControl` | 5516.8 | 5535.800000000002 | 0.3167 | 37 | 21 | 16 | 0.5114 |
| `squadPerformance.meanCohesion` | 5492.899999999999 | 5483.4 | -0.1583 | 36 | 19 | 17 | 0.8679 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ambush-20261031-0016 164.1 s (timeline) · ambush-20261031-0040 177 s (timeline) · ambush-20261031-0028 179.1 s (timeline) · ambush-20261031-0052 180 s (timeline) · ambush-20261031-0031 181.05 s (timeline) · ambush-20261031-0006 184.05 s (timeline) · ambush-20261031-0011 187.05 s (timeline) · ambush-20261031-0022 188.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1448&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1448`); it opens the seed that parts earliest, and the dropdowns choose another.

