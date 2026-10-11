/* #456 R3: render-only clip pose, hand chains, weapon hold, spine aim and pistol cup IK.
   Per-backend scratch objects stay private. Simulation state and clip clocks are inputs. */
(function (root) {
  'use strict';
  if (root.BattleFbxRenderPose) return;
  root.BattleFbxRenderPose = {
    create: function (deps) {
      var Q = deps.Q,
        V3 = deps.V3,
        MX = deps.MX,
        BONE = deps.BONE,
        FPS = deps.FPS,
        POSE = deps.POSE,
        perfNow = deps.perfNow,
        poseLayer = deps.poseLayer,
        poseInputs = deps.poseInputs,
        sampleLayer = deps.sampleLayer,
        armDegFor = deps.armDegFor,
        leftGripFor = deps.leftGripFor,
        wristRFor = deps.wristRFor,
        pointsFor = deps.pointsFor,
        WEAPON_POINTS = deps.WEAPON_POINTS;
      /* ---- render-side pose writing ------------------------------------------------------------- */

      var qa = new Q(),
        qb = new Q(),
        qc = new Q(),
        qd = new Q(),
        hipsLower = new Q(),
        pa = new V3(),
        pb = new V3(),
        socketWorld = new MX(),
        rootInv = new MX(),
        sScale = new V3(),
        sRot = new Q(),
        sPos = new V3(),
        ONE = new V3(1, 1, 1);
      /* Clip frame interpolation and sign-safe cross-fade are owned by the pure clip mixer. */
      function showBipod(fx) {
        var w = fx.weapon;
        if (!w || !w.bipodMesh || w.bipodMesh.isDisposed()) return;
        if (w.bipodMesh.isEnabled() !== !!fx.bipod) {
          w.bipodMesh.setEnabled(!!fx.bipod);
          w.mesh.setEnabled(!fx.bipod);
        }
      }
      /* Sidecar left-arm dials: degree offsets added onto the animated wrist/elbow/shoulder
   (same nodes + yaw/pitch/roll order as the Motion Lab preview), rotations only. Applied
   inside the pose loop right after the clip pose is written, so every frame starts from
   the clean clip pose and the offsets never accumulate. `w` fades them with the cup (the
   pose loop passes 1 for the wrist, which stays on). */
      var dialQ = new Q();
      function dialQuat(deg, w) {
        var d = deg || [0, 0, 0],
          k = ((w == null ? 1 : w) * Math.PI) / 180;
        Q.RotationYawPitchRollToRef((+d[1] || 0) * k, (+d[0] || 0) * k, (+d[2] || 0) * k, dialQ);
        return dialQ;
      }
      /* Pistol support cup, the same rule as the Motion Lab (labSolveCup): an analytic two-bone
   solve. The elbow bends until the forearm-plus-hand span reaches the right-hand-local target
   (law of cosines, in the plane the clip bends the arm in), then the shoulder swings it on; the
   wrist keeps its clip + dial pose. Solved from each frame's clean pose, so the result is a
   continuous function of the clip: no search, no cached correction, no filter. Near full arm
   length the span eases off (soft IK) instead of locking the elbow straight.
   Release is a weight (fx.cupW) that fades the cup and the shoulder/elbow dials; the wrist dial
   stays on. A hit or flinch sets its own timing from the clip (cupEnvelope): the cup lets go
   `lag` after the clip first pulls the hands apart faster than speedOn and comes back `lag`
   after it last does, done by the clip's end; a clip that never pulls them apart keeps the cup.
   Reload, stance transitions and death let go over releaseSec and return over recaptureSec. A
   clip hand more than reachFull from the target lets go over a 10 cm fade, eased so it takes
   at least reachOutSec. */
      var CUP = {
        reachFull: 0.2,
        reachNone: 0.3,
        soft: 0.03,
        releaseSec: 0.25,
        recaptureSec: 0.3,
        reachOutSec: 0.15,
        reachInSec: 0.3,
        speedOn: 0.75,
        lag: 0.06
      };
      function cupSmooth(x) {
        x = Math.max(0, Math.min(1, x));
        return x * x * (3 - 2 * x);
      }
      function cupEase(cur, goal, dt, outSec, inSec) {
        return goal < cur ? Math.max(goal, cur - dt / outSec) : Math.min(goal, cur + dt / inSec);
      }
      function cupDt(fx) {
        /* With animation LOD a soldier may be posed every few frames: ease over the time since his last pose. */
        if (deps.lodOn() && fx._poseDt > 0) return Math.max(1 / 240, Math.min(0.25, fx._poseDt));
        var engine = fx.holder.getScene().getEngine();
        return Math.max(1 / 240, Math.min(0.05, engine.getDeltaTime() / 1000 || 1 / 60));
      }
      function cupChainWorld(node) {
        var up = [];
        for (var n = node; n; n = n.parent) up.push(n);
        for (var k = up.length - 1; k >= 0; k--) up[k].computeWorldMatrix(true);
      }
      /* Once per model and clip: pose the library skeleton at every clip frame and record how fast
   contact B moves in the right hand's frame (metres per second). */
      function cupEnvelope(fx, key) {
        var lib = fx.lib,
          cache = lib.cupEnv || (lib.cupEnv = {});
        if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
        var clip = lib.clips[key],
          bones = fx.st.bones,
          nodes = lib.nodes,
          anchor = lib.palms && lib.palms[BONE.leftHand];
        var L = nodes[BONE.leftHand],
          R = nodes[BONE.rightHand];
        if (!clip || !bones || !anchor || !L || !R) return (cache[key] = null);
        var saved = [];
        bones.forEach(function (name, i) {
          var n = nodes[name];
          if (n && clip.channels[i])
            saved.push([
              n,
              n.position.clone(),
              n.rotationQuaternion ? n.rotationQuaternion.clone() : null,
              clip.channels[i]
            ]);
        });
        var rel = [],
          inv = new MX();
        for (var f = 0; f < clip.frames; f++) {
          saved.forEach(function (e) {
            var n = e[0],
              ch = e[3];
            if (ch.rot) {
              if (!n.rotationQuaternion) n.rotationQuaternion = new Q();
              n.rotationQuaternion.set(
                ch.rot[f * 4],
                ch.rot[f * 4 + 1],
                ch.rot[f * 4 + 2],
                ch.rot[f * 4 + 3]
              );
            }
            if (ch.pos) n.position.set(ch.pos[f * 3], ch.pos[f * 3 + 1], ch.pos[f * 3 + 2]);
          });
          cupChainWorld(L);
          cupChainWorld(R);
          R.getWorldMatrix().invertToRef(inv);
          var scale = V3.TransformNormal(V3.Right(), R.getWorldMatrix()).length() * lib.scale;
          rel.push(
            V3.TransformCoordinates(V3.TransformCoordinates(anchor, L.getWorldMatrix()), inv).scale(scale)
          );
        }
        saved.forEach(function (e) {
          e[0].position.copyFrom(e[1]);
          if (e[2]) e[0].rotationQuaternion.copyFrom(e[2]);
        });
        cupChainWorld(L);
        cupChainWorld(R);
        var onset = -1,
          settle = -1;
        for (var i = 1; i < rel.length; i++)
          if (V3.Distance(rel[i], rel[i - 1]) * FPS > CUP.speedOn) {
            if (onset < 0) onset = i;
            settle = i;
          }
        return (cache[key] = {
          duration: (rel.length - 1) / FPS,
          onset: onset < 0 ? null : onset / FPS,
          settle: settle < 0 ? null : settle / FPS
        });
      }
      function cupEnvelopeWeight(env, t) {
        if (!env || env.onset === null) return 1;
        var off = env.onset + CUP.lag,
          back = Math.min(env.settle + CUP.lag, env.duration - CUP.recaptureSec),
          release = 1 - cupSmooth((t - off) / CUP.releaseSec);
        return t < back ? release : Math.max(release, cupSmooth((t - back) / CUP.recaptureSec));
      }
      function cupReleaseWeight(fx) {
        var dt = cupDt(fx),
          held = fx.cupClipKey ? cupEnvelopeWeight(cupEnvelope(fx, fx.cupClipKey), fx.cupClipT) : 1;
        var ramp = !!(fx.death || fx.transition || (fx.supportReleased && !fx.cupClipKey));
        fx.cupRamp = cupEase(
          fx.cupRamp == null ? 1 : fx.cupRamp,
          ramp ? 0 : 1,
          dt,
          CUP.releaseSec,
          CUP.recaptureSec
        );
        /* Eased at twice the ramp rates, only so a clip restarting mid-release cannot jump. */
        return (fx.cupW = cupEase(
          fx.cupW == null ? 1 : fx.cupW,
          Math.min(cupSmooth(fx.cupRamp), held),
          dt,
          CUP.releaseSec / 2,
          CUP.recaptureSec / 2
        ));
      }
      var cupTurnQ = new Q(),
        cupTurnM = new MX(),
        cupRotM = new MX(),
        cupInvM = new MX();
      /* Turn `joint` so world direction `from` moves toward `to` by `w`. Both are carried into the
   parent's space first, so mirrored or non-uniformly scaled parents still land the direction. */
      function cupTurn(joint, from, to, w) {
        if (w <= 0 || from.lengthSquared() < 1e-12 || to.lengthSquared() < 1e-12) return;
        var f = from,
          t = to;
        if (joint.parent) {
          joint.parent.getWorldMatrix().invertToRef(cupInvM);
          f = V3.TransformNormal(from, cupInvM);
          t = V3.TransformNormal(to, cupInvM);
        }
        Q.FromUnitVectorsToRef(f.normalizeToNew(), t.normalizeToNew(), cupTurnQ);
        if (w < 1) Q.SlerpToRef(Q.Identity(), cupTurnQ, w, cupTurnQ);
        if (!joint.rotationQuaternion) joint.rotationQuaternion = Q.FromEulerVector(joint.rotation);
        cupTurnQ.toRotationMatrix(cupTurnM);
        joint.rotationQuaternion.toRotationMatrix(cupRotM);
        Q.FromRotationMatrixToRef(cupRotM.multiply(cupTurnM), joint.rotationQuaternion);
        joint.rotationQuaternion.normalize();
      }
      function applyPistolCup(fx, targetLocal, release) {
        var palms = fx.lib.palms,
          right = fx.path[fx.path.length - 1],
          left = fx.pathL[fx.pathL.length - 1];
        var anchor = palms && palms[BONE.leftHand];
        if (!targetLocal || !anchor || !right || !left) return null;
        var fore = left.parent,
          arm = fore && fore.parent;
        if (!arm) return null;
        var up = [];
        for (var n = arm.parent; n; n = n.parent) up.push(n);
        for (var k = up.length - 1; k >= 0; k--) up[k].computeWorldMatrix(true);
        function endpoint() {
          arm.computeWorldMatrix(true);
          fore.computeWorldMatrix(true);
          left.computeWorldMatrix(true);
          return V3.TransformCoordinates(anchor, left.getWorldMatrix());
        }
        right.computeWorldMatrix(true);
        var target = V3.TransformCoordinates(
          new V3(targetLocal[0], targetLocal[1], targetLocal[2]),
          right.getWorldMatrix()
        );
        var B = endpoint(),
          startError = V3.Distance(B, target);
        var reach = (fx.cupReach = cupEase(
            fx.cupReach == null ? 1 : fx.cupReach,
            cupSmooth((CUP.reachNone - startError) / (CUP.reachNone - CUP.reachFull)),
            cupDt(fx),
            CUP.reachOutSec,
            CUP.reachInSec
          )),
          w = release * reach;
        if (w > 0) {
          var S = arm.getAbsolutePosition().clone(),
            E = fore.getAbsolutePosition().clone(),
            upper = E.subtract(S),
            lower = B.subtract(E),
            a = upper.length(),
            b = lower.length();
          if (a > 1e-6 && b > 1e-6) {
            var knee = a + b - CUP.soft,
              d = V3.Distance(S, target);
            if (d > knee) d = a + b - CUP.soft * Math.exp(-(d - knee) / CUP.soft);
            d = Math.max(Math.abs(a - b) + 1e-4, d);
            var cosE = Math.max(-1, Math.min(1, (a * a + b * b - d * d) / (2 * a * b))),
              u = upper.scale(-1 / a),
              side = lower.subtract(u.scale(V3.Dot(lower, u)));
            if (side.lengthSquared() > 1e-10) {
              side.normalize();
              cupTurn(fore, lower, u.scale(cosE).add(side.scale(Math.sqrt(1 - cosE * cosE))), w);
              B = endpoint();
            }
            cupTurn(arm, B.subtract(S), target.subtract(S), w);
          }
        }
        var finalError = V3.Distance(endpoint(), target);
        fx.cupMode =
          release < 1 ? (release > 0 ? 'releasing' : 'released') : reach < 1 ? 'out-of-reach' : 'tracking';
        return { error: finalError, guarded: reach < 1, released: release < 1, weight: w };
      }
      var poseGot = [],
        poseRan = { weapon: false, aim: false, support: false };
      function applyPose(fx) {
        var on = POSE.on,
          t = on ? perfNow() : 0,
          t1 = 0;
        POSE.seen = 0;
        showBipod(fx);
        var st = fx.st,
          nodes = fx.nodes,
          animated = st.animated,
          overlay = fx.overlay > 0.001 && fx.upper.entries.length;
        var dialKey = fx.weaponModel || fx.weaponKind;
        /* Arm dials are the pistol support cup only (same rule as the Motion Lab preview):
     stray dial values stored on a long-gun slot stay inert here too. */
        var dialPistol = dialKey === 'pistol' || /m1911a1|p38/i.test(dialKey || '');
        if (fx.throwing) dialPistol = false;
        var dials = dialPistol ? armDegFor(fx.lib.file, dialKey) : null;
        var leftGrip = dialPistol ? leftGripFor(fx.lib.file, dialKey) : null;
        if (on) {
          t1 = perfNow();
          poseLayer('setup', t1 - t);
          t = t1;
        }
        var cupW = dials || leftGrip ? cupReleaseWeight(fx) : 1;
        if (on) {
          t1 = perfNow();
          if (dials || leftGrip) poseLayer('support', t1 - t);
          t = t1;
        }
        var wrDial = wristRFor(fx.lib.file, dialKey),
          wrNode = null;
        if (fx.throwing) wrDial = null;
        if (wrDial) {
          var ri = st.bones ? st.bones.indexOf(BONE.rightHand) : -1;
          wrNode = (ri >= 0 && nodes[ri]) || null;
        }
        var wristNode = null,
          elbowNode = null,
          shoulderNode = null;
        if (dials) {
          var li = st.bones ? st.bones.indexOf(BONE.leftHand) : -1;
          wristNode = (li >= 0 && nodes[li]) || null;
          elbowNode = wristNode && wristNode.parent;
          shoulderNode = elbowNode && elbowNode.parent;
          // Fall back to canon bone names when the parent chain is unavailable.
          if (!elbowNode || !shoulderNode) {
            var ei = st.bones ? st.bones.indexOf('leftforearm') : -1,
              si = st.bones ? st.bones.indexOf('leftarm') : -1;
            if (!elbowNode && ei >= 0) elbowNode = nodes[ei] || null;
            if (!shoulderNode && si >= 0) shoulderNode = nodes[si] || null;
          }
        }
        if (on) {
          t1 = perfNow();
          poseLayer('setup', t1 - t);
          t = t1;
        }
        /* Base pass: the lower (stance/locomotion) layer for every animated bone. */
        var n,
          i,
          node,
          got = poseGot;
        for (n = 0; n < animated.length; n++) {
          i = animated[n];
          node = nodes[i];
          got[n] = 0;
          if (!node) continue;
          var g = sampleLayer(fx.lower, i, qa, pa);
          got[n] = g;
          if (!g) continue;
          if (i === st.hips) hipsLower.copyFrom(qa);
          node.rotationQuaternion.copyFrom(qa);
          if (g === 2) node.position.copyFrom(pa);
        }
        if (on) {
          t1 = perfNow();
          poseLayer('base', t1 - t);
          t = t1;
        }
        /* Overlay pass: aim, fire or reload on the upper body, blended over the base by fx.overlay. */
        if (overlay) {
          for (n = 0; n < animated.length; n++) {
            i = animated[n];
            node = nodes[i];
            if (!node || !st.upper[i]) continue;
            var up = sampleLayer(fx.upper, i, qb, pb);
            if (!up) continue;
            /* The overlay's torso keeps the orientation it has in its own clip, re-expressed under the
         hips the legs are playing. Copying the spine's hips-local rotation instead would inherit
         the locomotion hips' twist and lean, and the rifle would stop pointing at the target. */
            if (i === st.spineRoot && sampleLayer(fx.upper, st.hips, qc, pb)) {
              qc.multiplyToRef(qb, qd);
              Q.InverseToRef(hipsLower, qc);
              qc.multiplyToRef(qd, qb);
            }
            if (!got[n]) {
              node.rotationQuaternion.copyFrom(qb);
              got[n] = 1;
            } else {
              qa.copyFrom(node.rotationQuaternion);
              if (Q.Dot(qa, qb) < 0) qb.scaleInPlace(-1);
              Q.SlerpToRef(qa, qb, fx.overlay, qa);
              node.rotationQuaternion.copyFrom(qa);
            }
          }
          if (on) {
            t1 = perfNow();
            poseLayer('overlay', t1 - t);
            t = t1;
          }
        }
        /* Sidecar dials on the clean clip pose: the pistol cup's left-arm offsets and the right-wrist
     dial for straight stocks (same yaw/pitch/roll order as the lab's R wrist dial, applied ahead
     of the hand chains so the grip anchor, and the finger, rides in the corrected hand; ungated
     by weapon, as the lab previews it). */
        if (dials || (wrDial && wrNode)) {
          for (n = 0; n < animated.length; n++) {
            if (!got[n]) continue;
            node = nodes[animated[n]];
            if (dials) {
              var dd = null;
              if (node === wristNode) dd = dials.wrist;
              else if (node === elbowNode) dd = dials.elbow;
              else if (node === shoulderNode) dd = dials.shoulder;
              if (dd && (dd[0] || dd[1] || dd[2]))
                node.rotationQuaternion.multiplyInPlace(dialQuat(dd, node === wristNode ? 1 : cupW));
            }
            if (wrNode && node === wrNode && wrDial)
              node.rotationQuaternion.multiplyInPlace(dialQuat(wrDial));
          }
          if (on) {
            t1 = perfNow();
            poseLayer('dials', t1 - t);
            t = t1;
          }
        }
        var ran = poseRan;
        ran.weapon = ran.aim = ran.support = false;
        /* Weapon follows the hands: the rigid right-web socket is the base; the support hold then
     swings long guns so the fore-end line passes through the left web (pistols have no fore
     line and keep the rigid hold). Socket world is expressed under the soldier root. */
        var key =
          fx.weaponModel && fx.lib.grips && fx.lib.grips[fx.weaponModel] ? fx.weaponModel : fx.weaponKind;
        var grip = fx.lib.grips && (fx.lib.grips[key] || fx.lib.grips.rifle),
          points = pointsFor(fx.lib.file, key) || WEAPON_POINTS.rifle;
        if (!grip || !fx.hand) {
          if (on) poseInputs(fx, ran);
          return;
        }
        ran.weapon = true;
        fx.leftGripErrorCm = null;
        POSE.holdSupport = 0;
        handChain(fx.path, fx.chain, 0);
        if (fx.chainL.length) handChain(fx.pathL, fx.chainL, 0);
        holdWeapon(fx, grip, points);
        if (on) {
          t1 = perfNow();
          poseLayer('weapon', t1 - t - POSE.holdSupport);
          poseLayer('support', POSE.holdSupport);
          POSE.holdSupport = 0;
          t = t1;
        }
        ran.support = fx.supportReason !== 'one-hand' && fx.supportReason !== 'released';
        if (fx.aim > 0.01 && fx.spineAt > 0) {
          ran.aim = true;
          if (aimSpine(fx)) {
            handChain(fx.path, fx.chain, fx.spineAt);
            if (fx.chainL.length && fx.spineAtL > 0) handChain(fx.pathL, fx.chainL, fx.spineAtL);
            holdWeapon(fx, grip, points);
          }
          if (on) {
            t1 = perfNow();
            poseLayer('aim', t1 - t - POSE.holdSupport);
            if (POSE.holdSupport) poseLayer('support', POSE.holdSupport);
            POSE.holdSupport = 0;
            t = t1;
          }
        }
        var leftSnap = leftGrip ? applyPistolCup(fx, leftGrip, cupW) : null;
        if (leftSnap) {
          fx.leftGripErrorCm = leftSnap.error * 100;
          if (fx.chainL.length) handChain(fx.pathL, fx.chainL, fx.spineAtL > 0 ? fx.spineAtL : 0);
        } else {
          fx.cupMode = leftGrip ? 'unavailable' : 'off';
        }
        if (leftGrip) {
          ran.support = true;
          if (on) {
            t1 = perfNow();
            poseLayer('support', t1 - t);
            t = t1;
          }
        }
        /* Body-shape and role scaling must not stretch the rifle: keep it at world scale 1. */
        socketWorld.decompose(sScale, sRot, sPos);
        MX.ComposeToRef(ONE, sRot, sPos, socketWorld);
        fx.chain[0].invertToRef(rootInv);
        socketWorld.multiplyToRef(rootInv, socketWorld);
        socketWorld.decompose(sScale, fx.socket.rotationQuaternion, fx.socket.position);
        fx.socket.scaling.copyFrom(sScale);
        /* The rifle is slung down the back during the throw, leaving the animated right palm
       for the imported grenade. No weapon or inventory state changes. */
        if (fx.throwing) {
          var lying = fx.throwing.stance === 'prone',
            carryY = lying ? 0.38 : fx.throwing.stance === 'crouch' ? 0.54 : 0.91;
          fx.socket.position.set(-0.18, carryY, -0.22);
          Q.FromEulerAnglesToRef(lying ? 0 : -1.25, -0.28, 0, fx.socket.rotationQuaternion);
        }
        if (on) {
          poseLayer('weapon', perfNow() - t);
          poseInputs(fx, ran);
        }
      }
      /* Two-hand hold. The right web and left web are the two attachment points. Pick the point within
   the weapon's fore-end range whose distance from the grip equals the posed hand spacing, then
   map that grip-to-fore vector exactly onto the hand-to-hand vector. The rigid right-hand pose
   supplies only the roll around this axis. Released-hand actions keep the rigid pose. */
      var hR = new V3(),
        hL = new V3(),
        hV = new V3(),
        hA = new V3(),
        hUp = new V3(),
        hX = new V3(),
        hY = new V3(),
        hDir = new V3(),
        hG = new V3(),
        hFore = new V3(),
        hS = new V3(),
        hP = new V3(),
        hQ = new Q(),
        hQw = new Q(),
        hQl = new Q(),
        hLa = new V3(),
        hLy = new V3(),
        hLx = new V3();
      function holdWeapon(fx, grip, points) {
        grip.multiplyToRef(fx.chain[fx.chain.length - 1], socketWorld);
        if (POSE.on) {
          var t = perfNow();
          supportHold(fx, points);
          POSE.holdSupport += perfNow() - t;
        } else supportHold(fx, points);
      }
      function supportHold(fx, points) {
        var palms = fx.lib.palms,
          f = points && points.fore,
          g = points && points.grip;
        fx.twoHand = 0;
        fx.supportErrorCm = null;
        fx.supportHandM = fx.supportNearM = fx.supportFarM = null;
        /* Pistols are a one-hand hold, as in the Motion Lab: fore points a sidecar pistol slot may still
     carry (copied from a long gun) would swing the barrel onto the left hand. */
        if (fx.weaponKind === 'pistol' || !f || !g || !palms || !fx.chainL.length) {
          fx.supportReason = 'one-hand';
          return;
        }
        if (fx.death || fx.transition || fx.supportReleased) {
          fx.supportReason = 'released';
          return;
        }
        V3.TransformCoordinatesToRef(palms[BONE.rightHand], fx.chain[fx.chain.length - 1], hR);
        V3.TransformCoordinatesToRef(palms[BONE.leftHand], fx.chainL[fx.chainL.length - 1], hL);
        hL.subtractToRef(hR, hV);
        var dist = hV.length();
        if (dist < 1e-4) {
          fx.supportReason = 'coincident';
          return;
        }
        hV.scaleInPlace(1 / dist);
        socketWorld.decompose(hS, hQ, hP);
        /* Both attachment points can be met only when the posed hand spacing reaches the fore-end. */
        var dy = (f[1] - g[1]) * hS.y,
          dx = (f[0] - g[0]) * hS.x,
          nearZ = (f[2] - g[2]) * hS.z,
          farZ = (f[3] - g[2]) * hS.z,
          near = Math.sqrt(dx * dx + dy * dy + nearZ * nearZ),
          far = Math.sqrt(dx * dx + dy * dy + farZ * farZ);
        fx.supportHandM = dist;
        fx.supportNearM = near;
        fx.supportFarM = far;
        if (dist < near || dist > far) {
          fx.supportReason = 'out-of-reach';
          return;
        }
        var reach = Math.sqrt(dist * dist - dy * dy - dx * dx),
          z = g[2] + reach / hS.z;
        hLa.set(dx, dy, reach);
        hLa.scaleInPlace(1 / dist);
        hLa.rotateByQuaternionToRef(hQ, hDir);
        if (V3.Dot(hDir, hV) < 0.4) {
          fx.supportReason = 'off-axis';
          return;
        }
        /* World frame: forward along the hands, up from the rigid hold. Local frame: the same built on
     the weapon's grip->fore line. Rotation = world frame * local frame^-1. */
        V3.Up().rotateByQuaternionToRef(hQ, hUp);
        hUp.subtractToRef(hV.scale(V3.Dot(hUp, hV)), hY);
        hY.normalize();
        V3.CrossToRef(hY, hV, hX);
        hLy.set(0, 1, 0).subtractInPlace(hLa.scale(hLa.y));
        hLy.normalize();
        V3.CrossToRef(hLy, hLa, hLx);
        Q.RotationQuaternionFromAxisToRef(hX, hY, hV, hQw);
        Q.RotationQuaternionFromAxisToRef(hLx, hLy, hLa, hQl);
        hQl.conjugateInPlace();
        hQw.multiplyToRef(hQl, hQw);
        /* Grip point onto the right web. */
        hG.set(g[0] * hS.x, g[1] * hS.y, g[2] * hS.z).rotateByQuaternionToRef(hQw, hA);
        hR.subtractToRef(hA, hA);
        MX.ComposeToRef(hS, hQw, hA, socketWorld);
        fx.twoHand = 1;
        fx.supportReason = 'attached';
        hFore.set(f[0], f[1], z);
        V3.TransformCoordinatesToRef(hFore, socketWorld, hG);
        fx.supportErrorCm = V3.Distance(hG, hL) * 100;
      }
      /* Clips hold the rifle a little differently (crouched and prone aim sit low or wide), so while a
   soldier aims, the upper spine turns the barrel onto the target, by at most ~40 degrees. The
   rotation is applied about the spine's own origin and re-expressed in its parent's local space,
   which also absorbs the model's scale and handedness conversion. */
      var aimDir = new V3(),
        aimWant = new V3(),
        aimAxis = new V3(),
        aimOrigin = new V3(),
        aimRot = new MX(),
        aimA = new MX(),
        aimB = new MX(),
        aimLocal = new MX(),
        aimPos = new V3(),
        aimScale = new V3(),
        aimQ = new Q();
      function aimSpine(fx) {
        var weapon = socketWorld;
        V3.TransformNormalToRef(V3.Forward(), weapon, aimDir);
        aimDir.normalize();
        var muzzle = weapon.getTranslation();
        if (fx.aimAt) {
          aimWant.set(fx.aimAt.x - muzzle.x, (fx.aimAt.y || 0) + 1.2 - muzzle.y, fx.aimAt.z - muzzle.z);
        } else {
          V3.TransformNormalToRef(V3.Forward(), fx.chain[0], aimWant);
          aimWant.y = 0;
        }
        if (aimWant.lengthSquared() < 1e-6) return false;
        aimWant.normalize();
        var dot = Math.max(-1, Math.min(1, V3.Dot(aimDir, aimWant))),
          angle = Math.min(0.7, Math.acos(dot)) * fx.aim;
        if (angle < 0.004) return false;
        V3.CrossToRef(aimDir, aimWant, aimAxis);
        if (aimAxis.lengthSquared() < 1e-8) return false;
        aimAxis.normalize();
        MX.RotationAxisToRef(aimAxis, angle, aimRot);
        var spine = fx.spine,
          parent = fx.chain[fx.spineAt - 1];
        fx.chain[fx.spineAt].getTranslationToRef(aimOrigin);
        /* C = parentWorld * T(-o) * R * T(o) * parentWorld^-1 ; local' = local * C */
        MX.TranslationToRef(-aimOrigin.x, -aimOrigin.y, -aimOrigin.z, aimA);
        parent.multiplyToRef(aimA, aimB);
        aimB.multiplyToRef(aimRot, aimA);
        MX.TranslationToRef(aimOrigin.x, aimOrigin.y, aimOrigin.z, aimB);
        aimA.multiplyToRef(aimB, aimA);
        parent.invertToRef(aimB);
        aimA.multiplyToRef(aimB, aimA);
        MX.ComposeToRef(spine.scaling, spine.rotationQuaternion, spine.position, aimLocal);
        aimLocal.multiplyToRef(aimA, aimLocal);
        aimLocal.decompose(aimScale, aimQ, aimPos);
        spine.rotationQuaternion.copyFrom(aimQ);
        return true;
      }
      /* World matrices from the soldier root down to a hand, composed straight from each node's TRS.
   Babylon's computeWorldMatrix(true) per node cost ~10x more; the chain has no pivots, billboards
   or parent-less jumps, so plain composition is exact. */
      var chainLocal = new MX(),
        chainQ = new Q();
      function handChain(path, chain, from) {
        for (var i = from; i < path.length; i++) {
          var n = path[i],
            q = n.rotationQuaternion;
          if (!q) {
            Q.RotationYawPitchRollToRef(n.rotation.y, n.rotation.x, n.rotation.z, chainQ);
            q = chainQ;
          }
          MX.ComposeToRef(n.scaling, q, n.position, chainLocal);
          if (i) chainLocal.multiplyToRef(chain[i - 1], chain[i]);
          else chain[i].copyFrom(chainLocal);
        }
      }
      return {
        applyPose: applyPose,
        handChain: handChain,
        dialQuat: dialQuat,
        cupEnvelopeWeight: cupEnvelopeWeight,
        cupReleaseWeight: cupReleaseWeight,
        applyPistolCup: applyPistolCup
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
