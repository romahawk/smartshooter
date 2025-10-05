// src/lib/analytics.js

/** -------------------------
 * Filters
 * ------------------------*/

/**
 * Filter sessions by date range and training types.
 * @param {Array} sessions
 * @param {{from?: Date, to?: Date, types?: string[]}} opts
 */
export function filterSessions(sessions, opts = {}) {
  const { from, to, types } = opts;
  return (sessions || []).filter((s) => {
    const d = new Date(s.date);
    if (from && d < stripTime(from)) return false;
    if (to && d > stripTime(to)) return false;
    if (types && types.length && !types.includes(s.type)) return false;
    return true;
  });
}

/** Check round/zone against optional direction + range filters */
function passRoundZoneFilters(round, zone, opts = {}) {
  if (!opts) return true;
  const { direction, range } = opts;
  if (direction && round?.direction && round.direction !== direction) return false;
  const r = zone?.range || round?.range;
  if (range && r && r !== range) return false;
  return true;
}

/** -------------------------
 * Aggregations
 * ------------------------*/

/** Accuracy by court position */
export function aggregateByPosition(sessions, opts) {
  const map = {};
  for (const s of sessions || []) {
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
        if (!passRoundZoneFilters(r, z, opts)) continue;
        const key = z.position || "unknown";
        if (!map[key]) map[key] = { made: 0, attempts: 0 };
        map[key].made += num(z.made);
        map[key].attempts += num(z.attempts);
      }
    }
  }
  for (const k of Object.keys(map)) {
    const v = map[k];
    v.acc = v.attempts ? Math.round((v.made / v.attempts) * 100) : 0;
  }
  return map;
}

/** Daily accuracy (for line chart) */
export function aggregateAccuracyByDate(sessions, opts) {
  const daily = new Map(); // date -> { made, attempts }
  for (const s of sessions || []) {
    let made = 0, attempts = 0;
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
        if (!passRoundZoneFilters(r, z, opts)) continue;
        made += num(z.made);
        attempts += num(z.attempts);
      }
    }
    if (!daily.has(s.date)) daily.set(s.date, { made: 0, attempts: 0 });
    const t = daily.get(s.date);
    t.made += made; t.attempts += attempts;
  }
  return Array.from(daily.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, t]) => ({
      date,
      acc: t.attempts ? Math.round((t.made / t.attempts) * 100) : 0,
    }));
}

/** Attempts vs made by training type (bar chart) */
export function aggregateByType(sessions, opts) {
  const order = ["spot", "catch_shoot", "off_dribble", "run_half"];
  const map = Object.fromEntries(order.map((t) => [t, { made: 0, attempts: 0 }]));
  for (const s of sessions || []) {
    let made = 0, attempts = 0;
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
        if (!passRoundZoneFilters(r, z, opts)) continue;
        made += num(z.made);
        attempts += num(z.attempts);
      }
    }
    const t = s.type || "spot";
    if (!map[t]) map[t] = { made: 0, attempts: 0 };
    map[t].made += made; map[t].attempts += attempts;
  }
  return Object.entries(map).map(([type, v]) => ({ type, ...v }));
}

/** Summarize by range (optional helper for tables) */
export function summarizeByRangeString(sessions) {
  const totals = {};
  for (const s of sessions || []) {
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
        const key = z.range || r.range || "unknown";
        if (!totals[key]) totals[key] = { m: 0, a: 0 };
        totals[key].m += num(z.made);
        totals[key].a += num(z.attempts);
      }
    }
  }
  return Object.entries(totals)
    .filter(([, v]) => v.a > 0)
    .map(([k, v]) => `${k}: ${v.m}/${v.a} (${Math.round((v.m / v.a) * 100)}%)`)
    .join(" • ");
}

/** -------------------------
 * KPIs
 * ------------------------*/
export function computeKpis(
  sessions,
  { sinceDays = 7, minAttemptsBestZone = 10, direction, range } = {}
) {
  const cutoff = stripTime(addDays(new Date(), -sinceDays));
  const inRange = (sessions || []).filter((s) => new Date(s.date) >= cutoff);

  let totals = { made: 0, attempts: 0 };
  const byPos = {};
  for (const s of inRange) {
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
        if (!passRoundZoneFilters(r, z, { direction, range })) continue;
        totals.made += num(z.made);
        totals.attempts += num(z.attempts);
        const p = z.position || "unknown";
        if (!byPos[p]) byPos[p] = { m: 0, a: 0 };
        byPos[p].m += num(z.made);
        byPos[p].a += num(z.attempts);
      }
    }
  }

  let best = { position: null, acc: 0, m: 0, a: 0 };
  for (const [p, v] of Object.entries(byPos)) {
    if (v.a >= minAttemptsBestZone) {
      const acc = Math.round((v.m / v.a) * 100);
      if (acc > best.acc) best = { position: p, acc, m: v.m, a: v.a };
    }
  }

  return {
    acc7: totals.attempts ? Math.round((totals.made / totals.attempts) * 100) : 0,
    vol7: totals.attempts,
    bestZone: best.position ? best : null,
  };
}

/** -------------------------
 * Utils
 * ------------------------*/
function stripTime(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function num(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
