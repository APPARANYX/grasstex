# Benchmark run #441 · 60 seeds from `control` (ge-defend), windows `every120`

- **OFF** flags: `woundRally=0` · **ON** flags: `none`
- claude/project-thread-kxo7sg @ f8e48cd · [run](https://github.com/APPARANYX/grasstex/actions/runs/37821561014) · build v29-dev

## Verdict

**MOVED: 164 of 276 pairs changed (median first part 296.1 s); 5 of 34 counters under p 0.05 (about 1.7 by chance), 1 under 0.0015; casualties +1.2% (p 0.694)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 406122 to 408699 (+0.6%, p 0.0005).
- Under 0.05 only: recon.orders 11438 to 11517 (+0.7%, p 0.0198); recon.timeouts 4111 to 4168 (+1.4%, p 0.0293); recon.contacts 763 to 735 (-3.7%, p 0.0488); recon.reportsDelivered 3584 to 3495 (-2.5%, p 0.0488).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **112** · runtime errors off 0 / on 0 · wall time on/off x0.978 (gate 1.25)
- the 83 changed records first part at simulated second: min 202.05, p10 232.05, median 296.1, p90 421.05, max 581.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5335 | 5400 | 0.2355 | 58 | 31 | 27 | 0.694 |
| `usKills` | 2372 | 2426 | 0.1957 | 49 | 26 | 23 | 0.7754 |
| `geKills` | 2963 | 2974 | 0.0399 | 58 | 31 | 27 | 0.694 |
| `fire.total` | 13189 | 12956 | -0.8442 | 67 | 38 | 29 | 0.3284 |
| `fire.hits` | 4615 | 4578 | -0.1341 | 62 | 31 | 31 | 1 |
| `retreatSamples` | 74961 | 75429 | 1.6957 | 64 | 35 | 29 | 0.5323 |
| `movementResolver.changes` | 406122 | 408699 | 9.337 | 82 | 57 | 25 | 0.0005 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 31 | 0.0145 | 18 | 12 | 6 | 0.2379 |
| `loopAlerts.length` | 133 | 153 | 0.0725 | 39 | 20 | 19 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 336 | 333 | -0.0109 | 20 | 6 | 14 | 0.1153 |
| `stallOutcomes.wakes` | 132 | 129 | -0.0109 | 9 | 4 | 5 | 1 |
| `stallOutcomes.repeats` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 157 | 157 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11438 | 11517 | 0.2862 | 54 | 36 | 18 | 0.0198 |
| `recon.contacts` | 763 | 735 | -0.1014 | 44 | 15 | 29 | 0.0488 |
| `recon.noContact` | 4457 | 4441 | -0.058 | 35 | 18 | 17 | 1 |
| `recon.timeouts` | 4111 | 4168 | 0.2065 | 48 | 32 | 16 | 0.0293 |
| `recon.cancelled` | 1747 | 1799 | 0.1884 | 42 | 27 | 15 | 0.0884 |
| `recon.reportsDelivered` | 3584 | 3495 | -0.3225 | 44 | 15 | 29 | 0.0488 |
| `recon.retriggerBlocked` | 4794 | 4804 | 0.0362 | 42 | 24 | 18 | 0.4408 |
| `squadPerformance.meanOverall` | 24454.8 | 24442.5 | -0.0446 | 69 | 30 | 39 | 0.3356 |
| `squadPerformance.p10Overall` | 22831.599999999977 | 22808.59999999998 | -0.0833 | 41 | 16 | 25 | 0.211 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21950.99999999996 | 21932.099999999977 | -0.0685 | 69 | 36 | 33 | 0.8099 |
| `squadPerformance.meanMovement` | 27398.999999999993 | 27411.8 | 0.0464 | 50 | 29 | 21 | 0.3222 |
| `squadPerformance.meanControl` | 27454.29999999998 | 27447.799999999977 | -0.0236 | 50 | 25 | 25 | 1 |
| `squadPerformance.meanCohesion` | 23024.699999999993 | 23033.099999999988 | 0.0304 | 68 | 32 | 36 | 0.7163 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0038 202.05 s (timeline) · control-0035 205.05 s (stress) · control-0001 232.05 s (timeline) · control-0007 234 s (timeline) · control-0024 235.05 s (stress) · control-0055 252 s (stress) · control-0016 258 s (timeline) · control-0017 258 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=441&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=441`); it opens the seed that parts earliest, and the dropdowns choose another.

