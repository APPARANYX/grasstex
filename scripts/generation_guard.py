"""Refuse a paid generation run that would regenerate the library instead of filling a gap.

The ElevenLabs generators make a clip whenever its file is missing under Assets/audio/. Since every
clip lives in the private APPARANYX/grasstex-audio repo, a run whose overlay is missing or misplaced
sees the whole library as missing and pays to regenerate all of it (a combat-SFX run once remade all
58 clips). So before any API call:
  - no declared clip present at all  -> refuse: the library was not overlaid;
  - more missing clips than max_new   -> refuse, naming how to allow it on purpose.
Explicitly forced clips (--force) are not counted. max_new comes from --max-new, else the
GENERATE_MAX_NEW environment variable, else DEFAULT_MAX_NEW; 0 means no cap (still not with an
empty library unless forced).
"""
import os
import sys

DEFAULT_MAX_NEW = 12


def max_new(cli_value):
    if cli_value is not None:
        return int(cli_value)
    env = os.environ.get("GENERATE_MAX_NEW", "").strip()
    return int(env) if env else DEFAULT_MAX_NEW


def check(label, declared, present, missing, cap):
    """declared/present: clips the manifest declares / that exist on disk; missing: unforced jobs."""
    if missing <= 0:
        return
    if declared > 0 and present == 0:
        sys.exit(f"{label}: none of the {declared} declared clips is on disk, so this would regenerate the whole "
                 f"library. The private audio is probably not overlaid (scripts/fetch_private_audio.sh); refusing "
                 f"before any ElevenLabs call. Use --force to regenerate on purpose.")
    if cap and missing > cap:
        sys.exit(f"{label}: {missing} clips are missing, more than the {cap} a run may generate. Refusing before any "
                 f"ElevenLabs call: check that the private audio is overlaid. If this many new clips are intended, "
                 f"rerun with --max-new {missing} (or the workflow's max_new input).")
