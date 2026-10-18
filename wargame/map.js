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
  let followLive = true;
  let playing = true;
  let soundEnabled = false;
  let audio = null;
  let lastReportedTurn = 0;
  let lastSubmitted = { us: false, ge: false };
  let priorOwn = null;
  let priorVisibleWorld = null;
  let timer = null;
  let animation = null;
  let moveMarkers = [];
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function signal(type) {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      if (audio.state === 'suspended') return;
      const now = audio.currentTime;
      // Subtle two-tone wooden chess tap; synthesized, no external sound assets.
      for (const [offset, frequency, volume] of [
        [0, type === 'round' ? 445 : 340, 0.055],
        [0.042, type === 'round' ? 600 : 410, 0.025]
      ]) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.74, now + offset + 0.07);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(volume, now + offset + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.1);
      }
    } catch (_) {
      /* Unsupported audio must never break a game. */
    }
  }
  function setButtons() {
    el('mapPlay').textContent = playing ? '❚❚ Pause' : '▶ Play';
    el('mapPlay').setAttribute('aria-pressed', String(playing));
    el('mapSound').textContent = soundEnabled ? '♪ Sound on' : 'Sound off';
    el('mapSound').setAttribute('aria-pressed', String(soundEnabled));
    el('mapLive').textContent = followLive ? '● Live' : '○ Live';
  }
  function stopAnimation() {
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    moveMarkers = [];
  }
  function tween() {
    if (reduceMotion || moveMarkers.length === 0) return;
    let start;
    const duration = 1000;
    function step(now) {
      if (start === undefined) start = now;
      const t = Math.min(1, (now - start) / duration);
      const ease = t * t * (3 - 2 * t);
      for (const m of moveMarkers) {
        const x = m.from[0] + (m.to[0] - m.from[0]) * ease;
        const y = m.from[1] + (m.to[1] - m.from[1]) * ease;
        if (m.type === 'circle') {
          m.element.setAttribute('cx', x);
          m.element.setAttribute('cy', y);
        } else if (m.type === 'text') {
          m.element.setAttribute('x', x + 12);
          m.element.setAttribute('y', y + 5);
        } else {
          m.element.setAttribute('x', x - 5);
          m.element.setAttribute('y', y - 5);
        }
      }
      if (t < 1) animation = requestAnimationFrame(step);
      else {
        animation = null;
        moveMarkers = [];
      }
    }
    animation = requestAnimationFrame(step);
  }

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
    svg.appendChild(
      make('line', {
        x1: a[0],
        y1: a[1],
        x2: b[0],
        y2: b[1],
        stroke: color,
        'stroke-width': thickness,
        'stroke-dasharray': dash
      })
    );
  }
  function marker(svg, x, y, color, text, r = 9, from = null) {
    const circle = make('circle', {
      cx: from ? from[0] : x,
      cy: from ? from[1] : y,
      r,
      fill: color,
      stroke: '#0c1420',
      'stroke-width': 2
    });
    const label = make(
      'text',
      {
        x: (from ? from[0] : x) + 12,
        y: (from ? from[1] : y) + 5,
        fill: '#eaf1f9',
        'font-size': 12,
        'font-family': 'system-ui'
      },
      text
    );
    svg.appendChild(circle);
    svg.appendChild(label);
    if (from && Math.hypot(from[0] - x, from[1] - y) > 1) {
      moveMarkers.push({ element: circle, type: 'circle', from, to: [x, y] });
      moveMarkers.push({ element: label, type: 'text', from, to: [x, y] });
    }
  }
  function roundData() {
    const rounds = data.history || [];
    const chosen = Math.max(0, Math.min(Number(slider.value), rounds.length));
    const round = chosen > 0 ? rounds[chosen - 1] : null;
    const prior = chosen > 1 ? rounds[chosen - 2] : null;
    const publicWorld = chosen > 0 ? round.public_snapshot || null : data.public_world;
    const completeWorld =
      role === 'admin' ? (chosen > 0 ? round.world_snapshot || null : data.observer_world) : null;
    const ownWorld = (role === 'us' || role === 'ge') && chosen === 0 ? data.own_state : null;
    return { chosen, round, prior, publicWorld, completeWorld, ownWorld };
  }
  function render(animate = false, sourceWorld = null) {
    if (!data) return;
    stopAnimation();
    const state = roundData();
    const { chosen, round, prior, publicWorld, completeWorld, ownWorld } = state;
    el('replayLabel').textContent =
      chosen === 0 ? 'Current board · Turn ' + data.turn : 'After round ' + chosen;
    el('replaySource').textContent =
      (data.replay_source === 'reconstructed_verified_v1'
        ? 'Older match positions verified by deterministic replay'
        : data.replay_note || '') +
      (publicWorld?.note ? ' · ' + publicWorld.note : '');
    const svg = make('svg', {
      viewBox: '0 0 700 700',
      role: 'img',
      'aria-label': 'Abstract GRASSTEX commander map; 5km by 5km',
      style: 'width:100%;max-width:680px;display:block;margin:auto;aspect-ratio:1/1'
    });
    svg.appendChild(
      make('rect', {
        x: 40,
        y: 40,
        width: 620,
        height: 620,
        rx: 8,
        fill: '#122638',
        stroke: '#627389',
        'stroke-width': 2
      })
    );
    for (let n = 0; n <= 5000; n += 1000) {
      const [x] = xy(n, 0);
      const [, y] = xy(0, n);
      segment(svg, [x, 40], [x, 660], '#385065', 1, '3 8');
      segment(svg, [40, y], [660, y], '#385065', 1, '3 8');
      svg.appendChild(
        make(
          'text',
          {
            x,
            y: 680,
            fill: '#9daec0',
            'font-size': 11,
            'text-anchor': 'middle'
          },
          String(n / 1000)
        )
      );
    }
    svg.appendChild(
      make(
        'text',
        {
          x: 350,
          y: 696,
          fill: '#9daec0',
          'font-size': 12,
          'text-anchor': 'middle'
        },
        'Kilometers east'
      )
    );
    svg.appendChild(
      make(
        'text',
        {
          x: 58,
          y: 58,
          fill: '#95bdef',
          'font-size': 12
        },
        'US rear'
      )
    );
    svg.appendChild(
      make(
        'text',
        {
          x: 585,
          y: 58,
          fill: '#e8a4a4',
          'font-size': 12
        },
        'GE rear'
      )
    );
    segment(svg, xy(500, 2500), xy(4500, 2500), '#a5997b', 10);
    segment(svg, xy(500, 2500), xy(4500, 2500), '#ded6b5', 3, '15 9');
    segment(svg, xy(2500, 1250), xy(2500, 3750), '#a5997b', 8);
    segment(svg, xy(2500, 1250), xy(2500, 3750), '#ded6b5', 2, '13 8');
    const objectiveList = publicWorld?.objectives || [];
    const objectives = Array.isArray(objectiveList) ? objectiveList : Object.values(objectiveList);
    for (const o of objectives) {
      if (!Number.isFinite(Number(o.x)) || !Number.isFinite(Number(o.z))) continue;
      const [x, y] = xy(o.x, o.z);
      const color = o.owner === 'us' ? '#74b2f3' : o.owner === 'ge' ? '#ec9691' : '#c4c9cd';
      svg.appendChild(
        make('rect', {
          x: x - 12,
          y: y - 12,
          width: 24,
          height: 24,
          rx: 3,
          transform: 'rotate(45 ' + x + ' ' + y + ')',
          fill: color,
          stroke: '#081019',
          'stroke-width': 2
        })
      );
      svg.appendChild(
        make(
          'text',
          {
            x,
            y: y - 23,
            fill: '#eff4fa',
            'font-size': 13,
            'text-anchor': 'middle',
            'font-weight': 600
          },
          o.name || o.id
        )
      );
      svg.appendChild(
        make(
          'text',
          {
            x,
            y: y + 4,
            fill: '#152033',
            'font-size': 11,
            'text-anchor': 'middle',
            'font-weight': 700
          },
          String(o.points || '')
        )
      );
      if (o.contested) {
        svg.appendChild(
          make('circle', {
            cx: x,
            cy: y,
            r: 21,
            fill: 'none',
            stroke: '#f4c871',
            'stroke-width': 2,
            'stroke-dasharray': '3 4'
          })
        );
      }
    }
    const units = completeWorld?.units || ownWorld?.squads || null;
    const trucks = completeWorld?.trucks || ownWorld?.trucks || null;
    const priorUnits = sourceWorld?.units || sourceWorld?.squads || null;
    const priorTrucks = sourceWorld?.trucks || null;
    if (animate && !sourceWorld && role === 'admin' && chosen > 0) {
      const oldWorld = prior?.world_snapshot || null;
      if (oldWorld) sourceWorld = oldWorld;
    }
    const animateUnits =
      animate && !reduceMotion ? sourceWorld?.units || sourceWorld?.squads || priorUnits : null;
    const animateTrucks = animate && !reduceMotion ? sourceWorld?.trucks || priorTrucks : null;
    if (units) {
      for (const unit of Object.values(units)) {
        const pos = xy(unit.x, unit.z);
        const col = unit.side === 'us' ? '#88baf0' : '#eda1a1';
        if (role === 'admin' && prior?.world_snapshot?.units?.[unit.id]) {
          const previous = prior.world_snapshot.units[unit.id];
          const from = xy(previous.x, previous.z);
          if (Math.hypot(from[0] - pos[0], from[1] - pos[1]) > 3) segment(svg, from, pos, col, 2, '6 4');
        }
        const lastUnit = animateUnits?.[unit.id];
        const from = lastUnit ? xy(lastUnit.x, lastUnit.z) : null;
        if (from && Math.hypot(from[0] - pos[0], from[1] - pos[1]) > 2)
          segment(svg, from, pos, col, 2, '4 7');
        marker(svg, pos[0], pos[1], col, unit.id + ' (' + unit.strength + ')', 7, from);
      }
    }
    if (trucks) {
      for (const truck of Object.values(trucks)) {
        const [x, y] = xy(truck.x, truck.z);
        const lastTruck = animateTrucks?.[truck.id];
        const from = lastTruck ? xy(lastTruck.x, lastTruck.z) : null;
        const truckNode = make('rect', {
          x: (from ? from[0] : x) - 5,
          y: (from ? from[1] : y) - 5,
          width: 10,
          height: 10,
          fill: '#e9ca79',
          stroke: '#141a21',
          'stroke-width': 1
        });
        svg.appendChild(truckNode);
        if (from && Math.hypot(from[0] - x, from[1] - y) > 1) {
          segment(svg, from, [x, y], '#e9ca79', 1, '5 5');
          moveMarkers.push({ element: truckNode, type: 'truck', from, to: [x, y] });
        }
      }
    }
    const host = el('mapBoard');
    host.replaceChildren(svg);
    if (animate) tween();
    const ledger = publicWorld?.objectives || [];
    const values = Array.isArray(ledger) ? ledger : Object.values(ledger);
    const us = values.filter(x => x.owner === 'us').reduce((a, x) => a + x.points, 0);
    const ge = values.filter(x => x.owner === 'ge').reduce((a, x) => a + x.points, 0);
    el('mapLegend').textContent =
      'US ' +
      us +
      ' pts  ·  GE ' +
      ge +
      ' pts  ·  Amber ring: contested  ·  Squares: objectives' +
      (role === 'public' ? '  ·  Enemy positions concealed' : '');
    el('replayEvents').textContent = round
      ? JSON.stringify(round.resolution, null, 2)
      : 'Showing current objective status. Drag the timeline to inspect resolved rounds.';
    el('replayOrders').textContent = round
      ? JSON.stringify(
          role === 'admin' ? round.orders || {} : round.own_order ? { own_order: round.own_order } : {},
          null,
          2
        )
      : 'Unresolved orders remain sealed.';
  }
  function refresh(payload, viewerRole) {
    const previous = data;
    const same = previous?.id === payload.id && role === viewerRole;
    const oldRounds = same ? (previous.history || []).length : 0;
    const newRounds = (payload.history || []).length;
    const newRound = same && newRounds > oldRounds;
    const newUS = same && !lastSubmitted.us && !!payload.submitted?.us;
    const newGE = same && !lastSubmitted.ge && !!payload.submitted?.ge;
    const oldOwn = previous?.own_state || null;
    const oldOmniscient = previous?.observer_world || null;

    data = payload;
    role = viewerRole;
    slider.max = String(newRounds);
    panel.classList.remove('hidden');

    if (!same) {
      slider.value = '0';
      followLive = true;
      playing = true;
      stopAnimation();
    } else if (newRound && playing && followLive) {
      slider.value = String(newRounds);
      // One animation per resolved round, not one animation per HTTP poll.
      signal('round');
    } else if (followLive) {
      slider.value = '0';
    } else {
      slider.value = String(Math.min(Number(slider.value), newRounds));
    }

    if (same && !newRound && (newUS || newGE)) signal('submission');
    lastReportedTurn = newRounds;
    lastSubmitted = {
      us: !!payload.submitted?.us,
      ge: !!payload.submitted?.ge
    };
    const previousWorld =
      same && newRound && viewerRole === 'admin' ? oldOmniscient : same && newRound && oldOwn ? oldOwn : null;
    const animated = newRound && playing && followLive;
    // No intermediate snapshots? Don't create invented piece trajectories.
    render(animated, previousWorld);
    setButtons();
  }

  function navigate(delta) {
    playing = false;
    followLive = false;
    slider.value = String(
      Math.max(1, Math.min(Number(slider.max), (Number(slider.value) || Number(slider.max)) + delta))
    );
    render();
    setButtons();
  }
  function tickReplay() {
    if (!playing || !data || followLive) return;
    const index = Number(slider.value);
    if (index >= Number(slider.max)) {
      followLive = true;
      slider.value = '0';
      render();
      setButtons();
      return;
    }
    const oldSnapshot = index > 0 ? data.history[index - 1]?.world_snapshot : null;
    slider.value = String(index + 1);
    signal('round');
    render(true, oldSnapshot);
    setButtons();
  }

  slider.addEventListener('input', () => {
    playing = false;
    followLive = Number(slider.value) === 0;
    render();
    setButtons();
  });
  el('mapBack').addEventListener('click', () => navigate(-1));
  el('mapForward').addEventListener('click', () => navigate(1));
  el('mapLive').addEventListener('click', () => {
    followLive = true;
    playing = true;
    slider.value = '0';
    render();
    setButtons();
  });
  el('mapPlay').addEventListener('click', () => {
    playing = !playing;
    if (!playing && followLive) {
      // A pause freezes the *last resolved round*. New polls should not
      // silently return the viewer to the live board.
      followLive = false;
      slider.value = slider.max;
      render();
    } else if (playing) {
      followLive = Number(slider.value) === 0;
    }
    if (playing && !timer) timer = setInterval(tickReplay, 1700);
    setButtons();
  });
  el('mapSound').addEventListener('click', async () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) {
        soundEnabled = false;
      } else {
        audio = audio || new Audio();
        await audio.resume().catch(() => {
          soundEnabled = false;
        });
        if (soundEnabled) signal('submission');
      }
    }
    setButtons();
  });
  // Playback advances at a comfortable viewing pace; live polling is handled
  // by app.js and never reads secret data for another role.
  timer = setInterval(tickReplay, 1700);
  setButtons();
  window.GRASSTEXIdeationMap = { refresh };
})();
