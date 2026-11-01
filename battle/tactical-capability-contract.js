/* Detached #602 contract spike. NOT loaded by the battle runtime and NOT an effector.
   Callers supply current owner projections; validation cannot establish their truth. In particular,
   a native export is not a complete capability adapter. No generic skill move/hold/fire API exists.
   This module stores nothing, draws no RNG, dispatches nothing and grants no physical authority. */
(function (root) {
  'use strict';
  var TOKEN = [
      'battleId',
      'generation',
      'faction',
      'squadId',
      'missionVersion',
      'rosterRevision',
      'controllerEpoch',
      'mode'
    ],
    CORRELATION = TOKEN.concat(['actionId', 'actorId', 'capability']),
    REQUEST = CORRELATION.concat(['params']);
  function frozen(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) {
        frozen(value[key]);
      });
      Object.freeze(value);
    }
    return value;
  }
  function record(value, allowed) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    var proto = Object.getPrototypeOf(value);
    return (
      (proto === Object.prototype || proto === null) &&
      Reflect.ownKeys(value).every(function (key) {
        var d = Object.getOwnPropertyDescriptor(value, key);
        return typeof key === 'string' && allowed.indexOf(key) >= 0 && Object.hasOwn(d, 'value');
      })
    );
  }
  function text(value) {
    return typeof value === 'string' && value.length > 0 && value.length <= 160;
  }
  function integer(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }
  function point(value) {
    return (
      record(value, ['x', 'z']) &&
      owns(value, ['x', 'z']) &&
      Number.isFinite(value.x) &&
      Number.isFinite(value.z)
    );
  }
  function owns(value, keys) {
    return keys.every(function (key) {
      return Object.hasOwn(value, key);
    });
  }
  function same(a, b, keys) {
    return keys.every(function (key) {
      return a[key] === b[key];
    });
  }
  function fail(reason) {
    return frozen({ ok: false, reason: reason });
  }
  function definition(scope, owner, nativeAPI, resources, stages, stageOwners, parameters) {
    return {
      scope: scope,
      owner: owner,
      nativeAPI: nativeAPI,
      adapter: 'missing',
      resources: resources,
      stages: ['accepted'].concat(stages),
      stageOwners: [owner].concat(stageOwners),
      parameters: parameters
    };
  }
  var CAPABILITIES = frozen({
    'maneuver.cover': definition(
      'squad',
      'Meso',
      'controllerBound.begin (bounded native covering window)',
      ['team'],
      ['executing'],
      ['Meso'],
      ['direction', 'team', 'coverTeam', 'moverId', 'moverIds', 'supportRelocation']
    ),
    'combat.bound': definition(
      'actor',
      'BattleEngagement',
      'controllerCombat.bound (adopted covered displacement)',
      ['locomotion', 'posture', 'weapon'],
      ['published', 'adopted', 'executing', 'arrived'],
      ['Meso', 'BattleCommandReception', 'BattleEngagement', 'BattleEngagement'],
      ['point']
    ),
    'combat.march': definition(
      'actor',
      'BattleEngagement',
      'controllerCombat.start (native transit posture, Meso owns locomotion)',
      ['posture', 'weapon'],
      ['executing'],
      ['BattleEngagement'],
      []
    ),
    'fire.control': definition(
      'squad',
      'Meso',
      'controllerFireControl.publish (personal posture/fire adoption)',
      ['fire-control'],
      ['published'],
      ['Meso'],
      ['state', 'targetId', 'shooterId']
    ),
    'combat.contact': definition(
      'actor',
      'BattleEngagement',
      'controllerCombat.start (native contact execution, no tactical selection)',
      ['locomotion', 'posture', 'weapon'],
      ['executing'],
      ['BattleEngagement'],
      ['drill', 'point']
    ),
    'movement.move': definition(
      'actor',
      'Meso',
      'publishPersonalMovement (internal); resolver.proposeOrder',
      ['locomotion'],
      ['published', 'adopted', 'applied', 'resolved', 'arrived'],
      ['Meso', 'BattleCommandReception', 'Meso', 'BattleMovementResolver', 'BattleExecutionOutcome'],
      ['point']
    ),
    'movement.hold': definition(
      'actor',
      'BattleMovementResolver',
      'proposeCombat (native hold constraints)',
      ['locomotion'],
      ['resolved', 'holding'],
      ['BattleMovementResolver', 'BattleExecutionOutcome'],
      ['point']
    ),
    'posture.lower': definition(
      'actor',
      'BattleEngagement',
      'requestStance (lowering only)',
      ['posture'],
      ['committed'],
      ['BattleEngagement'],
      ['stance']
    ),
    'station.claim': definition(
      'actor',
      'BattleTacticalPositions',
      'claim (canonical station + perceived threat)',
      ['position', 'locomotion'],
      ['assigned', 'occupied'],
      ['BattleTacticalPositions', 'BattleTacticalPositions'],
      ['stationId', 'threat']
    ),
    'mission.execute': definition(
      'squad',
      'Meso',
      'controllerMission.publish (mission phase, objective and route leg)',
      [],
      ['applied'],
      ['Meso'],
      ['leg', 'phase', 'point']
    ),
    'mission.accept': definition(
      'squad',
      'BattleCommanderAI',
      'acceptMission (owner-mediated)',
      [],
      ['executing'],
      ['BattleCommanderAI'],
      ['version']
    ),
    'transport.consider': definition(
      'squad',
      'BattleSquadTransport',
      'considerMission (owner-owned mission)',
      ['team', 'locomotion', 'weapon'],
      ['boarding', 'embarked'],
      ['BattleSquadTransport', 'BattleSquadTransport'],
      []
    ),
    'transport.cancel': definition(
      'squad',
      'BattleSquadTransport',
      'finish (abort request, never arrival claim)',
      ['team', 'locomotion', 'weapon'],
      ['released'],
      ['BattleSquadTransport'],
      []
    )
  });
  function shape(request) {
    if (!record(request, REQUEST) || !owns(request, REQUEST)) return fail('invalid-request');
    if (!text(request.capability) || !Object.hasOwn(CAPABILITIES, request.capability))
      return fail('unknown-capability');
    if (
      !['generation', 'missionVersion', 'rosterRevision', 'controllerEpoch'].every(function (k) {
        return integer(request[k]);
      }) ||
      !text(request.battleId) ||
      ['us', 'ge'].indexOf(request.faction) < 0 ||
      !text(request.squadId) ||
      !text(request.actionId)
    )
      return fail('invalid-request');
    if (request.mode !== 'new') return fail('no-authority');
    var def = CAPABILITIES[request.capability],
      p = request.params;
    if (def.scope === 'actor' ? !text(request.actorId) : request.actorId !== null)
      return fail('invalid-actor');
    if (
      !record(p, def.parameters) ||
      !def.parameters.every(function (k) {
        return ((k === 'moverId' || k === 'moverIds' || k === 'supportRelocation') &&
          request.capability === 'maneuver.cover') ||
          (k === 'point' && request.capability === 'combat.contact')
          ? true
          : Object.hasOwn(p, k);
      })
    )
      return fail('invalid-parameters');
    if (
      (Object.hasOwn(p, 'direction') && ['forward', 'back'].indexOf(p.direction) < 0) ||
      (Object.hasOwn(p, 'team') && ['alpha', 'bravo', 'charlie'].indexOf(p.team) < 0) ||
      (Object.hasOwn(p, 'coverTeam') &&
        p.coverTeam !== null &&
        (['alpha', 'bravo', 'charlie'].indexOf(p.coverTeam) < 0 || p.coverTeam === p.team)) ||
      (Object.hasOwn(p, 'supportRelocation') &&
        (p.supportRelocation !== true || !Object.hasOwn(p, 'moverId') || Object.hasOwn(p, 'moverIds'))) ||
      (Object.hasOwn(p, 'moverId') && !text(p.moverId)) ||
      (Object.hasOwn(p, 'moverIds') &&
        (!Array.isArray(p.moverIds) ||
          p.moverIds.length < 2 ||
          p.moverIds.length > 3 ||
          p.moverIds.some(function (id) {
            return !text(id);
          }) ||
          new Set(p.moverIds).size !== p.moverIds.length ||
          Object.hasOwn(p, 'moverId'))) ||
      (Object.hasOwn(p, 'point') && !point(p.point)) ||
      (Object.hasOwn(p, 'threat') && !point(p.threat)) ||
      (Object.hasOwn(p, 'stationId') && !text(p.stationId)) ||
      (Object.hasOwn(p, 'stance') && ['crouch', 'prone', 'crawl'].indexOf(p.stance) < 0) ||
      (Object.hasOwn(p, 'version') && p.version !== request.missionVersion) ||
      (request.capability === 'mission.execute' &&
        (!Number.isInteger(p.leg) ||
          p.leg < 0 ||
          [
            'approach',
            'reserve',
            'hold',
            'support-hold',
            'assault',
            'capture',
            'defend',
            'flank',
            'clear-town'
          ].indexOf(p.phase) < 0)) ||
      (Object.hasOwn(p, 'drill') &&
        ['prepare', 'fire', 'suppress', 'watch', 'pinned', 'grenade'].indexOf(p.drill) < 0) ||
      (request.capability === 'combat.contact' &&
        ((p.drill === 'suppress' && !point(p.point)) ||
          (p.drill !== 'suppress' && Object.hasOwn(p, 'point')))) ||
      (request.capability === 'fire.control' &&
        (['hold', 'precision', 'open'].indexOf(p.state) < 0 ||
          !(p.targetId === null || text(p.targetId)) ||
          !(p.shooterId === null || text(p.shooterId)) ||
          (p.state === 'precision' ? !text(p.shooterId) || !text(p.targetId) : p.shooterId !== null)))
    )
      return fail('invalid-parameters');
    var out = {};
    CORRELATION.forEach(function (k) {
      out[k] = request[k];
    });
    out.params = {};
    def.parameters.forEach(function (k) {
      if (!Object.hasOwn(p, k)) return;
      out.params[k] =
        k === 'moverIds' ? p[k].slice() : p[k] && typeof p[k] === 'object' ? { x: p[k].x, z: p[k].z } : p[k];
    });
    return frozen({ ok: true, reason: 'valid-shape', request: out });
  }
  function contextShape(context) {
    if (
      !record(context, TOKEN.concat(['now', 'actors'])) ||
      !owns(context, TOKEN.concat(['now', 'actors'])) ||
      !Number.isFinite(context.now) ||
      context.now < 0 ||
      !Array.isArray(context.actors)
    )
      return false;
    if (
      !['generation', 'missionVersion', 'rosterRevision', 'controllerEpoch'].every(function (k) {
        return integer(context[k]);
      }) ||
      !text(context.battleId) ||
      ['legacy', 'shadow', 'new'].indexOf(context.mode) < 0 ||
      ['us', 'ge'].indexOf(context.faction) < 0 ||
      !text(context.squadId)
    )
      return false;
    return true;
  }
  function validateRequest(request, context) {
    var normalized = shape(request);
    if (!normalized.ok) return normalized;
    if (!contextShape(context)) return fail('invalid-context');
    if (context.mode !== 'new') return fail('no-authority');
    if (request.battleId !== context.battleId) return fail('wrong-battle');
    if (request.generation !== context.generation) return fail('stale-generation');
    if (!same(request, context, ['faction', 'squadId'])) return fail('wrong-squad');
    if (request.missionVersion !== context.missionVersion) return fail('stale-mission');
    if (request.rosterRevision !== context.rosterRevision) return fail('stale-roster');
    if (request.controllerEpoch !== context.controllerEpoch) return fail('stale-controller');
    var ids = [],
      actor = null;
    for (var i = 0; i < context.actors.length; i++) {
      var a = context.actors[i];
      if (
        !record(a, ['id', 'dead', 'player', 'transportLocked']) ||
        !owns(a, ['id', 'dead', 'player', 'transportLocked']) ||
        !text(a.id) ||
        ids.indexOf(a.id) >= 0 ||
        !['dead', 'player', 'transportLocked'].every(function (k) {
          return typeof a[k] === 'boolean';
        })
      )
        return fail('invalid-context');
      ids.push(a.id);
      if (a.id === request.actorId) actor = a;
    }
    if (request.actorId !== null) {
      if (!actor) return fail('invalid-actor');
      if (actor.dead) return fail('actor-dead');
      if (actor.player) return fail('player-owned');
      if (actor.transportLocked) return fail('transport-owned');
    }
    return frozen({ ok: true, reason: 'valid-request', request: normalized.request });
  }
  function evidenceFor(request, evidence, context, stage) {
    if (
      !record(evidence, CORRELATION.concat(['stage', 'owner', 'at', 'envelopeId'])) ||
      !owns(evidence, CORRELATION.concat(['stage', 'owner', 'at'])) ||
      !same(request, evidence, CORRELATION) ||
      evidence.stage !== stage ||
      !Number.isFinite(evidence.at) ||
      evidence.at < 0 ||
      evidence.at > context.now
    )
      return fail('invalid-evidence');
    var def = CAPABILITIES[request.capability],
      index = ['rejected', 'cancelled'].indexOf(stage) >= 0 ? 0 : def.stages.indexOf(stage);
    if (index < 0 || evidence.owner !== def.stageOwners[index]) return fail('invalid-evidence');
    if (request.capability === 'movement.move' && index > 0 && !text(evidence.envelopeId))
      return fail('invalid-evidence');
    if (
      !(request.capability === 'movement.move' && index > 0) &&
      Object.hasOwn(evidence, 'envelopeId') &&
      evidence.envelopeId !== null
    )
      return fail('invalid-evidence');
    return frozen({ ok: true, reason: 'valid-evidence' });
  }
  var REASONS = frozen({
    accepted: ['owner-accepted'],
    rejected: [
      'invalid-target',
      'blocked-route',
      'no-authority',
      'unsupported-action',
      'stale-intel',
      'resource-conflict',
      'owner-rejected'
    ],
    cancelled: [
      'mission-superseded',
      'roster-changed',
      'controller-switched',
      'battle-restart',
      'actor-dead',
      'player-owned',
      'transport-owned',
      'timeout',
      'disabled',
      'cancelled'
    ]
  });
  function createReceipt(request, status, reason, evidence, context) {
    /* Cancellation is an owner acknowledgement, never a fresh effect. It must remain representable
       after mission/roster/epoch invalidation, possession or death; the original token is retained. */
    var valid = status === 'cancelled' ? shape(request) : validateRequest(request, context);
    if (!valid.ok) return valid;
    if (!contextShape(context)) return fail('invalid-context');
    if (!same(valid.request, context, ['battleId'])) return fail('wrong-battle');
    if (!same(valid.request, context, ['faction', 'squadId'])) return fail('wrong-squad');
    if (!text(status) || !Object.hasOwn(REASONS, status) || REASONS[status].indexOf(reason) < 0)
      return fail('invalid-receipt');
    var proof = evidenceFor(valid.request, evidence, context, status);
    if (!proof.ok) return proof;
    return frozen({
      ok: true,
      reason: 'valid-receipt',
      receipt: {
        request: valid.request,
        status: status,
        reason: reason,
        stage: status,
        at: evidence.at,
        envelopeId: null,
        owner: evidence.owner
      }
    });
  }
  function validateProgress(receipt, evidence, context) {
    var fields = ['request', 'status', 'reason', 'stage', 'at', 'envelopeId', 'owner'];
    if (!record(receipt, fields) || !owns(receipt, fields)) return fail('invalid-receipt');
    var valid = validateRequest(receipt.request, context);
    if (!valid.ok) return valid;
    if (['completed', 'rejected', 'cancelled'].indexOf(receipt.status) >= 0) return fail('terminal');
    var def = CAPABILITIES[valid.request.capability],
      index = def.stages.indexOf(receipt.stage);
    if (
      index < 0 ||
      !text(receipt.reason) ||
      !Number.isFinite(receipt.at) ||
      receipt.at < 0 ||
      receipt.at > context.now ||
      receipt.owner !== def.stageOwners[index] ||
      ['accepted', 'running', 'completed', 'rejected', 'cancelled'].indexOf(receipt.status) < 0
    )
      return fail('invalid-receipt');
    if (
      valid.request.capability === 'movement.move' && index > 0
        ? !text(receipt.envelopeId)
        : receipt.envelopeId !== null
    )
      return fail('invalid-receipt');
    if (index >= def.stages.length - 1 || (index === 0) !== (receipt.status === 'accepted'))
      return fail('invalid-receipt');
    var next = def.stages[index + 1],
      proof = evidenceFor(valid.request, evidence, context, next);
    if (!proof.ok) return proof;
    if (evidence.at < receipt.at) return fail('out-of-order');
    if (receipt.envelopeId !== null && evidence.envelopeId !== receipt.envelopeId)
      return fail('wrong-envelope');
    return frozen({
      ok: true,
      reason: 'valid-progress',
      receipt: {
        request: valid.request,
        status: index + 1 === def.stages.length - 1 ? 'completed' : 'running',
        reason: next,
        stage: next,
        at: evidence.at,
        envelopeId: evidence.envelopeId || null,
        owner: evidence.owner
      }
    });
  }
  /* Compare intent projections only. This is not a grant, lease manager or priority table; native
     retreat/reload/player/safety arbitration remains authoritative even without a conflict here. */
  function resourceConflicts(left, right) {
    var a = shape(left),
      b = shape(right);
    if (!a.ok) return a;
    if (!b.ok) return b;
    left = a.request;
    right = b.request;
    if (left.battleId !== right.battleId) return fail('wrong-battle');
    if (left.generation !== right.generation) return fail('stale-generation');
    var sameSquad = same(left, right, ['faction', 'squadId']);
    if (sameSquad) {
      if (left.missionVersion !== right.missionVersion) return fail('stale-mission');
      if (left.rosterRevision !== right.rosterRevision) return fail('stale-roster');
      if (left.controllerEpoch !== right.controllerEpoch) return fail('stale-controller');
    }
    if (same(left, right, TOKEN.concat(['actionId'])))
      return same(left, right, CORRELATION) && JSON.stringify(left.params) === JSON.stringify(right.params)
        ? frozen({ ok: true, reason: 'same-request', conflicts: [] })
        : fail('action-id-reuse');
    var conflicts = [],
      one = CAPABILITIES[left.capability],
      two = CAPABILITIES[right.capability],
      overlap =
        sameSquad && (left.actorId === null || right.actorId === null || left.actorId === right.actorId);
    if (overlap)
      one.resources.forEach(function (resource) {
        if (two.resources.indexOf(resource) >= 0) conflicts.push(resource);
      });
    if (left.capability === 'station.claim' && right.capability === 'station.claim') {
      var key = 'stationId';
      if (left.params[key] === right.params[key]) conflicts.push('physical-slot');
    }
    return frozen({
      ok: conflicts.length === 0,
      reason: conflicts.length ? 'resource-conflict' : 'no-conflict',
      conflicts: conflicts
    });
  }
  var API = frozen({
    capabilities: CAPABILITIES,
    reasons: REASONS,
    validateRequest: validateRequest,
    createReceipt: createReceipt,
    validateProgress: validateProgress,
    resourceConflicts: resourceConflicts
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.BattleTacticalCapabilityContract = API;
})(typeof window !== 'undefined' ? window : globalThis);
