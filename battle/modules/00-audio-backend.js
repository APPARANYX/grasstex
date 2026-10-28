/* Experimental independent playback: ?audioBackend=howler. Default stays Babylon.
   Owners retain event timing, propagation, clip selection and bounded voice pools.
   A wrapper owns one playback ID; Howls and decoded data are shared by clip URL.
   Howler mode is deliberately dry: equal-power spatial panning, distance and gain,
   without Babylon SoundTracks, acoustic filters, reverb or compressor graph edits. */
(function (root) {
  'use strict';
  if (root.BattleAudioBackend) return;
  var enabled = /(?:^|[?&])audioBackend=howler(?:&|$)/.test((root.location && root.location.search) || '');
  var scenes = new WeakMap(),
    clips = new Map(),
    active = new Set();
  var stats = {
    requested: 0,
    started: 0,
    ended: 0,
    droppedUnavailable: 0,
    droppedBusy: 0,
    loadErrors: 0,
    playErrors: 0,
    peakActive: 0
  };
  var errors = [];
  function fail(kind, file, error) {
    stats[kind]++;
    errors.push({ kind: kind, file: file, error: String(error) });
    if (errors.length > 20) errors.shift();
    console.error('[HOWLER] ' + kind + ' ' + file + ': ' + error);
  }
  function init() {
    root.Howler.autoSuspend = false;
    root.Howler.volume(); // Public API initializes the one Web Audio context.
    if (!root.Howler.usingWebAudio || !root.Howler.ctx)
      throw new Error('Howler experiment requires Web Audio');
  }
  var ready = !enabled
    ? Promise.resolve()
    : new Promise(function (resolve, reject) {
        function loaded() {
          try {
            init();
            resolve();
          } catch (e) {
            reject(e);
          }
        }
        if (root.Howl && root.Howler) return loaded();
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js';
        script.onload = loaded;
        script.onerror = function () {
          reject(new Error('Could not load Howler 2.2.4'));
        };
        document.head.appendChild(script);
      });
  // The page bootstrap awaits and surfaces this rejection; avoid an early unhandled event.
  ready.catch(function () {});
  function engine() {
    if (!enabled) return root.BABYLON && root.BABYLON.Engine && root.BABYLON.Engine.audioEngine;
    return {
      audioContext: root.Howler && root.Howler.ctx,
      masterGain: root.Howler && root.Howler.masterGain,
      unlocked: !!(root.Howler && root.Howler.ctx && root.Howler.ctx.state === 'running'),
      unlock: function () {
        var ctx = root.Howler && root.Howler.ctx;
        return ctx && ctx.state !== 'running' ? ctx.resume() : Promise.resolve();
      }
    };
  }
  function point(p) {
    return { x: +p.x || 0, y: +p.y || 0, z: +p.z || 0 };
  }
  // Babylon uses a left-handed world; Web Audio uses right-handed coordinates.
  function updateListener(scene) {
    var cam = scene && scene.activeCamera;
    if (!cam || !root.Howler) return;
    var p = cam.globalPosition || cam.position;
    if (p) root.Howler.pos(p.x, p.y, -p.z);
    var forward = cam.getForwardRay && cam.getForwardRay().direction;
    var up = cam.upVector || { x: 0, y: 1, z: 0 };
    if (forward) root.Howler.orientation(forward.x, forward.y, -forward.z, up.x, up.y, -up.z);
  }
  function bindScene(scene) {
    if (!enabled || !scene || scenes.has(scene)) return;
    var sounds = new Set();
    scenes.set(scene, sounds);
    var tick = function () {
      updateListener(scene);
      sounds.forEach(function (sound) {
        if (!sound._playing || !sound._mesh) return;
        var mesh = sound._mesh;
        if (mesh.isDisposed && mesh.isDisposed()) return sound.stop();
        var p = mesh.getAbsolutePosition ? mesh.getAbsolutePosition() : mesh.position;
        if (p) sound.setPosition(p);
      });
    };
    var token = scene.onBeforeRenderObservable && scene.onBeforeRenderObservable.add(tick);
    if (scene.onDisposeObservable)
      scene.onDisposeObservable.addOnce(function () {
        Array.from(sounds).forEach(function (sound) {
          sound.dispose();
        });
        if (token && scene.onBeforeRenderObservable.remove) scene.onBeforeRenderObservable.remove(token);
        scenes.delete(scene);
      });
    tick();
  }
  function clip(url, options) {
    var entry = clips.get(url);
    if (entry) return entry;
    entry = {
      url: url,
      refs: 0,
      ready: false,
      failed: false,
      callbacks: [],
      owners: new Map(),
      howl: null,
      token: null
    };
    clips.set(url, entry);
    var ext = String(url).split('.').pop().toLowerCase(),
      fallback = /\.(caf|ogg)$/.test(url) ? url.replace(/\.(caf|ogg)$/, '.mp3') : null;
    entry.howl = new root.Howl({
      src: fallback ? [url, fallback] : [url],
      format: fallback ? [ext === 'ogg' ? 'opus' : ext, 'mp3'] : [ext],
      html5: false,
      preload: true,
      autoplay: false,
      volume: 0,
      pool: 8,
      pos: [0, 0, 0],
      pannerAttr: { panningModel: 'equalpower', distanceModel: 'linear', rolloffFactor: 0 },
      // Register before play(): Howler captures listeners when it emits, then
      // delivers callbacks asynchronously. Late per-play listeners miss starts.
      onplay: function (id) {
        if (entry.owners.has(id)) stats.started++;
      },
      onend: function (id) {
        var sound = entry.owners.get(id);
        if (sound) {
          stats.ended++;
          sound._finish();
        }
      },
      onplayerror: function (id, error) {
        var sound = entry.owners.get(id);
        fail('playErrors', url, error);
        if (sound) sound.stop();
      },
      onload: function () {
        entry.ready = true;
        entry.token = { howlerClip: entry, duration: entry.howl.duration() };
        entry.callbacks.splice(0).forEach(function (callback) {
          callback();
        });
      },
      onloaderror: function (id, error) {
        entry.failed = true;
        entry.callbacks.length = 0;
        fail('loadErrors', url, error);
      }
    });
    return entry;
  }
  function Sound(name, source, scene, onReady, options) {
    options = options || {};
    if (!root.Howler || !root.Howler.ctx)
      throw new Error('Await BattleAudioBackend.ready before playback setup');
    this.name = name;
    this._scene = scene;
    this._options = options;
    this._gain = options.volume == null ? 1 : options.volume;
    this._rate = 1;
    this._position = { x: 0, y: 0, z: 0 };
    this._playing = false;
    this._disposed = false;
    this._id = null;
    this._mesh = null;
    this._ended = [];
    var self = this;
    this.onEndedObservable = {
      addOnce: function (fn) {
        self._ended.push(fn);
      }
    };
    this._entry = source && source.howlerClip ? source.howlerClip : clip(source, options);
    this._entry.refs++;
    bindScene(scene);
    if (scene) scenes.get(scene).add(this);
    if (onReady) {
      var callback = function () {
        if (!self._disposed) onReady();
      };
      if (this._entry.ready) Promise.resolve().then(callback);
      else if (!this._entry.failed) this._entry.callbacks.push(callback);
    }
  }
  Object.defineProperty(Sound.prototype, 'isPlaying', {
    get: function () {
      return this._playing;
    }
  });
  Sound.prototype.isReady = function () {
    return !this._disposed && this._entry.ready && !this._entry.failed;
  };
  Sound.prototype.getAudioBuffer = function () {
    return this._entry.token;
  };
  Sound.prototype.setPosition = function (p) {
    this._position = point(p);
    if (this._playing && this._id != null) this._entry.howl.pos(p.x, p.y, -p.z, this._id);
  };
  Sound.prototype.setVolume = function (gain) {
    this._gain = Math.max(0, Math.min(1, +gain || 0));
    if (this._playing && this._id != null) this._entry.howl.volume(this._gain, this._id);
  };
  Sound.prototype.setPlaybackRate = function (rate) {
    this._rate = +rate || 1;
    if (this._playing && this._id != null) this._entry.howl.rate(this._rate, this._id);
  };
  Sound.prototype.attachToMesh = function (mesh) {
    this._mesh = mesh;
    this.setPosition(mesh.getAbsolutePosition ? mesh.getAbsolutePosition() : mesh.position);
  };
  Sound.prototype.detachFromMesh = function () {
    this._mesh = null;
  };
  Sound.prototype._finish = function () {
    if (!this._playing) return;
    this._playing = false;
    active.delete(this);
    var howl = this._entry.howl,
      id = this._id;
    this._entry.owners.delete(id);
    if (id != null) howl.volume(0, id); // Recycled IDs start muted until their new owner's gain is set.
    this._id = null;
    this._ended.splice(0).forEach(function (fn) {
      fn();
    });
  };
  Sound.prototype.play = function () {
    stats.requested++;
    if (this._playing) {
      stats.droppedBusy++;
      return false;
    }
    if (
      !this.isReady() ||
      root.Howler.ctx.state !== 'running' ||
      (this._scene && this._scene.audioEnabled === false)
    ) {
      stats.droppedUnavailable++;
      return false;
    }
    var howl = this._entry.howl,
      o = this._options;
    this._playing = true; // Reserve before async Howler play/end callbacks can run.
    active.add(this);
    stats.peakActive = Math.max(stats.peakActive, active.size);
    try {
      this._id = howl.play();
      if (this._id == null) throw new Error('Howler did not allocate a playback ID');
      var id = this._id,
        p = this._position;
      this._entry.owners.set(id, this);
      howl.pannerAttr(
        {
          panningModel: 'equalpower',
          distanceModel: o.distanceModel || 'linear',
          maxDistance: o.maxDistance || 100,
          refDistance: o.refDistance || 1,
          rolloffFactor: o.rolloffFactor == null ? 1 : o.rolloffFactor
        },
        id
      );
      howl.pos(p.x, p.y, -p.z, id);
      howl.rate(this._rate, id);
      howl.volume(this._gain, id);
      return true;
    } catch (error) {
      fail('playErrors', this._entry.url, error);
      this.stop();
      return false;
    }
  };
  Sound.prototype.stop = function () {
    if (this._id != null) this._entry.howl.stop(this._id);
    this._finish();
  };
  Sound.prototype.dispose = function () {
    if (this._disposed) return;
    this._disposed = true;
    this.stop();
    this.detachFromMesh();
    if (this._scene && scenes.has(this._scene)) scenes.get(this._scene).delete(this);
    if (--this._entry.refs === 0) {
      this._entry.howl.unload();
      clips.delete(this._entry.url);
    }
  };
  root.BattleAudioBackend = {
    name: enabled ? 'howler' : 'babylon',
    independent: enabled,
    ready: ready,
    Sound: enabled ? Sound : root.BABYLON && root.BABYLON.Sound,
    engine: engine,
    bindScene: bindScene,
    summary: function () {
      return Object.assign(
        {
          name: enabled ? 'howler' : 'babylon',
          version: enabled ? '2.2.4' : null,
          dry: enabled,
          active: active.size,
          clips: clips.size,
          errors: errors.slice()
        },
        stats
      );
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
