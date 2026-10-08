#!/usr/bin/env node
'use strict';
/* The order execution contract, end to end on the shipping modules: General brief -> Squad Leader ->
   fireteam slot -> Command Reception -> Movement Resolver -> Movement Execution -> physical step, and
   the result back up.

   Physical navigation is the only stand-in: a stub whose `movementClear` seals chosen men inside a
   small pocket (a man the world will not let leave), so a valid, adopted formation order produces no
   movement. Everything else is the real code. `?executionReport=0` is the control arm: the Squad Leader
   does not read the blocked outcome, which is exactly how main behaves.

   A  adopted but physically blocked: the Squad Leader stops waiting for the men who cannot arrive (stride
      gate and fireteam renewal), the others carry the order out, and a squad most of whose men are
      blocked tells the General once per brief; the General answers through its ordinary re-selection.
   B  a higher-priority movement authority owns the man: held, never blocked, never progressing.
   C  a recipient that was not enrolled is reported pending, not executing.
   D  a replaced brief: the report about the old brief never wakes the new one, and a new brief can be
      reported again.
   E  a legitimate prepared hold is neither blocked nor reported.
   F  other squads' objective progress does not hide a blocked squad from the General.
   G  a recon detail that cannot move ends with the scouts' real outcome, not an anonymous timeout. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
function load(r, p) {
  new Function('window', 'globalThis', 'console', 'location', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(
    r,
    r,
    { log() {}, warn() {} },
    r.location
  );
}
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
const MESO = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'];
function world(opts) {
  opts = opts || {};
  H.resetIds();
  const events = [],
    systems = {},
    types = {},
    r = H.bootstrap({ modules: false, search: opts.search || '?stressAct=0&morale=0&coa=0&fireControl=0' });
  r.BattleModules = {
    registerSystem(id, h) {
      systems[id] = h;
    },
    getSystem: id => systems[id],
    runHook() {},
    registerUnitType() {},
    registerObjectiveType(t, h) {
      types[t] = h;
    },
    getObjectiveType: t => types[t],
    unitsFor: b => (b._roster.us || []).concat(b._roster.ge || [])
  };
  r.BattleSim = { start() {} };
  r.BattleTelemetry = { record: (type, data) => events.push({ type, data }) };
  const pockets = [];
  const inPocket = p => pockets.find(k => Math.hypot(p.x - k.x, p.z - k.z) <= k.r);
  r.BattleNavigation = {
    invalidateNavPath(s) {
      s._navCache = null;
      s._physicalPath = null;
    },
    invalidateNavCache(s) {
      s._navCache = null;
    },
    nextWaypoint: (self, s, d) => d,
    movementClear: (a, to) => inPocket(a) === inPocket(to),
    resolveStep: () => null
  };
  load(r, 'battle/movement-resolver.js');
  load(r, 'battle/modules/52-survival-tactical-route.js');
  load(r, 'battle/modules/01-capture-zone.js');
  load(r, 'battle/modules/08-soldier-events.js');
  load(r, 'battle/modules/14-wound-model.js');
  load(r, 'battle/modules/17-soldier-mind.js');
  load(r, 'battle/commander-doctrine.js');
  load(r, 'battle/commander-routes.js');
  load(r, 'battle/commander-ai.js');
  MESO.forEach(k => {
    const f = fs.readdirSync(path.join(H.REPO, 'battle/modules')).find(x => x.indexOf('15' + k + '-') === 0);
    if (f) load(r, 'battle/modules/' + f);
  });
  load(r, 'battle/modules/16-squad-plan-stability.js');
  load(r, 'battle/modules/18-command-reception.js');
  load(r, 'battle/modules/18a-execution-outcome.js');
  load(r, 'battle/modules/22-commander-reconstitution.js');
  load(r, 'battle/modules/22a-commander-strategic-recovery.js');
  load(r, 'battle/objective-system.js');
  load(r, 'battle/modules/40-ai-coordination-health.js');
  const b = H.makeBattle(r, { seed: 57 });
  b._movementRoot = r;
  b.macroCommandEnabled = true;
  b.scene = { metadata: {} };
  r.BattleObjectiveSystem.attach(
    b,
    opts.objectives || [{ id: 'obj-a', type: 'capture-zone', x: 0, z: 150, radius: 30, value: 1 }],
    {}
  );
  const w = {
    r,
    b,
    events,
    pockets,
    C: r.BattleCommanderAI,
    A: r.BattleAICoordinationHealth,
    Q: r.BattleSquadStability,
    O: r.BattleExecutionOutcome,
    CR: r.BattleCommandReception
  };
  w.squad = (id, faction, x, z, objective, composition) => {
    const q = H.addSquad(r, b, { id, faction, x, z, objective, composition });
    return q;
  };
  /* Seal these men where they stand. */
  w.seal = men =>
    men.forEach(s => pockets.push({ x: s.root.position.x, z: s.root.position.z, r: 1.2, id: s.id }));
  let acc = 0;
  /* One 0.15 s step of the real chain; the General ticks on its own 0.45 s cadence with the sampler. */
  w.run = seconds => {
    H.run(r, b, seconds, () => {
      w.Q.updateCohesion(b, b.factions.us.squads[0]);
      b.factions.us.squads.concat(b.factions.ge.squads).forEach(sq => w.Q.executeMission(b, sq, null));
      acc += H.AI_TICK;
      if (acc + 1e-9 >= w.C.commandTick) {
        acc -= w.C.commandTick;
        w.A.sample(b);
        w.C.update(b, null, w.C.commandTick);
      }
    });
  };
  return w;
}
const centroid = (q, men) => {
  const a = (men || q.members).filter(s => !s.dead);
  return {
    x: a.reduce((s, m) => s + m.root.position.x, 0) / a.length,
    z: a.reduce((s, m) => s + m.root.position.z, 0) / a.length
  };
};
function wakes(w, reason, squad) {
  return w.events.filter(
    e => e.type === 'decision-macro-replan' && e.data.reason === reason && (!squad || e.data.squad === squad)
  );
}
/* ------------------------------------------------------------------------------------------- */
function blockedWorld(search, nBlocked) {
  const w = world({ search }),
    q = w.squad('us-0', 'us', 0, 0, { x: 0, z: 150 });
  q.commandRole = 'center';
  q.commandPhase = 'assault';
  q.state = 'advance';
  /* The rear row (slots 0-4: the command group and the first fireteam men) is sealed in. */
  const sealed = q.members.slice(0, nBlocked);
  w.seal(sealed);
  return { w, q, sealed, free: q.members.slice(nBlocked) };
}

test('A: a squad with half its men blocked is frozen on main and carries the order out with the report', () => {
  const off = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0&executionReport=0', 5),
    on = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 5);
  off.w.run(60);
  on.w.run(60);
  const frozen = centroid(off.q, off.free).z,
    moved = centroid(on.q, on.free).z;
  assert.ok(frozen < 30, 'control (main): the stride gate waits for sealed men forever: z=' + frozen);
  assert.ok(moved > 60, 'the order is carried out by the men who can: z=' + moved);
  /* The block is attributed: the sealed men are blocked with their envelope and mission version. */
  const o = on.w.O.man(on.sealed[1], on.w.b);
  assert.equal(o.state, 'blocked');
  assert.equal(o.terminal, true);
  assert.equal(o.kind, 'formation');
  assert.ok(
    /^cmd-\d+$/.test(o.envelopeId) && o.missionVersion === on.q._macroMission.version,
    JSON.stringify(o)
  );
  /* A sealed man whose newest order is still in transit reads pending, not blocked: the new envelope is
     not his block yet. None of them ever reads as carrying the order out. */
  const sq = on.w.O.squad(on.q, on.w.b),
    sealedIds = on.sealed.map(s => String(s.id));
  sq.men
    .filter(m => sealedIds.indexOf(m.id) >= 0)
    .forEach(m =>
      assert.ok(m.state !== 'completed' && !m.progressing, 'sealed man ' + m.id + ' reads ' + m.state)
    );
  assert.ok(sq.counts.blocked >= 2, 'blocked men are counted: ' + JSON.stringify(sq.counts));
  assert.equal(on.sealed.filter(s => on.w.O.blocked(s)).length >= 4, true);
  /* The sealed men themselves are untouched: no teleport out of their pocket. */
  on.sealed.forEach(s =>
    assert.ok(
      on.w.pockets.some(
        k => k.id === s.id && Math.hypot(s.root.position.x - k.x, s.root.position.z - k.z) <= k.r + 0.01
      )
    )
  );
});

test('A: the fireteam does not wait on a blocked teammate', () => {
  const off = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0&executionReport=0', 5),
    on = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 5);
  off.w.run(45);
  on.w.run(45);
  const bravo = w => w.q._fireteamOrders && w.q._fireteamOrders.bravo && w.q._fireteamOrders.bravo.anchor.z;
  assert.ok(
    bravo(off) < 30,
    'control: bravo (slots 3, 6, 7) is held by its sealed rifleman: anchor z=' + bravo(off)
  );
  assert.ok(bravo(on) > 50, 'bravo renews its anchor around the men who can arrive: z=' + bravo(on));
});

test('A: a squad most of whose men are blocked tells the General once; the General reconsiders that brief', () => {
  const { w, q } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 6);
  w.r.BattleObjectiveSystem.attach(
    w.b,
    [
      { id: 'obj-a', type: 'capture-zone', x: 0, z: 150, radius: 30, value: 1 },
      { id: 'obj-b', type: 'capture-zone', x: 150, z: 20, radius: 30, value: 1 }
    ],
    {}
  );
  w.run(3);
  const m1 = q._macroMission;
  assert.ok(m1 && m1.intent === 'capture', 'the General briefed a capture');
  w.run(57);
  const heard = wakes(w, 'execution-blocked', 'us-0');
  assert.equal(heard.length, 1, 'one wake for this brief, however long the block lasts: ' + heard.length);
  assert.ok(
    w.events.some(
      e =>
        e.type === 'decision-captain-request' &&
        e.data.reason === 'execution-blocked' &&
        e.data.version === m1.version
    )
  );
  w.run(120);
  assert.equal(wakes(w, 'execution-blocked', 'us-0').length, 1, 'no repeat while the same brief stands');
  assert.equal(q._macroMissionRequest, null, 'the General acknowledged the request');
});

test('A: the report is off with ?executionReport=0 (main)', () => {
  const { w } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0&executionReport=0', 6);
  w.run(90);
  assert.equal(wakes(w, 'execution-blocked').length, 0);
});

const TWO = [
  { id: 'obj-a', type: 'capture-zone', x: 0, z: 150, radius: 30, value: 1 },
  { id: 'obj-b', type: 'capture-zone', x: 150, z: 20, radius: 30, value: 1 }
];

test('B: a higher-priority movement authority is held, never blocked and never progressing', () => {
  const { w, q } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 0);
  w.run(12);
  const s = q.members[7],
    o0 = w.O.man(s, w.b);
  assert.ok(o0.envelopeId, 'he holds a current order: ' + JSON.stringify(o0));
  ['firing-station', 'contact-reaction', 'retreat', 'regroup', 'reload-hold'].forEach(kind => {
    s._movementResolver.last = { owner: 'test', kind };
    s._movementProgress = { stuck: true, terminal: true, kind, samples: [] };
    const o = w.O.man(s, w.b);
    assert.equal(o.state, 'held', kind + ': ' + JSON.stringify(o));
    assert.ok(o.by && !o.progressing);
    assert.equal(w.O.blocked(s), false, kind + ' is another authority, not a block of the formation order');
    assert.equal(o.envelopeId, o0.envelopeId, 'the outcome still names the order it describes');
    /* A terminal formation failure from an earlier tick is not a current block once a higher authority owns him. */
    s._movementProgress.kind = 'formation';
    assert.equal(w.O.man(s, w.b).state, 'held', kind + ': higher authority still owns him');
    assert.equal(w.O.blockedForBrief(s, w.b), false, kind + ': stale formation block is not reportable');
  });
});

test('C: a living man with no order from a brief the squad holds reads pending, not executing', () => {
  const { w, q } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 0);
  w.run(12);
  const s = q.members[8];
  assert.notEqual(w.O.man(s, w.b).state, 'none');
  w.CR.reset ? w.CR.reset(s) : null;
  const sq = w.O.squad(q, w.b);
  assert.ok(
    sq.counts.pending +
      sq.counts.none +
      sq.counts.executing +
      sq.counts.completed +
      sq.counts.held +
      sq.counts.adopted +
      sq.counts.blocked ===
      sq.living,
    'every living man is accounted for exactly once'
  );
});

test('D: a report about a replaced brief never wakes the new one, and the new brief starts unreported', () => {
  const { w, q } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 6);
  w.r.BattleObjectiveSystem.attach(w.b, TWO, {});
  w.run(60);
  const m1 = q._macroMission;
  assert.equal(wakes(w, 'execution-blocked', 'us-0').length, 1);
  /* The brief is replaced (new mission object, new version) while the old report is still in flight. */
  const m2 = Object.assign({}, m1, { version: m1.version + 7, status: 'issued', at: w.b.time });
  q._macroMission = m2;
  q._macroMissionRequest = {
    missionVersion: m1.version,
    reason: 'execution-blocked',
    why: 'old',
    at: w.b.time
  };
  const before = w.events.length;
  w.run(0.5);
  assert.ok(
    q._missionExecution.mission === m2 && !q._missionExecution.blockedReported,
    'the new brief has its own, unreported record'
  );
  const after = w.events.slice(before),
    fresh = after.filter(e => e.type === 'decision-captain-request' && e.data.reason === 'execution-blocked');
  /* The only wake the new brief can get is from its own report, never from the stale request. */
  assert.ok(
    fresh.every(e => e.data.version === m2.version),
    'requests name the standing version: ' + JSON.stringify(fresh.map(e => e.data.version))
  );
  assert.equal(
    after.filter(e => e.type === 'decision-macro-replan' && e.data.reason === 'execution-blocked').length,
    fresh.length
  );
});

test('E: a squad holding a prepared defence is neither blocked nor reported', () => {
  const w = world({ search: '?stressAct=0&morale=0&coa=0&fireControl=0' }),
    q = w.squad('us-0', 'us', 0, 140, { x: 0, z: 150 });
  q.commandRole = 'center';
  w.run(90);
  const sq = w.O.squad(q, w.b);
  assert.equal(sq.counts.blocked, 0, JSON.stringify(sq.counts));
  assert.equal(wakes(w, 'execution-blocked').length, 0);
  assert.equal(q._macroMissionRequest || null, null);
});

test('F: another squad making objective progress does not hide a blocked squad from the General', () => {
  const w = world({ search: '?stressAct=0&morale=0&coa=0&fireControl=0', objectives: TWO }),
    q = w.squad('us-0', 'us', 0, 0, { x: 0, z: 150 });
  q.commandRole = 'center';
  q.commandPhase = 'assault';
  q.state = 'advance';
  w.seal(q.members.slice(0, 6));
  const q2 = w.squad('us-1', 'us', 120, 0, { x: 150, z: 20 });
  q2.commandRole = 'right';
  q2.commandPhase = 'assault';
  q2.state = 'advance';
  const c0 = centroid(q2);
  w.run(80);
  assert.ok(
    Math.hypot(centroid(q2).x - c0.x, centroid(q2).z - c0.z) > 20,
    'the other squad is making progress toward its objective'
  );
  assert.equal(wakes(w, 'execution-blocked', 'us-0').length, 1, 'the blocked squad is heard on its own');
  assert.equal(wakes(w, 'execution-blocked', 'us-1').length, 0, 'the squad that is moving is not');
});

test('A: the General answers the report with a replacement brief that the men physically carry out', () => {
  const run = flag => {
      const { w, q, free } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0' + flag, 6);
      w.r.BattleObjectiveSystem.attach(w.b, TWO, {});
      w.run(60);
      return { w, q, free, m: q._macroMission, c: centroid(q, free) };
    },
    off = run('&executionReport=0'),
    on = run('');
  assert.equal(off.m.objectiveId, 'obj-a');
  assert.equal(off.m.version, 1, 'main: the same brief stands for as long as the squad is frozen');
  assert.ok(off.c.z < 40);
  assert.equal(on.m.objectiveId, 'obj-b', 'the General reassessed the objective');
  assert.equal(on.m.reason, 'execution-blocked');
  assert.ok(on.m.version > 1 && on.m.status === 'executing', 'the Squad Leader accepted the replacement');
  /* Physical: obj-b lies east at (150, 20); the free men leave the obj-a line and move toward it. */
  assert.ok(on.c.x > off.c.x + 10, 'the free men carry the new brief out: x ' + on.c.x + ' vs ' + off.c.x);
});

test('A: a block the objective does not cure is escalated once, not swapped back and forth', () => {
  const w = world({ search: '?stressAct=0&morale=0&coa=0&fireControl=0', objectives: TWO }),
    q = w.squad('us-0', 'us', 0, 0, { x: 0, z: 150 });
  q.commandRole = 'center';
  q.commandPhase = 'assault';
  q.state = 'advance';
  /* Everyone is stuck wherever the General sends them. */
  w.seal(q.members);
  w.run(150);
  assert.ok(
    q._macroMission.version <= 2,
    'one reassessment, then the Squad Leader keeps the brief: v' + q._macroMission.version
  );
  assert.equal(wakes(w, 'execution-blocked', 'us-0').length, 1);
});

test('G: a recon detail ending without contact is labelled as its own outcome for the standing brief', () => {
  const { w, q } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 0);
  w.run(3);
  const at = q._macroMission.issuedAt || 0;
  assert.equal(w.O.recon(q), null, 'no recon under this brief');
  q._reconTask = { scoutIds: ['a', 'b'] };
  assert.equal(w.O.recon(q).outcome, 'underway');
  q._reconTask = null;
  const ended = reason => {
    q._reconLast = { reason, endedAt: at + 5, scoutIds: ['a', 'b'] };
    return w.O.recon(q);
  };
  assert.equal(ended('observed-no-contact').outcome, 'no-contact');
  assert.equal(ended('timeout').outcome, 'timeout');
  assert.equal(ended('scout-contact').outcome, 'contact');
  assert.equal(ended('retreat').outcome, 'cancelled');
  q._reconLast = { reason: 'observed-no-contact', endedAt: at - 1, scoutIds: [] };
  assert.equal(w.O.recon(q), null, "a recon that ended before this brief is not this brief's outcome");
});

test('A: a trapped man keeps his status and rejoins the squad when his obstruction clears', () => {
  const { w, q, sealed } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0&executionReport=1', 5);
  w.run(60);
  const man = sealed[1],
    gap = () =>
      Math.hypot(
        man.root.position.x -
          centroid(
            q,
            q.members.filter(s => !sealed.includes(s))
          ).x,
        man.root.position.z -
          centroid(
            q,
            q.members.filter(s => !sealed.includes(s))
          ).z
      );
  assert.equal(w.O.blocked(man), true, 'he is recorded as blocked');
  const far = gap(),
    start = { x: man.root.position.x, z: man.root.position.z };
  assert.ok(far > 40, 'the squad has left him behind: ' + far);
  /* The obstruction clears: the pockets are removed from the world. */
  w.pockets.length = 0;
  w.run(40);
  assert.ok(
    Math.hypot(man.root.position.x - start.x, man.root.position.z - start.z) > 20,
    'he moves again under the same orders'
  );
  assert.equal(w.O.blocked(man), false, 'the blocked status clears by itself, with no flag of ours');
  assert.ok(gap() < far - 20, 'and closes on the squad: ' + far + ' -> ' + gap());
  assert.ok(w.O.squad(q, w.b).counts.blocked < 5, 'the squad counts him again');
});

test('Review: an older brief order and its physical blocker are not the standing brief failure', () => {
  const { w, q, sealed } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 6);
  w.r.BattleObjectiveSystem.attach(w.b, TWO, {});
  for (let i = 0; i < 160 && !wakes(w, 'execution-blocked', 'us-0').length; i++) w.run(0.5);
  assert.ok(wakes(w, 'execution-blocked', 'us-0').length >= 1, 'reported under the first brief');
  /* The General's answer is standing and its envelopes are in transit; the sealed men still carry the stuck
     episode of the first brief's destination. That episode is not a failure of an order they have not adopted. */
  const m = q._macroMission,
    carried = sealed.filter(s => w.O.blocked(s) && w.O.man(s, w.b).state === 'pending');
  assert.ok(m.version > 1 && carried.length >= 1, 'a stuck episode outlives its brief: v' + m.version);
  assert.equal(
    w.O.blockedForBrief(carried[0], w.b),
    false,
    'an unadopted order is not blocked on old evidence'
  );
  assert.equal(w.O.squad(q, w.b).counts.blocked, 0);
  /* Records from an older brief are never blended into the standing one. */
  /* A newer brief appears while the old records persist. */
  q._macroMission = Object.assign({}, m, { version: m.version + 5, status: 'executing', reason: 'test' });
  q._macroMissionRequest = null;
  const sq = w.O.squad(q, w.b);
  assert.ok(sq.counts.notCurrent >= carried.length && sq.counts.blocked === 0, JSON.stringify(sq.counts));
  assert.equal(w.O.man(carried[0], w.b).current, false);
  w.Q.executeMission(w.b, q, null);
  assert.ok(!q._macroMissionRequest, 'no escalation for the new brief on the old evidence');
});

test('Review: reading an outcome does not settle Command Reception', () => {
  const { w, q } = blockedWorld('?stressAct=0&morale=0&coa=0&fireControl=0', 0);
  w.run(10);
  const st = w.b._commandReception;
  w.b.time += 0.05;
  const settledAt = st.settledAt,
    phases = JSON.stringify(
      Object.keys(st.bySoldier).map(k => Object.values(st.bySoldier[k]).map(r => r.phase))
    ),
    counts = JSON.stringify(st.counts);
  q.members.forEach(s => w.O.man(s, w.b));
  w.O.squad(q, w.b);
  assert.equal(st.settledAt, settledAt, 'settledAt unchanged');
  assert.equal(JSON.stringify(st.counts), counts);
  assert.equal(
    JSON.stringify(Object.keys(st.bySoldier).map(k => Object.values(st.bySoldier[k]).map(r => r.phase))),
    phases
  );
});

console.log(n + ' execution-contract checks passed');
