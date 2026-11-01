# Battle module loading profiles (#456 R4)

The PHP entrypoints `battle_sim_local.php` (production/local) and `battle_sim.php` (GitHub-ref fallback) **still discover every module** in sorted order. Discovery, checksums, deployment and the full set of available debug tools are unchanged.

For ordinary battles, script tags omit **only twelve opt-in/stashed presentation and QA modules**: six retired AI graph editor panels (`30-ai-graph-editor`, `31-ai-graph-logic`, `33-ai-graph-usability`, `34-ai-timing-map`, `37-lease-panel`, `38-ai-diagnostics-export`), the opt-in `97-device-benchmark`, and the five-file damage-range group (`97z-damage-range-lifetime`, `97z-damage-range-panel`, `97z-damage-range-session`, `97z-damage-range-view`, `98-damage-range`). These have no gameplay authority. **The rest of the module directory is always loaded**, including `32-ai-loop-watch`, `36-order-provenance`, `39-navigation-physicality-debug`, `40-ai-coordination-health`, `40-world-debug-overlay`, `41-squad-status-overlay`, `97-ai-timeline-recorder` and `99-session-diagnostics-export`. Some of those names sound optional, but actually guard routes, expose strategic stall signals, enable HUD features or preserve core diagnostics: do not filter them based on their names.

| URL parameter | Loaded extra modules |
| --- | --- |
| No parameter | All gameplay and always-on observability; skips the 12 opt-in presentation/QA files |
| `?editor=ai` | Restore all six AI graph editor/panel modules |
| `?bench=1` | Restore in-page FPS/performance QA (`97-device-benchmark`) |
| `?damageRange=1` | Restore the five-file damage-range group, including its opt-in `BattleSim.start` wrapper |
| `?devModules=1` | Restore **all** discovered modules in their original ordering |

Hash-only links to the former graph panel should be changed to `?editor=ai#ai-graph` if that editor is ever unstashed. The default behavior of the existing stashed graph editor is unchanged. The October 11 full-head PHP fixture reports **97 ordinary modules versus 109 with all development tools included** (after FBX and damage-range helper extraction). The module counts change when source owners split; the test asserts the discovered set and the exact opt-in difference rather than permanently pinning these counts. The default still includes every known physical-navigation, timing, command, HUD and diagnostics owner.

This is a deliberately conservative payload split, *not* the original estimated 9,525-line / 22% removal. The original #460 change saved 164,408 uncompressed source bytes (9.5% at that revision). Further exclusions require proven absence of gameplay, operator and reporting dependencies plus same-page browser parity; the original 22% estimate is not a safe acceptance threshold. The October 11 R5 extraction added opt-in range helpers without increasing the default gameplay module load.

The first profile split is intentionally bounded: retaining the navigation-physicality module is mandatory after the #361 wall-oscillation fix, and retaining coordination health is mandatory while the strategic stall policy consumes its clocks. Other seemingly visual modules remain until their owners and default-user settings have browser parity tests.

`tools/ai-sim-harness/module-load-profile-check.js` exercises real PHP HTML generation for every profile, asserts the default is exactly all known modules minus those eight, and refuses to lose important gameplay/diagnostic owners. Preserve this gate while splitting future groups.

## Retained-module dependency disposition

The debug-sounding files below are **not** candidates for a name-based exclusion. Preserve them in the ordinary profile until an independent owner replaces their live behavior:

| Module | Why the ordinary battle retains it |
| --- | --- |
| `32-ai-loop-watch.js` | AI loop and stall observation; not just a hidden editor panel |
| `36-order-provenance.js` | Order trace / command reception provenance and reportability |
| `39-navigation-physicality-debug.js` | Actual physical-navigation constraints and routes, despite its suffix |
| `40-ai-coordination-health.js` | Active coordination/stall clocks consumed by strategic recovery |
| `40-world-debug-overlay.js` | Operator world-debug visualization; default HUD/overlay availability retained pending opt-in UX proof |
| `41-squad-status-overlay.js` | Default live squad-status display and player HUD context |
| `97-ai-timeline-recorder.js` | Battle timeline evidence/export continuity |
| `99-session-diagnostics-export.js` | End-of-battle diagnostics and capture/export continuity |

The permanent profile check asserts these eight remain present, verifies both PHP loaders know the twelve optional owners and tests default, editor, device-benchmark, damage-range and all-debug pages. R4 is accepted **only as a conservative safety boundary** if these gates remain green; neither the original 22% estimate nor removal of active observability is a deliverable.
