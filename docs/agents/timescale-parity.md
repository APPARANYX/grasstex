# Separate live playback from deterministic 0.15-second benchmark stepping

## Live page: legacy frame-driven clock at 1x / 4x / 8x

By default the battle page uses the **original** `BattleSim._frame()` observer and
the companion `BattleCommanderAI` observer. The fixed-step module is loaded but
**does not replace these observers or run on any live render frame**. This restores
the measured mobile behavior of `?fixedClock=0`, including the observer ordering.

- The browser frame delta is multiplied by `timeScale` then capped to
  **0.25 simulated seconds per rendered frame**. Positions and locomotion are
  updated every frame. At low FPS/high speed, excess wall-clock time is not
  replayed later; effective simulated speed may drop below the selected 4x/8x.
- **Important distinction:** the original `BattleSim._frame` still accumulates
  the scaled delta and evaluates squad/soldier AI in its existing **0.15
  simulated-second internal ticks**. Those decision ticks do not require
  movement/render frames to occur only every 0.15 simulated seconds.
- The companion original Commander observer integrates the same capped frame
  delta and schedules its 0.45 simulated-second decisions.
- `?fixedClock=0` remains an A/B baseline: it skips even the dormant clock
  object. With no extra flags, visible behavior is intentionally identical.
- No deterministic cross-FPS or cross-speed state fingerprint is promised for
  normal live playback. This is the historical, mobile-friendly compromise.

## Benchmarks: explicit deterministic fixed stepping

`battle/modules/00-fixed-step-clock.js` exposes `BattleFixedStepClock.create(sim)`
and attaches the **dormant** `sim._fixedClock` object to ordinary pages.
Benchmark/parity runners stop the browser render loop and call
`sim._fixedClock.advance(wallSeconds)` explicitly; that method retains the
fixed 0.15-second step and ordered Commander tick at 1x/4x/8x.

- Every completed fixed step advances `sim.step(0.15)` and then the Commander
  hook, matching deterministic replay order.
- At most 12 fixed steps execute per invocation; additional simulation time is
  retained in `stats.pendingSeconds` for later explicit benchmark advances.
- `clock.reset()` resets benchmark debt/counters. Pause, winner, and trainer
  ownership guards remain intact.
- `?fixedClock=all` is an **explicit debug opt-in** that installs the fixed
  observer in a live page, at every speed, so a person can witness the benchmark
  timeline. It is not enabled for normal play or mobile devices.
- A browser/device rendering benchmark without explicit fixed-cadence mode
  measures the **normal live clock**. Fixed-cadence and parity runners measure
  the **benchmark clock**. These results must not be conflated.

## Regression coverage

```sh
node tools/ai-sim-harness/fixed-step-clock-check.js
# Requires a local PHP server and Playwright:
node scripts/check_realtime_smoothness.cjs
PARITY_SCENARIO=meeting PARITY_SECONDS=600 node scripts/run_timescale_parity_benchmark.cjs
```

The fast clock unit test asserts 12-way fixed-step replay parity, ordered
Commander execution, pause, debt preservation, and restart. It additionally
asserts that ordinary 1x/4x/8x page observers match `?fixedClock=0` exactly,
while `?fixedClock=all` remains an explicit deterministic opt-in.

The real-page smoke test compares the old/default observer behavior at
1x/4x/8x on the same seed and virtual FPS, and verifies that the opt-in fixed
mode still takes 0.15-second steps. The 600-second parity workflow still
compares isolated benchmark-fixed runs with real firefights; it does **not**
assert live gameplay matches across frame rates. Each variant uses a fresh
browser page to avoid unrelated same-page restart contamination (Issue #430).

## Precision trade-off

Normal live playback prioritizes responsive movement and avoids catch-up spirals
on phones. Its existing 0.15s AI decision accumulator remains intact, but its
frame-based movement/clock can drop simulated time under slow frames. Benchmarks
retain fixed-step fidelity and deterministic timing at 1x/4x/8x. We deliberately
do not use synthetic benchmark parity to claim that the variable-frame live
path is bitwise deterministic.
