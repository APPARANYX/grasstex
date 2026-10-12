#!/usr/bin/env bash
# Delete completed non-green Actions runs only when their source branch is verified merged.
set -euo pipefail
: "${GH_TOKEN:?missing token}"
REPO="${REPO:-APPARANYX/grasstex}"
DRY_RUN="${DRY_RUN:-true}"
MAX_DELETE="${MAX_DELETE:-100}"
export REPO DRY_RUN MAX_DELETE
python3 - <<'PY'
import datetime as dt
import json, os, subprocess, sys, urllib.parse

repo=os.environ["REPO"]
dry=os.environ["DRY_RUN"].lower() != "false"
limit=int(os.environ["MAX_DELETE"])
summary=os.environ.get("GITHUB_STEP_SUMMARY")

def api(path, paginate=False):
    command=["gh","api"]
    if paginate: command.append("--paginate")
    command+=["--slurp", f"repos/{repo}/{path}"] if paginate else [f"repos/{repo}/{path}"]
    result=subprocess.run(command,capture_output=True,text=True,check=True)
    value=json.loads(result.stdout)
    return value if not paginate else [item for page in value for item in (page if isinstance(page,list) else page.get("workflow_runs",page.get("pulls",[])))]

def write(s):
    print(s)
    if summary:
        with open(summary,"a") as out: out.write(s+"\n")

# A merged PR is required as affirmative evidence. Collect *all* merged PRs.
prs=api("pulls?state=closed&per_page=100",paginate=True)
merged={}
for pr in prs:
    if not pr.get("merged_at"): continue
    head=pr.get("head",{})
    owner=repo.split("/")[0]
    if (head.get("repo") or {}).get("full_name") != repo and not head.get("label","").startswith(owner+":"): continue
    branch=pr["head"]["ref"]
    merged.setdefault(branch,[]).append(pr)

open_prs=api("pulls?state=open&per_page=100",paginate=True)
open_branches={p["head"]["ref"] for p in open_prs if (p.get("head",{}).get("repo") or {}).get("full_name")==repo or p.get("head",{}).get("label","").startswith(repo.split("/")[0]+":")}
open_shas={p["head"]["sha"] for p in open_prs}
runs=api("actions/runs?per_page=100",paginate=True)
# Only branches that no longer exist in the repository can be deleted.
branches={p["head_branch"] for p in runs if p.get("head_branch") in merged and p.get("head_branch") not in open_branches}
missing=set()
for branch in branches:
    if branch in ("main","master","benchmark-results"): continue
    ref="git/ref/heads/"+urllib.parse.quote(branch,safe="/")
    check=subprocess.run(["gh","api",f"repos/{repo}/{ref}"],capture_output=True,text=True)
    if check.returncode==0: continue
    if "404" not in (check.stdout+check.stderr): raise RuntimeError("Branch verification failed for "+branch+": "+check.stderr)
    missing.add(branch)

count=0
write("### Non-green Actions cleanup — "+("DRY RUN" if dry else "DELETE"))
for run in runs:
    if count>=limit: break
    if run.get("status")!="completed" or run.get("conclusion") not in ("failure","skipped","cancelled"): continue
    branch=run.get("head_branch")
    if branch not in missing or run.get("head_sha") in open_shas: continue
    created=run.get("created_at","")
    # Eligible only if run predates a verified merge of this branch.
    if not any(created <= p["merged_at"] for p in merged[branch]): continue
    rid=run["id"]
    if not dry:
        # Fresh open-PR check immediately before deletion.
        current=api("pulls?state=open&per_page=100",paginate=True)
        if any(p["head"]["ref"]==branch or p["head"]["sha"]==run.get("head_sha") for p in current): continue
        subprocess.run(["gh","api","-X","DELETE",f"repos/{repo}/actions/runs/{rid}"],check=True)
    count+=1
    write(f"- {'Would delete' if dry else 'Deleted'} {rid}: {run['conclusion']} — {branch}")
write(f"Total eligible processed: {count} / {limit}")
PY
