#!/usr/bin/env python3
"""Retire successful one-shot benchmark launcher branches after durable archival.

Only work/benchmark-launch/* heads with a successful launcher run qualify.
Before deletion, archive the complete request/provenance to benchmark-results
and, if needed, pin its source parent with a Git tag. Fail closed.
"""
import base64
import datetime as dt
import json
import os
import subprocess
import sys
import time
from urllib.parse import quote

REPO = os.environ.get("REPO", "APPARANYX/grasstex")
DRY_RUN = os.environ.get("DRY_RUN", "true").lower() != "false"
MIN_AGE_DAYS = int(os.environ.get("BENCHMARK_LAUNCH_MIN_AGE_DAYS", "2"))
MAX_DELETE = int(os.environ.get("BENCHMARK_LAUNCH_MAX_DELETE", "100"))
PREFIX = "work/benchmark-launch/"
WORKFLOW = ".github/workflows/agent-benchmark-launcher.yml"
RESULTS_BRANCH = "benchmark-results"


def run(*args, input_text=None, check=True):
    p = subprocess.run(args, input=input_text, text=True, capture_output=True)
    if check and p.returncode:
        raise RuntimeError(f"{' '.join(args)}: {p.stderr.strip()}")
    return p


def gh(path, method="GET", payload=None, missing_ok=False):
    args = ["gh", "api"]
    if method != "GET":
        args += ["--method", method]
    args.append(path)
    if payload is not None:
        args += ["--input", "-"]
    p = run(*args, input_text=json.dumps(payload) if payload is not None else None,
            check=not missing_ok)
    if p.returncode:
        if missing_ok and ("404" in p.stderr or "Not Found" in p.stderr):
            return None
        raise RuntimeError(f"GitHub API {path}: {p.stderr.strip()}")
    return json.loads(p.stdout) if p.stdout.strip() else {}


def pages(path):
    p = run("gh", "api", "--paginate", "--slurp", path)
    data = json.loads(p.stdout)
    return [item for page in data for item in page]


def active_run(branch):
    data = gh(f"repos/{REPO}/actions/runs?branch={quote(branch, safe='')}&per_page=100")
    return any(r.get("status") != "completed" for r in data.get("workflow_runs", []))


def successful_launcher(sha):
    data = gh(f"repos/{REPO}/actions/runs?head_sha={sha}&per_page=100")
    return any(r.get("head_sha") == sha and r.get("path", "").split("@")[0] == WORKFLOW
               and r.get("status") == "completed" and r.get("conclusion") == "success"
               for r in data.get("workflow_runs", []))


def archive_path(sha):
    return f"benchmarks/launch-requests/{sha}.json"


def fetch_archive(path):
    record = gh(f"repos/{REPO}/contents/{path}?ref={RESULTS_BRANCH}", missing_ok=True)
    if record is None:
        return None
    return base64.b64decode(record["content"]).decode("utf-8")


def archive(sha, payload):
    path = archive_path(sha)
    content = json.dumps(payload, sort_keys=True, indent=2) + "\n"
    for attempt in range(5):
        previous = fetch_archive(path)
        if previous is not None:
            if previous != content:
                raise RuntimeError(f"Archive conflict: {path}")
            return path
        encoded = base64.b64encode(content.encode("utf-8")).decode("ascii")
        try:
            gh(f"repos/{REPO}/contents/{path}", method="PUT", payload={
                "message": f"Archive benchmark launcher {sha[:12]}",
                "content": encoded, "branch": RESULTS_BRANCH,
            })
        except RuntimeError:
            if attempt == 4:
                raise
            time.sleep(attempt + 1)
            continue
        if fetch_archive(path) == content:
            return path
        raise RuntimeError(f"Archive read-back mismatch: {path}")
    raise RuntimeError(f"Could not archive {path}")


def retain_parent(parent):
    # Only non-main source snapshots need an extra durable ref.
    if run("git", "merge-base", "--is-ancestor", parent, "origin/main", check=False).returncode == 0:
        return "main-ancestor"
    tag = f"benchmark-source-archive/{parent}"
    path = f"repos/{REPO}/git/ref/tags/{tag}"
    existing = gh(path, missing_ok=True)
    if existing is None:
        try:
            gh(f"repos/{REPO}/git/refs", method="POST",
               payload={"ref": f"refs/tags/{tag}", "sha": parent})
        except RuntimeError:
            # A parallel sweep may have created the same tag.
            pass
        existing = gh(path, missing_ok=True)
    if not existing or existing.get("object", {}).get("sha") != parent:
        raise RuntimeError(f"Could not verify pinned source tag {tag}")
    return tag


def emit(line):
    print(line, flush=True)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as fh:
            fh.write(line + "\n")


def main():
    if REPO != os.environ.get("GITHUB_REPOSITORY", REPO):
        raise RuntimeError("Repository mismatch")
    if MIN_AGE_DAYS < 2 or not 1 <= MAX_DELETE <= 250:
        raise RuntimeError("Unsafe retention or deletion limit")
    open_prs = pages(f"repos/{REPO}/pulls?state=open&per_page=100")
    protected = set()
    for pr in open_prs:
        if pr.get("head", {}).get("repo", {}) and pr["head"]["repo"].get("full_name") == REPO:
            protected.add(pr["head"]["ref"])
        protected.add(pr.get("base", {}).get("ref"))
    refs = run("git", "for-each-ref", "--format=%(refname:strip=3)",
               "refs/remotes/origin/work/benchmark-launch/").stdout.splitlines()
    now = dt.datetime.now(dt.timezone.utc).timestamp()
    deleted = 0
    emit(f"### Benchmark-launch housekeeping ({'dry run' if DRY_RUN else 'live'})")
    emit(f"Candidates: {len(refs)}; minimum age: {MIN_AGE_DAYS} days")
    for branch in refs:
        if not branch.startswith(PREFIX) or branch in protected:
            emit(f"- KEEP {branch}: protected or unexpected")
            continue
        try:
            fullref = "refs/remotes/origin/" + branch
            sha = run("git", "rev-parse", fullref).stdout.strip()
            parents = run("git", "show", "-s", "--format=%P", sha).stdout.split()
            if len(parents) != 1:
                emit(f"- KEEP {branch}: not a single-parent request commit")
                continue
            changes = run("git", "diff-tree", "--no-commit-id", "--name-only", "-r", sha).stdout.splitlines()
            if changes != [".github/benchmark-request.json"]:
                emit(f"- KEEP {branch}: tip changes non-request files")
                continue
            age = (now - int(run("git", "log", "-1", "--format=%ct", sha).stdout.strip())) / 86400
            if age < MIN_AGE_DAYS:
                emit(f"- KEEP {branch}: {age:.1f} days old")
                continue
            request = json.loads(run("git", "show", f"{sha}:.github/benchmark-request.json").stdout)
            source_ref = request.get("ref", "main")
            if (not isinstance(request, dict) or
                not isinstance(source_ref, str) or
                source_ref.startswith(PREFIX) or
                not request.get("benchmark")):
                emit(f"- KEEP {branch}: unrecognized or launcher-dependent request")
                continue
            if not successful_launcher(sha):
                emit(f"- KEEP {branch}: no verified successful launcher run at tip")
                continue
            if active_run(branch) or (source_ref != "main" and active_run(source_ref)):
                emit(f"- KEEP {branch}: related Actions run still active")
                continue
            parent = parents[0]
            source_now = run("git", "rev-parse", "--verify", "-q",
                             f"refs/remotes/origin/{source_ref}^{{commit}}",
                             check=False)
            source_now_sha = source_now.stdout.strip() if source_now.returncode == 0 else None
            data = {
                "schema_version": 1, "branch": branch,
                "launch_sha": sha, "launch_parent_sha": parent,
                "source_ref": source_ref, "source_sha_at_archive": source_now_sha,
                "request": request,
                "note": "Launch parent is preserved; the child's actual checkout SHA must be read from the child run.",
            }
            if DRY_RUN:
                emit(f"- WOULD_ARCHIVE_DELETE {branch} ({sha[:12]})")
                continue
            data["parent_retention_ref"] = retain_parent(parent)
            archived = archive(sha, data)
            # Deletion is guarded by the tip we inspected. Never force a moved branch.
            run("git", "push", f"--force-with-lease=refs/heads/{branch}:{sha}",
                "origin", f":refs/heads/{branch}")
            deleted += 1
            emit(f"- DELETED {branch}; archived at {RESULTS_BRANCH}/{archived}")
            if deleted >= MAX_DELETE:
                emit(f"Stopped at deletion limit {MAX_DELETE}")
                break
        except Exception as exc:
            # One untrusted/malformed or racing branch must not endanger another.
            emit(f"- KEEP {branch}: ERROR {exc}")
    emit(f"**Removed {deleted} branches.**")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        emit(f"**FAIL CLOSED:** {exc}")
        sys.exit(1)
