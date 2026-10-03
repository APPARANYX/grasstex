#!/usr/bin/env bash
# Push new or changed audio clips to the private APPARANYX/grasstex-audio repo and pin the result.
#
# The voice and combat-SFX generators write and master MP3s under Assets/audio/, where .gitignore keeps
# them out of this public repo. This copies every MP3 that the private checkout does not already hold
# byte for byte, adds its Opus twins (.caf for Safari/iOS, .ogg for Chrome, Edge, Firefox, Android),
# commits and pushes to grasstex-audio main (rebasing on a concurrent push), and writes the new commit
# to Assets/audio/private-audio.lock.json, which the caller commits here with the mastering state.
#   bash scripts/publish_private_audio.sh .runtime/private-audio-publish
# The checkout must be grasstex-audio main with push access (the AUDIO_PRIVATE_WRITE_KEY deploy key).
# Prints `published=<n>` last; n=0 changes nothing.
set -euo pipefail
dst="${1:?usage: publish_private_audio.sh <grasstex-audio checkout with push access>}"
lock="Assets/audio/private-audio.lock.json"
n=0
while IFS= read -r -d '' f; do
  rel="${f#Assets/audio/}"
  if [[ -f "$dst/$rel" ]] && cmp -s "$f" "$dst/$rel"; then continue; fi
  mkdir -p "$dst/$(dirname "$rel")"
  cp "$f" "$dst/$rel"
  for twin in caf ogg; do
    ffmpeg -nostdin -v error -y -i "$f" -map_metadata -1 -ar 48000 -ac 1 \
      -c:a libopus -b:a 64k -f "$twin" "$dst/${rel%.mp3}.$twin"
  done
  echo "publish $rel"
  n=$((n+1))
done < <(find Assets/audio -type f -name '*.mp3' -print0 | sort -z)

if [[ "$n" -gt 0 ]]; then
  git -C "$dst" add -A
  git -C "$dst" -c user.name="github-actions[bot]" -c user.email="41898099+github-actions[bot]@users.noreply.github.com" \
    commit -q -m "Audio: $n clip(s) from grasstex ${GITHUB_REF_NAME:-local} (${GITHUB_SHA:-unknown})"
  for attempt in 1 2 3 4; do
    if git -C "$dst" push -q origin HEAD:main; then break; fi
    [[ "$attempt" -eq 4 ]] && { echo "::error::could not push to grasstex-audio" >&2; exit 1; }
    sleep $((attempt * 2))
    git -C "$dst" pull -q --rebase origin main
  done
  commit="$(git -C "$dst" rev-parse HEAD)"
  python3 - "$lock" "$commit" <<'PY'
import json, sys
p, c = sys.argv[1], sys.argv[2]
d = json.load(open(p))
d["commit"] = c
open(p, "w").write(json.dumps(d, indent=2) + "\n")
PY
  echo "Pinned grasstex-audio@${commit:0:12} in $lock."
fi
echo "published=$n"
