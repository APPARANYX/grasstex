'use strict';

// Pure presentation: the PHP API determines which details are authorized.
// Public boards never receive exact squad positions or enemy orders.
(function () {
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = id => document.getElementById(id);
  const panel = el('mapPanel');
  const slider = el('replayTurn');
  let data = null;
  let role = 'public';

  function make(tag, attributes = {}, content) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([k, v]) => node.setAttribute(k, String(v)));
    if (content !== undefined) node.textContent = String(content);
    return node;
  }
  function xy(x, z) {
    return [40 + (Number(x) / 5000) * 620, 660 - (Number(z) / 5000) * 620];
  }
  function segment(svg, a, b, color, thickness = 2, dash = '') {
    svg.appendChild(make('line', {
      x1: a[0], y1: a[1], x2: b[0], y2: b[1],
      stroke: color, 'stroke-width': thickness, 'stroke-dasharray': dash
    }));
  }
  function marker(svg, x, y, color, text, r = 9) {
    svg.appendChild(make('circle', {
      cx: x, cy: y, r, fill: color, stroke: '#0c1420', 'stroke-width': 2
    }));
    svg.appendChild(make('text', {
      x: x + 12, y: y + 5, fill: '#eaf1f9',
      'font-size': 12, 'font-family': 'system-ui'
    }, text));
  }
  function roundData() {
    const rounds = data.history || [];
    const chosen = Math.max(0, Math.min(Number(slider.value), rounds.length));
    const round = chosen > 0 ? rounds[chosen - 1] : null;
    const prior = chosen > 1 ? rounds[chosen - 2] : null;
    const publicWorld = chosen > 0 ? (round.public_snapshot || null) : data.public_world;
    const completeWorld = role === 'admin'
      ? chosen > 0 ? (round.world_snapshot || null) : data.observer_world
      : null;
    const ownWorld = (role === 'us' || role === 'ge') && chosen === 0
      ? data.own_state : null;
    return { chosen, round, prior, publicWorld, completeWorld, ownWorld };
  }
  function render() {
    if (!data) return;
    const state = roundData();
    const { chosen, round, prior, publicWorld, completeWorld, ownWorld } = state;
    el('replayLabel').textContent = chosen === 0
      ? 'Current board · Turn ' + data.turn
      : 'After round ' + chosen;
    el('replaySource').textContent = data.replay_source === 'reconstructed_verified_v1'
      ? 'Older match positions verified by deterministic replay'
      : data.replay_note || '';
    const svg = make('svg', {
      viewBox: '0 0 700 700', role: 'img',
      'aria-label': 'Abstract GRASSTEX commander map; 5km by 5km',
      style: 'width:100%;max-width:680px;display:block;margin:auto;aspect-ratio:1/1'
    });
    svg.appendChild(make('rect', {
      x: 40, y: 40, width: 620, height: 620,
      rx: 8, fill: '#122638', stroke: '#627389', 'stroke-width': 2
    }));
    for (let n = 0; n <= 5000; n += 1000) {
      const [x] = xy(n, 0);
      const [, y] = xy(0, n);
      segment(svg, [x, 40], [x, 660], '#385065', 1, '3 8');
      segment(svg, [40, y], [660, y], '#385065', 1, '3 8');
      svg.appendChild(make('text', {
        x, y: 680, fill: '#9daec0', 'font-size': 11,
        'text-anchor': 'middle'
      }, String(n / 1000)));
    }
    svg.appendChild(make('text', {
      x: 350, y: 696, fill: '#9daec0', 'font-size': 12, 'text-anchor': 'middle'
    }, 'Kilometers east'));
    svg.appendChild(make('text', {
      x: 58, y: 58, fill: '#95bdef', 'font-size': 12
    }, 'US rear'));
    svg.appendChild(make('text', {
      x: 585, y: 58, fill: '#e8a4a4', 'font-size': 12
    }, 'GE rear'));
    segment(svg, xy(500, 2500), xy(4500, 2500), '#a5997b', 10);
    segment(svg, xy(500, 2500), xy(4500, 2500), '#ded6b5', 3, '15 9');
    segment(svg, xy(2500, 1250), xy(2500, 3750), '#a5997b', 8);
    segment(svg, xy(2500, 1250), xy(2500, 3750), '#ded6b5', 2, '13 8');
    const objectiveList = publicWorld?.objectives || [];
    const objectives = Array.isArray(objectiveList)
      ? objectiveList : Object.values(objectiveList);
    for (const o of objectives) {
      if (!Number.isFinite(Number(o.x)) || !Number.isFinite(Number(o.z))) continue;
      const [x, y] = xy(o.x, o.z);
      const color = o.owner === 'us' ? '#74b2f3'
        : o.owner === 'ge' ? '#ec9691' : '#c4c9cd';
      svg.appendChild(make('rect', {
        x: x - 12, y: y - 12, width: 24, height: 24,
        rx: 3, transform: 'rotate(45 ' + x + ' ' + y + ')',
        fill: color, stroke: '#081019', 'stroke-width': 2
      }));
      svg.appendChild(make('text', {
        x, y: y - 23, fill: '#eff4fa', 'font-size': 13,
        'text-anchor': 'middle', 'font-weight': 600
      }, o.name || o.id));
      svg.appendChild(make('text', {
        x, y: y + 4, fill: '#152033', 'font-size': 11,
        'text-anchor': 'middle', 'font-weight': 700
      }, String(o.points || '')));
      if (o.contested) {
        svg.appendChild(make('circle', {
          cx: x, cy: y, r: 21, fill: 'none',
          stroke: '#f4c871', 'stroke-width': 2, 'stroke-dasharray': '3 4'
        }));
      }
    }
    const units = completeWorld?.units || ownWorld?.squads || null;
    const trucks = completeWorld?.trucks || ownWorld?.trucks || null;
    if (units) {
      for (const unit of Object.values(units)) {
        const pos = xy(unit.x, unit.z);
        const col = unit.side === 'us' ? '#88baf0' : '#eda1a1';
        if (role === 'admin' && prior?.world_snapshot?.units?.[unit.id]) {
          const previous = prior.world_snapshot.units[unit.id];
          const from = xy(previous.x, previous.z);
          if (Math.hypot(from[0] - pos[0], from[1] - pos[1]) > 3)
            segment(svg, from, pos, col, 2, '6 4');
        }
        marker(svg, pos[0], pos[1], col, unit.id + ' (' + unit.strength + ')', 7);
      }
    }
    if (trucks) {
      for (const truck of Object.values(trucks)) {
        const [x, y] = xy(truck.x, truck.z);
        svg.appendChild(make('rect', {
          x: x - 5, y: y - 5, width: 10, height: 10,
          fill: '#e9ca79', stroke: '#141a21', 'stroke-width': 1
        }));
      }
    }
    const host = el('mapBoard');
    host.replaceChildren(svg);
    const ledger = publicWorld?.objectives || [];
    const values = Array.isArray(ledger) ? ledger : Object.values(ledger);
    const us = values.filter(x => x.owner === 'us').reduce((a, x) => a + x.points, 0);
    const ge = values.filter(x => x.owner === 'ge').reduce((a, x) => a + x.points, 0);
    el('mapLegend').textContent = 'US ' + us + ' pts  ·  GE ' + ge
      + ' pts  ·  Amber ring: contested  ·  Squares: objectives'
      + (role === 'public' ? '  ·  Enemy positions concealed' : '');
    el('replayEvents').textContent = round
      ? JSON.stringify(round.resolution, null, 2)
      : 'Showing current objective status. Drag the timeline to inspect resolved rounds.';
    el('replayOrders').textContent = round
      ? JSON.stringify(role === 'admin' ? (round.orders || {})
        : round.own_order ? { own_order: round.own_order } : {}, null, 2)
      : 'Unresolved orders remain sealed.';
  }
  function refresh(payload, viewerRole) {
    const former = data?.id;
    const lastChoice = Number(slider.value) || 0;
    data = payload;
    role = viewerRole;
    slider.max = String((data.history || []).length);
    slider.value = former === data.id ? String(Math.min(lastChoice, Number(slider.max))) : '0';
    panel.classList.remove('hidden');
    render();
  }
  slider.addEventListener('input', render);
  window.GRASSTEXIdeationMap = { refresh };
})();
