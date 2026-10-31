# Agent entry point

Read this file first. Load **only the reference documents relevant to the task**, except the shared working rules, which are mandatory. Inspect the current branch, relevant code, and any existing PR diff before editing. Do not assume that a listed feature is unfinished without checking the code and current PRs.

## Universal requirements

- **THE TACTICAL CONTROLLER IS A REBUILD, NOT A REFORMAT. DO NOT TRY TO MATCH LEGACY RESULTS.** The job is to PORT every skill and behavior to the new controller (`?tacticalController=new`), one owner per capability, reusing the existing skill logic. It is NOT to reproduce legacy numbers (fire volume, retreats, loop alerts, wall time, scores). Behaviors WILL change and may improve; that is the goal, and tuning comes later. Never cut, cap or retune controller behavior just to make a controller-on vs legacy comparison look equal. Judge controller-on runs by real broken behavior (runtime errors, writer conflicts, stalls, unexplained silence, lost skills) and report differences from legacy as information.
- Read [shared working rules](docs/agents/working-rules.md) before changing code. They define benchmark methodology, preview requirements, validation, PR/CI/merge safety, scope restrictions, and production deployment.
- **Agent benchmark launcher:** [⭐ Agent Benchmark Launcher](.github/workflows/agent-benchmark-launcher.yml) selects the existing standard, causal, targeted-fire, timescale, matrix-smoke or full-matrix workflow. To run through the GitHub connector, create a fresh `work/benchmark-launch/<topic>` branch from the requested source, add `.github/benchmark-request.json` with `{"benchmark":"standard","seed":"your-seed","seeds":"1","battle_type":"meeting"}`, and push the request. The launcher runs on that branch push and dispatches the existing benchmark using `ref` (default `main`); verify the resulting *child benchmark* Actions run and report, not just the launcher. Full matrix requires `confirm_full_matrix: true` and `ref: main`. See [CI and workflows](docs/agents/ci-workflows.md) for options; never create another temporary dispatcher workflow.
- **Mandatory Skills Lab preflight before every benchmark:** The [native Tactical Skills Lab](battle/skills-lab.js) (`?skillsLab=1&tacticalController=new`) is the **standard skills test**. Before dispatching any standard, causal, targeted-fire, probe-pack, timescale, matrix-smoke/full, or other battle/AI benchmark, first run [Native Tactical Skills Lab QA](.github/workflows/tactical-skills-lab-qa.yml) against the **exact same source commit** and require a passing `scripts/probes/probe_skills_lab.cjs` result. Verify the correct new/legacy controller flag, live soldier/target identities, real simulation steps, skill/action ownership, and repeatable same-seed reset. Then exercise **the specific skill being benchmarked** in the visible lab and inspect real owner receipts, physical motion, fire/suppression and cancellation reasons; do not count staged casualties, synthetic contact, or fixtures as spontaneous tactical success. **If the lab preflight fails, is unavailable for that source, or reveals a skill regression, fix it before spending CI time on larger battle benchmarks; do not treat a green launch job as a lab pass.** Include the passing lab run/head SHA in the benchmark handoff. Lab success is a prerequisite, **not** sufficient evidence of realistic battle behavior; retain equal-seed full-battle A/B acceptance afterward.
- State success criteria before implementation; validate them and report actual results. Never claim a test, visual check, deployment, or merge that was not verified.
- `main` deploys to production. Develop on a dedicated branch and merge only after that PR's own head CI finishes green. Follow the post-merge deploy and branch-housekeeping checks in the working rules.
- Preserve existing ownership boundaries and contracts. Read the relevant architecture/reference material before modifying behavior.
- Keep completed work separate from outstanding work; check the current implementation rather than treating historical notes as a task list.
- Do not create new roadmap/summary Markdown files for routine work. Update the relevant existing reference only when its documented contract or behavior changes.

## Task-based reading map

| When working on | Read |
| --- | --- |
| Repository layout, entry points, features | [Repository overview](docs/agents/repository-overview.md) |
| AI ownership, squad behavior, individual soldiers | [Battle architecture](docs/agents/battle-architecture.md) |
| New tactics, reconnaissance, command and control | [Battle architecture](docs/agents/battle-architecture.md) and [Tactics outline](docs/reference/AI_TACTICS_OUTLINE.md) |
| Benchmarks, probes, regression tests, scoring | [Testing and benchmarks](docs/agents/testing.md) and [CI and workflows](docs/agents/ci-workflows.md) (including agent-triggered benchmark dispatch) |
| GitHub Actions, CI, automation | [CI and workflows](docs/agents/ci-workflows.md) |
| Models, weapons, animation | [Soldiers, weapons and animation](docs/agents/soldiers-weapons-animation.md) |
| Audio changes (only when explicitly requested) | [Audio](docs/agents/audio.md) |
| Deployment and asset publishing | [Deployment and assets](docs/agents/deployment-assets.md) |
| Grass and terrain | [Grass and terrain](docs/agents/grass-terrain.md) |
| Tuning and genome parameters | [Tunables inventory](docs/reference/TUNABLES.md) |
| Local conversation cleanup | [Conversation maintenance](docs/agents/conversation-maintenance.md) |

Read additional references when the task crosses boundaries. These documents are authoritative; do not copy their full contents back into this entry point.
