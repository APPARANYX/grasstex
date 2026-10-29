/* Experimental independent playback: ?audioBackend=howler. Default stays Babylon.
   Owners retain event timing, propagation, clip selection and bounded voice pools.
   A wrapper owns one playback ID; Howls and decoded data are shared by clip URL.
   Howler owns playback and optional bounded acoustic chains. No Babylon SoundTrack
   is touched; acoustics=off retains the validated dry path. */
(function (root) {
  'use strict';
  if (root.BattleAudioBackend) return;
  var enabled = /(?:^|[?&])audioBackend=howler(?:&|$)/.test((root.location && root.location.search) || '');
  var flatSpatial =
    enabled && /(?:^|[?&])audioSpatial=flat(?:&|$)/.test((root.location && root.location.search) || '');
  // Howler's pos()/orientation() write PannerNode and listener AudioParams with
  // setTargetAtTime/setValueAtTime every call. Per-frame calls keep Chrome's
  // panners on per-sample processing (~13x cost per 3D voice), slowing the audio
  // clock under load. Direct writes skip unchanged values and never use the
  // timeline. ?audioSpatialWrite=automation restores Howler's per-frame path.
  var spatialAutomation =
    enabled &&
    /(?:^|[?&])audioSpatialWrite=automation(?:&|$)/.test((root.location && root.location.search) || '');
  var listenerState = null;
  var scenes = new WeakMap(),
    clips = new Map(),
    active = new Set(),
    acousticChains = [],
    nodeChains = new WeakMap();
  var stats = {
    requested: 0,
    started: 0,
    inRangeStarts: 0,
    ended: 0,
    droppedUnavailable: 0,
    droppedBusy: 0,
    loadErrors: 0,
    playErrors: 0,
    peakActive: 0,
    acousticAttached: 0,
    acousticBypassed: 0,
    acousticErrors: 0
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
  // Set only values that moved past eps; returns the stored row.
  function writeParams(params, values, last, eps) {
    var moved = !last;
    for (var i = 0; !moved && i < values.length; i++) moved = Math.abs(values[i] - last[i]) > eps;
    if (!moved) return last;
    params.forEach(function (param, i) {
      param.value = values[i];
    });
    return values;
  }
  // Babylon uses a left-handed world; Web Audio uses right-handed coordinates.
  function updateListener(scene) {
    var cam = scene && scene.activeCamera;
    if (!cam || !root.Howler) return;
    var p = cam.globalPosition || cam.position;
    var forward = cam.getForwardRay && cam.getForwardRay().direction;
    var up = cam.upVector || { x: 0, y: 1, z: 0 };
    var listener = root.Howler.ctx && root.Howler.ctx.listener;
    if (spatialAutomation || !listener || !listener.positionX) {
      if (p) root.Howler.pos(p.x, p.y, -p.z);
      if (forward) root.Howler.orientation(forward.x, forward.y, -forward.z, up.x, up.y, -up.z);
      return;
    }
    if (!listenerState || listenerState.listener !== listener) listenerState = { listener: listener };
    if (p)
      listenerState.pos = writeParams(
        [listener.positionX, listener.positionY, listener.positionZ],
        [p.x, p.y, -p.z],
        listenerState.pos,
        0.01
      );
    if (forward)
      listenerState.dir = writeParams(
        [listener.forwardX, listener.forwardY, listener.forwardZ, listener.upX, listener.upY, listener.upZ],
        [forward.x, forward.y, -forward.z, up.x, up.y, -up.z],
        listenerState.dir,
        0.001
      );
  }
  function bindScene(scene) {
    if (!enabled || !scene || scenes.has(scene)) return;
    var sounds = new Set();
    scenes.set(scene, sounds);
    var tick = function () {
      if (!flatSpatial) updateListener(scene);
      else
        active.forEach(function (sound) {
          if (sound._scene === scene) sound._applyFlatGain();
        });
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
      pos: flatSpatial ? undefined : [0, 0, 0],
      // Howler 2.2.4 reads these defaults at the top level (not pannerAttr).
      // Sound creation/reset must never initialize an unintended HRTF panner.
      panningModel: 'equalpower',
      distanceModel: 'linear',
      rolloffFactor: 0,
      // Register before play(): Howler captures listeners when it emits, then
      // delivers callbacks asynchronously. Late per-play listeners miss starts.
      onplay: function (id) {
        var sound = entry.owners.get(id);
        if (sound) {
          sound._attachAcoustics();
          stats.started++;
          // A start past its own audible range is expected silence, not lost output.
          if (sound._gain > 0 && sound._distanceGain() > 0) stats.inRangeStarts++;
        }
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
  // Diagnostic-only mono route: preserve Web Audio distance attenuation while
  // excluding PannerNodes. Default 3D routing and gain remain unchanged.
  // Distance gain the listener would get from this sound's distance model.
  Sound.prototype._distanceGain = function () {
    var o = this._options,
      cam = this._scene && this._scene.activeCamera;
    var listener = cam && (cam.globalPosition || cam.position),
      gain = 1;
    if (listener && o.spatialSound !== false) {
      var p = this._position,
        dx = p.x - listener.x,
        dy = p.y - listener.y,
        dz = p.z - listener.z;
      var ref = o.refDistance || 1,
        max = Math.max(ref, o.maxDistance || 100);
      var distance = Math.max(ref, Math.min(max, Math.sqrt(dx * dx + dy * dy + dz * dz)));
      var rolloff = o.rolloffFactor == null ? 1 : o.rolloffFactor;
      var model = o.distanceModel || 'linear';
      gain =
        model === 'inverse'
          ? ref / (ref + rolloff * (distance - ref))
          : model === 'exponential'
            ? Math.pow(distance / ref, -rolloff)
            : max === ref
              ? 1
              : 1 - (rolloff * (distance - ref)) / (max - ref);
    }
    return Math.max(0, Math.min(1, gain));
  };
  Sound.prototype._applyFlatGain = function () {
    if (!this._playing || this._id == null) return;
    this._entry.howl.volume(this._gain * this._distanceGain(), this._id);
  };
  Sound.prototype.setPosition = function (p) {
    this._position = point(p);
    if (flatSpatial) this._applyFlatGain();
    else if (this._playing && this._id != null) this._writePosition();
  };
  // The per-ID PannerNode exists after play()'s pannerAttr(); fall back to
  // Howler's pos() only when it is absent or automation was requested.
  Sound.prototype._writePosition = function () {
    var p = this._position,
      howl = this._entry.howl,
      instance = !spatialAutomation && howl._soundById && howl._soundById(this._id),
      panner = instance && instance._panner;
    if (!panner || !panner.positionX) return howl.pos(p.x, p.y, -p.z, this._id);
    if (this._pannerWritten && this._pannerWritten.node !== panner) this._pannerWritten = null;
    var row = writeParams(
      [panner.positionX, panner.positionY, panner.positionZ],
      [p.x, p.y, -p.z],
      this._pannerWritten && this._pannerWritten.values,
      0.01
    );
    this._pannerWritten = { node: panner, values: row };
    instance._pos = row.slice();
  };
  Sound.prototype.setVolume = function (gain) {
    this._gain = Math.max(0, Math.min(1, +gain || 0));
    if (flatSpatial) this._applyFlatGain();
    else if (this._playing && this._id != null) this._entry.howl.volume(this._gain, this._id);
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
  // One guarded bridge to pinned Howler 2.2.4's per-playback GainNode. The
  // shared Howl is never rerouted as a group, so other shots keep their own graph.
  Sound.prototype._attachAcoustics = function () {
    var chain = this._acoustics;
    if (!chain || this._id == null) return;
    var howl = this._entry.howl,
      node = null,
      master = root.Howler.masterGain;
    try {
      var instance = howl._soundById && howl._soundById(this._id);
      node = instance && instance._node;
      if (!node || !node.context || node.context !== chain.filter.context || !node.disconnect) return;
      if (chain.node === node || chain.failedNode === node) return;
      // Howler can recycle an ended node before its async end callback arrives.
      // Release the old reservation now so that callback cannot reroute this shot.
      var previous = nodeChains.get(node);
      if (previous && previous !== chain && previous.owner) previous.owner._releaseAcoustics();
      node.disconnect(master);
      node.connect(chain.filter);
      chain.node = node;
      nodeChains.set(node, chain);
      stats.acousticAttached++;
    } catch (_) {
      stats.acousticErrors++;
      chain.failedNode = node;
      try {
        if (node) node.disconnect(chain.filter);
      } catch (_) {}
      try {
        if (node) node.connect(master);
      } catch (_) {}
    }
  };
  Sound.prototype.setAcousticProfile = function (hz, wet, wetInput, limit) {
    var ctx = root.Howler.ctx,
      chain = this._acoustics;
    if (!chain) {
      chain = acousticChains.find(function (item) {
        return !item.owner;
      });
      if (!chain && acousticChains.length < Math.max(1, Math.min(192, limit || 96))) {
        var filter = null,
          send = null;
        try {
          filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 20000;
          send = ctx.createGain();
          send.gain.value = 0;
          filter.connect(root.Howler.masterGain);
          filter.connect(send);
          if (wetInput) send.connect(wetInput);
          chain = { filter: filter, send: send, owner: null, node: null };
          acousticChains.push(chain);
        } catch (_) {
          try {
            if (filter) filter.disconnect();
            if (send) send.disconnect();
          } catch (_) {}
          stats.acousticErrors++;
        }
      }
      if (!chain) {
        stats.acousticBypassed++;
        return false;
      }
      chain.owner = this;
      this._acoustics = chain;
    }
    chain.filter.frequency.setTargetAtTime(hz, ctx.currentTime, 0.045);
    chain.send.gain.setTargetAtTime(wetInput ? wet : 0, ctx.currentTime, 0.06);
    this._attachAcoustics();
    return true;
  };
  Sound.prototype.neutralizeAcoustics = function () {
    var chain = this._acoustics;
    if (!chain) return;
    var t = root.Howler.ctx.currentTime;
    chain.filter.frequency.setTargetAtTime(20000, t, 0.025);
    chain.send.gain.setTargetAtTime(0, t, 0.008);
    // Keep an active source connected until its natural end; no mid-shot graph swaps.
  };
  Sound.prototype._releaseAcoustics = function () {
    var chain = this._acoustics;
    if (!chain) return;
    if (chain.node) {
      nodeChains.delete(chain.node);
      try {
        chain.node.disconnect(chain.filter);
        chain.node.connect(root.Howler.masterGain);
      } catch (_) {
        stats.acousticErrors++;
      }
    }
    var t = root.Howler.ctx.currentTime;
    [chain.filter.frequency, chain.send.gain].forEach(function (param, index) {
      param.cancelScheduledValues(t);
      param.setValueAtTime(index ? 0 : 20000, t);
    });
    chain.node = null;
    chain.failedNode = null;
    chain.owner = null;
    this._acoustics = null;
  };
  Sound.prototype._finish = function () {
    if (!this._playing) return;
    this._playing = false;
    this._releaseAcoustics();
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
      this._releaseAcoustics();
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
      if (!flatSpatial)
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
      if (!flatSpatial) {
        this._pannerWritten = null;
        this._writePosition();
      }
      howl.rate(this._rate, id);
      this._attachAcoustics();
      if (flatSpatial) this._applyFlatGain();
      else howl.volume(this._gain, id);
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
    this._releaseAcoustics();
    this.detachFromMesh();
    if (this._scene && scenes.has(this._scene)) scenes.get(this._scene).delete(this);
    if (--this._entry.refs === 0) {
      this._entry.howl.unload();
      clips.delete(this._entry.url);
    }
    if (!clips.size) {
      acousticChains.forEach(function (chain) {
        chain.filter.disconnect();
        chain.send.disconnect();
      });
      acousticChains = [];
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
          spatialMode: flatSpatial ? 'flat' : '3d',
          spatialWrite: flatSpatial ? 'none' : spatialAutomation ? 'automation' : 'direct',
          dry: enabled && !(root.BattleListenerAcoustics && root.BattleListenerAcoustics.quality !== 'off'),
          acousticChains: acousticChains.length,
          acousticActive: acousticChains.filter(function (chain) {
            return !!chain.owner;
          }).length,
          active: active.size,
          playbackAudit: (function () {
            var playing = 0,
              unexpectedStopped = 0,
              byCategory = {};
            active.forEach(function (sound) {
              var live = sound._id != null && sound._entry.howl.playing(sound._id);
              if (live) playing++;
              else unexpectedStopped++;
              var category = String(sound.name || 'unknown').split(/[-:]/)[0];
              var row = byCategory[category] || (byCategory[category] = { active: 0, playing: 0 });
              row.active++;
              if (live) row.playing++;
            });
            return { playing: playing, unexpectedStopped: unexpectedStopped, byCategory: byCategory };
          })(),
          clips: clips.size,
          errors: errors.slice()
        },
        stats
      );
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
