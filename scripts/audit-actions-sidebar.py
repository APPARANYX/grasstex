#!/usr/bin/env python3
"""Classify historical Actions sidebar registrations. Read only, fail closed."""
import json, os, subprocess, sys
from pathlib import Path

repo = os.environ.get("REPO", "APPARANYX/grasstex")
summary = os.environ.get("GITHUB_STEP_SUMMARY")

def gh(path, paginate=False):
    args = ["gh", "api"]
    if paginate:
        args += ["--paginate", "--slurp"]
    args += [f"repos/{repo}/{path}"]
    raw = subprocess.check_output(args, text=True)
    payload = json.loads(raw)
    if not paginate:
        return payload
    records = []
    for page in payload:
        records.extend(page if isinstance(page, list) else next(
            (page[key] for key in ("workflows", "pulls", "issues") if key in page), []))
    return records

def emit(message):
    print(message)
    if summary:
        with open(summary, "a") as file:
            file.write(message + "\n")

def all_workflow_paths(tree):
    return {x["path"] for x in tree.get("tree", []) if x.get("type") == "blob"
            and x.get("path", "").startswith(".github/workflows/")}

workflows = gh("actions/workflows?per_page=100", True)
open_prs = gh("pulls?state=open&per_page=100", True)
issues = gh("issues?state=open&per_page=100", True)
open_issues = {str(issue["number"]) for issue in issues if "pull_request" not in issue}
main = gh("git/trees/main?recursive=1")
if main.get("truncated"):
    raise RuntimeError("Incomplete main tree: refusing to classify")
protected_paths = all_workflow_paths(main)

for pr in open_prs:
    tree = gh(f"git/trees/{pr['head']['sha']}?recursive=1")
    if tree.get("truncated"):
        raise RuntimeError(f"Incomplete open PR #{pr['number']} tree")
    protected_paths.update(all_workflow_paths(tree))

def issue_relevant(label):
    import re
    numbers = set(re.findall(r"(?i)(?:issue[ -]*|#)(\d+)\b", label))
    return bool(numbers & open_issues)

# Explicit protection beats naming heuristics. Unknown entries remain review-only.
reusable_words = ("benchmark", "deployment", "deploy", "production", "release",
                  "visual", "chromium", "regression", "ci", "test", "qa")
one_off_prefixes = ("temporary", "one-shot", "issue ", "fire origin",
                    "hedgerow ", "hedge ")
counts = {"PROTECTED": 0, "REVIEW": 0, "OBSOLETE_CANDIDATE": 0}
emit("### Actions sidebar workflow usefulness audit (no deletion)")
for wf in workflows:
    name = wf.get("name") or ""
    path = wf.get("path") or ""
    state = wf.get("state") or ""
    lower = name.lower()
    if path in protected_paths:
        label, reason = "PROTECTED", "workflow file exists on main or in an open PR"
    elif issue_relevant(name):
        label, reason = "PROTECTED", "references an open issue"
    elif any(word in lower for word in reusable_words):
        label, reason = "REVIEW", "reusable test, benchmark, QA or deployment signal"
    elif lower.startswith(one_off_prefixes) and state != "active":
        label, reason = "OBSOLETE_CANDIDATE", "inactive one-off, absent from main/open PR"
    else:
        label, reason = "REVIEW", "ownership or usefulness not established"
    counts[label] += 1
    emit(f"- **{label}**: {name} (ID {wf['id']}; {state}; `{path}`) — {reason}")
emit("**Totals:** " + ", ".join(f"{key}: {value}" for key, value in counts.items()))
emit("This job only reports candidates. No workflow history, YAML, or registration was deleted.")
