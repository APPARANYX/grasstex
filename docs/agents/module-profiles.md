# Battle module loading profiles (#456 R4)

The PHP entrypoints `battle_sim_local.php` (production/local) and `battle_sim.php` (GitHub-ref fallback) **still discover every module** in sorted order. Discovery, checksums, deployment and the full set of available debug tools are unchanged.

For ordinary battles, script tags omit **only eight opt-in/stashed presentation modules**: six retired AI graph editor panels (`30-ai-graph-editor`, `31-ai-graph-logic`, `33-ai-graph-usability`, `34-ai-timing-map`, `37-lease-panel`, `38-ai-diagnostics-export`) and the opt-in `97-device-benchmark` and `98-damage-range`. These have no gameplay authority. **The rest of the module directory is always loaded**, including `32-ai-loop-watch`, `36-order-provenance`, `39-navigation-physicality-debug`, `40-ai-coordination-health`, `40-world-debug-overlay`, `41-squad-status-overlay`, `97-ai-timeline-recorder` and `99-session-diagnostics-export`. Some of those names sound optional, but actually guard routes, expose strategic stall signals, enable HUD features or preserve core diagnostics: do not filter them based on their names.

| URL parameter | Loaded extra modules |
| --- | --- |
| No parameter | All gameplay and always-on observability; skips only 8 gated presentation/QA files |
| `?editor=ai` | Restore all six AI graph editor/panel modules |
| `?bench=1` | Restore in-page FPS/performance QA (`97-device-benchmark`) |
| `?damageRange=1` | Restore damage-range visual QA and its optional `BattleSim.start` wrapper |
| `?devModules=1` | Restore **all** discovered modules in their original ordering |

Hash-only links to the former graph panel should be changed to `?editor=ai#ai-graph` if that editor is ever unstashed. The default behavior of the existing stashed graph editor is unchanged. The exact local-PHP fixture reports **82 production modules versus 90 with all development tools included**. The default still includes every known physical-navigation, timing, command, HUD and diagnostics owner.

This is a conservative first payload split, *not* the full originally estimated 9,525-line / 22% removal: the remaining diagnostic modules have gameplay, reporting or operator dependencies and need separate dependency-proof and browser parity before exclusion.

The first profile split is intentionally bounded: retaining the navigation-physicality module is mandatory after the #361 wall-oscillation fix, and retaining coordination health is mandatory while the strategic stall policy consumes its clocks. Other seemingly visual modules remain until their owners and default-user settings have browser parity tests.

`tools/ai-sim-harness/module-load-profile-check.js` exercises real PHP HTML generation for every profile, asserts the default is exactly all known modules minus those eight, and refuses to lose important gameplay/diagnostic owners. Preserve this gate while splitting future groups.
