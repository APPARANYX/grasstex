# Benchmark run #293 · 20 seeds from `phase-0e-tactical-radius` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- main @ dab5cb5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37197789194) · build v29-dev

## Verdict

**MOVED: 20 of 20 pairs changed (median first part 0.15 s); 3 of 32 counters under p 0.05 (about 1.6 by chance), 2 under 0.0016; casualties -26.2% (p 0.6291)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 37051 to 31270 (-15.6%, p 0); regroups.entries 93 to 251 (+169.9%, p 0).
- Under 0.05 only: retreatSamples 267 to 102 (-61.8%, p 0.0386).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.089 (gate 1.25)
- the 20 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 130 | 96 | -1.7 | 17 | 7 | 10 | 0.6291 |
| `usKills` | 62 | 41 | -1.05 | 16 | 6 | 10 | 0.4545 |
| `geKills` | 68 | 55 | -0.65 | 16 | 8 | 8 | 1 |
| `fire.total` | 1514 | 1464 | -2.5 | 19 | 9 | 10 | 1 |
| `fire.hits` | 245 | 182 | -3.15 | 19 | 6 | 13 | 0.1671 |
| `retreatSamples` | 267 | 102 | -8.25 | 12 | 2 | 10 | 0.0386 |
| `movementResolver.changes` | 37051 | 31270 | -289.05 | 20 | 1 | 19 | 0 |
| `movementStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 2 | 0.1 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 11 | 23 | 0.6 | 9 | 5 | 4 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 93 | 251 | 7.9 | 20 | 20 | 0 | 0 |
| `stallOutcomes.wakes` | 124 | 124 | 0 | 6 | 3 | 3 | 1 |
| `stallOutcomes.repeats` | 28 | 28 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 3 | 5 | 0.1 | 4 | 3 | 1 | 0.625 |
| `timeline.stalledSamples` | 46 | 58 | 0.6 | 4 | 3 | 1 | 0.625 |
| `recon.orders` | 282 | 279 | -0.15 | 14 | 6 | 8 | 0.7905 |
| `recon.contacts` | 7 | 1 | -0.3 | 8 | 1 | 7 | 0.0703 |
| `recon.noContact` | 263 | 264 | 0.05 | 17 | 8 | 9 | 1 |
| `recon.timeouts` | 3 | 3 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 6 | 10 | 0.2 | 11 | 7 | 4 | 0.5488 |
| `recon.reportsDelivered` | 55 | 8 | -2.35 | 8 | 1 | 7 | 0.0703 |
| `recon.retriggerBlocked` | 263 | 264 | 0.05 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanOverall` | 1789.4 | 1783.1000000000004 | -0.315 | 20 | 8 | 12 | 0.5034 |
| `squadPerformance.p10Overall` | 1709.3000000000002 | 1720.0000000000002 | 0.535 | 20 | 8 | 12 | 0.5034 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1630.1 | 1659.8 | 1.485 | 20 | 12 | 8 | 0.5034 |
| `squadPerformance.meanMovement` | 1988.3000000000002 | 1986.6000000000001 | -0.085 | 17 | 5 | 12 | 0.1435 |
| `squadPerformance.meanControl` | 1951.9 | 1940.4 | -0.575 | 18 | 10 | 8 | 0.8145 |
| `squadPerformance.meanCohesion` | 1909.1000000000001 | 1834.3999999999999 | -3.735 | 20 | 6 | 14 | 0.1153 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-tactical-radius-0001 0.15 s (timeline) · phase-0e-tactical-radius-0002 0.15 s (timeline) · phase-0e-tactical-radius-0003 0.15 s (timeline) · phase-0e-tactical-radius-0004 0.15 s (timeline) · phase-0e-tactical-radius-0005 0.15 s (timeline) · phase-0e-tactical-radius-0006 0.15 s (timeline) · phase-0e-tactical-radius-0007 0.15 s (timeline) · phase-0e-tactical-radius-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=293&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=293`); it opens the seed that parts earliest, and the dropdowns choose another.

