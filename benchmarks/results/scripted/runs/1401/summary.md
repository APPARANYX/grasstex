# Benchmark run #1401 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/tactical-contact-route-graph-20261026 @ 3193dec · [run](https://github.com/APPARANYX/grasstex/actions/runs/40338981309) · build v29-dev

## Verdict

**QUIET: 14 of 14 pairs changed (median first part 278.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.8% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **14** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.018 (gate 1.25)
- the 11 changed records first part at simulated second: min 278.1, p10 278.1, median 278.1, p90 324, max 324

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 258 | 256 | -0.1429 | 7 | 4 | 3 | 1 |
| `usKills` | 202 | 213 | 0.7857 | 8 | 7 | 1 | 0.0703 |
| `geKills` | 56 | 43 | -0.9286 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 270 | 241 | -2.0714 | 7 | 4 | 3 | 1 |
| `fire.hits` | 126 | 111 | -1.0714 | 6 | 3 | 3 | 1 |
| `retreatSamples` | 2276 | 2199 | -5.5 | 9 | 3 | 6 | 0.5078 |
| `movementResolver.changes` | 10983 | 10008 | -69.6429 | 11 | 3 | 8 | 0.2266 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 9 | -0.1429 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 21 | 23 | 0.1429 | 6 | 4 | 2 | 0.6875 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 178 | 173 | -0.3571 | 4 | 0 | 4 | 0.125 |
| `recon.contacts` | 13 | 12 | -0.0714 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 31 | 27 | -0.2857 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 67 | 66 | -0.0714 | 5 | 2 | 3 | 1 |
| `recon.reportsDelivered` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 56 | 55 | -0.0714 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 1115.8000000000002 | 1120.4 | 0.3286 | 9 | 5 | 4 | 1 |
| `squadPerformance.p10Overall` | 1010.4 | 1017.2000000000002 | 0.4857 | 7 | 6 | 1 | 0.125 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.0714 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 892.2999999999998 | 899.6000000000001 | 0.5214 | 10 | 6 | 4 | 0.7539 |
| `squadPerformance.meanMovement` | 1249.3 | 1251.3 | 0.1429 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 1284.3999999999999 | 1283.3000000000002 | -0.0786 | 9 | 4 | 5 | 1 |
| `squadPerformance.meanCohesion` | 1190.2 | 1195.3000000000002 | 0.3643 | 9 | 7 | 2 | 0.1797 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 278.1 s (timeline) · phase-c-natural-20261012-0003 324 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1401&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactical-contact-route-graph-20261026/ai_flow_live.html?bench=1401&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1401`); it opens the seed that parts earliest, and the dropdowns choose another.

