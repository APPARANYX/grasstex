/* #456 R3: semantic animation decisions from simulation snapshots/events.
   Preserve the original authored clip choices, RNG call order, reaction/drop
   logic and clock updates; only the lexical code owner changes. */
(function (root) {
  'use strict';
  if (root.BattleFbxAnimationState) return;
  root.BattleFbxAnimationState = {
    create: function (deps) {
      var Q = deps.Q,
        TAGS = deps.TAGS,
        THROW_RELEASE = deps.THROW_RELEASE,
        REACTION_ANIM = deps.REACTION_ANIM,
        DEATH_POOLS = deps.DEATH_POOLS,
        IDLE_VARIANTS = deps.IDLE_VARIANTS,
        FLINCH_RATE = deps.FLINCH_RATE,
        setClip = deps.setClip,
        advanceLayer = deps.advanceLayer,
        topEntry = deps.topEntry;
      /* ---- simulation-side state machine -------------------------------------------------------- */

      function play(tag, data, soldier) {
        var fx = soldier && soldier._fbx;
        if (!fx) return;
        /* Every round of one trigger pull arrives on the same AI tick; a round after the first (delay>0)
       marks the pull as a burst, whatever the weapon kind (the FG 42 bursts only inside autoWithin). */
        if (tag === TAGS.fire) {
          fx.fireShot++;
          fx.fireBurst = +(data && data.delay) > 0;
          // Burst rounds arrive together with future muzzle offsets. Reload must
          // leave half a second after the final scheduled discharge, not this tick.
          fx.shotSettle = Math.max(fx.shotSettle || 0, 0.5 + Math.max(0, +(data && data.delay) || 0));
        } else if (tag === TAGS.hit) fx.hitShot = (fx.hitShot || 0) + 1;
        else if (tag === TAGS.reload) {
          fx.reloadShot++;
          fx.reloadWait = data && data.delay != null ? Math.max(0, +data.delay || 0) : fx.shotSettle || 0;
          fx.reloadDuration =
            +(data && data.duration) ||
            (soldier.weapon && soldier.weapon.stats && soldier.weapon.stats.reloadTime) ||
            2.5;
        } else if (tag === TAGS.throw) {
          var stance =
              (data && data.stance) || (soldier.prone ? 'prone' : soldier.crouching ? 'crouch' : 'stand'),
            key = stance === 'prone' ? 'throwProne' : stance === 'crouch' ? 'throwCrouch' : 'throw',
            clip = fx.lib.clips[key];
          if (!clip) return;
          /* The authored forward swing peaks here. Scale the clip's lead-in onto the authoritative
           decision/release window, then keep the follow-through at that rate. Cosmetic clocks only. */
          var windup = Math.max(0.1, +(data && data.releaseAt) - +(data && data.decidedAt) || 0.9);
          fx.throwing = {
            key: key,
            stance: stance,
            rate: THROW_RELEASE[key] / windup,
            started: false
          };
        }
      }
      var clamp = root.GTMath.clamp;
      function sectorOf(fx, angle) {
        /* Eight-way sector with a little stickiness so a diagonal path does not flicker between clips. */
        var step = Math.PI / 4,
          current = fx.sector,
          diff = Math.atan2(Math.sin(angle - current * step), Math.cos(angle - current * step));
        if (Math.abs(diff) < step * 0.5 + 0.14) return current;
        return ((Math.round(angle / step) % 8) + 8) % 8;
      }
      function familyOf(fx, clips, speed, families) {
        var best = null,
          bestCost = Infinity;
        families.forEach(function (f) {
          var natural = clips[f + '0'].speed || 1,
            cost = Math.abs(Math.log(Math.max(0.05, speed) / natural));
          if (f === fx.family) cost -= 0.18;
          if (cost < bestCost) {
            bestCost = cost;
            best = f;
          }
        });
        return best;
      }
      function reactionOf(soldier) {
        var e = soldier && soldier.eng,
          k = e && e.state;
        /* A fled man waiting at his refuge for a retreating squad shows one of the freeze holds; whenever he moves he runs. */
        if (k === 'flee' && e.fledPhase === 'wait') return 'freeze';
        return k === 'cower' || k === 'flee' || k === 'freeze' || k === 'rage' ? k : null;
      }
      /* Stable per man and independent of every simulation RNG: the same broken man presents the same
     freeze hold on every run. This choice is visual only and never feeds back into Engagement. */
      function freezeHoldOf(soldier) {
        var s = String((soldier && soldier.faction) || '') + ':' + String((soldier && soldier.id) || ''),
          h = 2166136261;
        for (var i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return REACTION_ANIM.holds[(h >>> 0) % REACTION_ANIM.holds.length];
      }
      function reactionDropsWeapon(reaction) {
        return reaction === 'cower' || reaction === 'freeze';
      }
      function weaponMeshes(w) {
        return [w.mesh, w.bipodMesh].filter(function (mesh) {
          return mesh && !mesh.isDisposed();
        });
      }
      function standAt(soldier) {
        var p = soldier.root.position;
        return { x: p.x, y: p.y, z: p.z, yaw: soldier.root.rotation.y || 0 };
      }
      function trackDetachedWeapon(fx, mesh) {
        if (!fx || !mesh) return;
        var list = fx.detachedWeaponMeshes || (fx.detachedWeaponMeshes = []);
        if (list.indexOf(mesh) < 0) list.push(mesh);
      }
      function untrackDetachedWeapon(fx, mesh) {
        var list = fx && fx.detachedWeaponMeshes,
          i = list ? list.indexOf(mesh) : -1;
        if (i >= 0) list.splice(i, 1);
      }
      function putBeside(at, w, fx) {
        var yaw = at.yaw || 0,
          sin = Math.sin(yaw),
          cos = Math.cos(yaw),
          p = at;
        [w.mesh, w.bipodMesh].forEach(function (mesh, i) {
          if (!mesh || mesh.isDisposed()) return;
          mesh.parent = null;
          trackDetachedWeapon(fx, mesh);
          var side = REACTION_ANIM.dropSide + i * 0.04;
          mesh.position.set(
            p.x + cos * side - sin * REACTION_ANIM.dropBack,
            p.y + REACTION_ANIM.dropLift + i * 0.01,
            p.z - sin * side - cos * REACTION_ANIM.dropBack
          );
          if (!mesh.rotationQuaternion) mesh.rotationQuaternion = new Q();
          Q.RotationYawPitchRollToRef(yaw + REACTION_ANIM.dropYaw, 0, 0, mesh.rotationQuaternion);
        });
      }
      /* What the man does with the weapon in his hands is the sim's: cower and freeze put it beside him for the spell and take it
     up again (he still carries it); a man who has fled no longer has one (`soldier.weapon` is null, Engagement left it
     behind), so it stays where it lies, a prop in the world, and the new one he is issued at base is drawn in his hands. */
      function reactionWeapon(soldier, fx, drop) {
        var held = fx.reactionWeapon,
          w = soldier.weapon;
        function restore(entry) {
          var old = entry && entry.weapon;
          if (!old) return;
          weaponMeshes(old).forEach(function (mesh) {
            mesh.parent = old.socket || fx.socket;
            untrackDetachedWeapon(fx, mesh);
            delete mesh._battleAbandonedWeapon;
            mesh.position.set(0, 0, 0);
            if (mesh.rotationQuaternion) mesh.rotationQuaternion.set(0, 0, 0, 1);
            else mesh.rotation.set(0, 0, 0);
          });
        }
        if (!w) {
          var left = (held && held.weapon) || fx.weapon;
          fx.reactionWeapon = null;
          fx.weapon = null;
          fx.weaponModel = null;
          if (!left) return;
          if (!held) putBeside(left.droppedAt || standAt(soldier), left, fx);
          weaponMeshes(left).forEach(function (mesh) {
            mesh._battleAbandonedWeapon = true;
          });
          return;
        }
        if (!drop) {
          if (held) restore(held);
          fx.reactionWeapon = null;
          return;
        }
        if (held && held.weapon === w) return;
        if (held) restore(held);
        if (!w.mesh) return;
        fx.reactionWeapon = { weapon: w };
        putBeside(standAt(soldier), w, fx);
      }
      function reactionFullBody(fx, clips, key, rate, fade) {
        var clip = clips[key];
        if (!clip) return false;
        setClip(fx.lower, clip, rate, fade == null ? REACTION_ANIM.fade : fade, false, false);
        fx.overlayTarget = 0;
        fx.aimWanted = false;
        fx.bipod = false;
        fx.supportReleased = true;
        return true;
      }
      function updateReactionLower(soldier, fx, clips, reaction, stance, dt) {
        var top,
          key,
          rate = 1;
        if (reaction === 'cower') {
          if (fx.reactionPhase === 'enter') {
            key = 'reactionCowerEnter';
            rate = REACTION_ANIM.cowerEnterRate;
            top = topEntry(fx.lower);
            if (top && top.clip.key === key && top.t >= top.clip.duration - 0.04) {
              fx.reactionPhase = 'hold';
              key = 'reactionCowerHold';
              rate = 1;
            }
          } else key = 'reactionCowerHold';
        } else if (reaction === 'freeze') {
          if (fx.reactionPhase === 'enter') {
            key = 'reactionFreezeEnter';
            rate = REACTION_ANIM.freezeEnterRate;
            top = topEntry(fx.lower);
            if (top && top.clip.key === key && top.t >= top.clip.duration - 0.04) {
              fx.reactionPhase = 'hold';
              key = fx.reactionHold;
              rate = 1;
            }
          } else key = fx.reactionHold;
        } else if (reaction === 'flee') {
          top = topEntry(fx.lower);
          if (fx.reactionPhase === 'enter') {
            key = 'reactionFleeEnter';
            rate = REACTION_ANIM.fleeEnterRate;
            if (top && top.clip.key === key && top.t >= top.clip.duration - 0.04) fx.reactionPhase = 'run';
          }
          if (fx.reactionPhase !== 'enter') {
            /* Whenever a fled man moves he runs; waiting at his refuge is a freeze hold (reactionOf). */
            key = 'reactionFleeRun';
            rate = clamp(fx.speed / (clips[key].speed || 2.8), 0.7, 1.8);
          }
        } else return false;
        if (!reactionFullBody(fx, clips, key, rate)) return false;
        fx.stance = stance;
        advance(fx, dt);
        return true;
      }
      function update(soldier, state, dt) {
        var fx = soldier._fbx;
        if (!fx) return false;
        var clips = fx.lib.clips;
        dt = Math.max(0, +dt || 0);
        fx.shotSettle = Math.max(0, (fx.shotSettle || 0) - dt);
        fx.reloadWait = Math.max(0, (fx.reloadWait || 0) - dt);
        var reloadVisible = !!soldier.reloading && fx.reloadWait < 1e-6;
        if (soldier.weapon && soldier.weapon.kind) {
          fx.weaponKind = soldier.weapon.kind;
          fx.weaponModel = soldier.weapon.model || null;
          fx.weapon = soldier.weapon;
        }

        /* Ground velocity from what navigation actually did this step, in the soldier's own frame. */
        var p = soldier.root.position;
        if (fx.lastX == null || dt <= 0) {
          fx.lastX = p.x;
          fx.lastZ = p.z;
        }
        var vx = dt > 0 ? (p.x - fx.lastX) / dt : 0,
          vz = dt > 0 ? (p.z - fx.lastZ) / dt : 0;
        fx.lastX = p.x;
        fx.lastZ = p.z;
        if (vx * vx + vz * vz > 225) {
          vx = fx.vx;
          vz = fx.vz;
        } /* respawn/teleport: not motion, keep the last estimate */
        var k = 1 - Math.exp(-dt * 9);
        fx.vx += (vx - fx.vx) * k;
        fx.vz += (vz - fx.vz) * k;
        fx.speed = Math.sqrt(fx.vx * fx.vx + fx.vz * fx.vz);

        if (soldier.dead) {
          fx.throwing = null;
          fx.bipod = false;
          if (!fx.death) {
            /* Pick from the pool for how he fell; a soldier cut down at a run carries his momentum. */
            var pool =
              fx.stance === 'prone'
                ? 'prone'
                : fx.stance === 'crouch'
                  ? 'crouch'
                  : fx.speed > 2.4 && fx.moving && Math.abs(fx.heading || 0) < 0.8
                    ? 'running'
                    : soldier.deathVariant === 'front' || soldier.deathVariant === 'back'
                      ? soldier.deathVariant
                      : 'side';
            var keys = DEATH_POOLS[pool].filter(function (k) {
                return !!clips[k];
              }),
              v = keys[Math.floor(Math.random() * keys.length)] || 'deathSide';
            fx.death = v;
            setClip(fx.lower, clips[v], 1, 0.18, true, false);
          }
          fx.overlayTarget = 0;
          fx.aimWanted = false;
          fx.supportReleased = true;
          advance(fx, dt);
          return true;
        }
        fx.death = null;

        if (fx.throwing) {
          var throwing = fx.throwing,
            throwClip = clips[throwing.key],
            throwTop = topEntry(fx.lower);
          if (throwing.started && throwTop && throwTop.t >= throwClip.duration - 0.03) fx.throwing = null;
          else {
            setClip(fx.lower, throwClip, throwing.rate, 0.12, !throwing.started, false);
            throwing.started = true;
            fx.transition = null;
            fx.overlayTarget = 0;
            fx.aimWanted = false;
            fx.bipod = false;
            fx.supportReleased = true;
            fx.stance = throwing.stance;
            advance(fx, dt);
            return true;
          }
        }

        var stance = soldier.prone ? 'prone' : soldier.crouching ? 'crouch' : 'stand';
        var reaction = reactionOf(soldier),
          oldReaction = fx.reaction;
        if (reaction !== oldReaction) {
          fx.reaction = reaction;
          fx.reactionPhase = reaction ? 'enter' : null;
          fx.reactionHold = reaction === 'freeze' ? freezeHoldOf(soldier) : null;
          fx.cowerExit = oldReaction === 'cower' && !reaction;
        }
        reactionWeapon(soldier, fx, reactionDropsWeapon(reaction) || fx.cowerExit);
        /* Cower has an authored rise. It may be interrupted immediately by renewed reaction or movement;
       otherwise it owns the body until its last frame, then the normal lower layer cross-fades in. */
        if (fx.cowerExit) {
          var exit = clips.reactionCowerExit,
            exitTop = topEntry(fx.lower);
          if (exitTop && exitTop.clip === exit && exitTop.t >= exit.duration - 0.04) fx.cowerExit = false;
          else if (fx.speed > 0.5) fx.cowerExit = false;
          else if (reactionFullBody(fx, clips, 'reactionCowerExit', REACTION_ANIM.cowerExitRate)) {
            fx.stance = stance;
            advance(fx, dt);
            return true;
          }
        }
        if (updateReactionLower(soldier, fx, clips, reaction, stance, dt)) return true;
        if (fx.stance == null) fx.stance = stance;
        if (stance !== fx.stance) {
          /* Crouch<->prone clips carry the body through the ground change (from standing too). The
         stand<->crouch clips only play from a standstill; on the move the change is a blend, so the
         legs keep walking. */
          var still = !fx.moving,
            from = fx.stance;
          fx.transition =
            stance === 'prone'
              ? 'crouchToProne'
              : from === 'prone'
                ? 'proneToCrouch'
                : still && from === 'stand'
                  ? 'standToCrouch'
                  : still && stance === 'stand'
                    ? 'crouchToStand'
                    : null;
          var TR_RATE = { crouchToProne: 1.35, proneToCrouch: 1.35, standToCrouch: 1.8, crouchToStand: 1.5 };
          if (fx.transition && clips[fx.transition])
            setClip(fx.lower, clips[fx.transition], TR_RATE[fx.transition], 0.2, true, false);
          else fx.transition = null;
          fx.stance = stance;
        }
        if (fx.transition) {
          var tr = topEntry(fx.lower),
            quick = fx.transition === 'standToCrouch' || fx.transition === 'crouchToStand';
          /* A soldier who sets off mid stand/crouch change drops the clip and walks. */
          if (
            tr &&
            tr.clip.key === fx.transition &&
            tr.t < tr.clip.duration - 0.3 * tr.rate &&
            !(quick && fx.speed > 0.5)
          ) {
            fx.overlayTarget = 0;
            fx.aimWanted = false;
            fx.bipod = false;
            fx.supportReleased = true;
            advance(fx, dt);
            return true;
          }
          fx.transition = null;
        }

        fx.bipod = stance === 'prone';
        var speed = fx.speed,
          moving =
            stance === 'prone'
              ? fx.moving
                ? speed > 0.1
                : speed > 0.22
              : fx.moving
                ? speed > 0.18
                : speed > 0.35;
        fx.moving = moving;
        var yaw = soldier.root.rotation.y || 0,
          sin = Math.sin(yaw),
          cos = Math.cos(yaw);
        var forward = fx.vx * sin + fx.vz * cos,
          right = fx.vx * cos - fx.vz * sin,
          angle = Math.atan2(right, forward);
        fx.heading = angle;
        /* Turning on the spot: yaw rate of the root this step, smoothed, with hysteresis. */
        if (fx.lastYaw == null) fx.lastYaw = yaw;
        var dyaw = Math.atan2(Math.sin(yaw - fx.lastYaw), Math.cos(yaw - fx.lastYaw));
        fx.lastYaw = yaw;
        fx.yawRate += ((dt > 0 ? dyaw / dt : 0) - fx.yawRate) * k;
        var turning = !moving && Math.abs(fx.yawRate) > (fx.turning ? 0.35 : 0.6);
        fx.turning = turning;
        var pistol = fx.weaponKind === 'pistol',
          engaged = !!(
            soldier.target ||
            (soldier.isPlayer && soldier.playerAimPoint) ||
            (state && state.aimPoint) ||
            soldier.reloading ||
            fx.fireHold > 0 ||
            fx.fireShot !== fx.fireSeen
          ),
          clip,
          rate = 1;
        if (turning) {
          /* Positive yaw turns toward +X, i.e. to the soldier's right. */
          var side = fx.yawRate > 0 ? 'Right' : 'Left',
            key =
              stance === 'prone'
                ? 'proneTurn' + side
                : stance === 'crouch'
                  ? 'crouchTurn' + side
                  : 'turn' + side;
          clip = clips[key];
          rate = clamp(Math.abs(fx.yawRate) / Math.max(0.2, clip.turnRate || 1.5), 0.5, 2);
          fx.family = null;
        } else if (!moving) {
          var idleKey =
            stance === 'prone'
              ? 'proneIdle'
              : stance === 'crouch'
                ? pistol
                  ? 'pistolKneel'
                  : 'crouchIdle'
                : pistol
                  ? 'pistolIdle'
                  : engaged
                    ? 'aim'
                    : null;
          if (!idleKey) {
            /* A standing rifleman at rest picks an idle variant when he stops, and keeps it. */
            if (!fx.idleKey) {
              var pool = IDLE_VARIANTS.filter(function (k2) {
                return !!clips[k2];
              });
              fx.idleKey = pool[Math.floor(Math.random() * pool.length)];
            }
            idleKey = fx.idleKey;
          }
          clip = clips[idleKey];
          fx.family = null;
        }
        if (moving) fx.idleKey = null;
        if (turning || !moving) {
        } else if (stance === 'prone') {
          clip = clips[Math.abs(angle) < 1.9 ? 'proneForward' : 'proneBackward'];
          rate = clamp(speed / (clip.speed || 0.3), 0.6, 2.2);
        } else {
          var families =
            stance === 'crouch'
              ? ['crouch', 'crouchRun']
              : pistol
                ? ['pistolWalk', 'pistolRun']
                : ['walk', 'run', 'sprint'];
          /* Possession already has an authoritative gait. Speed-only hysteresis
           can keep a sped-up walk selected until a stance change clears it. */
          var gait = soldier.isPlayer && soldier._locomotionGait,
            playerFamily =
              stance === 'crouch'
                ? gait === 'crouchSprint' || gait === 'crouchRun'
                  ? 'crouchRun'
                  : gait === 'crouchWalk'
                    ? 'crouch'
                    : null
                : pistol
                  ? gait === 'run' || gait === 'sprint'
                    ? 'pistolRun'
                    : gait === 'walk'
                      ? 'pistolWalk'
                      : null
                  : gait === 'run' || gait === 'sprint' || gait === 'walk'
                    ? gait
                    : null;
          /* AI sprint is a real locomotion decision, not a visual guess. Retargeted
           * rifle Run and Sprint clips have almost identical natural speeds
           * (roughly 4.25/4.30 m/s). Speed matching plus family stickiness left
           * most 5.5-6.7 m/s bounds displaying the ordinary Run animation.
           * Select Sprint once actual movement has accelerated enough to play
           * the authored clip at a sensible rate. Keep acceleration, slowdown,
           * crouch/pistol families, and the existing possessed-player behavior. */
          var aiSprintFamily =
              !soldier.isPlayer &&
              stance === 'stand' &&
              !pistol &&
              soldier._locomotionGait === 'sprint' &&
              speed >= (clips.sprint0.speed || 4.5) * 0.85
                ? 'sprint'
                : null,
            family = playerFamily || aiSprintFamily || familyOf(fx, clips, speed, families);
          fx.family = family;
          fx.sector = sectorOf(fx, angle);
          clip = clips[family + fx.sector];
          rate = clamp(speed / (clip.speed || 1.5), 0.55, 1.8);
        }
        setClip(fx.lower, clip, rate, 0.25, false, true);

        /* During an actual upright AI sprint, the authored Sprint clip must
         * own BOTH halves of the pose. Target memory stays with Engagement;
         * it is not permission to shoulder the rifle at a full run. Aiming
         * and shot follow-through fade out, while hits/flinches and other
         * genuine reactions may still interrupt the upper body. */
        var sprintPose =
          !soldier.isPlayer &&
          stance === 'stand' &&
          !pistol &&
          soldier._locomotionGait === 'sprint' &&
          fx.family === 'sprint';
        var over = null,
          orate = 1,
          restart = false,
          playerAt = (soldier.isPlayer && soldier.playerAimPoint) || null,
          visualAt = (state && state.aimPoint) || null;
        fx.fireHold = Math.max(0, fx.fireHold - dt);
        fx.hitHold = Math.max(0, (fx.hitHold || 0) - dt);
        if (fx.fireShot !== fx.fireSeen) {
          fx.fireSeen = fx.fireShot;
          fx.fireHold = 0.9;
          restart = !fx.fireBurst && !pistol;
        }
        if (reloadVisible && fx.reloadShot !== fx.reloadSeen) {
          fx.reloadSeen = fx.reloadShot;
          restart = true;
        }
        var hitKey =
          stance === 'prone'
            ? 'hitProne'
            : stance === 'crouch'
              ? 'hitCrouch'
              : pistol
                ? 'pistolHit'
                : fx.speed > 2.4
                  ? 'hitRun'
                  : 'hit';
        if ((fx.hitShot || 0) !== (fx.hitSeen || 0)) {
          fx.hitSeen = fx.hitShot;
          fx.hitKey = hitKey;
          // Retain the authored stance hit, with at most 0.45 seconds of recoil.
          fx.hitRate = Math.max(1, clips[hitKey].duration / 0.45);
          fx.hitHold = clips[hitKey].duration / fx.hitRate;
          restart = true;
        }
        /* Suppressive fire landing close extends suppressedUntil; a fresh extension may be a flinch (at
       most one per soldier every ~10 s, not every time, never over firing or reloading). */
        fx.flinchCool = Math.max(0, (fx.flinchCool || 0) - dt);
        fx.flinchHold = Math.max(0, (fx.flinchHold || 0) - dt);
        var supp = +soldier.suppressedUntil || 0;
        if (
          supp > (fx.lastSupp || 0) + 0.05 &&
          fx.lastSupp != null &&
          fx.flinchCool <= 0 &&
          stance !== 'prone' &&
          !soldier.reloading &&
          fx.fireHold <= 0 &&
          fx.hitHold <= 0
        ) {
          fx.flinchCool = 10;
          if (Math.random() < 0.6) {
            // The old shielding/looking-around clips held the head up for seconds.
            fx.flinchKey = stance === 'crouch' ? 'hitCrouch' : pistol ? 'pistolHit' : 'hit';
            fx.flinchRate = Math.max(FLINCH_RATE, clips[fx.flinchKey].duration / 0.35);
            fx.flinchHold = clips[fx.flinchKey].duration / fx.flinchRate;
            restart = true;
          }
        }
        fx.lastSupp = supp;
        if (fx.hitHold > 0) {
          over = fx.hitKey;
          orate = fx.hitRate;
        } else if (fx.flinchHold > 0 && fx.fireHold <= 0 && !soldier.reloading) {
          over = fx.flinchKey;
          orate = fx.flinchRate;
        } else if (reloadVisible) {
          over = stance === 'prone' ? 'reloadProne' : stance === 'crouch' ? 'reloadCrouch' : 'reload';
          orate = clips[over].duration / Math.max(0.5, fx.reloadDuration);
        } else if (fx.fireHold > 0) {
          var auto = !!fx.fireBurst;
          if (pistol && stance !== 'prone') {
            over = stance === 'crouch' ? 'pistolKneel' : 'pistolIdle';
            restart = false;
          } else {
            over =
              stance === 'prone'
                ? auto
                  ? 'fireAutoProne'
                  : 'fireProne'
                : auto
                  ? 'fireAuto'
                  : stance === 'crouch'
                    ? 'fireCrouch'
                    : 'fire';
            orate = auto ? 1 : 1.3;
          }
        } else if ((soldier.target || playerAt || visualAt) && stance !== 'prone') {
          over = pistol
            ? stance === 'crouch'
              ? 'pistolKneel'
              : 'pistolIdle'
            : stance === 'crouch'
              ? 'crouchAim'
              : 'aim';
          restart = false;
        } else restart = false;
        if (sprintPose && (over === 'aim' || over === 'fire' || over === 'fireAuto')) over = null;
        if (over) {
          setClip(fx.upper, clips[over], orate, 0.16, restart, false);
          fx.overlayTarget = 1;
        } else fx.overlayTarget = 0;
        fx.supportReleased = !!(reloadVisible || fx.hitHold > 0 || fx.flinchHold > 0);
        /* The pistol cup times a hit or flinch release from that clip's own motion (cupEnvelope). */
        if (fx.hitHold > 0) {
          fx.cupClipKey = fx.hitKey;
          fx.cupClipT = clips[fx.hitKey].duration - fx.hitHold * fx.hitRate;
        } else if (over && over === fx.flinchKey) {
          fx.cupClipKey = over;
          fx.cupClipT = clips[over].duration - fx.flinchHold * fx.flinchRate;
        } else fx.cupClipKey = null;
        var t = soldier.target && soldier.target.root && soldier.target.root.position;
        /* A possessed man aims where the player's crosshair is (aimSpine adds 1.2 m to a target's ground point).
       Otherwise presentation may supply a static last-seen point; it never becomes soldier.target. */
        if (!t && playerAt) t = { x: playerAt.x, y: playerAt.y - 1.2, z: playerAt.z };
        if (!t && visualAt) t = visualAt;
        fx.aimWanted =
          !sprintPose && !soldier.reloading && fx.hitHold <= 0 && fx.flinchHold <= 0 &&
          (!!t || fx.fireHold > 0);
        fx.aimAt = sprintPose ? null : t || null;
        advance(fx, dt);
        return true;
      }
      function advance(fx, dt) {
        advanceLayer(fx.lower, dt);
        advanceLayer(fx.upper, dt);
        var step = dt / 0.22;
        fx.overlay =
          fx.overlay < fx.overlayTarget
            ? Math.min(fx.overlayTarget, fx.overlay + step)
            : Math.max(fx.overlayTarget, fx.overlay - step);
        fx.aim = fx.aimWanted ? Math.min(1, fx.aim + dt / 0.3) : Math.max(0, fx.aim - dt / 0.3);
      }
      return {
        play: play,
        update: update,
        advance: advance
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
