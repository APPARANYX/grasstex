# Benchmark run #1182 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- experiment/ai-skills-compact-factorial-20261021 @ 51ca857 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39639989436) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 175.05 s); 8 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties +12.7% (p 0.0225)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 12270 to 14042 (+14.4%, p 0.0001); recon.contacts 50 to 22 (-56.0%, p 0.0002); recon.reportsDelivered 309 to 106 (-65.7%, p 0.0002).
- Under 0.05 only: recon.cancelled 41 to 58 (+41.5%, p 0.0039); retreatSamples 1485 to 1758 (+18.4%, p 0.0215); casualties 354 to 399 (+12.7%, p 0.0225); geKills 242 to 285 (+17.8%, p 0.0225); squadPerformance.meanMission 1888.8000000000002 to 1856.1999999999998 (-1.7%, p 0.0386).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.039 (gate 1.25)
- the 14 changed records first part at simulated second: min 175.05, p10 175.05, median 175.05, p90 289.05, max 289.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 354 | 399 | 2.0455 | 13 | 11 | 2 | 0.0225 |
| `usKills` | 112 | 114 | 0.0909 | 4 | 3 | 1 | 0.625 |
| `geKills` | 242 | 285 | 1.9545 | 13 | 11 | 2 | 0.0225 |
| `fire.total` | 296 | 348 | 2.3636 | 10 | 6 | 4 | 0.7539 |
| `fire.hits` | 129 | 149 | 0.9091 | 10 | 6 | 4 | 0.7539 |
| `retreatSamples` | 1485 | 1758 | 12.4091 | 10 | 9 | 1 | 0.0215 |
| `movementResolver.changes` | 12270 | 14042 | 80.5455 | 14 | 14 | 0 | 0.0001 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 10 | 13 | 0.1364 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 2 | -0.1364 | 3 | 0 | 3 | 0.25 |
| `loopAlerts.length` | 17 | 25 | 0.3636 | 7 | 5 | 2 | 0.4531 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 160 | 119 | -1.8636 | 10 | 4 | 6 | 0.7539 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 12 | 13 | 0.0455 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 71 | 82 | 0.5 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 42 | 47 | 0.2273 | 4 | 4 | 0 | 0.125 |
| `timeline.stalledSamplesRepeated` | 231 | 294 | 2.8636 | 4 | 4 | 0 | 0.125 |
| `recon.orders` | 300 | 290 | -0.4545 | 11 | 2 | 9 | 0.0654 |
| `recon.contacts` | 50 | 22 | -1.2727 | 13 | 0 | 13 | 0.0002 |
| `recon.noContact` | 93 | 97 | 0.1818 | 6 | 5 | 1 | 0.2188 |
| `recon.timeouts` | 58 | 64 | 0.2727 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 41 | 58 | 0.7727 | 9 | 9 | 0 | 0.0039 |
| `recon.reportsDelivered` | 309 | 106 | -9.2273 | 13 | 0 | 13 | 0.0002 |
| `recon.retriggerBlocked` | 151 | 143 | -0.3636 | 11 | 3 | 8 | 0.2266 |
| `squadPerformance.meanOverall` | 2024 | 2019.5 | -0.2045 | 13 | 7 | 6 | 1 |
| `squadPerformance.p10Overall` | 1856.5 | 1834.9000000000003 | -0.9818 | 13 | 4 | 9 | 0.2668 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1888.8000000000002 | 1856.1999999999998 | -1.4818 | 12 | 2 | 10 | 0.0386 |
| `squadPerformance.meanMovement` | 2148.7000000000003 | 2138.7000000000003 | -0.4545 | 11 | 4 | 7 | 0.5488 |
| `squadPerformance.meanControl` | 2184.1 | 2179.7999999999993 | -0.1955 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.meanCohesion` | 1947.5999999999997 | 2005.5 | 2.6318 | 13 | 10 | 3 | 0.0923 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 175.05 s (timeline) · phase-c-natural-20261012-0002 289.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1182&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1182`); it opens the seed that parts earliest, and the dropdowns choose another.

