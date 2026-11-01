# Benchmark run #1539 · 60 seeds from `c13i` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-6e32c30a @ 6e32c30 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256741495) · build v29-dev

## Verdict

**WEAK: 59 of 60 pairs changed (median first part 212.1 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.7% (p 1)**

- Under 0.05 only: squadPerformance.meanCohesion 5522.700000000002 to 5542.3 (+0.4%, p 0.0186); loopAlerts.length 781 to 812 (+4.0%, p 0.0309).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x1.001 (gate 1.25)
- the 49 changed records first part at simulated second: min 120, p10 140.1, median 212.1, p90 265.05, max 371.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2124 | 2110 | -0.2333 | 45 | 22 | 23 | 1 |
| `usKills` | 912 | 940 | 0.4667 | 43 | 22 | 21 | 1 |
| `geKills` | 1212 | 1170 | -0.7 | 45 | 19 | 26 | 0.3713 |
| `fire.total` | 51592 | 52393 | 13.35 | 47 | 27 | 20 | 0.3817 |
| `fire.hits` | 4838 | 4640 | -3.3 | 45 | 19 | 26 | 0.3713 |
| `retreatSamples` | 125832 | 128638 | 46.7667 | 47 | 24 | 23 | 1 |
| `movementResolver.changes` | 164165 | 166448 | 38.05 | 48 | 29 | 19 | 0.1934 |
| `grenades.throws` | 72 | 60 | -0.2 | 27 | 9 | 18 | 0.1221 |
| `grenades.bursts` | 72 | 60 | -0.2 | 27 | 9 | 18 | 0.1221 |
| `grenades.wounded` | 55 | 57 | 0.0333 | 15 | 7 | 8 | 1 |
| `grenades.casualties` | 19 | 20 | 0.0167 | 10 | 5 | 5 | 1 |
| `grenades.suppressed` | 110 | 120 | 0.1667 | 19 | 7 | 12 | 0.3593 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 5 | 2 | 3 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 11 | 9 | -0.0333 | 14 | 6 | 8 | 0.7905 |
| `movementStalls.length` | 0 | 3 | 0.05 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 82 | 73 | -0.15 | 29 | 13 | 16 | 0.7111 |
| `loopAlerts.length` | 781 | 812 | 0.5167 | 18 | 14 | 4 | 0.0309 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 181 | 203 | 0.3667 | 35 | 20 | 15 | 0.4996 |
| `stallOutcomes.wakes` | 11 | 9 | -0.0333 | 6 | 2 | 4 | 0.6875 |
| `stallOutcomes.repeats` | 4 | 1 | -0.05 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsets` | 0 | 3 | 0.05 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 46 | 0.7667 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 3 | 0.05 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 46 | 0.7667 | 1 | 1 | 0 | 1 |
| `recon.orders` | 2389 | 2335 | -0.9 | 44 | 23 | 21 | 0.8804 |
| `recon.contacts` | 546 | 526 | -0.3333 | 43 | 21 | 22 | 1 |
| `recon.noContact` | 576 | 585 | 0.15 | 39 | 21 | 18 | 0.7493 |
| `recon.timeouts` | 27 | 28 | 0.0167 | 15 | 7 | 8 | 1 |
| `recon.cancelled` | 1188 | 1127 | -1.0167 | 45 | 17 | 28 | 0.1352 |
| `recon.reportsDelivered` | 2216 | 2038 | -2.9667 | 45 | 19 | 26 | 0.3713 |
| `recon.retriggerBlocked` | 675 | 681 | 0.1 | 37 | 19 | 18 | 1 |
| `squadPerformance.meanOverall` | 5000.899999999999 | 4987.000000000003 | -0.2317 | 45 | 20 | 25 | 0.5515 |
| `squadPerformance.p10Overall` | 4647.5999999999985 | 4633.1 | -0.2417 | 20 | 6 | 14 | 0.1153 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4090.899999999998 | 4040.0999999999985 | -0.8467 | 46 | 18 | 28 | 0.1839 |
| `squadPerformance.meanMovement` | 5993.000000000001 | 5991.000000000001 | -0.0333 | 31 | 12 | 19 | 0.281 |
| `squadPerformance.meanControl` | 5750.699999999999 | 5749.1 | -0.0267 | 45 | 20 | 25 | 0.5515 |
| `squadPerformance.meanCohesion` | 5522.700000000002 | 5542.3 | 0.3267 | 47 | 32 | 15 | 0.0186 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13i-0019 120 s (timeline) · c13i-0042 125.1 s (timeline) · c13i-0009 139.05 s (timeline) · c13i-0029 140.1 s (timeline) · c13i-0053 140.1 s (timeline) · c13i-0002 147 s (timeline) · c13i-0056 147 s (timeline) · c13i-0008 152.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1539&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-6e32c30a/ai_flow_live.html?bench=1539&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1539`); it opens the seed that parts earliest, and the dropdowns choose another.

