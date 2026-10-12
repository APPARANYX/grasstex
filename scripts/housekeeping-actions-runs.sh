#!/usr/bin/env bash
set -euo pipefail
: "${GH_TOKEN:?missing token}"
REPO="${REPO:-APPARANYX/grasstex}"
DRY_RUN="${DRY_RUN:-true}"
AGE="${MIN_AGE_DAYS:-21}"
LIMIT="${MAX_DELETE:-50}"
KEEP="${KEEP_PER_WORKFLOW:-3}"
dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT
gh api --paginate "repos/$REPO/pulls?state=open&per_page=100" --jq '.[] | .head.sha, .head.ref' | sort -u > "$dir/protected"
gh api --paginate "repos/$REPO/actions/runs?per_page=100" --jq '.workflow_runs[] | [.id,.workflow_id,.status,.conclusion,(.head_sha // "" ),(.head_branch // "" ),(.name // ""),.created_at] | @tsv' > "$dir/runs"
declare -A per_workflow
count=0
while IFS=$'\t' read -r id workflow status outcome sha branch name created; do
  [ -n "$id" ] || continue
  per_workflow["$workflow"]=$(( ${per_workflow["$workflow"]:-0} + 1 ))
  [ "${per_workflow["$workflow"]}" -gt "$KEEP" ] || continue
  [ "$status" = completed ] || continue
  case "$outcome" in failure|skipped|cancelled) ;; *) continue ;; esac
  case "$branch" in main|master|benchmark-results|"") continue ;; esac
  if grep -qxF -e "$sha" -e "$branch" "$dir/protected"; then continue; fi
  case "${name,,}" in *benchmark*|*deploy*|*production*|*release*) continue ;; esac
  [ "$(date -u -d "$created" +%s)" -lt "$(($(date -u +%s) - AGE * 86400))" ] || continue
  [ "$count" -lt "$LIMIT" ] || break
  count=$((count+1))
  echo "$([ "$DRY_RUN" = true ] && echo WOULD_DELETE || echo DELETE) $id $outcome $name [$branch]" | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
  if [ "$DRY_RUN" != true ]; then
    # Fail closed if the open-PR query fails.
    gh api --paginate "repos/$REPO/pulls?state=open&per_page=100" --jq '.[] | .head.sha, .head.ref' > "$dir/fresh"
    if grep -qxF -e "$sha" -e "$branch" "$dir/fresh"; then continue; fi
    gh api -X DELETE "repos/$REPO/actions/runs/$id" >/dev/null
  fi
done < "$dir/runs"
echo "Eligible: $count (dry_run=$DRY_RUN)" | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
