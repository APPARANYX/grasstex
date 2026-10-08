# Benchmark run #449 · 60 seeds from `scripted-seeds` (ge-defend), windows `contact+120`

- **OFF** flags: `garrisonRelease=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ 5932572 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37825954451) · build v29-dev

## Verdict

**MOVED: 31 of 54 pairs changed (median first part 244.05 s); 7 of 34 counters under p 0.05 (about 1.7 by chance), 4 under 0.0015; casualties -1.7% (p 0.0923)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 69190 to 69832 (+0.9%, p 0); squadPerformance.meanOverall 4834.100000000001 to 4823.4000000000015 (-0.2%, p 0); squadPerformance.meanMission 4528.9 to 4500.0999999999985 (-0.6%, p 0); squadPerformance.meanControl 5355.9000000000015 to 5346.200000000002 (-0.2%, p 0.0001).
- Under 0.05 only: recon.orders 1821 to 1835 (+0.8%, p 0.0034); recon.cancelled 202 to 210 (+4.0%, p 0.0156); geKills 408 to 395 (-3.2%, p 0.0391).

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **23** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 21 changed records first part at simulated second: min 244.05, p10 244.05, median 244.05, p90 244.05, max 250.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 646 | 635 | -0.2037 | 13 | 3 | 10 | 0.0923 |
| `usKills` | 238 | 240 | 0.037 | 7 | 4 | 3 | 1 |
| `geKills` | 408 | 395 | -0.2407 | 9 | 1 | 8 | 0.0391 |
| `fire.total` | 4361 | 4278 | -1.537 | 14 | 8 | 6 | 0.7905 |
| `fire.hits` | 1582 | 1582 | 0 | 11 | 7 | 4 | 0.5488 |
| `retreatSamples` | 2704 | 2742 | 0.7037 | 7 | 3 | 4 | 1 |
| `movementResolver.changes` | 69190 | 69832 | 11.8889 | 21 | 21 | 0 | 0 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 29 | 31 | 0.037 | 5 | 3 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1821 | 1835 | 0.2593 | 13 | 12 | 1 | 0.0034 |
| `recon.contacts` | 113 | 114 | 0.0185 | 5 | 3 | 2 | 1 |
| `recon.noContact` | 731 | 732 | 0.0185 | 3 | 2 | 1 | 1 |
| `recon.timeouts` | 711 | 711 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 202 | 210 | 0.1481 | 7 | 7 | 0 | 0.0156 |
| `recon.reportsDelivered` | 520 | 527 | 0.1296 | 6 | 4 | 2 | 0.6875 |
| `recon.retriggerBlocked` | 768 | 771 | 0.0556 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanOverall` | 4834.100000000001 | 4823.4000000000015 | -0.1981 | 22 | 1 | 21 | 0 |
| `squadPerformance.p10Overall` | 4449.499999999999 | 4437.4 | -0.2241 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4528.9 | 4500.0999999999985 | -0.5333 | 22 | 1 | 21 | 0 |
| `squadPerformance.meanMovement` | 5377.399999999999 | 5378.299999999999 | 0.0167 | 7 | 6 | 1 | 0.125 |
| `squadPerformance.meanControl` | 5355.9000000000015 | 5346.200000000002 | -0.1796 | 22 | 2 | 20 | 0.0001 |
| `squadPerformance.meanCohesion` | 4488.9 | 4496.599999999999 | 0.1426 | 12 | 5 | 7 | 0.7744 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

scripted-seeds-0003 244.05 s (timeline) · scripted-seeds-0005 244.05 s (timeline) · scripted-seeds-0011 244.05 s (timeline) · scripted-seeds-0012 244.05 s (timeline) · scripted-seeds-0016 244.05 s (timeline) · scripted-seeds-0017 244.05 s (timeline) · scripted-seeds-0020 244.05 s (timeline) · scripted-seeds-0022 244.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=449&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=449`); it opens the seed that parts earliest, and the dropdowns choose another.

