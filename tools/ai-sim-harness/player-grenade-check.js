#!/usr/bin/env node
'use strict';
/* Exercise the shipping keyboard/controller handlers with a small DOM/camera adapter.
   The grenade owner is a strict API double: controls may request and read, never mutate inventory. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');

class Vector {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
  set(x, y, z) {
    Object.assign(this, { x, y, z });
  }
  clone() {
    return new Vector(this.x, this.y, this.z);
  }
  copyFrom(p) {
    this.set(p.x, p.y, p.z);
  }
  add(p) {
    return new Vector(this.x + p.x, this.y + p.y, this.z + p.z);
  }
  scale(n) {
    return new Vector(this.x * n, this.y * n, this.z * n);
  }
  lengthSquared() {
    return this.x ** 2 + this.y ** 2 + this.z ** 2;
  }
  normalize() {
    const n = Math.sqrt(this.lengthSquared());
    this.set(this.x / n, this.y / n, this.z / n);
    return this;
  }
  static Project(p) {
    return { x: 400 + p.x * 4, y: 300 - p.y * 4, z: 0.5 };
  }
}
class Camera {
  constructor(name, position) {
    this.position = position;
    this.rotation = { x: 0, y: 0 };
    this.inputs = { clear() {} };
    this.viewport = { toGlobal: () => ({}) };
  }
  setTarget(p) {
    this.target = p;
  }
  getTarget() {
    return this.target;
  }
  getForwardRay() {
    const direction = new Vector(
      this.target.x - this.position.x,
      this.target.y - this.position.y,
      this.target.z - this.position.z
    ).normalize();
    return { origin: this.position, direction };
  }
  getTransformationMatrix() {
    return {};
  }
}

function setup(enabled) {
  const elements = new Map(),
    handlers = new Map(),
    frames = [];
  function element(tag) {
    const e = {
      tagName: tag.toUpperCase(),
      style: {},
      children: [],
      attributes: {},
      classList: { toggle() {} },
      addEventListener(type, fn) {
        handlers.set(this.id + ':' + type, fn);
      },
      appendChild(child) {
        this.children.push(child);
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      querySelector(selector) {
        return elements.get(selector.slice(1));
      },
      focus() {
        document.activeElement = this;
      },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
    };
    Object.defineProperty(e, 'id', {
      set(value) {
        this._id = value;
        elements.set(value, this);
      },
      get() {
        return this._id;
      }
    });
    Object.defineProperty(e, 'innerHTML', {
      set(value) {
        for (const match of value.matchAll(/id="([^"]+)"/g)) {
          const child = element('div');
          child.id = match[1];
          e.children.push(child);
        }
      }
    });
    return e;
  }
  const document = {
    body: element('body'),
    head: element('head'),
    createElement: element,
    createElementNS: (ns, tag) => element(tag),
    getElementById: id => elements.get(id),
    addEventListener: (type, fn) => handlers.set('document:' + type, fn)
  };
  const canvas = element('canvas');
  canvas.id = 'canvas';
  const hint = element('div');
  hint.id = 'cameraHint';
  const soldier = {
    id: 14,
    faction: 'us',
    role: 'rifleman',
    root: { position: new Vector(), rotation: { y: 0 } },
    hp: 100,
    maxHp: 100,
    wounds: [],
    eng: { stance: 'stand' }
  };
  Object.defineProperty(soldier, 'grenades', { value: 2, writable: false });
  Object.defineProperty(soldier, '_grenadeNextAt', { value: 0, writable: false });
  const squad = { id: 'us-0', members: [soldier] };
  soldier.squad = squad;
  const battle = {
    time: 10,
    _roster: { us: [soldier], ge: [] },
    factions: { us: { squads: [squad] }, ge: { squads: [] } },
    heightAt: () => 0
  };
  let pad = null,
    pending = null,
    legal = true,
    now = 1000,
    fireCalls = 0,
    move = null,
    throws = [],
    projectiles = [];
  function gated(value) {
    assert.equal(enabled, true, 'flag-off controls must not read or invoke the grenade owner');
    return value;
  }
  const window = {
    GTMath: { clamp: (n, a, b) => Math.max(a, Math.min(b, n)) },
    GTLog() {},
    matchMedia: () => ({ matches: true }),
    navigator: { getGamepads: () => (pad ? [pad] : []) },
    addEventListener: (type, fn) => handlers.set('window:' + type, fn),
    location: { search: enabled ? '' : '?grenades=0' },
    __battle__: battle,
    SquadAI: {
      playerAim() {},
      playerFireRay() {
        fireCalls++;
        return false;
      }
    },
    BattleMovementResolver: {
      proposePlayer(s, goal) {
        move = goal;
      },
      clearPlayer() {}
    },
    BattleGrenades: {
      on: () => enabled,
      count: () => gated(2),
      cooldownLeft: () => gated(0),
      pendingOf: () => gated(pending),
      projectiles: () => gated(projectiles),
      playerThrow(s, b, aim) {
        gated(null);
        throws.push({ s, b, aim });
        pending = { releaseAt: b.time + 0.9 };
        return pending;
      },
      preview(s, b, aim) {
        gated(null);
        return {
          legal,
          reason: legal ? null : 'wall',
          from: { x: 0, y: 1.3, z: 0 },
          to: { x: aim.x, y: 0, z: Math.min(30, aim.z) },
          points: [new Vector(0, 1.3, 0), new Vector(0, 4, 15), new Vector(0, 0, 30)]
        };
      }
    }
  };
  vm.runInNewContext(source, {
    window,
    document,
    URLSearchParams,
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    BABYLON: { Vector3: Vector, UniversalCamera: Camera, Matrix: { Identity: () => ({}) } }
  });
  window.BattleDesktopCamera.create({
    scenario: { center: { x: 0, z: 0 } },
    scene: { onBeforeRenderObservable: { add: fn => frames.push(fn) } },
    canvas,
    engine: { getDeltaTime: () => 16, getRenderWidth: () => 800, getRenderHeight: () => 600 },
    battleSim: { heightAt: () => 0 }
  });
  function event(scope, type, data = {}) {
    const e = { target: canvas, preventDefault() {}, ...data };
    handlers.get(scope + ':' + type)(e);
  }
  function key(value, repeat = false) {
    event('window', 'keydown', { key: value, repeat });
  }
  function tick() {
    now += 100;
    frames.forEach(fn => fn());
  }
  key('p');
  return {
    elements,
    window,
    battle,
    soldier,
    event,
    key,
    tick,
    throws,
    get fireCalls() {
      return fireCalls;
    },
    get move() {
      return move;
    },
    pending(value) {
      pending = value;
    },
    legal(value) {
      legal = value;
    },
    pad(value) {
      pad = value;
    },
    projectiles(value) {
      projectiles = value;
    }
  };
}

const off = setup(false);
off.key('g');
off.event('canvas', 'mousedown', { button: 2 });
off.tick();
assert.equal(off.throws.length, 0);
assert.equal(off.elements.has('battlePlayerGrenades'), false, 'flag-off adds no grenade HUD');
assert.equal(off.elements.has('battlePlayerGrenadePreview'), false, 'flag-off adds no grenade overlay');

const on = setup(true),
  aim = on.window.BattleDesktopCamera.grenadeAimPoint;
const groundAim = aim({ origin: { x: 3, y: 2, z: 0 }, direction: { x: 0, y: -0.5, z: 1 } }, () => 0);
assert.ok(Math.abs(groundAim.z - 4) < 0.003, 'downward view intersects the real terrain height');
assert.equal(groundAim.x, 3);
assert.equal(aim({ origin: new Vector(), direction: new Vector(0, 1, 0) }, () => 0).z, 0);
assert.equal(
  aim(null, () => 0),
  null
);
const trigger = (button, down) =>
  on.event(down ? 'canvas' : 'window', down ? 'mousedown' : 'mouseup', { button });
// Aiming alone shows nothing: the grenade has to be chosen first.
trigger(2, true);
on.tick();
const overlay = on.elements.get('battlePlayerGrenadePreview'),
  hud = on.elements.get('battlePlayerGrenades');
assert.notEqual(overlay.style.display, 'block', 'aiming with the rifle shows no grenade arc');
assert.match(hud.textContent, /GRENADES 2 · G \/ RB SELECT/);
trigger(0, true);
on.tick();
assert.equal(on.fireCalls, 1, 'fire is a rifle shot until a grenade is chosen');
assert.equal(on.throws.length, 0);
trigger(0, false);
on.key('g');
on.tick();
assert.match(hud.textContent, /SELECTED · AIM FOR ARC · FIRE TO THROW/, 'G chooses the grenade');
assert.equal(overlay.style.display, 'block', 'aiming with a chosen grenade shows the arc');
assert.match(overlay.children[0].attributes.d, /M.*L/, 'the actual preview points draw an arc');
assert.equal(overlay.children[0].attributes.stroke, '#f5d789');
on.legal(false);
on.tick();
assert.equal(overlay.children[0].attributes.stroke, '#fa8d7b', 'blocked arc is visibly distinct');
assert.match(overlay.children[2].textContent, /wall/);
on.legal(true);
on.key('g');
on.key('g', true);
on.tick();
assert.match(hud.textContent, /SELECTED/, 'duplicate downs and auto-repeat cannot cancel the choice');
assert.equal(on.throws.length, 0, 'choosing a grenade never throws');
// Fire is the throw: one press, one request, and no rifle round.
const rifleShots = on.fireCalls;
trigger(0, true);
on.tick();
assert.equal(on.throws.length, 1, 'fire throws the chosen grenade');
assert.equal(on.throws[0].s, on.soldier, 'request belongs to the possessed soldier');
assert.equal(on.throws[0].b, on.battle);
assert.ok(on.throws[0].aim.z > 60, 'a level view submits a distant request for core range clamping');
on.key('w');
on.tick();
assert.equal(on.move.z, 0, 'windup holds the player movement proposal');
assert.equal(on.fireCalls, rifleShots, 'windup suppresses rifle fire');
assert.match(hud.textContent, /THROWING/);
assert.equal(overlay.style.display, 'none');
on.pending(null);
on.tick();
assert.ok(on.move.z > 0, 'player movement resumes after release');
assert.equal(
  on.fireCalls,
  rifleShots,
  'the press that threw is spent: a held trigger does not fire the rifle'
);
assert.match(hud.textContent, /G \/ RB SELECT/, 'throwing returns to the rifle');
trigger(0, false);
on.tick();
trigger(0, true);
on.tick();
assert.equal(on.fireCalls, rifleShots + 1, 'a fresh press fires the rifle again');
trigger(0, false);
on.event('window', 'keyup', { key: 'g' });
trigger(0, true);
on.tick();
on.key('g'); // a trigger already held when the grenade is chosen must be released first
on.tick();
assert.equal(on.throws.length, 1, 'a held trigger cannot throw the moment a grenade is chosen');
trigger(0, false);
on.tick();
trigger(0, true);
on.tick();
assert.equal(on.throws.length, 2, 'a released and re-pressed trigger throws');
trigger(0, false);
on.pending(null);
on.projectiles([{ by: on.soldier.id, detonateAt: on.battle.time + 4.2 }]);
on.tick();
assert.match(hud.textContent, /FUSE 4\.2 s/, 'fuse uses the authoritative projectile clock');
on.projectiles([]);

const pad = { id: 'Xbox', mapping: 'standard', connected: true, axes: [], buttons: [] };
pad.buttons[5] = { pressed: true, value: 1 };
on.pad(pad);
on.tick();
assert.doesNotMatch(hud.textContent, /SELECTED/, 'reconnecting with RB held cannot choose a grenade');
pad.buttons[5] = { pressed: false, value: 0 };
on.tick();
pad.buttons[5] = { pressed: true, value: 1 };
on.tick();
on.tick();
assert.match(hud.textContent, /SELECTED/, 'RB chooses the grenade once per physical press');
pad.buttons[5] = { pressed: false, value: 0 };
pad.buttons[6] = { pressed: true, value: 1 };
on.tick();
assert.equal(overlay.style.display, 'block', 'LT shows the arc for a chosen grenade');
pad.buttons[7] = { pressed: true, value: 1 };
on.tick();
on.tick();
assert.equal(on.throws.length, 3, 'RT throws once per physical press');
pad.buttons[6] = { pressed: false, value: 0 };
pad.buttons[7] = { pressed: false, value: 0 };
on.pending(null);
on.tick();
pad.buttons[5] = { pressed: true, value: 1 };
on.tick();
assert.match(hud.textContent, /SELECTED/);
pad.buttons[5] = { pressed: false, value: 0 };
on.tick();
pad.buttons[5] = { pressed: true, value: 1 };
on.tick();
assert.doesNotMatch(hud.textContent, /SELECTED/, 'a second press of RB puts the grenade away');
on.event('window', 'keyup', { key: 'g' });
on.key('g');
on.tick();
assert.match(hud.textContent, /SELECTED/);
on.key('v');
assert.equal(on.soldier.isPlayer, false);
assert.equal(overlay.style.display, 'none', 'exit hides the throw preview');
on.event('window', 'keyup', { key: 'g' });
on.key('g');
assert.equal(on.throws.length, 3, 'free camera cannot throw');
on.key('p');
on.tick();
assert.match(hud.textContent, /G \/ RB SELECT/, 'a new possession starts with the rifle in hand');
on.event('window', 'keyup', { key: 'g' });
on.key('g');
on.window.__battle__ = { ...on.battle };
trigger(0, true);
on.tick();
assert.equal(on.throws.length, 3, 'stale possession cannot throw into a restarted battle');
assert.equal(on.soldier.isPlayer, false, 'restart releases possession normally');
assert.equal(on.soldier.grenades, 2, 'presentation never writes inventory');
assert.equal(on.soldier._grenadeNextAt, 0, 'presentation never writes cooldown');
console.log('PASS player grenades: G/RB choose, aim shows the arc, fire throws once, windup and release');
