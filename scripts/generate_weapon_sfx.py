#!/usr/bin/env python3
"""Generate weapon/impact/flyby clips from Assets/audio/weapon-clip-manifest.json via ElevenLabs
Sound Effects (POST /v1/sound-generation), one variation per request - never one generation
pitch-shifted into several "variations" (see the manifest's rules.singleShot).

Route (see AGENTS.md Audio): fetch into gitignored .runtime/, then run normalize_audio.sh over
that directory to master, then copy the mastered files into Assets/audio/ and commit only the
MP3s. This script only does the fetch step.

Usage:
  export ELEVENLABS_API_KEY=...          # never commit it
  python3 scripts/generate_weapon_sfx.py                       # every missing P0+P1 clip
  python3 scripts/generate_weapon_sfx.py --priority P0         # baseline only
  python3 scripts/generate_weapon_sfx.py --only m1-garand mg42 # weapon ids, or "shared"/"impacts"
  python3 scripts/generate_weapon_sfx.py --dry-run             # print jobs, call nothing
  python3 scripts/generate_weapon_sfx.py --force fire          # regenerate one action everywhere

Then, before copying into Assets/audio/:
  python3 scripts/check_weapon_clips.py --shots .runtime/weapon-sfx/weapons/m1-garand/fire-*.mp3
  bash scripts/normalize_audio.sh .runtime/weapon-sfx
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(REPO, "Assets/audio/weapon-clip-manifest.json")
OUT_ROOT = os.path.join(REPO, ".runtime/weapon-sfx")
API_URL = "https://api.elevenlabs.io/v1/sound-generation"
API_KEY = os.environ.get("ELEVENLABS_API_KEY")
MODEL_ID = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_text_to_sound_v2")
# ElevenLabs Sound Effects caps a single generation around 22s; every clip here is under 2.5s
# (see each action's maxDurationS), so the cap never binds - this just guards a manifest typo.
MAX_DURATION_S = 22.0


def generate(prompt, duration_s, prompt_influence):
    payload = {"text": prompt, "model_id": MODEL_ID,
               "duration_seconds": min(max(0.5, duration_s), MAX_DURATION_S),
               "prompt_influence": prompt_influence}
    req = urllib.request.Request(API_URL, data=json.dumps(payload).encode("utf-8"),
                                  method="POST",
                                  headers={"xi-api-key": API_KEY, "Content-Type": "application/json",
                                           "Accept": "audio/mpeg"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")
            if exc.code == 429 and attempt < 3:
                wait = 2 ** (attempt + 1)
                print(f"  429 rate limited, retrying in {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            raise RuntimeError(f"HTTP {exc.code}: {body}") from exc
    raise RuntimeError("exhausted retries")


def all_clips(man):
    for wid, w in man["weapons"].items():
        for cid, c in w["clips"].items():
            yield wid, cid, c
    for cid, c in man.get("shared", {}).items():
        yield "shared", cid, c
    for cid, c in man.get("impacts", {}).items():
        yield "impacts", cid, c


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--priority", choices=("P0", "P1", "P2"))
    ap.add_argument("--only", nargs="+", help="weapon ids (or shared/impacts) to restrict to")
    ap.add_argument("--force", nargs="?", const="*", metavar="ACTION",
                     help="regenerate existing files too, or only the named action")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not API_KEY and not args.dry_run:
        sys.exit("ELEVENLABS_API_KEY is not set. Export it before running this script; never commit it.")

    man = json.load(open(MANIFEST_PATH, encoding="utf-8"))
    force_all = args.force == "*"
    force_action = None if args.force in (None, "*") else args.force

    jobs = []
    for group, cid, c in all_clips(man):
        if args.only and group not in args.only:
            continue
        if args.priority and c["priority"] != args.priority:
            continue
        if not c.get("prompt"):
            sys.exit(f"{group}.{cid} has no generation prompt")
        forced = force_all or force_action == cid
        for rel in c["files"]:
            out_path = os.path.join(OUT_ROOT, rel)
            if not forced and os.path.isfile(out_path) and os.path.getsize(out_path) > 0:
                continue
            jobs.append((group, cid, c, rel, out_path))

    if not jobs:
        print("No matching clips need generation.")
        return
    print(f"{'Would generate' if args.dry_run else 'Generating'} {len(jobs)} clip(s) into {OUT_ROOT}")

    ok, failed = 0, []
    for i, (group, cid, c, rel, out_path) in enumerate(jobs, 1):
        print(f"[{i}/{len(jobs)}] {group}.{cid} -> {rel}")
        print(f"    prompt: {c['prompt']}")
        if args.dry_run:
            continue
        try:
            audio = generate(c["prompt"], c["maxDurationS"], prompt_influence=0.7)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as fh:
                fh.write(audio)
            ok += 1
        except Exception as exc:
            print(f"    FAILED: {exc}", file=sys.stderr)
            failed.append((group, cid, rel, str(exc)))
        time.sleep(0.3)

    if args.dry_run:
        return
    print(f"\nDone. {ok} succeeded, {len(failed)} failed.")
    if failed:
        for group, cid, rel, err in failed:
            print(f"  {group}.{cid} ({rel}): {err}")
        sys.exit(1)
    print(f"\nNext: python3 scripts/check_weapon_clips.py --shots {OUT_ROOT}/weapons/*/*.mp3 "
          f"{OUT_ROOT}/weapons/foley/*.mp3 {OUT_ROOT}/weapons/shared/*.mp3")
    print(f"      bash scripts/normalize_audio.sh {OUT_ROOT}")
    print("      then copy the mastered files into Assets/audio/ and commit only the MP3s.")


if __name__ == "__main__":
    main()
