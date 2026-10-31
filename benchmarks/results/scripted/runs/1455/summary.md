# Benchmark run #1455 · 60 seeds from `cfr-20261031-u` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&contactFireResume=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/benchmark-launch/contactfire-resume-20261031 @ 2d2f546 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184112406) · build v29-dev

## Verdict

**WEAK: 58 of 60 pairs changed (median first part 173.1 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -3.3% (p 1)**

- Under 0.05 only: retreatSamples 109792 to 118321 (+7.8%, p 0.0365).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x1.07 (gate 1.25)
- the 52 changed records first part at simulated second: min 100.05, p10 131.1, median 173.1, p90 226.05, max 285

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1843 | 1782 | -1.0167 | 51 | 25 | 26 | 1 |
| `usKills` | 806 | 781 | -0.4167 | 49 | 23 | 26 | 0.7754 |
| `geKills` | 1037 | 1001 | -0.6 | 49 | 24 | 25 | 1 |
| `fire.total` | 46600 | 45788 | -13.5333 | 52 | 26 | 26 | 1 |
| `fire.hits` | 4001 | 3887 | -1.9 | 49 | 27 | 22 | 0.5682 |
| `retreatSamples` | 109792 | 118321 | 142.15 | 52 | 34 | 18 | 0.0365 |
| `movementResolver.changes` | 165976 | 160159 | -96.95 | 51 | 23 | 28 | 0.5758 |
| `grenades.throws` | 42 | 43 | 0.0167 | 23 | 11 | 12 | 1 |
| `grenades.bursts` | 41 | 43 | 0.0333 | 24 | 12 | 12 | 1 |
| `grenades.wounded` | 41 | 49 | 0.1333 | 13 | 8 | 5 | 0.5811 |
| `grenades.casualties` | 16 | 17 | 0.0167 | 6 | 3 | 3 | 1 |
| `grenades.suppressed` | 129 | 156 | 0.45 | 12 | 7 | 5 | 0.7744 |
| `grenades.friendlyWounded` | 1 | 3 | 0.0333 | 4 | 3 | 1 | 0.625 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 7 | 10 | 0.05 | 12 | 7 | 5 | 0.7744 |
| `movementStalls.length` | 3 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 82 | 82 | 0 | 40 | 19 | 21 | 0.8746 |
| `loopAlerts.length` | 826 | 814 | -0.2 | 17 | 7 | 10 | 0.6291 |
| `writerConflicts` | 10 | 30 | 0.3333 | 7 | 5 | 2 | 0.4531 |
| `regroups.entries` | 322 | 365 | 0.7167 | 45 | 26 | 19 | 0.3713 |
| `stallOutcomes.wakes` | 110 | 113 | 0.05 | 21 | 11 | 10 | 1 |
| `stallOutcomes.repeats` | 33 | 30 | -0.05 | 17 | 7 | 10 | 0.6291 |
| `timeline.stalledOnsets` | 3 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 12 | 0 | -0.2 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 3 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 12 | 0 | -0.2 | 1 | 0 | 1 | 1 |
| `recon.orders` | 2319 | 2305 | -0.2333 | 50 | 24 | 26 | 0.8877 |
| `recon.contacts` | 484 | 502 | 0.3 | 45 | 22 | 23 | 1 |
| `recon.noContact` | 646 | 627 | -0.3167 | 42 | 18 | 24 | 0.4408 |
| `recon.timeouts` | 46 | 39 | -0.1167 | 19 | 6 | 13 | 0.1671 |
| `recon.cancelled` | 1076 | 1080 | 0.0667 | 47 | 24 | 23 | 1 |
| `recon.reportsDelivered` | 1872 | 1909 | 0.6167 | 51 | 23 | 28 | 0.5758 |
| `recon.retriggerBlocked` | 686 | 692 | 0.1 | 44 | 21 | 23 | 0.8804 |
| `squadPerformance.meanOverall` | 4986.0999999999985 | 4980.400000000001 | -0.095 | 50 | 24 | 26 | 0.8877 |
| `squadPerformance.p10Overall` | 4625.5 | 4618.200000000001 | -0.1217 | 23 | 12 | 11 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4041 | 4021.2999999999997 | -0.3283 | 52 | 21 | 31 | 0.2116 |
| `squadPerformance.meanMovement` | 5977.1 | 5978.600000000001 | 0.025 | 26 | 18 | 8 | 0.0755 |
| `squadPerformance.meanControl` | 5703.200000000001 | 5705.200000000001 | 0.0333 | 49 | 31 | 18 | 0.0854 |
| `squadPerformance.meanCohesion` | 5574.299999999999 | 5567.599999999999 | -0.1117 | 51 | 26 | 25 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cfr-20261031-u-0014 100.05 s (timeline) · cfr-20261031-u-0024 110.1 s (timeline) · cfr-20261031-u-0055 110.1 s (timeline) · cfr-20261031-u-0017 112.05 s (timeline) · cfr-20261031-u-0016 126 s (timeline) · cfr-20261031-u-0007 131.1 s (timeline) · cfr-20261031-u-0040 131.1 s (timeline) · cfr-20261031-u-0011 133.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1455&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-launch-contactfire-resume-20261031/ai_flow_live.html?bench=1455&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1455`); it opens the seed that parts earliest, and the dropdowns choose another.

