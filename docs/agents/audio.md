## Audio

**Map names for preview links:** **mini-target map** means the **Native Tactical Skills Lab** (`skillsLab=1&combatLab=1&tacticalController=new`): US soldiers against stationary, non-firing dummy targets on the 280 × 240 m range. Keep `labDistance=120&labCover=mixed&labRange=1&labMove=autonomous` for the matched target drill. **Mini meeting map** means the live US-versus-German combat map (`combatLab=1&balancedMeeting=1`, without `skillsLab=1`). These names are not interchangeable. The Howler audio comparison uses `audioBackend=howler&audioMix=main&acoustics=off&audioDiag=1` on either map.

Use the branch-workflow preview `/preview/pr-683/battle_sim.php` for the mini-target map and verify that the served page exports `window.SKILLS_LAB=true` and loads `battle/skills-lab.js`. The launcher's immutable `ref-db297da2be9d` preview uses an older trusted PHP loader that ignores `skillsLab` and loads `phase-c-compact-range.js`; its query string alone does not prove which map runs.

The Howler preview supports `acoustics=standard` (distance low-pass, terrain/cover muffling and light shared reverb) and `high`, as well as `off` for the dry control. Infantry gunfire, voices, weapon handling, combat effects and grenades use the backend adapter. The tactical compressor remains bypassed on Howler. Catalog samples of ambience, footsteps, vehicles and aircraft in the full-mix stress harness are asset/playback coverage, not proof of live gameplay integration for those categories. Voices have a separate 8–80 m brightness curve (14 kHz near, about 9 kHz at 40 m, 2.8 kHz at 80 m), applied before additional obstruction muffling; gunfire keeps the longer distance curve. Spatial attenuation still owns distance volume.

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
- **Safe key verification:** [⭐ Verify ElevenLabs connection](../../.github/workflows/elevenlabs-connection-check.yml)
  is manually dispatched from Actions, makes **only** an authenticated read-only `GET /v1/user`,
  and never requests generation, writes assets or prints the secret. HTTP 200 verifies the active
  `ELEVEN_LABS_API` GitHub Actions secret; HTTP 403 may instead indicate a key scoped away from
  account-read access or an IP restriction, so it does not prove TTS/SFX credentials are unusable.
  The Python generator variable remains `ELEVENLABS_API_KEY` by design, supplied from
  `secrets.ELEVEN_LABS_API`. Do not remove the current secret; inspect/delete the **old GitHub
  secret record** only after confirming its existence separately in repository Settings.
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
roll-off is silent by ~97 m). Distant shots extend to 3500 m and automatic-weapon tails to 1500 m; these are simple gameplay distance limits, not weather/terrain-aware propagation. The 90 m switch remains abrupt, and nearby weapon handling stays at 30 m. Longer-range atmospheric filtering, terrain occlusion and near/far crossfading require separate work. Voice pools use `ceil(cyclic x 0.9 s) + 2` slots; only ready, non-playing Sounds are reused.
Babylon 9 can overlap instances on a single Sound, so busy slots must be skipped before changing
their position/gain, and excess reports are omitted while the shared model pool is full. Locked
audio also drops new reports rather than accumulating delayed starts. Inspect
`__battle__._weaponAudio.summary()` for active slots, capacity, play requests, busy/not-ready/locked
drops and errors. A model with no clips falls back to the kind's `SFX_FILES`. Module
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
The same manifest's group `grenades` (12 clips under `Assets/audio/grenades/`, manifest.json category `grenades`) is the
grenade audio: `pin` (US Mk 2 pin pulled), `igniter` (German M24 cap unscrewed and cord pulled), `spoon` (the Mk 2's lever
flying off on release), all foley at -26 dBFS, and `explosion` (-14 dBFS, one for both kinds). `battle/modules/24a-grenade-audio.js`
plays them (`?grenadeAudio=0` off; see its harness row): arming when the throw is committed, the spoon at release, the
burst where it lands; foley carries 30 m, the burst 800 m.

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

**Player mix (module 00a).** Four locally stored 0–150% sliders (Master, Gunfire, Squad Voices, Effects/Foley) live on the Audio page of the long-press Start menu; LB/RB switches pages. The default 100% position intentionally compensates the old overly quiet runtime gain: weapons 1.8×, voices 1.65×, combat impacts 1.3×, handling 1.25×, and tails 1.35× relative to pre-mix presentation levels. A guarded WebAudio DynamicsCompressor on the Babylon main SoundTrack provides gentle protection (-16 dBFS threshold, 2.5:1, 6 ms attack) when AudioV2 provides a track bus; unsupported graphs retain their original direct route. Master/file targets remain unchanged (voices -18 LUFS, shots -16 dBFS/100 ms). The limiter and gain compensation are **presentation only**, with no effect on AI RNG, bullet timing or multiplayer authority. `?audioMix=legacy` bypasses compensation and compression for dry comparisons; the new settings are not erased. Verify via `tools/ai-sim-harness/audio-mix-check.js` and `player-menu-audio-check.js` and a hosted preview before merge.

**Playback admission and diagnosis.** Gunfire, voices, combat effects, weapon foley and grenades check the live AudioContext before starting; a suspended/interrupted context overrides a stale `unlocked=true`. Pooled effects require a ready, non-playing Sound as well as their minimum hold time. Busy/unavailable one-shots are omitted, not replayed as a backlog after resume. Start and Skills Lab Play initiate native context resume inside the user gesture and verify it after completion. Skills Lab Export JSON includes `audio` diagnostics for the context, active mix/acoustic mode and all five playback categories; counts are Sound.play requests, not proof of audible output. `acoustics=off&audioMix=main` provides the existing dry baseline with the ordinary compressor, while retaining distance, spatial positioning and propagation. Full-mix listening under real rendering/AI load remains necessary; gunfire-only stress results do not validate it.

**Experimental Howler backend (#683).** `?audioBackend=howler` loads pinned Howler 2.2.4 and routes weapon reports, voice, handling, combat effects and grenades through independent playback IDs and a shared per-URL clip cache. Babylon remains the default (`audioBackend=babylon` or omitted). Howler owns the Web Audio context; Babylon audio is disabled. It retains owner pool limits, existing codec selection/fallback, attenuation and propagation, and follows the active camera/speaking mesh. Howler now accepts `acoustics=off|standard|high`: standard/high reuse the listener's terrain/cover attenuation, distance low-pass and shared short reverb, routed through a bounded reusable filter-chain pool on Howler's context. Chain exhaustion plays dry; inactive chains return to the pool at playback completion, including delayed Howler completion callbacks after node reuse. One guarded bridge targets the pinned Howler 2.2.4 per-ID GainNode; graph failure restores the dry route and increments `backend.acousticErrors`. The Babylon compressor stays bypassed and gain sliders still apply. Compare both with `acoustics=off&audioMix=legacy` for the same dry gain policy. `__battleAudioDiagnostics__().backend` records actual Howler play callbacks, errors and peak active sources; gunshot owner starts alone are not proof of audible output. The audio-only full-mix runner tests Babylon standard and Howler off/standard/high sequentially, requiring actual filtered attachments, playback and nonzero master output, while the Mini Map probe selects `MOBILE_MINI_BACKEND` and can wait for natural first gunfire using `MOBILE_MINI_WARMUP_SECONDS`. Catalog recordings declared unrecorded in `.manifest-placeholders.txt` are reported separately; unexpected absent files still fail. This is preview-only pending full-battle/device listening; no claim that a library switch cures progressive crackling.

**Mini-target continuity diagnostics (#683).** `audioDiag=1` enables a bounded 100 ms master-signal / AudioContext-clock trace (last 120 seconds), one-second immutable category, per-model pool and scheduler snapshots (last 240 seconds), environment/build metadata, output timestamps where supported, and focus/fullscreen/pause/speed/context events. The Skills Lab **Silence happened** button preserves up to three preceding trace windows inside Export JSON; mark before pausing where possible. This analyser is upstream of device output: nonzero signal does not prove audible speakers/headphones. Timer samples can miss sub-100 ms dropouts and report timer delays explicitly. The lab speed button cycles 1×/2×/4×. Queue/pool limits remain unchanged. `scripts/probes/probe_target_audio_continuity.cjs` runs 75 wall seconds per case with real rendering/owners: 1×, 2×, 4× and 1→2→4× fullscreen transitions, each dry and standard. It checks served source identity, missing audio, playback errors, running-clock stalls, sustained audio-clock progress below 80% of wall time for 2 seconds, sustained sampled internal silence and marker export; raw reports retain pool drops/queue lateness for diagnosis, not a zero-drop gate. Headless fullscreen support is recorded and cannot replace desktop listening. The existing mobile-mini workflow runs this required Howler matrix after its exact-source Skills Lab preflight.

Diagnostic version 3 also records rolling one-second context/output clock progress ratios and clock lag. This catches partial rendering slowdown even when `clockStalled` stays false. Desktop report (15), preview ba2199c, showed clock progress near 50% around the user silence marker at sim35 after switching to4×; queue peak31/128,7 weapon busy drops, dry, no load/play errors. This is evidence of audio-clock slowdown, not proof of its underlying CPU/graph/device cause. Required mini-target matrix and informational Babylon comparison run after passing preflight even if the older required live mini meeting audio gate fails; the job retains that failure.

**Spatial isolation and controlled pressure (#683).** `audioBackend=howler&audioSpatial=flat` is a diagnostic mono path: omit Howler positional nodes and retain matched linear/inverse/exponential distance gain. Default remains `3d`; queue/pool and acoustic policies do not change. This flag intentionally removes directionality and does not establish a final audio fix. Howler2.2.4 constructor spatial defaults are top-level `panningModel`, `distanceModel`, `rolloffFactor`; a nested `pannerAttr` option is ignored by its spatial plugin, initializing HRTF before per-play correction. Adapter defaults now initialize equal-power immediately, including recycled nodes.

Mini-target matrix reports achieved sim/wall speed separately: ea68006 nominal4× only achieved~0.92× in software rendering, dry peak23 versus user report93. Passing it did not reproduce desktop pressure. `probe_audio_pressure.cjs` supplements it with controlled60/100 concurrent real clip sources for65wall seconds, both3d/flat, on the native target page with simulation/rendering deliberately paused. It verifies actual concurrency (mean>=85%, peak reaches target), physical panner count/mode (no unintended HRTF), clock continuity and nonzero signal, retaining all reports. This is an audio graph capacity experiment, not tactical or full-mix acceptance. The ea68006 full-mix high profile failed on real host ECONNREFUSED even after bounded retries; do not hide that delivery failure or claim a clean full-mix pass.

**Spatial writes without AudioParam automation (#683).** Howler 2.2.4's `Howler.pos()`/`orientation()` write the listener with `setTargetAtTime` and `Howl.pos(id)` writes each panner with `setValueAtTime`. Called every frame, they keep Chrome's PannerNodes on per-sample processing. Measured in headless Chromium (OfflineAudioContext, 100 equal-power voices): static positions render 10 to 13x faster than real time, per-frame listener or source automation 0.73 to 0.79x; with the real adapter and pinned Howler, 100 moving 3D voices held the audio clock at 0.75 of wall time and every clip's wall-clock end timer fired before its audio finished, while flat stayed at 1.0. The adapter now writes the listener and each live panner's `.value` directly, only when a value moves by more than 1 cm (position) or 0.001 (direction); recycled panners are rewritten on play. `?audioSpatialWrite=automation` restores the Howler path; `summary().spatialWrite` reports the mode. The pressure probe moves the listener and voices every tick (rendering still stopped) and records `3d-automation-100` as an informational old-path control. The previous probe left the listener static, so it could not show this cost. Desktop listening is still required. Desktop A/B on Mac Chrome 156 confirmed it: the fix held the clock at 0.995 or better at 93 to 94 voices with 4x sustained; the old path fell to 0.38 to 0.64 with an audible cutout.

**Silence checks measure on the audio thread (#683).** One 2048-sample analyser read covers about 43 ms, and on about 2 fps CI runners main-thread timers fire as rarely as once a second, so reads taken from the page missed short shots and the checks failed at random on both the fix and the old path. The live meter now inserts an AudioWorklet (`grasstex-meter`) between the master gain and the analyser tap. It measures every rendered block and posts one chunk per 37 blocks (about 99 ms) with that chunk's RMS and loudest block RMS. Each one-second `outputHistory` row carries `audioWindow` (`source`, `chunks`, `audioMs`, `maxRms`, `chunkRms`) for the audio rendered since the previous row (`diagnosticVersion` 4). The mini-target check keeps its 5e-5 threshold and its 3-silent-seconds rule, and also requires that at least 85% of busy seconds (2 or more gunshot starts) carry signal. The mini meeting probe requires signal in that second or the next for at least half of the seconds with pool starts (0.0005 threshold), and extends its window by up to 120 s until it holds 5 starts. Both checks fail with "too few reads or starts to judge" instead of passing when there are too few starts or more than 10% of rows hold under 500 ms of measured audio.
