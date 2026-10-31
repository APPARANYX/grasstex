# Benchmark run #1517 · 60 seeds from `nse-l` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&navStationExit=0` · **ON** flags: `strategicInterception=0`
- work/pin/nse-f92f506a @ f92f506 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243008348) · build v29-dev

## Verdict

**QUIET: 2 of 3 pairs changed; 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Unpaired records: off 3, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **3** pairs (unpaired: off 3, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.03 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 123 | 123 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 83 | 83 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 1363 | 1363 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 250 | 250 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 3331 | 3331 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 9972 | 9972 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 120 | 120 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 68 | 68 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 85 | 85 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 246.10000000000002 | 246.10000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 225.60000000000002 | 225.60000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 207.49999999999997 | 207.49999999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 299.09999999999997 | 299.09999999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 272.9 | 272.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 269.6 | 269.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

nse-l-0031 (identical) · nse-l-0032 (identical) · nse-l-0033 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1517&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-f92f506a/ai_flow_live.html?bench=1517&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1517`); it opens the seed that parts earliest, and the dropdowns choose another.

