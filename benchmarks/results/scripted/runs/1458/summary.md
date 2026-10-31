# Benchmark run #1458 · 60 seeds from `cfr2-us-defend` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&contactFireResume=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/benchmark-launch/contactfire-resume-b-20261031 @ 4577c90 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184419009) · build v29-dev

## Verdict

**WEAK: 58 of 60 pairs changed (median first part 175.05 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -5.4% (p 0.0595)**

- Under 0.05 only: grenades.aborted 19 to 5 (-73.7%, p 0.0078); fire.hits 4183 to 4004 (-4.3%, p 0.0444).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 51 changed records first part at simulated second: min 130.05, p10 147, median 175.05, p90 239.1, max 284.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1803 | 1706 | -1.6167 | 48 | 17 | 31 | 0.0595 |
| `usKills` | 849 | 836 | -0.2167 | 48 | 21 | 27 | 0.4709 |
| `geKills` | 954 | 870 | -1.4 | 49 | 19 | 30 | 0.1524 |
| `fire.total` | 43236 | 45118 | 31.3667 | 51 | 26 | 25 | 1 |
| `fire.hits` | 4183 | 4004 | -2.9833 | 49 | 17 | 32 | 0.0444 |
| `retreatSamples` | 110050 | 108919 | -18.85 | 51 | 27 | 24 | 0.7798 |
| `movementResolver.changes` | 155529 | 151529 | -66.6667 | 51 | 23 | 28 | 0.5758 |
| `grenades.throws` | 53 | 36 | -0.2833 | 16 | 5 | 11 | 0.2101 |
| `grenades.bursts` | 53 | 36 | -0.2833 | 16 | 5 | 11 | 0.2101 |
| `grenades.wounded` | 31 | 27 | -0.0667 | 10 | 4 | 6 | 0.7539 |
| `grenades.casualties` | 11 | 14 | 0.05 | 7 | 4 | 3 | 1 |
| `grenades.suppressed` | 84 | 57 | -0.45 | 11 | 3 | 8 | 0.2266 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 19 | 5 | -0.2333 | 8 | 0 | 8 | 0.0078 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 99 | 75 | -0.4 | 41 | 18 | 23 | 0.5327 |
| `loopAlerts.length` | 799 | 787 | -0.2 | 20 | 8 | 12 | 0.5034 |
| `writerConflicts` | 29 | 15 | -0.2333 | 10 | 6 | 4 | 0.7539 |
| `regroups.entries` | 470 | 458 | -0.2 | 47 | 26 | 21 | 0.5601 |
| `stallOutcomes.wakes` | 100 | 102 | 0.0333 | 12 | 7 | 5 | 0.7744 |
| `stallOutcomes.repeats` | 21 | 28 | 0.1167 | 10 | 8 | 2 | 0.1094 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2224 | 2187 | -0.6167 | 49 | 24 | 25 | 1 |
| `recon.contacts` | 521 | 559 | 0.6333 | 48 | 28 | 20 | 0.3123 |
| `recon.noContact` | 539 | 548 | 0.15 | 46 | 23 | 23 | 1 |
| `recon.timeouts` | 34 | 36 | 0.0333 | 13 | 7 | 6 | 1 |
| `recon.cancelled` | 1059 | 971 | -1.4667 | 47 | 17 | 30 | 0.0789 |
| `recon.reportsDelivered` | 2040 | 2161 | 2.0167 | 49 | 28 | 21 | 0.3916 |
| `recon.retriggerBlocked` | 610 | 592 | -0.3 | 43 | 20 | 23 | 0.7608 |
| `squadPerformance.meanOverall` | 5010.000000000001 | 5014.700000000001 | 0.0783 | 49 | 28 | 21 | 0.3916 |
| `squadPerformance.p10Overall` | 4649.799999999998 | 4641.4 | -0.14 | 27 | 15 | 12 | 0.7011 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4063.1000000000013 | 4058.599999999998 | -0.075 | 51 | 28 | 23 | 0.5758 |
| `squadPerformance.meanMovement` | 5977.399999999998 | 5976.899999999997 | -0.0083 | 34 | 19 | 15 | 0.6076 |
| `squadPerformance.meanControl` | 5714.9 | 5722.999999999998 | 0.135 | 50 | 23 | 27 | 0.6718 |
| `squadPerformance.meanCohesion` | 5604.200000000001 | 5589.599999999999 | -0.2433 | 49 | 21 | 28 | 0.3916 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cfr2-us-defend-0008 130.05 s (timeline) · cfr2-us-defend-0055 132 s (timeline) · cfr2-us-defend-0021 134.1 s (timeline) · cfr2-us-defend-0053 137.1 s (timeline) · cfr2-us-defend-0015 145.05 s (timeline) · cfr2-us-defend-0027 147 s (timeline) · cfr2-us-defend-0022 148.05 s (timeline) · cfr2-us-defend-0018 150 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1458&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-launch-contactfire-resume-b-20261031/ai_flow_live.html?bench=1458&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1458`); it opens the seed that parts earliest, and the dropdowns choose another.

