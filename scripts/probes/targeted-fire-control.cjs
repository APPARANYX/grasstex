/* Focused, observe-only combat decision probe. Full shipping battle, selected men only.
   Select with URL params probeSide/probeRole/probeIds/probeSquads/probeWatch.
   NOTE: "gate" is a post-step diagnostic classification, NOT a count of function calls.
   Trigger-path LOS counters and onFire callbacks ARE actual attempted/fired events.
   NEVER call BattleCommandReception.adopted() or BattleDirectFireLOSGate.blocked()
   from the observer: both mutate runtime caches/command settlement. */
(function (root) {
  'use strict';
  var params = new URLSearchParams((root.location && root.location.search) || ''),
    csv = function (key) { return String(params.get(key) || '').split(',').map(function (v) { return v.trim(); }).filter(Boolean); },
    opts = {
      side: params.get('probeSide') || 'ge',
      role: params.get('probeRole') || 'gunner',
      ids: csv('probeIds'),
      squads: csv('probeSquads'),
      watch: csv('probeWatch').length ? csv('probeWatch') : ['command', 'gates', 'setup', 'stress', 'fire', 'los']
    },
    counters, prevFire, SAMPLE = 0.15, MAX_EVENTS = 600;
  function on(k) { return opts.watch.indexOf(k) >= 0; }
  function bump(obj, key, amount) { obj[key] = (obj[key] || 0) + (amount == null ? 1 : amount); }
  function round(n) { return +(+n || 0).toFixed(2); }
  function choose(s) {
    if (!s || !s.root || !s.squad) return false;
    return (opts.side === 'all' || s.faction === opts.side) &&
      (opts.role === 'all' || opts.role.split(',').indexOf(s.role) >= 0) &&
      (!opts.ids.length || opts.ids.indexOf(String(s.id)) >= 0) &&
      (!opts.squads.length || opts.squads.indexOf(String(s.squad.id)) >= 0);
  }
  function entry(s) {
    var id = String(s.faction) + ':' + String(s.id), d = counters.units[id];
    if (!d) {
      d = counters.units[id] = {
        id: s.id, faction: s.faction, role: s.role, squad: s.squad.id,
        samples: 0, targetSamples: 0, noTargetSamples: 0, rounds: 0, pulls: 0,
        profile: s.weapon && s.weapon.profile, gates: {}, engagements: {}, fireOrders: {},
        stresses: {}, setupSamples: 0, setupTransitions: 0, cowerTransitions: 0,
        LOSRejected: 0, crestRejected: 0, areaRejected: 0,
        episodes: [], last: null, silentSince: null, silenceLastShot: null,
        _los: 0, _crest: 0, _area: 0, _setup: null, _state: null, _fc: null
      };
    }
    return d;
  }
  function event(sim, d, kind, detail) {
    if (counters.events.length >= MAX_EVENTS) { counters.eventsOmitted++; return; }
    counters.events.push({
      t: round(sim.time), id: d.id, squad: d.squad, faction: d.faction,
      kind: kind, detail: detail
    });
  }
  function adoptedOrder(s, sim) {
    var CR = root.BattleCommandReception;
    if (!CR || !CR.postureEnabled || !CR.postureEnabled())
      return (s.squad && s.squad.fireControl && s.squad.fireControl.state) || 'none';
    // Directly read the last adopted record; adopted(s,sim) invokes settle() and is not observer-safe.
    var a = sim._commandReception && sim._commandReception.adoptedBySoldier,
      b = a && a[String(s.id)],
      r = b && b['posture-fire|squad'];
    return (r && r.data && r.data.state) || 'none';
  }
  function underFire(s, sim) {
    return (+s.suppressedUntil || 0) > sim.time ||
      !!(root.BattleSoldierMind && root.BattleSoldierMind.recentIncoming &&
        root.BattleSoldierMind.recentIncoming(s, sim.time, 3));
  }
  function angle(s, t) {
    var p = s.root.position, q = t.root.position,
      dx = q.x - p.x, dz = q.z - p.z, yaw = (s.root.rotation && s.root.rotation.y) || 0;
    return Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - yaw),
                               Math.cos(Math.atan2(dx, dz) - yaw)));
  }
  function gate(s, sim, order) {
    var e = s.eng || {}, t = s.target, w = s.weapon || {},
      rx = String(e.state || 'advance');
    // Primary reasons for a unit not participating in combat. First-blocker classification,
    // sampled AFTER the shipping AI step: indicative, not instrumented call-site evidence.
    if (s.dead) return 'dead';
    if (s.squad.state === 'retreat' || rx === 'withdraw') return 'withdraw';
    if (rx === 'cower' || rx === 'freeze' || rx === 'flee') return 'stress:' + rx;
    if (!t || t.dead || !t.root) return s.squad.inContact ? 'no-personal-target' : 'no-contact';
    if (rx === 'orient') return 'recognizing';
    if (rx === 'bound' || rx === 'assault' || rx === 'alert' || rx === 'advance') return 'fsm:' + rx;
    if (rx === 'pinned' && s.suppressedUntil - sim.time >= .4) return 'pinned';
    if (!w.kind || s.outOfAmmo || (!w.ammo && !w.reserveAmmo)) return 'ammunition';
    if (s.reloading || s.clearingStoppage || w.jammed) return 'reload-or-stoppage';
    if (sim.time < (+e.fireReadyAt || 0)) return 'aim-settle';
    if ((s.moving && (+s.moveSpeed || 0) > Math.max(.16, (+s.speed || 1) * .12)) || s.crawling)
      return 'movement';
    if (angle(s, t) > .22) return 'facing';
    if (root.SquadAI && root.SquadAI.isMachineGun && root.SquadAI.isMachineGun(s) &&
        !s.setUp && (rx === 'engage' || s.state === 'hardpoint')) return 'mg-setup';
    if (order !== 'open' && order !== 'none' && !underFire(s, sim))
      return 'fire-order:' + order;
    if (sim.time < (+((s.mind && s.mind.shockUntil) || 0))) return 'shock';
    var p = s.root.position, q = t.root.position, distance = Math.hypot(p.x - q.x, p.z - q.z);
    if (root.SquadAI && root.SquadAI.engageRange && distance > root.SquadAI.engageRange(s))
      return 'engagement-range';
    if (w.stats && distance > w.stats.range) return 'weapon-range';
    // Do not actively query LOS; read actual trigger-path rejection counters separately.
    if ((+s.fireCooldown || 0) > 0) return 'cooldown';
    return 'eligible-unknown'; // LOS + aim/cooldown scheduling not reconstructed here.
  }
  function silence(sim, d, s, why) {
    var hasTarget = !!(s.target && !s.target.dead && s.target.root),
      quiet = hasTarget && !s.dead;
    if (!quiet) {
      if (d.silentSince != null && sim.time - d.silentSince >= 5) {
        d.episodes.push({ from: round(d.silentSince), to: round(sim.time),
          seconds: round(sim.time - d.silentSince), gateAtEnd: why });
      }
      d.silentSince = null;
    } else if (d.silentSince == null) d.silentSince = sim.time;
    // A held target with no shots for five seconds is a symptom, not proof of a defect.
  }
  (root.BattleProbes = root.BattleProbes || {})['targeted-fire-control'] = {
    every: 0,
    start: function (sim) {
      counters = { config: opts, units: {}, events: [], eventsOmitted: 0,
        sampledSeconds: 0, selectedUnits: 0, rounds: 0, pulls: 0 };
      prevFire = sim.onFire;
      sim.onFire = function (s, delayed) {
        var out = prevFire && prevFire.apply(this, arguments);
        if (on('fire') && choose(s)) {
          var d = entry(s);
          d.rounds++; counters.rounds++;
          if (!delayed) { d.pulls++; counters.pulls++; }
          if (d.silentSince != null) {
            if (sim.time - d.silentSince >= 5)
              d.episodes.push({ from: round(d.silentSince), to: round(sim.time),
                seconds: round(sim.time - d.silentSince), gateAtEnd: 'shot-fired' });
            d.silentSince = sim.time;
          }
        }
        return out;
      };
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim), chosen = 0;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!choose(s)) continue;
        if (s.dead) {
          var former = counters.units[String(s.faction) + ':' + String(s.id)];
          if (former && on('fire')) silence(sim, former, s, 'death');
          continue;
        }
        chosen++;
        var d = entry(s), e = s.eng || {}, st = String(e.state || 'advance'),
          order = on('command') || on('gates') ? adoptedOrder(s, sim) : 'unwatched',
          why = on('gates') ? gate(s, sim, order) : 'unwatched';
        d.samples++;
        if (s.target && !s.target.dead) d.targetSamples++; else d.noTargetSamples++;
        if (on('gates')) bump(d.gates, why);
        bump(d.engagements, st);
        if (on('command')) {
          bump(d.fireOrders, order);
          if (d._fc !== null && d._fc !== order) event(sim, d, 'fire-order', d._fc + ' -> ' + order);
          d._fc = order;
        }
        if (on('setup')) {
          if (s.setUp) d.setupSamples++;
          if (d._setup !== null && d._setup !== !!s.setUp) {
            d.setupTransitions++;
            event(sim, d, 'mg-setup', s.setUp ? 'ready' : 'reset');
          }
          d._setup = !!s.setUp;
        }
        if (on('stress')) {
          var band = (s.mind && s.mind.band) == null ? 'none' : String(s.mind.band);
          bump(d.stresses, band);
          if (d._state !== null && d._state !== st) {
            if (st === 'cower') d.cowerTransitions++;
            if (st === 'cower' || d._state === 'cower') event(sim, d, 'engagement', d._state + ' -> ' + st);
          }
          d._state = st;
        }
        if (on('los')) {
          var los = +s._losBlockedFire || 0, crest = +s._crestBlockedFire || 0,
            area = +s._terrainBlockedSuppressiveFire || 0;
          d.LOSRejected += Math.max(0, los - d._los);
          d.crestRejected += Math.max(0, crest - d._crest);
          d.areaRejected += Math.max(0, area - d._area);
          d._los = los; d._crest = crest; d._area = area;
        }
        if (on('fire')) silence(sim, d, s, why);
        d.last = { t: round(sim.time), target: !!s.target, order: order, gate: why,
          engagement: st, setup: !!s.setUp, ammo: s.weapon && s.weapon.ammo };
      }
      counters.selectedUnits = Math.max(counters.selectedUnits, chosen);
      counters.sampledSeconds = round(sim.time);
    },
    report: function (sim) {
      Object.keys(counters.units).forEach(function (id) {
        var d = counters.units[id];
        if (d.silentSince != null && sim.time - d.silentSince >= 5)
          d.episodes.push({ from: round(d.silentSince), to: round(sim.time),
            seconds: round(sim.time - d.silentSince), gateAtEnd: 'battle-end' });
        delete d._los; delete d._crest; delete d._area;
        delete d._fc; delete d._state; delete d._setup; delete d.silentSince; delete d.silenceLastShot;
        if (d.episodes.length > 40) {
          d.episodesOmitted = d.episodes.length - 40;
          d.episodes = d.episodes.slice(0, 40);
        }
      });
      return counters;
    }
  };
})(window);
