// src/components/StreakHeatmap.jsx
import React from "react";
import { buildDayMap, normalizeCompletedDateSet, startOfWeekMon, addDays, toYMD, computeCurrentStreak } from "../utils/streaks";

// Color steps (Tailwind). Adjust to your palette.
const LEVELS = [
  "bg-neutral-200 dark:bg-neutral-800", // 0 - no training
  "bg-emerald-300/70 dark:bg-emerald-400/30", // 1
  "bg-emerald-400/80 dark:bg-emerald-400/50", // 2 (if you count >1 sessions/day later)
  "bg-emerald-500 dark:bg-emerald-500",       // 3+
];

function intensity(value) {
  if (!value) return LEVELS[0];
  if (value >= 3) return LEVELS[3];
  if (value === 2) return LEVELS[2];
  return LEVELS[1];
}

/**
 * Props:
 *  - sessions: array of { date: ISO string | Date | Firestore Timestamp } (at least one per training day)
 *  - weeks: number of weeks to show (default 17 ~ GitHub-ish quarter)
 *  - title: optional card title
 */
export default function StreakHeatmap({ sessions = [], weeks = 17, title = "Training streak" }) {
  const completedSet = normalizeCompletedDateSet(sessions);

  // Grid range
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // midnight
  const start = addDays(startOfWeekMon(addDays(end, -7 * (weeks - 1))), 0);

  const days = buildDayMap({ start, end, completedSet });
  const curStreak = computeCurrentStreak(completedSet);

  // Build columns by week (each col has 7 days Mon..Sun)
  const columns = [];
  for (let cStart = new Date(start); cStart <= end; cStart = addDays(cStart, 7)) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(cStart, i);
      if (d > end) break;
      const key = toYMD(d);
      const item = days.find((x) => x.key === key);
      col.push(item ?? { date: d, key, value: 0 });
    }
    columns.push(col);
  }

  // Tooltip text for streak achievement
  const showStreakBadge = curStreak >= 7;
  const streakTooltip = showStreakBadge ? `🔥 ${curStreak}-day streak achieved!` : "";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-3">
          <div
            className={`text-sm px-2 py-1 rounded-lg border border-emerald-500/40 ${
              showStreakBadge ? "bg-emerald-500/10" : "bg-transparent"
            }`}
            title={streakTooltip}
          >
            Streak: <span className="font-bold">{curStreak}</span> day{curStreak === 1 ? "" : "s"}
            {showStreakBadge && <span className="ml-1">🔥</span>}
          </div>
          <Legend />
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {/* Weekday labels (Mon, Wed, Fri) for compactness */}
        <div className="shrink-0 flex flex-col justify-between text-xs text-neutral-500 dark:text-neutral-400 mr-1 py-1">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        {/* Columns = weeks */}
        {columns.map((col, wIdx) => (
          <div key={wIdx} className="shrink-0 flex flex-col gap-1">
            {col.map((cell, dIdx) => {
              const isToday = cell.key === toYMD(today);
              return (
                <div
                  key={cell.key}
                  className={[
                    "h-3.5 w-3.5 rounded-[3px] transition-all",
                    intensity(cell.value),
                    isToday ? "ring-2 ring-amber-400/70 ring-offset-1 ring-offset-transparent" : "",
                    "hover:scale-105",
                  ].join(" ")}
                  title={`${cell.key}${cell.value ? " • Trained ✅" : " • Rest ❌"}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Optional “don’t break the chain” hint */}
      {showStreakBadge && (
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
          🔥 {curStreak}-day streak achieved—don’t break the chain!
        </p>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
      <span>Less</span>
      <span className="h-3 w-3 rounded-[3px] bg-neutral-200 dark:bg-neutral-800" />
      <span className="h-3 w-3 rounded-[3px] bg-emerald-300/70 dark:bg-emerald-400/30" />
      <span className="h-3 w-3 rounded-[3px] bg-emerald-400/80 dark:bg-emerald-400/50" />
      <span className="h-3 w-3 rounded-[3px] bg-emerald-500 dark:bg-emerald-500" />
      <span>More</span>
    </div>
  );
}
