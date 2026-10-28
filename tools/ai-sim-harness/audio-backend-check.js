#!/usr/bin/env node
'use strict';
// Exercise playback IDs and lifecycle without replacing any game or combat owner.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const rootPath = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(rootPath, 'battle/modules/00-audio-backend.js'), 'utf8');
function fixture(enabled) {
  const howls = [],
    events = [],
    writes = [];
  let nextId = 0;
  class Howl {
    constructor(options) {
      this.options = options;
      this.ids = new Set();
      this.listeners = [];
      howls.push(this);
    }
    duration() {
      return 4.5;
    }
    play() {
      const id = ++nextId;
      this.ids.add(id);
      const notify = this.options.onplay; // Snapshot listeners at emit time, as Howler does.
      if (notify) events.push(() => notify(id));
      return id;
    }
    once(event, fn, id) {
      this.listeners.push({ event, fn, id });
    }
    off(event, fn, id) {
      this.listeners = this.listeners.filter(x => x.event !== event || x.fn !== fn || x.id !== id);
    }
    emit(event, id, error) {
      if (this.options['on' + event]) this.options['on' + event](id, error);
      for (const x of [...this.listeners]) if (x.event === event && x.id === id) x.fn(id, error);
    }
    stop(id) {
      this.ids.delete(id);
    }
    unload() {
      this.unloaded = true;
    }
    pos(...args) {
      writes.push(['pos', ...args]);
    }
    rate(...args) {
      writes.push(['rate', ...args]);
    }
    volume(...args) {
      writes.push(['volume', ...args]);
    }
    pannerAttr(...args) {
      writes.push(['panner', ...args]);
    }
  }
  function BabylonSound() {
    if (enabled) assert.fail('Howler selected but Babylon Sound constructed');
  }
  const ctx = {
    state: 'running',
    resume: async function () {
      this.state = 'running';
    }
  };
  const root = {
    console: { error() {} },
    location: { search: enabled ? '?audioBackend=howler' : '' },
    BABYLON: { Sound: BabylonSound, Engine: { audioEngine: { name: 'babylon-engine' } } },
    Howl,
    Howler: { ctx, masterGain: {}, usingWebAudio: true, volume() {}, pos() {}, orientation() {} }
  };
  root.window = root;
  vm.runInNewContext(source, root);
  let render, dispose;
  const scene = {
    audioEnabled: true,
    activeCamera: { position: { x: 0, y: 1, z: 0 } },
    onBeforeRenderObservable: {
      add(fn) {
        render = fn;
        return fn;
      },
      remove() {}
    },
    onDisposeObservable: {
      addOnce(fn) {
        dispose = fn;
      }
    }
  };
  return {
    root,
    ctx,
    howls,
    writes,
    scene,
    backend: root.BattleAudioBackend,
    flush() {
      events.splice(0).forEach(fn => fn());
    },
    render: () => render(),
    dispose: () => dispose()
  };
}
(async () => {
  const off = fixture(false);
  assert.equal(off.backend.Sound, off.root.BABYLON.Sound);
  assert.equal(off.backend.engine().name, 'babylon-engine');
  assert.equal(off.howls.length, 0, 'default backend does not create Howls');
  const r = fixture(true),
    B = r.backend;
  await B.ready;
  const a = new B.Sound('first', '/shot.ogg', r.scene, null, { maxDistance: 145, rolloffFactor: 1.5 });
  const b = new B.Sound('second', '/shot.ogg', r.scene);
  assert.equal(r.howls.length, 1, 'same clip shares one loader/decoded cache');
  assert.deepEqual(Array.from(r.howls[0].options.src), ['/shot.ogg', '/shot.mp3']);
  assert.deepEqual(Array.from(r.howls[0].options.format), ['opus', 'mp3']);
  assert.equal(a.play(), false, 'unready playback is dropped');
  r.howls[0].options.onload();
  const c = new B.Sound('shared-buffer-slot', a.getAudioBuffer(), r.scene);
  assert.equal(r.howls.length, 1, 'extra model pool slot shares the decoded clip');
  a.setPosition({ x: 3, y: 1, z: 15 });
  a.setVolume(0.4);
  assert.equal(a.play(), true);
  assert.equal(b.play(), true);
  r.flush();
  assert.equal(B.summary().started, 2, 'actual Howler play events counted');
  assert.equal(a.play(), false, 'busy wrapper never acquires a second playback ID');
  assert.ok(
    r.writes.some(x => x[0] === 'pos' && x[3] === -15),
    'Z conversion preserves Babylon left/right spatial orientation'
  );
  const idA = a._id,
    idB = b._id;
  assert.notEqual(idA, idB);
  a.setVolume(0.7);
  assert.deepEqual(r.writes.at(-1), ['volume', 0.7, idA], 'updates affect only the intended playback ID');
  r.howls[0].emit('end', idA);
  assert.equal(a.isPlaying, false);
  assert.equal(b.isPlaying, true, 'another clip instance survives the first ending');
  r.ctx.state = 'suspended';
  assert.equal(a.play(), false, 'suspended output never queues stale reports');
  r.ctx.state = 'running';
  const mesh = { position: { x: 8, y: 1, z: 9 } };
  a.attachToMesh(mesh);
  a.play();
  r.flush();
  mesh.position.x = 10;
  r.render();
  assert.ok(
    r.writes.some(x => x[0] === 'pos' && x[1] === 10 && x[4] === a._id),
    'voice follows moving mesh'
  );
  r.howls[0].emit('playerror', a._id, 'device error');
  assert.equal(a.isPlaying, false, 'play error releases its reservation');
  assert.equal(B.summary().playErrors, 1);
  a.dispose();
  b.dispose();
  c.dispose();
  assert.equal(r.howls[0].unloaded, true, 'last reference disposes shared resources');
  assert.equal(B.summary().active, 0);
  const bad = new B.Sound('missing', '/missing.mp3', r.scene);
  r.howls[1].options.onloaderror(null, '404');
  assert.equal(bad.isReady(), false);
  assert.equal(B.summary().loadErrors, 1, 'missing files are visible in diagnostics');
  r.dispose();
  const stress = fs.readFileSync(path.join(rootPath, 'battle/full-audio-stress.js'), 'utf8');
  const declared = Array.from(vm.runInNewContext(/var UNRECORDED = (\[[\s\S]*?\]);/.exec(stress)[1]));
  const expected = fs
    .readFileSync(path.join(rootPath, 'Assets/audio/.manifest-placeholders.txt'), 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'));
  assert.deepEqual(declared, expected, 'stress harness tracks the exact declared unrecorded inventory');
  console.log(
    'audio-backend-check: shared clips, independent IDs, readiness, suspension, completion, motion, errors and cleanup PASS'
  );
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
