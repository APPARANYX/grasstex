#!/usr/bin/env node
'use strict';
/* Squad fit (2e): what a squad is good at pulls the General toward the objective that suits it.

   The geometry ties the score exactly (three neutral objectives 150 m from where the squads stand), so only the
   stats can decide, and each squad is the top of its side on exactly one composite:
     A is nearest home and next to the enemy; B is mid and the safest; C is furthest from home and from the enemy.
     pace squad -> A (the first), grit squad -> C (the furthest), support squad -> B (the safest).
   Guardrails: a squad at the median or below is not pulled; the pull is a score, so an objective another squad is
   already on (saturation) still loses; `?stats=0` and a list without `squad` give the choice the module absent
   gives; a defence is never pulled; and the squad-fit terms add no random draw. Mechanism, not dice. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function load(r, file) {
  new Function('window', 'globalThis', 'console', 'location', fs.readFileSync(path.join(H.REPO, file), 'utf8'))(
    r,
    r,
    { log() {}, warn() {} },
    r.location
  );
}
const base = { phy: 0.4, agi: 0.4, for: 0.4, tec: 0.4, mkm: 0.4, tac: 0.5 };

function world({ stats = true, search, generalIntel = false } = {}) {
  H.resetIds();
  const query = generalIntel ? (search || '') : (search ? search + '&generalIntel=0' : '?generalIntel=0');
  const r = H.bootstrap({ stats, modules: true, search: query });
  r.BattleModules.unitsFor = b => (b._roster.us || []).concat(b._roster.ge || []);
  load(r, 'battle/commander-doctrine.js');
  if (stats && search != null) r.BattleSoldierStats.configure(search);
  const b = H.makeBattle(r);
  const squads = {};
  for (const [id, mine] of [
    ['us-1', { phy: 0.9, agi: 0.9 }],
    ['us-2', { for: 0.9 }],
    ['us-3', { tec: 0.9, mkm: 0.9 }]
  ]) {
    const q = H.addSquad(r, b, { id, faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
    q.home = { x: 0, z: -300 };
    q.members.forEach(s => {
      s.root.position.x = 0;
      s.root.position.z = 0;
      if (stats) Object.assign(r.BattleSoldierStats.of(s), base, mine);
    });
    squads[id] = q;
  }
  const foe = H.addSquad(r, b, { id: 'ge-1', faction: 'ge', x: -100, z: -150, objective: { x: 0, z: 0 } });
  foe.members.forEach(s => {
    s.root.position.x = -100;
    s.root.position.z = -150;
  });
  // Listed C, B, A: with the score tied, the first in the list wins unless the stats say otherwise.
  b._objectives = [
    { id: 'C', def: { x: 0, z: 150, radius: 30, value: 1 }, state: { owner: 'neutral' } },
    { id: 'B', def: { x: 150, z: 0, radius: 30, value: 1 }, state: { owner: 'neutral' } },
    { id: 'A', def: { x: 0, z: -150, radius: 30, value: 1 }, state: { owner: 'neutral' } }
  ];
  b.time = 5;
  return { r, b, D: r.BattleCommanderDoctrine, squads, foe };
}
const pick = (w, id, wantOwned) => {
  const c = w.D.chooseObjective(w.b, w.squads[id], !!wantOwned);
  return c && c.instance.id;
};

test('the score ties exactly, so the module absent picks the first objective in the list for every squad', () => {
  const w = world({ stats: false });
  for (const id of ['us-1', 'us-2', 'us-3']) assert.equal(pick(w, id), 'C', id);
});

test('pace takes the first objective, grit the furthest, support the safest', () => {
  const w = world();
  assert.equal(pick(w, 'us-1'), 'A', 'the fastest squad runs to the objective nearest home');
  assert.equal(pick(w, 'us-2'), 'C', 'the steadiest squad goes for the furthest');
  assert.equal(pick(w, 'us-3'), 'B', 'the best base of fire takes the safe ground');
  const c = w.D.chooseObjective(w.b, w.squads['us-1'], false);
  assert.ok(c.squadFit > 0 && c.squadFit <= w.D.tuning.SQUAD_FIT + 1e-9, 'the pull is bounded by SQUAD_FIT');
});

test('shipping General uses reported hostile position, not the live enemy transform, for support fit', () => {
  const w = world({ generalIntel: true });
  const support = w.squads['us-3'];
  const before = pick(w, 'us-3');
  w.foe.members.forEach(s => { s.root.position.x = 900; s.root.position.z = 900; });
  assert.equal(pick(w, 'us-3'), before, 'unreported live enemy movement cannot change Macro squad fit');
  const reported = { x: -100, z: -150, at: w.b.time, knownUnitId: w.foe.members[0].id };
  const real = w.r.SquadAI.squadContact;
  w.r.SquadAI.squadContact = sq => sq.faction === 'us' ? reported : null;
  assert.equal(pick(w, 'us-3'), 'B', 'reported enemy position makes B the safe support ground');
  w.r.SquadAI.squadContact = real;
});

test('the pull is above the median only: a squad in the middle of its side gets the module-absent choice', () => {
  const w = world();
  for (const s of w.squads['us-1'].members) Object.assign(w.r.BattleSoldierStats.of(s), base);
  assert.equal(pick(w, 'us-1'), 'C', 'with nothing to distinguish it, the list order decides');
  const thin = world();
  thin.squads['us-1'].members.slice(2).forEach(s => (s.dead = true));
  assert.equal(pick(thin, 'us-1'), 'C', 'a squad down to two men is noise and pulls nothing');
});

test('it is a score, not a veto: an objective another squad is already on still loses', () => {
  const w = world();
  w.squads['us-2'].targetObjective = 'A';
  assert.notEqual(pick(w, 'us-1'), 'A', 'saturation (55) outweighs the pull (30)');
});

test('?stats=0, a list without squad, and a defence give the choice the module absent gives', () => {
  for (const search of ['?stats=0', '?stats=for,tac']) {
    const w = world({ search });
    for (const id of ['us-1', 'us-2', 'us-3']) assert.equal(pick(w, id), 'C', search + ' ' + id);
  }
  const w = world();
  w.b._objectives.forEach(o => (o.state.owner = 'us'));
  const flat = world({ stats: false });
  flat.b._objectives.forEach(o => (o.state.owner = 'us'));
  for (const id of ['us-1', 'us-2', 'us-3'])
    assert.equal(pick(w, id, true), pick(flat, id, true), 'defence ' + id + ' is not pulled');
});

test('the terms add no random draw', () => {
  const w = world(),
    real = Math.random;
  let draws = 0;
  Math.random = () => (draws++, 0.5);
  w.b.random = () => (draws++, 0.5);
  try {
    for (const id of ['us-1', 'us-2', 'us-3']) pick(w, id);
  } finally {
    Math.random = real;
  }
  assert.equal(draws, 0);
});

console.log('squad-fit-check: ' + n + ' passed');
