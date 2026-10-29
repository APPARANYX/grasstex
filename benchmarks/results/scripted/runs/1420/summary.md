# Benchmark run #1420 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/audio-history-lab-20261027 @ 19988fa · [run](https://github.com/APPARANYX/grasstex/actions/runs/40975804781) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 324 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 0.5078)**

- Under 0.05 only: squadPerformance.meanCohesion 1766.1999999999998 to 1781.6000000000001 (+0.9%, p 0.0386).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.072 (gate 1.25)
- the 15 changed records first part at simulated second: min 305.1, p10 305.1, median 324, p90 356.1, max 356.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 363 | 363 | 0 | 9 | 6 | 3 | 0.5078 |
| `usKills` | 237 | 244 | 0.35 | 9 | 6 | 3 | 0.5078 |
| `geKills` | 126 | 119 | -0.35 | 3 | 1 | 2 | 1 |
| `fire.total` | 460 | 464 | 0.2 | 10 | 5 | 5 | 1 |
| `fire.hits` | 167 | 172 | 0.25 | 8 | 5 | 3 | 0.7266 |
| `retreatSamples` | 3384 | 3278 | -5.3 | 13 | 4 | 9 | 0.2668 |
| `movementResolver.changes` | 14485 | 14362 | -6.15 | 13 | 8 | 5 | 0.5811 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `vacantObjectiveStalls.length` | 6 | 4 | -0.1 | 2 | 0 | 2 | 0.5 |
| `loopAlerts.length` | 38 | 29 | -0.45 | 6 | 2 | 4 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 3 | 0.15 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 268 | 258 | -0.5 | 11 | 3 | 8 | 0.2266 |
| `recon.contacts` | 27 | 23 | -0.2 | 4 | 0 | 4 | 0.125 |
| `recon.noContact` | 25 | 31 | 0.3 | 7 | 6 | 1 | 0.125 |
| `recon.timeouts` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 100 | 91 | -0.45 | 8 | 1 | 7 | 0.0703 |
| `recon.reportsDelivered` | 107 | 88 | -0.95 | 5 | 2 | 3 | 1 |
| `recon.retriggerBlocked` | 82 | 80 | -0.1 | 5 | 2 | 3 | 1 |
| `squadPerformance.meanOverall` | 1640.8000000000002 | 1648.3999999999999 | 0.38 | 14 | 11 | 3 | 0.0574 |
| `squadPerformance.p10Overall` | 1488.3 | 1490.7 | 0.12 | 9 | 6 | 3 | 0.5078 |
| `squadPerformance.lowScoreSquads` | 0 | 2 | 0.1 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMission` | 1312.1 | 1324.3000000000002 | 0.61 | 13 | 8 | 5 | 0.5811 |
| `squadPerformance.meanMovement` | 1839.6000000000001 | 1840.7000000000003 | 0.055 | 8 | 4 | 4 | 1 |
| `squadPerformance.meanControl` | 1876.7 | 1877.6 | 0.045 | 10 | 5 | 5 | 1 |
| `squadPerformance.meanCohesion` | 1766.1999999999998 | 1781.6000000000001 | 0.77 | 12 | 10 | 2 | 0.0386 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 305.1 s (timeline) · phase-c-natural-20261012-0003 324 s (timeline) · phase-c-natural-20261012-0001 356.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1420&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/audio-history-lab-20261027/ai_flow_live.html?bench=1420&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1420`); it opens the seed that parts earliest, and the dropdowns choose another.

