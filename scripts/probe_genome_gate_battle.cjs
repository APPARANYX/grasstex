#!/usr/bin/env node
'use strict';
/* Does a hostile server genome change a whole battle while the genome is stashed? genome-gate-check.js
   proves it per module and probe_ai_graph_stash.cjs in a real page; this plays the fixed-step battle the
   standard benchmark plays (scripts/run_probe.cjs, PROBE=state-fingerprint) and compares end states.

   Two trees are served side by side, and the loader in each reads `state/ai-policy.json` from two
   directories above it (preview mode), exactly as production injects the live genome:
     - the STASHED tree: the code as shipped;
     - the LIVE tree: the same code with only `var STASHED=true;` in battle/ai-policy.js flipped to false.
   Four arms, the same seeds in each:
     stashed-clean    no state/ai-policy.json                  the baseline
     stashed-hostile  a hostile genome in state/               must be the SAME battle as the baseline
     live-clean       no state/ai-policy.json, switch flipped  must be the same battle (no data, the defaults)
     live-hostile     the hostile genome in state/, flipped    must DIFFER: the control, so the first
                                                               comparison can fail
   The hostile genome: every tuning number at an extreme of its range, an aggressive doctrine, and a rule
   that holds on every neutral objective, so a live genome changes what the squads do at once.

   Set up (worktrees are never committed; AGENTS.md "Before/after pictures"):
     git worktree add --detach /tmp/www/genome-stashed HEAD
     git worktree add --detach /tmp/www/genome-live HEAD
     sed -i 's/^  var STASHED = true;/  var STASHED = false;/' /tmp/www/genome-live/battle/ai-policy.js
     echo '{"ref":"local"}' | tee /tmp/www/genome-stashed/preview.json > /tmp/www/genome-live/preview.json
   Serve /tmp/www with PHP_CLI_SERVER_WORKERS=4 php -S 127.0.0.1:8765 -t /tmp/www (see the browser smoke
   section), then:
     NODE_PATH=$(npm root -g) node scripts/probe_genome_gate_battle.cjs
   It writes and removes <GG_STATE_DIR>/state/ai-policy.json, and refuses to run if that directory exists.
   Env: GG_STASHED_URL, GG_LIVE_URL (default http://127.0.0.1:8765/genome-{stashed,live}/battle_sim_local.php),
        GG_STATE_DIR (default /tmp: two directories above /tmp/www/<tree>), GG_BATTLES (default one meeting
        and one us-defend battle), GG_SECONDS (default 300), GG_OUT (JSON path). Exits 1 on any mismatch. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const stashedUrl = process.env.GG_STASHED_URL || 'http://127.0.0.1:8765/genome-stashed/battle_sim_local.php';
const liveUrl = process.env.GG_LIVE_URL || 'http://127.0.0.1:8765/genome-live/battle_sim_local.php';
const stateDir = path.join(process.env.GG_STATE_DIR || '/tmp', 'state');
const battles =
  process.env.GG_BATTLES ||
  'meeting:standard-benchmark-meeting-s1-b0001-0001,us-defend:standard-benchmark-us-defend-s1-b0001-0001';
const seconds = process.env.GG_SECONDS || '300';

/* The shape battle_policy.php serves: {ok, revision, genome}. */
const HOSTILE = {
  ok: true,
  revision: 999,
  genome: {
    version: 2,
    parameters: {
      cohesionRadius: 50,
      captainlessCohesion: 38,
      regroupHold: 1.2,
      cornerHold: 1.8,
      cornerNoCaptainExtra: 1.2,
      supportDelay: 0,
      sectorDistanceWeight: 1.1
    },
    doctrine: { reserveFraction: 0, riskTolerance: 1, flankPreference: 1, objectiveStrategy: 'sequential' },
    rules: [{ id: 'always-hold', when: ['objectiveNeutral'], action: 'hold', weight: 1 }]
  }
};

function play(name, url) {
  const r = cp.spawnSync('node', [path.join(__dirname, 'run_probe.cjs')], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    env: {
      ...process.env,
      PROBE: 'state-fingerprint',
      PROBE_URL: url,
      PROBE_BATTLES: battles,
      PROBE_SECONDS: seconds
    }
  });
  process.stderr.write(
    r.stderr
      .split('\n')
      .map(l => (l ? name + ': ' + l + '\n' : ''))
      .join('')
  );
  if (r.status !== 0) throw new Error(name + ': run_probe.cjs exited ' + r.status);
  return JSON.parse(r.stdout).battles.map(b => ({
    battle: b.type + ':' + b.seed,
    winner: b.winner,
    simSeconds: b.simSeconds,
    fingerprint: b.fingerprint
  }));
}

(async () => {
  if (fs.existsSync(stateDir)) throw new Error(stateDir + ' exists: refusing to touch it. Set GG_STATE_DIR.');
  const arms = {};
  try {
    arms['stashed-clean'] = play('stashed-clean', stashedUrl);
    arms['live-clean'] = play('live-clean', liveUrl);
    fs.mkdirSync(stateDir);
    fs.writeFileSync(path.join(stateDir, 'ai-policy.json'), JSON.stringify(HOSTILE));
    arms['stashed-hostile'] = play('stashed-hostile', stashedUrl);
    arms['live-hostile'] = play('live-hostile', liveUrl);
  } finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
  const problems = [];
  const base = arms['stashed-clean'];
  base.forEach((b, i) => {
    const same = arm => arms[arm][i].fingerprint === b.fingerprint;
    if (!same('stashed-hostile'))
      problems.push(b.battle + ': a hostile server genome changed a stashed battle');
    if (!same('live-clean'))
      problems.push(b.battle + ': flipping the switch with no data changed the battle');
    if (same('live-hostile'))
      problems.push(
        b.battle + ': control failed, the hostile genome changed nothing with the switch flipped'
      );
  });
  for (const [arm, rows] of Object.entries(arms))
    for (const [i, r] of rows.entries())
      console.log(
        arm.padEnd(16),
        r.battle.slice(0, 44).padEnd(45),
        'winner ' + String(r.winner).padEnd(5),
        r.simSeconds + 's',
        r.fingerprint.slice(0, 12),
        arm === 'stashed-clean'
          ? ''
          : rows[i].fingerprint === base[i].fingerprint
            ? '= baseline'
            : '!= baseline'
      );
  if (process.env.GG_OUT) fs.writeFileSync(process.env.GG_OUT, JSON.stringify({ arms, problems }, null, 2));
  if (problems.length) {
    console.error('\nFAIL\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log(
    '\nPASS: a hostile server genome leaves every stashed battle identical to the baseline; the same genome ' +
      'changes every battle once the switch is flipped'
  );
})().catch(e => {
  console.error('PROBE FAIL', e.message);
  process.exit(1);
});
