# Agent entry point

Read this file first. Load **only the reference documents relevant to the task**, except the shared working rules, which are mandatory. Inspect the current branch, relevant code, and any existing PR diff before editing. Do not assume that a listed feature is unfinished without checking the code and current PRs.

## Universal requirements

- Read [shared working rules](docs/agents/working-rules.md) before changing code. They define benchmark methodology, preview requirements, validation, PR/CI/merge safety, scope restrictions, and production deployment.
- **Agent benchmark launcher:** [⭐ Agent Benchmark Launcher](.github/workflows/agent-benchmark-launcher.yml) selects the existing standard, causal, targeted-fire, timescale, matrix-smoke or full-matrix workflow. To run through the GitHub connector, create a fresh `work/benchmark-launch/<topic>` branch from the requested source, add `.github/benchmark-request.json` with `{"benchmark":"standard","seed":"your-seed","seeds":"1","battle_type":"meeting"}`, and push the request. The launcher runs on that branch push and dispatches the existing benchmark using `ref` (default `main`); verify the resulting *child benchmark* Actions run and report, not just the launcher. Full matrix requires `confirm_full_matrix: true` and `ref: main`. See [CI and workflows](docs/agents/ci-workflows.md) for options; never create another temporary dispatcher workflow.
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
