/* Experimental independent playback: ?audioBackend=howler. Default stays Babylon.
   Owners retain event timing, propagation, clip selection and bounded voice pools.
   A wrapper owns one playback ID; Howls and decoded data are shared by clip URL.
   Howler owns playback and ten shared clear/muffled category filters. No Babylon SoundTrack
   is touched; acoustics=off retains the validated dry path. */
(function (root) {
  'use strict';
  if (root.BattleAudioBackend) return;
  var enabled = /(?:^|[?&])audioBackend=howler(?:&|$)/.test((root.location && root.location.search) || '');
  var scenes = new WeakMap(),
    clips = new Map(),
    active = new Set(),
    acousticChains = [],
    acousticBuses = null,
    listenerState = null,
    nodeChains = new WeakMap();
  var stats = {
    requested: 0,
    started: 0,
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
  // Babylon uses a left-handed world; Web Audio uses right-handed coordinates.
  function updateListener(scene) {
    var cam = scene && scene.activeCamera;
    if (!cam || !root.Howler) return;
    var ctx = root.Howler.ctx;
    if (!listenerState || listenerState.ctx !== ctx) listenerState = { ctx: ctx };
    var p = cam.globalPosition || cam.position;
    if (
      p &&
      (!listenerState.position ||
        listenerState.position[0] !== p.x ||
        listenerState.position[1] !== p.y ||
        listenerState.position[2] !== p.z)
    ) {
      root.Howler.pos(p.x, p.y, -p.z);
      listenerState.position = [p.x, p.y, p.z];
    }
    var forward = cam.getForwardRay && cam.getForwardRay().direction;
    var up = cam.upVector || { x: 0, y: 1, z: 0 };
    if (forward) {
      var values = [forward.x, forward.y, -forward.z, up.x, up.y, -up.z];
      if (
        !listenerState.orientation ||
        values.some(function (v, i) {
          return v !== listenerState.orientation[i];
        })
      ) {
        root.Howler.orientation.apply(root.Howler, values);
        listenerState.orientation = values;
      }
    }
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
        var sound = entry.owners.get(id);
        if (sound) {
          sound._attachAcoustics();
          stats.started++;
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
  Sound.prototype.setPosition = function (p) {
    var next = point(p),
      old = this._position;
    this._position = next;
    if (this._playing && this._id != null && (old.x !== next.x || old.y !== next.y || old.z !== next.z))
      this._entry.howl.pos(next.x, next.y, -next.z, this._id);
  };
  Sound.prototype.setVolume = function (gain) {
    var next = Math.max(0, Math.min(1, +gain || 0)),
      old = this._gain;
    this._gain = next;
    if (this._playing && this._id != null && old !== next) this._entry.howl.volume(next, this._id);
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
  // Five categories, two fixed filters each. Only per-source gains are automated.
  var BUS_CUTOFFS = {
    closeShots: [19000, 900],
    distantShots: [10000, 900],
    voices: [14000, 550],
    foley: [19000, 900],
    effects: [19000, 900]
  };
  function acousticCategory(kind) {
    return kind === 'gun'
      ? 'closeShots'
      : kind === 'gunDistant' || kind === 'tail'
        ? 'distantShots'
        : kind === 'voice'
          ? 'voices'
          : kind === 'foley'
            ? 'foley'
            : 'effects';
  }
  function sharedBuses(ctx) {
    if (acousticBuses) return acousticBuses;
    var buses = {},
      allocated = [];
    try {
      Object.keys(BUS_CUTOFFS).forEach(function (category) {
        var filters = BUS_CUTOFFS[category].map(function (hz) {
          var filter = ctx.createBiquadFilter();
          allocated.push(filter);
          filter.type = 'lowpass';
          filter.frequency.value = Math.min(hz, ctx.sampleRate * 0.49);
          filter.connect(root.Howler.masterGain);
          return filter;
        });
        buses[category] = { clear: filters[0], muffled: filters[1] };
      });
    } catch (error) {
      allocated.forEach(function (filter) {
        try {
          filter.disconnect();
        } catch (_) {}
      });
      throw error;
    }
    acousticBuses = buses;
    return buses;
  }
  function ramp(param, value, t, seconds, immediate) {
    if (param._battleTarget === value) return;
    if (immediate) {
      param.cancelScheduledValues(t);
      param.setValueAtTime(value, t);
      param._battleTarget = value;
      return;
    }
    // Hold an in-progress gain ramp before replacing it; no unbounded event history.
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(t);
    else {
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
    }
    if (typeof param.linearRampToValueAtTime === 'function')
      param.linearRampToValueAtTime(value, t + seconds);
    else param.setTargetAtTime(value, t, seconds);
    param._battleTarget = value;
  }
  // One guarded bridge to pinned Howler 2.2.4's per-playback GainNode.
  Sound.prototype._attachAcoustics = function () {
    var chain = this._acoustics;
    if (!chain || this._id == null) return;
    var howl = this._entry.howl,
      node = null,
      master = root.Howler.masterGain;
    try {
      var instance = howl._soundById && howl._soundById(this._id);
      node = instance && instance._node;
      if (!node || node.context !== chain.clearGain.context || !node.disconnect) return;
      if (chain.node === node || chain.failedNode === node) return;
      var previous = nodeChains.get(node);
      if (previous && previous !== chain && previous.owner) previous.owner._releaseAcoustics();
      node.disconnect(master);
      node.connect(chain.clearGain);
      node.connect(chain.muffledGain);
      node.connect(chain.send);
      chain.node = node;
      nodeChains.set(node, chain);
      stats.acousticAttached++;
    } catch (_) {
      stats.acousticErrors++;
      chain.failedNode = node;
      [chain.clearGain, chain.muffledGain, chain.send].forEach(function (target) {
        try {
          if (node) node.disconnect(target);
        } catch (_) {}
      });
      try {
        if (node) node.connect(master);
      } catch (_) {}
    }
  };
  Sound.prototype.setAcousticProfile = function (hz, wet, wetInput, limit, kind) {
    var ctx = root.Howler.ctx,
      chain = this._acoustics;
    try {
      var category = acousticCategory(kind),
        buses = sharedBuses(ctx);
      if (!chain) {
        chain = acousticChains.find(function (item) {
          return !item.owner;
        });
        if (!chain && acousticChains.length < Math.max(1, Math.min(192, limit || 96))) {
          var nodes = [];
          try {
            for (var i = 0; i < 3; i++) {
              var gain = ctx.createGain();
              nodes.push(gain);
              gain.gain.value = 0;
            }
            chain = { clearGain: nodes[0], muffledGain: nodes[1], send: nodes[2], owner: null, node: null };
            acousticChains.push(chain);
          } catch (error) {
            nodes.forEach(function (node) {
              try {
                node.disconnect();
              } catch (_) {}
            });
            throw error;
          }
        }
        if (!chain) {
          stats.acousticBypassed++;
          return false;
        }
        chain.owner = this;
        this._acoustics = chain;
      }
      if (chain.category !== category) {
        chain.clearGain.disconnect();
        chain.muffledGain.disconnect();
        chain.clearGain.connect(buses[category].clear);
        chain.muffledGain.connect(buses[category].muffled);
        chain.category = category;
      }
      if (chain.wetInput !== wetInput) {
        chain.send.disconnect();
        if (wetInput) chain.send.connect(wetInput);
        chain.wetInput = wetInput;
      }
      var cutoffs = BUS_CUTOFFS[category];
      var blend = Math.max(
        0,
        Math.min(
          1,
          Math.log(cutoffs[0] / Math.max(cutoffs[1], hz || cutoffs[0])) / Math.log(cutoffs[0] / cutoffs[1])
        )
      );
      // Linear weights sum to one: the two paths carry the same correlated sound.
      ramp(chain.clearGain.gain, 1 - blend, ctx.currentTime, 0.045, !this._playing);
      ramp(chain.muffledGain.gain, blend, ctx.currentTime, 0.045, !this._playing);
      ramp(chain.send.gain, wetInput ? wet : 0, ctx.currentTime, 0.06, !this._playing);
      this._attachAcoustics();
      return true;
    } catch (_) {
      stats.acousticErrors++;
      this._releaseAcoustics();
      return false;
    }
  };
  Sound.prototype.neutralizeAcoustics = function () {
    var chain = this._acoustics;
    if (!chain) return;
    var t = root.Howler.ctx.currentTime;
    ramp(chain.clearGain.gain, 1, t, 0.025);
    ramp(chain.muffledGain.gain, 0, t, 0.025);
    ramp(chain.send.gain, 0, t, 0.008);
  };
  Sound.prototype._releaseAcoustics = function () {
    var chain = this._acoustics;
    if (!chain) return;
    if (chain.node) {
      nodeChains.delete(chain.node);
      try {
        chain.node.disconnect(chain.clearGain);
        chain.node.disconnect(chain.muffledGain);
        chain.node.disconnect(chain.send);
        chain.node.connect(root.Howler.masterGain);
      } catch (_) {
        stats.acousticErrors++;
      }
    }
    var t = root.Howler.ctx.currentTime;
    [chain.clearGain, chain.muffledGain, chain.send].forEach(function (node) {
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(0, t);
      delete node.gain._battleTarget;
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
      this._attachAcoustics();
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
    this._releaseAcoustics();
    this.detachFromMesh();
    if (this._scene && scenes.has(this._scene)) scenes.get(this._scene).delete(this);
    if (--this._entry.refs === 0) {
      this._entry.howl.unload();
      clips.delete(this._entry.url);
    }
    if (!clips.size) {
      acousticChains.forEach(function (chain) {
        chain.clearGain.disconnect();
        chain.muffledGain.disconnect();
        chain.send.disconnect();
      });
      acousticChains = [];
      if (acousticBuses)
        Object.keys(acousticBuses).forEach(function (category) {
          acousticBuses[category].clear.disconnect();
          acousticBuses[category].muffled.disconnect();
        });
      acousticBuses = null;
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
          dry: enabled && !(root.BattleListenerAcoustics && root.BattleListenerAcoustics.quality !== 'off'),
          acousticMode: 'double-bus',
          acousticBuses: acousticBuses ? Object.keys(acousticBuses).length * 2 : 0,
          acousticFilters: acousticBuses ? Object.keys(acousticBuses).length * 2 : 0,
          acousticCategories: acousticBuses ? Object.keys(acousticBuses) : [],
          acousticChains: acousticChains.length,
          acousticActive: acousticChains.filter(function (chain) {
            return !!chain.owner;
          }).length,
          active: active.size,
          clips: clips.size,
          errors: errors.slice()
        },
        stats
      );
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
