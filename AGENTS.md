# AGENTS.md

The single working guide for this repo. Every other doc was folded in here except
`battle/AI_TACTICS_OUTLINE.md` (tactical doctrine from MCDP 1-3 / MCTP 12-10B / MCWP 3-35.3),
which is design reference; read it when the task is about tactics, not plumbing. The full
original docs (roadmaps, lab notes, measurements) are in git history at `1a5b0cf`.

## Working rules

- **Don't create new plan/roadmap/summary `.md` files.** Update this file only when a command,
  contract or rule actually changes. Findings go in the commit message or PR body. Open issues
  hold the current state and the next step, not run-by-run logs: cite the PR that has the numbers.
- **State success criteria up front, prove them with a harness below, report the output.**
  Never claim visual/browser validation that wasn't performed.
- **Keep probes.** A one-off measurement script is a probe: commit it as `scripts/probes/<name>.js`
  (run with `scripts/run_probe.cjs`) or extend a close-up tool (`closeup.cjs` for a posed soldier,
  `closeup_battle.cjs` for one in a fight), never leave it in `/tmp`.
- **Browser probes run against the preview, not a local server.** Push the branch and point the
  script's URL variable (`CLOSEUP_URL`, `CULL_URL`, `BF_URL`, …) at
  `https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>` (query flags pass through). It has
  the real textures and hosting and loads far faster than `php -S` under SwiftShader, where the ground
  renders red. Use the local server only for what the preview can't serve: an unpushed tree, a
  `git worktree` A/B, or a change to `battle_sim_local.php`.
- **Stay in scope.** Don't touch audio, assets or animation unless asked. Unnamed uploads: ask
  what they are and where they belong.
- `main` deploys to production on every push. Put anything visual on a `work/**` or `preview/**`
  branch first (that publishes a preview; see Deploy), or open any branch in the live preview
  launcher (`https://test.ivandpopov.com/grasstex/preview.php?ref=<branch|PR#>`).
- **After a branch you worked on merges, read the run summaries** before calling it done:
  **Branch housekeeping** (deleted, or kept and why: commits pushed after the merge never reached
  `main`, so open a PR for them) and **Deploy Battle Runtime to 50webs** (the `build-v<N>` it shipped, and
  that it passed). Report both. Push further work to a fresh branch from `main`, not the merged one.

## What's here

| Area | Entry points | Status |
| --- | --- | --- |
| **Battle Sim** (WW2 squad-AI lab, 50v50 US vs GE) | `battle_sim.php` → `battle/battle_sim.html`; runtime in `battle/*.js`, `battle/modules/NN-*.js` (auto-discovered, load in numeric order) | Active. Proving ground for systems that later move to `ww2fps`. |
| Grass renderer | `game.html`, `grass-api.js`, `grass-streaming.js`, `grass-realism.js`, `grass-effects.js`, `terrain-demo.js`, `terrain-baked.js` | Ported to `ww2fps`; grass is **off** unless `?grass=1` or `window.GRASS_SIM_ENABLED=true`. |
| Terrain bake | `tools/terrain-bake/` | Prototype. |
| Learning/telemetry backend | `battle_learning.php`, `battle_policy.php`, `battle_log*.php`, `battle_metrics.php` ("What We Learned" page) | Active. The page no longer reads or writes the policy and learning endpoints: the genome is stashed (below). |
| FBX Motion Lab | `labs/fbx-animation-lab.html` (calibration workbench), in-page **Motion Lab** button | Previews clips; measures hand/weapon contacts and saves per-model sidecars the game loads. |

In the page: a load overlay (`BattleLoading`, in `battle_sim.html`) shows each boot phase (runtime
scripts, scenario, terrain, soldiers/weapons/clips, cover, navigation and squads); the FBX backend
reports per-file progress to it. **Start Battle** unpauses and unlocks audio (iOS needs the gesture).
`window.__battle__` is the live `BattleSim`. HUD buttons: World Debug, Motion Lab. **The AI Graph workbench
is stashed** (modules 30-38, until the UI pass): it does not define `BattleAIGraphEditor`, the gate every
graph module checks, so there is no AI Graph button, Macro ON/OFF button, Leases panel, Loop Watch / Order
Trace panel or export button, and `?editor=ai` / `#ai-graph` open nothing. What sat behind them still runs:
`BattleCommanderAI.setMacroEnabled`, `BattleLeases`, Loop Watch and `BattleOrderProvenance` collection, and
`BattleDiagnosticsExport.snapshot(kind)`. It comes back once the whole AI system is complete, and then it
should mirror the layers and their mapping visually (the layer table under M3C: who owns what, what flows
down and up), not the old policy-node view alone.
**The policy genome is stashed with it**, on the same switch (`STASHED` in `ai-policy.js`; the editor, the
trainer and the Genome v2 Training button read `BattleAIPolicy.stashed`). Force Command's doctrine and IF/THEN
rules and the Squad Leader's eight tuning numbers (`cfg()` in module 16, through
`BattleCommanderDoctrine.policyFor`) run on the code defaults in every environment, whatever
`state/ai-policy.json`, the scenario memory or a match's own genome says: the revision reads 0, and `set`,
`setMatchPolicies`, `refresh`, `persist` and `remember` do nothing and never touch the network. Until then a
battle depended on data outside the repo (the live genome, r14 on 2026-09-29, differed from the defaults in
22 of 28 values and in its rules), so no phase of the AI rewrite had one baseline to measure against.
Benchmarks label the policy `stashed-defaults`. Edges: the Node harness does not load `ai-policy.js`, so its
doctrine runs the `FALLBACK` tables (the same numbers, but `rules: []`, so a brief there is always `assault`);
`objectiveHoldWin` is a genome value nothing reads; the "Training review" link stays.
**Once the whole AI system rewrite is finished, rewrite the genome** (what it parameterises, what it should
leave to the layers, one owner per number) before flipping the switch back; do not revive the old one as it
stands.
URL flags: `?seed=`, `?defender=us|ge`, `?soldiers=rifleman`, `?smooth=0`, `?animLod=0` (pose every soldier every frame), `?mergeWalls=0` (draw each building wall piece separately), `?soldierLod=0` (every soldier at full mesh detail), `?soldierCull=0` (draw soldiers outside the view too), `?clipPack=0` (parse every clip from its FBX instead of the prepared pack), `?fastRetarget=0` (retarget clips with the old matrix loop), `?cloneBounds=1` (Babylon's skinned bounds when cloning a soldier), `?farHz=<n>` (re-pose soldiers beyond 100 m at n Hz, default 10), `?boneTextures=1` / `=0` (force bone matrices through a texture per skeleton / shader uniforms; default: uniforms where the GPU has room), `?weaponInstances=0` (a cloned weapon mesh per soldier), `?tracerPool=0` (a new line mesh per tracer, as before the pool), `?fxPrewarm=0` (build muzzle flashes, tracer lines and decals on first use, as before), `?perfTimings=1`, `?bench=1` (device benchmark, below). Behaviour A/B flags (they change the battle; for paired benchmarks only, via the standard benchmark's `query` input): `?perception=0` (perception before #55: no view cone or sector scan, nothing heard or relayed), `?geScout=carbine` (German scouts on the generic 250 m carbine instead of the FG 42), `?mind=0` / `?mind=observe` / `?mind=react,aim,hesitate,shock` (soldier condition, module 17: off; state kept but nothing reads it; only the levers named; default all).

## Test harnesses

All of these run offline in seconds unless noted, and all pass on `main`.

**Node sim checks** (`tools/ai-sim-harness/`). They load the shipping sources with no Babylon and
no browser. CI runs every `*-check.js` plus `run.js` across 8 seeds.

```bash
for c in tools/ai-sim-harness/*-check.js; do node "$c" || break; done
for s in 12345 1 2 3 5 8 13 21; do HARNESS_SEED=$s node tools/ai-sim-harness/run.js >/dev/null || echo "seed $s FAIL"; done
```

| Check | Asserts |
| --- | --- |
| `run.js` | Engagement contract: orient before firing, cover used, get down in contact, a squad in contact stops marching, suppression pins, no stance churn, 10v10 resolves. `HARNESS_SEED=<n>` swaps the battle. |
| `engagement-state-check.js` | Engagement declares every stored state and legal transition, preserves the distinct legacy effects of drill, urgent-cover, shared-contact and station-release entries, and rejects illegal requests. |
| `squad-phase-check.js` | Squad Leader command phases are declared as data behind one transition function; setup/regroup remain silent, mission changes retain their telemetry, and mutations cannot add another writer. |
| `macro-state-check.js` | Macro brief lifecycle (`issued → executing → terminal`) has one owner; ordinary and repeated assembly acceptance keep their legacy clocks/events, and terminal records stay immutable. |
| `state-ownership-check.js` | Static ownership ratchet for Engagement state/clocks, Squad Leader `commandPhase`, and Macro brief/status, including alias/bracket/mutation APIs and only the two guarded setup fallbacks. |
| `objective-nav-check.js` | Real worst-seed defects: never permanently refused a step at a building, no all-squads-one-objective, a side attacks at most 2 objectives at once yet every objective is attacked once the efforts before it fall, capture progress survives an interrupted hold, door/window routing, `stepMovement` aim smoothing |
| `tactical-positions-check.js` | Window/hardpoint reservation ownership, ingress routes, release reasons, diagnostics |
| `cover-positions-check.js` | Cover-slot selection against obstacles and physical footprints |
| `personal-space-check.js` | Physical endpoint allocation and body separation |
| `fireteam-frontage-check.js` | Each fireteam holds its own ground: published fireteam anchors stay ≥5 m apart while squads march, deploy and fight |
| `formation-backward-check.js` | While a squad advances, no formation destination lies >3 m behind both the man and his fireteam's forward line: a team's anchor follows the team forward when its men ran ahead of a held squad anchor, at fireteam renewal and when a teammate falls |
| `movement-recovery-check.js` | Recovery episode state machine, goal resets, unreachable criteria, retreat override |
| `movement-state-check.js` | Resolver/movement-progress state for bounds and assault |
| `lean-runtime-check.js` | Squad-plan stability + resolver + tactical route with no extra modules |
| `macro-command-toggle-check.js` | Macro OFF suppresses Force Command while downstream hooks still run |
| `map-pipeline-check.js` | Scenario regeneration publishes the same geometry as a page load (benchmarks once ran 10-70x slow on 4x the hedges) |
| `sight-query-check.js` | Pruned geometry queries answer exactly as unpruned: `sightBlocked` (crossed cells, first hit) vs nearest-hit `sightBlocker`, and `movementClear` with vs without wall bounding boxes, on real scenarios |
| `impact-fx-check.js` | Impact materials, hole kind per surface, decals on terrain/wall face, wound decals on the hit bone, exit spray, sheet-cell UVs, FX budgets, restart cleanup (render stub) |
| `loadout-check.js` | `ROLES` carries no weapon, `SquadAI.loadoutFor(role, faction)` is the only place a role picks one and returns a copy, the default table deals what the roles carried before (a battle is unchanged), a dealt squad wears the loadout's kind and the side's profile |
| `sidearm-check.js` | Module 47: a man with a holstered sidearm draws it inside `NEAR` when his primary is jammed, reloading or empty, or inside `CLOSE` when it is a long gun (an SMG is not clumsy), takes the primary back after `HOLD` past `LEAVE` or when the pistol is dry; the draw costs `DRAW` before the next shot and unemplaces an MG, a jam survives the draw and is cleared at a cost on return, no combat-RNG draw, no stance write, no sidearm means no change |
| `weapon-wound-check.js` | Side-specific weapons (Garand/Kar98k, M1919A6/MG42, Thompson/MP40, M1 Carbine/FG42 with the scout's reach following his weapon), bursts at the cyclic rate, the FG42 automatic only inside `autoWithin`, sustained rates, a burst stops when the belt runs dry, hit zones from the ray, head/chest/leg/arm wound outcomes, bleed-out, drop odds per zone and cartridge, a rifle round through one man into the next (less energy, deflected) and a pistol round stopping |
| `world-debug-check.js` | World Debug overlay UI handlers (DOM stub) |
| `extension-order-check.js` | No module replaces `SquadAI.tryFire`/`areaFire`/`updateSoldier`/`updateSquad` or `BattleEngagement.updateSoldier`; the declared fire order (ammunition → ballistics range → trigger-time LOS) holds; undeclared extensions throw |
| `genome-gate-check.js` | The stashed genome is the code defaults: a hostile server genome, scenario memory or per-match genome changes nothing (revision 0; Force Command's doctrine and the Squad Leader's tuning numbers read the defaults); `set`, `setMatchPolicies`, `refresh`, `persist` and `remember` do nothing and never call `fetch`; the trainer does not load; only `ai-policy.js` reads `BATTLE_AI_POLICY`, `BATTLE_AI_MEMORY` or `.aiGenomes`; the genome's defaults and the doctrine module's `FALLBACK` agree (bar the unread `objectiveHoldWin`); with the switch flipped the same inputs DO take effect (the control). |
| `lease-check.js` | `BattleLeases` primitive, tactical-plan and regroup lease lifecycles, regroup re-forms on the rally point |
| `reconstitution-check.js` | Retreated squads home and out of contact reaching 10 survivors group (fewest squads; none planned en route), march to the rally point, merge under one leader (promotion never picks the gunner), get re-tasked; below-strength groups dissolve; Macro OFF does nothing |
| `regroup-axis-check.js` | A man behind the regroup anchor is a trimmable straggler, never an outrunner (the regroup keeps the direction the squad was marching), men ahead or to the side still block, and a regroup whose only scattered man is behind ends on `cohesion restored`, not on the clock; swept over march directions (main fails it) |
| `succession-check.js` | A killed leader is replaced by the most senior survivor after the 6 s `succession` lease, never more than one leader, the gunner only as the last man, successors replaced in turn, no lease on a led or wiped-out squad, seniority order |
| `perception-check.js` | View cones (120° focus at full range, ±100° periphery shorter, behind only within 10 m), head turn toward the squad's known threat, a sector scan while holding still with no known threat, contact relayed to a friendly squad within 50 m (first-hand only, keeps its age), enemy gunfire heard within 120 m with a distance-scaled position error, own sightings outrank both, no combat-RNG draws |
| `crest-fire-check.js` | Permission to fire tests the round's own line: over a crest that shows the head but would take the round (or a narrow crest between sight samples) he still sees the man but pulls no trigger; on open ground or over a lower crest he fires; the gate draws no combat RNG |
| `voice-determinism-check.js` | Voice callouts never draw from the combat RNG: a battle is identical with and without voice |
| `local-steering-check.js` | `stepMovement`'s soft steering (`steerAroundObstacles`, loaded from `battle-sim.js`; the harness stubs it out of `stepMovement`): a man bounding to a wall's cover slot between two tactical circles reaches it, the circles his destination hugs never push him, avoidance deflects but never turns him round, and it still steers round an obstacle on the way elsewhere |
| `stance-ownership-check.js` | Engagement is the only stance writer: no other runtime file sets `prone`/`tacticalCrouch`/`crawling`/`crouching` (the body's `setCrouch`/`setProne` and SquadAI's no-Engagement fallback aside), `stepMovement` only shows the committed stance, `BattleEngagement.requestStance` only takes a man lower, and an advancing man is crouched while his squad is in contact or he is under fire |
| `soldier-mind-check.js` | Soldier condition (module 17): a friend down is felt by distance, line of sight past 8 m and squad (not by enemies, the far or the blind), the leader down by the whole squad within 60 m, suppression/wounds/aimed rounds add stress (rounds by range), decay with the leader, cover and company calming and being under fire slowing it, contagion never past the neighbour, stress in [0, 1], band hysteresis, levers neutral when off, the module writes only `mind`, and a full firefight with it observing is the same battle (end state and combat-RNG draws) as one without it |
| `soldier-mind-behaviour-check.js` | What stress costs a man: recognition (`reactTime`, the orient window, the re-orient) stretches, the shot group widens, an ordered bound waits (never past the 3.6 s window, forgotten with the order), a shocked man does not fire, halts and crouches if only advancing, and starts no bound; each lever neutral when off and separately switchable |

`harness.js` loads the shipping `stepMovement()` from `battle/battle-sim.js` with render stubs.
Navigation is optional via the harness battle's `_movementRoot`; ordinary combat checks omit it. `bootstrap()` returns the loaded globals for throwaway probes. Write
assertions about mechanism, not dice outcomes, and sweep `HARNESS_SEED=1..40` before trusting a
new check.

**M3C ownership checks** (`scripts/check-*.cjs`). Not in CI, so run them when touching command or movement ownership:

```bash
for c in scripts/check-*.cjs; do node "$c" || break; done
```

These are `macro-mission-command` (brief lifecycle; honours `GRASSTEX_SOURCE_ROOT=<checkout>` for
negative-control runs against another tree), `meso-formation-frame-stability`,
`meso-micro-movement-ownership`, `movement-order-ownership` and `physical-waypoint-refill`.

**Browser smoke + screenshot.** Proves the page boots and the sim runs. Playwright is installed
globally here; don't run `playwright install`.

```bash
mkdir -p /tmp/www && ln -sfn "$PWD" /tmp/www/grasstex
php -S 127.0.0.1:8765 -t /tmp/www >/tmp/php.log 2>&1 &
node scripts/smoke_battle_page.cjs          # SMOKE_SEED, SMOKE_SECONDS, SMOKE_OUTPUT=shot.png
```

Hosted textures 404 when served locally, so the ground renders red. That's expected. Scripts below
default to this local URL; run them against the branch preview instead (see Working rules).

**Visual checks: keep these, don't rewrite them.** Look at a change on the live host rather than a
local red-ground page, and reuse these harnesses instead of writing one-off probes:

- **Open any branch live:** `https://test.ivandpopov.com/grasstex/preview.php?ref=<branch|#PR|GitHub URL>`
  (see CI and workflows). The link follows the branch head. It carries the branch's own models, clips,
  weapons and effect sprites, so new decals or FBX show up.
- **Close-ups in a real fight:** `scripts/closeup_battle.cjs` runs a battle in fixed 0.15 s steps
  until a soldier matches `CLOSEUP_TARGET` (`casualty`, `wounded`, `any`, `role:ge/gunner`, `id:<n>`),
  pauses, and photographs him from `CLOSEUP_VIEWS` (`front,left,back,top,right,wide`). Output is
  `<view>-<id>.png` plus `summary.json` (hp, wounds, casualty zone, weapon, FBX or not, and `timings`
  per phase). It blocks telemetry, learning and policy writes, so it's safe against production and
  previews. A live run takes ~1 min. Page build is ~20 s, the sim fast-forward is ~5 s for two minutes
  of battle, and software rendering is ~0.3-0.6 s a frame. Clips run on sim time, so it renders only
  6 settle frames and 1 per view. `Math.random` is seeded from the seed, but a rerun can still match a
  different man at a different time (seen 2026-09-28), and decal variants drawn on async timers
  differ, so it is for looking, not for before/after comparisons (see Before/after pictures). Env: `CLOSEUP_URL`, `CLOSEUP_SEED`, `CLOSEUP_COUNT`,
  `CLOSEUP_AFTER` (sim seconds after the match, default 1.5), `CLOSEUP_DIST`, `CLOSEUP_WAIT`,
  `CLOSEUP_OUT`, `CLOSEUP_UI=1`.
  ```bash
  CLOSEUP_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' CLOSEUP_TARGET=wounded \
    CLOSEUP_OUT=out/closeup node scripts/closeup_battle.cjs
  ```
- **Close-ups of one posed soldier:** `scripts/closeup.cjs` puts any `faction/role[/weapon.fbx]` in
  any Motion Lab pose at any time, alone in its own scene, through the game's FBX backend at a fixed
  30 Hz, from `front`/`side` (or `right`)/`back`/`left`/`three-quarter`/`top`, framed on
  `body`/`hands`/`weapon`. Use it for a hold or a clip. Use `closeup_battle.cjs` for anything the
  fight itself causes (wounds, death falls, stance under fire). `Math.random` is seeded, so the same env
  gives the same frames, death clips included. Env: `CLOSEUP_SOLDIERS`, `CLOSEUP_POSES`, `CLOSEUP_TIMES`,
  `CLOSEUP_VIEWS`, `CLOSEUP_FRAMING`, `CLOSEUP_SIDECAR`, `CLOSEUP_OUT`, `CLOSEUP_URL`. Writes PNGs and
  `summary.json` (clips, two-hand state, support error).
- **Damage decals themselves:** `scripts/closeup_damage_fx.cjs` shoots the newest decal of each kind
  (wound, exit, pool, spray, masonry, wood, dirt, metal) along its surface normal, plus a
  `summary.json` of wounds by zone and decals by kind; works against a `preview.php?ref=` URL.
  `scripts/preview_decal_sheets.cjs` checks the sprite sheets themselves (no server).
- **Interactive damage range:** add `?damageRange=1` to a normal battle/preview URL. It freezes combat
  AI and lays out one US shooter plus US/GE rifleman, sergeant, scout, gunner and engineer targets on
  a raised inspection deck. The range uses the shipping FBX models, weapon presentation, hit/death
  animation bridge and impact/UV-wound system; Fire itself does not alter HP, while **Kill** is
  explicit so wounds can accumulate before a death pose is inspected. Controls in the page select
  target and zone, entry-only vs through-shot, single/3-shot, auto cycling, orbit, FPS aim, clear and reset.
  FPS aim puts a UniversalCamera just in front of the shooter's face/chest line, shows a centered reticle,
  and sends shots through the reticle: body hits are classified into head/chest/abdomen/arm/leg while a
  miss paints the backstop. Drag/touch or the right stick aims; changing target/zone recenters the reticle.
  The panel is docked off-center and collapsible; `rangeAuto=1` starts with the compact panel unless
  `rangeUi=full` is supplied (`rangeUi=compact` forces compact mode). Keyboard: Space fire, arrows
  target, 1-5 zone, F FPS aim, E exit, O orbit, A auto, C clear. Xbox/standard gamepad: A fire,
  RT also fires in FPS aim, X 3-shot, D-pad left/right target, D-pad up/down zone, Menu toggles FPS,
  Y auto, B clear, LB exit, RB orbit, right stick aim/orbit, LT ADS in FPS, R3 kill, View toggles the panel.
  URL setup: `rangeTarget=0..9`, `rangeZone=head|chest|abdomen|arm|leg`, `rangeExit=0|1`,
  `rangeAuto=0|1`, `rangeInterval=<seconds>`, `rangeOrbit=0|1`, `rangeDist=<metres>`,
  `rangeUi=full|compact`, `rangeFps=0|1`.
  **V1 closeout:** PR #103 adds the off-centre/collapsible UI, Xbox controls, FPS aim/reticle and
  preview-launcher pass-through for every range flag.
- **Every model with its weapon, plus the Motion Lab poses:** `scripts/fbx-soldier-lineup.cjs`
  (see Soldiers, weapons, animation).
- **Pistol support hand numbers:** `scripts/probe_pistol_cup.cjs` (see the replay table below).

In a cloud sandbox Chromium sees the proxy's CA, so launch with `--ignore-certificate-errors`
(these scripts do). Otherwise Babylon never loads from the CDN and `__battle__` never appears:
the symptom is a `waitForFunction` timeout after 180 s, not an error. A new Playwright script
needs the flag in `chromium.launch` args; `ignoreHTTPSErrors` on the page alone is not enough.

**Before/after pictures (pixel A/B of a presentation change).** Learned the slow way (PR #86):
- **Use `closeup.cjs` (posed soldier), not `closeup_battle.cjs`.** The fight close-up is not
  deterministic across page loads here: the same build and seed matched a different soldier at a
  different sim time on a rerun, so its differences prove nothing either way. `closeup.cjs` is
  seeded and steps at a fixed 30 Hz, so the same env gives the same bytes.
- **Put the old and new code behind a URL flag** (as `?cloneBounds=1`, `?fastRetarget=0`,
  `?soldierLod=0` do) and run the same tool against both URLs from one checkout. Comparing two
  trees also works: serve a `git worktree` of `main` at `/tmp/www/<name>` and drop a
  `preview.json` in its root (and one in yours), or `battle_sim_local.php` serves `/grasstex/`'s
  runtime for both. Never commit those `preview.json` files.
- **Run a control first:** the same URL twice. If the control differs, the tool is not
  deterministic for that case and an A/B means nothing.
- **Compare with `scripts/compare_screenshots.cjs <dirA> <dirB>`** (byte-identical, else the share
  and box of differing pixels; decodes in Chromium, as there is no Python imaging library here).
- Keep a run small (a few soldiers, poses and views): each image renders under SwiftShader.
- **A script that pauses the battle must wait for Start first:** its click handler awaits the audio
  unlock and then calls `battle.resume()`, so a pause set right after `startBtn.click()` is undone
  a moment later (wait until `startBtn.hidden`). Let the first few renders after a fast-forward play
  out too: effects the steps queued on wall-clock timers keep appearing (`probe_soldier_cull.cjs`).

**Deterministic replay / profilers** (Playwright; each takes a URL variable, point it at the branch preview):

| Script | Use |
| --- | --- |
| `scripts/run_m3c_replay.cjs` | One seed, fixed step, full diagnostic JSON. `M3C_SEED`, `M3C_URL`, `M3C_OUTPUT`, `M3C_MACRO=off`. Use for paired before/after comparisons. `M3C_RENDER_EVERY=<n>` renders a frame (sim paused) every n steps so the FBX pose code runs; `M3C_PERF=on\|off` sets the timing switch below. An on/off pair must end identically. |
| `scripts/benchmark_full_fidelity.cjs` | Full-fidelity browser benchmark: real FBX soldiers, weapons, clips and rendering; fails on a failed FBX load or any procedural soldier. Startup phases and per-file timings, then `FF_SECONDS` (60) rendered after `FF_WARMUP` (90) fast-forwarded sim seconds: FPS, CPU, render, sim, pose per layer, draw calls, GPU where supported. Writes `full-fidelity.json` + `.md` to `FF_OUT`. `FF_URL`, `FF_SEED`, `FF_TIMESCALE` (4), `FF_VIEWPORT`, `FF_GPU=1`, `FF_ISOLATE=0`, `FF_QUERY` (e.g. `animLod=0`), `FF_CADENCE=60` (a virtual 60 Hz clock so per-frame numbers describe a 60 FPS device; wall FPS is then meaningless). Served cross-origin isolated for 5 µs timers. SwiftShader numbers are a CPU-only baseline; the headless benchmark stays the AI regression benchmark. |
| `scripts/run_battle_benchmark.mjs` | N headless battles. `BATTLE_BENCHMARK_COUNT/SEED/URL/STEP/TIME_LIMIT/OUTPUT`. `merge_battle_benchmarks.mjs` merges shards. |
| `scripts/profile_battle_hotpaths.mjs` (+ `battle-hotpath-profiler.cjs`) | Inclusive wall time per hot function. `BATTLE_PROFILE_SEED/TYPE/SECONDS`. |
| `scripts/profile_meso_churn.mjs` (+ `meso-churn-profiler.cjs`) | Meso fireteam order churn attribution |
| `order-ingress-`, `physical-point-`, `movement-goal-transition-`, `resolver-order-mutation-profiler.cjs` | Inject-only observers: who proposes orders, destination provenance, goal transitions, resolver mutations. They never change behaviour. |
| `scripts/battle-benchmark-intent.cjs` | Shared benchmark predicates (targetless/route-active) |
| `scripts/closeup_damage_fx.cjs` | Damage FX close-ups (see Visual checks); on the UV-wound preview it fails on page errors or any FBX wound that falls back from the private UV paint path, and records UV-map/skin-anchor diagnostics in `summary.json`. `CLOSEUP_OUT` (default `closeups/`, gitignored), `CLOSEUP_SEED`, `CLOSEUP_SHOTS`, `CLOSEUP_SIM`, `CLOSEUP_BODY`, `CLOSEUP_DIST`. 5-10 min under software WebGL. |
| `scripts/preview_decal_sheets.cjs` | Contact sheet of `Assets/effects/decals/*.png` over surface-like backgrounds with the 4 x 4 grid and row names; check a regenerated or painted sheet before it ships. No server. `DECAL_PREVIEW_OUT`. |
| `scripts/probe_pistol_cup.cjs` | Motion Lab pistol support cup at a fixed 60 Hz: cup gap (cm), degrees the left arm is bent off the clip, and hand jerk (deg/frame², solved vs the clip's own) per clip. `CUP_SIDECAR=<model>.fbx.json` (a server sidecar; they are never committed), `CUP_CLIPS`, `CUP_SERIES=1`. |
| `scripts/probe_bocage_preview.cjs` | Live generated bocage scale/occlusion: tallest runtime prism, min/max visible height, a 1.55 m standing line that must block and a line above the top that must clear; saves JSON + a focused screenshot. `BOCAGE_URL`, `BOCAGE_SEED`, `BOCAGE_OUT`. |
| `scripts/probe_lod_shadows.cjs` | Animation LOD vs shadows: adds a directional light and ShadowGenerator, aims a narrow camera at one soldier's shadow with him out of view, and checks he is held with no caster, posed as a caster, held when the shadow falls away, posed under a caster predicate, and that off-screen culling disables his meshes exactly when he is held. `LODSHADOW_URL`. |
| `scripts/probe_merged_walls.cjs` | Merged building walls: loads one seed with and without `?mergeWalls=0` and checks building meshes and draw calls, total vertices, world bounds, and a town screenshot from one camera with the HUD hidden (fails above `MW_MAXDIFF`, 0.2% of pixels). `MW_URL`, `MW_SEED`, `MW_OUT`. |
| `scripts/probe_soldier_mesh_lod.cjs` | Soldier mesh LOD: each model's full and far triangle/vertex counts, and one posed soldier (after ~20 s of battle) shot at full detail and on the far list from `SMLOD_DIST` metres at the iPhone canvas size, side by side (`d<m>m.png`, full \| far) with the share of differing pixels. Tune `meshLod.far` from these. `SMLOD_URL`, `SMLOD_SEED`, `SMLOD_VIEW`, `SMLOD_OUT`. |
| `scripts/probe_bench_census.cjs` | Device benchmark's draw-calls-by-kind census vs Babylon's measured draw calls, with weapon instances on and off (`?weaponInstances=0`): instanced weapons must count once per source mesh. `BC_URL`, `BC_SEED`, `BC_SECONDS`, `BC_WARMUP`, `BC_TOL`. |
| `scripts/probe_bench_follow.cjs` | Device benchmark `benchCam=follow`: samples the chase camera while it measures (active camera, distance to its target, living soldiers within 45 m of the eye), screenshots it, and checks the page camera comes back. `BF_URL`, `BF_SEED`, `BF_SECONDS`, `BF_WARMUP`, `BF_DIST`, `BF_OUT`. |
| `scripts/probe_follow_camera.cjs` | Normal-play persistent visual-QA camera: verifies `?follow=1` holds a fixed close bearing and `?orbit=1` implies follow + auto-orbit, while tracking a living soldier at the requested `followDist`. `PFC_URL`, `PFC_SEED`, `PFC_DIST`, `PFC_SPEED`, `PFC_OUT`. |
| `scripts/probe_damage_range.cjs` | Interactive damage-range regression: boots `?damageRange=1`, verifies the stationary 10-man role lineup + selected-target camera, fires the shipping FX path, requires UV-only 512² wound accumulation with one private map per wounded soldier, checks Clear, then explicit death. `DR_URL`, `DR_SEED`, `DR_OUT`. |
| `scripts/probe_soldier_cull.cjs` | Off-screen soldier culling: a paused combat frame from the overview and chase cameras (12/25/45 m, 8 bearings, high and ground-level) rendered cull on, on again (control), off, on; every image must be byte-identical. Reports draw calls on vs off. `CULL_URL`, `CULL_SEED`, `CULL_WARMUP`, `CULL_VIEWPORTS`. |
| `scripts/probe_rotation.cjs` | Rotating the phone after load: fires `resize`/`orientationchange` before the viewport rotates and swallows the late real `resize` (the iOS order), then checks the canvas drawing buffer matches its box, portrait → landscape → portrait. `main` before the fix stays stale (the negative control). `ROT_URL`, `ROT_SEED`, `ROT_PORTRAIT`, `ROT_LANDSCAPE`, `ROT_SETTLE`. |
| `scripts/probe_weapon_instances.cjs` | Weapon instancing: draw calls with and without `?weaponInstances=0` over the armies, and inside the instanced page each weapon's world matrix and a close-up against a temporary clone on the same socket (same frame, so exact). `WI_URL`, `WI_SEED`, `WI_OUT`, `WI_MAXDIFF`. |
| `scripts/probe_clip_pack.cjs` | Loads the page with `?clipPack=0` and as shipped, each in a fresh context: every converted and every model's retargeted clip must be bit-identical, and the shipped load must fetch no clip FBX. Reports the soldiers phase, FBX parse and clip bytes each way. `CLIPPACK_URL`, `CLIPPACK_OUT`. |
| `scripts/probe_retarget.cjs` | Quaternion retarget vs `?fastRetarget=0` (matrix), each load in a fresh context: worst difference in every model's rotation and position samples, clip speeds and strides, and solved grips, plus retarget time each way. Fails above `RT_MAX_ROT`/`RT_MAX_POS` (1e-5). `RT_URL`. |
| `scripts/probe_soldier_load.cjs` | Per URL, a fresh load: soldiers that wear their FBX model vs procedural, body build and bind time, and the load phases. `SL_FAIL=<asset path fragment>` aborts that request: the page must show its load error and build no procedural soldiers. `SL_URLS` (comma-separated, for a before/after), `SL_WAIT`. |
| `scripts/probe_gait_clips.cjs` | Which FBX locomotion family (walk/run/sprint/crouch/crouchRun) each sim gait actually plays, at what rate, plus each model's natural clip speeds (in-place clips: foot stride). `GAIT_URL` (default production), `GAIT_SEED`, `GAIT_SECONDS`, `GAIT_OUT`. |
| `scripts/probe_ai_graph_stash.cjs` | Are the AI Graph and the genome really stashed: loads the page under test, and optionally a control page that still has them (`STASH_CONTROL_URL`), and reads the DOM (`aiGraph*` / `ag*` ids, the AI Graph button, the Genome v2 Training button), the eight graph globals, the HUD buttons (World Debug and Motion Lab must stay) and the runtime under the graph (Macro switch API, `BattleLeases`, `BattleOrderProvenance`, `BattleDiagnosticsExport.snapshot`). The page under test also loads with `?editor=ai` and `#ai-graph` and runs a few seconds of battle, then (last, on a page about to close) tries a hostile `BattleAIPolicy.set()` and `setMatchPolicies()`: while stashed the genome must read revision 0, be the defaults, and leave `policyFor` at the default 34 m cohesion radius. The control makes the negatives mean something: it must have the graph, its `?editor=ai` must open the panel, and the same hostile calls must take effect. `STASH_URL`, `STASH_CONTROL_URL`, `STASH_EXPECT=present` for when the graph and genome return, `STASH_SEED`, `STASH_SECONDS`, `STASH_OUT`. |
| `scripts/probe_genome_gate_mutants.cjs` | Mutation test of `genome-gate-check.js`: 15 mutants in a private temp copy of `battle/` (the server genome, the scenario memory, a per-match genome, `set`, `refresh`, `persist`, `remember`, the exported flag, the switch itself, the trainer loading, two second doors around `ai-policy.js`, the two copies of the defaults drifting), each of which must make the check fail. A missing anchor means the source text changed: update the anchor, never drop the mutant. About 5 s. |
| `scripts/run_probe.cjs` + `scripts/probes/*.js` | Observe-only probes on full benchmark battles (0.15 s step, procedural rig). `PROBE=<name>[,<name>]`, `PROBE_BATTLES=<type>:<seed>,…` (default one standard seed per type), `PROBE_SECONDS`, `PROBE_OUTPUT`, `PROBE_CONTROL=1` (also runs each battle without probes and fails if the end state differs). Serve with `PHP_CLI_SERVER_WORKERS=4 php -S …` or page loads stall. Probes: `station-occupancy` (bodies vs reservations at firing stations), `close-pairs` (who the <0.9 m pairs are, and the rate after formation/facing changes; `crossTeamFormation` classes each different-fireteam `formation+formation` onset by time, formation, gap between the two slots, lateral order and on/off slot: colliding slots are an allocation problem, men >3 m off their slots are in transit), `regroup-episodes` (every `regroup` lease: end reason, order anchor and destinations vs the rally point), `stall-wakes` (each strategic-stall wake: repeat, and whether another objective was open), `damage` (rounds by weapon, wounds by zone and outcome, and of body hits the share that went through, struck a second man or flew on), `fire-gates` (per role: trigger pulls, target distance bands, and the first fire condition that fails while a man holds a target), `backward-orders` (new destinations behind the man's fireteam line or behind the man himself while the squad advances, by producer and phase, and `behindAndBackBy` producer | reason | suppressed; for formation orders `formationCause` (team anchor moved or unchanged, man ahead of or on his team line), `formationKind` (formation vs prepared post) and `formationExamples` with the anchor's and the man's offset from the team line; a producer label can lag the resolver's final destination, so check `publishedToDestM` before blaming formation), `move-stalls` (the standard benchmark's soldier-movement stall, with `_movementStopReason` and the order kind), `bound-episodes` (every Engagement `bound`: duration, how it ended, distance to its cover at the end; bounds that never arrive), `spawn-slots` (per squad, the first minute: frame turn from the first fireteam order to 3 s, contact onsets and how many cross fireteams), `stance-churn` (shown stance changes per man-minute by writing file, A→B→A bounces under 1 s, trigger pulls within `AIM_SETTLE` of a change, prone spells shorter than `PRONE_HOLD`), `regroup-axis` (regroup ticks whose forward axis collapsed, and men behind the anchor scored as outrunners), `sidearm` (draws and returns by reason, rounds by weapon kind, men with the sidearm in hand), `perception` (acquisitions by angle band and by what the squad already knew; first contact per squad by source; mid-fight re-acquisitions: a squad blind ≥5 s that regains contact, by source and gap; acquisitions by a man standing still whose squad knew of nobody), `experience` (what a man lives through: aimed rounds by range, suppression spells, comrades falling within 12/25 m, leader distance, isolation, cover), `mind` (soldier condition on real battles: band shares overall, per role and faction and for men in contact, who reached which band, what added the stress, shocks and hesitations, stress percentiles). Arms from `git worktree`s: serve each at `/tmp/www/<name>` with a `preview.json` (`{"ref":"local"}`; an empty object reads as no marker) or its page silently runs `/grasstex/`'s runtime, and set `PROBE_URL=http://127.0.0.1:8765/<name>/battle_sim_local.php`; compare worktree arms with each other, not with `/grasstex/` (preview mode reads state from two directories up). |

**Persistent visual-QA camera** (`battle/camera-controls.js`, presentation only): normal battle/preview URLs may use
`?follow=1` for a close ArcRotate chase camera (default `followDist=10` m). `?orbit=1` implies follow
and continuously circles the tracked soldier; `orbitSpeed=.22` is radians/sec and may be negative,
while `followHeight=1.05`, `followBeta=1.18`, and `followAlpha=-1.5708` are optional framing
controls. The camera follows the busiest living soldier initially and transfers to the nearest living
soldier 3 sim seconds after death. It reads presentation transforms only and never writes simulation
state. The user can still drag to change bearing/elevation and wheel to zoom. This is separate from
the benchmark-only `benchCam=follow` camera.

**Device benchmark** (`modules/97-device-benchmark.js`, inert without the flag): open the page with
`?bench=1` on any phone or computer, tap **Start benchmark** and keep the tab in front. It
fast-forwards `benchWarmup` (60) sim seconds to contact, plays `benchSeconds` (60) with the normal
render loop and reports (result v7): FPS (median, mean, 5%/1% lows); frame, CPU, render, sim and
pose time; GPU time where the browser has a timer query; device and renderer; the load breakdown;
where `scene.render` goes (hooks by name, active-mesh evaluation, `Skeleton.prepare`, draw,
unattributed); draw calls by kind; frame pacing (refresh rate, share of frames taking 1, 2, 3…
refreshes); and the 10 worst frames, with the meshes created just before each. **Copy results** /
**Download JSON** (nothing is uploaded; also `window.__deviceBench`). Flags: `benchCam=close` (the
biggest group from 90 m, the touch camera's limit), `benchCam=follow` (a chase camera `benchFollow`
(25) m from a man in the biggest group, onto the nearest living man 3 s after he falls; the result
records who and how many switches), `soldierCull=0` (cull before/after), `benchHide=soldiers[,weapons,decals,hedges,terrain,objectives,walls,cover]`
(stop drawing those kinds, to cost them on a device with no GPU timer), `benchAuto=1` (no tap),
`animLod=0` (LOD before/after). This is how real devices are measured; `benchmark_full_fidelity.cjs`
is the scripted equivalent.

**Runtime timing switch** (`modules/53-fbx-soldier-backend.js`, observe only, no sim writes or RNG draws):
`BattleAssetTimings.snapshot()` gives the load overlay's phase times, and per FBX file the download
(browser stall and transfer), queue wait, Babylon parse, prepare, clip conversion, retarget, grip solve
and sidecar fetch, plus per-soldier bind, totals and the 10 slowest files. It is on by default.
`BattlePoseTimings` times `applyPose` per frame and per soldier, split into setup, base, overlay,
dials, weapon, aim and support layers, and counts how often each layer's inputs changed since it last
ran. It is off by default and measures nothing until turned on. `?perfTimings=1` or
`window.BATTLE_PERF_TIMINGS=true` turns both on; `=0`/`false` turns both off.

**Preview launcher:** `python3 scripts/check-preview-launcher.py` runs offline with PHP/cURL and a concurrent local HTTP fixture. Checks runtime reuse, the rolling download queue, integrity failures and publication. `preview.json` records `runtimeReused` and `runtimeDownloaded`; only changed runtime files download, with matching copies taken from production or earlier launcher previews.

**Repo-wide checks** (match CI):

```bash
python3 scripts/validate_voice_manifest.py     # voice manifest resolves
python3 scripts/check_audio_manifest.py        # every clip referenced and present
python3 scripts/check_deploy_coverage.py       # deploy plan covers every page runtime
python3 scripts/check_deploy_safety.py         # deploy never deletes/overwrites sidecar JSON, lab or unmanaged server files
node scripts/check_clip_pack.cjs               # prepared-clips.bin matches the clip FBX, CLIPS and the converter
for r in scripts/recipes/*.json; do python3 scripts/slice_weapon_shots.py "$r" --check-only; done
bash scripts/normalize_audio.sh Assets/audio && git diff --quiet -- Assets/audio   # needs ffmpeg
```

## CI and workflows

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` | PR, push to main | Syntax (JS/PHP/Py/sh/JSON), audio library, sim regressions (all harness checks + 8 seeds), deploy plan + deploy safety + prepared clips current |
| `deploy-50webs-php.yml` | push to main | Stamps `build-v<N>`, reruns checks and the deploy-safety check, uploads by content hash to production |
| `deploy-50webs-preview.yml` | push `work/**`, `preview/**` | `https://test.ivandpopov.com/grasstex/preview/<slug>/battle_sim.php`; never touches prod, makes no telemetry/learning writes; its `mirror --delete` skips JSON and lab files |
| `preview.php` (on the host, not a workflow) | `?ref=<branch>`, `#47`, or a GitHub branch/PR URL | Stages that commit's `battle/` runtime from GitHub into `preview/ref-<sha12>/` with the host's own loader and opens it (same preview contract, no writes). Only this repo's branches and same-repo PRs (a PR uses its head commit, so merged ones still open); keeps the 12 most recent. Branch FBX, clips, weapons and `Assets/effects` PNGs come too: files identical to production are hard links, and new ones download (≤300 MB). A branch that changes `battle_sim_local.php` still needs the Actions preview. Optional `state/github-token.php` (`<?php return '<token>';`) lifts the 60/h API limit. |
| `battle-benchmark-standard.yml` | tag `standard-benchmark-*` or dispatch | 10 workers × 10 = **100 battles**: the routine 60 meeting / 20 US-defend / 20 GE-defend checkpoint. Dispatch input `query` adds page flags to every battle (e.g. `perception=0&geScout=carbine`) so A/B arms run on one commit with one seed; a flagged run is never published as the record. |
| `battle-benchmark.yml` | tag `benchmark-*` or dispatch (source must be on main) | 30 workers × 10 = **300 battles**, 100 per type. Major milestones only. |
| `battle-hotpath-profile.yml` | dispatch (type/seed/seconds) | Hot-path profile on one seed |
| `branch-housekeeping.yml` | PR merged; Mondays; dispatch (`dry_run`, default on) | Deletes a merged PR's head branch unless it moved past the merged commit or another open PR uses it; the sweep deletes branches with every commit already in `main` (`git cherry`), no open PR and a tip ≥7 days old. Never `main`/`benchmark-results`; unmerged branches are only listed in the run summary. |
| `tripo-model-sync.yml` | dispatch | Tripo FBX export via `scripts/tripo_models.py` (needs the `TRIP_API` secret) |

Benchmark battles are 600 simulated seconds at a fixed 0.15 s step. Results go to the
`benchmark-results` branch.

**Benchmarks run on GitHub, never locally.** Dispatch `battle-benchmark-standard.yml` on the branch
and on `main` with the same `seed` input for a paired comparison. A branch run publishes only an
artifact and the run summary. Local Playwright runs are for probes and single-seed replays only.

## Battle Sim architecture: M3C (Macro / Meso / Micro Combat)

**Prime rule: one owner per responsibility.** Fix a bad behaviour at the layer that owns it. Don't
stack cooldowns, blockers, retries or extra movement writers to make one counter improve. A fix is
good if the system is easier to explain afterwards.

`General (Macro) → Squad Leader (Meso) → Engagement → Movement Resolver → Movement Execution → Navigation`.
Intent flows down and status flows up. No layer rewrites another's state.

| Layer | Owner (file) | Owns | Must not |
| --- | --- | --- | --- |
| Macro: Force Command | `commander-ai.js`, `commander-doctrine.js`, `commander-routes.js` | `_macroMission` brief {intent, action, objectiveId, point, flank leg, status}, `targetObjective`, `commandRole`, force allocation, reserves | write `commandPhase`/`objective`/route legs, cover, slots or soldier destinations |
| Meso: Squad Leader / Squad Command | `modules/16-squad-plan-stability.js` (`executeMission`, `fireAndMovement`; SquadAI's `squadCommand` owner) | stable squad plan: fireteams, formation, order anchor, fire and movement (assault authorisation, bound cycle and team), corner pauses, defensive posts, regroup, the forward line (`sq._forwardLine`), objective phase; the only writer of `commandPhase` (setup states it through `initialPhase`) | do obstacle avoidance; republish orders every tick |
| Micro: Engagement | `engagement.js` (+ `modules/44-combat-urgency.js` drills on its `afterDrill` slot) | per-soldier state machine, stance (`prone`/`crawling`/`tacticalCrouch`), permission to fire, combat proposals to the resolver, the squad contact report (`inContact`, base of fire, pinned) | write final destination; pick objectives; decide squad bounds |
| Perception + shared primitives | `squad-ai.js` | who sees whom (view cones), what a squad hears and is told (`squadSenses`), shot resolution, shared `squad.contact`, `areaFire` suppression; hosts the declared extension points (`SquadAI.extend`) and `BattleLeases`; a status-only squad update when no `squadCommand` owner is loaded | set stance/destination in combat |
| Soldier condition | `modules/17-soldier-mind.js` | `soldier.mind` (stress, band, shock) and the `squad.mind` roll-up: what suppression, wounds, casualties, leadership and company do to a man; the four modifiers Engagement and the shot model read | write stance, destination, target or another layer's timer; draw the combat RNG |
| Tactical positions | `modules/20-building-hardpoints.js` (`BattleTacticalPositions`: `claim`/`current`/`station`/`release`) | window/hardpoint reservations `assigned→ingress→occupying→holding→released`, committed ingress route | |
| Tactical routing | `modules/52-survival-tactical-route.js` | safe ingress, suppressed cover detours | resurrect an obsolete objective |
| Movement Resolver | `movement-resolver.js` | **sole normal-runtime writer of `soldier.destination`**; coalesces Engagement's per-tick combat requests and arbitrates Meso vs Micro proposals | act as a garbage collector for redundant producers |
| Diagnostics | `modules/36-order-provenance.js` (writer provenance, fast setters, 1.6 s in-place sampler), `32` Loop Watch, `43` forward progress, `99` the one diagnostics exporter (full, loops and orders via `BattleDiagnosticsExport.snapshot(kind)`; `38` only adds its AI Graph buttons) | observe only: removing them leaves a battle identical (~4% wall time) | change gameplay |
| Navigation | `battle-navigation.js`, `modules/39-navigation-physicality-debug.js` | doors, stations, pathfinding, 0.45 m body legality | assign or release tasks |
| Personal space | `modules/51-soldier-personal-space.js` | local physical correction | own commands |

The Squad Leader declares its 11 execution phases in `BattleSquadStability.states`; setup,
mission execution and regroup all enter through `transitionPhase`. A replacement brief may select
any phase, so legality comes from the mission/route/lease guards rather than a restrictive phase-only
adjacency. Retreat remains `sq.state`, not a `commandPhase`.

Brief lifecycle: `issued → executing → completed | invalid | failed | superseded`. The General
wakes only on: initial brief, mission complete or invalid, reserve due, a defence request that
changes the task, an objective vacated or changing control on a defend brief, a 120 s strategic
stall, a Squad Leader `doctrine-review` escalation, or a merge (`squad-reconstituted`). Wakes are
exported under `macroCommand`. `commander-ai.js` declares the lifecycle as `missionStates`; every
write, including a Squad Leader acceptance request, goes through `transitionMission`/`acceptMission`.
Terminal records cannot reopen; a new issue creates a new brief object.

**Main effort** (`commander-doctrine.js` `chooseObjective`, Macro only). Saturation (55 per squad past
an objective's allowance) stops a side piling onto one objective; the frontage limit stops it spreading
over all of them. A side attacks at most `maxEfforts` (2) objectives it does not hold at once; opening
another costs `frontageCost` (140), so the next squad reinforces an open effort. Taking an objective
closes its effort. Defending owned objectives doesn't count. A strategic-stall wake closes the
efforts its stalled capture briefs were on: each costs `stallCost` (150) and no longer fills the
frontage, so the side masses on new objectives (`commander-ai.js` `stalledEfforts`; outcomes under
`macroCommand.state.stallOutcomes`). All three are scores, never vetoes.

**Reconstitution** (`commander-ai.js` `reconstitute`, Macro only). A retreating squad's Squad Leader
walks it home (`_assembly` `to-base`); home and out of contact it is `at-base`. Only `at-base` squads
form the pool, so no group is planned for a squad still on its way. When the pool holds 10+ survivors
the General groups the fewest squads that reach 10 (never splitting one), picks the objective it will
send them to next (`chooseObjective`, strongest squad as reference) and gives each a `reconstitute`
brief to a rally point on the approach to it: on the spawn line 30 m forward, in line with the
objective, clamped to the side's lanes (centre of the home points if there is no objective). The
brief carries it as `plannedObjectiveId`, never `targetObjective`, so a retreating squad is not counted
at the objective; after the merge the General sends the squad there unless it changed hands
(`to-rally`, `SquadAI.retreatGoal`).
Once all are there the General merges them: the strongest squad with a living leader survives,
otherwise the most senior survivor is promoted (ex-leader, rifleman, scout, gunner last). The re-formed
squad has `leaderId`, `establishment` 10 and only living members; absorbed squads are `disbanded`.
Command is `SquadAI.leaderOf`/`isLeader`, never a role check. **Succession** (Squad Leader,
`updateSuccession`): a squad whose leader is killed is leaderless for the 6 s `succession` lease
(leaderless cohesion/corner rules, 0.8 accuracy), then `SquadAI.mostSenior` (sergeant, rifleman,
scout, gunner last; lowest id breaks ties) takes command and slot 0 and the penalty ends. At a merge
the most senior surviving leader commands.

**Ranks.** The squad leader is the `sergeant` role (US Staff Sergeant, GE Unteroffizier); the Meso
layer is the Squad Leader (`squad-leader`: `squadCommand` owner and lease owner). "Captain" is only
the company echelon in `00-battle-sides.js`. Names that stay `captain*` on purpose, because stored or
exported data uses them: the policy keys `captainlessCohesion`, `cornerNoCaptainExtra`,
`captainDead` (server genomes, `battle_policy.php`), the telemetry and wake names
`decision-captain-request` and `captain-request`, the export keys `captainAlive`, `captainRequest`,
`captainWindowAssignments` and `captainlessSamples`, the module file and system id
`13-captain-command-throttle`, and the trait seed in `11-soldier-individuality.js` (it still hashes
`captain` so existing seeds replay the same battle).

**Perception** (`squad-ai.js`, `SquadAI.PERCEPTION`). A man spots at his full stance-scaled range
inside ±60° of where he looks, at 35% of it out to ±100° (55% for a moving man), and behind that only
within 10 m; he looks where his body faces, or at the squad's known threat if a ≤70° head turn reaches
it. Holding still with no known threat he scans his sector: his look sweeps `SCAN_SWEEP` (40°) either side
of his body and back every `SCAN_PERIOD` (8 s), each man on his own phase, on sim time and his id, never
the combat RNG. The sweep stays inside the 60° focus, so his front is never out of focus (a 70° sweep
lost the man straight ahead: `run.js` seeds 6 and 23). Tracking a man he already has is not cone-limited. `squad.contact` is the squad's picture: its own
men's sightings, else a friendly squad's first-hand sighting within 50 m (`relayedFrom`, keeping the
sighting's `at`, never chained), else enemy gunfire within 120 m (`heard`, the shooter's position off
by up to 8% of the range, deterministically). Own sightings always replace heard or relayed ones. Measured 2026-09-29 (`perception` probe, standard seeds 1-4, three types, 600 s): 127 mid-fight
re-acquisitions, 113 seen, 13 relayed, 1 heard; 81 of 14,844 acquisitions were by a still man whose squad
knew of nobody (65 front, 13 side, 3 behind). No defect, so `HEAR_RANGE`/`RELAY_RANGE` stay: hearing (120 m)
sits inside every role's sight range, so it can rarely be the first cue.
Engagement already turns men and assigns suppressors from `squad.contact`, so both cues bring the
squad's eyes and rifles onto the threat.

**Soldier condition** (`modules/17-soldier-mind.js`, `BattleSoldierMind`). Each man carries `soldier.mind`: `stress`
(0 calm, 1 broken) read in four bands with hysteresis (steady; shaken from 0.30, rattled from 0.55, broken from
0.80; back down below 0.24, 0.47, 0.72). It updates inside the fixed AI tick on SquadAI's `beforeSoldier` slot and
is told on the `aimedAt` slot when a trigger pull had him as its target (`{from, rounds, d}`, sent after the burst so
it cannot change it). It rises with suppression (0.05/s while `suppressedUntil` holds), a wound that did not drop
him (0.30), a friend down within 30 m (0.16, by distance, x1.3 in his squad, with sight beyond 8 m), the squad
leader down within 60 m (0.20), aimed rounds (0.02 each, by range, nothing from 300 m), no leader, no squadmate
within 30 m, and a neighbour within 8 m who is worse off (never past the neighbour). It decays (tau 22 s), faster
with the leader within 12 m, in useful cover and among steady men, x2.5 slower while under fire. Nerve (a hash of
faction and id, +15% for a sergeant) scales every gain; the module draws nothing from the combat RNG and writes
only `mind`. Engagement and the shot model read four levers, each separately switchable: `react` (recognition up to
x1.6: `reactTime`, the orient window, the re-orient), `aim` (shot group up to x1.8: `14-z` `dispersionSigma`),
`hesitate` (an ordered bound waits 2.2 s per unit of stress over 0.35, at most 2 s, under the 3.6 s bound window;
the wait is cleared with the order) and `shock` (a friend down within 10 m, or the leader within 30 m, freezes his
trigger for 0.35 s plus 2 s per unit of stress it added, at most 1 s, and stops him if he is only advancing; not
again within 3 s). `?mind=0` is off, `?mind=observe` keeps the state and reads none of it (identical to off:
`soldier-mind-check.js` and a control on six full battles), `?mind=react,aim,...` only those levers. `squad.mind`
(mean, max, men per band) is Micro status upward; nothing reads it yet but the export. Measured 2026-09-29 (`experience`
and `mind` probes, six 600 s battles, 216,000 man-seconds, no constants tuned): 88% of aimed rounds arrive from
250 m or more, so they add under 1% of the stress; it comes from friends down 31%, wounds 20%, isolation 15%,
leader down 13%, suppression 10%, contagion 6%, no leader 4%. Man-time is 95.9% steady, 2.9% shaken, 0.8% rattled,
0.4% broken; for men whose squad is in contact 92.6 / 5.3 / 1.5 / 0.7. Constants are `BattleSoldierMind.tuning`,
outside the policy genome. Paired standard benchmark (seed `soldier-mind-20260929`, one commit, flags `mind=0` /
`mind=observe` / none, 100 battles each): `observe` is identical to `mind=0` in all 100; all levers on against
off moved 30 winners both ways (16 GE to US, 14 US to GE, exact McNemar p = 0.86; US wins 43 to 45), time-limit
battles 52 to 51, no-capture 14 to 14, captures 3.81 to 3.73, health 82.7 to 82.1, no runtime errors: no measurable
effect on mission outcomes. The World Debug **Composure** layer draws it (a ring per shaken/rattled/broken man, a
cross on a frozen one), and `closeup_battle.cjs` takes `CLOSEUP_TARGET=stressed` and `CLOSEUP_OVERLAY=composure`.
**Engagement states:** `advance → orient → (decide) → bound → engage`, then
`pinned`, `assault`, `alert`, `withdraw`, `station`. `orient` never fires (REACT 0.45 s scout to
0.85 s gunner). `engage` pins position and commits stance. `alert` holds the sector for
`ALERT_HOLD`. Fire requires: a live target, not reloading, past `eng.fireReadyAt`, speed ≤12% and
not crawling, within `AIM_CONE` (~12.6°), and gunner emplaced. `squad.inContact` is
`contactCount>0 || suppressors>0`. Suppression deals no damage, only pins. There are at most
`MAX_SUPPRESSORS` suppressors, the MG first. The Squad Leader (`fireAndMovement`) sends one fireteam
forward every `BOUND_CYCLE` if ≥2 are shooting, only in an assault phase, and the MG never moves.
`engagement.js` declares each stored state's meaning, entries, exits, update rate and legal next
states in `BattleEngagement.states`; its transition function is the only state/clock writer.
Combat urgency and firing-station release request their legacy entry semantics through
`BattleEngagement.requestState`, so those modules do not write `eng.state/since/until`.
**Stance has one writer: Engagement** (`commitStance`, with `STANCE_HOLD`/`PRONE_HOLD` holds and
`AIM_SETTLE` after a change). `stepMovement` only shows the committed stance; another layer (the
reload hook, module 44's drills) asks through `BattleEngagement.requestStance`, which only takes a man
lower, or, as a drill running on Engagement's `afterDrill` slot, commits through `commitStance`
(`stance-ownership-check.js`). A man advancing under fire or while his squad is in contact moves
crouched.
Engagement constants live at the top of `engagement.js` (`BattleEngagement.tuning`), bound timing in
`16-squad-plan-stability.js`; both are deliberately outside the policy genome. Sight and cover are
per stance (`obstacle-field.js`), so going prone genuinely helps.

**Extend through declared slots, never by replacing a function.** `SquadAI` declares `fireGate`,
`shotModel`, `woundModel`, `areaFireGate`, `roundGate`, `afterShot`, `squadCommand`, `beforeSoldier`, `afterSoldier`, `aimedAt`;
`BattleEngagement` declares `afterDrill`. Sidearm switching (module 47) is the `beforeSoldier` extension `sidearm`; the soldier condition (module 17) is `soldier-mind` on `beforeSoldier` and `aimedAt`. Add the id to the declared order and attach with
`extend(stage, id, fn)`; reassigning `tryFire`/`updateSoldier`/`updateSquad` makes behaviour depend
on module file order (`14-z-ballistic-raycast.js` once silently discarded the LOS gate that way).

**A command hold is a lease.** Commitments that block another layer's intent change live in
`BattleLeases` (`squad-ai.js`, one table per squad: kind, owner, since, until, reason, release, plus
an ended log): `tactical-plan`, `regroup`, `regroup-cooldown`, `regroup-bypass`, `corner-hold`,
`bound`, `bound-cycle`, `succession` (Squad Leader) and `objective-security` (capture zone). `holds()` is `t < until`.
Each owner declares its kinds with `BattleLeases.define(kind, {priority, timer, progress})`: priority
orders live leases (`active()`, `top()`); `timer: true` marks a pure clock that `prune()` ends as
`expired` once its time is up (the Squad Leader prunes each command tick); kinds whose expired record
still means something (`objective-security`, `succession`, `regroup`) are never timers; `progress` is
a read-only "is this hold getting anywhere?" test. The session export lists each squad's live and
recently ended leases and `missionHeldBy`; the AI Graph **Leases** panel (`modules/37-lease-panel.js`, stashed
with the graph) shows them live when the graph is on. Don't add a new `...Until` field for a hold. Deliberately not leases: fireteam order renewal (on the order
record), the garrison request (a standing constraint), and execution timing inside one owner.

**Loadouts and sidearms.** What a man is issued is `SquadAI.LOADOUTS` by role (`loadoutFor(role, faction)`
is the one place a role picks a weapon; `ROLES` carries none): a `primary` kind and an optional `secondary`.
`dealLoadout` builds both through `attachWeapon` (the side's own model and numbers); the sidearm is
holstered (`soldier.secondary`, mesh hidden, its own magazine and reserve from the ammunition module).
`BattleWeapons.equip` swaps `soldier.weapon` (what he shoots; the pose, grip and ranges follow it) and
holsters the other. Machine-gun behaviour (emplacing, setUp accuracy, first suppressor, never bounds,
firing-station range) follows `SquadAI.isMachineGun(s)` (`weapon.kind === 'lmg'`), not the role; slots and
hardpoint eligibility stay role jobs. Module 47 (`BattleSidearm`, tuning `DRAW/CLEAR/NEAR/CLOSE/HOLD/LEAVE`)
draws the sidearm when the primary is out of action inside 20 m, or a long gun is at arm's length (8 m),
and puts it away after 3 s once the target is past 35 m or the pistol is dry. At the standard seeds it
never fires (2026-09-29, `sidearm` probe, seeds 1-4, 12 battles: 0 draws): contacts are at 150 m or more and
no gun runs dry in 600 s. It matters for close fights (buildings, hedges) and future ammunition pressure.

**Weapons and wounds.** `BattleWeapons.STATS` holds each kind's numbers and `PROFILES` each side's
weapon for it (Garand/Kar98k, M1919A6/MG42, Thompson/MP40, M1 Carbine/FG42, M1911A1/P38);
`SquadAI.createSoldier` issues it (`weapon.profile`, `magSize`, and `carried` where the load differs
from the kind's). A man opens aimed fire out to `SquadAI.engageRange(s)`: his weapon's range (roles no longer carry one,
except as a cap where the job is not the firefight: the defending engineer's 130 m), so the US scout
stops at the carbine's 250 m and the German scout reaches 450 m with the FG42's rifle cartridge. The
FBX backend draws the model the profile names (`PROFILES.<side>.<kind>.model` + `.fbx`), so what a man
carries and how it shoots cannot disagree. The squad leader keeps his SMG on purpose: he
commands, and his fire is close defence (measured 2026-09-29, `fire-gates`, three standard battles: he
held a target for ~10,000 samples, 98% of them at 150 m or more, `engageRange` stopped him in ~90% of
them, and he fired 0/94/0 rounds against 280-422 for a rifleman; the gate is right, the contacts are far).
A rifle for leaders would be a loadout change (`LOADOUTS`) needing the Garand/Kar98k seat checked on the
captain models in Motion Lab. A selective-fire weapon (`autoWithin`, the FG42: 50 m) bursts only inside
that distance and fires single aimed rounds beyond it. `rof` is the aimed rate of a semi-auto or bolt action; an
automatic has `cyclic` (rounds/s), `burst` [min, max], `burstPause` and `burstClimb`. One trigger pull
fires the whole burst on one AI tick (0.15 s, slower than an MG42 cycles); each round goes through
`roundGate`, `shotModel(…, round, delay)` and `afterShot`, and `onFire(soldier, delay)` / the shot's
`delay` let presentation play it at the cyclic rate (`BattleSim.presentAfter`). What a hit does is the
`woundModel` (`modules/14-wound-model.js`, `BattleWounds`): the ray's hit zone (head, chest, abdomen,
arm, leg; `BattleBallistics.hitZone`), a drop chance per zone scaled by the cartridge's `power`,
bleeding that eases with time, leg wounds slowing (`woundSpeed`, applied in `11-soldier-individuality`)
and arm/torso wounds widening the shot group (`woundSigma`). A round can go through a man
(`14-z-ballistic-raycast.js` over-penetration: chance from the weapon's `penetration`, else full-power
cartridges only, times the zone; it keeps part of its energy, deflects ~7° and flies on) and strike
the next enemy behind him with a wound scaled by `hit.energy`/`hit.power`. The shot reports every
body in `shot.passes` (entry, exit, zone, energy) and where the spent round ended in `shot.final`;
`shot.victim`/`impact`/`zone` stay the first body. Incapacitated and killed both go through
`killSoldier` (`soldier.casualty` says which and where).

**Decals.** Sprite sheets in `Assets/effects/decals/` (`blood.png`, `bullet-holes.png`) are a fixed
4 x 4 grid, one kind per row and four variants per row, generated by `node tools/generate-decal-atlas.js
[--cell 256]`. `15-bullet-impact-fx.js` (`DECAL_SHEETS`) addresses cells by grid position, so a sheet
can be regenerated larger or replaced by a painted one of any resolution that keeps the grid. World
decals (holes, blood on the ground) are thin instances per cell. FBX wound decals choose the nearest
currently skinned body vertex to the ballistic entry/exit point, store that vertex's bind position,
normal and skin weights, and resample only that vertex from the live skeleton each render; the quad
sits 12 mm above the sampled skin normal. A wound event forces that soldier's current pose/world
matrix before the lookup, so a hit between rendered frames cannot fall back because of stale
presentation state. Procedural soldiers retain the bone-parented fallback. Exit wounds are larger,
on the far side, with an exit spray on the ground wherever a round came out.

**Presentation never touches the combat RNG.** Voice, FX and audio must not draw from
`battle.random`; the same seed must simulate the same battle with or without assets
(`voice-determinism-check.js`).

**Formatting:** the M3C behaviour files (command, squad, engagement, movement, weapon rules) are
Prettier-formatted with `.prettierrc.json` (`npx prettier@3 --write <file>`). Don't hand-compress
them back into long single lines.

**Frozen:** path clearance, body width and hedgerow X/Z layout, width and gaps. Hedges remain one
authoritative 3D volume for rendering, nav, LOS and ballistics. PR #99 explicitly lifted the old
2.2 m height freeze only: each generated hedge run now has a deterministic visible height of
2.8-4.57 m, with every 3 m render chunk in that run sharing the same height so the coalesced
runtime prism remains identical to what is drawn. Height uses a separate RNG stream and therefore
cannot shift the frozen terrain layout. Change these physical rules only with deterministic
map/navigation regression coverage and a paired benchmark. v128 is the reference for movement feel.

### Evidence-first workflow (behaviour or performance regressions)

1. Reproduce on the exact seed/scenario. 2. Measure before editing (diagnostics, provenance,
route/movement/position state, counters). 3. Name the broken invariant in one sentence.
4. Name the one owning layer and subsystem; two apparent owners is itself the bug. 5. Trace the
**producer**, not the resolver. 6. Add a failing deterministic check (harness above) when
practical. 7. Make the smallest structural fix at the owner, preferring deletion. 8. Re-run the same
seed and compare before/after. 9. Run the full harness suite. 10. Benchmark only after a
material change is stable: standard 100 for checkpoints, 300 for milestones.

**Stop and write a root-cause chain** (observed → evidence → owner → invariant → fix → test)
before coding if any of these hold:

- the fix needs guards in two or more unrelated modules;
- a timer is added to counter another timer;
- A→B→A churn is being fixed in the resolver instead of the producer;
- a soldier with a legal destination stands still with `stuck=false`;
- reservations are unique but bodies still stack;
- metrics improve but it looks worse;
- the explanation got longer.

**Performance is a gate.** A median slowdown of more than ~25% per battle on the same profile
means stop and profile. Don't hide it with a bigger step, shorter battles or disabled systems.
Wrap hot functions in the harness and fix the dominant subsystem at its owner. Optimisations must
preserve determinism and behaviour.

**Change discipline:** one conceptual change per commit. Use a branch plus preview for anything
that crosses an ownership boundary. If a candidate regresses movement feel, revert it as a unit.
Small root-caused fixes may go straight to main.

**Statistics:** win splits are underpowered. Telling 10% from 3.3% needs ~216 runs per arm, and a
30-run arm can't carry a claim. Report Fisher p-values and don't read mechanism into a
four-run swing. Live-browser runs at `timeScale` 8 aren't deterministic, so use the replay script
for controlled pairs, and serve both arms the same way: `battle_sim_local.php` in preview mode (a
`preview.json` beside it) reads `state/` and the audio manifest two directories up.

### Open issues (as of 2026-09-29)

Keep this section to **work that is genuinely still open**. Completed investigations and shipped
fixes belong in their subsystem sections, commit messages and PRs; do not leave them here as a
pseudo-backlog. Long-form historical notes remain in git history
(`git show 3972d3b:AGENTS.md`).

**Concrete sim work**

**The soldier layer, in slices** (the tactics outline's soldier contract; each slice is a tactics change behind a
lever and a paired benchmark). Shipped: condition, i.e. stress, bands and four levers (see Soldier condition).
Next, in order: (1) the Squad Leader reads `squad.mind` (which fireteam bounds, when to hold, a
`doctrine-review` escalation); (2) a callout channel: sim-level, delayed, lossy messages that change the
listener's state, which voice mirrors and never drives; (3) buddy pairs inside a fireteam (cover and move, calm each
other); (4) per-man beliefs (seen, told or heard, with age and confidence) replacing the shared `squad.contact`
inside Engagement; (5) intent-based orders and initiative when the leader is down.

The loadout, sidearm, perception and weapon-seat work shipped (see Loadouts and sidearms and Perception);
everything else left is deferred below, by decision on 2026-09-29.

**Deferred / future — not V1 blockers**

Deferred 2026-09-29, none is a broken system. The first five were open items: sniper roles is a feature
that waits for models, the next four are measured tuning questions that each need a paired benchmark
before any effect is claimed.

- **Sniper roles.** Loadouts, MG-by-kind and the sidearm switch are shipped (see Loadouts and
  sidearms). Left: sniper roles (M1903A4 / Kar98k ZF39). They need a model and a weapon seat measured in
  Motion Lab, so they wait for that; the sidearm's pose and grip on the sergeant and gunner models is
  also worth a Motion Lab look once a close fight shows it. Any new role changes combat: benchmark it paired.
- **FG 42 balance.** The four-arm benchmark attributed the scout balance shift to the FG 42, not
  the perception cones. Test one lever at a time: Kar98k assignment, shorter practical FG 42 range,
  or wider dispersion/grouping at range. Use the existing `perception=0` / `geScout=carbine`
  arms and paired benchmark; do not bundle this with unrelated tactics changes.
- **Fighting stance doctrine.** Ownership is fixed: Engagement is the only stance writer. The open
  question is tactical policy only: whether long/medium/close combat should map more aggressively
  to prone/crouch/stand than the current `fightingStance` thresholds. Treat any change as tactics
  and benchmark it.
- **Strategic-stall scoring.** The stall mechanism is working, but ~43-46% of live-policy wakes can
  repeat the same effort because distance can outweigh `stallCost`. If revisited, tune score
  weighting with the existing `stallOutcomes`/ `stall-wakes` evidence and a paired benchmark;
  claim outcome effects only from the large benchmark.
- **Movement tolerance audit.** Cover-bound deadlock: fixed, see `bound-episodes`. Movement Progress still uses a
  3 m arrival band while some destinations require tighter placement; cover has its own bound
  window now. Audit another destination kind only if a real stuck case appears.
- **Performance:** the 100-soldier targets are met. Do not restart the audit without a measured
  regression. Startup prebaking of the 10 model FBXs / far-LOD lists is worth at most ~1 s;
  retargeted clip prebaking stays rejected at ~45 MiB. Sim CPU work (Engagement/sight and movement
  resolver) is deferred until `ww2fps` decides it will reuse this AI implementation. The trainer
  and headless benchmark staying on the procedural rig is also deferred.
- **Damage asset upgrade:** UV-painted body wounds V1 is accepted on the monolithic FBX. When Tripo
  or manual segmentation provides separate helmet/holster/major-gear meshes, add material-specific
  impact layers and detachable-equipment effects. Segmentation is not required for V1.
- **Command architecture:** the General/Captain/Engagement ownership split and mission contract are
  already shipped. Future refinement is a versioned `SquadIntent`/single intent resolver and a
  stronger local Squad Leader planner. Add platoon/company command, fallback/counterattack and
  combined arms only when force size/vehicle work makes those layers useful; ~5 squads per side
  does not justify a platoon layer yet.
- **Genome rewrite and AI Graph return.** Both are stashed (see the top of this file), so the genome is the
  code defaults. When the whole AI system rewrite is finished, rewrite the genome against the finished layers
  (what it parameterises, what the layers own, one owner per number, the unread `objectiveHoldWin` and the
  Node harness's missing default rules settled), bring the graph back to mirror the layers and their mapping,
  then flip `STASHED` in `ai-policy.js` and run `probe_ai_graph_stash.cjs` with `STASH_EXPECT=present` and a
  paired benchmark against the defaults baseline. Not before.

**Watch only**

- By design: Movement Progress ignores retreat (`movementStopReason` is the observable), and
  meeting engagements get no runtime engineer fortification (`engineerTick` exits early).

## Soldiers, weapons, animation

AI requests semantic tags and the backend renders them. The tags are `locomotion.idle|walk|crouch-walk|prone-crawl`,
`combat.aim|fire|reload|hit`, `stance.stand|crouch|prone` and `death.front|back|side`, and
`BattleSoldierModel.TAGS` is the source of truth. The backend (`modules/53-fbx-soldier-backend.js`)
never decides tactics, ammo, hits or paths.

- Models, one per class (`MODEL_SETS` in the backend, keyed by role): `Assets/soldiers/{us,ge}-captain.fbx`
  (sergeant; the file keeps its old name), `-scout`, `-gunner`, `-engineer`, and `-paratrooper` for
  riflemen and any role without a model. `?soldiers=rifleman` shows the older `-rifleman-rigged.fbx`.
- Clips: `Assets/animations/*.fbx` (Mixamo rig with fingers, named `<description> - <clip name>`),
  keyed in `CLIPS`, `FAMILIES` (8-way) and `FOUR_WAY` in `modules/53-fbx-clip-table.js`
  (`BattleFbxClips`, data only). The battle fetches only those files, and the lab loads the same table
  for its **Show all animation clips** toggle (off: only in-game clips; on: all, in-game marked ●).
  Bone names are canonicalised at load, so `mixamorig:` and older rigs bind the same clips.
- **Prepared clips.** The battle loads every `CLIPS` entry from one file,
  `Assets/animations/prepared-clips.bin` (~4.5 MiB instead of ~36 MiB of clip FBX), already through
  `sourceRig` + `convertClip`; retargeting onto each model still runs at load. A clip whose spec no
  longer matches `CLIPS` loads from its FBX. **After changing a clip FBX, `CLIPS` or the conversion
  code, rebuild it** with the repo served: `NODE_PATH=$(npm root -g) node scripts/build_clip_pack.cjs`
  (the backend's own code in headless Chromium; byte-for-byte repeatable). `check_clip_pack.cjs`
  fails CI and the deploy until then. Changing the pack's layout or meaning means bumping
  `CLIP_PACK_FORMAT`. The Motion Lab still reads FBX.
- Weapons (the model `BattleWeapons.PROFILES` names per side and kind): rifle Garand / Kar98k, LMG M1919A6 /
  MG42 (folded-bipod carry variants), scouts M1 Carbine / FG42, sergeants Thompson / MP40,
  sidearms M1911A1 / P38 (sergeants and gunners carry one holstered). Babylon is pinned to `babylonjs@9.27.1`.
- **Weapon seats and sidecars.** Hand contacts and weapon points default to `SOLDIER_CONTACTS`,
  `WEAPON_POINTS` and `WEAPON_MODEL_POINTS`. A per-model sidecar `Assets/soldiers/<model>.fbx.json`
  (contacts, one slot per weapon: grip / fore-near / fore-far, pistol arm and wrist dials) overrides
  them; the backend fetches it on load (`BattleFbxSoldier.sidecars()` lists what loaded). Measure in
  `labs/fbx-animation-lab.html` (pick model, clip and weapon, click the contact vertices, **Seat
  weapon**, then **Per-model sidecar** → Save), which posts to `labs/save-calibration.php` (validated
  numbers, existing soldier FBX names only). Saving needs the lab password, asked once per browser;
  its hash lives only on the host in `state/lab-key.php` (`<?php return '<sha256 hex>';`, from
  `printf '%s' 'password' | shasum -a 256`), and without that file saving is off. Pistol slots
  never carry fore points (one-hand hold, in the lab and the game). Only `us-captain` has one on the host. Its weapon slots are embedded in the backend as `DEFAULT_SEATS`
  and fill every model's missing slots (a model's own sidecar and a `WEAPON_MODEL_POINTS` exception win;
  contacts stay per model). Sidecars are server-owned:
  never committed, never deployed or deleted.
- Clips are retargeted at load (rest pose, units, hip height), in quaternions (`retargetRotations`). Looping clips have hip drift removed,
  and that drift becomes their natural ground speed. Playback rate is ground speed ÷ clip speed.
  The upper-body overlay (aim/fire/reload) sits on the lower locomotion layer. The weapon grip snaps
  to a right-palm anchor, the fore-end runs through the left palm, and aim uses a capped spine twist (≤40°).
- No fallback in the game: the page waits for the FBX soldiers however long they take, and a failed
  load shows the load error (`BattleSoldierModel.preload` rejects). Each soldier is a bare body
  (`BattleSoldierModel.createBody`: root, pose root, weapon socket, no meshes) wearing his model,
  with `rig===null` and a `_fbx` binding. The procedural rig in `battle/soldier.js` is only the body
  the trainer and headless benchmark use (`setImportedEnabled(scene,false)`); those soldiers keep
  their `rig` object. `scripts/probe_soldier_load.cjs` checks both the normal load and a blocked
  asset.
- **Animation LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.lod`, presentation only): the
  render hook re-poses a soldier every frame within 35 m of the camera, at ~30 Hz within 100 m and
  ~10 Hz beyond (each on his own phase), never while he is outside the view frustum, and only once
  while his pose inputs are static (a finished death clip, a paused sim). Shadow-aware: a soldier
  whose meshes cast shadows (in any shadow generator's caster list, or any generator with a
  `renderListPredicate`) is held off-screen only when the ground his shadow falls on is out of view
  too; `scripts/probe_lod_shadows.cjs` proves it with positive and negative controls. Add soldier
  shadow casters through a ShadowGenerator and the LOD follows, with nothing to register. Clip clocks stay on sim
  time. A held soldier's skeletons are not re-prepared either: Babylon's `Skeleton.prepare` would copy
  every linked bone node and rebuild and re-upload the bone matrices each frame, so each soldier's
  skeletons prepare once per pose (`lod.skeletons`). `?animLod=0` turns both off.
  **Off-screen culling** (`BattleFbxSoldier.cull`): bind makes soldier meshes always active (their
  bounds are the bind pose), so Babylon never culled them and the GPU skinned all 100 every frame. The
  render hook now disables a soldier's meshes while a 3 m sphere around him is out of view and no
  shadow of his could be in it (the LOD's shadow rule); weapons and decals are culled by Babylon.
  `?soldierCull=0` draws them all; `probe_soldier_cull.cjs` proves the frames identical. Thresholds are tuned from close-ups, never tied to gameplay.
- **Soldier mesh LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.meshLod`, presentation only):
  beyond `far` (45 m, 3 m hysteresis) a soldier draws a meshoptimizer-simplified triangle list
  (~12%: ~1,250 of ~10,400 triangles, ~1,300 of ~22,000 vertices) over his model's own vertex
  buffer, so bone weights, clips, poses and the animation LOD are unchanged. The lists are built once
  per model when meshoptimizer (jsDelivr) arrives, which never holds the load; without it soldiers
  draw at full detail (`meshLod.failed` says why). The models ship unwelded, so they are welded by
  position for the simplifier (`Sparse`), and each kept corner takes the vertex whose UV agrees
  with its triangle, so texture seams hold. `?soldierLod=0` turns it off; tune `far`
  from `probe_soldier_mesh_lod.cjs`. Baking the lists offline belongs with the startup item in Open issues.
- Wired beyond the basics: turn-in-place (standing, crouch, prone), death pools, hit reactions
  (`combat.hit`), idle variants and suppression flinches. Still unused: prone roll right (a left roll
  needs mirroring) and the kneel set. Jump clips need a nav vault edge.
  Not in the pack: sideways crawl, grenade throw, melee, limp, climb, window lean.

**Asset pipeline.** Use the Blender app bundle `/Applications/Blender.app/Contents/MacOS/Blender`, not the
broken `blender` on PATH. Use lowercase filenames, since the host is case-sensitive (`git mv` to rename).

**Approved runtime-format direction (2026-09-27):** FBX is the authoring/ingress format, not the
long-term browser runtime format. The pipeline should convert FBX soldiers/clips/weapons as needed
into measured game-ready artifacts (GLB/glTF or a compact custom representation) and ship those
prepared outputs. Keep raw/source FBX for regeneration and Motion Lab/source workflows where needed;
do not make production clients repeat deterministic parsing, resampling or rig-preparation work that
can be done once offline.

```bash
Blender -b --factory-startup --python tools/fix-soldier-model.py -- --input raw.fbx --output Assets/soldiers/<fac>-<name>.fbx --texture-name <fac>-<name>-albedo [--fit-skin]
Blender -b --factory-startup --python tools/prepare-weapon-model.py -- --input raw.fbx --output Assets/weapons/<name>.fbx --name <name> --length <m> [--fold-bipod]
python3 tools/prepare-muzzle-flashes.py --input pack.zip --output Assets/effects/muzzle-flash   # update FLASH_COUNT if count changes
```

Soldier FBX requirements: one skinned mesh, the shared bone names (`Hips`, `Spine02/01/Spine`, `neck`,
`Head`, `Left/Right Shoulder/Arm/ForeArm/Hand/UpLeg/Leg/Foot/ToeBase`), no normal maps, and a unique
embedded albedo name. Weapon layout: barrel on +Z, butt 0.40 m behind the grip, barrel top +0.03 m.
Lengths: Garand 1.107, Kar98k 1.11, MG42 1.224, M1919A6 1.346, M1 Carbine 0.904, FG42 0.975,
Thompson 0.857, MP40 0.833, M1911A1 0.216, P38 0.216 (pistols add `--butt 0.06`). A generator
character in an A-pose must be moved to the library's T-pose rest first (`tools/match-rest-pose.py
--rest-from <library clip>`, refuses above 1°); an unrigged one borrows a rigged twin's weights
(`tools/rig-soldier-model.py`). `tools/blender-presets/` holds the matching manual FBX export presets.

Before committing, run the lineup: `node scripts/fbx-soldier-lineup.cjs` against the local server
checks every faction/role model + weapon pair and the two-hand hold, and writes close-ups to
`$FBX_OUT` (`FBX_CHROME` picks a browser; visual PASS is still a human judgement: lit, no holes,
factions textured differently, weapon on the hands). Keep weapon source `.zip` packs next to the
`.fbx`; new generator packs in `Assets/soldiers/new/` are gitignored. Only the `.fbx` deploys.

## Audio

`Assets/audio/manifest.json` is the runtime contract, and the runtime never calls an API.

- **Route:** fetch into gitignored `.runtime/`, slice, master, register in `manifest.json`, then commit
  the MP3s only.
  - Fetch: `fetch_sonniss_ww2.py scan|fetch <year>`, which does range requests into bundle zips, or
    `fetch_freesound_cc0.py <ids>`, which refuses anything not CC0.
  - Slice: `slice_weapon_shots.py scripts/recipes/<recipe>.json`. It uses transient detection, or
    `segments` for engines.
  - Master: `bash scripts/normalize_audio.sh Assets/audio`. It's incremental via `.mastering-state.tsv`.
    Delete that file to force a remaster when a target changes. `--explain <path>` shows the
    target, and `UNCOVERED` means no target exists, so the file would ship unmastered.
- **Targets:** mono MP3 48 kHz/128 kbps with a -1 dBTP ceiling.
  - One-shots are levelled on the loudest 100 ms (dBFS, not LUFS): small arms -16, cannon -13,
    foley -26, with at most +6 dB boost.
  - Sustained material uses EBU R128: voices -18, engines -22, ambience -26 LUFS.
  - Do distance in the runtime mix, never in the master.
- **Placeholders:** declared-but-unrecorded clips are listed in `Assets/audio/.manifest-placeholders.txt`.
  Delete a line when its audio lands; CI fails if a listed clip exists. New directories must be in
  `AUDIO_ASSET_GLOBS` in `prepare_incremental_deploy.py`, or they 404 live.
- **Voices:** generated with ElevenLabs `eleven_v3` via `scripts/generate_voice_callouts.py
  [--faction us|ge] [--force [EVENT]]`, which needs `ELEVENLABS_API_KEY` (never commit it).
  - Voice IDs: US `TxWZERZ5Hc6h9dGxVmXa`, GE `Z2yQ1EdlDmcIgh9Pn4Lw`. Prompt prefix
    `[shouting][hoarse][panicked]`, settings stability .4, similarity .7, style .9, speaker boost.
  - Don't rename generated files.
  - Pitch variants (-1.4 / 0 / +1.3 semitones, split 30/40/30, tempo-compensated) are built at deploy
    by `build_voice_pitch_variants.sh` and aren't committed.
- **Acoustics:** 1 unit ≈ 1 m, 20·log10(r) spreading, 343 m/s delay. Shout culls at 150 m,
  small arms at 1200 m. Settings live in `Assets/audio/acoustics.json`.
- **Licensing:** only Sonniss GDC bundles (royalty-free, no attribution; **no AI training and no
  redistribution as a library**) or Freesound CC0. The M1 Garand clips are Freesound 385785, 386842,
  505204, 460855 and 505206. Provenance per weapon: `git show 1a5b0cf:Assets/audio/WW2_SOURCES.md`.

**Weapon/impact/flyby SFX (`Assets/audio/weapon-clip-manifest.json`, planned - no audio recorded
yet).** Replaces `manifest.json`'s Sonniss-derived `categories.weapons`/`weaponFoley` pools, which
are keyed by sim kind (`rifle`/`carbine`/`lmg`/`pistol`) rather than the actual model a soldier
carries, and whose automatic-weapon "shots" are recorded bursts (an onset check found 2+ shots in
37 of 62 clips: MG42 takes had 21-65). The new manifest is keyed one entry per `battle/weapons.js`
`PROFILES[faction][kind].model` (10 weapons: Garand, Kar98k, M1 Carbine, Thompson, FG42, MP40,
M1919A6, MG42, M1911A1, P38), one action per sim event (fire, distant fire, burst tail, reload
stages by mechanism, stoppage click/clear, bipod deploy/fold, plus the Garand's clip ping and the
Kar98k's bolt cycle) - 309 clips total (154 baseline P0). It adds `shared` bullet flyby
(`crackSupersonic`/`whizSubsonic`, 10 clips) and casing foley, and `impacts` keyed 1:1 with
`15-bullet-impact-fx.js`'s `material()` surface classes (`impactFlesh/Dirt/Masonry/Wood/Metal/Vegetation`,
30 clips). Every clip marked `singleShot:true` must hold exactly one discharge (one onset, attack
within 10 ms, no second transient within 18 dB of peak); automatic fire is built at runtime by
retriggering `fire` at the weapon's `cyclicRpm`, never by playing a recorded burst.
`scripts/check_weapon_clips.py` checks the manifest against the live `PROFILES` roster and
(`--audio`) onset-checks every clip that exists; `--shots f.mp3 …` vets a candidate recording
before import. File layout keys the existing mastering targets: `weapons/<model>/<action>-NN.mp3`
(smallArms -16 dBFS) for shot/tail clips, `weapons/foley/<model>-<action>-NN.mp3` (-26 dBFS,
matching the Sonniss foley pool's subfolder) for handling foley, `weapons/shared/<action>-NN.mp3`
(-22 dBFS) for flyby/impacts. Each clip carries a `prompt` for **ElevenLabs Sound Effects**
(`POST /v1/sound-generation`, distinct from the TTS voice route above):
`scripts/generate_weapon_sfx.py [--priority P0] [--only <weapon-id>…] [--force [action]] [--dry-run]`
fetches into gitignored `.runtime/weapon-sfx/`; run `check_weapon_clips.py --shots` and
`normalize_audio.sh` over that directory before copying the mastered files into `Assets/audio/`
and committing only the MP3s, same route as everything else here. Not yet done: wiring these into
`manifest.json`/the runtime (today only one pooled file per sim kind plays, via `battle-sim.js`
`weaponFiles`/`buildWeaponAudio`), and expanding each sim shot of an automatic into several
`fire` triggers at the real cyclic rate (the sim's `rof`/`cyclic` stay the abstract AI/ballistics
rate; this would be audio-only presentation).

**Footsteps (`categories.footsteps` in `manifest.json`, real files, nothing plays them yet).**
Ported directly from the sibling project `Teethree89/ww2fps`'s ElevenLabs-generated battlefield
sound library (its `sound-manifest.json` concepts `001_pasture_grass`, `004_cobbled_street`,
`009_rubble`; 6 walk + 6 run takes each) rather than regenerated, so both projects sound
consistent underfoot. Converted from its 48 kHz/24-bit stereo WAV to this project's mono MP3 and
mastered under the foley target (-26 dBFS). `AUDIO_ASSET_GLOBS` in `prepare_incremental_deploy.py`
has one entry per surface folder (a flat, non-recursive glob per directory, same as
`weapons/foley`). Not yet done: which surface plays under a soldier's feet needs a terrain/zone
signal Battle Sim doesn't have yet (its splat/terrain data is host-only), and a footfall-cadence
hook into the animation/movement system - both real engineering, out of scope here.

## Deploy and assets

- Production `/grasstex/battle_sim.php` is `battle_sim_local.php`, uploaded under that name by the
  deploy; it serves the deployed runtime and writes nothing to the host. The repo's own
  `battle_sim.php` (a GitHub-mirroring loader that writes git-tracked `Assets/` to the host and
  never deletes) is not deployed.
- `scripts/prepare_incremental_deploy.py` uploads by content hash: `.fbx` from soldiers,
  animations and weapons, muzzle-flash `.png`, audio, and the Motion Lab's own files
  (`MANAGED_LAB`: `labs/fbx-animation-lab.html`, its two `.js`, `asset-list.php`,
  `save-calibration.php`). `scripts/build_version.py stamp|show|tag`
  derives the version from `build-v<N>` tags. Each deploy also lists the host's
  `Assets/{soldiers,animations,weapons}` and re-uploads any FBX the hash state records but the host
  no longer has (`prune_missing_remote_assets.py`), so a folder can be cleared on the host and
  refilled by running the deploy (Actions → Deploy Battle Runtime → Run workflow).
- **The deploy never deletes or overwrites server files the repo does not manage.** Hand-placed
  sidecar JSON (clip/model/lab metadata beside the FBX assets), the live FBX soldier-animation lab
  files and everything else unmanaged stay put. The planner may delete only a
  `battle/modules/*.js` it deployed itself that has left the repo; any JSON other than
  `battle/build-version.json` and `Assets/audio/manifest.json`, and any path containing `lab` or
  `sidecar`, can never be deleted or uploaded over, except the exact `MANAGED_LAB` paths, which
  are uploaded but never deleted; more than 8 deletes in one run aborts the
  deploy (`DEPLOY_MAX_DELETES` to override an intended bulk retirement). `check_deploy_safety.py`
  proves this in CI and again inside the deploy before anything is uploaded. Keep it that way:
  don't add `mirror --delete` or broaden the delete rule for production.
- `Assets/terrain/{terrain.json,terrain.bin,splat.png,roaduv.png}` exist only on the host. **Don't
  add placeholders** with those names.
- Hosted textures load only from `test.ivandpopov.com` (WebGL rejects them cross-origin).

## Grass & terrain (reference)

- `GrassAPI` (`grass-api.js`):
  - Masks: `addArea` / `excludeCircle|Box|Polygon|Corridor|Segment`.
  - Surfaces: `allowSurface` / `excludeSurface` + `setSurfaceResolver`.
  - Terrain: `setTerrainSampler` / `setTerrainMesh` / `setMaxSlope`.
  - Queries and rebuilds: `isAllowed`, `snapshot()`, `requestRebuild()`. Set `autoRebuild=false`
    for bulk edits.
  - Placement is deterministic per seed.
- **Invariant:** grass, shadows and the camera must sample *the rendered mesh* (or the same
  heightfield the mesh displaces from), never the analytic height. The gap was 0.41 m beside the road.
  - `sampleAt` interpolates the GPU's triangle: vertex `col+row*GRID`, z falls with row, split
    `(A,B,C)` if u≥v, else `(D,A,C)`.
  - With non-uniform columns, use the real column width, keep UVs world-linear in X, and use
    `Uint32Array` indices.
- Shadow decals tilt into the terrain tangent plane, and their alpha must reach 0 at `SHADOW_END`.
- `tools/terrain-bake/`:
  - `node genmap.js --seed 7` generates `map.svg`, with graded routed roads.
  - `node --max-old-space-size=4096 run.js` bakes the heightfield and splat, and `render.js` draws figures.
  - `lod.js` and `stream.js` do camera LOD with crack snapping and hysteresis.
  - `terrain-baked.js` feeds one field to both grass and mesh.
  - Known gap: its `ShaderMaterial` doesn't receive cascaded shadows.

## Conversation maintenance (local Codex / VS Code only)

Hooks in `.claude/settings.json` and `.codex/hooks.json` run `scripts/conversation-maintenance.py`
to queue `/compact` and `/clear` via keystrokes or the Codex app-server. They do nothing in cloud
sessions.

- When a task gets long, run `scripts/conversation-maintenance.py compact --reason "context is long"`.
- On a clear task pivot, tell the user it hit a task-pivot marker and run `clear "next task" --reason "task pivot" --summary "…" --criteria "…"`.
  This writes `.runtime/handoff-prompt.md`, which the SessionStart/UserPromptSubmit hooks inject once.
- Prerequisites: `codex` on PATH (or `CODEX_BIN`), plus macOS Accessibility permission for VS Code.
  Re-approve hook trust after editing either hook file.
- Use `--transport auto` and `--refresh-mode window`. `webview` froze Codex once.
