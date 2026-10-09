/* Opt-in grenade presentation. The core owns commitments, flight and blast resolution;
   this module reads its records and draws imported, lit props plus a bounded dust burst.
   No inventory, navigation, damage, suppression or simulation RNG writes. */
(function (root) {
  'use strict';
  if (!root.BattleModules || typeof BABYLON === 'undefined' || root.BattleGrenadeFx) return;
  var ON = /[?&]grenades=1(?:&|#|$)/.test(typeof location !== 'undefined' ? location.search || '' : ''),
    B = BABYLON,
    STATES = new WeakMap(),
    BOUND = new WeakSet(),
    FILES = { us: 'us-mk2-grenade.glb', ge: 'ge-m24-grenade.glb' },
    MAX_BURSTS = 14;

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
  function smokeTexture(st) {
    if (st.texture) return st.texture;
    var tex = new B.DynamicTexture('grenadeDustSprite', 64, st.battle.scene, false),
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
  function burstMaterial(st, name, color, additive) {
    var mat = new B.StandardMaterial(name, st.battle.scene);
    mat.diffuseColor = B.Color3.Black();
    mat.specularColor = B.Color3.Black();
    mat.emissiveColor = B.Color3.FromArray(color);
    mat.opacityTexture = smokeTexture(st);
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    if (additive) mat.alphaMode = B.Engine.ALPHA_ADD;
    return mat;
  }
  function disposeBurst(burst) {
    burst.node.dispose();
    burst.dust.dispose();
    burst.flash.dispose();
    burst.light.dispose();
  }
  function showBurst(st, g) {
    while (st.bursts.length >= MAX_BURSTS) disposeBurst(st.bursts.shift());
    var scene = st.battle.scene,
      holder = new B.TransformNode('grenadeBurst' + g.id, scene),
      dust = burstMaterial(st, 'grenadeDust' + g.id, [0.39, 0.33, 0.24], false),
      flash = burstMaterial(st, 'grenadeFlash' + g.id, [1, 0.67, 0.23], true),
      quads = [];
    holder.position.set(g.to.x, g.to.y + 0.08, g.to.z);
    for (var i = 0; i < 13; i++) {
      var quad = B.MeshBuilder.CreatePlane('grenadeBurstPuff', { size: 1 }, scene);
      quad.parent = holder;
      quad.billboardMode = B.Mesh.BILLBOARDMODE_ALL;
      quad.isPickable = false;
      quad.material = i ? dust : flash;
      /* The ignition stays in front of the dense initial dust cloud. */
      quad.alphaIndex = i ? 0 : 1000;
      quads.push(quad);
    }
    var light = new B.PointLight('grenadeBurstLight', holder.position.clone(), scene);
    light.diffuse = new B.Color3(1, 0.62, 0.24);
    light.specular = B.Color3.Black();
    light.range = 7;
    st.bursts.push({
      node: holder,
      quads: quads,
      dust: dust,
      flash: flash,
      light: light,
      at: st.battle.time
    });
  }
  function render(st) {
    var api = core(),
      battle = st.battle;
    if (!api || !api.on() || !st.ready) return;
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
    for (var b = st.bursts.length - 1; b >= 0; b--) {
      var burst = st.bursts[b],
        age = battle.time - burst.at;
      if (age >= 1.8) {
        disposeBurst(burst);
        st.bursts.splice(b, 1);
        continue;
      }
      burst.flash.alpha = Math.max(0, 1 - age / 0.16);
      burst.quads[0].scaling.setAll(0.7 + age * 7);
      burst.quads[0].position.y = 0.12;
      burst.light.intensity = 4 * Math.max(0, 1 - age / 0.16);
      burst.light.setEnabled(age < 0.16);
      burst.dust.alpha = 0.7 * Math.max(0, 1 - age / 1.8);
      for (var j = 1; j < burst.quads.length; j++) {
        var puff = burst.quads[j],
          angle = j * 2.39996,
          radius = age * (0.8 + (j % 3) * 0.28);
        puff.position.set(
          Math.sin(angle) * radius,
          0.2 + age * (0.45 + (j % 4) * 0.17),
          Math.cos(angle) * radius
        );
        puff.scaling.setAll(0.3 + age * (0.9 + (j % 3) * 0.2));
      }
    }
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
    status: function (battle) {
      var st = battle && STATES.get(battle.scene);
      return st
        ? {
            ready: st.ready,
            error: st.error,
            held: st.held.size,
            live: st.live.size,
            bursts: st.bursts.length
          }
        : { ready: false, error: null, held: 0, live: 0, bursts: 0 };
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
