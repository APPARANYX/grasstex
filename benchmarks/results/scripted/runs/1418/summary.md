# Benchmark run #1418 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/audio-history-lab-20261027 @ 19988fa · [run](https://github.com/APPARANYX/grasstex/actions/runs/40975803404) · build v29-dev

## Verdict

**MOVED: 23 of 23 pairs changed (median first part 356.1 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties +1.1% (p 0.7266)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 319 to 284 (-11.0%, p 0); recon.cancelled 85 to 54 (-36.5%, p 0); movementResolver.changes 15285 to 16146 (+5.6%, p 0.001).
- Under 0.05 only: recon.retriggerBlocked 130 to 122 (-6.2%, p 0.0313).

## Paired comparison (off against on)

- **23** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.133 (gate 1.25)
- the 11 changed records first part at simulated second: min 340.05, p10 340.05, median 356.1, p90 356.1, max 599.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 356 | 360 | 0.1739 | 8 | 5 | 3 | 0.7266 |
| `usKills` | 159 | 168 | 0.3913 | 7 | 6 | 1 | 0.125 |
| `geKills` | 197 | 192 | -0.2174 | 5 | 2 | 3 | 1 |
| `fire.total` | 363 | 380 | 0.7391 | 9 | 6 | 3 | 0.5078 |
| `fire.hits` | 165 | 160 | -0.2174 | 9 | 4 | 5 | 1 |
| `retreatSamples` | 1642 | 1663 | 0.913 | 4 | 3 | 1 | 0.625 |
| `movementResolver.changes` | 15285 | 16146 | 37.4348 | 11 | 11 | 0 | 0.001 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 16 | 10 | -0.2609 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 2 | 0 | -0.087 | 2 | 0 | 2 | 0.5 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 2 | -0.0435 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 26 | 30 | 0.1739 | 8 | 4 | 4 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 12 | 17 | 0.2174 | 5 | 5 | 0 | 0.0625 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 21 | 12 | -0.3913 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 146 | 74 | -3.1304 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 42 | 24 | -0.7826 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamplesRepeated` | 290 | 148 | -6.1739 | 2 | 0 | 2 | 0.5 |
| `recon.orders` | 319 | 284 | -1.5217 | 18 | 0 | 18 | 0 |
| `recon.contacts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 75 | 75 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 89 | 88 | -0.0435 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 85 | 54 | -1.3478 | 18 | 0 | 18 | 0 |
| `recon.reportsDelivered` | 153 | 153 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 130 | 122 | -0.3478 | 6 | 0 | 6 | 0.0313 |
| `squadPerformance.meanOverall` | 2099.2999999999997 | 2101.8 | 0.1087 | 10 | 5 | 5 | 1 |
| `squadPerformance.p10Overall` | 1900.9999999999998 | 1895.6999999999994 | -0.2304 | 9 | 4 | 5 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1927.2 | 1937.9000000000003 | 0.4652 | 9 | 6 | 3 | 0.5078 |
| `squadPerformance.meanMovement` | 2220.0000000000005 | 2226.5 | 0.2826 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanControl` | 2278.7000000000003 | 2277 | -0.0739 | 8 | 4 | 4 | 1 |
| `squadPerformance.meanCohesion` | 2086.4 | 2072.5000000000005 | -0.6043 | 8 | 4 | 4 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 340.05 s (timeline) · phase-c-natural-20261012-0003 356.1 s (timeline) · phase-c-natural-20261012-0001 599.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1418&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/audio-history-lab-20261027/ai_flow_live.html?bench=1418&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1418`); it opens the seed that parts earliest, and the dropdowns choose another.

