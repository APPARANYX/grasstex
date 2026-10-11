/* Damage range DOM controls and live readout owner. */
(function (root) {
  'use strict';
  root.BattleDamageRangePanel = {
    create: function (deps) {
      var api = deps.api,
        targets = deps.targets,
        label = deps.label,
        life = deps.life,
        rangePanelCss = deps.rangePanelCss,
        rangePanelMarkup = deps.rangePanelMarkup,
        rangeKeyboardAction = deps.rangeKeyboardAction,
        applyRangeAction = deps.applyRangeAction,
        choose = deps.choose,
        setZone = deps.setZone,
        setAuto = deps.setAuto,
        setFps = deps.setFps,
        fire = deps.fire,
        burst3 = deps.burst3,
        kill = deps.kill,
        clear = deps.clear;
      function updateUi() {
        if (!api.panel) return;
        var st = deps.status(),
          sel = api.panel.querySelector('#rangeTarget'),
          zs = api.panel.querySelector('#rangeZone');
        if (sel) sel.value = String(st.target);
        if (zs) zs.value = st.zone;
        var ex = api.panel.querySelector('#rangeExit');
        if (ex) ex.checked = st.exit;
        var au = api.panel.querySelector('#rangeAuto');
        if (au) au.checked = st.auto;
        var or = api.panel.querySelector('#rangeOrbit');
        if (or) or.checked = st.orbit;
        var fp = api.panel.querySelector('#rangeFps');
        if (fp) fp.checked = st.fps;
        var read = api.panel.querySelector('#rangeReadout'),
          compact = api.panel.classList.contains('rangeCollapsed');
        if (read)
          read.textContent = compact
            ? st.label + ' · ' + st.zone + (st.fps ? ' · AIM' : '') + (st.auto ? ' · AUTO' : '')
            : st.label +
              ' · ' +
              st.zone +
              (st.fps ? ' · FPS AIM' : '') +
              (st.exit ? ' · through-shot' : ' · stopped') +
              ' · wounds ' +
              st.wounds +
              ' (UV ' +
              st.uvWounds +
              ') · maps ' +
              st.surfaceMaps;
      }
      function setPanelCollapsed(on) {
        deps.setCollapsedState(!!on);
        if (!api.panel) return;
        api.panel.classList.toggle('rangeCollapsed', deps.isCollapsed());
        var b = api.panel.querySelector('#rangeCollapse');
        if (b) {
          b.textContent = deps.isCollapsed() ? '▴' : '▾';
          b.title = deps.isCollapsed() ? 'Show range controls' : 'Hide range controls';
          b.setAttribute('aria-expanded', deps.isCollapsed() ? 'false' : 'true');
        }
        updateUi();
      }
      function makePanel() {
        var style = document.createElement('style');
        style.textContent = rangePanelCss();
        document.head.appendChild(style);
        life.own(function () {
          style.remove();
        });
        var ret = document.createElement('div');
        ret.id = 'rangeReticle';
        ret.setAttribute('aria-hidden', 'true');
        ret.innerHTML = '<i></i>';
        document.body.appendChild(ret);
        life.own(function () {
          ret.remove();
        });
        var p = document.createElement('div');
        p.id = 'damageRangePanel';
        p.innerHTML = rangePanelMarkup();
        document.body.appendChild(p);
        life.own(function () {
          p.remove();
          if (api.panel === p) api.panel = null;
        });
        api.panel = p;
        var ts = p.querySelector('#rangeTarget');
        targets.forEach(function (s, i) {
          var o = document.createElement('option');
          o.value = i;
          o.textContent = i + 1 + '. ' + label(s);
          ts.appendChild(o);
        });
        p.querySelector('#rangeCollapse').onclick = function () {
          setPanelCollapsed(!deps.isCollapsed());
        };
        p.querySelector('#rangePrev').onclick = function () {
          applyRangeAction('previousTarget');
        };
        p.querySelector('#rangeNext').onclick = function () {
          applyRangeAction('nextTarget');
        };
        ts.onchange = function () {
          choose(+ts.value || 0);
        };
        p.querySelector('#rangeZone').onchange = function () {
          setZone(this.value);
        };
        p.querySelector('#rangeExit').onchange = function () {
          deps.setExit(this.checked);
        };
        p.querySelector('#rangeOrbit').onchange = function () {
          deps.setOrbit(this.checked);
        };
        p.querySelector('#rangeAuto').onchange = function () {
          setAuto(this.checked);
        };
        p.querySelector('#rangeFps').onchange = function () {
          setFps(this.checked);
        };
        p.querySelector('#rangeFire').onclick = fire;
        p.querySelector('#rangeBurst').onclick = burst3;
        p.querySelector('#rangeKill').onclick = kill;
        p.querySelector('#rangeClear').onclick = clear;
        p.querySelector('#rangeReset').onclick = function () {
          location.reload();
        };
        life.listen(root, 'keydown', function (e) {
          var tag = document.activeElement && document.activeElement.tagName;
          if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
          var action = rangeKeyboardAction(e.code, e.key);
          if (!action) return;
          if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
          applyRangeAction(action);
        });
      }

      makePanel();
      return { update: updateUi, setCollapsed: setPanelCollapsed };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
