# Benchmark run #1312 · 100 seeds from `tgpb-20261024-b` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1&talkingGuns=1`
- work/talking-guns-20261024 @ e91fa6d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40118029288) · build v29-dev

## Verdict

**QUIET: 96 of 100 pairs changed (median first part 182.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +3.7% (p 0.4999)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x0.973 (gate 1.25)
- the 86 changed records first part at simulated second: min 97.05, p10 130.05, median 182.1, p90 270, max 412.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3866 | 4009 | 1.43 | 79 | 43 | 36 | 0.4999 |
| `usKills` | 1736 | 1848 | 1.12 | 80 | 47 | 33 | 0.1456 |
| `geKills` | 2130 | 2161 | 0.31 | 80 | 41 | 39 | 0.9111 |
| `fire.total` | 35579 | 33122 | -24.57 | 86 | 40 | 46 | 0.59 |
| `fire.hits` | 7204 | 7485 | 2.81 | 82 | 47 | 35 | 0.2242 |
| `retreatSamples` | 271389 | 265655 | -57.34 | 86 | 37 | 49 | 0.2354 |
| `movementResolver.changes` | 240639 | 239153 | -14.86 | 86 | 37 | 49 | 0.2354 |
| `grenades.throws` | 17 | 22 | 0.05 | 10 | 7 | 3 | 0.3438 |
| `grenades.bursts` | 17 | 22 | 0.05 | 10 | 7 | 3 | 0.3438 |
| `grenades.wounded` | 10 | 13 | 0.03 | 6 | 3 | 3 | 1 |
| `grenades.casualties` | 3 | 5 | 0.02 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 36 | 30 | -0.06 | 7 | 4 | 3 | 1 |
| `grenades.friendlyWounded` | 2 | 4 | 0.02 | 4 | 3 | 1 | 0.625 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 1 | 2 | 0.01 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 233 | 248 | 0.15 | 65 | 36 | 29 | 0.457 |
| `loopAlerts.length` | 714 | 696 | -0.18 | 79 | 34 | 45 | 0.2604 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 386 | 395 | 0.09 | 77 | 40 | 37 | 0.8199 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 10 | 5 | 5 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2014 | 1990 | -0.24 | 78 | 36 | 42 | 0.5716 |
| `recon.contacts` | 173 | 167 | -0.06 | 67 | 32 | 35 | 0.8072 |
| `recon.noContact` | 1155 | 1151 | -0.04 | 74 | 36 | 38 | 0.9076 |
| `recon.timeouts` | 66 | 72 | 0.06 | 35 | 18 | 17 | 1 |
| `recon.cancelled` | 474 | 453 | -0.21 | 75 | 33 | 42 | 0.3557 |
| `recon.reportsDelivered` | 647 | 629 | -0.18 | 74 | 35 | 39 | 0.7275 |
| `recon.retriggerBlocked` | 1244 | 1229 | -0.15 | 77 | 38 | 39 | 1 |
| `squadPerformance.meanOverall` | 8275.799999999997 | 8288.900000000001 | 0.131 | 84 | 42 | 42 | 1 |
| `squadPerformance.p10Overall` | 7685.199999999997 | 7703.399999999999 | 0.182 | 30 | 19 | 11 | 0.2005 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6560.999999999996 | 6581.699999999999 | 0.207 | 85 | 42 | 43 | 1 |
| `squadPerformance.meanMovement` | 9988.89999999999 | 9988.999999999989 | 0.001 | 33 | 17 | 16 | 1 |
| `squadPerformance.meanControl` | 9735.099999999997 | 9742.400000000003 | 0.073 | 82 | 45 | 37 | 0.4397 |
| `squadPerformance.meanCohesion` | 9239.500000000002 | 9233.6 | -0.059 | 85 | 40 | 45 | 0.6646 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

tgpb-20261024-b-0051 97.05 s (timeline) · tgpb-20261024-b-0081 109.05 s (stress) · tgpb-20261024-b-0047 119.1 s (timeline) · tgpb-20261024-b-0061 121.05 s (timeline) · tgpb-20261024-b-0087 124.05 s (timeline) · tgpb-20261024-b-0054 126 s (stress) · tgpb-20261024-b-0078 126 s (timeline) · tgpb-20261024-b-0013 130.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1312&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/talking-guns-20261024/ai_flow_live.html?bench=1312&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1312`); it opens the seed that parts earliest, and the dropdowns choose another.

