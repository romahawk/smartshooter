// src/utils/streaks.js

// ---- date helpers (no libraries) ----
export const toYMD = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const startOfWeekMon = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift so Monday = start
  d.setDate(d.getDate() + diff);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// sessions: array of objects with a date (ISO or Date). If you store timestamps, pass converted dates.
export function normalizeCompletedDateSet(sessions) {
  const set = new Set();
  if (!Array.isArray(sessions)) return set;

  for (const s of sessions) {
    const raw = s?.date ?? s?.createdAt ?? s?.timestamp ?? s;
    if (!raw) continue;
    const d = typeof raw === "string" ? new Date(raw) : raw.toDate?.() ?? new Date(raw);
    if (isNaN(d)) continue;
    set.add(toYMD(d));
  }
  return set;
}

// Build a day map from start -> end inclusive
export function buildDayMap({ start, end, completedSet }) {
  const map = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const key = toYMD(cursor);
    map.push({
      date: new Date(cursor),
      key,
      value: completedSet.has(key) ? 1 : 0, // 1 = trained that day; extend to counts if needed
    });
    cursor = addDays(cursor, 1);
  }
  return map;
}

// Current streak: consecutive days up to today with value>=1
export function computeCurrentStreak(completedSet) {
  const today = toYMD(new Date());
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const k = toYMD(cursor);
    if (completedSet.has(k)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    // stop when we encounter the first missed day
    break;
  }
  // If you require the day "today" to count, the above already ensures it.
  // If you want "through yesterday" when today hasn't trained yet, uncomment below:
  // if (!completedSet.has(today) && streak > 0) streak -= 0;
  return streak;
}
