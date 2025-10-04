// src/lib/analytics.js

/** -------------------------
 * Filters
 * ------------------------*/

/**
 * Filter sessions by date range and training types.
 * @param {Array} sessions - raw sessions for a user
 * @param {{from?: Date, to?: Date, types?: string[]}} opts
 */
export function filterSessions(sessions, opts = {}) {
  const { from, to, types } = opts;
  return (sessions || []).filter((s) => {
    const d = new Date(s.date); // 'YYYY-MM-DD'
    if (from && d < stripTime(from)) return false;
    if (to && d > stripTime(to)) return false;
    if (types && types.length && !types.includes(s.type)) return false;
    return true;
  });
}

/** -------------------------
 * Aggregations
 * ------------------------*/

/**
 * Aggregate accuracy by court position across sessions.
 * Returns: { [position]: { made, attempts, acc } }
 */
export function aggregateByPosition(sessions) {
  const map = {};
  for (const s of sessions || []) {
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
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

/**
 * Aggregate daily accuracy (for line chart).
 * Returns sorted array: [{ date: 'YYYY-MM-DD', acc }]
 */
export function aggregateAccuracyByDate(sessions) {
  const daily = new Map(); // date -> { made, attempts }
  for (const s of sessions || []) {
    const d = s.date;
    if (!daily.has(d)) daily.set(d, { made: 0, attempts: 0 });
    const t = daily.get(d);
    t.made += num(s?.totals?.made);
    t.attempts += num(s?.totals?.attempts);
  }
  return Array.from(daily.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, t]) => ({
      date,
      acc: t.attempts ? Math.round((t.made / t.attempts) * 100) : 0,
    }));
}

/**
 * Aggregate attempts vs made by training type (for bar chart).
 * Returns array: [{ type, made, attempts }]
 */
export function aggregateByType(sessions) {
  const order = ["spot", "catch_shoot", "off_dribble", "run_half"];
  const map = Object.fromEntries(order.map((t) => [t, { made: 0, attempts: 0 }]));
  for (const s of sessions || []) {
    const t = s.type || "spot";
    if (!map[t]) map[t] = { made: 0, attempts: 0 };
    map[t].made += num(s?.totals?.made);
    map[t].attempts += num(s?.totals?.attempts);
  }
  return Object.entries(map).map(([type, v]) => ({ type, ...v }));
}

/**
 * Summarize by range (paint/midrange/3pt) across rounds — handy for a legend or table.
 * Returns string like: "3pt: 12/30 (40%) • midrange: 5/10 (50%)"
 */
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

/**
 * Compute KPI tiles: accuracy (7d), volume (7d), best zone (min attempts threshold)
 * @param {Array} sessions
 * @param {{sinceDays?: number, minAttemptsBestZone?: number}} opts
 */
export function computeKpis(
  sessions,
  { sinceDays = 7, minAttemptsBestZone = 10 } = {}
) {
  const cutoff = stripTime(addDays(new Date(), -sinceDays));
  const inRange = (sessions || []).filter((s) => new Date(s.date) >= cutoff);

  // Totals for 7d
  const totals = inRange.reduce(
    (a, s) => ({
      made: a.made + num(s?.totals?.made),
      attempts: a.attempts + num(s?.totals?.attempts),
    }),
    { made: 0, attempts: 0 }
  );

  // Best zone (within 7d)
  const byPos = {};
  for (const s of inRange) {
    for (const r of s.rounds || []) {
      for (const z of r.zones || []) {
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
function stripTime(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function num(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}
