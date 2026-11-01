# Benchmark run #1560 · 60 seeds from `c13ic` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-057c1f7c @ 057c1f7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257494024) · build v29-dev

## Verdict

**WEAK: 59 of 60 pairs changed (median first part 215.1 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties +3.4% (p 1)**

- Under 0.05 only: fire.hits 5314 to 5607 (+5.5%, p 0.0222); regroups.entries 253 to 294 (+16.2%, p 0.0357); recon.orders 2611 to 2730 (+4.6%, p 0.0489).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.999 (gate 1.25)
- the 56 changed records first part at simulated second: min 133.05, p10 157.05, median 215.1, p90 309, max 506.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2326 | 2405 | 1.3167 | 54 | 27 | 27 | 1 |
| `usKills` | 1079 | 1105 | 0.4333 | 52 | 31 | 21 | 0.2116 |
| `geKills` | 1247 | 1300 | 0.8833 | 54 | 24 | 30 | 0.4966 |
| `fire.total` | 72872 | 72447 | -7.0833 | 56 | 26 | 30 | 0.6889 |
| `fire.hits` | 5314 | 5607 | 4.8833 | 56 | 37 | 19 | 0.0222 |
| `retreatSamples` | 158281 | 161365 | 51.4 | 56 | 28 | 28 | 1 |
| `movementResolver.changes` | 207619 | 207498 | -2.0167 | 56 | 27 | 29 | 0.8939 |
| `grenades.throws` | 40 | 39 | -0.0167 | 23 | 10 | 13 | 0.6776 |
| `grenades.bursts` | 40 | 39 | -0.0167 | 23 | 10 | 13 | 0.6776 |
| `grenades.wounded` | 40 | 40 | 0 | 10 | 4 | 6 | 0.7539 |
| `grenades.casualties` | 10 | 10 | 0 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 77 | 76 | -0.0167 | 11 | 4 | 7 | 0.5488 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 12 | 10 | -0.0333 | 11 | 3 | 8 | 0.2266 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 101 | 92 | -0.15 | 35 | 18 | 17 | 1 |
| `loopAlerts.length` | 933 | 931 | -0.0333 | 18 | 6 | 12 | 0.2379 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 253 | 294 | 0.6833 | 45 | 30 | 15 | 0.0357 |
| `stallOutcomes.wakes` | 3 | 8 | 0.0833 | 7 | 6 | 1 | 0.125 |
| `stallOutcomes.repeats` | 1 | 4 | 0.05 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2611 | 2730 | 1.9833 | 51 | 33 | 18 | 0.0489 |
| `recon.contacts` | 544 | 602 | 0.9667 | 47 | 27 | 20 | 0.3817 |
| `recon.noContact` | 726 | 732 | 0.1 | 47 | 22 | 25 | 0.7709 |
| `recon.timeouts` | 37 | 45 | 0.1333 | 24 | 15 | 9 | 0.3075 |
| `recon.cancelled` | 1248 | 1297 | 0.8167 | 52 | 26 | 26 | 1 |
| `recon.reportsDelivered` | 2114 | 2473 | 5.9833 | 50 | 32 | 18 | 0.0649 |
| `recon.retriggerBlocked` | 804 | 839 | 0.5833 | 43 | 26 | 17 | 0.2221 |
| `squadPerformance.meanOverall` | 4857.200000000002 | 4855.7 | -0.025 | 55 | 25 | 30 | 0.5901 |
| `squadPerformance.p10Overall` | 4497.5 | 4501.599999999999 | 0.0683 | 20 | 9 | 11 | 0.8238 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3729.6999999999985 | 3721.9000000000005 | -0.13 | 56 | 27 | 29 | 0.8939 |
| `squadPerformance.meanMovement` | 5990.1 | 5991.5999999999985 | 0.025 | 31 | 21 | 10 | 0.0708 |
| `squadPerformance.meanControl` | 5731.6 | 5733.600000000001 | 0.0333 | 55 | 26 | 29 | 0.7877 |
| `squadPerformance.meanCohesion` | 5559.700000000001 | 5567 | 0.1217 | 54 | 28 | 26 | 0.8919 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ic-0036 133.05 s (timeline) · c13ic-0042 136.05 s (timeline) · c13ic-0005 144 s (timeline) · c13ic-0056 152.1 s (timeline) · c13ic-0047 153 s (timeline) · c13ic-0035 157.05 s (timeline) · c13ic-0023 160.05 s (timeline) · c13ic-0017 167.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1560&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-057c1f7c/ai_flow_live.html?bench=1560&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1560`); it opens the seed that parts earliest, and the dropdowns choose another.

