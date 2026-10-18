'use strict';
/* No LLM API or browser-side referee. The site stores all state in the PHP backend. */
(function () {
  const CLIENT_VERSION = '1.3.0';
  const el = id => document.getElementById(id);
  let last = null,
    template = null,
    timer = null,
    viewEpoch = 0,
    autoPollInFlight = false,
    archiveAttempt = new URL(location.href).searchParams.get('attempt'),
    lastPollAt = 0;
  const ADMIN_STORAGE = 'grasstex-wargame-admin-key-v1';
  function storedAdmin() {
    try {
      return localStorage.getItem(ADMIN_STORAGE) || '';
    } catch (_) {
      return '';
    }
  }
  function rememberAdmin() {
    if (el('role').value !== 'admin' || !el('rememberAdmin').checked) return;
    try {
      localStorage.setItem(ADMIN_STORAGE, el('key').value);
    } catch (_) {
      status('Browser blocked password storage. The password works for this session.', true);
    }
  }
  function status(message, error = false) {
    el('message').textContent = message || '';
    el('message').className = error ? 'error' : 'good';
  }
  function json(value) {
    return JSON.stringify(value, null, 2);
  }
  function fullURL(op, extras = {}) {
    const u = new URL('./api.php', location.href);
    u.searchParams.set('op', op);
    for (const [k, v] of Object.entries(extras)) u.searchParams.set(k, String(v));
    return u.toString();
  }
  function roleHeaders() {
    const headers = {};
    if (el('role').value !== 'public') headers['X-Ideation-Key'] = el('key').value;
    return headers;
  }
  async function request(op, extras = {}, payload = null, admin = false) {
    const options = {
      cache: 'no-store',
      headers: admin
        ? {
            'Content-Type': 'application/json',
            'X-Ideation-Key':
              el('role').value === 'admin'
                ? el('key').value || storedAdmin()
                : storedAdmin() || el('key').value
          }
        : Object.assign({ 'Accept': 'application/json' }, roleHeaders())
    };
    if (payload !== null) {
      options.method = 'POST';
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(payload);
    }
    const response = await fetch(fullURL(op, extras), options);
    let data;
    try {
      data = await response.json();
    } catch (_) {
      throw Error('Server response was not JSON (HTTP ' + response.status + ')');
    }
    if (!response.ok || !data.ok) throw Error(data.error || 'HTTP ' + response.status);
    return data;
  }
  function render(data) {
    const previousAttempt = last?.series?.attempt;
    const previousId = last?.id;
    const previousPhase = last?.phase;
    last = data;
    renderSeries(data);
    renderDebrief(
      data,
      previousId !== data.id || previousAttempt !== data.series?.attempt,
      previousPhase !== 'complete' && data.phase === 'complete'
    );
    renderEarlyFinish(data);
    el('dashboard').classList.remove('hidden');
    if (window.GRASSTEXIdeationMap) window.GRASSTEXIdeationMap.refresh(data, el('role').value);
    el('copyPacket').disabled = el('role').value === 'admin';
    el('matchTitle').textContent = data.title;
    el('phase').textContent =
      (data.archive_view ? 'ARCHIVED · ' : '') +
      data.phase.toUpperCase() +
      ' · Round ' +
      data.turn +
      '/' +
      data.turn_limit;
    el('meta').textContent =
      'Match ID ' +
      data.id +
      ' · Mode ' +
      data.mode +
      ' · Revision ' +
      data.revision +
      ' · REFEREE V' +
      (data.rules_revision || 1) +
      (data.termination?.kind === 'cancelled'
        ? ' · CANCELLED / UNSCORED'
        : data.winner
          ? ' · Result ' + data.winner.toUpperCase()
          : '') +
      (data.termination?.kind === 'early_scored' ? ' · ADMIN EARLY SCORE' : '');
    el('refereeDebriefNotice').classList.toggle('hidden', data.phase !== 'complete');
    el('refereeDebriefNotice').textContent = data.phase === 'complete'
      ? data.match_debrief_due === false
        ? 'REFEREE: Your final match debrief is saved.'
        : data.referee_debrief_notice || 'REFEREE: Submit a final match debrief (round 0).'
      : '';
    el('pendingSealedPanel').classList.toggle('hidden', el('role').value !== 'admin' || !data.termination);
    el('pendingSealedOrders').textContent =
      el('role').value === 'admin' && data.termination
        ? json(data.pending_sealed_orders || {})
        : '';
    const mechanics = data.effective_rules || {};
    el('effectiveRules').textContent = mechanics.notice || 'Referee rules revision unavailable.';
    el('effectiveRules').classList.toggle('warning', (data.rules_revision || 1) < 5);
    el('publicBrief').textContent = data.public_brief + '\n\n' + json(data.public_world || {});
    const role = el('role').value,
      privateInfo = role === 'us' || role === 'ge';
    el('privateTitle').textContent = privateInfo
      ? role.toUpperCase() + ' PRIVATE state'
      : 'Private state hidden from public';
    el('privateBrief').textContent = privateInfo
      ? (data.private_brief || '') + '\n\n' + json(data.own_state || {})
      : 'Choose US or GE and enter that side’s role key to view its own private briefing.';
    el('rules').textContent =
      'AUTHORITATIVE MATCH MECHANICS: ' +
      json(mechanics) +
      '\n\nSTORED RULES PROSE (may describe a later version):\n' +
      data.rules;
    el('scenario').textContent = data.scenario;
    el('history').textContent = (data.history || []).length ? json(data.history) : 'No completed rounds yet.';
    el('orderStatus').textContent =
      'US ' +
      (data.submitted?.us ? 'SEALED' : 'not submitted') +
      ' · GE ' +
      (data.submitted?.ge ? 'SEALED' : 'not submitted') +
      '. Both orders become visible only after automatic resolution.';
    el('currentOrders').textContent =
      privateInfo && data.own_pending_order
        ? 'Your submitted order (sealed):\n' + json(data.own_pending_order)
        : 'No orders are publicly visible until resolution.';
    const canSubmit = privateInfo && !data.archive_view && data.phase === 'orders' && !data.submitted[role];
    el('commander').classList.toggle('hidden', !canSubmit);
    if (canSubmit) {
      let prev = null;
      try {
        prev = JSON.parse(el('orders').value);
      } catch (_) {}
      if (!prev || prev.turn !== data.turn || prev.side !== role)
        el('orders').value = json({
          turn: data.turn,
          side: role,
          intent: '',
          actions: [{ squad: role.toUpperCase() + '-1', type: 'move', target: 'central' }],
          support: 'none',
          proposals: [],
          contingency: ''
        });
    }
  }
  function renderSeries(data) {
    const s = data.series;
    if (!s) {
      el('seriesPanel').classList.add('hidden');
      return;
    }
    el('seriesPanel').classList.remove('hidden');
    const named = s.players || { a: 'Player A', b: 'Player B' };
    const score = s.score || { a: 0, b: 0 };
    el('seriesTitle').textContent = 'Best of 3 · Game ' + s.game_number + ' (attempt ' + s.attempt + ')';
    el('seriesScore').textContent =
      named.a +
      ' ' +
      score.a +
      '  —  ' +
      score.b +
      ' ' +
      named.b +
      (s.champion ? ' · SERIES WINNER: ' + named[s.champion] : '');
    const assign = s.assignments || {};
    el('seriesPlayers').textContent = 'US: ' + named[assign.us] + '   ·   German: ' + named[assign.ge];
    const games = (s.results || []).map(
      r =>
        'Game ' +
        r.game_number +
        ' (attempt ' +
        r.attempt +
        '): ' +
        (r.finish_kind === 'cancelled'
          ? 'cancelled (unscored)'
          : r.winner_player
            ? named[r.winner_player] + ' won'
            : 'draw')
    );
    el('seriesResults').textContent = games.join('   |   ') || 'First game in the series';
    const archiveLinks = el('seriesArchives');
    archiveLinks.replaceChildren();
    for (const entry of s.archive_attempts || []) {
      const link = document.createElement('a');
      const url = new URL('./index.html', location.href);
      url.searchParams.set('id', data.id);
      url.searchParams.set('attempt', entry.attempt);
      link.href = url.toString();
      link.textContent = 'View Game ' + entry.game_number + ' (attempt ' + entry.attempt + ')';
      link.style.marginRight = '14px';
      archiveLinks.appendChild(link);
    }
    el('rematchControls').classList.toggle('hidden', !s.can_rematch || data.archive_view);
    el('seriesNext').classList.toggle('hidden', !s.next_match_id);
    if (s.can_rematch && s.attempt > 1) {
      el('seriesPlayerA').value = named.a;
      el('seriesPlayerB').value = named.b;
      el('seriesPlayerA').disabled = true;
      el('seriesPlayerB').disabled = true;
    } else if (s.can_rematch) {
      el('seriesPlayerA').disabled = false;
      el('seriesPlayerB').disabled = false;
    }
    if (s.next_match_id) el('seriesNextButton').dataset.nextId = s.next_match_id;
    if (s.champion) el('rematchIssued').classList.add('hidden');
  }
  function renderEarlyFinish(data) {
    const admin = el('role').value === 'admin';
    el('endMatchPanel').classList.toggle(
      'hidden',
      !admin || data.archive_view || data.phase !== 'orders'
    );
    el('endMatchButton').disabled = !admin || data.archive_view || data.phase !== 'orders';
    el('endMatchScore').disabled = !(data.history || []).length;
    if (!(data.history || []).length && el('endMatchKind').value === 'early_scored')
      el('endMatchKind').value = 'cancelled';
  }
  async function finishMatch() {
    if (!last || last.archive_view || last.phase !== 'orders' || el('role').value !== 'admin') {
      status('Unlock the active match as Protected observer to end it.', true);
      return;
    }
    const kind = el('endMatchKind').value;
    const reason = el('endMatchReason').value.trim();
    const label =
      kind === 'early_scored'
        ? 'END AND SCORE the current board without resolving pending orders'
        : 'CANCEL the match without awarding either commander a win';
    if (
      !confirm(
        label +
          '?\n\nThe full completed-round history, existing debriefs, and any sealed but unresolved orders are retained. This action cannot be undone.'
      )
    )
      return;
    el('endMatchButton').disabled = true;
    try {
      const finished = await request('finish', {}, { id: last.id, kind, reason }, true);
      rememberAdmin();
      status(
        finished.termination.kind === 'cancelled'
          ? 'Match cancelled, unscored. Referee requested final debriefs from both commanders.'
          : 'Match ended on the last referee-owned score. Referee requested final debriefs.'
      );
      await load(true);
    } catch (e) {
      status('Could not end match: ' + e.message, true);
    } finally {
      el('endMatchButton').disabled = false;
    }
  }
  function openMatch(id) {
    if (!/^[a-f0-9]{24}$/.test(id)) return;
    const changed = el('match').value !== id;
    el('match').value = id;
    archiveAttempt = null;
    const url = new URL(location.href);
    url.searchParams.delete('attempt');
    history.replaceState(null, '', url.toString());
    if (changed) {
      el('key').value = '';
      el('role').value = 'public';
      el('orders').value = '';
    }
    el('rematchIssued').classList.add('hidden');
    load();
  }
  async function createRematch() {
    if (!last?.series?.can_rematch || last.phase !== 'complete') {
      status('This game does not need a rematch.', true);
      return;
    }
    if (!el('key').value && !storedAdmin()) {
      status('Unlock as Protected observer with your administrator password first.', true);
      return;
    }
    if (
      !confirm(
        'Start the next game on this SAME match ID? Commanders switch sides and keep their existing keys. The completed game will be archived.'
      )
    )
      return;
    el('rematchButton').disabled = true;
    try {
      const payload = {
        id: last.id,
        player_a: el('seriesPlayerA').value.trim(),
        player_b: el('seriesPlayerB').value.trim()
      };
      const result = await request('rematch', {}, payload, true);
      rememberAdmin();
      const players = result.series.players;
      const assignments = result.series.assignments;
      el('rematchIssued').classList.remove('hidden');
      el('rematchKeys').textContent = json({
        match_id: result.id,
        game: result.game_number,
        scoreboard: result.series.score,
        us_commander: players[assignments.us],
        german_commander: players[assignments.ge],
        keys: 'UNCHANGED: each commander uses their original key on their NEW side',
        browser_url: new URL('./index.html?id=' + result.id, location.href).toString()
      });
      el('rematchOpen').dataset.nextId = result.id;
      status('Rematch started on the SAME match ID. Commanders swap sides and KEEP their original keys.');
      await load(true);
    } catch (e) {
      status('Rematch failed: ' + e.message, true);
    } finally {
      el('rematchButton').disabled = false;
    }
  }
  async function load(silent = false, automatic = false) {
    const id = el('match').value.trim();
    if (!/^[0-9a-f]{24}$/.test(id)) {
      if (!silent) status('Enter a 24-character match ID.', true);
      return;
    }
    if (automatic && autoPollInFlight) return;
    // A manual load, match switch or role switch invalidates any older response.
    const epoch = automatic ? viewEpoch : ++viewEpoch;
    const role = el('role').value;
    const key = el('key').value;
    const op = role === 'public' ? 'public' : role === 'admin' ? 'observer' : 'brief';
    if (automatic) autoPollInFlight = true;
    try {
      const data = await request(op, {
        id,
        ...(archiveAttempt ? { attempt: archiveAttempt } : {}),
        ...(role === 'us' || role === 'ge' ? { side: role } : {})
      });
      if (
        epoch !== viewEpoch ||
        id !== el('match').value.trim() ||
        role !== el('role').value ||
        (role !== 'public' && key !== el('key').value)
      )
        return;
      const unchanged =
        automatic &&
        last?.id === data.id &&
        last.revision === data.revision &&
        last.turn === data.turn &&
        last.phase === data.phase &&
        last.submitted?.us === data.submitted?.us &&
        last.submitted?.ge === data.submitted?.ge;
      // Don't rebuild the SVG on every unchanged poll: preserve animation,
      // selected markers, replay position and expanded-map interactions.
      if (!unchanged) render(data);
      lastPollAt = Date.now();
      el('liveStatus').textContent =
        (data.archive_view
          ? 'ARCHIVED · read-only'
          : data.phase === 'complete'
            ? 'LIVE · match complete · watching for rematch'
            : 'LIVE · watching for new rounds') +
        ' · revision ' +
        data.revision +
        ' · checked ' +
        new Date().toLocaleTimeString() +
        ' · 2-second polling';
      el('buildDiagnostic').textContent =
        'Browser v' + CLIENT_VERSION + ' · API ' + (data.api_version || 'legacy/unversioned');
      if (data.api_version !== CLIENT_VERSION) {
        status(
          'Browser/server version mismatch. Refresh the wargame page after deployment (the new page uses versioned scripts).',
          true
        );
      } else if (!silent) {
        status('Match loaded. Latest revision ' + data.revision + '.');
      }
      if (role === 'admin') rememberAdmin();
      if (!automatic) {
        const url = new URL(location.href);
        url.searchParams.set('id', id);
        if (archiveAttempt) url.searchParams.set('attempt', archiveAttempt);
        else url.searchParams.delete('attempt');
        history.replaceState(null, '', url.toString());
      }
    } catch (e) {
      if (automatic)
        el('liveStatus').textContent = 'LIVE · update failed: ' + e.message + ' · retrying in 5 seconds';
      else if (!silent) status(e.message, true);
    } finally {
      if (automatic) autoPollInFlight = false;
    }
  }
  async function templateLoad() {
    try {
      const data = await request('template');
      template = data.template;
      el('newRules').value = template.rules || '';
      el('newScenario').value = template.scenario || '';
      el('newPublic').value = template.public_brief || '';
      el('newUS').value = template.us_brief || '';
      el('newGE').value = template.ge_brief || '';
      el('newLimit').value = template.turn_limit || 8;
      el('newMode').value = template.mode || 'discovery';
    } catch (e) {
      status('Could not load site template: ' + e.message, true);
    }
  }
  async function create() {
    try {
      const body = {
        title: el('newTitle').value,
        turn_limit: Number(el('newLimit').value),
        mode: el('newMode').value,
        rules: el('newRules').value,
        scenario: el('newScenario').value,
        public_brief: el('newPublic').value,
        us_brief: el('newUS').value,
        ge_brief: el('newGE').value,
        config: template.config
      };
      const data = await request('create', {}, body, true);
      el('match').value = data.id;
      archiveAttempt = null;
      if (el('key').value) rememberAdmin();
      el('created').classList.remove('hidden');
      el('createdOutput').textContent = json({
        match_id: data.id,
        us_key: data.keys.us,
        ge_key: data.keys.ge,
        public_url: fullURL('public', { id: data.id }),
        browser_url: new URL('./index.html?id=' + data.id, location.href).toString()
      });
      el('key').value = '';
      el('role').value = 'public';
      status('Match created. Save the separate role keys before leaving this screen.');
      await load(true);
    } catch (e) {
      status('Create failed: ' + e.message, true);
    }
  }
  async function submit() {
    if (!last || el('role').value === 'public') return;
    const role = el('role').value;
    let order;
    try {
      order = JSON.parse(el('orders').value);
    } catch (e) {
      status('Orders must be valid JSON: ' + e.message, true);
      return;
    }
    if (order.turn !== last.turn || order.side !== role) {
      status('Order side/turn must match loaded session.', true);
      return;
    }
    if (
      !confirm(
        'Seal your ' + role.toUpperCase() + ' orders for round ' + last.turn + '? They cannot be edited.'
      )
    )
      return;
    try {
      const data = await request(
        'submit',
        {},
        {
          id: last.id,
          turn: last.turn,
          side: role,
          order
        }
      );
      status(
        data.resolved
          ? 'Both orders sealed; deterministic referee resolved the round.'
          : 'Your order is sealed. Awaiting the other commander.'
      );
      el('orders').value = '';
      await load(true);
    } catch (e) {
      status('Submission failed: ' + e.message, true);
    }
  }
  function debriefStatus(message, error = false) {
    el('debriefStatus').textContent = message;
    el('debriefStatus').className = error ? 'error' : 'quiet';
  }
  function renderDebrief(data, newAttempt, justFinished) {
    const role = el('role').value;
    const isCommander = role === 'us' || role === 'ge';
    el('debriefPanel').classList.toggle('hidden', role === 'public');
    el('debriefCommander').classList.toggle('hidden', !isCommander);
    el('debriefAdmin').classList.toggle('hidden', role !== 'admin');
    const completed = (data.history || []).length;
    const matchEnded = data.phase === 'complete';
    el('debriefTurn').min = matchEnded ? 0 : 1;
    el('debriefTurn').max = Math.max(matchEnded ? 0 : 1, completed);
    if (newAttempt) {
      el('debriefTurn').value = matchEnded ? 0 : Math.max(1, completed);
      el('debriefInput').value = '';
      el('debriefOutput').classList.add('hidden');
      debriefStatus('');
    } else if (justFinished) {
      el('debriefTurn').value = 0;
    } else if (
      Number(el('debriefTurn').value) > completed ||
      (Number(el('debriefTurn').value) === 0 && !matchEnded)
    ) {
      el('debriefTurn').value = matchEnded ? 0 : Math.max(1, completed);
    }
    el('copyDebriefPrompt').disabled = !isCommander || (!completed && !matchEnded);
    el('submitDebrief').disabled = !isCommander || (!completed && !matchEnded) || !!data.archive_view;
    el('viewDebriefs').disabled = !isCommander;
  }
  function selectedDebriefRound() {
    const round = Number(el('debriefTurn').value);
    if (
      !Number.isInteger(round) ||
      round < 0 ||
      (round === 0 && last?.phase !== 'complete') ||
      round > (last?.history || []).length
    )
      throw Error('Choose round 0 for a finished match summary, or a resolved round.');
    return round;
  }
  async function copyDebriefPrompt() {
    try {
      if (!last || !['us', 'ge'].includes(el('role').value)) throw Error('Unlock a commander view first.');
      const round = selectedDebriefRound();
      const side = el('role').value;
      const safeRound = round ? (last.history || []).find(r => Number(r.turn) === round) : null;
      const prompt = {
        task: 'GRASSTEX COMMANDER AFTER-ACTION DEBRIEF',
        instructions:
          'Reflect on this ' + (round === 0 ? 'completed match' : 'resolved round') + '. Provide voluntary, concise findings and concrete game-design gaps, NOT hidden chain-of-thought, private reasoning traces, invented opponent intelligence, or secrets. Respond ONLY with the five-field JSON object below. The user will paste it into the site debrief form.',
        match_id: last.id,
        attempt: last.series?.attempt || 1,
        side,
        round,
        match_summary: round === 0,
        authorized_round_result: safeRound || null,
        authorized_match_results:
          round === 0
            ? {
                completed_rounds: last.history || [],
                public_world: last.public_world,
                winner: last.winner,
                termination: last.termination
              }
            : null,
        response_format: {
          learned: 'What I learned about the scenario, tactics or referee',
          worked: 'What worked and evidence from the resolved round',
          failed: 'What failed, surprised me, or was poorly modeled',
          capability_gaps: 'Missing commands, information, or game systems',
          next_time: 'One specific change I would make next round'
        }
      };
      await navigator.clipboard.writeText(json(prompt));
      debriefStatus('Faction-safe debrief prompt copied. Paste into that commander’s AI chat.');
    } catch (e) {
      debriefStatus('Could not copy debrief prompt: ' + e.message, true);
    }
  }
  async function submitDebrief() {
    try {
      if (!last || !['us', 'ge'].includes(el('role').value)) throw Error('Unlock a commander view first.');
      if (last.archive_view) throw Error('Archived attempts are read-only.');
      const turn = selectedDebriefRound();
      const side = el('role').value;
      const notes = JSON.parse(el('debriefInput').value);
      if (!notes || Array.isArray(notes) || typeof notes !== 'object')
        throw Error('The debrief must be a JSON object.');
      const fields = ['learned', 'worked', 'failed', 'capability_gaps', 'next_time'];
      if (fields.some(k => typeof notes[k] !== 'string'))
        throw Error('All five debrief fields must be strings.');
      const result = await request(
        'debrief',
        {},
        {
          id: last.id,
          side,
          turn,
          ...Object.fromEntries(fields.map(k => [k, notes[k]]))
        }
      );
      debriefStatus(
        result.duplicate
          ? 'This debrief was already saved.'
          : 'Debrief saved for ' + side.toUpperCase() + (turn === 0 ? ' match summary.' : ' round ' + turn + '.')'
      );
      if (!result.duplicate) await load(true);
    } catch (e) {
      debriefStatus('Debrief not saved: ' + e.message, true);
    }
  }
  async function viewDebriefs() {
    try {
      if (!last || !['us', 'ge'].includes(el('role').value)) throw Error('Commander view required.');
      const result = await request('debrief', {
        id: last.id,
        side: el('role').value,
        ...(archiveAttempt ? { attempt: archiveAttempt } : {})
      });
      el('debriefOutput').textContent = json(result.debriefs);
      el('debriefOutput').classList.remove('hidden');
      debriefStatus(result.debriefs.length + ' saved debrief(s) for this commander and game.');
    } catch (e) {
      debriefStatus('Could not load debriefs: ' + e.message, true);
    }
  }
  async function getDebriefExport() {
    if (!last || el('role').value !== 'admin') throw Error('Protected observer access required.');
    return request('debrief_export', { id: last.id }, null, true);
  }
  async function exportDebriefs(download) {
    try {
      const result = await getDebriefExport();
      const content = json(result);
      el('debriefOutput').textContent = content;
      el('debriefOutput').classList.remove('hidden');
      if (download) {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grasstex-debriefs-' + result.id + '.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        debriefStatus('Downloaded debriefs from ' + result.games.length + ' game attempt(s).');
      } else {
        await navigator.clipboard.writeText(content);
        debriefStatus('Copied debriefs from ' + result.games.length + ' game attempt(s).');
      }
    } catch (e) {
      debriefStatus('Could not export debriefs: ' + e.message, true);
    }
  }
  function packet() {
    if (!last) {
      status('Load a match first.', true);
      return;
    }
    const role = el('role').value;
    if (role === 'admin') {
      status(
        'Observer view contains hidden state. Switch to a commander role to copy a faction-safe brief.',
        true
      );
      return;
    }
    const data = {
      guide:
        'GRASSTEX hypothetical board-game benchmark. Your action is to produce JSON orders only. Do not infer hidden opponent information.',
      match_id: last.id,
      series: last.series,
      round: last.turn,
      role: role === 'public' ? 'spectator' : role,
      mode: last.mode,
      rules: last.rules,
      rules_revision: last.rules_revision,
      effective_rules: last.effective_rules,
      scenario: last.scenario,
      public_brief: last.public_brief,
      public_world: last.public_world,
      objective_candidates: last.objective_candidates || [],
      past_resolved_rounds: last.history,
      ...(role === 'us' || role === 'ge'
        ? {
            own_private_brief: last.private_brief,
            own_state: last.own_state,
            own_pending_order: last.own_pending_order
          }
        : {}),
      order_format: {
        turn: last.turn,
        side: role === 'public' ? 'us or ge' : role,
        intent: '...',
        actions: [{ squad: 'US-1', type: 'move', target: 'central' }],
        support: 'none',
        proposals: [{ name: 'Missing game action', reason: 'Why needed' }],
        contingency: '...'
      },
      command_types: ['move', 'transport', 'hold', 'reserve'],
      target_ids: Object.keys(last.public_world?.objectives || {}).length
        ? last.public_world.objectives.map(o => o.id)
        : ['central', 'north', 'south'],
      special:
        'Proposed actions have NO referee effect yet; they are recorded as capability ideas. Both factions submit independently.'
    };
    navigator.clipboard
      .writeText(json(data))
      .then(() => status('Faction-safe briefing copied. Paste into your AI chat.'))
      .catch(() => status('Clipboard unavailable; copy the briefing from the panels instead.', true));
  }
  el('load').addEventListener('click', () => load());
  el('role').addEventListener('change', () => {
    if (el('role').value === 'admin' && storedAdmin()) el('key').value = storedAdmin();
    else el('key').value = '';
    last = null;
    el('dashboard').classList.add('hidden');
    el('commander').classList.add('hidden');
    el('mapPanel').classList.add('hidden');
    if (el('match').value) load();
  });
  el('copyDebriefPrompt').addEventListener('click', copyDebriefPrompt);
  el('submitDebrief').addEventListener('click', submitDebrief);
  el('viewDebriefs').addEventListener('click', viewDebriefs);
  el('exportDebriefs').addEventListener('click', () => exportDebriefs(true));
  el('copyDebriefs').addEventListener('click', () => exportDebriefs(false));
  el('copyPacket').addEventListener('click', packet);
  el('submit').addEventListener('click', submit);
  el('rematchButton').addEventListener('click', createRematch);
  el('endMatchButton').addEventListener('click', finishMatch);
  el('rematchOpen').addEventListener('click', () => openMatch(el('rematchOpen').dataset.nextId || ''));
  el('seriesNextButton').addEventListener('click', () =>
    openMatch(el('seriesNextButton').dataset.nextId || '')
  );

  el('create').addEventListener('click', create);
  el('rememberAdmin').checked = !!storedAdmin();
  el('rememberAdmin').addEventListener('change', checked => {
    if (!el('rememberAdmin').checked) {
      try {
        localStorage.removeItem(ADMIN_STORAGE);
      } catch (_) {}
    } else rememberAdmin();
  });
  el('clearAdmin').addEventListener('click', () => {
    try {
      localStorage.removeItem(ADMIN_STORAGE);
    } catch (_) {}
    el('rememberAdmin').checked = false;
    if (el('role').value === 'admin') el('key').value = '';
    status('Saved administrator password cleared from this browser.');
  });
  el('key').addEventListener('change', rememberAdmin);
  if (storedAdmin()) {
    el('role').value = 'admin';
    el('key').value = storedAdmin();
  }
  const urlid = new URL(location.href).searchParams.get('id');
  if (urlid && /^[0-9a-f]{24}$/.test(urlid)) el('match').value = urlid;
  templateLoad();
  if (urlid) load();
  // HTTP polling, not a full page reload. Keep the observer's map, keys,
  // selected replay round and unsent commander order editor intact.
  timer = setInterval(() => {
    if (
      last &&
      !archiveAttempt &&
      last.id === el('match').value.trim() &&
      el('dashboard').offsetParent !== null &&
      !document.hidden
    )
      load(true, true);
  }, 2000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && last && !archiveAttempt) load(true, true);
  });
})();
