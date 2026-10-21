/* Opt-in benchmark evidence, never loaded by gameplay. Read existing publications;
   never call Command Reception's settling readers or install runtime hooks. */
(function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({ maxEntries: 20000, maxChars: 8 * 1024 * 1024 });
  function create(options = {}) {
    const limits = { ...DEFAULTS, ...options };
    for (const value of [limits.maxEntries, limits.maxChars])
      if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid command history budget');
    const commands = [],
      missions = [],
      lastMissions = new Map();
    let failure = null,
      reference = null,
      serial = 0,
      lastAt = null,
      samples = 0,
      chars = 0;
    function append(target, value) {
      const body = JSON.stringify(value);
      if (commands.length + missions.length >= limits.maxEntries || chars + body.length > limits.maxChars)
        throw new Error('Command history evidence budget exceeded');
      chars += body.length;
      target.push(JSON.parse(body));
    }
    function collect(sim) {
      const now = sim.time;
      if (!Number.isFinite(now) || now < 0 || (lastAt == null ? now !== 0 : now < lastAt))
        throw new Error('Command history must start at zero without a clock rewind');
      const state = sim._commandReception;
      if (reference && state !== reference) throw new Error('Command Reception reset during collection');
      if (state) {
        if (!Number.isSafeInteger(state.serial) || state.serial < serial || !Array.isArray(state.recent))
          throw new Error('Invalid Command Reception publication log');
        reference = state;
        if (state.serial > serial) {
          for (const row of state.recent) {
            const match = /^cmd-([1-9][0-9]*)$/.exec(row.id);
            const next = match && Number(match[1]);
            if (!Number.isSafeInteger(next)) throw new Error('Invalid command publication identity');
            if (next <= serial) continue;
            if (next !== serial + 1) throw new Error('Command history source log dropped publications');
            append(commands, row);
            serial = next;
          }
          if (serial !== state.serial) throw new Error('Command history source log is incomplete');
        }
      }
      const present = new Set();
      for (const faction of ['us', 'ge']) {
        const squads = ((sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [])
          .slice()
          .sort((a, b) => (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0));
        for (const squad of squads) {
          const key = faction + ':' + String(squad.id),
            mission = squad._macroMission || null;
          const body = JSON.stringify(mission);
          present.add(key);
          if (lastMissions.get(key) !== body) {
            append(missions, { at: now, faction, squad: String(squad.id), mission });
            lastMissions.set(key, body);
          }
        }
      }
      for (const key of Array.from(lastMissions.keys()).sort()) {
        if (present.has(key)) continue;
        append(missions, { at: now, removed: key });
        lastMissions.delete(key);
      }
      lastAt = now;
      samples++;
    }
    function sample(sim) {
      if (failure) throw failure;
      try {
        collect(sim);
      } catch (error) {
        failure = error;
        throw error;
      }
    }
    function snapshot() {
      if (failure) throw failure;
      if (!samples) throw new Error('Command history was not sampled');
      return JSON.parse(
        JSON.stringify({
          format: 'grasstex-command-history-v1',
          coverage: { from: 0, through: lastAt, samples, contiguousPublications: serial, complete: true },
          // Publication log is exhaustive by serial; Macro state is observed after each sim step.
          commands,
          missions
        })
      );
    }
    return Object.freeze({ sample, snapshot });
  }
  const api = Object.freeze({ create, limits: DEFAULTS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BattleBenchmarkCommandHistory = api;
})(typeof window !== 'undefined' ? window : globalThis);
