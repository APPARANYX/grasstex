/* Isolated, observable native tactical Skills Lab.
   Live BattleSim/Meso/Engagement/MovementResolver, same soldier targets and
   real ballistic/suppression gates. Only target mortality, fire and movement
   are disabled. Visual standees are not ballistic or Navigation geometry.
   A staged retreat is explicitly a scripted premise, not AI discovery. */
(function (root) {
  'use strict';
  if (!root.SKILLS_LAB || !root.PHASE_C_COMBAT_LAB || !root.BATTLE_PREVIEW) return;
  var params = new URLSearchParams(root.location.search);
  var scale = Number(params.get('labRange') || 1);
  if (![1, 0.5, 0.25].includes(scale)) scale = 1;
  var distanceM = Number(params.get('labDistance') || 70);
  if (![35, 70, 120, 180].includes(distanceM)) distanceM = 70;
  var focus = params.get('labFocus') || 'all';
  if (!['all', 'fire', 'bounds', 'station'].includes(focus)) focus = 'all';
  var battle = null,
    scene = null,
    panel = null,
    toggle = null,
    play = null;
  var shots = 0,
    hits = 0,
    supporters = 0,
    ticks = 0,
    lastTime = -1;
  var history = [],
    seenEvents = new Set(),
    dummies = new WeakSet(),
    vectors = [];
  var materials = null,
    timer = null;
  var lastError = null;

  function log(kind, message) {
    history.push({ t: battle ? +battle.time.toFixed(2) : 0, kind: kind, message: message });
    if (history.length > 120) history.shift();
  }
  function visible(el, show) {
    if (el) el.hidden = !show;
  }
  function configure(name, value) {
    var p = new URLSearchParams(root.location.search);
    p.set(name, value);
    p.set('skillsLab', '1');
    p.set('combatLab', '1');
    root.location.search = p.toString();
  }
  function installCamera(opts) {
    var old = root.BattleDesktopCamera.current;
    if (old && old.stop) old.stop();
    var c = new BABYLON.ArcRotateCamera(
      'skills-range-camera',
      -Math.PI / 2,
      0.7,
      205,
      new BABYLON.Vector3(0, 0, 0),
      opts.scene
    );
    c.lowerRadiusLimit = 12;
    c.upperRadiusLimit = 340;
    c.lowerBetaLimit = 0.08;
    c.upperBetaLimit = 1.35;
    c.panningSensibility = 260;
    c.wheelPrecision = 12;
    c.attachControl(opts.canvas, true);
    opts.scene.activeCamera = c;
    var out = {
      camera: c,
      desktop: false,
      hint: 'Skills Lab · orbit to inspect soldiers, scroll to zoom',
      mode: 'skills-lab',
      stop: function () {
        c.detachControl(opts.canvas);
      }
    };
    root.BattleDesktopCamera.current = out;
    return out;
  }
  function material(id, color) {
    var m = new BABYLON.StandardMaterial(id, scene);
    m.diffuseColor = BABYLON.Color3.FromHexString(color);
    m.specularColor = BABYLON.Color3.Black();
    return m;
  }
  function buildMaterials() {
    if (materials) return;
    materials = {
      wood: material('skill-range-wood', '#79654a'),
      canvas: material('skill-range-canvas', '#d8c39a'),
      ring: material('skill-range-ring', '#a63629'),
      sand: material('skill-range-sand', '#89805c')
    };
  }
  function decorate() {
    if (!battle || !scene) return;
    buildMaterials();
    (battle._roster.ge || []).forEach(function (s) {
      if (!s || !s.root || s.dead) return;
      /* Keep the real soldier entity, perceivable position and hit/suppression
         volumes. Suppress its meshes only; a target board is a visual proxy. */
      s.root.getChildMeshes(false).forEach(function (m) {
        if (m.metadata && m.metadata.skillsLabTarget) return;
        m.isVisible = false;
      });
      if (dummies.has(s)) return;
      dummies.add(s);
      function part(kind, dims, xyz, mat) {
        var m =
          kind === 'cylinder'
            ? BABYLON.MeshBuilder.CreateCylinder('skill-target-pole-' + s.id, dims, scene)
            : BABYLON.MeshBuilder.CreateBox('skill-target-' + s.id, dims, scene);
        m.parent = s.root;
        m.position.set(xyz[0], xyz[1], xyz[2]);
        m.material = mat;
        m.isPickable = false;
        m.checkCollisions = false;
        m.metadata = { skillsLabTarget: true, targetId: String(s.id) };
        return m;
      }
      part('cylinder', { height: 1.45, diameter: 0.09 }, [0, 0.75, 0], materials.wood);
      part('box', { width: 0.7, height: 0.88, depth: 0.1 }, [0, 1.5, -0.02], materials.canvas);
      part('cylinder', { height: 0.04, diameter: 0.39 }, [0, 1.5, -0.1], materials.ring).rotation.x =
        Math.PI / 2;
      part('box', { width: 1.1, height: 0.32, depth: 0.42 }, [0, 0.21, 0], materials.sand);
    });
  }
  function options(id, pairs, val) {
    var select = panel.querySelector(id);
    pairs.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p[0];
      o.textContent = p[1];
      select.appendChild(o);
    });
    select.value = val;
    return select;
  }
  function makePanel() {
    if (panel) return;
    var style = document.createElement('style');
    style.textContent =
      '#hud,#hudToggle,#animationLab,#animationLabToggle{display:none!important}' +
      '#skillsLab{position:fixed;right:12px;top:12px;z-index:99999;width:min(410px,calc(100vw - 24px));' +
      'max-height:calc(100dvh - 24px);box-sizing:border-box;overflow:auto;padding:14px;color:#ebf2ff;' +
      'border:1px solid #486178;border-radius:12px;background:rgba(10,21,35,.96);' +
      'box-shadow:0 12px 40px #000a;font:12px/1.45 system-ui,-apple-system,sans-serif}' +
      '#skillsLab[hidden],#skillsLabToggle[hidden]{display:none!important}' +
      '#skillsLab h2{font-size:18px;margin:0 0 3px;color:#fff}' +
      '#skillsLab p{color:#9db6cb;margin:3px 0 8px}' +
      '#skillsLab label{display:block;color:#b7cddd;font-size:11px;margin:9px 0 3px}' +
      '#skillsLab select{width:100%;background:#1a3044;color:#fff;border:1px solid #52748b;padding:9px;border-radius:6px}' +
      '#skillsLab button,#skillsLabToggle{background:#234359;color:#f7fbff;border:1px solid #57788f;' +
      'border-radius:7px;padding:9px 10px;font-weight:650;cursor:pointer;min-height:40px}' +
      '#skillsLab button:focus-visible{outline:2px solid #a0d7ff}' +
      '#skillsLab button.primary{background:#22604b;border-color:#47ac83}' +
      '#skillsLab .buttons{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}' +
      '#skillsLab .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:10px 0}' +
      '#skillsLab .stats span{padding:6px;border:1px solid #34495e;border-radius:6px;text-align:center;font-size:10px}' +
      '#skillsLab .stats strong{display:block;font-size:17px;font-variant-numeric:tabular-nums}' +
      '#skillsLab pre{font:11px/1.45 ui-monospace,monospace;white-space:pre-wrap;overflow:auto;' +
      'max-height:175px;background:#101f2d;border:1px solid #284155;padding:8px;border-radius:6px;margin:5px 0}' +
      '#skillsLab h3{color:#aed0e6;font-size:12px;margin:12px 0 4px}' +
      '#skillsLabToggle{position:fixed;z-index:99999;right:12px;top:12px;background:#142d41}' +
      '#skillsLab .sub{font-size:10px;color:#9db6cb}' +
      '@media(max-width:650px){#skillsLab{left:8px;right:8px;width:auto;top:auto;bottom:8px;' +
      'max-height:70dvh}#skillsLabToggle{top:auto;bottom:12px;right:12px}}';
    document.head.appendChild(style);
    toggle = document.createElement('button');
    toggle.id = 'skillsLabToggle';
    toggle.textContent = 'Skills Lab';
    toggle.setAttribute('aria-label', 'Open Skills Lab controls');
    document.body.appendChild(toggle);
    panel = document.createElement('aside');
    panel.id = 'skillsLab';
    panel.setAttribute('aria-label', 'Tactical Skills Lab controls');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
      '<h2>TACTICAL · SKILLS LAB</h2><button id="skillClose">Close</button></div>' +
      '<p>Native soldier AI · 280 × 240 m uncluttered range · stationary sandbag standees</p>' +
      '<div class="sub">Targets are real native actors with visual standees. Shots, ballistics, suppression, ' +
      'perception, orders and movement use their shipping owners. Target damage/movement/fire disabled.</div>' +
      '<label for="skillController">Controller</label><select id="skillController"></select>' +
      '<label for="skillFocus">Inspect skill (observational filter; no forced AI actions)</label>' +
      '<select id="skillFocus"></select>' +
      '<label for="skillDistance">Starting range (native spawn positions)</label><select id="skillDistance"></select>' +
      '<label for="skillRange">Native weapon and visual detection range</label><select id="skillRange"></select>' +
      '<div class="buttons"><button class="primary" id="skillPlay">Play</button>' +
      '<button id="skillStep">+0.15s</button><button id="skillSecond">+1s</button>' +
      '<button id="skillSpeed">1×</button><button id="skillReset">Reset seed</button></div>' +
      '<div class="buttons"><button id="skillRetreat">Stage US retreat</button>' +
      '<button id="skillTrace">Vectors ON</button><button id="skillExport">Export JSON</button></div>' +
      '<div class="sub">Stage retreat sets only the initial squad retreat state; it does NOT inject bounds, ' +
      'target reports or firing receipts. Never count it as autonomous retreat authorization.</div>' +
      '<div class="stats"><span><strong id="skillTime">0</strong>sim sec</span>' +
      '<span><strong id="skillShots">0</strong>US shots</span>' +
      '<span><strong id="skillHits">0</strong>hits</span>' +
      '<span><strong id="skillConflicts">0</strong>order conflicts</span></div>' +
      '<h3>Squad decisions &amp; covered movement</h3><pre id="skillSquads">Initializing…</pre>' +
      '<h3>Native covered-route gates</h3><pre id="skillGates">Awaiting controller…</pre>' +
      '<h3>Individual actions (native owner)</h3><pre id="skillMen">Initializing…</pre>' +
      '<h3>Event timeline</h3><pre id="skillEvents">Waiting for events…</pre>' +
      '<p class="sub">Same-seed replay. Experimental range only; green range drills do not prove natural combat acceptance.</p>';
    document.body.appendChild(panel);
    function open(value) {
      visible(panel, value);
      visible(toggle, !value);
    }
    toggle.onclick = function () {
      open(true);
    };
    panel.querySelector('#skillClose').onclick = function () {
      open(false);
    };
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') open(false);
    });
    open(true);
    options(
      '#skillController',
      [
        ['new', 'New tactical controller'],
        ['legacy', 'Existing controller']
      ],
      params.get('tacticalController') === 'new' ? 'new' : 'legacy'
    ).onchange = function () {
      configure('tacticalController', this.value);
    };
    options(
      '#skillFocus',
      [
        ['all', 'All movement and combat'],
        ['fire', 'Fire / suppression'],
        ['bounds', 'Covered advance and retreat'],
        ['station', 'Firing-station assignment']
      ],
      focus
    ).onchange = function () {
      focus = this.value;
      render();
    };
    options(
      '#skillRange',
      [
        ['1', '1× native range'],
        ['0.5', '½× spotting + weapon range'],
        ['0.25', '¼× range']
      ],
      String(scale)
    ).onchange = function () {
      configure('labRange', this.value);
    };
    options(
      '#skillDistance',
      [
        ['35', '35 m · close range'],
        ['70', '70 m · contact range (default)'],
        ['120', '120 m · rifle range'],
        ['180', '180 m · open field']
      ],
      String(distanceM)
    ).onchange = function () {
      configure('labDistance', this.value);
    };
    play = panel.querySelector('#skillPlay');
    play.onclick = function () {
      setRunning(battle && battle.paused);
    };
    panel.querySelector('#skillStep').onclick = function () {
      advance(1);
    };
    panel.querySelector('#skillSecond').onclick = function () {
      advance(7);
    };
    panel.querySelector('#skillSpeed').onclick = function () {
      if (!battle) return;
      var fast = battle.timeScale !== 4;
      battle.setTimeScale(fast ? 4 : 1);
      this.textContent = fast ? '4×' : '1×';
    };
    panel.querySelector('#skillReset').onclick = reset;
    panel.querySelector('#skillRetreat').onclick = stageRetreat;
    panel.querySelector('#skillTrace').onclick = function () {
      drawVectors = !drawVectors;
      this.textContent = drawVectors ? 'Vectors ON' : 'Vectors OFF';
      draw();
    };
    panel.querySelector('#skillExport').onclick = function () {
      var result = snapshot();
      if (!result) return;
      var blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = 'skills-lab-' + result.seed + '-' + result.controller + '.json';
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 500);
    };
  }
  var drawVectors = true;
  function setRunning(want) {
    if (!battle || battle.winner) return;
    if (want) battle.resume();
    else battle.pause();
    render();
  }
  function advance(n) {
    if (!battle || battle.winner) return;
    battle.pause();
    battle.resume();
    for (var i = 0; i < n && !battle.winner; i++) battle.step(0.15);
    battle.pause();
    render();
  }
  function reset() {
    if (!battle) return;
    battle.pause();
    shots = hits = supporters = ticks = 0;
    lastTime = -1;
    lastError = null;
    history = [];
    seenEvents.clear();
    vectors.forEach(function (v) {
      v.dispose();
    });
    vectors = [];
    battle.restart();
    battle.timeLimit = 300;
    decorate();
    log('reset', 'Exact same seed, new native actor generation');
    render();
  }
  function stageRetreat() {
    if (!battle) return;
    /* A scripted *casualty* premise, not a fabricated retreat order. Native
       soldier death and squad casualty policy own the resulting transition.
       Use one squad so other squads retain normal fire/cover opportunities. */
    var sq = battle.factions.us.squads[0];
    if (!sq || !sq.members || !sq.members.length) return;
    var alive = sq.members.filter(function (man) {
      return !man.dead;
    });
    var leave = Math.max(2, Math.floor(sq.members.length * 0.4));
    var toRemove = Math.max(0, alive.length - leave);
    /* Keep leader and machine gun if possible for observation after attrition. */
    var candidates = alive
      .filter(function (man) {
        return man.role !== 'sergeant' && man.role !== 'gunner';
      })
      .concat(
        alive.filter(function (man) {
          return man.role === 'sergeant' || man.role === 'gunner';
        })
      );
    for (var i = 0; i < toRemove; i++) battle.killSoldier(candidates[i], null);
    log(
      'scripted premise',
      'Native casualty owner removed ' +
        toRemove +
        ' members of ' +
        sq.id +
        '; retreat decision belongs to squad AI (no fake commander order)'
    );
    render();
  }
  function diagnostics() {
    var squads = [],
      actors = [];
    if (!battle) return { squads: squads, actors: actors };
    ['us', 'ge'].forEach(function (side) {
      var all = battle.factions[side].squads || [];
      all.forEach(function (sq) {
        var controller = root.BattleTacticalController;
        var isNew = !!(controller && controller.controls && controller.controls(battle, sq));
        var m = root.BattleTacticalCoveredManeuver && root.BattleTacticalCoveredManeuver.summary(sq);
        squads.push({
          id: side + ':' + sq.id,
          controller: isNew ? 'new' : 'legacy',
          phase: sq.commandPhase || sq.state || '?',
          contact: !!sq.inContact,
          maneuver: (m && m.phase) || null,
          direction: (m && m.direction) || null,
          team: (m && m.team) || null,
          reason: (m && m.reason) || null,
          supporters: (m && m.supporters && m.supporters.length) || 0,
          completed: (m && m.completed) || 0,
          failed: (m && m.failed) || 0,
          diagnostic: (m && m.diagnostic) || null
        });
        if (m && Array.isArray(m.history))
          m.history.forEach(function (e) {
            var k = [side, sq.id, e.token, e.at, e.phase, e.team, e.reason].join('|');
            if (seenEvents.has(k)) return;
            seenEvents.add(k);
            log(
              'maneuver ' + e.phase,
              side +
                ':' +
                sq.id +
                ' ' +
                (e.direction || '') +
                ' ' +
                (e.team || '') +
                ' — ' +
                (e.reason || ''),
              e.at
            );
          });
      });
    });
    (battle._roster.us || []).forEach(function (s) {
      var pos = s.root && s.root.position,
        rs = s._movementResolver || {};
      var last = rs.last || {},
        end = s.orderDestination || s.destination;
      var eng = s.eng || {};
      actors.push({
        id: s.id,
        squad: s.squad && s.squad.id,
        x: pos && +pos.x.toFixed(2),
        z: pos && +pos.z.toFixed(2),
        hp: s.hp,
        target: (s.target && String(s.target.id)) || null,
        moving: !!s.moving,
        gait: s._locomotionGait || 'none',
        state: eng.state || s.state || 'none',
        orderOwner: last.owner || null,
        orderKind: last.kind || null,
        stopped: s._movementStopReason || null,
        orderDestination: end && { x: +end.x.toFixed(2), z: +end.z.toFixed(2) }
      });
    });
    return { squads: squads, actors: actors };
  }
  function snapshot() {
    if (!battle) return null;
    var data = diagnostics();
    return {
      type: 'native-tactical-skills-lab',
      isolated: true,
      seed:
        (scene && scene.metadata && scene.metadata.battleScenario && scene.metadata.battleScenario.seed) ||
        null,
      controller: params.get('tacticalController') || 'legacy',
      focus: focus,
      rangeScale: scale,
      rangeDistanceM: distanceM,
      time: +battle.time.toFixed(2),
      paused: !!battle.paused,
      shots: shots,
      hits: hits,
      supporters: supporters,
      targetCount: battle._roster.ge.length,
      targetDeaths: battle._roster.ge.filter(function (s) {
        return s.dead;
      }).length,
      writerConflicts:
        root.BattleOrderProvenance && root.BattleOrderProvenance.conflicts
          ? root.BattleOrderProvenance.conflicts(battle).length
          : null,
      controllerState:
        root.BattleTacticalController && root.BattleTacticalController.summary
          ? root.BattleTacticalController.summary(battle)
          : null,
      units: data.actors,
      squads: data.squads,
      events: history.slice(),
      lastError: lastError
    };
  }
  function draw() {
    if (!battle || !scene) return;
    vectors.forEach(function (v) {
      v.dispose();
    });
    vectors = [];
    if (!drawVectors) return;
    (battle._roster.us || []).forEach(function (s) {
      if (s.dead || !s.root) return;
      var next = s.destination || s.orderDestination;
      if (!next || !Number.isFinite(next.x) || !Number.isFinite(next.z)) return;
      var start = s.root.position,
        a = new BABYLON.Vector3(start.x, start.y + 1.8, start.z),
        b = new BABYLON.Vector3(next.x, battle.heightAt(next.x, next.z) + 1.8, next.z);
      if (BABYLON.Vector3.Distance(a, b) < 0.4) return;
      var mesh = BABYLON.MeshBuilder.CreateLines('skill-order-' + s.id, { points: [a, b] }, scene);
      mesh.color =
        s.eng && s.eng.state === 'bound'
          ? new BABYLON.Color3(1, 0.68, 0.2)
          : new BABYLON.Color3(0.32, 0.77, 1);
      mesh.isPickable = false;
      vectors.push(mesh);
    });
  }
  function render() {
    if (!panel || !battle) return;
    decorate();
    if (battle.time !== lastTime) {
      lastTime = battle.time;
      ticks++;
      draw();
    }
    var d = snapshot();
    panel.querySelector('#skillTime').textContent = d.time.toFixed(1);
    panel.querySelector('#skillShots').textContent = String(d.shots);
    panel.querySelector('#skillHits').textContent = String(d.hits);
    panel.querySelector('#skillConflicts').textContent = String(d.writerConflicts ?? '?');
    play.textContent = battle.paused ? '▶ Play' : 'Ⅱ Pause';
    panel.querySelector('#skillSquads').textContent =
      d.squads
        .filter(function (s) {
          return s.id.startsWith('us:');
        })
        .map(function (s) {
          return (
            s.id +
            ' [' +
            s.controller +
            '] ' +
            s.phase +
            (s.contact ? ' · CONTACT' : '') +
            (s.maneuver
              ? '\n  ' +
                s.maneuver +
                ' ' +
                (s.direction || '') +
                ' ' +
                (s.team || '') +
                ' · support ' +
                s.supporters +
                '\n  ' +
                s.reason +
                ' · completed ' +
                s.completed +
                ' · aborted ' +
                s.failed
              : '')
          );
        })
        .join('\n') || 'No active squads';
    panel.querySelector('#skillGates').textContent =
      d.squads
        .filter(function (s) {
          return s.id.startsWith('us:') && s.diagnostic;
        })
        .map(function (s) {
          var plan = s.diagnostic;
          return (
            s.id +
            ' · ' +
            (plan.result || 'checking') +
            ' · goal ' +
            (plan.goal ? Math.round(plan.goal.x) + ',' + Math.round(plan.goal.z) : 'none') +
            ' · reports ' +
            plan.contactReports +
            '\n' +
            (plan.teams || [])
              .map(function (t) {
                return (
                  '  ' +
                  t.team +
                  ': ' +
                  (t.result || '-') +
                  ' · movers ' +
                  t.eligibleMovers +
                  ' · supporters ' +
                  t.eligibleSupporters +
                  ' · raw/forward cover ' +
                  t.candidates +
                  '/' +
                  t.directionalCandidates +
                  ' · accepted routes ' +
                  t.admittedRoutes +
                  (t.moverFailures.length
                    ? '\n    ' +
                      t.moverFailures
                        .map(function (failure) {
                          return '#' + failure.id + ' ' + failure.reason;
                        })
                        .join(', ')
                    : '') +
                  (Object.keys(t.routeRejections).length
                    ? '\n    blocked ' + JSON.stringify(t.routeRejections)
                    : '')
                );
              })
              .join('\n')
          );
        })
        .join('\n') || 'No attempt yet (see squad phase above)';
    panel.querySelector('#skillMen').textContent =
      d.units
        .filter(function (s) {
          return focus !== 'bounds' || s.state === 'bound' || s.moving;
        })
        .slice(0, 20)
        .map(function (s) {
          return (
            s.id +
            ' ' +
            s.state +
            '/' +
            s.gait +
            ' · ' +
            (s.orderKind || '-') +
            ' (' +
            (s.orderOwner || '-') +
            ')' +
            (s.target ? ' · sighted #' + s.target : '') +
            (s.stopped ? '\n  stopped: ' + s.stopped : '')
          );
        })
        .join('\n') || 'No active movers';
    panel.querySelector('#skillEvents').textContent =
      d.events
        .slice(-12)
        .map(function (e) {
          return e.t.toFixed(2) + 's ' + e.kind + ': ' + e.message;
        })
        .join('\n') || 'No events';
  }
  function attachBattle(b, scn) {
    if (battle === b) return;
    battle = b;
    scene = scn || b.scene;
    battle.pause();
    battle.timeLimit = 300;
    battle.setTimeScale(1);
    var previousFire = battle.onFire,
      previousShot = battle.onShot;
    battle.onFire = function (s) {
      if (s && s.faction === 'us') {
        shots++;
        if (shots < 6) log('discharge', 'US soldier ' + s.id + ' fired a real round');
      }
      if (previousFire) return previousFire.apply(this, arguments);
    };
    battle.onShot = function (s, target, hit, d, meta) {
      if (hit && s && s.faction === 'us') {
        hits++;
        if (hits < 6)
          log(
            'ballistic hit',
            'US soldier ' + s.id + ' → ' + (meta && meta.victim ? meta.victim.id : target && target.id)
          );
      }
      if (previousShot) return previousShot.apply(this, arguments);
    };
    decorate();
    log('range ready', 'Real native soldiers; German target actors cannot move, shoot, die or wound US');
    if (!timer) timer = setInterval(render, 250);
    render();
  }
  /* These are the only owner-level interventions: preserve targeting, shot
     confirmation and suppression receipts. Never fabricate shots or moves. */
  root.PhaseCCombatLab = {
    disableObjectiveVictory: true,
    rangeScale: scale,
    movementPace: 'baseline',
    interiorIngressRecovery: false,
    stationary: function (s) {
      return !!s && s.faction === 'ge';
    },
    blockShot: function (s) {
      return !!s && s.faction === 'ge';
    },
    preventWound: function (s, victim) {
      return !!victim && victim.faction === 'ge';
    },
    preventDeath: function (s) {
      return !!s && s.faction === 'ge';
    }
  };
  if (root.BattleDesktopCamera && root.BattleDesktopCamera.create)
    root.BattleDesktopCamera.create = installCamera;
  makePanel();
  root.BattleSkillsLab = {
    attachBattle: attachBattle,
    snapshot: snapshot,
    advance: advance,
    reset: reset,
    stageRetreat: stageRetreat,
    setRunning: setRunning
  };
})(window);
