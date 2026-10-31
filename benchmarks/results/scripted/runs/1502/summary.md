# Benchmark run #1502 · 60 seeds from `ncs-c` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&navCornerStand=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/ncs-7e1ed1e1 @ 7e1ed1e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41233974026) · build v29-dev

## Verdict

**QUIET: 16 of 60 pairs changed (median first part 296.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.8% (p 0.2188)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **44** · runtime errors off 0 / on 0 · wall time on/off x1.003 (gate 1.25)
- the 8 changed records first part at simulated second: min 136.05, p10 136.05, median 296.1, p90 405, max 405

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2383 | 2363 | -0.3333 | 6 | 1 | 5 | 0.2188 |
| `usKills` | 948 | 929 | -0.3167 | 5 | 0 | 5 | 0.0625 |
| `geKills` | 1435 | 1434 | -0.0167 | 7 | 3 | 4 | 1 |
| `fire.total` | 56423 | 56259 | -2.7333 | 7 | 4 | 3 | 1 |
| `fire.hits` | 5308 | 5310 | 0.0333 | 7 | 4 | 3 | 1 |
| `retreatSamples` | 106988 | 109504 | 41.9333 | 7 | 4 | 3 | 1 |
| `movementResolver.changes` | 285833 | 285475 | -5.9667 | 8 | 5 | 3 | 0.7266 |
| `grenades.throws` | 43 | 42 | -0.0167 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 43 | 42 | -0.0167 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 46 | 47 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 17 | 18 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 81 | 82 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 5 | 1 | -0.0667 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 261 | 262 | 0.0167 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 982 | 981 | -0.0167 | 4 | 2 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 300 | 293 | -0.1167 | 6 | 3 | 3 | 1 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 5 | 2 | -0.05 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 49 | 6 | -0.7167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 5 | 2 | -0.05 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 49 | 6 | -0.7167 | 1 | 0 | 1 | 1 |
| `recon.orders` | 1851 | 1861 | 0.1667 | 6 | 4 | 2 | 0.6875 |
| `recon.contacts` | 98 | 101 | 0.05 | 3 | 3 | 0 | 0.25 |
| `recon.noContact` | 911 | 908 | -0.05 | 7 | 3 | 4 | 1 |
| `recon.timeouts` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 748 | 754 | 0.1 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 511 | 509 | -0.0333 | 4 | 2 | 2 | 1 |
| `recon.retriggerBlocked` | 1440 | 1446 | 0.1 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.meanOverall` | 4799.399999999998 | 4798.499999999998 | -0.015 | 8 | 4 | 4 | 1 |
| `squadPerformance.p10Overall` | 4481.1 | 4478.8 | -0.0383 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3651.0000000000005 | 3636.9 | -0.235 | 7 | 1 | 6 | 0.125 |
| `squadPerformance.meanMovement` | 5981.100000000001 | 5982.500000000002 | 0.0233 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.meanControl` | 5577.899999999999 | 5587.999999999999 | 0.1683 | 7 | 6 | 1 | 0.125 |
| `squadPerformance.meanCohesion` | 5543.500000000002 | 5549.500000000001 | 0.1 | 7 | 6 | 1 | 0.125 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ncs-c-0060 136.05 s (timeline) · ncs-c-0037 208.05 s (timeline) · ncs-c-0012 267 s (timeline) · ncs-c-0032 296.1 s (timeline) · ncs-c-0040 296.1 s (timeline) · ncs-c-0035 346.05 s (stress) · ncs-c-0043 346.05 s (timeline) · ncs-c-0011 405 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1502&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-ncs-7e1ed1e1/ai_flow_live.html?bench=1502&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1502`); it opens the seed that parts earliest, and the dropdowns choose another.

