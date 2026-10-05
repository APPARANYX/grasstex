# Benchmark run #325 · 100 seeds from `phase-0g-secondary` (meeting), windows `contact+120`

- **OFF** flags: `secondaryThreat=0` · **ON** flags: `secondaryThreat=1`
- main @ 91d007f · [run](https://github.com/APPARANYX/grasstex/actions/runs/37265139951) · build v29-dev

## Verdict

**WEAK: 75 of 100 pairs changed (median first part 184.05 s); 4 of 32 counters under p 0.05 (about 1.6 by chance); casualties +6.1% (p 0.1214)**

- Under 0.05 only: squadPerformance.meanMission 8297.9 to 8257.5 (-0.5%, p 0.0146); squadPerformance.meanControl 9834.699999999997 to 9843.499999999998 (+0.1%, p 0.0227); fire.hits 1193 to 1263 (+5.9%, p 0.0237); squadPerformance.p10Overall 8584.8 to 8539.900000000001 (-0.5%, p 0.0294).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **25** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 45 changed records first part at simulated second: min 121.05, p10 157.05, median 184.05, p90 204, max 233.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 638 | 677 | 0.39 | 34 | 22 | 12 | 0.1214 |
| `usKills` | 267 | 294 | 0.27 | 24 | 13 | 11 | 0.8388 |
| `geKills` | 371 | 383 | 0.12 | 29 | 15 | 14 | 1 |
| `fire.total` | 6438 | 6223 | -2.15 | 43 | 16 | 27 | 0.1263 |
| `fire.hits` | 1193 | 1263 | 0.7 | 39 | 27 | 12 | 0.0237 |
| `retreatSamples` | 1138 | 1221 | 0.83 | 26 | 16 | 10 | 0.3269 |
| `movementResolver.changes` | 170368 | 170934 | 5.66 | 43 | 27 | 16 | 0.1263 |
| `movementStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 60 | 48 | -0.12 | 15 | 5 | 10 | 0.3018 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 21 | 22 | 0.01 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 4 | -0.01 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 498 | 498 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1319 | 1316 | -0.03 | 8 | 3 | 5 | 0.7266 |
| `recon.contacts` | 22 | 22 | 0 | 4 | 2 | 2 | 1 |
| `recon.noContact` | 1261 | 1257 | -0.04 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 7 | 6 | -0.01 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 18 | 19 | 0.01 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 138 | 146 | 0.08 | 4 | 2 | 2 | 1 |
| `recon.retriggerBlocked` | 1257 | 1252 | -0.05 | 4 | 0 | 4 | 0.125 |
| `squadPerformance.meanOverall` | 8985.5 | 8965.999999999998 | -0.195 | 40 | 14 | 26 | 0.0807 |
| `squadPerformance.p10Overall` | 8584.8 | 8539.900000000001 | -0.449 | 31 | 9 | 22 | 0.0294 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8297.9 | 8257.5 | -0.404 | 25 | 6 | 19 | 0.0146 |
| `squadPerformance.meanMovement` | 9919.599999999995 | 9917.499999999996 | -0.021 | 26 | 11 | 15 | 0.5572 |
| `squadPerformance.meanControl` | 9834.699999999997 | 9843.499999999998 | 0.088 | 24 | 18 | 6 | 0.0227 |
| `squadPerformance.meanCohesion` | 9435.099999999995 | 9429.099999999997 | -0.06 | 34 | 18 | 16 | 0.8642 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0g-secondary-0052 121.05 s (timeline) · phase-0g-secondary-0088 147 s (timeline) · phase-0g-secondary-0051 148.05 s (timeline) · phase-0g-secondary-0019 153 s (timeline) · phase-0g-secondary-0096 157.05 s (timeline) · phase-0g-secondary-0068 158.1 s (timeline) · phase-0g-secondary-0071 161.1 s (timeline) · phase-0g-secondary-0075 163.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=325&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=325`); it opens the seed that parts earliest, and the dropdowns choose another.

