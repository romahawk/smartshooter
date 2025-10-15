// src/components/StreakBadge.jsx
import React from "react";
import { normalizeCompletedDateSet, computeCurrentStreak } from "../utils/streaks";

export default function StreakBadge({ sessions = [] }) {
  const set = normalizeCompletedDateSet(sessions);
  const streak = computeCurrentStreak(set);
  const hit7 = streak >= 7;
  return (
    <div
      className={`text-xs px-2 py-1 rounded-md border ${
        hit7 ? "border-emerald-500/50 bg-emerald-500/10" : "border-neutral-300 dark:border-neutral-700"
      }`}
      title={hit7 ? `🔥 ${streak}-day streak achieved!` : "Train today to build your streak"}
    >
      🔗 Streak: <b>{streak}</b>d {hit7 && "🔥"}
    </div>
  );
}
