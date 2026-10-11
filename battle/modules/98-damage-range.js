/* Damage Range: opt-in visual QA lineup for the real soldier/damage pipeline.
   ?damageRange=1 turns the normal battle into a presentation-only firing range:
   - one real US rifleman is the shooter;
   - one US + one GE soldier for every infantry role stand in a fixed lineup;
   - the normal AI/movement step is disabled, but render-time animation/particles keep running;
   - Fire goes through the shipping onFire/onShot wrappers, so muzzle flash/audio, tracer,
     combat.hit, blood bursts, ground spray and UV-painted entry/exit wounds are the real systems.
   No gameplay damage is synthesized by Fire; Kill is explicit so wound accumulation can be viewed
   without the target dropping after one random combat result.

   URL controls: damageRange=1, rangeTarget=0..9, rangeZone=head|chest|abdomen|arm|leg,
   rangeExit=0|1, rangeAuto=0|1, rangeInterval=seconds, rangeOrbit=0|1, rangeDist=metres,
   rangeUi=full|compact, rangeFps=0|1. Xbox controls work in both manual and auto range modes. */
(function (root) {
  'use strict';
  if (
    !root.BattleSim ||
    !root.BattleModules ||
    typeof BABYLON === 'undefined' ||
    typeof document === 'undefined'
  )
    return;
  var q = new URLSearchParams((root.location && root.location.search) || '');
  if (q.get('damageRange') !== '1') {
    root.BattleDamageRange = { active: false };
    return;
  }
  var oldStart = root.BattleSim.start,
    ROLES = ['rifleman', 'sergeant', 'scout', 'gunner', 'engineer'],
    ZONES = ['head', 'chest', 'abdomen', 'arm', 'leg'],
    api = { active: true, ready: false, version: '1.2-fps-aim' };
  root.BattleDamageRange = api;

  var clamp = root.GTMath.clamp;
  function num(name, fallback, a, b) {
    var v = +q.get(name);
    return isFinite(v) ? clamp(v, a, b) : fallback;
  }
  function label(s) {
    return (s.faction === 'us' ? 'US' : 'GER') + ' ' + s.role;
  }
  function pickRole(sim, faction, role, skip) {
    var a = (sim._roster[faction] || []).filter(function (s) {
      return s && s.role === role && s !== skip;
    });
    return a[0] || null;
  }
  function setEnabled(s, on) {
    if (!s || !s.root) return;
    try {
      s.root.setEnabled(!!on);
    } catch (_) {}
  }
  function neutral(s, sim) {
    if (!s) return;
    s.destination = null;
    s.target = null;
    s._faceHint = null;
    s.moveSpeed = 0;
    s.moving = false;
    s.reloading = false;
    s.reloadUntil = 0;
    /* Even this presentation-only range respects the shipped stance ownership contract: Engagement
       is the only writer. The huge hold is harmless because normal AI is disabled in range mode. */
    try {
      if (root.BattleEngagement && root.BattleEngagement.commitStance)
        root.BattleEngagement.commitStance(s, sim, 'stand', 1e9);
    } catch (_) {}
  }
  /* Pure damage-range geometry: independent of canvas, UI or controller state.
     Keep the real shipped hit/through-shot shape (including entry/exit offsets). */
  function rangeZonePoint(t, z, serial) {
    var y = { head: 1.7, chest: 1.34, abdomen: 1.06, arm: 1.33, leg: 0.69 }[z] || 1.34,
      side = serial & 1 ? 1 : -1,
      xoff = z === 'arm' ? 0.28 * side : z === 'leg' ? 0.13 * side : 0;
    return { x: t.root.position.x + xoff, y: t.root.position.y + y, z: t.root.position.z };
  }

  function rangeShot(t, z, p, dir, exit, backZ) {
    var entry = { x: p.x, y: p.y, z: p.z - 0.22 },
      leave = exit ? { x: p.x, y: p.y, z: p.z + 0.22 } : null,
      pass = {
        victim: t,
        zone: z,
        entry: entry,
        exit: leave,
        direction: dir,
        exitDirection: leave ? dir : undefined
      };
    return {
      mode: 'raycast',
      stoppedBy: 'soldier',
      surface: 'blood',
      victim: t,
      zone: z,
      impact: entry,
      normal: { x: 0, y: 0, z: -1 },
      direction: dir,
      delay: 0,
      passes: [pass],
      final: leave
        ? {
            stoppedBy: 'environment',
            surface: 'cement',
            blocker: 'wall',
            impact: { x: p.x, y: p.y, z: backZ - 0.14 },
            normal: { x: 0, y: 0, z: -1 }
          }
        : null
    };
  }

  /* Immutable display templates; the range setup owns all stateful listeners and cameras. */
  function rangePanelCss() {
    return (
      '#damageRangePanel{position:fixed;left:12px;bottom:12px;z-index:2147483000;box-sizing:border-box;width:min(560px,calc(100vw - 24px));' +
      'font:13px/1.25 system-ui,-apple-system,sans-serif;background:rgba(18,18,18,.88);color:#fff;padding:10px 12px;' +
      'border:1px solid rgba(255,255,255,.2);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.35)}' +
      '#damageRangePanel .rangeHeader{display:flex;gap:8px;align-items:center;min-width:0}' +
      '#damageRangePanel .rangeHeader h2{font-size:14px;margin:0;letter-spacing:.03em;white-space:nowrap}' +
      '#rangeReadout{opacity:.82;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}' +
      '#rangeCollapse{margin-left:auto;padding:3px 8px!important;line-height:1.1}' +
      '#damageRangePanel .rangeRow{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:7px}' +
      '#damageRangePanel button,#damageRangePanel select{font:inherit;padding:6px 9px}' +
      '#damageRangePanel button.rangeFire{font-weight:700;padding-left:18px;padding-right:18px}' +
      '#damageRangePanel label{display:flex;gap:4px;align-items:center}#damageRangePanel small{opacity:.72}' +
      '#damageRangePanel.rangeCollapsed{width:min(430px,calc(100vw - 24px));padding:8px 10px}' +
      '#damageRangePanel.rangeCollapsed #rangeControls{display:none}' +
      '#rangeReticle{display:none;position:fixed;left:50%;top:50%;width:24px;height:24px;transform:translate(-50%,-50%);z-index:2147482998;pointer-events:none}' +
      '#rangeReticle:before,#rangeReticle:after{content:"";position:absolute;background:rgba(255,255,255,.92);box-shadow:0 0 2px rgba(0,0,0,.9)}' +
      '#rangeReticle:before{left:11px;top:2px;width:2px;height:20px}#rangeReticle:after{left:2px;top:11px;width:20px;height:2px}' +
      '#rangeReticle i{position:absolute;left:9px;top:9px;width:6px;height:6px;border:1px solid rgba(255,255,255,.95);border-radius:50%;box-sizing:border-box}' +
      '@media (max-width:900px) and (orientation:landscape){#damageRangePanel{left:10px;bottom:10px;width:min(400px,calc(100vw - 20px));font-size:12px;padding:8px 9px}' +
      '#damageRangePanel.rangeCollapsed{width:min(360px,calc(100vw - 20px))}#damageRangePanel button,#damageRangePanel select{padding:5px 7px}}'
    );
  }

  function rangePanelMarkup() {
    return (
      '<div class="rangeHeader"><h2>DAMAGE RANGE</h2><span id="rangeReadout"></span><button id="rangeCollapse" type="button" aria-label="Toggle range controls">▾</button></div>' +
      '<div id="rangeControls">' +
      '<div class="rangeRow"><button id="rangePrev">◀</button><select id="rangeTarget"></select><button id="rangeNext">▶</button>' +
      '<select id="rangeZone"><option>head</option><option>chest</option><option>abdomen</option><option>arm</option><option>leg</option></select>' +
      '<label><input id="rangeExit" type="checkbox"> exit</label><label><input id="rangeOrbit" type="checkbox"> orbit</label>' +
      '<label><input id="rangeAuto" type="checkbox"> auto</label><label><input id="rangeFps" type="checkbox"> FPS aim</label></div>' +
      '<div class="rangeRow"><button class="rangeFire" id="rangeFire">FIRE</button><button id="rangeBurst">3-shot</button>' +
      '<button id="rangeKill">Kill</button><button id="rangeClear">Clear blood</button><button id="rangeReset">Reset range</button></div>' +
      '<div class="rangeRow"><small>Keyboard: Space fire · ←/→ target · 1–5 zone · F FPS aim · E exit · O orbit · A auto · C clear</small></div>' +
      '<div class="rangeRow"><small>FPS aim: drag/mouse to aim · centered reticle · shots follow the reticle</small></div>' +
      '<div class="rangeRow"><small>Xbox: A/RT fire in FPS · X 3-shot · D-pad target/zone · Menu FPS · Y auto · B clear · LB exit · RB orbit · RS aim/orbit · LT ADS · R3 kill · View UI</small></div>' +
      '</div>'
    );
  }

  /* Pure input decoding: do not read DOM, cameras or mutable range state here.
     UI, keyboard and Xbox actions execute via the one stateful range dispatcher. */
  function shapedAxis(v) {
    v = isFinite(+v) ? +v : 0;
    var a = Math.abs(v),
      dead = 0.18;
    if (a <= dead) return 0;
    return (Math.sign(v) * (a - dead)) / (1 - dead);
  }
  function buttonValue(pad, index) {
    var b = pad && pad.buttons && pad.buttons[index];
    return b ? Math.max(b.pressed ? 1 : 0, +b.value || 0) : 0;
  }
  function rangeKeyboardAction(code, key) {
    if (code === 'Space') return 'fire';
    if (code === 'ArrowLeft') return 'previousTarget';
    if (code === 'ArrowRight') return 'nextTarget';
    if (/^Digit[1-5]$/.test(code)) return 'zone:' + ZONES[+code.slice(5) - 1];
    var k = (key || '').toLowerCase();
    return { e: 'toggleExit', o: 'toggleOrbit', a: 'toggleAuto', f: 'toggleFps', c: 'clear' }[k] || null;
  }
  function rangePadCommands(pad, inFps, previousButtons) {
    var buttons = {},
      actions = [],
      previous = previousButtons || {};
    for (var i = 0; i <= 16; i++) buttons[i] = buttonValue(pad, i) > 0.5;
    /* This ordering is intentional: simultaneous A/RT fire twice before B,
       exactly as the previous padOnce dispatch. RT fires only in FPS mode. */
    var bindings = [
      [0, 'fire'],
      [7, inFps ? 'fire' : null],
      [1, 'clear'],
      [2, 'burst3'],
      [3, 'toggleAuto'],
      [4, 'toggleExit'],
      [5, 'toggleOrbit'],
      [8, 'togglePanel'],
      [9, 'toggleFps'],
      [11, 'kill'],
      [12, 'previousZone'],
      [13, 'nextZone'],
      [14, 'previousTarget'],
      [15, 'nextTarget']
    ];
    bindings.forEach(function (pair) {
      if (pair[1] && buttons[pair[0]] && !previous[pair[0]]) actions.push(pair[1]);
    });
    return { actions: actions, buttons: buttons };
  }

  function setup(sim) {
    return root.BattleDamageRangeSession.create({
      sim: sim,
      q: q,
      api: api,
      ROLES: ROLES,
      ZONES: ZONES,
      clamp: clamp,
      num: num,
      label: label,
      pickRole: pickRole,
      setEnabled: setEnabled,
      neutral: neutral,
      rangeZonePoint: rangeZonePoint,
      rangeShot: rangeShot,
      rangePanelCss: rangePanelCss,
      rangePanelMarkup: rangePanelMarkup,
      shapedAxis: shapedAxis,
      buttonValue: buttonValue,
      rangeKeyboardAction: rangeKeyboardAction,
      rangePadCommands: rangePadCommands
    });
  }

  root.BattleSim.start = function (scene, opts) {
    return setup(oldStart(scene, opts));
  };
  root.BattleModules.registerSystem('damage-range', { version: '1.2-fps-aim' });
})(typeof window !== 'undefined' ? window : globalThis);
