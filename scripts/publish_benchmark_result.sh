#!/usr/bin/env bash
# Publish a processed benchmark result (scripts/process_benchmark_results.cjs) to the benchmark-results branch, where the viewer
# (ai_flow_live.html?bench=<run>) and anyone reading the run can fetch it by address without downloading an artifact:
#   GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo scripts/publish_benchmark_result.sh <result dir> <run number>
# Files land in benchmarks/results/scripted/runs/<run>/ (the 100-battle record under benchmarks/results/standard is not touched).
# The newest BENCH_KEEP_RUNS (30) runs stay; older directories go in the same commit. A push that races another run's is retried.
set -euo pipefail
dir="${1:?result dir}"; run="${2:?run number}"
keep="${BENCH_KEEP_RUNS:-30}"
branch=benchmark-results
base=benchmarks/results/scripted
# PUBLISH_REMOTE replaces the GitHub address (the offline test of this script).
url="${PUBLISH_REMOTE:-https://x-access-token:${GITHUB_TOKEN:?GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY:?GITHUB_REPOSITORY}.git}"
for attempt in 1 2 3 4 5; do
  work="$(mktemp -d)"
  if git ls-remote --exit-code --heads "$url" "$branch" >/dev/null 2>&1; then
    git clone --quiet --depth 1 --branch "$branch" "$url" "$work"
  else
    git init --quiet "$work"
    git -C "$work" checkout --quiet --orphan "$branch"
    git -C "$work" remote add origin "$url"
  fi
  mkdir -p "$work/$base/runs/$run"
  cp -a "$dir/." "$work/$base/runs/$run/"
  ls -1 "$work/$base/runs" | sort -n | head -n "-$keep" | while read -r old; do rm -rf "$work/$base/runs/$old"; done
  git -C "$work" config user.name 'github-actions[bot]'
  git -C "$work" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
  git -C "$work" add -A "$base"
  if git -C "$work" diff --cached --quiet; then echo "Nothing new to publish for run $run."; exit 0; fi
  git -C "$work" commit --quiet -m "Benchmark result #${run}"
  if git -C "$work" push --quiet origin "HEAD:${branch}"; then
    echo "Published run $run to $branch (${base}/runs/${run}/)"
    exit 0
  fi
  echo "Push raced another run (attempt $attempt); retrying." >&2
  rm -rf "$work"; sleep $((attempt * 2))
done
echo "Could not publish run $run after 5 attempts." >&2
exit 1
