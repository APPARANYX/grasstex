#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('battle/battle_sim.html', 'utf8');
const source = html.slice(
  html.indexOf('  var liveAudioHistory='),
  html.indexOf('  async function startBattle()')
);
const meterNodes = [];
let tick,
  real = 0,
  signal = 0.02;
const node = { connect() {}, gain: { value: 1 } };
const ctx = {
  currentTime: 0,
  state: 'running',
  sampleRate: 48000,
  destination: node,
  createGain: () => node,
  addEventListener() {},
  createAnalyser: () => ({
    fftSize: 2048,
    connect() {},
    getFloatTimeDomainData(data) {
      data.fill(signal);
    }
  }),
  audioWorklet: { addModule: () => Promise.resolve() },
  getOutputTimestamp() {
    return { contextTime: this.currentTime, performanceTime: real };
  }
};
const battle = {
  time: 0,
  paused: false,
  timeScale: 4,
  _weaponFoley: { played: { fireTail: 1 } },
  _weaponAudio: {
    summary: () => ({ active: 8, playRequests: real }),
    detail: () => ({ garand: { active: 8 } })
  }
};
const root = {
  performance: { now: () => real },
  location: { search: '?audioDiag=1' },
  URLSearchParams,
  Float32Array,
  BUILD: 'test',
  Blob: class {},
  URL: { createObjectURL: () => 'blob:meter' },
  AudioWorkletNode: class {
    constructor() {
      this.port = {};
      meterNodes.push(this);
    }
    connect() {}
  },
  navigator: { userAgent: 'fixture' },
  scene: { audioEnabled: true },
  battle,
  document: { visibilityState: 'visible', hasFocus: () => true, addEventListener() {} },
  addEventListener() {},
  setInterval(fn) {
    tick = fn;
  },
  console,
  BattleAudioBackend: {
    engine: () => ({ audioContext: ctx, masterGain: node }),
    summary: () => ({ name: 'howler' })
  }
};
root.window = root;
vm.runInNewContext(source + '\nenableLiveAudioMeter();', root);
function advance(clock = true) {
  real += 100;
  if (clock) ctx.currentTime += typeof clock === 'number' ? 0.1 * clock : 0.1;
  battle.time += 0.4;
  tick();
}
for (let i = 0; i < 12; i++) advance();
let diag = root.__battleAudioDiagnostics__();
assert.equal(diag.diagnosticVersion, 4);
assert.equal(diag.continuity.length, 12);
assert.ok(diag.continuity.every(x => !x.clockStalled));
assert.ok(diag.output.rms > 0);
advance(false);
assert.equal(root.__battleAudioDiagnostics__().continuity.at(-1).clockStalled, true);
assert.equal(root.__battleMarkAudioSilence__(), true);
battle._weaponFoley.played.fireTail = 99;
signal = 0;
advance();
diag = root.__battleAudioDiagnostics__();
assert.equal(diag.output.rms, 0);
assert.equal(diag.silenceMarkers[0].history[0].foley.played.fireTail, 1, 'history is a deep snapshot');
assert.ok(diag.silenceMarkers[0].preceding.at(-1).clockStalled);
for (let i = 0; i < 40; i++) advance(0.5);
diag = root.__battleAudioDiagnostics__();
assert.ok(Math.abs(diag.continuity.at(-1).clockProgressRatio - 0.5) < 0.01);
assert.equal(diag.continuity.at(-1).clockSlow, true, 'partial clock slowdown is detected');
assert.equal(diag.continuity.at(-1).clockStalled, false, 'slow clock need not freeze');
assert.ok(Math.abs(diag.continuity.at(-1).outputProgressRatio - 0.5) < 0.01);
for (let i = 0; i < 40; i++) advance();
assert.equal(root.__battleAudioDiagnostics__().continuity.at(-1).clockSlow, false, 'clock recovery');
for (let i = 0; i < 1300; i++) advance();
diag = root.__battleAudioDiagnostics__();
assert.equal(diag.continuity.length, 1200, 'high resolution ring is bounded');
assert.equal(diag.silenceMarkers[0].preceding.length, 13, 'marker survives ring rotation');
assert.equal(diag.environment.meterPosition, 'master-before-device');
console.log(
  'PASS audio continuity: clock stall, signal loss, marker retention, immutable history, bounded storage'
);

// The audio-thread meter covers every rendered chunk: a short shot between
// once-a-second analyser reads is kept, and a silent second still reads zero.
Promise.resolve()
  .then(() => {
    assert.equal(meterNodes.length, 1, 'meter worklet installed once');
    const port = meterNodes[0].port,
      chunk = rms => port.onmessage({ data: { frames: 4736, rms, peakBlockRms: rms } });
    const nextRow = feed => {
      const n = root.__battleAudioDiagnostics__().outputHistory.length;
      for (let i = 0; i < 30 && root.__battleAudioDiagnostics__().outputHistory.length === n; i++) {
        feed(i);
        advance();
      }
      return root.__battleAudioDiagnostics__().outputHistory.at(-1);
    };
    signal = 0;
    nextRow(() => chunk(0));
    let row = nextRow(() => chunk(0));
    assert.equal(row.audioWindow.source, 'worklet');
    assert.equal(row.audioWindow.maxRms, 0, 'a silent second has no signal');
    assert.ok(row.audioWindow.audioMs > 900, 'every rendered chunk is measured');
    row = nextRow(i => chunk(i === 3 ? 0.02 : 0));
    assert.equal(row.output.rms, 0, 'the analyser read alone misses the short shot');
    assert.equal(row.audioWindow.maxRms, 0.02, 'the meter keeps the short shot');
    assert.equal(row.audioWindow.chunkRms.filter(x => x > 0.01).length, 1, 'coverage counts one loud chunk');
    console.log('PASS audio-thread meter: full chunk coverage, short shot kept, silent second reads zero');
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
