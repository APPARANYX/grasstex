# Benchmark run #452 · 60 seeds from `scripted-seeds` (ge-defend), windows `contact+600`

- **OFF** flags: `garrisonRelease=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ 5932572 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37828091434) · build v29-dev

## Verdict

**MOVED: 54 of 54 pairs changed (median first part 244.05 s); 12 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties +8.3% (p 0.0704)**

- Clears the Bonferroni line (p < 0.0015): vacantObjectiveStalls.length 37 to 136 (+267.6%, p 0); recon.timeouts 1223 to 1033 (-15.5%, p 0); usKills 903 to 1137 (+25.9%, p 0.0001); squadPerformance.meanMission 3665.2 to 3563.0999999999985 (-2.8%, p 0.0003); fire.hits 5607 to 6242 (+11.3%, p 0.0005); recon.orders 3153 to 2952 (-6.4%, p 0.0005).
- Under 0.05 only: fire.total 16209 to 17858 (+10.2%, p 0.0015); squadPerformance.meanOverall 4467.699999999999 to 4425.1 (-1.0%, p 0.0066); recon.reportsDelivered 1302 to 1120 (-14.0%, p 0.011); recon.contacts 320 to 259 (-19.1%, p 0.0133); retreatSamples 86662 to 92470 (+6.7%, p 0.0402); recon.noContact 937 to 1009 (+7.7%, p 0.0488).

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.965 (gate 1.25)
- the 54 changed records first part at simulated second: min 244.05, p10 244.05, median 244.05, p90 250.05, max 305.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2370 | 2566 | 3.6296 | 52 | 33 | 19 | 0.0704 |
| `usKills` | 903 | 1137 | 4.3333 | 49 | 38 | 11 | 0.0001 |
| `geKills` | 1467 | 1429 | -0.7037 | 51 | 23 | 28 | 0.5758 |
| `fire.total` | 16209 | 17858 | 30.537 | 54 | 39 | 15 | 0.0015 |
| `fire.hits` | 5607 | 6242 | 11.7593 | 54 | 40 | 14 | 0.0005 |
| `retreatSamples` | 86662 | 92470 | 107.5556 | 54 | 35 | 19 | 0.0402 |
| `movementResolver.changes` | 147004 | 152472 | 101.2593 | 54 | 34 | 20 | 0.0759 |
| `movementStalls.length` | 0 | 3 | 0.0556 | 2 | 2 | 0 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 37 | 136 | 1.8333 | 43 | 38 | 5 | 0 |
| `loopAlerts.length` | 189 | 193 | 0.0741 | 43 | 20 | 23 | 0.7608 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 168 | 183 | 0.2778 | 45 | 27 | 18 | 0.2327 |
| `stallOutcomes.wakes` | 5 | 6 | 0.0185 | 5 | 3 | 2 | 1 |
| `stallOutcomes.repeats` | 1 | 2 | 0.0185 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 5 | 0.0741 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamples` | 1 | 312 | 5.7593 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsetsRepeated` | 1 | 5 | 0.0741 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamplesRepeated` | 1 | 312 | 5.7593 | 3 | 3 | 0 | 0.25 |
| `recon.orders` | 3153 | 2952 | -3.7222 | 49 | 12 | 37 | 0.0005 |
| `recon.contacts` | 320 | 259 | -1.1296 | 48 | 15 | 33 | 0.0133 |
| `recon.noContact` | 937 | 1009 | 1.3333 | 44 | 29 | 15 | 0.0488 |
| `recon.timeouts` | 1223 | 1033 | -3.5185 | 49 | 9 | 40 | 0 |
| `recon.cancelled` | 604 | 587 | -0.3148 | 51 | 23 | 28 | 0.5758 |
| `recon.reportsDelivered` | 1302 | 1120 | -3.3704 | 51 | 16 | 35 | 0.011 |
| `recon.retriggerBlocked` | 1219 | 1214 | -0.0926 | 52 | 26 | 26 | 1 |
| `squadPerformance.meanOverall` | 4467.699999999999 | 4425.1 | -0.7889 | 50 | 15 | 35 | 0.0066 |
| `squadPerformance.p10Overall` | 4084.7999999999984 | 4058.799999999999 | -0.4815 | 40 | 16 | 24 | 0.2682 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3665.2 | 3563.0999999999985 | -1.8907 | 53 | 13 | 40 | 0.0003 |
| `squadPerformance.meanMovement` | 5369.6 | 5372.899999999999 | 0.0611 | 43 | 23 | 20 | 0.7608 |
| `squadPerformance.meanControl` | 5272.000000000001 | 5255.299999999999 | -0.3093 | 52 | 25 | 27 | 0.8899 |
| `squadPerformance.meanCohesion` | 4680.3 | 4734.800000000001 | 1.0093 | 54 | 31 | 23 | 0.3409 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

scripted-seeds-0001 244.05 s (timeline) · scripted-seeds-0002 244.05 s (timeline) · scripted-seeds-0003 244.05 s (timeline) · scripted-seeds-0005 244.05 s (timeline) · scripted-seeds-0007 244.05 s (timeline) · scripted-seeds-0008 244.05 s (timeline) · scripted-seeds-0009 244.05 s (timeline) · scripted-seeds-0011 244.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=452&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=452`); it opens the seed that parts earliest, and the dropdowns choose another.

