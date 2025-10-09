import { useMemo } from "react";
import { getLevelFromXP, getNextLevelXP, LEVELS } from "../config/levels";

export default function XPProgressBar({ totalXP }) {
  const level = useMemo(() => getLevelFromXP(totalXP), [totalXP]);
  const nextLevelXP = useMemo(() => getNextLevelXP(totalXP), [totalXP]);
  const thisLevelXP = useMemo(() => LEVELS.find(l => l.level === level)?.xp ?? 0, [level]);

  const span = Math.max(1, nextLevelXP - thisLevelXP);
  const progress = Math.min(100, Math.round(((totalXP - thisLevelXP) / span) * 100));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Level {level}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {totalXP} / {nextLevelXP} XP
        </div>
      </div>

      <div className="h-3 w-full rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-3 rounded-xl bg-emerald-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        />
      </div>
    </div>
  );
}
