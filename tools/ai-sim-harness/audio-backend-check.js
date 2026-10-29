#!/usr/bin/env node
'use strict';
// Exercise playback IDs and lifecycle without replacing any game or combat owner.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const rootPath = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(rootPath, 'battle/modules/00-audio-backend.js'), 'utf8');
function fixture(enabled, spatial, extraSearch) {
  const howls = [],
    events = [],
    writes = [];
  let nextId = 0;
  class Howl {
    constructor(options) {
      this.options = options;
      this.ids = new Set();
      this.nodes = new Map();
      this.listeners = [];
      howls.push(this);
    }
    playing(id) {
      return this.ids.has(id);
    }
    duration() {
      return 4.5;
    }
    play() {
      const id = ++nextId;
      this.ids.add(id);
      const node = this.recycleNode || audioNode();
      if (!this.recycleNode) node.connect(root.Howler.masterGain);
      this.recycleNode = null;
      if (this.rejectFilter) {
        const connect = node.connect.bind(node);
        node.connect = target => {
          if (target.type === 'lowpass') throw Error('unsupported bridge');
          connect(target);
        };
      }
      this.nodes.set(id, node);
      const notify = this.options.onplay; // Snapshot listeners at emit time, as Howler does.
      if (notify) events.push(() => notify(id));
      return id;
    }
    _soundById(id) {
      return { _node: this.nodes.get(id) };
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
    currentTime: 0,
    sampleRate: 12000,
    createBiquadFilter() {
      return audioNode();
    },
    createGain() {
      return audioNode();
    },
    createConvolver() {
      return audioNode();
    },
    createBuffer(channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    },
    resume: async function () {
      this.state = 'running';
    }
  };
  function audioNode() {
    const param = () => ({
      value: 0,
      setTargetAtTime(v) {
        this.value = v;
      },
      cancelScheduledValues() {},
      setValueAtTime(v) {
        this.value = v;
      }
    });
    return {
      context: ctx,
      connections: new Set(),
      frequency: param(),
      gain: param(),
      connect(node) {
        this.connections.add(node);
      },
      disconnect(node) {
        if (node) {
          if (!this.connections.delete(node)) throw Error('not connected');
        } else this.connections.clear();
      }
    };
  }
  const root = {
    console: { error() {} },
    location: {
      search: enabled
        ? '?audioBackend=howler' + (spatial ? '&audioSpatial=' + spatial : '') + (extraSearch || '')
        : ''
    },
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
  assert.equal(
    r.howls[0].options.panningModel,
    'equalpower',
    'Howler constructor uses top-level spatial defaults'
  );
  assert.equal(r.howls[0].options.distanceModel, 'linear');
  assert.equal(r.howls[0].options.rolloffFactor, 0);
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
  assert.equal(B.summary().inRangeStarts, 2, 'starts inside their distance range counted');
  const far = new B.Sound('far', '/shot.ogg', r.scene, null, { maxDistance: 145 });
  far.setPosition({ x: 0, y: 1, z: 171 });
  assert.equal(far.play(), true);
  r.flush();
  assert.equal(B.summary().started, 3);
  assert.equal(B.summary().inRangeStarts, 2, 'a start past linear maxDistance is expected silence');
  far.stop();
  far.dispose();
  r.flush();
  assert.equal(B.summary().playbackAudit.playing, 2);
  r.howls[0].ids.delete(a._id);
  assert.equal(
    B.summary().playbackAudit.unexpectedStopped,
    1,
    'detect stale owner versus Howler playing state'
  );
  r.howls[0].ids.add(a._id);
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
  // Real shared acoustics owner -> independent Howler graph, never Babylon's engine.
  const w = fixture(true);
  await w.backend.ready;
  let blocked = false;
  w.root.setTimeout = () => {};
  w.root.performance = { now: () => 1000 };
  w.root.location.search = '?audioBackend=howler&acoustics=standard';
  w.root.BattleObstacleField = { sightBlocked: () => blocked };
  Object.defineProperty(w.root.BABYLON.Engine, 'audioEngine', {
    get() {
      assert.fail('Howler acoustics touched Babylon engine');
    }
  });
  vm.runInNewContext(
    fs.readFileSync(path.join(rootPath, 'battle/modules/12a-listener-acoustics.js'), 'utf8'),
    w.root
  );
  const acoustics = w.root.BattleListenerAcoustics;
  acoustics.bind({ scene: w.scene, obstacles: [], heightAt: () => -3 });
  const gun = new w.backend.Sound('gun', '/shot.ogg', w.scene);
  w.howls[0].options.onload();
  assert.equal(acoustics.quality, 'standard');
  acoustics.prepare(gun, { x: 40, y: 1, z: 0 }, 'gun', 0.2, w.scene);
  const chain = gun._acoustics;
  assert.ok(chain, 'environmental sample allocates a Howler filter chain');
  gun.play();
  w.flush();
  const node = w.howls[0]._soundById(gun._id)._node;
  assert.ok(node.connections.has(chain.filter), 'this playback is routed through its low-pass filter');
  assert.ok(!node.connections.has(w.root.Howler.masterGain), 'no duplicate dry route');
  assert.ok(chain.send.connections.size > 0, 'wet send feeds the shared reverb');
  const openHz = chain.filter.frequency.value;
  blocked = true;
  acoustics.prepare(gun, { x: 40, y: 1, z: 0 }, 'gun', 0.2, w.scene);
  assert.ok(chain.filter.frequency.value < openHz, 'cover muffles the same live source');
  assert.ok(gun._gain < 0.2, 'cover attenuation applies before reverb');
  gun.neutralizeAcoustics();
  assert.ok(
    node.connections.has(chain.filter),
    'priority/expiry neutralization never disconnects an active shot'
  );
  assert.equal(chain.send.gain.value, 0);
  gun.stop();
  assert.ok(node.connections.has(w.root.Howler.masterGain), 'completed ID safely restores its native route');
  assert.equal(gun._acoustics, null);
  const next = new w.backend.Sound('next', '/shot.ogg', w.scene);
  acoustics.prepare(gun, { x: 40, y: 1, z: 0 }, 'gun', 0.2, w.scene);
  gun.play();
  w.flush();
  const oldId = gun._id,
    recycled = w.howls[0]._soundById(oldId)._node;
  w.howls[0].recycleNode = recycled;
  acoustics.prepare(next, { x: 10, y: 1, z: 0 }, 'gun', 0.2, w.scene);
  next.play();
  w.flush();
  const nextFilter = next._acoustics.filter;
  assert.ok(recycled.connections.has(nextFilter));
  w.howls[0].emit('end', oldId);
  assert.ok(
    recycled.connections.has(nextFilter),
    'delayed old completion never disconnects a recycled node from its new filter'
  );
  assert.ok(
    !recycled.connections.has(w.root.Howler.masterGain),
    'node reuse never adds a duplicate dry connection'
  );
  next.stop();
  const bounded = fixture(true);
  await bounded.backend.ready;
  const slots = Array.from(
    { length: 3 },
    (_, i) => new bounded.backend.Sound('slot' + i, '/one.mp3', bounded.scene)
  );
  bounded.howls[0].options.onload();
  assert.equal(slots[0].setAcousticProfile(5000, 0, null, 2), true);
  assert.equal(slots[1].setAcousticProfile(5000, 0, null, 2), true);
  assert.equal(
    slots[2].setAcousticProfile(5000, 0, null, 2),
    false,
    'filter chains cannot exceed the declared budget'
  );
  assert.equal(slots[2].play(), true, 'capacity bypass still plays dry');
  slots[0].play();
  slots[0].stop();
  assert.equal(
    slots[2].setAcousticProfile(5000, 0, null, 2),
    true,
    'a finished source releases a chain for reuse'
  );
  assert.equal(bounded.backend.summary().acousticChains, 2, 'graph allocation remains bounded across reuse');
  const fallback = fixture(true);
  await fallback.backend.ready;
  const safe = new fallback.backend.Sound('safe', '/safe.mp3', fallback.scene);
  fallback.howls[0].options.onload();
  fallback.howls[0].rejectFilter = true;
  safe.setAcousticProfile(4000, 0, null, 2);
  assert.equal(safe.play(), true, 'unsupported filter routing must not stop playback');
  fallback.flush();
  assert.ok(
    fallback.howls[0]._soundById(safe._id)._node.connections.has(fallback.root.Howler.masterGain),
    'a failed filter connection always restores the dry route'
  );
  assert.equal(fallback.backend.summary().acousticErrors, 1);
  fallback.dispose();
  bounded.dispose();
  w.dispose();
  console.log(
    'PASS Howler environmental filtering, cover gain, reverb routing, cap bypass, reuse and safe completion'
  );
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

{
  const r = fixture(true, 'flat'),
    B = r.backend;
  const sound = new B.Sound('flat-check', 'flat.mp3', r.scene, null, {
    spatialSound: true,
    maxDistance: 100,
    refDistance: 1,
    rolloffFactor: 1
  });
  r.howls[0].options.onload();
  sound.setPosition({ x: 40, y: 1, z: 0 });
  sound.setVolume(0.4);
  sound.play();
  r.flush();
  assert.equal(B.summary().spatialMode, 'flat');
  assert.equal(r.howls[0].options.pos, undefined, 'flat Howl must not initialize a PannerNode');
  assert.ok(!r.writes.some(x => x[0] === 'panner' || x[0] === 'pos'), 'flat path never invokes spatial APIs');
  assert.ok(
    r.writes.some(x => x[0] === 'volume' && Math.abs(x[1] - 0.4 * (1 - 39 / 99)) < 1e-8),
    'linear distance attenuation retained'
  );
  sound.stop();
  assert.equal(B.summary().active, 0);
  console.log('PASS opt-in flat spatial path: no panner API, matched distance gain, independent lifecycle');
}

// Per-frame AudioParam automation keeps Chrome PannerNodes on per-sample
// processing; direct spatial writes must not schedule any timeline events.
for (const mode of ['direct', 'automation']) {
  const r = fixture(true, null, mode === 'automation' ? '&audioSpatialWrite=automation' : ''),
    calls = { automation: 0, writes: 0, howlerPos: 0, howlerOrientation: 0 };
  const param = () => {
    let v = 0;
    return {
      get value() {
        return v;
      },
      set value(x) {
        calls.writes++;
        v = x;
      },
      setValueAtTime() {
        calls.automation++;
      },
      setTargetAtTime() {
        calls.automation++;
      }
    };
  };
  const axes = [
    'positionX',
    'positionY',
    'positionZ',
    'forwardX',
    'forwardY',
    'forwardZ',
    'upX',
    'upY',
    'upZ'
  ];
  r.ctx.listener = Object.fromEntries(axes.map(k => [k, param()]));
  r.root.Howler.pos = () => calls.howlerPos++;
  r.root.Howler.orientation = () => calls.howlerOrientation++;
  const Bm = r.backend;
  const panner = { positionX: param(), positionY: param(), positionZ: param() };
  const cam = r.scene.activeCamera;
  cam.getForwardRay = () => ({ direction: { x: 0, y: 0, z: 1 } });
  const sound = new Bm.Sound('spatial-write', '/w.mp3', r.scene);
  const howl = r.howls.at(-1);
  howl._soundById = () => ({ _node: { connect() {}, disconnect() {} }, _panner: panner });
  howl.options.onload();
  const mesh = { position: { x: 4, y: 1, z: 6 } };
  sound.attachToMesh(mesh);
  sound.play();
  for (let frame = 0; frame < 30; frame++) {
    if (frame < 20) {
      cam.position.x = frame;
      mesh.position.x = 4 + frame;
    }
    r.render();
  }
  if (mode === 'direct') {
    assert.equal(calls.howlerPos + calls.howlerOrientation, 0, 'listener bypasses Howler automation');
    assert.equal(calls.automation, 0, 'no AudioParam timeline events from spatial updates');
    assert.equal(r.writes.filter(x => x[0] === 'pos').length, 0, 'live voices bypass Howl.pos automation');
    assert.equal(r.ctx.listener.positionX.value, 19);
    assert.equal(panner.positionX.value, 23, 'voice still follows its mesh');
    assert.equal(panner.positionZ.value, -6, 'Z conversion preserved');
    const before = calls.writes;
    r.render();
    assert.equal(calls.writes, before, 'unchanged listener and voice positions are not rewritten');
    assert.equal(Bm.summary().spatialWrite, 'direct');
  } else {
    assert.ok(calls.howlerPos >= 30 && calls.howlerOrientation >= 30, 'flag restores Howler listener path');
    assert.ok(r.writes.filter(x => x[0] === 'pos').length >= 20, 'flag restores Howl.pos per update');
    assert.equal(Bm.summary().spatialWrite, 'automation');
  }
  sound.stop();
}
console.log(
  'PASS spatial updates write AudioParams directly; audioSpatialWrite=automation restores Howler path'
);
