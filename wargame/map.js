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
  const SOUND_PREF = 'grasstex-wargame-sound-v1';
  try {
    soundEnabled = localStorage.getItem(SOUND_PREF) === 'on';
  } catch (_) {
    /* Browser storage may be disabled. */
  }
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
    if (!soundEnabled || document.hidden) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      if (audio.state === 'suspended') {
        // Browser gesture policy: never try to play through a suspended context.
        // The Sound button resumes it, and subsequent turns chime automatically.
        return;
      }
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
    el('mapSound').textContent = soundEnabled ? '♪ Sound on' : '♪ Enable sound';
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
    const duration = 2600;
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
        fill: '#142c2a',
        'font-size': 12,
        'font-weight': 700,
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

  // Cartographic language shared with the GRASSTEX tactical map: field parcels,
  // hedgerows, tactical grid and NATO-inspired formation symbols. This is a
  // deterministic illustration, NOT a terrain import from the 2 x 1.2 km sim.
  function cartography(svg) {
    svg.appendChild(make('rect', { x: 40, y: 40, width: 620, height: 620, fill: '#a1a58a' }));
    const parcels = ['#a1a589', '#afb094', '#999e81', '#b5b69a', '#8e9c83'];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const x = 40 + col * 88.6;
        const y = 40 + row * 88.6;
        const n = (row * 13 + col * 19 + row * col * 3) % 5;
        svg.appendChild(
          make('rect', {
            x,
            y,
            width: 89,
            height: 89,
            fill: parcels[n],
            opacity: 0.62
          })
        );
        if ((row + col) % 3 === 0) {
          svg.appendChild(
            make('path', {
              d: 'M' + (x + 12) + ' ' + (y + 10) + 'l63 -7 M' + (x + 8) + ' ' + (y + 72) + 'l69 6',
              stroke: '#7f8f76',
              'stroke-width': 1,
              opacity: 0.33,
              fill: 'none'
            })
          );
        }
      }
    }
    // Field boundaries are schematic, consistent for every observer and turn.
    for (let i = 1; i < 7; i++) {
      const p = 40 + (i * 620) / 7;
      segment(svg, [p, 40], [p, 660], '#667d67', 1.5, '18 5 27 6');
      segment(svg, [40, p], [660, p], '#667d67', 1.5, '26 6 15 7');
    }
    // Reproducible tree clusters; decorative only, never tactical cover.
    for (let i = 0; i < 112; i++) {
      const x = 48 + ((i * 173 + i * i * 17) % 602);
      const y = 48 + ((i * 229 + i * i * 11) % 602);
      const radius = 1.8 + (i % 3) * 0.45;
      svg.appendChild(
        make('circle', {
          cx: x,
          cy: y,
          r: radius,
          fill: '#3c6551',
          opacity: 0.64
        })
      );
    }
    // Scenario-defined conceptual junction roads, not physical sim geometry.
    for (const [a, b, thickness] of [
      [[500, 2500], [4500, 2500], 8],
      [[2500, 1250], [2500, 3750], 7]
    ]) {
      segment(svg, xy(...a), xy(...b), '#d9d5b7', thickness);
      segment(svg, xy(...a), xy(...b), '#8b8c78', 1.3, '14 9');
    }
    // Tactical reference grid A-G / 1-7.
    for (let i = 0; i <= 7; i++) {
      const p = 40 + (620 * i) / 7;
      segment(svg, [p, 40], [p, 660], '#3f5548', 0.75);
      segment(svg, [40, p], [660, p], '#3f5548', 0.75);
      if (i < 7) {
        svg.appendChild(
          make(
            'text',
            {
              x: p + 44.3,
              y: 29,
              'text-anchor': 'middle',
              fill: '#eee3bd',
              'font-size': 12,
              'font-weight': 700
            },
            'ABCDEFG'[i]
          )
        );
        svg.appendChild(
          make(
            'text',
            {
              x: 29,
              y: p + 48,
              'text-anchor': 'middle',
              fill: '#eee3bd',
              'font-size': 12,
              'font-weight': 700
            },
            String(i + 1)
          )
        );
      }
    }
    svg.appendChild(
      make(
        'text',
        {
          x: 55,
          y: 68,
          fill: '#172e2d',
          'font-size': 19,
          'font-weight': 700
        },
        'N ↑'
      )
    );
    segment(svg, [54, 638], [116, 638], '#172e2d', 3);
    segment(svg, [54, 634], [54, 642], '#172e2d', 2);
    segment(svg, [116, 634], [116, 642], '#172e2d', 2);
    svg.appendChild(
      make(
        'text',
        {
          x: 55,
          y: 630,
          fill: '#172e2d',
          'font-size': 10
        },
        '0                 500 m'
      )
    );
  }

  function render(animate = false, sourceWorld = null) {
    if (!data) return;
    stopAnimation();
    const state = roundData();
    const { chosen, round, prior, publicWorld, completeWorld, ownWorld } = state;
    el('replayLabel').textContent =
      chosen === 0 ? 'Current board · Turn ' + data.turn : 'After round ' + chosen;
    const replayStatus =
      data.replay_source === 'reconstructed_verified_v1'
        ? 'Older match positions verified by deterministic replay'
        : data.replay_note || '';
    const publicNote = publicWorld?.note ? ' · ' + publicWorld.note : '';
    const legacyLimit =
      chosen > 0 && role === 'admin' && !completeWorld
        ? ' · This original game has no verified historical unit coordinates. The map shows objective control only for past rounds.'
        : '';
    el('replaySource').textContent = replayStatus + publicNote + legacyLimit;
    const svg = make('svg', {
      viewBox: '0 0 700 700',
      role: 'img',
      'aria-label': 'GRASSTEX-style tactical intelligence map of the abstract 5km by 5km wargame',
      style: 'width:100%;display:block;margin:auto;aspect-ratio:1/1'
    });
    cartography(svg);
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

    // Public V6 candidate grid: show the six inactive possibilities as small
    // hollow circles. Only active diamond objectives have capture zones.
    const candidates = Array.isArray(data.objective_candidates) ? data.objective_candidates : [];
    for (const candidate of candidates) {
      if (candidate.active) continue;
      const [cx, cy] = xy(candidate.x, candidate.z);
      const ghost = make('circle', {
        cx,
        cy,
        r: 6,
        fill: 'none',
        stroke: '#4b6459',
        'stroke-width': 1.4,
        'stroke-dasharray': '2 3',
        opacity: 0.75
      });
      ghost.appendChild(
        make('title', {}, 'Inactive candidate · line ' + candidate.line + ' · ' + candidate.slot)
      );
      svg.appendChild(ghost);
    }
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
            fill: '#142722',
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
    // Field objects are only exact for protected observers. Commanders
    // receive their own activity or bounded, rounded, potentially stale contacts.
    const exactObjects = role === 'admin' ? completeWorld?.field_objects || {} : {};
    const contacts =
      role === 'us' || role === 'ge'
        ? chosen > 0
          ? round?.field_contacts || []
          : ownWorld?.field_contacts || []
        : [];
    const markers = role === 'admin' ? Object.values(exactObjects) : contacts;
    const contactLines = [];
    for (const contact of markers) {
      if (!Number.isFinite(Number(contact.x)) || !Number.isFinite(Number(contact.z))) continue;
      const [cx, cy] = xy(Number(contact.x), Number(contact.z));
      const isExact = role === 'admin';
      const label = contact.id + ' · ' + contact.kind;
      const detail = isExact
        ? contact.squad +
          ': ' +
          contact.description +
          ' (turn ' +
          contact.created_turn +
          '; no gameplay effect)'
        : contact.description + ' · ' + contact.confidence + ' · last seen turn ' + contact.last_seen_turn;
      const shape = make('path', {
        d:
          'M' +
          cx +
          ' ' +
          (cy - 10) +
          'L' +
          (cx + 10) +
          ' ' +
          cy +
          'L' +
          cx +
          ' ' +
          (cy + 10) +
          'L' +
          (cx - 10) +
          ' ' +
          cy +
          'Z',
        fill: isExact ? '#f2d283' : '#f9d58c',
        stroke: '#24392d',
        'stroke-width': 2,
        tabindex: 0,
        role: 'button',
        'aria-label': label + ': ' + detail
      });
      shape.appendChild(make('title', {}, label + ': ' + detail));
      const show = () => {
        const panel = el('fieldDetails');
        panel.replaceChildren();
        const title = document.createElement('strong');
        title.textContent = label;
        panel.appendChild(title);
        const desc = document.createElement('p');
        desc.textContent = detail;
        panel.appendChild(desc);
        const stats = contact.stats || {};
        const grid = document.createElement('dl');
        grid.className = 'fieldStats';
        const items = [
          ['Effect', stats.effect || 'Not simulated'],
          ['Range', (stats.range_m || 0) + ' m'],
          ['Strength damage', String(stats.damage_strength || 0) + ' pts'],
          ['Move speed', Math.round((stats.speed_multiplier ?? 1) * 100) + '%'],
          ['Defense', String(stats.defense_strength || 0) + ' pts'],
          ['Blocks fire', stats.blocks_fire ? 'Yes' : 'Not simulated'],
          ['Duration', stats.duration_turns ? stats.duration_turns + ' turns' : 'Persistent'],
          [
            'Status',
            contact.effects_enabled === false
              ? 'Informational only (legacy rules)'
              : contact.status || (contact.active ? 'Active' : 'Unconfirmed / building')
          ]
        ];
        for (const [key, value] of items) {
          const dt = document.createElement('dt');
          dt.textContent = key;
          const dd = document.createElement('dd');
          dd.textContent = value;
          grid.append(dt, dd);
        }
        panel.appendChild(grid);
        const note = document.createElement('small');
        note.textContent =
          'Abstract referee effects only; no projectile fire or individual HP simulation. ' +
          (isExact ? 'Exact observer record.' : 'Enemy reports may be stale.');
        panel.appendChild(note);
      };
      shape.addEventListener('click', show);
      shape.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') show();
      });
      svg.appendChild(shape);
      contactLines.push(label + ' — ' + detail);
    }
    el('fieldContacts').textContent = contactLines.length
      ? contactLines.join('\n')
      : role === 'public'
        ? 'Field activities are hidden from public spectators.'
        : 'No field contacts reported for this turn.';
    el('fieldDetails').textContent = 'Tap a field marker to inspect its report.';
    const units = completeWorld?.units || ownWorld?.squads || null;
    const trucks = completeWorld?.trucks || ownWorld?.trucks || null;
    // Leave the latest verified movement trails visible between polls.
    // A one-second tween was easy to miss, especially when polling in the background.
    const latestHistory = data.history || [];
    const lastPriorSnapshot =
      role === 'admin' && chosen === 0 && latestHistory.length >= 2
        ? latestHistory[latestHistory.length - 2]?.world_snapshot
        : null;
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
        const trailFrom = prior?.world_snapshot || lastPriorSnapshot;
        if (role === 'admin' && trailFrom?.units?.[unit.id]) {
          const previous = trailFrom.units[unit.id];
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
        const lastTrailTruck = lastPriorSnapshot?.trucks?.[truck.id];
        if (lastTrailTruck && role === 'admin') {
          const prev = xy(lastTrailTruck.x, lastTrailTruck.z);
          if (Math.hypot(prev[0] - x, prev[1] - y) > 3) segment(svg, prev, [x, y], '#e9ca79', 2, '5 5');
        }
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
      ' pts  ·  Yellow ring: contested  ·  Diamonds: objectives' +
      (role === 'public' ? '  ·  Unit positions concealed' : '');
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
  el('mapExpand').addEventListener('click', () => {
    const expanded = panel.classList.toggle('expanded');
    el('mapExpand').textContent = expanded ? 'Close expanded map' : 'Expand map';
    el('mapExpand').setAttribute('aria-pressed', String(expanded));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('expanded')) {
      panel.classList.remove('expanded');
      el('mapExpand').textContent = 'Expand map';
      el('mapExpand').setAttribute('aria-pressed', 'false');
    }
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
        if (soundEnabled) signal('round');
      }
    }
    try {
      localStorage.setItem(SOUND_PREF, soundEnabled ? 'on' : 'off');
    } catch (_) {
      /* Preference storage is optional. */
    }
    setButtons();
  });
  // A remembered sound preference still requires a user gesture on some browsers.
  // Unlock it on the next explicit interaction; never play sound automatically
  // from page load or a background tab.
  document.addEventListener(
    'pointerdown',
    () => {
      if (!soundEnabled) return;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      try {
        audio = audio || new Audio();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
      } catch (_) {
        /* Unsupported audio is nonfatal. */
      }
    },
    { capture: true }
  );
  // Playback advances at a comfortable viewing pace; live polling is handled
  // by app.js and never reads secret data for another role.
  timer = setInterval(tickReplay, 1700);
  setButtons();
  window.GRASSTEXIdeationMap = { refresh };
})();
