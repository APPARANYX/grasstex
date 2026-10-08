# Benchmark run #454 · 60 seeds from `control` (us-defend), windows `every120`

- **OFF** flags: `medic=0` · **ON** flags: `none`
- claude/medic-at-base @ 1acb9bf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37833609236) · build v29-dev

## Verdict

**MOVED: 170 of 276 pairs changed (median first part 352.05 s); 4 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties +0.0% (p 0.4807)**

- Clears the Bonferroni line (p < 0.0015): retreatSamples 87781 to 87013 (-0.9%, p 0); movementResolver.changes 499652 to 501730 (+0.4%, p 0).
- Under 0.05 only: recon.noContact 4893 to 4905 (+0.2%, p 0.0063); squadPerformance.meanMission 21716.69999999998 to 21724.39999999998 (+0.0%, p 0.0106).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **106** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 100 changed records first part at simulated second: min 207, p10 245.1, median 352.05, p90 518.1, max 571.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6971 | 6971 | 0 | 18 | 11 | 7 | 0.4807 |
| `usKills` | 3388 | 3384 | -0.0145 | 15 | 8 | 7 | 1 |
| `geKills` | 3583 | 3587 | 0.0145 | 12 | 6 | 6 | 1 |
| `fire.total` | 16873 | 16818 | -0.1993 | 20 | 9 | 11 | 0.8238 |
| `fire.hits` | 5726 | 5737 | 0.0399 | 19 | 13 | 6 | 0.1671 |
| `retreatSamples` | 87781 | 87013 | -2.7826 | 25 | 2 | 23 | 0 |
| `movementResolver.changes` | 499652 | 501730 | 7.529 | 32 | 28 | 4 | 0 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 59 | 56 | -0.0109 | 4 | 1 | 3 | 0.625 |
| `loopAlerts.length` | 223 | 225 | 0.0072 | 10 | 4 | 6 | 0.7539 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 571 | 572 | 0.0036 | 6 | 4 | 2 | 0.6875 |
| `stallOutcomes.wakes` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 4 | 5 | 0.0036 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 12392 | 12403 | 0.0399 | 21 | 14 | 7 | 0.1892 |
| `recon.contacts` | 799 | 799 | 0 | 6 | 3 | 3 | 1 |
| `recon.noContact` | 4893 | 4905 | 0.0435 | 12 | 11 | 1 | 0.0063 |
| `recon.timeouts` | 4067 | 4071 | 0.0145 | 13 | 7 | 6 | 1 |
| `recon.cancelled` | 2212 | 2198 | -0.0507 | 14 | 4 | 10 | 0.1796 |
| `recon.reportsDelivered` | 3492 | 3485 | -0.0254 | 8 | 4 | 4 | 1 |
| `recon.retriggerBlocked` | 4975 | 4977 | 0.0072 | 16 | 9 | 7 | 0.8036 |
| `squadPerformance.meanOverall` | 24368.79999999999 | 24368.09999999999 | -0.0025 | 26 | 14 | 12 | 0.845 |
| `squadPerformance.p10Overall` | 22652.099999999977 | 22650.799999999974 | -0.0047 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21716.69999999998 | 21724.39999999998 | 0.0279 | 23 | 18 | 5 | 0.0106 |
| `squadPerformance.meanMovement` | 27431.000000000004 | 27434.000000000004 | 0.0109 | 17 | 9 | 8 | 1 |
| `squadPerformance.meanControl` | 27427.799999999992 | 27426.599999999988 | -0.0043 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanCohesion` | 23066.7 | 23059.2 | -0.0272 | 23 | 9 | 14 | 0.4049 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0020 207 s (stress) · control-0034 215.1 s (stress) · control-0019 245.1 s (stress) · control-0048 257.1 s (stress) · control-0005 259.05 s (stress) · control-0031 266.1 s (stress) · control-0010 269.1 s (stress) · control-0046 296.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=454&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=454`); it opens the seed that parts earliest, and the dropdowns choose another.

