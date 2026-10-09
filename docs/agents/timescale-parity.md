# Live timescale parity (1x / 4x / 8x)

The live battle uses the same **0.15 simulated-second step** as headless
battle replays. The time multiplier changes how much simulated time enters
an accumulator per wall-clock second; it **does not** change step size.

- The live render observer lives in `battle/modules/00-fixed-step-clock.js`.
  It replaces only the battle core's variable-step render observer. Explicit
  `sim.step(dt)` calls used by the trainer and replay tools remain unchanged.
- Each completed simulation step first advances movement and soldier/squad AI,
  then the command hook runs; the General gets one tick per 0.45 simulated
  seconds (the same order as `scripts/run_probe.cjs`).
- At most 12 steps execute during one rendered frame. Work exceeding that
  budget remains as **pending simulated seconds** and drains on subsequent
  frames. It is **not thrown away**. On a slow device, the effective speed
  may fall below the selected 4x or 8x until it catches up.
- `sim._fixedClock.stats` exposes `stepSeconds`, `pendingSeconds`,
  `lastSteps`, `backloggedFrames`, `totalSteps` and `stepLimit`.
- Pause does not add wall-clock time. Restart clears pending work. Changing
  1x/4x/8x retains the fractional remainder of simulation time.
- `?fixedClock=0` restores the previous variable-step render clock
  (and legacy command observer), for emergency comparison only.

## Evidence

```sh
node tools/ai-sim-harness/fixed-step-clock-check.js
# Requires a local battle PHP server and Playwright:
PARITY_SCENARIO=meeting PARITY_SECONDS=120 node scripts/run_timescale_parity_benchmark.cjs
```

The `⭐ Timescale Parity Benchmark` workflow runs real-battle state
fingerprints for meeting, US-defense and German-defense seeds, comparing
against the current 0.15s fixed-step headless baseline. Each scenario checks
1x/4x/8x with virtual 20/30/60/120fps cadence. Any difference in gameplay
state is a failure, even if win counts agree.

The full-fidelity performance benchmark's `FF_CADENCE` mode now also goes
through the live accumulator, so CPU measurements include catch-up costs.

## Deliberate limitations

This patch does **not** change combat or physical tick precision: movement
continues at 0.15 simulated seconds per step. Increasing physical precision
to 0.05s needs a separate balance and performance study because it can alter
navigation, firing and casualties. The presentation system (animation,
projectiles, audio, wall-clock timers) is not itself a deterministic
subframe interpolator; 1x rendering can display noticeable stair-stepping,
and visual effects do not promise exact cross-speed equality. The guarantee
here is a shared simulation-step sequence, provided gameplay code reads only
simulation time for gameplay decisions.
