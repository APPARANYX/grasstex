# Benchmark run #461 · 60 seeds from `recon-ledger` (ge-defend), windows `contact+120`

- **OFF** flags: `?reconLedger=0` · **ON** flags: `none`
- work/recon-outcomes-393 @ c90239c · [run](https://github.com/APPARANYX/grasstex/actions/runs/37845889826) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 3.15 s); 12 of 34 counters under p 0.05 (about 1.7 by chance), 8 under 0.0015; casualties +16.0% (p 0.1263)**

- Clears the Bonferroni line (p < 0.0015): regroups.entries 24 to 74 (+208.3%, p 0); recon.orders 1978 to 1015 (-48.7%, p 0); recon.noContact 840 to 435 (-48.2%, p 0); recon.timeouts 729 to 298 (-59.1%, p 0); recon.retriggerBlocked 838 to 448 (-46.5%, p 0); squadPerformance.meanCohesion 4487.200000000001 to 4708.899999999997 (+4.9%, p 0.0001); recon.cancelled 253 to 161 (-36.4%, p 0.0002); squadPerformance.meanMovement 5281.3 to 5269.6 (-0.2%, p 0.0007).
- Under 0.05 only: geKills 374 to 496 (+32.6%, p 0.0153); movementResolver.changes 72043 to 68888 (-4.4%, p 0.027); squadPerformance.p10Overall 4319.099999999999 to 4246.099999999999 (-1.7%, p 0.027); retreatSamples 3176 to 5068 (+59.6%, p 0.0489).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.035 (gate 1.25)
- the 53 changed records first part at simulated second: min 3, p10 3, median 3.15, p90 9, max 20.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 701 | 813 | 2.1132 | 52 | 32 | 20 | 0.1263 |
| `usKills` | 327 | 317 | -0.1887 | 50 | 24 | 26 | 0.8877 |
| `geKills` | 374 | 496 | 2.3019 | 50 | 34 | 16 | 0.0153 |
| `fire.total` | 5285 | 5747 | 8.717 | 53 | 29 | 24 | 0.5831 |
| `fire.hits` | 1817 | 1963 | 2.7547 | 51 | 31 | 20 | 0.1608 |
| `retreatSamples` | 3176 | 5068 | 35.6981 | 51 | 33 | 18 | 0.0489 |
| `movementResolver.changes` | 72043 | 68888 | -59.5283 | 53 | 18 | 35 | 0.027 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 28 | 28 | 0 | 29 | 15 | 14 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 24 | 74 | 0.9434 | 30 | 28 | 2 | 0 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1978 | 1015 | -18.1698 | 53 | 2 | 51 | 0 |
| `recon.contacts` | 96 | 86 | -0.1887 | 43 | 18 | 25 | 0.3604 |
| `recon.noContact` | 840 | 435 | -7.6415 | 49 | 4 | 45 | 0 |
| `recon.timeouts` | 729 | 298 | -8.1321 | 52 | 4 | 48 | 0 |
| `recon.cancelled` | 253 | 161 | -1.7358 | 45 | 10 | 35 | 0.0002 |
| `recon.reportsDelivered` | 513 | 442 | -1.3396 | 46 | 20 | 26 | 0.4614 |
| `recon.retriggerBlocked` | 838 | 448 | -7.3585 | 53 | 0 | 53 | 0 |
| `squadPerformance.meanOverall` | 4714.099999999999 | 4718.899999999999 | 0.0906 | 52 | 25 | 27 | 0.8899 |
| `squadPerformance.p10Overall` | 4319.099999999999 | 4246.099999999999 | -1.3774 | 53 | 18 | 35 | 0.027 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4363.200000000001 | 4297.700000000001 | -1.2358 | 52 | 21 | 31 | 0.2116 |
| `squadPerformance.meanMovement` | 5281.3 | 5269.6 | -0.2208 | 48 | 12 | 36 | 0.0007 |
| `squadPerformance.meanControl` | 5259.600000000001 | 5257 | -0.0491 | 50 | 27 | 23 | 0.6718 |
| `squadPerformance.meanCohesion` | 4487.200000000001 | 4708.899999999997 | 4.183 | 53 | 41 | 12 | 0.0001 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

recon-ledger-0005 3 s (timeline) · recon-ledger-0006 3 s (timeline) · recon-ledger-0007 3 s (timeline) · recon-ledger-0009 3 s (timeline) · recon-ledger-0010 3 s (timeline) · recon-ledger-0013 3 s (timeline) · recon-ledger-0016 3 s (timeline) · recon-ledger-0021 3 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=461&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/recon-outcomes-393/ai_flow_live.html?bench=461&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=461`); it opens the seed that parts earliest, and the dropdowns choose another.

