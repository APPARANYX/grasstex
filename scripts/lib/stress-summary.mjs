/* The stress dose map of a set of benchmark battles, from each record's `stress` block (module 17,
   `BattleSoldierMind.telemetry`: format grasstex-stress-v1). Shared by the per-worker report and the merged
   one so both print the same numbers. Nothing here is a gate or a score: it counts how much of the battle
   was spent under stress and how often each soldier lever changed a decision, so a lever built on stress
   can be sized before it is built. Every time in the block is simulated seconds. */
const BANDS = ['steady', 'shaken', 'rattled', 'broken'];
const LEVERS = ['react', 'aim', 'hesitate', 'shock'];
const SIDES = ['us', 'ge'];

const sum = (xs, fn) => xs.reduce((n, x) => n + (+fn(x) || 0), 0);
const round = (n, d = 1) => +(+n || 0).toFixed(d);
function quantile(values, q) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y),
    p = (a.length - 1) * q,
    lo = Math.floor(p),
    hi = Math.ceil(p);
  return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (p - lo);
}
const spread = values => ({
  p50: round(quantile(values, 0.5), 2),
  p90: round(quantile(values, 0.9), 2),
  max: round(Math.max(0, ...values), 2)
});

/* Battles with a stress block that is on (`?mind=0` records have `off: true` and nothing else). */
export function stressBattles(battles) {
  return (battles || []).filter(b => b && b.stress && !b.stress.off && b.stress.bandSeconds);
}

export function summarizeStress(battles) {
  const rows = stressBattles(battles);
  if (!rows.length) return null;
  const n = rows.length;
  const bandSeconds = Object.fromEntries(BANDS.map(k => [k, round(sum(rows, b => b.stress.bandSeconds[k]))]));
  const manSeconds = round(sum(rows, b => b.stress.manSeconds));
  const contactBandSeconds = Object.fromEntries(
    BANDS.map(k => [k, round(sum(rows, b => b.stress.contactBandSeconds?.[k]))])
  );
  const contactSeconds = round(Object.values(contactBandSeconds).reduce((a, x) => a + x, 0));
  const peak = Object.fromEntries(BANDS.map(k => [k, sum(rows, b => b.stress.peakBand?.[k])]));
  const reaching = k => rows.filter(b => (b.stress.peakBand?.[k] || 0) > 0).length;
  const decisions = {};
  for (const lever of LEVERS) {
    const d = b => b.stress.decisions?.[lever] || {};
    const firsts = rows.map(b => d(b).firstAt).filter(Number.isFinite);
    decisions[lever] = {
      total: lever === 'shock' ? null : sum(rows, b => d(b).total),
      changed: sum(rows, b => d(b).changed),
      byBand: BANDS.map((_, i) => sum(rows, b => d(b).byBand?.[i])),
      mag: round(
        sum(rows, b => d(b).mag),
        2
      ),
      battlesChanged: rows.filter(b => (d(b).changed || 0) > 0).length,
      firstAt: firsts.length ? spread(firsts) : null
    };
  }
  decisions.hesitate.lapsed = sum(rows, b => b.stress.decisions?.hesitate?.lapsed);
  decisions.shock.kinds = Object.fromEntries(
    ['fire', 'suppress', 'bound', 'advance'].map(k => [
      k,
      sum(rows, b => b.stress.decisions?.shock?.kinds?.[k])
    ])
  );
  const squads = {
    squads: 0,
    over: 0,
    overSeconds: 0,
    entries: 0,
    battlesWithAny: 0,
    peakMean: 0,
    with3: { over: 0, overSeconds: 0, entries: 0, battlesWithAny: 0 }
  };
  const perBattleOver = [],
    perBattleOver3 = [];
  for (const b of rows) {
    let any = 0,
      seconds = 0,
      any3 = 0,
      seconds3 = 0;
    for (const side of SIDES) {
      const s = b.stress.squads?.[side] || {},
        w = s.with3 || {};
      squads.squads += s.squads || 0;
      squads.over += s.over || 0;
      squads.overSeconds += s.overSeconds || 0;
      squads.entries += s.entries || 0;
      squads.peakMean = Math.max(squads.peakMean, s.peakMean || 0);
      squads.with3.over += w.over || 0;
      squads.with3.overSeconds += w.overSeconds || 0;
      squads.with3.entries += w.entries || 0;
      any += s.over || 0;
      seconds += s.overSeconds || 0;
      any3 += w.over || 0;
      seconds3 += w.overSeconds || 0;
    }
    if (any) squads.battlesWithAny++;
    if (any3) squads.with3.battlesWithAny++;
    perBattleOver.push(seconds);
    perBattleOver3.push(seconds3);
  }
  squads.overSeconds = round(squads.overSeconds);
  squads.with3.overSeconds = round(squads.with3.overSeconds);
  squads.overMean = round(rows[0].stress.squads?.overMean, 3);
  squads.minMen = rows[0].stress.squads?.minMen ?? null;
  const shakenPlus = rows.map(b => {
    const t = +b.stress.manSeconds || 0;
    const k = b.stress.bandSeconds;
    return t ? (100 * (k.shaken + k.rattled + k.broken)) / t : 0;
  });
  const RELIEF = ['kill', 'objective', 'cover', 'survived'];
  const memory = {
    flags: rows[0].stress.memory?.flags || [],
    heldSeconds: round(sum(rows, b => b.stress.memory?.heldSeconds)),
    floorMen: sum(rows, b => b.stress.memory?.floor?.men),
    floorMax: round(Math.max(0, ...rows.map(b => b.stress.memory?.floor?.max || 0)), 3),
    relief: Object.fromEntries(
      RELIEF.map(k => [
        k,
        {
          n: sum(rows, b => b.stress.memory?.relief?.[k]?.n),
          amount: round(
            sum(rows, b => b.stress.memory?.relief?.[k]?.amount),
            2
          )
        }
      ])
    )
  };
  const ACTS = ['cower', 'flee', 'freeze', 'rage'];
  const acts = Object.fromEntries(
    ACTS.map(k => [
      k,
      {
        n: sum(rows, b => b.stress.acts?.[k]?.n),
        seconds: round(sum(rows, b => b.stress.acts?.[k]?.seconds))
      }
    ])
  );
  acts.rage.strikes = sum(rows, b => b.stress.acts?.rage?.strikes);
  acts.rage.hits = sum(rows, b => b.stress.acts?.rage?.hits);
  acts.rage.guarded = sum(rows, b => b.stress.acts?.rage?.guarded);
  acts.rage.savedHp = round(sum(rows, b => b.stress.acts?.rage?.savedHp));
  return {
    format: 'grasstex-stress-summary-v1',
    battles: n,
    mode: rows[0].stress.mode,
    levers: rows[0].stress.levers,
    manSeconds,
    bandSeconds,
    bandShare: Object.fromEntries(
      BANDS.map(k => [k, manSeconds ? round(bandSeconds[k] / manSeconds, 4) : 0])
    ),
    contactBandSeconds,
    contactBandShare: Object.fromEntries(
      BANDS.map(k => [k, contactSeconds ? round(contactBandSeconds[k] / contactSeconds, 4) : 0])
    ),
    contactSeconds,
    peakBand: peak,
    battlesReaching: { shaken: reaching('shaken'), rattled: reaching('rattled'), broken: reaching('broken') },
    shocks: sum(rows, b => b.stress.shocks),
    hesitations: sum(rows, b => b.stress.hesitations),
    casualtiesSeen: sum(rows, b => b.stress.casualtiesSeen),
    memory,
    acts,
    squads,
    decisions,
    perBattle: {
      shakenPlusPercent: spread(shakenPlus),
      squadSecondsOver: spread(perBattleOver),
      squadSecondsOverWith3: spread(perBattleOver3),
      shocks: spread(rows.map(b => +b.stress.shocks || 0)),
      hesitations: spread(rows.map(b => +b.stress.hesitations || 0))
    },
    bySide: Object.fromEntries(
      SIDES.map(side => {
        const share = k => {
          const t = sum(
            rows,
            b =>
              b.stress.bySide?.[side]?.bandSeconds &&
              Object.values(b.stress.bySide[side].bandSeconds).reduce((a, x) => a + x, 0)
          );
          return t ? round(sum(rows, b => b.stress.bySide?.[side]?.bandSeconds?.[k]) / t, 4) : 0;
        };
        return [
          side,
          {
            bandShare: Object.fromEntries(BANDS.map(k => [k, share(k)])),
            shocks: sum(rows, b => b.stress.bySide?.[side]?.shocks),
            changed: Object.fromEntries(
              LEVERS.map(l => [l, sum(rows, b => b.stress.bySide?.[side]?.decisions?.[l]?.changed)])
            )
          }
        ];
      })
    )
  };
}

const pct = x => (100 * x).toFixed(1) + '%';
const ACTS_LABELS = ['cower', 'flee', 'freeze', 'rage'];
/* Lines for the run summary. */
export function stressMarkdown(s) {
  if (!s) return ['- Stress: no stress block in these records (module 17 off, or a build without telemetry)'];
  const d = s.decisions,
    by = l => d[l].byBand.join('/'),
    rate = l => (d[l].total ? ` of ${d[l].total} (${pct(d[l].changed / d[l].total)})` : '');
  const lines = [
    `- Stress (${s.battles} battles, ${s.manSeconds} man-seconds): steady **${pct(s.bandShare.steady)}** · shaken **${pct(s.bandShare.shaken)}** · rattled **${pct(s.bandShare.rattled)}** · broken **${pct(s.bandShare.broken)}** · battles reaching shaken/rattled/broken **${s.battlesReaching.shaken}/${s.battlesReaching.rattled}/${s.battlesReaching.broken}** · men by peak band ${BANDS.map(k => s.peakBand[k]).join('/')} · shocks **${s.shocks}** · hesitations **${s.hesitations}**`,
    `- Men whose squad is in contact (${s.contactSeconds} man-seconds): steady **${pct(s.contactBandShare.steady)}** · shaken **${pct(s.contactBandShare.shaken)}** · rattled **${pct(s.contactBandShare.rattled)}** · broken **${pct(s.contactBandShare.broken)}**`,
    `- Squads at mean stress ≥ ${s.squads.overMean}: **${s.squads.over}** of ${s.squads.squads} squad-battles, **${s.squads.overSeconds}** squad-seconds, ${s.squads.entries} entries, in **${s.squads.battlesWithAny}/${s.battles}** battles · with ${s.squads.minMen}+ living men: **${s.squads.with3.over}** squad-battles, **${s.squads.with3.overSeconds}** squad-seconds, ${s.squads.with3.entries} entries, in **${s.squads.with3.battlesWithAny}/${s.battles}** battles · peak squad mean ${s.squads.peakMean}`,
    `- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **${d.react.changed}**${rate('react')} [${by('react')}] · aim **${d.aim.changed}**${rate('aim')} [${by('aim')}] · hesitate **${d.hesitate.changed}**${rate('hesitate')} [${by('hesitate')}], ${d.hesitate.lapsed} lapsed · shock **${d.shock.changed}** blocked [${by('shock')}] (fire ${d.shock.kinds.fire}, suppress ${d.shock.kinds.suppress}, bound ${d.shock.kinds.bound}, advance ${d.shock.kinds.advance})`,
    ...(s.memory && (s.memory.flags.length || s.memory.heldSeconds || s.memory.floorMen)
      ? [
          `- Stress memory (${s.memory.flags.join(',') || 'none'}): held ${s.memory.heldSeconds} man-seconds · floors ${s.memory.floorMen} men (highest ${s.memory.floorMax}) · relief ${Object.entries(
            s.memory.relief
          )
            .map(([k, v]) => `${k} ${v.n} (${v.amount})`)
            .join(' · ')}`
        ]
      : []),
    ...(s.acts && ACTS_LABELS.some(k => s.acts[k].n)
      ? [
          `- Stress reactions: ${ACTS_LABELS.map(k => `${k} ${s.acts[k].n} (${s.acts[k].seconds} s)`).join(' · ')} · charge blows ${s.acts.rage.strikes} struck, ${s.acts.rage.hits} landed${s.acts.rage.guarded ? ` · hits taken under the berserk guard ${s.acts.rage.guarded} (${s.acts.rage.savedHp} hp saved)` : ''}`
        ]
      : []),
    `- Per battle (p50 / p90 / max): shaken-or-worse man-time ${s.perBattle.shakenPlusPercent.p50}% / ${s.perBattle.shakenPlusPercent.p90}% / ${s.perBattle.shakenPlusPercent.max}% · squad-seconds over ${s.perBattle.squadSecondsOver.p50} / ${s.perBattle.squadSecondsOver.p90} / ${s.perBattle.squadSecondsOver.max} · shocks ${s.perBattle.shocks.p50} / ${s.perBattle.shocks.p90} / ${s.perBattle.shocks.max}`
  ];
  return lines;
}
