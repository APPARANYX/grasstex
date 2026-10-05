## Agent apply patch workflow

`.github/workflows/agent-apply-patch.yml` lets an AI agent ship a PR to
`APPARANYX/grasstex` **without ever holding a GitHub token**. The agent opens an
issue with a base64-encoded patch; the workflow applies it, pushes a branch with
a stored PAT, opens a PR, and closes the issue.

### Trigger

The workflow fires on the `issues: [labeled]` event. The job's `if:` condition
filters to the `agent-apply` label, so only an issue that receives that label
runs the apply. Re-adding the label after a failed run re-runs the workflow
(the previous attempt's branch is overwritten with `--force-with-lease`).

Only collaborators with triage permission can apply labels, so only
collaborators can trigger this workflow. Restrict label application
appropriately for your team (see [Security note](#security-note)).

### AGENT_TOKEN setup

The workflow needs a PAT stored as the `AGENT_TOKEN` secret. It is used for two
steps only — pushing the branch and opening the PR — so the PR shows as authored
by the agent's identity, not the `github-actions[bot]`. Issue comments and
closes use the workflow's own `GITHUB_TOKEN`.

Create a **fine-grained PAT** (preferred over classic):

1. Sign in to GitHub as the user the agent's PRs should be authored by
   (e.g. `appara-agent`).
2. Open <https://github.com/settings/personal-access-tokens/new>.
3. **Resource owner**: `APPARANYX`.
4. **Repository access**: *Only select repositories* → `APPARANYX/grasstex`.
   Do not select any other repo.
5. **Repository permissions** (this is the minimum):
   - **Contents: Read and write** — push the branch.
   - **Pull requests: Read and write** — open the PR.
   - Do not grant `Workflows`, `Secrets`, `Administration`, etc.
6. **Expiration**: 90 days or shorter. Rotate before it lapses.
7. Copy the token immediately (GitHub will not show it again).
8. Open <https://github.com/APPARANYX/grasstex/settings/secrets/actions> →
   **New repository secret** → **Name**: `AGENT_TOKEN` → **Secret**: paste the
   PAT.

A classic PAT with `repo` scope also works but is broader than necessary;
prefer the fine-grained PAT above. If the agent needs to push to other
`APPARANYX/*` repos, create a separate PAT per repo rather than widening the
scope of this one.

### Issue body format

The issue body must contain exactly these three sections, in this order, with
H2 (`##`) headers:

~~~
## PR Title
<one-line PR title>

## PR Body
<multi-line markdown body. May include `##` sub-headers; they are part of the body.>

## Patch (base64)
<base64-encoded `git format-patch` output (single file or concatenated),
or a plain unified diff. Markdown code fences around the base64 are tolerated.>
~~~

The patch may be one of:

- **`git format-patch` output** — starts with `From <sha> Mon Sep 17 ...`.
  Applied with `git am --3way`. Commit message(s) and author(s) come from the
  patch itself. The parsed PR title and PR body are used only for the PR.
- **Plain unified diff** — no `From ` header. Applied with `git apply --index`
  and committed with the parsed PR title as the commit subject and the parsed
  PR body as the commit body. The commit author is
  `appara-agent <appara-agent@users.noreply.github.com>`; edit the workflow's
  `git config` step to change it.

### Producing the base64 patch

For one or more commits as a single `git format-patch` stream:

```bash
git format-patch -<N> --stdout <base-ref> | base64 -w0
```

For a plain unified diff:

```bash
git diff <base-ref> | base64 -w0
```

`-w0` disables line-wrapping in `base64`'s output so the result is one long
line; the workflow strips whitespace anyway, so wrapped output also works.
Concatenating multiple `git format-patch` outputs into one base64 blob is fine —
`git am` applies them in order.

### What the workflow does

1. Checks out the repo with full history and `persist-credentials: false` (so
   the default `GITHUB_TOKEN` extraheader does not get used for the push).
2. Parses the three sections from the issue body; base64-decodes the patch
   (stripping markdown fences and whitespace).
3. Creates `work/agent-<issue-number>` from `origin/main`.
4. Applies the patch (`git am --3way` for format-patch input, `git apply --index`
   + `git commit` for plain diffs).
5. Pushes the branch with `git push --force-with-lease` using `AGENT_TOKEN`,
   configured as a git `http.extraheader` so the token never lands in a remote
   URL or the reflog. The pre-fetch of the existing remote ref (if any) makes
   `--force-with-lease` work whether the branch exists or not.
6. Opens a PR with `gh pr create` using `AGENT_TOKEN`, targeting `main`, with
   the parsed title and body. If a PR is already open for the branch (a previous
   run got that far and then failed before closing the issue), it reuses that PR.
7. Comments `Opened PR #N: <url>` on the issue and closes it (using
   `GITHUB_TOKEN`).

### Failure handling

Any failure — missing or empty section, base64 decode error, patch does not
apply, patch produces no diff against `main`, push rejected, `gh pr create`
fails — posts the traceback as a comment on the issue and leaves the issue
open. Fix the patch and re-apply the `agent-apply` label (remove and re-add) to
retry.

The `concurrency` group is keyed on the issue number, so a re-label joins the
same group; `cancel-in-progress: false` so a re-label after a fix does not kill
a run that is already pushing.

### CI on the opened PR

The PR this workflow opens triggers the normal [`ci.yml`](../../.github/workflows/ci.yml)
workflow on `pull_request`. The agent's PR is **not** auto-merged; a human
reviews and merges it after CI passes. Branch protection on `main` is
respected.

### Security note

Anyone with triage permission on the repo can apply the `agent-apply` label and
thus trigger a PR with arbitrary patch contents. Restrict label application to
collaborators you trust to file patches, or add an `actor` filter to the
workflow's `if:` condition, e.g.:

```yaml
if: |
  github.event.label.name == 'agent-apply' &&
  contains(fromJson('["appara-agent", "ivandpopov"]'), github.event.issue.user.login)
```

The `AGENT_TOKEN` is scoped to a single repo and to the two permissions above,
so a leaked token can at worst push branches and open PRs to
`APPARANYX/grasstex` — it cannot modify workflows, secrets, or settings.

### Issue body template (copy-paste)

An AI agent opening an `agent-apply` issue should use exactly this body, filling
in the three sections:

~~~
## PR Title
<one-line PR title — used as the PR title and, for plain-diff patches, as the commit subject>

## PR Body
<markdown body of the PR. What changed, why, and how it was verified.
Reference any issues it closes with `Closes #N`.>

## Patch (base64)
<paste base64 here; one long line is fine, code fences are tolerated>
~~~

Generate the base64 with one of:

```bash
git format-patch -<N> --stdout <base-ref> | base64 -w0   # format-patch
git diff <base-ref> | base64 -w0                          # plain unified diff
```

Apply the `agent-apply` label after filing. The workflow comments with the PR
URL (on success) or the failure traceback (on error).
