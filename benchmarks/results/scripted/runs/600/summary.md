# Benchmark run #600 · 6 seeds from `c-structure-security-517` (ge-defend), windows `0+180`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1`
- work/benchmark-source/299-c-ambush-e34abf24 @ e34abf2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38194735396) · build v29-dev

## Verdict

**QUIET: 6 of 6 pairs changed (median first part 155.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +20.8% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.045 (gate 1.25)
- the 3 changed records first part at simulated second: min 146.1, p10 146.1, median 155.1, p90 160.05, max 160.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 24 | 29 | 0.8333 | 3 | 2 | 1 | 1 |
| `usKills` | 17 | 21 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `geKills` | 7 | 8 | 0.1667 | 2 | 1 | 1 | 1 |
| `fire.total` | 108 | 114 | 1 | 3 | 2 | 1 | 1 |
| `fire.hits` | 37 | 45 | 1.3333 | 3 | 2 | 1 | 1 |
| `retreatSamples` | 41 | 36 | -0.8333 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 4315 | 4338 | 3.8333 | 3 | 2 | 1 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 1 | 0 | -0.1667 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 69 | 62 | -1.1667 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 3 | 4 | 0.1667 | 1 | 1 | 0 | 1 |
| `recon.noContact` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 8 | 3 | -0.8333 | 3 | 0 | 3 | 0.25 |
| `recon.reportsDelivered` | 12 | 20 | 1.3333 | 1 | 1 | 0 | 1 |
| `recon.retriggerBlocked` | 44 | 43 | -0.1667 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 560.6999999999999 | 562.9 | 0.3667 | 3 | 2 | 1 | 1 |
| `squadPerformance.p10Overall` | 523.4000000000001 | 530 | 1.1 | 3 | 2 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 538 | 546.6 | 1.4333 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMovement` | 600 | 600 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 597.7 | 598.6 | 0.15 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 537.1 | 535.6 | -0.25 | 2 | 0 | 2 | 0.5 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

c-structure-security-517-0004 146.1 s (timeline) · c-structure-security-517-0005 155.1 s (timeline) · c-structure-security-517-0006 160.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=600&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-source-299-c-ambush-e34abf24/ai_flow_live.html?bench=600&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=600`); it opens the seed that parts earliest, and the dropdowns choose another.

