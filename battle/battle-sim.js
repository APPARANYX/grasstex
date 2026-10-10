/* Battle Sim core for the ww2fps AI/units laboratory.
   2000m x 1200m battlefield, deterministic terrain, articulated infantry locomotion and
   building-aware movement. */
(function (root) {
  'use strict';
  if (typeof BABYLON === 'undefined') return;
  var FIELD_W = 2000,
    FIELD_D = 1200,
    SPAWN_Z = 510,
    LANES = [-700, -350, 0, 350, 700];
  var AI_TICK = 0.15,
    DEFAULT_TIME_LIMIT = 600,
    SUB_X = 160,
    SUB_Z = 96,
    GRIDX = SUB_X + 1,
    GRIDZ = SUB_Z + 1,
    gridH = null,
    currentGround = null,
    terrainCache = { key: null, phaseX: 0, phaseZ: 0, rough: 1 };
  function terrainProfile() {
    var s = root.BattleScenarioGenerator && root.BattleScenarioGenerator.current(),
      key = (s && s.id) || 'default';
    if (terrainCache.key === key) return terrainCache;
    var h = root.BattleScenarioGenerator
      ? root.BattleScenarioGenerator.hashSeed(((s && s.seed) || 'default') + '|height')
      : 1337;
    terrainCache = {
      key: key,
      phaseX: ((h & 1023) / 1023) * Math.PI * 2,
      phaseZ: (((h >>> 10) & 1023) / 1023) * Math.PI * 2,
      rough: s && s.terrain ? 0.78 + s.terrain.roughness * 0.92 : 1
    };
    return terrainCache;
  }
  function landscapeHeight(x, z) {
    var p = terrainProfile(),
      px = p.phaseX,
      pz = p.phaseZ,
      r = p.rough;
    return (
      r *
      (Math.sin(x * 0.003 + px) * 4.6 +
        Math.cos(z * 0.0045 + pz) * 3.7 +
        Math.sin((x + z) * 0.00235 + px * 0.63) * 2.7 +
        Math.sin(x * 0.0085 - z * 0.007 + pz * 0.71) * 1.35 +
        Math.cos(x * 0.015 + z * 0.012 + px * 0.31) * 0.55)
    );
  }
  function sampleAt(x, z) {
    if (!gridH) return landscapeHeight(x, z);
    var cellW = FIELD_W / SUB_X,
      cellD = FIELD_D / SUB_Z,
      fcol = (x + FIELD_W / 2) / cellW,
      i = Math.floor(fcol),
      u = fcol - i,
      frow = (FIELD_D / 2 - z) / cellD,
      j = Math.floor(frow),
      v = frow - j;
    if (i < 0 || j < 0 || i >= SUB_X || j >= SUB_Z) return landscapeHeight(x, z);
    var k = i + j * GRIDX,
      hC = gridH[k],
      hB = gridH[k + 1],
      hD = gridH[k + GRIDX],
      hA = gridH[k + GRIDX + 1];
    return u >= v ? hC + u * (hB - hC) + v * (hA - hB) : hC + v * (hD - hC) + u * (hA - hD);
  }
  function applyGroundHeights(ground) {
    if (!ground) return null;
    terrainCache.key = null;
    var pos = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    gridH = new Float32Array(GRIDX * GRIDZ);
    for (var i = 0; i < pos.length; i += 3) {
      var h = landscapeHeight(pos[i], pos[i + 2]);
      pos[i + 1] = h;
      gridH[i / 3] = h;
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
    var normals = [];
    BABYLON.VertexData.ComputeNormals(pos, ground.getIndices(), normals);
    ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    if (ground.refreshBoundingInfo) ground.refreshBoundingInfo();
    return ground;
  }
  function applyScenarioTerrain(scenario) {
    if (root.BattleScenarioGenerator && scenario) root.BattleScenarioGenerator.setActive(scenario);
    return applyGroundHeights(currentGround);
  }
  function buildTerrain(scene) {
    currentGround = BABYLON.MeshBuilder.CreateGround(
      'battleField',
      { width: FIELD_W, height: FIELD_D, subdivisionsX: SUB_X, subdivisionsY: SUB_Z, updatable: true },
      scene
    );
    applyGroundHeights(currentGround);
    var mat = new BABYLON.StandardMaterial('battleFieldMat', scene);
    mat.specularColor = BABYLON.Color3.Black();
    var base = root.BATTLE_ASSET_BASE || 'https://test.ivandpopov.com/grasstex/Assets/';
    var dirt = new BABYLON.Texture(
      base + 'dirttex.png',
      scene,
      false,
      false,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE
    );
    dirt.wrapU = dirt.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    dirt.uScale = FIELD_W / 9;
    dirt.vScale = FIELD_D / 9;
    dirt.anisotropicFilteringLevel = 4;
    mat.diffuseTexture = dirt;
    mat.diffuseColor = new BABYLON.Color3(0.62, 0.72, 0.48);
    currentGround.material = mat;
    currentGround.receiveShadows = true;
    currentGround.isPickable = false;
    return currentGround;
  }
  function buildSky(scene) {
    var radius = 1800,
      offset = 0.11;
    BABYLON.Effect.ShadersStore.battleSkyDomeVertexShader =
      'precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 vDir;void main(){vDir=position;gl_Position=worldViewProjection*vec4(position,1.0);}';
    BABYLON.Effect.ShadersStore.battleSkyDomeFragmentShader =
      'precision highp float;varying vec3 vDir;uniform sampler2D skyTexture;void main(){vec3 d=normalize(vDir);float lon=atan(d.z,d.x);float lat=acos(clamp(d.y,-1.0,1.0));float s=lon/(2.0*3.14159265359)+0.5;float t=lat/3.14159265359;gl_FragColor=vec4(texture2D(skyTexture,vec2(s,t)).rgb,1.0);}';
    var sky = BABYLON.MeshBuilder.CreateSphere(
      'battleSkyDome',
      { diameter: radius * 2, segments: 24 },
      scene
    );
    sky.infiniteDistance = true;
    sky.isPickable = false;
    sky.applyFog = false;
    var mat = new BABYLON.ShaderMaterial(
      'battleSkyDomeMat',
      scene,
      { vertex: 'battleSkyDome', fragment: 'battleSkyDome' },
      { attributes: ['position'], uniforms: ['worldViewProjection'], samplers: ['skyTexture'] }
    );
    mat.backFaceCulling = false;
    mat.disableDepthWrite = true;
    var base = root.BATTLE_ASSET_BASE || 'https://test.ivandpopov.com/grasstex/Assets/';
    mat.setTexture(
      'skyTexture',
      new BABYLON.Texture(base + 'skytex.png', scene, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE)
    );
    sky.material = mat;
    sky.position.y = radius * Math.sin(Math.PI * offset);
    return sky;
  }
  var flashMat = null,
    tracerMat = null;
  function fx(scene) {
    if (!flashMat) {
      flashMat = new BABYLON.StandardMaterial('muzzleFlashMat', scene);
      flashMat.emissiveColor = new BABYLON.Color3(1, 0.85, 0.4);
      flashMat.disableLighting = true;
    }
    if (!tracerMat) {
      tracerMat = new BABYLON.StandardMaterial('tracerMat', scene);
      tracerMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.7);
      tracerMat.disableLighting = true;
    }
  }
  function spawnMuzzleFlash(scene, pos) {
    fx(scene);
    var m = BABYLON.MeshBuilder.CreateSphere('flash', { diameter: 0.22, segments: 4 }, scene);
    m.position.copyFrom(pos);
    m.material = flashMat;
    m.isPickable = false;
    setTimeout(function () {
      m.dispose();
    }, 60);
  }
  function spawnTracer(scene, from, to) {
    if (root.BattleTracers && root.BattleTracers.on)
      return root.BattleTracers.show(scene, 'tracer', from, to, { r: 1, g: 0.95, b: 0.7 }, null, 90, null);
    fx(scene);
    var l = BABYLON.MeshBuilder.CreateLines('tracer', { points: [from, to] }, scene);
    l.color = new BABYLON.Color3(1, 0.95, 0.7);
    l.isPickable = false;
    setTimeout(function () {
      l.dispose();
    }, 90);
  }
  function muzzleWorld(soldier) {
    var w = soldier.weapon,
      local = BABYLON.Vector3.FromArray(w.muzzleLocal);
    return BABYLON.Vector3.TransformCoordinates(local, w.mesh.getWorldMatrix());
  }
  var POOL_SIZE = 6,
    SFX_FILES = {
      rifle: 'rifle.mp3',
      carbine: 'carbine.mp3',
      smg: 'carbine.mp3',
      lmg: 'lmg.mp3',
      pistol: 'pistol.mp3'
    };
  /* Shots are keyed by the weapon model a man carries (`weapon.profile`: m1-garand, mg42, ...), from
     manifest category `weapon.<model>` (licensed private clips, Assets/audio/weapon-clip-manifest.json):
     `fire` holds one discharge per file and plays once per round, automatic fire included, and
     `fireDistant` takes over from DISTANT_FROM metres. The near voices' linear roll-off reaches
     silence at about 97 m, so the far pool starts before that rather than leaving a silent band.
     SFX_FILES (one file per sim kind) is the fallback for a page that loaded without a manifest or a
     model with no clips. Each pool has enough voices that a fast gun never cuts off its own last
     round: ceil(cyclic rounds/s x clip length) + 2, and at least one per take. */
  var DISTANT_FROM = 90,
    FIRE_CLIP_S = 0.9,
    MAX_VOICES = 16;
  function modelClips(model, action) {
    var m = root.BATTLE_AUDIO_MANIFEST,
      c = m && m.categories && m.categories['weapon.' + model],
      list = c && c[action];
    return list && list.length ? list : null;
  }
  function weaponFiles(kind) {
    var m = root.BATTLE_AUDIO_MANIFEST,
      list = m && m.categories && m.categories.weapons && m.categories.weapons[kind];
    return list && list.length ? list : [SFX_FILES[kind]];
  }
  /* Opus-in-CAF twin where this browser decodes it (modules/00-audio-format.js), else the MP3. */
  function clipUrl(u) {
    return root.BattleAudioFormat ? root.BattleAudioFormat.url(u) : u;
  }
  function voicesFor(files, cyclic) {
    return Math.min(
      MAX_VOICES,
      Math.max(files.length, cyclic > 0 ? Math.ceil(cyclic * FIRE_CLIP_S) + 2 : POOL_SIZE)
    );
  }
  function buildWeaponAudio(scene, audioBase) {
    var pools = {},
      cursors = {},
      cam = function () {
        return scene.activeCamera && (scene.activeCamera.globalPosition || scene.activeCamera.position);
      };
    /* Decode each take once. Extra playback slots share its decoded AudioBuffer but retain
       independent position, gain and playback state. Babylon Sound.clone() is incompatible here. */
    function pool(key, files, count, far) {
      var opts = far
        ? {
            spatialSound: true,
            distanceModel: 'linear',
            maxDistance: 3500,
            rolloffFactor: 1,
            volume: 0.2,
            autoplay: false
          }
        : {
            spatialSound: true,
            distanceModel: 'linear',
            maxDistance: 145,
            rolloffFactor: 1.5,
            volume: 0.2,
            autoplay: false
          };
      var voices = new Array(count),
        takes = Math.min(count, files.length);
      pools[key] = voices;
      cursors[key] = 0;
      for (var i = 0; i < takes; i++)
        (function (i) {
          var extra = [];
          for (var k = i + takes; k < count; k += takes) extra.push(k);
          var snd = new BABYLON.Sound(
            key + 'Sfx' + i,
            clipUrl(audioBase + files[i]),
            scene,
            extra.length
              ? function () {
                  var buf = snd.getAudioBuffer && snd.getAudioBuffer();
                  if (buf)
                    extra.forEach(function (k) {
                      voices[k] = new BABYLON.Sound(key + 'Sfx' + k, buf, scene, null, opts);
                    });
                }
              : null,
            opts
          );
          voices[i] = snd;
        })(i);
    }
    /* Built once the audio format is settled (Opus-in-CAF or MP3); a shot before then plays nothing. */
    function buildPools() {
      Object.keys(SFX_FILES).forEach(function (kind) {
        var files = weaponFiles(kind);
        pool(kind, files, Math.max(POOL_SIZE, files.length), false);
      });
      /* Every model the sides field, built up front so the first shot is not silent while it loads. */
      var P = (root.BattleWeapons && root.BattleWeapons.PROFILES) || {};
      Object.keys(P).forEach(function (f) {
        Object.keys(P[f]).forEach(function (kind) {
          var w = P[f][kind],
            model = w && w.model,
            fire = model && modelClips(model, 'fire');
          if (!fire || pools['m:' + model]) return;
          pool('m:' + model, fire, voicesFor(fire, +w.cyclic || 0), false);
          var far = modelClips(model, 'fireDistant');
          if (far) pool('m:' + model + ':far', far, Math.max(far.length, 4), true);
        });
      });
    }
    var F = root.BattleAudioFormat;
    if (F && F.state === 'probing' && F.ready) F.ready.then(buildPools, buildPools);
    else buildPools();
    function keyFor(weapon) {
      var model = weapon && weapon.profile;
      return model && pools['m:' + model] ? 'm:' + model : weapon && weapon.kind;
    }
    function playOne(k, position, gain, rate) {
      var voices = pools[k];
      if (!voices) return;
      var voice = voices[cursors[k]];
      cursors[k] = (cursors[k] + 1) % voices.length;
      if (!voice) return;
      try {
        voice.setPosition(position);
        var a = root.BattleListenerAcoustics;
        if (!a || !a.prepare(voice, position, k.indexOf(':far') >= 0 ? 'gunDistant' : 'gun', gain, scene)) {
          if (voice.setVolume) voice.setVolume(gain);
        }
        if (voice.setPlaybackRate) voice.setPlaybackRate(rate || 1);
        voice.play();
      } catch (_) {}
    }
    return {
      keyFor: keyFor,
      play: function (key, position, gain, rate) {
        gain = gain == null ? 0.18 : gain;
        var c = cam(),
          far = !!pools[key + ':far'];
        if (!far || !c) return playOne(key, position, gain, rate);
        var dx = c.x - position.x,
          dz = c.z - position.z,
          d = Math.sqrt(dx * dx + dz * dz);
        // Quality-off means the original dry presentation, including its legacy near/far switch.
        if (root.BattleListenerAcoustics && root.BattleListenerAcoustics.quality === 'off')
          return playOne(d >= DISTANT_FROM ? key + ':far' : key, position, gain, rate);
        if (d <= 70) return playOne(key, position, gain, rate);
        if (d >= 145) return playOne(key + ':far', position, gain, rate);
        /* Equal-power crossfade: only sources near the transition pay for both recordings. */ var t =
          (d - 70) / 75;
        playOne(key, position, gain * Math.cos((t * Math.PI) / 2), rate);
        playOne(key + ':far', position, gain * Math.sin((t * Math.PI) / 2), rate);
      }
    };
  }
  function makeFaction() {
    return { alive: 0, kills: 0, squads: [] };
  }
  function BattleSim(scene, opts) {
    opts = opts || {};
    this.scene = scene;
    this.heightAt = sampleAt;
    this.obstacles = opts.obstacles || [];
    this.time = 0;
    this.timeScale = opts.timeScale || 1.5;
    this.timeLimit = opts.timeLimit || DEFAULT_TIME_LIMIT;
    this.paused = false;
    this.winner = null;
    this.factions = { us: makeFaction(), ge: makeFaction() };
    this._roster = { us: [], ge: [] };
    this._moduleUnits = [];
    this._aiAccum = 0;
    this._disposables = [];
    this.onFire = null;
    this.onShot = null;
    this.onSuppressiveShot = null;
    this.onCallout = null;
    this.onWinner = opts.onWinner || null;
    this.onUpdate = opts.onUpdate || null;
    this._rng = Math.random;
    var self = this;
    this._renderObserver = scene.onBeforeRenderObservable.add(function () {
      self._frame();
    });
    this.spawnAll();
  }
  BattleSim.prototype.rosterOf = function (faction) {
    return this._roster[faction];
  };
  BattleSim.prototype.random = function () {
    return this._rng();
  };
  BattleSim.prototype._resetRandom = function () {
    var s = this.scene.metadata && this.scene.metadata.battleScenario,
      seed = (s && s.seed) || 'battle-default';
    this._rng = root.BattleScenarioGenerator
      ? root.BattleScenarioGenerator.rngFor(seed, 'combat')
      : Math.random;
  };
  BattleSim.prototype.killSoldier = function (soldier, killer) {
    if (soldier.dead) return;
    var led = !!(root.SquadAI && root.SquadAI.isLeader(soldier));
    if (root.BattleTacticalPositions) root.BattleTacticalPositions.release(soldier, this, 'death');
    BattleSoldierModel.kill(soldier);
    soldier.hp = 0;
    soldier.target = null;
    this.factions[soldier.faction].alive--;
    if (killer) this.factions[killer.faction].kills++;
    if (led && root.BattleSquadStability) root.BattleSquadStability.leaderDown(soldier.squad);
  };
  BattleSim.prototype.spawnAll = function () {
    var scene = this.scene,
      scenario = scene.metadata && scene.metadata.battleScenario;
    this._resetRandom();
    this.factions = { us: makeFaction(), ge: makeFaction() };
    this._roster = { us: [], ge: [] };
    this._moduleUnits = [];
    this.time = 0;
    this.winner = null;
    this.winReason = null;
    this._aiAccum = 0;
    var nextId = 0,
      self = this;
    function zone(f) {
      return (
        (scenario && scenario.spawnZones && scenario.spawnZones[f]) || {
          z: f === 'us' ? -SPAWN_Z : SPAWN_Z,
          lanes: LANES
        }
      );
    }
    function spawnSide(faction) {
      var zn = zone(faction),
        z = zn.z,
        lanes = zn.lanes || LANES,
        facingObjectiveZ = faction === 'us' ? Math.abs(z) : -Math.abs(z);
      for (var li = 0; li < lanes.length; li++) {
        var laneX = lanes[li],
          home = { x: laneX, z: z },
          objective = {
            x: scenario && scenario.center ? scenario.center.x : laneX,
            z: scenario && scenario.center ? scenario.center.z : facingObjectiveZ
          },
          squad = SquadAI.createSquad(faction + '-' + li, faction, home, objective),
          dealt =
            root.BattleSoldierStats && root.BattleSoldierStats.deal
              ? root.BattleSoldierStats.deal(faction, nextId, SquadAI.COMPOSITION)
              : null;
        for (var si = 0; si < SquadAI.COMPOSITION.length; si++) {
          var role = SquadAI.COMPOSITION[si],
            jx = laneX + (self.random() - 0.5) * 8,
            jz = z + (self.random() - 0.5) * 6,
            model = BattleSoldierModel.createSoldier(scene, faction, role, null);
          model.root.position.set(jx, sampleAt(jx, jz), jz);
          model.root.rotation.y = objective.z > z ? 0 : Math.PI;
          var deal = SquadAI.dealLoadout(scene, model.weaponSocket, role, faction),
            weapon = deal.weapon,
            soldier = SquadAI.createSoldier({
              id: dealt ? dealt[si] : nextId++,
              faction: faction,
              role: role,
              squad: squad,
              slotIndex: si,
              model: model,
              weapon: weapon,
              secondary: deal.secondary
            });
          root.SquadAI.setFireCooldown(soldier, self.random() * 0.5);
          soldier.unitType = 'infantry';
          soldier.captureWeight = 1;
          soldier.scoreValue = 1;
          squad.members.push(soldier);
          self._roster[faction].push(soldier);
          self.factions[faction].alive++;
          if (root.BattleModules)
            root.BattleModules.addUnit(self, soldier, { unitType: 'infantry', captureWeight: 1 });
        }
        if (dealt) nextId += SquadAI.COMPOSITION.length;
        self.factions[faction].squads.push(squad);
      }
    }
    spawnSide('us');
    spawnSide('ge');
  };
  BattleSim.prototype.restart = function () {
    if (root.BattleModules) root.BattleModules.runHook('beforeBattleRestart', this, {});
    var all = this._roster.us.concat(this._roster.ge),
      i;
    if (root.BattleEngagement) {
      for (i = 0; i < all.length; i++) root.BattleEngagement.resetSoldier(all[i]);
      ['us', 'ge'].forEach(function (f) {
        (this.factions[f].squads || []).forEach(root.BattleEngagement.resetSquad);
      }, this);
    }
    for (i = 0; i < all.length; i++) {
      if (root.BattleTacticalPositions) root.BattleTacticalPositions.release(all[i], this, 'battle-reset');
      all[i].root.dispose();
    }
    this.spawnAll();
  };
  BattleSim.prototype.setTimeScale = function (v) {
    this.timeScale = Math.max(0, +v || 0);
  };
  BattleSim.prototype.pause = function () {
    this.paused = true;
  };
  BattleSim.prototype.resume = function () {
    this.paused = false;
  };
  var AVOID_LOOKAHEAD = 1.8,
    AVOID_MARGIN = 0.5,
    AVOID_QUERY = 8;
  /* `?steerLeg=0`: steering as before (look 1.8 m ahead past the leg, only the destination's circles exempt), for a paired A/B. */
  var STEER_LEG = !(typeof location !== 'undefined' && /[?&]steerLeg=0\b/.test(location.search || ''));
  /* A man who is genuinely boxed in re-plans on a timer rather than once per frame. Clearing
     the nav cache every blocked frame just recomputed the same unusable path 7 times a second. */
  var NAV_REPLAN_HOLD = 1.5;
  /* The cover field now holds thousands of obstacles, so avoidance asks the spatial index for the
     handful near the look-ahead point instead of scanning the whole field once per soldier per
     frame. */
  function avoidanceCandidates(obstacles, lookX, lookZ) {
    if (!obstacles || !obstacles.length) return null;
    if (root.BattleObstacleField)
      return root.BattleObstacleField.nearby(obstacles, lookX, lookZ, AVOID_QUERY);
    return obstacles;
  }
  /* Soft local avoidance of the tactical cover circles; physical navigation (movementClear /
     resolveStep below) is what keeps a body out of a real footprint, and the path it hands him is legal by
     construction. Steering is a nudge along a leg, so it looks no further than the end of that leg and never
     pushes against where the leg goes: a circle whose avoidance ring holds the man's destination or the
     waypoint he is walking to is where he is going, and does not push him. Without that, men bounding to
     cover jittered ("the Matrix dodge"): the look-ahead point lay 1.8 m ahead, past the slot or waypoint,
     inside the ring of the next circle along a wall (a thin wall is sampled as 1.6 m circles every ~2.4 m
     and its slot sits ~1.9 m from two of them and ~2.3 m from the third), whose full-strength push turned
     him round; the next step the point was outside it and the push was gone. (Dropping every reversing
     push instead stranded men on blocked formation waypoints: the push is also what backs a man off one.)
     `leg` (the waypoint) and `reach` (the distance to it) are optional. */
  function steerAroundObstacles(obstacles, x, z, dirx, dirz, goal, leg, reach) {
    var ahead = reach > 0 ? Math.min(AVOID_LOOKAHEAD, reach) : AVOID_LOOKAHEAD,
      lookX = x + dirx * ahead,
      lookZ = z + dirz * ahead,
      near = avoidanceCandidates(obstacles, lookX, lookZ);
    if (!near || !near.length) return null;
    var pushX = 0,
      pushZ = 0,
      any = false;
    for (var i = 0; i < near.length; i++) {
      var ob = near[i],
        dxo = lookX - ob.x,
        dzo = lookZ - ob.z,
        r = ob.radius + AVOID_MARGIN,
        dSq = dxo * dxo + dzo * dzo;
      if (dSq >= r * r) continue;
      if (goal && Math.hypot(goal.x - ob.x, goal.z - ob.z) < r) continue;
      if (leg && Math.hypot(leg.x - ob.x, leg.z - ob.z) < r) continue;
      any = true;
      var d = Math.sqrt(dSq) || 0.001;
      pushX += dxo / d;
      pushZ += dzo / d;
    }
    if (!any) return null;
    var nx = dirx + pushX * 0.9,
      nz = dirz + pushZ * 0.9,
      len = Math.hypot(nx, nz);
    return len > 1e-4 ? { x: nx / len, z: nz / len } : null;
  }
  function stepMovement(self, soldier, dt) {
    if (soldier.dead) {
      if (root.BattleSquadStability) root.BattleSquadStability.endUnstick(soldier);
      soldier._movementStopReason = 'dead';
      BattleSoldierModel.animateWalk(soldier, dt, 0);
      return;
    }
    if (root.SquadAI && root.SquadAI.tickFireCooldown) root.SquadAI.tickFireCooldown(soldier, dt);
    var recovery = soldier._regroupUnstick,
      sq = soldier.squad,
      lease = recovery && sq && root.BattleLeases && root.BattleLeases.get(sq, 'regroup'),
      goal = soldier._movementResolver && soldier._movementResolver.goal;
    if (
      recovery &&
      (!lease ||
        lease.since !== recovery.since ||
        sq.state === 'retreat' ||
        sq.inContact ||
        lease.data.missionVersion !== ((sq._macroMission && +sq._macroMission.version) || 0) ||
        !goal ||
        goal.kind !== 'regroup' ||
        soldier.reloading ||
        soldier.clearingStoppage ||
        soldier.suppressedUntil > self.time)
    ) {
      recovery = null;
      if (root.BattleSquadStability) root.BattleSquadStability.endUnstick(soldier);
    }
    var desired = recovery ? goal.point : soldier.destination;
    var normalDesired = null;
    if (recovery) {
      var at = { x: soldier.root.position.x, z: soldier.root.position.z };
      normalDesired =
        (root.BattleNavigation && root.BattleNavigation.nextWaypoint(self, soldier, soldier.destination)) ||
        soldier.destination;
      var rx = normalDesired.x - at.x,
        rz = normalDesired.z - at.z,
        rd = Math.hypot(rx, rz),
        stride = Math.min(rd, soldier.speed * dt),
        next = rd ? { x: at.x + (rx / rd) * stride, z: at.z + (rz / rd) * stride } : at,
        arrived = Math.hypot(goal.point.x - at.x, goal.point.z - at.z) <= 0.35,
        spacing = root.BattleSoldierPersonalSpace,
        bodyClear = true;
      if (spacing && self._roster) {
        bodyClear = ['us', 'ge'].every(function (f) {
          return (self._roster[f] || []).every(function (other) {
            return (
              other === soldier ||
              other.dead ||
              !other.root ||
              Math.hypot(other.root.position.x - at.x, other.root.position.z - at.z) >= spacing.minSeparation
            );
          });
        });
      }
      // Navigation must offer actual travel, not a no-path hold inside an enclosure.
      // Check placement too: an outward step can be legal while still inside a body buffer.
      if (
        bodyClear &&
        (rd > 0.35 || arrived) &&
        (!root.BattleNavigation ||
          (root.BattleNavigation.movementClear(at, at) && root.BattleNavigation.movementClear(at, next)))
      ) {
        recovery = null;
        if (root.BattleSquadStability) root.BattleSquadStability.endUnstick(soldier);
        if (root.BattleNavigation) root.BattleNavigation.invalidateNavPath(soldier);
        desired = normalDesired;
      }
    }
    /* A possessed soldier goes where the stick or WASD points: no pathfinding round to a door, no steering off
       tactical circles (window posts). Walls still stop him and he slides along them (movementClear/resolveStep). */
    var playerDirect = !!(soldier.isPlayer && goal && goal.kind === 'player');
    if (!recovery && !normalDesired && root.BattleNavigation && !playerDirect)
      desired = root.BattleNavigation.nextWaypoint(self, soldier, desired) || desired;
    // Record the actual integration gate, not an inference from the last command or stuck detector.
    var observedWaypoint = soldier._movementWaypoint || (soldier._movementWaypoint = { x: 0, z: 0 });
    observedWaypoint.x = desired.x;
    observedWaypoint.z = desired.z;
    soldier._movementStopReason = null;
    var dx = desired.x - soldier.root.position.x,
      dz = desired.z - soldier.root.position.z,
      d = Math.hypot(dx, dz),
      crawl = !!(soldier.prone && soldier.crawling),
      wantCrouch = !soldier.prone && !!soldier.tacticalCrouch,
      playerGoal = goal && goal.kind === 'player' ? goal : null,
      playerScale =
        playerGoal && isFinite(+playerGoal.speedScale)
          ? Math.max(0.2, Math.min(2, +playerGoal.speedScale))
          : 1;
    var desiredSpeed = d > 0.35 ? soldier.speed * playerScale * (crawl ? 0.23 : wantCrouch ? 0.58 : 1) : 0,
      cur = soldier.moveSpeed || 0,
      rate = desiredSpeed > cur ? (crawl ? 1.2 : 4.2) : crawl ? 2.0 : 6.5;
    soldier.moveSpeed = Math.max(0, cur + Math.max(-rate * dt, Math.min(rate * dt, desiredSpeed - cur)));
    // Ease the remaining angle over time, keeping the existing stance-dependent turn limit.
    function turnToward(yaw) {
      var diff = Math.atan2(Math.sin(yaw - soldier.root.rotation.y), Math.cos(yaw - soldier.root.rotation.y)),
        maxTurn = (soldier.prone ? 1.25 : 2.8) * dt,
        eased = diff * (1 - Math.exp(-8 * dt));
      soldier.root.rotation.y += Math.max(-maxTurn, Math.min(maxTurn, eased));
    }
    if (d > 0.35 && soldier.moveSpeed > 0.025 && (!soldier.prone || crawl)) {
      var here = { x: soldier.root.position.x, z: soldier.root.position.z };
      var dirx = dx / d,
        dirz = dz / d,
        steered =
          !recovery &&
          !playerDirect &&
          steerAroundObstacles(
            self.obstacles,
            here.x,
            here.z,
            dirx,
            dirz,
            soldier.destination,
            STEER_LEG ? desired : null,
            STEER_LEG ? d : 0
          );
      if (steered) {
        dirx = steered.x;
        dirz = steered.z;
      }
      var step = Math.min(d, soldier.moveSpeed * dt),
        nx = here.x + dirx * step,
        nz = here.z + dirz * step;
      if (
        !recovery &&
        root.BattleNavigation &&
        !root.BattleNavigation.movementClear(here, { x: nx, z: nz })
      ) {
        /* Cover steering pushed him into a wall: the plain heading to the waypoint comes first. */
        dirx = dx / d;
        dirz = dz / d;
        nx = here.x + dirx * step;
        nz = here.z + dirz * step;
        if (!root.BattleNavigation.movementClear(here, { x: nx, z: nz })) {
          /* Physical navigation, not this integrator, decides how to get past the obstruction.
             Stopping dead and dropping the path cache every frame is what used to freeze a man
             against a wall for the rest of the battle: the same blocked plan came straight back. */
          var slid = root.BattleNavigation.resolveStep
            ? root.BattleNavigation.resolveStep(here, { x: nx, z: nz })
            : null;
          if (slid) {
            nx = slid.x;
            nz = slid.z;
            dirx = (nx - here.x) / step;
            dirz = (nz - here.z) / step;
          } else {
            if (!(self.time < (soldier._navReplanHold || 0))) {
              if (root.BattleNavigation) root.BattleNavigation.invalidateNavCache(soldier);
              soldier._navReplanHold = self.time + NAV_REPLAN_HOLD;
            }
            soldier.moveSpeed = 0;
            soldier.moving = false;
            soldier._movementStopReason = 'step-blocked';
            BattleSoldierModel.animateWalk(soldier, dt, 0);
            return;
          }
        }
      }
      soldier.root.position.x = nx;
      soldier.root.position.z = nz;
      soldier.root.position.y = self.heightAt(nx, nz);
      var aimFace = playerDirect && soldier._faceHint;
      turnToward(aimFace ? Math.atan2(aimFace.x - nx, aimFace.z - nz) : Math.atan2(dirx, dirz));
      soldier.moving = true;
    } else {
      soldier.moving = false;
      soldier._movementStopReason =
        d <= 0.35
          ? soldier._physicalPath && soldier._physicalPath.blocked
            ? 'path-blocked'
            : 'arrived'
          : soldier.prone && !crawl
            ? 'prone-hold'
            : 'speed-settling';
      var face = soldier.target ? soldier.target.root.position : soldier._faceHint;
      if (face) {
        var tx = face.x - soldier.root.position.x,
          tz = face.z - soldier.root.position.z;
        if (Math.abs(tx) + Math.abs(tz) > 1e-4) turnToward(Math.atan2(tx, tz));
      }
    }
    BattleSoldierModel.animateWalk(soldier, dt, soldier.speed > 0 ? soldier.moveSpeed / soldier.speed : 0);
  }
  BattleSim.prototype._frame = function (forcedDt) {
    if (this.paused || this.winner) return;
    var dt = forcedDt == null ? (this.scene.getEngine().getDeltaTime() / 1000) * this.timeScale : +forcedDt;
    if (!(dt > 0)) return;
    dt = Math.min(dt, 0.25);
    this.time += dt;
    var us = this._roster.us,
      ge = this._roster.ge,
      i;
    for (i = 0; i < us.length; i++) stepMovement(this, us[i], dt);
    for (i = 0; i < ge.length; i++) stepMovement(this, ge[i], dt);
    this._aiAccum += dt;
    while (this._aiAccum >= AI_TICK && !this.winner) {
      this._aiAccum -= AI_TICK;
      var f = this.factions,
        squadsUs = f.us.squads,
        squadsGe = f.ge.squads;
      for (i = 0; i < squadsUs.length; i++) SquadAI.updateSquad(squadsUs[i], this);
      for (i = 0; i < squadsGe.length; i++) SquadAI.updateSquad(squadsGe[i], this);
      for (i = 0; i < us.length; i++) SquadAI.updateSoldier(us[i], this);
      for (i = 0; i < ge.length; i++) SquadAI.updateSoldier(ge[i], this);
      this._checkWinner();
      if (this.onUpdate) this.onUpdate(this);
    }
    if (root.BattleModules) root.BattleModules.runHook('onSimulationStep', this, { dt: dt });
  };
  BattleSim.prototype.step = function (dt) {
    this._frame(+dt || AI_TICK);
  };
  BattleSim.prototype._checkWinner = function () {
    if (this.winner) return;
    var us = this.factions.us.alive,
      ge = this.factions.ge.alive,
      timeUp = this.time >= this.timeLimit;
    if (us <= 0 || ge <= 0 || timeUp) {
      this.winner = us === ge ? 'draw' : us > ge ? 'us' : 'ge';
      if (this.onWinner) this.onWinner(this.winner, this);
    }
  };
  /* Presentation of something the sim resolved `delay` sim-seconds early (the later rounds of a burst,
     which the AI tick resolves together): play it that much later, at the current time scale. */
  BattleSim.prototype.presentAfter = function (delay, fn) {
    if (!(delay > 0)) return fn();
    var self = this;
    setTimeout(
      function () {
        try {
          fn();
        } catch (e) {
          console.warn('[FX] delayed presentation failed', e);
        }
      },
      (delay * 1000) / Math.max(0.05, self.timeScale || 1)
    );
  };
  BattleSim.prototype._wireFx = function (audioBase) {
    var self = this,
      audio = buildWeaponAudio(this.scene, audioBase || 'audio/');
    if (root.BattleListenerAcoustics) root.BattleListenerAcoustics.bind(this);
    var fire = function (soldier) {
      var pos = muzzleWorld(soldier);
      if (!(root.BattleMuzzleFlash && root.BattleMuzzleFlash.show(self.scene, soldier)))
        spawnMuzzleFlash(self.scene, pos);
      var key = audio.keyFor(soldier.weapon);
      if (root.BattleAudioScheduler)
        root.BattleAudioScheduler.enqueue(audio, key, pos, self.scene.activeCamera);
      else audio.play(key, pos, 0.18, 1);
    };
    this.onFire = function (soldier, delay) {
      if (delay > 0)
        return self.presentAfter(delay, function () {
          if (!soldier.dead) fire(soldier);
        });
      fire(soldier);
    };
    this.onCallout = function (soldier, type) {
      if (root.BattleVoiceScheduler)
        root.BattleVoiceScheduler.enqueue(soldier, type, self.scene.activeCamera);
    };
    this.onShot = function (shooter, target, hit, d, shot) {
      if (!hit || (shot && shot.tracerDrawn)) return;
      spawnTracer(self.scene, muzzleWorld(shooter), target.root.position.add(new BABYLON.Vector3(0, 1.2, 0)));
    };
    /* Suppressing fire is aimed at a place, not a man, so the tracer goes to the place. Without
       this the operator sees a soldier firing at nothing. */
    this.onSuppressiveShot = function (shooter, point) {
      spawnTracer(
        self.scene,
        muzzleWorld(shooter),
        new BABYLON.Vector3(point.x, self.heightAt(point.x, point.z) + 1, point.z)
      );
    };
  };
  function start(scene, opts) {
    opts = opts || {};
    var sim = new BattleSim(scene, opts);
    sim._wireFx(opts.audioBase);
    return sim;
  }
  root.BattleSim = {
    FIELD_W: FIELD_W,
    FIELD_D: FIELD_D,
    heightAt: sampleAt,
    buildTerrain: buildTerrain,
    buildSky: buildSky,
    applyScenarioTerrain: applyScenarioTerrain,
    start: start,
    AI_TICK: AI_TICK
  };
})(typeof window !== 'undefined' ? window : globalThis);
