/* TEMPORARY TEST HARNESS ONLY. Never load from battle/*.php or production scripts.
   Injection is allowed exclusively by scripts/probes/probe_phase_c_combat_lab.cjs
   when PHASE_C_COMBAT_LAB=1 in the Node harness process.
   This file must not be merged into production. */
(function (root) {
  'use strict';
  if (root.PhaseCCombatLab) throw new Error('Combat lab injected twice');

  const PRESETS = Object.freeze({
    A: Object.freeze({ immortalGe: false, silentGe: false, harmlessGeToUs: false, stationaryGe: false }),
    B: Object.freeze({ immortalGe: true, silentGe: false, harmlessGeToUs: false, stationaryGe: false }),
    C: Object.freeze({ immortalGe: false, silentGe: true, harmlessGeToUs: false, stationaryGe: false }),
    D: Object.freeze({ immortalGe: true, silentGe: true, harmlessGeToUs: false, stationaryGe: false }),
    E: Object.freeze({ immortalGe: true, silentGe: false, harmlessGeToUs: true, stationaryGe: false }),
    F: Object.freeze({ immortalGe: true, silentGe: true, harmlessGeToUs: false, stationaryGe: true })
  });
  const side = s => s && s.faction;
  const round = n => (Number.isFinite(+n) ? +(+n).toFixed(3) : null);

  function install(battle, code) {
    const config = PRESETS[code];
    if (!config) throw new Error('Invalid Phase C combat-lab variant: ' + code);
    if (!battle || !root.SquadAI || !root.BattleEngagement || !root.BattleWounds)
      throw new Error('Combat lab requires native battle, SquadAI, Engagement and Wounds modules');
    const SA = root.SquadAI;
    const W = root.BattleWounds;
    const G = root.BattleGrenades;
    const original = {
      tryFire: SA.tryFire,
      areaFire: SA.areaFire,
      applyHit: SA.applyHit,
      wound: W.wound,
      consider: G && G.consider,
      playerThrow: G && G.playerThrow
    };
    if (
      Object.values(original)
        .slice(0, 4)
        .some(f => typeof f !== 'function')
    )
      throw new Error('Combat lab missing required native interception point');
    const events = [];
    const tally = {
      preventedAimedAttempts: 0,
      preventedAreaAttempts: 0,
      preventedGrenadeAttempts: 0,
      physicallyRegisteredAbsorbedHits: 0,
      physicallyRegisteredAbsorbedBlasts: 0,
      blockedGermanDamage: 0,
      blockedAmericanDamage: 0,
      preservedWoundRngDraws: 0
    };
    const capped = (kind, s, shooter, hit) => {
      tally[kind]++;
      if (events.length < 300)
        events.push({
          t: round(battle.time),
          kind,
          victim: String(s && s.id),
          faction: side(s),
          shooter: String(shooter && shooter.id),
          zone: (hit && hit.zone) || null
        });
    };
    let restored = false;
    const locked = [];
    const ge = (battle.rosterOf('ge') || []).slice();
    const geOrigin = ge.map(s => ({
      id: String(s.id),
      x: round(s.root.position.x),
      y: round(s.root.position.y),
      z: round(s.root.position.z),
      soldier: s
    }));

    // Registration of a physically struck body is still owned by the authentic
    // ballistic ray and its onShot metadata. Suppression from an actual hit is
    // reproduced with the native pin writer (wound-model SHOCK = 1.2s).
    // No fake contact, wound record, casualties, or event is generated.
    function absorb(victim, shooter, b, hit, blast) {
      // Native BattleWounds.wound draws one zone roll only when zone is
      // unknown, then severity and drop rolls per impact (even for a fatal
      // wound). Consume precisely those draws for physically intercepted
      // hits so the combat RNG stream does not drift *merely* because this
      // lab variant protects health. Different later shots still naturally
      // cause legitimate branch-specific RNG evolution.
      const knownZone =
        hit && ['head', 'chest', 'abdomen', 'arm', 'leg'].includes(hit.zone);
      const draw = b && typeof b.random === 'function' ? () => b.random() : Math.random;
      if (!knownZone) {
        draw();
        tally.preservedWoundRngDraws++;
      }
      draw();
      draw();
      tally.preservedWoundRngDraws += 2;
      capped(
        blast ? 'physicallyRegisteredAbsorbedBlasts' : 'physicallyRegisteredAbsorbedHits',
        victim,
        shooter,
        hit
      );
      if (blast) {
        if (side(victim) === 'ge') tally.blockedGermanDamage++;
        else tally.blockedAmericanDamage++;
      } else if (side(victim) === 'ge') tally.blockedGermanDamage++;
      else tally.blockedAmericanDamage++;
      SA.pin(victim, b, 1.2);
      return { zone: (hit && hit.zone) || null, outcome: 'combat-lab-absorbed', damage: 0 };
    }
    const protectedRecipient = (shooter, victim) =>
      (config.immortalGe && side(victim) === 'ge') ||
      (config.harmlessGeToUs && side(shooter) === 'ge' && side(victim) === 'us');

    SA.tryFire = function (soldier, b) {
      if (config.silentGe && side(soldier) === 'ge') {
        tally.preventedAimedAttempts++;
        return false;
      }
      return original.tryFire.apply(this, arguments);
    };
    SA.areaFire = function (soldier) {
      if (config.silentGe && side(soldier) === 'ge') {
        tally.preventedAreaAttempts++;
        return 0;
      }
      return original.areaFire.apply(this, arguments);
    };
    SA.applyHit = function (shooter, victim, b, hit) {
      if (protectedRecipient(shooter, victim)) return absorb(victim, shooter, b, hit, false);
      return original.applyHit.apply(this, arguments);
    };
    // Grenade fragmentation bypasses SquadAI.applyHit and invokes the wound
    // model directly; intercept only protected target recipients at that seam.
    W.wound = function (shooter, victim, b, hit) {
      if (protectedRecipient(shooter, victim)) return absorb(victim, shooter, b, hit, true);
      return original.wound.apply(this, arguments);
    };
    if (G && typeof original.consider === 'function') {
      G.consider = function (soldier) {
        if (config.silentGe && side(soldier) === 'ge') {
          tally.preventedGrenadeAttempts++;
          return null;
        }
        return original.consider.apply(this, arguments);
      };
    }
    if (G && typeof original.playerThrow === 'function') {
      G.playerThrow = function (soldier) {
        if (config.silentGe && side(soldier) === 'ge') {
          tally.preventedGrenadeAttempts++;
          return null;
        }
        return original.playerThrow.apply(this, arguments);
      };
    }

    // Native BattleSim.step calls a private movement integrator. In F, prevent
    // that integrator from changing German transforms, rather than removing
    // Germans from the roster (which would also break perception and collision).
    // Intercept all writes, including Babylon Vector3 copyFrom, for the run.
    if (config.stationaryGe)
      for (const s of ge) {
        const pos = s.root.position;
        for (const axis of ['x', 'y', 'z']) {
          const old = Object.getOwnPropertyDescriptor(pos, axis);
          if (old && old.configurable === false)
            throw new Error('Cannot freeze German physical position.' + axis);
          const at = +pos[axis];
          Object.defineProperty(pos, axis, {
            configurable: true,
            enumerable: true,
            get() {
              return at;
            },
            set(_) {}
          });
          locked.push({ pos, axis, old, at });
        }
        // A geometrically fixed body must not retain a 'moving' visibility
        // bonus or movement-state claim from attempted AI locomotion.
        const oldMoving = Object.getOwnPropertyDescriptor(s, 'moving');
        if (oldMoving && oldMoving.configurable === false)
          throw new Error('Cannot freeze German movement flag');
        Object.defineProperty(s, 'moving', {
          configurable: true,
          enumerable: true,
          get() {
            return false;
          },
          set(_) {}
        });
        locked.push({ pos: s, axis: 'moving', old: oldMoving, at: false });
      }
    return {
      code,
      config,
      tally,
      events,
      geOrigin: geOrigin.map(({ soldier, ...p }) => p),
      assertInvariants() {
        if (config.immortalGe && ge.some(s => s.dead || s.hp <= 0))
          throw new Error('German invulnerability broken in variant ' + code);
        if (
          config.stationaryGe &&
          ge.some(
            (s, i) =>
              Math.abs(s.root.position.x - geOrigin[i].x) > 0.002 ||
              Math.abs(s.root.position.z - geOrigin[i].z) > 0.002
          )
        )
          throw new Error('German stationary geometry drifted in variant F');
      },
      restore() {
        if (restored) return;
        restored = true;
        for (const { pos, axis, old, at } of locked) {
          const now = +pos[axis];
          delete pos[axis];
          if (old) Object.defineProperty(pos, axis, old);
          else pos[axis] = now;
        }
        SA.tryFire = original.tryFire;
        SA.areaFire = original.areaFire;
        SA.applyHit = original.applyHit;
        W.wound = original.wound;
        if (G && original.consider) G.consider = original.consider;
        if (G && original.playerThrow) G.playerThrow = original.playerThrow;
      }
    };
  }

  root.PhaseCCombatLab = Object.freeze({ PRESETS, install });
})(typeof window !== 'undefined' ? window : globalThis);
