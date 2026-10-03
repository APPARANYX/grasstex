#!/usr/bin/env bash
# Overlay the licensed small-arms clips onto Assets/audio/weapons/.
#
# The clips (BOOM Library WWII Firearms) may not be redistributed, so they live in the private repo
# APPARANYX/grasstex-audio and never in this public one (.gitignore keeps them out). CI and the deploy
# check out the commit pinned in Assets/audio/weapon-audio.lock.json with the read-only deploy key in
# the BOOM_AUDIO_DEPLOY_KEY secret, then run this on that checkout:
#   bash scripts/fetch_weapon_audio.sh .runtime/weapon-audio
# Locally, with access to the private repo, the same works on any clone of it at the pinned commit.
set -euo pipefail
src="${1:?usage: fetch_weapon_audio.sh <grasstex-audio checkout>}"
lock="Assets/audio/weapon-audio.lock.json"
want="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["commit"])' "$lock")"
have="$(git -C "$src" rev-parse HEAD)"
if [[ "$have" != "$want" ]]; then
  echo "::error::$src is at $have, but $lock pins $want" >&2
  exit 1
fi
mkdir -p Assets/audio/weapons
cp -R "$src/weapons/." Assets/audio/weapons/
echo "Overlaid $(find "$src/weapons" -name '*.mp3' | wc -l | tr -d ' ') licensed weapon clips from grasstex-audio@${want:0:12}."
