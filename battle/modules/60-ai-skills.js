/* #602 PR B: pure utility shadow. No action/effector access and no plan execution.
   Trusted skill modules register descriptors; only this system owns shadow sessions. */
(function (root) {
  'use strict';
  var scopes = ['soldier', 'squad', 'command'],
    resources = ['locomotion', 'posture', 'weapon', 'team', 'orders', 'communications'],
    capabilities = ['perceived-threat', 'current-mission', 'adopted-movement', 'reachable-cover'],
    skills = Object.create(null),
    sessions = new WeakMap(),
    revision = 0,
    MAX_SKILLS = 32,
    MAX_ACTORS = 512,
    MAX_FACTS = 32,
    MAX_RECEIPTS = 128;
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) {
        freeze(value[key]);
      });
      Object.freeze(value);
    }
    return value;
  }
  function id(value) {
    if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,79}$/.test(value))
      throw new Error('Invalid skill id');
    return value;
  }
  function list(value, allowed) {
    if (
      !Array.isArray(value) ||
      value.some(function (v, i) {
        return allowed.indexOf(v) < 0 || value.indexOf(v) !== i;
      })
    )
      throw new Error('Invalid skill declarations');
    return value.slice().sort();
  }
  function keys(value, allowed) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some(function (k) {
        return allowed.indexOf(k) < 0;
      })
    )
      throw new Error('Invalid skill configuration');
  }
  function parameter(schema, value) {
    if (
      typeof value !== schema.type ||
      (schema.type === 'number' && (!Number.isFinite(value) || value < schema.min || value > schema.max))
    )
      throw new Error('Invalid skill parameter');
    return value;
  }
  function registerSkill(spec) {
    keys(spec, ['id', 'scope', 'requires', 'resources', 'parameters', 'evaluate', 'createPlan']);
    var name = id(spec.id);
    if (skills[name] || Object.keys(skills).length >= MAX_SKILLS)
      throw new Error('Duplicate skill or budget');
    if (
      scopes.indexOf(spec.scope) < 0 ||
      typeof spec.evaluate !== 'function' ||
      (spec.createPlan != null && typeof spec.createPlan !== 'function')
    )
      throw new Error('Invalid skill');
    keys(spec.parameters === undefined ? {} : spec.parameters, Object.keys(spec.parameters || {}));
    var schema = Object.create(null);
    Object.keys(spec.parameters || {})
      .sort()
      .forEach(function (key) {
        id(key);
        var row = spec.parameters[key];
        keys(row, ['type', 'min', 'max', 'default']);
        if (
          ['number', 'boolean'].indexOf(row.type) < 0 ||
          (row.type === 'number' &&
            (!Number.isFinite(row.min) || !Number.isFinite(row.max) || row.min > row.max))
        )
          throw new Error('Invalid parameter schema');
        schema[key] = { type: row.type, min: row.min, max: row.max, default: parameter(row, row.default) };
      });
    skills[name] = freeze({
      id: name,
      scope: spec.scope,
      requires: list(spec.requires, capabilities),
      resources: list(spec.resources, resources),
      parameters: schema,
      evaluate: spec.evaluate,
      createPlan: spec.createPlan
    });
    revision++;
    profileDirty = true;
    return skills[name];
  }
  function resolve(profile) {
    keys(profile, ['mode', 'observer', 'skills']);
    var mode = profile.mode === undefined ? 'legacy' : profile.mode;
    if (mode !== 'legacy' && mode !== 'shadow') throw new Error('Pilot is not authorized');
    if (profile.observer !== undefined && typeof profile.observer !== 'boolean')
      throw new Error('Invalid observer');
    var supplied = profile.skills === undefined ? {} : profile.skills;
    keys(supplied, Object.keys(skills));
    var resolved = Object.create(null);
    Object.keys(skills)
      .sort()
      .forEach(function (name) {
        var row =
            Object.prototype.hasOwnProperty.call(supplied, name) && supplied[name] !== undefined
              ? supplied[name]
              : {},
          schema = skills[name].parameters;
        keys(row, ['enabled', 'parameters']);
        if (row.enabled !== undefined && typeof row.enabled !== 'boolean')
          throw new Error('Invalid enablement');
        keys(row.parameters === undefined ? {} : row.parameters, Object.keys(schema));
        var params = Object.create(null);
        Object.keys(schema).forEach(function (key) {
          params[key] = parameter(
            schema[key],
            row.parameters && Object.prototype.hasOwnProperty.call(row.parameters, key)
              ? row.parameters[key]
              : schema[key].default
          );
        });
        resolved[name] = { enabled: row.enabled === true, parameters: params };
      });
    return freeze({ mode: mode, observer: profile.observer !== false, skills: resolved });
  }
  // New descriptors default disabled until explicitly declared in the one profile.
  var requestedProfile = { mode: 'legacy', skills: {} },
    profileDirty = false,
    config,
    configError = null;
  function configure(next) {
    profileDirty = false;
    requestedProfile = { mode: 'invalid' };
    try {
      // Detached config, including unknown IDs that may register later in module load order.
      requestedProfile = JSON.parse(
        JSON.stringify(next, function (key, value) {
          if (typeof value === 'function' || (typeof value === 'number' && !Number.isFinite(value)))
            throw new Error('Invalid profile value');
          return value;
        })
      );
      config = resolve(requestedProfile);
      configError = null;
    } catch (error) {
      config = resolve({ mode: 'legacy', skills: {} });
      configError = 'invalid-profile';
    }
    revision++;
    return config;
  }
  function session(sim) {
    var state = sessions.get(sim);
    if (!state) {
      state = {
        identity: Object.freeze({}),
        generation: 0,
        revision: -1,
        active: false,
        lastAt: null,
        receipts: [],
        prepared: 0,
        evaluated: 0,
        omitted: 0
      };
      sessions.set(sim, state);
    }
    return state;
  }
  function begin(sim) {
    if (profileDirty) configure(requestedProfile);
    var state = session(sim);
    state.generation++;
    state.active = true;
    clear(state);
  }
  function clear(state) {
    state.revision = revision;
    state.lastAt = null;
    state.receipts = [];
    state.prepared = state.evaluated = state.omitted = 0;
  }
  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }
  function fact(row, now, generation) {
    if (
      !row ||
      ['seen', 'told', 'heard', 'incoming'].indexOf(row.source) < 0 ||
      !finite(row.observedAt) ||
      !finite(row.expiresAt) ||
      row.observedAt > now ||
      row.expiresAt <= now ||
      !finite(row.confidence) ||
      row.confidence <= 0 ||
      row.confidence > 1 ||
      row.combatThreat === false ||
      !row.location ||
      !finite(row.location.x) ||
      !finite(row.location.z)
    )
      return null;
    return {
      key: String(row.key).slice(0, 80),
      source: row.source,
      observedAt: row.observedAt,
      expiresAt: row.expiresAt,
      confidence: row.confidence,
      generation: generation,
      location: { x: row.location.x, z: row.location.z }
    };
  }
  function snapshot(sim, actor) {
    var state = sessions.get(sim),
      roster = actor && sim._roster && sim._roster[actor.faction];
    // Validate identity before touching beliefs: IDs can be reused after restart or in another battle.
    if (!state || !state.active || !Array.isArray(roster) || roster.indexOf(actor) < 0) return null;
    return prepareSnapshot(sim, actor, state);
  }
  // The scheduled batch already enumerated the current roster once; no per-actor roster scan/cache.
  function prepareSnapshot(sim, actor, state) {
    var now = sim.time,
      sq = actor.squad,
      mission = sq && sq._macroMission,
      version = mission && mission.version,
      view = root.SquadAI.beliefSnapshot(actor, sim),
      rows = (view && view.beliefs) || [],
      facts = [],
      cr = root.BattleCommandReception,
      receipt = cr && cr.peek && cr.peek(actor, sim, 'movement', 'soldier:' + String(actor.id));
    // Overflow denies rather than silently discarding potentially relevant evidence.
    if (rows.length <= MAX_FACTS)
      rows.forEach(function (row) {
        var value = fact(row, now, state.generation);
        if (value) facts.push(value);
      });
    facts.sort(function (a, b) {
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });
    var currentMission = !!(mission && mission.status === 'executing' && finite(version) && version > 0),
      adopted = !!(
        receipt &&
        receipt.phase === 'adopted' &&
        receipt.data &&
        receipt.data.missionVersion === version &&
        !receipt.unreachable
      ),
      blocked = !!(
        actor.dead ||
        actor.incapacitated ||
        actor.isPlayer ||
        (sq && sq.state === 'retreat') ||
        (actor.eng && /^(flee|cower|freeze|rage)$/.test(actor.eng.state))
      );
    return freeze({
      scope: 'soldier',
      battleToken: state.identity,
      faction: actor.faction,
      entity: String(actor.id),
      generation: state.generation,
      missionVersion: finite(version) ? version : 0,
      now: now,
      facts: facts,
      guards: {
        alive: !actor.dead,
        safe: !blocked,
        mission: currentMission,
        receipt: adopted,
        // Shadow exposes no firing capability. HOLD FIRE remains a hard veto.
        roe: !(sq && sq.fireControl && sq.fireControl.state === 'hold'),
        budget: rows.length <= MAX_FACTS
      },
      capabilities: {
        'perceived-threat': facts.length > 0,
        'current-mission': currentMission,
        'adopted-movement': adopted,
        'reachable-cover': false
      },
      availableResources: []
    });
  }
  function denial(snap, context) {
    if (
      !snap ||
      !context ||
      !snap.battleToken ||
      snap.battleToken !== context.battleToken ||
      snap.faction !== context.faction ||
      !finite(snap.now) ||
      !finite(context.now) ||
      snap.now !== context.now ||
      snap.generation !== context.generation ||
      snap.missionVersion !== context.missionVersion ||
      snap.entity !== context.entity ||
      snap.scope !== context.scope
    )
      return 'stale-context';
    var guards = snap.guards || {};
    for (var i = 0, names = ['alive', 'safe', 'mission', 'receipt', 'roe', 'budget']; i < names.length; i++)
      if (guards[names[i]] !== true) return 'guard-' + names[i];
    if (
      !Array.isArray(snap.facts) ||
      snap.facts.some(function (row) {
        return !fact(row, snap.now, snap.generation) || row.generation !== snap.generation;
      })
    )
      return 'stale-intel';
    return null;
  }
  function select(snap, context, manifest) {
    var results = [],
      evaluations = 0,
      chosen = null,
      blocked = denial(snap, context);
    if (!manifest || manifest.mode !== 'shadow')
      return freeze({ chosen: null, decisions: [], evaluations: 0 });
    Object.keys(skills)
      .sort()
      .forEach(function (name) {
        var skill = skills[name],
          setting = manifest.skills[name];
        if (!snap || skill.scope !== snap.scope) return;
        var reason = !setting || !setting.enabled ? 'disabled' : blocked;
        if (
          !reason &&
          skill.requires.some(function (cap) {
            return snap.capabilities[cap] !== true;
          })
        )
          reason = 'missing-capability';
        if (
          !reason &&
          skill.resources.some(function (resource) {
            return snap.availableResources.indexOf(resource) < 0;
          })
        )
          reason = 'resource-conflict';
        var value = null;
        if (!reason) {
          try {
            evaluations++;
            value = skill.evaluate(snap, setting.parameters);
          } catch (error) {
            reason = 'evaluation-error';
          }
          if (
            !reason &&
            (!value ||
              typeof value.eligible !== 'boolean' ||
              !finite(value.score) ||
              value.score < 0 ||
              value.score > 1 ||
              typeof value.reason !== 'string' ||
              !/^[a-z0-9][a-z0-9-]{0,79}$/.test(value.reason) ||
              !Array.isArray(value.evidence) ||
              value.evidence.length > 8 ||
              value.evidence.some(function (entry) {
                return typeof entry !== 'string' || entry.length > 80;
              }))
          )
            reason = 'invalid-evaluation';
        }
        var result = {
          skill: name,
          eligible: !reason && value.eligible,
          score: reason ? null : value.score,
          reason: reason || value.reason,
          evidence: reason ? [] : value.evidence.slice(),
          selected: false,
          owner: 'ai-skills-shadow',
          action: 'none',
          outcome: 'hypothetical'
        };
        results.push(result);
        if (result.eligible && (!chosen || result.score > chosen.score)) chosen = result;
      });
    if (chosen) chosen.selected = true;
    return freeze({ chosen: chosen ? chosen.skill : null, decisions: results, evaluations: evaluations });
  }
  function tick(sim) {
    if (profileDirty) configure(requestedProfile);
    if (!config || config.mode !== 'shadow') return;
    var state = sessions.get(sim);
    if (!state || !state.active) return;
    if (state.revision !== revision) clear(state);
    if (state.lastAt === sim.time) return;
    state.lastAt = sim.time;
    var active = Object.keys(config.skills).some(function (name) {
      return config.skills[name].enabled;
    });
    if (!active) return;
    var actors = [];
    ['us', 'ge'].forEach(function (side) {
      ((sim._roster && sim._roster[side]) || []).forEach(function (actor) {
        actors.push(actor);
      });
    });
    actors.sort(function (a, b) {
      var ak = String(a.faction) + ':' + String(a.id),
        bk = String(b.faction) + ':' + String(b.id);
      return ak < bk ? -1 : ak > bk ? 1 : 0;
    });
    state.omitted += Math.max(0, actors.length - MAX_ACTORS);
    actors.slice(0, MAX_ACTORS).forEach(function (actor) {
      var snap = prepareSnapshot(sim, actor, state),
        result = select(snap, snap, config);
      state.prepared++;
      state.evaluated += result.evaluations;
      if (config.observer) {
        state.receipts.push(
          freeze({
            entity: snap.entity,
            faction: snap.faction,
            scope: snap.scope,
            generation: snap.generation,
            missionVersion: snap.missionVersion,
            at: snap.now,
            chosen: result.chosen,
            decisions: result.decisions
          })
        );
        if (state.receipts.length > MAX_RECEIPTS) state.receipts.shift();
      }
    });
  }
  registerSkill({
    id: 'soldier.observe-threat',
    scope: 'soldier',
    requires: ['perceived-threat'],
    resources: [],
    parameters: { threshold: { type: 'number', min: 0, max: 1, default: 0.25 } },
    evaluate: function (snap, params) {
      var confidence = snap.facts.reduce(function (best, row) {
        return Math.max(best, row.confidence);
      }, 0);
      return {
        eligible: confidence >= params.threshold,
        score: confidence,
        reason: confidence >= params.threshold ? 'perceived-threat' : 'low-confidence',
        evidence: []
      };
    }
  });
  var initial = root.BATTLE_AI_SKILLS || { skills: { 'soldier.observe-threat': { enabled: true } } },
    query =
      typeof URLSearchParams !== 'undefined'
        ? new URLSearchParams((root.location && root.location.search) || '')
        : null;
  initial = Object.assign({}, initial);
  if (query && query.has('aiSkills')) initial.mode = query.get('aiSkills');
  configure(initial);
  if (root.BattleModules)
    root.BattleModules.registerSystem('ai-skills-shadow', {
      onBattleStart: begin,
      beforeBattleRestart: function (sim) {
        var state = sessions.get(sim);
        if (state) {
          clear(state);
          state.active = false;
        }
      },
      onBattleRestart: begin,
      onCommanderTick: tick
    });
  root.BattleAISkills = Object.freeze({
    registerSkill: registerSkill,
    resolve: resolve,
    configure: configure,
    config: function () {
      return config;
    },
    snapshot: snapshot,
    select: select,
    diagnostics: function (sim) {
      var state = sessions.get(sim);
      if (!state) return null;
      // A profile switch invalidates old receipts immediately, even before another tick.
      return freeze({
        generation: state.generation,
        mode: config.mode,
        error: configError,
        prepared: state.revision === revision ? state.prepared : 0,
        evaluated: state.revision === revision ? state.evaluated : 0,
        omitted: state.revision === revision ? state.omitted : 0,
        receipts: state.revision === revision ? state.receipts.slice() : []
      });
    },
    limits: freeze({ skills: MAX_SKILLS, actors: MAX_ACTORS, facts: MAX_FACTS, receipts: MAX_RECEIPTS })
  });
})(typeof window !== 'undefined' ? window : globalThis);
