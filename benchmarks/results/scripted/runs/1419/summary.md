# Benchmark run #1419 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/audio-history-lab-20261027 @ 19988fa · [run](https://github.com/APPARANYX/grasstex/actions/runs/40975803954) · build v29-dev

## Verdict

**QUIET: 20 of 20 pairs changed (median first part 320.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +2.2% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.052 (gate 1.25)
- the 5 changed records first part at simulated second: min 320.1, p10 320.1, median 320.1, p90 320.1, max 320.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 325 | 332 | 0.35 | 3 | 3 | 0 | 0.25 |
| `usKills` | 181 | 205 | 1.2 | 3 | 3 | 0 | 0.25 |
| `geKills` | 144 | 127 | -0.85 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 551 | 535 | -0.8 | 1 | 0 | 1 | 1 |
| `fire.hits` | 236 | 242 | 0.3 | 1 | 1 | 0 | 1 |
| `retreatSamples` | 2484 | 2475 | -0.45 | 2 | 0 | 2 | 0.5 |
| `movementResolver.changes` | 12723 | 13273 | 27.5 | 5 | 4 | 1 | 0.375 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 1 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 24 | 23 | -0.05 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 282 | 278 | -0.2 | 4 | 0 | 4 | 0.125 |
| `recon.contacts` | 9 | 12 | 0.15 | 3 | 3 | 0 | 0.25 |
| `recon.noContact` | 79 | 79 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 79 | 74 | -0.25 | 5 | 0 | 5 | 0.0625 |
| `recon.reportsDelivered` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 158 | 153 | -0.25 | 5 | 0 | 5 | 0.0625 |
| `squadPerformance.meanOverall` | 1804.5000000000002 | 1807.6 | 0.155 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.p10Overall` | 1628.4999999999998 | 1637.6999999999998 | 0.46 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1605.6000000000004 | 1610.7000000000003 | 0.255 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanMovement` | 1958.1000000000001 | 1954.7 | -0.17 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 1983.4999999999998 | 1984.1000000000001 | 0.03 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 1804.9 | 1814.0999999999997 | 0.46 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-c-natural-20261012-0002 320.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1419&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/audio-history-lab-20261027/ai_flow_live.html?bench=1419&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1419`); it opens the seed that parts earliest, and the dropdowns choose another.

