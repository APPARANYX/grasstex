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
URL flags: `?seed=`, `?defender=us|ge`, `?soldiers=rifleman`, `?smooth=0`, `?animLod=0` (pose every soldier every frame), `?mergeWalls=0` (draw each building wall piece separately), `?soldierLod=0` (every soldier at full mesh detail), `?clipPack=0` (parse every clip from its FBX instead of the prepared pack), `?fastRetarget=0` (retarget clips with the old matrix loop), `?weaponInstances=0` (a cloned weapon mesh per soldier), `?tracerPool=0` (a new line mesh per tracer, as before the pool), `?fxPrewarm=0` (build muzzle flashes, tracer lines and decals on first use, as before), `?perfTimings=1`, `?bench=1` (device benchmark, below).

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
| `scripts/benchmark_full_fidelity.cjs` | Full-fidelity browser benchmark: real FBX soldiers, weapons, clips and rendering; fails on a failed FBX load or any procedural soldier. Startup phases and per-file timings, then `FF_SECONDS` (60) rendered after `FF_WARMUP` (90) fast-forwarded sim seconds: FPS, CPU, render, sim, pose per layer, draw calls, GPU where supported. Writes `full-fidelity.json` + `.md` to `FF_OUT`. `FF_URL`, `FF_SEED`, `FF_TIMESCALE` (4), `FF_VIEWPORT`, `FF_GPU=1`, `FF_ISOLATE=0`, `FF_QUERY` (e.g. `animLod=0`), `FF_CADENCE=60` (a virtual 60 Hz clock so per-frame numbers describe a 60 FPS device; wall FPS is then meaningless). Served cross-origin isolated for 5 µs timers. SwiftShader numbers are a CPU-only baseline; the headless benchmark stays the AI regression benchmark. |
| `scripts/run_battle_benchmark.mjs` | N headless battles. `BATTLE_BENCHMARK_COUNT/SEED/URL/STEP/TIME_LIMIT/OUTPUT`. `merge_battle_benchmarks.mjs` merges shards. |
| `scripts/profile_battle_hotpaths.mjs` (+ `battle-hotpath-profiler.cjs`) | Inclusive wall time per hot function. `BATTLE_PROFILE_SEED/TYPE/SECONDS`. |
| `scripts/profile_meso_churn.mjs` (+ `meso-churn-profiler.cjs`) | Meso fireteam order churn attribution |
| `order-ingress-`, `physical-point-`, `movement-goal-transition-`, `resolver-order-mutation-profiler.cjs` | Inject-only observers: who proposes orders, destination provenance, goal transitions, resolver mutations. They never change behaviour. |
| `scripts/battle-benchmark-intent.cjs` | Shared benchmark predicates (targetless/route-active) |
| `scripts/closeup_damage_fx.cjs` | Damage FX close-ups (see Visual checks); fails on page errors. `CLOSEUP_OUT` (default `closeups/`, gitignored), `CLOSEUP_SEED`, `CLOSEUP_SHOTS`, `CLOSEUP_SIM`, `CLOSEUP_BODY`, `CLOSEUP_DIST`. 5-10 min under software WebGL. |
| `scripts/preview_decal_sheets.cjs` | Contact sheet of `Assets/effects/decals/*.png` over surface-like backgrounds with the 4 x 4 grid and row names; check a regenerated or painted sheet before it ships. No server. `DECAL_PREVIEW_OUT`. |
| `scripts/probe_pistol_cup.cjs` | Motion Lab pistol support cup at a fixed 60 Hz: cup gap (cm), degrees the left arm is bent off the clip, and hand jerk (deg/frame², solved vs the clip's own) per clip. `CUP_SIDECAR=<model>.fbx.json` (a server sidecar; they are never committed), `CUP_CLIPS`, `CUP_SERIES=1`. |
| `scripts/probe_lod_shadows.cjs` | Animation LOD vs shadows: adds a directional light and ShadowGenerator, aims a narrow camera at one soldier's shadow with him out of view, and checks he is held with no caster, posed as a caster, held when the shadow falls away, posed under a caster predicate. `LODSHADOW_URL`. |
| `scripts/probe_merged_walls.cjs` | Merged building walls: loads one seed with and without `?mergeWalls=0` and checks building meshes and draw calls, total vertices, world bounds, and a town screenshot from one camera with the HUD hidden (fails above `MW_MAXDIFF`, 0.2% of pixels). `MW_URL`, `MW_SEED`, `MW_OUT`. |
| `scripts/probe_soldier_mesh_lod.cjs` | Soldier mesh LOD: each model's full and far triangle/vertex counts, and one posed soldier (after ~20 s of battle) shot at full detail and on the far list from `SMLOD_DIST` metres at the iPhone canvas size, side by side (`d<m>m.png`, full \| far) with the share of differing pixels. Tune `meshLod.far` from these. `SMLOD_URL`, `SMLOD_SEED`, `SMLOD_VIEW`, `SMLOD_OUT`. |
| `scripts/probe_weapon_instances.cjs` | Weapon instancing: draw calls with and without `?weaponInstances=0` over the armies, and inside the instanced page each weapon's world matrix and a close-up against a temporary clone on the same socket (same frame, so exact). `WI_URL`, `WI_SEED`, `WI_OUT`, `WI_MAXDIFF`. |
| `scripts/probe_clip_pack.cjs` | Loads the page with `?clipPack=0` and as shipped, each in a fresh context: every converted and every model's retargeted clip must be bit-identical, and the shipped load must fetch no clip FBX. Reports the soldiers phase, FBX parse and clip bytes each way. `CLIPPACK_URL`, `CLIPPACK_OUT`. |
| `scripts/probe_retarget.cjs` | Quaternion retarget vs `?fastRetarget=0` (matrix), each load in a fresh context: worst difference in every model's rotation and position samples, clip speeds and strides, and solved grips, plus retarget time each way. Fails above `RT_MAX_ROT`/`RT_MAX_POS` (1e-5). `RT_URL`. |
| `scripts/probe_gait_clips.cjs` | Which FBX locomotion family (walk/run/sprint/crouch/crouchRun) each sim gait actually plays, at what rate, plus each model's natural clip speeds (in-place clips: foot stride). `GAIT_URL` (default production), `GAIT_SEED`, `GAIT_SECONDS`, `GAIT_OUT`. |
| `scripts/run_probe.cjs` + `scripts/probes/*.js` | Observe-only probes on full benchmark battles (0.15 s step, procedural rig). `PROBE=<name>[,<name>]`, `PROBE_BATTLES=<type>:<seed>,…` (default one standard seed per type), `PROBE_SECONDS`, `PROBE_OUTPUT`, `PROBE_CONTROL=1` (also runs each battle without probes and fails if the end state differs). Serve with `PHP_CLI_SERVER_WORKERS=4 php -S …` or page loads stall. Probes: `station-occupancy` (bodies vs reservations at firing stations), `close-pairs` (who the <0.9 m pairs are, and the rate after formation/facing changes), `regroup-episodes` (every `regroup` lease: end reason, order anchor and destinations vs the rally point), `stall-wakes` (each strategic-stall wake: repeat, and whether another objective was open), `damage` (rounds by weapon, wounds by zone and outcome, and of body hits the share that went through, struck a second man or flew on), `fire-gates` (per role: trigger pulls, target distance bands, and the first fire condition that fails while a man holds a target), `backward-orders` (new destinations behind the man's fireteam line or behind the man himself while the squad advances, by producer and phase), `stance-churn` (shown stance changes per man-minute by writing file, A→B→A bounces under 1 s, trigger pulls within `AIM_SETTLE` of a change, prone spells shorter than `PRONE_HOLD`), `regroup-axis` (regroup ticks whose forward axis collapsed, and men behind the anchor scored as outrunners). |

**Device benchmark** (`modules/97-device-benchmark.js`, inert without the flag): open the page with
`?bench=1` on any phone or computer, tap **Start benchmark** and keep the tab in front. It
fast-forwards `benchWarmup` (60) sim seconds to contact, plays `benchSeconds` (60) with the normal
render loop and reports (result v6): FPS (median, mean, 5%/1% lows); frame, CPU, render, sim and
pose time; GPU time where the browser has a timer query; device and renderer; the load breakdown;
where `scene.render` goes (hooks by name, active-mesh evaluation, `Skeleton.prepare`, draw,
unattributed); draw calls by kind; frame pacing (refresh rate, share of frames taking 1, 2, 3…
refreshes); and the 10 worst frames, with the meshes created just before each. **Copy results** /
**Download JSON** (nothing is uploaded; also `window.__deviceBench`). Flags: `benchCam=close` (the
biggest group from 90 m), `benchHide=soldiers[,weapons,decals,hedges,terrain,objectives,walls,cover]`
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
| Meso: Squad Leader / Squad Command | `modules/16-squad-plan-stability.js` (`executeMission`, `fireAndMovement`; SquadAI's `squadCommand` owner) | stable squad plan: fireteams, formation, order anchor, fire and movement (assault authorisation, bound cycle and team), corner pauses, defensive posts, regroup, the forward line (`sq._forwardLine`), objective phase; the only writer of `commandPhase` (setup states it through `initialPhase`) | do obstacle avoidance; republish orders every tick |
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

### Open issues (as of 2026-09-28)

Short on purpose: the measurements behind each item are in the PRs and commit messages it names,
and the long-form notes as of `3972d3b` are in git history (`git show 3972d3b:AGENTS.md`).

**Performance audit (approved direction, 2026-09-27).** Target at 100 soldiers: mobile 30 FPS
floor / 60 target, desktop 60. Runtime and presentation changes must leave gameplay deterministic;
measure before and after each. Don't migrate engines: what was found is asset preparation,
skeletal updates, rendering and sim hot paths, not Babylon limits.

iPhone Safari, portrait 390×645, `?bench=1&seed=bench1`, overview camera:

| Build | FPS mean / median | 1% low | CPU per frame | Draw calls |
| --- | --- | --- | --- | --- |
| v197 | 33 / 40 | 9 | 15.1 ms | 226 |
| v201 (#74 mesh LOD) | 47 / 56 | 13 | 14.4 ms | 224 |
| v205 (#76 tracer pool, #77 weapon instances) | 58.8 / 58.8 | 34.5 | 8.9 ms | 180 |
| v206 (#79 effects warm-up), two runs | 59.3 / 58.8 and 46.6 / 58.8 | 38.5 and 19.6 | 8.4-9.9 ms | 180-189 |
| v210 (#81 clip pack, #83 retarget; canvas 390×797) | 56.8 / 58.8 | 21.3 | 9.0 ms | 173 |

Home-screen app, landscape 844×797, v206: 52.2 / 58.8, 1% low 23.3, CPU 11.5 ms. The wider
view poses and draws more (13 soldiers posed per frame, 208 draw calls), and its two-refresh
frames average 16 ms of CPU, so landscape is CPU-bound. MacBook M1 Chrome (#68): 123 FPS median,
CPU 7.3 ms, GPU 10.2 ms (GPU-bound). v210 (1× sim speed, so CPU is not comparable): 154 FPS median,
1% low 101, GPU 7.1 ms, 99.6% of frames within one 144 Hz refresh.

- **Done:** instrumentation and the full-fidelity benchmark (#64), animation LOD (#65), device
  benchmark (#66; pacing #71, `benchHide` #72, worst frames #78), held soldiers skip
  `Skeleton.prepare` (#68), audit cleanup (#62), merged walls (#70, `town-objectives.js` `mergeBuildings`), soldier mesh LOD (#74),
  tracer pool (#76), weapon instancing (#77), effects warm-up (#79). Pose caching on unchanged
  inputs was dropped: a living soldier's inputs change every frame. The "first-contact sim spike"
  was the muzzle-flash pool, built inside `onFire` during the sim step; gone since #79 (hot-path
  profile, same battle: worst step 78.5 → 21.1 ms). On the iPhone (v208) no worst frame creates a
  mesh and the first-contact sim step is 8 ms; the remaining worst frames are time beyond CPU
  (GPU or compositor), spread through the battle.
- **Reading device runs:** the 1% low varies more between runs than recent changes moved it, so
  compare lows over several runs per build, same seed and orientation, fresh Safari tab (a
  long-lived tab ran 1.5-2.5× slower), phone cool. Worst frames slow in every stage at once are
  browser or OS pauses. Safari has no GPU timer: cost a kind by running with and without
  `benchHide`. A 113 s load in one run was download time; normal is ~21-24 s.
- **Next, in order:**
  1. **Startup.** Clips now load from the prepared pack: locally the soldiers phase went from
     17.9 to 5.9 s and FBX parse from 13.5 to 2.1 s, bit-identical clips (`probe_clip_pack.cjs`).
     iPhone Safari (v208): whole load 20.7-23.9 → 8.3 s, soldiers phase 17.5-19.7 → 5.0 s, FBX
     parse 0.9 s. Retargeting onto the 10 models now runs in quaternions, within 1.3e-6 of the
     matrix loop (`probe_retarget.cjs`); a pack of retargeted clips would be ~45 MiB (every model
     differs), so it stays at load. Sidecars are fetched from the start of the load. v210: iPhone
     load 5.4 s (soldiers 2.2 s, retarget 3.16 → 0.23 s); MacBook load 3.6 s. The largest item
     now is binding the 100 soldiers (13.8 ms each, 1.4 s of the 2.0 s navigation-and-squads
     phase on the iPhone), then the 10 model FBX (~1 s) and the far-LOD lists.
     (a) Remove the 25 s imported-soldier timeout and the procedural *visual* fallback in normal
     gameplay: `BattleSoldierModel.preload` races `loadLibrary` against a timer, and losing does
     not cancel the load. Normal gameplay waits for its assets and shows a real failure; keep only
     the renderer-free representations the trainer and headless harness use, and remove the
     fallback with its callers, not as a broad purge.
     (b) Finish FBX-as-ingress for the 10 soldier models. The **runtime far mesh LOD is already
     implemented and shipped** (#74): each model gets a simplified triangle list and soldiers
     switch to it beyond the far threshold. What is still pending is moving deterministic startup
     work out of the browser where the payload tradeoff is favorable: prepare the soldier models
     and the **already-designed far-LOD geometry** offline in a browser-ready runtime format. Do
     **not** prepackage the fully retargeted clips for all 10 models under the current measurements:
     that package was ~45 MiB and would likely cost more to download than the old ~3.2 s retarget
     step; after #83, quaternion retargeting is only ~0.23 s on the iPhone, so retargeting stays at
     runtime unless new measurements materially change that tradeoff. Do not treat "build far LOD
     offline" as unfinished LOD behavior; the remaining task is pre-baking its data so startup no
     longer has to build it. The 10 source model FBXs are still loaded at runtime today (~17.5 MiB
     total directionally noted here).
  2. **Landscape CPU:** what the extra posed soldiers, weapons and decals cost per frame.
  3. **Sim CPU:** `squad.updateSoldier` (Engagement, sight) and the movement resolver lead
     the hot-path profile. Remove redundant work or allocation churn only with paired
     deterministic benchmarks and the ownership checks; never trade behaviour for speed.
  4. The benchmark's draw-call census counts weapon instances as separate draws; fix it.
  5. The close camera (under 45 m, soldiers at full detail) is unmeasured.
  6. Check that `preserveDrawingBuffer:true` (screenshot tools) and `renderEvenInBackground`
     are still needed on mobile before turning either off.
- Don't do a repo-wide Prettier rewrite: Prettier is scoped to the M3C behaviour files.

**Behaviour**

- **Regroups: end on a result, not a clock (next).** The regroup lease keeps the direction the
  squad was marching (`data.forward`, `regroup-axis-check.js`) and re-forms on the forward line;
  timeouts fell 124/9/16 → 58/1/12 (#61) and 89 → 73 (#67). Before removing `REGROUP_MAX` and
  `REGROUP_BYPASS`, fix the two writers of `sq.rally` (squad-orders vs the Squad Leader's regroup;
  ping-pong 38 → 74 per 100 battles), then make retreat and a new General brief end the lease (on retreat
  `updateCohesion` returns early and the lease just runs out; a regroup holds `_missionHold`). Without the clock, an older branch measured regroups ending closed
  up 19% → 53% and 35% fewer entries. Benchmark paired.
- **Personal-space corrections** (~8-10k per battle; pairs still overlapping 1 s later are rare,
  5-20). Mostly same-squad men crossing on the move: formation-slot crossings between fireteams
  (~7× more often in the 6 s after a formation or facing change), bounding men through holding
  men, and Engagement `hold` endpoints within 0.9 m (`hold` is not a `DEST_KINDS` kind in `51`).
  Fireteam frontage shipped (`fireteam-frontage-check.js`; revert as a unit if movement feel
  regresses). Next: spawn men at their fireteam slots (`battle-sim.js` `spawnSide`,
  `10-infantry-squad.js`); about half of cross-team crossings happen in the first minute. It
  changes the seeded start, so benchmark it paired.
- **Strategic-stall wakes.** A stall closes the stalled efforts (repeats 77% → 46%, no
  measurable win effect). Read the repeat rate from the benchmark's `stallOutcomes` column, find
  what remains with the `stall-wakes` probe, and claim a win effect only from a 300-battle run.
- **Forward movement: no backward orders while advancing (open).** `sq._forwardLine` (#67, `forward-line-check.js`)
  is the mean of the front half of the squad along the advance axis plus a 5 m cover band, cleared
  in retreat; producers don't read it yet. The only guard is `44` `allowCover`
  (`MIN_COVER_FORWARD` 1.5 m, assault phase, not suppressed); Engagement `findCover` (up to `COVER_RANGE_UNDER_FIRE`, 42 m)
  uses `squadForward` only for scoring. Fix it in the producers (Engagement cover, 44, 52) with a
  few metres' allowance and none in retreat or withdraw, never in the resolver. The
  `backward-orders` probe found real backward steps behind the line rare (11 of 1,819 in
  GE-defend): sweep more seeds before deciding a guard is worth it.
- **Stance churn and firing mid-change (open).** Engagement owns stance (`commitStance`:
  `STANCE_HOLD` 4 s, `PRONE_HOLD` 5.5 s, `AIM_SETTLE` 0.4 s), but three writers bypass it: `44`
  drills set `prone`/`tacticalCrouch`, `12-soldier-animation-events.js` sets `tacticalCrouch` on
  every reload (presentation writing sim state), and `stepMovement` (mirrored in `harness.js`)
  derives `crouching` each frame. Route every change through Engagement first; a per-man
  commitment on `eng` is enough, a lease only if another layer must break it. Starting rule: prone
  at long range, crouch at medium, stand only close or to fire over cover. Today `fightingStance`
  goes prone past `max(70, 0.55 × engageRange)` and only for `PRONE_ROLES` (riflemen, gunners). `stance-churn` probe
  (meeting, 300 s): 4.4 shown changes per man-minute, 436 A→B→A bounces under 1 s, 70% of changes
  from `stepMovement`, firing mid-change 5 of 644 pulls. `run.js` misses it (one man, no module 44
  or reload hook).
- **Scout balance after the FG 42 (#55).** Meeting wins US/GE 37/23 → 23/37 (p=0.017), with the
  view cones in the same branch, so not yet attributed: benchmark the scout change without
  perception and the reverse before tuning. Levers, smallest first: German scouts on the Kar98k,
  a shorter FG 42 practical range, a wider group at range. The FG 42 plays the carbine sound
  (audio is out of scope without an ask).
- **Sergeant weapons.** Leaders carry SMGs (Thompson/MP40) and rarely fire because their targets
  are 350 m+ away (range, not a gate bug; `fire-gates` probe). More leader fire means closing to
  assault range more often (a tactics change, benchmark it) or a Garand for US leaders, not a
  looser gate.
- **Perception follow-ups.** Hearing (120 m) and relay (50 m) gave a squad its first contact once
  in 29 squads; count mid-fight re-acquisitions before tuning `HEAR_RANGE`/`RELAY_RANGE`. Relay is
  squad centre to squad centre; the alternative (enemies within 50 m of the unaware squad) is a
  one-line change in `squadSenses`. Defenders holding still have no sector scan yet.
- **Bocage hedgerows are too short (issue #60; needs a decision on the Frozen rule).** Hedges are
  one 2.2 m volume (`terrain-features.js` `HEDGE_HEIGHT`), so standing men see and shoot over
  them; real bocage was a bank plus growth, 0.9-4.6 m. It needs an explicit lift of the freeze
  for height only, the volume staying the one source for rendering, nav, sight and ballistics.
  Benchmark paired and check stance behaviour. Terrain generation belongs to `ww2fps`.
- **Soldiers on or below hills fire into the ground (open, seen 2026-09-28).** Men with a clear view
  over a crest put their rounds into the slope. The fire gate and the round test different lines:
  sight (`squad-ai.js` `hasLineOfSight`: target scan, tracking and the `14-direct-fire-los-gate.js`
  gate) runs eye to the **target's eye** (1.55/1.05/0.42 m) and samples the terrain at only
  `LOS_SAMPLES` (8) points with 0.15 m clearance, while the round (`14-z-ballistic-raycast.js`) flies
  eye to the **target's body centre** (`targetCenter`: 0.88/0.57/0.27 m) plus dispersion and tests the
  terrain continuously. A man who sees a head over the crest may fire, and his round, ~0.7 m lower,
  hits the ground; at 400 m the 8 samples are 50 m apart, so a narrow crest can fall between them.
  The round also starts at eye height over the root, not the muzzle, so the drawn tracer disagrees.
  Owner: permission to fire (Perception/Engagement). The gate should test the line the round will fly,
  at the ballistics' resolution (or with its terrain test); a man who sees only a head holds or moves.
  Keep spotting separate from permission to fire. Add a deterministic crest check (sight clear, fire
  line blocked, no trigger pull) and benchmark paired; the tracer origin is a separate, smaller fix.
- **Bullet holes float in front of scatter cover (fix proposed).** `14-z-ballistic-raycast.js`
  `obstacleStop` stops rounds at the tactical cover circle (a log's is `len*0.42`, its mesh a
  0.55 m cylinder), not the rendered object. Fix at the ballistics owner: intersect the linked
  `physicalId` footprint and let a miss fly on. It changes combat, so benchmark it paired. A decal
  shader can't fix it: the impact point itself is wrong.
- **Wound decals should sit on the skin (open).** `15-bullet-impact-fx.js` `woundDecal` places a
  flat quad at the hit bone plus a per-zone radius, so it floats or sinks and slides as skin
  deforms. Proposal (presentation only): a `MaterialPluginBase` plugin on the skinned material
  that draws wounds in the fragment shader from bind-pose points (a small per-soldier uniform
  array; a material clone or data texture on the first wound), or `MeshUVSpaceRenderer` decal
  maps. Update `impact-fx-check.js` and prove it with `closeup_damage_fx.cjs` /
  `closeup_battle.cjs CLOSEUP_TARGET=wounded` on a preview.
- **Weapons by soldier, not role (pending).** Snipers are their own role (M1903A4, Kar98k ZF39)
  with models and aiming rules. Sidearms only where issued (GE MG gunner P38/P08, US M1919 gunner
  M1911A1, paratroopers): a `secondary` slot and an Engagement switch rule (primary empty or
  jammed, target in pistol range); the models and pistol clips exist. Per-soldier loadouts need
  `battle-sim.js` to stop dealing weapons from `ROLES[role].weapon`, and Engagement's MG behaviour
  and reaction times to key on the weapon kind, not `role === 'gunner'`; other models need seats
  measured in the Motion Lab (`us-captain.fbx.json` has all 12). Loadouts change combat:
  benchmark paired.
- **Next architecture steps:** a versioned `SquadIntent` with one intent resolver, a real Squad
  Leader local planner, then platoon/company command, fallback/counterattack and combined arms,
  following the request pattern Capture Zone and Prepared Defense use. A platoon layer isn't
  warranted at 5 squads per side (revisit at ~9+ squads or combined arms). The win effect of
  concentrating effort is unmeasured (it needs a one-sided arm of ~200+ battles).
- **Watch:** one local run logged `ReferenceError: BABYLON is not defined` from an inline script
  (line 95 of the page `battle_sim_local.php` serves). If it recurs, make that script wait for
  Babylon.
- **By design:** Movement Progress ignores retreat (`movementStopReason` is the observable), and
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
- Clips are retargeted at load (rest pose, units, hip height), in quaternions (`retargetRotations`). Looping clips have hip drift removed,
  and that drift becomes their natural ground speed. Playback rate is ground speed ÷ clip speed.
  The upper-body overlay (aim/fire/reload) sits on the lower locomotion layer. The weapon grip snaps
  to a right-palm anchor, the fore-end runs through the left palm, and aim uses a capped spine twist (≤40°).
- Fallback: the procedural rig in `battle/soldier.js` is used while the FBX loads (25 s cap), and the
  trainer and headless benchmark always use it (`setImportedEnabled(scene,false)`). Procedural soldiers
  keep their `rig` object; FBX soldiers have `rig===null` and a `_fbx` binding.
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
  skeletons prepare once per pose (`lod.skeletons`). `?animLod=0` turns both off. Thresholds are tuned from close-ups, never tied to gameplay.
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
