# Benchmark run #1511 · 60 seeds from `c699b` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699b-a69e4a40 @ a69e4a4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41242483059) · build v29-dev

## Verdict

**MOVED: 60 of 60 pairs changed (median first part 205.05 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties +8.4% (p 0.148)**

- Clears the Bonferroni line (p < 0.0012): geKills 526 to 621 (+18.1%, p 0.0008).
- Under 0.05 only: movementResolver.changes 203453 to 205988 (+1.2%, p 0.0062); grenades.aborted 1 to 9 (+800.0%, p 0.0313).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.988 (gate 1.25)
- the 60 changed records first part at simulated second: min 167.1, p10 173.1, median 205.05, p90 249, max 259.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 977 | 1059 | 1.3667 | 58 | 35 | 23 | 0.148 |
| `usKills` | 451 | 438 | -0.2167 | 54 | 23 | 31 | 0.3409 |
| `geKills` | 526 | 621 | 1.5833 | 53 | 39 | 14 | 0.0008 |
| `fire.total` | 24735 | 26733 | 33.3 | 60 | 37 | 23 | 0.0925 |
| `fire.hits` | 2175 | 2426 | 4.1833 | 56 | 32 | 24 | 0.3497 |
| `retreatSamples` | 5704 | 5848 | 2.4 | 57 | 30 | 27 | 0.7914 |
| `movementResolver.changes` | 203453 | 205988 | 42.25 | 60 | 41 | 19 | 0.0062 |
| `grenades.throws` | 10 | 8 | -0.0333 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 9 | 8 | -0.0167 | 9 | 5 | 4 | 1 |
| `grenades.wounded` | 5 | 5 | 0 | 7 | 5 | 2 | 0.4531 |
| `grenades.casualties` | 1 | 2 | 0.0167 | 3 | 2 | 1 | 1 |
| `grenades.suppressed` | 15 | 11 | -0.0667 | 8 | 4 | 4 | 1 |
| `grenades.friendlyWounded` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 9 | 0.1333 | 6 | 6 | 0 | 0.0313 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 6 | 0.05 | 6 | 4 | 2 | 0.6875 |
| `loopAlerts.length` | 766 | 801 | 0.5833 | 41 | 24 | 17 | 0.3489 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 28 | 36 | 0.1333 | 21 | 12 | 9 | 0.6636 |
| `stallOutcomes.wakes` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 47 | 47 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 47 | 47 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1252 | 1244 | -0.1333 | 28 | 11 | 17 | 0.3449 |
| `recon.contacts` | 61 | 63 | 0.0333 | 22 | 11 | 11 | 1 |
| `recon.noContact` | 711 | 714 | 0.05 | 17 | 10 | 7 | 0.6291 |
| `recon.timeouts` | 5 | 4 | -0.0167 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 465 | 456 | -0.15 | 32 | 14 | 18 | 0.5966 |
| `recon.reportsDelivered` | 336 | 334 | -0.0333 | 23 | 11 | 12 | 1 |
| `recon.retriggerBlocked` | 1067 | 1053 | -0.2333 | 26 | 8 | 18 | 0.0755 |
| `squadPerformance.meanOverall` | 5075.5 | 5067.599999999999 | -0.1317 | 60 | 32 | 28 | 0.6989 |
| `squadPerformance.p10Overall` | 4642.300000000001 | 4645.1 | 0.0467 | 50 | 29 | 21 | 0.3222 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4363.700000000001 | 4348.299999999999 | -0.2567 | 58 | 26 | 32 | 0.5118 |
| `squadPerformance.meanMovement` | 5919.3 | 5919.300000000002 | 0 | 55 | 30 | 25 | 0.5901 |
| `squadPerformance.meanControl` | 5517.3 | 5505 | -0.205 | 58 | 31 | 27 | 0.694 |
| `squadPerformance.meanCohesion` | 5406.7 | 5393.3 | -0.2233 | 58 | 27 | 31 | 0.694 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699b-0045 167.1 s (timeline) · c699b-0050 169.05 s (timeline) · c699b-0017 170.1 s (timeline) · c699b-0022 172.05 s (timeline) · c699b-0042 172.05 s (timeline) · c699b-0046 173.1 s (timeline) · c699b-0003 174 s (timeline) · c699b-0011 175.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1511&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699b-a69e4a40/ai_flow_live.html?bench=1511&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1511`); it opens the seed that parts earliest, and the dropdowns choose another.

