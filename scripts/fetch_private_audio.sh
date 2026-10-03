#!/usr/bin/env bash
# Overlay every audio clip onto Assets/audio/ from the private repo.
#
# All clips (MP3s and their Opus twins, .caf and .ogg) live in APPARANYX/grasstex-audio, never in this public
# repo: the licensed third-party audio weapon clips may not be redistributed, and the rest of the library moved with
# them. .gitignore keeps them out of here. CI, the deploy and the generators check out the commit
# pinned in Assets/audio/private-audio.lock.json with the read-only deploy key in the
# PRIVATE_AUDIO_READ_KEY secret, then run this on that checkout:
#   bash scripts/fetch_private_audio.sh .runtime/private-audio
# Locally, with access to the private repo, the same works on any clone of it at the pinned commit.
set -euo pipefail
src="${1:?usage: fetch_private_audio.sh <grasstex-audio checkout>}"
lock="Assets/audio/private-audio.lock.json"
want="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["commit"])' "$lock")"
have="$(git -C "$src" rev-parse HEAD)"
if [[ "$have" != "$want" ]]; then
  echo "::error::$src is at $have, but $lock pins $want" >&2
  exit 1
fi
n=0
while IFS= read -r -d '' f; do
  rel="${f#"$src"/}"
  mkdir -p "Assets/audio/$(dirname "$rel")"
  cp "$f" "Assets/audio/$rel"
  n=$((n+1))
done < <(find "$src" -path "$src/.git" -prune -o -path "$src/tools" -prune -o -type f \( -name '*.mp3' -o -name '*.caf' -o -name '*.ogg' \) -print0)
echo "Overlaid $n audio files from grasstex-audio@${want:0:12}."
