#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(mode = 'squad', terrain = true, crest = 1.25, threat = 20) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?aiSkills=' +
      mode +
      '&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&coa=0&slStress=0&scoutsForward=0&stressAct=0'
  });
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/module-registry.js');
  load('battle/movement-resolver.js');
  load('battle/battle-navigation.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  loadSquadCommandStack((root, file) => load(file), r);
  load('battle/modules/18-command-reception.js');
  load('battle/modules/46-ammunition-stoppages.js');
  for (const name of [
    '60-ai-skills.js',
    '60a-ai-skills-runtime.js',
    '60b-ai-skill-crouch-warning.js',
    '60c-ai-skills-squad-adapter.js',
    '60d-ai-skill-prepare-line.js',
    '60e-ai-skill-support-fire.js',
    '60f-ai-skill-covered-bound.js'
  ])
    load('battle/modules/' + name);
  const b = H.makeBattle(r, {
    seed: 602,
    heightAt: (x, z) => (terrain ? crest * Math.exp(-Math.pow((z - 8) / 4, 2)) : 0)
  });
  const scene = { buildings: [], roads: [] };
  b.scene = { metadata: { battleScenario: scene } };
  r.BattleNavigation.installScenario(scene);
  r.BattleModules.getSystem('ai-skills-shadow').onBattleStart(b);
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    composition: ['rifleman', 'rifleman', 'sergeant', 'rifleman']
  });
  q.members.forEach((s, i) => {
    s.root.position.x = (i - 1.5) * 5;
    s.root.position.z = 0;
    s.root.position.y = b.heightAt(s.root.position.x, 0);
  });
  r.BattleCommanderAI = {
    acceptMission(b, q) {
      q._macroMission.status = 'executing';
    }
  };
  q._macroMission = {
    version: 1,
    status: 'issued',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 100 },
    route: [
      { x: 0, z: 0 },
      { x: 0, z: 80 }
    ]
  };
  r.BattleSquadStability.executeMission(b, q, null);
  r.SquadAI.rememberReportedContact(q.members[0], b, {
    x: 0,
    z: threat,
    observedAt: 0,
    confidence: 1,
    sourceSoldier: 999,
    source: 'heard',
    combatThreat: true
  });
  r.BattleSquadStability.localPlan.update(b, q);
  return { r, b, q, threat, api: r.BattleAISkills, P: r.BattleSquadStability.tacticalPostures };
}
module.exports = { world };
if (require.main === module) {
  {
    const w = world();
    H.run(w.r, w.b, 12, () =>
      w.r.SquadAI.rememberReportedContact(w.q.members[0], w.b, {
        x: 0,
        z: 20,
        observedAt: w.b.time,
        confidence: 1,
        sourceSoldier: 999,
        source: 'heard',
        combatThreat: true
      })
    );

    const d = w.api.diagnostics(w.b);
    assert.ok(d.squad && d.squad.counts.attempts > 0, 'squad skill starts through native Meso');
    assert.equal(
      d.squad.counts.prepared,
      1,
      'native Movement/Reception/Engagement establish one physically held line'
    );
    const prep = d.squad.events.find(e => e.kind === 'prepared');
    assert.ok(prep.readyAt - prep.heldSince >= 4);
    assert.equal(prep.posts.length, 3);
    assert.ok(prep.posts.every(p => p.envelope && ['crouch', 'prone'].includes(p.stance)));
  }
  console.log('PASS squad skills native masked preparation');
}

// The following are controlled owner-boundary tests, not natural battle evidence.
if (require.main === module) {
  const refresh = w => () =>
    w.r.SquadAI.rememberReportedContact(w.q.members[0], w.b, {
      x: 0,
      z: 20,
      observedAt: w.b.time,
      confidence: 1,
      sourceSoldier: 999,
      source: 'heard',
      combatThreat: true
    });
  for (const [label, change] of [
    [
      'mission identity',
      w => {
        w.q._macroMission = { ...w.q._macroMission };
      }
    ],
    [
      'player possession',
      w => {
        w.q.members[0].isPlayer = true;
      }
    ],
    [
      'retreat',
      w => {
        w.q.state = 'retreat';
      }
    ],
    [
      'owner dependency',
      w => {
        w.r.BattleCommandReception = { movementEnabled: () => false };
      }
    ]
  ]) {
    const w = world();
    H.run(w.r, w.b, 2, refresh(w));
    assert.ok(w.api.diagnostics(w.b).squad.counts.attempts > 0, label + ' starts');
    change(w);
    w.r.BattleAISquadAdapter.reconcile(w.b, w.q);
    assert.equal(
      w.r.BattleAISquadAdapter.owned(w.b, w.q),
      false,
      label + ' releases only its native posture'
    );
    assert.equal(w.api.diagnostics(w.b).squad.counts.failed, 1, label + ' has explicit failure');
  }
  {
    const w = world();
    H.run(w.r, w.b, 14);
    assert.equal(
      w.api.diagnostics(w.b).squad.counts.prepared,
      0,
      'aged initial report does not invent renewed facts'
    );
  }
  {
    const w = world('squad', false);
    H.run(w.r, w.b, 14, refresh(w));
    assert.equal(w.api.diagnostics(w.b).squad.counts.prepared, 0, 'flat unmasked geometry fails');
  }
  {
    const w = world();
    H.run(w.r, w.b, 2, refresh(w));
    const before = JSON.stringify(w.r.BattleCommandReception.diagnostics?.(w.b)),
      rng = w.b.rng;
    const snap = w.api.snapshot(w.b, w.q);
    assert.ok(Object.isFrozen(snap) && Object.isFrozen(snap.facts));
    for (let i = 0; i < 20; i++) w.api.snapshot(w.b, w.q);
    assert.equal(
      JSON.stringify(w.r.BattleCommandReception.diagnostics?.(w.b)),
      before,
      'projection does not advance reception'
    );
    assert.equal(w.b.rng, rng);
    w.r.BattleModules.getSystem('ai-skills-shadow').onBattleStart(w.b);
    assert.equal(w.api.diagnostics(w.b).squad, null, 'lifecycle drops episode references');
  }
  // An isolated adapter fixture supplies explicit owner responses. It proves the
  // adapter rejects missing/partial evidence; only hosted replays can accept D.
  {
    const fs = require('node:fs'),
      vm = require('node:vm'),
      path = require('node:path');
    const q = { id: 'q', faction: 'us', members: [], _macroMission: { version: 1 } },
      b = { time: 0, factions: { us: { squads: [q] }, ge: { squads: [] } } };
    q.members = Array.from({ length: 4 }, (_, i) => ({
      id: String(i),
      squad: q,
      root: { position: { x: 0, z: 0 } },
      eng: { state: 'hold' },
      weapon: { kind: 'rifle' },
      qualified: i < 2
    }));
    const st = {
      serial: 7,
      mode: 'ambush',
      readyAt: 4,
      heldSince: 0,
      heldActorIds: ['0', '1', '2'],
      coreWitnesses: [0, 1, 2].map(i => ({
        id: String(i),
        point: { x: i, z: 0 },
        stance: 'crouch',
        envelope: 'cmd-' + i
      }))
    };
    let current = null,
      lease = null;
    const root = {
      BattleAISkills: { config: () => ({ observer: true }) },
      SquadAI: { leaderOf: () => q.members[0], shotReceipt: s => s.shot },
      BattleCommandReception: { movementEnabled: () => true },
      BattleCoverPositions: { coveredBoundsOn: () => true, boundRoute: () => ({ eligible: true }) },
      BattleLeases: {
        holds: () => false,
        get: () => lease,
        end: () => {
          lease = null;
        }
      },
      BattleEngagement: {
        effectiveFireOn: () => true,
        supportReady: s => s.qualified,
        clearBoundOrders: () => {}
      },
      BattleSquadStability: {
        leaderlessActive: () => false,
        localPlan: { on: true, resourcesOn: true },
        tacticalPostures: {
          on: true,
          maneuverOn: true,
          tuning: { preparationBudget: 12 },
          current: () => current,
          update: () => (current = st),
          releasePilot: () => {
            current = null;
          }
        }
      }
    };
    vm.runInNewContext(
      fs.readFileSync(path.resolve(__dirname, '../../battle/modules/60c-ai-skills-squad-adapter.js'), 'utf8'),
      root
    );
    const A = root.BattleAISquadAdapter,
      snap = {
        missionVersion: 1,
        generation: 1,
        facts: [{ location: { x: 0, z: 20 }, observedAt: 0, confidence: 1 }]
      },
      plan = { resources: ['team'] },
      ctx = { report: { fireSupport: q.members.slice(0, 2) } };
    b.time = 4;
    assert.equal(A.perform('squad.prepare-firing-line', b, q, snap, plan, ctx).status, 'Success');
    st.mode = 'maneuver';
    q.members[0].shot = { at: 4.1 };
    b.time = 4.2;
    assert.equal(
      A.perform('squad.coordinate-support-fire', b, q, snap, plan, ctx).status,
      'Running',
      'one real shot cannot count twice'
    );
    q.members[1].shot = { at: 4.2 };
    q.members[1].qualified = false;
    assert.equal(
      A.perform('squad.coordinate-support-fire', b, q, snap, plan, ctx).status,
      'Running',
      'shot without current independent qualification fails'
    );
    q.members[1].qualified = true;
    assert.equal(A.perform('squad.coordinate-support-fire', b, q, snap, plan, ctx).status, 'Success');
    assert.equal(
      A.perform('squad.execute-covered-bound', b, q, snap, plan, ctx).status,
      'Running',
      'no lease cannot count arrival'
    );
    const mover = q.members[2],
      second = q.members[3];
    lease = { since: 4.3, data: { aiSkillEpisode: '1:us:q:1:1', moverIds: ['2', '3'] } };
    for (const s of [mover, second]) s.eng = { state: 'bound', since: 4.3, cover: { x: 0, z: 10 } };
    b.time = 4.4;
    A.perform('squad.execute-covered-bound', b, q, snap, plan, ctx);
    q.members[0].shot = { at: 4.5 };
    q.members[1].shot = { at: 4.5 };
    mover.root.position.z = 10;
    mover.eng.state = 'hold';
    b.time = 4.6;
    assert.equal(
      A.perform('squad.execute-covered-bound', b, q, snap, plan, ctx).status,
      'Running',
      'one missing mover prevents partial-team completion'
    );
    second.root.position.z = 10;
    second.eng.state = 'hold';
    b.time = 4.7;
    assert.equal(
      A.perform('squad.execute-covered-bound', b, q, snap, plan, ctx).status,
      'Success',
      'all physical arrivals require two independent discharges during travel'
    );
    assert.equal(A.diagnostics(b, true).counts.arrived, 1);
    assert.equal(current, null, 'success releases exact owned posture');
  }
  console.log(
    'PASS squad skill invalidation, real geometry/freshness, detached reads and independent support/whole-team arrival boundaries'
  );
}
