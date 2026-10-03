# Benchmark run #284 · 100 seeds from `general-isolation-v321` (meeting), windows `contact+120`

- **OFF** flags: `generalIntel=0&rallyRecovery=0&combatHandoff=0` · **ON** flags: `none`
- main @ 5b7bb5d · [run](https://github.com/APPARANYX/grasstex/actions/runs/37145090818) · build v29-dev

## Verdict

**QUIET: 98 of 100 pairs changed (median first part 145.575 s); 0 of 25 counters under p 0.05 (about 1.3 by chance); casualties +4.2% (p 0.0919)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 84 changed records first part at simulated second: min 3, p10 51.15, median 145.575, p90 192, max 218.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 644 | 671 | 0.27 | 51 | 32 | 19 | 0.0919 |
| `usKills` | 289 | 304 | 0.15 | 40 | 22 | 18 | 0.6358 |
| `geKills` | 355 | 367 | 0.12 | 46 | 25 | 21 | 0.6587 |
| `fire.total` | 6353 | 6225 | -1.28 | 63 | 33 | 30 | 0.8013 |
| `fire.hits` | 1236 | 1266 | 0.3 | 58 | 31 | 27 | 0.694 |
| `retreatSamples` | 1515 | 1539 | 0.24 | 40 | 21 | 19 | 0.8746 |
| `movementResolver.changes` | 181765 | 181906 | 1.41 | 74 | 41 | 33 | 0.416 |
| `movementStalls.length` | 7 | 4 | -0.03 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 50 | 39 | -0.11 | 17 | 8 | 9 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 481 | 479 | -0.02 | 17 | 9 | 8 | 1 |
| `stallOutcomes.wakes` | 564 | 563 | -0.01 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 97 | 97 | 0 | 6 | 3 | 3 | 1 |
| `timeline.stalledOnsets` | 16 | 11 | -0.05 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 173 | 79 | -0.94 | 2 | 1 | 1 | 1 |
| `recon.orders` | 1461 | 1455 | -0.06 | 29 | 13 | 16 | 0.7111 |
| `recon.contacts` | 32 | 32 | 0 | 12 | 6 | 6 | 1 |
| `recon.noContact` | 1354 | 1350 | -0.04 | 18 | 8 | 10 | 0.8145 |
| `recon.timeouts` | 14 | 13 | -0.01 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 45 | 44 | -0.01 | 14 | 6 | 8 | 0.7905 |
| `recon.reportsDelivered` | 185 | 170 | -0.15 | 10 | 4 | 6 | 0.7539 |
| `recon.retriggerBlocked` | 1352 | 1349 | -0.03 | 20 | 10 | 10 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

general-isolation-v321-0045 3 s (timeline) · general-isolation-v321-0050 7.05 s (timeline) · general-isolation-v321-0098 19.05 s (timeline) · general-isolation-v321-0075 26.1 s (timeline) · general-isolation-v321-0007 32.1 s (timeline) · general-isolation-v321-0100 32.1 s (timeline) · general-isolation-v321-0053 33 s (timeline) · general-isolation-v321-0096 34.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=284&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=284`); it opens the seed that parts earliest, and the dropdowns choose another.

