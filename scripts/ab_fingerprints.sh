#!/usr/bin/env bash
# Neutral-refactor proof: identical end states on real 600 s battles, branch vs a worktree of a base ref.
#   scripts/ab_fingerprints.sh [--control] [base-ref]        (default origin/main)
# Env: AB_PER_TYPE (battles per type, default 10), AB_CHUNK (seeds per type per saved chunk, default 3; a re-run resumes), AB_ARMS (space list of query strings; default
#   "|mind=0|stats=0" i.e. default, mind=0, stats=0; use "-" for the empty query), AB_SECONDS (600),
#   AB_OUT (default $TMPDIR-free ./out/ab), AB_PORT (8765), AB_WORK (/tmp/www, where the two trees are served).
# Serves the base worktree and this checkout at $AB_WORK/ab-base and $AB_WORK/ab-head, each with
# preview.json {"ref":"local"} (never committed), under PHP_CLI_SERVER_WORKERS=4, runs
# scripts/run_probe.cjs PROBE=state-fingerprint on both for every arm, then
# scripts/compare_battle_fingerprints.cjs. --control runs the base tree against itself first (same arm
# twice): if the control differs the driver is not deterministic here and the A/B means nothing.
# Exit 1 on any difference. About 8 minutes per 30-battle arm on 4 cores.
set -euo pipefail
CONTROL=0
[ "${1:-}" = "--control" ] && { CONTROL=1; shift; }
BASE_REF="${1:-origin/main}"
N="${AB_PER_TYPE:-10}"
SECS="${AB_SECONDS:-600}"
PORT="${AB_PORT:-8765}"
WORK="${AB_WORK:-/tmp/www}"
OUT="${AB_OUT:-out/ab}"
ARMS="${AB_ARMS:-- mind=0 stats=0}"
ROOT="$(git rev-parse --show-toplevel)"
status=0
case "$OUT" in /*) ;; *) OUT="$ROOT/$OUT" ;; esac
mkdir -p "$WORK" "$OUT"
BASE_DIR="$WORK/ab-base-src"
if [ ! -d "$BASE_DIR" ]; then git -C "$ROOT" worktree add --detach "$BASE_DIR" "$BASE_REF" >/dev/null; else git -C "$BASE_DIR" checkout --detach "$BASE_REF" >/dev/null 2>&1; fi
mkdir -p "$WORK/ab-base" "$WORK/ab-head"
ln -sfn "$BASE_DIR" "$WORK/ab-base/grasstex"; ln -sfn "$ROOT" "$WORK/ab-head/grasstex"
# One docroot per tree keeps `/grasstex/` unambiguous; each carries its own preview marker.
printf '{"ref":"local"}' > "$BASE_DIR/preview.json"; printf '{"ref":"local"}' > "$ROOT/preview.json"
trap 'kill $PHP_BASE $PHP_HEAD 2>/dev/null || true; rm -f "$BASE_DIR/preview.json" "$ROOT/preview.json"' EXIT
PHP_CLI_SERVER_WORKERS=4 php -S "127.0.0.1:$PORT" -t "$WORK/ab-base" >"$OUT/php-base.log" 2>&1 & PHP_BASE=$!
PHP_CLI_SERVER_WORKERS=4 php -S "127.0.0.1:$((PORT+1))" -t "$WORK/ab-head" >"$OUT/php-head.log" 2>&1 & PHP_HEAD=$!
sleep 2
battles() {  # battles <from> <to>: meeting|us-defend|ge-defend x standard seeds from..to
  local list=""
  for t in meeting us-defend ge-defend; do for i in $(seq "$1" "$2"); do
    list="$list${list:+,}$t:standard-benchmark-$t-s1-b$(printf %04d "$i")-0001"; done; done
  echo "$list"
}
run() {  # run <port> <query> <outfile> <from> <to>
  local q="$2"; [ "$q" = "-" ] && q=""
  PROBE=state-fingerprint PROBE_BATTLES="$(battles "$4" "$5")" PROBE_SECONDS="$SECS" PROBE_OUTPUT="$3" \
    PROBE_URL="http://127.0.0.1:$1/grasstex/battle_sim_local.php${q:+?$q}" \
    NODE_PATH="$(npm root -g)" node "$ROOT/scripts/run_probe.cjs" >/dev/null
}
# A container restart kills a long run, so the work is chunked: each chunk of CHUNK seeds per type is saved on its
# own and skipped when it is already there. Re-run the same command to resume.
CHUNK="${AB_CHUNK:-3}"
for arm in $ARMS; do
  tag="${arm//[^a-zA-Z0-9]/_}"
  for from in $(seq 1 "$CHUNK" "$N"); do
    to=$((from + CHUNK - 1)); [ "$to" -gt "$N" ] && to="$N"
    c="$tag-$from-$to"
    if [ "$CONTROL" = 1 ] && [ ! -s "$OUT/control-b-$c.json" ]; then
      run "$PORT" "$arm" "$OUT/control-a-$c.json" "$from" "$to" >/dev/null & pa=$!
      run "$PORT" "$arm" "$OUT/control-b-$c.json" "$from" "$to" >/dev/null & pc=$!
      wait $pa || status=1; wait $pc || status=1
    fi
    if [ ! -s "$OUT/base-$c.json" ] || [ ! -s "$OUT/head-$c.json" ]; then
      # The two trees are independent servers: play them side by side (wall time only; the sim is deterministic).
      run "$PORT" "$arm" "$OUT/base-$c.json" "$from" "$to" >/dev/null & pb=$!
      run "$((PORT+1))" "$arm" "$OUT/head-$c.json" "$from" "$to" >/dev/null & ph=$!
      wait $pb || status=1; wait $ph || status=1
    fi
    [ "$CONTROL" = 1 ] && { echo "== control '$arm' seeds $from-$to"; node "$ROOT/scripts/compare_battle_fingerprints.cjs" "$OUT/control-a-$c.json" "$OUT/control-b-$c.json" | grep -E '"(compared|identical)"' || status=1; }
    echo "== arm '$arm' seeds $from-$to: base $BASE_REF vs head"
    node "$ROOT/scripts/compare_battle_fingerprints.cjs" "$OUT/base-$c.json" "$OUT/head-$c.json" | grep -E '"(compared|identical|ratio)"|"changes": \[$' || status=1
    node "$ROOT/scripts/compare_battle_fingerprints.cjs" "$OUT/base-$c.json" "$OUT/head-$c.json" >/dev/null || status=1
  done
done
exit $status
