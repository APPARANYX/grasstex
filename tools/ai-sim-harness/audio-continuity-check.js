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
  if (clock) ctx.currentTime += 0.1;
  battle.time += 0.4;
  tick();
}
for (let i = 0; i < 12; i++) advance();
let diag = root.__battleAudioDiagnostics__();
assert.equal(diag.diagnosticVersion, 2);
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
for (let i = 0; i < 1300; i++) advance();
diag = root.__battleAudioDiagnostics__();
assert.equal(diag.continuity.length, 1200, 'high resolution ring is bounded');
assert.equal(diag.silenceMarkers[0].preceding.length, 13, 'marker survives ring rotation');
assert.equal(diag.environment.meterPosition, 'master-before-device');
console.log(
  'PASS audio continuity: clock stall, signal loss, marker retention, immutable history, bounded storage'
);
