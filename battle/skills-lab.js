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
  var coverLayout = params.get('labCover') || 'mixed';
  if (['open', 'mixed', 'staggered', 'dense', 'hedgerow', 'original'].indexOf(coverLayout) < 0)
    coverLayout = 'mixed';
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
  /* True physical coverage: a visual hedge AND its shared nav/LOS/ballistic
     footprint are the very same object supplied to BattleSim. The standee
     target sandbags remain decoration and are never cover. No scene RNG. */
  function scatterCover(scn, heightAt, opts) {
    if (coverLayout === 'original') {
      /* Preserve original procedural layout as an explicit comparison mode.
         Avoid recursive calls by bypassing this Skills Lab hook just here. */
      var original = root.BattleSkillsLab.scatterCover;
      root.BattleSkillsLab.scatterCover = null;
      try {
        return root.BattleTerrainFeatures.scatter(scn, heightAt, opts);
      } finally {
        root.BattleSkillsLab.scatterCover = original;
      }
    }
    var obstacles = [],
      footprints = [],
      meshes = [];
    /* Reuse TerrainFeatures' existing terrain-following prism renderer. Each
       painted mesh comes from the SAME OBB, terrain endpoint heights and height
       interval that nav, LOS and ballistics consume. No floating flat boxes. */
    function physicalCover(id, x, z, width, depth, angle, height, type, tint) {
      var rot = angle || 0,
        co = Math.cos(rot),
        si = Math.sin(rot),
        ux = co,
        uz = -si,
        vx = si,
        vz = co,
        hx = width / 2,
        hz = depth / 2,
        y0 = heightAt(x - ux * hx, z - uz * hx) - 0.25,
        y1 = heightAt(x + ux * hx, z + uz * hx) - 0.25,
        item = {
          id: 'lab-' + id,
          physicalId: 'lab-' + id,
          type: type,
          shape: 'obb',
          volume: 'terrain-prism',
          x: x,
          z: z,
          hx: hx,
          hz: hz,
          ux: ux,
          uz: uz,
          vx: vx,
          vz: vz,
          y: (y0 + y1) / 2,
          y0: y0,
          y1: y1,
          height: height + 0.25,
          visibleHeight: height,
          radius: hz,
          cover: 0.62
        };
      var T = root.BattleTerrainFeatures;
      if (!T || !T.terrainPrism) throw new Error('Skills Lab requires shared terrain-prism geometry');
      footprints.push(item);
      obstacles.push(item);
      var mesh = T.terrainPrism(scn, item, BABYLON.Color3.FromHexString(tint));
      mesh.name = 'lab-real-cover-' + id;
      mesh.isPickable = false;
      meshes.push(mesh);
    }
    function hedge(id, x, z, width, depth, angle) {
      physicalCover(id, x, z, width, depth, angle, 3.3, 'hedge', '#486638');
    }
    if (coverLayout === 'mixed') {
      /* Reduced-height physical cover with generous walkable corridors. A few
         real bocage pieces break sight lines; the rest are waist/chest-high
         stone/rubble banks. Neither cover slots nor troop paths are scripted. */
      var bands = [-101, -80, -59, -38, -17, 4, 25];
      bands.forEach(function (z, i) {
        [-35, -13, 9, 31].forEach(function (x, j) {
          if ((i * 3 + j) % 6 === 0) return;
          var tall = (i + j * 2) % 6 === 3,
            atX = x + (i % 2 ? 4 : -3),
            atZ = z + (j % 2 ? 2 : -2),
            angle = ((i + 2 * j) % 3 - 1) * 0.15;
          physicalCover(
            'mixed-' + i + '-' + j,
            atX,
            atZ,
            tall ? 7.0 : 5.2,
            tall ? 2.5 : 1.7,
            angle,
            tall ? 2.9 : 1.3 + ((i + j) % 3) * 0.16,
            tall ? 'hedge' : 'wall',
            tall ? '#486638' : (i + j) % 2 ? '#787568' : '#6d685b'
          );
        });
      });
    } else if (coverLayout === 'hedgerow') {
      /* Forward path blocked by broad hedge. A real gap at the eastern end
         requires a significant sideways/backwards flanking approach. */
      hedge('long-west', -19, -6, 40, 3.1, 0);
      hedge('long-east', 19, -6, 29, 3.1, 0);
      [
        [-30, -70],
        [-14, -55],
        [4, -43],
        [23, -36],
        [41, -25],
        [55, -14],
        [55, 5],
        [41, 19],
        [22, 30],
        [8, 41]
      ].forEach(function (p, i) {
        hedge('flank-' + i, p[0], p[1], 9, 3.2, i % 2 ? 0.16 : -0.12);
      });
    } else if (coverLayout !== 'open') {
      /* 20 m staggered authentic cover legs. Dense adds side choices, not
         synthetic route hints or orders to the soldier. */
      var lines = [-108, -88, -68, -48, -28, -8, 12, 32];
      lines.forEach(function (z, i) {
        var cols = coverLayout === 'dense' ? [-40, -20, 0, 20, 40] : [-27, -3, 22];
        cols.forEach(function (x, j) {
          hedge(
            'row-' + i + '-' + j,
            x + (i % 2 ? 6 : -5),
            z + ((i + j) % 2 ? 2 : -2),
            coverLayout === 'dense' ? 9 : 10,
            3.0,
            (((i + j) % 3) - 1) * 0.13
          );
        });
      });
    }
    obstacles.__physicalFootprints = footprints;
    obstacles.__physicalVersion = 4;
    return {
      obstacles: obstacles,
      physicalFootprints: footprints,
      dispose: function () {
        meshes.forEach(function (m) {
          m.dispose();
        });
      }
    };
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
      '<label for="skillCover">Real cover layout (native collision and LOS)</label><select id="skillCover"></select>' +
      '<label for="skillDistance">Starting range (native spawn positions)</label><select id="skillDistance"></select>' +
      '<label for="skillRange">Native weapon and visual detection range</label><select id="skillRange"></select>' +
      '<div class="buttons"><button class="primary" id="skillPlay">Play</button>' +
      '<button id="skillStep">+0.15s</button><button id="skillSecond">+1s</button>' +
      '<button id="skillSpeed">1×</button><button id="skillReset">Reset seed</button></div>' +
      '<div class="buttons"><button id="skillRetreat">Stage US retreat</button>' +
      '<button id="skillTrace">Vectors ON</button><button id="skillRoutesToggle">Routes ON</button>' +
      '<button id="skillExport">Export JSON</button></div>' +
      '<div class="sub">Stage retreat sets only the initial squad retreat state; it does NOT inject bounds, ' +
      'target reports or firing receipts. Never count it as autonomous retreat authorization.</div>' +
      '<div class="stats"><span><strong id="skillTime">0</strong>sim sec</span>' +
      '<span><strong id="skillShots">0</strong>US shots</span>' +
      '<span><strong id="skillHits">0</strong>hits</span>' +
      '<span><strong id="skillConflicts">0</strong>order conflicts</span></div>' +
      '<h3>Squad decisions &amp; covered movement</h3><pre id="skillSquads">Initializing…</pre>' +
      '<h3>Native route plan · A → B → C → D</h3><pre id="skillRoutes">No route yet</pre>' +
      '<div class="sub">Colored routes mark real terrain-aligned cover slots. An old route is history, ' +
      'not an active order when the mission changes to DEFEND. See mission and gates above.</div>' +
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
      '#skillCover',
      [
        ['mixed', 'Mixed medium cover (default, terrain-following)'],
        ['staggered', 'Staggered hedgerows (comparison)'],
        ['hedgerow', 'Long hedgerow / flanking detour'],
        ['dense', 'Dense cover choices'],
        ['open', 'Open ground (no cover)'],
        ['original', 'Original procedural terrain']
      ],
      coverLayout
    ).onchange = function () {
      configure('labCover', this.value);
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
    panel.querySelector('#skillRoutesToggle').onclick = function () {
      drawRoutes = !drawRoutes;
      this.textContent = drawRoutes ? 'Routes ON' : 'Routes OFF';
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
  var drawVectors = true,
    drawRoutes = true;
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
    /* Run the SAME fixed-step clock as benchmark replay, including its
       Commander/Meso tick. Direct sim.step() only advanced soldier simulation,
       leaving the short-range drills permanently in an old approach phase. */
    for (var i = 0; i < n && !battle.winner; i++) {
      if (battle._fixedClock) {
        var scale = battle.timeScale;
        battle.setTimeScale(1);
        battle._fixedClock.advance(0.15);
        battle.setTimeScale(scale);
      } else {
        battle.step(0.15);
        if (!battle.winner && battle._liveCommanderTick) battle._liveCommanderTick(0.15);
      }
    }
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
      v.dispose(false, true);
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
          missionAction: (sq._macroMission && sq._macroMission.action) || null,
          missionIntent: (sq._macroMission && sq._macroMission.intent) || null,
          contact: !!sq.inContact,
          maneuver: (m && m.phase) || null,
          direction: (m && m.direction) || null,
          team: (m && m.team) || null,
          reason: (m && m.reason) || null,
          supporters: (m && m.supporters && m.supporters.length) || 0,
          completed: (m && m.completed) || 0,
          checkins: (m && m.checkins) || 0,
          retainedRoutes: (m && m.retainedRoutes) || [],
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
      coverLayout: coverLayout,
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
      writerConflictDetails:
        root.BattleOrderProvenance && root.BattleOrderProvenance.conflicts
          ? root.BattleOrderProvenance.conflicts(battle).slice(0, 8)
          : [],
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
      v.dispose(false, true);
    });
    vectors = [];
    if (drawVectors)
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
    if (!drawRoutes) return;
    /* True retained route overlay: A=planned origin; B,C,D...
       are successive native physical-cover slots, never invented points.
       The route remains visible throughout the concurrent bound and between
       check-ins; per-mover labels make simultaneous orders inspectable. */
    (battle.factions.us.squads || []).forEach(function (sq) {
      var skill = root.BattleTacticalCoveredManeuver,
        summary = skill && skill.summary(sq);
      if (!summary || !Array.isArray(summary.retainedRoutes)) return;
      summary.retainedRoutes.forEach(function (route, routeIndex) {
        var soldier = (sq.members || []).find(function (s) {
          return s && String(s.id) === route.moverId && !s.dead;
        });
        if (!soldier || !soldier.root || !route.waypoints.length) return;
        var colors = [
            new BABYLON.Color3(0.51, 0.92, 0.43),
            new BABYLON.Color3(1, 0.68, 0.24),
            new BABYLON.Color3(0.7, 0.52, 1),
            new BABYLON.Color3(0.32, 0.82, 1)
          ],
          color = colors[routeIndex % colors.length],
          path = [route.origin || soldier.root.position].concat(route.waypoints);
        for (var leg = 0; leg < path.length - 1; leg++) {
          var from = leg === route.cursor ? soldier.root.position : path[leg],
            to = path[leg + 1],
            fromLine = new BABYLON.Vector3(from.x, battle.heightAt(from.x, from.z) + 2.5, from.z),
            toLine = new BABYLON.Vector3(to.x, battle.heightAt(to.x, to.z) + 2.5, to.z),
            segment = BABYLON.MeshBuilder.CreateLines(
              'skill-route-' + route.moverId + '-' + leg,
              { points: [fromLine, toLine] },
              scene
            );
          segment.color =
            leg < route.cursor
              ? new BABYLON.Color3(0.32, 0.42, 0.42)
              : leg === route.cursor
                ? color
                : new BABYLON.Color3(color.r * 0.6, color.g * 0.6, color.b * 0.6);
          segment.isPickable = false;
          vectors.push(segment);
        }
        path.forEach(function (point, index) {
          var label = String.fromCharCode(65 + Math.min(index, 25)),
            face = BABYLON.MeshBuilder.CreatePlane(
              'skill-stop-' + route.moverId + '-' + label,
              { size: 3.3 },
              scene
            );
          face.position.set(point.x, battle.heightAt(point.x, point.z) + 4.3, point.z);
          face.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
          face.isPickable = false;
          var texture = new BABYLON.DynamicTexture(
            'skill-stop-label-' + route.moverId + '-' + label,
            { width: 128, height: 128 },
            scene,
            false
          );
          texture.hasAlpha = true;
          texture.drawText(label, 34, 93, 'bold 88px Arial', '#ffffff', 'rgba(31,90,28,0.9)', true, true);
          var markerMaterial = new BABYLON.StandardMaterial(
            'skill-stop-ink-' + route.moverId + '-' + label,
            scene
          );
          markerMaterial.diffuseTexture = texture;
          markerMaterial.opacityTexture = texture;
          markerMaterial.emissiveColor = color;
          markerMaterial.disableLighting = true;
          markerMaterial.backFaceCulling = false;
          face.material = markerMaterial;
          vectors.push(face);
        });
      });
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
            (s.missionAction ? ' · mission ' + s.missionAction : '') +
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
    panel.querySelector('#skillRoutes').textContent =
      d.squads
        .filter(function (s) {
          return s.id.startsWith('us:');
        })
        .map(function (s) {
          var lines = (s.retainedRoutes || []).map(function (route) {
            var stops = route.waypoints,
              labels = stops.map(function (p, i) {
                return (
                  String.fromCharCode(66 + Math.min(i, 24)) +
                  '(' +
                  Math.round(p.x) +
                  ',' +
                  Math.round(p.z) +
                  ')' +
                  (i < route.cursor ? ' ✓' : i === route.cursor ? ' NEXT' : '')
                );
              });
            return (
              '  ' +
              route.moverId +
              ': A (planned start) → ' +
              (labels.length ? labels.join(' → ') : 'no connected waypoints')
            );
          });
          return (
            s.id +
            ' · mission ' +
            (s.missionAction || 'none') +
            '\n' +
            (lines.length
              ? lines.join('\n')
              : '  No leader-approved multihop plan (' + (s.reason || 'no authorization') + ')')
          );
        })
        .join('\n') || 'No US squads';
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
    scatterCover: scatterCover,
    setRunning: setRunning
  };
})(window);
