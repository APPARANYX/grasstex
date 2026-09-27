# AGENTS.md

The single working guide for this repo. Every other doc was folded in here except
`battle/AI_TACTICS_OUTLINE.md` (tactical doctrine from MCDP 1-3 / MCTP 12-10B / MCWP 3-35.3),
which is design reference; read it when the task is about tactics, not plumbing. The full
original docs (roadmaps, lab notes, measurements) are in git history at `1a5b0cf`.

## Working rules

- **Don't create new plan/roadmap/summary `.md` files.** Update this file only when a command,
  contract or rule actually changes. Findings go in the commit message or PR body.
- **State success criteria up front, prove them with a harness below, report the output.**
  Never claim visual/browser validation that wasn't performed.
- **Keep probes.** A one-off measurement script is a probe: commit it as `scripts/probes/<name>.js`
  (run with `scripts/run_probe.cjs`) or extend a close-up tool (`closeup.cjs` for a posed soldier,
  `closeup_battle.cjs` for one in a fight), never leave it in `/tmp`.
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
| Learning/telemetry backend | `battle_learning.php`, `battle_policy.php`, `battle_log*.php`, `battle_metrics.php` ("What We Learned" page) | Active. |
| FBX Motion Lab | `labs/fbx-animation-lab.html` (calibration workbench), in-page **Motion Lab** button | Previews clips; measures hand/weapon contacts and saves per-model sidecars the game loads. |

In the page: a load overlay (`BattleLoading`, in `battle_sim.html`) shows each boot phase (runtime
scripts, scenario, terrain, soldiers/weapons/clips, cover, navigation and squads); the FBX backend
reports per-file progress to it. **Start Battle** unpauses and unlocks audio (iOS needs the gesture).
`window.__battle__` is the live `BattleSim`. HUD buttons: World Debug, AI Graph, Motion Lab.
URL flags: `?seed=`, `?defender=us|ge`, `?soldiers=rifleman`, `?smooth=0`, `?animLod=0` (pose every soldier every frame), `?perfTimings=1`.

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
| `objective-nav-check.js` | Real worst-seed defects: never permanently refused a step at a building, no all-squads-one-objective, a side attacks at most 2 objectives at once yet every objective is attacked once the efforts before it fall, capture progress survives an interrupted hold, door/window routing, `stepMovement` aim smoothing |
| `tactical-positions-check.js` | Window/hardpoint reservation ownership, ingress routes, release reasons, diagnostics |
| `cover-positions-check.js` | Cover-slot selection against obstacles and physical footprints |
| `personal-space-check.js` | Physical endpoint allocation and body separation |
| `fireteam-frontage-check.js` | Each fireteam holds its own ground: published fireteam anchors stay ≥5 m apart while squads march, deploy and fight |
| `movement-recovery-check.js` | Recovery episode state machine, goal resets, unreachable criteria, retreat override |
| `movement-state-check.js` | Resolver/movement-progress state for bounds and assault |
| `lean-runtime-check.js` | Squad-plan stability + resolver + tactical route with no extra modules |
| `macro-command-toggle-check.js` | Macro OFF suppresses Force Command while downstream hooks still run |
| `map-pipeline-check.js` | Scenario regeneration publishes the same geometry as a page load (benchmarks once ran 10-70x slow on 4x the hedges) |
| `sight-query-check.js` | Pruned geometry queries answer exactly as unpruned: `sightBlocked` (crossed cells, first hit) vs nearest-hit `sightBlocker`, and `movementClear` with vs without wall bounding boxes, on real scenarios |
| `impact-fx-check.js` | Impact materials, hole kind per surface, decals on terrain/wall face, wound decals on the hit bone, exit spray, sheet-cell UVs, FX budgets, restart cleanup (render stub) |
| `weapon-wound-check.js` | Side-specific weapons (Garand/Kar98k, M1919A6/MG42, Thompson/MP40, M1 Carbine/FG42 with the scout's reach following his weapon), bursts at the cyclic rate, the FG42 automatic only inside `autoWithin`, sustained rates, a burst stops when the belt runs dry, hit zones from the ray, head/chest/leg/arm wound outcomes, bleed-out, drop odds per zone and cartridge, a rifle round through one man into the next (less energy, deflected) and a pistol round stopping |
| `world-debug-check.js` | World Debug overlay UI handlers (DOM stub) |
| `extension-order-check.js` | No module replaces `SquadAI.tryFire`/`areaFire`/`updateSoldier`/`updateSquad` or `BattleEngagement.updateSoldier`; the declared fire order (ammunition → ballistics range → trigger-time LOS) holds; undeclared extensions throw |
| `lease-check.js` | `BattleLeases` primitive, tactical-plan and regroup lease lifecycles, regroup re-forms on the rally point |
| `reconstitution-check.js` | Retreated squads home and out of contact reaching 10 survivors group (fewest squads; none planned en route), march to the rally point, merge under one leader (promotion never picks the gunner), get re-tasked; below-strength groups dissolve; Macro OFF does nothing |
| `regroup-axis-check.js` | A man behind the regroup anchor is a trimmable straggler, never an outrunner (the regroup keeps the direction the squad was marching), men ahead or to the side still block, and a regroup whose only scattered man is behind ends on `cohesion restored`, not on the clock; swept over march directions (main fails it) |
| `succession-check.js` | A killed leader is replaced by the most senior survivor after the 6 s `succession` lease, never more than one leader, the gunner only as the last man, successors replaced in turn, no lease on a led or wiped-out squad, seniority order |
| `perception-check.js` | View cones (120° focus at full range, ±100° periphery shorter, behind only within 10 m), head turn toward the squad's known threat, contact relayed to a friendly squad within 50 m (first-hand only, keeps its age), enemy gunfire heard within 120 m with a distance-scaled position error, own sightings outrank both, no combat-RNG draws |
| `voice-determinism-check.js` | Voice callouts never draw from the combat RNG: a battle is identical with and without voice |

`harness.js` mirrors `stepMovement()` from `battle/battle-sim.js`. **If that function changes,
change the mirror too.** `bootstrap()` returns the loaded globals for throwaway probes. Write
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

Hosted textures 404 when served locally, so the ground renders red. That's expected.

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
  6 settle frames and 1 per view. `Math.random` is seeded from the seed, so the same seed gives the
  same man, pose, wounds and camera. Decal variants drawn on async timers can still differ. Env: `CLOSEUP_URL`, `CLOSEUP_SEED`, `CLOSEUP_COUNT`,
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
- **Every model with its weapon, plus the Motion Lab poses:** `scripts/fbx-soldier-lineup.cjs`
  (see Soldiers, weapons, animation).
- **Pistol support hand numbers:** `scripts/probe_pistol_cup.cjs` (see the replay table below).

In a cloud sandbox Chromium sees the proxy's CA, so launch with `--ignore-certificate-errors`
(these scripts do). Otherwise Babylon never loads from the CDN and `__battle__` never appears.

**Deterministic replay / profilers** (Playwright, against the local server above):

| Script | Use |
| --- | --- |
| `scripts/run_m3c_replay.cjs` | One seed, fixed step, full diagnostic JSON. `M3C_SEED`, `M3C_URL`, `M3C_OUTPUT`, `M3C_MACRO=off`. Use for paired before/after comparisons. `M3C_RENDER_EVERY=<n>` renders a frame (sim paused) every n steps so the FBX pose code runs; `M3C_PERF=on\|off` sets the timing switch below. An on/off pair must end identically. |
| `scripts/benchmark_full_fidelity.cjs` | Full-fidelity browser benchmark: real FBX soldiers, weapons, clips and Babylon rendering; fails on a failed FBX load or any procedural soldier. Records startup phases and per-file asset timings, then `FF_SECONDS` (60) of rendered battle after `FF_WARMUP` (90) fast-forwarded sim seconds: frame interval/FPS, CPU per frame, render, sim step, pose time per layer and how often each layer's inputs changed, active meshes, draw calls, GPU time where supported. Writes `full-fidelity.json` + `.md` to `FF_OUT`. `FF_URL` (local default, or `preview.php?ref=<branch>`), `FF_SEED`, `FF_TIMESCALE` (4), `FF_VIEWPORT`, `FF_GPU=1` (real GPU instead of SwiftShader), `FF_ISOLATE=0`, `FF_QUERY` (extra page query, e.g. `animLod=0` for a same-build before/after), `FF_CADENCE=60` (drive frames on a virtual 60 Hz clock so pose/CPU per frame describe a 60 FPS device even on SwiftShader; wall FPS is then meaningless). It serves the page cross-origin isolated so `performance.now()` has 5 µs resolution, not 100 µs. SwiftShader numbers are a CPU-only baseline, not a device result. The headless benchmark stays the AI regression benchmark. |
| `scripts/run_battle_benchmark.mjs` | N headless battles. `BATTLE_BENCHMARK_COUNT/SEED/URL/STEP/TIME_LIMIT/OUTPUT`. `merge_battle_benchmarks.mjs` merges shards. |
| `scripts/profile_battle_hotpaths.mjs` (+ `battle-hotpath-profiler.cjs`) | Inclusive wall time per hot function. `BATTLE_PROFILE_SEED/TYPE/SECONDS`. |
| `scripts/profile_meso_churn.mjs` (+ `meso-churn-profiler.cjs`) | Meso fireteam order churn attribution |
| `order-ingress-`, `physical-point-`, `movement-goal-transition-`, `resolver-order-mutation-profiler.cjs` | Inject-only observers: who proposes orders, destination provenance, goal transitions, resolver mutations. They never change behaviour. |
| `scripts/battle-benchmark-intent.cjs` | Shared benchmark predicates (targetless/route-active) |
| `scripts/closeup_damage_fx.cjs` | Close-ups of the damage FX in the real page: newest wound and exit-wound decal on a soldier, blood splash and exit spray, masonry/wood/dirt/metal holes, one `<kind>.png` each plus `summary.json` (wounds by zone, decals by kind); fails on page errors. `CLOSEUP_OUT` (default `closeups/`, gitignored), `CLOSEUP_SEED`, `CLOSEUP_SHOTS`, `CLOSEUP_SIM`, `CLOSEUP_BODY`, `CLOSEUP_DIST`. 5-10 min under software WebGL. |
| `scripts/preview_decal_sheets.cjs` | Contact sheet of `Assets/effects/decals/*.png` over surface-like backgrounds with the 4 x 4 grid and row names; check a regenerated or painted sheet before it ships. No server. `DECAL_PREVIEW_OUT`. |
| `scripts/probe_pistol_cup.cjs` | Motion Lab pistol support cup at a fixed 60 Hz: cup gap (cm), degrees the left arm is bent off the clip, and hand jerk (deg/frame², solved vs the clip's own) per clip. `CUP_SIDECAR=<model>.fbx.json` (a server sidecar; they are never committed), `CUP_CLIPS`, `CUP_SERIES=1`. |
| `scripts/probe_gait_clips.cjs` | Which FBX locomotion family (walk/run/sprint/crouch/crouchRun) each sim gait actually plays, at what rate, plus each model's natural clip speeds (in-place clips: foot stride). `GAIT_URL` (default production), `GAIT_SEED`, `GAIT_SECONDS`, `GAIT_OUT`. |
| `scripts/run_probe.cjs` + `scripts/probes/*.js` | Observe-only probes on full benchmark battles (0.15 s step, procedural rig). `PROBE=<name>[,<name>]`, `PROBE_BATTLES=<type>:<seed>,…` (default one standard seed per type), `PROBE_SECONDS`, `PROBE_OUTPUT`, `PROBE_CONTROL=1` (also runs each battle without probes and fails if the end state differs). Serve with `PHP_CLI_SERVER_WORKERS=4 php -S …` or page loads stall. Probes: `station-occupancy` (bodies vs reservations at firing stations), `close-pairs` (who the <0.9 m pairs are, and the rate after formation/facing changes), `regroup-episodes` (every `regroup` lease: end reason, order anchor and destinations vs the rally point), `stall-wakes` (each strategic-stall wake: repeat, and whether another objective was open), `damage` (rounds by weapon, wounds by zone and outcome, and of body hits the share that went through, struck a second man or flew on), `fire-gates` (per role: trigger pulls, target distance bands, and the first fire condition that fails while a man holds a target), `backward-orders` (new destinations behind the man's fireteam line or behind the man himself while the squad advances, by producer and phase), `stance-churn` (shown stance changes per man-minute by writing file, A→B→A bounces under 1 s, trigger pulls within `AIM_SETTLE` of a change, prone spells shorter than `PRONE_HOLD`), `regroup-axis` (regroup ticks whose forward axis collapsed, and men behind the anchor scored as outrunners). |

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
for r in scripts/recipes/*.json; do python3 scripts/slice_weapon_shots.py "$r" --check-only; done
bash scripts/normalize_audio.sh Assets/audio && git diff --quiet -- Assets/audio   # needs ffmpeg
```

## CI and workflows

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` | PR, push to main | Syntax (JS/PHP/Py/sh/JSON), audio library, sim regressions (all harness checks + 8 seeds), deploy plan + deploy safety |
| `deploy-50webs-php.yml` | push to main | Stamps `build-v<N>`, reruns checks and the deploy-safety check, uploads by content hash to production |
| `deploy-50webs-preview.yml` | push `work/**`, `preview/**` | `https://test.ivandpopov.com/grasstex/preview/<slug>/battle_sim.php`; never touches prod, makes no telemetry/learning writes; its `mirror --delete` skips JSON and lab files |
| `preview.php` (on the host, not a workflow) | `?ref=<branch>`, `#47`, or a GitHub branch/PR URL | Stages that commit's `battle/` runtime from GitHub into `preview/ref-<sha12>/` with the host's own loader and opens it (same preview contract, no writes). Only this repo's branches and same-repo PRs (a PR uses its head commit, so merged ones still open); keeps the 12 most recent. Branch FBX, clips, weapons and `Assets/effects` PNGs come too: files identical to production are hard links, and new ones download (≤300 MB). A branch that changes `battle_sim_local.php` still needs the Actions preview. Optional `state/github-token.php` (`<?php return '<token>';`) lifts the 60/h API limit. |
| `battle-benchmark-standard.yml` | tag `standard-benchmark-*` or dispatch | 10 workers × 10 = **100 battles**: the routine 60 meeting / 20 US-defend / 20 GE-defend checkpoint |
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
| Meso: Squad Leader / Squad Command | `modules/16-squad-plan-stability.js` (`executeMission`, `fireAndMovement`; SquadAI's `squadCommand` owner) | stable squad plan: fireteams, formation, order anchor, fire and movement (assault authorisation, bound cycle and team), corner pauses, defensive posts, regroup, objective phase; the only writer of `commandPhase` (setup states it through `initialPhase`) | do obstacle avoidance; republish orders every tick |
| Micro: Engagement | `engagement.js` (+ `modules/44-combat-urgency.js` drills on its `afterDrill` slot) | per-soldier state machine, stance (`prone`/`crawling`/`tacticalCrouch`), permission to fire, combat proposals to the resolver, the squad contact report (`inContact`, base of fire, pinned) | write final destination; pick objectives; decide squad bounds |
| Perception + shared primitives | `squad-ai.js` | who sees whom (view cones), what a squad hears and is told (`squadSenses`), shot resolution, shared `squad.contact`, `areaFire` suppression; hosts the declared extension points (`SquadAI.extend`) and `BattleLeases`; a status-only squad update when no `squadCommand` owner is loaded | set stance/destination in combat |
| Tactical positions | `modules/20-building-hardpoints.js` (`BattleTacticalPositions`: `claim`/`current`/`station`/`release`) | window/hardpoint reservations `assigned→ingress→occupying→holding→released`, committed ingress route | |
| Tactical routing | `modules/52-survival-tactical-route.js` | safe ingress, suppressed cover detours | resurrect an obsolete objective |
| Movement Resolver | `movement-resolver.js` | **sole normal-runtime writer of `soldier.destination`**; coalesces Engagement's per-tick combat requests and arbitrates Meso vs Micro proposals | act as a garbage collector for redundant producers |
| Diagnostics | `modules/36-order-provenance.js` (writer provenance, fast setters, 1.6 s in-place sampler), `32` Loop Watch, `43` forward progress, `99` the one diagnostics exporter (full, loops and orders via `BattleDiagnosticsExport.snapshot(kind)`; `38` only adds its AI Graph buttons) | observe only: removing them leaves a battle identical (~4% wall time) | change gameplay |
| Navigation | `battle-navigation.js`, `modules/39-navigation-physicality-debug.js` | doors, stations, pathfinding, 0.45 m body legality | assign or release tasks |
| Personal space | `modules/51-soldier-personal-space.js` | local physical correction | own commands |

Brief lifecycle: `issued → executing → completed | invalid | failed | superseded`. The General
wakes only on: initial brief, mission complete or invalid, reserve due, a defence request that
changes the task, an objective vacated or changing control on a defend brief, a 120 s strategic
stall, a Squad Leader `doctrine-review` escalation, or a merge (`squad-reconstituted`). Wakes are
exported under `macroCommand`.

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
it. Tracking a man he already has is not cone-limited. `squad.contact` is the squad's picture: its own
men's sightings, else a friendly squad's first-hand sighting within 50 m (`relayedFrom`, keeping the
sighting's `at`, never chained), else enemy gunfire within 120 m (`heard`, the shooter's position off
by up to 8% of the range, deterministically). Own sightings always replace heard or relayed ones.
Engagement already turns men and assigns suppressors from `squad.contact`, so both cues bring the
squad's eyes and rifles onto the threat.

**Engagement states:** `advance → orient → (decide) → bound → engage`, then
`pinned`, `assault`, `alert`, `withdraw`, `station`. `orient` never fires (REACT 0.45 s scout to
0.85 s gunner). `engage` pins position and commits stance. `alert` holds the sector for
`ALERT_HOLD`. Fire requires: a live target, not reloading, past `eng.fireReadyAt`, speed ≤12% and
not crawling, within `AIM_CONE` (~12.6°), and gunner emplaced. `squad.inContact` is
`contactCount>0 || suppressors>0`. Suppression deals no damage, only pins. There are at most
`MAX_SUPPRESSORS` suppressors, the MG first. The Squad Leader (`fireAndMovement`) sends one fireteam
forward every `BOUND_CYCLE` if ≥2 are shooting, only in an assault phase, and the MG never moves.
Engagement constants live at the top of `engagement.js` (`BattleEngagement.tuning`), bound timing in
`16-squad-plan-stability.js`; both are deliberately outside the policy genome. Sight and cover are
per stance (`obstacle-field.js`), so going prone genuinely helps.

**Extend through declared slots, never by replacing a function.** `SquadAI` declares `fireGate`,
`shotModel`, `woundModel`, `areaFireGate`, `roundGate`, `afterShot`, `squadCommand`, `beforeSoldier`, `afterSoldier`;
`BattleEngagement` declares `afterDrill`. Add the id to the declared order and attach with
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
recently ended leases and `missionHeldBy`, and the AI Graph **Leases** panel (`modules/37-lease-panel.js`)
shows them live. Don't add a new `...Until` field for a hold. Deliberately not leases: fireteam order renewal (on the order
record), the garrison request (a standing constraint), and execution timing inside one owner.

**Weapons and wounds.** `BattleWeapons.STATS` holds each kind's numbers and `PROFILES` each side's
weapon for it (Garand/Kar98k, M1919A6/MG42, Thompson/MP40, M1 Carbine/FG42, M1911A1/P38);
`SquadAI.createSoldier` issues it (`weapon.profile`, `magSize`, and `carried` where the load differs
from the kind's). A man opens aimed fire out to `SquadAI.engageRange(s)`: his weapon's range (roles no longer carry one,
except as a cap where the job is not the firefight: the defending engineer's 130 m), so the US scout
stops at the carbine's 250 m and the German scout reaches 450 m with the FG42's rifle cartridge. The
FBX backend draws the model the profile names (`PROFILES.<side>.<kind>.model` + `.fbx`), so what a man
carries and how it shoots cannot disagree. A selective-fire weapon (`autoWithin`, the FG42: 50 m) bursts only inside
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
decals (holes, blood on the ground) are thin instances per cell; wound decals are quads parented to
the hit bone (`BattleFbxSoldier.boneNode`, or the procedural `soldier.rig`), with a larger exit wound
on the far side and an exit spray on the ground wherever a round came out.

**Presentation never touches the combat RNG.** Voice, FX and audio must not draw from
`battle.random`; the same seed must simulate the same battle with or without assets
(`voice-determinism-check.js`).

**Formatting:** the M3C behaviour files (command, squad, engagement, movement, weapon rules) are
Prettier-formatted with `.prettierrc.json` (`npx prettier@3 --write <file>`). Don't hand-compress
them back into long single lines.

**Frozen:** path clearance, body width and hedgerow geometry. Hedges are one authoritative 3D
volume (2.2 m wide and tall) for rendering, nav, LOS and ballistics. Change it only on a
deterministic physical-navigation regression. v128 is the reference for movement feel.

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

### Open issues (as of 2026-09-27)

- **Runtime / animation performance audit (2026-09-27; approved direction).** Treat this as the
  current performance action queue for the full-fidelity 50v50 battle. Performance target at 100
  soldiers: **mobile 30 FPS floor / 60 FPS target; desktop 60 FPS target**. Preserve deterministic
  gameplay behaviour while changing presentation/runtime cost; measure before and after each item.
  1. **Animation/pose runtime cost is the first action item.** Imported soldiers currently run
     `applyPose` once per rendered frame while enabled, including locomotion/overlay blending,
     aiming, weapon hold, spine and support-hand work. Instrument pose time first, then keep animation
     clocks on simulation time while using shared cached base clip samples, cheap per-soldier sampling
     and dirty dynamic overrides. Recompute expensive aim/weapon/support-hand layers when their inputs
     change or while a transition is active, rather than deriving the same result every frame. Add
     automatic animation LOD: near soldiers update every frame; medium distance approximately
     20-30 Hz; distant soldiers approximately 5-10 Hz; offscreen soldiers hold the last pose until
     visible/dirty. Distances are presentation thresholds and must be tuned from visual tests, not
     tied to gameplay AI or ballistics.
  2. **Instrument the real asset/startup path before changing it.** The loading overlay currently
     reports real per-file counts for models, weapons and clips, but work inside a file is opaque.
     Add timings for download, Babylon FBX parse/import, clip conversion/resampling, rig/bone mapping
     or retargeting, sidecar/setup work, and final bind/ready time. Publish totals and slowest files
     in a browser-readable diagnostic payload and include them in the full-fidelity benchmark below.
     This instrumentation must not change simulation state or combat RNG.
  3. **Remove the 25 s imported-soldier timeout and the normal-game procedural fallback.** Today
     `BattleSoldierModel.preload` races `loadLibrary(scene)` against a 25 s timer; losing the race
     does not cancel `loadLibrary`, so a slow device can fall back visually while FBX parse/convert
     work keeps consuming CPU and memory. Approved target: normal gameplay is FBX/preprocessed-
     asset-only, waits for its required runtime assets, and surfaces a real load failure instead of
     silently substituting procedural soldiers. Remove the procedural *visual* soldier generator and
     its fallback plumbing from the normal runtime once callers are migrated. Keep only
     renderer-free/plain simulation representations that the trainer or headless harness actually
     require; Git history is the archive for deleted visual fallback code.
  4. **Make FBX an ingress/source format only; preprocess runtime animation offline.** Current startup
     parses FBX and converts clips in the browser: channels are canonicalised, filtered, resampled at
     30 Hz, looping root travel is removed/measured, and rigs may need mapping/retarget setup. Move
     those deterministic transformations into the asset/build pipeline. Source assets may remain FBX,
     but the browser should consume a game-ready artifact (GLB/glTF or a more compact custom pose/clip
     package, chosen from measurements) plus prepared metadata. Precompute rig maps, clip samples,
     root-motion/natural-speed metadata and any invariant calibration possible. Measured audit
     baseline: 92 live clip FBXs are ~35.6 MiB and the ten current paratrooper model FBXs are ~17.5
     MiB, ~53 MiB of raw FBX before weapons/textures/sidecars; reduce both startup CPU and transferred
     runtime bytes where the prepared format allows it.
  5. **Add a full-fidelity FBX/preprocessed-asset benchmark; keep the existing headless sim
     benchmark.** The existing benchmark intentionally isolates AI/simulation and uses abstract
     stance/body volumes, so it remains the fast deterministic regression benchmark. Add a separate
     browser benchmark that loads the real runtime assets with real soldiers, weapons,
     animation/pose work and Babylon rendering, with **no procedural fallback**. Record startup phase
     timings, steady-state frame time/FPS, render time, animation/pose time, draw calls/active meshes,
     and GPU timing where supported. Use representative desktop and mobile runs; start manual, then
     add a stable reduced case to CI if runtime and variance are acceptable.
  6. **Add render-side culling/LOD only after instrumentation says rendering is still material.**
     Use safe/precomputed animated bounds for frustum/offscreen culling and distance-based rendering
     detail. Do not hand-author lower-poly soldier variants first; generate/simplify far geometry in
     the asset pipeline only if GPU/draw-call measurements justify it. Also validate whether
     `preserveDrawingBuffer:true` is still required by screenshots/close-up tools and whether
     `renderEvenInBackground=true` is desirable on mobile; disable either only after proving its
     dependent workflows.
  7. **Re-profile simulation CPU after presentation work.** Exact LOS/nav pruning moved the headless
     hot path: `engagement.updateSoldier` and the movement resolver now lead the profile. Instrument
     their current call counts, allocations and inclusive time, then remove redundant calculations or
     allocation churn only with paired deterministic benchmarks and existing ownership checks. Do not
     trade AI behaviour for benchmark speed.
  8. **Safe audit cleanup is already staged separately in PR #62.** That draft fixes stale repository
     refs in launchers, improves the non-production GitHub-mirroring loader's local module discovery
     and excludes source ZIPs from mirroring, disables unused battle-scene stencil/pointer-move
     picking, freezes immutable imported/procedural materials, and suppresses redundant bounds sync on
     presentation-only meshes. Keep those low-risk presentation/loader changes separate from the
     behaviour-changing pipeline work above until visually validated.
  9. **Do not migrate engines to solve these findings.** The measured problems are asset preparation,
     skeletal update frequency, rendering work and simulation hot paths, not Babylon-specific
     architectural blockers. Optimize and benchmark Babylon first; reconsider Babylon Editor,
     PlayCanvas or a larger engine migration only if the measured target remains unreachable after
     the pipeline/LOD work.
  - **Dead-code/formatting conclusion from the sweep:** do not do a repo-wide Prettier rewrite or
    broad fallback purge. Prettier is intentionally scoped to the M3C behaviour files. The major code
    path newly designated obsolete is the procedural *visual soldier fallback* in normal gameplay;
    remove it deliberately with its callers/tests rather than deleting unrelated compatibility paths.

- Regroups: half used to time out at 18 s because the order anchor stayed with the leading men;
  fixed (timeouts 76 → 6 over 30 seeds). GitHub standard benchmark run 11 (PR #37, 2026-09-25,
  benchmark `regroups`): 9.4 regroups per battle in meeting, 7.3 in US-defend and 5.9 in GE-defend,
  with 15, 2 and 4 timeouts over 60/20/20 battles. Defend scenarios regroup no more often than
  meetings, so there is no defend-specific rise left to chase.
  - **Next: end a regroup on a result, never on a clock** (from the unmerged
    `claude/codebase-roadmap-review-lihw91`, 2026-09-19, measured on the pre-lease code). A timeout
    releases a squad that is still scattered straight back into the condition that opened the
    regroup, which reopens it after the cooldown: churn. There, removing the expiry raised regroups
    that ended closed up from 19% to 53% and cut entries 35%, over 10 matched 600 s seeds. Two
    parts, one change: (1) drop `REGROUP_MAX` and `REGROUP_BYPASS` so the `regroup` lease ends only
    on `cohesion restored` or an outside factor (contact, a live engagement plan); (2) add the
    outside factors it now needs. Retreat must end the lease (today `updateCohesion` returns early
    on retreat and the lease just runs out), and so must a new General brief, since a regroup holds
    mission execution (`_missionHold`) and without a clock a brief issued during one would never
    be picked up. Removing the clock there also exposed a squad pinned in a regroup for 510 s: the
    straggler/outrunner axis came from `sq.objective`, which the regroup overwrites with its own
    anchor. The `_formationForward` fallback almost never existed (SquadAI sets it only for men with
    no order destination): the `regroup-axis` probe found the axis collapsed on every regroup tick
    and a man behind the anchor scored as an outrunner on 60-75% of them. Fixed (2026-09-27): the
    regroup lease records the direction the squad was marching when it opened (`data.forward`) and
    `commandForward` uses it; `regroup-axis-check.js` guards it. Same probe after the fix (standard
    s1 seeds, 600 s): regroup samples scoring a man behind as an outrunner 89/121 → 13/61 meeting,
    91/145 → 7/64 US-defend, and half as many regroup ticks. GitHub standard benchmark, main run 23
    vs branch run 22 (PR #61, same seeds): regroup timeouts 124/9/16 → 58/1/12 (meeting/US-defend/
    GE-defend), movement stalls 45 → 34, wins within noise (meeting US 23 → 26 of 60, p=0.71;
    US-defend 16 → 14, GE-defend 1 → 2), captures 4.93/0.75/0.45 → 4.80/1.05/0.65, median wall
    10.9-13.4 → 12.0-12.9 s. Writer ping-pong on `sq.rally` (squad-orders vs the Squad Leader's
    regroup) rose 38 → 74 events per 100 battles: two writers of `rally` is the next thing to fix
    before removing the expiry. Then remove the expiry and benchmark that paired too.
- Window crowding (closed 2026-09-25): bodies at firing stations don't stack. A probe on 6 full standard
  seeds found 1 sample in ~20k occupied-station samples with two men on one station, and a non-holder
  on a held window in one battle only. The old "claim collisions 23 → 3,838" swing was `select()`
  counting every held window it passed over; that is now `reservedStationsSkipped`, and
  `claimCollisionsPrevented` counts only real claim-time collisions.
- Personal-space corrections (~8-10k per battle on the GitHub standard benchmark) are mostly same-squad
  men crossing on the move, not fights: pairs still overlapping 1 s later are rare (5-20 per battle).
  In order: (1) two men both on formation slots crossing. 75-83% of those are between different
  fireteams, and the rate is ~7× higher in the 6 s after a formation or facing change. (2) Bounding men
  walking through men holding. (3) Engagement `hold` endpoints within 0.9 m of each other. Hold isn't a
  physically allocated kind in `51` `DEST_KINDS`.
  - **Fireteam frontage (shipped 2026-09-26).** Team anchors were
    averages of per-man slots that alternate sides by `slotIndex`, while team membership also comes
    from `slotIndex`, so every team sat in the middle (alpha and bravo 1.2 m apart in line). The Squad
    Leader (`16` `desiredAnchor`) now gives each fireteam its own offset in the squad frame; new
    `fireteam-frontage-check.js` (main fails it). GitHub standard benchmark, main run 17 vs branch
    run 16: corrections −12% meeting, −2% US-defend, −12% GE-defend; destination conflicts −13 to −44%;
    wins within noise (meeting US 31 → 25 of 60, p=0.36); median wall 26.7 → 28.6 s; movement stalls
    40 → 49 (the worst is a straggler stopping in `alert` while catching up, a pattern main also shows).
    If it regresses movement feel, revert it as a unit.
  - **Next: spawn men near their formation slots.** Cross-team crossings barely changed with frontage,
    and about half come in the first minute: men spawn in a random cluster around the lane
    (`battle-sim.js` `spawnSide`, `modules/10-infantry-squad.js`), ignoring their slot, then cross each
    other to sort out. Placing each man at his fireteam position at spawn is its own change, and it
    changes the seeded start, so benchmark it paired on GitHub.
- Strategic-stall wakes used to re-pick the same objective (77% of 111 wakes over 10 local replays);
  a stall now closes the stalled efforts (see Main effort), which cut repeats to 46% (local, before
  the merge with the frontage limit). GitHub standard benchmark, main run 15 vs branch run 14 (same
  100 seeds): no measurable outcome effect. Wins US/GE 31/29 → 33/27 meeting (Fisher p=0.85), 18/2 →
  20/0 US-defend and 0/20 → 2/18 GE-defend (p=0.49), captures 2.99 → 2.92, mean longest no-progress
  283 → 277 s, meeting spread 2.33 → 2.46 objectives per side, same winner on 88/100 seeds. Open:
  the benchmark now exports `stallOutcomes` per battle and a "Stall repeats/wakes" column per type;
  read the post-merge repeat rate from the next standard run, find what the remaining repeats are
  (`stall-wakes` probe: no other objective left, or `stallCost` too low against distance), and only
  claim a win effect from a 300-battle run.
- Hot path: `sightBlocked` and navigation replans were ~half a battle's wall time; exact pruning
  (crossed-cell first-hit LOS, wall bounding boxes, lazy `planLocal` edges) halved it. Standard
  benchmark median wall time per battle 29.1 → 13.5 s (meeting 29.1 → 13.2, US-defend 31.3 → 16.3,
  GE-defend 33.1 → 13.9), main run 15 vs branch run 14. Hot-path profile on
  `standard-benchmark-meeting-s1-b0001-0001` (300 s): `sightBlocked` 7.3 → 2.1 µs/call, physical
  replan 360 → 42 µs, `findPath` 564 → 83 µs, `movementClear` 5.5 → 1.75 µs. `engagement.updateSoldier`
  and the movement resolver now lead the profile; they are the next optimisation target.
- Movement Progress ignores retreat by design; `movementStopReason` is the observable.
- Next architecture steps: a versioned `SquadIntent` + one intent resolver (leases, with priority, progress tests and a graph view, now exist), a real Squad Leader local planner, then
  platoon/company command, fallback/counterattack and combined arms. Capture Zone and
  Prepared Defense already publish *requests* that Force Command accepts; follow that pattern.
- Meeting engagements deliberately get no runtime engineer fortification (`engineerTick` exits early).
- **Sergeant weapons.** Squad leaders carry the `smg` kind: US Thompson, GE MP40 (`BattleWeapons.PROFILES`).
  Their grips use the generic `WEAPON_POINTS`; set per-model sidecars in the Motion Lab. They rarely
  fire, and that is range, not a gate bug: the `fire-gates` probe (standard s1 seeds, 600 s) found 0
  rounds in meeting and US-defend, where the target a leader holds is 350 m+ away in >85% of samples
  and the SMG reaches 150 m; in GE-defend, when attackers close, 69 trigger pulls (276 rounds). If
  leaders should shoot more, it is the Squad Leader closing to assault range more often (a tactics
  change, benchmark it), or a rifle for US leaders (many carried the Garand), not a looser gate.
- **Scout balance after the FG 42 (PR #55, merged as is, to tweak).** Scouts carry US M1 Carbine
  (250 m) / GE FG 42 (full-power round, 450 m, bursts only inside 50 m). The paired standard benchmark
  (main run 21 vs branch run 20, same seeds, with the view cones below also in the branch) moved meeting
  wins US/GE 37/23 → 23/37 (Fisher p=0.017; 44/60 same winner), meeting kills US/GE 29.7/25.6 →
  26.6/30.9, US-defend 19/1 → 16/4 (p=0.34), GE-defend unchanged 1/19. Not yet attributed: benchmark
  the scout change without perception (and the reverse) before tuning. Levers, smallest first: German
  scouts on the Kar98k (the regular infantry issue; the FG 42 was a Fallschirmjäger weapon, ~7,000
  made), a shorter FG 42 practical range, or a wider FG 42 group at range. Presentation gaps left for
  the FG 42: it plays the carbine sound (audio is out of scope without an ask). The FBX backend now
  picks the burst fire clip from the trigger pull itself (a round with a burst `delay` marks it), so
  FG 42 bursts no longer restart the clip each round and its single aimed rounds play the rifle clip.
- **Perception follow-ups.** View cones cut sightings of an enemy behind the man from 6-13% of fresh
  acquisitions to <1% (`perception` probe, standard s1 seeds). Relay and hearing gave a squad its
  first contact once in 29 squads: sight (450-575 m) outruns hearing (120 m) in open battles. The
  probe records only first contact; count how often heard/relayed word re-acquires a squad that lost
  sight mid-fight before tuning `HEAR_RANGE`/`RELAY_RANGE`. Relay distance is squad centre to squad
  centre (50 m); the other reading of the request, enemies within 50 m of the unaware squad, is a
  one-line change in `squadSenses`. Defenders facing one way have no sector scan: a sweep for a man
  holding still with no contact is the next step if flanks go unseen.
- **Bullet holes float in front of scatter cover (open, fix proposed).** `14-z-ballistic-raycast.js`
  `obstacleStop` stops the ray at the obstacle field's tactical cover circle, not the rendered object
  (`terrain-features.js` `scatter`): a log is a 0.55 m cylinder but its circle is `len*0.42`
  (1.1-2.0 m), a tree trunk `0.11*scale` vs `1.15*scale`, a rock box vs `size*1.1`, a wall stub
  0.5 m thick vs a 1.6 m circle set off the wall. The hole and its radial normal land where the round
  stopped in the air. Fix at the ballistics owner: when the ray crosses a cover circle, intersect the
  linked `physicalId` footprint (OBB or circle, with its height) and let the round fly on if it misses;
  sight and cover abstractions stay as they are. It changes combat (rounds that used to stop in the
  air fly on), so benchmark it paired. Not a decal-shader job: a projected or UV-space decal only
  draws on real geometry, so it would hide the wrong impact point, not fix it; consider UV-space decals
  later only for curved surfaces if flat quads still look wrong once impacts sit on the real shape.
- **Wound decals should be drawn on the skin, not as floating sprites (open).** Today
  `15-bullet-impact-fx.js` `woundDecal` places a flat quad at the hit bone's position plus a fixed
  radius per zone (`BODY[zone].out`: head 0.13 m, chest 0.16, abdomen 0.15, arm 0.08, leg 0.11) toward
  the shooter, clamped into a height band, and parents it to that one bone. It never meets the real
  mesh, so it floats off a slim torso, sinks into a bulky one, stays flat on a curved limb and slides
  as skin deforms across joints. Proposal, presentation only: a material plugin on the soldier's
  skinned material (Babylon `MaterialPluginBase`) that draws wounds in the fragment shader. Each wound
  is stored as a point in the mesh's bind pose (the unskinned vertex space, found from the ray hit on
  the skinned mesh), with a radius, a blood-sheet cell and entry/exit kind, in a small per-soldier
  uniform array (`MAX_PER_SOLDIER`); the shader compares the bind-pose position it passes through as
  a varying, so the wound sits on the surface and moves with the skin. Soldiers of one model share a
  material, so a wounded man gets his own material clone (or a per-instance data texture) on his
  first wound. Alternative: Babylon's UV-space decal maps (`MeshUVSpaceRenderer` / `decalMap`), at a
  texture per wounded soldier. The procedural rig (`rig===null` soldiers, benchmarks) keeps quads or
  gets the same plugin on its part materials. Keep it off the combat RNG, update `impact-fx-check.js`
  (it asserts wound decals on the hit bone) and prove it with `scripts/closeup_damage_fx.cjs` /
  `closeup_battle.cjs CLOSEUP_TARGET=wounded` against a preview. The world decals (holes, ground
  blood) stay thin-instanced quads; see the floating bullet-hole item above for why those are an
  impact-point bug, not a rendering one.
- **Page-load hiccup (watch).** One local probe run logged `ReferenceError: BABYLON is not defined`
  from an inline script (line 95 of the page `battle_sim_local.php` serves) on the GE-defend battle; the battle still
  ran and reported. Seen once; if it recurs, make that inline script wait for Babylon.
- **Forward movement: no backward orders while the squad advances (open).** A man should not be sent
  behind the squad's firing line unless the squad is retreating or withdrawing; a short lateral or
  backward step to adjacent cover is fine, but nothing that walks him back while the rest of the squad
  moves forward. Today only one guard exists: `44-combat-urgency.js` `allowCover` rejects cover less
  than `MIN_COVER_FORWARD` (1.5 m) forward along the objective axis, and only in the `assault` phase
  and only when not suppressed. Engagement's own `findCover` searches up to `COVER_RANGE_UNDER_FIRE`
  (42 m) and uses `squadForward` only as a scoring hint, so a cover slot well behind the line can win.
  Owner: the line belongs to the Squad Leader (it knows the order anchor and phase), the choice to the
  producer that picks the point (Engagement cover, 44 urgency, 52 survival routes), so publish the
  line once (e.g. the fireteam's order anchor projected on the objective axis) and have each producer
  score or refuse points behind it, with an allowance (a few metres) for adjacent cover and none of it
  in retreat or withdraw. Don't add the guard in the resolver. Measured with the `backward-orders`
  probe (main, standard s1 seeds, meeting 300 s / GE-defend 240 s): 27%/29% of new destinations lie >3 m
  behind the man's fireteam line, but almost all are men already behind it told to hold or react in
  place (`engagement/hold`, `contact-reaction`). Destinations that are both behind the line and a
  step back from the man are rare (11 of 1,819 in GE-defend: firing stations 6, cover bounds 4,
  formation 1). Plain backward steps (119 / 68) are mostly `squad-stability/formation` slots. Sweep
  more seeds before deciding a guard is worth it.
- **Stance churn and firing mid-change (open).** Still seen: stand-crouch-stand loops, a man going
  prone to fire one round, standing, going prone again, and firing while changing stance. Engagement
  owns stance (`commitStance` holds it `STANCE_HOLD` 4 s / `PRONE_HOLD` 5.5 s and pushes
  `fireReadyAt` by `AIM_SETTLE` 0.4 s), but three other writers bypass that hold: `44-combat-urgency.js`
  sets `s.prone`/`s.tacticalCrouch` directly in its drills, `12-soldier-animation-events.js` sets
  `tacticalCrouch` on every reload (a presentation module writing sim state), and `stepMovement`
  (`battle-sim.js`, mirrored in `harness.js`) derives `crouching` each frame from `tacticalCrouch`,
  suppression and "target and near the destination". Two writers is itself the bug (see the workflow
  above), so first make every stance change go through Engagement (`commitStance`, or a request
  Engagement arbitrates), which also makes `AIM_SETTLE` cover every change so nobody fires mid-change.
  Whether the commitment is a lease: `BattleLeases` is for holds that block another layer's intent,
  and stance should stay inside one owner, so a per-man stance commitment on `eng` (stance, since,
  until, reason) is enough once there is one writer; make it a lease only if another layer still has
  to ask to break it. Stance by distance, as a starting rule: prone at long range, crouch at medium,
  standing only close or to fire over cover that a lower stance can't see past; commit to it until
  ordered to move, suppressed, or the cover at hand changes. Today `fightingStance` goes prone past
  `max(70, 0.55 × engageRange)` (247 m for a rifle now that range is the weapon's 450 m), only for
  riflemen and gunners (`PRONE_ROLES`); scouts and leaders always crouch. Measured with the
  `stance-churn` probe (standard s1 meeting, 300 s): 4.4 shown stance changes per man-minute (3.2
  committed by Engagement) and 436 A→B→A bounces under 1 s. `stepMovement` (`battle-sim.js`,
  deriving `crouching`) makes 70% of shown changes, and nearly all bounces are Engagement setting
  `tacticalCrouch` then `stepMovement` undoing it, or `stepMovement` against itself. The reload hook
  flips `tacticalCrouch` 562 times and 44 184. Firing mid-change is rare (5 of 644 pulls); prone
  spells shorter than `PRONE_HOLD` are common (88 of 188, all ended by Engagement). `run.js` misses
  it because it reads Engagement's committed `eng.stance` on one man in a 30 s duel, without
  module 44 or the reload hook.
- **Snipers (pending).** Scoped rifles (M1903A4, Kar98k with ZF39) are a separate role, not the
  scouts; they need weapon models and their own aiming rules.
- **Secondary weapons (pending).** A soldier carries a sidearm only where it was historically
  issued. In a German squad the MG gunner (Schütze 1, P38/P08) did. In the US squad the M1919 gunner
  (M1911A1) did, and so did paratroopers more widely. Riflemen generally didn't. It needs a
  `secondary` weapon slot on the soldier (model, ammo and stats kept apart from the primary). It also
  needs an Engagement rule for when to switch: primary empty or jammed with a target inside pistol
  range. The pistol hold, the `m1911a1`/`p38` models and the pistol clips already exist. Presentation
  stays off the combat RNG.
- **Any soldier, any weapon (pending).** Weapons are still dealt by role: `ROLES.<role>.weapon`
  sets the kind and its rules, and `PROFILES` picks the model and numbers per faction. The goal is a
  per-soldier loadout, a primary plus the secondary above, where any class can carry any weapon.
  Shot stats, ammunition, engagement range and the rendered model already follow `soldier.weapon`.
  Two things are still tied to the role: `battle-sim.js` deals the weapon from `ROLES[role].weapon`,
  and Engagement ties the MG behaviour
  (emplacement, never bounding) and reaction times to `role === 'gunner'`. Both would move to the
  weapon kind.
  The art side is mostly there: every model's sidecar can hold a seat for each weapon
  (`us-captain.fbx.json` already has all 12), but other models need their seats measured in the
  Motion Lab. Loadout changes range, damage and fire rate, so ship it with a paired benchmark.
- **General concentration of effort.** Done as a frontage limit in `chooseObjective` (see Main effort).
  GitHub standard benchmark, main run 12 vs PR #37 run 11 (same seeds, live policy rev 14): meeting
  spread fell 2.75/2.60 → 2.33/2.33 objectives per side with captures unchanged (4.53). Wins were
  unchanged too (US/GE 32/28 → 31/29 meeting, 19/1 → 18/2 US-defend, 2/18 → 0/20 GE-defend; median
  wall time 27.9 → 26.5 s). The win effect of concentrating is unmeasured; both sides concentrate, so
  it needs a one-sided arm of ~200+ battles. A platoon layer is not warranted at 5 squads per side;
  revisit at ~9+ squads or combined arms.

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
- Weapons (the model `BattleWeapons.PROFILES` names per side and kind): rifle Garand / Kar98k, LMG M1919A6 /
  MG42 (folded-bipod carry variants), scouts M1 Carbine / FG42, sergeants Thompson / MP40
  (the M1911A1 / P38 models are for the pending sidearm slot). Babylon is pinned to `babylonjs@9.27.1`.
- **Weapon seats and sidecars.** Hand contacts and weapon points default to `SOLDIER_CONTACTS`,
  `WEAPON_POINTS` and `WEAPON_MODEL_POINTS`. A per-model sidecar `Assets/soldiers/<model>.fbx.json`
  (contacts, one slot per weapon: grip / fore-near / fore-far, pistol arm and wrist dials) overrides
  them; the backend fetches it on load (`BattleFbxSoldier.sidecars()` lists what loaded). Measure in
  `labs/fbx-animation-lab.html` (pick model, clip and weapon, click the contact vertices, **Seat
  weapon**, then **Per-model sidecar** → Save), which posts to `labs/save-calibration.php` (validated
  numbers, existing soldier FBX names only). Saving needs the lab password, asked once per browser;
  its hash lives only on the host in `state/lab-key.php` (`<?php return '<sha256 hex>';`, from
  `printf '%s' 'password' | shasum -a 256`), and without that file saving is off. Pistol slots
  never carry fore points (one-hand hold, in the lab and the game). Sidecars are server-owned:
  never committed, never deployed or deleted.
- Clips are retargeted at load (rest pose, units, hip height). Looping clips have hip drift removed,
  and that drift becomes their natural ground speed. Playback rate is ground speed ÷ clip speed.
  The upper-body overlay (aim/fire/reload) sits on the lower locomotion layer. The weapon grip snaps
  to a right-palm anchor, the fore-end runs through the left palm, and aim uses a capped spine twist (≤40°).
- Fallback: the procedural rig in `battle/soldier.js` is used while the FBX loads (25 s cap), and the
  trainer and headless benchmark always use it (`setImportedEnabled(scene,false)`). Procedural soldiers
  keep their `rig` object; FBX soldiers have `rig===null` and a `_fbx` binding.
- **Animation LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.lod`, presentation only): the
  render hook re-poses a soldier every frame within 35 m of the camera, at ~30 Hz within 100 m and
  ~10 Hz beyond (each on his own phase), never while he is outside the view frustum, and only once
  while his pose inputs are static (a finished death clip, a paused sim). Clip clocks stay on sim
  time. `?animLod=0` turns it off. Thresholds are tuned from close-ups, never tied to gameplay.
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
