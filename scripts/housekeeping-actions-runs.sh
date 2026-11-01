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

def api(path, paginate=False, max_pages=10):
    # Explicitly cap pagination. Scanning every one of thousands of historic
    # runs made the Monday cleanup fail after ~2 minutes (2026-10-19).
    def one(url):
        for attempt in range(3):
            p=subprocess.run(["gh","api",f"repos/{repo}/{url}"],
                             capture_output=True,text=True)
            if p.returncode == 0: return json.loads(p.stdout)
            if attempt == 2: raise RuntimeError(f"GitHub API failed for {url}: {p.stderr.strip()}")
            import time
            time.sleep(attempt+1)
    if not paginate: return one(path)
    records=[]
    for page in range(1,max_pages+1):
        sep="&" if "?" in path else "?"
        data=one(f"{path}{sep}page={page}")
        batch=data if isinstance(data,list) else data.get("workflow_runs",data.get("pulls",[]))
        records.extend(batch)
        if len(batch)<100: break
    return records

def write(s):
    print(s)
    if summary:
        with open(summary,"a") as out: out.write(s+"\n")

# A merged PR is required as affirmative evidence. Collect *all* merged PRs.
prs=api("pulls?state=closed&per_page=100",paginate=True,max_pages=10)
merged={}
for pr in prs:
    if not pr.get("merged_at"): continue
    head=pr.get("head",{})
    owner=repo.split("/")[0]
    if (head.get("repo") or {}).get("full_name") != repo and not head.get("label","").startswith(owner+":"): continue
    branch=pr["head"]["ref"]
    merged.setdefault(branch,[]).append(pr)

open_prs=api("pulls?state=open&per_page=100",paginate=True,max_pages=3)
open_branches={p["head"]["ref"] for p in open_prs if (p.get("head",{}).get("repo") or {}).get("full_name")==repo or p.get("head",{}).get("label","").startswith(repo.split("/")[0]+":")}
open_shas={p["head"]["sha"] for p in open_prs}
# Query only the conclusions this job can delete, with bounded result pages.
# Preserve historic benchmark runs (including failures) for comparisons.
runs=[]
for outcome in ("failure","skipped","cancelled"):
    runs.extend(api(f"actions/runs?status={outcome}&per_page=100",paginate=True,max_pages=5))
runs.sort(key=lambda r:r.get("created_at",""),reverse=True)
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
recent_open=open_prs
write("### Non-green Actions cleanup — "+("DRY RUN" if dry else "DELETE"))
for run in runs:
    if count>=limit: break
    if run.get("status")!="completed" or run.get("conclusion") not in ("failure","skipped","cancelled"): continue
    workflow_name=(run.get("name") or "").lower()
    if any(word in workflow_name for word in ("benchmark","causal inaction","timescale","hot path","profile","matrix")):
        continue
    branch=run.get("head_branch")
    if branch not in missing or run.get("head_sha") in open_shas: continue
    created=run.get("created_at","")
    # Eligible only if run predates a verified merge of this branch.
    if not any(created <= p["merged_at"] for p in merged[branch]): continue
    rid=run["id"]
    if not dry:
        # Fresh open-PR check immediately before deletion.
        if count % 10 == 0:
            recent_open=api("pulls?state=open&per_page=100",paginate=True,max_pages=3)
        if any(p["head"]["ref"]==branch or p["head"]["sha"]==run.get("head_sha") for p in recent_open): continue
        subprocess.run(["gh","api","-X","DELETE",f"repos/{repo}/actions/runs/{rid}"],check=True)
    count+=1
    write(f"- {'Would delete' if dry else 'Deleted'} {rid}: {run['conclusion']} — {branch}")
write(f"Total eligible processed: {count} / {limit}")
PY
