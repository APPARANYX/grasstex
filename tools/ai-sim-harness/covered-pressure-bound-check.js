'use strict';
/* The pressured posture and the ordinary local-plan protection mode can
   coexist. Test the Squad Leader's sole native bound publisher without
   inventing a second destination or fire owner. The posture/geometry preflight
   is independently exercised by tactical-postures-check and covered-bounds-check. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');

function world(maneuver = true, opts = {}) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?coa=0&slStress=0&fireteamSplit=0&scoutsForward=0&stressAct=0&localPlan=1&localAmbush=1&coveredBounds=1' +
      (maneuver ? '&localManeuver=1' : '')
  });
  r.BattleModules = {
    registerSystem() {},
    unitsFor: b => b._roster.us.concat(b._roster.ge)
  };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  loadSquadCommandStack((root, file) => load(file), r);
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['sergeant', 'rifleman', 'rifleman', 'rifleman']
    });
  b.time = 5;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.members.forEach((s, i) => {
    s._fireteamKey = i < 2 ? 'alpha' : 'bravo';
    r.BattleEngagement.stateOf(s).state = 'engage';
  });
  q.state = opts.retreat ? 'retreat' : 'engaged';
  q.inContact = true;
  q.commandPhase = 'assault';
  q._macroMission = { version: 1, intent: 'capture', status: 'executing', point: { x: 0, z: 50 } };
  const S = r.BattleSquadStability,
    L = r.BattleLeases,
    E = r.BattleEngagement,
    P = S.tacticalPostures,
    report = {
      contactStarted: false,
      underFire: 0,
      pinned: 0,
      effective: 4,
      fireSupport: q.members.slice(),
      reacting: [],
      fled: []
    },
    task = {
      kind: 'protect',
      pressured: true,
      boundsAllowed: false,
      emergency: !!opts.emergency,
      eligible: {
        protect: true,
        recover: !!opts.recover,
        'structure-security': !!opts.security,
        'objective-security': !!opts.objective
      },
      inputs: { resources: { status: opts.overBudget ? 'over-budget' : 'reported', moverIds: ['0'] } }
    },
    posture = { mode: 'maneuver', stats: { rejectedUnsafeBounds: 0 } };
  // Isolate the policy seam, not the shipping publisher or lease authority.
  // A real eligible posture/route is verified independently in the geometry checks.
  E.updateSquad = () => report;
  S.localPlan.update = () => task;
  P.update = () => posture;
  P.current = () => (opts.postureOff ? null : posture);
  P.coveredTeam = () => !opts.unsafe;
  // Only this policy seam is under test; native E.orderBound remains unchanged.
  const before = q.members.map(s => s.destination);
  S.fireAndMovement(q, b);
  return { r, b, q, S, L, E, P, posture, before };
}

const accepted = world();
assert.equal(accepted.P.maneuverOn, true);
assert.ok(
  accepted.L.holds(accepted.q, 'bound', accepted.b.time),
  'Meso issues exactly one native bound lease'
);
assert.ok(
  accepted.q.members.some(s => accepted.E.stateOf(s).boundOrder),
  'existing Engagement receives the physical team order'
);
assert.deepEqual(
  accepted.q.members.map(s => s.destination),
  accepted.before,
  'the Squad Leader posture never writes destinations'
);
assert.equal(accepted.posture.stats.rejectedUnsafeBounds, 0);
for (const [name, opts] of [
  ['no-posture', { postureOff: true }],
  ['emergency', { emergency: true }],
  ['retreat', { retreat: true }],
  ['recovery', { recover: true }],
  ['structure-security', { security: true }],
  ['objective-security', { objective: true }],
  ['unsafe-route', { unsafe: true }]
]) {
  const w = world(true, opts);
  assert.equal(w.L.get(w.q, 'bound'), null, name + ' must not grant new Meso movement');
  assert.equal(
    w.q.members.filter(s => w.E.stateOf(s).boundOrder).length,
    0,
    name + ' cannot publish an Engagement bound'
  );
}
for (const opts of [{}, { overBudget: true }]) {
  const w = world(false, opts);
  assert.equal(w.P.maneuverOn, false, 'flag-off remains incapable of pressured maneuver');
  assert.equal(w.L.get(w.q, 'bound'), null);
}
console.log(
  'covered-pressure-bound-check: PASS non-emergency posture override, single owner, safety precedence and default OFF'
);
