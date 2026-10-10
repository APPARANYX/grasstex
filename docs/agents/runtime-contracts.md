# Runtime lifecycle and ownership contracts

This is a living contract for the **shipping** battlefield, not an independent second implementation. See `battle/module-registry.js`, `battle/battle-sim.js`, `battle/modules/00-fixed-step-clock.js`, and the #361/#430 regression harnesses. Use exact seed/command replay to justify changes.

## Registration, hooks, and error isolation

Battle modules register once through `BattleModules.registerSystem(id, spec)`. `runHook` executes a cached, lexicographically sorted system-ID list (not file discovery order) and catches/logs exceptions for each system, so one failing hook cannot prevent later systems from running. Hooks are optional; a system need not implement every entry.

| Hook | Authority and when it is invoked |
| --- | --- |
| `beforeBattleRestart(sim)` | Shipping `BattleSim.restart()` calls before old roster/mesh disposal and `spawnAll()`. The hook may release references to the previous battle; never erase the old roster before hooks can examine it. |
| `onBattleStart(sim)` | Initialized-battle lifecycle; system-local setup (invoked by owning startup integration). |
| `onBattleRestart(sim)` | Reset on a new battle/restart; systems may reinitialize caches and histories. |
| `onSimulationStep(sim,{dt})` | Called after each physical/AI `_frame` update; the `dt` belongs to simulation time. |
| `onCommanderTick(sim,payload)` | Commander integration; authoritative shared command order evolves at commander cadence, not render-frame cadence. |

Systems that implement hooks own the corresponding state. Teardown is dispose-observable-driven for soldier meshes, reaction-detached weapons, abandoned weapons and renderers; do not substitute a benchmark-only reset or pre-empty `_roster`/`factions`. Restart must remain deterministic for consecutive same-page battles (#430).

## Timing

- `BattleSim.AI_TICK = 0.15` simulation seconds. `_frame` advances physical movement by frame `dt`, then spends accumulated simulation time on AI decisions.
- `COMMAND_TICK` is three `AI_TICK` periods (0.45 simulated seconds), as defined by the commander owner.
- Normal live 1×/4×/8× remains **per-render-frame** physical movement. Do not accidentally enable the benchmark fixed clock on ordinary live runs.
- Explicit benchmark `BattleFixedStepClock` uses 0.15-second steps and at most `MAX_STEPS_PER_FRAME = 12` debt catch-up steps. `?fixedClock=all` is an *opt-in diagnostic override*; `?fixedClock=0` disables the clock.
- Any gameplay timer that changes AI, unit physics, orders, or wounds must consume **simulation time**, never `Date.now()` or `performance.now()`. Wall time is only for presentation/network/audio UI and profiling.

## `BattleSim.start` wrapper chain (issue #456 B2)

Module files load lexicographically before `battle/battle-control.js`. These start wrappers intentionally nest, preserving `oldStart(scene,opts)` and returning the same sim:

1. `00-fixed-step-clock.js` wraps core start and installs the benchmark clock; live observer unchanged unless specifically opted in.
2. `12-soldier-animation-events.js` wraps start to intercept fire/shot presentation and supply stripped-runtime fallback ammo events.
3. `98-damage-range.js` registers **only with `?damageRange=1`**; its wrapper creates the QA range after calling the previously captured start.
4. `battle-control.js` wraps last to install operator restart/telemetry/UI controls after the underlying start chain.

This order is fragile: changing file order or replacing `root.BattleSim.start` rather than wrapping can bypass reload animation, the fixed clock, damage range or operator restart. Any new wrapper must capture the preceding function once, call it exactly once, and return the same sim instance; never add a second physics step/movement writer. If the chain is redesigned, migrate all wrappers in one tested PR, not by reordering files.

## Ownership and non-goals

- Movement authority is the resolver and physical-navigation owners; observation probes must never emit new movement commands. A local waypoint arrival is not proof of progress to the actual squad mission.
- Tactical firing/stance, command reception/adoption and replay telemetry have established owners. Debug visualizations may observe but not advance simulation or influence targeting.
- The dedicated #430 same-page 600-second browser replay is **not** replaced by a static source grep. Keep its PR/manual workflow and run actual deterministic parity when touching restart ownership.
- The #361 nine-variant command lifecycle test is permanent in normal CI. The squad-local CAPTURE-starvation probe distinguishes real active contact/legitimate holds from a remote stalled mission.

## Test fixture mirrors

Several harness checks intentionally use *different literal commander-policy stubs* to model doctrinal boundary conditions. Those are not automatically duplication: preserve each exact set of values until the check is explicitly redesigned as a parameterized fixture. Deduplicate identical module-loading stacks and room geometry first, keep each test's doctrine assertions independent.

## Change gates

Before merging a lifecycle/clock/command change: run syntax + harness CI, same-page #430, applicable nine-variant #361, representative 900-second battle/causal checks and paired seeds for behavior-affecting changes. A passing observer fingerprint proves observer neutrality, **not** mission progress; use net displacement and objective closure separately.
