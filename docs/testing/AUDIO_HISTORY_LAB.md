# Native Audio History Lab (unattended)

A **presentation-only**, fixed-seed 10 US versus 10 German rifle/SMG/LMG/carbine firing exercise for observing the actual Babylon 9.27.1 audio implementation under extended overlapping fire at 4× simulation speed. **This is a sound simulation, not a combat benchmark**: no agents choose targets, no bullets are simulated, and firing events must not be read as tactical or casualty performance.

## What it uses

- The **same** `BattleSim.buildWeaponAudio()` gunshot pool used in Battle Sim, with the existing `BattleAudioScheduler` speed-of-sound queue, max two starts per rendered frame, and bounded queue.
- The shared `BattleAudioMix` compressor/volume policy and `BattleListenerAcoustics` processing. No second implementation of gunshot sounds, pooling or attenuation.
- The actual deployed, licensed `Assets/audio/manifest.json` and private hosted audio clips, including the existing CAF/Ogg/MP3 format probe. Nothing licensed is bundled with the lab, its report, or this public repository.
- Two spatial firing lines, roughly 120 m apart, viewed by a listener near the middle. The deterministic sequence includes first contact, exchange, heavier sustained fire, lull, second exchange, and recovery; individual burst/reload pacing approximates `BattleWeapons.PROFILES`.

## How to run (no interaction)

Production (once this lab has deployed): `https://test.ivandpopov.com/grasstex/battle/audio_lab.html?log=0`

A branch preview must first be staged by the normal `preview.php?ref=work/audio-history-lab-20261027` launcher. Then use its displayed `/preview/ref-<SHA>/battle/audio_lab.html?log=0` path. The preview stages the lab's HTML/JS from that commit but uses **production audio assets**; the manifest URL is recorded in the JSON report.

The headless Playwright runner runs the entire timeline without clicks:

```bash
AUDIO_LAB_URL='https://test.ivandpopov.com/grasstex/preview/ref-<SHA>/battle/audio_lab.html?log=0' \
AUDIO_LAB_REPORT='/tmp/audio-lab-report.json' \
node scripts/probes/probe_audio_lab.cjs
```

It launches Chromium with the testing-only autoplay flag, waits for `window.__audioLab.done`, saves the full JSON report, and fails if Web Audio is not running, no actual pool play calls were attempted, the page errors, or execution does not complete. It neither starts a battle nor clicks through the real combat UI.

Default run is **220 simulated seconds at 4×** (approximately 55 wall seconds of firing plus preparation and drain). Set `?duration=60&speed=4` for a short smoke run. Compare matching runs with `&acoustics=off`, `&audioMix=legacy`, `&audioMix=main&tacticalController=new`, or `&tacticalController=new`; don't change more than one variable per comparison. Don't silently change the seed or the roster.

## Diagnostics and interpretation

A sample is recorded every 250 ms with wall/simulation time and phase, cumulative intended shots, successful calls to the Babylon `Sound.play()` wrapper, active/available pooled Sound objects, busy/not-ready/locked skips, propagation-queue depth, output-bus peak and RMS, potentially clipped samples, AudioContext state/time, listener-acoustic activity, JS heap where exposed, and main-thread long tasks where supported. The output also records by-weapon counts, phase transitions, the audio configuration, and browser page errors. Read the final report from `window.__audioLab.final` or the runner's JSON file.

`playRequests` means the pool **called** `Sound.play()`; it does **not** prove that the user's device emitted a sample. `activeVoices` counts pooled `Sound.isPlaying` objects, not a hardware-wide count of buffer-source nodes. `samplesQuietUnderFire` is a *potential* silence signal: less than 0.0005 RMS in a 250 ms sample with at least four attempted shot emissions; it is not proof that the physical speakers went silent. `clippedSamples` measures the final Web Audio mix, not the source recording.

Report `droppedBusy` and `maxQueue` separately. Dropped starts can explain missing individual reports while a running AudioContext and sustained near-zero output may indicate routing, clipping, suspended playback or measurement limitations. `?log=0` suppresses normal GTLog so the lab does not itself cause console-DOM bloat. Repeat the same run with audioMix/acoustics variants before proposing audio sprites, global stealing or low sample-rate re-encoding.

## Scope and limitations

The lab does not execute actual tactical AI and therefore does not generate real casualty, targeting, suppressive fire, projectile impact or speech scheduling patterns. It deliberately exercises existing **weapon** pools and sound scheduling rather than the combat impact, voice and grenade subsystems. An audio-sprite prototype can later reuse the same event timeline to compare playback, memory, loading cost and voice drops fairly. No benchmark acceptance threshold is asserted until browser observations are collected.
