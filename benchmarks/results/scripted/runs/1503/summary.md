# Benchmark run #1503 · 60 seeds from `ncs-l` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&navCornerStand=0` · **ON** flags: `strategicInterception=0`
- work/pin/ncs-7e1ed1e1 @ 7e1ed1e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41233985959) · build v29-dev

## Verdict

**QUIET: 7 of 60 pairs changed (median first part 191.55 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.6% (p 0.625)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **53** · runtime errors off 0 / on 0 · wall time on/off x1.007 (gate 1.25)
- the 4 changed records first part at simulated second: min 110.1, p10 110.1, median 191.55, p90 205.05, max 205.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2335 | 2297 | -0.6333 | 4 | 1 | 3 | 0.625 |
| `usKills` | 891 | 874 | -0.2833 | 4 | 1 | 3 | 0.625 |
| `geKills` | 1444 | 1423 | -0.35 | 4 | 0 | 4 | 0.125 |
| `fire.total` | 32641 | 31801 | -14 | 4 | 1 | 3 | 0.625 |
| `fire.hits` | 4981 | 4896 | -1.4167 | 4 | 1 | 3 | 0.625 |
| `retreatSamples` | 99687 | 100350 | 11.05 | 4 | 3 | 1 | 0.625 |
| `movementResolver.changes` | 137864 | 138249 | 6.4167 | 4 | 2 | 2 | 1 |
| `grenades.throws` | 45 | 51 | 0.1 | 2 | 2 | 0 | 0.5 |
| `grenades.bursts` | 44 | 50 | 0.1 | 2 | 2 | 0 | 0.5 |
| `grenades.wounded` | 32 | 43 | 0.1833 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 10 | 11 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 82 | 86 | 0.0667 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 72 | 69 | -0.05 | 4 | 1 | 3 | 0.625 |
| `loopAlerts.length` | 558 | 551 | -0.1167 | 4 | 2 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 200 | 197 | -0.05 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1510 | 1521 | 0.1833 | 4 | 2 | 2 | 1 |
| `recon.contacts` | 255 | 257 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `recon.noContact` | 688 | 697 | 0.15 | 3 | 3 | 0 | 0.25 |
| `recon.timeouts` | 47 | 46 | -0.0167 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 474 | 472 | -0.0333 | 4 | 2 | 2 | 1 |
| `recon.reportsDelivered` | 1060 | 1061 | 0.0167 | 3 | 2 | 1 | 1 |
| `recon.retriggerBlocked` | 657 | 665 | 0.1333 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanOverall` | 5000.699999999998 | 4999.799999999998 | -0.015 | 4 | 2 | 2 | 1 |
| `squadPerformance.p10Overall` | 4592.400000000001 | 4592.099999999999 | -0.005 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4178.299999999999 | 4171.799999999999 | -0.1083 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanMovement` | 5992.399999999999 | 5992.399999999999 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 5766.4 | 5771.299999999999 | 0.0817 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 5376.5 | 5374.899999999999 | -0.0267 | 4 | 1 | 3 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 4 seeds that part earliest (simulated seconds)

ncs-l-0017 110.1 s (timeline) · ncs-l-0037 183 s (timeline) · ncs-l-0021 200.1 s (timeline) · ncs-l-0018 205.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1503&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-ncs-7e1ed1e1/ai_flow_live.html?bench=1503&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1503`); it opens the seed that parts earliest, and the dropdowns choose another.

