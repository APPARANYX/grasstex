/* Soldier condition: what the fight does to a man, kept as state the rest of the soldier layer can read.

   The tactics outline gives the soldier a narrow job (perceive, choose a target, fire, take cover, move
   under orders) and says he reports his readiness upward. What was missing between perceiving and
   deciding is the man himself: nothing about a comrade dying beside him, a wound, the leader going down
   or a minute of being shot at changed how he reacted, shot or moved. This module is that state, `stress`
   (0 calm .. 1 broken), plus the four bands it is read in.

   What moves it (measured on standard battles by scripts/probes/experience.js, not guessed: 88% of aimed
   rounds arrive from 250 m or more, so range-weighted rounds barely register; what a man actually lives
   through is suppression spells, wounds, and friends falling near him, leaders often among them):
     + suppression while `suppressedUntil` holds, a wound, a friend down (by distance, line of sight and
       whether he was in the man's squad), the leader down (the whole squad hears), aimed rounds (by
       range), no leader, no one near, and the fear of a squadmate who is worse off than he is;
     - time (it decays), faster with the leader within 12 m, in useful cover and among steady men,
       and much slower while under fire.

   Owner: this module writes `soldier.mind` and `squad.mind`, nothing else of the simulation (and its own
   observe-only telemetry on the sim: `_mindSummary`, `_mindSeries`). It never writes stance,
   destination, target or any timer another layer owns; Engagement and the shot model *read* the
   modifiers below and decide what to do with them, so one owner per responsibility still holds.

   Who reads stress is declared below as data (`READERS`: layer, file, reader, what stress becomes there).
   mind-read-map-check.js scans the source and fails on a reader that is not in the table, so stress
   cannot be read from a new place without an edit a reviewer sees. What each lever changed is counted
   where the decision is made (`noteReact`, `noteAim`, `noteBound`, `noteLapse`, `noteShock`: one more
   number on the man's own `mind`, never a write to anything a layer decides with) and `telemetry(sim)`
   turns it, with a one-second series of the bands, into the benchmark record's `stress` block.
   It runs on SquadAI's declared `beforeSoldier` slot (inside the fixed 0.15 s AI tick) and drains its
   kinds from the man's event queue (modules/08-soldier-events.js: a friend down, a wound, a suppression,
   the fire aimed at him, in that priority order); it draws nothing from the combat RNG (a man's nerve is a hash of his faction and id), so a
   battle with the module observing is the same battle as one without it (soldier-mind-check.js).

   Levers, for paired benchmarks: `?mind=0` (module off), `?mind=observe` (state kept, nothing reads it),
   `?mind=react,aim,hesitate,shock` (only those), default all. */
(function (root) {
  'use strict';
  if (!root.SquadAI || !root.BattleModules || !root.BattleSoldierEvents || root.BattleSoldierMind) return;

  var LEVERS = ['react', 'aim', 'hesitate', 'shock', 'morale', 'act', 'lead'];
  /* The levers a man's own decisions are counted for (the Squad Leader's `morale` and `lead` are squad decisions, not a
     man's, and `act` is Engagement's reactions, counted as `acts`). */
  var DECIDED = ['react', 'aim', 'hesitate', 'shock'];
  /* What a man carries from one moment of the fight to the next: `lasting`, `floor` and `relief` are all
     on by default. `?stressMem=0` disables all; a comma list enables exactly those named. `lasting`: stress does not drain on its timer while the fight goes on, only once
     the squad has been out of contact (and he out of fire) for CALM_AFTER. `floor`: a ratchet of how hurt he is
     times how shaken he was; nothing takes his stress below it. `relief`: kills, a captured objective, reaching
     cover under fire and a spell of fire survived take stress off, down to the floor and no further. */
  var MEMORIES = ['lasting', 'floor', 'relief'],
    /* Full memory is the shipping battle: stress persists through a fight, wounds leave a floor and positive
       events relieve stress. `?stressMem=0` disables all; a list names exactly the producers that run. */
    MEMORY_DEFAULT = MEMORIES.slice();
  function parseMemory(search) {
    var m = /[?&]stressMem=([^&#]*)/.exec(search || ''),
      out = {},
      v = m ? decodeURIComponent(m[1]).toLowerCase() : '',
      i;
    if (!m || v === '') for (i = 0; i < MEMORY_DEFAULT.length; i++) out[MEMORY_DEFAULT[i]] = true;
    else if (v === '1' || v === 'on' || v === 'all')
      for (i = 0; i < MEMORIES.length; i++) out[MEMORIES[i]] = true;
    else if (v !== '0' && v !== 'off')
      v.split(',').forEach(function (k) {
        if (MEMORIES.indexOf(k) >= 0) out[k] = true;
      });
    return out;
  }
  function parse(search) {
    var m = /[?&]mind=([^&#]*)/.exec(search || ''),
      out = { on: true, flag: 'default', levers: {}, memory: parseMemory(search) },
      i;
    var v = m ? decodeURIComponent(m[1]).toLowerCase() : '';
    if (!m || v === '1' || v === 'on' || v === 'all' || v === '') {
      for (i = 0; i < LEVERS.length; i++) out.levers[LEVERS[i]] = true;
    } else if (v === '0' || v === 'off' || v === 'false') {
      out.on = false;
      out.flag = 'off';
    } else if (v !== 'observe') {
      v.split(',').forEach(function (k) {
        if (LEVERS.indexOf(k) >= 0) out.levers[k] = true;
      });
      out.flag = v;
    } else out.flag = 'observe';
    return out;
  }
  var MODE = parse(typeof location !== 'undefined' ? location.search : '');

  /* ---- who reads stress, declared ------------------------------------------------------------
     One row per reader. `reads` is what it touches in `file` and how many times: a `BattleSoldierMind`
     function by name (`reactScale`), or `mind` / `mind.<field>` for a read of `soldier.mind` or
     `squad.mind` (`mind` alone is the object or a test that it exists; whose it is follows from the
     reader). Rows of one file add up: mind-read-map-check.js counts the same reads in the source and
     fails on any difference, and on a file or member that reads stress and is not listed here. Kinds:
     `lever` (what a man or squad decides is changed by it), `status` (a layer above reads the roll-up),
     `telemetry` (a decision site reports what a lever did to it), `display` and `export` (observe only),
     `tooling` (scripts; `reads` null, any number of reads; a `*` file covers a directory). `lever` names
     the `?mind=` lever for lever and telemetry rows; `unit` is what stress becomes there; `flag` says when
     the row runs. */
  var READERS = [
    {
      kind: 'lever',
      lever: 'react',
      layer: 'Micro (Engagement)',
      file: 'engagement.js',
      reader: 'stretch: reactTime, recognition',
      reads: { reactScale: 1 },
      unit: 'x recognition time, 1 + 0.6 stress^1.5 (up to 1.6)',
      flag: '?mind= (default on)'
    },
    {
      kind: 'telemetry',
      lever: 'react',
      layer: 'Micro (Engagement)',
      file: 'engagement.js',
      reader: 'noteRecognition (reactTime, the new-threat re-orient)',
      reads: { noteReact: 1 },
      unit: 'count of recognitions, those stretched, seconds added',
      flag: 'always'
    },
    {
      kind: 'lever',
      lever: 'react',
      layer: 'Command Reception (observe-only Phase 0A)',
      file: 'modules/18-command-reception.js',
      reader: 'recognitionScale (planned per-soldier process/orient latency only)',
      reads: { reactScale: 2 },
      unit: 'x planned command-processing latency; telemetry only until a later gated phase',
      flag: '?commandReception= (default on); ?mind= react lever supplies the same existing scale'
    },
    {
      kind: 'lever',
      lever: 'aim',
      layer: 'Micro (shot model)',
      file: 'modules/14-z-ballistic-raycast.js',
      reader: 'dispersionSigma',
      reads: { aimSigma: 1 },
      unit: 'x shot group sigma, 1 + 0.8 stress^1.5 (up to 1.8)',
      flag: '?mind= (default on)'
    },
    {
      kind: 'telemetry',
      lever: 'aim',
      layer: 'Micro (shot model)',
      file: 'modules/14-z-ballistic-raycast.js',
      reader: 'shotDirection (one call per round)',
      reads: { noteAim: 1 },
      unit: 'count of rounds, those with a widened group, sigma added',
      flag: 'always'
    },
    {
      kind: 'lever',
      lever: 'hesitate',
      layer: 'Micro (Engagement)',
      file: 'modules/19b-engagement-fire-stance.js',
      reader: 'orderedBound',
      reads: { mind: 1, hesitation: 1 },
      unit: 'seconds an ordered bound waits, 2.2 per unit of stress over 0.35 (at most 2)',
      flag: '?mind= (default on)'
    },
    {
      kind: 'telemetry',
      lever: 'hesitate',
      layer: 'Micro (Engagement)',
      file: 'modules/19b-engagement-fire-stance.js',
      reader: 'orderedBound (a wait begins)',
      reads: { noteHesitation: 1 },
      unit: 'count of waits begun',
      flag: 'always'
    },
    {
      kind: 'telemetry',
      lever: 'hesitate',
      layer: 'Micro (Engagement)',
      file: 'modules/19b-engagement-fire-stance.js',
      reader: 'orderedBound (a bound starts)',
      reads: { noteBound: 1 },
      unit: 'count of bound starts, those that waited, seconds waited',
      flag: 'always'
    },
    {
      kind: 'telemetry',
      lever: 'hesitate',
      layer: 'Micro (Engagement)',
      file: 'engagement.js',
      reader: 'clearBoundOrders (the order went while he waited)',
      reads: { noteLapse: 1 },
      unit: 'count of waits whose order ended before the bound began',
      flag: 'always'
    },
    {
      kind: 'lever',
      lever: 'shock',
      layer: 'Micro (Engagement)',
      file: 'engagement.js',
      reader: 'shockUntil: fireAllowed, suppress, orderedBound, advance',
      reads: { shockUntil: 1 },
      unit: 'until when he is frozen: no aimed fire, no bound start, no march (at most 1 s)',
      flag: '?mind= (default on)'
    },
    {
      kind: 'telemetry',
      lever: 'shock',
      layer: 'Micro (Engagement)',
      file: 'engagement.js',
      reader: 'noteShock: fireAllowed, suppress, orderedBound, advance',
      reads: { noteShock: 1 },
      unit: 'count of decisions the freeze blocked, by which decision',
      flag: 'always'
    },
    {
      kind: 'lever',
      lever: 'act',
      layer: 'Micro (Engagement)',
      file: 'modules/19a-engagement-stress-reactions.js',
      reader:
        'reaction (called each soldier tick when ?stressAct= names a reaction): cower, flee, freeze, rage',
      reads: { view: 1 },
      unit: 'his band, since when, whether he is under fire and his temper: rattled under fire goes to ground, broken runs, stops or charges',
      flag: '?mind= act lever (default on); stress reactions all on by default, ?stressAct=0 disables, a comma list selects exactly named reactions'
    },
    {
      kind: 'lever',
      lever: 'act',
      layer: 'Micro (Engagement)',
      file: 'modules/19a-engagement-stress-reactions.js',
      reader: 'beginFreeze (one-time stress-tempo snapshot when freeze begins)',
      reads: { freezeProfile: 1 },
      unit: 'recent positive stress dose -> deterministic 12..48 s freeze duration; Engagement owns freezeUntil',
      flag: '?mind= act lever and ?stressAct=freeze'
    },
    {
      kind: 'status',
      lever: null,
      layer: 'Micro (Engagement)',
      file: 'modules/19b-engagement-fire-stance.js',
      reader: 'underFireNow (return fire, retreat posture and squad under-fire report)',
      reads: { recentIncoming: 1 },
      unit: 'boolean: an aimed round reached this man inside the declared under-fire window',
      flag: 'shipping/default mind mode only; false for ?mind=0, ?mind=observe and named-lever isolation arms'
    },
    {
      kind: 'telemetry',
      lever: 'act',
      layer: 'Micro (Engagement)',
      file: 'modules/19a-engagement-stress-reactions.js',
      reader: 'noteAct (a reaction begins, runs a tick, a blow is struck or lands)',
      reads: { mind: 1, noteAct: 1 },
      unit: 'count of reactions begun, seconds spent in each, blows struck and landed',
      flag: 'always'
    },
    {
      kind: 'lever',
      lever: 'morale',
      layer: 'Meso (Squad Leader)',
      file: 'modules/15e-squad-leader-morale-coa.js',
      reader:
        'squadStress (extracted from 16): updateSquadState in 16 (group break and rally), COA_INPUTS.stress (COA default on)',
      reads: { squadStress: 2, mind: 1, 'mind.mean': 1 },
      unit: 'squad mean stress, 0 unless the morale lever is on: the break point falls 0.3 per unit, rally under 0.15; weight -1.0 on assault and +0.5 on defend',
      flag: '?mind= morale lever; group morale and COA on by default (?morale=0 / ?coa=0 disable their layer)'
    },
    {
      kind: 'lever',
      lever: 'morale',
      layer: 'Meso (Squad Leader)',
      file: 'modules/15k-squad-leader-reconstitution.js',
      reader:
        'recoverFromRetreat (a rebuilt squad only): the rally gate reads squadStress net of the permanent floors',
      reads: { squadFloor: 2 },
      unit: 'squad mean permanent wound floor, netted out of a rebuild rally gate so wounded men cannot pin it above the rally line; 0 unless the morale lever is on',
      flag: '?mind= morale lever; the net applies only to a reconstitution rebuild (reconstitutedFrom)'
    },
    {
      kind: 'lever',
      lever: 'lead',
      layer: 'Meso (Squad Leader)',
      file: 'modules/15j-squad-leader-fire-and-movement.js',
      reader:
        'teamStress: fireAndMovement (which fireteam bounds, a bound held); leadStress: stressReview (doctrine-review) (moved here from 16 in the bare-bones split)',
      reads: { teamStress: 2, leadStress: 2 },
      unit: "a fireteam's movers' mean stress (the calmest team that can go is sent; every team at the shaken band holds the cycle); the squad mean over 1/3 for reviewAfter asks the General for a new task",
      flag: '?mind= lead lever (default on); the Squad Leader reads it only with ?slStress=pick,hold,review (all three on by default; ?slStress=0 is none)'
    },
    {
      kind: 'tooling',
      lever: 'lead',
      layer: 'Tooling',
      file: 'scripts/probes/stress-decisions.js',
      reader:
        'the stress-decisions probe re-derives each bound and counts what a stress-driven pick or hold would change',
      reads: null,
      unit: 'bound decisions where the calmest team differs, every team shaken, per battle',
      flag: 'run_probe.cjs'
    },
    {
      kind: 'display',
      lever: null,
      layer: 'World Debug',
      file: 'modules/40-world-debug-overlay.js',
      reader: 'updateComposure (a ring on every man)',
      reads: { mind: 1, 'mind.band': 1, 'mind.stress': 1 },
      unit: 'ring colour by band, ring size by stress',
      flag: 'World Debug, Composure layer'
    },
    {
      kind: 'display',
      lever: 'shock',
      layer: 'World Debug',
      file: 'modules/40-world-debug-overlay.js',
      reader: 'updateComposure (a cross on a frozen man)',
      reads: { shockUntil: 1 },
      unit: 'whether he is frozen now',
      flag: 'World Debug, Composure layer'
    },
    {
      kind: 'export',
      lever: null,
      layer: 'Diagnostics',
      file: 'modules/99-session-diagnostics-export.js',
      reader: 'soldier (per-man export)',
      reads: { snapshot: 1 },
      unit: "the man's stress, band, peak, shocks, hesitations",
      flag: 'diagnostics export'
    },
    {
      kind: 'export',
      lever: null,
      layer: 'Diagnostics',
      file: 'modules/99-session-diagnostics-export.js',
      reader: 'squad (per-squad export)',
      reads: { mind: 1 },
      unit: 'the squad roll-up as it stands',
      flag: 'diagnostics export'
    },
    {
      kind: 'tooling',
      lever: null,
      layer: 'Tooling',
      file: 'scripts/run_battle_benchmark.mjs',
      reader: "the benchmark record's stress block",
      reads: null,
      unit: 'the dose map and the one-second series of every battle',
      flag: 'every benchmark battle'
    },
    {
      kind: 'tooling',
      lever: 'morale',
      layer: 'Tooling',
      file: 'scripts/probes/morale-decisions.js',
      reader: 'the morale-decisions probe counts the breaks and rallies morale changes against the flat rule',
      reads: null,
      unit: 'early breaks, held retreats, rallies per squad-battle',
      flag: 'run_probe.cjs'
    },
    {
      kind: 'tooling',
      lever: null,
      layer: 'Tooling',
      file: 'scripts/closeup_battle.cjs',
      reader: 'CLOSEUP_TARGET=stressed',
      reads: null,
      unit: 'which man to photograph',
      flag: 'close-up tool'
    },
    {
      kind: 'tooling',
      lever: null,
      layer: 'Tooling',
      file: 'scripts/probes/*.js',
      reader:
        'the observe-only probes (mind, experience, retreat-episodes, morale-decisions, state-fingerprint)',
      reads: null,
      unit: 'whatever the probe measures',
      flag: 'run_probe.cjs'
    },
    {
      kind: 'tooling',
      lever: null,
      layer: 'Tooling',
      file: 'scripts/probes/targeted-fire-control.cjs',
      reader: 'focused fire-control observer reading stress and incoming-round context',
      reads: null,
      unit: 'per-gunner stress and fire gate observations, not a gameplay decision',
      flag: 'run_probe.cjs'
    }
  ];

  /* Gains are stress added (0..1 scale); rates are per second. */
  var TAU = 22, // seconds for stress to fall to 1/e with nothing helping
    SUPPRESSED_RATE = 0.05, // while his suppression window holds: a 1.6 s spell is +0.08
    INCOMING_ROUND = 0.02, // per aimed round, times how near the shooter is
    INCOMING_FAR = 300, // aimed rounds from this far or further do not register
    INCOMING_CAP = 0.08, // one AI tick's aimed rounds never add more than this
    WOUNDED = 0.3, // per wound that did not drop him
    FRIEND_DOWN = 0.16, // a friend down within CASUALTY_RANGE, scaled by how close
    SQUADMATE_DOWN = 1.3, // ... and more if he was in the man's own squad
    LEADER_DOWN = 0.2, // the squad's leader went down within LEADER_HEARD
    LEADERLESS_RATE = 0.01, // while the squad has no leader alive
    ISOLATED_RATE = 0.008, // while no squadmate is within ISOLATED_RANGE
    CONTAGION = 0.03; // per second, times how much worse off a neighbour within CONTAGION_RANGE is
  var CASUALTY_RANGE = 30,
    CLOSE_CASUALTY = 8, // no sight test inside this: he heard and saw it
    LEADER_HEARD = 60,
    SHOCK_RANGE = 10,
    LEADER_CALM_RANGE = 12,
    CONTAGION_RANGE = 8,
    ISOLATED_RANGE = 30,
    STEADY_NEIGHBOUR_RANGE = 8;
  /* Stress that lasts (`?stressMem=`). Numbers are declared here and read nowhere else; none was tuned to an outcome. */
  var FLED_FLOOR = 0.2, // a man who has fled for good never calms below this (he can recover to it at base)
    CALM_AFTER = 12, // lasting: seconds out of contact and out of fire before stress starts to drain
    RELIEF = { kill: 0.12, objective: 0.15, cover: 0.06, survived: 0.05 }; // relief: stress taken off (times his nerve) by each kind
  /* Calming multiplies TAU (smaller = faster). */
  var LEADER_CALM = 0.65,
    COVER_CALM = 0.8,
    COMPANY_CALM = 0.05, // per steady neighbour, up to 3
    UNDER_FIRE_SLOW = 2.5,
    UNDER_FIRE_WINDOW = 3,
    COVER_USEFUL = 0.88,
    COVER_EVERY = 0.6;
  /* Bands with hysteresis: a man enters a band at UP and leaves it below DOWN. */
  var BANDS = ['steady', 'shaken', 'rattled', 'broken'],
    UP = [0.3, 0.55, 0.8],
    DOWN = [0.24, 0.47, 0.72];
  /* What each lever costs a man. */
  var REACT_GAIN = 0.6, // recognition takes up to 1.6x as long
    AIM_GAIN = 0.8, // shot group up to 1.8x as wide
    HESITATE_FROM = 0.35,
    HESITATE_GAIN = 2.2, // seconds a bound order waits per unit of stress above HESITATE_FROM ...
    MAX_HESITATION = 2, // ... never more than this: the order lives for BOUND_DURATION (3.6 s)
    SHOCK_BASE = 0.35,
    SHOCK_PER_GAIN = 2,
    SHOCK_MAX = 1,
    SHOCK_MIN_GAIN = 0.1,
    SHOCK_REFRACTORY = 3,
    MAX_DT = 0.5,
    /* Recent positive dose is evidence for how abruptly a man broke. Keep only the window Phase 1
       needs; this is Soldier Mind state, not an Engagement timer. */
    RECENT_STRESS_WINDOW = 15,
    RECENT_STRESS_CAP = 512,
    FREEZE_SHORT_WINDOW = 2,
    FREEZE_MID_WINDOW = 6,
    FREEZE_MIN = 12,
    FREEZE_MAX = 48;

  var clamp = root.GTMath.clamp;
  var dist = root.GTMath.distStrict;
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /* Deterministic per man, never the combat RNG. */
  function unit(s, salt) {
    var h = hash(String(s.faction) + '|' + String(s.id) + '|' + salt);
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967295;
  }
  /* A man's nerve divides every stress gain. It is his fortitude when the stats module has it on (module 10:
     the same +-12% swing the hash gave, now a stat other layers read too); a sergeant is steadier still. */
  function nerveOf(s) {
    var stats = root.BattleSoldierStats,
      rank = s.role === 'sergeant' ? 1.15 : 1;
    if (stats && stats.on('for')) return stats.scale(s, 'nerve') * rank;
    return (1 + (unit(s, 'nerve') - 0.5) * 0.24) * rank;
  }

  /* What one lever did to the decisions it reads, kept on the man it was done to: `total` decisions it
     could have changed, `changed` those where its answer was not neutral, `byBand` the changed ones by the
     band he was in (band 0 is stress above nothing and under 0.30: a change too small to see), `mag` what
     it cost in its own unit, `at` when it first changed one (his last condition tick: the AI time of the
     decision, since the condition ticks first). */
  function dose() {
    return { total: 0, changed: 0, byBand: [0, 0, 0, 0], mag: 0, at: -1 };
  }
  function fresh(s) {
    return {
      v: 1,
      stress: 0,
      pub: 0,
      band: 0,
      bandSince: 0,
      peak: 0,
      at: -1,
      nerve: nerveOf(s),
      wounds: 0,
      pinnedUntil: 0,
      incoming: 0,
      incomingRounds: 0,
      lastIncomingAt: -99,
      /* Bounded positive-gain ledger. Entries are {at, kind, gain, stress}: the last field is
         the man's stress immediately before that contribution's tick, so a later reader can
         distinguish a sudden dose from the same final stress reached gradually. */
      recentStressors: [],
      shockUntil: 0,
      shocks: 0,
      coverAt: -99,
      inCover: false,
      time: [0, 0, 0, 0],
      gained: {
        suppression: 0,
        incoming: 0,
        wound: 0,
        friendDown: 0,
        leaderDown: 0,
        leaderless: 0,
        isolated: 0,
        contagion: 0
      },
      hesitations: 0,
      decided: { react: dose(), aim: dose(), hesitate: dose(), shock: dose() },
      lapsed: 0,
      shockKinds: { fire: 0, suppress: 0, bound: 0, advance: 0 },
      view: null, // what Engagement reads for a reaction (view())
      temper: null, // how he tends to break: three fixed unit hashes (temper())
      acts: {
        cower: { n: 0, sec: 0 },
        flee: { n: 0, sec: 0, waited: 0, waitSec: 0, enemy: 0, timeout: 0, pickup: 0, rearmed: 0 },
        freeze: { n: 0, sec: 0 },
        rage: {
          n: 0,
          sec: 0,
          strikes: 0,
          hits: 0,
          guarded: 0,
          saved: 0,
          kills: 0,
          over: 0,
          debt: 0,
          succumbed: 0
        }
      },
      fightAt: -99, // the last time his squad was in contact or he was under fire (lasting)
      held: 0, // seconds stress did not drain because the fight was still on (lasting)
      fled: false, // he broke and ran for good: stress never drains below FLED_FLOOR
      floor: 0, // the lowest stress can go (floor)
      lost: 0, // the share of his health gone when the floor was last looked at
      relieved: {
        kill: { n: 0, amt: 0 },
        objective: { n: 0, amt: 0 },
        cover: { n: 0, amt: 0 },
        survived: { n: 0, amt: 0 }
      }
    };
  }
  function of(s) {
    return s.mind || (s.mind = fresh(s));
  }

  function trimRecent(m, now) {
    var a = m.recentStressors || (m.recentStressors = []),
      cutoff = now - RECENT_STRESS_WINDOW,
      drop = 0;
    while (drop < a.length && a[drop].at < cutoff) drop++;
    if (drop) a.splice(0, drop);
    if (a.length > RECENT_STRESS_CAP) a.splice(0, a.length - RECENT_STRESS_CAP);
    return a;
  }
  function recordGain(m, now, kind, gain) {
    gain = +gain || 0;
    if (!(gain > 0)) return;
    var a = trimRecent(m, now);
    a.push({ at: now, kind: kind, gain: gain, stress: m.stress });
    if (a.length > RECENT_STRESS_CAP) a.splice(0, a.length - RECENT_STRESS_CAP);
  }
  function recentDose(m, now) {
    var a = trimRecent(m, now),
      short = 0,
      mid = 0,
      total = 0,
      acute = 0,
      byKind = {},
      baseline = m.stress,
      baselineAt = now,
      acuteKinds = { wound: 1, friendDown: 1, leaderDown: 1, incoming: 1 };
    for (var i = 0; i < a.length; i++) {
      var e = a[i],
        age = now - e.at,
        g = +e.gain || 0;
      if (age < -1e-6 || age > RECENT_STRESS_WINDOW + 1e-6 || !(g > 0)) continue;
      total += g;
      if (age <= FREEZE_MID_WINDOW) mid += g;
      if (age <= FREEZE_SHORT_WINDOW) short += g;
      byKind[e.kind] = (byKind[e.kind] || 0) + g;
      if (acuteKinds[e.kind]) acute += g;
      if (e.at < baselineAt) {
        baselineAt = e.at;
        baseline = isFinite(+e.stress) ? +e.stress : baseline;
      }
    }
    var dominant = null,
      dominantGain = 0;
    Object.keys(byKind).forEach(function (k) {
      if (byKind[k] > dominantGain) {
        dominant = k;
        dominantGain = byKind[k];
      }
    });
    var shortShare = total > 0 ? clamp(short / total, 0, 1) : 0,
      midShare = total > 0 ? clamp(mid / total, 0, 1) : 0,
      acuteShare = total > 0 ? clamp(acute / total, 0, 1) : 0,
      doseStrength = clamp(total / UP[2], 0, 1),
      rise = Math.max(0, m.stress - baseline),
      riseShare = clamp(rise / UP[2], 0, 1),
      concentration = clamp(
        doseStrength * (0.65 * Math.pow(shortShare, 1.5) + 0.2 * Math.pow(midShare, 1.5) + 0.1 * acuteShare) +
          0.05 * riseShare,
        0,
        1
      );
    return {
      at: now,
      recentTotal: total,
      shortestWindowDose: short,
      mediumWindowDose: mid,
      stressRise: rise,
      concentration: concentration,
      dominantKind: dominant,
      dominantGain: dominantGain
    };
  }
  /* Engagement asks this once when freeze begins. Soldier Mind owns only the evidence and this
     deterministic recommendation; Engagement owns the resulting timer. */
  function freezeProfile(s, now) {
    var m = s && s.mind;
    if (!m) return null;
    var d = recentDose(m, +now || 0),
      duration = FREEZE_MIN + (FREEZE_MAX - FREEZE_MIN) * d.concentration;
    d.multiplier = duration / FREEZE_MIN;
    d.duration = duration;
    return d;
  }
  /* ---- what happened to other people --------------------------------------------------------- */

  function wasLeader(s) {
    var q = s.squad;
    return !!q && (q.leaderId != null ? q.leaderId === s.id : s.role === 'sergeant');
  }
  function shock(m, now, gain) {
    if (now < m.shockUntil + SHOCK_REFRACTORY) return;
    var d = (SHOCK_BASE + SHOCK_PER_GAIN * gain) / m.nerve;
    m.shockUntil = now + clamp(d, 0, SHOCK_MAX);
    m.shocks++;
  }
  /* A friend went down: what it does to a man who is where he can see or hear it. */
  function witness(s, m, c, battle, now) {
    if (c.faction !== s.faction || c.unit === s) return 0;
    var p = s.root.position,
      d = dist(c, p),
      sameSquad = s.squad && c.squad === s.squad.id,
      gain = 0,
      leader = false;
    if (c.leader && sameSquad && d <= LEADER_HEARD) {
      gain = LEADER_DOWN;
      leader = true;
    } else if (d <= CASUALTY_RANGE) {
      gain = FRIEND_DOWN * clamp(1 - (d - 4) / 26, 0.15, 1) * (sameSquad ? SQUADMATE_DOWN : 1);
      if (d > CLOSE_CASUALTY && !root.SquadAI.hasLineOfSight(s, c.unit, battle.heightAt, battle.obstacles))
        return 0;
    } else return 0;
    gain /= m.nerve;
    if (gain >= SHOCK_MIN_GAIN && d <= (leader ? CASUALTY_RANGE : SHOCK_RANGE)) shock(m, now, gain);
    if (leader) m.gained.leaderDown += gain;
    else m.gained.friendDown += gain;
    recordGain(m, now, leader ? 'leaderDown' : 'friendDown', gain);
    return gain;
  }

  /* ---- the tick ------------------------------------------------------------------------------ */

  function inCover(s, m, battle, now) {
    if (now - m.coverAt >= COVER_EVERY) {
      var F = root.BattleObstacleField,
        p = s.root.position;
      m.coverAt = now;
      m.inCover = !!F && F.coverPotentialAt(battle.obstacles, p.x, p.z) <= COVER_USEFUL;
    }
    return m.inCover;
  }
  function tick(s, battle) {
    if (!MODE.on || !s || s.dead || !s.root || !s.squad) return;
    var m = of(s),
      now = +battle.time || 0,
      sq = s.squad,
      p = s.root.position,
      E = root.BattleSoldierEvents;
    E.announceCasualties(battle, now);
    var dt = m.at < 0 ? 0 : clamp(now - m.at, 0, MAX_DT),
      gain = 0,
      g,
      i;
    m.at = now;
    m.pub = m.stress;

    /* What happened around him and to him since he last looked, in the queue's fixed priority order:
       a friend down, a wound, a suppression, then the fire on him. */
    var woundsTaken = 0,
      relief = null;
    E.drain(s, 'soldier-mind', function (kind, d, at) {
      if (kind === 'casualty') gain += witness(s, m, d, battle, now);
      else if (kind === 'wound') woundsTaken += d.count;
      else if (RELIEF[kind] != null) (relief || (relief = [])).push(kind);
      else if (kind === 'suppressed') m.pinnedUntil = Math.max(m.pinnedUntil, d.until);
      else if (kind === 'fled') m.fled = true;
      else if (kind === 'aimed') {
        var near = clamp(1 - d.d / INCOMING_FAR, 0, 1);
        m.lastIncomingAt = at;
        m.incomingRounds += d.rounds;
        m.incoming = Math.min(INCOMING_CAP, m.incoming + INCOMING_ROUND * near * near * d.rounds);
      }
    });
    if (woundsTaken > 0) {
      g = (WOUNDED * woundsTaken) / m.nerve;
      m.gained.wound += g;
      recordGain(m, now, 'wound', g);
      gain += g;
      m.wounds += woundsTaken;
    }
    var suppressed = m.pinnedUntil > now;
    if (suppressed) {
      g = (SUPPRESSED_RATE * dt) / m.nerve;
      m.gained.suppression += g;
      recordGain(m, now, 'suppression', g);
      gain += g;
    }
    if (m.incoming > 0) {
      g = m.incoming / m.nerve;
      m.gained.incoming += g;
      recordGain(m, now, 'incoming', g);
      gain += g;
      m.incoming = 0;
    }

    /* Who is around him: the leader, the nearest friend, and how his neighbours are holding up. */
    var leader = root.SquadAI.leaderOf(sq),
      nearest = Infinity,
      worst = 0,
      steady = 0,
      mates = sq.members || [];
    for (i = 0; i < mates.length; i++) {
      var o = mates[i];
      if (!o || o === s || o.dead || !o.root) continue;
      var d = dist(o.root.position, p);
      if (d < nearest) nearest = d;
      if (d <= CONTAGION_RANGE) {
        var os = o.mind ? o.mind.pub : 0;
        if (os - m.stress > worst) worst = os - m.stress;
      }
      if (d <= STEADY_NEIGHBOUR_RANGE && o.mind && o.mind.band === 0) steady++;
    }
    if (!leader) {
      g = LEADERLESS_RATE * dt;
      m.gained.leaderless += g;
      recordGain(m, now, 'leaderless', g);
      gain += g;
    }
    if (nearest > ISOLATED_RANGE) {
      g = ISOLATED_RATE * dt;
      m.gained.isolated += g;
      recordGain(m, now, 'isolated', g);
      gain += g;
    }
    if (worst > 0) {
      g = CONTAGION * worst * dt;
      m.gained.contagion += g;
      recordGain(m, now, 'contagion', g);
      gain += g;
    }

    /* Recovery: slower under fire, faster with the leader near, in cover and among steady men. */
    var tau = TAU,
      underFire = suppressed || now - m.lastIncomingAt <= UNDER_FIRE_WINDOW;
    if (leader && leader !== s && dist(leader.root.position, p) <= LEADER_CALM_RANGE) tau *= LEADER_CALM;
    if (inCover(s, m, battle, now)) tau *= COVER_CALM;
    tau *= 1 - COMPANY_CALM * Math.min(3, steady);
    if (underFire) tau *= UNDER_FIRE_SLOW;
    var mem = MODE.memory;
    if (mem.lasting) {
      /* The fight is on while his squad is in contact or he is under fire; it is over CALM_AFTER after both stop. */
      if (sq.inContact || underFire) m.fightAt = now;
      if (now - m.fightAt < CALM_AFTER) {
        if (m.stress > 0) m.held += dt;
        tau = Infinity;
      }
    }
    m.stress = clamp(m.stress * Math.exp(-dt / tau) + gain, 0, 1);
    if (mem.floor) floorStress(s, m);
    if (relief) for (i = 0; i < relief.length; i++) relieve(m, relief[i], mem.floor);
    if (m.fled && m.stress < FLED_FLOOR) m.stress = FLED_FLOOR;
    if (m.stress > m.peak) m.peak = m.stress;

    var band = m.band;
    while (band < 3 && m.stress >= UP[band]) band++;
    while (band > 0 && m.stress < DOWN[band - 1]) band--;
    if (band !== m.band) {
      m.band = band;
      m.bandSince = now;
    }
    m.time[band] += dt;
    aggregate(sq, now);
  }
  /* The floor (`?stressMem=floor`): whenever his health or his stress changes it becomes the larger of itself and
     (share of health lost) x stress, so it only rises while he is hurt; nothing takes his stress below it. If he
     is healed it falls by the share of his lost health that came back (floor x lost now / lost before): healed
     to full it is gone. A man who was never hurt has none. Nothing heals a man yet, so the heal branch only
     runs once there are medics. */
  function lostShare(s) {
    return s.maxHp > 0 ? clamp(1 - s.hp / s.maxHp, 0, 1) : 0;
  }
  function floorStress(s, m) {
    var lost = lostShare(s);
    if (lost < m.lost) m.floor = m.lost > 0 ? m.floor * (lost / m.lost) : 0;
    m.lost = lost;
    if (m.stress < m.floor) m.stress = m.floor;
    m.floor = Math.max(m.floor, lost * m.stress);
  }
  /* Relief (`?stressMem=relief`): a kill, a captured objective, cover reached under fire, a spell of fire survived
     take `RELIEF[kind]` x his nerve off his stress, never below his floor. `amt` is what it really took off. */
  function relieve(m, kind, floored) {
    var before = m.stress,
      low = floored ? m.floor : 0;
    m.stress = Math.max(low, m.stress - RELIEF[kind] * m.nerve);
    m.relieved[kind].n++;
    m.relieved[kind].amt += before - m.stress;
  }
  /* Squad status upward, once per AI time: read from the last tick, one tick behind the men who have
     not yet ticked. Nothing reads it yet but the diagnostics export (Slice 2 is the Squad Leader). */
  function aggregate(sq, now) {
    if (sq._mindAt === now) return;
    sq._mindAt = now;
    var n = 0,
      sum = 0,
      max = 0,
      bands = [0, 0, 0, 0],
      mates = sq.members || [];
    for (var i = 0; i < mates.length; i++) {
      var o = mates[i];
      if (!o || o.dead || !o.mind) continue;
      n++;
      sum += o.mind.stress;
      if (o.mind.stress > max) max = o.mind.stress;
      bands[o.mind.band]++;
    }
    sq.mind = {
      at: now,
      n: n,
      mean: n ? sum / n : 0,
      max: max,
      shaken: bands[1],
      rattled: bands[2],
      broken: bands[3]
    };
  }
  /* A squad with no living man ticks nobody, so `aggregate` never ran for it again: its roll-up kept the
     last picture of men who are gone (n above 0, a mean and a max that nobody holds any more), whether
     the squad was wiped out or absorbed by a merge. The Squad Leader reads that roll-up next, so a squad
     left with no one is rolled up once more, over nobody (n 0, stamped with that time), and stays so. */
  function anyLiving(sq) {
    var mates = sq.members || [];
    for (var i = 0; i < mates.length; i++) if (mates[i] && !mates[i].dead) return true;
    return false;
  }
  function settle(sim, now) {
    var sides = ['us', 'ge'];
    for (var f = 0; f < sides.length; f++) {
      var squads = (sim.factions && sim.factions[sides[f]] && sim.factions[sides[f]].squads) || [];
      for (var i = 0; i < squads.length; i++) {
        var sq = squads[i];
        if (sq && sq.mind && sq.mind.n > 0 && !anyLiving(sq)) aggregate(sq, now);
      }
    }
  }
  /* ---- what the rest of the soldier layer reads ---------------------------------------------- */

  function on(lever) {
    return MODE.on && !!MODE.levers[lever];
  }
  function stressOf(s) {
    return s && s.mind ? s.mind.stress : 0;
  }
  /* Recognition takes this many times as long (Engagement.reactTime). */
  function reactScale(s) {
    return on('react') ? 1 + REACT_GAIN * Math.pow(stressOf(s), 1.5) : 1;
  }
  /* His shot group is this many times as wide (the shot model's dispersion). */
  function aimSigma(s) {
    return on('aim') ? 1 + AIM_GAIN * Math.pow(stressOf(s), 1.5) : 1;
  }
  /* Seconds an ordered bound waits before he moves (Engagement.orderedBound). */
  function hesitation(s) {
    return on('hesitate') ? clamp(HESITATE_GAIN * (stressOf(s) - HESITATE_FROM), 0, MAX_HESITATION) : 0;
  }
  /* Until when he is frozen by what he just saw: no aimed fire, halts if advancing (Engagement). */
  function shockUntil(s) {
    return on('shock') && s && s.mind ? s.mind.shockUntil : 0;
  }
  /* The squad's mean stress as the Squad Leader reads it for group morale (module 16): calm men unless the `morale`
     lever is on, so `?mind=0`, `?mind=observe` and a lever list without `morale` leave the flat 60% retreat alone. */
  function squadStress(sq) {
    return on('morale') && sq && sq.mind ? sq.mind.mean || 0 : 0;
  }
  /* The squad's mean permanent floor (`floor` memory: wounds) under the same lever gate - the
     level squadStress can never drain below, however long the men rest. Squad Stability's rally
     gate (module 15k) reads squadStress net of this for a rebuilt squad, so men whose wounds pin
     them do not veto a reconstitution merge's road back to command. */
  function squadFloor(sq) {
    if (!on('morale') || !sq) return 0;
    var m = sq.members || [],
      sum = 0,
      n = 0;
    for (var i = 0; i < m.length; i++) {
      var s = m[i];
      if (!s || s.dead) continue;
      sum += (s.mind && s.mind.floor) || 0;
      n++;
    }
    return n ? sum / n : 0;
  }
  /* What the Squad Leader reads to lead its fireteams (module 16, `?slStress=`): the mean stress of the men it would send,
     and the squad's own mean. Calm men unless the `lead` lever is on, so `?mind=0`, `?mind=observe` and a lever list
     without `lead` leave the rotation and the brief as they were. */
  function teamStress(men) {
    if (!on('lead') || !men || !men.length) return 0;
    var sum = 0;
    for (var i = 0; i < men.length; i++) sum += stressOf(men[i]);
    return sum / men.length;
  }
  function leadStress(sq) {
    return on('lead') && sq && sq.mind ? sq.mind.mean || 0 : 0;
  }
  /* What Engagement reads to decide how he reacts (`?stressAct=`): his band and since when, whether he is under fire, and
     how he tends to break. `temper` is fixed per man, three unit hashes of faction and id (flee, freeze, rage), never the
     combat RNG: Engagement weighs them against the situation. Null unless the `act` lever is on, so `?mind=0`,
     `?mind=observe` and a list without `act` leave every man as he was. The object is his own and is refilled on each
     call: Engagement reads it and keeps nothing. */
  function view(s, now) {
    var m = on('act') && s && s.mind;
    if (!m) return null;
    var v = m.view || (m.view = { band: 0, since: 0, underFire: false, temper: null });
    v.band = m.band;
    v.since = m.bandSince;
    v.underFire = m.pinnedUntil > now || now - m.lastIncomingAt <= UNDER_FIRE_WINDOW;
    v.temper =
      m.temper || (m.temper = { flee: unit(s, 'flee'), freeze: unit(s, 'freeze'), rage: unit(s, 'rage') });
    return v;
  }
  /* Status-only accessor for shipping tactics that need to know whether a man was just fired at
     without reading Soldier Mind's storage directly. It is live only in the default/all mode.
     `?mind=observe` must be genuinely observe-only, and a named lever list must isolate only those
     levers; otherwise this status channel silently changes squad contact/retreat behavior in the
     control arm and contaminates paired benchmarks. */
  function recentIncoming(s, now, window) {
    if (!MODE.on || MODE.flag !== 'default' || !s || !s.mind) return false;
    var w = isFinite(+window) ? Math.max(0, +window) : UNDER_FIRE_WINDOW,
      last = isFinite(+s.mind.lastIncomingAt) ? +s.mind.lastIncomingAt : -99;
    return (+now || 0) - last <= w;
  }
  function bandName(s) {
    return BANDS[s && s.mind ? s.mind.band : 0];
  }

  function snapshot(s) {
    var m = s && s.mind;
    if (!m) return null;
    var r = function (n) {
      return +n.toFixed(3);
    };
    var recent = recentDose(m, m.at >= 0 ? m.at : 0),
      out = {
        stress: r(m.stress),
        band: BANDS[m.band],
        peak: r(m.peak),
        nerve: r(m.nerve),
        shocks: m.shocks,
        hesitations: m.hesitations,
        incomingRounds: m.incomingRounds,
        shockUntil: r(m.shockUntil),
        recentDose: {
          windowSeconds: RECENT_STRESS_WINDOW,
          recentTotal: r(recent.recentTotal),
          shortestWindowSeconds: FREEZE_SHORT_WINDOW,
          shortestWindowDose: r(recent.shortestWindowDose),
          mediumWindowSeconds: FREEZE_MID_WINDOW,
          mediumWindowDose: r(recent.mediumWindowDose),
          stressRise: r(recent.stressRise),
          concentration: r(recent.concentration),
          dominantKind: recent.dominantKind,
          dominantGain: r(recent.dominantGain)
        },
        seconds: {
          steady: r(m.time[0]),
          shaken: r(m.time[1]),
          rattled: r(m.time[2]),
          broken: r(m.time[3])
        }
      };
    if (Object.keys(MODE.memory).length) out.memory = { floor: r(m.floor), held: r(m.held) };
    return out;
  }
  /* One battle's totals, for the export and the benchmark: where the man-seconds went, per faction, and
     what every source of stress added. */
  function summary(sim) {
    var out = {
      mode: MODE.flag,
      levers: Object.keys(MODE.levers),
      memory: Object.keys(MODE.memory),
      manSeconds: 0,
      bandShare: { steady: 0, shaken: 0, rattled: 0, broken: 0 },
      peakBand: { steady: 0, shaken: 0, rattled: 0, broken: 0 },
      shocks: 0,
      hesitations: 0,
      casualtiesSeen: sim && sim._soldierEvents ? sim._soldierEvents.casualties : 0,
      gained: {},
      men: 0
    };
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) {
      var m = units[i] && units[i].mind;
      if (!m) continue;
      out.men++;
      for (var b = 0; b < 4; b++) {
        out.bandShare[BANDS[b]] += m.time[b];
        out.manSeconds += m.time[b];
      }
      var pk = 0;
      while (pk < 3 && m.peak >= UP[pk]) pk++;
      out.peakBand[BANDS[pk]]++;
      out.shocks += m.shocks;
      out.hesitations += m.hesitations;
      Object.keys(m.gained).forEach(function (k) {
        out.gained[k] = (out.gained[k] || 0) + m.gained[k];
      });
    }
    Object.keys(out.bandShare).forEach(function (k) {
      out.bandShare[k] = out.manSeconds ? +(out.bandShare[k] / out.manSeconds).toFixed(4) : 0;
    });
    Object.keys(out.gained).forEach(function (k) {
      out.gained[k] = +out.gained[k].toFixed(2);
    });
    out.manSeconds = +out.manSeconds.toFixed(1);
    return out;
  }
  /* ---- what the levers changed: counted where the decision is made --------------------------- */

  function decided(s, lever, changed, mag) {
    var m = MODE.on && s && s.mind;
    if (!m) return;
    var d = m.decided[lever];
    d.total++;
    if (!changed) return;
    d.changed++;
    d.byBand[m.band]++;
    d.mag += mag;
    if (d.at < 0) d.at = m.at;
  }
  /* A recognition began and takes `secs` (Engagement.reactTime, the new-threat re-orient). */
  function noteReact(s, secs) {
    var k = reactScale(s);
    decided(s, 'react', k > 1, secs - secs / k);
  }
  /* A round left the muzzle (the shot model's shotDirection, once per round). */
  function noteAim(s) {
    var k = aimSigma(s);
    decided(s, 'aim', k > 1, k - 1);
  }
  /* An ordered bound started, after `waited` seconds of hesitation (0 if he went at once). */
  function noteBound(s, waited) {
    decided(s, 'hesitate', waited > 0, waited);
  }
  /* The order ended while he was still hesitating: that bound never began. */
  function noteLapse(s) {
    if (MODE.on && s && s.mind) s.mind.lapsed++;
  }
  /* A reaction began (`what` 'start'), ran for `dt` more seconds ('time') or, for the charge, struck ('strike') and
     landed it ('hit'). Counted for the benchmark; nothing reads the numbers back. */
  function noteAct(s, kind, what, dt) {
    var m = MODE.on && s && s.mind,
      a = m && m.acts[kind];
    if (!a) return;
    if (what === 'start') a.n++;
    else if (what === 'time') a.sec += dt;
    else if (what === 'strike') a.strikes++;
    else if (what === 'hit') a.hits++;
    else if (what === 'guard') {
      a.guarded++;
      a.saved += dt;
    } else if (what === 'kill') a.kills++;
    else if (what === 'over') {
      a.over++;
      a.debt += dt;
    } else if (what === 'succumbed') a.succumbed++;
    else if (what === 'wait') a.waited++;
    else if (what === 'waiting') a.waitSec += dt;
    else if (what === 'enemy') a.enemy++;
    else if (what === 'timeout') a.timeout++;
    else if (what === 'pickup') a.pickup++;
    else if (what === 'rearmed') a.rearmed++;
  }
  /* The freeze blocked a decision that was otherwise his to make; `kind` says which one. The shock has no
     denominator: nothing is counted for a decision it did not touch. */
  function noteShock(s, kind) {
    var m = MODE.on && s && s.mind;
    if (!m) return;
    var d = m.decided.shock;
    d.changed++;
    d.byBand[m.band]++;
    if (d.at < 0) d.at = m.at;
    if (m.shockKinds[kind] != null) m.shockKinds[kind]++;
  }

  /* ---- the benchmark record's stress block ----------------------------------------------------
     `telemetry(sim)` is the one thing the benchmark reads. Every number is sim time or a count: `t` is
     simulated seconds (the timeline contract in AGENTS.md: paired arms align on it), one row per side per
     simulated second, columns as named in `series.columns`, cumulative counts for the decisions and the
     shocks. Nothing here feeds back into the battle. */
  var FORMAT = 'grasstex-stress-v1',
    SIDES = ['us', 'ge'],
    COLUMNS = [
      'men',
      'mean',
      'max',
      'shaken',
      'rattled',
      'broken',
      'squadsOver',
      'squads',
      'react',
      'aim',
      'hesitate',
      'shock',
      'shocks',
      'contact'
    ],
    DOSE_SQUAD_MEAN = 1 / 3, // a squad at or above this mean stress is counted "over": where ?morale=1 first differs from the flat rule
    DOSE_SQUAD_MEN = 3, // and "over with a say" when it has this many living: the mean of two men is noise (module 10's MIN_MEN)
    SERIES_EVERY = 1,
    MARKER_CAP = 200;

  function seriesOf(sim) {
    if (sim._mindSeries) return sim._mindSeries;
    var squads = function () {
      return { ever: {}, over: {}, seconds: 0, entries: 0, peak: 0, over3: {}, seconds3: 0, entries3: 0 };
    };
    return (sim._mindSeries = {
      t: [],
      us: [],
      ge: [],
      nextAt: 0,
      lastT: null,
      state: {},
      state3: {},
      contactBand: { us: [0, 0, 0, 0], ge: [0, 0, 0, 0] },
      squads: { us: squads(), ge: squads() },
      markers: [],
      dropped: 0
    });
  }
  function r3(n) {
    return +n.toFixed(3);
  }
  function sample(sim, t, ser) {
    var acc = {},
      units = root.BattleModules.unitsFor(sim),
      dt = ser.lastT == null ? 0 : t - ser.lastT,
      i,
      k;
    SIDES.forEach(function (side) {
      acc[side] = { n: 0, sum: 0, max: 0, band: [0, 0, 0, 0], shocks: 0, changed: [0, 0, 0, 0], contact: 0 };
    });
    for (i = 0; i < units.length; i++) {
      var u = units[i],
        m = u && u.mind,
        a = m && acc[u.faction];
      if (!a) continue;
      a.shocks += m.shocks;
      for (k = 0; k < DECIDED.length; k++) a.changed[k] += m.decided[DECIDED[k]].changed;
      if (u.dead) continue;
      a.n++;
      a.sum += m.stress;
      if (m.stress > a.max) a.max = m.stress;
      a.band[m.band]++;
      /* Where the levers act: a man whose squad is in contact (the benchmark's own `inContact`). Seconds are
         the sample's state held over the gap since the last sample, like the squad seconds below. */
      if (u.squad && u.squad.inContact) {
        a.contact++;
        ser.contactBand[u.faction][m.band] += dt;
      }
    }
    SIDES.forEach(function (side) {
      var squads = (sim.factions && sim.factions[side] && sim.factions[side].squads) || [],
        st = ser.squads[side],
        live = 0,
        over = 0,
        over3 = 0;
      for (var j = 0; j < squads.length; j++) {
        var q = squads[j];
        if (!q) continue;
        var key = side + ':' + q.id,
          roll = q.mind,
          has = !!roll && roll.n > 0,
          above = has && roll.mean >= DOSE_SQUAD_MEAN,
          say = above && roll.n >= DOSE_SQUAD_MEN;
        if (has) {
          live++;
          st.ever[q.id] = true;
          if (roll.mean > st.peak) st.peak = roll.mean;
        }
        if (above) {
          over++;
          st.over[q.id] = true;
          if (!ser.state[key]) {
            st.entries++;
            if (ser.markers.length < MARKER_CAP)
              ser.markers.push({
                t: +t.toFixed(2),
                kind: 'squad-stress-over',
                side: side,
                squad: q.id,
                mean: r3(roll.mean),
                n: roll.n
              });
            else ser.dropped++;
          }
        }
        if (say) {
          over3++;
          st.over3[q.id] = true;
          if (!ser.state3[key]) st.entries3++;
        }
        ser.state[key] = above;
        ser.state3[key] = say;
      }
      st.seconds += over * dt;
      st.seconds3 += over3 * dt;
      var a2 = acc[side];
      ser[side].push([
        a2.n,
        r3(a2.n ? a2.sum / a2.n : 0),
        r3(a2.max),
        a2.band[1],
        a2.band[2],
        a2.band[3],
        over,
        live,
        a2.changed[0],
        a2.changed[1],
        a2.changed[2],
        a2.changed[3],
        a2.shocks,
        a2.contact
      ]);
    });
    ser.t.push(+t.toFixed(2));
    ser.lastT = t;
  }
  /* The simulation step's half of the module: roll a wiped-out squad up once, refresh the 5 s summary the
     export reads, and take a series row on each simulated second. */
  function step(sim) {
    if (!MODE.on) return;
    var t = +sim.time || 0;
    settle(sim, t);
    if (t - (sim._mindSummaryAt || 0) >= 5) {
      sim._mindSummaryAt = t;
      sim._mindSummary = summary(sim);
    }
    var ser = seriesOf(sim);
    if (t + 1e-9 >= ser.nextAt) {
      sample(sim, t, ser);
      ser.nextAt = (Math.floor((t + 1e-9) / SERIES_EVERY) + 1) * SERIES_EVERY; // 18.999999999999996 is 19
    }
  }

  function bands(a) {
    return { steady: a[0], shaken: a[1], rattled: a[2], broken: a[3] };
  }
  function sideTotals() {
    return {
      men: 0,
      bandSeconds: [0, 0, 0, 0],
      peakBand: [0, 0, 0, 0],
      shocks: 0,
      hesitations: 0,
      lapsed: 0,
      kinds: { fire: 0, suppress: 0, bound: 0, advance: 0 },
      decided: { react: dose(), aim: dose(), hesitate: dose(), shock: dose() },
      memory: {
        held: 0,
        floorMen: 0,
        floorSum: 0,
        floorMax: 0,
        relief: {
          kill: { n: 0, amt: 0 },
          objective: { n: 0, amt: 0 },
          cover: { n: 0, amt: 0 },
          survived: { n: 0, amt: 0 }
        }
      },
      acts: {
        cower: { n: 0, sec: 0 },
        flee: { n: 0, sec: 0, waited: 0, waitSec: 0, enemy: 0, timeout: 0, pickup: 0, rearmed: 0 },
        freeze: { n: 0, sec: 0 },
        rage: {
          n: 0,
          sec: 0,
          strikes: 0,
          hits: 0,
          guarded: 0,
          saved: 0,
          kills: 0,
          over: 0,
          debt: 0,
          succumbed: 0
        }
      }
    };
  }
  function addTotals(to, from) {
    var k, b;
    to.men += from.men;
    for (b = 0; b < 4; b++) {
      to.bandSeconds[b] += from.bandSeconds[b];
      to.peakBand[b] += from.peakBand[b];
    }
    to.shocks += from.shocks;
    to.hesitations += from.hesitations;
    to.lapsed += from.lapsed;
    for (k in to.kinds) to.kinds[k] += from.kinds[k];
    for (k in to.decided) {
      var x = to.decided[k],
        y = from.decided[k];
      x.total += y.total;
      x.changed += y.changed;
      x.mag += y.mag;
      for (b = 0; b < 4; b++) x.byBand[b] += y.byBand[b];
      if (y.at >= 0 && (x.at < 0 || y.at < x.at)) x.at = y.at;
    }
    var xm = to.memory,
      ym = from.memory;
    xm.held += ym.held;
    xm.floorMen += ym.floorMen;
    xm.floorSum += ym.floorSum;
    if (ym.floorMax > xm.floorMax) xm.floorMax = ym.floorMax;
    for (k in xm.relief) {
      xm.relief[k].n += ym.relief[k].n;
      xm.relief[k].amt += ym.relief[k].amt;
    }
    for (k in to.acts) {
      to.acts[k].n += from.acts[k].n;
      to.acts[k].sec += from.acts[k].sec;
    }
    to.acts.rage.strikes += from.acts.rage.strikes;
    to.acts.rage.hits += from.acts.rage.hits;
    to.acts.rage.guarded += from.acts.rage.guarded;
    to.acts.rage.saved += from.acts.rage.saved;
    to.acts.rage.kills += from.acts.rage.kills;
    to.acts.rage.over += from.acts.rage.over;
    to.acts.rage.debt += from.acts.rage.debt;
    to.acts.rage.succumbed += from.acts.rage.succumbed;
    ['waited', 'waitSec', 'enemy', 'timeout', 'pickup', 'rearmed'].forEach(function (f) {
      to.acts.flee[f] += from.acts.flee[f];
    });
  }
  function totalsOut(t) {
    var decisions = {};
    DECIDED.forEach(function (k) {
      var d = t.decided[k];
      decisions[k] = {
        total: k === 'shock' ? null : d.total,
        changed: d.changed,
        byBand: d.byBand.slice(),
        mag: r3(d.mag),
        firstAt: d.at < 0 ? null : r3(d.at)
      };
    });
    decisions.hesitate.lapsed = t.lapsed;
    decisions.shock.kinds = t.kinds;
    var relief = {};
    Object.keys(t.memory.relief).forEach(function (k) {
      relief[k] = { n: t.memory.relief[k].n, amount: r3(t.memory.relief[k].amt) };
    });
    var acts = {};
    Object.keys(t.acts).forEach(function (k) {
      acts[k] = { n: t.acts[k].n, seconds: +t.acts[k].sec.toFixed(1) };
    });
    acts.rage.strikes = t.acts.rage.strikes;
    acts.rage.hits = t.acts.rage.hits;
    acts.rage.guarded = t.acts.rage.guarded;
    acts.rage.savedHp = +t.acts.rage.saved.toFixed(2);
    acts.rage.kills = t.acts.rage.kills;
    acts.rage.survived = t.acts.rage.over;
    acts.rage.debtHp = +t.acts.rage.debt.toFixed(2);
    acts.rage.succumbed = t.acts.rage.succumbed;
    acts.flee.waited = t.acts.flee.waited;
    acts.flee.waitSeconds = +t.acts.flee.waitSec.toFixed(1);
    acts.flee.homeEnemy = t.acts.flee.enemy;
    acts.flee.homeTimeout = t.acts.flee.timeout;
    acts.flee.homePickup = t.acts.flee.pickup;
    acts.flee.rearmed = t.acts.flee.rearmed;
    return {
      acts: acts,
      memory: {
        flags: Object.keys(MODE.memory),
        heldSeconds: +t.memory.held.toFixed(1),
        floor: {
          men: t.memory.floorMen,
          mean: r3(t.memory.floorMen ? t.memory.floorSum / t.memory.floorMen : 0),
          max: r3(t.memory.floorMax)
        },
        relief: relief
      },
      men: t.men,
      bandSeconds: bands(
        t.bandSeconds.map(function (n) {
          return +n.toFixed(1);
        })
      ),
      peakBand: bands(t.peakBand),
      shocks: t.shocks,
      hesitations: t.hesitations,
      decisions: decisions
    };
  }
  /* One man as totals, sharing his own counters (addTotals only reads what it adds from). */
  function manTotals(m) {
    var peak = [0, 0, 0, 0],
      pk = 0;
    while (pk < 3 && m.peak >= UP[pk]) pk++;
    peak[pk] = 1;
    return {
      men: 1,
      bandSeconds: m.time,
      peakBand: peak,
      shocks: m.shocks,
      hesitations: m.hesitations,
      lapsed: m.lapsed,
      kinds: m.shockKinds,
      decided: m.decided,
      memory: {
        held: m.held,
        floorMen: m.floor > 0 ? 1 : 0,
        floorSum: m.floor,
        floorMax: m.floor,
        relief: m.relieved
      },
      acts: m.acts
    };
  }
  function squadOut(ser, side) {
    var st = ser.squads[side];
    return {
      squads: Object.keys(st.ever).length,
      over: Object.keys(st.over).length,
      overSeconds: +st.seconds.toFixed(1),
      entries: st.entries,
      peakMean: r3(st.peak),
      with3: {
        over: Object.keys(st.over3).length,
        overSeconds: +st.seconds3.toFixed(1),
        entries: st.entries3
      }
    };
  }
  /* One battle's stress block for the benchmark record. Off (`?mind=0`) there is nothing to report. */
  function telemetry(sim) {
    var head = {
      format: FORMAT,
      mode: MODE.flag,
      levers: Object.keys(MODE.levers),
      sampleSeconds: SERIES_EVERY
    };
    if (!MODE.on || !sim) {
      head.off = true;
      return head;
    }
    var now = +sim.time || 0,
      ser = seriesOf(sim);
    settle(sim, now);
    if (ser.lastT == null || Math.abs(ser.lastT - now) > 0.51) sample(sim, now, ser);
    var units = root.BattleModules.unitsFor(sim),
      per = { us: sideTotals(), ge: sideTotals() },
      all = sideTotals(),
      base = summary(sim);
    for (var i = 0; i < units.length; i++) {
      var m = units[i] && units[i].mind;
      if (m && per[units[i].faction]) addTotals(per[units[i].faction], manTotals(m));
    }
    SIDES.forEach(function (side) {
      addTotals(all, per[side]);
    });
    var out = totalsOut(all),
      squads = { overMean: r3(DOSE_SQUAD_MEAN), minMen: DOSE_SQUAD_MEN },
      inContact = function (sides) {
        return bands(
          [0, 1, 2, 3].map(function (b) {
            return +sides
              .reduce(function (n, side) {
                return n + ser.contactBand[side][b];
              }, 0)
              .toFixed(1);
          })
        );
      };
    out.contactBandSeconds = inContact(SIDES);
    out.manSeconds = base.manSeconds;
    out.bandShare = base.bandShare;
    out.casualtiesSeen = base.casualtiesSeen;
    out.gained = base.gained;
    out.bySide = {};
    SIDES.forEach(function (side) {
      squads[side] = squadOut(ser, side);
      out.bySide[side] = totalsOut(per[side]);
      out.bySide[side].contactBandSeconds = inContact([side]);
    });
    out.squads = squads;
    out.series = { columns: COLUMNS.slice(), t: ser.t, us: ser.us, ge: ser.ge };
    out.markers = ser.markers;
    out.markersDropped = ser.dropped;
    return Object.assign(head, out);
  }

  function reset(sim) {
    sim._mindSummary = null;
    sim._mindSeries = null;
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) {
      units[i].mind = null;
      if (units[i].squad) units[i].squad.mind = null;
    }
  }

  function subscribe() {
    root.BattleSoldierEvents.subscribe('soldier-mind', ['casualty', 'wound', 'suppressed', 'aimed', 'fled']);
    if (MODE.memory.relief) root.BattleSoldierEvents.subscribe('soldier-mind', Object.keys(RELIEF));
  }
  if (MODE.on) subscribe();
  root.SquadAI.extend('beforeSoldier', 'soldier-mind', tick);
  root.BattleModules.registerSystem('soldier-mind', {
    version: '1.0',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: step
  });
  root.BattleSoldierMind = {
    version: '1.0',
    BANDS: BANDS,
    LEVERS: LEVERS,
    teamStress: teamStress,
    leadStress: leadStress,
    DECIDED: DECIDED,
    tuning: {
      TAU: TAU,
      SUPPRESSED_RATE: SUPPRESSED_RATE,
      INCOMING_ROUND: INCOMING_ROUND,
      INCOMING_FAR: INCOMING_FAR,
      WOUNDED: WOUNDED,
      FRIEND_DOWN: FRIEND_DOWN,
      LEADER_DOWN: LEADER_DOWN,
      CONTAGION: CONTAGION,
      UP: UP,
      DOWN: DOWN,
      REACT_GAIN: REACT_GAIN,
      AIM_GAIN: AIM_GAIN,
      MAX_HESITATION: MAX_HESITATION,
      SHOCK_MAX: SHOCK_MAX,
      SHOCK_REFRACTORY: SHOCK_REFRACTORY,
      RECENT_STRESS_WINDOW: RECENT_STRESS_WINDOW,
      RECENT_STRESS_CAP: RECENT_STRESS_CAP,
      FREEZE_SHORT_WINDOW: FREEZE_SHORT_WINDOW,
      FREEZE_MID_WINDOW: FREEZE_MID_WINDOW,
      FREEZE_MIN: FREEZE_MIN,
      FREEZE_MAX: FREEZE_MAX,
      DOSE_SQUAD_MEAN: DOSE_SQUAD_MEAN,
      DOSE_SQUAD_MEN: DOSE_SQUAD_MEN,
      CALM_AFTER: CALM_AFTER,
      FLED_FLOOR: FLED_FLOOR,
      RELIEF: RELIEF
    },
    READERS: READERS,
    mode: function () {
      return MODE;
    },
    configure: function (search) {
      MODE = parse(search);
      if (MODE.on) subscribe();
      return MODE;
    },
    of: of,
    tick: tick,
    settle: function (sim) {
      if (MODE.on && sim) settle(sim, +sim.time || 0);
    },
    stress: stressOf,
    band: bandName,
    reactScale: reactScale,
    aimSigma: aimSigma,
    hesitation: hesitation,
    shockUntil: shockUntil,
    squadStress: squadStress,
    squadFloor: squadFloor,
    recentIncoming: recentIncoming,
    freezeProfile: freezeProfile,
    view: view,
    noteAct: noteAct,
    noteHesitation: function (s) {
      if (s && s.mind) s.mind.hesitations++;
    },
    noteReact: noteReact,
    noteAim: noteAim,
    noteBound: noteBound,
    noteLapse: noteLapse,
    noteShock: noteShock,
    snapshot: snapshot,
    summary: summary,
    telemetry: telemetry,
    step: step,
    reset: reset
  };
  if (typeof console !== 'undefined')
    root.GTLog(
      '[MIND] soldier condition active (' + MODE.flag + '): stress from fire, wounds, casualties, leadership'
    );
})(typeof window !== 'undefined' ? window : globalThis);
