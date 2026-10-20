# Full-fidelity benchmark: full-fidelity

- Page: http://127.0.0.1:8876/grasstex/battle_sim_local.php?seed=full-fidelity&perfTimings=1
- Build: v460
- Renderer: software (SwiftShader) - CPU-only baseline, not a device result (ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver))
- Soldiers: 100, FBX 100; viewport 1280x720; warm-up 90.0 sim s; measured 15.0 s wall, 7.81 sim s at 4x
- Result: OK

## Frames

| metric | mean | median | p95 | p99 | max |
| --- | --- | --- | --- | --- | --- |
| frame interval (ms) | 471.38 | 414.38 | 903.72 | 1789.61 | 1789.61 |
| CPU in frame (ms) | 77.42 | 38.14 | 387.00 | 466.14 | 466.14 |
| scene.render (ms) | 77.29 | 38.06 | 386.92 | 466.03 | 466.03 |
| Babylon render time (ms) | 49.59 | 9.29 | 362.37 | 451.46 | 451.46 |
| sim step (ms) | 13.78 | 14.03 | 19.88 | 21.24 | 21.24 |
| pose, all soldiers (ms) | 3.79 | 3.36 | 5.94 | 12.54 | 12.54 |
| active meshes | 212.00 | 212.00 | 212.00 | 212.00 | 212.00 |
| draw calls | 140.00 | 140.00 | 140.00 | 140.00 | 140.00 |
| GPU frame (ms) | 341.00 | 338.28 | 385.38 | 385.38 | 385.38 |

FPS: mean 2.12, median 2.41, p95-low 1.11, p99-low 0.56 over 31 frames. GPU timing: measured.

Animation LOD: on (every frame < 35 m, 30 Hz < 100 m, 10 Hz beyond, off-screen held: true); posed 76.9% of soldier-frames; held: static 0, off-screen 640, interval 99.

## Pose (applyPose)

32 frames, 76.91 soldiers posed per frame; per soldier 41.8 µs mean, 90.0 µs p95 (timer resolution ~5 µs).
Posed soldiers: 0.0% dead, 0.0% outside the view frustum; camera distance <25 m 0.0%, 25-60 m 0.0%, 60-150 m 0.0%, >150 m 100.0%.

| layer | share | µs per soldier-frame | µs per run | ms per frame (mean / p95) |
| --- | --- | --- | --- | --- |
| setup | 4.6% | 1.81 | 1.81 | 0.14 / 0.21 |
| base | 58.6% | 22.91 | 22.91 | 1.76 / 2.77 |
| overlay | 0.0% | 0.00 | — | 0.00 / 0.00 |
| dials | 3.6% | 1.41 | 1.64 | 0.11 / 0.20 |
| weapon | 24.3% | 9.49 | 9.49 | 0.73 / 1.24 |
| aim | 0.0% | 0.00 | — | 0.00 / 0.00 |
| support | 8.9% | 3.50 | 3.50 | 0.27 / 0.52 |

| inputs | recomputed | unchanged (exact) | unchanged at 30 Hz clip rate | layer-only inputs unchanged |
| --- | --- | --- | --- | --- |
| base | 2461 | 0.0% | 0.0% | 96.8% |
| aim | 0 | — | — | — |
| weapon | 2461 | 0.0% | 0.0% | 96.8% |
| support | 2461 | 0.0% | 0.0% | 96.8% |

## Startup

| phase | ms |
| --- | --- |
| Runtime scripts | 591.7 |
| Scenario & engine | 3254.2 |
| Terrain & sky | 56.7 |
| Soldiers, weapons & clips | 2913.8 |
| Cover, hedges & buildings | 1114.4 |
| Navigation, squads & objectives | 566.8 |
| loading finished at | 8584.6 |

FBX library: 2687.1 ms wall (loader script 89.5 ms, binding clips to models 377.9 ms); 23 files, 25.5 MiB; 100 soldier binds 194.1 ms.

Summed per-file time (ms). Files load in parallel, so sums exceed wall time. Stall is time queued in the browser before the request went out (connection limit); queue wait is time between the last byte and the start of the parse (the main thread busy parsing other files).

| download (stall / transfer) | queue wait | Babylon parse | prepare (normals / palms) | clip convert | clip dispose | retarget | grip solve | sidecar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1872.6 (1307.4 / 565.2) | 21345.5 | 1483.0 | 196.6 (151.3 / 20.0) | 2.0 | 0.0 | 361.4 | 13.8 | 323.1 |

| kind | files | MiB | download | parse | prepare | convert | retarget | grips |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| model | 10 | 17.5 | 747.4 | 1259.6 | 180.4 | — | 361.4 | 13.8 |
| pack | 1 | 6.0 | 63.2 | — | — | 2.0 | — | — |
| weapon | 12 | 2.0 | 1062.0 | 223.5 | 16.1 | — | — | — |

Slowest files (download + wait + CPU work):

| file | kind | KiB | total | download | wait | parse | work |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ge-gunner.fbx | model | 1942 | 2060.3 | 106.7 | 1749.0 | 151.6 | 204.6 |
| ge-scout.fbx | model | 1797 | 1890.8 | 105.6 | 1639.5 | 92.3 | 145.7 |
| ge-engineer.fbx | model | 1910 | 1773.2 | 105.0 | 1526.3 | 88.4 | 141.8 |
| ge-captain.fbx | model | 1767 | 1666.5 | 79.8 | 1417.3 | 114.8 | 169.3 |
| p38.fbx | weapon | 186 | 1258.8 | 111.0 | 1125.2 | 21.8 | 22.6 |
| fg42.fbx | weapon | 179 | 1234.7 | 110.3 | 1106.7 | 16.8 | 17.6 |
| mg42-bipod.fbx | weapon | 175 | 1216.0 | 97.4 | 1100.8 | 16.9 | 17.8 |
| mg42.fbx | weapon | 175 | 1196.9 | 96.2 | 1083.6 | 16.2 | 17.1 |
| mp40.fbx | weapon | 180 | 1178.8 | 94.4 | 1062.6 | 20.9 | 21.9 |
| kar98k.fbx | weapon | 166 | 1155.9 | 86.3 | 1052.2 | 16.5 | 17.4 |
