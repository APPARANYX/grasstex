# CPU performance report

**100 soldiers take 2.18 s median to execute 120 simulated seconds; 200 take 5.79 s.** This measures fixed-step simulation on one M1 host, not production FPS or a hardware-independent performance target. The larger roster uses the production reinforcement API; its different squad/spawn structure makes the 2.65× cost increase a scaling observation, not a controlled complexity proof.

[Raw runs](artifacts/profiles/runs.json.gz) preserve every tick duration, inclusive function total/call count/max, heap samples, Chrome performance metrics and final counters. [Derived summary](artifacts/campaign-summary.json) includes hot paths and sampled self time. CDP `.cpuprofile` files beside the raw runs open in Chrome DevTools and preserve call stacks. Large raw artifacts are gzip-compressed; decompress before opening CPU profiles in DevTools. Profile script: `node scripts/audit/profile-runtime.cjs`; `--load-only` appends the real 200-soldier workload after existing profiles.

Three plain and three wrapped runs alternate for each workload; one additional CDP-sampled run per workload. Same seed `runtime-profile`, 0.15 s fixed step, runtime-default stashed policy, rendering stopped, procedural animation. Runs execute serially after the battle batches. Timing clock resolution is approximately 0.1 ms; individual tiny hook timings are coarse. Full per-function latency histograms were not measured.

| Workload | Actual actors | Sim s/run | Plain median wall ms | Main-task delta median ms | Wrapper overhead | Step mean/p50/p95/p99 ms |
|---|---:|---:|---:|---:|---:|---|
| meeting | 100 | 120 | 2183.7 | 2371.0 | 9.3% | 2.88/2.85/3.80/4.50 |
| strategic | 100 | 180 | 4235.3 | 5090.3 | 9.8% | 3.65/3.70/4.90/5.50 |
| stress | 100 | 120 | 2195.7 | 2380.2 | 11.0% | 2.90/2.90/3.90/4.50 |
| load200 | 200 | 120 | 5790.3 | 6252.1 | 13.5% | 7.31/7.30/9.60/11.60 |

`stress` is the ineffective query control and remains at 100 actors. Tick distribution pools three plain runs (2400 steps for 120 s, 3600 for 180 s); it includes commander work when due. Main-task deltas are Chrome `TaskDuration` around the evaluation and include bridge/cleanup work; they are an approximation to browser main-thread CPU, not total CPU across renderer/GPU/driver/worker processes. No credible total-process CPU sum was obtained. No per-subsystem p99 is invented from max/mean aggregates. Inclusive entries overlap and percentages must not be summed.

The instrumentation penalty is real (~9–14%). CDP run wall times and raw heap deltas are provided separately; warm-up/JIT/GC and ordering mean these small samples do not identify an exact sampling-only overhead. First repetitions are slower. The wrappers preserve their captured final counters, but this does not prove hidden-state parity.

### meeting — median of three wrapped runs

| Entry point | Inclusive ms | Calls | Mean µs | Max ms | Wrapped wall % |
|---|---:|---:|---:|---:|---:|
| `simulation.step` | 2218.0 | 800 | 2772.50 | 5.30 | 93.0% |
| `simulation._frame` | 2217.9 | 800 | 2772.37 | 5.30 | 93.0% |
| `squad.updateSoldier` | 829.5 | 80000 | 10.37 | 0.90 | 34.8% |
| `squad.updateSquad` | 586.1 | 8000 | 73.26 | 1.80 | 24.4% |
| `modules.runHook` | 425.0 | 1066 | 398.69 | 1.60 | 17.8% |
| `movement-resolver.resolve` | 381.7 | 80000 | 4.77 | 0.90 | 16.0% |
| `navigation.nextWaypoint` | 200.1 | 80000 | 2.50 | 1.00 | 8.2% |
| `navigation.nextWaypoint.baseCacheReuse` | 200.1 | 80000 | 2.50 | 1.00 | 8.2% |
| `commander.update` | 166.7 | 266 | 626.69 | 1.50 | 7.0% |
| `navigation.nextWaypoint.physicalReuse` | 141.9 | 77234 | 1.84 | 1.00 | 5.7% |
| `navigation.movementClear` | 123.2 | 163097 | 0.76 | 0.60 | 5.1% |
| `system:soldier-personal-space.onSimulationStep` | 98.9 | 800 | 123.62 | 0.70 | 4.1% |
| `engagement.updateSoldier` | 93.6 | 80000 | 1.17 | 0.60 | 3.9% |
| `system:ai-timeline-recorder.onSimulationStep` | 88.5 | 800 | 110.62 | 1.20 | 3.7% |
| `navigation.nextWaypoint.physicalReplan` | 58.9 | 2766 | 21.29 | 0.70 | 2.5% |
| `system:soldier-individuality.onSimulationStep` | 41.7 | 800 | 52.13 | 0.80 | 1.7% |
| `system:squad-command.onCommanderTick` | 35.7 | 266 | 134.21 | 0.70 | 1.5% |
| `system:squad-forward-progress.onCommanderTick` | 33.7 | 266 | 126.69 | 0.70 | 1.4% |
| `system:ai-loop-watch.onCommanderTick` | 33.5 | 266 | 125.94 | 0.40 | 1.4% |
| `engagement.updateSquad` | 31.1 | 8000 | 3.89 | 0.60 | 1.3% |
| `obstacle.coverPotentialAt` | 24.7 | 79556 | 0.31 | 0.10 | 1.0% |
| `obstacle.nearby` | 24.0 | 62694 | 0.38 | 0.70 | 1.0% |

### strategic — median of three wrapped runs

| Entry point | Inclusive ms | Calls | Mean µs | Max ms | Wrapped wall % |
|---|---:|---:|---:|---:|---:|
| `simulation.step` | 4267.0 | 1200 | 3555.83 | 7.60 | 91.8% |
| `simulation._frame` | 4266.9 | 1200 | 3555.75 | 7.60 | 91.8% |
| `squad.updateSoldier` | 1617.9 | 120000 | 13.48 | 1.70 | 34.8% |
| `squad.updateSquad` | 964.3 | 12000 | 80.36 | 2.40 | 20.7% |
| `movement-resolver.resolve` | 935.8 | 117420 | 7.97 | 1.70 | 20.1% |
| `modules.runHook` | 775.1 | 1599 | 484.74 | 2.20 | 16.6% |
| `navigation.movementClear` | 702.8 | 213752 | 3.29 | 1.00 | 15.1% |
| `navigation.nextWaypoint` | 548.6 | 117420 | 4.67 | 1.40 | 11.8% |
| `navigation.nextWaypoint.baseCacheReuse` | 548.6 | 117420 | 4.67 | 1.40 | 11.8% |
| `navigation.nextWaypoint.physicalReuse` | 476.4 | 113419 | 4.20 | 1.40 | 10.2% |
| `commander.update` | 379.2 | 399 | 950.38 | 30.70 | 8.1% |
| `system:soldier-personal-space.onSimulationStep` | 176.8 | 1200 | 147.33 | 1.80 | 3.8% |
| `system:ai-timeline-recorder.onSimulationStep` | 141.7 | 1200 | 118.08 | 1.00 | 3.1% |
| `engagement.updateSoldier` | 139.2 | 117420 | 1.19 | 0.70 | 3.0% |
| `system:squad-forward-progress.onCommanderTick` | 82.3 | 399 | 206.27 | 0.90 | 1.8% |
| `navigation.nextWaypoint.physicalReplan` | 73.2 | 4001 | 18.30 | 0.70 | 1.6% |
| `system:soldier-individuality.onSimulationStep` | 67.5 | 1200 | 56.25 | 0.20 | 1.4% |
| `system:squad-command.onCommanderTick` | 61.7 | 399 | 154.64 | 0.80 | 1.3% |
| `system:ai-loop-watch.onCommanderTick` | 56.8 | 399 | 142.36 | 1.00 | 1.2% |
| `engagement.updateSquad` | 47.4 | 12000 | 3.95 | 0.60 | 1.0% |
| `system:voice-observations.onSimulationStep` | 27.8 | 1200 | 23.17 | 0.80 | 0.6% |
| `tactical-position.update` | 27.2 | 234840 | 0.12 | 0.10 | 0.6% |

### load200 — median of three wrapped runs

| Entry point | Inclusive ms | Calls | Mean µs | Max ms | Wrapped wall % |
|---|---:|---:|---:|---:|---:|
| `simulation.step` | 6226.3 | 800 | 7782.87 | 18.60 | 94.6% |
| `simulation._frame` | 6225.6 | 800 | 7782.00 | 18.60 | 94.6% |
| `squad.updateSoldier` | 2582.5 | 160000 | 16.14 | 2.00 | 39.3% |
| `squad.updateSquad` | 1422.9 | 16000 | 88.93 | 3.20 | 21.6% |
| `modules.runHook` | 1114.9 | 1066 | 1045.87 | 5.50 | 17.0% |
| `movement-resolver.resolve` | 1094.3 | 160000 | 6.84 | 2.00 | 16.5% |
| `navigation.nextWaypoint` | 430.6 | 160000 | 2.69 | 3.70 | 6.5% |
| `navigation.nextWaypoint.baseCacheReuse` | 430.6 | 160000 | 2.69 | 3.70 | 6.5% |
| `commander.update` | 343.4 | 266 | 1290.98 | 3.90 | 5.3% |
| `system:soldier-personal-space.onSimulationStep` | 321.0 | 800 | 401.25 | 2.60 | 4.9% |
| `navigation.nextWaypoint.physicalReuse` | 308.6 | 154415 | 2.00 | 3.70 | 4.7% |
| `system:ai-timeline-recorder.onSimulationStep` | 269.5 | 800 | 336.87 | 3.00 | 4.1% |
| `navigation.movementClear` | 266.6 | 317700 | 0.84 | 1.00 | 4.0% |
| `engagement.updateSoldier` | 218.8 | 160000 | 1.37 | 0.80 | 3.3% |
| `navigation.nextWaypoint.physicalReplan` | 115.7 | 5585 | 20.72 | 1.10 | 1.9% |
| `system:soldier-individuality.onSimulationStep` | 105.1 | 800 | 131.37 | 0.80 | 1.7% |
| `engagement.updateSquad` | 89.5 | 16000 | 5.59 | 0.80 | 1.4% |
| `system:squad-command.onCommanderTick` | 76.5 | 266 | 287.59 | 1.20 | 1.2% |
| `system:ai-loop-watch.onCommanderTick` | 70.8 | 266 | 266.17 | 2.50 | 1.1% |
| `system:squad-forward-progress.onCommanderTick` | 69.7 | 266 | 262.03 | 1.00 | 1.1% |
| `obstacle.coverPotentialAt` | 55.7 | 150318 | 0.37 | 0.90 | 0.8% |
| `obstacle.nearby` | 50.2 | 117254 | 0.43 | 0.70 | 0.8% |

## Measured opportunities

At 200 actors, sampled `publicRecord` in `18-command-reception.js:504` costs about 539 ms self time; `detectionRange` in `squad-ai.js:304` about 433 ms; `destinationFree` in `51-soldier-personal-space.js:108` about 254 ms. These are sampled costs in the CDP workload, not projected savings. Command-reception DTO construction/copying, repeated perception queries and personal-space candidate queries warrant narrowly scoped experiments with unchanged semantics. Preserve immutable/public snapshot contracts and cache invalidation. Do not remove command reception or navigation features.

Vehicle transport and aerial-recon hooks are small in the measured 180 s profile (about 14 ms and 4.7 ms inclusive), while movement resolution, squad/soldier work and hook observers are larger. This does not measure the worst interception combat phase. Order-provenance commander hooks are about 9–19 ms per run; no evidence supports deleting provenance to cure the main cost. Hook dispatch time includes all hooked systems and is not wrapper overhead alone.

## Rendering, memory and omissions

Separate five-second native-render CPU samples cover scene/FBX/animation/browser work before fixed-step runs. They include startup shader/texture compilation, idle time and SwiftShader driver calls; they are neither steady-state production render costs nor directly comparable to procedural simulation CPU. The existing full-fidelity runner measured 44 frames over 10.086 wall seconds with 100/100 FBX actors after 90 s simulated warm-up. Mean scene render cost was 187.56 ms/frame; simulation 5.70 ms/frame; FBX pose 1.70 ms/frame (45 pose observations). Frame CPU p50/p95/p99 was 209.71/245.49/670.02 ms, heavily dominated by software WebGL. That initial run exited 1 on five missing-private-audio page errors. The follow-up fixed media-fixture route precedence and the same full-fidelity assertions then passed; both original failure and fresh pass are preserved. The fresh pass used 100 FBX actors and recorded 31 frames over 15.023 s: mean scene render 77.29 ms, simulation 13.78 ms and pose 3.79 ms per observed frame. These short software-renderer samples vary substantially and do not establish a performance improvement. See [follow-up execution](artifacts/full-fidelity-followup/execution.json) and [raw measurements](artifacts/full-fidelity-followup/full-fidelity.json). See [raw full-fidelity output](artifacts/full-fidelity/full-fidelity.json). Do not infer a 60 FPS guarantee from these simulation timings.

Heap deltas and sampled GC are preserved, but no forced-GC retained-heap analysis or allocation-by-stack trace was obtained. Repeated procedural runs keep observer counts stable (114 legacy, 122 strategic, 214 for the reinforced load). Synchronous imported-model restarts initially appeared to accumulate observers; public lifecycle revalidation with actual rendered frames keeps total/active observers at 13 across three public restarts. Yielding alone did not drain the render-dependent cleanup. This is not a confirmed leak; see observer-retention.json.

Scheduling, collision/ballistics, terrain, objective hooks and observer work are represented by existing wrappers/CDP samples where active. Zero/absent timing rows mean unobserved or inaccessible work, not zero cost. Fixed-clock debt under long native rendering, worker/GPU time, driver attribution and every optional module's peak remain unmeasured.
