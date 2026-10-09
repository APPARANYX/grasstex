(function (global) {
  'use strict';
  var FLY_SPEED = 68,
    FLY_SPRINT = 175,
    THROTTLE_MIN = 0.01,
    THROTTLE_PER_PIXEL = 0.00288,
    DELTA_UNIT_PX = [1, 16, 400];
  var FOLLOW_DEFAULT = 10,
    FOLLOW_MIN = 3,
    FOLLOW_MAX = 90,
    FOLLOW_BETA = 1.18,
    FOLLOW_HEIGHT = 1.05,
    ORBIT_SPEED = 0.22;
  var LOOK_X = 0.0022,
    LOOK_Y = 0.0018,
    PITCH_LIMIT = Math.PI * 0.46,
    MAX_HEIGHT = 420,
    GROUND_CLEARANCE = 2,
    CAMERA_FAR = 2600;
  var PAD_DEADZONE = 0.16,
    PAD_LOOK_RATE = 2.35,
    PAD_PRECISION = 0.28,
    PAD_THROTTLE_STEP = 1.35;
  var PLAYER_DISTANCE = 5.6,
    PLAYER_AIM_DISTANCE = 3.15,
    PLAYER_LOOK_RATE = 2.2,
    PLAYER_MOVE_AHEAD = 6,
    PLAYER_CAMERA_CLEARANCE = 0.45;
  /* Player-only sprint budget; AI soldiers keep their existing movement model. */
  var SPRINT_DRAIN = 12,
    STAMINA_WALK_RECOVER = 12,
    STAMINA_IDLE_RECOVER = 18,
    STAMINA_RESTART = 25;
  var MENU_HOLD_MS = 650;
  var KEY_HINT =
    'Camera: click to look · WASD move · wheel speed · Q/E up/down · Shift sprint · P player · Esc releases';
  var PAD_HINT =
    'Xbox: LS move · RS look · LT/RT down/up · RB sprint · LB precision · D-pad speed · Y level · Menu tap player / hold settings';
  var PLAYER_HINT =
    'Player: WASD move · Shift run · mouse look · RMB aim · LMB fire · C crouch · Z prone · P new soldier · O settings · V exit';
  var PLAYER_PAD_HINT =
    'Xbox: LS move · L3 run · RS look · LT aim · RT fire · B crouch · A prone · Menu tap next / hold settings · View exit';
  var TOUCH_HINT = 'Camera: drag to orbit · pinch/wheel to zoom';
  var PAD_WAKE_HINT = 'Xbox: move a stick or press a button to switch to fly controls';
  var clamp = global.GTMath.clamp;
  function menuHoldGesture(state, pressed, now) {
    if (pressed && !state.down) {
      state.down = true;
      state.since = now;
      state.long = false;
      return null;
    }
    if (pressed && !state.long && now - state.since >= MENU_HOLD_MS) {
      state.long = true;
      return 'hold';
    }
    if (!pressed && state.down) {
      state.down = false;
      return state.long ? null : 'tap';
    }
    return null;
  }
  function desktopPointer() {
    return !!(global.matchMedia && global.matchMedia('(pointer:fine)').matches);
  }
  function hasGamepadAPI() {
    return !!(global.navigator && typeof global.navigator.getGamepads === 'function');
  }
  function queryParams() {
    try {
      return new URLSearchParams((global.location && global.location.search) || '');
    } catch (_) {
      return new URLSearchParams();
    }
  }
  function queryNumber(q, key, fallback, min, max) {
    if (!q.has(key)) return fallback;
    var n = +q.get(key);
    if (!isFinite(n)) return fallback;
    return clamp(n, min, max);
  }
  function livingSoldiers(b) {
    if (!b || !b._roster) return [];
    return (b._roster.us || []).concat(b._roster.ge || []).filter(function (s) {
      return s && s.root && !s.dead;
    });
  }
  function busiestSoldier(all) {
    var best = null,
      bestN = -1;
    all.forEach(function (s) {
      var n = 0,
        p = s.root.position;
      all.forEach(function (o) {
        var d = o.root.position,
          dx = d.x - p.x,
          dz = d.z - p.z;
        if (dx * dx + dz * dz < 3600) n++;
      });
      if (n > bestN) {
        bestN = n;
        best = s;
      }
    });
    return best;
  }
  function nearestLiving(all, from) {
    var best = null,
      bestD = Infinity;
    all.forEach(function (s) {
      var p = s.root.position,
        dx = p.x - from.x,
        dz = p.z - from.z,
        d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    });
    return best;
  }
  function initialPosition(target, radius, alpha, beta) {
    return new BABYLON.Vector3(
      target.x + radius * Math.cos(alpha) * Math.sin(beta),
      target.y + radius * Math.cos(beta),
      target.z + radius * Math.sin(alpha) * Math.sin(beta)
    );
  }
  function createTouchOrbit(scene, canvas, target) {
    var camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, 1.02, 720, target, scene);
    camera.lowerRadiusLimit = 90;
    camera.upperRadiusLimit = 1850;
    camera.lowerBetaLimit = 0.28;
    camera.upperBetaLimit = 1.5;
    camera.wheelPrecision = 3;
    camera.panningSensibility = 120;
    camera.attachControl(canvas, true);
    var hint = TOUCH_HINT + (hasGamepadAPI() ? ' · ' + PAD_WAKE_HINT : '');
    return { camera: camera, desktop: false, hint: hint };
  }
  function shapedAxis(v) {
    v = isFinite(+v) ? +v : 0;
    var a = Math.abs(v);
    if (a <= PAD_DEADZONE) return 0;
    return (Math.sign(v) * (a - PAD_DEADZONE)) / (1 - PAD_DEADZONE);
  }
  function buttonValue(pad, index) {
    var b = pad && pad.buttons && pad.buttons[index];
    return b ? Math.max(b.pressed ? 1 : 0, +b.value || 0) : 0;
  }
  function activeGamepad() {
    if (!hasGamepadAPI()) return null;
    var pads = global.navigator.getGamepads() || [],
      fallback = null;
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      if (!p || p.connected === false) continue;
      if (!fallback) fallback = p;
      if (p.mapping === 'standard') return p;
    }
    return fallback;
  }
  function cameraPose(camera, fallbackTarget) {
    var position =
      camera && camera.position && camera.position.clone
        ? camera.position.clone()
        : initialPosition(fallbackTarget, 720, -Math.PI / 2, 1.02);
    var look =
      fallbackTarget && fallbackTarget.clone
        ? fallbackTarget.clone()
        : new BABYLON.Vector3(fallbackTarget.x, fallbackTarget.y, fallbackTarget.z);
    if (camera) {
      try {
        if (typeof camera.getTarget === 'function') {
          var t = camera.getTarget();
          if (t) look = t.clone ? t.clone() : new BABYLON.Vector3(t.x, t.y, t.z);
        } else if (camera.target) {
          look = camera.target.clone
            ? camera.target.clone()
            : new BABYLON.Vector3(camera.target.x, camera.target.y, camera.target.z);
        }
      } catch (_) {}
    }
    return { position: position, target: look };
  }
  function createDesktopFly(scene, canvas, target, engine, battleSim, pose) {
    var startPosition =
      pose && pose.position ? pose.position : initialPosition(target, 720, -Math.PI / 2, 1.02);
    var lookTarget = pose && pose.target ? pose.target : target;
    var camera = new BABYLON.UniversalCamera('cam', startPosition, scene);
    camera.inputs.clear();
    camera.minZ = 0.25;
    camera.maxZ = CAMERA_FAR;
    camera.setTarget(lookTarget);
    scene.activeCamera = camera;
    var yaw = camera.rotation.y,
      pitch = camera.rotation.x,
      active = false,
      throttle = 1,
      keys = new Set(),
      padButtons = {},
      padId = null,
      player = null,
      playerBattle = null,
      playerCam = null,
      playerYaw = 0,
      playerPitch = 0,
      mouseAim = false,
      mouseFire = false,
      playerFaction = queryParams().get('playerFaction') === 'ge' ? 'ge' : 'us',
      reticle = null,
      playerHud = null,
      playerDamage = null,
      playerStamina = 100,
      playerExhausted = false,
      lastWoundCount = 0,
      damageAt = 0,
      damageOrigin = null,
      lastShotPulse = 0,
      settingsMenu = null,
      menuOpen = false,
      menuPauseOwner = null,
      menuSquads = [],
      menuSoldiers = [],
      menuFocus = 0,
      menuHoldState = { down: false, since: 0, long: false },
      playerHapticsEnabled = true;
    function guarded() {
      return active || document.activeElement === canvas;
    }
    function keyName(event) {
      return event.key === ' ' ? ' ' : event.key.toLowerCase();
    }
    function editableTarget(target) {
      var tag = (target && target.tagName) || '';
      return (
        tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || !!(target && target.isContentEditable)
      );
    }
    function movementKey(key) {
      return (
        key === 'w' ||
        key === 'a' ||
        key === 's' ||
        key === 'd' ||
        key === 'q' ||
        key === 'e' ||
        key === 'shift'
      );
    }
    function playerMovementKey(key) {
      return key === 'w' || key === 'a' || key === 's' || key === 'd' || key === 'shift';
    }
    function playerLabel() {
      if (!player) return null;
      var side = player.faction === 'ge' ? 'GER' : 'US',
        sq = player.squad && player.squad.id ? player.squad.id : 'squad';
      return side + ' ' + (player.role || 'soldier') + ' #' + player.id + ' · ' + sq;
    }
    function updateHint(pad) {
      var el = document.getElementById('cameraHint');
      if (!el) return;
      el.textContent = player
        ? PLAYER_HINT + (pad ? ' · ' + PLAYER_PAD_HINT : '') + ' · ' + playerLabel()
        : KEY_HINT + (pad ? ' · ' + PAD_HINT : '');
    }
    function padPressedOnce(pad, index) {
      var down = buttonValue(pad, index) > 0.5,
        was = !!padButtons[index];
      padButtons[index] = down;
      return down && !was;
    }
    function refreshPadButtons(pad) {
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(function (i) {
        padButtons[i] = buttonValue(pad, i) > 0.5;
      });
    }
    function liveBattle() {
      var b = global.__battle__;
      return b && b._roster && b.factions ? b : null;
    }
    function randomFrom(a) {
      return a && a.length ? a[Math.floor(Math.random() * a.length)] : null;
    }
    function pickPlayerSoldier(exclude) {
      var b = liveBattle(),
        fac = b && b.factions[playerFaction],
        squads = (fac && fac.squads) || [],
        choices = [];
      squads.forEach(function (sq) {
        var men = (sq.members || []).filter(function (s) {
          return s && s.root && !s.dead && s !== exclude;
        });
        if (men.length) choices.push(men);
      });
      if (!choices.length && exclude) {
        squads.forEach(function (sq) {
          var men = (sq.members || []).filter(function (s) {
            return s && s.root && !s.dead;
          });
          if (men.length) choices.push(men);
        });
      }
      var men = randomFrom(choices);
      return randomFrom(men);
    }
    function ensureReticle() {
      if (reticle) return reticle;
      reticle = document.createElement('div');
      reticle.id = 'battlePlayerReticle';
      reticle.style.cssText =
        'position:fixed;left:50%;top:50%;width:18px;height:18px;transform:translate(-50%,-50%);z-index:9;pointer-events:none;display:none';
      reticle.innerHTML =
        '<i style="position:absolute;left:8px;top:1px;width:2px;height:16px;background:#f1f1dfcc"></i><i style="position:absolute;left:1px;top:8px;width:16px;height:2px;background:#f1f1dfcc"></i>';
      document.body.appendChild(reticle);
      return reticle;
    }

    /* Browser capability detection is essential: iOS Safari commonly exposes neither phone vibration
       nor controller rumble. Haptics are optional feedback, never a condition for firing or damage. */
    function playerRumble(pad, duration, strong, weak) {
      if (!playerHapticsEnabled) return;
      try {
        var actuator = pad && (pad.vibrationActuator || (pad.hapticActuators && pad.hapticActuators[0]));
        if (actuator && typeof actuator.playEffect === 'function') {
          var result = actuator.playEffect('dual-rumble', {
            duration: duration,
            startDelay: 0,
            strongMagnitude: strong,
            weakMagnitude: weak
          });
          if (result && typeof result.catch === 'function') result.catch(function () {});
          return;
        }
        if (actuator && typeof actuator.pulse === 'function') {
          var pulse = actuator.pulse(Math.max(strong, weak), duration);
          if (pulse && typeof pulse.catch === 'function') pulse.catch(function () {});
          return;
        }
        if (global.navigator && typeof global.navigator.vibrate === 'function')
          global.navigator.vibrate(duration);
      } catch (_) {
        /* Unsupported and permission-blocked devices should remain playable. */
      }
    }
    function ensurePlayerFeedback() {
      if (playerHud) return;
      var css = document.createElement('style');
      css.id = 'battlePlayerFeedbackStyles';
      css.textContent =
        '#battlePlayerHud{position:fixed;left:12px;bottom:58px;z-index:16;pointer-events:none;' +
        'min-width:190px;max-width:270px;padding:12px 14px;background:rgba(11,16,17,.83);' +
        'border:1px solid rgba(209,210,184,.48);border-radius:5px;color:#f2f1dc;' +
        'font:700 11px Arial,sans-serif;letter-spacing:.08em;text-shadow:0 1px 2px #000}' +
        '#battlePlayerHud .bph-title{font-size:12px;margin-bottom:10px;letter-spacing:.035em}' +
        '#battlePlayerHud .bph-row{display:flex;justify-content:space-between;gap:10px;margin:7px 0 4px}' +
        '#battlePlayerHud .bph-track{height:7px;background:#313c3d;border-radius:2px;overflow:hidden}' +
        '#battlePlayerHud .bph-fill{height:100%;width:100%;transition:width .12s linear}' +
        '#battlePlayerHealthFill{background:#b9c7a4}' +
        '#battlePlayerStaminaFill{background:#a4b9ce}' +
        '#battlePlayerBleeding{margin-top:10px;color:#bdc8b8}' +
        '#battlePlayerBleeding.alert{color:#ff8f81}' +
        '#battlePlayerDamage{position:fixed;left:50%;top:50%;width:min(76vw,76vh);height:min(76vw,76vh);' +
        'border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:10;opacity:0;' +
        'background:conic-gradient(from -25deg, transparent 0deg,rgba(230,22,20,.04) 4deg,' +
        'rgba(238,30,22,.95) 24deg,rgba(255,40,29,.72) 36deg,transparent 57deg 360deg);' +
        '-webkit-mask-image:radial-gradient(circle,transparent 0 50%,#000 72%,transparent 97%);' +
        'mask-image:radial-gradient(circle,transparent 0 50%,#000 72%,transparent 97%);' +
        'filter:blur(13px)}' +
        '#battlePlayerDamage.undirected{background:radial-gradient(circle,transparent 49%,' +
        'rgba(235,31,24,.8) 79%,transparent 98%)}';
      document.head.appendChild(css);
      playerHud = document.createElement('div');
      playerHud.id = 'battlePlayerHud';
      playerHud.innerHTML =
        '<div class="bph-title" id="battlePlayerName"></div>' +
        '<div class="bph-row"><span>HEALTH</span><span id="battlePlayerHealthValue"></span></div>' +
        '<div class="bph-track"><div class="bph-fill" id="battlePlayerHealthFill"></div></div>' +
        '<div class="bph-row"><span>STAMINA</span><span id="battlePlayerStaminaValue"></span></div>' +
        '<div class="bph-track"><div class="bph-fill" id="battlePlayerStaminaFill"></div></div>' +
        '<div id="battlePlayerBleeding" role="status"></div>';
      playerHud.style.display = 'none';
      document.body.appendChild(playerHud);
      playerDamage = document.createElement('div');
      playerDamage.id = 'battlePlayerDamage';
      playerDamage.setAttribute('aria-hidden', 'true');
      document.body.appendChild(playerDamage);
    }
    function updatePlayerFeedback(pad) {
      if (!player || !playerHud) return;
      var wounds = (player.wounds && player.wounds.length) || 0;
      if (wounds > lastWoundCount) {
        damageAt = Date.now();
        var shooter = player._lastHitBy;
        var pos = shooter && shooter.root && shooter.root.position;
        damageOrigin = pos && isFinite(+pos.x) && isFinite(+pos.z) ? { x: +pos.x, z: +pos.z } : null;
        playerRumble(pad, 230, 0.85, 0.65);
      }
      lastWoundCount = wounds;
      var hpMax = +player.maxHp > 0 ? +player.maxHp : 1;
      var hp = clamp((+player.hp || 0) / hpMax, 0, 1);
      document.getElementById('battlePlayerName').textContent = playerLabel();
      document.getElementById('battlePlayerHealthValue').textContent =
        Math.max(0, Math.ceil(+player.hp || 0)) + ' / ' + Math.ceil(hpMax);
      document.getElementById('battlePlayerHealthFill').style.width = (100 * hp).toFixed(1) + '%';
      document.getElementById('battlePlayerStaminaValue').textContent =
        Math.round(playerStamina) + '%' + (playerExhausted ? ' EXHAUSTED' : '');
      document.getElementById('battlePlayerStaminaFill').style.width = playerStamina.toFixed(1) + '%';
      var rate = Math.max(0, +player.bleedRate || 0),
        bleed = document.getElementById('battlePlayerBleeding');
      bleed.textContent =
        rate > 0
          ? 'BLEEDING · ' + rate.toFixed(2) + ' HP/s'
          : wounds
            ? 'WOUNDED · BLEEDING STOPPED'
            : 'NO BLEEDING';
      bleed.classList.toggle('alert', rate > 0);
      var elapsed = Date.now() - damageAt;
      if (elapsed >= 0 && elapsed < 1700) {
        var opacity = (1 - elapsed / 1700) * 0.95;
        playerDamage.style.opacity = opacity.toFixed(3);
        playerDamage.classList.toggle('undirected', !damageOrigin);
        if (damageOrigin && player.root) {
          var here = player.root.position;
          var angle = Math.atan2(damageOrigin.x - here.x, damageOrigin.z - here.z) - playerYaw;
          playerDamage.style.transform =
            'translate(-50%,-50%) rotate(' + ((angle * 180) / Math.PI).toFixed(1) + 'deg)';
        } else playerDamage.style.transform = 'translate(-50%,-50%)';
      } else playerDamage.style.opacity = '0';
    }
    function sprintAllowed(requested, moving, dt) {
      if (requested && moving && !playerExhausted) {
        playerStamina = Math.max(0, playerStamina - SPRINT_DRAIN * dt);
        if (!playerStamina) playerExhausted = true;
        return true; /* The final depleted frame can finish the current running stride. */
      }
      playerStamina = Math.min(
        100,
        playerStamina + (moving ? STAMINA_WALK_RECOVER : STAMINA_IDLE_RECOVER) * dt
      );
      if (playerExhausted && playerStamina >= STAMINA_RESTART) playerExhausted = false;
      return false;
    }

    /* Settings are built from the live roster: only available, living squad members are selectable.
       The dropdown indexes are views, not persistent soldier IDs or gameplay orders. */
    function menuOptions(select, labels, emptyLabel) {
      while (select.firstChild) select.removeChild(select.firstChild);
      if (!labels.length) {
        var empty = document.createElement('option');
        empty.value = '';
        empty.textContent = emptyLabel;
        select.appendChild(empty);
      } else
        labels.forEach(function (name, i) {
          var option = document.createElement('option');
          option.value = String(i);
          option.textContent = name;
          select.appendChild(option);
        });
      select.disabled = !labels.length;
    }
    function fillMenuSoldiers(preferred) {
      var sq = menuSquads[+settingsMenu.querySelector('#bpmSquad').value];
      menuSoldiers = ((sq && sq.members) || []).filter(function (s) {
        return s && !s.dead && s.root;
      });
      menuOptions(
        settingsMenu.querySelector('#bpmSoldier'),
        menuSoldiers.map(function (s) {
          var weapon = s.weapon && (s.weapon.kind || s.weapon.model || s.weapon.name);
          return '#' + s.id + ' · ' + (s.role || 'soldier') + (weapon ? ' · ' + weapon : '');
        }),
        'No living soldiers'
      );
      var i = menuSoldiers.indexOf(preferred);
      if (i >= 0) settingsMenu.querySelector('#bpmSoldier').value = String(i);
      settingsMenu.querySelector('#bpmApply').disabled = !menuSoldiers.length;
    }
    function fillMenuSquads(preferred, soldier) {
      var b = liveBattle(),
        faction = settingsMenu.querySelector('#bpmFaction').value;
      menuSquads = ((b && b.factions[faction] && b.factions[faction].squads) || []).filter(function (sq) {
        return (
          sq &&
          !sq.disbanded &&
          (sq.members || []).some(function (s) {
            return s && !s.dead && s.root;
          })
        );
      });
      menuOptions(
        settingsMenu.querySelector('#bpmSquad'),
        menuSquads.map(function (sq) {
          var living = sq.members.filter(function (s) {
            return s && !s.dead && s.root;
          }).length;
          return 'Unit ' + sq.id + ' · ' + living + ' active';
        }),
        'No active units'
      );
      var i = menuSquads.indexOf(preferred);
      if (i >= 0) settingsMenu.querySelector('#bpmSquad').value = String(i);
      fillMenuSoldiers(soldier);
    }
    function syncMenuFocus() {
      if (!settingsMenu) return;
      var rows = settingsMenu.querySelectorAll('.bpm-field');
      for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('active', menuFocus === i);
    }
    function closePlayerMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      if (settingsMenu) settingsMenu.style.display = 'none';
      var b = menuPauseOwner;
      menuPauseOwner = null;
      if (b && b === liveBattle() && b.paused && !b.winner && typeof b.resume === 'function') b.resume();
      updateHint(activeGamepad());
    }
    function possessSelected() {
      if (!menuOpen) return false;
      var b = liveBattle(),
        faction = settingsMenu.querySelector('#bpmFaction').value,
        sq = menuSquads[+settingsMenu.querySelector('#bpmSquad').value],
        soldier = menuSoldiers[+settingsMenu.querySelector('#bpmSoldier').value];
      /* Guard against stale/dead men after a battle restart. */
      if (
        !b ||
        !sq ||
        !soldier ||
        !b.factions[faction] ||
        b.factions[faction].squads.indexOf(sq) < 0 ||
        (sq.members || []).indexOf(soldier) < 0 ||
        soldier.dead ||
        !soldier.root
      ) {
        fillMenuSquads(null, null);
        return false;
      }
      closePlayerMenu();
      return possessSoldier(soldier);
    }
    function ensurePlayerMenu() {
      if (settingsMenu) return;
      var style = document.createElement('style');
      style.id = 'battlePlayerMenuStyles';
      style.textContent =
        '#battlePlayerSettings{position:fixed;inset:0;z-index:45;display:none;align-items:center;' +
        'justify-content:center;padding:16px;background:#000b;color:#f2f1df;font:12px Arial,sans-serif}' +
        '#battlePlayerSettings section{width:min(420px,94vw);max-height:90vh;overflow:auto;padding:20px;' +
        'border:1px solid #7c9384;border-radius:7px;background:#162426;box-shadow:0 14px 45px #0009}' +
        '#battlePlayerSettings h2{margin:0 0 8px;font-size:20px}' +
        '#battlePlayerSettings p{color:#b6c7c3;line-height:1.5}' +
        '#battlePlayerSettings .bpm-field{display:block;margin:8px -6px;padding:6px;border:2px solid transparent;' +
        'border-radius:5px;font-weight:bold}' +
        '#battlePlayerSettings .bpm-field.active{border-color:#c8c78c;background:#344740}' +
        '#battlePlayerSettings select{box-sizing:border-box;display:block;width:100%;padding:9px;' +
        'margin-top:6px;background:#263a3c;border:1px solid #7a918a;border-radius:4px;color:white}' +
        '#battlePlayerSettings .bpm-field.check{display:flex;gap:10px;align-items:center}' +
        '#battlePlayerSettings .bpm-buttons{display:flex;gap:10px;margin-top:12px}' +
        '#battlePlayerSettings button{flex:1;padding:10px;border-radius:4px;cursor:pointer;' +
        'border:1px solid #8c9e93;color:white;background:#40564f;font-weight:bold}' +
        '#battlePlayerSettings button.primary{background:#668049}' +
        '#battlePlayerSettings button:disabled{opacity:.5;cursor:default}';
      document.head.appendChild(style);
      settingsMenu = document.createElement('div');
      settingsMenu.id = 'battlePlayerSettings';
      settingsMenu.innerHTML =
        '<section role="dialog" aria-modal="true" aria-label="Player settings">' +
        '<h2>PLAYER SETTINGS</h2><p>Choose the faction, unit and soldier to control.</p>' +
        '<label class="bpm-field">FACTION<select id="bpmFaction">' +
        '<option value="us">United States</option><option value="ge">Germany</option></select></label>' +
        '<label class="bpm-field">UNIT / SQUAD<select id="bpmSquad"></select></label>' +
        '<label class="bpm-field">SOLDIER<select id="bpmSoldier"></select></label>' +
        '<label class="bpm-field check"><input type="checkbox" id="bpmHaptics" checked> HAPTIC FEEDBACK</label>' +
        '<div class="bpm-buttons"><button class="primary" id="bpmApply" type="button">DEPLOY</button>' +
        '<button id="bpmClose" type="button">BACK</button></div>' +
        '<p>D-pad ↑↓ field · ←→ choice · A deploy / toggle haptics · B back · tap Menu close.' +
        ' Mouse and touch supported. Click battlefield to resume mouse look.</p></section>';
      document.body.appendChild(settingsMenu);
      settingsMenu.querySelector('#bpmFaction').addEventListener('change', function () {
        fillMenuSquads(null, null);
      });
      settingsMenu.querySelector('#bpmSquad').addEventListener('change', function () {
        fillMenuSoldiers(null);
      });
      settingsMenu.querySelector('#bpmHaptics').addEventListener('change', function (e) {
        playerHapticsEnabled = e.target.checked;
      });
      settingsMenu.querySelector('#bpmApply').addEventListener('click', possessSelected);
      settingsMenu.querySelector('#bpmClose').addEventListener('click', closePlayerMenu);
      var rows = settingsMenu.querySelectorAll('.bpm-field');
      for (var i = 0; i < rows.length; i++)
        (function (n) {
          rows[n].addEventListener('pointerdown', function () {
            menuFocus = n;
            syncMenuFocus();
          });
        })(i);
    }
    function openPlayerMenu() {
      ensurePlayerMenu();
      if (menuOpen) return;
      var b = liveBattle();
      settingsMenu.querySelector('#bpmFaction').value = player ? player.faction : playerFaction;
      settingsMenu.querySelector('#bpmHaptics').checked = playerHapticsEnabled;
      fillMenuSquads(player && player.squad, player);
      menuFocus = 0;
      syncMenuFocus();
      menuOpen = true;
      settingsMenu.style.display = 'flex';
      mouseAim = false;
      mouseFire = false;
      keys.clear();
      if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock();
      menuPauseOwner = null;
      if (b && !b.paused && !b.winner && typeof b.pause === 'function') {
        b.pause();
        menuPauseOwner = b;
      }
    }
    function togglePlayerMenu() {
      if (menuOpen) closePlayerMenu();
      else openPlayerMenu();
    }
    function cycleMenuValue(select, delta) {
      if (!select || select.disabled || select.options.length < 2) return;
      select.selectedIndex = (select.selectedIndex + delta + select.options.length) % select.options.length;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function stepPlayerMenuPad(pad) {
      if (padPressedOnce(pad, 1)) {
        closePlayerMenu();
        return;
      }
      if (padPressedOnce(pad, 12)) menuFocus = (menuFocus + 3) % 4;
      if (padPressedOnce(pad, 13)) menuFocus = (menuFocus + 1) % 4;
      var delta = (padPressedOnce(pad, 15) ? 1 : 0) - (padPressedOnce(pad, 14) ? 1 : 0);
      var fields = ['#bpmFaction', '#bpmSquad', '#bpmSoldier'];
      if (delta && menuFocus < 3) cycleMenuValue(settingsMenu.querySelector(fields[menuFocus]), delta);
      if (delta && menuFocus === 3) {
        var h = settingsMenu.querySelector('#bpmHaptics');
        h.checked = !h.checked;
        playerHapticsEnabled = h.checked;
      }
      if (padPressedOnce(pad, 0)) {
        if (menuFocus === 3) {
          var box = settingsMenu.querySelector('#bpmHaptics');
          box.checked = !box.checked;
          playerHapticsEnabled = box.checked;
        } else possessSelected();
      }
      syncMenuFocus();
    }

    function ensurePlayerCamera() {
      if (playerCam) return playerCam;
      playerCam = new BABYLON.UniversalCamera('playerCam', camera.position.clone(), scene);
      /* Keep the full offset sky dome inside the player camera frustum. The old 1800 m far plane
         sliced its upper cap (radius 1800 m + ~608 m vertical offset), exposing clearColor when looking up. */
      playerCam.inputs.clear();
      playerCam.minZ = 0.06;
      playerCam.maxZ = CAMERA_FAR;
      playerCam.fov = 0.78;
      return playerCam;
    }
    function cameraDirection() {
      var cp = Math.cos(playerPitch);
      return new BABYLON.Vector3(
        Math.sin(playerYaw) * cp,
        -Math.sin(playerPitch),
        Math.cos(playerYaw) * cp
      ).normalize();
    }
    function positionPlayerCamera(aiming) {
      if (!player || !player.root) return;
      var cam = ensurePlayerCamera(),
        p = player.root.position,
        flat = new BABYLON.Vector3(Math.sin(playerYaw), 0, Math.cos(playerYaw)),
        right = new BABYLON.Vector3(Math.cos(playerYaw), 0, -Math.sin(playerYaw)),
        dist = aiming ? PLAYER_AIM_DISTANCE : PLAYER_DISTANCE,
        shoulder = aiming ? 0.48 : 0.72,
        height = player.prone ? 0.86 : player.crouching ? 1.25 : 1.62,
        dir = cameraDirection();
      cam.position.set(
        p.x - flat.x * dist + right.x * shoulder,
        p.y + height,
        p.z - flat.z * dist + right.z * shoulder
      );
      /* A shoulder camera is allowed to rise over a slope, never tunnel into it. */
      var ground = battleSim && battleSim.heightAt ? battleSim.heightAt(cam.position.x, cam.position.z) : p.y;
      if (isFinite(+ground)) cam.position.y = Math.max(cam.position.y, +ground + PLAYER_CAMERA_CLEARANCE);
      cam.setTarget(cam.position.add(dir.scale(50)));
      cam.fov = aiming ? 0.58 : 0.78;
    }
    function aimPoint() {
      if (!playerCam) return null;
      var ray = playerCam.getForwardRay(1),
        o = ray.origin,
        d = ray.direction;
      return { x: o.x + d.x * 80, y: o.y + d.y * 80, z: o.z + d.z * 80 };
    }
    function clearPlayerLease(man, b) {
      if (!man) return;
      man.isPlayer = false;
      if (global.BattleMovementResolver && global.BattleMovementResolver.clearPlayer)
        global.BattleMovementResolver.clearPlayer(man);
      if (global.SquadAI && global.SquadAI.playerAim) global.SquadAI.playerAim(man, null);
      if (global.BattleEngagement && global.BattleEngagement.playerFace)
        global.BattleEngagement.playerFace(man, null);
      if (global.BattleTacticalPositions && global.BattleTacticalPositions.release && b)
        global.BattleTacticalPositions.release(man, b, 'player-release');
    }
    function leavePlayer(reason) {
      if (!player) return;
      if (menuOpen) closePlayerMenu();
      var b = playerBattle || liveBattle(),
        old = player;
      clearPlayerLease(old, b);
      player = null;
      playerBattle = null;
      mouseAim = false;
      mouseFire = false;
      keys.clear();
      ensureReticle().style.display = 'none';
      if (playerHud) playerHud.style.display = 'none';
      if (playerDamage) playerDamage.style.opacity = '0';
      if (playerCam) {
        camera.position.copyFrom(playerCam.position);
        try {
          camera.setTarget(playerCam.getTarget());
        } catch (_) {}
        yaw = camera.rotation.y;
        pitch = camera.rotation.x;
      }
      scene.activeCamera = camera;
      updateHint(activeGamepad());
      global.GTLog('[PLAYER] exited ' + (reason || 'player mode') + ' from ' + old.faction + ' #' + old.id);
    }
    function possessRandom() {
      return possessSoldier(pickPlayerSoldier(player));
    }
    function possessSoldier(next) {
      var b = liveBattle();
      /* This is a possession transfer, never a spawn. Only current living members qualify. */
      if (
        !b ||
        !next ||
        !next.root ||
        next.dead ||
        !b.factions[next.faction] ||
        !b.factions[next.faction].squads.some(function (sq) {
          return (sq.members || []).indexOf(next) >= 0;
        })
      )
        return false;
      if (player) clearPlayerLease(player, playerBattle || b);
      player = next;
      playerBattle = b;
      player.isPlayer = true;
      playerFaction = next.faction;
      playerYaw = +next.root.rotation.y || 0;
      playerPitch = 0;
      playerStamina = 100;
      playerExhausted = false;
      lastWoundCount = (next.wounds && next.wounds.length) || 0;
      damageAt = 0;
      damageOrigin = null;
      lastShotPulse = 0;
      /* isPlayer, not a short movement lease, is the authority boundary for the whole possession. */
      /* Possession starts from a neutral player-owned stance instead of inheriting a squad hold-fire posture. */
      if (global.BattleEngagement && global.BattleEngagement.commitStance)
        global.BattleEngagement.commitStance(next, b, 'stand', 0.45, 'player-possession');
      if (global.BattleTacticalPositions && global.BattleTacticalPositions.release)
        global.BattleTacticalPositions.release(next, b, 'player-control');
      if (global.BattleMovementResolver && global.BattleMovementResolver.proposePlayer) {
        var p = next.root.position;
        global.BattleMovementResolver.proposePlayer(next, { x: p.x, z: p.z }, b, 0.6, {
          speedScale: 1,
          pace: 'walk'
        });
      }
      if (b.paused && b.resume) b.resume();
      var startBtn = document.getElementById('startBtn');
      if (startBtn) startBtn.hidden = true;
      ensureReticle().style.display = 'block';
      ensurePlayerFeedback();
      playerHud.style.display = 'block';
      scene.activeCamera = ensurePlayerCamera();
      positionPlayerCamera(false);
      updateHint(activeGamepad());
      global.GTLog('[PLAYER] controlling ' + playerLabel() + ' · faction locked ' + playerFaction);
      return true;
    }
    function setPlayerStance(b, stance) {
      if (!player || !global.BattleEngagement || !global.BattleEngagement.commitStance) return;
      global.BattleEngagement.commitStance(player, b, stance, 0.45, 'player');
    }
    function playerStance() {
      return (
        (player && player.eng && player.eng.stance) ||
        (player && player.prone ? 'prone' : player && player.crouching ? 'crouch' : 'stand')
      );
    }
    function togglePlayerCrouch(b) {
      var st = playerStance();
      setPlayerStance(b, st === 'crouch' ? 'stand' : 'crouch');
    }
    function togglePlayerProne(b) {
      var st = playerStance();
      setPlayerStance(b, st === 'prone' || st === 'crawl' ? 'stand' : 'prone');
    }
    function stepPlayer(pad, dt) {
      var b = liveBattle();
      if (!b || !player) return;
      if (playerBattle !== b) {
        leavePlayer('battle restarted');
        return;
      }
      if (player.dead) {
        if (!possessRandom()) leavePlayer('no living ' + playerFaction + ' soldiers');
        return;
      }
      var axes = (pad && pad.axes) || [],
        mx = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + shapedAxis(axes[0]),
        my = (keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0) - shapedAxis(axes[1]),
        lx = shapedAxis(axes[2]),
        ly = shapedAxis(axes[3]),
        aiming = mouseAim || buttonValue(pad, 6) > 0.35,
        firing = mouseFire || buttonValue(pad, 7) > 0.35,
        runRequested = (keys.has('shift') || buttonValue(pad, 10) > 0.5) && !aiming;
      playerYaw += lx * PLAYER_LOOK_RATE * dt;
      playerPitch = clamp(playerPitch + ly * 1.55 * dt, -0.62, 0.78);
      if (pad && padPressedOnce(pad, 1)) togglePlayerCrouch(b);
      if (pad && padPressedOnce(pad, 0)) togglePlayerProne(b);
      var flat = new BABYLON.Vector3(Math.sin(playerYaw), 0, Math.cos(playerYaw)),
        right = new BABYLON.Vector3(Math.cos(playerYaw), 0, -Math.sin(playerYaw)),
        move = flat.scale(my).add(right.scale(mx));
      if (move.lengthSquared() > 1) move.normalize();
      var moving = move.lengthSquared() > 0.0025,
        p = player.root.position,
        next = moving
          ? { x: p.x + move.x * PLAYER_MOVE_AHEAD, z: p.z + move.z * PLAYER_MOVE_AHEAD }
          : { x: p.x, z: p.z };
      var running = b.paused || b.winner ? false : sprintAllowed(runRequested, moving, dt);
      if (player.prone && moving) setPlayerStance(b, 'crawl');
      else if (player.eng && player.eng.stance === 'crawl' && !moving) setPlayerStance(b, 'prone');
      if (global.BattleMovementResolver && global.BattleMovementResolver.proposePlayer)
        global.BattleMovementResolver.proposePlayer(player, next, b, 0.6, {
          speedScale: 1,
          pace: running ? 'run' : 'walk'
        });
      positionPlayerCamera(aiming);
      var point = aimPoint();
      if (global.BattleEngagement && global.BattleEngagement.playerFace)
        global.BattleEngagement.playerFace(player, aiming || firing ? point : null);
      /* No aim assist: the crosshair is the aim. The soldier's own targeting stays off while possessed. */
      if (global.SquadAI && global.SquadAI.playerAim)
        global.SquadAI.playerAim(player, aiming || firing ? point : null);
      /* RT is a real trigger, not an AI target request: it fires the crosshair ray even with no lock. */
      if (firing && point && global.SquadAI) {
        if (global.SquadAI.playerFireRay && global.SquadAI.playerFireRay(player, point, b)) {
          var shotTime = Date.now();
          if (shotTime - lastShotPulse >= 80) {
            playerRumble(pad, 45, 0.28, 0.52);
            lastShotPulse = shotTime;
          }
        }
      }
    }
    canvas.addEventListener('click', function () {
      canvas.focus();
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock && canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', function () {
      active = document.pointerLockElement === canvas;
      if (!active) {
        keys.clear();
        mouseAim = false;
        mouseFire = false;
      }
    });
    document.addEventListener('mousemove', function (event) {
      if (!active) return;
      if (player) {
        playerYaw += event.movementX * LOOK_X;
        playerPitch = clamp(playerPitch + event.movementY * LOOK_Y, -0.62, 0.78);
        return;
      }
      yaw += event.movementX * LOOK_X;
      pitch += event.movementY * LOOK_Y;
      pitch = clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
    });
    canvas.addEventListener('mousedown', function (event) {
      if (!player) return;
      if (event.button === 0) mouseFire = true;
      else if (event.button === 2) mouseAim = true;
      else return;
      event.preventDefault();
    });
    window.addEventListener('mouseup', function (event) {
      if (event.button === 0) mouseFire = false;
      else if (event.button === 2) mouseAim = false;
    });
    canvas.addEventListener('contextmenu', function (event) {
      if (player) event.preventDefault();
    });
    window.addEventListener(
      'keydown',
      function (event) {
        var key = keyName(event);
        if (key === 'o' && !event.repeat && !editableTarget(event.target)) {
          togglePlayerMenu();
          event.preventDefault();
          return;
        }
        if (menuOpen && key === 'escape') {
          closePlayerMenu();
          event.preventDefault();
          return;
        }
        if (menuOpen) {
          /* Keyboard users can operate the native dropdowns and buttons. No possession,
             stance, movement or fire shortcuts leak through the settings modal. */
          return;
        }
        if (editableTarget(event.target)) return;
        if (key === 'p') {
          if (!event.repeat) {
            possessRandom();
            canvas.focus();
            if (document.pointerLockElement !== canvas && canvas.requestPointerLock)
              try {
                canvas.requestPointerLock();
              } catch (_) {}
          }
          event.preventDefault();
          return;
        }
        if (player) {
          var b = liveBattle();
          if (key === 'v') {
            if (!event.repeat) leavePlayer('V key');
            event.preventDefault();
            return;
          }
          if (key === 'c') {
            if (!event.repeat) togglePlayerCrouch(b);
            event.preventDefault();
            return;
          }
          if (key === 'z') {
            if (!event.repeat) togglePlayerProne(b);
            event.preventDefault();
            return;
          }
          if (playerMovementKey(key)) {
            keys.add(key);
            event.preventDefault();
          }
          return;
        }
        if (!guarded() || !movementKey(key)) return;
        keys.add(key);
        event.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener('keyup', function (event) {
      keys.delete(keyName(event));
    });
    window.addEventListener('blur', function () {
      keys.clear();
      mouseAim = false;
      mouseFire = false;
    });
    window.addEventListener('gamepadconnected', function (e) {
      padId = (e.gamepad && e.gamepad.id) || 'gamepad';
      padButtons = {};
      updateHint(e.gamepad);
      global.GTLog('[CAMERA] gamepad connected: ' + padId);
    });
    window.addEventListener('gamepaddisconnected', function (e) {
      if (!e.gamepad || !padId || e.gamepad.id === padId) {
        padId = null;
        padButtons = {};
        updateHint(null);
      }
      global.GTLog('[CAMERA] gamepad disconnected; keyboard controls remain active');
    });
    canvas.addEventListener(
      'wheel',
      function (event) {
        if (!guarded() || player) return;
        event.preventDefault();
        var pixels = event.deltaY * (DELTA_UNIT_PX[event.deltaMode] || 1);
        throttle = clamp(throttle * Math.exp(-pixels * THROTTLE_PER_PIXEL), THROTTLE_MIN, 1);
      },
      { passive: false }
    );
    scene.onBeforeRenderObservable.add(function () {
      var dt = Math.min(0.05, engine.getDeltaTime() / 1000),
        pad = activeGamepad();
      if (pad && pad.id !== padId) {
        padId = pad.id;
        padButtons = {};
        updateHint(pad);
        global.GTLog('[CAMERA] gamepad active: ' + padId);
      }
      if (!pad && padId) {
        padId = null;
        padButtons = {};
        menuHoldState.down = false;
        updateHint(null);
      }
      /* A quick Start release still enters/switches soldiers; holding opens the
         settings panel once at 650 ms and cannot also invoke the tap on release. */
      var menuGesture = menuHoldGesture(menuHoldState, !!pad && buttonValue(pad, 9) > 0.5, Date.now());
      if (menuGesture === 'hold') {
        togglePlayerMenu();
        if (pad) refreshPadButtons(pad);
        return;
      }
      if (menuGesture === 'tap') {
        if (menuOpen) closePlayerMenu();
        else possessRandom();
        if (pad) refreshPadButtons(pad);
        return;
      }
      if (menuOpen) {
        if (pad) {
          stepPlayerMenuPad(pad);
          refreshPadButtons(pad);
        }
        if (player) updatePlayerFeedback(pad);
        return;
      }
      if (menuHoldState.down) {
        if (pad) refreshPadButtons(pad);
        return;
      }
      if (pad && player && padPressedOnce(pad, 8)) {
        leavePlayer('View button');
        refreshPadButtons(pad);
        return;
      }
      if (player) {
        stepPlayer(pad, dt);
        updatePlayerFeedback(pad);
        if (pad) refreshPadButtons(pad);
        return;
      }

      /* Keyboard fly controls are independent of gamepad presence. The old early return above this
         block recorded keydown state correctly but skipped every movement frame unless a pad existed. */
      var f = (keys.has('w') ? 1 : 0) - (keys.has('s') ? 1 : 0),
        r = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0),
        v = (keys.has('e') ? 1 : 0) - (keys.has('q') ? 1 : 0),
        padSprint = false,
        padPrecision = false;
      if (pad) {
        var axes = pad.axes || [];
        r += shapedAxis(axes[0]);
        f += -shapedAxis(axes[1]);
        yaw += shapedAxis(axes[2]) * PAD_LOOK_RATE * dt;
        pitch += shapedAxis(axes[3]) * PAD_LOOK_RATE * dt;
        pitch = clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
        v += buttonValue(pad, 7) - buttonValue(pad, 6);
        padPrecision = buttonValue(pad, 4) > 0.5;
        padSprint = buttonValue(pad, 5) > 0.5;
        if (padPressedOnce(pad, 12)) throttle = clamp(throttle * PAD_THROTTLE_STEP, THROTTLE_MIN, 1);
        if (padPressedOnce(pad, 13)) throttle = clamp(throttle / PAD_THROTTLE_STEP, THROTTLE_MIN, 1);
        if (padPressedOnce(pad, 3)) {
          pitch = 0;
          camera.rotation.x = 0;
        }
        refreshPadButtons(pad);
      }
      if (!f && !r && !v) return;
      var forward = camera.getForwardRay().direction.clone();
      forward.y = 0;
      if (forward.lengthSquared() > 1e-8) forward.normalize();
      var up = BABYLON.Axis.Y,
        right2 = scene.useRightHandedSystem
          ? BABYLON.Vector3.Cross(forward, up)
          : BABYLON.Vector3.Cross(up, forward);
      if (right2.lengthSquared() > 1e-8) right2.normalize();
      var move2 = BABYLON.Vector3.Zero();
      if (f) move2.addInPlace(forward.scale(f));
      if (r) move2.addInPlace(right2.scale(r));
      if (move2.lengthSquared() > 1) move2.normalize();
      var speed = (keys.has('shift') || padSprint ? FLY_SPRINT : FLY_SPEED) * throttle;
      if (padPrecision && !padSprint) speed *= PAD_PRECISION;
      camera.position.addInPlace(move2.scale(speed * dt));
      camera.position.y += clamp(v, -1, 1) * speed * 0.7 * dt;
      var halfW = battleSim.FIELD_W / 2 - 2,
        halfD = battleSim.FIELD_D / 2 - 2;
      camera.position.x = clamp(camera.position.x, -halfW, halfW);
      camera.position.z = clamp(camera.position.z, -halfD, halfD);
      camera.position.y = clamp(
        camera.position.y,
        battleSim.heightAt(camera.position.x, camera.position.z) + GROUND_CLEARANCE,
        MAX_HEIGHT
      );
    });
    updateHint(activeGamepad());
    return {
      camera: camera,
      desktop: true,
      hint: KEY_HINT + (activeGamepad() ? ' · ' + PAD_HINT : ''),
      player: function () {
        return player;
      },
      exitPlayer: function () {
        leavePlayer('API');
      },
      openPlayerSettings: openPlayerMenu
    };
  }
  /* Normal-play presentation camera for visual testing. `?follow=1` follows the busiest living soldier from a close, persistent ArcRotate camera.
     `?orbit=1` implies follow and slowly circles him. The camera never writes simulation state;
     it only reads the roster/root transforms, and three sim seconds after the followed man dies it
     transfers to the nearest survivor. `followDist` and `orbitSpeed` are intentionally URL-driven so
     screenshots and visual QA are reproducible without touching benchmark-only camera code. */
  function createPersistentFollow(options, target, q) {
    var scene = options.scene,
      canvas = options.canvas,
      engine = options.engine,
      orbit = q.get('orbit') === '1',
      distance = queryNumber(q, 'followDist', FOLLOW_DEFAULT, FOLLOW_MIN, FOLLOW_MAX),
      orbitSpeed = queryNumber(q, 'orbitSpeed', ORBIT_SPEED, -1.5, 1.5),
      height = queryNumber(q, 'followHeight', FOLLOW_HEIGHT, 0.2, 3),
      beta = queryNumber(q, 'followBeta', FOLLOW_BETA, 0.4, 1.48),
      alpha = queryNumber(q, 'followAlpha', -Math.PI / 2, -Math.PI * 4, Math.PI * 4),
      cam = new BABYLON.ArcRotateCamera(
        'followCam',
        alpha,
        beta,
        distance,
        target.clone ? target.clone() : target,
        scene
      );
    cam.minZ = 0.08;
    cam.maxZ = CAMERA_FAR;
    cam.lowerRadiusLimit = FOLLOW_MIN;
    cam.upperRadiusLimit = FOLLOW_MAX;
    cam.lowerBetaLimit = 0.35;
    cam.upperBetaLimit = 1.5;
    cam.wheelPrecision = 18;
    cam.panningSensibility = 0;
    cam.attachControl(canvas, true);
    scene.activeCamera = cam;
    var man = null,
      deadAt = null,
      lastWall = global.performance && performance.now ? performance.now() : Date.now(),
      info = {
        mode: 'follow',
        distance: distance,
        orbit: orbit,
        orbitSpeed: orbitSpeed,
        height: height,
        current: null,
        followed: [],
        switches: 0
      };
    var obs = scene.onBeforeRenderObservable.add(function persistentFollowCamera() {
      var wallNow = global.performance && performance.now ? performance.now() : Date.now(),
        orbitDt = Math.min(2, Math.max(0, (wallNow - lastWall) / 1000));
      lastWall = wallNow;
      var b = global.__battle__;
      if (!b || !b._roster) return;
      var roster = (b._roster.us || []).concat(b._roster.ge || []);
      if (man && roster.indexOf(man) < 0) {
        man = null;
        deadAt = null;
      }
      var all = livingSoldiers(b);
      if (!man && all.length) {
        man = busiestSoldier(all);
        deadAt = null;
        if (man) {
          info.current = man.id;
          if (info.followed.length < 100) info.followed.push(man.id);
          /* First acquisition should open on the soldier, not spend a second flying in from the
             scenario centre. Later motion stays smoothed. */
          var first = man.root.position;
          cam.target.set(first.x, first.y + height, first.z);
        }
      }
      if (!man) return;
      if (man.dead) {
        if (deadAt == null) deadAt = b.time;
        if (b.time - deadAt >= 3 && all.length) {
          var next = nearestLiving(all, man.root.position);
          if (next) {
            man = next;
            deadAt = null;
            info.current = man.id;
            info.switches++;
            if (info.followed.length < 100) info.followed.push(man.id);
          }
        }
      } else deadAt = null;
      if (!man.root) return;
      var t = man.root.position,
        rawDt = Math.max(0, engine.getDeltaTime() / 1000),
        smoothDt = Math.min(0.05, rawDt),
        k = 1 - Math.exp(-smoothDt * 12);
      cam.target.x += (t.x - cam.target.x) * k;
      cam.target.y += (t.y + height - cam.target.y) * k;
      cam.target.z += (t.z - cam.target.z) * k;
      /* Orbit is a real-time inspection speed, not a per-frame speed. Do not apply the follow
         smoothing clamp here or low-FPS devices/headless validation orbit in slow motion. */
      if (orbit) cam.alpha += orbitSpeed * orbitDt;
      info.current = man.id;
      info.radius = cam.radius;
      info.alpha = cam.alpha;
      info.beta = cam.beta;
    });
    var hint =
      (orbit ? 'Follow orbit' : 'Follow camera') +
      ': ' +
      distance.toFixed(distance % 1 ? 1 : 0) +
      ' m · drag to orbit · wheel zoom' +
      (orbit ? ' · auto ' + orbitSpeed.toFixed(2) + ' rad/s' : '') +
      ' · switches on death';
    return {
      camera: cam,
      desktop: false,
      hint: hint,
      mode: 'follow',
      follow: info,
      stop: function () {
        scene.onBeforeRenderObservable.remove(obs);
        try {
          cam.detachControl(canvas);
        } catch (_) {}
      }
    };
  }

  function createAdaptive(options, target) {
    var scene = options.scene,
      canvas = options.canvas,
      engine = options.engine,
      battleSim = options.battleSim,
      q = queryParams(),
      followRequested = q.get('follow') === '1' || q.get('orbit') === '1';
    if (followRequested) return createPersistentFollow(options, target, q);
    var initialPad = activeGamepad();
    var initial =
      desktopPointer() || initialPad
        ? createDesktopFly(scene, canvas, target, engine, battleSim)
        : createTouchOrbit(scene, canvas, target);
    var state = { camera: initial.camera, desktop: initial.desktop, hint: initial.hint };
    var wakeObserver = null;
    function setHint(text) {
      var el = document.getElementById('cameraHint');
      if (el) el.textContent = text;
    }
    function switchToGamepad(pad, source) {
      if (state.desktop) return;
      pad = pad || activeGamepad();
      if (!pad) return;
      var old = state.camera,
        pose = cameraPose(old, target);
      try {
        if (old && old.detachControl) old.detachControl(canvas);
      } catch (_) {}
      try {
        if (old && old.dispose) old.dispose();
      } catch (_) {}
      var next = createDesktopFly(scene, canvas, target, engine, battleSim, pose);
      state.camera = next.camera;
      state.desktop = true;
      state.hint = next.hint;
      setHint(next.hint);
      if (wakeObserver) {
        scene.onBeforeRenderObservable.remove(wakeObserver);
        wakeObserver = null;
      }
      global.GTLog(
        '[CAMERA] gamepad wake switched touch orbit to fly (' + source + '): ' + (pad.id || 'gamepad')
      );
    }
    if (!state.desktop && hasGamepadAPI()) {
      global.addEventListener('gamepadconnected', function (e) {
        switchToGamepad(e && e.gamepad, 'event');
      });
      /* iOS/WebKit can withhold a Bluetooth controller from getGamepads() until user input.
         Poll while touch-orbit is active so either a stick movement or button press that exposes
         the pad can hand control to the fly camera without a reload. */
      wakeObserver = scene.onBeforeRenderObservable.add(function () {
        var pad = activeGamepad();
        if (pad) switchToGamepad(pad, 'poll');
      });
    }
    return state;
  }
  global.BattleDesktopCamera = {
    current: null,
    menuHoldGesture: menuHoldGesture,
    menuHoldMs: MENU_HOLD_MS,
    create: function (options) {
      var target = new BABYLON.Vector3(options.scenario.center.x, 4, options.scenario.center.z);
      var result = createAdaptive(options, target);
      global.BattleDesktopCamera.current = result;
      if (result.mode === 'follow') {
        global.GTLog(
          '[CAMERA] persistent follow active · distance=' +
            result.follow.distance +
            'm · orbit=' +
            (result.follow.orbit ? 'on' : 'off') +
            ' · orbitSpeed=' +
            result.follow.orbitSpeed
        );
      } else {
        global.GTLog(
          '[CAMERA] ' +
            (result.desktop
              ? 'ww2fps Model Lab desktop/gamepad fly controls'
              : 'touch orbit controls; waiting for gamepad wake') +
            ' active'
        );
      }
      return result;
    }
  };
})(window);
