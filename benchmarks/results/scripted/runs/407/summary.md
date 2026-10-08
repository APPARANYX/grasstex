# Benchmark run #407 · 60 seeds from `reconposts` (meeting), windows `every60`

- **OFF** flags: `reconPosts=0` · **ON** flags: `none`
- claude/recon-skip-posted-men @ 27bbde4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37773140235) · build v29-dev

## Verdict

**MOVED: 186 of 576 pairs changed (median first part 329.1 s); 6 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties +1.0% (p 0.0005)**

- Clears the Bonferroni line (p < 0.0015): recon.timeouts 319 to 293 (-8.2%, p 0); casualties 14078 to 14215 (+1.0%, p 0.0005).
- Under 0.05 only: usKills 7106 to 7277 (+2.4%, p 0.0079); fire.hits 7043 to 7188 (+2.1%, p 0.0079); recon.noContact 8436 to 8460 (+0.3%, p 0.0166); fire.total 20317 to 20748 (+2.1%, p 0.0357).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **576** pairs (unpaired: off 2, on 2) · identical in every field: **390** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- the 63 changed records first part at simulated second: min 235.05, p10 235.05, median 329.1, p90 433.05, max 569.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 14078 | 14215 | 0.2378 | 49 | 37 | 12 | 0.0005 |
| `usKills` | 7106 | 7277 | 0.2969 | 47 | 33 | 14 | 0.0079 |
| `geKills` | 6972 | 6938 | -0.059 | 48 | 21 | 27 | 0.4709 |
| `fire.total` | 20317 | 20748 | 0.7483 | 45 | 30 | 15 | 0.0357 |
| `fire.hits` | 7043 | 7188 | 0.2517 | 47 | 33 | 14 | 0.0079 |
| `retreatSamples` | 99323 | 98019 | -2.2639 | 46 | 16 | 30 | 0.0541 |
| `movementResolver.changes` | 1181390 | 1178781 | -4.5295 | 68 | 31 | 37 | 0.5446 |
| `movementStalls.length` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 257 | 270 | 0.0226 | 27 | 16 | 11 | 0.4421 |
| `loopAlerts.length` | 283 | 281 | -0.0035 | 18 | 8 | 10 | 0.8145 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 896 | 908 | 0.0208 | 27 | 19 | 8 | 0.0522 |
| `stallOutcomes.wakes` | 121 | 124 | 0.0052 | 14 | 8 | 6 | 0.7905 |
| `stallOutcomes.repeats` | 43 | 44 | 0.0017 | 5 | 3 | 2 | 1 |
| `timeline.stalledOnsets` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1583 | 1484 | -0.1719 | 4 | 2 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 200 | 200 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 8344 | 7777 | -0.9844 | 4 | 0 | 4 | 0.125 |
| `recon.orders` | 12218 | 12215 | -0.0052 | 40 | 22 | 18 | 0.6358 |
| `recon.contacts` | 423 | 417 | -0.0104 | 23 | 9 | 14 | 0.4049 |
| `recon.noContact` | 8436 | 8460 | 0.0417 | 40 | 28 | 12 | 0.0166 |
| `recon.timeouts` | 319 | 293 | -0.0451 | 29 | 2 | 27 | 0 |
| `recon.cancelled` | 2660 | 2661 | 0.0017 | 37 | 22 | 15 | 0.324 |
| `recon.reportsDelivered` | 1901 | 1876 | -0.0434 | 21 | 8 | 13 | 0.3833 |
| `recon.retriggerBlocked` | 9619 | 9602 | -0.0295 | 36 | 17 | 19 | 0.8679 |
| `squadPerformance.meanOverall` | 50430.5 | 50440.4 | 0.0172 | 56 | 34 | 22 | 0.1409 |
| `squadPerformance.p10Overall` | 47695.69999999987 | 47697.79999999988 | 0.0036 | 30 | 16 | 14 | 0.8555 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 42227.99999999996 | 42269.69999999997 | 0.0724 | 53 | 32 | 21 | 0.169 |
| `squadPerformance.meanMovement` | 56889.80000000004 | 56862.20000000004 | -0.0479 | 46 | 19 | 27 | 0.302 |
| `squadPerformance.meanControl` | 57282.60000000001 | 57281.50000000002 | -0.0019 | 40 | 20 | 20 | 1 |
| `squadPerformance.meanCohesion` | 50495.8 | 50498.29999999999 | 0.0043 | 58 | 26 | 32 | 0.5118 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

reconposts-0054 235.05 s (timeline) · reconposts-0042 257.1 s (timeline) · reconposts-0030 273 s (timeline) · reconposts-0016 274.05 s (timeline) · reconposts-0034 288 s (timeline) · reconposts-0011 329.1 s (timeline) · reconposts-0060 333 s (timeline) · reconposts-0006 339 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=407&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=407`); it opens the seed that parts earliest, and the dropdowns choose another.

