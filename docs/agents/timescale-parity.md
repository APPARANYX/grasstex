# Live timescale parity (4x / 8x; 1x is per-frame)

Fast live playback (above 1x) uses the same **0.15 simulated-second step** as
headless battle replays. The time multiplier changes how much simulated time
enters an accumulator per wall-clock second; it **does not** change step size.

**Real-time playback (1x, and slower) is deliberately not on the fixed step.**
It keeps the original per-frame variable step, so soldiers move every rendered
frame. Stepping 0.15 s at a time showed as visible stair-stepping at 1x
(a position update every ~9 frames at 60 fps), where a person is actually
watching. Benchmarks and parity diagnostics still use the fixed step at every
speed (see below).

- The live render observer lives in `battle/modules/00-fixed-step-clock.js`.
  It replaces only the battle core's variable-step render observer. Explicit
  `sim.step(dt)` calls used by the trainer and replay tools remain unchanged.
- `clock.frame(wallSeconds)` is the live entry point. At `timeScale <= 1` it
  runs `sim._frame(min(0.25, wall * scale))` then the commander tick, exactly
  what the pre-clock observers did. Above 1x it calls `clock.advance()`, the
  pure fixed-step accumulator that benchmarks and parity tools drive directly.
- Changing speed is lossless in both directions. Dropping to 1x first drains
  any fixed-step backlog, then folds the sub-step remainder into the first
  per-frame dt; going up simply starts accumulating.
- `?fixedClock=all` (or `clock.fixedAtRealtime = true`) forces the fixed step
  at every speed. Use it when a live page must reproduce the benchmark
  timeline at 1x.
- Each completed simulation step first advances movement and soldier/squad AI,
  then the command hook runs; the General gets one tick per 0.45 simulated
  seconds (the same order as `scripts/run_probe.cjs`).
- At most 12 steps execute during one rendered frame. Work exceeding that
  budget remains as **pending simulated seconds** and drains on subsequent
  frames. It is **not thrown away**. On a slow device, the effective speed
  may fall below the selected 4x or 8x until it catches up.
- `sim._fixedClock.stats` exposes `stepSeconds`, `pendingSeconds`,
  `lastSteps`, `backloggedFrames`, `totalSteps`, `stepLimit` and
  `smoothFrames` (per-frame 1x frames).
- Pause does not add wall-clock time. Restart clears pending work. Changing
  1x/4x/8x retains the fractional remainder of simulation time.
- `?fixedClock=0` removes the clock entirely and restores the previous
  variable-step render clock (and legacy command observer) at every speed,
  for emergency comparison only.

## Evidence

```sh
node tools/ai-sim-harness/fixed-step-clock-check.js
# Require a local battle PHP server and Playwright:
PARITY_SCENARIO=meeting PARITY_SECONDS=600 node scripts/run_timescale_parity_benchmark.cjs
node scripts/check_realtime_smoothness.cjs   # live 1x per-frame, 4x fixed step
```

The `⭐ Timescale Parity Benchmark` workflow runs real 600s firefights
for meeting, US-defense and German-defense seeds, comparing the fixed 0.15s
benchmark against six representative 1x/4x/8x × 20/30/60/120fps cases.
**Every comparison uses a fresh browser page**; reusing a page and restarting
the battle has independently observed squad/buddy-pair timing drift even when
both runs use identical 0.15s stepping. This is a separate restart-isolation
issue, not evidence against timescale parity. The unit test covers the full
12-way speed/FPS grid. Any difference in isolated gameplay state fails; every
full-length baseline must emit fire events.

The full-fidelity performance benchmark's `FF_CADENCE` mode now also goes
through the live accumulator, so CPU measurements include catch-up costs.
Both it and the parity benchmark call `clock.advance()` directly, so they stay
on the fixed step regardless of the live 1x routing.

Live 1x smoothness is covered by the clock unit test (`frame()` advances the
sim every rendered frame at <=1x, stays on the fixed step above it, and drains
backlog on a speed drop) and by `scripts/check_realtime_smoothness.cjs`, a
real-page check on a virtual 60 fps clock. It reports the share of frames in
which a moving soldier's position changes: 85% at default 1x (bit-identical to
`?fixedClock=0`) against 10% with `?fixedClock=all`, with the median per-frame
jump 0.065 m against 0.58 m; 4x stayed on 0.15 s steps.

## Deliberate limitations

Live 1x is **not** guaranteed to reproduce the 4x/8x or benchmark timeline: it
steps with the frame delta, so its result depends on the device's frame rate
(as it did before the clock). Use `?fixedClock=all` when a 1x live run has to
match the benchmark.

This patch does **not** change combat or physical tick precision: movement
continues at 0.15 simulated seconds per step in the fixed-step paths.
Increasing physical precision to 0.05s needs a separate balance and
performance study because it can alter navigation, firing and casualties. The
presentation system (animation, projectiles, audio, wall-clock timers) is not
itself a deterministic subframe interpolator; 4x/8x (and `?fixedClock=all` at
1x) can display stair-stepping, and visual effects do not promise exact
cross-speed equality. The guarantee here is a shared simulation-step sequence,
provided gameplay code reads only simulation time for gameplay decisions.
