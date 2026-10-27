# Native Audio History Lab (unattended)

A **presentation-only**, fixed-seed **50 US versus 50 German**, with optional 10v10 comparison, rifle/SMG/LMG/carbine firing exercise for observing the actual Babylon 9.27.1 audio implementation under extended overlapping fire at 4× simulation speed. **This is a sound simulation, not a combat benchmark**: no agents choose targets, no bullets are simulated, and firing events must not be read as tactical or casualty performance.

## What it uses

- The **same** `BattleSim.buildWeaponAudio()` gunshot pool used in Battle Sim, with the existing `BattleAudioScheduler` speed-of-sound queue, max two starts per rendered frame, and bounded queue. The test branch increases the bounded queue from **18 to 128** while preserving **2 playback starts/frame**; primaries displace optional echoes first, and full queues preserve whichever primary is due earliest. Incoming events rejected at capacity are counted as primary/echo rejections.
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

Report `schedulerPrimaryRejections`, `schedulerEchoRejections`, `schedulerPrimaryEvictions`, `schedulerEchoEvictions`, `schedulerFarThrottled`, `schedulerFarSkipped`, `schedulerDistanceCulled`, `droppedBusy`, and `maxQueue` separately. `schedulerPrimaryStarts`/`schedulerEchoStarts` count scheduler invocations of `audio.play`, not successful decoded-device output; a single invocation can start two near/far voices. At load, the real per-model gunshot pools remain shared across the five squads—exactly as in production. Dropped starts can explain missing individual reports while a running AudioContext and sustained near-zero output may indicate routing, clipping, suspended playback or measurement limitations. `?log=0` suppresses normal GTLog so the lab does not itself cause console-DOM bloat. Repeat the same run with audioMix/acoustics variants before proposing audio sprites, global stealing or low sample-rate re-encoding.

## Scope and limitations

The lab does not execute actual tactical AI and therefore does not generate real casualty, targeting, suppressive fire, projectile impact or speech scheduling patterns. It deliberately exercises existing **weapon** pools and sound scheduling rather than the combat impact, voice and grenade subsystems. An audio-sprite prototype can later reuse the same event timeline to compare playback, memory, loading cost and voice drops fairly. No benchmark acceptance threshold is asserted until browser observations are collected.

The firing script retains the same original seed across squad counts; the audio scheduler records its own distance-stage decisions without changing admission caps or consumption order. The shot schedule has a stable internal seed; the shipping propagation scheduler intentionally retains its own acoustic jitter/echo randomization, so compare measured aggregate histories rather than assuming identical individual sound arrival times across runs.

## Per-model sound-pool pressure

The weapon-audio factory exposes a read-only `detail()` snapshot in the final report's `voicePools` map. Keys like `m:mg42` and `m:mg42:far` separate near and distant pools; each reports capacity, currently active slots, playback attempts, successful starts, and busy/not-ready/locked drops. Each pool is shared among all squads carrying that model, and the near/far transition can generate two per-shot pool attempts. Consequently `playRequests` counts voices started, not independent gunshots, and `droppedBusy` must not be divided directly by `simulatedShots`. Pool diagnostics do **not** increase voice caps or change the mix; compare the same 50v50 stress test at 1× and 4× to distinguish production-scale quality from accelerated overload.

## Far-field pool capacity A/B (draft, no shipping change)

The lab supports `?farVoices=4` (production default), plus experimental `?farVoices=8`, `?farVoices=16`, `?farVoices=32`, and `?farVoices=64`, clamped to 4–64. `poolPolicy` records the value in the report, and `voicePools` captures per-model near/far voice attempts and busy drops. The override is passed explicitly only from the lab to `BattleSim.buildWeaponAudio`; existing callers and production defaults remain unchanged. Compare `squads=5&occlusion=mixed&duration=60&speed=1` using the same seed. More voices may require additional acoustic-filter tracking; count peak voices, pool drop rates, clipped samples and acoustic processing pressure before adopting a default increase.

The native listener-acoustics standard quality currently tracks **24 active sounds** (high tracks 36); sounds exceeding that cap play dry rather than undergoing per-source acoustic filtering. The report now includes `acoustics.stats.skippedCapacity` to expose such capacity bypasses in the same A/B test. Keep this number in mind before recommending extra weapon voices, because extra audible sounds alone may not preserve obstacle occlusion fidelity.

## Two-lane queue and priority-acoustics A/B (draft, default off)

`?audioQueues=dual` opts into **independent 64-entry near (0–145m) and distant (145–1200m) propagation queues**. Total pending capacity remains 128. Events preserve the existing distance cull, 343m/s timing, far-admission/throttle decisions and primary-over-echo rules within each queue. If both lanes have eligible events, one is played from each on a render frame; otherwise the eligible lane borrows both starts. Total playback remains at **2 scheduler starts/frame**, not 4, and all voices still use the existing Babylon Sound pools and single master soundtrack. Default `?audioQueues=single` retains the prior unified 128-event queue.

`?acousticPriority=1` opts into **priority-based admission for existing 24 standard / 36 high active acoustic records**. When full, close gunshots and voice callouts can displace a less audible distant acoustic record if their score is at least 20% greater; the displaced sound continues playback using neutralized dry filtering and no wet send. Other sounds continue dry when rejected. This uses the current sound-to-listener distance, input gain and kind (voice, gun, distant gun, tail). It does **not** steal sound-pool voices, increase full-filter capacity or create another WebAudio output bus. Default without that flag retains shipping FIFO acoustic admission.

The report includes `propagation.limits.mode`, `propagation.lanes.near/far.{queued,enqueued,started,rejected,evicted}`, sampled near/far queue depth, `acousticPriority`, and `acoustics.stats.{skippedCapacity,replacedCapacity}`. A/B trials must keep `squads=5&speed=1&duration=60&occlusion=mixed&farVoices=8` fixed. First compare `audioQueues=single`, then `audioQueues=dual`, then `audioQueues=dual&acousticPriority=1`, changing one option per step. Measure total queue rejections, per-model busy drops, acoustics bypass/replacements, near-silence, active voices, output clipping and performance before adopting any default. This experiment reserves per-lane queue slots, so greater protection for nearby fire may increase distant queue rejection; that outcome is intentional to measure, not guaranteed better overall.

## Evidence-gated anti-churn / tail experiments (default unchanged)

The prior C experiment produced 656 acoustic-record replacements in 60 simulated seconds, but each replacement reuses the existing source graph: it is **not** necessarily a filter-node construction or audible click. The priority branch already uses 20% score hysteresis. When one record is displaced, the filter transitions toward 20 kHz using the existing 25 ms smoothing; the optional implementation now schedules the wet-send gain to zero over 8 ms (with a direct fallback when the graph does not support ramps), without disconnecting or stealing active sounds.

Use `?acousticPriority=1&acousticHoldMs=250` to test an additional **250 ms minimum filter-record residence**; `acousticHoldMs=0` (and no hold parameter) preserve the original importance-only admission. The bound is 0–500 ms and has no effect unless acoustic priority is enabled. This is a test-only toggle pending measured A/B, not a new production default. Report `acousticHoldMs`, `acoustics.stats.deniedHold`, `replacedCapacity`, `skippedCapacity` and `wetSendRamps`. The guard can reduce replacement churn but may cause important incoming sounds to receive dry processing briefly; listen for that tradeoff.

Each `voicePools` report now includes `decodedClipCount`, `minClipSeconds` and `maxClipSeconds` read from loaded AudioBuffers. Use these numbers to determine whether any distant samples actually have long tails before designing envelope trimming. Do **not** speed up playback or re-pitch an already active Babylon Sound (it would alter existing transients and can mutate existing overlapping plays), and do not reinterpret busy-pool drops as proof of 2–3-second files. A global far bus would be a distinct mix architecture and should be isolated in its own experiment after priority A/B.

### Experimental 64-voice saturation ceiling

`farVoices` is **per weapon model**, not a global soundtrack/queue channel count. The 50v50 fixture instantiates ten distant model pools, so raising the cap from 8 to 64 increases their aggregate capacity from 80 to 640; together with the unchanged near/fallback pools this raises the total maximum from ~204 to ~764 independent Babylon Sound slots. Every extra sound shares existing decoded recordings but still creates a spatial audio source and potential mix/CPU load. This ceiling is deliberately **opt-in only**; the shipping default remains 4 far voices/model. Perform matched 1× tests for 8, 16, 32, 64 and examine pool busy drops, actual peaks, acoustics capacity misses, RMS/peak, long tasks and audibility before deciding a production budget. Avoid comparing unrelated scenarios or using `droppedBusy=0` as the sole success criterion.

## 8-vs-64 native comparison and scheduler stall caveat (October 27, 2026)

Two completed browser runs, same seed 11027 / 50v50 / 60 simulated seconds / 1× / mixed occlusion / single queue / acoustic priority, compare `farVoices=8` and `farVoices=64`:

| Measure | 8 | 64 |
|---|---:|---:|
| Simulated shots | 7,190 | 7,206 |
| Voice starts | 3,828 | 5,263 |
| Distant voice starts | 1,580 | 3,157 |
| Distant busy drops | 1,866 | **0** |
| All-pool busy drops | 2,379 | 433 |
| Max active voices | 129 | 204 |
| Acoustic capacity rejections | 2,454 | 3,939 |
| Acoustic admissions | 1,374 | 1,324 |
| Primary queue rejections | 617 | 987 |
| Primary queue starts | 4,184 | 3,844 |
| Quiet-under-fire samples | 35 | 42 |
| Max peak amplitude | 0.2627 | 0.2588 |
| Long tasks / playback errors / clipping | 0 | 0 |

**Important:** far pools contain 1.5-second decoded samples (not hypothetical 2–3 second tails); the near model pools mostly 0.9-second samples. The 64-voice run removes **all** distant pool-busy drops while allowing a peak of only 204 of 764 allocated slots. It also shifts more pressure onto the fixed 24-record acoustic processing system and the propagation scheduler. **Do not declare this 64-voice setting production-ready based on pool drops alone.**

A major confound in both runs: 8 voices experiences an interval with a full propagation queue and no primary playback during the scripted lull; 64 voices experiences ~11 seconds with no primary starts during *sustained fire* (approximately sim 32.0–43.2 seconds), with the queue full at 128 while incoming events are still generated. Active voices eventually fall to zero. In both reports the AudioContext stays `running` and interval-driven simulation and sample clocks continue ticking. The gunfire scheduler runs on `requestAnimationFrame`; browsers can throttle or suspend RAF for background tabs while timers continue, which would produce this precise signature. **The reports do not distinguish that possibility from controller failure.**

For follow-up, the scheduler now measures `drainFrames`, `lastDrainMs`, `maxActiveDrainGapMs` and `maxDueLatenessMs`, and each lab sample includes `pageVisibility`, `schedulerSinceDrainMs` and associated maxima. Repeat 8 and 64 runs sequentially **in a continuously visible foreground tab**, without switching focus. If near-silence recurs with `pageVisibility=visible` and no RAF gap, investigate event due-time arithmetic / admission policy. If RAF stalls correlate with `pageVisibility=hidden`, address browser background behavior separately without masking it by raising queue or pool capacity. The first required outcome is continuity; raw sound count alone is insufficient.

## Sequential 8/16/32/64 browser matrix

For developer/headless continuous-visibility confirmation, stage the PR head and run the committed Playwright capture:

```sh
AUDIO_LAB_URL='https://test.ivandpopov.com/grasstex/preview/ref-<first-12-SHA>/battle/audio_lab.html' \
  AUDIO_LAB_REPORT_DIR=./audio-matrix \
  node scripts/probes/probe_audio_lab_matrix.cjs
```

The runner uses **one tab**, runs eight, sixteen, thirty-two, and sixty-four distant model voices sequentially, and records each full report plus `matrix.json`/`matrix.md`. It fixes the scenario at five squads per side, mixed occlusion, 60 simulated seconds, 1× speed, single scheduler queue, priority listener acoustics, zero additional acoustic hold. It validates each trial's measured page visibility (headless mode is not automatically proof of foreground scheduling). Set `AUDIO_LAB_REPEATS=2` for replicated trials, or `AUDIO_LAB_VOICES=8,64` for shorter paired runs. These are real ~60-second browser trials, not static JS simulation.

For manual audible comparisons, open each staged `audio_lab.html` with the same query settings, change only `farVoices=8|16|32|64`, and **keep the tab visible until completion**. Run one configuration at a time. A separate tab left in the background is not a valid continuity test because the audio scheduler drains on requestAnimationFrame. Compare far-pool drops alongside total primary queue drops, quiet-under-fire measurements, `pageVisibility`, `schedulerMaxDrainGapMs`, `schedulerSinceDrainMs` and actual listener processing capacity pressure before adopting a setting. No streaming/audio library defaults are modified by this matrix.

## User-run 16-versus-32 distant pool validation

Both user-uploaded native Audio Lab v2 reports (October 27, 2026) completed on preview `243e5c2ca557`, seed `11027`, 50v50, 60 simulated seconds at 1×, mixed obstacles, **single 128-entry queue**, **acousticPriority=1**, `acousticHoldMs=0`. The two completed reports differ by the `farVoices` override and normal timing jitter, not by game doctrine or audio routing.

| Native metric | Far 16 | Far 32 |
|---|---:|---:|
| Simulated shots | 7,228 | 7,188 |
| Scheduler primary starts | 4,897 | 4,901 |
| Scheduler echo starts | 768 | 768 |
| Queue primary+echo rejected+evicted | **0** | **0** |
| Maximum queued | 113 | 110 |
| Successful weapon voice starts | 5,794 | **6,706** |
| All-pool busy drops | 1,448 | **567** |
| Distant pool playback starts | 3,164 | **4,082** |
| Distant pool busy drops | 884 / 4,048 attempts (21.8%) | **23 / 4,105 (0.56%)** |
| Near pool busy drops | 564 | 544 |
| Peak active voices | 164 | 210 |
| Acoustic capacity skips | 4,201 | 5,106 |
| Acoustic admissions | 1,593 | 1,600 |
| Acoustic record replacements | 668 | 691 |
| Maximum RAF drain gap | 15.3 ms | 11.9 ms |
| Max lateness for due shot | 35.7 ms | 44.2 ms |
| Page visibility | 252/252 visible | 252/252 visible |
| Quiet-under-fire samples | 1 | 1 |
| Long tasks, clipped samples, audio errors | 0 | 0 |
| Peak amplitude | 0.1272 | 0.1810 |
| Wall-clock test time | 65.10 s | 65.12 s |

The single quiet sample in each trial occurs at 0.24 simulated seconds, during initial **speed-of-sound propagation** before the first audible shot; none were observed later during sustained firing. The AudioContext remains `running` throughout. Both runs eliminate the previously observed `queue=128, voices=0` extended stall and show no evidence of a `requestAnimationFrame` suspension under visible-tab conditions. These results strengthen the background-throttling hypothesis for earlier runs but do **not** prove its cause.

At 16 voices, most far-pool busy drops came from Thompson (275), MP40 (192), M1 Garand (154), MG42 (145), M1919A6 (59), FG42 (53), Kar98k (6). At **32 voices**, only Thompson (16) and MP40 (7) remain; all other exercised distant models have zero busy drops. The far-pool drop reduction is **97.4%**, while far playback starts increase **29.0%** and total successful weapon starts **15.7%**. This is stronger evidence of an effective far-pool configuration than the earlier 64-voice test, which was confounded by an extended scheduler stall and lost primaries.

**Decision:** 32 distant voices/model is the leading *candidate for high-quality 50v50 1× audio*, not yet a universal production default. Sixteen is markedly more lossy at this load. Sixty-four may provide diminishing returns beyond 32, but replicate 32/64 under continuously visible tabs before drawing a causal conclusion; test combat-mode cost, acoustic placement quality, actual listening, and 4× stress. The full-acoustic 24-record limit remains: capacity skips rise from 4,201 to 5,106 while admissions stay almost unchanged. Do not interpret more total audible gunfire as more occlusion-filtered voices. Production far-floor=4 and PR draft status stay unchanged pending explicit adoption.
