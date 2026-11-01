/* A range session owns its DOM listeners, scheduled work, observers and resources.
   Disposal is one-way: queued callbacks cannot fire against a disposed scene. */
(function (root) {
  'use strict';
  root.BattleDamageRangeLifetime = {
    create: function (scene) {
      var disposed = false,
        cleanups = [],
        timeouts = new Set(),
        intervals = new Set();
      function own(fn) {
        if (disposed) fn();
        else cleanups.push(fn);
      }
      function dispose() {
        if (disposed) return;
        disposed = true;
        timeouts.forEach(function (id) {
          root.clearTimeout(id);
        });
        timeouts.clear();
        intervals.forEach(function (id) {
          root.clearInterval(id);
        });
        intervals.clear();
        for (var i = cleanups.length - 1; i >= 0; i--) {
          try {
            cleanups[i]();
          } catch (e) {
            if (root.console) root.console.warn('[RANGE] cleanup', e);
          }
        }
        cleanups = [];
      }
      function listen(target, type, fn, options) {
        function guarded(e) {
          if (!disposed) fn(e);
        }
        target.addEventListener(type, guarded, options);
        own(function () {
          target.removeEventListener(type, guarded, options);
        });
      }
      function observe(observable, fn) {
        var token = observable.add(function () {
          if (!disposed) fn.apply(this, arguments);
        });
        own(function () {
          observable.remove(token);
        });
      }
      function timeout(fn, ms) {
        if (disposed) return null;
        var id = root.setTimeout(function () {
          timeouts.delete(id);
          if (!disposed) fn();
        }, ms);
        timeouts.add(id);
        return id;
      }
      function interval(fn, ms) {
        if (disposed) return null;
        var id = root.setInterval(function () {
          if (!disposed) fn();
        }, ms);
        intervals.add(id);
        return id;
      }
      function cancelInterval(id) {
        root.clearInterval(id);
        intervals.delete(id);
      }
      var token = scene.onDisposeObservable.add(dispose);
      own(function () {
        scene.onDisposeObservable.remove(token);
      });
      return {
        own: own,
        dispose: dispose,
        listen: listen,
        observe: observe,
        timeout: timeout,
        interval: interval,
        cancelInterval: cancelInterval
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
