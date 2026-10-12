# Benchmark run #599 · 6 seeds from `c-structure-security-517` (us-defend), windows `0+180`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1`
- work/benchmark-source/299-c-ambush-e34abf24 @ e34abf2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38194733967) · build v29-dev

## Verdict

**QUIET: 6 of 6 pairs changed (median first part 113.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +3.3% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.081 (gate 1.25)
- the 5 changed records first part at simulated second: min 110.1, p10 110.1, median 113.1, p90 150, max 150

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 61 | 63 | 0.3333 | 3 | 1 | 2 | 1 |
| `usKills` | 36 | 33 | -0.5 | 3 | 1 | 2 | 1 |
| `geKills` | 25 | 30 | 0.8333 | 3 | 2 | 1 | 1 |
| `fire.total` | 330 | 347 | 2.8333 | 5 | 3 | 2 | 1 |
| `fire.hits` | 115 | 125 | 1.6667 | 5 | 4 | 1 | 0.375 |
| `retreatSamples` | 143 | 173 | 5 | 4 | 4 | 0 | 0.125 |
| `movementResolver.changes` | 5338 | 5334 | -0.6667 | 5 | 2 | 3 | 1 |
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
| `loopAlerts.length` | 4 | 2 | -0.3333 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 66 | 60 | -1 | 5 | 1 | 4 | 0.375 |
| `recon.contacts` | 4 | 3 | -0.1667 | 3 | 1 | 2 | 1 |
| `recon.noContact` | 49 | 46 | -0.5 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 0 | 1 | 0.1667 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 10 | 6 | -0.6667 | 3 | 0 | 3 | 0.25 |
| `recon.reportsDelivered` | 16 | 4 | -2 | 3 | 1 | 2 | 1 |
| `recon.retriggerBlocked` | 45 | 45 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 554.9 | 553.5 | -0.2333 | 5 | 3 | 2 | 1 |
| `squadPerformance.p10Overall` | 504.6 | 503.99999999999994 | -0.1 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 527.1 | 522.4 | -0.7833 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanMovement` | 599.8 | 600 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 595.7 | 597.3 | 0.2667 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanCohesion` | 549.2 | 553.9 | 0.7833 | 5 | 4 | 1 | 0.375 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 5 seeds that part earliest (simulated seconds)

c-structure-security-517-0001 110.1 s (timeline) · c-structure-security-517-0003 112.05 s (timeline) · c-structure-security-517-0002 113.1 s (timeline) · c-structure-security-517-0006 138 s (timeline) · c-structure-security-517-0004 150 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=599&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-source-299-c-ambush-e34abf24/ai_flow_live.html?bench=599&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=599`); it opens the seed that parts earliest, and the dropdowns choose another.

