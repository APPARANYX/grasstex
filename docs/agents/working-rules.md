## Working rules

- **A/B WORK IS DONE WITH THE GITHUB STANDARD BENCHMARK, NOT LOCALLY. NO LOCAL PROBE ARMS. NO FINGERPRINT COMPARISONS
  (`ab_fingerprints.sh`, `state-fingerprint`, `PROBE_CONTROL=1` on many battles). THEY TAKE HOURS AND THE BENCHMARK DOES
  THE SAME JOB.** THE BENCHMARK TAKES PARAMETERS: DISPATCH `battle-benchmark-standard.yml` WITH `seed` (THE EXACT SCENARIO SEED, THE SAME
  FOR BOTH ARMS) AND `query_off` / `query_on` (THE PAGE FLAGS OF EACH ARM, E.G. `query_on=coa=1`, OR `query_off=morale=0` FOR THE FLAT RETREAT;
  BOTH EMPTY IS A CONTROL: THE ARMS MUST COME OUT IDENTICAL) AND `seeds` (1 IS THE SCRIPTED SCENARIO; MORE, E.G. 100, IS A PAIRED RUN ACROSS SEEDS, `seed` THEN THE PREFIX). ONE RUN IS BOTH ARMS, ONE AFTER THE OTHER ON ONE RUNNER, AND THE RUN COMPARES THEM. COMPARE ACROSS RUNS (`main` AGAINST A BRANCH) WITH `compare_benchmark_arms.cjs` (`--count <path>`
  PAIRS ANY RECORD FIELD). IDENTICAL RECORDS ON `main` AND ON A BRANCH ARE THE PROOF THAT A CHANGE IS INERT. A PROBE IS FOR
  ONE SEED AND A FEW MINUTES, NEVER FOR AN ARM OF TWENTY SEEDS. (Said three times by the owner, 2026-09-30.)
- **Squad-performance scores are benchmark triage, never a pass/fail gate.** `run_battle_benchmark.mjs` samples each squad every 2.5 simulated seconds and records a role-aware vector (mission, movement, control, cohesion, combat when exposed, preservation) plus the raw measurements behind it. Support/reserve/garrison squads are not penalized for holding still. Standard paired runs compare the per-battle squad mean, p10/tail and dimension means; use the raw squad rows and reproducible seed before changing AI from a score.
- **Don't create new plan/roadmap/summary `.md` files.** The one exception is `docs/reference/TUNABLES.md`, the
  inventory of every tunable number by layer (Phase 5, the input to the genome rewrite). Update this
  file only when a command, contract or rule actually changes. Findings go in the commit message or PR body. Open issues
  hold the current state and the next step, not run-by-run logs: cite the PR that has the numbers.
- **State success criteria up front, prove them with a harness below, report the output.**
  Never claim visual/browser validation that wasn't performed.
- **Keep probes.** A one-off measurement script is a probe: commit it as `scripts/probes/<name>.js`
  (run with `scripts/run_probe.cjs`) or extend a close-up tool (`closeup.cjs` for a posed soldier,
  `closeup_battle.cjs` for one in a fight), never leave it in `/tmp`.
- **Browser probes run against the preview, not a local server.** Push the branch and point the
  script's URL variable (`CLOSEUP_URL`, `CULL_URL`, `BF_URL`, …) at
  `https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>` (only the flags listed in `preview.php`'s
  `$pass` pass through, and it drops the rest silently: `morale`, `coa`, `mind`, `stats`, `perception`, `geScout`,
  `groundSteps` and any probe flag are not among them, so three "flag" arms of the 3b/3c probes once ran flag-off,
  identical to the control in 60 of 60 battles; for those, open the staged page the launcher redirects to,
  `https://test.ivandpopov.com/grasstex/preview/ref-<sha12>/battle_sim.php?<flags>`, and check the flag arrived,
  e.g. `BattleSquadStability.moraleOn()`). It has
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
- **A PR merges only after its own CI has finished green on its head.** Never merge while CI is still running or
  was cancelled, and merge stacked PRs one at a time, each after CI and the deploy on `main` for the one before
  have finished (phases 3b to 5 merged within 13 seconds, CI on two was cancelled, and `main` stayed red until
  #123). Branch housekeeping deletes a merged PR's head branch even when other open PRs are based on it (it only
  looks for open PRs whose *head* is that branch), so retarget stacked PRs to `main` right after the merge. Nothing
  in GitHub enforces any of this; it is written down.
- **Subscribe to every PR you open or are asked to merge** (`subscribe_pr_activity`): CI results, reviews, conflicts and the
  merge arrive as events, so nobody has to say "CI passed" and the agent does not poll. Merge when the head's CI events are
  green; cover the gaps (commit-status CI, merge-queue branches, a lost delivery) with one `send_later` check-in.

