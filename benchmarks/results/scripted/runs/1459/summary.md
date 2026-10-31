# Benchmark run #1459 · 60 seeds from `cfr2-ge-defend` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&contactFireResume=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/benchmark-launch/contactfire-resume-b-20261031 @ 4577c90 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184426438) · build v29-dev

## Verdict

**WEAK: 58 of 60 pairs changed (median first part 173.1 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -3.3% (p 0.7754)**

- Under 0.05 only: squadPerformance.meanControl 5646.3 to 5698.6 (+0.9%, p 0.0402).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.986 (gate 1.25)
- the 55 changed records first part at simulated second: min 114, p10 133.05, median 173.1, p90 215.1, max 288

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1770 | 1711 | -0.9833 | 49 | 26 | 23 | 0.7754 |
| `usKills` | 664 | 658 | -0.1 | 52 | 28 | 24 | 0.6778 |
| `geKills` | 1106 | 1053 | -0.8833 | 50 | 23 | 27 | 0.6718 |
| `fire.total` | 43081 | 46028 | 49.1167 | 55 | 32 | 23 | 0.2806 |
| `fire.hits` | 3983 | 3941 | -0.7 | 52 | 26 | 26 | 1 |
| `retreatSamples` | 105540 | 110021 | 74.6833 | 55 | 31 | 24 | 0.4188 |
| `movementResolver.changes` | 149864 | 149075 | -13.15 | 55 | 25 | 30 | 0.5901 |
| `grenades.throws` | 63 | 45 | -0.3 | 26 | 12 | 14 | 0.845 |
| `grenades.bursts` | 61 | 45 | -0.2667 | 26 | 12 | 14 | 0.845 |
| `grenades.wounded` | 26 | 34 | 0.1333 | 15 | 8 | 7 | 1 |
| `grenades.casualties` | 7 | 12 | 0.0833 | 6 | 4 | 2 | 0.6875 |
| `grenades.suppressed` | 121 | 62 | -0.9833 | 16 | 6 | 10 | 0.4545 |
| `grenades.friendlyWounded` | 2 | 3 | 0.0167 | 3 | 2 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 2 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `grenades.aborted` | 11 | 9 | -0.0333 | 10 | 6 | 4 | 0.7539 |
| `movementStalls.length` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 78 | 68 | -0.1667 | 27 | 12 | 15 | 0.7011 |
| `loopAlerts.length` | 810 | 840 | 0.5 | 29 | 20 | 9 | 0.0614 |
| `writerConflicts` | 27 | 2 | -0.4167 | 4 | 1 | 3 | 0.625 |
| `regroups.entries` | 411 | 435 | 0.4 | 50 | 26 | 24 | 0.8877 |
| `stallOutcomes.wakes` | 103 | 106 | 0.05 | 14 | 8 | 6 | 0.7905 |
| `stallOutcomes.repeats` | 20 | 18 | -0.0333 | 6 | 2 | 4 | 0.6875 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2332 | 2396 | 1.0667 | 54 | 29 | 25 | 0.6835 |
| `recon.contacts` | 475 | 541 | 1.1 | 50 | 31 | 19 | 0.1189 |
| `recon.noContact` | 573 | 567 | -0.1 | 45 | 19 | 26 | 0.3713 |
| `recon.timeouts` | 30 | 37 | 0.1167 | 17 | 11 | 6 | 0.3323 |
| `recon.cancelled` | 1221 | 1212 | -0.15 | 51 | 26 | 25 | 1 |
| `recon.reportsDelivered` | 2039 | 2014 | -0.4167 | 54 | 24 | 30 | 0.4966 |
| `recon.retriggerBlocked` | 645 | 631 | -0.2333 | 46 | 20 | 26 | 0.4614 |
| `squadPerformance.meanOverall` | 4992.299999999999 | 4985.700000000001 | -0.11 | 52 | 32 | 20 | 0.1263 |
| `squadPerformance.p10Overall` | 4581.599999999999 | 4576.1 | -0.0917 | 34 | 15 | 19 | 0.6076 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4100.9 | 4064.499999999999 | -0.6067 | 54 | 28 | 26 | 0.8919 |
| `squadPerformance.meanMovement` | 5987.799999999999 | 5987.899999999999 | 0.0017 | 29 | 14 | 15 | 1 |
| `squadPerformance.meanControl` | 5646.3 | 5698.6 | 0.8717 | 54 | 35 | 19 | 0.0402 |
| `squadPerformance.meanCohesion` | 5517.4000000000015 | 5516.4 | -0.0167 | 53 | 23 | 30 | 0.4101 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cfr2-ge-defend-0057 114 s (timeline) · cfr2-ge-defend-0008 126 s (timeline) · cfr2-ge-defend-0023 126 s (timeline) · cfr2-ge-defend-0024 126 s (timeline) · cfr2-ge-defend-0033 129 s (timeline) · cfr2-ge-defend-0048 133.05 s (timeline) · cfr2-ge-defend-0050 134.1 s (timeline) · cfr2-ge-defend-0007 137.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1459&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-launch-contactfire-resume-b-20261031/ai_flow_live.html?bench=1459&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1459`); it opens the seed that parts earliest, and the dropdowns choose another.

