# Native Audio History Lab (unattended)

A **presentation-only**, fixed-seed **50 US versus 50 German**, with optional 10v10 comparison, rifle/SMG/LMG/carbine firing exercise for observing the actual Babylon 9.27.1 audio implementation under extended overlapping fire at 4× simulation speed. **This is a sound simulation, not a combat benchmark**: no agents choose targets, no bullets are simulated, and firing events must not be read as tactical or casualty performance.

## What it uses

- The **same** `BattleSim.buildWeaponAudio()` gunshot pool used in Battle Sim, with the existing `BattleAudioScheduler` speed-of-sound queue, max two starts per rendered frame, and bounded queue.
- The shared `BattleAudioMix` compressor/volume policy and `BattleListenerAcoustics` processing. No second implementation of gunshot sounds, pooling or attenuation.
- The actual deployed, licensed `Assets/audio/manifest.json` and private hosted audio clips, including the existing CAF/Ogg/MP3 format probe. Nothing licensed is bundled with the lab, its report, or this public repository.
- Five 10-man squads per faction across **60, 105, 185, 355, and 780 m listener-distance bands** (plus a sixth optional 1350 m culling-control band). At 4×, the actual scheduler applies propagation delay, inverse-distance gain, far-distance probabilistic admission and 45 ms model throttling; the weapon pool applies near/far crossfade and real Babylon 3D positioning. The lab's mixed obstacle layout loads the real `BattleObstacleField` and `BattleListenerAcoustics` filters, with representative walls and nearby buildings. `?occlusion=open` removes them for a matched unobstructed comparison. The deterministic sequence includes first contact, exchange, heavier sustained fire, lull, second exchange, and recovery; individual burst/reload pacing approximates `BattleWeapons.PROFILES`.

## How to run (no interaction)

Production (once this lab has deployed): `https://test.ivandpopov.com/grasstex/battle/audio_lab.html?log=0&tacticalController=new`

A branch preview must first be staged by the normal `preview.php?ref=work/audio-history-lab-20261027` launcher. Then use its displayed `/preview/ref-<SHA>/battle/audio_lab.html?log=0` path. The preview stages the lab's HTML/JS from that commit but uses **production audio assets**; the manifest URL is recorded in the JSON report.

The headless Playwright runner runs the entire timeline without clicks:

```bash
AUDIO_LAB_URL='https://test.ivandpopov.com/grasstex/preview/ref-<SHA>/battle/audio_lab.html?log=0&tacticalController=new' \
AUDIO_LAB_REPORT='/tmp/audio-lab-report.json' \
node scripts/probes/probe_audio_lab.cjs
```

It launches Chromium with the testing-only autoplay flag, waits for `window.__audioLab.done`, saves the full JSON report, and fails if Web Audio is not running, no actual pool play calls were attempted, the page errors, or execution does not complete. It neither starts a battle nor clicks through the real combat UI.

Default run is **50v50, 220 simulated seconds at 4×** (approximately 55 wall seconds of firing plus preparation and drain). Set `?duration=60&speed=4` for a short smoke run; `?squads=1` replays the original 10v10 distance band; `?squads=6` adds a 60v60 test including sources beyond the real 1200 m culling limit. Compare matching runs with `&acoustics=off`, `&audioMix=legacy`, `&audioMix=main&tacticalController=new`, or `&tacticalController=new`; don't change more than one variable per comparison. Don't silently change the seed or the roster.

## Diagnostics and interpretation

A sample is recorded every 250 ms with wall/simulation time and phase, cumulative intended shots, **real scheduler distance culls, far-distance probabilistic skips and throttles, evicted primary shots versus echoes, and scheduler starts**, successful calls to the Babylon `Sound.play()` wrapper, active/available pooled Sound objects, busy/not-ready/locked skips, propagation-queue depth, output-bus peak and RMS, potentially clipped samples, AudioContext state/time, listener-acoustic activity, JS heap where exposed, and main-thread long tasks where supported. The output also records by-weapon counts, phase transitions, the audio configuration, and browser page errors. Read the final report from `window.__audioLab.final` or the runner's JSON file.

`playRequests` means the pool **called** `Sound.play()`; it does **not** prove that the user's device emitted a sample. `activeVoices` counts pooled `Sound.isPlaying` objects, not a hardware-wide count of buffer-source nodes. `samplesQuietUnderFire` is a *potential* silence signal: less than 0.0005 RMS in a 250 ms sample with at least four attempted shot emissions; it is not proof that the physical speakers went silent. `clippedSamples` measures the final Web Audio mix, not the source recording.

Report `schedulerPrimaryEvictions`, `schedulerEchoEvictions`, `schedulerFarThrottled`, `schedulerFarSkipped`, `schedulerDistanceCulled`, `droppedBusy`, and `maxQueue` separately. `schedulerPrimaryStarts`/`schedulerEchoStarts` count scheduler invocations of `audio.play`, not successful decoded-device output; a single invocation can start two near/far voices. At load, the real per-model gunshot pools remain shared across the five squads—exactly as in production. Dropped starts can explain missing individual reports while a running AudioContext and sustained near-zero output may indicate routing, clipping, suspended playback or measurement limitations. `?log=0` suppresses normal GTLog so the lab does not itself cause console-DOM bloat. Repeat the same run with audioMix/acoustics variants before proposing audio sprites, global stealing or low sample-rate re-encoding.

## Scope and limitations

The lab does not execute actual tactical AI and therefore does not generate real casualty, targeting, suppressive fire, projectile impact or speech scheduling patterns. It deliberately exercises existing **weapon** pools and sound scheduling rather than the combat impact, voice and grenade subsystems. An audio-sprite prototype can later reuse the same event timeline to compare playback, memory, loading cost and voice drops fairly. No benchmark acceptance threshold is asserted until browser observations are collected.

The firing script retains the same original seed across squad counts; the audio scheduler records its own distance-stage decisions without changing admission caps or consumption order. The shot schedule has a stable internal seed; the shipping propagation scheduler intentionally retains its own acoustic jitter/echo randomization, so compare measured aggregate histories rather than assuming identical individual sound arrival times across runs.
