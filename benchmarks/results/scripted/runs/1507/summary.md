# Benchmark run #1507 · 60 seeds from `ncs-l` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&navCornerStand=0` · **ON** flags: `strategicInterception=0`
- work/pin/ncs-7e1ed1e1 @ 7e1ed1e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41234136570) · build v29-dev

## Verdict

**QUIET: 9 of 60 pairs changed (median first part 365.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.0% (p 0.125)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **51** · runtime errors off 0 / on 0 · wall time on/off x1.003 (gate 1.25)
- the 5 changed records first part at simulated second: min 60, p10 60, median 365.1, p90 560.1, max 560.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2331 | 2308 | -0.3833 | 4 | 0 | 4 | 0.125 |
| `usKills` | 1071 | 1047 | -0.4 | 4 | 1 | 3 | 0.625 |
| `geKills` | 1260 | 1261 | 0.0167 | 3 | 2 | 1 | 1 |
| `fire.total` | 37187 | 37257 | 1.1667 | 4 | 2 | 2 | 1 |
| `fire.hits` | 5212 | 5201 | -0.1833 | 4 | 1 | 3 | 0.625 |
| `retreatSamples` | 105566 | 106407 | 14.0167 | 5 | 4 | 1 | 0.375 |
| `movementResolver.changes` | 155334 | 155732 | 6.6333 | 5 | 2 | 3 | 1 |
| `grenades.throws` | 51 | 48 | -0.05 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 51 | 48 | -0.05 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 71 | 71 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 87 | 89 | 0.0333 | 4 | 2 | 2 | 1 |
| `loopAlerts.length` | 701 | 691 | -0.1667 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 261 | 260 | -0.0167 | 4 | 1 | 3 | 0.625 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1599 | 1593 | -0.1 | 3 | 2 | 1 | 1 |
| `recon.contacts` | 231 | 236 | 0.0833 | 3 | 3 | 0 | 0.25 |
| `recon.noContact` | 713 | 707 | -0.1 | 3 | 1 | 2 | 1 |
| `recon.timeouts` | 72 | 74 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 500 | 497 | -0.05 | 4 | 1 | 3 | 0.625 |
| `recon.reportsDelivered` | 945 | 958 | 0.2167 | 1 | 1 | 0 | 1 |
| `recon.retriggerBlocked` | 692 | 689 | -0.05 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanOverall` | 4965.199999999999 | 4962.799999999999 | -0.04 | 5 | 2 | 3 | 1 |
| `squadPerformance.p10Overall` | 4586.1 | 4586.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4099.699999999999 | 4088.4999999999995 | -0.1867 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.meanMovement` | 5991.5 | 5991.699999999999 | 0.0033 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 5733.200000000002 | 5734.800000000001 | 0.0267 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.meanCohesion` | 5409.400000000001 | 5412.800000000001 | 0.0567 | 4 | 3 | 1 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 5 seeds that part earliest (simulated seconds)

ncs-l-0017 60 s (timeline) · ncs-l-0018 217.05 s (stress) · ncs-l-0002 365.1 s (stress) · ncs-l-0004 469.05 s (stress) · ncs-l-0035 560.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1507&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-ncs-7e1ed1e1/ai_flow_live.html?bench=1507&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1507`); it opens the seed that parts earliest, and the dropdowns choose another.

