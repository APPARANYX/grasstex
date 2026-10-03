/* Squad tactical status overlay.

   Presentation only: projects squad-level command state into a screen-space SVG so the operator can
   read the battle through terrain/buildings without creating another gameplay owner. The base unit
   mark follows the 1941 U.S. War Department infantry convention: infantry is an X inside the unit
   frame and a single dot above the frame denotes squad echelon. Current activity, movement arrows
   and objective marks are explicit UI annotations rather than invented "historical" unit symbols. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSquadStatusOverlay) return;

  var SVG_NS = 'http://www.w3.org/2000/svg',
    STORAGE = 'battleSquadStatusOverlayV1',
    LIFT = 4.0,
    OBJECTIVE_LIFT = 0.7,
    LONG_ARROW_WORLD = 150,
    ARROW_WIPE_MS = 1050,
    ARROW_HOLD_MS = 180,
    ARROW_FADE_MS = 320,
    OFFSCREEN_PAD = 90,
    simRef = null,
    visible = true,
    overlay = null,
    svg = null,
    button = null,
    style = null,
    raf = 0,
    marks = Object.create(null),
    identity = null;

  var MOVING_PHASES = {
    approach: 1,
    assault: 1,
    capture: 1,
    flank: 1,
    'clear-town': 1,
    regroup: 1
  };
  var PHASE_LABELS = {
    approach: 'ADVANCE',
    reserve: 'RESERVE',
    hold: 'HOLD',
    'support-hold': 'SUPPORT',
    'corner-check': 'CORNER CHECK',
    assault: 'ASSAULT',
    capture: 'CAPTURE',
    defend: 'DEFEND',
    flank: 'FLANK',
    'clear-town': 'CLEAR',
    regroup: 'REGROUP'
  };

  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function copy(p) {
    return p ? { x: +p.x || 0, z: +p.z || 0 } : null;
  }
  function dist(a, b) {
    return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
  }
  function sideSquads(sim, faction) {
    return (sim && sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [];
  }
  function living(sq) {
    return ((sq && sq.members) || []).filter(function (s) {
      return s && !s.dead && s.root && s.root.position;
    });
  }
  function leaderOf(sq) {
    try {
      if (root.SquadAI && root.SquadAI.leaderOf) return root.SquadAI.leaderOf(sq);
    } catch (_) {}
    var men = living(sq);
    for (var i = 0; i < men.length; i++) if (men[i].role === 'sergeant') return men[i];
    return null;
  }
  function centroid(sq, sim) {
    var leader = leaderOf(sq);
    if (leader && leader.root && leader.root.position)
      return { x: +leader.root.position.x || 0, z: +leader.root.position.z || 0, leader: true };
    var men = living(sq), x = 0, z = 0;
    if (!men.length) return null;
    for (var i = 0; i < men.length; i++) {
      x += +men[i].root.position.x || 0;
      z += +men[i].root.position.z || 0;
    }
    return { x: x / men.length, z: z / men.length, leader: false };
  }
  function liveLease(sq, kind, sim) {
    var L = root.BattleLeases, l = null;
    try { l = L && L.get ? L.get(sq, kind) : sq && sq._leases && sq._leases.live && sq._leases.live[kind]; } catch (_) {}
    if (!l) return null;
    return !sim || !isFinite(+l.until) || (+sim.time || 0) < +l.until ? l : null;
  }
  function boundLabel(sq, sim) {
    var l = liveLease(sq, 'bound', sim);
    if (!l) return null;
    var team = l.data && l.data.team;
    return team ? 'BOUND ' + String(team).toUpperCase() : 'BOUND';
  }
  function statusFor(sq, sim) {
    var phase = String((sq && sq.commandPhase) || ''),
      fc = sq && sq.fireControl,
      bound = boundLabel(sq, sim);
    if (!sq) return { key: 'unknown', label: 'UNKNOWN' };
    if (sq.state === 'retreat' || phase === 'retreat') {
      var assembly = sq._assembly && sq._assembly.phase;
      return { key: 'retreat', label: assembly === 'to-rally' ? 'RECONSTITUTE' : 'RETREAT' };
    }
    if (sq._reconTask || liveLease(sq, 'recon', sim)) return { key: 'recon', label: 'SCOUTS FORWARD' };
    if (phase === 'regroup' || liveLease(sq, 'regroup', sim)) return { key: 'regroup', label: 'REGROUP' };
    if (bound) return { key: 'bound', label: bound };
    if (!leaderOf(sq) && liveLease(sq, 'succession', sim)) return { key: 'leaderless', label: 'LEADERLESS' };
    if (sq.inContact && fc && (fc.state === 'hold' || fc.state === 'reposition'))
      return { key: 'hold-fire', label: fc.state === 'reposition' ? 'SEEK FIRING LINE' : 'HOLD FIRE' };
    if (sq.inContact && fc && fc.state === 'precision') return { key: 'precision', label: 'PRECISION FIRE' };
    if (sq.inContact && sq.coa === 'defend') return { key: 'contact-defend', label: 'DEFEND' };
    if (sq.inContact && sq.coa === 'assault') return { key: 'contact-assault', label: 'ASSAULT' };
    return { key: phase || 'idle', label: PHASE_LABELS[phase] || (sq.inContact ? 'CONTACT' : 'HOLD') };
  }
  function missionObjective(sq, sim) {
    if (!sq) return null;
    var m = sq._macroMission || null, obj = null;
    if (m && m.objectiveId && root.BattleObjectiveSystem && root.BattleObjectiveSystem.get && sim) {
      try { obj = root.BattleObjectiveSystem.get(sim, m.objectiveId); } catch (_) { obj = null; }
      if (obj && obj.def && isFinite(+obj.def.x) && isFinite(+obj.def.z))
        return { x: +obj.def.x, z: +obj.def.z, id: m.objectiveId };
    }
    if (m && point(m.point)) return { x: +m.point.x, z: +m.point.z, id: m.objectiveId || null };
    if (point(sq.objective)) return { x: +sq.objective.x, z: +sq.objective.z, id: sq.targetObjective || null };
    return null;
  }
  function movementTarget(sq, sim) {
    if (!sq) return null;
    if (sq._reconTask && point(sq._reconTask.point)) return copy(sq._reconTask.point);
    if (sq.state === 'retreat') {
      if (sq._assembly && sq._assembly.phase === 'to-rally' && sq._macroMission && point(sq._macroMission.point))
        return copy(sq._macroMission.point);
      return point(sq.orderAnchor) || point(sq.home);
    }
    if (String(sq.commandPhase || '') === 'regroup') return point(sq.objective) || point(sq.rally) || point(sq.orderAnchor);
    return point(sq.orderAnchor);
  }
  /* The long-range UI arrow is not the 13 m Squad Leader orderAnchor. It represents a newly issued
     destination/mission far enough away to merit an operational cue. That keeps the arrow momentary
     instead of turning every local bound into a permanent HUD vector. */
  function arrowTarget(sq, sim) {
    if (!sq) return null;
    if (sq.state === 'retreat') {
      if (sq._assembly && sq._assembly.phase === 'to-rally' && sq._macroMission && point(sq._macroMission.point))
        return copy(sq._macroMission.point);
      return point(sq.home);
    }
    var mission = missionObjective(sq, sim);
    if (mission) return { x: mission.x, z: mission.z, id: mission.id || null };
    return point(sq.objective);
  }
  function arrowSignature(sq, target) {
    /* One wipe belongs to one destination, not to every phase/brief transition on the way there.
       Macro already coalesces identical briefs; Meso legitimately moves APPROACH -> ASSAULT ->
       CAPTURE and may receive a revised brief for the same objective. Neither should make the UI
       pretend a new long-range destination was issued. Coordinates remain in the signature so a
       genuinely relocated rally/hold point can produce a fresh arrow even without an objective id. */
    var id = target && target.id != null ? 'obj:' + String(target.id) : 'point',
      x = target ? Math.round((+target.x || 0) / 20) : 0,
      z = target ? Math.round((+target.z || 0) / 20) : 0;
    return [id, x, z].join('|');
  }
  function hasSquadMovementIntent(sq, sim) {
    if (!sq) return false;
    if (sq._reconTask || liveLease(sq, 'recon', sim) || liveLease(sq, 'bound', sim)) return true;
    if (sq.state === 'retreat' || String(sq.commandPhase || '') === 'retreat') return true;
    return !!MOVING_PHASES[String(sq.commandPhase || '')];
  }
  function symbolIdFor(sq) {
    var T = root.BattleTacticalSymbols;
    if (T && T.resolveId) return T.resolveId(sq);
    return (sq && (sq.tacticalSymbol || sq.symbolType || sq.unitType)) || 'infantry';
  }
  function symbolSpec(sq) {
    var T = root.BattleTacticalSymbols,
      spec = T && T.resolve ? T.resolve(sq) : null;
    if (spec) return spec;
    return {
      id: 'infantry',
      label: 'Infantry',
      domain: 'ground',
      verifiedHistorical: true,
      historicalBasis: 'U.S. War Department FM 21-30 (1941): infantry X in unit frame; squad echelon dot above',
      frame: { tag: 'rect', attrs: { x: -27, y: -16, width: 54, height: 32, rx: 1.5, 'class': 'sso-frame' } },
      primitives: [{ tag: 'path', attrs: { d: 'M-24 -13 L24 13 M24 -13 L-24 13', 'class': 'sso-symbol-stroke' } }],
      echelon: { kind: 'dots', count: 1, y: -22 }
    };
  }

  function makeSvg(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function append(parent, tag, attrs, text) {
    var n = makeSvg(tag, attrs);
    if (text != null) n.textContent = text;
    parent.appendChild(n);
    return n;
  }
  function installUi() {
    if (typeof document === 'undefined' || overlay) return;
    try { visible = localStorage.getItem(STORAGE) !== '0'; } catch (_) {}
    style = document.createElement('style');
    style.textContent =
      '#squadStatusOverlay{position:fixed;inset:0;z-index:9;pointer-events:none;overflow:hidden}' +
      '#squadStatusOverlay svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
      '#squadStatusToggle{position:fixed;left:12px;bottom:12px;z-index:17;padding:7px 10px;border:1px solid #59666b;border-radius:5px;background:#172126;color:#e6eef0;font:700 10px Arial;cursor:pointer;box-shadow:0 4px 14px #0006}' +
      '#squadStatusToggle.on{border-color:#aebd83;background:#334028}' +
      '.sso-arrow-halo{fill:none;stroke:#0b0e0b;stroke-width:12;stroke-linecap:round;stroke-linejoin:round;opacity:.72}' +
      '.sso-arrow{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 2px 1px #0008)}' +
      '.sso-arrow-head{fill:currentColor;stroke:#0b0e0b;stroke-width:2;stroke-linejoin:round;filter:drop-shadow(0 2px 1px #0008)}' +
      '.sso-us{color:#91b9e8}.sso-ge{color:#e77868}' +
      '.sso-arrow,.sso-frame,.sso-symbol-stroke,.sso-objective{stroke:currentColor}' +
      '.sso-frame{fill:rgba(20,24,20,.72);stroke-width:2.4}' +
      '.sso-symbol-stroke{fill:none;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}' +
      '.sso-symbol-fill{fill:currentColor;stroke:#0b0e0b;stroke-width:1.2;stroke-linejoin:round}' +
      '.sso-symbol-text{font:700 13px Arial Narrow,Arial,sans-serif;fill:currentColor;stroke:#0b0e0b;stroke-width:2px;paint-order:stroke;text-anchor:middle}' +
      '.sso-echelon{fill:currentColor;stroke:none}' +
      '.sso-status-bg{fill:rgba(9,11,9,.88);stroke:#000;stroke-width:2}' +
      '.sso-text{font:700 10px Arial Narrow,Arial,sans-serif;letter-spacing:.055em;fill:#f3f0df;stroke:#0a0c09;stroke-width:3px;paint-order:stroke;stroke-linejoin:round;text-anchor:middle}' +
      '.sso-id{font-size:9px;fill:#fff}.sso-status{font-size:9px}' +
      '.sso-objective{fill:rgba(12,14,11,.78);stroke-width:2.2}.sso-objective-line{stroke:currentColor;stroke-width:1.8}' +
      '.sso-contact{fill:#fff;stroke:#111;stroke-width:1.5}' +
      '.sso-hidden{display:none!important}';
    document.head.appendChild(style);

    overlay = document.createElement('div');
    overlay.id = 'squadStatusOverlay';
    svg = makeSvg('svg', { 'aria-hidden': 'true' });
    var defs = makeSvg('defs');
    svg.appendChild(defs);
    overlay.appendChild(svg);
    document.body.appendChild(overlay);

    button = document.createElement('button');
    button.id = 'squadStatusToggle';
    button.type = 'button';
    button.textContent = 'Squad Overlay';
    button.title = 'WWII-style squad symbols, movement intent and objectives';
    button.onclick = function () { setVisible(!visible); };
    document.body.appendChild(button);
    syncUi();
  }
  function syncUi() {
    if (overlay) overlay.hidden = !visible;
    if (button) button.classList.toggle('on', visible);
  }
  function setVisible(v) {
    visible = !!v;
    try { localStorage.setItem(STORAGE, visible ? '1' : '0'); } catch (_) {}
    syncUi();
    return visible;
  }

  function createMark(sq) {
    var key = String(sq.faction || '?') + ':' + String(sq.id), g = makeSvg('g', { 'data-squad': key }), factionClass = sq.faction === 'ge' ? 'sso-ge' : 'sso-us';
    g.setAttribute('class', factionClass);
    var arrowHalo = append(g, 'path', { 'class': 'sso-arrow-halo' }),
      arrow = append(g, 'path', { 'class': 'sso-arrow' }),
      arrowHead = append(g, 'path', { 'class': 'sso-arrow-head', d: 'M0 0 L-24 -12 L-18 0 L-24 12 Z' }),
      objective = append(g, 'g', { 'class': 'sso-objective-group' });
    append(objective, 'path', { 'class': 'sso-objective', d: 'M0 -11 L11 0 L0 11 L-11 0 Z' });
    append(objective, 'path', { 'class': 'sso-objective-line', d: 'M-6 0 L6 0 M0 -6 L0 6' });
    var objText = append(objective, 'text', { 'class': 'sso-text sso-id', x: '0', y: '24' }, 'OBJ');

    var unit = append(g, 'g', { 'class': 'sso-unit' }),
      symbolLayer = append(unit, 'g', { 'class': 'sso-symbol-layer' });
    var idText = append(unit, 'text', { 'class': 'sso-text sso-id', x: '34', y: '4', 'text-anchor': 'start' }, String(sq.id));
    var statusBg = append(unit, 'rect', { 'class': 'sso-status-bg', x: '-34', y: '20', width: '68', height: '17', rx: '3' });
    var statusText = append(unit, 'text', { 'class': 'sso-text sso-status', x: '0', y: '32' }, 'HOLD');
    var contact = append(unit, 'circle', { 'class': 'sso-contact', cx: '32', cy: '-14', r: '4' });
    svg.appendChild(g);
    var mark = marks[key] = {
      key: key,
      g: g,
      arrowHalo: arrowHalo,
      arrow: arrow,
      arrowHead: arrowHead,
      arrowSignature: null,
      arrowStartedAt: null,
      objective: objective,
      objText: objText,
      unit: unit,
      symbolLayer: symbolLayer,
      symbolId: null,
      idText: idText,
      statusBg: statusBg,
      statusText: statusText,
      contact: contact
    };
    renderSymbol(mark, sq);
    return mark;
  }
  function primitiveAllowed(tag) {
    return tag === 'path' || tag === 'rect' || tag === 'circle' || tag === 'ellipse' || tag === 'line' || tag === 'polygon' || tag === 'text';
  }
  function renderPrimitive(parent, primitive) {
    if (!primitive || !primitiveAllowed(primitive.tag)) return null;
    return append(parent, primitive.tag, primitive.attrs || {}, primitive.text);
  }
  function renderEchelon(parent, echelon) {
    if (!echelon || echelon.kind !== 'dots') return;
    var count = Math.max(0, Math.min(4, +echelon.count || 0)),
      y = isFinite(+echelon.y) ? +echelon.y : -22,
      spacing = 8,
      start = -((count - 1) * spacing) / 2;
    for (var i = 0; i < count; i++)
      append(parent, 'circle', { 'class': 'sso-echelon', cx: start + i * spacing, cy: y, r: 3.2 });
  }
  function renderSymbol(m, sq) {
    if (!m || !m.symbolLayer) return;
    var id = symbolIdFor(sq),
      spec = symbolSpec(sq);
    if (m.symbolId === id) return;
    while (m.symbolLayer.firstChild) m.symbolLayer.removeChild(m.symbolLayer.firstChild);
    if (spec.frame) renderPrimitive(m.symbolLayer, spec.frame);
    (spec.primitives || []).forEach(function (primitive) {
      renderPrimitive(m.symbolLayer, primitive);
    });
    renderEchelon(m.symbolLayer, spec.echelon);
    m.symbolId = id;
    m.g.setAttribute('data-symbol', id);
  }

  function disposeMark(key) {
    var m = marks[key];
    if (!m) return;
    try { if (m.g && m.g.parentNode) m.g.parentNode.removeChild(m.g); } catch (_) {}
    delete marks[key];
  }
  function clearMarks() {
    Object.keys(marks).forEach(disposeMark);
  }

  function worldY(sim, p, lift) {
    var y = 0;
    try { y = sim && sim.heightAt ? +sim.heightAt(p.x, p.z) || 0 : 0; } catch (_) { y = 0; }
    return y + lift;
  }
  function project(sim, p, lift) {
    if (!sim || !sim.scene || !p || typeof BABYLON === 'undefined') return null;
    var scene = sim.scene, engine = scene.getEngine && scene.getEngine(), camera = scene.activeCamera;
    if (!engine || !camera || !BABYLON.Vector3 || !BABYLON.Matrix) return null;
    var canvas = engine.getRenderingCanvas && engine.getRenderingCanvas(), rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    if (!canvas || !rect || !(rect.width > 0) || !(rect.height > 0)) return null;
    identity = identity || BABYLON.Matrix.Identity();
    var vp = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
      q = BABYLON.Vector3.Project(new BABYLON.Vector3(p.x, worldY(sim, p, lift), p.z), identity, scene.getTransformMatrix(), vp),
      x = rect.left + q.x * rect.width / engine.getRenderWidth(),
      y = rect.top + q.y * rect.height / engine.getRenderHeight();
    return { x: x, y: y, z: q.z, visible: q.z >= 0 && q.z <= 1 && x >= rect.left - OFFSCREEN_PAD && x <= rect.right + OFFSCREEN_PAD && y >= rect.top - OFFSCREEN_PAD && y <= rect.bottom + OFFSCREEN_PAD };
  }
  function curvePath(a, b, sq) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1,
      bend = Math.min(42, Math.max(14, len * 0.12)) * (((+sq.id || 0) % 2) ? 1 : -1),
      cx = (a.x + b.x) / 2 + (-dy / len) * bend,
      cy = (a.y + b.y) / 2 + (dx / len) * bend;
    return 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
  }
  function setShown(node, on) {
    if (node) node.style.display = on ? '' : 'none';
  }
  function objectiveLabel(sq, obj) {
    if (obj && obj.id) return String(obj.id).toUpperCase();
    return 'OBJ ' + String(sq.id);
  }
  function hideArrow(m) {
    setShown(m.arrowHalo, false);
    setShown(m.arrow, false);
    setShown(m.arrowHead, false);
  }
  function renderArrowWipe(m, sq, fromScreen, toScreen, elapsed) {
    var d = curvePath(fromScreen, toScreen, sq);
    m.arrowHalo.setAttribute('d', d);
    m.arrow.setAttribute('d', d);
    var length = 0;
    try { length = Math.max(1, m.arrow.getTotalLength()); } catch (_) { length = Math.max(1, Math.hypot(toScreen.x - fromScreen.x, toScreen.y - fromScreen.y)); }
    var wipe = Math.min(1, Math.max(0, elapsed / ARROW_WIPE_MS)),
      tail = elapsed - ARROW_WIPE_MS - ARROW_HOLD_MS,
      opacity = tail <= 0 ? 1 : Math.max(0, 1 - tail / ARROW_FADE_MS),
      shown = Math.max(0.01, length * wipe);
    m.arrow.style.opacity = opacity.toFixed(3);
    m.arrowHalo.style.opacity = (opacity * 0.72).toFixed(3);
    m.arrow.setAttribute('stroke-dasharray', length.toFixed(1) + ' ' + length.toFixed(1));
    m.arrowHalo.setAttribute('stroke-dasharray', length.toFixed(1) + ' ' + length.toFixed(1));
    m.arrow.setAttribute('stroke-dashoffset', (length - shown).toFixed(1));
    m.arrowHalo.setAttribute('stroke-dashoffset', (length - shown).toFixed(1));

    var tipLength = Math.min(length, shown),
      p = null,
      before = null;
    try {
      p = m.arrow.getPointAtLength(tipLength);
      before = m.arrow.getPointAtLength(Math.max(0, tipLength - 8));
    } catch (_) {}
    if (p && before) {
      var angle = Math.atan2(p.y - before.y, p.x - before.x) * 180 / Math.PI;
      m.arrowHead.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ')');
      m.arrowHead.style.opacity = opacity.toFixed(3);
      setShown(m.arrowHead, wipe > 0.04 && opacity > 0);
    } else setShown(m.arrowHead, false);
    setShown(m.arrowHalo, opacity > 0);
    setShown(m.arrow, opacity > 0);
  }
  function updateMark(m, sq, sim, nowMs) {
    var at = centroid(sq, sim);
    if (!at) { m.g.style.display = 'none'; return; }
    var screen = project(sim, at, LIFT);
    if (!screen || !screen.visible) { m.g.style.display = 'none'; return; }
    m.g.style.display = '';
    renderSymbol(m, sq);
    m.unit.setAttribute('transform', 'translate(' + screen.x.toFixed(1) + ' ' + screen.y.toFixed(1) + ')');
    m.idText.textContent = (sq.faction === 'ge' ? 'GE ' : 'US ') + String(sq.id);
    var st = statusFor(sq, sim), label = st.label,
      w = Math.max(68, Math.min(142, label.length * 6.3 + 18));
    m.statusText.textContent = label;
    m.statusBg.setAttribute('width', w.toFixed(0));
    m.statusBg.setAttribute('x', (-w / 2).toFixed(1));
    setShown(m.contact, !!sq.inContact);

    var obj = missionObjective(sq, sim), objScreen = obj && project(sim, obj, OBJECTIVE_LIFT);
    if (objScreen && objScreen.visible) {
      m.objective.setAttribute('transform', 'translate(' + objScreen.x.toFixed(1) + ' ' + objScreen.y.toFixed(1) + ')');
      m.objText.textContent = objectiveLabel(sq, obj);
      var labelLane = ((+sq.id || 0) % 3) - 1;
      m.objText.setAttribute('x', String(labelLane * 28));
      setShown(m.objective, true);
    } else setShown(m.objective, false);

    var target = arrowTarget(sq, sim),
      targetScreen = target && project(sim, target, OBJECTIVE_LIFT),
      longMove = !!(hasSquadMovementIntent(sq, sim) && target && dist(at, target) >= LONG_ARROW_WORLD),
      sig = longMove ? arrowSignature(sq, target) : null;
    /* A long destination gets one command-arrow wipe when it becomes visible/new. Local 13 m anchor
       updates and fireteam bounds never retrigger it. */
    if (longMove && targetScreen && targetScreen.visible) {
      if (m.arrowSignature !== sig) {
        m.arrowSignature = sig;
        m.arrowStartedAt = nowMs || 0;
      }
      var elapsed = Math.max(0, (nowMs || 0) - (m.arrowStartedAt || 0)),
        total = ARROW_WIPE_MS + ARROW_HOLD_MS + ARROW_FADE_MS;
      if (elapsed <= total) renderArrowWipe(m, sq, screen, targetScreen, elapsed);
      else hideArrow(m);
    } else {
      /* Preserve the last played destination signature while it remains the same assignment. The
         150 m test controls visibility/eligibility only; it is not a "new order" detector. */
      if (target) {
        var dormantSig = arrowSignature(sq, target);
        if (m.arrowSignature == null) m.arrowSignature = dormantSig;
        else if (m.arrowSignature !== dormantSig) {
          m.arrowSignature = null;
          m.arrowStartedAt = null;
        }
      } else {
        m.arrowSignature = null;
        m.arrowStartedAt = null;
      }
      hideArrow(m);
    }
  }
  function update() {
    if (!visible || !simRef || !svg) return;
    var seen = Object.create(null), nowMs = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    ['us', 'ge'].forEach(function (faction) {
      var squads = sideSquads(simRef, faction);
      for (var i = 0; i < squads.length; i++) {
        var sq = squads[i];
        if (!sq || sq.disbanded || !living(sq).length) continue;
        var key = String(sq.faction || faction) + ':' + String(sq.id), m = marks[key] || createMark(sq);
        seen[key] = 1;
        updateMark(m, sq, simRef, nowMs);
      }
    });
    Object.keys(marks).forEach(function (key) { if (!seen[key]) disposeMark(key); });
  }
  function frame() {
    raf = 0;
    update();
    if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame);
  }
  function startLoop() {
    if (typeof requestAnimationFrame !== 'function' || raf) return;
    raf = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0;
  }
  function start(sim) {
    simRef = sim || root.__battle__ || null;
    installUi();
    clearMarks();
    startLoop();
  }
  function reset(sim) {
    if (!sim || sim === simRef) clearMarks();
  }
  function dispose() {
    stopLoop();
    clearMarks();
    try { if (button && button.parentNode) button.parentNode.removeChild(button); } catch (_) {}
    try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (_) {}
    try { if (style && style.parentNode) style.parentNode.removeChild(style); } catch (_) {}
    button = overlay = svg = style = null;
    simRef = null;
  }

  root.BattleSquadStatusOverlay = {
    version: '1.2',
    historicalBasis: 'Per-symbol provenance is supplied by BattleTacticalSymbols; infantry currently cites FM 21-30 (1941)',
    statusFor: statusFor,
    movementTarget: movementTarget,
    arrowTarget: arrowTarget,
    arrowSignature: arrowSignature,
    longArrowWorld: LONG_ARROW_WORLD,
    missionObjective: missionObjective,
    symbolIdFor: symbolIdFor,
    symbolSpec: symbolSpec,
    setVisible: setVisible,
    visible: function () { return visible; },
    update: update,
    dispose: dispose
  };
  root.BattleModules.registerSystem('squad-status-overlay', {
    version: '1.2',
    onBattleStart: start,
    beforeBattleRestart: reset,
    onBattleRestart: start
  });
  if (typeof document !== 'undefined') installUi();
  console.log('[UI] tactical status overlay active: registry-driven unit symbols + momentary long-range command arrows/objectives');
})(typeof window !== 'undefined' ? window : globalThis);
