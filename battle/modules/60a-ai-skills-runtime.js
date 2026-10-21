/* #602 C: one bounded commitment scheduler. Skills build data-only trees;
   only the adapter below can request effects, through the existing authority. */
(function (root) {
  'use strict';
  var MAX_NODES = 32,
    MAX_DEPTH = 8,
    MAX_OPS = 64,
    MAX_SECONDS = 10,
    MAX_ROWS = 128;
  var failures = [
    'invalid-target',
    'stale-intel',
    'blocked-route',
    'never-arrived',
    'unsupported-action',
    'no-authority',
    'interrupted'
  ];
  function immutable(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (k) {
        immutable(value[k]);
      });
      Object.freeze(value);
    }
    return value;
  }
  function seconds(n, limit) {
    return Number.isFinite(n) && n >= 0 && n <= limit;
  }
  var actions = Object.freeze({
    sequence: function () {
      return immutable({ type: 'sequence', children: Array.prototype.slice.call(arguments) });
    },
    selector: function () {
      return immutable({ type: 'selector', children: Array.prototype.slice.call(arguments) });
    },
    wait: function (n) {
      return immutable({ type: 'wait', seconds: n });
    },
    timeout: function (n, child) {
      return immutable({ type: 'timeout', seconds: n, child: child });
    },
    retry: function (n, child) {
      return immutable({ type: 'retry', attempts: n, child: child });
    },
    owner: function (name) {
      return immutable({ type: 'action', action: name });
    },
    posture: function (level) {
      // Shared Engagement effector; skills never write stance directly.
      var stance = level === undefined ? 'crouch' : level;
      if (stance !== 'crouch' && stance !== 'prone')
        throw new Error('Unsupported lowering posture');
      return immutable({ type: 'action', action: stance });
    }
  });
  function validate(tree, limit) {
    var count = 0;
    function walk(node, depth) {
      if (
        !node ||
        typeof node !== 'object' ||
        Array.isArray(node) ||
        ++count > MAX_NODES ||
        depth > MAX_DEPTH
      )
        throw new Error('Invalid tree budget');
      var fields;
      if (node.type === 'sequence' || node.type === 'selector') {
        fields = ['type', 'children'];
        if (!Array.isArray(node.children) || !node.children.length) throw new Error('Invalid children');
        node.children.forEach(function (child) {
          walk(child, depth + 1);
        });
      } else if (node.type === 'wait') {
        fields = ['type', 'seconds'];
        if (!seconds(node.seconds, limit)) throw new Error('Invalid wait');
      } else if (node.type === 'timeout' || node.type === 'retry') {
        fields = ['type', node.type === 'timeout' ? 'seconds' : 'attempts', 'child'];
        if (
          node.type === 'timeout'
            ? !seconds(node.seconds, limit)
            : !Number.isInteger(node.attempts) || node.attempts < 1 || node.attempts > 3
        )
          throw new Error('Invalid decorator');
        walk(node.child, depth + 1);
      } else if (node.type === 'action') {
        fields = ['type', 'action'];
        if (typeof node.action !== 'string' || node.action.length > 80) throw new Error('Invalid action');
      } else throw new Error('Unsupported node');
      if (
        Object.keys(node).some(function (key) {
          return fields.indexOf(key) < 0;
        })
      )
        throw new Error('Invalid node fields');
    }
    walk(tree, 1);
    // Clone after validation; retained factory objects cannot alter a running plan.
    return immutable(JSON.parse(JSON.stringify(tree)));
  }
  function scope(actor) {
    return Array.isArray(actor.members) ? 'squad' : 'soldier';
  }
  function keyOf(actor) {
    return scope(actor) + ':' + actor.faction + ':' + String(actor.id);
  }
  function blocker(sim, actor) {
    if (scope(actor) === 'squad')
      return root.BattleAISquadAdapter ? root.BattleAISquadAdapter.blocker(sim, actor) : 'no-authority';
    var sq = actor && actor.squad,
      e = actor && actor.eng,
      transport = root.BattleSquadTransport,
      E = root.BattleEngagement,
      L = root.BattleLeases;
    if (
      !actor ||
      !sq ||
      actor.dead ||
      actor.incapacitated ||
      actor.isPlayer ||
      sim.winner ||
      sq.state !== 'advance' ||
      sq.inContact ||
      sq.clearContact ||
      actor.reloading ||
      !e ||
      e.state !== 'advance' ||
      e.stance !== 'stand' ||
      e.boundOrder ||
      e.suppressOrder ||
      (actor.suppressedUntil || 0) > sim.time ||
      (transport && transport.isPassenger(actor)) ||
      (E && E.underFireNow && E.underFireNow(actor, sim))
    )
      return 'interrupted';
    if (!E || !E.requestStance || !L || !L.kinds || !L.holds) return 'no-authority';
    // Existing command commitments take precedence. Never grant/extend/end a Meso lease.
    var kinds = L.kinds();
    if (
      Object.keys(kinds).some(function (kind) {
        return !kinds[kind].diagnostic && L.holds(sq, kind, sim.time);
      })
    )
      return 'no-authority';
    return null;
  }
  function create() {
    var plans = new Map(),
      rows = [],
      serial = 0;
    function record(plan, lifecycle, reason, action, owner) {
      if (!plan.observer) return;
      rows.push(
        immutable({
          scope: plan.scope,
          entity: plan.entity,
          planSerial: plan.planSerial,
          faction: plan.faction,
          generation: plan.generation,
          missionVersion: plan.missionVersion,
          skill: plan.skill,
          score: plan.score,
          at: plan.now,
          serial: ++serial,
          resources: plan.resources.slice(),
          lifecycle: lifecycle,
          reason: reason,
          action: action || 'plan',
          owner: owner || 'ai-skills-scheduler'
        })
      );
      if (rows.length > MAX_ROWS) rows.shift();
    }
    function finish(plan, lifecycle, reason) {
      if (plan.lifecycle !== 'running' && plan.lifecycle !== 'not-started') return;
      if (plan.scope === 'squad' && lifecycle !== 'succeeded' && root.BattleAISquadAdapter)
        root.BattleAISquadAdapter.cancel(plan.sim, plan.actor, reason);
      plan.lifecycle = lifecycle;
      plan.nodes = Object.create(null);
      plan.resources = [];
      plan.tree = null;
      record(plan, lifecycle, reason);
    }
    function cancelAll(reason, now) {
      plans.forEach(function (p) {
        if (Number.isFinite(now)) p.now = now;
        finish(p, 'cancelled', reason);
      });
      plans.clear();
    }
    function reconcile(actors, sim) {
      var present = new Map();
      actors.forEach(function (a) {
        present.set(keyOf(a), a);
      });
      plans.forEach(function (p, key) {
        var a = present.get(key),
          mission = a && (scope(a) === 'squad' ? a._macroMission : a.squad && a.squad._macroMission);
        p.now = sim.time;
        if (
          !a ||
          a !== p.actor ||
          a.dead ||
          !mission ||
          mission !== p.mission ||
          mission.version !== p.missionVersion
        ) {
          finish(p, 'cancelled', 'interrupted');
          plans.delete(key);
        }
      });
    }
    function effect(plan, sim, actor, snap, name, context) {
      if (snap.scope === 'squad') {
        var value;
        try {
          value = root.BattleAISquadAdapter.perform(name, sim, actor, snap, plan, context);
        } catch (error) {
          finish(plan, 'failed', 'owner-error');
          throw error;
        }
        if (
          !value ||
          ['Success', 'Running', 'Failure'].indexOf(value.status) < 0 ||
          typeof value.reason !== 'string'
        )
          return { status: 'Failure', reason: 'unsupported-action' };
        if (!plan.actionStarted) {
          record(plan, 'not-started', 'requested', name, 'squad-leader');
          record(plan, 'running', 'requested', name, 'squad-leader');
          plan.actionStarted = true;
        }
        if (value.status !== 'Running')
          record(
            plan,
            value.status === 'Success' ? 'succeeded' : 'failed',
            value.reason,
            name,
            'squad-leader'
          );
        return value;
      }
      var owner = name === 'crouch' || name === 'prone' ? 'engagement' : 'ai-skills-scheduler';
      record(plan, 'not-started', 'requested', name, owner);
      record(plan, 'running', 'requested', name, owner);
      function failed(reason) {
        record(plan, 'failed', reason, name, owner);
        return { status: 'Failure', reason: reason };
      }
      if (name !== 'crouch' && name !== 'prone') return failed('unsupported-action');
      if (plan.resources.indexOf('posture') < 0) return failed('no-authority');
      if (blocker(sim, actor)) return failed('interrupted');
      if (
        !snap.guards.receipt ||
        !snap.guards.mission ||
        !snap.guards.roe ||
        snap.missionVersion !== plan.missionVersion
      )
        return failed('no-authority');
      // Atomic, lowering-only request. Engagement owns its 0.45s hold and all subsequent reactions.
      // Its ordinary upright march timer does not prevent a lower posture request.
      var accepted;
      try {
        accepted = root.BattleEngagement.requestStance(actor, sim, name, 0.45);
      } catch (error) {
        return failed('no-authority');
      }
      if (!accepted) return failed('no-authority');
      record(plan, 'succeeded', 'accepted', name, owner);
      return { status: 'Success', reason: 'accepted' };
    }
    function run(plan, sim, actor, snap, context) {
      var ops = MAX_OPS;
      function visit(node, path) {
        if (--ops < 0) return { status: 'Failure', reason: 'unsupported-action' };
        var state = plan.nodes[path] || (plan.nodes[path] = { at: sim.time, index: 0, attempts: 0 });
        if (state.result) return state.result;
        var result;
        if (node.type === 'wait')
          result = {
            status: sim.time - state.at + 1e-9 >= node.seconds ? 'Success' : 'Running',
            reason: 'waiting'
          };
        else if (node.type === 'action') result = effect(plan, sim, actor, snap, node.action, context);
        else if (node.type === 'timeout')
          result =
            sim.time - state.at + 1e-9 >= node.seconds
              ? { status: 'Failure', reason: 'never-arrived' }
              : visit(node.child, path + '.0');
        else if (node.type === 'retry') {
          result = visit(node.child, path + '.0');
          if (result.status === 'Failure' && ++state.attempts < node.attempts) {
            Object.keys(plan.nodes).forEach(function (k) {
              if (k.indexOf(path + '.') === 0) delete plan.nodes[k];
            });
            result = { status: 'Running', reason: 'retrying' };
          }
        } else {
          while (state.index < node.children.length) {
            result = visit(node.children[state.index], path + '.' + state.index);
            if (
              result.status === 'Running' ||
              (node.type === 'sequence' && result.status === 'Failure') ||
              (node.type === 'selector' && result.status === 'Success')
            )
              break;
            state.index++;
          }
          if (state.index === node.children.length)
            result = { status: node.type === 'sequence' ? 'Success' : 'Failure', reason: result.reason };
        }
        if (result.status !== 'Running') state.result = result;
        return result;
      }
      return visit(plan.tree, '0');
    }
    function step(sim, actor, snap, selection, skills, config, context) {
      var key = keyOf(actor),
        plan = plans.get(key),
        chosen = selection.chosen && skills[selection.chosen],
        blocked = blocker(sim, actor);
      if (
        plan &&
        (plan.generation !== snap.generation ||
          plan.missionVersion !== snap.missionVersion ||
          plan.mission !==
            (scope(actor) === 'squad' ? actor._macroMission : actor.squad && actor.squad._macroMission))
      ) {
        finish(plan, 'cancelled', 'interrupted');
        plans.delete(key);
        plan = null;
      }
      if (
        plan &&
        plan.scope === 'squad' &&
        plan.lifecycle === 'succeeded' &&
        chosen &&
        chosen.id !== plan.skill
      ) {
        plans.delete(key);
        plan = null;
      }
      // Commitment is stable despite close/reversed utility scores. Only guards or the deadline interrupt.
      if (plan && plan.lifecycle === 'running') {
        plan.now = sim.time;
        if (
          (blocked && blocked !== 'no-authority') ||
          !snap.guards.alive ||
          !snap.guards.safe ||
          !snap.guards.mission ||
          !snap.guards.receipt ||
          !snap.guards.roe ||
          !snap.guards.budget ||
          !config.skills[plan.skill] ||
          !config.skills[plan.skill].enabled
        ) {
          finish(plan, 'cancelled', blocked || 'interrupted');
          return;
        }
        if (
          skills[plan.skill].requires.some(function (cap) {
            return !snap.capabilities[cap];
          })
        ) {
          finish(plan, 'failed', 'stale-intel');
          return;
        }
        if (sim.time < plan.startedAt || sim.time - plan.startedAt >= plan.limit) {
          finish(plan, 'failed', 'never-arrived');
          return;
        }
        if (blocked === 'no-authority') {
          plan.resources = [];
          if (!plan.suspended) record(plan, 'running', 'suspended');
          plan.suspended = true;
          return;
        }
        if (plan.suspended) {
          plan.suspended = false;
          plan.resources = skills[plan.skill].resources.slice();
          record(plan, 'running', 'resumed');
        }
      }
      // One attempt per actor/mission, including failures: no hidden per-skill cooldown or retry loop.
      if (plan && plan.lifecycle !== 'running') return;
      if (!plan) {
        if (!chosen || !chosen.createPlan || blocked) return;
        plan = {
          actor: actor,
          sim: sim,
          scope: snap.scope,
          planSerial: snap.planSerial || null,
          limit: snap.scope === 'squad' ? 60 : MAX_SECONDS,
          entity: snap.entity,
          faction: snap.faction,
          generation: snap.generation,
          missionVersion: snap.missionVersion,
          mission: snap.scope === 'squad' ? actor._macroMission : actor.squad && actor.squad._macroMission,
          skill: chosen.id,
          score: selection.decisions.find(function (d) {
            return d.selected;
          }).score,
          now: sim.time,
          startedAt: sim.time,
          observer: config.observer,
          resources: chosen.resources.slice(),
          nodes: Object.create(null),
          lifecycle: 'not-started'
        };
        plans.set(key, plan);
        record(plan, 'not-started', 'selected');
        try {
          plan.tree = validate(
            chosen.createPlan(snap, actions, config.skills[chosen.id].parameters),
            plan.limit
          );
        } catch (error) {
          finish(plan, 'failed', 'unsupported-action');
          return;
        }
        plan.lifecycle = 'running';
        record(plan, 'running', 'committed');
      }
      var result = run(plan, sim, actor, snap, context);
      if (result.status !== 'Running')
        finish(plan, result.status === 'Success' ? 'succeeded' : 'failed', result.reason);
    }
    return Object.freeze({
      step: step,
      reconcile: reconcile,
      cancelAll: cancelAll,
      status: function (actor) {
        var p = plans.get(keyOf(actor));
        return p ? immutable({ lifecycle: p.lifecycle, skill: p.skill }) : null;
      },
      observe: function (enabled) {
        rows = [];
        plans.forEach(function (p) {
          p.observer = enabled;
        });
      },
      diagnostics: function (observer) {
        return immutable({
          active: Array.from(plans.values()).filter(function (p) {
            return p.lifecycle === 'running';
          }).length,
          receipts: observer ? rows.slice() : []
        });
      }
    });
  }
  root.BattleAISkillRuntime = Object.freeze({
    actions: actions,
    create: create,
    blocker: blocker,
    failures: Object.freeze(failures),
    limits: Object.freeze({
      nodes: MAX_NODES,
      depth: MAX_DEPTH,
      operations: MAX_OPS,
      seconds: MAX_SECONDS,
      receipts: MAX_ROWS
    })
  });
})(typeof window !== 'undefined' ? window : globalThis);
