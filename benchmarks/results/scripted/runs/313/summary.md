# Benchmark run #313 · 100 seeds from `phase-0e-final100` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0&scoutsForward=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0&scoutsForward=0`
- work/phase-0e-regroup-adoption-grace @ 6c62eeb · [run](https://github.com/APPARANYX/grasstex/actions/runs/37246829440) · build v29-dev

## Verdict

**QUIET: 100 of 100 pairs changed (median first part 0.15 s); 0 of 32 counters under p 0.05 (about 1.6 by chance); casualties +8.4% (p 0.4557)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.115 (gate 1.25)
- the 100 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 706 | 765 | 0.59 | 88 | 48 | 40 | 0.4557 |
| `usKills` | 294 | 336 | 0.42 | 74 | 40 | 34 | 0.5614 |
| `geKills` | 412 | 429 | 0.17 | 88 | 42 | 46 | 0.7493 |
| `fire.total` | 7109 | 7767 | 6.58 | 98 | 53 | 45 | 0.4797 |
| `fire.hits` | 1345 | 1487 | 1.42 | 92 | 50 | 42 | 0.4657 |
| `retreatSamples` | 1380 | 1620 | 2.4 | 66 | 33 | 33 | 1 |
| `movementResolver.changes` | 144556 | 144749 | 1.93 | 99 | 43 | 56 | 0.2276 |
| `movementStalls.length` | 4 | 9 | 0.05 | 4 | 3 | 1 | 0.625 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 60 | 66 | 0.06 | 57 | 32 | 25 | 0.427 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 20 | -0.03 | 20 | 9 | 11 | 0.8238 |
| `stallOutcomes.wakes` | 9 | 6 | -0.03 | 6 | 2 | 4 | 0.6875 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 5 | 14 | 0.09 | 6 | 5 | 1 | 0.2188 |
| `timeline.stalledSamples` | 136 | 180 | 0.44 | 7 | 4 | 3 | 1 |
| `recon.orders` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8977.7 | 8973.699999999999 | -0.04 | 97 | 49 | 48 | 1 |
| `squadPerformance.p10Overall` | 8557.500000000002 | 8532.699999999999 | -0.248 | 95 | 44 | 51 | 0.5384 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8301.799999999997 | 8244.3 | -0.575 | 96 | 38 | 58 | 0.0519 |
| `squadPerformance.meanMovement` | 9926.399999999996 | 9929.899999999994 | 0.035 | 75 | 38 | 37 | 1 |
| `squadPerformance.meanControl` | 9814.800000000005 | 9816.000000000002 | 0.012 | 87 | 43 | 44 | 1 |
| `squadPerformance.meanCohesion` | 9487.300000000003 | 9479.599999999995 | -0.077 | 98 | 47 | 51 | 0.762 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-final100-0001 0.15 s (timeline) · phase-0e-final100-0002 0.15 s (timeline) · phase-0e-final100-0003 0.15 s (timeline) · phase-0e-final100-0004 0.15 s (timeline) · phase-0e-final100-0005 0.15 s (timeline) · phase-0e-final100-0006 0.15 s (timeline) · phase-0e-final100-0007 0.15 s (timeline) · phase-0e-final100-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=313&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=313&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=313`); it opens the seed that parts earliest, and the dropdowns choose another.

