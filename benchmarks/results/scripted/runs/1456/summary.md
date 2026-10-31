# Benchmark run #1456 · 60 seeds from `cfr2-meeting` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&contactFireResume=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/benchmark-launch/contactfire-resume-b-20261031 @ 4577c90 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184281407) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed (median first part 220.575 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.3% (p 0.5901)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.981 (gate 1.25)
- the 60 changed records first part at simulated second: min 170.1, p10 189, median 220.575, p90 276, max 476.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1988 | 1943 | -0.75 | 55 | 25 | 30 | 0.5901 |
| `usKills` | 803 | 757 | -0.7667 | 55 | 25 | 30 | 0.5901 |
| `geKills` | 1185 | 1186 | 0.0167 | 55 | 28 | 27 | 1 |
| `fire.total` | 46057 | 46009 | -0.8 | 60 | 30 | 30 | 1 |
| `fire.hits` | 4371 | 4327 | -0.7333 | 59 | 25 | 34 | 0.2976 |
| `retreatSamples` | 108586 | 106249 | -38.95 | 59 | 27 | 32 | 0.6029 |
| `movementResolver.changes` | 242509 | 239871 | -43.9667 | 60 | 26 | 34 | 0.3663 |
| `grenades.throws` | 32 | 46 | 0.2333 | 16 | 11 | 5 | 0.2101 |
| `grenades.bursts` | 32 | 46 | 0.2333 | 16 | 11 | 5 | 0.2101 |
| `grenades.wounded` | 27 | 42 | 0.25 | 16 | 11 | 5 | 0.2101 |
| `grenades.casualties` | 7 | 8 | 0.0167 | 9 | 5 | 4 | 1 |
| `grenades.suppressed` | 49 | 59 | 0.1667 | 15 | 8 | 7 | 1 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 5 | 2 | 3 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.aborted` | 12 | 10 | -0.0333 | 9 | 3 | 6 | 0.5078 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 426 | 406 | -0.3333 | 51 | 21 | 30 | 0.2624 |
| `loopAlerts.length` | 977 | 970 | -0.1167 | 28 | 15 | 13 | 0.8506 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 628 | 567 | -1.0167 | 55 | 28 | 27 | 1 |
| `stallOutcomes.wakes` | 136 | 136 | 0 | 27 | 13 | 14 | 1 |
| `stallOutcomes.repeats` | 40 | 45 | 0.0833 | 19 | 10 | 9 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1634 | 1723 | 1.4833 | 56 | 32 | 24 | 0.3497 |
| `recon.contacts` | 114 | 118 | 0.0667 | 33 | 19 | 14 | 0.4869 |
| `recon.noContact` | 764 | 816 | 0.8667 | 50 | 30 | 20 | 0.2026 |
| `recon.timeouts` | 16 | 18 | 0.0333 | 14 | 8 | 6 | 0.7905 |
| `recon.cancelled` | 689 | 712 | 0.3833 | 50 | 28 | 22 | 0.4799 |
| `recon.reportsDelivered` | 545 | 559 | 0.2333 | 45 | 22 | 23 | 1 |
| `recon.retriggerBlocked` | 1321 | 1380 | 0.9833 | 55 | 31 | 24 | 0.4188 |
| `squadPerformance.meanOverall` | 4815.900000000001 | 4812.799999999999 | -0.0517 | 57 | 28 | 29 | 1 |
| `squadPerformance.p10Overall` | 4475.1 | 4470.1 | -0.0833 | 31 | 13 | 18 | 0.4731 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3667.8999999999996 | 3664.4000000000015 | -0.0583 | 57 | 29 | 28 | 1 |
| `squadPerformance.meanMovement` | 5972.4000000000015 | 5973.9 | 0.025 | 41 | 23 | 18 | 0.5327 |
| `squadPerformance.meanControl` | 5552.499999999997 | 5526.7 | -0.43 | 58 | 22 | 36 | 0.0869 |
| `squadPerformance.meanCohesion` | 5580.800000000001 | 5573.2 | -0.1267 | 58 | 29 | 29 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cfr2-meeting-0012 170.1 s (timeline) · cfr2-meeting-0006 174 s (timeline) · cfr2-meeting-0019 178.05 s (stress) · cfr2-meeting-0058 182.1 s (timeline) · cfr2-meeting-0045 188.1 s (timeline) · cfr2-meeting-0005 189 s (timeline) · cfr2-meeting-0036 189 s (timeline) · cfr2-meeting-0047 191.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1456&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-launch-contactfire-resume-b-20261031/ai_flow_live.html?bench=1456&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1456`); it opens the seed that parts earliest, and the dropdowns choose another.

