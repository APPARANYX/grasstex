# Benchmark run #1534 · 60 seeds from `p703` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerLeaderless=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/pr703-4b875e44 @ 4b875e4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256107005) · build v29-dev

## Verdict

**QUIET: 51 of 57 pairs changed (median first part 293.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.5% (p 0.2891)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **57** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.988 (gate 1.25)
- the 9 changed records first part at simulated second: min 188.1, p10 188.1, median 293.1, p90 493.05, max 493.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2058 | 2088 | 0.5263 | 8 | 6 | 2 | 0.2891 |
| `usKills` | 837 | 846 | 0.1579 | 7 | 4 | 3 | 1 |
| `geKills` | 1221 | 1242 | 0.3684 | 8 | 6 | 2 | 0.2891 |
| `fire.total` | 50902 | 51015 | 1.9825 | 8 | 4 | 4 | 1 |
| `fire.hits` | 4611 | 4727 | 2.0351 | 8 | 6 | 2 | 0.2891 |
| `retreatSamples` | 123349 | 124476 | 19.7719 | 9 | 5 | 4 | 1 |
| `movementResolver.changes` | 170648 | 170393 | -4.4737 | 9 | 5 | 4 | 1 |
| `grenades.throws` | 63 | 59 | -0.0702 | 4 | 2 | 2 | 1 |
| `grenades.bursts` | 63 | 59 | -0.0702 | 4 | 2 | 2 | 1 |
| `grenades.wounded` | 40 | 36 | -0.0702 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 14 | 12 | -0.0351 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 127 | 122 | -0.0877 | 3 | 1 | 2 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 15 | 22 | 0.1228 | 4 | 4 | 0 | 0.125 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 69 | 69 | 0 | 7 | 4 | 3 | 1 |
| `loopAlerts.length` | 809 | 810 | 0.0175 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 215 | 215 | 0 | 7 | 3 | 4 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2602 | 2600 | -0.0351 | 8 | 4 | 4 | 1 |
| `recon.contacts` | 541 | 544 | 0.0526 | 7 | 3 | 4 | 1 |
| `recon.noContact` | 590 | 579 | -0.193 | 8 | 1 | 7 | 0.0703 |
| `recon.timeouts` | 46 | 43 | -0.0526 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 1389 | 1395 | 0.1053 | 8 | 4 | 4 | 1 |
| `recon.reportsDelivered` | 2121 | 2111 | -0.1754 | 6 | 3 | 3 | 1 |
| `recon.retriggerBlocked` | 692 | 688 | -0.0702 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanOverall` | 4706.099999999999 | 4706.2 | 0.0018 | 9 | 5 | 4 | 1 |
| `squadPerformance.p10Overall` | 4364.1 | 4360.300000000001 | -0.0667 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3780.0000000000005 | 3776.7999999999997 | -0.0561 | 9 | 3 | 6 | 0.5078 |
| `squadPerformance.meanMovement` | 5692.1 | 5692.4 | 0.0053 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanControl` | 5459.200000000001 | 5469.100000000001 | 0.1737 | 8 | 6 | 2 | 0.2891 |
| `squadPerformance.meanCohesion` | 5245.400000000001 | 5245.9000000000015 | 0.0088 | 9 | 4 | 5 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p703-0036 188.1 s (timeline) · p703-0041 244.05 s (stress) · p703-0012 288 s (timeline) · p703-0003 292.05 s (stress) · p703-0011 293.1 s (timeline) · p703-0013 303 s (timeline) · p703-0039 334.05 s (timeline) · p703-0029 337.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1534&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr703-4b875e44/ai_flow_live.html?bench=1534&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1534`); it opens the seed that parts earliest, and the dropdowns choose another.

