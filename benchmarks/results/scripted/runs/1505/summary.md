# Benchmark run #1505 · 60 seeds from `ncs-c` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&navCornerStand=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/ncs-7e1ed1e1 @ 7e1ed1e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41234063043) · build v29-dev

## Verdict

**QUIET: 1 of 60 pairs changed (median first part 485.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **59** · runtime errors off 0 / on 0 · wall time on/off x0.992 (gate 1.25)
- the 1 changed records first part at simulated second: min 485.1, p10 485.1, median 485.1, p90 485.1, max 485.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1872 | 1872 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 747 | 747 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1125 | 1125 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 45997 | 45997 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4071 | 4071 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 115839 | 115839 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 164417 | 164417 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 120 | 120 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 773 | 773 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 168 | 168 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 193 | 193 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 193 | 193 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2526 | 2526 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 546 | 546 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 567 | 567 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1312 | 1312 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2390 | 2390 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 710 | 710 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5033.8 | 5033.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4682.4 | 4682.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4108.599999999999 | 4108.599999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5992.2 | 5992.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5754.000000000001 | 5754.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5565.099999999999 | 5565.099999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

ncs-c-0060 485.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1505&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-ncs-7e1ed1e1/ai_flow_live.html?bench=1505&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1505`); it opens the seed that parts earliest, and the dropdowns choose another.

