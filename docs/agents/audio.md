## Audio

`Assets/audio/manifest.json` is the runtime contract, and the runtime never calls an API.

- **Route:** fetch into gitignored `.runtime/`, slice, master, register in `manifest.json`, then push
  the MP3s (with their `.caf`/`.ogg` Opus twins) to the private `APPARANYX/grasstex-audio` and commit
  here only the manifest, the lock and the `.mastering-state.tsv` lines. **No audio file is committed
  to this repo** (`.gitignore` keeps `Assets/audio/**/*.mp3|caf|ogg` out).
  - Fetch: `fetch_sonniss_ww2.py scan|fetch <year>`, which does range requests into bundle zips, or
    `fetch_freesound_cc0.py <ids>`, which refuses anything not CC0.
  - Slice: `slice_weapon_shots.py scripts/recipes/<recipe>.json`. It uses transient detection, or
    `segments` for engines.
  - Master: `bash scripts/normalize_audio.sh Assets/audio`. It's incremental via `.mastering-state.tsv`.
    Delete that file to force a remaster when a target changes. `--explain <path>` shows the
    target, and `UNCOVERED` means no target exists, so the file would ship unmastered.
- **Targets:** mono MP3 48 kHz/128 kbps with a -1 dBTP ceiling.
  - One-shots are levelled on the loudest 100 ms (dBFS, not LUFS): small arms -16, cannon -13,
    foley -26, with at most +6 dB boost.
  - Sustained material uses EBU R128: voices -18, engines -22, ambience -26 LUFS.
  - Do distance in the runtime mix, never in the master.
- **Placeholders:** declared-but-unrecorded clips are listed in `Assets/audio/.manifest-placeholders.txt`.
  Delete a line when its audio lands; CI fails if a listed clip exists. New directories must be in
  `AUDIO_ASSET_GLOBS` in `prepare_incremental_deploy.py`, or they 404 live.
- **ElevenLabs is never called automatically.** The voice and combat-SFX generator workflows run only
  when a person starts them (`workflow_dispatch`); no push, schedule or other workflow triggers them.
- **Voices:** generated with ElevenLabs `eleven_v3` via `scripts/generate_voice_callouts.py
  [--faction us|ge] [--force [EVENT]]`, which needs `ELEVENLABS_API_KEY` (never commit it).
  - Voice IDs: US `TxWZERZ5Hc6h9dGxVmXa`, GE `Z2yQ1EdlDmcIgh9Pn4Lw`. Prompt prefix
    `[shouting][hoarse][panicked]`, settings stability .4, similarity .7, style .9, speaker boost.
  - Don't rename generated files.
  - Pitch variants (-1.4 / 0 / +1.3 semitones, split 30/40/30, tempo-compensated) are built at deploy
    by `build_voice_pitch_variants.sh` and aren't committed.
- **Acoustics:** 1 unit ≈ 1 m, 20·log10(r) spreading, 343 m/s delay. Shout culls at 150 m,
  small arms at 3500 m (distant shot pool); automatic-weapon tails at 1500 m. Settings live in `Assets/audio/acoustics.json`.
- **Licensing:** Sonniss GDC bundles (royalty-free, no attribution; **no AI training and no
  redistribution as a library**), Freesound CC0, ElevenLabs generations, and **licensed third-party audio WWII
  Firearms** for every small arm (owner's single-user licence: use inside the game only, **never
  redistributed or offered as individual stems**). So **every clip lives in the private repo
  `APPARANYX/grasstex-audio`**, at the same path it has under `Assets/audio/`, each MP3 with a `.caf`
  and an `.ogg` Opus twin. CI, the generators and the production deploy check out the commit pinned in
  `Assets/audio/private-audio.lock.json` with the read-only deploy key in the `PRIVATE_AUDIO_READ_KEY`
  secret and overlay it (`scripts/fetch_private_audio.sh`); the voice and combat-SFX generators push
  new clips there with the write key in `AUDIO_PRIVATE_WRITE_KEY` and bump the lock
  (`scripts/publish_private_audio.sh`). The overlay runs before generation, and both generators refuse before
  any ElevenLabs call when no declared clip is on disk or more than 12 are missing (`scripts/generation_guard.py`;
  `--max-new N` / the workflows' `max_new` input for an intended bulk run, `--force` to regenerate on purpose). A fork's PR has no secrets, so its audio and deploy-plan jobs
  fail. Changing clips by hand: push to grasstex-audio (MP3 plus both twins), bump the lock and the
  MP3s' `.mastering-state.tsv` lines here. Browsers load the twin their probe decodes (module
  `00-audio-format.js`, `"opusTwins": "all"` in the manifest), MP3 otherwise; the deploy uploads all
  three and builds the voice pitch variants' twins too. Older provenance: `git show 1a5b0cf:Assets/audio/WW2_SOURCES.md`.

**Weapon SFX (`Assets/audio/weapon-clip-manifest.json`, shipped from licensed private source audio).** Replaced
`manifest.json`'s Sonniss-derived `categories.weapons` small-arms pools and `weaponFoley`, which were
keyed by sim kind and whose automatic-weapon "shots" were recorded bursts. The clip manifest is keyed
one entry per `battle/weapons.js` `PROFILES[faction][kind].model` (10 weapons: Garand, Kar98k, M1
Carbine, Thompson, FG42, MP40, M1919A6, MG42, M1911A1, P38), one action per sim event (fire, distant
fire, burst tail, reload stages by mechanism, stoppage click/clear, bipod deploy/fold, plus the Garand's
clip ping and the Kar98k's bolt cycle). Every action comes from licensed private source audio
(`grasstex-audio`'s `tools/build.py`; its `SOURCES.csv` records each clip's source take): `fire` from
the 3 m construction-kit takes, one discharge per file, attack within 10 ms; `fireDistant` from the
100 m takes; `fireTail` the echo after a designed single shot (never an automatic recording); foley
from the designed and construction-kit mechanics takes. The pack has no M1919 or M1911: the M1919A6 is
Bren shots pitched -1 st with MG 42 belt foley pitched -1.5 st, the M1911A1 is TT 33 pitched -2 st, and
both bipods are the DP 27's. The 17 pack guns the game does not field (StG 44, Bren, DP 27, AVS 36,
SVT 40, Gewehr 41, G33, Mosin M38, M3, MP28, PPD 40, PPS 43, Sten, PPK, TT 33, M30 Drilling rifle and
shotgun) are clipped and registered too, ready for a profile to name them. Not recorded: `shared`
casings and the `impacts` set (flybys and impacts already play from `combat/`), mg42 `barrelChange`.
The clip manifest's `prompt`s are kept for any clip regenerated with ElevenLabs
(`scripts/generate_weapon_sfx.py`); `scripts/check_weapon_clips.py --shots` vets a shot before import.

Runtime: `manifest.json` category `weapon.<model>` holds each model's actions. `battle-sim.js`
`buildWeaponAudio` keys shots by `weapon.profile`: one `fire` per round (automatic fire is retriggered
per round, never a recorded burst), `fireDistant` from `DISTANT_FROM` (90 m: the near voices' linear
roll-off is silent by ~97 m). Distant shots extend to 3500 m and automatic-weapon tails to 1500 m; these are simple gameplay distance limits, not weather/terrain-aware propagation. The 90 m switch remains abrupt, and nearby weapon handling stays at 30 m. Longer-range atmospheric filtering, terrain occlusion and near/far crossfading require separate work. Voice pools of `ceil(cyclic x 0.9 s) + 2` so a fast gun never cuts off
its own last round; a model with no clips falls back to the kind's `SFX_FILES`. Module
`15-weapon-foley-audio.js` plays the rest (reload stages, stoppages, bipod, bolt cycle, clip ping,
burst tails; see its harness row). File layout keys the mastering targets: `weapons/<model>/<action>-NN.mp3`
(smallArms -16 dBFS) and `weapons/foley/<model>-<action>-NN.mp3` (-26 dBFS). Each clip also has two Opus twins
beside the `.mp3` (64 kbps, same mastering gain, about half the size): `.caf` for Safari/iOS and
`.ogg` for Chrome, Edge, Firefox and Android. Module `00-audio-format.js` decodes one twin per
container in an OfflineAudioContext at load, CAF first, then Ogg; the shot pools and the foley module
wait for it and load the container that decoded, or the MP3s if neither did. Mastering and
`.mastering-state.tsv` cover the MP3s only; the twins are encoded from the same stage files with the
same gain (`grasstex-audio`'s `tools/master_caf.py`, `TWIN_EXT=ogg` for Ogg), and the deploy uploads
all three (it fails if a twin is missing).

**Combat sounds (`Assets/audio/combat-sfx-manifest.json`).** What a round sounds like after it leaves the muzzle: near-miss
flybys (`crack`, `whiz`), ricochets, impacts by surface (dirt, masonry, wood, metal, vegetation), flesh hits and pain (`wounded`,
`down`), 58 ElevenLabs Sound Effects clips under `Assets/audio/combat/<group>/`, each with its prompt in the manifest, mirrored
into `manifest.json` categories `flyby`, `ricochet`, `impacts`, `flesh` and `pain` (`check_audio_manifest.py` holds the two equal).
`.github/workflows/combat-sfx-generate.yml`, started by hand only, generates the missing ones on a branch (never main; repo secret `ELEVEN_LABS_API`;
`scripts/generate_combat_sfx.py`), masters them (`combat/*` targets: -22 dBFS, pain -18), pushes them to grasstex-audio and commits the lock; a rerun generates only
what is missing. `battle/modules/15-combat-audio.js` plays them (see its harness row): one sound per instance, capped per group.

**Audio tracker: CI and the deploy skip audio work when no audio changed.** `scripts/audio_tracker.py` lists the audio inputs
(`Assets/audio/`, the audio scripts and recipes, `ci.yml`, the production deploy). CI's audio job asks it first (`diff` against the
pull request's base or the commit before a push) and skips ffmpeg and every audio check when nothing changed; the production deploy
compares a `snapshot` with the tracker the last successful deploy uploaded (`/grasstex/.battle-audio-tracker.json`, put after the
hash state) and skips ffmpeg, the voice inventory, the pitch variants and the voice upload when they match. Any doubt (no base, no
tracker on the host, no remote hash state) counts as changed.

**Footsteps (`categories.footsteps` in `manifest.json`, real files, nothing plays them yet).**
Ported directly from the sibling project `Teethree89/ww2fps`'s ElevenLabs-generated battlefield
sound library (its `sound-manifest.json` concepts `001_pasture_grass`, `004_cobbled_street`,
`009_rubble`; 6 walk + 6 run takes each) rather than regenerated, so both projects sound
consistent underfoot. Converted from its 48 kHz/24-bit stereo WAV to this project's mono MP3 and
mastered under the foley target (-26 dBFS). `AUDIO_ASSET_GLOBS` in `prepare_incremental_deploy.py`
has one entry per surface folder (a flat, non-recursive glob per directory, same as
`weapons/foley`). Not yet done: which surface plays under a soldier's feet needs a terrain/zone
signal Battle Sim doesn't have yet (its splat/terrain data is host-only), and a footfall-cadence
hook into the animation/movement system - both real engineering, out of scope here.


**Listener-only acoustics (module 12a).** Default `?acoustics=standard`, optional `off` or `high`. All processing happens once per local camera/listener, not for every soldier pair or on the server. The renderer's existing model-specific shot pools crossfade their near/distant recordings over 70–145m rather than abruptly switching at 90m. Voice, reports, burst tails and combat impact/pain clips share bounded 5Hz standard / 8Hz high environmental sampling, using terrain height and the existing indexed obstacle field for occlusion. The filter supports the Babylon 9 AudioV2 SoundTrack output graph and retains a guarded legacy fallback. Sound graph initialization may finish after construction; the processor retries on subsequent updates, while playback remains independent. If a graph is unavailable, playback retains distance/occlusion gain without affecting simulation. A short generated impulse is shared as a wet reverb bus; outdoors the send is very low and structures enable a higher send. At most 24 (standard) / 36 (high) sound instances receive dynamic acoustic processing; extra voices play dry rather than consuming unbounded CPU. Test off-mode, occlusion, budgets and restart reuse via `tools/ai-sim-harness/listener-acoustics-check.js`; run `scripts/probes/probe_listener_acoustics.cjs` or manually dispatch `Acoustic browser QA` to validate a real Babylon 9 graph on a hosted preview. No private clips or asset re-encoding needed.
