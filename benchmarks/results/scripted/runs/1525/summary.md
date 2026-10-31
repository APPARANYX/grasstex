# Benchmark run #1525 · 60 seeds from `nse-c` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&navStationExit=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/nse-c4a65b24 @ c4a65b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243587367) · build v29-dev

## Verdict

**QUIET: 21 of 60 pairs changed (median first part 265.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.1% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **39** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 14 changed records first part at simulated second: min 154.05, p10 176.1, median 265.05, p90 424.05, max 523.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2218 | 2220 | 0.0333 | 11 | 6 | 5 | 1 |
| `usKills` | 918 | 909 | -0.15 | 9 | 3 | 6 | 0.5078 |
| `geKills` | 1300 | 1311 | 0.1833 | 10 | 5 | 5 | 1 |
| `fire.total` | 57183 | 56466 | -11.95 | 11 | 3 | 8 | 0.2266 |
| `fire.hits` | 5262 | 5274 | 0.2 | 9 | 4 | 5 | 1 |
| `retreatSamples` | 135280 | 136478 | 19.9667 | 11 | 5 | 6 | 1 |
| `movementResolver.changes` | 185059 | 184604 | -7.5833 | 11 | 3 | 8 | 0.2266 |
| `grenades.throws` | 45 | 52 | 0.1167 | 3 | 3 | 0 | 0.25 |
| `grenades.bursts` | 45 | 52 | 0.1167 | 3 | 3 | 0 | 0.25 |
| `grenades.wounded` | 31 | 32 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 85 | 87 | 0.0333 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 73 | 70 | -0.05 | 5 | 2 | 3 | 1 |
| `loopAlerts.length` | 881 | 880 | -0.0167 | 4 | 2 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 230 | 231 | 0.0167 | 4 | 2 | 2 | 1 |
| `stallOutcomes.wakes` | 7 | 7 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2963 | 2936 | -0.45 | 9 | 3 | 6 | 0.5078 |
| `recon.contacts` | 699 | 696 | -0.05 | 8 | 4 | 4 | 1 |
| `recon.noContact` | 612 | 601 | -0.1833 | 7 | 1 | 6 | 0.125 |
| `recon.timeouts` | 62 | 58 | -0.0667 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 1530 | 1524 | -0.1 | 10 | 4 | 6 | 0.7539 |
| `recon.reportsDelivered` | 2844 | 2800 | -0.7333 | 10 | 4 | 6 | 0.7539 |
| `recon.retriggerBlocked` | 771 | 762 | -0.15 | 6 | 1 | 5 | 0.2188 |
| `squadPerformance.meanOverall` | 4917.4000000000015 | 4913.800000000001 | -0.06 | 10 | 3 | 7 | 0.3438 |
| `squadPerformance.p10Overall` | 4557.799999999999 | 4559.0999999999985 | 0.0217 | 3 | 2 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3911.9 | 3897.3999999999996 | -0.2417 | 10 | 5 | 5 | 1 |
| `squadPerformance.meanMovement` | 5992.499999999997 | 5991.999999999997 | -0.0083 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanControl` | 5710.8 | 5714.6 | 0.0633 | 10 | 5 | 5 | 1 |
| `squadPerformance.meanCohesion` | 5532.7999999999965 | 5537.199999999996 | 0.0733 | 10 | 5 | 5 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

nse-c-0041 154.05 s (timeline) · nse-c-0027 176.1 s (timeline) · nse-c-0035 221.1 s (timeline) · nse-c-0012 226.05 s (stress) · nse-c-0059 246 s (timeline) · nse-c-0019 258 s (timeline) · nse-c-0026 258 s (stress) · nse-c-0033 272.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1525&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-c4a65b24/ai_flow_live.html?bench=1525&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1525`); it opens the seed that parts earliest, and the dropdowns choose another.

