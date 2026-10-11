/* Damage range camera and pointer/controller presentation owner. */
(function (root) {
  'use strict';
  root.BattleDamageRangeView = {
    create: function (deps) {
      var scene = deps.scene,
        canvas = deps.canvas,
        targets = deps.targets,
        shooter = deps.shooter,
        baseY = deps.baseY,
        rowZ = deps.rowZ,
        shooterZ = deps.shooterZ,
        center = deps.center,
        distance = deps.distance,
        rangeIndex = deps.rangeIndex,
        selected = deps.selected,
        clamp = deps.clamp,
        shapedAxis = deps.shapedAxis,
        buttonValue = deps.buttonValue,
        rangePadCommands = deps.rangePadCommands,
        life = deps.life,
        fpsYaw = 0,
        fpsPitch = 0,
        pointerAim = null,
        padButtons = {},
        padId = null;
      /* A dedicated selected-target orbit camera is more useful here than following the busiest squad. */
      var previous = scene.activeCamera;
      try {
        if (previous && previous.detachControl) previous.detachControl(canvas);
      } catch (_) {}
      var cam = new BABYLON.ArcRotateCamera(
        'damageRangeCam',
        -Math.PI / 2,
        1.14,
        distance,
        new BABYLON.Vector3(targets[rangeIndex].root.position.x, baseY + 1.05, rowZ),
        scene
      );
      cam.minZ = 0.04;
      cam.maxZ = 500;
      cam.lowerRadiusLimit = 2.5;
      cam.upperRadiusLimit = 18;
      cam.lowerBetaLimit = 0.35;
      cam.upperBetaLimit = 1.48;
      cam.wheelPrecision = 18;
      cam.panningSensibility = 0;
      cam.attachControl(canvas, true);
      scene.activeCamera = cam;
      var fpsCam = new BABYLON.UniversalCamera(
        'damageRangeFpsCam',
        new BABYLON.Vector3(center.x, baseY + 1.52, shooterZ + 0.28),
        scene
      );
      fpsCam.inputs.clear();
      fpsCam.minZ = 0.025;
      fpsCam.maxZ = 500;
      fpsCam.fov = 0.92;

      function fpsEye() {
        return new BABYLON.Vector3(
          shooter.root.position.x,
          shooter.root.position.y + 1.52,
          shooter.root.position.z + 0.28
        );
      }
      function placeFpsCamera(recenter) {
        var eye = fpsEye();
        fpsCam.position.copyFrom(eye);
        if (recenter) {
          var p = deps.zonePoint(selected(), deps.zone());
          fpsCam.setTarget(new BABYLON.Vector3(p.x, p.y, p.z));
          fpsYaw = fpsCam.rotation.y;
          fpsPitch = fpsCam.rotation.x;
        } else {
          fpsCam.rotation.y = fpsYaw;
          fpsCam.rotation.x = fpsPitch;
        }
      }
      function setFps(on) {
        endAim({ pointerId: pointerAim && pointerAim.id });
        deps.setFpsState(!!on);
        if (deps.isFps()) {
          try {
            cam.detachControl(canvas);
          } catch (_) {}
          placeFpsCamera(true);
          scene.activeCamera = fpsCam;
        } else {
          scene.activeCamera = cam;
          try {
            cam.detachControl(canvas);
          } catch (_) {}
          try {
            cam.attachControl(canvas, true);
          } catch (_) {}
        }
        var r = document.getElementById('rangeReticle');
        if (r) r.style.display = deps.isFps() ? 'block' : 'none';
        deps.updateUi();
        return deps.isFps();
      }
      function activePad() {
        try {
          if (!root.navigator || typeof root.navigator.getGamepads !== 'function') return null;
          var pads = root.navigator.getGamepads() || [],
            fallback = null;
          for (var i = 0; i < pads.length; i++) {
            var p = pads[i];
            if (!p || p.connected === false) continue;
            if (!fallback) fallback = p;
            if (p.mapping === 'standard') return p;
          }
          return fallback;
        } catch (_) {
          return null;
        }
      }
      function stepGamepad(dt) {
        var pad = activePad();
        if (!pad) {
          padId = null;
          padButtons = {};
          return;
        }
        if (pad.id !== padId) {
          padId = pad.id || 'gamepad';
          padButtons = {};
          root.GTLog('[RANGE] gamepad active: ' + padId);
        }
        var axes = pad.axes || [],
          lookX = shapedAxis(axes[2]),
          lookY = shapedAxis(axes[3]);
        if (deps.isFps()) {
          fpsYaw += lookX * 2.25 * dt;
          fpsPitch = clamp(fpsPitch + lookY * 1.7 * dt, -1.32, 1.32);
          fpsCam.rotation.y = fpsYaw;
          fpsCam.rotation.x = fpsPitch;
          fpsCam.fov = 0.92 - 0.3 * buttonValue(pad, 6);
        } else {
          if (lookX) cam.alpha += lookX * 2.25 * dt;
          if (lookY) cam.beta = clamp(cam.beta + lookY * 1.7 * dt, cam.lowerBetaLimit, cam.upperBetaLimit);
          var zoom = buttonValue(pad, 6) - buttonValue(pad, 7);
          if (zoom)
            cam.radius = clamp(cam.radius + zoom * 7 * dt, cam.lowerRadiusLimit, cam.upperRadiusLimit);
        }
        var commands = rangePadCommands(pad, deps.isFps(), padButtons);
        padButtons = commands.buttons;
        commands.actions.forEach(deps.applyRangeAction);
      }
      life.listen(
        canvas,
        'pointerdown',
        function (e) {
          if (!deps.isFps()) return;
          pointerAim = { id: e.pointerId, x: e.clientX, y: e.clientY };
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (_) {}
          e.preventDefault();
        },
        { passive: false }
      );
      life.listen(
        canvas,
        'pointermove',
        function (e) {
          if (!deps.isFps() || !pointerAim || pointerAim.id !== e.pointerId) return;
          var dx = e.clientX - pointerAim.x,
            dy = e.clientY - pointerAim.y;
          pointerAim.x = e.clientX;
          pointerAim.y = e.clientY;
          fpsYaw += dx * 0.0032;
          fpsPitch = clamp(fpsPitch + dy * 0.0027, -1.32, 1.32);
          fpsCam.rotation.y = fpsYaw;
          fpsCam.rotation.x = fpsPitch;
          e.preventDefault();
        },
        { passive: false }
      );
      function endAim(e) {
        if (pointerAim && pointerAim.id === e.pointerId) {
          try {
            canvas.releasePointerCapture(pointerAim.id);
          } catch (_) {}
          pointerAim = null;
        }
      }
      life.listen(canvas, 'pointerup', endAim);
      life.listen(canvas, 'pointercancel', endAim);
      life.listen(
        canvas,
        'wheel',
        function (e) {
          if (!deps.isFps()) return;
          e.preventDefault();
          fpsCam.fov = clamp(fpsCam.fov + e.deltaY * 0.0007, 0.52, 1.12);
        },
        { passive: false }
      );

      life.own(function () {
        endAim({ pointerId: pointerAim && pointerAim.id });
        cam.detachControl(canvas);
        if (scene.activeCamera === cam || scene.activeCamera === fpsCam) scene.activeCamera = previous;
        cam.dispose();
        fpsCam.dispose();
        if (previous && previous.attachControl && !scene.isDisposed) previous.attachControl(canvas, true);
      });
      return {
        camera: cam,
        fpsCamera: fpsCam,
        setFps: setFps,
        placeFpsCamera: placeFpsCamera,
        stepGamepad: stepGamepad
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
