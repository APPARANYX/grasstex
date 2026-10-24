# Benchmark run #1292 · 100 seeds from `stack-20261024-g` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&squadCleared=1`
- work/squad-cleared-20261024 @ 0b99876 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40058423852) · build v29-dev

## Verdict

**MOVED: 98 of 100 pairs changed (median first part 139.575 s); 6 of 42 counters under p 0.05 (about 2.1 by chance), 4 under 0.0012; casualties -3.3% (p 0.9142)**

- Clears the Bonferroni line (p < 0.0012): fire.total 21719 to 35134 (+61.8%, p 0); squadPerformance.meanMission 7312.599999999999 to 6971.399999999999 (-4.7%, p 0); squadPerformance.meanCohesion 8742.300000000001 to 8906.799999999996 (+1.9%, p 0.0002); retreatSamples 161132 to 199395 (+23.7%, p 0.0011).
- Under 0.05 only: stallOutcomes.wakes 13 to 4 (-69.2%, p 0.0225); squadPerformance.meanOverall 8417.1 to 8345.3 (-0.9%, p 0.0263).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x1.011 (gate 1.25)
- the 92 changed records first part at simulated second: min 88.05, p10 109.05, median 139.575, p90 170.1, max 207

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4706 | 4553 | -1.53 | 86 | 42 | 44 | 0.9142 |
| `usKills` | 2136 | 1918 | -2.18 | 88 | 35 | 53 | 0.0693 |
| `geKills` | 2570 | 2635 | 0.65 | 88 | 49 | 39 | 0.3374 |
| `fire.total` | 21719 | 35134 | 134.15 | 92 | 87 | 5 | 0 |
| `fire.hits` | 8833 | 8459 | -3.74 | 91 | 39 | 52 | 0.2082 |
| `retreatSamples` | 161132 | 199395 | 382.63 | 92 | 62 | 30 | 0.0011 |
| `movementResolver.changes` | 226361 | 227205 | 8.44 | 92 | 44 | 48 | 0.7547 |
| `grenades.throws` | 24 | 13 | -0.11 | 11 | 3 | 8 | 0.2266 |
| `grenades.bursts` | 24 | 13 | -0.11 | 11 | 3 | 8 | 0.2266 |
| `grenades.wounded` | 13 | 1 | -0.12 | 5 | 0 | 5 | 0.0625 |
| `grenades.casualties` | 5 | 1 | -0.04 | 3 | 0 | 3 | 0.25 |
| `grenades.suppressed` | 33 | 9 | -0.24 | 10 | 3 | 7 | 0.3438 |
| `grenades.friendlyWounded` | 4 | 0 | -0.04 | 3 | 0 | 3 | 0.25 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 186 | 189 | 0.03 | 66 | 35 | 31 | 0.7122 |
| `loopAlerts.length` | 539 | 629 | 0.9 | 83 | 47 | 36 | 0.2723 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 450 | 392 | -0.58 | 78 | 36 | 42 | 0.5716 |
| `stallOutcomes.wakes` | 13 | 4 | -0.09 | 13 | 2 | 11 | 0.0225 |
| `stallOutcomes.repeats` | 3 | 0 | -0.03 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2045 | 1990 | -0.55 | 86 | 37 | 49 | 0.2354 |
| `recon.contacts` | 205 | 200 | -0.05 | 70 | 37 | 33 | 0.7202 |
| `recon.noContact` | 1154 | 1165 | 0.11 | 73 | 36 | 37 | 1 |
| `recon.timeouts` | 111 | 114 | 0.03 | 55 | 28 | 27 | 1 |
| `recon.cancelled` | 489 | 434 | -0.55 | 76 | 31 | 45 | 0.1354 |
| `recon.reportsDelivered` | 771 | 771 | 0 | 77 | 44 | 33 | 0.2543 |
| `recon.retriggerBlocked` | 1156 | 1161 | 0.05 | 79 | 40 | 39 | 1 |
| `squadPerformance.meanOverall` | 8417.1 | 8345.3 | -0.718 | 90 | 34 | 56 | 0.0263 |
| `squadPerformance.p10Overall` | 7643.200000000001 | 7633.600000000003 | -0.096 | 60 | 27 | 33 | 0.519 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7312.599999999999 | 6971.399999999999 | -3.412 | 92 | 26 | 66 | 0 |
| `squadPerformance.meanMovement` | 9986.69999999999 | 9987.399999999987 | 0.007 | 48 | 24 | 24 | 1 |
| `squadPerformance.meanControl` | 9670.099999999995 | 9684.499999999998 | 0.144 | 89 | 51 | 38 | 0.2031 |
| `squadPerformance.meanCohesion` | 8742.300000000001 | 8906.799999999996 | 1.645 | 92 | 64 | 28 | 0.0002 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

stack-20261024-g-0014 88.05 s (timeline) · stack-20261024-g-0086 99 s (timeline) · stack-20261024-g-0013 100.05 s (timeline) · stack-20261024-g-0021 102 s (timeline) · stack-20261024-g-0057 103.05 s (timeline) · stack-20261024-g-0071 104.1 s (timeline) · stack-20261024-g-0047 108 s (timeline) · stack-20261024-g-0077 108 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1292&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-cleared-20261024/ai_flow_live.html?bench=1292&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1292`); it opens the seed that parts earliest, and the dropdowns choose another.

