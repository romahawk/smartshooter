// src/components/StreakHeatmap.jsx
import React, { useMemo } from "react";

/* ---- Local-time date helpers (no UTC) ---- */
const toYMDLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDaysLocal = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeekMonLocal = (d) => {
  const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // 0=Sun..6=Sat  -> 0=Mon..6=Sun
  const dowMon0 = (tmp.getDay() + 6) % 7;
  return addDaysLocal(tmp, -dowMon0);
};

// robust date picker from various row shapes
const pickLocalISO = (row) => {
  const v =
    row?.date ||
    row?.sessionDate ||
    row?.day ||
    row?.d ||
    (row?.createdAt?.toDate
      ? row.createdAt.toDate()
      : row?.createdAt?.seconds
      ? new Date(row.createdAt.seconds * 1000)
      : row?.createdAt) ||
    row;

  if (!v) return null;
  if (typeof v === "string") {
    // already 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    if (isNaN(d)) return null;
    return toYMDLocal(d);
  }
  if (v instanceof Date) return toYMDLocal(v);
  if (typeof v === "number") return toYMDLocal(new Date(v));
  return null;
};

const DAY_MS = 86400000;

/* ---- Heat levels (defaults) ---- */
const DEFAULT_LEVELS = {
  0: "bg-neutral-200 dark:bg-neutral-800",
  1: "bg-emerald-300/70 dark:bg-emerald-400/30",
  2: "bg-emerald-400/80 dark:bg-emerald-400/50",
  3: "bg-emerald-500 dark:bg-emerald-500",
};
const DEFAULT_TODAY_RING =
  "ring-2 ring-amber-400/70 ring-offset-1 ring-offset-transparent";

/* ---- Component ---- */
export default function StreakHeatmap({
  sessions = [],
  weeks = 17,
  title = "Calendar Streak (last ~4 months)",
  containerClass = "rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 md:p-5",
  levelClasses = DEFAULT_LEVELS,
  todayRingClass = DEFAULT_TODAY_RING,
}) {
  // count sessions per local day
  const counts = useMemo(() => {
    const m = new Map();
    for (const s of sessions) {
      const iso = pickLocalISO(s);
      if (!iso) continue;
      m.set(iso, (m.get(iso) || 0) + 1);
    }
    return m;
  }, [sessions]);

  // today at local midnight
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  // grid start/end in local time
  const end = today;
  const start = startOfWeekMonLocal(
    addDaysLocal(end, -7 * (weeks - 1))
  );

  // build columns (weeks) x rows (Mon..Sun)
  const columns = useMemo(() => {
    const cols = [];
    for (
      let cStart = new Date(start);
      cStart <= end;
      cStart = addDaysLocal(cStart, 7)
    ) {
      const col = [];
      for (let i = 0; i < 7; i++) {
        const d = addDaysLocal(cStart, i);
        if (d > end) break;
        const key = toYMDLocal(d);
        const c = counts.get(key) || 0;
        col.push({ key, isToday: key === toYMDLocal(today), value: c >= 6 ? 3 : c >= 3 ? 2 : c ? 1 : 0 });
      }
      cols.push(col);
    }
    return cols;
  }, [counts, start, end, today]);

  const intensityClass = (v) => {
    if (!v) return levelClasses[0] || DEFAULT_LEVELS[0];
    if (v >= 3) return levelClasses[3] || DEFAULT_LEVELS[3];
    if (v === 2) return levelClasses[2] || DEFAULT_LEVELS[2];
    return levelClasses[1] || DEFAULT_LEVELS[1];
  };

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Legend levelClasses={levelClasses} />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="shrink-0 flex flex-col justify-between text-xs text-neutral-500 dark:text-neutral-400 mr-1 py-1">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        {columns.map((col, wIdx) => (
          <div key={wIdx} className="shrink-0 flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.key}
                title={cell.key}
                className={[
                  "h-3.5 w-3.5 rounded-[3px] transition-all hover:scale-105",
                  intensityClass(cell.value),
                  cell.isToday ? todayRingClass : "",
                ].join(" ")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ levelClasses = DEFAULT_LEVELS }) {
  return (
    <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
      <span>Less</span>
      <span className={`h-3 w-3 rounded-[3px] ${levelClasses[0] || DEFAULT_LEVELS[0]}`} />
      <span className={`h-3 w-3 rounded-[3px] ${levelClasses[1] || DEFAULT_LEVELS[1]}`} />
      <span className={`h-3 w-3 rounded-[3px] ${levelClasses[2] || DEFAULT_LEVELS[2]}`} />
      <span className={`h-3 w-3 rounded-[3px] ${levelClasses[3] || DEFAULT_LEVELS[3]}`} />
      <span>More</span>
    </div>
  );
}
