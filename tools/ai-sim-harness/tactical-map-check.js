#!/usr/bin/env node
'use strict';
/* Presentation-only map regression: faction separation, reported-fix movement,
   stale-memory expiry, possessed-player lock, restart reset and symbol-kit use. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(
  path.join(__dirname, '../../battle/modules/55-reported-contact-tactical-map.js'),
  'utf8'
);

function element(tag) {
  return {
    tag,
    children: [],
    attrs: {},
    parentNode: null,
    hidden: false,
    style: {},
    classList: { toggle() {} },
    setAttribute(k, v) {
      this.attrs[k] = String(v);
    },
    appendChild(n) {
      n.parentNode = this;
      this.children.push(n);
      return n;
    },
    removeChild(n) {
      const i = this.children.indexOf(n);
      if (i >= 0) this.children.splice(i, 1);
      n.parentNode = null;
    },
    get firstChild() {
      return this.children[0] || null;
    },
    set textContent(v) {
      this.value = String(v);
    },
    get textContent() {
      return this.value || '';
    }
  };
}
const head = element('head'),
  body = element('body');
const doc = {
  head,
  body,
  createElement: element,
  createElementNS(ns, tag) {
    return element(tag);
  }
};
let system = null,
  viewCalls = [],
  registeredSymbols = 0;
const infantry = {
  frame: { tag: 'rect', attrs: { x: -27, y: -16, width: 54, height: 32, class: 'sso-frame' } },
  primitives: [{ tag: 'path', attrs: { d: 'M-24 -13 L24 13', class: 'sso-symbol-stroke' } }],
  echelon: { kind: 'dots', count: 1, y: -22 }
};
const ctx = {
  console,
  document: doc,
  BattleModules: {
    registerSystem(id, spec) {
      system = { id, spec };
    }
  },
  BattleTacticalSymbols: {
    resolve(entity) {
      registeredSymbols++;
      return infantry;
    },
    get(id) {
      return id === 'infantry' ? infantry : null;
    }
  },
  BattleSquadStatusOverlay: {
    overlayEntities(sim, side) {
      return (sim.factions[side].squads || []).map(entity => ({ entity }));
    },
    statusFor() {
      return { label: 'HOLD' };
    }
  },
  BattleTacticalSituation: {
    compute(sim, side) {
      viewCalls.push(side);
      return {
        faction: side,
        aliveSquads: 1,
        contacts: sim.reports[side] || []
      };
    }
  },
  BattleScenarioGenerator: {
    MAP_W: 2000,
    MAP_D: 1200,
    current() {
      return ctx.BATTLE_SCENARIO;
    }
  },
  BATTLE_SCENARIO: {
    map: { width: 2000, depth: 1200 },
    roads: [{ ax: -100, az: 0, bx: 100, bz: 0, width: 10 }],
    buildings: [{ x: 30, z: 20, w: 15, d: 9 }],
    objectives: [{ id: 'A', x: 0, z: 100 }]
  }
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(source, ctx, { filename: '55-reported-contact-tactical-map.js' });
const M = ctx.BattleTacticalMap;
assert(M && system && system.id === 'reported-contact-tactical-map');
assert.equal(M.retentionSeconds, 60);
assert.deepEqual(JSON.parse(JSON.stringify(M.project({ x: 0, z: 0 }, { width: 2000, depth: 1200 }))), {
  x: 500,
  y: 300
});
assert.deepEqual(JSON.parse(JSON.stringify(M.project({ x: -1000, z: 600 }, { width: 2000, depth: 1200 }))), {
  x: 30,
  y: 20
});
assert.equal(M.project({ x: Infinity, z: 0 }), null);

const ledger = { lastTime: null, byKey: Object.create(null) };
const seen = (x, at, extras) =>
  Object.assign(
    {
      squad: 'us-1',
      targetId: 77,
      x,
      z: 12,
      at,
      source: 'seen'
    },
    extras || {}
  );
let contacts = M.reconcile(ledger, [seen(10, 4)], 4);
assert.equal(contacts.length, 1);
assert.equal(contacts[0].age, 0);
assert.equal(contacts[0].movement, null);
contacts = M.reconcile(ledger, [seen(34, 8)], 8);
assert.equal(
  contacts[0].movement.from.x,
  10,
  'only two dated reported fixes can produce an observed movement arrow'
);
assert.equal(contacts[0].movement.to.x, 34);
contacts = M.reconcile(ledger, [], 23);
assert.equal(contacts[0].movement, null, 'old movement evidence expires');
assert.equal(contacts[0].x, 34, 'the last known position does not chase the enemy');
assert.equal(M.reconcile(ledger, [], 69).length, 0, 'stale reports expire');
assert.equal(
  M.reconcile(ledger, [seen(10, 5)], 5).length,
  1,
  'replay clock rewind starts a new intel history'
);
assert.equal(
  M.reconcile(ledger, [seen(20, 6, { targetId: null })], 6).every(c => !c.movement),
  true,
  'unknown identification cannot infer tracks'
);
assert.equal(M.reconcile(ledger, [seen(30, 999)], 8).length, 2, 'future observations are rejected');
assert.equal(
  M.reconcile(ledger, [seen(Infinity, 8)], 8).length,
  2,
  'invalid reported coordinates cannot create contacts'
);

const friendly = {
  id: 'us-1',
  faction: 'us',
  members: [{ id: 'friendly-1', root: { position: { x: 100, z: -100 } }, isPlayer: true }]
};
const enemy = {
  id: 'ge-1',
  faction: 'ge',
  members: [{ id: 'enemy-1', root: { position: { x: -400, z: 500 } } }]
};
const sim = {
  time: 10,
  factions: { us: { squads: [friendly] }, ge: { squads: [enemy] } },
  objectiveControl: { sectors: { A: { owner: 'ge' } } },
  reports: {
    us: [seen(10, 9)],
    ge: [{ squad: 'ge-1', targetId: 99, x: -100, z: -90, at: 8, source: 'heard' }]
  }
};
assert.equal(M.playerSide(sim), 'us');
system.spec.onBattleStart(sim);
M.setOpen(true);
assert.equal(viewCalls.at(-1), 'us', 'player possession locks enemy intel behind own side');
assert(registeredSymbols > 0, 'friendly units draw from registered tactical symbol kit');
function all(n) {
  return [n, ...n.children.flatMap(all)];
}
let values = all(body)
  .map(n => n.textContent)
  .join(' ');
assert(values.includes('US intelligence'), 'own-side map rendered');
assert(!values.includes('enemy-1'), 'opponent live roster cannot appear on contact map');
const units = all(body).filter(n => n.tag === 'g' && /gtm-friendly/.test(n.attrs.class || ''));
const reports = all(body).filter(n => n.tag === 'g' && /gtm-enemy/.test(n.attrs.class || ''));
assert.equal(units.length, 1);
assert.equal(reports.length, 1);

friendly.members[0].isPlayer = false;
M.setOpen(false);
system.spec.beforeBattleRestart(sim);
M.setOpen(true);
const side = all(body).find(n => n.tag === 'select');
assert(side && !side.disabled, 'spectators may select a report perspective');
side.value = 'ge';
side.onchange();
assert.equal(viewCalls.at(-1), 'ge', 'spectator can view opposite faction intel');
sim.time = 1;
system.spec.onBattleRestart(sim);
M.setOpen(true);
assert.equal(viewCalls.at(-1), 'ge', 'restart keeps selection, not stale sighting data');
M.dispose();
assert.equal(all(body).filter(n => n.tag === 'section').length, 0, 'dispose removes panel');
console.log('tactical-map-check: PASS');
