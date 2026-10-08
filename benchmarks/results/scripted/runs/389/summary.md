# Benchmark run #389 · 60 seeds from `hill` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ c8ab9c6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37739005132) · build v29-dev

## Verdict

**MOVED: 247 of 264 pairs changed (median first part 168 s); 10 of 34 counters under p 0.05 (about 1.7 by chance), 10 under 0.0015; casualties +21.7% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5413 to 6588 (+21.7%, p 0); geKills 2819 to 3750 (+33.0%, p 0); fire.total 12745 to 16057 (+26.0%, p 0); fire.hits 4494 to 5473 (+21.8%, p 0); retreatSamples 78943 to 89104 (+12.9%, p 0); movementResolver.changes 393295 to 448332 (+14.0%, p 0); stallOutcomes.wakes 134 to 25 (-81.3%, p 0); stallOutcomes.repeats 35 to 0 (-100.0%, p 0); recon.cancelled 1625 to 1854 (+14.1%, p 0); recon.orders 11074 to 11708 (+5.7%, p 0.0003).

## Paired comparison (off against on)

- **264** pairs (unpaired: off 0, on 0) · identical in every field: **17** · runtime errors off 0 / on 0 · wall time on/off x1.021 (gate 1.25)
- the 206 changed records first part at simulated second: min 55.05, p10 119.1, median 168, p90 215.1, max 363

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5413 | 6588 | 4.4508 | 184 | 136 | 48 | 0 |
| `usKills` | 2594 | 2838 | 0.9242 | 179 | 101 | 78 | 0.0998 |
| `geKills` | 2819 | 3750 | 3.5265 | 188 | 137 | 51 | 0 |
| `fire.total` | 12745 | 16057 | 12.5455 | 192 | 131 | 61 | 0 |
| `fire.hits` | 4494 | 5473 | 3.7083 | 190 | 131 | 59 | 0 |
| `retreatSamples` | 78943 | 89104 | 38.4886 | 188 | 125 | 63 | 0 |
| `movementResolver.changes` | 393295 | 448332 | 208.4735 | 206 | 179 | 27 | 0 |
| `movementStalls.length` | 0 | 2 | 0.0076 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 32 | 0.0265 | 39 | 21 | 18 | 0.7493 |
| `loopAlerts.length` | 143 | 186 | 0.1629 | 116 | 66 | 50 | 0.1634 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 470 | 487 | 0.0644 | 110 | 61 | 49 | 0.2942 |
| `stallOutcomes.wakes` | 134 | 25 | -0.4129 | 75 | 5 | 70 | 0 |
| `stallOutcomes.repeats` | 35 | 0 | -0.1326 | 27 | 0 | 27 | 0 |
| `timeline.stalledOnsets` | 0 | 3 | 0.0114 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamples` | 0 | 102 | 0.3864 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 4 | 0.0152 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamplesRepeated` | 0 | 102 | 0.3864 | 1 | 1 | 0 | 1 |
| `recon.orders` | 11074 | 11708 | 2.4015 | 163 | 105 | 58 | 0.0003 |
| `recon.contacts` | 857 | 951 | 0.3561 | 151 | 81 | 70 | 0.4159 |
| `recon.noContact` | 4385 | 4556 | 0.6477 | 104 | 58 | 46 | 0.2807 |
| `recon.timeouts` | 3842 | 3936 | 0.3561 | 154 | 78 | 76 | 0.9358 |
| `recon.cancelled` | 1625 | 1854 | 0.8674 | 178 | 120 | 58 | 0 |
| `recon.reportsDelivered` | 4132 | 4630 | 1.8864 | 170 | 95 | 75 | 0.1448 |
| `recon.retriggerBlocked` | 4665 | 4840 | 0.6629 | 154 | 89 | 65 | 0.0635 |
| `squadPerformance.meanOverall` | 23294.100000000006 | 23254.599999999988 | -0.1496 | 193 | 91 | 102 | 0.4717 |
| `squadPerformance.p10Overall` | 21709.099999999984 | 21606.099999999988 | -0.3902 | 153 | 70 | 83 | 0.332 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20613.599999999988 | 20430.599999999984 | -0.6932 | 192 | 83 | 109 | 0.0709 |
| `squadPerformance.meanMovement` | 26247.700000000004 | 26222.800000000003 | -0.0943 | 165 | 78 | 87 | 0.5335 |
| `squadPerformance.meanControl` | 26256.100000000002 | 26265.899999999994 | 0.0371 | 170 | 96 | 74 | 0.107 |
| `squadPerformance.meanCohesion` | 22382.999999999996 | 22356.199999999993 | -0.1015 | 198 | 105 | 93 | 0.4344 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0029 55.05 s (timeline) · hill-0043 94.05 s (timeline) · hill-0031 106.05 s (timeline) · hill-0013 107.1 s (timeline) · hill-0024 119.1 s (timeline) · hill-0045 123 s (timeline) · hill-0019 128.1 s (timeline) · hill-0010 130.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=389&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=389`); it opens the seed that parts earliest, and the dropdowns choose another.

