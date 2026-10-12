# Benchmark run #651 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ f7abcb1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38264813744) · build v29-dev

## Verdict

**MOVED: 19 of 19 pairs changed (median first part 209.1 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -4.6% (p 0.3438)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 47044 to 48857 (+3.9%, p 0.0005).
- Under 0.05 only: regroups.entries 22 to 40 (+81.8%, p 0.0039); usKills 309 to 241 (-22.0%, p 0.0129); geKills 360 to 397 (+10.3%, p 0.0225).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **19** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.193 (gate 1.25)
- the 16 changed records first part at simulated second: min 185.1, p10 185.1, median 209.1, p90 319.05, max 319.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 669 | 638 | -1.6316 | 10 | 3 | 7 | 0.3438 |
| `usKills` | 309 | 241 | -3.5789 | 14 | 2 | 12 | 0.0129 |
| `geKills` | 360 | 397 | 1.9474 | 13 | 11 | 2 | 0.0225 |
| `fire.total` | 653 | 726 | 3.8421 | 13 | 8 | 5 | 0.5811 |
| `fire.hits` | 249 | 267 | 0.9474 | 12 | 7 | 5 | 0.7744 |
| `retreatSamples` | 3602 | 3870 | 14.1053 | 15 | 7 | 8 | 1 |
| `movementResolver.changes` | 47044 | 48857 | 95.4211 | 16 | 15 | 1 | 0.0005 |
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
| `vacantObjectiveStalls.length` | 12 | 6 | -0.3158 | 7 | 2 | 5 | 0.4531 |
| `loopAlerts.length` | 12 | 14 | 0.1053 | 9 | 5 | 4 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 22 | 40 | 0.9474 | 9 | 9 | 0 | 0.0039 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 423 | 383 | -2.1053 | 14 | 3 | 11 | 0.0574 |
| `recon.contacts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 284 | 274 | -0.5263 | 5 | 0 | 5 | 0.0625 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 113 | 90 | -1.2105 | 12 | 3 | 9 | 0.146 |
| `recon.reportsDelivered` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 329 | 310 | -1 | 10 | 3 | 7 | 0.3438 |
| `squadPerformance.meanOverall` | 1661.3 | 1648.5 | -0.6737 | 15 | 6 | 9 | 0.6072 |
| `squadPerformance.p10Overall` | 1548.4999999999995 | 1539.2999999999995 | -0.4842 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1369.7 | 1330.9000000000003 | -2.0421 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.meanMovement` | 1881.3999999999999 | 1871.8000000000002 | -0.5053 | 15 | 7 | 8 | 1 |
| `squadPerformance.meanControl` | 1886.4 | 1884.7 | -0.0895 | 13 | 7 | 6 | 1 |
| `squadPerformance.meanCohesion` | 1717.6000000000001 | 1729.4 | 0.6211 | 14 | 9 | 5 | 0.424 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 185.1 s (timeline) · phase-c-natural-20261012-0003 209.1 s (timeline) · phase-c-natural-20261012-0002 319.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=651&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=651&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=651`); it opens the seed that parts earliest, and the dropdowns choose another.

