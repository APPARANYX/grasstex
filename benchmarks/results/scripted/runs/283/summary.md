# Benchmark run #283 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `generalIntel=0&rallyRecovery=0&combatHandoff=0` · **ON** flags: `none`
- main @ 5b7bb5d · [run](https://github.com/APPARANYX/grasstex/actions/runs/37145088931) · build v29-dev

## Verdict

**one battle per arm, 8 of 9 records changed, first part at 170.1 s, casualties 263 to 176: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **9** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.923 (gate 1.25)
- the 8 changed records first part at simulated second: min 170.1, p10 170.1, median 170.1, p90 170.1, max 170.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 263 | 176 | -9.6667 | 7 | 1 | 6 | 0.125 |
| `usKills` | 146 | 105 | -4.5556 | 7 | 1 | 6 | 0.125 |
| `geKills` | 117 | 71 | -5.1111 | 6 | 0 | 6 | 0.0313 |
| `fire.total` | 498 | 303 | -21.6667 | 7 | 3 | 4 | 1 |
| `fire.hits` | 107 | 64 | -4.7778 | 7 | 2 | 5 | 0.4531 |
| `retreatSamples` | 1548 | 986 | -62.4444 | 6 | 0 | 6 | 0.0313 |
| `movementResolver.changes` | 20198 | 22092 | 210.4444 | 7 | 6 | 1 | 0.125 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 9 | 6 | -0.3333 | 3 | 0 | 3 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 56 | 48 | -0.8889 | 7 | 4 | 3 | 1 |
| `stallOutcomes.wakes` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 116 | 117 | 0.1111 | 5 | 3 | 2 | 1 |
| `recon.contacts` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 105 | 94 | -1.2222 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 0 | 13 | 1.4444 | 5 | 5 | 0 | 0.0625 |
| `recon.reportsDelivered` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 105 | 106 | 0.1111 | 7 | 5 | 2 | 0.4531 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 170.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=283&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=283`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

