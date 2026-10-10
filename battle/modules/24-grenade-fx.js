/* Grenade presentation, gated by the core's `?grenades` switch. The core owns commitments, flight and blast resolution;
   this module reads its records and draws imported, lit props plus an instantaneous
   *area-density fog volume*, not particles emitted from the detonation point.
   No inventory, navigation, damage, suppression or simulation RNG writes. */
(function (root) {
  'use strict';
  if (!root.BattleModules || typeof BABYLON === 'undefined' || root.BattleGrenadeFx) return;
  var ON = !!(
      root.BattleGrenades &&
      root.BattleGrenades.parseOn(typeof location !== 'undefined' ? location.search || '' : '')
    ),
    B = BABYLON,
    STATES = new WeakMap(),
    BOUND = new WeakSet(),
    FILES = { us: 'us-mk2-grenade.glb', ge: 'ge-m24-grenade.glb' },
    MAX_BURSTS = 8,
    FOG_LIFETIME = 10,
    FOG_RADIUS = 5.5,
    FOG_HALF_HEIGHT = 2.3,
    /* Low-spec escape hatch, independent of damage and of the audio flag. */
    FOG_ON = !/(?:^|[?&])grenadeFog=(?:0|off)(?:&|$)/.test(
      typeof location !== 'undefined' ? location.search || '' : ''
    );

  function core() {
    return root.BattleGrenades;
  }
  function assetBase() {
    return String(root.BATTLE_SOLDIER_ASSET_BASE || root.BATTLE_ASSET_BASE || '../Assets/').replace(
      /\/?$/,
      '/'
    );
  }
  function ensureLoader() {
    if (B.SceneLoader.IsPluginForExtensionAvailable('.glb')) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/babylonjs-loaders@' + B.Engine.Version + '/babylonjs.loaders.min.js';
      script.onload = function () {
        if (B.SceneLoader.IsPluginForExtensionAvailable('.glb')) resolve();
        else reject(new Error('Babylon loader has no glTF plugin'));
      };
      script.onerror = function () {
        reject(new Error('Grenade glTF loader failed'));
      };
      document.head.appendChild(script);
    });
  }
  function state(battle) {
    var st = STATES.get(battle.scene);
    if (st) return st;
    st = {
      battle: battle,
      libs: {},
      held: new Map(),
      live: new Map(),
      bursts: [],
      error: null,
      ready: false
    };
    STATES.set(battle.scene, st);
    st.loading = ensureLoader()
      .then(function () {
        return Promise.all(
          Object.keys(FILES).map(function (faction) {
            return B.LoadAssetContainerAsync(assetBase() + 'weapons/' + FILES[faction], battle.scene, {
              pluginExtension: '.glb'
            }).then(function (container) {
              container.meshes.forEach(function (mesh) {
                mesh.isPickable = false;
              });
              st.libs[faction] = container;
            });
          })
        );
      })
      .then(function () {
        st.ready = true;
      })
      .catch(function (err) {
        st.error = String((err && err.message) || err);
        console.error('[GRENADES] imported grenade assets failed:', err);
      });
    battle.scene.onBeforeRenderObservable.add(function () {
      render(st);
    });
    battle.scene.onDisposeObservable.add(function () {
      clear(st);
      Object.keys(st.libs).forEach(function (key) {
        st.libs[key].dispose();
      });
      if (st.texture) st.texture.dispose();
    });
    return st;
  }
  function prop(st, faction, name) {
    var lib = st.libs[faction];
    if (!lib) return null;
    var holder = new B.TransformNode(name, st.battle.scene),
      instance = lib.instantiateModelsToScene(
        function (n) {
          return name + '-' + n;
        },
        false,
        { doNotInstantiate: true }
      );
    instance.rootNodes.forEach(function (n) {
      n.parent = holder;
    });
    holder.getChildMeshes().forEach(function (mesh) {
      mesh.isPickable = false;
    });
    holder.rotationQuaternion = new B.Quaternion();
    return holder;
  }
  var handScale = new B.Vector3(),
    handPosition = new B.Vector3(),
    handRotation = new B.Quaternion(),
    stickGripRotation = B.Quaternion.RotationAxis(B.Axis.Z, Math.PI);
  function handPose(node, soldier) {
    var fx = soldier._fbx,
      hand = fx && fx.hand,
      palm = fx && fx.lib.palms && fx.lib.palms.righthand;
    if (!hand || !palm) return false;
    var matrix = hand.computeWorldMatrix(true);
    matrix.decompose(handScale, handRotation, handPosition);
    B.Vector3.TransformCoordinatesToRef(palm, matrix, handPosition);
    node.position.copyFrom(handPosition);
    node.rotationQuaternion.copyFrom(handRotation);
    /* The stick's explosive head projects beyond the fist, away from the wrist. */
    if (soldier.faction === 'ge') node.rotationQuaternion.multiplyInPlace(stickGripRotation);
    /* The asset's origin is the grip. Its own metre scale must not inherit FBX centimetres. */
    node.scaling.setAll(1);
    return true;
  }
  function clear(st) {
    st.held.forEach(function (node) {
      node.dispose();
    });
    st.live.forEach(function (node) {
      node.dispose();
    });
    st.held.clear();
    st.live.clear();
    st.bursts.splice(0).forEach(disposeBurst);
  }
  /* A single proxy mesh bounds a spatial Beer-Lambert fog field. Its fragment
     shader integrates a camera ray through the entire already-present density
     region; it emits no particles, draws no radial billboards and allocates no
     screen-sized postprocess. The low-detail volume is fixed at detonation time. */
  function installFogShaders() {
    if (B.Effect.ShadersStore.grenadeAreaFogVertexShader) return;
    B.Effect.ShadersStore.grenadeAreaFogVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying vec3 vWorldPos;
void main(void) {
  vWorldPos = (world * vec4(position, 1.0)).xyz;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`;
    B.Effect.ShadersStore.grenadeAreaFogFragmentShader = `
precision highp float;
varying vec3 vWorldPos;
uniform vec3 eye;
uniform vec3 center;
uniform vec3 radii;
uniform float strength;
uniform float drift;
uniform float seed;
void main(void) {
  // Render precisely one surface: near/front outside, far/back when inside.
  vec3 origin = (eye - center) / radii;
  float inside = dot(origin, origin);
  if ((inside < 1.0) == gl_FrontFacing) discard;
  vec3 direction = normalize(vWorldPos - eye);
  vec3 dir = direction / radii;
  float a = dot(dir, dir);
  float b = dot(origin, dir);
  float discr = b * b - a * (inside - 1.0);
  if (discr <= 0.0 || a < 0.000001) discard;
  float delta = sqrt(discr);
  float front = max(0.0, (-b - delta) / a);
  float back = (-b + delta) / a;
  float lengthInFog = max(0.0, back - front);
  if (lengthInFog < 0.002 || strength <= 0.0) discard;
  vec3 midpoint = eye + direction * (front + lengthInFog * 0.5);
  vec3 local = midpoint - center;
  // Two broad, drifting 3D density bands (not radial eruption sprites).
  float w1 = sin(local.x * 1.13 + local.y * 0.93 + seed)
           * sin(local.z * 0.81 - local.y * 1.17 - drift);
  float w2 = sin(local.x * 0.48 - local.z * 0.62 + drift * 0.44 + seed * 0.7);
  float density = (0.88 + 0.19 * w1 + 0.12 * w2) * strength;
  float opacity = min(0.91, 1.0 - exp(-0.33 * density * lengthInFog));
  vec3 dust = vec3(0.44, 0.42, 0.37) * (0.97 + 0.055 * w1);
  gl_FragColor = vec4(dust, opacity);
}`;
  }
  function fogVolume(st, g, holder) {
    if (!FOG_ON || !B.ShaderMaterial || !B.Effect || !B.Effect.ShadersStore) return null;
    installFogShaders();
    var scene = st.battle.scene,
      mesh = B.MeshBuilder.CreateSphere(
        'grenadeAreaFog-' + g.id,
        { diameter: 2, segments: 12 },
        scene
      ),
      mat = new B.ShaderMaterial(
        'grenadeAreaFogMaterial-' + g.id,
        scene,
        { vertex: 'grenadeAreaFog', fragment: 'grenadeAreaFog' },
        {
          attributes: ['position'],
          uniforms: ['world', 'worldViewProjection', 'eye', 'center', 'radii', 'strength', 'drift', 'seed'],
          needAlphaBlending: true
        }
      );
    mesh.parent = holder;
    mesh.position.y = FOG_HALF_HEIGHT - 0.14;
    mesh.scaling.set(FOG_RADIUS, FOG_HALF_HEIGHT, FOG_RADIUS);
    mesh.material = mat;
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = false;
    mesh.renderingGroupId = 0;
    mesh.alphaIndex = -50;
    mat.backFaceCulling = false;
    mat.alphaMode = B.Engine.ALPHA_COMBINE;
    mat.setVector3('center', new B.Vector3(g.to.x, g.to.y + FOG_HALF_HEIGHT - 0.06, g.to.z));
    mat.setVector3('radii', new B.Vector3(FOG_RADIUS, FOG_HALF_HEIGHT, FOG_RADIUS));
    mat.setFloat('seed', ((g.id || 0) % 47) * 0.57);
    mat.setFloat('strength', 1);
    mat.setFloat('drift', 0);
    return { mesh: mesh, material: mat };
  }
  /* Only the <160 ms flash is billboarded; it is not a smoke emitter. */
  function flashTexture(st) {
    if (st.texture) return st.texture;
    var tex = new B.DynamicTexture('grenadeFlashSprite', 64, st.battle.scene, false),
      ctx = tex.getContext(),
      gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    tex.hasAlpha = true;
    tex.update();
    st.texture = tex;
    return tex;
  }
  function flashMaterial(st, id) {
    var mat = new B.StandardMaterial('grenadeFlash' + id, st.battle.scene);
    mat.diffuseColor = B.Color3.Black();
    mat.specularColor = B.Color3.Black();
    mat.emissiveColor = new B.Color3(1, 0.67, 0.23);
    mat.opacityTexture = flashTexture(st);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.alphaMode = B.Engine.ALPHA_ADD;
    return mat;
  }
  function disposeBurst(burst) {
    burst.node.dispose(false, false);
    if (burst.fog) burst.fog.material.dispose();
    burst.flash.dispose();
    burst.light.dispose();
  }
  function showBurst(st, g) {
    while (st.bursts.length >= MAX_BURSTS) disposeBurst(st.bursts.shift());
    var scene = st.battle.scene,
      holder = new B.TransformNode('grenadeBurst' + g.id, scene),
      flash = flashMaterial(st, g.id),
      quad = B.MeshBuilder.CreatePlane('grenadeBurstFlash', { size: 1 }, scene);
    holder.position.set(g.to.x, g.to.y + 0.08, g.to.z);
    quad.parent = holder;
    quad.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
    quad.isPickable = false;
    quad.material = flash;
    quad.alphaIndex = 1000;
    var fog = fogVolume(st, g, holder);
    var light = new B.PointLight('grenadeBurstLight', holder.position.clone(), scene);
    light.diffuse = new B.Color3(1, 0.62, 0.24);
    light.specular = B.Color3.Black();
    light.range = 7;
    st.bursts.push({
      node: holder,
      quad: quad,
      fog: fog,
      flash: flash,
      light: light,
      at: st.battle.time
    });
  }
  function renderFog(st) {
    var battle = st.battle,
      cam = battle.scene.activeCamera,
      eye = cam && (cam.globalPosition || cam.position);
    for (var b = st.bursts.length - 1; b >= 0; b--) {
      var burst = st.bursts[b],
        age = Math.max(0, battle.time - burst.at);
      if (age >= FOG_LIFETIME) {
        disposeBurst(burst);
        st.bursts.splice(b, 1);
        continue;
      }
      burst.flash.alpha = Math.max(0, 1 - age / 0.16);
      burst.quad.scaling.setAll(0.7 + Math.min(age, 0.16) * 7);
      burst.quad.position.y = 0.12;
      burst.light.intensity = 4 * Math.max(0, 1 - age / 0.16);
      burst.light.setEnabled(age < 0.16);
      if (burst.fog) {
        var strength = Math.min(1, Math.max(0, (FOG_LIFETIME - age) / 7));
        burst.fog.material.setFloat('strength', strength);
        burst.fog.material.setFloat('drift', age * 0.16);
        if (eye) burst.fog.material.setVector3('eye', eye);
      }
    }
  }
  function render(st) {
    var api = core(),
      battle = st.battle;
    if (!api || !api.on()) return;
    renderFog(st);
    if (!st.ready) return;
    var held = new Set(),
      live = new Set();
    root.BattleModules.unitsFor(battle).forEach(function (soldier) {
      if (soldier.dead || !soldier._fbx || !api.pendingOf(soldier, battle)) return;
      var node = st.held.get(soldier);
      if (!node) {
        node = prop(st, soldier.faction, 'handGrenade-' + soldier.id);
        if (!node) return;
        st.held.set(soldier, node);
      }
      node.setEnabled(handPose(node, soldier));
      held.add(soldier);
    });
    st.held.forEach(function (node, soldier) {
      if (!held.has(soldier)) {
        node.dispose();
        st.held.delete(soldier);
      }
    });
    api.projectiles(battle).forEach(function (g) {
      var node = st.live.get(g.id);
      if (!node) {
        node = prop(st, g.byFaction, 'grenadeProjectile-' + g.id);
        if (!node) return;
        st.live.set(g.id, node);
      }
      var p = api.position(g, battle.time),
        age = Math.max(0, battle.time - g.releasedAt);
      node.position.set(p.x, p.y + 0.04, p.z);
      B.Quaternion.FromEulerAnglesToRef(
        age < g.flight ? age * 8 : Math.PI / 2,
        g.id * 1.7,
        0.3,
        node.rotationQuaternion
      );
      live.add(g.id);
    });
    st.live.forEach(function (node, id) {
      if (!live.has(id)) {
        node.dispose();
        st.live.delete(id);
      }
    });
  }

  function start(battle) {
    var st = state(battle);
    clear(st);
    st.battle = battle;
    if (BOUND.has(battle)) return;
    BOUND.add(battle);
    var previous = battle.onGrenadeBurst;
    battle.onGrenadeBurst = function (g) {
      if (previous) previous.apply(this, arguments);
      showBurst(st, g);
    };
  }
  root.BattleGrenadeFx = {
    on: function () {
      return ON;
    },
    files: FILES,
    FOG_RADIUS: FOG_RADIUS,
    FOG_HALF_HEIGHT: FOG_HALF_HEIGHT,
    FOG_LIFETIME: FOG_LIFETIME,
    fogEnabled: function () { return FOG_ON; },
    status: function (battle) {
      var st = battle && STATES.get(battle.scene);
      return st
        ? {
            ready: st.ready,
            error: st.error,
            held: st.held.size,
            live: st.live.size,
            bursts: st.bursts.length,
            fogVolumes: st.bursts.filter(function (burst) { return !!burst.fog; }).length
          }
        : { ready: false, error: null, held: 0, live: 0, bursts: 0, fogVolumes: 0 };
    }
  };
  if (ON)
    root.BattleModules.registerSystem('grenade-fx', {
      onBattleStart: start,
      onBattleRestart: start,
      beforeBattleRestart: function (battle) {
        var st = STATES.get(battle.scene);
        if (st) clear(st);
      }
    });
})(typeof window !== 'undefined' ? window : globalThis);
